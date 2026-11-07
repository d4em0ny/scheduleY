import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Integer, Boolean, ForeignKey, UniqueConstraint, CheckConstraint, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base
from backend.app.models.enums import RoomCategory


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(16), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    instructors: Mapped[List["Instructor"]] = relationship("Instructor", back_populates="department")
    courses: Mapped[List["Course"]] = relationship("Course", back_populates="department")
    student_sections: Mapped[List["StudentSection"]] = relationship("StudentSection", back_populates="department")
    classrooms: Mapped[List["Classroom"]] = relationship("Classroom", back_populates="department")


class Building(Base):
    __tablename__ = "buildings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(16), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)

    classrooms: Mapped[List["Classroom"]] = relationship("Classroom", back_populates="building")


class Classroom(Base):
    __tablename__ = "classrooms"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    building_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("buildings.id", ondelete="RESTRICT"), nullable=False
    )
    room_number: Mapped[str] = mapped_column(String(32), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    category: Mapped[str] = mapped_column(String(32), default=RoomCategory.REGULAR_CLASSROOM.value, nullable=False)
    is_schedulable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    department_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )

    __table_args__ = (
        UniqueConstraint("building_id", "room_number", name="uq_building_room"),
        CheckConstraint("capacity > 0", name="chk_classroom_capacity_positive"),
    )

    building: Mapped["Building"] = relationship("Building", back_populates="classrooms")
    department: Mapped[Optional["Department"]] = relationship("Department", back_populates="classrooms")
