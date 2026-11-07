import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from backend.app.models.enums import InterdeptStatus


class OfferBase(BaseModel):
    instructor_id: uuid.UUID
    offered_hours: float = Field(..., gt=0)


class OfferCreate(OfferBase):
    request_id: uuid.UUID
    hold_hours: Optional[int] = Field(default=72, gt=0, description="Hours before hold expires")


class OfferRead(OfferBase):
    id: uuid.UUID
    request_id: uuid.UUID
    hold_expires_at: datetime
    is_active_hold: bool
    offered_at: datetime
    decision_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class InterdeptRequestBase(BaseModel):
    semester_id: uuid.UUID
    requesting_dept_id: uuid.UUID
    supplying_dept_id: uuid.UUID
    offering_id: uuid.UUID
    course_component_id: uuid.UUID
    required_hours: float = Field(..., gt=0)
    required_qualification_tag: Optional[str] = None
    remarks: Optional[str] = None


class InterdeptRequestCreate(InterdeptRequestBase):
    pass


class InterdeptRequestRead(InterdeptRequestBase):
    id: uuid.UUID
    request_number: str
    status: InterdeptStatus
    created_at: datetime
    updated_at: datetime
    offers: List[OfferRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

