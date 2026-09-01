"""
Rooms API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models.room import Room
from app.models.user import User
from app.schemas.room import RoomCreate, RoomUpdate, RoomResponse
from app.api.deps import get_current_active_user
from app.utils.id_generator import generate_room_id


router = APIRouter()


@router.get("/", response_model=list[RoomResponse])
async def get_rooms(
    skip: int = 0,
    limit: int = 400,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get all rooms"""
    result = await db.execute(
        select(Room).offset(skip).limit(limit)
    )
    rooms = result.scalars().all()
    return rooms


@router.get("/{room_id}", response_model=RoomResponse)
async def get_room(
    room_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get room by ID"""
    result = await db.execute(
        select(Room).where(Room.id == room_id)
    )
    room = result.scalar_one_or_none()
    
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    return room


@router.post("/", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
async def create_room(
    room_data: RoomCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Create new room"""
    # Check if name already exists
    result = await db.execute(
        select(Room).where(Room.name == room_data.name)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Room name already exists"
        )
    
    # Generate ID
    room_id = await generate_room_id(db)
    
    room = Room(id=room_id, **room_data.model_dump())
    db.add(room)
    await db.commit()
    await db.refresh(room)
    
    return room


@router.put("/{room_id}", response_model=RoomResponse)
async def update_room(
    room_id: str,
    room_data: RoomUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Update room"""
    result = await db.execute(
        select(Room).where(Room.id == room_id)
    )
    room = result.scalar_one_or_none()
    
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    update_data = room_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(room, field, value)
    
    await db.commit()
    await db.refresh(room)
    
    return room


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_room(
    room_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Delete room"""
    result = await db.execute(
        select(Room).where(Room.id == room_id)
    )
    room = result.scalar_one_or_none()
    
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    await db.delete(room)
    await db.commit()
    
    return None
