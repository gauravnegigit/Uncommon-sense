from datetime import datetime, timedelta, timezone
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, Response, status, Request , BackgroundTasks
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, EmailStr, Field 
from typing import Optional
from core.config import settings
from core.security import (
    create_access_token, create_refresh_token, set_cookies ,
    decode_token, hash_password, verify_password , 
    send_email_otp , send_sms_otp , generate_otp , is_email , is_phone
)
from db.models import UserDB
from db.mongo import get_db
import random
import secrets

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)

# ---------- Schemas ----------

class UserRole:
    PATIENT = "PATIENT"

# signup request schema
class UserCreateRequest(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    contact: Optional[str] = None  # Phone number from frontend
    password: str
    address: Optional[str] = None
    pincode: Optional[str] = None
    role: Optional[str] = "PATIENT"

class SignupVerifyRequest(BaseModel):
    email: Optional[str] = None
    email_otp: Optional[str] = None
    phone: Optional[str] = None
    phone_otp: Optional[str] = None
    

# login request schema
class UserLoginRequest(BaseModel):
    identifier: str  # Can be email or phone
    password: str
    role: Optional[str] = "PATIENT"

class UserResponse(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: str
    message: Optional[str] = None
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class ForgotPasswordRequest(BaseModel):
    contact: str  

class ResetPasswordRequest(BaseModel):
    contact: str
    otp: str
    new_password: str


# ---------- Dependency ----------
# In api/auth.py

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security) ,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> UserDB:
    payload = decode_token(credentials.credentials)

    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token.",
        )

    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )

    return UserDB.model_validate(user)

async def get_current_user_from_cookie(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> UserDB:
    # Read the token directly from cookies
    token = request.cookies.get("access_token")
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing access token cookie.",
        )

    # Decode and validate token as usual
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token.",
        )

    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )

    return UserDB.model_validate(user)


# ---------- Signup ----------

@router.post("/signup/initiate", status_code=201)
async def initiate_signup(
    payload: UserCreateRequest,
    background_tasks: BackgroundTasks,
    db: AsyncIOMotorDatabase = Depends(get_db),
):  
    # 1. Check if email or phone already exists in registered users
    or_filters = []
    contact = payload.contact.strip()
    email = str(payload.email).lower()

    if payload.email:
        or_filters.append({"email": email})
    if payload.contact:
        or_filters.append({"phone": contact})

    if or_filters and await db.users.find_one({"$or": or_filters}):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email or phone number already exists."
        )

    # 2. Generate OTPs and expiration
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    email_otp = generate_otp() if is_email(email) else None
    phone_otp = generate_otp() if is_phone(contact) else None 

    # 3. Store pending verification state in MongoDB
    # We store the hashed password or temporary payload along with the OTP

    # Unique pending document key
    pending_key = f"{email or ''}_{contact or ''}"

    await db.pending_signups.update_one(
        {"pending_key": pending_key},
        {
            "$set": {
                "pending_key": pending_key,
                "name": payload.name,
                "password": hash_password(payload.password),
                "email": email,
                "phone": contact,
                "email_otp": email_otp,
                "phone_otp": phone_otp,
                "expires_at": expires_at,
                "address": payload.address,
                "pincode": payload.pincode , 
                "role" : payload.role or "PATIENT" , 
                "created_at": datetime.now(timezone.utc),
            }
        },
        upsert=True
    )

    # 4. Dispatch messaging via background tasks
    sent_methods = []
    if email and email_otp:
        background_tasks.add_task(send_email_otp, email=email, otp=email_otp)
        sent_methods.append("email")
    
    if contact and phone_otp:
        background_tasks.add_task(send_sms_otp, phone_number=contact, otp=phone_otp)
        sent_methods.append("phone")

    return UserResponse(
        name=payload.name,
        email=email,
        phone=contact,
        role=payload.role or "PATIENT",
        created_at=datetime.now(timezone.utc),
        message=f"OTP sent to {', '.join(sent_methods)}. Please verify within 10 minutes."
    )

@router.post("/signup/verify", status_code=status.HTTP_201_CREATED)
async def verify_signup(
    payload: SignupVerifyRequest, 
    response : Response ,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    email = payload.email.lower() if is_email(payload.email) else None
    phone = payload.phone.strip() if is_phone(payload.phone) else None

    # 1. Fetch pending record
    query_filter = {}
    if email:
        query_filter["email"] = email
    if phone:
        query_filter["phone"] = phone

    pending = await db.pending_signups.find_one(query_filter)
    if not pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending signup found or verification timed out."
        )

    # 2. Validate Expiry
    if datetime.now(timezone.utc) > pending["expires_at"].replace(tzinfo=timezone.utc):
        await db.pending_signups.delete_one({"_id": pending["_id"]})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification codes have expired. Please request a new signup."
        )

    # 3. Validate Email OTP (if provided)
    if email:
        if pending.get("email_otp") != payload.email_otp.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Email OTP code."
            )

    # 4. Validate Phone OTP (if provided)
    if phone:
        if pending.get("phone_otp") != payload.phone_otp.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Phone SMS OTP code."
            )

    # 5. Insert final user record

    new_user = {
        "_id": str(uuid4()),
        "name": pending["name"],
        "email": email,
        "phone": phone, 
        "hashed_password": hash_password(pending["password"]),
        "address": pending["address"] ,
        "pincode": pending["pincode"] , 
        "role" : pending["role"] , 
        "is_email_verified": bool(email),
        "is_phone_verified": bool(phone),
        "created_at": datetime.now(timezone.utc),
    }

    user = await db.users.insert_one(new_user)
    user_id = new_user["_id"]

    access_token = create_access_token(
        subject=user_id,
        extra_claims={"role": new_user.get("role", UserRole.PATIENT)},
    )
    refresh_token = create_refresh_token(subject=user_id)

    set_cookies(response , access_token , refresh_token)


    # Clean up pending record
    await db.pending_signups.delete_one({"_id": pending["_id"]})

    return {
        "success": True,
        "message": "Registration complete! Account created successfully.",
        "user": new_user
    }

