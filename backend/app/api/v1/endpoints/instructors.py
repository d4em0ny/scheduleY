import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
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
