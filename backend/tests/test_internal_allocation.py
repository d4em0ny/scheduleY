import uuid
from datetime import date
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.department import Department, Building, Classroom
from backend.app.models.semester import AcademicSemester
from backend.app.models.student_section import StudentSection
from backend.app.models.instructor import Instructor, InstructorQualification
from backend.app.models.course import Course, CourseComponent, CourseOffering
from backend.app.models.enums import RoomCategory
from backend.app.services.internal_allocation_service import InternalAllocationService
from backend.app.services.workload_service import WorkloadService


@pytest.mark.asyncio
async def test_internal_allocation_balancing_and_qualifications(db_session: AsyncSession):
    # Department
    dept = Department(code="CS", name="Computer Science")
    db_session.add(dept)
    await db_session.flush()

    # Building & Classroom
    bldg = Building(code="CS-BLDG", name="CS Complex")
    db_session.add(bldg)
    await db_session.flush()

    room = Classroom(
        building_id=bldg.id,
        room_number="101",
        capacity=60,
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
        department_id=dept.id,
        program_code="BSCS",
        batch_year=2024,
        section_name="A",
        student_count=50,
        assigned_classroom_id=room.id,
        semester_id=sem.id,
    )
    db_session.add(sec)
    await db_session.flush()

    # Instructors:
    # Prof Alice: qualified in "AI", max 12.0 load, currently 0 used
    # Prof Bob: qualified in "AI", max 12.0 load, but we will give Bob an existing load of 6.0
    alice = Instructor(
        department_id=dept.id,
        employee_id="CS-001",
        first_name="Alice",
        last_name="Smith",
        email="alice@university.edu",
        max_weekly_workload=12.0,
    )
    bob = Instructor(
        department_id=dept.id,
        employee_id="CS-002",
        first_name="Bob",
        last_name="Jones",
        email="bob@university.edu",
        max_weekly_workload=12.0,
    )
    db_session.add_all([alice, bob])
    await db_session.flush()

    db_session.add_all([
        InstructorQualification(instructor_id=alice.id, qualification_tag="AI"),
        InstructorQualification(instructor_id=bob.id, qualification_tag="AI"),
    ])
    await db_session.flush()

    # Course: Intro to AI (requires "AI" tag)
    ai_course = Course(
        department_id=dept.id,
        code="CS-301",
        title="Intro to Artificial Intelligence",
        credit_hours=3.0,
        required_qualification_tag="AI",
    )
    db_session.add(ai_course)
    await db_session.flush()

    comp = CourseComponent(
        course_id=ai_course.id,
        component_type=RoomCategory.REGULAR_CLASSROOM.value,
        weekly_sessions=2,
        session_duration_slots=1,
        weekly_contact_hours=3.0,
        weekly_teaching_credits=3.0,
    )
    db_session.add(comp)
    await db_session.flush()

    offering = CourseOffering(
        semester_id=sem.id,
        course_id=ai_course.id,
        section_id=sec.id,
    )
    db_session.add(offering)
    await db_session.flush()

    # Pre-load Bob with 6 hours on another course
    dummy_course = Course(department_id=dept.id, code="CS-101", title="Intro to CS", credit_hours=6.0)
    db_session.add(dummy_course)
    await db_session.flush()
    dummy_comp = CourseComponent(
        course_id=dummy_course.id,
        component_type=RoomCategory.REGULAR_CLASSROOM.value,
        weekly_sessions=2,
        session_duration_slots=1,
        weekly_contact_hours=6.0,
        weekly_teaching_credits=6.0,
    )
    db_session.add(dummy_comp)
    await db_session.flush()
    dummy_offering = CourseOffering(semester_id=sem.id, course_id=dummy_course.id, section_id=sec.id)
    db_session.add(dummy_offering)
    await db_session.flush()

    await InternalAllocationService.commit_internal_allocation(
        session=db_session,
        offering_id=dummy_offering.id,
        course_component_id=dummy_comp.id,
        instructor_id=bob.id,
        credited_hours=6.0,
    )

    # Now generate recommendations for Intro to AI
    # Alice has 0% utilization (0/12), Bob has 50% utilization (6/12)
    # The allocation engine must choose Alice because of lower utilization!
    recs = await InternalAllocationService.generate_recommendations(
        session=db_session,
        department_id=dept.id,
        semester_id=sem.id,
    )

    ai_rec = [r for r in recs if r["course_code"] == "CS-301"][0]
    assert ai_rec["status"] == "RECOMMENDED"
    assert ai_rec["recommended_instructor_id"] == alice.id
    assert ai_rec["recommended_instructor_name"] == "Alice Smith"

    # Commit the recommended allocation
    alloc = await InternalAllocationService.commit_internal_allocation(
        session=db_session,
        offering_id=offering.id,
        course_component_id=comp.id,
        instructor_id=alice.id,
        credited_hours=3.0,
    )
    assert alloc.instructor_id == alice.id
    assert alloc.credited_hours == 3.0

    # Alice should now have 3 committed hours
    committed, held = await WorkloadService.calculate_workload_breakdown(db_session, alice.id)
    assert committed == 3.0
    assert held == 0.0
