import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator
from app.models.auth import UserRole


class UserRegister(BaseModel):
    email: str
    password: str
    role: Optional[UserRole] = UserRole.CUSTOMER

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v):
            raise ValueError("Invalid email address format.")
        return v


class UserLogin(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class PasswordResetRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class PasswordResetConfirm(BaseModel):
    email: str
    new_password: str
    token: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: int
    email: str


class UserResponse(BaseModel):
    id: int
    email: str
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True
