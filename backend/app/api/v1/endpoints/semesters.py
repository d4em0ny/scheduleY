from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_database_session
from backend.app.models.semester import AcademicSemester
from backend.app.schemas.semester import SemesterCreate, SemesterRead

router = APIRouter(prefix="/semesters", tags=["Academic Semesters"])


@router.post("", response_model=SemesterRead, status_code=status.HTTP_201_CREATED)
async def create_semester(
    payload: SemesterCreate,
    session: AsyncSession = Depends(get_database_session),
):
    sem = AcademicSemester(
        code=payload.code.upper(),
        name=payload.name,
        start_date=payload.start_date,
        end_date=payload.end_date,
        is_active=payload.is_active,
    )
    session.add(sem)
    try:
        await session.commit()
        await session.refresh(sem)
        return sem
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=f"Semester creation failed: {e}")


@router.get("", response_model=List[SemesterRead])
async def list_semesters(session: AsyncSession = Depends(get_database_session)):
    stmt = select(AcademicSemester).order_by(AcademicSemester.start_date.desc())
    res = await session.execute(stmt)
    return res.scalars().all()

