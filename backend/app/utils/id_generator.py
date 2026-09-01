"""
ID Generator utility
Generate sequential IDs with prefix
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func


async def generate_teacher_id(db: AsyncSession) -> str:
    """Generate sequential teacher ID (T001, T002, ...)"""    
    from app.models.teacher import Teacher
    
    result = await db.execute(select(Teacher.id))
    existing_ids = result.scalars().all()
    
    if not existing_ids:
        return "T0001"
    
    max_num = 0
    for teacher_id in existing_ids:
        try:
            num = int(teacher_id[1:])
            max_num = max(max_num, num)
        except (ValueError, IndexError):
            continue
    
    return f"T{str(max_num + 1).zfill(4)}"
async def generate_subject_id(db: AsyncSession) -> str:
    """Generate sequential subject ID (S001, S002, ...)"""    
    from app.models.subject import Subject
    
    result = await db.execute(select(Subject.id))
    existing_ids = result.scalars().all()
    
    if not existing_ids:
        return "S0001"
    
    max_num = 0
    for subject_id in existing_ids:
        try:
            num = int(subject_id[1:])
            max_num = max(max_num, num)
        except (ValueError, IndexError):
            continue
    
    return f"S{str(max_num + 1).zfill(4)}"
async def generate_room_id(db: AsyncSession) -> str:
    """Generate sequential room ID (R001, R002, ...)"""
    from app.models.room import Room
    
    # Get all existing IDs and find the max number
    result = await db.execute(select(Room.id))
    existing_ids = result.scalars().all()
    
    if not existing_ids:
        return "R0001"
    
    # Extract numbers from IDs like R0001, R0002
    max_num = 0
    for room_id in existing_ids:
        try:
            num = int(room_id[1:])  # Remove 'R' prefix
            max_num = max(max_num, num)
        except (ValueError, IndexError):
            continue
    
    return f"R{str(max_num + 1).zfill(4)}"


async def generate_class_id(db: AsyncSession) -> str:
    """Generate sequential class ID (C001, C002, ...)"""    
    from app.models.class_model import Class
    
    result = await db.execute(select(Class.id))
    existing_ids = result.scalars().all()
    
    if not existing_ids:
        return "C0001"
    
    max_num = 0
    for class_id in existing_ids:
        try:
            num = int(class_id[1:])
            max_num = max(max_num, num)
        except (ValueError, IndexError):
            continue
    
    return f"C{str(max_num + 1).zfill(4)}"