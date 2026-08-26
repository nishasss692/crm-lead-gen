# backend/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

try:
    from app.core.database import engine, Base, AsyncSessionLocal
    from app.api.routes import router as api_router
    from app.api.upload import router as upload_router
    # Import models so Base.metadata is aware of all tables during create_all
    import app.models.lead
    from app.core.lead_engine import seed_territories_and_agents
except ImportError:
    from backend.app.core.database import engine, Base, AsyncSessionLocal
    from backend.app.api.routes import router as api_router
    from backend.app.api.upload import router as upload_router
    import backend.app.models.lead
    from backend.app.core.lead_engine import seed_territories_and_agents


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager:
    1. Startup: Initializes PostgreSQL tables (Base.metadata.create_all)
       and ensures foreign key columns exist on leads table.
    2. Seeds the strict hierarchical territory model (Circle -> Region -> Division) and starter agents.
    3. Shutdown: Cleans up database engine connection pool.
    """
    # 1. Startup: create PostgreSQL tables if they do not exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


    # 2. Seed territory hierarchy & active agents
    async with AsyncSessionLocal() as session:
        await seed_territories_and_agents(session)

    yield

    # 3. Shutdown: dispose database engine connections
    await engine.dispose()


# Initialize FastAPI application
app = FastAPI(
    title="CRM Lead Generation API",
    description="Backend API with Strict Hierarchical Territories (Circle -> Region -> Division), Round-Robin Distribution, and Excel Ingestion Engine",
    version="2.1.0",
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

# Include API routers with prefix
app.include_router(upload_router, prefix="/api")
app.include_router(api_router, prefix="/api")


@app.get("/", tags=["Health"])
async def root():
    return {
        "message": "CRM Lead Generation API is running",
        "territory_model": "Circle -> Region -> Division",
        "endpoints": ["/api/leads", "/api/leads/upload-excel", "/api/territories/circles", "/api/agents"],
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}
