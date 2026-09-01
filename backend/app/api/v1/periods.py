"""
API endpoints for periods and timeslots
"""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api.deps import get_db, get_current_active_user
from app.models.period import Period, TimeSlot
from pydantic import BaseModel


router = APIRouter()


class PeriodResponse(BaseModel):
    id: int
    name: str
    start_time: str
    end_time: str
    order_index: int
    
    class Config:
        from_attributes = True


class TimeSlotResponse(BaseModel):
    id: str
    day: int
    period_id: int
    period: PeriodResponse | None = None
    
    class Config:
        from_attributes = True


@router.get("/periods", response_model=List[PeriodResponse])
async def get_periods(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get all periods"""
    result = await db.execute(
        select(Period).order_by(Period.order_index)
    )
    periods = result.scalars().all()
    return periods


@router.get("/timeslots", response_model=List[TimeSlotResponse])
async def get_timeslots(
    day: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get all timeslots, optionally filtered by day"""
    query = select(TimeSlot)
    
    if day is not None:
        query = query.where(TimeSlot.day == day)
    
    result = await db.execute(query.order_by(TimeSlot.day, TimeSlot.period_id))
    timeslots = result.scalars().all()
    return timeslots


@router.get("/timeslots/{timeslot_id}", response_model=TimeSlotResponse)
async def get_timeslot(
    timeslot_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get a specific timeslot by ID"""
    result = await db.execute(
        select(TimeSlot).where(TimeSlot.id == timeslot_id)
    )
    timeslot = result.scalar_one_or_none()
    
    if not timeslot:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="TimeSlot not found")
    
    return timeslot
