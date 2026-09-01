"""
Subject model
"""
from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.teacher import teacher_subjects


class Subject(Base):
    """Subject model"""
    __tablename__ = "subjects"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    credits = Column(Integer, nullable=False)
    department = Column(String, nullable=False)
    required_hours = Column(Integer, nullable=False)
    
    # Relationships
    teachers = relationship("Teacher", secondary=teacher_subjects, back_populates="subjects")
    classes = relationship("Class", back_populates="subject", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Subject(code='{self.code}', name='{self.name}')>"
