"""
Room schemas
"""
from pydantic import BaseModel
from typing import Optional


class RoomBase(BaseModel):
    """Room base schema"""
    name: str
    capacity: int
    type: str  # 'theory' | 'lab' | 'both'


class RoomCreate(RoomBase):
    """Room creation schema"""
    pass


class RoomUpdate(BaseModel):
    """Room update schema"""
    name: Optional[str] = None
    capacity: Optional[int] = None
    type: Optional[str] = None


class RoomResponse(RoomBase):
    """Room response schema"""
    id: str
    
    class Config:
        from_attributes = True
