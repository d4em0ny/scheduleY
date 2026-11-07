import uuid
from datetime import datetime, timezone
from typing import Tuple, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.instructor import Instructor
from backend.app.models.allocation import InstructorAllocation
from backend.app.models.interdept import RequestOffer
from backend.app.schemas.instructor import InstructorWorkloadSummary


class WorkloadService:
    """
    Manages and enforces university-wide instructor workload policies.
    Guarantees concurrency safety against over-allocation using row-level locking.
    """

    @staticmethod
    async def get_instructor_with_lock(
        session: AsyncSession,
        instructor_id: uuid.UUID
    ) -> Optional[Instructor]:
        """
        Retrieves an instructor with a SELECT FOR UPDATE row lock to serialize
        concurrent allocation and offer operations.
        """
        stmt = (
            select(Instructor)
            .where(Instructor.id == instructor_id)
            .with_for_update()
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def calculate_workload_breakdown(
        session: AsyncSession,
        instructor_id: uuid.UUID
    ) -> Tuple[float, float]:
        """
        Calculates:
        1. Committed teaching hours (from confirmed allocations)
        2. Active held hours (from unexpired offers in interdepartmental requests)
        """
        now = datetime.now(timezone.utc)

        # 1. Sum committed hours
        committed_stmt = (
            select(func.coalesce(func.sum(InstructorAllocation.credited_hours), 0.0))
            .where(
                InstructorAllocation.instructor_id == instructor_id,
                InstructorAllocation.is_confirmed.is_(True),
            )
        )
        committed_result = await session.execute(committed_stmt)
        committed_hours = float(committed_result.scalar_one())

        # 2. Sum active, unexpired holds
        held_stmt = (
            select(func.coalesce(func.sum(RequestOffer.offered_hours), 0.0))
            .where(
                RequestOffer.instructor_id == instructor_id,
                RequestOffer.is_active_hold.is_(True),
                RequestOffer.hold_expires_at > now,
            )
        )
        held_result = await session.execute(held_stmt)
        held_hours = float(held_result.scalar_one())

        return committed_hours, held_hours

    @classmethod
    async def get_workload_summary(
        cls,
        session: AsyncSession,
        instructor_id: uuid.UUID
    ) -> InstructorWorkloadSummary:
        """
        Generates a comprehensive workload snapshot for an instructor.
        """
        stmt = (
            select(Instructor)
            .where(Instructor.id == instructor_id)
        )
        result = await session.execute(stmt)
        instructor = result.scalar_one_or_none()
        if not instructor:
            raise ValueError(f"Instructor {instructor_id} not found")

        committed_hours, held_hours = await cls.calculate_workload_breakdown(session, instructor_id)
        total_used = committed_hours + held_hours
        remaining = max(0.0, instructor.max_weekly_workload - total_used)

        return InstructorWorkloadSummary(
            instructor_id=instructor.id,
            employee_id=instructor.employee_id,
            full_name=f"{instructor.first_name} {instructor.last_name}",
            department_code=instructor.department.code if instructor.department else "UNKNOWN",
            max_weekly_workload=instructor.max_weekly_workload,
            committed_hours=committed_hours,
            held_hours=held_hours,
            remaining_capacity=remaining,
            is_overloaded=total_used > instructor.max_weekly_workload,
        )

    @classmethod
    async def validate_capacity_available(
        cls,
        session: AsyncSession,
        instructor_id: uuid.UUID,
        additional_hours: float,
        use_lock: bool = True,
    ) -> bool:
        """
        Validates whether an instructor can take on additional hours without
        violating their maximum weekly workload limit.
        """
        if additional_hours <= 0:
            raise ValueError("Additional hours must be strictly positive")

        if use_lock:
            instructor = await cls.get_instructor_with_lock(session, instructor_id)
        else:
            stmt = select(Instructor).where(Instructor.id == instructor_id)
            res = await session.execute(stmt)
            instructor = res.scalar_one_or_none()

        if not instructor:
            raise ValueError(f"Instructor {instructor_id} not found")

        committed_hours, held_hours = await cls.calculate_workload_breakdown(session, instructor_id)
        projected_total = committed_hours + held_hours + additional_hours

        return projected_total <= (instructor.max_weekly_workload + 1e-6)
