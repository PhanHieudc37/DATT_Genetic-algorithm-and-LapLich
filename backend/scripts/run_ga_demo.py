"""Run a demo Genetic Algorithm and persist the resulting timetable to the database.

Usage (from repo root):
    cd backend
    python -m scripts.run_ga_demo

This script will:
 - initialize DB (if not already)
 - seed demo data (uses app.utils.seed_data)
 - ensure Period and TimeSlot rows exist
 - run GA with a balanced configuration
 - persist best timetable and its schedule_genes

Note: This is a demo helper for local runs. It may block the event loop while
running the synchronous GA engine. For production, consider running GA in a
background worker/process.
"""
import asyncio
import uuid
import json
from sqlalchemy import select

from app.database import async_session_maker, init_db
from app.models.class_model import Class as ClassModel
from app.models.room import Room as RoomModel
from app.models.teacher import Teacher as TeacherModel, teacher_subjects
from app.models.subject import Subject as SubjectModel
from app.models.timetable import Timetable as TimetableModel, ScheduleGene as ScheduleGeneModel
from app.models.period import Period as PeriodModel, TimeSlot as TimeSlotModel

from app.core.genetic_algorithm import GeneticAlgorithm


async def ensure_periods_and_timeslots(session):
    """Create 15 Periods (0..14) and TimeSlots for days 0..5 if not exist."""
    result = await session.execute(select(PeriodModel))
    existing_periods = result.scalars().all()
    if not existing_periods:
        print("Creating Periods and TimeSlots...")
        # Simple sample times for demo; adjust as needed
        period_times = [
            ("Tiết 1", "06:30", "07:20"),
            ("Tiết 2", "07:25", "08:15"),
            ("Tiết 3", "08:20", "09:10"),
            ("Tiết 4", "09:20", "10:10"),
            ("Tiết 5", "10:15", "11:05"),
            ("Tiết 6", "11:10", "12:00"),
            ("Tiết 7", "12:30", "13:20"),
            ("Tiết 8", "13:25", "14:15"),
            ("Tiết 9", "14:20", "15:10"),
            ("Tiết 10", "15:20", "16:10"),
            ("Tiết 11", "16:15", "17:05"),
            ("Tiết 12", "17:10", "18:00"),
            ("Tiết 13", "18:15", "19:05"),
            ("Tiết 14", "19:10", "20:00"),
            ("Tiết 15", "20:05", "20:55"),
        ]
        for pid, (name, start, end) in enumerate(period_times):
            p = PeriodModel(id=pid, name=name, start_time=start, end_time=end, order_index=pid)
            session.add(p)

        # create timeslots for days 0..5
        for day in range(6):
            for pid in range(len(period_times)):
                ts_id = f"{day}_{pid}"
                ts = TimeSlotModel(id=ts_id, day=day, period_id=pid)
                session.add(ts)

        await session.commit()
        print("Periods and TimeSlots created.")
    else:
        print("Periods exist, skipping creation.")


async def build_input_lists(session):
    """Fetch classes/rooms/teachers and convert them to dict lists expected by GA."""
    # Rooms
    rooms_res = await session.execute(select(RoomModel))
    rooms = rooms_res.scalars().all()
    rooms_list = []
    for r in rooms:
        rooms_list.append({
            'id': r.id,
            'name': r.name,
            'capacity': int(r.capacity),
            'type': r.type.value if hasattr(r.type, 'value') else str(r.type),
        })

    # Teachers
    teachers_res = await session.execute(select(TeacherModel))
    teachers = teachers_res.scalars().all()
    teachers_list = []
    for t in teachers:
        # ensure unavailable_days is a list
        u = t.unavailable_days if t.unavailable_days is not None else []
        teachers_list.append({
            'id': t.id,
            'teacher_code': t.teacher_code,
            'username': t.username,
            'unavailable_days': u,
        })

    # Classes
    classes_res = await session.execute(select(ClassModel))
    classes = classes_res.scalars().all()
    classes_list = []
    for c in classes:
        # find qualified teachers for the class's subject via teacher_subjects table
        q = await session.execute(
            select(TeacherModel.id).select_from(teacher_subjects).where(teacher_subjects.c.subject_id == c.subject_id)
        )
        qualified = [row[0] for row in q.all()]

        classes_list.append({
            'id': c.id,
            'name': c.name,
            'subject_id': c.subject_id,
            'teacher_id': c.teacher_id,
            'number_of_students': int(c.number_of_students),
            'sessions_per_week': int(c.sessions_per_week),
            'room_type': getattr(c, 'room_type', 'theory'),
            'qualified_teachers': qualified or ([c.teacher_id] if c.teacher_id else []),
        })

    return classes_list, rooms_list, teachers_list


async def persist_timetable(session, best_individual, stats_history, config):
    timetable_id = uuid.uuid4().hex
    generation = stats_history[-1]['generation'] if stats_history else 0
    tt = TimetableModel(
        id=timetable_id,
        name=f"GA Demo {timetable_id[:6]}",
        fitness=float(best_individual.fitness),
        generation=generation,
        config=config,
    )
    session.add(tt)

    # Create ScheduleGene rows
    for gene in best_individual.genes:
        sg = ScheduleGeneModel(
            id=uuid.uuid4().hex,
            timetable_id=timetable_id,
            class_id=gene.class_id,
            teacher_id=gene.teacher_id,
            room_id=gene.room_id,
            timeslot_id=f"{gene.time_slot.day}_{gene.time_slot.period}",
            day=gene.time_slot.day,
            period=gene.time_slot.period,
        )
        session.add(sg)

    await session.commit()
    print(f"Persisted timetable {tt.name} (id={timetable_id}) with fitness={tt.fitness:.4f}")
    return timetable_id


async def main_async():
    print("Initializing DB and seeding demo data (if needed)...")
    # initialize DB + seed data
    from app.utils.seed_data import main as seed_main

    # seed_main is async; call it to populate demo data
    await seed_main()

    async with async_session_maker() as session:
        await ensure_periods_and_timeslots(session)

        classes_list, rooms_list, teachers_list = await build_input_lists(session)

        print(f"Loaded {len(classes_list)} classes, {len(rooms_list)} rooms, {len(teachers_list)} teachers")

        # GA configuration (balanced/demo)
        config = {
            'population_size': 250,
            'mutation_rate': 0.1,
            'crossover_rate': 0.8,
            'elitism_rate': 0.12,
            'max_generations': 220,
        }

        ga = GeneticAlgorithm(
            classes=classes_list,
            rooms=rooms_list,
            teachers=teachers_list,
            population_size=config['population_size'],
            mutation_rate=config['mutation_rate'],
            crossover_rate=config['crossover_rate'],
            elitism_rate=config['elitism_rate'],
            max_generations=config['max_generations'],
        )

        def progress_cb(gen, stats, best):
            if gen % 10 == 0:
                print(f"Gen {gen}: best={stats['best_fitness']:.4f}, avg={stats['avg_fitness']:.4f}")

        print("Running Genetic Algorithm (this may take a while)...")
        best_individual, stats_history = ga.run(callback=progress_cb)

        print("GA finished. Best fitness:", best_individual.fitness)

        # persist
        await persist_timetable(session, best_individual, stats_history, config)


def main():
    asyncio.run(main_async())


if __name__ == '__main__':
    main()
