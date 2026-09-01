"""
Timetable and ScheduleGene models
"""
from sqlalchemy import Column, String, Integer, Float, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Timetable(Base):
    """Timetable model - represents a complete schedule solution"""
    __tablename__ = "timetables"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    fitness = Column(Float, nullable=False)
    generation = Column(Integer, nullable=False)
    config = Column(JSON, nullable=False)  # Stores GA configuration used
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    genes = relationship("ScheduleGene", back_populates="timetable", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Timetable(name='{self.name}', fitness={self.fitness})>"


class ScheduleGene(Base):
    """ScheduleGene model - represents a single class schedule slot
    
    Now uses timeslot_id to reference Period and TimeSlot tables
    """
    __tablename__ = "schedule_genes"
    
    id = Column(String, primary_key=True, index=True)
    timetable_id = Column(String, ForeignKey("timetables.id", ondelete='CASCADE'), nullable=False)
    class_id = Column(String, ForeignKey("classes.id", ondelete='CASCADE'), nullable=False)
    teacher_id = Column(String, ForeignKey("teachers.id", ondelete='CASCADE'), nullable=False)  # GA can optimize this
    room_id = Column(String, ForeignKey("rooms.id", ondelete='CASCADE'), nullable=False)
    timeslot_id = Column(String, ForeignKey("timeslots.id", ondelete='CASCADE'), nullable=False)
    
    # Backward compatibility: keep day and period for GA algorithm
    day = Column(Integer, nullable=False)  # 0-5 (Monday-Saturday)
    period = Column(Integer, nullable=False)  # 0-14 (15 periods per day)
    
    # Relationships
    timetable = relationship("Timetable", back_populates="genes")
    timeslot = relationship("TimeSlot", back_populates="schedule_genes")
    
    def __repr__(self):
        return f"<ScheduleGene(class_id='{self.class_id}', teacher_id='{self.teacher_id}', day={self.day}, period={self.period})>"
