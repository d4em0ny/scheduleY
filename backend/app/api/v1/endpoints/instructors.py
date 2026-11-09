import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_database_session
from backend.app.models.instructor import Instructor, InstructorQualification, InstructorAvailability
from backend.app.schemas.instructor import (
    InstructorCreate,
    InstructorRead,
    InstructorAvailabilityCreate,
    InstructorAvailabilityRead,
    InstructorWorkloadSummary,
)
from backend.app.services.workload_service import WorkloadService

router = APIRouter(prefix="/instructors", tags=["Instructors & Workload"])


@router.get("", response_model=List[InstructorRead])
async def list_instructors(
    department_id: Optional[uuid.UUID] = Query(None, description="Filter by department ID"),
    session: AsyncSession = Depends(get_database_session),
):
    stmt = select(Instructor).order_by(Instructor.last_name, Instructor.first_name)
    if department_id:
        stmt = stmt.where(Instructor.department_id == department_id)
    result = await session.execute(stmt)
    instructors = result.scalars().all()

    return [
        InstructorRead(
            id=i.id,
            department_id=i.department_id,
            employee_id=i.employee_id,
            first_name=i.first_name,
            last_name=i.last_name,
            email=i.email,
            max_weekly_workload=i.max_weekly_workload,
            is_active=i.is_active,
            qualification_tags=[q.qualification_tag for q in i.qualifications],
        )
        for i in instructors
    ]


@router.post("", response_model=InstructorRead, status_code=status.HTTP_201_CREATED)
async def create_instructor(
    payload: InstructorCreate,
    session: AsyncSession = Depends(get_database_session),
):
    inst = Instructor(
        department_id=payload.department_id,
        employee_id=payload.employee_id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        max_weekly_workload=payload.max_weekly_workload,
        is_active=payload.is_active,
    )
    session.add(inst)
    await session.flush()

    for tag in payload.qualification_tags:
        qual = InstructorQualification(instructor_id=inst.id, qualification_tag=tag.strip().upper())
        session.add(qual)

    try:
        await session.commit()
        await session.refresh(inst)
        return InstructorRead(
            id=inst.id,
            department_id=inst.department_id,
            employee_id=inst.employee_id,
            first_name=inst.first_name,
            last_name=inst.last_name,
            email=inst.email,
            max_weekly_workload=inst.max_weekly_workload,
            is_active=inst.is_active,
            qualification_tags=payload.qualification_tags,
        )
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=f"Instructor creation failed: {e}")


@router.get("/{instructor_id}/workload", response_model=InstructorWorkloadSummary)
async def get_instructor_workload(
    instructor_id: uuid.UUID,
    session: AsyncSession = Depends(get_database_session),
):
    try:
        return await WorkloadService.get_workload_summary(session, instructor_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/availability", response_model=InstructorAvailabilityRead, status_code=status.HTTP_201_CREATED)
async def add_instructor_availability(
    payload: InstructorAvailabilityCreate,
    session: AsyncSession = Depends(get_database_session),
):
    avail = InstructorAvailability(
        instructor_id=payload.instructor_id,
        semester_id=payload.semester_id,
        day_of_week=payload.day_of_week,
        slot_index=payload.slot_index,
        is_available=payload.is_available,
        preference_weight=payload.preference_weight,
    )
    session.add(avail)
    try:
        await session.commit()
        await session.refresh(avail)
        return avail
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=f"Adding availability failed: {e}")

