from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_database_session
from backend.app.models.student_section import StudentSection
from backend.app.schemas.student_section import StudentSectionCreate, StudentSectionRead

router = APIRouter(prefix="/sections", tags=["Student Sections"])


@router.post("", response_model=StudentSectionRead, status_code=status.HTTP_201_CREATED)
async def create_section(
    payload: StudentSectionCreate,
    session: AsyncSession = Depends(get_database_session),
):
    sec = StudentSection(
        department_id=payload.department_id,
        program_code=payload.program_code.upper(),
        batch_year=payload.batch_year,
        section_name=payload.section_name.upper(),
        student_count=payload.student_count,
        assigned_classroom_id=payload.assigned_classroom_id,
        semester_id=payload.semester_id,
    )
    session.add(sec)
    try:
        await session.commit()
        await session.refresh(sec)
        return sec
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=f"Student section creation failed: {e}")


@router.get("", response_model=List[StudentSectionRead])
async def list_sections(session: AsyncSession = Depends(get_database_session)):
    stmt = select(StudentSection).order_by(StudentSection.batch_year.desc(), StudentSection.section_name)
    res = await session.execute(stmt)
    return res.scalars().all()

