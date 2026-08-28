from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status, Body
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker, Session
import pandas as pd
import io
import jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta


# 1. Setup
app = FastAPI()

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
    exporter_name = Column(String, nullable=True)
    address = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    division_id = Column(String, nullable=True)
    division = Column(String, nullable=True)
    region = Column(String, nullable=True)
    assigned_agent = Column(String, nullable=True)
    date_of_meeting = Column(String, nullable=True)
    customer_met = Column(String, nullable=True)
    contact_number = Column(String, nullable=True)
    email = Column(String, nullable=True)
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

class Campaign(Base):
    __tablename__ = "campaigns"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    type = Column(String, nullable=False)
    badge = Column(String, default="Hot")
    reach = Column(String, default="10,000")
    leads_target = Column(Integer, default=500)
    budget = Column(String, default="₹ 25,000")
    leads_gen = Column(Integer, default=0)
    status = Column(String, default="Active")
    metric1_label = Column(String, default="Sent")
    metric1_val = Column(String, default="45,200")
    metric2_label = Column(String, default="Open Rate")
    metric2_val = Column(String, default="24.8%")
    metric3_label = Column(String, default="Click Rate")
    metric3_val = Column(String, default="3.2%")
    created_at = Column(String, default=lambda: datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"))

Base.metadata.create_all(bind=engine)

# Seed default campaigns if empty
def seed_default_campaigns():
    db = SessionLocal()
    try:
        if db.query(Campaign).count() == 0:
            defaults = [
                Campaign(
                    title="Q3 Speed Post Corporate Outreach",
                    type="Email & Letter Sequence",
                    badge="Hot",
                    reach="45,200",
                    leads_target=1500,
                    budget="₹ 35,000",
                    leads_gen=1450,
                    status="Active",
                    metric1_label="Sent", metric1_val="45,200",
                    metric2_label="Open Rate", metric2_val="24.8%",
                    metric3_label="Click Rate", metric3_val="3.2%"
                ),
                Campaign(
                    title="E-Commerce Logistics Decision Makers",
                    type="Digital & LinkedIn Targeting",
                    badge="Warm",
                    reach="128.5K",
                    leads_target=1000,
                    budget="₹ 12,400",
                    leads_gen=890,
                    status="Active",
                    metric1_label="Impressions", metric1_val="128.5K",
                    metric2_label="CTR", metric2_val="1.8%",
                    metric3_label="Spend", metric3_val="₹ 12,400"
                ),
                Campaign(
                    title="Enterprise Outbound Parcel Drive",
                    type="Field Marketing & Calling",
                    badge="Cold",
                    reach="4,200",
                    leads_target=300,
                    budget="₹ 18,000",
                    leads_gen=210,
                    status="Active",
                    metric1_label="Calls Made", metric1_val="4,200",
                    metric2_label="Connect Rate", metric2_val="12.5%",
                    metric3_label="Meetings", metric3_val="84"
                ),
                Campaign(
                    title="Postal Life Insurance MSME Drive",
                    type="Circle Branch Marketing",
                    badge="Hot",
                    reach="18,500",
                    leads_target=800,
                    budget="₹ 22,000",
                    leads_gen=640,
                    status="Active",
                    metric1_label="Brochures", metric1_val="18,500",
                    metric2_label="Inquiries", metric2_val="1,240",
                    metric3_label="Conversion", metric3_val="28.4%"
                )
            ]
            db.add_all(defaults)
            db.commit()
    except Exception as e:
        print("Campaign seed error:", e)
    finally:
        db.close()

seed_default_campaigns()

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

# 3. The Upload Endpoint (Supports Excel & CSV)
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
            lead_data = {col: row[col] for col in db_cols}
            leads_to_insert.append(Lead(**lead_data))
            
        db.bulk_save_objects(leads_to_insert)
        db.commit()
        
        return {"success": True, "count": len(leads_to_insert), "message": f"Successfully processed {len(leads_to_insert)} lead records from {file.filename}."}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error parsing file: {str(e)}")

# Campaign Models & Endpoints
class CampaignCreate(BaseModel):
    title: str
    type: str
    badge: str = "Hot"
    reach: str = "10,000"
    leads_target: int = 500
    budget: str = "₹ 25,000"

@app.get("/api/campaigns")
def get_campaigns(db: Session = Depends(get_db)):
    campaigns = db.query(Campaign).order_by(Campaign.id.desc()).all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "type": c.type,
            "icon": "mail" if "Email" in c.type or "Letter" in c.type else "call" if "Call" in c.type else "campaign",
            "badge": c.badge,
            "metric1": {"label": c.metric1_label, "value": c.metric1_val},
            "metric2": {"label": c.metric2_label, "value": c.metric2_val},
            "metric3": {"label": c.metric3_label, "value": c.metric3_val},
            "leadsGen": c.leads_gen,
            "status": c.status,
            "created_at": c.created_at
        }
        for c in campaigns
    ]

