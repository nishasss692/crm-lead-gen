# backend/app/api/routes.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

try:
    from app.core.database import get_db
    from app.models.lead import Lead
    from app.schemas.lead import LeadCreate, LeadResponse
except ImportError:
    from backend.app.core.database import get_db
    from backend.app.models.lead import Lead
    from backend.app.schemas.lead import LeadCreate, LeadResponse

router = APIRouter()


@router.post(
    "/leads",
    response_model=LeadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new lead",
)
async def create_lead(
    lead_in: LeadCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new lead in the database.
    Checks if a lead with the provided email already exists.
    """
    # Check if a lead with the provided email already exists
    result = await db.execute(select(Lead).where(Lead.email == lead_in.email))
    existing_lead = result.scalars().first()
    if existing_lead:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A lead with this email already exists.",
        )

    # Instantiate and persist new lead
    lead_data = lead_in.model_dump() if hasattr(lead_in, "model_dump") else lead_in.dict()
    new_lead = Lead(**lead_data)

    db.add(new_lead)
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
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve all leads with optional pagination.
    """
    result = await db.execute(select(Lead).offset(skip).limit(limit))
    leads = result.scalars().all()
    return leads
