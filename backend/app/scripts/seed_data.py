import asyncio
import uuid
from datetime import date, datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import AsyncSessionLocal, engine, Base
from backend.app.models.department import Department, Building, Classroom
from backend.app.models.semester import AcademicSemester
from backend.app.models.student_section import StudentSection
from backend.app.models.instructor import Instructor, InstructorQualification, InstructorAvailability
from backend.app.models.course import Course, CourseComponent, CourseOffering
from backend.app.models.enums import RoomCategory


async def seed_university_data():
    print("🌱 Starting university seed data generation...")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # 1. Departments
        cs_dept = Department(code="CS", name="Department of Computer Science")
        math_dept = Department(code="MATH", name="Department of Mathematics")
        ece_dept = Department(code="ECE", name="Department of Electrical & Computer Engineering")
        session.add_all([cs_dept, math_dept, ece_dept])
        await session.flush()

        # 2. Buildings & Classrooms
        eng_bldg = Building(code="ENG-1", name="Engineering Hall 1")
        sci_bldg = Building(code="SCI-1", name="Science Complex")
        session.add_all([eng_bldg, sci_bldg])
        await session.flush()

        # Classrooms
        room101 = Classroom(
            building_id=eng_bldg.id, room_number="101", capacity=60,
            category=RoomCategory.REGULAR_CLASSROOM.value, department_id=cs_dept.id
        )
        room102 = Classroom(
            building_id=eng_bldg.id, room_number="102", capacity=60,
            category=RoomCategory.REGULAR_CLASSROOM.value, department_id=cs_dept.id
        )
        room103 = Classroom(
            building_id=eng_bldg.id, room_number="103", capacity=50,
            category=RoomCategory.REGULAR_CLASSROOM.value, department_id=ece_dept.id
        )
        comp_lab = Classroom(
            building_id=eng_bldg.id, room_number="LAB-201", capacity=40,
            category=RoomCategory.COMPUTER_LAB.value, department_id=cs_dept.id
        )
        session.add_all([room101, room102, room103, comp_lab])
        await session.flush()

        # 3. Semester
        fall_sem = AcademicSemester(
            code="2026-FALL",
            name="Fall Semester 2026",
            start_date=date(2026, 9, 1),
            end_date=date(2026, 12, 23),
            is_active=True,
        )
        session.add(fall_sem)
        await session.flush()

        # 4. Student Sections (with permanent assigned classrooms)
        cs_sec_a = StudentSection(
            department_id=cs_dept.id,
            program_code="BSCS",
            batch_year=2024,
            section_name="A",
            student_count=45,
            assigned_classroom_id=room101.id,
            semester_id=fall_sem.id,
        )
        cs_sec_b = StudentSection(
            department_id=cs_dept.id,
            program_code="BSCS",
            batch_year=2024,
            section_name="B",
            student_count=42,
            assigned_classroom_id=room102.id,
            semester_id=fall_sem.id,
        )
        ece_sec_a = StudentSection(
            department_id=ece_dept.id,
            program_code="BSECE",
            batch_year=2024,
            section_name="A",
            student_count=38,
            assigned_classroom_id=room103.id,
            semester_id=fall_sem.id,
        )
        session.add_all([cs_sec_a, cs_sec_b, ece_sec_a])
        await session.flush()

        # 5. Instructors & Qualifications
        turing = Instructor(
            department_id=cs_dept.id, employee_id="CS-001", first_name="Alan", last_name="Turing",
            email="alan.turing@university.edu", max_weekly_workload=12.0
        )
        hopper = Instructor(
            department_id=cs_dept.id, employee_id="CS-002", first_name="Grace", last_name="Hopper",
            email="grace.hopper@university.edu", max_weekly_workload=12.0
        )
        lovelace = Instructor(
            department_id=math_dept.id, employee_id="MATH-001", first_name="Ada", last_name="Lovelace",
            email="ada.lovelace@university.edu", max_weekly_workload=12.0
        )
        shannon = Instructor(
            department_id=ece_dept.id, employee_id="ECE-001", first_name="Claude", last_name="Shannon",
            email="claude.shannon@university.edu", max_weekly_workload=12.0
        )
        session.add_all([turing, hopper, lovelace, shannon])
        await session.flush()

        quals = [
            InstructorQualification(instructor_id=turing.id, qualification_tag="ALGORITHMS"),
            InstructorQualification(instructor_id=turing.id, qualification_tag="AI"),
            InstructorQualification(instructor_id=hopper.id, qualification_tag="SYSTEMS"),
            InstructorQualification(instructor_id=hopper.id, qualification_tag="COMPILERS"),
            InstructorQualification(instructor_id=lovelace.id, qualification_tag="CALCULUS"),
            InstructorQualification(instructor_id=lovelace.id, qualification_tag="DISCRETE_MATH"),
            InstructorQualification(instructor_id=shannon.id, qualification_tag="NETWORKS"),
        ]
        session.add_all(quals)
        await session.flush()

        # 6. Courses & Components
        cs101 = Course(
            department_id=cs_dept.id, code="CS-101", title="Intro to Computing & Programming",
            credit_hours=3.0, required_qualification_tag="SYSTEMS"
        )
        math201 = Course(
            department_id=math_dept.id, code="MATH-201", title="Discrete Mathematics",
            credit_hours=3.0, required_qualification_tag="DISCRETE_MATH"
        )
        session.add_all([cs101, math201])
        await session.flush()

        cs101_lec = CourseComponent(
            course_id=cs101.id, component_type=RoomCategory.REGULAR_CLASSROOM.value,
            weekly_sessions=2, session_duration_slots=1, weekly_contact_hours=2.0, weekly_teaching_credits=2.0
        )
        cs101_lab = CourseComponent(
            course_id=cs101.id, component_type=RoomCategory.COMPUTER_LAB.value,
            weekly_sessions=1, session_duration_slots=2, weekly_contact_hours=2.0, weekly_teaching_credits=1.5
        )
        math201_lec = CourseComponent(
            course_id=math201.id, component_type=RoomCategory.REGULAR_CLASSROOM.value,
            weekly_sessions=3, session_duration_slots=1, weekly_contact_hours=3.0, weekly_teaching_credits=3.0
        )
        session.add_all([cs101_lec, cs101_lab, math201_lec])
        await session.flush()

        # 7. Offerings for CS Section A
        offering_cs = CourseOffering(semester_id=fall_sem.id, course_id=cs101.id, section_id=cs_sec_a.id)
        offering_math = CourseOffering(semester_id=fall_sem.id, course_id=math201.id, section_id=cs_sec_a.id)
        session.add_all([offering_cs, offering_math])

        await session.commit()
        print("✅ University seed data successfully created!")


if __name__ == "__main__":
    asyncio.run(seed_university_data())
