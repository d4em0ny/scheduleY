import uuid
from typing import List, Optional
from sqlalchemy import String, Integer, Float, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base
from backend.app.models.enums import RoomCategory


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    department_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False
    )
    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    credit_hours: Mapped[float] = mapped_column(Float, nullable=False)
    required_qualification_tag: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    __table_args__ = (
        CheckConstraint("credit_hours > 0", name="chk_course_credit_hours_positive"),
    )

    department: Mapped["Department"] = relationship("Department", back_populates="courses", lazy="selectin")
    components: Mapped[List["CourseComponent"]] = relationship(
        "CourseComponent", back_populates="course", cascade="all, delete-orphan", lazy="selectin"
    )
    offerings: Mapped[List["CourseOffering"]] = relationship("CourseOffering", back_populates="course", lazy="selectin")


class CourseComponent(Base):
    __tablename__ = "course_components"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    component_type: Mapped[str] = mapped_column(
        String(32), default=RoomCategory.REGULAR_CLASSROOM.value, nullable=False
    )
    weekly_sessions: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    session_duration_slots: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    weekly_contact_hours: Mapped[float] = mapped_column(Float, nullable=False)
    weekly_teaching_credits: Mapped[float] = mapped_column(Float, nullable=False)

    __table_args__ = (
        UniqueConstraint("course_id", "component_type", name="uq_course_component"),
        CheckConstraint("weekly_sessions > 0", name="chk_weekly_sessions_positive"),
        CheckConstraint("session_duration_slots > 0", name="chk_session_duration_positive"),
        CheckConstraint("weekly_contact_hours > 0", name="chk_contact_hours_positive"),
        CheckConstraint("weekly_teaching_credits > 0", name="chk_teaching_credits_positive"),
    )

    course: Mapped["Course"] = relationship("Course", back_populates="components")
    allocations: Mapped[List["InstructorAllocation"]] = relationship("InstructorAllocation", back_populates="component")


class CourseOffering(Base):
    __tablename__ = "course_offerings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    semester_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("academic_semesters.id", ondelete="RESTRICT"), nullable=False
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("courses.id", ondelete="RESTRICT"), nullable=False
    )
    section_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("student_sections.id", ondelete="CASCADE"), nullable=False
    )

    __table_args__ = (
        UniqueConstraint("semester_id", "course_id", "section_id", name="uq_offering_course_section"),
    )

    semester: Mapped["AcademicSemester"] = relationship("AcademicSemester", back_populates="course_offerings", lazy="selectin")
    course: Mapped["Course"] = relationship("Course", back_populates="offerings", lazy="selectin")
    section: Mapped["StudentSection"] = relationship("StudentSection", back_populates="course_offerings", lazy="selectin")
    allocations: Mapped[List["InstructorAllocation"]] = relationship(
        "InstructorAllocation", back_populates="offering", cascade="all, delete-orphan", lazy="selectin"
    )
    requests: Mapped[List["InterdepartmentalRequest"]] = relationship(
        "InterdepartmentalRequest", back_populates="offering", cascade="all, delete-orphan", lazy="selectin"
    )
