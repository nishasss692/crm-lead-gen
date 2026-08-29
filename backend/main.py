from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status, Body
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, func
from sqlalchemy.orm import declarative_base, sessionmaker, Session
import pandas as pd
import io
import re
import jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional, List

# 1. Setup
app = FastAPI(title="India Post Lead Management API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = "sqlite:///./crm.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 2. Database Model (Lead)
class Lead(Base):
    __tablename__ = "leads"
    
    id = Column(Integer, primary_key=True, index=True)
    sl_no = Column(String, nullable=True)
    exporter_name = Column(String, nullable=True, index=True)
    address = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    division_id = Column(String, nullable=True)
    division = Column(String, nullable=True, index=True)
    region = Column(String, nullable=True, index=True)
    assigned_agent = Column(String, nullable=True)
    date_of_meeting = Column(String, nullable=True)
    customer_met = Column(String, nullable=True)
    contact_number = Column(String, nullable=True, index=True)
    email = Column(String, nullable=True, index=True)
    service_using = Column(String, nullable=True)
    monthly_volume = Column(String, nullable=True)
    meeting_outcome = Column(String, nullable=True)
    contract_id = Column(String, nullable=True)
    remarks = Column(String, nullable=True)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String) # CO, RO, Division, ME
    region = Column(String, nullable=True)
    division = Column(String, nullable=True)

Base.metadata.create_all(bind=engine)

# 2.5 Auth Setup
SECRET_KEY = "super-secret-key-for-dev"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

@app.post("/api/login")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role, "region": user.region, "division": user.division}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": {"username": user.username, "role": user.role, "region": user.region, "division": user.division}}

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str

@app.post("/api/change-password")
def change_password(request: PasswordChangeRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not verify_password(request.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    current_user.password_hash = get_password_hash(request.new_password)
    db.commit()
    return {"success": True, "message": "Password updated successfully"}

# 3. File Upload Endpoint (Excel & CSV)
@app.post("/api/upload-excel")
async def upload_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):
    filename = file.filename.lower()
    if not (filename.endswith('.xls') or filename.endswith('.xlsx') or filename.endswith('.csv')):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.")
    
    try:
        contents = await file.read()
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        # Remove NaN values and format as string
        df = df.fillna("")
        df = df.astype(str)
        
        # Sanitize column names
        def sanitize_column_name(col):
            return str(col).strip().lower().replace(" ", "_").replace("-", "_")
            
        df.columns = [sanitize_column_name(col) for col in df.columns]
        
        # Get valid columns from the model
        valid_columns = {c.name for c in Lead.__table__.columns if c.name != "id"}
        
        # Insert objects mapping what we can
        db_cols = set(df.columns).intersection(valid_columns)
        
        leads_to_insert = []
        for _, row in df.iterrows():
            lead_data = {col: str(row[col]).strip() for col in db_cols}
            leads_to_insert.append(Lead(**lead_data))
            
        db.bulk_save_objects(leads_to_insert)
        db.commit()
        
        return {"success": True, "count": len(leads_to_insert), "message": f"Successfully processed {len(leads_to_insert)} lead records from {file.filename}."}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error parsing file: {str(e)}")

# 4. RBAC Filter
def apply_rbac_filter(query, user: User):
    if user.role == "CO":
        pass # sees everything
    elif user.role == "RO":
        query = query.filter(Lead.region == user.region)
    elif user.role == "Division":
        query = query.filter(Lead.division == user.division)
    elif user.role == "ME":
        query = query.filter(Lead.region == user.region, Lead.division == user.division)
    return query

# 5. Lead Data Endpoints
@app.get("/api/leads")
def get_leads(division_name: str = "", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Lead)
    query = apply_rbac_filter(query, current_user)
    if division_name and division_name != "All Divisions":
        query = query.filter(Lead.division == division_name)
    return query.order_by(Lead.id.desc()).all()

@app.get("/api/divisions")
def get_divisions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Lead.division)
    query = apply_rbac_filter(query, current_user)
    divisions = query.distinct().all()
    div_list = [div[0].strip() for div in divisions if div[0] and div[0].strip() and div[0].strip().lower() not in ['nan', 'none']]
    return sorted(list(set(div_list)))

