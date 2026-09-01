"""
Classes API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
import random

from app.database import get_db
from app.models.class_model import Class
from app.models.teacher import Teacher
from app.models.subject import Subject
from app.models.user import User
from app.schemas.class_schema import ClassCreate, ClassUpdate, ClassResponse
from app.api.deps import get_current_active_user
from app.utils.id_generator import generate_class_id
from app.utils.credit_calculator import calculate_sessions_per_week, validate_sessions_per_week


router = APIRouter()


async def assign_teacher_for_subject(db: AsyncSession, subject_id: str) -> str:
    """
    Automatically assign a teacher who can teach the given subject.
    Returns teacher_id or empty string if no eligible teacher found.
    """
    # Find teachers who can teach this subject
    result = await db.execute(
        select(Teacher)
        .options(selectinload(Teacher.subjects))
        .where(Teacher.is_active == True)
    )
    teachers = result.scalars().all()
    
    eligible_teachers = [
        t for t in teachers 
        if any(s.id == subject_id for s in t.subjects)
    ]
    
    if not eligible_teachers:
        return ""
    
    # Randomly select one eligible teacher
    selected_teacher = random.choice(eligible_teachers)
    return selected_teacher.id


@router.get("/", response_model=list[ClassResponse])
async def get_classes(
    skip: int = 0,
    limit: int = 400,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get all classes"""
    result = await db.execute(
        select(Class).offset(skip).limit(limit)
    )
    classes = result.scalars().all()
    return classes


@router.get("/{class_id}", response_model=ClassResponse)
async def get_class(
    class_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get class by ID"""
    result = await db.execute(
        select(Class).where(Class.id == class_id)
    )
    class_item = result.scalar_one_or_none()
    
    if not class_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    return class_item


@router.post("/", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
async def create_class(
    class_data: ClassCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Create new class"""
    # Check if the same class name + subject combination already exists
    result = await db.execute(
        select(Class).where(
            Class.name == class_data.name,
            Class.subject_id == class_data.subject_id
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Class with this name and subject already exists"
        )
    
    # Get subject to check credits
    subject_result = await db.execute(
        select(Subject).where(Subject.id == class_data.subject_id)
    )
    subject = subject_result.scalar_one_or_none()
    
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    class_dict = class_data.model_dump()
    
    # Auto-calculate sessions_per_week if not provided
    if class_dict.get('sessions_per_week') is None:
        class_dict['sessions_per_week'] = calculate_sessions_per_week(subject.credits)
    else:
        # Validate if provided
        is_valid, error_msg = validate_sessions_per_week(
            subject.credits, 
            class_dict['sessions_per_week']
        )
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
    
    # Generate ID
    class_id = await generate_class_id(db)
    
    # Set teacher_id to None - GA will handle teacher selection
    class_dict['teacher_id'] = None
    
    class_item = Class(id=class_id, **class_dict)
    db.add(class_item)
    await db.commit()
    await db.refresh(class_item)
    
    return class_item


@router.put("/{class_id}", response_model=ClassResponse)
async def update_class(
    class_id: str,
    class_data: ClassUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Update class"""
    result = await db.execute(
        select(Class).where(Class.id == class_id)
    )
    class_item = result.scalar_one_or_none()
    
    if not class_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    update_data = class_data.model_dump(exclude_unset=True)
    
    # Get subject (current or new)
    subject_id = update_data.get('subject_id', class_item.subject_id)
    subject_result = await db.execute(
        select(Subject).where(Subject.id == subject_id)
    )
    subject = subject_result.scalar_one_or_none()
    
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    # If subject changed, set teacher_id to None (let GA choose)
    if 'subject_id' in update_data:
        update_data['teacher_id'] = None
        # Auto-update sessions_per_week if not explicitly provided
        if 'sessions_per_week' not in update_data:
            update_data['sessions_per_week'] = calculate_sessions_per_week(subject.credits)
    
    # Validate sessions_per_week if provided
    if 'sessions_per_week' in update_data:
        is_valid, error_msg = validate_sessions_per_week(
            subject.credits,
            update_data['sessions_per_week']
        )
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
    
    for field, value in update_data.items():
        setattr(class_item, field, value)
    
    await db.commit()
    await db.refresh(class_item)
    
    return class_item


@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class(
    class_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Delete class"""
    result = await db.execute(
        select(Class).where(Class.id == class_id)
    )
    class_item = result.scalar_one_or_none()
    
    if not class_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    await db.delete(class_item)
    await db.commit()
    
    return None
