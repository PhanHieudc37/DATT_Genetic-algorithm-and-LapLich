"""
Period and TimeSlot models for schedule time management
"""
from sqlalchemy import Column, String, Integer, ForeignKey, Time
from sqlalchemy.orm import relationship
from app.database import Base


class Period(Base):
    """Period model - represents a class period with time information"""
    __tablename__ = "periods"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # "Tiết 1", "Tiết 2", etc.
    start_time = Column(String, nullable=False)  # "06:30"
    end_time = Column(String, nullable=False)  # "07:20"
    order_index = Column(Integer, nullable=False, unique=True)  # 0, 1, 2...14
    
    # Relationships
    timeslots = relationship("TimeSlot", back_populates="period")
    
    def __repr__(self):
        return f"<Period(name='{self.name}', time='{self.start_time}-{self.end_time}')>"


class TimeSlot(Base):
    """TimeSlot model - represents a specific time slot (day + period)"""
    __tablename__ = "timeslots"
    
    id = Column(String, primary_key=True, index=True)
    day = Column(Integer, nullable=False)  # 0-5 (Monday-Saturday)
    period_id = Column(Integer, ForeignKey("periods.id", ondelete='CASCADE'), nullable=False)
    
    # Relationships
    period = relationship("Period", back_populates="timeslots")
    schedule_genes = relationship("ScheduleGene", back_populates="timeslot")
    
    def __repr__(self):
        return f"<TimeSlot(day={self.day}, period_id={self.period_id})>"
