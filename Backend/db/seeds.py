import asyncio
import httpx
from uuid import uuid4
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Literal
from mongo import connect_to_mongo , get_db
import asyncio
# from core.config import settings


OVERPASS_URL = "https://overpass-api.de/api/interpreter"

def classify_facility(tags: dict) -> tuple[str, bool, list[str]]:
    """
    Classify OSM facility into facility schema's facility_type, emergency_services, specialties.
    
    Returns: (facility_type, emergency_services, specialties)
    """
    amenity = tags.get("amenity", "")
    healthcare = tags.get("healthcare", "")
    specialty_tags = [
        v for k, v in tags.items() 
        if k.startswith("healthcare:speciality") or k == "speciality"
    ]
    
    if amenity == "hospital":
        facility_type = "HOSPITAL"
        emergency = True  
    elif amenity == "clinic":
        facility_type = "CLINIC"
        emergency = False
    elif healthcare == "doctor":
        facility_type = "CLINIC"
        emergency = False
    elif healthcare == "dentist":
        facility_type = "CLINIC"
        emergency = False
    elif healthcare == "pharmacy":
        facility_type = "PHARMACY"
        emergency = False
    elif healthcare == "laboratory":
        facility_type = "LABORATORY"
        emergency = False
    elif healthcare == "physiotherapist":
        facility_type = "CLINIC"
        emergency = False
    elif healthcare == "alternative":
        facility_type = "CLINIC"
        emergency = False
    else:
        facility_type = "HEALTHCARE"  
        emergency = False

    specialties = []
    if specialty_tags:
        specialties = [s.replace("_", " ").title() for s in specialty_tags[:5]]
    elif healthcare:
        specialties = [healthcare.title()]
    
    return facility_type, emergency, specialties


async def fetch_hospitals_from_overpass(
    lat: float,
    lon: float,
    radius: int = 10000,
    limit: int = 50,
) -> list[dict]:
    """
    Fetch hospitals and healthcare facilities from OpenStreetMap Overpass API.
    
    Returns list of facilities in your MongoDB schema format.
    """

    query = f"""
[out:json][timeout:50];
(
  node["amenity"~"hospital|clinic|healthcare"](around:{radius},{lat},{lon});
  way["amenity"~"hospital|clinic|healthcare"](around:{radius},{lat},{lon});
  relation["amenity"~"hospital|clinic|healthcare"](around:{radius},{lat},{lon});
);
out body;
>;
out skel qt;
"""

    async with httpx.AsyncClient() as client:
        response = await client.post(
            OVERPASS_URL,
            data={"data": query},
            headers={
                "User-Agent": "MyOSMDataApp/1.0 (gauravnegi1729220@gmail.com)",
            },
            timeout=50.0,
        )
        response.raise_for_status()
        data = response.json()
        print(data)
    
    facilities = []
    seen_names = set()

    for element in data.get("elements", [])[:limit]:
        
        if "lat" in element and "lon" in element:
            lat_val = element["lat"]
            lng_val = element["lon"]
        elif "center" in element:
            lat_val = element["center"]["lat"]
            lng_val = element["center"]["lon"]
        else:
            continue

        tags = element.get("tags", {})
        name = tags.get("name", tags.get("official_name", f"Facility_{uuid4().hex[:8]}"))
        
        # Skip duplicates
        if name in seen_names:
            continue
        seen_names.add(name)

        contact = tags.get("contact:phone", tags.get("phone", ""))
        if not contact:
            contact = tags.get("emergency:phone", "")

        facility_type, emergency, specialties = classify_facility(tags)

        doc = {
            "_id": str(uuid4()),
            "name": name,
            "facility_type": facility_type,
            "specialties": specialties,
            "emergency_services": emergency,
            "contact_number": contact,
            "available_beds": 0,  
            "location": {
                "type": "Point",
                "coordinates": [lng_val, lat_val], 
            },
        }

        facilities.append(doc)

    return facilities

async def seed_facilities(
    lat: float,
    lng: float,
    radius: int,
    limit: int,
):
    """
    Seed MongoDB with nearby healthcare facilities from OpenStreetMap.
    """
    print(f"🔍 Fetching facilities near {lat}, {lng} (radius: {radius}m)...")
    
    # Fetch from Overpass API
    facilities = await fetch_hospitals_from_overpass(lat, lng, radius, limit)
    print(f"✅ Found {len(facilities)} facilities from OpenStreetMap")
    
    if not facilities:
        print("⚠️  No facilities found. Try increasing the radius.")
        return
    
    # Connect to MongoDB
    await connect_to_mongo()
    db = get_db()
    await db.facilities.create_index([("location", "2dsphere")])
    print("📍 Created 2dsphere index on location field")
    
    # Clear existing data (optional - comment out if you want to keep existing)
    # await db.facilities.delete_many({})
    # print("🗑️  Cleared existing facilities")
    
    # Insert facilities
    if facilities:
        await db.facilities.insert_many(facilities)


asyncio.run(seed_facilities(25.49 , 81.86 , 15000 , 20))