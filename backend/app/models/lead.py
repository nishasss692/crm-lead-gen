# backend/app/models/lead.py
import uuid
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Boolean, Text, Integer
from sqlalchemy import JSON as JSONB, Uuid as UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

try:
    from app.core.database import Base
except ImportError:
    from backend.app.core.database import Base


class Circle(Base):
    __tablename__ = "circles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(50), unique=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 1-to-many relationship: Circle -> Regions
    regions = relationship(
        "Region",
        back_populates="circle",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class Region(Base):
    __tablename__ = "regions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    circle_id = Column(
        UUID(as_uuid=True),
        ForeignKey("circles.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships: Region belongs to Circle, has many Divisions
    circle = relationship("Circle", back_populates="regions", lazy="selectin")
    divisions = relationship(
        "Division",
        back_populates="region",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class Division(Base):
    __tablename__ = "divisions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    region_id = Column(
        UUID(as_uuid=True),
        ForeignKey("regions.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships: Division belongs to Region, has many Leads & Agents
    region = relationship("Region", back_populates="divisions", lazy="selectin")
    agents = relationship("Agent", back_populates="division", lazy="selectin")


class Agent(Base):
    __tablename__ = "agents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    division_id = Column(
        UUID(as_uuid=True),
        ForeignKey("divisions.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_active = Column(Boolean, default=True, nullable=False)
    last_assigned_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    division = relationship("Division", back_populates="agents", lazy="selectin")
    leads = relationship("Lead", back_populates="assigned_agent", lazy="selectin")


class Lead(Base):
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    company_name = Column(String(255), nullable=True)
    status = Column(String(50), default="new")
    ml_lead_score = Column(Float, nullable=True)
    query_notes = Column(Text, nullable=True)

    # Excel Columns mapped to DB
    sl_no = Column(Integer, nullable=True)
    exporter_name = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    pincode = Column(String(50), nullable=True)
    division_id = Column(String(100), nullable=True)
    division_name = Column(String(100), nullable=True)
    region = Column(String(100), nullable=True)
    assigned_agent_name = Column(String(100), nullable=True)
    date_of_meeting = Column(String(50), nullable=True)
    customer_met_name = Column(String(100), nullable=True)
    contact_number = Column(String(50), nullable=True)
    email_id = Column(String(255), nullable=True)
    service_presently_using = Column(String(255), nullable=True)
    monthly_appx_volume = Column(String(100), nullable=True)
    meeting_outcome = Column(String(255), nullable=True)
    contract_id = Column(String(100), nullable=True)
    remarks = Column(Text, nullable=True)

    assigned_agent_id = Column(
        UUID(as_uuid=True),
        ForeignKey("agents.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    assigned_agent = relationship("Agent", back_populates="leads", lazy="selectin")
    interactions = relationship(
        "Interaction",
        back_populates="lead",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(
        UUID(as_uuid=True),
        ForeignKey("leads.id", ondelete="CASCADE"),
        nullable=False,
    )
    interaction_type = Column(String(100), nullable=False)
    payload = Column(JSONB, nullable=True)
    occurred_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    lead = relationship("Lead", back_populates="interactions", lazy="selectin")