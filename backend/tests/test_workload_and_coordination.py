import uuid
from datetime import date, datetime, timezone, timedelta
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.department import Department, Building, Classroom
from backend.app.models.semester import AcademicSemester
from backend.app.models.student_section import StudentSection
from backend.app.models.instructor import Instructor
from backend.app.models.course import Course, CourseComponent, CourseOffering
from backend.app.models.enums import RoomCategory, InterdeptStatus, AllocationType
from backend.app.services.workload_service import WorkloadService
from backend.app.services.coordination_service import CoordinationService


@pytest.fixture
async def sample_academic_data(db_session: AsyncSession):
    # Departments
    cs_dept = Department(code="CS", name="Computer Science")
    math_dept = Department(code="MATH", name="Mathematics")
    db_session.add_all([cs_dept, math_dept])
    await db_session.flush()

    # Building & Classroom
    bldg = Building(code="MAIN", name="Main Academic Building")
    db_session.add(bldg)
    await db_session.flush()

    room = Classroom(
        building_id=bldg.id,
        room_number="201",
        capacity=50,
        category=RoomCategory.REGULAR_CLASSROOM.value,
    )
    db_session.add(room)
    await db_session.flush()

    # Semester
    sem = AcademicSemester(
        code="2026-FALL",
        name="Fall 2026",
        start_date=date(2026, 9, 1),
        end_date=date(2026, 12, 20),
        is_active=True,
    )
    db_session.add(sem)
    await db_session.flush()

    # Section
    sec = StudentSection(
        department_id=cs_dept.id,
        program_code="BSCS",
        batch_year=2024,
        section_name="A",
        student_count=40,
        assigned_classroom_id=room.id,
        semester_id=sem.id,
    )
    db_session.add(sec)
    await db_session.flush()

    # Course in Math that CS needs (e.g. Discrete Math)
    math_course = Course(
        department_id=math_dept.id,
        code="MATH-201",
        title="Discrete Mathematics",
        credit_hours=3.0,
    )
    db_session.add(math_course)
    await db_session.flush()

    comp = CourseComponent(
        course_id=math_course.id,
        component_type=RoomCategory.REGULAR_CLASSROOM.value,
        weekly_sessions=2,
        session_duration_slots=1,
        weekly_contact_hours=3.0,
        weekly_teaching_credits=3.0,
    )
    db_session.add(comp)
    await db_session.flush()

    # Offering in CS Section A for Discrete Math
    offering = CourseOffering(
        semester_id=sem.id,
        course_id=math_course.id,
        section_id=sec.id,
    )
    db_session.add(offering)
    await db_session.flush()

    # Math Instructor with 12 hour limit
    math_prof = Instructor(
        department_id=math_dept.id,
        employee_id="MATH-001",
        first_name="Ada",
        last_name="Lovelace",
        email="ada.lovelace@university.edu",
        max_weekly_workload=12.0,
    )
    db_session.add(math_prof)
    await db_session.flush()

    return {
        "cs_dept": cs_dept,
        "math_dept": math_dept,
        "semester": sem,
        "section": sec,
        "course": math_course,
        "component": comp,
        "offering": offering,
        "instructor": math_prof,
    }


@pytest.mark.asyncio
async def test_workload_hold_and_offer_lifecycle(db_session: AsyncSession, sample_academic_data):
    data = sample_academic_data
    cs_dept = data["cs_dept"]
    math_dept = data["math_dept"]
    sem = data["semester"]
    offering = data["offering"]
    comp = data["component"]
    prof = data["instructor"]

    # 1. Initially, instructor has 0 committed and 0 held hours
    committed, held = await WorkloadService.calculate_workload_breakdown(db_session, prof.id)
    assert committed == 0.0
    assert held == 0.0

    # 2. CS department creates an interdepartmental request
    request = await CoordinationService.create_request(
        session=db_session,
        semester_id=sem.id,
        requesting_dept_id=cs_dept.id,
        supplying_dept_id=math_dept.id,
        offering_id=offering.id,
        course_component_id=comp.id,
        required_hours=3.0,
        dept_code="CS",
    )
    assert request.status == InterdeptStatus.SUBMITTED.value
    assert request.required_hours == 3.0

    # 3. Math department offers Prof Ada Lovelace for 3 hours
    offer = await CoordinationService.create_offer(
        session=db_session,
        request_id=request.id,
        instructor_id=prof.id,
        offered_hours=3.0,
        hold_hours=72,
    )
    assert offer.is_active_hold is True
    assert request.status == InterdeptStatus.OFFERED.value

    # Verify workload now shows 3 held hours
    committed, held = await WorkloadService.calculate_workload_breakdown(db_session, prof.id)
    assert committed == 0.0
    assert held == 3.0

    summary = await WorkloadService.get_workload_summary(db_session, prof.id)
    assert summary.remaining_capacity == 9.0  # 12 - 3

    # 4. CS department accepts the offer
    allocation = await CoordinationService.accept_offer(
        session=db_session,
        offer_id=offer.id,
    )
    assert allocation.instructor_id == prof.id
    assert allocation.credited_hours == 3.0
    assert allocation.allocation_type == AllocationType.INTERDEPARTMENTAL.value
    assert request.status == InterdeptStatus.ACCEPTED.value

    # Workload hold is now released and converted into committed allocation
    committed, held = await WorkloadService.calculate_workload_breakdown(db_session, prof.id)
    assert committed == 3.0
    assert held == 0.0

    summary = await WorkloadService.get_workload_summary(db_session, prof.id)
    assert summary.remaining_capacity == 9.0
    assert not summary.is_overloaded


