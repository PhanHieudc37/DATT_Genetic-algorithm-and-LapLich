"""
Teacher schemas
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List


class TeacherBase(BaseModel):
    """Teacher base schema"""
    teacher_code: str
    username: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    email: EmailStr
    address: Optional[str] = None
    department: str
    unavailable_days: Optional[List[int]] = []  # List of days (0-5) teacher cannot teach


class TeacherCreate(TeacherBase):
    """Teacher creation schema"""
    password: str
    subjects: List[str] = []


class TeacherUpdate(BaseModel):
    """Teacher update schema"""
    teacher_code: Optional[str] = None
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    department: Optional[str] = None
    subjects: Optional[List[str]] = None
    password: Optional[str] = None
    unavailable_days: Optional[List[int]] = None  # List of days (0-5) teacher cannot teach


class TeacherResponse(TeacherBase):
    """Teacher response schema"""
    id: str
    name: str
    subjects: List[str] = []
    
    class Config:
        from_attributes = True
