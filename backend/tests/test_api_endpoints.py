import uuid
from datetime import date
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.main import app
from backend.app.api.deps import get_database_session


@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "scheduleY" in data["service"]


@pytest.mark.asyncio
async def test_api_full_setup_workflow(db_session: AsyncSession):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_database_session] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Create Department
        dept_resp = await client.post(
            "/api/v1/departments",
            json={"code": "CS", "name": "Computer Science"},
        )
        assert dept_resp.status_code == 201
        dept_data = dept_resp.json()
        dept_id = dept_data["id"]

        # 2. Create Building and Classroom
        bldg_resp = await client.post(
            "/api/v1/departments/buildings",
            json={"code": "ENG1", "name": "Engineering 1"},
        )
        assert bldg_resp.status_code == 201
        bldg_id = bldg_resp.json()["id"]

        room_resp = await client.post(
            "/api/v1/departments/classrooms",
            json={
                "building_id": bldg_id,
                "room_number": "301",
                "capacity": 55,
                "category": "REGULAR_CLASSROOM",
                "is_schedulable": True,
                "department_id": dept_id,
            },
        )
        assert room_resp.status_code == 201
        room_id = room_resp.json()["id"]

        # 3. Create Semester
        sem_resp = await client.post(
            "/api/v1/semesters",
            json={
                "code": "2026-FALL",
                "name": "Fall 2026",
                "start_date": "2026-09-01",
                "end_date": "2026-12-20",
                "is_active": True,
            },
        )
        assert sem_resp.status_code == 201
        sem_id = sem_resp.json()["id"]

        # 4. Create Section with Fixed Classroom Binding
        sec_resp = await client.post(
            "/api/v1/sections",
            json={
                "department_id": dept_id,
                "program_code": "BSCS",
                "batch_year": 2024,
                "section_name": "A",
                "student_count": 48,
                "assigned_classroom_id": room_id,
                "semester_id": sem_id,
            },
        )
        assert sec_resp.status_code == 201
        sec_data = sec_resp.json()
        assert sec_data["assigned_classroom_id"] == room_id

        # 5. Create Instructor and verify initial workload
        inst_resp = await client.post(
            "/api/v1/instructors",
            json={
                "department_id": dept_id,
                "employee_id": "EMP-042",
                "first_name": "Grace",
                "last_name": "Hopper",
                "email": "grace.hopper@university.edu",
                "max_weekly_workload": 12.0,
                "is_active": True,
                "qualification_tags": ["COMPILERS", "SYSTEMS"],
            },
        )
        assert inst_resp.status_code == 201
        inst_id = inst_resp.json()["id"]

        # Workload check
        wl_resp = await client.get(f"/api/v1/instructors/{inst_id}/workload")
        assert wl_resp.status_code == 200
        wl_data = wl_resp.json()
        assert wl_data["remaining_capacity"] == 12.0
        assert wl_data["committed_hours"] == 0.0
        assert wl_data["held_hours"] == 0.0

        # 6. Create Course and Components (Lecture + Lab to test midday break boundary)
        course_resp = await client.post(
            "/api/v1/courses",
            json={
                "department_id": dept_id,
                "code": "CS-101",
                "title": "Intro to Computing",
                "credit_hours": 3.0,
                "required_qualification_tag": "COMPILERS",
                "components": [
                    {
                        "component_type": "REGULAR_CLASSROOM",
                        "weekly_sessions": 3,
                        "session_duration_slots": 1,
                        "weekly_contact_hours": 3.0,
                        "weekly_teaching_credits": 3.0,
                    },
                    {
                        "component_type": "COMPUTER_LAB",
                        "weekly_sessions": 8,
                        "session_duration_slots": 2,
                        "weekly_contact_hours": 16.0,
                        "weekly_teaching_credits": 10.0,
                    },
                ],
            },
        )
        assert course_resp.status_code == 201
        course_id = course_resp.json()["id"]

        # 7. Create Offering
        offering_resp = await client.post(
            "/api/v1/courses/offerings",
            json={
                "semester_id": sem_id,
                "course_id": course_id,
                "section_id": sec_data["id"],
            },
        )
        assert offering_resp.status_code == 201

        # 8. Test Timetable Generation
        gen_resp = await client.post(f"/api/v1/timetables/generate?semester_id={sem_id}")
        assert gen_resp.status_code == 201
        gen_data = gen_resp.json()
        assert gen_data["solver_status"] in ["OPTIMAL", "FEASIBLE"]
        assert len(gen_data["sessions"]) == 11
        assert any(s["start_slot"] >= 5 for s in gen_data["sessions"])
        for s in gen_data["sessions"]:
            end_slot = s["start_slot"] + s["slot_duration"] - 1
            assert 1 <= s["start_slot"] and end_slot <= 7
            # Confirm no session crosses the 12:00-14:00 midday break (slot 4 -> slot 5)
            assert not (s["start_slot"] <= 4 and end_slot >= 5)
            assert s["room_number"] == "Room 301"

    app.dependency_overrides.clear()
