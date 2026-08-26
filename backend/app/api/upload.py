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
from fastapi.responses import StreamingResponse, Response
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

def clean_division_name(val: Any) -> Optional[str]:
    """Convert 'Division' column to Title Case, keeping 'BG' uppercase."""
    s = normalize_string(val)
    if not s:
        return None
    
    parts = s.split()
    cleaned_parts = []
    for p in parts:
        if p.upper() == "BG":
            cleaned_parts.append("BG")
        else:
            cleaned_parts.append(p.capitalize())
    return " ".join(cleaned_parts)


def resolve_column(df_cols: List[str], candidate_patterns: List[str]) -> Optional[str]:
    """Find a matching column name in DataFrame using pattern regex / substring."""
    # Try exact match first
    for col in df_cols:
        col_clean = col.lower().strip().replace('_', ' ')
        for pat in candidate_patterns:
            pat_clean = pat.lower().strip().replace('_', ' ')
            if pat_clean == col_clean:
                return col
                
    # Fallback to partial match
    for col in df_cols:
        col_lower = col.lower().strip()
        for pat in candidate_patterns:
            if pat in col_lower:
                # Prevent "division" from matching "division id"
                if pat == "division" and "id" in col_lower:
                    continue
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
    
    # New columns for exact mapping
    sl_no_col = resolve_column(cols, ["sl no", "sl_no", "serial"])
    exporter_name_col = resolve_column(cols, ["exporter name", "exporter_name"])
    pincode_col = resolve_column(cols, ["pincode", "pin code", "zip"])
    div_id_col = resolve_column(cols, ["division id", "division_id"])
    division_col = resolve_column(cols, ["division", "division name", "division_name"])
    region_col = resolve_column(cols, ["region"])
    assigned_agent_name_col = resolve_column(cols, ["assigned agent name", "assigned me name", "assigned_agent_name", "assigned me", "assigned_me"])
    date_of_meeting_col = resolve_column(cols, ["date of meeting", "meeting date", "date_of_meeting"])
    customer_met_name_col = resolve_column(cols, ["customer met name", "customer met", "customer_met_name", "customer_met"])
    contact_number_col = resolve_column(cols, ["contact number", "contact_number", "phone", "mobile"])
    email_id_col = resolve_column(cols, ["email id", "email_id"])
    service_col = resolve_column(cols, ["service presently using", "service_presently_using", "service using"])
    volume_col = resolve_column(cols, ["monthly appx volume", "monthly_appx_volume", "monthly volume", "volume"])
    outcome_col = resolve_column(cols, ["meeting outcome", "meeting_outcome", "outcome"])
    contract_id_col = resolve_column(cols, ["contract id", "contract_id"])
    remarks_col = resolve_column(cols, ["remarks"])

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
            
            excel_div_name = clean_division_name(row.get(division_col)) if division_col else None
            
            if excel_div_name:
                division_name = excel_div_name
                matched = [d for d in divisions if d.name.lower() == excel_div_name.lower()]
                division_uuid = matched[0].id if matched else None
            else:
                matched_division = map_location_to_division(
                    geo_query, divisions_by_name, default_division
                )
                division_uuid = matched_division.id if matched_division else None
                division_name = matched_division.name if matched_division else "Unassigned"

            # Round-Robin assignment in the matched division
            assigned_agent_id = None
            if division_uuid and agents_by_division.get(division_uuid):
                div_agents = agents_by_division[division_uuid]
                current_rr_idx = rr_index_per_division[division_uuid]
                assigned_agent = div_agents[current_rr_idx % len(div_agents)]
                rr_index_per_division[division_uuid] += 1

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

            try:
                sl_val = int(row.get(sl_no_col)) if sl_no_col and pd.notna(row.get(sl_no_col)) else None
            except:
                sl_val = None
                
            lead = Lead(
                id=uuid.uuid4(),
                first_name=first_name,
                last_name=last_name,
                email=email,
                company_name=company_name,
                status="new",
                ml_lead_score=deal_val,
                division_id=normalize_string(row.get(div_id_col)) if div_id_col else None,
                division_name=division_name,
                assigned_agent_id=assigned_agent_id,
                created_at=now_utc,
                
                # New exact columns
                sl_no=sl_val,
                exporter_name=normalize_string(row.get(exporter_name_col)) if exporter_name_col else normalize_string(row.get(company_col)),
                address=normalize_string(row.get(address_col)) if address_col else None,
                pincode=normalize_string(row.get(pincode_col)) if pincode_col else None,
                region=normalize_string(row.get(region_col)) if region_col else None,
                assigned_agent_name=normalize_string(row.get(assigned_agent_name_col)) if assigned_agent_name_col else None,
                date_of_meeting=normalize_string(row.get(date_of_meeting_col)) if date_of_meeting_col else None,
                customer_met_name=normalize_string(row.get(customer_met_name_col)) if customer_met_name_col else None,
                contact_number=normalize_string(row.get(contact_number_col)) if contact_number_col else None,
                email_id=normalize_string(row.get(email_id_col)) if email_id_col else normalize_string(row.get(email_col)),
                service_presently_using=normalize_string(row.get(service_col)) if service_col else None,
                monthly_appx_volume=normalize_string(row.get(volume_col)) if volume_col else None,
                meeting_outcome=normalize_string(row.get(outcome_col)) if outcome_col else None,
                contract_id=normalize_string(row.get(contract_id_col)) if contract_id_col else None,
                remarks=normalize_string(row.get(remarks_col)) if remarks_col else None,
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

@router.get(
    "/leads/export-excel",
    summary="Export all leads to an Excel file",
)
async def export_excel_leads(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Lead).order_by(Lead.created_at.desc()))
    leads = result.scalars().all()

    data = []
    for lead in leads:
        data.append({
            "Lead ID": str(lead.id),
            "First Name": lead.first_name,
            "Last Name": lead.last_name,
            "Email": lead.email,
            "Company Name": lead.company_name,
            "Status": lead.status,
            "Query Notes": lead.query_notes,
            "SL No": lead.sl_no,
            "Exporter Name": lead.exporter_name,
            "Address": lead.address,
            "PINCODE": lead.pincode,
            "Division ID": lead.division_id,
            "Division Name": lead.division_name,
            "Region": lead.region,
            "Assigned To (ME)": lead.assigned_agent_name,
            "Date of Meeting": lead.date_of_meeting,
            "Customer Met": lead.customer_met_name,
            "Contact No.": lead.contact_number,
            "Email ID": lead.email_id,
            "Service Using": lead.service_presently_using,
            "Monthly Vol (Rs)": lead.monthly_appx_volume,
            "Outcome": lead.meeting_outcome,
            "Contract ID": lead.contract_id,
            "Remarks": lead.remarks,
            "Created At": lead.created_at.strftime("%Y-%m-%d %H:%M:%S") if lead.created_at else ""
        })

    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Leads")

    output.seek(0)

    headers = {
        "Content-Disposition": 'attachment; filename="leads_export.xlsx"'
    }

    return Response(
        content=output.getvalue(),
        headers=headers,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
