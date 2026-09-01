"""
Teachers API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.database import get_db
from app.models.teacher import Teacher
from app.models.subject import Subject
from app.models.user import User
from app.schemas.teacher import TeacherCreate, TeacherUpdate, TeacherResponse
from app.core.security import get_password_hash
from app.api.deps import get_current_active_user
from app.utils.id_generator import generate_teacher_id


router = APIRouter()


@router.get("/", response_model=list[TeacherResponse])
async def get_teachers(
    skip: int = 0,
    limit: int = 400,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get all teachers"""
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(
        select(Teacher)
        .options(selectinload(Teacher.subjects))
        .offset(skip)
        .limit(limit)
    )
    teachers = result.scalars().all()
    
    # Convert to response format
    response = []
    for teacher in teachers:
        response.append(TeacherResponse(
            id=teacher.id,
            teacher_code=teacher.teacher_code,
            username=teacher.username,
            first_name=teacher.first_name,
            last_name=teacher.last_name,
            name=teacher.name,
            phone=teacher.phone,
            email=teacher.email,
            address=teacher.address,
            department=teacher.department,
            unavailable_days=teacher.unavailable_days if teacher.unavailable_days else [],
            subjects=[s.id for s in teacher.subjects]
        ))
    
    return response


@router.get("/{teacher_id}", response_model=TeacherResponse)
async def get_teacher(
    teacher_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get teacher by ID"""
    result = await db.execute(
        select(Teacher).where(Teacher.id == teacher_id)
    )
    teacher = result.scalar_one_or_none()
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found"
        )
    
    return TeacherResponse(
        id=teacher.id,
        teacher_code=teacher.teacher_code,
        username=teacher.username,
        first_name=teacher.first_name,
        last_name=teacher.last_name,
        name=teacher.name,
        phone=teacher.phone,
        email=teacher.email,
        address=teacher.address,
        department=teacher.department,
        unavailable_days=teacher.unavailable_days if teacher.unavailable_days else [],
        subjects=[s.id for s in teacher.subjects]
    )


@router.post("/", response_model=TeacherResponse, status_code=status.HTTP_201_CREATED)
async def create_teacher(
    teacher_data: TeacherCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Create new teacher"""
    # Check if teacher code already exists
    result = await db.execute(
        select(Teacher).where(Teacher.teacher_code == teacher_data.teacher_code)
    )
    existing_code = result.scalar_one_or_none()
    
    if existing_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mã giảng viên '{teacher_data.teacher_code}' đã tồn tại"
        )
    
    # Check if username already exists
    result = await db.execute(
        select(Teacher).where(Teacher.username == teacher_data.username)
    )
    existing_username = result.scalar_one_or_none()
    
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tên đăng nhập '{teacher_data.username}' đã tồn tại"
        )
    
    # Check if email already exists
    result = await db.execute(
        select(Teacher).where(Teacher.email == teacher_data.email)
    )
    existing_email = result.scalar_one_or_none()
    
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{teacher_data.email}' đã tồn tại"
        )
    
    # Generate ID
    teacher_id = await generate_teacher_id(db)
    
    # Create new teacher
    teacher = Teacher(
        id=teacher_id,
        teacher_code=teacher_data.teacher_code,
        username=teacher_data.username,
        password_hash=get_password_hash(teacher_data.password),
        first_name=teacher_data.first_name,
        last_name=teacher_data.last_name,
        phone=teacher_data.phone,
        email=teacher_data.email,
        address=teacher_data.address,
        department=teacher_data.department,
        unavailable_days=teacher_data.unavailable_days if teacher_data.unavailable_days else []
    )
    
    # Add subjects
    if teacher_data.subjects:
        result = await db.execute(
            select(Subject).where(Subject.id.in_(teacher_data.subjects))
        )
        subjects = result.scalars().all()
        teacher.subjects.extend(subjects)
    
    db.add(teacher)
    await db.commit()
    await db.refresh(teacher, attribute_names=['subjects'])
    
    return TeacherResponse(
        id=teacher.id,
        teacher_code=teacher.teacher_code,
        username=teacher.username,
        first_name=teacher.first_name,
        last_name=teacher.last_name,
        name=teacher.name,
        phone=teacher.phone,
        email=teacher.email,
        address=teacher.address,
        department=teacher.department,
        unavailable_days=teacher.unavailable_days if teacher.unavailable_days else [],
        subjects=[s.id for s in teacher.subjects]
    )


@router.put("/{teacher_id}", response_model=TeacherResponse)
async def update_teacher(
    teacher_id: str,
    teacher_data: TeacherUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Update teacher"""
    result = await db.execute(
        select(Teacher)
        .options(selectinload(Teacher.subjects))
        .where(Teacher.id == teacher_id)
    )
    teacher = result.scalar_one_or_none()
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found"
        )
    
    # Update fields
    update_data = teacher_data.model_dump(exclude_unset=True)
    
    if 'password' in update_data:
        update_data['password_hash'] = get_password_hash(update_data.pop('password'))
    
    if 'subjects' in update_data:
        subject_ids = update_data.pop('subjects')
        result = await db.execute(
            select(Subject).where(Subject.id.in_(subject_ids))
        )
        subjects = result.scalars().all()
        teacher.subjects = subjects
    
    for field, value in update_data.items():
        setattr(teacher, field, value)
    
    await db.commit()
    await db.refresh(teacher, attribute_names=['subjects'])
    
    return TeacherResponse(
        id=teacher.id,
        teacher_code=teacher.teacher_code,
        username=teacher.username,
        first_name=teacher.first_name,
        last_name=teacher.last_name,
        name=teacher.name,
        phone=teacher.phone,
        email=teacher.email,
        address=teacher.address,
        department=teacher.department,
        unavailable_days=teacher.unavailable_days if teacher.unavailable_days else [],
        subjects=[s.id for s in teacher.subjects]
    )


@router.delete("/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_teacher(
    teacher_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Delete teacher"""
    result = await db.execute(
        select(Teacher).where(Teacher.id == teacher_id)
    )
    teacher = result.scalar_one_or_none()
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found"
        )
    
    await db.delete(teacher)
    await db.commit()
    
    return None
