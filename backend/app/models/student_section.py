import uuid
from typing import List, Optional
from sqlalchemy import String, Integer, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base


class StudentSection(Base):
    __tablename__ = "student_sections"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    department_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False
    )
    program_code: Mapped[str] = mapped_column(String(32), nullable=False)
    batch_year: Mapped[int] = mapped_column(Integer, nullable=False)
    section_name: Mapped[str] = mapped_column(String(16), nullable=False)
    student_count: Mapped[int] = mapped_column(Integer, nullable=False)

    # Core Architectural Invariant: Fixed assigned classroom for the entire semester
    assigned_classroom_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("classrooms.id", ondelete="RESTRICT"), nullable=False
    )
    semester_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("academic_semesters.id", ondelete="RESTRICT"), nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "department_id", "program_code", "batch_year", "section_name", "semester_id",
            name="uq_section_per_semester"
        ),
        CheckConstraint("student_count > 0", name="chk_section_student_count_positive"),
        CheckConstraint("batch_year >= 2000", name="chk_section_batch_year_valid"),
    )

    # Relationships
    department: Mapped["Department"] = relationship("Department", back_populates="student_sections")
    semester: Mapped["AcademicSemester"] = relationship("AcademicSemester", back_populates="student_sections")
    assigned_classroom: Mapped["Classroom"] = relationship("Classroom")
    course_offerings: Mapped[List["CourseOffering"]] = relationship("CourseOffering", back_populates="section")