@app.post("/api/campaigns")
def create_campaign(campaign: CampaignCreate, db: Session = Depends(get_db)):
    new_camp = Campaign(
        title=campaign.title,
        type=campaign.type,
        badge=campaign.badge,
        reach=campaign.reach,
        leads_target=campaign.leads_target,
        budget=campaign.budget,
        leads_gen=0,
        status="Active",
        metric1_label="Reach", metric1_val=campaign.reach,
        metric2_label="Target Leads", metric2_val=str(campaign.leads_target),
        metric3_label="Budget", metric3_val=campaign.budget
    )
    db.add(new_camp)
    db.commit()
    db.refresh(new_camp)
    return {
        "id": new_camp.id,
        "title": new_camp.title,
        "type": new_camp.type,
        "icon": "mail" if "Email" in new_camp.type or "Letter" in new_camp.type else "call" if "Call" in new_camp.type else "campaign",
        "badge": new_camp.badge,
        "metric1": {"label": new_camp.metric1_label, "value": new_camp.metric1_val},
        "metric2": {"label": new_camp.metric2_label, "value": new_camp.metric2_val},
        "metric3": {"label": new_camp.metric3_label, "value": new_camp.metric3_val},
        "leadsGen": new_camp.leads_gen,
        "status": new_camp.status
    }

@app.delete("/api/campaigns/{campaign_id}")
def delete_campaign(campaign_id: int, db: Session = Depends(get_db)):
    camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")
    db.delete(camp)
    db.commit()
    return {"success": True}

# 4. Data Endpoints
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

@app.get("/api/leads")
def get_leads(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Lead)
    query = apply_rbac_filter(query, current_user)
    return query.all()

@app.get("/api/divisions")
def get_divisions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Lead.division)
    # Even if they ask for divisions, they should only see ones they have access to
    query = apply_rbac_filter(query, current_user)
    divisions = query.distinct().all()
    return [div[0] for div in divisions if div[0] and div[0] != ""]

@app.get("/api/analytics")
def get_analytics(division_name: str = "", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Lead)
    query = apply_rbac_filter(query, current_user)
    
    if division_name:
        query = query.filter(Lead.division == division_name)
    
    leads = query.all()
    
    total = len(leads)
    
    # Calculate metrics based on meeting_outcome and contract_id
    contact_pending = 0
    contacted = 0
    interested = 0
    not_interested = 0
    follow_up = 0
    willing = 0
    onboarded = 0
    onboard_pending = 0
    
    meetings_over_time = {}
    agents = {}
    
    for lead in leads:
        outcome = (lead.meeting_outcome or "").strip().lower()
        has_contract = bool((lead.contract_id or "").strip())
        
        if not outcome:
            contact_pending += 1
        else:
            contacted += 1
            
        if outcome == "positive":
            interested += 1
            if not has_contract:
                willing += 1
        elif outcome == "not interested":
            not_interested += 1
        elif outcome == "followup":
            follow_up += 1
            
        if has_contract:
            onboarded += 1
        else:
            onboard_pending += 1
            
        agent_name = (lead.assigned_agent or "Unassigned").strip()
        if not agent_name or agent_name == "nan":
            agent_name = "Unassigned"
        if agent_name not in agents:
            agents[agent_name] = {"leads": 0, "contacted": 0, "converted": 0}
        agents[agent_name]["leads"] += 1
        if outcome and outcome not in ["nan", "none"]:
            agents[agent_name]["contacted"] += 1
        if has_contract:
            agents[agent_name]["converted"] += 1
            
        date_str = lead.date_of_meeting
        if date_str:
            date_clean = str(date_str).strip().split(' ')[0]
            if date_clean and date_clean not in ['nan', 'None', '', 'NaT']:
                meetings_over_time[date_clean] = meetings_over_time.get(date_clean, 0) + 1
            
    contacted_rate = round((contacted / total * 100) if total > 0 else 0, 2)
    onboarding_rate = round((onboarded / total * 100) if total > 0 else 0, 2)
    
    agent_performance = []
    for agent, stats in agents.items():
        rate = round((stats["converted"] / stats["leads"] * 100) if stats["leads"] > 0 else 0, 2)
        agent_performance.append({
            "name": agent,
            "leads": stats["leads"],
            "contacted": stats["contacted"],
            "converted": stats["converted"],
            "conversion_rate": rate
        })
    agent_performance.sort(key=lambda x: x["converted"], reverse=True)

    try:
        time_series = [{"date": k, "meetings": v} for k, v in sorted(meetings_over_time.items())]
    except:
        time_series = [{"date": k, "meetings": v} for k, v in meetings_over_time.items()]

    funnel = [
        {"stage": "Total Leads", "value": total},
        {"stage": "Contacted", "value": contacted},
        {"stage": "Interested", "value": interested},
        {"stage": "Onboarded", "value": onboarded}
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
        "time_series": time_series,
        "funnel": funnel,
        "agent_performance": agent_performance
    }

# Extra: Included for compatibility if frontend uses it
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
        "meetingOutcome": "meeting_outcome"
    }
    
    for key, value in data.items():
        db_key = field_map.get(key, key)
        if hasattr(lead, db_key):
            setattr(lead, db_key, str(value) if value is not None else "")
            
    db.commit()
    return {"success": True}
