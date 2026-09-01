"""
User model
"""
from sqlalchemy import Column, String, Enum
from sqlalchemy.orm import relationship
import enum
from app.database import Base


class UserRole(str, enum.Enum):
    """User roles"""
    TRUONG_BO_MON = "truong_bo_mon"
    GIAO_VU = "giao_vu"
    TRUONG_KHOA = "truong_khoa"
    GIANG_VIEN = "giang_vien"


class User(Base):
    """User model for authentication"""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    department = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    
    def __repr__(self):
        return f"<User(username='{self.username}', role='{self.role}')>"
