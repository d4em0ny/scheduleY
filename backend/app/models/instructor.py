import uuid
from datetime import datetime, timezone
from typing import List
from sqlalchemy import String, Boolean, Float, Integer, ForeignKey, UniqueConstraint, CheckConstraint, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base


class Instructor(Base):
    __tablename__ = "instructors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    department_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False
    )
    employee_id: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    first_name: Mapped[str] = mapped_column(String(64), nullable=False)
    last_name: Mapped[str] = mapped_column(String(64), nullable=False)
    email: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    max_weekly_workload: Mapped[float] = mapped_column(Float, nullable=False, default=12.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    __table_args__ = (
        CheckConstraint("max_weekly_workload > 0", name="chk_instructor_max_workload_positive"),
    )

    # Relationships
    department: Mapped["Department"] = relationship("Department", back_populates="instructors")
    qualifications: Mapped[List["InstructorQualification"]] = relationship(
        "InstructorQualification", back_populates="instructor", cascade="all, delete-orphan"
    )
    availabilities: Mapped[List["InstructorAvailability"]] = relationship(
        "InstructorAvailability", back_populates="instructor", cascade="all, delete-orphan"
    )
    allocations: Mapped[List["InstructorAllocation"]] = relationship("InstructorAllocation", back_populates="instructor")
    offers: Mapped[List["RequestOffer"]] = relationship("RequestOffer", back_populates="instructor")


class InstructorQualification(Base):
    __tablename__ = "instructor_qualifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    instructor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("instructors.id", ondelete="CASCADE"), nullable=False
    )
    qualification_tag: Mapped[str] = mapped_column(String(64), nullable=False, index=True)

    __table_args__ = (
        UniqueConstraint("instructor_id", "qualification_tag", name="uq_instructor_qualification"),
    )

    instructor: Mapped["Instructor"] = relationship("Instructor", back_populates="qualifications")


class InstructorAvailability(Base):
    __tablename__ = "instructor_availabilities"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    instructor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("instructors.id", ondelete="CASCADE"), nullable=False
    )
    semester_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("academic_semesters.id", ondelete="CASCADE"), nullable=False
    )
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 = Mon .. 7 = Sun
    slot_index: Mapped[int] = mapped_column(Integer, nullable=False)   # 0 .. N
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    preference_weight: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    __table_args__ = (
        UniqueConstraint("instructor_id", "semester_id", "day_of_week", "slot_index", name="uq_instructor_slot_avail"),
        CheckConstraint("day_of_week BETWEEN 1 AND 7", name="chk_day_of_week_range"),
        CheckConstraint("slot_index >= 0", name="chk_slot_index_non_negative"),
        CheckConstraint("preference_weight >= 0.0 AND preference_weight <= 1.0", name="chk_preference_weight_range"),
    )

    instructor: Mapped["Instructor"] = relationship("Instructor", back_populates="availabilities")
