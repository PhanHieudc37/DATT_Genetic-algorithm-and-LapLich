"""
API dependencies
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, Union

from app.database import get_db
from app.models.user import User
from app.models.teacher import Teacher
from app.core.security import decode_access_token


security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Union[User, Teacher]:
    """
    Get current authenticated user from JWT token
    
    Supports both User and Teacher authentication.
    Teacher tokens have 'type': 'teacher' in payload.
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    username: Optional[str] = payload.get("sub")
    token_type: Optional[str] = payload.get("type")
    
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # If token type is 'teacher', look up in Teacher table
    if token_type == "teacher":
        result = await db.execute(select(Teacher).where(Teacher.username == username))
        teacher = result.scalar_one_or_none()
        
        if teacher is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Teacher not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not teacher.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Teacher account is not active"
            )
        
        return teacher
    
    # Otherwise, look up in User table
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_current_active_user(
    current_user: Union[User, Teacher] = Depends(get_current_user)
) -> Union[User, Teacher]:
    """Get current active user"""
    return current_user
