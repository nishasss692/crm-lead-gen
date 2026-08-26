# backend/app/api/routes.py
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

try:
    from app.core.database import get_db
    from app.models.lead import Lead, Circle, Region, Division, Agent
    from app.schemas.lead import (
        LeadCreate,
        LeadResponse,
        LeadUpdate,
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
        LeadUpdate,
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

    # 2. If division_name is provided, verify it exists (optional check)
    if lead_in.division_name:
        div_result = await db.execute(
            select(Division).where(Division.name == lead_in.division_name)
        )
        division = div_result.scalars().first()
        if not division:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Division with name {lead_in.division_name} not found.",
            )

    # 3. Instantiate new lead
    lead_data = (
        lead_in.model_dump() if hasattr(lead_in, "model_dump") else lead_in.dict()
    )
    new_lead = Lead(**lead_data)
    db.add(new_lead)
    await db.flush()

    # 4. Perform Round-Robin assignment within the assigned division
    if new_lead.division_name:
        await assign_lead_round_robin(new_lead, db)

    await db.commit()
    await db.refresh(new_lead)

    return new_lead


@router.get(
    "/leads",
    summary="Get all leads",
)
async def get_leads(
    page: int = 1,
    limit: int = 50,
    division_name: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve all leads with optional pagination and division filtering.
    """
    query = select(Lead)
    count_query = select(func.count(Lead.id))
    
    if division_name:
        query = query.where(Lead.division_name == division_name)
        count_query = count_query.where(Lead.division_name == division_name)

    offset = (page - 1) * limit
    query = query.order_by(Lead.created_at.desc()).offset(offset).limit(limit)
    
    result = await db.execute(query)
    leads = result.scalars().all()
    
    count_result = await db.execute(count_query)
    total_count = count_result.scalar()
    
    return {
        "data": leads,
        "total": total_count,
        "page": page,
        "limit": limit
    }


@router.patch(
    "/leads/{lead_id}",
    response_model=LeadResponse,
    summary="Update a lead",
)
async def update_lead(
    lead_id: UUID,
    lead_update: LeadUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Update a specific lead with provided fields from Excel.
    """
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalars().first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found.",
        )

    update_data = (
        lead_update.model_dump(exclude_unset=True) 
        if hasattr(lead_update, "model_dump") 
        else lead_update.dict(exclude_unset=True)
    )

    for key, value in update_data.items():
        setattr(lead, key, value)

    await db.commit()
    await db.refresh(lead)

    return lead


# --- Territory Hierarchy Endpoints ---

@router.get(
    "/divisions",
    response_model=List[str],
    summary="Get all unique division names",
)
async def get_unique_division_names(
    db: AsyncSession = Depends(get_db),
):
    """
    Queries the database for all unique division_name values and returns them as a list.
    """
    result = await db.execute(
        select(Lead.division_name)
        .where(Lead.division_name.is_not(None))
        .distinct()
        .order_by(Lead.division_name.asc())
    )
    divisions = result.scalars().all()
    return divisions


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
