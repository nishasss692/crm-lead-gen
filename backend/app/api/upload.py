# backend/app/api/upload.py
import io
import re
import uuid
import logging
from collections import defaultdict
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import pandas as pd

try:
    from app.core.database import get_db
    from app.models.lead import Lead, Circle, Region, Division, Agent
except ImportError:
    from backend.app.core.database import get_db
    from backend.app.models.lead import Lead, Circle, Region, Division, Agent

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Lead Ingestion"])


def normalize_string(val: Any) -> Optional[str]:
    """Helper to clean string data, stripping whitespace and handling NaN."""
    if val is None or pd.isna(val):
        return None
    s = str(val).strip()
    return s if s else None


def resolve_column(df_cols: List[str], candidate_patterns: List[str]) -> Optional[str]:
    """Find a matching column name in DataFrame using pattern regex / substring."""
    for cand in candidate_patterns:
        for col in df_cols:
            clean_col = re.sub(r"[_\s\-]+", " ", str(col)).strip().lower()
            clean_cand = re.sub(r"[_\s\-]+", " ", cand).strip().lower()
            if clean_cand == clean_col or clean_cand in clean_col:
                return col
    return None


def extract_names(
    row: pd.Series,
    name_col: Optional[str],
    company_col: Optional[str],
) -> Tuple[str, str, Optional[str]]:
    """Extract first_name, last_name, and company_name with sensible fallbacks."""
    contact_name = normalize_string(row.get(name_col)) if name_col else None
    company_name = normalize_string(row.get(company_col)) if company_col else None

    if contact_name:
        parts = contact_name.split(maxsplit=1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else "Exporter"
    elif company_name:
        parts = company_name.split(maxsplit=1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else "Enterprise"
    else:
        first_name = "Customs"
        last_name = "Exporter"

    return first_name[:100], last_name[:100], company_name[:255] if company_name else None


def clean_or_generate_email(
    raw_email: Optional[str],
    company_name: Optional[str],
    row_idx: int,
    seen_emails: set,
) -> str:
    """Validate email or generate a deterministic fallback to satisfy DB constraints."""
    email = normalize_string(raw_email)

    # Basic regex validation
    if email and re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email):
        email_clean = email.lower()
    else:
        # Fallback generated email based on company / index
        base_slug = re.sub(r"[^a-zA-Z0-9]+", "", str(company_name or "exporter")).lower()
        if not base_slug:
            base_slug = "customs_lead"
        email_clean = f"contact_{base_slug}_{row_idx}@exporterlead.com"

    # Handle duplicates within batch or DB
    if email_clean in seen_emails:
        prefix, domain = email_clean.split("@", 1)
        email_clean = f"{prefix}+{uuid.uuid4().hex[:5]}@{domain}"

    seen_emails.add(email_clean)
    return email_clean[:255]


def map_location_to_division(
    location_str: str,
    divisions_by_name: Dict[str, Division],
    default_division: Optional[Division],
) -> Optional[Division]:
    """
    Map City, State, Port, or Address string to a matching Division.
    Uses direct substring matching against seeded division & region names.
    """
    if not location_str:
        return default_division

    loc_lower = location_str.lower()

    # 1. Direct name or keyword matching against division names
    for div_name, div in divisions_by_name.items():
        key = div_name.lower().replace("division", "").strip()
        if key in loc_lower or loc_lower in key:
            return div

    # 2. Heuristic mapping for Indian & global major export hubs
    keyword_mapping = {
        "delhi": "South Delhi Division",
        "gurgaon": "Gurgaon Division",
        "gurugram": "Gurgaon Division",
        "noida": "Noida Division",
        "faridabad": "Noida Division",
        "mumbai": "South Mumbai Division",
        "bombay": "South Mumbai Division",
        "navi mumbai": "Navi Mumbai Division",
        "thane": "Thane Division",
        "pune": "Pune Division",
        "goa": "Goa Division",
        "ahmedabad": "Ahmedabad Division",
        "surat": "Surat Division",
        "vadodara": "Vadodara Division",
        "bangalore": "Bangalore Central Division",
        "bengaluru": "Bangalore Central Division",
        "mysore": "Mysore Division",
        "chennai": "Chennai North Division",
        "madras": "Chennai North Division",
        "coimbatore": "Coimbatore Division",
        "hyderabad": "Hyderabad Central Division",
        "secunderabad": "Hyderabad Central Division",
        "kolkata": "Kolkata Central Division",
        "calcutta": "Kolkata Central Division",
        "howrah": "Howrah Division",
        "bhubaneswar": "Bhubaneswar Division",
        "patna": "Patna Division",
        "chandigarh": "Chandigarh Division",
        "ludhiana": "Ludhiana Division",
        "amritsar": "Amritsar Division",
    }

    for kw, div_name in keyword_mapping.items():
        if kw in loc_lower:
            if div_name in divisions_by_name:
                return divisions_by_name[div_name]

    return default_division


@router.post(
    "/leads/upload-excel",
    status_code=status.HTTP_200_OK,
    summary="Batch ingestion of Excel customs export leads with Round-Robin distribution",
)
async def upload_excel_leads(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Ingest a 7,200+ row Customs Exporters Excel file:
    1. Reads and cleans the Excel spreadsheet in-memory via pandas.
    2. Maps geographic locations (City/State/Port) to the strict Division hierarchy.
    3. Performs even Round-Robin assignment to active sales agents per division.
    4. Performs high-throughput bulk insertion into PostgreSQL.
    5. Returns an ingestion metrics report.
    """
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload an Excel (.xlsx or .xls) file.",
        )

    try:
        # Read file contents into memory
        file_bytes = await file.read()
        df = pd.read_excel(io.BytesIO(file_bytes))
    except Exception as e:
        logger.error(f"Error parsing Excel file {file.filename}: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unable to parse Excel file. Error: {str(e)}",
        )

    total_rows = len(df)
    if total_rows == 0:
        return {
            "status": "success",
            "filename": file.filename,
            "total_rows_read": 0,
            "successful_inserts": 0,
            "failed_rows": 0,
            "assignments_per_division": {},
            "assignments_per_agent": {},
        }

    # 1. Pre-fetch all Divisions from Database for in-memory O(1) matching
    div_res = await db.execute(select(Division))
    divisions: List[Division] = div_res.scalars().all()
    if not divisions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No divisions found in database. Please run territory initialization first.",
        )

    divisions_by_name: Dict[str, Division] = {d.name: d for d in divisions}
    default_division = divisions[0]

    # 2. Pre-fetch active Agents grouped by division_id
    agents_res = await db.execute(
        select(Agent).where(Agent.is_active == True).order_by(Agent.last_assigned_at.asc().nullsfirst())
    )
    all_active_agents: List[Agent] = agents_res.scalars().all()

    agents_by_division: Dict[UUID, List[Agent]] = defaultdict(list)
    for ag in all_active_agents:
        if ag.division_id:
            agents_by_division[ag.division_id].append(ag)

    # 3. Pre-fetch existing lead emails from database to prevent unique constraint collisions
    existing_emails_res = await db.execute(select(Lead.email))
    seen_emails = set(existing_emails_res.scalars().all())

    # 4. Resolve column names from the 17-column customs format
    cols = [str(c) for c in df.columns]
    company_col = resolve_column(cols, ["company name", "exporter name", "party name", "firm name", "iec name", "company", "name"])
    contact_col = resolve_column(cols, ["contact person", "contact name", "director", "proprietor", "authorized signatory", "contact"])
    email_col = resolve_column(cols, ["email", "e-mail", "email id", "contact email", "mail id", "e_mail"])
    city_col = resolve_column(cols, ["city", "district", "destination city", "town", "port", "port of loading"])
    state_col = resolve_column(cols, ["state", "province", "region", "state name"])
    country_col = resolve_column(cols, ["country", "destination country", "country name"])
    address_col = resolve_column(cols, ["address", "location", "address 1", "registered address"])
    value_col = resolve_column(cols, ["export value", "fob value", "value", "turnover", "invoice value"])

    # 5. In-memory round-robin assignment trackers per division
    rr_index_per_division: Dict[UUID, int] = defaultdict(int)
    assignments_per_division: Dict[str, int] = defaultdict(int)
    assignments_per_agent: Dict[str, int] = defaultdict(int)

    leads_to_insert: List[Lead] = []
    failed_rows = 0
    now_utc = datetime.now(timezone.utc)

    for idx, row in df.iterrows():
        try:
            first_name, last_name, company_name = extract_names(row, contact_col, company_col)
            email = clean_or_generate_email(
                row.get(email_col) if email_col else None,
                company_name,
                idx,
                seen_emails,
            )

            # Combine geographic hints
            geo_parts = [
                normalize_string(row.get(city_col)) if city_col else None,
                normalize_string(row.get(state_col)) if state_col else None,
                normalize_string(row.get(address_col)) if address_col else None,
            ]
            geo_query = " ".join([p for p in geo_parts if p])

            matched_division = map_location_to_division(
                geo_query, divisions_by_name, default_division
            )
            division_id = matched_division.id if matched_division else None
            division_name = matched_division.name if matched_division else "Unassigned"

            # Round-Robin assignment in the matched division
            assigned_agent_id = None
            if division_id and agents_by_division[division_id]:
                div_agents = agents_by_division[division_id]
                current_rr_idx = rr_index_per_division[division_id]
                assigned_agent = div_agents[current_rr_idx % len(div_agents)]
                rr_index_per_division[division_id] += 1

                assigned_agent_id = assigned_agent.id
                assigned_agent.last_assigned_at = now_utc
                assignments_per_agent[assigned_agent.name] += 1

            assignments_per_division[division_name] += 1

            # Estimate ML lead score based on deal value or exporter completeness
            deal_val = 50.0
            if value_col and pd.notna(row.get(value_col)):
                try:
                    num_val = float(re.sub(r"[^\d.]", "", str(row.get(value_col))))
                    deal_val = min(99.0, max(50.0, 50.0 + (num_val / 100000.0)))
                except Exception:
                    deal_val = 75.0

            lead = Lead(
                id=uuid.uuid4(),
                first_name=first_name,
                last_name=last_name,
                email=email,
                company_name=company_name,
                status="new",
                ml_lead_score=deal_val,
                division_id=division_id,
                assigned_agent_id=assigned_agent_id,
                created_at=now_utc,
            )
            leads_to_insert.append(lead)

        except Exception as row_err:
            logger.warning(f"Error processing row {idx}: {row_err}")
            failed_rows += 1

    # 6. Bulk write to PostgreSQL in chunks
    CHUNK_SIZE = 1000
    try:
        for i in range(0, len(leads_to_insert), CHUNK_SIZE):
            chunk = leads_to_insert[i : i + CHUNK_SIZE]
            db.add_all(chunk)
            await db.flush()

        await db.commit()
    except Exception as commit_err:
        await db.rollback()
        logger.error(f"Bulk insert failed: {commit_err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database transaction failed during bulk ingestion: {str(commit_err)}",
        )

    return {
        "status": "success",
        "filename": file.filename,
        "total_rows_read": total_rows,
        "successful_inserts": len(leads_to_insert),
        "failed_rows": failed_rows,
        "divisions_covered": len(assignments_per_division),
        "assignments_per_division": dict(assignments_per_division),
        "assignments_per_agent": dict(assignments_per_agent),
    }
