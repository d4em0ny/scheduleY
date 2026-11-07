import uuid
from pydantic import BaseModel, ConfigDict, Field


class StudentSectionBase(BaseModel):
    department_id: uuid.UUID
    program_code: str = Field(..., max_length=32, description="e.g. 'BSCS', 'BSSE'")
    batch_year: int = Field(..., ge=2000, description="Cohort matriculation year, e.g. 2024")
    section_name: str = Field(..., max_length=16, description="Section code, e.g. 'A', 'B'")
    student_count: int = Field(..., gt=0, description="Number of enrolled students")
    assigned_classroom_id: uuid.UUID = Field(..., description="Fixed assigned regular classroom for semester")
    semester_id: uuid.UUID


class StudentSectionCreate(StudentSectionBase):
    pass


class StudentSectionRead(StudentSectionBase):
    id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)

