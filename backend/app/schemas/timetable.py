import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from backend.app.models.enums import SolverStatus


class ScheduledSessionRead(BaseModel):
    id: uuid.UUID
    timetable_run_id: uuid.UUID
    offering_id: uuid.UUID
    course_component_id: uuid.UUID
    session_sequence: int
    instructor_id: uuid.UUID
    classroom_id: uuid.UUID
    day_of_week: int
    start_slot: int
    slot_duration: int

    # Display / helper fields
    course_code: Optional[str] = None
    course_title: Optional[str] = None
    section_name: Optional[str] = None
    instructor_name: Optional[str] = None
    room_number: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TimetableRunCreate(BaseModel):
    semester_id: uuid.UUID
    name: str = Field(..., max_length=128)
    time_limit_seconds: Optional[int] = Field(default=30, gt=0)


class TimetableRunRead(BaseModel):
    id: uuid.UUID
    semester_id: uuid.UUID
    name: str
    solver_status: SolverStatus
    objective_value: Optional[float] = None
    solve_duration_ms: Optional[int] = None
    is_published: bool
    created_at: datetime
    sessions: List[ScheduledSessionRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class TimetableConflict(BaseModel):
    conflict_type: str  # e.g. "INSTRUCTOR_CLASH", "ROOM_CLASH", "SECTION_CLASH", "WORKLOAD_OVERFLOW"
    severity: str = "ERROR"  # "ERROR" (hard constraint) or "WARNING" (soft constraint)
    description: str
    affected_entities: dict = Field(default_factory=dict)


class TimetableDiagnosticReport(BaseModel):
    total_sessions_required: int
    total_sessions_scheduled: int
    is_feasible: bool
    hard_conflict_count: int
    soft_penalty_score: float
    conflicts: List[TimetableConflict] = Field(default_factory=list)
