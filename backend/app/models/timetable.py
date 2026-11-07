import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Integer, Float, Boolean, ForeignKey, UniqueConstraint, CheckConstraint, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base
from backend.app.models.enums import SolverStatus


class TimetableRun(Base):
    __tablename__ = "timetable_runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    semester_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("academic_semesters.id", ondelete="RESTRICT"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    solver_status: Mapped[str] = mapped_column(String(32), default=SolverStatus.NOT_SOLVED.value, nullable=False)
    objective_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    solve_duration_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    semester: Mapped["AcademicSemester"] = relationship("AcademicSemester", back_populates="timetable_runs")
    sessions: Mapped[List["ScheduledSession"]] = relationship(
        "ScheduledSession", back_populates="timetable_run", cascade="all, delete-orphan"
    )


class ScheduledSession(Base):
    __tablename__ = "scheduled_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timetable_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("timetable_runs.id", ondelete="CASCADE"), nullable=False
    )
    offering_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("course_offerings.id", ondelete="CASCADE"), nullable=False
    )
    course_component_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("course_components.id", ondelete="RESTRICT"), nullable=False
    )
    session_sequence: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    instructor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("instructors.id", ondelete="RESTRICT"), nullable=False
    )
    classroom_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("classrooms.id", ondelete="RESTRICT"), nullable=False
    )
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)
    start_slot: Mapped[int] = mapped_column(Integer, nullable=False)
    slot_duration: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    __table_args__ = (
        UniqueConstraint("timetable_run_id", "instructor_id", "day_of_week", "start_slot", name="uq_session_instructor_time"),
        UniqueConstraint("timetable_run_id", "classroom_id", "day_of_week", "start_slot", name="uq_session_classroom_time"),
        UniqueConstraint("timetable_run_id", "offering_id", "course_component_id", "session_sequence", name="uq_session_sequence"),
        CheckConstraint("day_of_week BETWEEN 1 AND 7", name="chk_session_day_range"),
        CheckConstraint("start_slot >= 0", name="chk_session_start_slot_non_negative"),
        CheckConstraint("slot_duration > 0", name="chk_session_slot_duration_positive"),
    )

    timetable_run: Mapped["TimetableRun"] = relationship("TimetableRun", back_populates="sessions")
    offering: Mapped["CourseOffering"] = relationship("CourseOffering")
    component: Mapped["CourseComponent"] = relationship("CourseComponent")
    instructor: Mapped["Instructor"] = relationship("Instructor")
    classroom: Mapped["Classroom"] = relationship("Classroom")
