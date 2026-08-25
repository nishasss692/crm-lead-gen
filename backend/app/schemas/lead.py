# backend/app/schemas/lead.py
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

# Schema for incoming frontend payloads
class LeadCreate(BaseModel):
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    email: EmailStr
    company_name: Optional[str] = Field(None, max_length=255)

# Schema for returning data to the frontend (includes DB-generated fields)
class LeadResponse(LeadCreate):
    id: UUID
    status: str
    ml_lead_score: Optional[float] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)