# 6. Comprehensive Analytics Endpoint for Dashboard
@app.get("/api/analytics")
def get_analytics(division_name: str = "", timeframe: str = "Last 30 Days", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Lead)
    query = apply_rbac_filter(query, current_user)
    
    if division_name and division_name != "All Divisions":
        query = query.filter(Lead.division == division_name)
    
    leads = query.all()
    total = len(leads)
    
    # Status metrics
    contact_pending = 0
    contacted = 0
    interested = 0
    not_interested = 0
    follow_up = 0
    willing = 0
    onboarded = 0
    onboard_pending = 0
    
    # Aggregation containers
    meetings_over_time = {}
    division_map = {}
    service_map = {}
    agents = {}
    monthly_pipeline_est = 0
    
    SERVICE_COLORS = {
        "speed post b2b": "#D1242F",
        "speed post": "#D1242F",
        "business parcel": "#F7941D",
        "parcel": "#F7941D",
        "direct portal": "#1B2A4A",
        "portal": "#1B2A4A",
        "circle referrals": "#2E7D32",
        "referral": "#2E7D32",
        "postal life insurance": "#0284C7",
        "pli": "#0284C7",
        "logistics post": "#9333EA",
        "express parcel": "#E11D48",
        "retail post": "#D97706",
        "other": "#64748B"
    }

    for lead in leads:
        outcome = (lead.meeting_outcome or "").strip().lower()
        has_contract = bool((lead.contract_id or "").strip() and (lead.contract_id or "").strip().lower() not in ['nan', 'none'])
        div_name = (lead.division or "Unassigned").strip()
        if not div_name or div_name.lower() in ['nan', 'none']:
            div_name = "Other Circle"
            
        service_name = (lead.service_using or "Speed Post B2B").strip()
        if not service_name or service_name.lower() in ['nan', 'none']:
            service_name = "Speed Post B2B"
        
        # Parse volume for pipeline valuation
        vol_str = (lead.monthly_volume or "").strip()
        try:
            # Extract digits
            nums = re.findall(r'\d+', vol_str.replace(',', ''))
            if nums:
                monthly_pipeline_est += int(nums[0]) * 120 # rough valuation factor per piece/volume
            else:
                monthly_pipeline_est += 2500
        except Exception:
            monthly_pipeline_est += 2500
            
        # Meeting Outcome categorization
        if not outcome or outcome in ['nan', 'none', 'pending']:
            contact_pending += 1
        else:
            contacted += 1
            
        if "positive" in outcome or "interested" in outcome:
            interested += 1
            if not has_contract:
                willing += 1
        elif "not interested" in outcome or "rejected" in outcome:
            not_interested += 1
        elif "follow" in outcome or "warm" in outcome:
            follow_up += 1
            
        if has_contract or "onboard" in outcome:
            onboarded += 1
        else:
            onboard_pending += 1
            
        # Division Aggregation for Bar Chart
        if div_name not in division_map:
            division_map[div_name] = {"division": div_name, "total": 0, "contacted": 0, "interested": 0, "onboarded": 0, "pending": 0}
        division_map[div_name]["total"] += 1
        if outcome and outcome not in ['nan', 'none', 'pending']:
            division_map[div_name]["contacted"] += 1
        if "positive" in outcome or "interested" in outcome:
            division_map[div_name]["interested"] += 1
        if has_contract or "onboard" in outcome:
            division_map[div_name]["onboarded"] += 1
        else:
            division_map[div_name]["pending"] += 1
            
        # Service Distribution for Donut Chart
        service_clean = service_name.title()
        service_map[service_clean] = service_map.get(service_clean, 0) + 1

        # Agent performance
        agent_name = (lead.assigned_agent or "Unassigned").strip()
        if not agent_name or agent_name.lower() in ["nan", "none"]:
            agent_name = "Unassigned"
        if agent_name not in agents:
            agents[agent_name] = {"leads": 0, "contacted": 0, "converted": 0}
        agents[agent_name]["leads"] += 1
        if outcome and outcome not in ["nan", "none", "pending"]:
            agents[agent_name]["contacted"] += 1
        if has_contract or "onboard" in outcome:
            agents[agent_name]["converted"] += 1
            
        # Temporal series
        date_str = lead.date_of_meeting
        if date_str:
            date_clean = str(date_str).strip().split(' ')[0]
            if date_clean and date_clean not in ['nan', 'None', '', 'NaT']:
                meetings_over_time[date_clean] = meetings_over_time.get(date_clean, 0) + 1

    contacted_rate = round((contacted / total * 100) if total > 0 else 0, 1)
    onboarding_rate = round((onboarded / total * 100) if total > 0 else 0, 1)
    
    # Division Performance List (sorted by total descending)
    division_performance = list(division_map.values())
    division_performance.sort(key=lambda x: x["total"], reverse=True)
    # Take top 8 divisions for optimal chart readability
    top_division_performance = division_performance[:10]

    # Service Distribution formatting
    service_distribution = []
    for s_name, count in sorted(service_map.items(), key=lambda x: x[1], reverse=True):
        pct = round((count / total * 100) if total > 0 else 0, 1)
        color = SERVICE_COLORS.get(s_name.lower(), "#F7941D")
        service_distribution.append({
            "name": s_name,
            "count": count,
            "value": pct,
            "color": color
        })
        
    if not service_distribution:
        service_distribution = [
            {"name": "Speed Post B2B", "count": 45, "value": 45, "color": "#D1242F"},
            {"name": "Business Parcel", "count": 30, "value": 30, "color": "#F7941D"},
            {"name": "Direct Portal", "count": 15, "value": 15, "color": "#1B2A4A"},
            {"name": "Circle Referrals", "count": 10, "value": 10, "color": "#2E7D32"}
        ]

    # Time series formatting
    try:
        time_series = [{"date": k, "meetings": v} for k, v in sorted(meetings_over_time.items())]
    except Exception:
        time_series = [{"date": k, "meetings": v} for k, v in meetings_over_time.items()]
        
    # Format pipeline value in INR Crores / Lakhs
    if monthly_pipeline_est >= 10000000:
        pipeline_formatted = f"₹ {(monthly_pipeline_est / 10000000):.2f} Cr"
    elif monthly_pipeline_est >= 100000:
        pipeline_formatted = f"₹ {(monthly_pipeline_est / 100000):.2f} L"
    else:
        pipeline_formatted = f"₹ {monthly_pipeline_est:,}"

    # Outcome breakdown for Bar/Summary charts
    outcome_breakdown = [
        {"status": "Contact Pending", "count": contact_pending, "color": "#F59E0B"},
        {"status": "Contacted", "count": contacted, "color": "#3B82F6"},
        {"status": "Interested", "count": interested, "color": "#10B981"},
        {"status": "Follow-up", "count": follow_up, "color": "#F97316"},
        {"status": "Onboarded", "count": onboarded, "color": "#06B6D4"},
        {"status": "Not Interested", "count": not_interested, "color": "#94A3B8"}
    ]

    return {
        "total_leads": total,
        "contact_pending": contact_pending,
        "contacted": contacted,
        "interested": interested,
        "not_interested": not_interested,
        "follow_up": follow_up,
        "willing_to_onboard": willing,
        "onboarded": onboarded,
        "onboard_pending": onboard_pending,
        "contacted_rate": contacted_rate,
        "onboarding_rate": onboarding_rate,
        "pipeline_value": pipeline_formatted,
        "pipeline_raw": monthly_pipeline_est,
        "time_series": time_series,
        "division_performance": top_division_performance,
        "service_distribution": service_distribution,
        "outcome_breakdown": outcome_breakdown,
        "agent_performance": [
            {
                "name": agent,
                "leads": stats["leads"],
                "contacted": stats["contacted"],
                "converted": stats["converted"],
                "conversion_rate": round((stats["converted"] / stats["leads"] * 100) if stats["leads"] > 0 else 0, 1)
            }
            for agent, stats in sorted(agents.items(), key=lambda x: x[1]["converted"], reverse=True)
        ]
    }

