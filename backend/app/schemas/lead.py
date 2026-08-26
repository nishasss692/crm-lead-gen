# backend/app/schemas/lead.py
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# --- Territory Schemas ---
class DivisionBase(BaseModel):
    id: UUID
    name: str
    region_id: UUID
    model_config = ConfigDict(from_attributes=True)


class RegionBase(BaseModel):
    id: UUID
    name: str
    circle_id: UUID
    divisions: List[DivisionBase] = []
    model_config = ConfigDict(from_attributes=True)


class CircleResponse(BaseModel):
    id: UUID
    name: str
    code: Optional[str] = None
    regions: List[RegionBase] = []
    model_config = ConfigDict(from_attributes=True)


# --- Agent Schemas ---
class AgentResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    division_id: Optional[UUID] = None
    is_active: bool
    last_assigned_at: Optional[datetime] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Lead Schemas ---
class LeadCreate(BaseModel):
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    email: EmailStr
    company_name: Optional[str] = Field(None, max_length=255)
    
    # Excel columns
    sl_no: Optional[int] = None
    exporter_name: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None
    division_id: Optional[str] = None
    division_name: Optional[str] = None
    region: Optional[str] = None
    assigned_agent_name: Optional[str] = None
    date_of_meeting: Optional[str] = None
    customer_met_name: Optional[str] = None
    contact_number: Optional[str] = None
    email_id: Optional[str] = None
    service_presently_using: Optional[str] = None
    monthly_appx_volume: Optional[str] = None
    meeting_outcome: Optional[str] = None
    contract_id: Optional[str] = None
    remarks: Optional[str] = None


class LeadUpdate(BaseModel):
    sl_no: Optional[int] = None
    exporter_name: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None
    division_id: Optional[str] = None
    division_name: Optional[str] = None
    region: Optional[str] = None
    assigned_agent_name: Optional[str] = None
    date_of_meeting: Optional[str] = None
    customer_met_name: Optional[str] = None
    contact_number: Optional[str] = None
    email_id: Optional[str] = None
    service_presently_using: Optional[str] = None
    monthly_appx_volume: Optional[str] = None
    meeting_outcome: Optional[str] = None
    contract_id: Optional[str] = None
    remarks: Optional[str] = None


class LeadResponse(LeadCreate):
    id: UUID
    status: str
    ml_lead_score: Optional[float] = None
    assigned_agent_id: Optional[UUID] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)