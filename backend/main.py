# backend/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from app.core.database import engine, Base
    from app.api.routes import router as api_router
    # Import models so Base.metadata is aware of all tables during create_all
    import app.models.lead
except ImportError:
    from backend.app.core.database import engine, Base
    from backend.app.api.routes import router as api_router
    import backend.app.models.lead


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager that initializes the database tables
    on application startup and cleans up engine resources on shutdown.
    """
    # Startup: create PostgreSQL tables if they do not exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown: dispose database engine connections
    await engine.dispose()


# Initialize FastAPI application
app = FastAPI(
    title="CRM Lead Generation API",
    description="Backend API for CRM Lead Generation, Management, and Scoring",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS middleware to allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router with prefix
app.include_router(api_router, prefix="/api")


@app.get("/", tags=["Health"])
async def root():
    return {"message": "CRM Lead Generation API is running"}


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}
