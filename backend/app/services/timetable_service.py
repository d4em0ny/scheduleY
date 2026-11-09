import uuid
import time
from typing import List, Dict, Tuple, Optional
from datetime import datetime, timezone
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.semester import AcademicSemester
from backend.app.models.student_section import StudentSection
from backend.app.models.department import Classroom
from backend.app.models.course import Course, CourseOffering, CourseComponent
from backend.app.models.allocation import InstructorAllocation
from backend.app.models.instructor import Instructor
from backend.app.models.timetable import TimetableRun, ScheduledSession
from backend.app.models.enums import SolverStatus, RoomCategory
from backend.app.schemas.timetable import (
    TimetableRunRead,
    ScheduledSessionRead,
    TimetableDiagnosticReport,
    TimetableConflict,
)


class TimetableService:
    @staticmethod
    async def generate_timetable(
        session: AsyncSession,
        semester_id: uuid.UUID,
        name: str = "Fall 2026 Academic Schedule",
    ) -> TimetableRun:
        start_time = time.time()

        # 1. Verify semester exists
        sem_res = await session.execute(select(AcademicSemester).where(AcademicSemester.id == semester_id))
        semester = sem_res.scalar_one_or_none()
        if not semester:
            raise ValueError(f"Semester {semester_id} not found")

        # 2. Fetch sections and classrooms
        sec_res = await session.execute(
            select(StudentSection)
            .where(StudentSection.semester_id == semester_id)
            .options(selectinload(StudentSection.assigned_classroom))
        )
        sections = sec_res.scalars().all()
        if not sections:
            raise ValueError("No student sections registered for this semester")

        # Fetch classrooms
        room_res = await session.execute(select(Classroom))
        all_rooms = room_res.scalars().all()
        lab_rooms = [r for r in all_rooms if r.category == RoomCategory.COMPUTER_LAB.value]
        default_lab = lab_rooms[0] if lab_rooms else all_rooms[0]

        # 3. Fetch course offerings and components
        offering_res = await session.execute(
            select(CourseOffering)
            .where(CourseOffering.semester_id == semester_id)
            .options(
                selectinload(CourseOffering.course).selectinload(Course.components),
                selectinload(CourseOffering.section),
                selectinload(CourseOffering.allocations),
            )
        )
        offerings = offering_res.scalars().all()

        # 4. Fetch instructors
        inst_res = await session.execute(select(Instructor))
        instructors = inst_res.scalars().all()
        instructor_map = {i.id: i for i in instructors}

        # 5. Build session requests to schedule
        # Each request: (offering, component, seq, instructor_id, classroom_id, duration_slots)
        session_requests = []
        for off in offerings:
            course = off.course
            section = off.section
            # Determine instructor
            assigned_inst_id = None
            if off.allocations:
                assigned_inst_id = off.allocations[0].instructor_id
            else:
                # Default to matching department instructor
                dept_insts = [i for i in instructors if i.department_id == section.department_id]
                if dept_insts:
                    assigned_inst_id = dept_insts[0].id
                elif instructors:
                    assigned_inst_id = instructors[0].id

            for comp in course.components:
                # Determine room: Lecture uses section's permanent classroom; Lab uses lab room
                if comp.component_type == RoomCategory.COMPUTER_LAB.value:
                    room_id = default_lab.id
                else:
                    room_id = section.assigned_classroom_id

                for seq in range(1, comp.weekly_sessions + 1):
                    session_requests.append({
                        "offering": off,
                        "component": comp,
                        "sequence": seq,
                        "instructor_id": assigned_inst_id,
                        "classroom_id": room_id,
                        "duration": comp.session_duration_slots,
                        "section_id": section.id,
                        "course_code": course.code,
                        "course_title": course.title,
                        "section_name": f"{section.program_code}-Year {2025 - section.batch_year} Sec {section.section_name}",
                    })

        # 6. Discrete Constraint Solver
        # Days: 1 to 5 (Mon to Fri)
        # Slots: 1 to 8 (Periods 1 to 8)
        scheduled_slots = []
        # Tracking dictionaries for clash detection: (entity_id, day, slot) -> True
        section_time_grid: Dict[Tuple[uuid.UUID, int, int], bool] = {}
        instructor_time_grid: Dict[Tuple[uuid.UUID, int, int], bool] = {}
        classroom_time_grid: Dict[Tuple[uuid.UUID, int, int], bool] = {}
        course_day_tracker: Dict[Tuple[uuid.UUID, int], int] = {}

        for req in session_requests:
            placed = False
            best_day = None
            best_slot = None

            # Sort candidate days: prefer days that don't already have this course scheduled
            preferred_days = sorted(
                range(1, 6),
                key=lambda d: course_day_tracker.get((req["offering"].id, d), 0)
            )

            for d in preferred_days:
                max_start = 8 - req["duration"] + 1
                for s in range(1, max_start + 1):
                    # Check feasibility for all slots in the session duration
                    conflict = False
                    for offset in range(req["duration"]):
                        slot = s + offset
                        # Hard constraint 1: Section non-overlap
                        if (req["section_id"], d, slot) in section_time_grid:
                            conflict = True
                            break
                        # Hard constraint 2: Instructor non-overlap
                        if req["instructor_id"] and (req["instructor_id"], d, slot) in instructor_time_grid:
                            conflict = True
                            break
                        # Hard constraint 3: Classroom non-overlap
                        if (req["classroom_id"], d, slot) in classroom_time_grid:
                            conflict = True
                            break

                    if not conflict:
                        best_day = d
                        best_slot = s
                        placed = True
                        break

                if placed:
                    break

            if placed and best_day and best_slot:
                # Reserve time slots across all entities
                for offset in range(req["duration"]):
                    slot = best_slot + offset
                    section_time_grid[(req["section_id"], best_day, slot)] = True
                    if req["instructor_id"]:
                        instructor_time_grid[(req["instructor_id"], best_day, slot)] = True
                    classroom_time_grid[(req["classroom_id"], best_day, slot)] = True

                course_day_tracker[(req["offering"].id, best_day)] = (
                    course_day_tracker.get((req["offering"].id, best_day), 0) + 1
                )

                scheduled_slots.append({
                    "req": req,
                    "day_of_week": best_day,
                    "start_slot": best_slot,
                })

        duration_ms = int((time.time() - start_time) * 1000)

        # 7. Persist TimetableRun and ScheduledSession records
        solver_status = SolverStatus.OPTIMAL if len(scheduled_slots) == len(session_requests) else SolverStatus.FEASIBLE

        timetable_run = TimetableRun(
            semester_id=semester_id,
            name=name,
            solver_status=solver_status.value,
            objective_value=100.0 * len(scheduled_slots) / max(1, len(session_requests)),
            solve_duration_ms=duration_ms,
            is_published=True,
        )
        session.add(timetable_run)
        await session.flush()

        for slot_info in scheduled_slots:
            req = slot_info["req"]
            sched_session = ScheduledSession(
                timetable_run_id=timetable_run.id,
                offering_id=req["offering"].id,
                course_component_id=req["component"].id,
                session_sequence=req["sequence"],
                instructor_id=req["instructor_id"] if req["instructor_id"] else instructors[0].id,
                classroom_id=req["classroom_id"],
                day_of_week=slot_info["day_of_week"],
                start_slot=slot_info["start_slot"],
                slot_duration=req["duration"],
            )
            session.add(sched_session)

        await session.commit()
        await session.refresh(timetable_run)
        return timetable_run

    @staticmethod
    async def get_latest_timetable(session: AsyncSession, semester_id: Optional[uuid.UUID] = None) -> Optional[TimetableRun]:
        stmt = select(TimetableRun).order_by(TimetableRun.created_at.desc())
        if semester_id:
            stmt = stmt.where(TimetableRun.semester_id == semester_id)
        result = await session.execute(stmt)
        return result.scalars().first()
