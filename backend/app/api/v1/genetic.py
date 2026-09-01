"""
Genetic Algorithm API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
import uuid

from app.database import get_db
from app.models.class_model import Class
from app.models.room import Room
from app.models.teacher import Teacher
from app.models.timetable import Timetable, ScheduleGene
from app.schemas.genetic import GeneticAlgorithmRun, GenerationStats
from app.schemas.timetable import TimetableResponse, ScheduleGeneResponse
from app.core.genetic_algorithm import GeneticAlgorithm
from app.api.deps import get_current_active_user


router = APIRouter()


@router.post("/run", response_model=dict)
async def run_genetic_algorithm(
    run_config: GeneticAlgorithmRun,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Run genetic algorithm to generate timetable
    
    This endpoint runs the genetic algorithm with optimized default parameters.
    The algorithm will automatically find the best timetable configuration.
    """
    # Fetch all classes, rooms, and teachers
    from sqlalchemy.orm import selectinload
    
    classes_result = await db.execute(
        select(Class)
    )
    classes = classes_result.scalars().all()
    
    rooms_result = await db.execute(select(Room))
    rooms = rooms_result.scalars().all()
    
    teachers_result = await db.execute(
        select(Teacher).options(selectinload(Teacher.subjects))
    )
    teachers = teachers_result.scalars().all()
    
    if not classes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No classes found. Please add classes before running the algorithm."
        )
    
    if not rooms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No rooms found. Please add rooms before running the algorithm."
        )
    
    # Build subject-to-teachers mapping from teacher_subjects relationship
    from collections import defaultdict
    subject_to_teachers = defaultdict(list)
    for teacher in teachers:
        for subject in teacher.subjects:
            subject_to_teachers[subject.id].append(teacher.id)
    
    # VALIDATE: Check if all classes have at least one qualified teacher
    classes_without_teachers = []
    for c in classes:
        qualified = subject_to_teachers.get(c.subject_id, [])
        if not qualified:
            # Find subject name for better error message
            from app.models.subject import Subject
            subject_result = await db.execute(
                select(Subject).where(Subject.id == c.subject_id)
            )
            subject_obj = subject_result.scalar_one_or_none()
            subject_name = subject_obj.name if subject_obj else "Unknown"
            
            classes_without_teachers.append({
                'class_name': c.name,
                'subject_name': subject_name,
                'subject_id': c.subject_id
            })
    
    # If any class has no qualified teachers, return error with details
    if classes_without_teachers:
        error_details = "\n".join([
            f"  • Lớp '{item['class_name']}' (Môn: {item['subject_name']}) - Chưa có giáo viên nào có thể dạy môn này"
            for item in classes_without_teachers
        ])
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Không thể chạy thuật toán! Các lớp sau thiếu giáo viên:\n\n{error_details}\n\nVui lòng:\n1. Thêm giáo viên mới có thể dạy các môn trên, HOẶC\n2. Gán các môn học cho giáo viên hiện có trong trang Quản lý Giáo viên"
        )
    
    # Convert to dict format for GA
    classes_dict = [
        {
            'id': c.id,
            'name': c.name,
            'subject_id': c.subject_id,
            'teacher_id': c.teacher_id,  # Nullable - not used by GA
            'number_of_students': c.number_of_students,
            'sessions_per_week': c.sessions_per_week,
            'room_type': c.room_type,
            # Get ALL qualified teachers from subject.teachers relationship
            # Already validated above that this list is not empty
            'qualified_teachers': subject_to_teachers[c.subject_id]
        }
        for c in classes
    ]
    
    rooms_dict = [
        {
            'id': r.id,
            'name': r.name,
            'capacity': r.capacity,
            'type': r.type.value
        }
        for r in rooms
    ]
    
    teachers_dict = [
        {
            'id': t.id,
            'name': t.name,
            'unavailable_days': t.unavailable_days if t.unavailable_days else []  # Include unavailable_days
        }
        for t in teachers
    ]
    
    # Use optimized default configuration if not provided
    # If frontend sends config, use it; otherwise use GeneticAlgorithm defaults
    config = run_config.config if run_config.config else None
    
    if config:
        # Frontend provided custom config
        ga = GeneticAlgorithm(
            classes=classes_dict,
            rooms=rooms_dict,
            teachers=teachers_dict,
            population_size=config.population_size,
            mutation_rate=config.mutation_rate,
            crossover_rate=config.crossover_rate,
            elitism_rate=config.elitism_rate,
            max_generations=config.max_generations
        )
    else:
        # Use backend defaults (200, 0.15, 0.85, 0.15, 200)
        ga = GeneticAlgorithm(
            classes=classes_dict,
            rooms=rooms_dict,
            teachers=teachers_dict
            # Let GeneticAlgorithm use its own defaults
        )
    
    best_solution, stats_history = ga.run()
    
    # Save best solution if requested
    timetable_id = None
    if run_config.save_best:
        timetable_name = run_config.timetable_name or f"Timetable_{uuid.uuid4().hex[:8]}"
        timetable_id = str(uuid.uuid4())
        
        # Create timetable record with actual config used
        actual_config = {
            'population_size': ga.population_size,
            'mutation_rate': ga.mutation_rate,
            'crossover_rate': ga.crossover_rate,
            'elitism_rate': ga.elitism_rate,
            'max_generations': ga.max_generations
        }
        
        timetable = Timetable(
            id=timetable_id,
            name=timetable_name,
            fitness=best_solution.fitness,
            generation=len(stats_history),
            config=actual_config
        )
        db.add(timetable)
        
        # Create schedule genes
        for gene in best_solution.genes:
            # Generate timeslot_id from day and period
            timeslot_id = f"ts_{gene.time_slot.day}_{gene.time_slot.period}"
            
            schedule_gene = ScheduleGene(
                id=str(uuid.uuid4()),
                timetable_id=timetable_id,
                class_id=gene.class_id,
                teacher_id=gene.teacher_id,  # Include teacher_id from GA
                room_id=gene.room_id,
                timeslot_id=timeslot_id,  # Reference to timeslots table
                day=gene.time_slot.day,  # Keep for backward compatibility
                period=gene.time_slot.period  # Keep for backward compatibility
            )
            db.add(schedule_gene)
        
        await db.commit()
    
    # Prepare response
    genes_response = [
        {
            'class_id': gene.class_id,
            'teacher_id': gene.teacher_id,
            'room_id': gene.room_id,
            'time_slot': {
                'day': gene.time_slot.day,
                'period': gene.time_slot.period
            }
        }
        for gene in best_solution.genes
    ]
    
    stats_response = [
        {
            'generation': stat['generation'],
            'best_fitness': stat['best_fitness'],
            'best_ever_fitness': stat.get('best_ever_fitness', stat['best_fitness']),
            'avg_fitness': stat['avg_fitness'],
            'worst_fitness': stat['worst_fitness']
        }
        for stat in stats_history
    ]
    
    return {
        'timetable_id': timetable_id,
        'fitness': best_solution.fitness,
        'generations': len(stats_history),
        'genes': genes_response,
        'stats': stats_response,
        'config': {
            'population_size': ga.population_size,
            'mutation_rate': ga.mutation_rate,
            'crossover_rate': ga.crossover_rate,
            'elitism_rate': ga.elitism_rate,
            'max_generations': ga.max_generations
        }
    }


