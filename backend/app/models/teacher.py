"""
Teacher model
"""
from sqlalchemy import Column, String, Table, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database import Base


# Association table for many-to-many relationship between teachers and subjects
teacher_subjects = Table(
    'teacher_subjects',
    Base.metadata,
    Column('teacher_id', String, ForeignKey('teachers.id', ondelete='CASCADE'), primary_key=True),
    Column('subject_id', String, ForeignKey('subjects.id', ondelete='CASCADE'), primary_key=True)
)


class Teacher(Base):
    """Teacher model"""
    __tablename__ = "teachers"
    
    id = Column(String, primary_key=True, index=True)
    teacher_code = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    address = Column(String, nullable=True)
    department = Column(String, nullable=False)
    
    # Availability - list of days teacher cannot teach (0=Monday, 1=Tuesday, ..., 5=Saturday)
    unavailable_days = Column(JSON, nullable=True, default=list)
    
    # Authorization fields
    is_active = Column(Boolean, default=True, nullable=False)
    can_view_own_schedule = Column(Boolean, default=True, nullable=False)
    can_view_all_schedules = Column(Boolean, default=False, nullable=False)
    can_request_schedule_change = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    subjects = relationship("Subject", secondary=teacher_subjects, back_populates="teachers")
    classes = relationship("Class", back_populates="teacher", cascade="all, delete-orphan")
    
    @property
    def name(self):
        """Full name property"""
        return f"{self.last_name} {self.first_name}"
    
    def __repr__(self):
        return f"<Teacher(teacher_code='{self.teacher_code}', name='{self.name}')>"
