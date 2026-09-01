"""
Class schemas
"""
from pydantic import BaseModel
from typing import Optional, Literal


class ClassBase(BaseModel):
    """Class base schema"""
    name: str
    subject_id: str
    teacher_id: Optional[str] = None  # Optional - auto-assigned by backend
    number_of_students: int
    sessions_per_week: Optional[int] = None  # Optional - auto-calculated from subject credits
    room_type: Optional[Literal['theory', 'lab', 'both']] = 'theory'


class ClassCreate(ClassBase):
    """Class creation schema
    
    sessions_per_week is optional. If not provided, it will be auto-calculated
    based on the subject's credits according to university standards:
    - 1 credit → 1 session/week (1 buổi = 1 tiết)
    - 2 credits → 2 sessions/week (1 buổi = 1 tiết)
    - 3 credits → 2 sessions/week (1 buổi = 1 tiết)
    - 4 credits → 2 sessions/week (1 buổi = 1 tiết)
    - ≥5 credits → 3 sessions/week (1 buổi = 1 tiết)
    """
    pass


class ClassUpdate(BaseModel):
    """Class update schema"""
    name: Optional[str] = None
    subject_id: Optional[str] = None
    teacher_id: Optional[str] = None
    number_of_students: Optional[int] = None
    sessions_per_week: Optional[int] = None
    room_type: Optional[Literal['theory', 'lab', 'both']] = None


class ClassResponse(ClassBase):
    """Class response schema"""
    id: str
    
    class Config:
        from_attributes = True