@router.get("/timetables", response_model=List[dict])
async def get_timetables(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get all saved timetables"""
    result = await db.execute(
        select(Timetable).order_by(desc(Timetable.created_at)).offset(skip).limit(limit)
    )
    timetables = result.scalars().all()
    
    return [
        {
            'id': t.id,
            'name': t.name,
            'fitness': t.fitness,
            'generation': t.generation,
            'config': t.config,
            'created_at': t.created_at.isoformat()
        }
        for t in timetables
    ]


@router.get("/timetable/{timetable_id}", response_model=dict)
async def get_timetable(
    timetable_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get specific timetable with all schedule genes"""
    result = await db.execute(
        select(Timetable).where(Timetable.id == timetable_id)
    )
    timetable = result.scalar_one_or_none()
    
    if not timetable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timetable not found"
        )
    
    # Get all genes for this timetable
    genes_result = await db.execute(
        select(ScheduleGene).where(ScheduleGene.timetable_id == timetable_id)
    )
    genes = genes_result.scalars().all()
    
    return {
        'id': timetable.id,
        'name': timetable.name,
        'fitness': timetable.fitness,
        'generation': timetable.generation,
        'config': timetable.config,
        'created_at': timetable.created_at.isoformat(),
        'genes': [
            {
                'id': g.id,
                'class_id': g.class_id,
                'teacher_id': g.teacher_id,
                'room_id': g.room_id,
                'time_slot': {
                    'day': g.day,
                    'period': g.period
                }
            }
            for g in genes
        ]
    }


