import uuid
from datetime import datetime, timezone
from sqlalchemy import Float, Boolean, String, ForeignKey, UniqueConstraint, CheckConstraint, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base
from backend.app.models.enums import AllocationType


class InstructorAllocation(Base):
    __tablename__ = "instructor_allocations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    offering_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("course_offerings.id", ondelete="CASCADE"), nullable=False
    )
    course_component_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("course_components.id", ondelete="RESTRICT"), nullable=False
    )
    instructor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("instructors.id", ondelete="RESTRICT"), nullable=False
    )
    allocation_type: Mapped[str] = mapped_column(
        String(32), default=AllocationType.INTERNAL.value, nullable=False
    )
    credited_hours: Mapped[float] = mapped_column(Float, nullable=False)
    is_confirmed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    __table_args__ = (
        UniqueConstraint("offering_id", "course_component_id", name="uq_offering_component_allocation"),
        CheckConstraint("credited_hours > 0", name="chk_allocation_credited_hours_positive"),
    )

    offering: Mapped["CourseOffering"] = relationship("CourseOffering", back_populates="allocations")
    component: Mapped["CourseComponent"] = relationship("CourseComponent", back_populates="allocations")
    instructor: Mapped["Instructor"] = relationship("Instructor", back_populates="allocations")

