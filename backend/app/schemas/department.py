import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from backend.app.models.enums import RoomCategory


class DepartmentBase(BaseModel):
    code: str = Field(..., max_length=16, description="Unique department code, e.g. 'CS', 'MATH'")
    name: str = Field(..., max_length=128, description="Department name, e.g. 'Computer Science'")


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentRead(DepartmentBase):
    id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BuildingBase(BaseModel):
    code: str = Field(..., max_length=16)
    name: str = Field(..., max_length=128)


class BuildingCreate(BuildingBase):
    pass


class BuildingRead(BuildingBase):
    id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)


class ClassroomBase(BaseModel):
    room_number: str = Field(..., max_length=32)
    capacity: int = Field(..., gt=0)
    category: RoomCategory = Field(default=RoomCategory.REGULAR_CLASSROOM)
    is_schedulable: bool = True
    department_id: Optional[uuid.UUID] = None


class ClassroomCreate(ClassroomBase):
    building_id: uuid.UUID


class ClassroomRead(ClassroomBase):
    id: uuid.UUID
    building_id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)

