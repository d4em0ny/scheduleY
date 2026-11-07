# scheduleY: University Intelligent Scheduling and Resource Allocation System

An enterprise-grade academic resource management, instructor allocation, interdepartmental coordination, and timetable generation platform.

## Architecture Highlights

1. **Two-Tier Decoupled Scheduling Pipeline**:
   - **Tier 1 (Resource & Workload Allocation)**: Manages departmental faculty assignments and stateful interdepartmental instructor requests.
   - **Tier 2 (Spatio-Temporal Timetable Generation)**: Solves for optimal session time slots and classroom assignments.
2. **Workload Integrity & Anti-Double-Spending**:
   - Atomic reservation hold pattern with PostgreSQL row-level pessimistic locking (`SELECT ... FOR UPDATE`) during offer generation to prevent concurrent over-commitment of faculty capacity.
3. **Hybrid Spatial Model**:
   - Invariant: Every student section has a permanent classroom assigned for the semester, eliminating regular lecture room collisions. Only specialized laboratories and seminar spaces enter the dynamic room allocation pool.
4. **Constraint Optimization Core**:
   - Powered by Google OR-Tools CP-SAT for deterministic feasibility and soft constraint optimization.
5. **Explainable Diagnostics & Schedule Repair**:
   - Standalone constraint validation engine and localized minimal-perturbation schedule repair.

## Tech Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0 (Async), Pydantic v2
- **Database**: PostgreSQL with Alembic migrations
- **Optimization & Scheduling**: Google OR-Tools (CP-SAT)
- **AI/RL Simulation**: Farama Gymnasium, PyTorch (Exploratory Repair Agent)
- **Frontend**: React 19, TypeScript, Tailwind CSS

## Project Structure

```
scheduleY/
├── backend/
│   ├── app/
│   │   ├── core/           # Config, database session, security, audit logging
│   │   ├── models/         # SQLAlchemy 2.0 declarative models
│   │   ├── schemas/        # Pydantic v2 validation schemas
│   │   ├── services/       # Domain business logic (workload, coordination, etc.)
│   │   ├── api/            # FastAPI route handlers
│   │   ├── solver/         # CP-SAT constraint programming scheduler
│   │   └── diagnostics/    # Constraint validator & conflict reporter
│   ├── alembic/            # Database schema migrations
│   └── tests/              # Pytest test suite (unit, integration, concurrency)
├── docs/                   # System architecture & specification
└── frontend/               # React TypeScript web application
```

## Getting Started

### Prerequisites

- Python 3.12+ (managed with `uv`)
- PostgreSQL or Docker
- Node.js 20+ (for frontend)

### Installation

```bash
# Clone the repository
git clone https://github.com/d4em0ny/scheduleY.git
cd scheduleY

# Initialize virtual environment with uv
uv venv --python 3.12
source .venv/bin/activate

# Install backend dependencies
uv pip install -e ".[dev]"
```

