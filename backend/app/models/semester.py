import uuid
from datetime import date
from typing import List
from sqlalchemy import String, Boolean, Date, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base


class AcademicSemester(Base):
    __tablename__ = "academic_semesters"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        CheckConstraint("end_date > start_date", name="chk_semester_dates_valid"),
    )

    # Relationships
    student_sections: Mapped[List["StudentSection"]] = relationship("StudentSection", back_populates="semester")
    course_offerings: Mapped[List["CourseOffering"]] = relationship("CourseOffering", back_populates="semester")
    timetable_runs: Mapped[List["TimetableRun"]] = relationship("TimetableRun", back_populates="semester")
