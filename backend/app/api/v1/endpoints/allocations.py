import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_database_session
from backend.app.services.internal_allocation_service import InternalAllocationService

router = APIRouter(prefix="/allocations", tags=["Instructor Allocations"])


class CommitAllocationRequest(BaseModel):
    offering_id: uuid.UUID
    course_component_id: uuid.UUID
    instructor_id: uuid.UUID
    credited_hours: float


@router.get("/recommendations/{department_id}/{semester_id}", response_model=List[Dict[str, Any]])
async def get_allocation_recommendations(
    department_id: uuid.UUID,
    semester_id: uuid.UUID,
    session: AsyncSession = Depends(get_database_session),
):
    try:
        return await InternalAllocationService.generate_recommendations(
            session=session,
            department_id=department_id,
            semester_id=semester_id,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/commit", status_code=status.HTTP_201_CREATED)
async def commit_allocation(
    payload: CommitAllocationRequest,
    session: AsyncSession = Depends(get_database_session),
):
    try:
        alloc = await InternalAllocationService.commit_internal_allocation(
            session=session,
            offering_id=payload.offering_id,
            course_component_id=payload.course_component_id,
            instructor_id=payload.instructor_id,
            credited_hours=payload.credited_hours,
        )
        await session.commit()
        return {"status": "SUCCESS", "allocation_id": alloc.id}
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))