# ---------- Login ----------

@router.post("/login", response_model=UserResponse)
async def login(
    payload: UserLoginRequest,
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    clean_identifier = payload.identifier.strip().lower()
    
    # 1. Query MongoDB for email OR phone AND matching role
    user = await db.users.find_one({
        "$or": [
            {"email": clean_identifier},
            {"phone": payload.identifier.strip()}
        ],
        "role": payload.role.upper()
    })

    if not user or not verify_password(payload.password, user.get("hashed_password")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials or role.",
        )

    user_id = str(user["_id"])

    # 2. Generate Tokens
    access_token = create_access_token(
        subject=user_id,
        extra_claims={"role": user.get("role", UserRole.PATIENT)},
    )
    refresh_token = create_refresh_token(subject=user_id)

    # 3. Set Cookies
    set_cookies(response , access_token , refresh_token)

    # 4. Return user data (Cookies are handled automatically by response headers)
    return UserResponse(
        id=user_id,
        name=user["name"],
        email=user["email"],
        role=user["role"],
        created_at=user["created_at"],
    )


# ---------- Refresh ----------

@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: Request,
    response: Response,
    refresh_token: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    # Retrieve refresh token from body or cookie
    token = refresh_token or request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(401, "Refresh token missing.")

    payload = decode_token(token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(401, "Invalid or expired refresh token.")

    user_id = payload.get("sub")
    user = await db.users.find_one({"_id": user_id})

    if not user:
        raise HTTPException(401, "User not found.")

    new_access_token = create_access_token(
        user_id,
        {"role": user["role"]},
    )
    new_refresh_token = create_refresh_token(user_id)

    # Update cookies
    set_cookies(response , new_access_token , new_refresh_token)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
    )


# ---------- Me ----------

@router.get("/me", response_model=UserResponse)
async def me(current_user: UserDB = Depends(get_current_user_from_cookie)):
    return UserResponse(
        id=str(current_user.id),
        name=current_user.name,
        email=current_user.email,
        phone = current_user.phone ,
        role=current_user.role,
        created_at=current_user.created_at,
    )

# ------- Forgot Password -------
@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: AsyncIOMotorDatabase = Depends(get_db),
):  
    contact = payload.contact.strip().lower() if is_email(payload.contact) else payload.contact.strip()
    standard_response = {
        "success": True, 
        "message": f"If an account exists for {contact}, an OTP has been sent."
    }

    # Check if user exists
    user = await db.users.find_one({
        "$or": [
            {"email": contact},
            {"phone": contact}
        ]
    })
    
    # Return uniform message even if user does not exist
    if not user:
        return standard_response

    # Generate cryptographically secure 6-digit OTP
    otp_code = f"{secrets.randbelow(900000) + 100000}"
    otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    # Store OTP in database with attempt tracking
    await db.otps.update_one(
        {"contact": contact},
        {
            "$set": {
                "contact": contact,
                "otp": otp_code,
                "expires_at": otp_expires_at,
                "created_at": datetime.now(timezone.utc),
                "attempts": 0
            }
        },
        upsert=True
    )

    # Dispatch via Background Task
    if "@" in contact:
        background_tasks.add_task(send_email_otp, email=contact, otp=otp_code)
    else:
        background_tasks.add_task(send_sms_otp, phone_number=contact, otp=otp_code)

    return standard_response


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    contact = payload.contact.strip().lower() if is_email(payload.contact) else payload.contact.strip()

    # 1. Fetch OTP record
    otp_record = await db.otps.find_one({"contact": contact})

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code."
        )

    # Max 5 attempts allowed per OTP
    if otp_record.get("attempts", 0) >= 5:
        await db.otps.delete_one({"contact": contact})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many failed attempts. Please request a new OTP."
        )

    # 2. Check Expiration
    exp_time = otp_record["expires_at"]
    if exp_time.tzinfo is None:
        exp_time = exp_time.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) > exp_time:
        await db.otps.delete_one({"contact": contact})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new one."
        )

    # 3. Verify OTP code securely
    if not secrets.compare_digest(otp_record.get("otp", ""), payload.otp):
        await db.otps.update_one({"contact": contact}, {"$inc": {"attempts": 1}})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code."
        )

    # 4. Update user password
    hashed_password = hash_password(payload.new_password)
    result = await db.users.update_one(
        {"$or": [{"email": contact}, {"phone": contact}]},
        {"$set": {"hashed_password": hashed_password}}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found."
        )

    # 5. Invalidate OTP after success
    await db.otps.delete_one({"contact": contact})

    return {"success": True, "message": "Password reset successfully. You can now login."}


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(response: Response):
    is_prod = settings.ENV != "development"
    
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=is_prod,
        samesite="lax",
        path="/"
    )
    
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=is_prod,
        samesite="lax",
        path="/"
    )

    return {"success": True, "message": "Successfully logged out"}
