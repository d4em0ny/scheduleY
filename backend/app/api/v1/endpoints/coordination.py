import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
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
