"""
User schemas
"""
from pydantic import BaseModel, EmailStr
from typing import Optional


class UserLogin(BaseModel):
    """User login schema"""
    username: str
    password: str


class UserCreate(BaseModel):
    """User creation schema"""
    id: str
    username: str
    password: str
    full_name: str
    role: str
    department: Optional[str] = None
    email: Optional[EmailStr] = None


class UserResponse(BaseModel):
    """User response schema"""
    id: str
    username: str
    full_name: str
    role: str
    department: Optional[str] = None
    email: Optional[str] = None
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """Token response schema"""
    access_token: str
    token_type: str
    user: UserResponse
