"""
Class model
"""
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Class(Base):
    __tablename__ = "classes"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    subject_id = Column(String, ForeignKey("subjects.id", ondelete='CASCADE'), nullable=False)
    teacher_id = Column(String, ForeignKey("teachers.id", ondelete='SET NULL'), nullable=True)
    number_of_students = Column(Integer, nullable=False)
    sessions_per_week = Column(Integer, nullable=False)
    room_type = Column(String, nullable=False, default='theory')  # 'theory', 'lab', 'both'
    
    # Relationships
    subject = relationship("Subject", back_populates="classes")
    teacher = relationship("Teacher", back_populates="classes")
    
    def __repr__(self):
        return f"<Class(name='{self.name}', students={self.number_of_students})>"