@pytest.mark.asyncio
async def test_over_allocation_prevention(db_session: AsyncSession, sample_academic_data):
    data = sample_academic_data
    cs_dept = data["cs_dept"]
    math_dept = data["math_dept"]
    sem = data["semester"]
    offering = data["offering"]
    comp = data["component"]
    prof = data["instructor"]  # max_weekly_workload = 12.0

    # Request 1: 10 hours
    req1 = await CoordinationService.create_request(
        session=db_session,
        semester_id=sem.id,
        requesting_dept_id=cs_dept.id,
        supplying_dept_id=math_dept.id,
        offering_id=offering.id,
        course_component_id=comp.id,
        required_hours=10.0,
        dept_code="CS",
    )
    # Offer 1 succeeds: 10 hours held
    await CoordinationService.create_offer(
        session=db_session,
        request_id=req1.id,
        instructor_id=prof.id,
        offered_hours=10.0,
    )

    # Request 2: Another department wants 5 hours (10 + 5 = 15 > 12)
    req2 = await CoordinationService.create_request(
        session=db_session,
        semester_id=sem.id,
        requesting_dept_id=cs_dept.id,
        supplying_dept_id=math_dept.id,
        offering_id=offering.id,
        course_component_id=comp.id,
        required_hours=5.0,
        dept_code="CS",
    )

    # Attempting to offer 5 hours must fail due to capacity exhaustion
    with pytest.raises(ValueError, match="sufficient available workload capacity"):
        await CoordinationService.create_offer(
            session=db_session,
            request_id=req2.id,
            instructor_id=prof.id,
            offered_hours=5.0,
        )


@pytest.mark.asyncio
async def test_offer_rejection_releases_hold(db_session: AsyncSession, sample_academic_data):
    data = sample_academic_data
    cs_dept = data["cs_dept"]
    math_dept = data["math_dept"]
    sem = data["semester"]
    offering = data["offering"]
    comp = data["component"]
    prof = data["instructor"]

    req = await CoordinationService.create_request(
        session=db_session,
        semester_id=sem.id,
        requesting_dept_id=cs_dept.id,
        supplying_dept_id=math_dept.id,
        offering_id=offering.id,
        course_component_id=comp.id,
        required_hours=4.0,
        dept_code="CS",
    )
    offer = await CoordinationService.create_offer(
        session=db_session,
        request_id=req.id,
        instructor_id=prof.id,
        offered_hours=4.0,
    )
    assert (await WorkloadService.calculate_workload_breakdown(db_session, prof.id))[1] == 4.0

    # Reject offer
    await CoordinationService.reject_offer(db_session, offer.id, reason="Schedule mismatch")
    assert req.status == InterdeptStatus.REJECTED.value

    # Held hours must be back to 0
    _, held = await WorkloadService.calculate_workload_breakdown(db_session, prof.id)
    assert held == 0.0


@pytest.mark.asyncio
async def test_create_request_without_explicit_hours(db_session: AsyncSession, sample_academic_data):
    data = sample_academic_data
    cs_dept = data["cs_dept"]
    math_dept = data["math_dept"]
    sem = data["semester"]
    offering = data["offering"]
    comp = data["component"]

    req = await CoordinationService.create_request(
        session=db_session,
        semester_id=sem.id,
        requesting_dept_id=cs_dept.id,
        supplying_dept_id=math_dept.id,
        offering_id=offering.id,
        course_component_id=comp.id,
        dept_code="CS",
    )
    assert req.required_hours == comp.weekly_contact_hours
    assert req.status == InterdeptStatus.SUBMITTED.value

