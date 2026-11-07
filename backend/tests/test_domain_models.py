import uuid
from datetime import date, timedelta
import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.department import Department, Building, Classroom
from backend.app.models.semester import AcademicSemester
from backend.app.models.student_section import StudentSection
from backend.app.models.instructor import Instructor, InstructorQualification
from backend.app.models.course import Course, CourseComponent, CourseOffering
from backend.app.models.enums import RoomCategory


@pytest.mark.asyncio
async def test_create_academic_structure(db_session: AsyncSession):
    # 1. Department
    cs_dept = Department(code="CS", name="Computer Science")
    db_session.add(cs_dept)
    await db_session.flush()

    assert cs_dept.id is not None
    assert cs_dept.code == "CS"

    # 2. Building and Classroom
    hall = Building(code="ENG-1", name="Engineering Hall 1")
    db_session.add(hall)
    await db_session.flush()

    room101 = Classroom(
        building_id=hall.id,
        room_number="101",
        capacity=60,
        category=RoomCategory.REGULAR_CLASSROOM.value,
        department_id=cs_dept.id,
    )
    db_session.add(room101)
    await db_session.flush()

    assert room101.capacity == 60

    # 3. Semester
    fall2026 = AcademicSemester(
        code="2026-FALL",
        name="Fall 2026",
        start_date=date(2026, 9, 1),
        end_date=date(2026, 12, 20),
        is_active=True,
    )
    db_session.add(fall2026)
    await db_session.flush()

    # 4. Student Section with Permanent Classroom Invariant
    section_a = StudentSection(
        department_id=cs_dept.id,
        program_code="BSCS",
        batch_year=2024,
        section_name="A",
        student_count=45,
        assigned_classroom_id=room101.id,
        semester_id=fall2026.id,
    )
    db_session.add(section_a)
    await db_session.flush()

    assert section_a.assigned_classroom_id == room101.id
    assert section_a.student_count == 45


@pytest.mark.asyncio
async def test_instructor_and_course_component_models(db_session: AsyncSession):
    dept = Department(code="MATH", name="Mathematics")
    db_session.add(dept)
    await db_session.flush()

    # Instructor with qualifications
    inst = Instructor(
        department_id=dept.id,
        employee_id="M-101",
        first_name="Alan",
        last_name="Turing",
        email="alan.turing@university.edu",
        max_weekly_workload=12.0,
    )
    db_session.add(inst)
    await db_session.flush()

    qual = InstructorQualification(instructor_id=inst.id, qualification_tag="CALCULUS")
    db_session.add(qual)
    await db_session.flush()

    # Course with lecture and tutorial components
    course = Course(
        department_id=dept.id,
        code="MATH-101",
        title="Calculus I",
        credit_hours=3.0,
        required_qualification_tag="CALCULUS",
    )
    db_session.add(course)
    await db_session.flush()

    lecture_comp = CourseComponent(
        course_id=course.id,
        component_type=RoomCategory.REGULAR_CLASSROOM.value,
        weekly_sessions=2,
        session_duration_slots=1,
        weekly_contact_hours=2.0,
        weekly_teaching_credits=2.0,
    )
    tutorial_comp = CourseComponent(
        course_id=course.id,
        component_type=RoomCategory.SEMINAR_ROOM.value,
        weekly_sessions=1,
        session_duration_slots=1,
        weekly_contact_hours=1.0,
        weekly_teaching_credits=1.0,
    )
    db_session.add_all([lecture_comp, tutorial_comp])
    await db_session.flush()

    assert inst.max_weekly_workload == 12.0
    assert len(course.components) == 2
