from fastapi import APIRouter
from backend.app.api.v1.endpoints import (
    departments,
    semesters,
    instructors,
    sections,
    coordination,
    allocations,
)

api_router = APIRouter()
api_router.include_router(departments.router)
api_router.include_router(semesters.router)
api_router.include_router(instructors.router)
api_router.include_router(sections.router)
api_router.include_router(coordination.router)
api_router.include_router(allocations.router)
