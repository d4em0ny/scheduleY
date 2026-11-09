import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_database_session
from backend.app.models.course import Course, CourseComponent, CourseOffering
from backend.app.models.student_section import StudentSection
from backend.app.models.department import Department
from backend.app.models.enums import RoomCategory
from backend.app.schemas.course import (
    CourseCreate,
    CourseRead,
    CourseOfferingCreate,
    CourseOfferingRead,
)

router = APIRouter(prefix="/courses", tags=["Courses & Offerings"])


@router.get("", response_model=List[CourseRead])
async def list_courses(
    department_id: Optional[uuid.UUID] = Query(None, description="Filter by department ID"),
    session: AsyncSession = Depends(get_database_session),
):
    stmt = select(Course).order_by(Course.code)
    if department_id:
        stmt = stmt.where(Course.department_id == department_id)
    result = await session.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=CourseRead, status_code=status.HTTP_201_CREATED)
async def create_course(
    payload: CourseCreate,
    session: AsyncSession = Depends(get_database_session),
):
    course = Course(
        department_id=payload.department_id,
        code=payload.code.strip().upper(),
        title=payload.title.strip(),
        credit_hours=payload.credit_hours,
        required_qualification_tag=payload.required_qualification_tag.strip().upper()
        if payload.required_qualification_tag
        else None,
    )
    session.add(course)
    await session.flush()

    for comp in payload.components:
        c_component = CourseComponent(
            course_id=course.id,
            component_type=comp.component_type.value
            if hasattr(comp.component_type, "value")
            else str(comp.component_type),
            weekly_sessions=comp.weekly_sessions,
            session_duration_slots=comp.session_duration_slots,
            weekly_contact_hours=comp.weekly_contact_hours,
            weekly_teaching_credits=comp.weekly_teaching_credits,
        )
        session.add(c_component)

    try:
        await session.commit()
        await session.refresh(course)
        return course
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=f"Course creation failed: {e}")


@router.get("/offerings", response_model=List[CourseOfferingRead])
async def list_offerings(
    semester_id: Optional[uuid.UUID] = Query(None),
    section_id: Optional[uuid.UUID] = Query(None),
    department_id: Optional[uuid.UUID] = Query(None),
    batch_year: Optional[int] = Query(None),
    session: AsyncSession = Depends(get_database_session),
):
    stmt = (
        select(CourseOffering)
        .join(CourseOffering.section)
        .join(CourseOffering.course)
        .order_by(Course.code)
    )
    if semester_id:
        stmt = stmt.where(CourseOffering.semester_id == semester_id)
    if section_id:
        stmt = stmt.where(CourseOffering.section_id == section_id)
    if department_id:
        stmt = stmt.where(StudentSection.department_id == department_id)
    if batch_year:
        stmt = stmt.where(StudentSection.batch_year == batch_year)

    result = await session.execute(stmt)
    return result.scalars().all()


@router.post("/offerings", response_model=CourseOfferingRead, status_code=status.HTTP_201_CREATED)
async def create_offering(
    payload: CourseOfferingCreate,
    session: AsyncSession = Depends(get_database_session),
):
    offering = CourseOffering(
        semester_id=payload.semester_id,
        course_id=payload.course_id,
        section_id=payload.section_id,
    )
    session.add(offering)
    try:
        await session.commit()
        await session.refresh(offering)
        return offering
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=f"Offering creation failed: {e}")

