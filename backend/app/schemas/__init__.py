from backend.app.schemas.department import (
    DepartmentCreate,
    DepartmentRead,
    BuildingCreate,
    BuildingRead,
    ClassroomCreate,
    ClassroomRead,
)
from backend.app.schemas.semester import SemesterCreate, SemesterRead
from backend.app.schemas.student_section import StudentSectionCreate, StudentSectionRead
from backend.app.schemas.instructor import (
    InstructorCreate,
    InstructorRead,
    InstructorAvailabilityCreate,
    InstructorAvailabilityRead,
    InstructorWorkloadSummary,
)
from backend.app.schemas.course import (
    CourseCreate,
    CourseRead,
    CourseComponentCreate,
    CourseComponentRead,
    CourseOfferingCreate,
    CourseOfferingRead,
)
from backend.app.schemas.interdept import (
    InterdeptRequestCreate,
    InterdeptRequestRead,
    OfferCreate,
    OfferRead,
)
from backend.app.schemas.timetable import (
    ScheduledSessionRead,
    TimetableRunCreate,
    TimetableRunRead,
    TimetableConflict,
    TimetableDiagnosticReport,
)

__all__ = [
    "DepartmentCreate",
    "DepartmentRead",
    "BuildingCreate",
    "BuildingRead",
    "ClassroomCreate",
    "ClassroomRead",
    "SemesterCreate",
    "SemesterRead",
    "StudentSectionCreate",
    "StudentSectionRead",
    "InstructorCreate",
    "InstructorRead",
    "InstructorAvailabilityCreate",
    "InstructorAvailabilityRead",
    "InstructorWorkloadSummary",
    "CourseCreate",
    "CourseRead",
    "CourseComponentCreate",
    "CourseComponentRead",
    "CourseOfferingCreate",
    "CourseOfferingRead",
    "InterdeptRequestCreate",
    "InterdeptRequestRead",
    "OfferCreate",
    "OfferRead",
    "ScheduledSessionRead",
    "TimetableRunCreate",
    "TimetableRunRead",
    "TimetableConflict",
    "TimetableDiagnosticReport",
]
