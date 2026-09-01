"""
Subject schemas
"""
from pydantic import BaseModel
from typing import Optional


class SubjectBase(BaseModel):
    """Subject base schema"""
    name: str
    code: str
    credits: int
    department: str
    required_hours: int


class SubjectCreate(SubjectBase):
    """Subject creation schema"""
    pass


class SubjectUpdate(BaseModel):
    """Subject update schema"""
    name: Optional[str] = None
    code: Optional[str] = None
    credits: Optional[int] = None
    department: Optional[str] = None
    required_hours: Optional[int] = None


class SubjectResponse(SubjectBase):
    """Subject response schema"""
    id: str
    
    class Config:
        from_attributes = True
