import uuid
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from backend.app.models.enums import RoomCategory


class CourseComponentBase(BaseModel):
    component_type: RoomCategory = Field(default=RoomCategory.REGULAR_CLASSROOM)
    weekly_sessions: int = Field(default=1, gt=0)
    session_duration_slots: int = Field(default=1, gt=0)
    weekly_contact_hours: float = Field(..., gt=0)
    weekly_teaching_credits: float = Field(..., gt=0)


class CourseComponentCreate(CourseComponentBase):
    pass


class CourseComponentRead(CourseComponentBase):
    id: uuid.UUID
    course_id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)


class CourseBase(BaseModel):
    department_id: uuid.UUID
    code: str = Field(..., max_length=32)
    title: str = Field(..., max_length=256)
    credit_hours: float = Field(..., gt=0)
    required_qualification_tag: Optional[str] = None


class CourseCreate(CourseBase):
    components: List[CourseComponentCreate] = Field(default_factory=list)


class CourseRead(CourseBase):
    id: uuid.UUID
    components: List[CourseComponentRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class CourseOfferingBase(BaseModel):
    semester_id: uuid.UUID
    course_id: uuid.UUID
    section_id: uuid.UUID


class CourseOfferingCreate(CourseOfferingBase):
    pass


class CourseOfferingRead(CourseOfferingBase):
    id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)
