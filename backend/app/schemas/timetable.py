"""
Timetable and ScheduleGene schemas
"""
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime


class TimeSlot(BaseModel):
    """Time slot schema"""
    day: int  # 0-5 (Monday-Saturday)
    period: int  # 0-14 (15 periods per day)


class ScheduleGeneCreate(BaseModel):
    """ScheduleGene creation schema"""
    class_id: str
    room_id: str
    time_slot: TimeSlot


class ScheduleGeneResponse(BaseModel):
    """ScheduleGene response schema"""
    id: str
    timetable_id: str
    class_id: str
    room_id: str
    day: int
    period: int
    
    class Config:
        from_attributes = True


class TimetableCreate(BaseModel):
    """Timetable creation schema"""
    name: str
    fitness: float
    generation: int
    config: Dict[str, Any]
    genes: List[ScheduleGeneCreate]


class TimetableResponse(BaseModel):
    """Timetable response schema"""
    id: str
    name: str
    fitness: float
    generation: int
    config: Dict[str, Any]
    created_at: datetime
    genes: List[ScheduleGeneResponse]
    
    class Config:
        from_attributes = True
