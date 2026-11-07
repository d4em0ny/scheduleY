import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Float, Boolean, ForeignKey, UniqueConstraint, CheckConstraint, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base
from backend.app.models.enums import InterdeptStatus


class InterdepartmentalRequest(Base):
    __tablename__ = "interdepartmental_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_number: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    semester_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("academic_semesters.id", ondelete="RESTRICT"), nullable=False
    )
    requesting_dept_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False
    )
    supplying_dept_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False
    )
    offering_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("course_offerings.id", ondelete="CASCADE"), nullable=False
    )
    course_component_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("course_components.id", ondelete="RESTRICT"), nullable=False
    )
    required_hours: Mapped[float] = mapped_column(Float, nullable=False)
    required_qualification_tag: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default=InterdeptStatus.DRAFT.value, nullable=False, index=True)
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False
    )

    __table_args__ = (
        CheckConstraint("requesting_dept_id <> supplying_dept_id", name="chk_interdept_distinct_depts"),
        CheckConstraint("required_hours > 0", name="chk_interdept_required_hours_positive"),
    )

    offering: Mapped["CourseOffering"] = relationship("CourseOffering", back_populates="requests")
    requesting_dept: Mapped["Department"] = relationship("Department", foreign_keys=[requesting_dept_id])
    supplying_dept: Mapped["Department"] = relationship("Department", foreign_keys=[supplying_dept_id])
    offers: Mapped[List["RequestOffer"]] = relationship("RequestOffer", back_populates="request", cascade="all, delete-orphan")


class RequestOffer(Base):
    __tablename__ = "request_offers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("interdepartmental_requests.id", ondelete="CASCADE"), nullable=False
    )
    instructor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("instructors.id", ondelete="RESTRICT"), nullable=False
    )
    offered_hours: Mapped[float] = mapped_column(Float, nullable=False)
    hold_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_active_hold: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    offered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    decision_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint("offered_hours > 0", name="chk_offer_hours_positive"),
    )

    request: Mapped["InterdepartmentalRequest"] = relationship("InterdepartmentalRequest", back_populates="offers")
    instructor: Mapped["Instructor"] = relationship("Instructor", back_populates="offers")
