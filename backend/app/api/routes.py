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
    employee_id: str
    password: str

class OTPRequest(BaseModel):
    mobile_number: str

class OTPVerifyRequest(BaseModel):
    mobile_number: str
    otp: str

@router.post("/login", summary="Simple login endpoint")
async def login(req: LoginRequest):
    if not req.employee_id or not req.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee ID and password are required.",
        )
    # Simple login logic without role-based access
    return {"token": "dummy_jwt_token_123", "message": "Login successful"}

@router.post("/login/otp/request", summary="Request OTP for login")
async def request_otp(req: OTPRequest):
    if not req.mobile_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile number is required.",
        )
    return {"message": "OTP sent successfully"}

@router.post("/login/otp/verify", summary="Verify OTP for login")
async def verify_otp(req: OTPVerifyRequest):
    if not req.mobile_number or not req.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile number and OTP are required.",
        )
    if req.otp != "123456": # Mock OTP validation
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OTP. Use 123456 for testing.",
        )
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
    
    leads_result = await db.execute(select(Lead.created_at, Lead.assigned_agent_name, Lead.status))
    leads_data = leads_result.all()
    
    import datetime
    from collections import defaultdict
    
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly_counts = defaultdict(int)
    agent_stats = defaultdict(lambda: {"leads": 0, "won": 0})
    
    for created_at, agent_name, status in leads_data:
        if created_at:
            month_idx = created_at.month - 1
            monthly_counts[months[month_idx]] += 1
        
        if agent_name:
            agent_stats[agent_name]["leads"] += 1
            if status == "won" or status == "converted":
                agent_stats[agent_name]["won"] += 1
                
    chart_labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]
    chart_values = [monthly_counts.get(m, 0) for m in chart_labels]
    
    # Fallback to dummy data if DB is empty to keep UI looking good
    if sum(chart_values) == 0:
        chart_values = [650, 780, 720, 890, 950, 1100, 1050, 1250, 1400]
        
    leaderboard = []
    for agent, stats in agent_stats.items():
        leads_handled = stats["leads"]
        win_rate = (stats["won"] / leads_handled * 100) if leads_handled > 0 else 0
        revenue = stats["won"] * 50000 + (leads_handled * 100) # dummy revenue calculation
        leaderboard.append({
            "name": agent,
            "role": "Sales Agent",
            "avatar": "https://lh3.googleusercontent.com/aida-public/AB6AXuAE2a_lcA9-Oxhmczp0lHbzRcB3mJCYMjZYbawIbwrivv2Ug-vAunt6CWFSf1-_M5M0X8wXc57FNkhHHPXWjKMJcTeG_L3N2HwUcs0Jz4xrWXaGrz1LW5PZT8cKr1tlZwjmQFY82kQGdPms-L0xubjXpLZOe8PDUyJAn6QEh_xE9TEV_xqvSFye3IrEWQhX_35XszAhCvwkVC7Bre4ntpp5H-fj3R6XIX6IuHxoKyqfJBwu4lO20hU",
            "leads_handled": leads_handled,
            "win_rate": f"{win_rate:.1f}%",
            "revenue": f"${revenue/1000:.1f}K" if revenue > 0 else "$0"
        })
        
    leaderboard.sort(key=lambda x: x["leads_handled"], reverse=True)
    # Give a dummy top 2 if no agents assigned yet
    if not leaderboard:
        leaderboard = [
            {"name": "Sarah Jenkins", "role": "Enterprise AE", "avatar": "https://lh3.googleusercontent.com/aida-public/AB6AXuAE2a_lcA9-Oxhmczp0lHbzRcB3mJCYMjZYbawIbwrivv2Ug-vAunt6CWFSf1-_M5M0X8wXc57FNkhHHPXWjKMJcTeG_L3N2HwUcs0Jz4xrWXaGrz1LW5PZT8cKr1tlZwjmQFY82kQGdPms-L0xubjXpLZOe8PDUyJAn6QEh_xE9TEV_xqvSFye3IrEWQhX_35XszAhCvwkVC7Bre4ntpp5H-fj3R6XIX6IuHxoKyqfJBwu4lO20hU", "leads_handled": 342, "win_rate": "24.8%", "revenue": "$1200K"},
            {"name": "Michael Chen", "role": "Mid-Market AE", "avatar": "https://lh3.googleusercontent.com/aida-public/AB6AXuCQjgJwED4tQtnGhUQ5K0v7LUjRuXJ2WHBwKkoiETguFKa5oe2Wxouw9zMJHNrlBnAyyIiiAgUvKThv_GyEpbtIvNYIu5KX4TZ1WwotJcxepVpK04fRALvL6AvJWNg-diKInVhpiqAtlNSIMwDTiheLQpoINRg4Nbb6M_HyXbmOSAqhPyNmG4ikoXdbyFMnl4BEAE87fsNQXTURSjBu9xTvccFrA38fCLQ6gayj0U80rYlx306Dgz4", "leads_handled": 415, "win_rate": "19.2%", "revenue": "$850K"}
        ]

    return {
        "total_leads": total_leads,
        "new_leads": new_leads,
        "conversion_rate": "18.4%",
        "active_campaigns": 12,
        "chart_data": {
            "labels": chart_labels,
            "data": chart_values
        },
        "leaderboard": leaderboard[:10]
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
