import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.interdept import InterdepartmentalRequest, RequestOffer
from backend.app.models.allocation import InstructorAllocation
from backend.app.models.course import CourseOffering, CourseComponent
from backend.app.models.enums import InterdeptStatus, AllocationType
from backend.app.services.workload_service import WorkloadService
from backend.app.core.config import settings


class CoordinationService:
    """
    Manages the interdepartmental negotiation lifecycle and state machine.
    Enforces transactional workload reservations to prevent double-spending instructor capacity.
    """

    @staticmethod
    async def generate_request_number(session: AsyncSession, dept_code: str) -> str:
        timestamp_part = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        random_part = uuid.uuid4().hex[:4].upper()
        return f"REQ-{dept_code}-{timestamp_part}-{random_part}"

    @classmethod
    async def create_request(
        cls,
        session: AsyncSession,
        semester_id: uuid.UUID,
        requesting_dept_id: uuid.UUID,
        supplying_dept_id: uuid.UUID,
        offering_id: uuid.UUID,
        course_component_id: uuid.UUID,
        required_hours: Optional[float] = None,
        required_qualification_tag: Optional[str] = None,
        remarks: Optional[str] = None,
        dept_code: str = "DEPT",
        submit_immediately: bool = True,
    ) -> InterdepartmentalRequest:
        if requesting_dept_id == supplying_dept_id:
            raise ValueError("Requesting department and supplying department cannot be the same")

        if required_hours is None:
            comp_res = await session.execute(
                select(CourseComponent).where(CourseComponent.id == course_component_id)
            )
            comp = comp_res.scalar_one_or_none()
            if not comp:
                raise ValueError("Course component not found and required_hours not specified")
            required_hours = comp.weekly_contact_hours

        if required_hours <= 0:
            raise ValueError("Required hours must be strictly positive")

        req_num = await cls.generate_request_number(session, dept_code)
        initial_status = InterdeptStatus.SUBMITTED.value if submit_immediately else InterdeptStatus.DRAFT.value

        request = InterdepartmentalRequest(
            request_number=req_num,
            semester_id=semester_id,
            requesting_dept_id=requesting_dept_id,
            supplying_dept_id=supplying_dept_id,
            offering_id=offering_id,
            course_component_id=course_component_id,
            required_hours=required_hours,
            required_qualification_tag=required_qualification_tag,
            remarks=remarks,
            status=initial_status,
        )
        session.add(request)
        await session.flush()
        return request

    @classmethod
    async def create_offer(
        cls,
        session: AsyncSession,
        request_id: uuid.UUID,
        instructor_id: uuid.UUID,
        offered_hours: float,
        hold_hours: Optional[int] = None,
    ) -> RequestOffer:
        """
        Supplying department offers an instructor.
        Acquires row lock on instructor, validates capacity headroom,
        creates an active WorkloadHold, and transitions request to OFFERED.
        """
        if offered_hours <= 0:
            raise ValueError("Offered hours must be strictly positive")

        # 1. Fetch request and validate state
        req_stmt = select(InterdepartmentalRequest).where(InterdepartmentalRequest.id == request_id)
        res = await session.execute(req_stmt)
        request = res.scalar_one_or_none()
        if not request:
            raise ValueError(f"Request {request_id} not found")

        if request.status not in (InterdeptStatus.SUBMITTED.value, InterdeptStatus.UNDER_REVIEW.value):
            raise ValueError(f"Cannot offer instructor for request in status '{request.status}'")

        # 2. Transactionally validate instructor capacity with pessimistic lock
        has_capacity = await WorkloadService.validate_capacity_available(
            session=session,
            instructor_id=instructor_id,
            additional_hours=offered_hours,
            use_lock=True,
        )
        if not has_capacity:
            raise ValueError("Instructor does not have sufficient available workload capacity")

        # 3. Create active hold
        duration = hold_hours or settings.DEFAULT_INTERDEPT_HOLD_HOURS
        expires_at = datetime.now(timezone.utc) + timedelta(hours=duration)

        offer = RequestOffer(
            request_id=request_id,
            instructor_id=instructor_id,
            offered_hours=offered_hours,
            hold_expires_at=expires_at,
            is_active_hold=True,
        )
        session.add(offer)

        # 4. Transition request status
        request.status = InterdeptStatus.OFFERED.value
        request.updated_at = datetime.now(timezone.utc)
        await session.flush()
        return offer

    @classmethod
    async def accept_offer(
        cls,
        session: AsyncSession,
        offer_id: uuid.UUID,
    ) -> InstructorAllocation:
        """
        Requesting department accepts the offer.
        Validates hold is active and unexpired, releases hold, commits confirmed allocation,
        and transitions request status to ACCEPTED.
        """
        stmt = (
            select(RequestOffer)
            .where(RequestOffer.id == offer_id)
            .with_for_update()
        )
        res = await session.execute(stmt)
        offer = res.scalar_one_or_none()
        if not offer:
            raise ValueError(f"Offer {offer_id} not found")

        now = datetime.now(timezone.utc)
        if not offer.is_active_hold or offer.hold_expires_at <= now:
            raise ValueError("Offer hold has expired or is no longer active")

        request = offer.request
        if request.status != InterdeptStatus.OFFERED.value:
            raise ValueError(f"Request is in status '{request.status}', cannot accept offer")

        # 1. Convert hold into confirmed allocation
        allocation = InstructorAllocation(
            offering_id=request.offering_id,
            course_component_id=request.course_component_id,
            instructor_id=offer.instructor_id,
            allocation_type=AllocationType.INTERDEPARTMENTAL.value,
            credited_hours=offer.offered_hours,
            is_confirmed=True,
        )
        session.add(allocation)

        # 2. Deactivate hold
        offer.is_active_hold = False
        offer.decision_at = now

        # 3. Update request status
        request.status = InterdeptStatus.ACCEPTED.value
        request.updated_at = now
        await session.flush()
        return allocation

    @classmethod
    async def reject_offer(
        cls,
        session: AsyncSession,
        offer_id: uuid.UUID,
        reason: Optional[str] = None,
    ) -> RequestOffer:
        """
        Requesting department declines the offer. Releases the hold immediately.
        """
        stmt = (
            select(RequestOffer)
            .where(RequestOffer.id == offer_id)
            .with_for_update()
        )
        res = await session.execute(stmt)
        offer = res.scalar_one_or_none()
        if not offer:
            raise ValueError(f"Offer {offer_id} not found")

        now = datetime.now(timezone.utc)
        offer.is_active_hold = False
        offer.decision_at = now

        request = offer.request
        request.status = InterdeptStatus.REJECTED.value
        request.updated_at = now
        if reason:
            request.remarks = f"{request.remarks or ''}\nRejection reason: {reason}".strip()

        await session.flush()
        return offer

    @classmethod
    async def expire_stale_holds(cls, session: AsyncSession) -> int:
        """
        Housekeeping task: releases holds that passed their expiration time
        and marks associated requests as EXPIRED.
        """
        now = datetime.now(timezone.utc)
        stmt = (
            select(RequestOffer)
            .where(
                RequestOffer.is_active_hold.is_(True),
                RequestOffer.hold_expires_at <= now,
            )
            .with_for_update()
        )
        res = await session.execute(stmt)
        stale_offers = res.scalars().all()

        count = 0
        for offer in stale_offers:
            offer.is_active_hold = False
            offer.decision_at = now
            if offer.request.status == InterdeptStatus.OFFERED.value:
                offer.request.status = InterdeptStatus.EXPIRED.value
                offer.request.updated_at = now
            count += 1

        if count > 0:
            await session.flush()
        return count