# 7. Deduplication Endpoints
def normalize_string(text: Optional[str]) -> str:
    if not text:
        return ""
    cleaned = str(text).strip().lower()
    if cleaned in ['nan', 'none', 'null', 'n/a', '']:
        return ""
    return re.sub(r'[^a-z0-9]', '', cleaned)

def normalize_phone(phone: Optional[str]) -> str:
    if not phone:
        return ""
    digits = re.sub(r'\D', '', str(phone))
    if len(digits) == 12 and digits.startswith('91'):
        digits = digits[2:]
    return digits if len(digits) >= 8 else ""

@app.get("/api/leads/duplicates-summary")
def get_duplicates_summary(criteria: str = "name_and_contact", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Lead)
    query = apply_rbac_filter(query, current_user)
    leads = query.order_by(Lead.id.asc()).all()
    
    seen_keys = set()
    duplicate_lead_ids = set()
    
    for lead in leads:
        norm_name = normalize_string(lead.exporter_name)
        norm_phone = normalize_phone(lead.contact_number)
        norm_email = normalize_string(lead.email)
        norm_sl = normalize_string(lead.sl_no)
        
        key = None
        if criteria == "name":
            if norm_name:
                key = f"name:{norm_name}"
        elif criteria == "contact":
            if norm_phone:
                key = f"phone:{norm_phone}"
        elif criteria == "email":
            if norm_email and len(norm_email) > 4:
                key = f"email:{norm_email}"
        elif criteria == "sl_no":
            if norm_sl:
                key = f"sl:{norm_sl}"
        else: # default: name_and_contact composite
            if norm_name:
                key = f"name:{norm_name}"
            elif norm_phone:
                key = f"phone:{norm_phone}"
            elif norm_email and len(norm_email) > 4:
                key = f"email:{norm_email}"
                
        if key:
            if key in seen_keys:
                duplicate_lead_ids.add(lead.id)
            else:
                seen_keys.add(key)

    return {
        "total_leads": len(leads),
        "duplicate_count": len(duplicate_lead_ids),
        "unique_leads_estimate": len(leads) - len(duplicate_lead_ids),
        "criteria": criteria
    }

