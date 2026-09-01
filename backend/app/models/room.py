"""
Room model
"""
from sqlalchemy import Column, String, Integer, Enum
import enum
from app.database import Base


class RoomType(str, enum.Enum):
    """Room types"""
    THEORY = "theory"
    LAB = "lab"
    BOTH = "both"


class Room(Base):
    """Room model"""
    __tablename__ = "rooms"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    capacity = Column(Integer, nullable=False)
    type = Column(Enum(RoomType), nullable=False)
    
    def __repr__(self):
        return f"<Room(name='{self.name}', capacity={self.capacity}, type='{self.type}')>"
