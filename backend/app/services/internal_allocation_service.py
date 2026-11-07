import uuid
from typing import List, Dict, Any, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.course import CourseOffering, CourseComponent, Course
from backend.app.models.instructor import Instructor, InstructorQualification
from backend.app.models.allocation import InstructorAllocation
from backend.app.models.enums import AllocationType
from backend.app.services.workload_service import WorkloadService


class InternalAllocationService:
    """
    Automated matching engine for assigning departmental instructors to internal course offerings.
    Considers qualifications, teaching credit requirements, and balances workload distribution.
    """

    @classmethod
    async def generate_recommendations(
        cls,
        session: AsyncSession,
        department_id: uuid.UUID,
        semester_id: uuid.UUID,
    ) -> List[Dict[str, Any]]:
        """
        Generates recommended internal assignments for all unallocated course components in the department.
        Does NOT commit changes until the department chair approves.
        """
        # 1. Fetch all offerings for this department and semester
        stmt = (
            select(CourseOffering)
            .join(Course)
            .where(
                CourseOffering.semester_id == semester_id,
                Course.department_id == department_id,
            )
            .options(
                selectinload(CourseOffering.course).selectinload(Course.components),
                selectinload(CourseOffering.allocations),
                selectinload(CourseOffering.section),
            )
        )
        res = await session.execute(stmt)
        offerings = res.scalars().all()

        # 2. Fetch all active instructors in this department with qualifications
        inst_stmt = (
            select(Instructor)
            .where(
                Instructor.department_id == department_id,
                Instructor.is_active.is_(True),
            )
            .options(selectinload(Instructor.qualifications))
        )
        inst_res = await session.execute(inst_stmt)
        instructors = inst_res.scalars().all()

        # Build in-memory workload trackers
        inst_load: Dict[uuid.UUID, float] = {}
        for inst in instructors:
            committed, held = await WorkloadService.calculate_workload_breakdown(session, inst.id)
            inst_load[inst.id] = committed + held

        recommendations = []

        for offering in offerings:
            allocated_component_ids = {a.course_component_id for a in offering.allocations if a.is_confirmed}

            for comp in offering.course.components:
                if comp.id in allocated_component_ids:
                    continue  # Already allocated

                required_credits = comp.weekly_teaching_credits
                required_tag = offering.course.required_qualification_tag

                # Find candidate instructors
                candidates = []
                for inst in instructors:
                    # Check qualification
                    has_qual = True
                    if required_tag:
                        inst_tags = {q.qualification_tag for q in inst.qualifications}
                        has_qual = required_tag in inst_tags

                    if not has_qual:
                        continue

                    # Check workload capacity
                    current_used = inst_load[inst.id]
                    if (current_used + required_credits) <= (inst.max_weekly_workload + 1e-6):
                        utilization = current_used / inst.max_weekly_workload
                        candidates.append((utilization, inst))

                # Sort candidates by lowest workload utilization first (workload balancing)
                candidates.sort(key=lambda x: x[0])

                if candidates:
                    chosen_util, chosen_inst = candidates[0]
                    # Tentatively update virtual load for sequential recommendation
                    inst_load[chosen_inst.id] += required_credits

                    recommendations.append({
                        "offering_id": offering.id,
                        "course_code": offering.course.code,
                        "course_title": offering.course.title,
                        "section_name": offering.section.section_name,
                        "course_component_id": comp.id,
                        "component_type": comp.component_type,
                        "credited_hours": required_credits,
                        "recommended_instructor_id": chosen_inst.id,
                        "recommended_instructor_name": f"{chosen_inst.first_name} {chosen_inst.last_name}",
                        "instructor_utilization_after": inst_load[chosen_inst.id] / chosen_inst.max_weekly_workload,
                        "status": "RECOMMENDED",
                    })
                else:
                    recommendations.append({
                        "offering_id": offering.id,
                        "course_code": offering.course.code,
                        "course_title": offering.course.title,
                        "section_name": offering.section.section_name,
                        "course_component_id": comp.id,
                        "component_type": comp.component_type,
                        "credited_hours": required_credits,
                        "recommended_instructor_id": None,
                        "recommended_instructor_name": None,
                        "status": "NO_CAPACITY_OR_QUALIFICATION",
                    })

        return recommendations

    @classmethod
    async def commit_internal_allocation(
        cls,
        session: AsyncSession,
        offering_id: uuid.UUID,
        course_component_id: uuid.UUID,
        instructor_id: uuid.UUID,
        credited_hours: float,
    ) -> InstructorAllocation:
        """
        Commits an approved internal instructor allocation within an atomic transaction.
        """
        has_capacity = await WorkloadService.validate_capacity_available(
            session=session,
            instructor_id=instructor_id,
            additional_hours=credited_hours,
            use_lock=True,
        )
        if not has_capacity:
            raise ValueError("Instructor does not have sufficient workload capacity to commit this allocation")

        allocation = InstructorAllocation(
            offering_id=offering_id,
            course_component_id=course_component_id,
            instructor_id=instructor_id,
            allocation_type=AllocationType.INTERNAL.value,
            credited_hours=credited_hours,
            is_confirmed=True,
        )
        session.add(allocation)
        await session.flush()
        return allocation

