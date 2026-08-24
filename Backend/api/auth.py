from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, EmailStr, Field

from core.security import (
    create_access_token, create_refresh_token,
    decode_token, hash_password, verify_password
)
from db.models import UserDB
from db.mongo import get_db

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()


# ---------- Schemas ----------

class UserRole:
    PATIENT = "PATIENT"
    ASHA_WORKER = "ASHA_WORKER"
    DOCTOR = "DOCTOR"


class UserCreateRequest(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = UserRole.PATIENT


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# ---------- Dependency ----------

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
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


# ---------- Signup ----------

@router.post("/signup", response_model=UserResponse, status_code=201)
async def signup(
    payload: UserCreateRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if await db.users.find_one({"email": payload.email}):
        raise HTTPException(409, "Email is already registered.")

    user = {
        "_id": str(uuid4()),
        "name": payload.name,
        "email": str(payload.email),
        "hashed_password": hash_password(payload.password),
        "role": payload.role,
        "created_at": datetime.now(timezone.utc),
    }

    await db.users.insert_one(user)

    return UserResponse(
        id=user["_id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        created_at=user["created_at"],
    )


# ---------- Login ----------

@router.post("/login", response_model=TokenResponse)
async def login(
    payload: UserLoginRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user = await db.users.find_one({"email": payload.email})

    if not user or not verify_password(
        payload.password,
        user["hashed_password"],
    ):
        raise HTTPException(401, "Invalid email or password.")

    user_id = str(user["_id"])

    return TokenResponse(
        access_token=create_access_token(
            user_id,
            {"role": user["role"]},
        ),
        refresh_token=create_refresh_token(user_id),
    )


# ---------- Refresh ----------

@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    refresh_token: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    payload = decode_token(refresh_token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(401, "Invalid or expired refresh token.")

    user_id = payload.get("sub")
    user = await db.users.find_one({"_id": user_id})

    if not user:
        raise HTTPException(401, "User not found.")

    return TokenResponse(
        access_token=create_access_token(
            user_id,
            {"role": user["role"]},
        ),
        refresh_token=create_refresh_token(user_id),
    )


# ---------- Me ----------

@router.get("/me", response_model=UserResponse)
async def me(current_user: UserDB = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        created_at=current_user.created_at,
    )