class DeduplicateRequest(BaseModel):
    criteria: Optional[str] = "name_and_contact" # "name_and_contact", "name", "contact", "email", "sl_no"

@app.post("/api/leads/deduplicate")
def deduplicate_leads(req: DeduplicateRequest = Body(default=DeduplicateRequest()), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Lead)
    query = apply_rbac_filter(query, current_user)
    leads = query.order_by(Lead.id.asc()).all()
    
    seen_keys = set()
    to_delete_ids = []
    
    criteria = req.criteria or "name_and_contact"
    
    for lead in leads:
        norm_name = normalize_string(lead.exporter_name)
        norm_phone = normalize_phone(lead.contact_number)
        norm_email = normalize_string(lead.email)
        norm_sl = normalize_string(lead.sl_no)
        
        key = None
        if criteria == "name":
            if norm_name:
                key = f"name:{norm_name}"
        elif criteria == "contact":
            if norm_phone:
                key = f"phone:{norm_phone}"
        elif criteria == "email":
            if norm_email and len(norm_email) > 4:
                key = f"email:{norm_email}"
        elif criteria == "sl_no":
            if norm_sl:
                key = f"sl:{norm_sl}"
        else: # default: name_and_contact composite
            if norm_name:
                key = f"name:{norm_name}"
            elif norm_phone:
                key = f"phone:{norm_phone}"
            elif norm_email and len(norm_email) > 4:
                key = f"email:{norm_email}"
        
        if key:
            if key in seen_keys:
                to_delete_ids.append(lead.id)
            else:
                seen_keys.add(key)
                
    if to_delete_ids:
        # Delete duplicate leads in batch
        db.query(Lead).filter(Lead.id.in_(to_delete_ids)).delete(synchronize_session=False)
        db.commit()
        
    remaining_count = db.query(Lead).count()
    
    return {
        "success": True,
        "removed_count": len(to_delete_ids),
        "remaining_count": remaining_count,
        "criteria_used": criteria,
        "message": f"Successfully removed {len(to_delete_ids)} duplicate records. {remaining_count} unique leads remaining."
    }

# 8. Single Lead Update Endpoint
@app.patch("/api/leads/{lead_id}")
async def update_lead(lead_id: int, data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    field_map = {
        "dateOfMeeting": "date_of_meeting",
        "contactNumber": "contact_number",
        "serviceUsing": "service_using",
        "monthlyVolume": "monthly_volume",
        "meetingOutcome": "meeting_outcome",
        "contractId": "contract_id",
        "assignedAgent": "assigned_agent",
        "remarks": "remarks"
    }
    
    for key, value in data.items():
        db_key = field_map.get(key, key)
        if hasattr(lead, db_key):
            setattr(lead, db_key, str(value) if value is not None else "")
            
    db.commit()
    return {"success": True, "message": "Lead updated successfully"}
