from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker, Session
import pandas as pd
import io

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

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 3. The Upload Endpoint
@app.post("/api/upload-excel")
async def upload_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(('.xls', '.xlsx')):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an Excel file.")
    
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        # CRITICAL FIX: Remove NaN values and float errors before inserting
        df = df.fillna("")
        df = df.astype(str)
        
        # Sanitize column names to map Excel headers to database columns
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
        
        return {"success": True, "count": len(leads_to_insert), "message": "Excel data processed successfully."}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# 4. Data Endpoints
@app.get("/api/leads")
def get_leads(db: Session = Depends(get_db)):
    return db.query(Lead).all()

@app.get("/api/divisions")
def get_divisions(db: Session = Depends(get_db)):
    divisions = db.query(Lead.division).distinct().all()
    return [div[0] for div in divisions if div[0] and div[0] != ""]

@app.get("/api/analytics")
def get_analytics(division_name: str = "", db: Session = Depends(get_db)):
    query = db.query(Lead)
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
            
    contacted_rate = round((contacted / total * 100) if total > 0 else 0, 2)
    onboarding_rate = round((onboarded / total * 100) if total > 0 else 0, 2)
    
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
    }

# Extra: Included for compatibility if frontend uses it
@app.patch("/api/leads/{lead_id}")
async def update_lead(lead_id: int, data: dict, db: Session = Depends(get_db)):
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
