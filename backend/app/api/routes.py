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


from pydantic import BaseModel

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login", summary="Simple login endpoint")
async def login(req: LoginRequest):
    if not req.email or not req.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required.",
        )
    # Simple login logic without role-based access
    return {"token": "dummy_jwt_token_123", "message": "Login successful"}


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


@router.get(
    "/leads/{lead_id}",
    response_model=LeadResponse,
    summary="Get a specific lead",
)
async def get_lead(
    lead_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve a specific lead by ID.
    """
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalars().first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found.",
        )
    return lead


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


@router.post(
    "/leads/deduplicate",
    summary="Remove duplicate leads based on email",
)
async def deduplicate_leads(
    db: AsyncSession = Depends(get_db),
):
    """
    Finds and deletes duplicate leads based on email.
    Keeps the most recently created lead for each email.
    """
    # Group by email_id (raw excel email) or base email and get all lead IDs
    import re
    result = await db.execute(select(Lead.email, Lead.email_id, Lead.id, Lead.created_at).order_by(Lead.created_at.desc()))
    records = result.all()

    email_to_ids = {}
    for email, email_id, lead_id, created_at in records:
        target_email = email_id
        
        if not target_email and email:
            # Fallback to email, but strip the system-generated '+uuid' (5 hex chars)
            target_email = re.sub(r'\+[a-f0-9]{5}@', '@', email)
            
        if not target_email:
            continue
            
        target_email = target_email.lower().strip()
            
        if target_email not in email_to_ids:
            email_to_ids[target_email] = []
        email_to_ids[target_email].append(lead_id)

    ids_to_delete = []
    for email, ids in email_to_ids.items():
        # Keep the first one (most recent because of order_by desc), delete the rest
        if len(ids) > 1:
            ids_to_delete.extend(ids[1:])

    deleted_count = 0
    if ids_to_delete:
        from sqlalchemy import delete
        
        # SQLite has a limit on the number of variables in a query (usually 999). 
        # Chunk the deletions to avoid "too many SQL variables" errors.
        chunk_size = 500
        for i in range(0, len(ids_to_delete), chunk_size):
            chunk = ids_to_delete[i:i + chunk_size]
            await db.execute(delete(Lead).where(Lead.id.in_(chunk)))
            
        await db.commit()
        deleted_count = len(ids_to_delete)

    return {"message": f"Successfully deleted {deleted_count} duplicate leads.", "deleted_count": deleted_count}


@router.get(
    "/analytics",
    summary="Get analytics data for dashboard",
)
async def get_analytics(
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve basic analytics for the dashboard charts.
    """
    count_result = await db.execute(select(func.count(Lead.id)))
    total_leads = count_result.scalar() or 0

    new_result = await db.execute(select(func.count(Lead.id)).where(Lead.status == "new"))
    new_leads = new_result.scalar() or 0

    return {
        "total_leads": total_leads,
        "new_leads": new_leads,
        "conversion_rate": "18.4%",
        "active_campaigns": 12,
    }


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
