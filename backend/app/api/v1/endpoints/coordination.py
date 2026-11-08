import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_database_session
from backend.app.models.interdept import InterdepartmentalRequest
from backend.app.schemas.interdept import (
    InterdeptRequestCreate,
    InterdeptRequestRead,
    OfferCreate,
    OfferRead,
)
from backend.app.services.coordination_service import CoordinationService

router = APIRouter(prefix="/coordination", tags=["Interdepartmental Coordination"])


@router.get("/requests", response_model=List[InterdeptRequestRead])
async def list_requests(
    dept_id: Optional[uuid.UUID] = Query(None, description="Department ID to scope requests"),
    direction: Optional[str] = Query("all", description="Direction: incoming, outgoing, or all"),
    session: AsyncSession = Depends(get_database_session),
):
    stmt = select(InterdepartmentalRequest).order_by(InterdepartmentalRequest.created_at.desc())
    if dept_id:
        if direction == "incoming":
            stmt = stmt.where(InterdepartmentalRequest.supplying_dept_id == dept_id)
        elif direction == "outgoing":
            stmt = stmt.where(InterdepartmentalRequest.requesting_dept_id == dept_id)
        else:
            stmt = stmt.where(
                or_(
                    InterdepartmentalRequest.requesting_dept_id == dept_id,
                    InterdepartmentalRequest.supplying_dept_id == dept_id,
                )
            )
    result = await session.execute(stmt)
    return result.scalars().all()


@router.post("/requests", response_model=InterdeptRequestRead, status_code=status.HTTP_201_CREATED)
async def submit_request(
    payload: InterdeptRequestCreate,
    session: AsyncSession = Depends(get_database_session),
):
    try:
        req = await CoordinationService.create_request(
            session=session,
            semester_id=payload.semester_id,
            requesting_dept_id=payload.requesting_dept_id,
            supplying_dept_id=payload.supplying_dept_id,
            offering_id=payload.offering_id,
            course_component_id=payload.course_component_id,
            required_hours=payload.required_hours,
            required_qualification_tag=payload.required_qualification_tag,
            remarks=payload.remarks,
            submit_immediately=True,
        )
        await session.commit()
        await session.refresh(req)
        return req
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/offers", response_model=OfferRead, status_code=status.HTTP_201_CREATED)
async def make_offer(
    payload: OfferCreate,
    session: AsyncSession = Depends(get_database_session),
):
    try:
        offer = await CoordinationService.create_offer(
            session=session,
            request_id=payload.request_id,
            instructor_id=payload.instructor_id,
            offered_hours=payload.offered_hours,
            hold_hours=payload.hold_hours,
        )
        await session.commit()
        await session.refresh(offer)
        return offer
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/offers/{offer_id}/accept", status_code=status.HTTP_200_OK)
async def accept_offer(
    offer_id: uuid.UUID,
    session: AsyncSession = Depends(get_database_session),
):
    try:
        allocation = await CoordinationService.accept_offer(session=session, offer_id=offer_id)
        await session.commit()
        return {"status": "SUCCESS", "message": "Offer accepted and workload committed", "allocation_id": allocation.id}
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/offers/{offer_id}/reject", status_code=status.HTTP_200_OK)
async def reject_offer(
    offer_id: uuid.UUID,
    reason: str = "Offer declined by requesting department",
    session: AsyncSession = Depends(get_database_session),
):
    try:
        await CoordinationService.reject_offer(session=session, offer_id=offer_id, reason=reason)
        await session.commit()
        return {"status": "SUCCESS", "message": "Offer rejected and workload hold released"}
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))