@router.get("/best", response_model=dict)
async def get_best_timetable(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get the best timetable (highest fitness)"""
    result = await db.execute(
        select(Timetable).order_by(desc(Timetable.fitness)).limit(1)
    )
    timetable = result.scalar_one_or_none()
    
    if not timetable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No timetables found"
        )
    
    # Get all genes for this timetable
    genes_result = await db.execute(
        select(ScheduleGene).where(ScheduleGene.timetable_id == timetable.id)
    )
    genes = genes_result.scalars().all()
    
    return {
        'id': timetable.id,
        'name': timetable.name,
        'fitness': timetable.fitness,
        'generation': timetable.generation,
        'config': timetable.config,
        'created_at': timetable.created_at.isoformat(),
        'genes': [
            {
                'id': g.id,
                'class_id': g.class_id,
                'teacher_id': g.teacher_id,
                'room_id': g.room_id,
                'time_slot': {
                    'day': g.day,
                    'period': g.period
                }
            }
            for g in genes
        ]
    }


@router.delete("/timetable/{timetable_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_timetable(
    timetable_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Delete a timetable"""
    result = await db.execute(
        select(Timetable).where(Timetable.id == timetable_id)
    )
    timetable = result.scalar_one_or_none()
    
    if not timetable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timetable not found"
        )
    
    await db.delete(timetable)
    await db.commit()
    
    return None


@router.get("/teacher-schedule/{teacher_id}", response_model=dict)
async def get_teacher_schedule(
    teacher_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Get schedule for a specific teacher from the latest timetable
    
    Authorization:
    - Teacher can only view their own schedule (teacher_id must match)
    - Admin/GiaoVu can view any teacher's schedule
    
    Returns only the schedule genes where this teacher is assigned
    """
    # Get teacher info to check authorization
    teacher_result = await db.execute(
        select(Teacher).where(Teacher.id == teacher_id)
    )
    teacher = teacher_result.scalar_one_or_none()
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found"
        )
    
    # Authorization check
    # If current user is a teacher, they can only view their own schedule
    if hasattr(current_user, 'teacher_code'):  # User is a teacher
        if current_user.id != teacher_id:
            if not teacher.can_view_all_schedules:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only view your own schedule"
                )
        
        # Check if teacher has permission to view schedule
        if not teacher.can_view_own_schedule:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view schedules"
            )
        
        # Check if teacher account is active
        if not teacher.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is not active"
            )
    
    # Get the latest timetable
    result = await db.execute(
        select(Timetable).order_by(desc(Timetable.created_at)).limit(1)
    )
    timetable = result.scalar_one_or_none()
    
    if not timetable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No timetables found"
        )
    
    # Get all genes for this timetable
    genes_result = await db.execute(
        select(ScheduleGene).where(ScheduleGene.timetable_id == timetable.id)
    )
    all_genes = genes_result.scalars().all()
    
    # Lọc genes theo gene.teacher_id (do GA gán), không phải class.teacher_id
    teacher_genes = [g for g in all_genes if g.teacher_id == teacher_id]
    
    # Lấy danh sách class_id duy nhất từ các genes đã lọc
    teacher_class_ids = list(set(g.class_id for g in teacher_genes))
    
    return {
        'timetable_id': timetable.id,
        'timetable_name': timetable.name,
        'teacher_id': teacher_id,
        'teacher_name': teacher.name,
        'teacher_code': teacher.teacher_code,
        'department': teacher.department,
        'can_request_change': teacher.can_request_schedule_change,
        'total_classes': len(teacher_class_ids),
        'total_sessions': len(teacher_genes),
        'genes': [
            {
                'id': g.id,
                'class_id': g.class_id,
                'teacher_id': g.teacher_id,
                'room_id': g.room_id,
                'time_slot': {
                    'day': g.day,
                    'period': g.period
                }
            }
            for g in teacher_genes
        ]
    }


@router.get("/timetable/{timetable_id}/teacher", response_model=dict)
async def get_teacher_schedule_by_timetable(
    timetable_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Get schedule for the current logged-in teacher from a specific timetable
    
    This endpoint is used by TeacherDashboard to view their schedule.
    Only works for teacher accounts, automatically filters by current user's teacher_id.
    """
    print("get_teacher_schedule_by_timetable called")
    print(f"   Timetable ID: {timetable_id}")
    print(f"   Current user: {current_user}")
    print(f"   User type: {type(current_user)}")
    print(f"   Has teacher_code: {hasattr(current_user, 'teacher_code')}")
    
    # Kiểm tra xem user hiện tại có phải giáo viên không
    if not hasattr(current_user, 'teacher_code'):
        print(f"User is not a teacher! Attributes: {dir(current_user)}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only accessible to teacher accounts"
        )
    
    teacher_id = current_user.id
    print(f"Teacher ID: {teacher_id}")
    
    # Get teacher info
    teacher_result = await db.execute(
        select(Teacher).where(Teacher.id == teacher_id)
    )
    teacher = teacher_result.scalar_one_or_none()
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found"
        )
    
    # Check if teacher account is active
    if not teacher.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is not active"
        )
    
    # Get the timetable
    result = await db.execute(
        select(Timetable).where(Timetable.id == timetable_id)
    )
    timetable = result.scalar_one_or_none()
    
    if not timetable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timetable not found"
        )
    
    # Get all genes for this timetable
    genes_result = await db.execute(
        select(ScheduleGene).where(ScheduleGene.timetable_id == timetable.id)
    )
    all_genes = genes_result.scalars().all()
    
    # Lọc genes theo gene.teacher_id (do GA gán), không phải class.teacher_id
    teacher_genes = [g for g in all_genes if g.teacher_id == teacher_id]
    
    # Lấy danh sách class_id duy nhất từ các genes đã lọc
    teacher_class_ids = list(set(g.class_id for g in teacher_genes))
    
    return {
        'teacher_id': teacher_id,
        'teacher_name': teacher.name,
        'teacher_code': teacher.teacher_code,
        'department': teacher.department,
        'total_classes': len(teacher_class_ids),
        'total_sessions': len(teacher_genes),
        'genes': [
            {
                'class_id': g.class_id,
                'teacher_id': g.teacher_id,
                'room_id': g.room_id,
                'time_slot': {
                    'day': g.day,
                    'period': g.period
                }
            }
            for g in teacher_genes
        ]
    }


