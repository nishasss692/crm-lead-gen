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
