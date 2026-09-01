"""
Authentication API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta

from app.database import get_db
from app.models.user import User
from app.models.teacher import Teacher
from app.schemas.user import UserLogin, Token, UserResponse
from app.core.security import verify_password, create_access_token
from app.config import settings
from app.api.deps import get_current_active_user


router = APIRouter()


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    User login endpoint
    
    Returns JWT access token on successful authentication
    """
    # Try to find user in User table
    result = await db.execute(
        select(User).where(User.username == credentials.username)
    )
    user = result.scalar_one_or_none()
    
    # If not found in User table, try Teacher table
    if not user:
        teacher_result = await db.execute(
            select(Teacher).where(Teacher.username == credentials.username)
        )
        teacher = teacher_result.scalar_one_or_none()
        
        if teacher and verify_password(credentials.password, teacher.password_hash):
            # Create access token for teacher
            access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": teacher.username, "type": "teacher"},
                expires_delta=access_token_expires
            )
            
            return Token(
                access_token=access_token,
                token_type="bearer",
                user=UserResponse(
                    id=teacher.id,
                    username=teacher.username,
                    full_name=f"{teacher.first_name} {teacher.last_name}",
                    role="GIANG_VIEN",
                    department=teacher.department,
                    email=teacher.email
                )
            )
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            username=user.username,
            full_name=user.full_name,
            role=user.role.value,
            department=user.department,
            email=user.email
        )
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user information"""
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        full_name=current_user.full_name,
        role=current_user.role.value,
        department=current_user.department,
        email=current_user.email
    )


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_active_user)
):
    """
    User logout endpoint
    
    Note: Since we're using stateless JWT, logout is handled on client side
    by removing the token. This endpoint is here for consistency.
    """
    return {"message": "Successfully logged out"}
