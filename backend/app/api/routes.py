# backend/app/api/routes.py
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

try:
    from app.core.database import get_db
    from app.models.lead import Lead, Circle, Region, Division, Agent
    from app.schemas.lead import (
        LeadCreate,
        LeadResponse,
        CircleResponse,
        DivisionBase,
        AgentResponse,
    )
    from app.core.lead_engine import assign_lead_round_robin
except ImportError:
    from backend.app.core.database import get_db
    from backend.app.models.lead import Lead, Circle, Region, Division, Agent
    from backend.app.schemas.lead import (
        LeadCreate,
        LeadResponse,
        CircleResponse,
        DivisionBase,
        AgentResponse,
    )
    from backend.app.core.lead_engine import assign_lead_round_robin

router = APIRouter()


@router.post(
    "/leads",
    response_model=LeadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new lead with territory & round-robin assignment",
)
async def create_lead(
    lead_in: LeadCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new lead in the database.
    - Checks if a lead with the provided email already exists.
    - Validates division_id if provided.
    - Runs Round-Robin agent assignment within the designated division.
    """
    # 1. Check duplicate email
    result = await db.execute(select(Lead).where(Lead.email == lead_in.email))
    existing_lead = result.scalars().first()
    if existing_lead:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A lead with this email already exists.",
        )

    # 2. If division_id is provided, verify it exists
    if lead_in.division_id:
        div_result = await db.execute(
            select(Division).where(Division.id == lead_in.division_id)
        )
        division = div_result.scalars().first()
        if not division:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Division with ID {lead_in.division_id} not found.",
            )

    # 3. Instantiate new lead
    lead_data = (
        lead_in.model_dump() if hasattr(lead_in, "model_dump") else lead_in.dict()
    )
    new_lead = Lead(**lead_data)
    db.add(new_lead)
    await db.flush()

    # 4. Perform Round-Robin assignment within the assigned division
    if new_lead.division_id:
        await assign_lead_round_robin(new_lead, db)

    await db.commit()
    await db.refresh(new_lead)

    return new_lead


@router.get(
    "/leads",
    response_model=List[LeadResponse],
    summary="Get all leads",
)
async def get_leads(
    skip: int = 0,
    limit: int = 100,
    division_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve all leads with optional pagination and division filtering.
    """
    query = select(Lead)
    if division_id:
        query = query.where(Lead.division_id == division_id)

    query = query.order_by(Lead.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    leads = result.scalars().all()
    return leads


# --- Territory Hierarchy Endpoints ---


@router.get(
    "/territories/circles",
    response_model=List[CircleResponse],
    summary="List all Circles with nested Regions and Divisions",
)
async def get_territory_hierarchy(
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve the full strict hierarchical territory tree: Circle -> Region -> Division.
    """
    result = await db.execute(select(Circle).order_by(Circle.name.asc()))
    circles = result.scalars().all()
    return circles


@router.get(
    "/territories/divisions",
    response_model=List[DivisionBase],
    summary="List all Divisions",
)
async def get_divisions(
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve all leaf divisions for lead assignment.
    """
    result = await db.execute(select(Division).order_by(Division.name.asc()))
    divisions = result.scalars().all()
    return divisions


# --- Agent Endpoints ---


@router.get(
    "/agents",
    response_model=List[AgentResponse],
    summary="List all sales agents",
)
async def get_agents(
    division_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve all agents, optionally filtered by division.
    """
    query = select(Agent)
    if division_id:
        query = query.where(Agent.division_id == division_id)

    query = query.order_by(Agent.name.asc())
    result = await db.execute(query)
    agents = result.scalars().all()
    return agents
