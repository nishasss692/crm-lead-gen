# backend/app/core/lead_engine.py
import logging
from datetime import datetime, timezone
from typing import Optional, List
from uuid import UUID
from passlib.hash import bcrypt

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

try:
    from app.models.lead import Circle, Region, Division, Agent, Lead
except ImportError:
    from backend.app.models.lead import Circle, Region, Division, Agent, Lead

logger = logging.getLogger(__name__)

# Predefined Strict Hierarchical Territory Structure: Circle -> Region -> Division
TERRITORY_SEED_DATA = [
    {
        "name": "North Circle",
        "code": "NC",
        "regions": [
            {
                "name": "Delhi NCR Region",
                "divisions": [
                    "South Delhi Division",
                    "North Delhi Division",
                    "Gurgaon Division",
                    "Noida Division",
                ],
            },
            {
                "name": "Punjab & Haryana Region",
                "divisions": [
                    "Chandigarh Division",
                    "Ludhiana Division",
                    "Amritsar Division",
                ],
            },
        ],
    },
    {
        "name": "West Circle",
        "code": "WC",
        "regions": [
            {
                "name": "Mumbai Metro Region",
                "divisions": [
                    "South Mumbai Division",
                    "Mumbai Suburban Division",
                    "Navi Mumbai Division",
                    "Thane Division",
                ],
            },
            {
                "name": "Maharashtra & Goa Region",
                "divisions": [
                    "Pune Division",
                    "Nagpur Division",
                    "Goa Division",
                ],
            },
            {
                "name": "Gujarat Region",
                "divisions": [
                    "Ahmedabad Division",
                    "Surat Division",
                    "Vadodara Division",
                ],
            },
        ],
    },
    {
        "name": "South Circle",
        "code": "SC",
        "regions": [
            {
                "name": "Karnataka Region",
                "divisions": [
                    "Bangalore Central Division",
                    "Bangalore Tech Corridor Division",
                    "Mysore Division",
                ],
            },
            {
                "name": "Tamil Nadu Region",
                "divisions": [
                    "Chennai North Division",
                    "Chennai South Division",
                    "Coimbatore Division",
                ],
            },
            {
                "name": "Telangana & AP Region",
                "divisions": [
                    "Hyderabad Central Division",
                    "Cyberabad Division",
                    "Visakhapatnam Division",
                ],
            },
        ],
    },
    {
        "name": "East Circle",
        "code": "EC",
        "regions": [
            {
                "name": "Kolkata & Bengal Region",
                "divisions": [
                    "Kolkata Central Division",
                    "Salt Lake Sector V Division",
                    "Howrah Division",
                ],
            },
            {
                "name": "Odisha & Bihar Region",
                "divisions": [
                    "Bhubaneswar Division",
                    "Patna Division",
                ],
            },
        ],
    },
]


async def seed_territories_and_agents(db: AsyncSession) -> None:
    """
    Seeds predefined Circles, Regions, and Divisions if they do not exist.
    Ensures every Division has active sales agents to support Round-Robin lead assignment.
    """
    # 1. Check if Circles are already seeded
    result = await db.execute(select(Circle))
    existing_circles = result.scalars().all()

    if not existing_circles:
        logger.info("Seeding Circles, Regions, and Divisions hierarchy...")

        for circle_data in TERRITORY_SEED_DATA:
            circle = Circle(
                name=circle_data["name"],
                code=circle_data.get("code"),
            )
            db.add(circle)
            await db.flush()  # Flush to generate circle.id

            for reg_data in circle_data.get("regions", []):
                region = Region(
                    circle_id=circle.id,
                    name=reg_data["name"],
                )
                db.add(region)
                await db.flush()  # Flush to generate region.id

                for div_name in reg_data.get("divisions", []):
                    division = Division(
                        region_id=region.id,
                        name=div_name,
                    )
                    db.add(division)

        await db.flush()

    # 2. Ensure each Division has assigned active Agents for Round-Robin distribution
    all_divs_res = await db.execute(select(Division))
    all_divisions = all_divs_res.scalars().all()

    for division in all_divisions:
        existing_agents_res = await db.execute(
            select(Agent).where(Agent.division_id == division.id)
        )
        existing_agents = existing_agents_res.scalars().all()

        if not existing_agents:
            div_slug = (
                division.name.lower()
                .replace(" ", "")
                .replace("&", "")
                .replace("-", "")
            )
            for i in range(1, 3):  # 2 agents per division
                emp_id = f"EMP-{div_slug[:3].upper()}-{i}"
                mobile = f"+1555{str(hash(div_slug))[-4:]}{i}"
                default_pw_hash = bcrypt.hash("password123")
                agent = Agent(
                    name=f"Agent {i} ({division.name.split()[0]})",
                    email=f"agent{i}.{div_slug}@crmleadgen.com",
                    employee_id=emp_id,
                    password_hash=default_pw_hash,
                    mobile_number=mobile,
                    is_first_login=True,
                    division_id=division.id,
                    is_active=True,
                    last_assigned_at=None,
                )
                db.add(agent)

    await db.commit()
    logger.info("Territories and agents verified/seeded successfully.")


async def assign_lead_round_robin(lead: Lead, db: AsyncSession) -> Optional[Agent]:
    """
    Distribute incoming lead among active agents sharing the same division
    using a deterministic Round-Robin strategy (ordered by last_assigned_at ASC, nulls first).
    """
    if not lead.division_name:
        logger.warning(
            f"Lead {lead.id or lead.email} has no division_name specified. Skipping round-robin."
        )
        return None

    # Find division by name
    div_result = await db.execute(
        select(Division).where(Division.name == lead.division_name)
    )
    division = div_result.scalars().first()
    if not division:
        logger.warning(
            f"Division {lead.division_name} not found. Skipping round-robin."
        )
        return None

    # Query active agents in the division
    # Priority: Agents who have never received a lead (NULL) -> Agents with oldest last_assigned_at
    query = (
        select(Agent)
        .where(
            Agent.division_id == division.id,
            Agent.is_active == True,
        )
        .order_by(
            Agent.last_assigned_at.asc().nullsfirst(),
            Agent.created_at.asc(),
        )
    )

    result = await db.execute(query)
    eligible_agent = result.scalars().first()

    if eligible_agent:
        # Assign lead to selected agent
        lead.assigned_agent_id = eligible_agent.id
        # Advance timestamp for round-robin rotation
        eligible_agent.last_assigned_at = datetime.now(timezone.utc)
        logger.info(
            f"Assigned lead {lead.email} to Agent {eligible_agent.name} (ID: {eligible_agent.id}) in Division {division.id}"
        )
        return eligible_agent

    logger.warning(
        f"No active agents found in division: {lead.division_name} for lead {lead.email}"
    )
    return None
