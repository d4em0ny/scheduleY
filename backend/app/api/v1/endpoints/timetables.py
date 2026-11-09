import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_database_session
from backend.app.models.timetable import TimetableRun, ScheduledSession
from backend.app.models.semester import AcademicSemester
from backend.app.schemas.timetable import (
    TimetableRunCreate,
    TimetableRunRead,
    ScheduledSessionRead,
)
from backend.app.services.timetable_service import TimetableService

router = APIRouter(prefix="/timetables", tags=["Timetables & Scheduling"])


@router.post("/generate", response_model=TimetableRunRead, status_code=status.HTTP_201_CREATED)
async def generate_timetable(
    semester_id: Optional[uuid.UUID] = Query(None, description="Target semester ID. Defaults to active semester if omitted."),
    name: str = Query("Fall 2026 Academic Schedule", description="Name of the timetable run"),
    session: AsyncSession = Depends(get_database_session),
):
    try:
        # If semester_id not provided, find active semester
        if not semester_id:
            sem_res = await session.execute(
                select(AcademicSemester).where(AcademicSemester.is_active.is_(True))
            )
            active_sem = sem_res.scalar_one_or_none()
            if not active_sem:
                raise HTTPException(status_code=404, detail="No active academic semester found")
            semester_id = active_sem.id

        run = await TimetableService.generate_timetable(
            session=session,
            semester_id=semester_id,
            name=name,
        )

        # Reload with sessions and related entities
        res = await session.execute(
            select(TimetableRun)
            .where(TimetableRun.id == run.id)
            .options(
                selectinload(TimetableRun.sessions).selectinload(ScheduledSession.offering),
                selectinload(TimetableRun.sessions).selectinload(ScheduledSession.component),
                selectinload(TimetableRun.sessions).selectinload(ScheduledSession.instructor),
                selectinload(TimetableRun.sessions).selectinload(ScheduledSession.classroom),
            )
        )
        loaded_run = res.scalar_one()

        session_reads = []
        for s in loaded_run.sessions:
            session_reads.append(
                ScheduledSessionRead(
                    id=s.id,
                    timetable_run_id=s.timetable_run_id,
                    offering_id=s.offering_id,
                    course_component_id=s.course_component_id,
                    session_sequence=s.session_sequence,
                    instructor_id=s.instructor_id,
                    classroom_id=s.classroom_id,
                    day_of_week=s.day_of_week,
                    start_slot=s.start_slot,
                    slot_duration=s.slot_duration,
                    course_code=s.offering.course.code if s.offering and s.offering.course else None,
                    course_title=s.offering.course.title if s.offering and s.offering.course else None,
                    section_name=f"{s.offering.section.program_code}-Sec {s.offering.section.section_name}"
                    if s.offering and s.offering.section
                    else None,
                    instructor_name=f"Dr. {s.instructor.first_name} {s.instructor.last_name}"
                    if s.instructor
                    else None,
                    room_number=f"Room {s.classroom.room_number}" if s.classroom else None,
                )
            )

        return TimetableRunRead(
            id=loaded_run.id,
            semester_id=loaded_run.semester_id,
            name=loaded_run.name,
            solver_status=loaded_run.solver_status,
            objective_value=loaded_run.objective_value,
            solve_duration_ms=loaded_run.solve_duration_ms,
            is_published=loaded_run.is_published,
            created_at=loaded_run.created_at,
            sessions=session_reads,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/latest", response_model=Optional[TimetableRunRead])
async def get_latest_timetable(
    semester_id: Optional[uuid.UUID] = Query(None),
    session: AsyncSession = Depends(get_database_session),
):
    stmt = (
        select(TimetableRun)
        .order_by(TimetableRun.created_at.desc())
        .options(
            selectinload(TimetableRun.sessions).selectinload(ScheduledSession.offering),
            selectinload(TimetableRun.sessions).selectinload(ScheduledSession.component),
            selectinload(TimetableRun.sessions).selectinload(ScheduledSession.instructor),
            selectinload(TimetableRun.sessions).selectinload(ScheduledSession.classroom),
        )
    )
    if semester_id:
        stmt = stmt.where(TimetableRun.semester_id == semester_id)

    result = await session.execute(stmt)
    run = result.scalars().first()
    if not run:
        return None

    session_reads = []
    for s in run.sessions:
        session_reads.append(
            ScheduledSessionRead(
                id=s.id,
                timetable_run_id=s.timetable_run_id,
                offering_id=s.offering_id,
                course_component_id=s.course_component_id,
                session_sequence=s.session_sequence,
                instructor_id=s.instructor_id,
                classroom_id=s.classroom_id,
                day_of_week=s.day_of_week,
                start_slot=s.start_slot,
                slot_duration=s.slot_duration,
                course_code=s.offering.course.code if s.offering and s.offering.course else None,
                course_title=s.offering.course.title if s.offering and s.offering.course else None,
                section_name=f"{s.offering.section.program_code}-Sec {s.offering.section.section_name}"
                if s.offering and s.offering.section
                else None,
                instructor_name=f"Dr. {s.instructor.first_name} {s.instructor.last_name}"
                if s.instructor
                else None,
                room_number=f"Room {s.classroom.room_number}" if s.classroom else None,
            )
        )

    return TimetableRunRead(
        id=run.id,
        semester_id=run.semester_id,
        name=run.name,
        solver_status=run.solver_status,
        objective_value=run.objective_value,
        solve_duration_ms=run.solve_duration_ms,
        is_published=run.is_published,
        created_at=run.created_at,
        sessions=session_reads,
    )

