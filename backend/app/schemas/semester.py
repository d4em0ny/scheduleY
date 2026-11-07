import uuid
from datetime import date
from pydantic import BaseModel, ConfigDict, Field, model_validator


class SemesterBase(BaseModel):
    code: str = Field(..., max_length=32, description="Unique semester code, e.g. '2026-FALL'")
    name: str = Field(..., max_length=64, description="Semester display name, e.g. 'Fall 2026'")
    start_date: date
    end_date: date
    is_active: bool = False

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date <= self.start_date:
            raise ValueError("end_date must be strictly after start_date")
        return self


class SemesterCreate(SemesterBase):
    pass


class SemesterRead(SemesterBase):
    id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)
