import uuid
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, EmailStr


class InstructorBase(BaseModel):
    department_id: uuid.UUID
    employee_id: str = Field(..., max_length=32)
    first_name: str = Field(..., max_length=64)
    last_name: str = Field(..., max_length=64)
    email: str = Field(..., max_length=128)
    max_weekly_workload: float = Field(default=12.0, gt=0)
    is_active: bool = True


class InstructorCreate(InstructorBase):
    qualification_tags: List[str] = Field(default_factory=list)


class InstructorRead(InstructorBase):
    id: uuid.UUID
    qualification_tags: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class InstructorAvailabilityBase(BaseModel):
    day_of_week: int = Field(..., ge=1, le=7, description="1=Monday .. 7=Sunday")
    slot_index: int = Field(..., ge=0)
    is_available: bool = True
    preference_weight: float = Field(default=1.0, ge=0.0, le=1.0)


class InstructorAvailabilityCreate(InstructorAvailabilityBase):
    instructor_id: uuid.UUID
    semester_id: uuid.UUID


class InstructorAvailabilityRead(InstructorAvailabilityBase):
    id: uuid.UUID
    instructor_id: uuid.UUID
    semester_id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)


class InstructorWorkloadSummary(BaseModel):
    instructor_id: uuid.UUID
    employee_id: str
    full_name: str
    department_code: str
    max_weekly_workload: float
    committed_hours: float
    held_hours: float
    remaining_capacity: float
    is_overloaded: bool