@router.post("/save-timetable", response_model=dict)
async def save_timetable(
    timetable_data: dict,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Save a timetable with genes from already-computed results
    This avoids re-running the algorithm
    """
    timetable_id = str(uuid.uuid4())
    timetable_name = timetable_data.get('name', f"Timetable_{uuid.uuid4().hex[:8]}")
    fitness = timetable_data.get('fitness', 0)
    generations = timetable_data.get('generations', 0)
    genes_data = timetable_data.get('genes', [])
    config = timetable_data.get('config', {})
    
    # Check if timetable name already exists
    existing_result = await db.execute(
        select(Timetable).where(Timetable.name == timetable_name)
    )
    existing_timetable = existing_result.scalar_one_or_none()
    
    if existing_timetable:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tên thời khóa biểu '{timetable_name}' đã tồn tại! Vui lòng chọn tên khác."
        )
    
    # Create timetable record
    timetable = Timetable(
        id=timetable_id,
        name=timetable_name,
        fitness=fitness,
        generation=generations,
        config=config
    )
    db.add(timetable)
    
    # Create schedule genes
    for gene in genes_data:
        day = gene['time_slot']['day']
        period = gene['time_slot']['period']
        timeslot_id = f"ts_{day}_{period}"  # Generate timeslot_id
        
        schedule_gene = ScheduleGene(
            id=str(uuid.uuid4()),
            timetable_id=timetable_id,
            class_id=gene['class_id'],
            teacher_id=gene.get('teacher_id'),  # Get teacher_id from gene data
            room_id=gene['room_id'],
            timeslot_id=timeslot_id,  # Add timeslot_id
            day=day,
            period=period
        )
        db.add(schedule_gene)
    
    await db.commit()
    
    return {
        'timetable_id': timetable_id,
        'name': timetable_name,
        'fitness': fitness,
        'genes': genes_data
    }
