"""
Pydantic schemas for request/response validation
"""
from app.schemas.user import UserCreate, UserResponse, UserLogin, Token
from app.schemas.teacher import TeacherCreate, TeacherUpdate, TeacherResponse
from app.schemas.subject import SubjectCreate, SubjectUpdate, SubjectResponse
from app.schemas.room import RoomCreate, RoomUpdate, RoomResponse
from app.schemas.class_schema import ClassCreate, ClassUpdate, ClassResponse
from app.schemas.timetable import (
    TimeSlot,
    ScheduleGeneCreate,
    ScheduleGeneResponse,
    TimetableCreate,
    TimetableResponse,
)
from app.schemas.genetic import (
    GeneticAlgorithmConfig,
    GeneticAlgorithmRun,
    GenerationStats,
)

__all__ = [
    "UserCreate",
    "UserResponse",
    "UserLogin",
    "Token",
    "TeacherCreate",
    "TeacherUpdate",
    "TeacherResponse",
    "SubjectCreate",
    "SubjectUpdate",
    "SubjectResponse",
    "RoomCreate",
    "RoomUpdate",
    "RoomResponse",
    "ClassCreate",
    "ClassUpdate",
    "ClassResponse",
    "TimeSlot",
    "ScheduleGeneCreate",
    "ScheduleGeneResponse",
    "TimetableCreate",
    "TimetableResponse",
    "GeneticAlgorithmConfig",
    "GeneticAlgorithmRun",
    "GenerationStats",
]
