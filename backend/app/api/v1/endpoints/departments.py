import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_database_session
from backend.app.models.department import Department, Building, Classroom
from backend.app.schemas.department import (
    DepartmentCreate,
    DepartmentRead,
    BuildingCreate,
    BuildingRead,
    ClassroomCreate,
    ClassroomRead,
)

router = APIRouter(prefix="/departments", tags=["Departments & Facilities"])


@router.post("", response_model=DepartmentRead, status_code=status.HTTP_201_CREATED)
async def create_department(
    payload: DepartmentCreate,
    session: AsyncSession = Depends(get_database_session),
):
    dept = Department(code=payload.code.upper(), name=payload.name)
    session.add(dept)
    try:
        await session.commit()
        await session.refresh(dept)
        return dept
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=f"Department creation failed: {e}")


@router.get("", response_model=List[DepartmentRead])
async def list_departments(session: AsyncSession = Depends(get_database_session)):
    stmt = select(Department).order_by(Department.code)
    res = await session.execute(stmt)
    return res.scalars().all()


@router.post("/buildings", response_model=BuildingRead, status_code=status.HTTP_201_CREATED)
async def create_building(
    payload: BuildingCreate,
    session: AsyncSession = Depends(get_database_session),
):
    bldg = Building(code=payload.code.upper(), name=payload.name)
    session.add(bldg)
    try:
        await session.commit()
        await session.refresh(bldg)
        return bldg
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=f"Building creation failed: {e}")


@router.post("/classrooms", response_model=ClassroomRead, status_code=status.HTTP_201_CREATED)
async def create_classroom(
    payload: ClassroomCreate,
    session: AsyncSession = Depends(get_database_session),
):
    room = Classroom(
        building_id=payload.building_id,
        room_number=payload.room_number,
        capacity=payload.capacity,
        category=payload.category.value,
        is_schedulable=payload.is_schedulable,
        department_id=payload.department_id,
    )
    session.add(room)
    try:
        await session.commit()
        await session.refresh(room)
        return room
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=f"Classroom creation failed: {e}")
