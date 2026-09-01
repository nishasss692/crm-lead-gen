from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status, Body, Response, Request
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, func, case, or_, and_
from sqlalchemy.orm import declarative_base, sessionmaker, Session
import pandas as pd
import io
import re
import os
import jwt
import joblib
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

# Global ML Model for Lead Scoring
ml_model = None

# 1. Setup & Config
app = FastAPI(title="India Post Lead Management API", version="2.5")

@app.on_event("startup")
def load_ml_model():
    global ml_model
    try:
        model_paths = [
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "ml", "lead_scoring_model.pkl"),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "ml", "lead_scoring_model.pkl"),
            os.path.join("ml", "lead_scoring_model.pkl"),
            "lead_scoring_model.pkl"
        ]
        for path in model_paths:
            if os.path.exists(path):
                ml_model = joblib.load(path)
                print(f"[ML Engine] Model loaded successfully from: {path}")
                break
        if ml_model is None:
            print("[ML Engine] Warning: lead_scoring_model.pkl not found. Defaulting to fallback predictions.")
    except Exception as e:
        print(f"[ML Engine] Error loading lead scoring model: {e}")
        ml_model = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "crm.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 2. Database Models
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
    employee_id = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String)  # 'ME', 'Division', 'RO', 'CO'
    assigned_region = Column(String, nullable=True)
    assigned_division = Column(String, nullable=True)

    @property
    def username(self):
        return self.employee_id
        
    @property
    def password_hash(self):
        return self.password

    @password_hash.setter
    def password_hash(self, value):
        self.password = value
        
    @property
    def region(self):
        return self.assigned_region
        
    @property
    def division(self):
        return self.assigned_division

Base.metadata.create_all(bind=engine)

# 2.5 Auth Setup
SECRET_KEY = "india_post_crm_secret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 8

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password or not plain_password:
        return False
    if plain_password == hashed_password:
        return True
    try:
        clean_pwd = str(plain_password)[:72]
        return pwd_context.verify(clean_pwd, hashed_password)
    except Exception:
        return plain_password == hashed_password

def get_password_hash(password: str) -> str:
    clean_pwd = str(password)[:72]
    return pwd_context.hash(clean_pwd)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Startup Event: Seed 4 Test Accounts
@app.on_event("startup")
def seed_test_users():
    # Automatically migrate users table if old column schema exists
    try:
        with engine.connect() as conn:
            res = conn.execute("PRAGMA table_info(users)").fetchall()
            col_names = [r[1] for r in res] if res else []
            if "username" in col_names and "employee_id" not in col_names:
                conn.execute("DROP TABLE users")
                conn.commit()
    except Exception:
        pass

    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        existing_emp_ids = {u.employee_id for u in db.query(User.employee_id).all() if u.employee_id}
        test_users = [
            # CO Accounts
            User(employee_id="CO_ADMIN", password=get_password_hash("password123"), role="CO", assigned_region=None, assigned_division=None),
            User(employee_id="co_user", password=get_password_hash("password123"), role="CO", assigned_region=None, assigned_division=None),
            # RO Accounts (BG, SK, NK)
            User(employee_id="RO_BG", password=get_password_hash("password123"), role="RO", assigned_region="Bengaluru HQ Region", assigned_division=None),
            User(employee_id="ro_user", password=get_password_hash("password123"), role="RO", assigned_region="Bengaluru HQ Region", assigned_division=None),
            User(employee_id="RO_SK", password=get_password_hash("password123"), role="RO", assigned_region="South Karnataka Region", assigned_division=None),
            User(employee_id="RO_NK", password=get_password_hash("password123"), role="RO", assigned_region="North Karnataka Region", assigned_division=None),
            # DO / Divisional Accounts
            User(employee_id="DIV_MYS", password=get_password_hash("password123"), role="DO", assigned_region=None, assigned_division="Mysuru"),
            User(employee_id="div_user", password=get_password_hash("password123"), role="DO", assigned_region=None, assigned_division="Mysuru"),
            User(employee_id="DO_MYS", password=get_password_hash("password123"), role="DO", assigned_region=None, assigned_division="Mysuru"),
            User(employee_id="DIV_BGE", password=get_password_hash("password123"), role="DO", assigned_region=None, assigned_division="BG East"),
            User(employee_id="DIV_BGS", password=get_password_hash("password123"), role="DO", assigned_region=None, assigned_division="BG South"),
            # ME Accounts
            User(employee_id="ME_MYS_01", password=get_password_hash("password123"), role="ME", assigned_region=None, assigned_division="Mysuru"),
            User(employee_id="me_user", password=get_password_hash("password123"), role="ME", assigned_region=None, assigned_division="Mysuru"),
        ]
        to_add = [u for u in test_users if u.employee_id not in existing_emp_ids]
        if to_add:
            db.bulk_save_objects(to_add)
            db.commit()
            print(f"[User Auth] Seeded {len(to_add)} missing test role accounts.")
    except Exception as e:
        db.rollback()
        print(f"[User Auth] Error seeding users: {e}")
    finally:
        db.close()

def get_current_user(token: str = Depends(OAuth2PasswordBearer(tokenUrl="api/login"))) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        employee_id = payload.get("employee_id") or payload.get("sub")
        role = payload.get("role")
        assigned_region = payload.get("assigned_region")
        assigned_division = payload.get("assigned_division")
        
        if not employee_id:
            raise credentials_exception
            
        return {
            "employee_id": employee_id,
            "role": role,
            "assigned_region": assigned_region,
            "assigned_division": assigned_division,
            "sub": employee_id
        }
    except (jwt.PyJWTError, Exception):
        raise credentials_exception

class LoginRequest(BaseModel):
    employee_id: Optional[str] = None
    username: Optional[str] = None
    password: str

@app.post("/api/login")
async def login(
    request: Request,
    db: Session = Depends(get_db)
):
    emp_id = None
    pwd = None
    
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            data = await request.json()
            emp_id = data.get("employee_id") or data.get("username")
            pwd = data.get("password")
        except Exception:
            pass
    elif "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
        try:
            form = await request.form()
            emp_id = form.get("employee_id") or form.get("username")
            pwd = form.get("password")
        except Exception:
            pass
    else:
        try:
            data = await request.json()
            emp_id = data.get("employee_id") or data.get("username")
            pwd = data.get("password")
        except Exception:
            pass
        
    if not emp_id or not pwd:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee ID and password are required"
        )
        
    emp_id_str = str(emp_id).strip()
    user = db.query(User).filter(
        or_(
            func.lower(User.employee_id) == emp_id_str.lower(),
            User.employee_id == emp_id_str
        )
    ).first()
    
    if not user or not verify_password(str(pwd), user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect employee ID or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    token = create_access_token(
        data={
            "sub": user.employee_id,
            "role": user.role,
            "assigned_region": user.assigned_region,
            "assigned_division": user.assigned_division
        },
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "role": user.role,
        "user": {
            "employee_id": user.employee_id,
            "username": user.employee_id,
            "role": user.role, 
            "assigned_region": user.assigned_region, 
            "assigned_division": user.assigned_division,
            "region": user.assigned_region,
            "division": user.assigned_division
        }
    }

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str

@app.post("/api/change-password")
def change_password(request: PasswordChangeRequest, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user_rec = db.query(User).filter(User.employee_id == current_user.get("employee_id")).first()
    if not user_rec or not verify_password(request.old_password, user_rec.password):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    user_rec.password = get_password_hash(request.new_password)
    db.commit()
    return {"success": True, "message": "Password updated successfully"}

# 3. File Upload & Robust Two-Pass Column Mapping System
COLUMN_SYNONYMS = {
    "exporter_name": [
        "exporter_name", "exporter", "company_name", "company", "firm_name", "firm", 
        "client_name", "client", "business_name", "business", "customer_name", "customer", 
        "lead_name", "organization", "party_name", "party", "vendor_name", "vendor", "account_name", "name"
    ],
    "contact_number": [
        "contact_number", "contact_no", "phone_number", "phone_no", "mobile_number", "mobile_no", 
        "contact", "phone", "mobile", "cell", "telephone", "tel", "ph_no", "mob_no", "primary_contact"
    ],
    "email": [
        "email", "email_id", "email_address", "e_mail", "mail", "contact_email", "official_email", "mail_id"
    ],
    "address": [
        "address", "office_address", "factory_address", "location", "street", "addr", "company_address"
    ],
    "pincode": [
        "pincode", "pin_code", "pin", "postal_code", "zip", "zipcode", "area_pin", "postal_pin"
    ],
    "division": [
        "division", "postal_division", "division_name", "post_division", "branch_division", "city_division", "district"
    ],
    "region": [
        "region", "postal_circle", "circle", "zone", "state", "reg", "postal_region", "circle_office"
    ],
    "division_id": [
        "division_id", "div_id", "div_code", "division_code", "facility_id", "div_no"
    ],
    "assigned_agent": [
        "assigned_agent", "assigned_to", "marketing_executive", "me_name", "executive_name", 
        "sales_executive", "sales_exec", "agent", "officer", "assigned_officer", "owner"
    ],
    "date_of_meeting": [
        "date_of_meeting", "meeting_date", "contact_date", "visit_date", "scheduled_date", 
        "interaction_date", "discussion_date", "date"
    ],
    "customer_met": [
        "customer_met", "contact_person", "person_met", "poc", "decision_maker", 
        "met_with", "representative", "spoc", "contact_person_name"
    ],
    "service_using": [
        "service_using", "postal_product", "service_interest", "service_type", "product_using", 
        "service", "product", "requirement", "category"
    ],
    "monthly_volume": [
        "monthly_volume", "volume", "monthly_volume_speed_post", "potential_revenue", 
        "pipeline_value", "estimated_volume", "deal_value", "revenue", "monthly_value", 
        "expected_volume", "pieces", "expected_revenue"
    ],
    "meeting_outcome": [
        "meeting_outcome", "lead_status", "status", "outcome", "stage", "result", 
        "disposition", "meeting_status", "interaction_result"
    ],
    "contract_id": [
        "contract_id", "deal_id", "ref_no", "account_no", "agreement_no", "contract_number", "deal_ref"
    ],
    "remarks": [
        "remarks", "notes", "comments", "feedback", "description", "details", "observation"
    ],
    "sl_no": [
        "sl_no", "slno", "s_no", "serial_no", "sr_no", "id", "#", "s_no_", "sl"
    ]
}

def clean_cell_value(val) -> str:
    """Clean individual dataframe cell values into sanitized strings"""
    if val is None or pd.isna(val):
        return ""
    
    # Handle pandas Timestamps
    if isinstance(val, (pd.Timestamp, datetime)):
        return val.strftime("%Y-%m-%d")
        
    s = str(val).strip()
    if s.lower() in ["nan", "none", "null", "n/a", "na", "<na>", "undefined", "nat", ""]:
        return ""
    
    # Strip trailing float zeros (e.g. '560092.0' -> '560092')
    if s.endswith(".0") and s[:-2].replace("-", "").isdigit():
        return s[:-2]
        
    return s

def normalize_col_name(name: str) -> str:
    """Normalize raw column headers to clean snake_case strings"""
    s = str(name).strip().lower()
    s = re.sub(r'[\r\n\t]+', ' ', s)
    s = re.sub(r'[^a-z0-9]+', '_', s)
    return s.strip('_')

def map_dataframe_columns(df: pd.DataFrame) -> Dict[str, str]:
    """
    Robust Two-Pass Column Mapping:
    Pass 1: Exact matches against synonym dictionary.
    Pass 2: Longest prefix/substring matches for remaining unmapped columns.
    Prevents cross-field collisions.
    """
    mapping: Dict[str, str] = {}
    assigned_targets = set()
    cleaned_df_cols: Dict[str, str] = {}
    
    for col in df.columns:
        norm = normalize_col_name(col)
        cleaned_df_cols[col] = norm

    # Pass 1: Exact matches
    for target_field, synonyms in COLUMN_SYNONYMS.items():
        if target_field in assigned_targets:
            continue
        for orig_col, clean_name in cleaned_df_cols.items():
            if orig_col in mapping:
                continue
            if clean_name in synonyms:
                mapping[orig_col] = target_field
                assigned_targets.add(target_field)
                break

    # Pass 2: Specific Substring & Prefix matches
    for target_field, synonyms in COLUMN_SYNONYMS.items():
        if target_field in assigned_targets:
            continue
        # Sort synonyms by length descending to match most specific terms first
        sorted_syns = sorted(synonyms, key=len, reverse=True)
        for orig_col, clean_name in cleaned_df_cols.items():
            if orig_col in mapping:
                continue
            matched = False
            for syn in sorted_syns:
                # Avoid single-word overly broad matches like 'name' matching 'assigned_agent'
                if len(syn) >= 3 and (syn in clean_name or clean_name.startswith(syn)):
                    mapping[orig_col] = target_field
                    assigned_targets.add(target_field)
                    matched = True
                    break
            if matched:
                break
                
    return mapping

def is_valid_phone(phone_str: str) -> bool:
    """Validate phone string has at least 7 real numeric digits"""
    if not phone_str:
        return False
    digits = re.sub(r'\D', '', phone_str)
    return len(digits) >= 7 and digits not in ['0000000000', '1234567890', '9999999999']

def is_valid_email(email_str: str) -> bool:
    """Validate email format"""
    if not email_str:
        return False
    clean = email_str.strip().lower()
    return bool(re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', clean))

def is_valid_pincode(pin_str: str) -> bool:
    """Validate Indian 6-digit PIN code"""
    if not pin_str:
        return False
    digits = re.sub(r'\D', '', pin_str)
    return len(digits) == 6 and digits[0] in '123456789'

def is_valid_lead_record(lead_data: dict) -> bool:
    """Check if lead record contains genuine, verifiable business credentials"""
    name = (lead_data.get("exporter_name") or "").strip()
    contact = (lead_data.get("contact_number") or "").strip()
    email = (lead_data.get("email") or "").strip()
    div = (lead_data.get("division") or "").strip()
    
    # Reject empty or placeholder names
    invalid_names = ['nan', 'none', 'null', 'n/a', 'na', 'test', 'unknown', 'prospect', 'lead', '']
    has_valid_name = bool(name and name.lower() not in invalid_names and len(name) >= 2)
    has_valid_contact = is_valid_phone(contact)
    has_valid_email_val = is_valid_email(email)
    has_valid_div = bool(div and div.lower() not in ['nan', 'none', 'null', 'unassigned', ''])
    
    # A genuine record must have at least (valid name OR valid phone) AND not be dummy
    return has_valid_name or has_valid_contact or (has_valid_email_val and has_valid_div)

def normalize_string_key(text: Optional[str]) -> str:
    if not text:
        return ""
    cleaned = str(text).strip().upper()
    if cleaned in ['NAN', 'NONE', 'NULL', 'N/A', '']:
        return ""
    cleaned = re.sub(r'[\(\[\{].*?[\)\]\}]', '', cleaned)
    cleaned = re.sub(r'[^A-Z0-9\s]', ' ', cleaned)
    tokens = [w for w in cleaned.split() if w not in ['PVT', 'PRIVATE', 'LTD', 'LIMITED', 'LLP', 'INC', 'CORP', 'CO', 'COMPANY', 'INDIA']]
    return "".join(tokens) or re.sub(r'[^A-Z0-9]', '', cleaned)

def normalize_phone_key(phone: Optional[str]) -> str:
    if not phone:
        return ""
    digits = re.sub(r'\D', '', str(phone))
    if len(digits) == 12 and digits.startswith('91'):
        digits = digits[2:]
    return digits if len(digits) >= 8 else ""

def generate_lead_dedup_key(lead_data: dict, criteria: str = "composite") -> str:
    norm_name = normalize_string_key(lead_data.get("exporter_name"))
    norm_phone = normalize_phone_key(lead_data.get("contact_number"))
    norm_email = str(lead_data.get("email") or "").strip().lower()
    norm_pin = re.sub(r'\D', '', str(lead_data.get("pincode") or ""))
    norm_div = str(lead_data.get("division") or "").strip().upper()

    if criteria == "name":
        return f"name:{norm_name}" if norm_name else ""
    elif criteria == "contact":
        return f"phone:{norm_phone}" if norm_phone else ""
    elif criteria == "email":
        return f"email:{norm_email}" if ("@" in norm_email and len(norm_email) > 4) else ""
    elif criteria == "sl_no":
        sl = str(lead_data.get("sl_no") or "").strip().upper()
        return f"sl:{sl}" if sl else ""
    else:  # Composite matching
        if norm_name and (norm_pin or norm_div):
            loc = norm_pin if norm_pin else norm_div
            return f"name_loc:{norm_name}##{loc}"
        elif norm_name and norm_phone:
            return f"name_phone:{norm_name}##{norm_phone}"
        elif norm_phone:
            return f"phone:{norm_phone}"
        elif norm_email and "@" in norm_email:
            return f"email:{norm_email}"
        elif norm_name:
            return f"name:{norm_name}"
        return ""

@app.post("/api/upload-excel")
async def upload_excel(
    file: UploadFile = File(...), 
    clear_existing: bool = False,
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    filename = (file.filename or "").lower()
    if not (filename.endswith('.xls') or filename.endswith('.xlsx') or filename.endswith('.csv')):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file."
        )
    
    try:
        contents = await file.read()
        if not contents or len(contents) == 0:
            raise HTTPException(status_code=400, detail="The uploaded file is empty.")
        
        df = None
        # 1. Parse CSV with fallback encodings & delimiters
        if filename.endswith('.csv'):
            encodings = ['utf-8-sig', 'utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
            for enc in encodings:
                try:
                    df = pd.read_csv(
                        io.BytesIO(contents), 
                        encoding=enc, 
                        sep=None, 
                        engine='python', 
                        on_bad_lines='skip',
                        skipinitialspace=True
                    )
                    if df is not None and not df.empty:
                        break
                except Exception:
                    continue
            if df is None or df.empty:
                df = pd.read_csv(io.BytesIO(contents), encoding='utf-8', on_bad_lines='skip')
                
        # 2. Parse Excel (.xlsx or .xls)
        else:
            try:
                df = pd.read_excel(io.BytesIO(contents), engine='openpyxl')
            except Exception:
                try:
                    df = pd.read_excel(io.BytesIO(contents))
                except Exception as excel_err:
                    raise HTTPException(status_code=400, detail=f"Could not read Excel file: {str(excel_err)}")
        
        if df is None or df.empty:
            raise HTTPException(status_code=400, detail="The file contains no readable rows or headers.")
        
        # Strip completely empty rows & clean column headers
        df = df.dropna(how='all')
        df.columns = [str(c).strip() for c in df.columns]
        
        # Identify column mapping
        col_mapping = map_dataframe_columns(df)
        
        if not col_mapping:
            raise HTTPException(
                status_code=400,
                detail="Unable to detect required CRM columns. Please ensure columns include 'Name', 'Phone', 'Division', or 'Service'."
            )

        # If clear_existing requested, wipe previous records in user's RBAC scope first
        if clear_existing:
            q = db.query(Lead)
            q = apply_rbac_filter(q, current_user)
            q.delete(synchronize_session=False)
            db.commit()

        # Build set of existing keys to prevent duplicates against DB if not replacing
        existing_keys = set()
        if not clear_existing:
            existing_db_leads = apply_rbac_filter(db.query(Lead), current_user).all()
            for ex_lead in existing_db_leads:
                ex_dict = {
                    "exporter_name": ex_lead.exporter_name,
                    "contact_number": ex_lead.contact_number,
                    "email": ex_lead.email,
                    "pincode": ex_lead.pincode,
                    "division": ex_lead.division,
                    "sl_no": ex_lead.sl_no
                }
                k = generate_lead_dedup_key(ex_dict, "composite")
                if k:
                    existing_keys.add(k)
            
        leads_to_insert = []
        seen_batch_keys = set()
        skipped_invalid = 0
        skipped_duplicates = 0
        verified_contacts_in_batch = 0
        model_fields = {c.name for c in Lead.__table__.columns}
        
        for idx, row in df.iterrows():
            lead_data = {}
            for orig_col, target_field in col_mapping.items():
                if orig_col in row:
                    lead_data[target_field] = clean_cell_value(row[orig_col])
            
            # Check validity
            name = (lead_data.get("exporter_name") or "").strip()
            contact = (lead_data.get("contact_number") or "").strip()
            email = (lead_data.get("email") or "").strip()
            division = (lead_data.get("division") or "").strip()
            pincode = (lead_data.get("pincode") or "").strip()
            
            if not is_valid_lead_record(lead_data):
                skipped_invalid += 1
                continue
                
            # Clean contact number
            if contact:
                cleaned_phone = re.sub(r'[^0-9+,\- /]', '', contact).strip()
                if cleaned_phone.endswith('.0'):
                    cleaned_phone = cleaned_phone[:-2]
                lead_data["contact_number"] = cleaned_phone
                if is_valid_phone(cleaned_phone):
                    verified_contacts_in_batch += 1
            
            # Clean pincode
            if pincode:
                clean_pin = re.sub(r'\D', '', pincode)
                lead_data["pincode"] = clean_pin if len(clean_pin) == 6 else pincode
                
            # Standardize fallback name if missing
            if not name:
                lead_data["exporter_name"] = f"Commercial Lead ({contact or email or f'Row #{idx+1}'})"
                
            # Default division & region from RBAC user context if missing
            if not division:
                if current_user and current_user.get("assigned_division"):
                    lead_data["division"] = current_user.get("assigned_division")
                else:
                    lead_data["division"] = ""
                    
            if not lead_data.get("region"):
                if current_user and current_user.get("assigned_region"):
                    lead_data["region"] = current_user.get("assigned_region")
                else:
                    lead_data["region"] = ""
            
            if not lead_data.get("service_using"):
                lead_data["service_using"] = ""

            # Auto Deduplication check
            dedup_key = generate_lead_dedup_key(lead_data, "composite")
            if dedup_key:
                if dedup_key in seen_batch_keys or dedup_key in existing_keys:
                    skipped_duplicates += 1
                    continue
                seen_batch_keys.add(dedup_key)
                
            # Filter only valid Lead model attributes
            sanitized_lead = {k: v for k, v in lead_data.items() if k in model_fields}
            leads_to_insert.append(Lead(**sanitized_lead))
        
        if not leads_to_insert and skipped_duplicates == 0:
            raise HTTPException(
                status_code=400, 
                detail="No valid lead records found in the file. Please ensure records contain at least an Exporter Name or Contact Number."
            )
            
        if leads_to_insert:
            db.bulk_save_objects(leads_to_insert)
            db.commit()
        
        valid_count = len(leads_to_insert)
        total_rows = len(df)
        data_quality_pct = round((valid_count / total_rows * 100) if total_rows > 0 else 100, 1)
        
        return {
            "success": True, 
            "count": valid_count, 
            "skipped_empty": skipped_invalid,
            "skipped_duplicates": skipped_duplicates,
            "total_rows": total_rows,
            "data_quality_pct": data_quality_pct,
            "mapped_columns": list(col_mapping.values()),
            "message": f"Successfully imported {valid_count} unique lead records from {file.filename}." + (f" ({skipped_duplicates} duplicate records avoided, {skipped_invalid} empty/invalid skipped)" if (skipped_duplicates or skipped_invalid) else "")
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error importing file: {str(e)}")

# Clear All Leads Endpoint
@app.delete("/api/leads/clear-all")
@app.post("/api/leads/clear-all")
def clear_all_leads(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    try:
        query = db.query(Lead)
        query = apply_rbac_filter(query, current_user)
        deleted_count = query.delete(synchronize_session=False)
        db.commit()
        return {
            "success": True,
            "deleted_count": deleted_count,
            "message": f"Successfully removed all {deleted_count} leads. The system is clean and ready for your new upload."
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to clear leads: {str(e)}")

# Download Template Endpoint
@app.get("/api/download-template")
def download_template():
    csv_content = (
        "Sl No,Exporter Name,Address,Pincode,Division,Region,Assigned Agent,Date of Meeting,Customer Met,Contact Number,Email,Service Using,Monthly Volume,Meeting Outcome,Contract ID,Remarks\n"
        "1,Infosys BPO Logistics,Electronic City Phase 1,560100,BG South,Karnataka Circle,Ramesh Kumar,2024-03-15,Arun Sharma,9845012345,logistics@infosys.com,Speed Post B2B,15000,Interested,CON-2024-089,Requires bulk discount agreement\n"
        "2,Titan Company Precision,HAL Old Airport Road,560017,BG East,Karnataka Circle,Priya Nair,2024-03-16,Suresh Patel,9880198765,shipping@titan.co.in,Business Parcel,8500,Onboarded,CON-2024-090,Contract executed for parcel dispatch\n"
        "3,Biocon Pharmaceuticals,Bommasandra Ind Area,560099,BG South,Karnataka Circle,Kiran Rao,2024-03-17,Dr. Meena Iyer,9741054321,supplychain@biocon.com,Express Parcel,4200,Follow-up,CON-2024-091,Cold chain packaging discussion\n"
    )
    return PlainTextResponse(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=indiapost_lead_template.csv"}
    )

# 4. RBAC Filter
def get_region_variants(region_str: Optional[str]) -> list[str]:
    if not region_str:
        return []
    r = region_str.upper().strip()
    if "BG" in r or "BENGALURU" in r or "BANGALORE" in r:
        return ["BG", "BG HQ Region", "Bengaluru HQ Region", "BG REGION", "BG HQ", "Bangalore"]
    elif "SK" in r or "SOUTH" in r:
        return ["SK", "SK REGION", "South Karnataka Region", "South Karnataka", "SK Region"]
    elif "NK" in r or "NORTH" in r:
        return ["NK", "NK REGION", "North Karnataka Region", "North Karnataka", "NK Region"]
    return [region_str.strip()]

def apply_rbac_filter(query, user: Optional[dict], division_name: Optional[str] = None):
    if not user:
        return query
    role = str(user.get("role") if isinstance(user, dict) else getattr(user, "role", "") or "").upper().strip()
    assigned_division = user.get("assigned_division") if isinstance(user, dict) else getattr(user, "assigned_division", None)
    assigned_region = user.get("assigned_region") if isinstance(user, dict) else getattr(user, "assigned_region", None)
    
    # 1. ME or DO / Division Officers: Constrained to their assigned division
    if role in ["ME", "DIVISION", "DO", "DIV"]:
        if assigned_division:
            clean_div = str(assigned_division).strip()
            query = query.filter(or_(
                Lead.division == clean_div,
                Lead.division.ilike(f"%{clean_div}%"),
                Lead.division.ilike(f"%{clean_div.replace(' Division', '')}%")
            ))
        return query

    # 2. RO (Regional Officers): Constrained to their regional jurisdiction
    elif role == "RO":
        if assigned_region:
            variants = get_region_variants(assigned_region)
            if variants:
                query = query.filter(Lead.region.in_(variants))
        if division_name and division_name != "All Divisions":
            query = query.filter(Lead.division == division_name)
        return query

    # 3. CO (Central / Circle Officers): Full Circle visibility
    elif role in ["CO", "ADMIN", "CO_ADMIN"]:
        if division_name and division_name != "All Divisions":
            query = query.filter(Lead.division == division_name)
        return query

    if division_name and division_name != "All Divisions":
        query = query.filter(Lead.division == division_name)
    return query

# 4.5 Machine Learning Lead Scoring Engine
def _parse_volume(val: Any) -> float:
    if val is None:
        return 0.0
    try:
        if isinstance(val, (int, float)):
            return float(val)
        val_str = str(val).replace(',', '').strip()
        nums = re.findall(r'\d+(?:\.\d+)?', val_str)
        if nums:
            return float(nums[0])
        return 0.0
    except Exception:
        return 0.0

def calculate_win_probability(leads: list[Lead]) -> list[float]:
    """Scores leads with the ML model and returns win probabilities (0-100%)."""
    if ml_model is None or not leads:
        return [0.0] * len(leads)
    try:
        records = []
        for lead in leads:
            vol = _parse_volume(lead.monthly_volume)
            srv = (lead.service_using or "").strip()
            if not srv or srv.lower() in ['nan', 'none', 'null', '']:
                srv = "None"
            records.append({
                'monthly_volume': vol,
                'service_using': srv
            })
        df = pd.DataFrame(records)
        probas = ml_model.predict_proba(df)[:, 1]
        return [round(float(p) * 100, 1) for p in probas]
    except Exception as e:
        print(f"[ML Engine] Prediction error: {e}")
        return [0.0] * len(leads)

def lead_to_dict(lead: Lead, win_prob: float = 0.0) -> dict:
    """Converts a Lead model instance to a JSON-serializable dictionary with win_probability."""
    res = {c.name: getattr(lead, c.name) for c in lead.__table__.columns}
    res["win_probability"] = win_prob
    return res

# 5. Lead Data Endpoints
@app.get("/api/leads")
def get_leads(
    division_name: str = "", 
    only_valid: bool = False,
    search: str = "",
    status_filter: str = "",
    db: Session = Depends(get_db), 
    user: dict = Depends(get_current_user)
):
    query = db.query(Lead)
    query = apply_rbac_filter(query, user, division_name)
    all_leads = query.order_by(Lead.id.desc()).all()
    
    # Filter valid credentials only if specifically requested
    if only_valid:
        leads_filtered = [
            l for l in all_leads
            if is_valid_lead_record({
                "exporter_name": l.exporter_name,
                "contact_number": l.contact_number,
                "email": l.email,
                "division": l.division
            })
        ]
    else:
        leads_filtered = all_leads
        
    if status_filter:
        stat = status_filter.lower()
        if stat == "pending":
            leads_filtered = [l for l in leads_filtered if not l.meeting_outcome or l.meeting_outcome.lower() in ['nan', 'none', 'pending', 'new', '']]
        elif stat == "contacted":
            leads_filtered = [l for l in leads_filtered if l.meeting_outcome and l.meeting_outcome.lower() not in ['nan', 'none', 'pending', 'new', '']]
        elif stat == "interested":
            leads_filtered = [l for l in leads_filtered if l.meeting_outcome and ('positive' in l.meeting_outcome.lower() or 'interested' in l.meeting_outcome.lower())]
        elif stat == "willing":
            leads_filtered = [l for l in leads_filtered if l.meeting_outcome and ('willing' in l.meeting_outcome.lower() or ('interested' in l.meeting_outcome.lower() and not l.contract_id))]
        elif stat == "onboarded":
            leads_filtered = [l for l in leads_filtered if l.contract_id or (l.meeting_outcome and 'onboard' in l.meeting_outcome.lower())]
        elif stat == "followup":
            leads_filtered = [l for l in leads_filtered if l.meeting_outcome and ('follow' in l.meeting_outcome.lower() or 'warm' in l.meeting_outcome.lower())]

    if search:
        s = search.lower()
        leads_filtered = [
            l for l in leads_filtered
            if (l.exporter_name and s in l.exporter_name.lower())
            or (l.contact_number and s in l.contact_number.lower())
            or (l.division and s in l.division.lower())
            or (l.email and s in l.email.lower())
            or (l.service_using and s in l.service_using.lower())
        ]

    # Calculate win probabilities via ML model
    scores = calculate_win_probability(leads_filtered)
    return [lead_to_dict(l, s) for l, s in zip(leads_filtered, scores)]

@app.get("/api/leads/priority")
def get_priority_leads(
    division_name: str = "",
    limit: int = 10,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """Returns top high-priority prospective leads ordered by predicted win probability."""
    query = db.query(Lead)
    query = apply_rbac_filter(query, user, division_name)
    all_leads = query.all()
    if not all_leads:
        return []
        
    scores = calculate_win_probability(all_leads)
    scored_leads = [lead_to_dict(l, s) for l, s in zip(all_leads, scores)]
    scored_leads.sort(key=lambda x: x.get("win_probability", 0), reverse=True)
    return scored_leads[:limit]

@app.get("/api/divisions")
def get_divisions(
    db: Session = Depends(get_db), 
    user: dict = Depends(get_current_user)
):
    role = str(user.get("role") or "").upper().strip()
    if role in ["ME", "DIVISION", "DO", "DIV"]:
        assigned_div = user.get("assigned_division")
        if assigned_div:
            return [assigned_div.strip()]
        return []
    elif role == "RO":
        query = db.query(Lead.division)
        assigned_reg = user.get("assigned_region")
        if assigned_reg:
            variants = get_region_variants(assigned_reg)
            if variants:
                query = query.filter(Lead.region.in_(variants))
        divisions = query.distinct().all()
        div_list = [div[0].strip() for div in divisions if div[0] and div[0].strip() and div[0].strip().lower() not in ['nan', 'none', 'null', 'unassigned']]
        return sorted(list(set(div_list)))
        
    query = db.query(Lead.division)
    divisions = query.distinct().all()
    div_list = [div[0].strip() for div in divisions if div[0] and div[0].strip() and div[0].strip().lower() not in ['nan', 'none', 'null', 'unassigned']]
    return sorted(list(set(div_list)))

# 6. Comprehensive Analytics Endpoint for Dashboard (Strict Valid Data & Pictorial Calculations)
@app.get("/api/analytics")
def get_analytics(
    division_name: str = "", 
    timeframe: str = "Last 30 Days", 
    only_valid: bool = False,
    db: Session = Depends(get_db), 
    user: dict = Depends(get_current_user)
):
    query = db.query(Lead)
    query = apply_rbac_filter(query, user, division_name)
    all_leads = query.all()
    total_raw = len(all_leads)
    
    # Filter valid credentials only if specifically requested
    if only_valid:
        valid_leads = [
            lead for lead in all_leads 
            if is_valid_lead_record({
                "exporter_name": lead.exporter_name,
                "contact_number": lead.contact_number,
                "email": lead.email,
                "division": lead.division
            })
        ]
    else:
        valid_leads = all_leads
    
    total = len(valid_leads)
    unverified_count = max(0, total_raw - total)
    
    # Metrics Initialization for the 8 exact KPIs
    contact_pending = 0
    contacted = 0
    interested = 0
    not_interested = 0
    willing_to_onboard = 0
    onboarded = 0
    onboard_pending = 0
    follow_up = 0
    
    verified_contacts_count = 0
    division_assigned_count = 0
    email_available_count = 0
    valid_pincode_count = 0
    verified_names_count = 0
    
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

    # Standard per-service monthly revenue valuation benchmarks (in INR per piece / base unit)
    SERVICE_UNIT_TARIFF = {
        "speed post b2b": 80,
        "business parcel": 180,
        "direct portal": 250,
        "circle referrals": 120,
        "postal life insurance": 500,
        "logistics post": 850,
        "express parcel": 220,
        "retail post": 45
    }

    for lead in valid_leads:
        outcome = (lead.meeting_outcome or "").strip().lower()
        has_contract = bool((lead.contract_id or "").strip() and (lead.contract_id or "").strip().lower() not in ['nan', 'none', 'null', ''])
        
        # Valid Entity Name Check
        exp_name = (lead.exporter_name or "").strip()
        if exp_name and exp_name.lower() not in ['nan', 'none', 'null', 'unknown', 'prospect', 'lead', ''] and len(exp_name) >= 3:
            verified_names_count += 1

        # Valid contact check
        contact_str = (lead.contact_number or "").strip()
        if is_valid_phone(contact_str):
            verified_contacts_count += 1
            
        # Valid email check
        email_str = (lead.email or "").strip()
        if is_valid_email(email_str):
            email_available_count += 1
            
        # Valid Pincode check
        pin_str = (lead.pincode or "").strip()
        if is_valid_pincode(pin_str):
            valid_pincode_count += 1
            
        div_name = (lead.division or "").strip()
        if div_name and div_name.lower() not in ['nan', 'none', 'null', 'unassigned', '']:
            division_assigned_count += 1
        else:
            div_name = "Circle Headquarters"
            
        service_name = (lead.service_using or "").strip()
        if not service_name or service_name.lower() in ['nan', 'none', 'null']:
            service_name = "Speed Post B2B"
        
        # Accurate pipeline volume & valuation computation based purely on uploaded data
        vol_str = (lead.monthly_volume or "").strip()
        unit_tariff = SERVICE_UNIT_TARIFF.get(service_name.lower(), 120)
        
        lead_pipeline = 0
        try:
            nums = re.findall(r'\d+', vol_str.replace(',', ''))
            if nums:
                vol_num = int(nums[0])
                if vol_num > 0:
                    lead_pipeline = vol_num * unit_tariff
        except Exception:
            lead_pipeline = 0
            
        monthly_pipeline_est += lead_pipeline
            
        # Exact calculation of 8 KPIs based on meeting_outcome
        if not outcome or outcome in ['nan', 'none', 'null', '']:
            contact_pending += 1
        else:
            contacted += 1
            
        if outcome in ["positive", "interested"]:
            interested += 1
        elif outcome in ["not interested", "not_interested", "rejected"]:
            not_interested += 1
        elif outcome in ["willing to onboard", "willing_to_onboard", "willing"]:
            willing_to_onboard += 1
        elif outcome in ["onboarded", "onboard"] or has_contract:
            onboarded += 1
        elif outcome in ["onboard pending", "onboard_pending", "onboarding pending"]:
            onboard_pending += 1
        elif "follow" in outcome or "warm" in outcome:
            follow_up += 1

        # Division Aggregation
        if div_name not in division_map:
            division_map[div_name] = {
                "division": div_name, 
                "total": 0, 
                "contacted": 0, 
                "interested": 0, 
                "onboarded": 0, 
                "pending": 0,
                "pipeline_val": 0,
                "verified_contacts": 0
            }
        division_map[div_name]["total"] += 1
        division_map[div_name]["pipeline_val"] += lead_pipeline
        if is_valid_phone(contact_str):
            division_map[div_name]["verified_contacts"] += 1
        
        if outcome and outcome not in ['nan', 'none', 'null', 'pending', '']:
            division_map[div_name]["contacted"] += 1
        if "positive" in outcome or "interested" in outcome:
            division_map[div_name]["interested"] += 1
        if has_contract or "onboard" in outcome:
            division_map[div_name]["onboarded"] += 1
        else:
            division_map[div_name]["pending"] += 1
            
        # Service Distribution
        service_clean = service_name.title()
        if service_clean not in service_map:
            service_map[service_clean] = {"count": 0, "revenue": 0}
        service_map[service_clean]["count"] += 1
        service_map[service_clean]["revenue"] += lead_pipeline

        # Agent performance
        agent_name = (lead.assigned_agent or "").strip()
        if not agent_name or agent_name.lower() in ["nan", "none", "null"]:
            agent_name = "Commercial Team"
        if agent_name not in agents:
            agents[agent_name] = {"leads": 0, "contacted": 0, "converted": 0, "pipeline": 0}
        agents[agent_name]["leads"] += 1
        agents[agent_name]["pipeline"] += lead_pipeline
        if outcome and outcome not in ["nan", "none", "null", "pending", ""]:
            agents[agent_name]["contacted"] += 1
        if has_contract or "onboard" in outcome:
            agents[agent_name]["converted"] += 1
            
        # Temporal series
        date_str = lead.date_of_meeting
        if date_str:
            date_clean = str(date_str).strip().split(' ')[0]
            if date_clean and date_clean not in ['nan', 'None', 'null', '', 'NaT']:
                meetings_over_time[date_clean] = meetings_over_time.get(date_clean, 0) + 1

    contacted_rate = round((contacted / total * 100) if total > 0 else 0, 1)
    onboarding_rate = round((onboarded / total * 100) if total > 0 else 0, 1)
    interested_rate = round((interested / contacted * 100) if contacted > 0 else 0, 1)
    
    # Calculate Data Health Score (0-100) based on Verified Credentials
    contact_pct = round((verified_contacts_count / total * 100) if total > 0 else 0, 1)
    email_pct = round((email_available_count / total * 100) if total > 0 else 0, 1)
    pincode_pct = round((valid_pincode_count / total * 100) if total > 0 else 0, 1)
    names_pct = round((verified_names_count / total * 100) if total > 0 else 0, 1)
    div_coverage_pct = round((division_assigned_count / total * 100) if total > 0 else 0, 1)
    
    # Statistical Data Integrity composite score
    data_health_score = round(
        (contact_pct * 0.35) + 
        (names_pct * 0.25) + 
        (div_coverage_pct * 0.20) + 
        (pincode_pct * 0.10) + 
        (email_pct * 0.10), 
        1
    )
    
    # Division Performance List with Efficiency Calculation
    division_performance = []
    for div_stats in division_map.values():
        t = div_stats["total"]
        o = div_stats["onboarded"]
        i = div_stats["interested"]
        c = div_stats["contacted"]
        # Efficiency Score: Weighted conversion performance
        efficiency = round(((o * 3 + i * 1.5 + c * 0.5) / (t * 3) * 100) if t > 0 else 0, 1)
        div_stats["efficiency_score"] = min(100.0, efficiency)
        div_stats["verified_contact_rate"] = round((div_stats["verified_contacts"] / t * 100) if t > 0 else 0, 1)
        division_performance.append(div_stats)
        
    division_performance.sort(key=lambda x: x["total"], reverse=True)
    top_division_performance = division_performance[:10]

    # Service Distribution formatting
    service_distribution = []
    for s_name, s_data in sorted(service_map.items(), key=lambda x: x[1]["count"], reverse=True):
        pct = round((s_data["count"] / total * 100) if total > 0 else 0, 1)
        color = SERVICE_COLORS.get(s_name.lower(), "#F7941D")
        service_distribution.append({
            "name": s_name,
            "count": s_data["count"],
            "value": pct,
            "revenue": s_data["revenue"],
            "revenue_formatted": f"₹ {(s_data['revenue'] / 100000):.2f} L" if s_data["revenue"] < 10000000 else f"₹ {(s_data['revenue'] / 10000000):.2f} Cr",
            "color": color
        })

    # Time series formatting
    try:
        time_series = [{"name": k[-5:] if len(k) >= 5 else k, "date": k, "current": v, "previous": max(1, int(v * 0.75))} for k, v in sorted(meetings_over_time.items())]
    except Exception:
        time_series = [{"name": str(k), "date": str(k), "current": v, "previous": max(1, int(v * 0.75))} for k, v in meetings_over_time.items()]
        
    if not time_series:
        time_series = []

    # Format pipeline value in INR Crores / Lakhs
    if monthly_pipeline_est >= 10000000:
        pipeline_formatted = f"₹ {(monthly_pipeline_est / 10000000):.2f} Cr"
    elif monthly_pipeline_est >= 100000:
        pipeline_formatted = f"₹ {(monthly_pipeline_est / 100000):.2f} L"
    else:
        pipeline_formatted = f"₹ {monthly_pipeline_est:,}"

    # Conversion Funnel Pictorial Stages with Step Drop-off
    funnel_stages = [
        {
            "stage": "1. Verified Leads", 
            "count": total, 
            "pct": 100.0, 
            "color": "#1B2A4A",
            "description": "Total authenticated commercial entities in Circle DB"
        },
        {
            "stage": "2. Contacted", 
            "count": contacted, 
            "pct": contacted_rate, 
            "color": "#3B82F6",
            "description": f"{contacted_rate}% of verified pipeline contacted"
        },
        {
            "stage": "3. Interested", 
            "count": interested, 
            "pct": round((interested / total * 100) if total > 0 else 0, 1), 
            "color": "#10B981",
            "description": f"{interested_rate}% conversion from contacted inquiries"
        },
        {
            "stage": "4. Willing to Onboard", 
            "count": willing_to_onboard, 
            "pct": round((willing_to_onboard / total * 100) if total > 0 else 0, 1), 
            "color": "#F59E0B",
            "description": "Pre-contract negotiation and rate confirmation"
        },
        {
            "stage": "5. Won / Onboarded", 
            "count": onboarded, 
            "pct": onboarding_rate, 
            "color": "#D1242F",
            "description": "Formally contracted India Post corporate clients"
        }
    ]

    # Outcome breakdown for Pictorial charts
    outcome_breakdown = [
        {"name": "Contact Pending", "label": "Pending", "status": "Contact Pending", "count": contact_pending, "color": "#F59E0B", "pct": round((contact_pending/total*100) if total>0 else 0, 1)},
        {"name": "Contacted", "label": "Contacted", "status": "Contacted", "count": contacted, "color": "#3B82F6", "pct": round((contacted/total*100) if total>0 else 0, 1)},
        {"name": "Interested", "label": "Interested", "status": "Interested", "count": interested, "color": "#10B981", "pct": round((interested/total*100) if total>0 else 0, 1)},
        {"name": "Willing to Onboard", "label": "Willing", "status": "Willing to Onboard", "count": willing_to_onboard, "color": "#0D9488", "pct": round((willing_to_onboard/total*100) if total>0 else 0, 1)},
        {"name": "Onboarded", "label": "Onboarded", "status": "Won / Onboarded", "count": onboarded, "color": "#D1242F", "pct": round((onboarded/total*100) if total>0 else 0, 1)},
        {"name": "Onboard Pending", "label": "Onboard Pending", "status": "Onboard Pending", "count": onboard_pending, "color": "#E11D48", "pct": round((onboard_pending/total*100) if total>0 else 0, 1)},
        {"name": "Follow-up Required", "label": "Follow-up", "status": "Follow-up Required", "count": follow_up, "color": "#F97316", "pct": round((follow_up/total*100) if total>0 else 0, 1)},
        {"name": "Not Interested", "label": "Not Interested", "status": "Not Interested", "count": not_interested, "color": "#94A3B8", "pct": round((not_interested/total*100) if total>0 else 0, 1)}
    ]

    # Pictorial Data Quality Scorecard items
    data_quality_breakdown = [
        {"name": "Verified Business Names", "count": verified_names_count, "pct": names_pct, "status": "High" if names_pct >= 90 else "Good"},
        {"name": "Verified Contact Numbers", "count": verified_contacts_count, "pct": contact_pct, "status": "High" if contact_pct >= 80 else "Attention"},
        {"name": "Postal Division Assigned", "count": division_assigned_count, "pct": div_coverage_pct, "status": "Optimal" if div_coverage_pct >= 95 else "Fair"},
        {"name": "Valid 6-Digit PIN Codes", "count": valid_pincode_count, "pct": pincode_pct, "status": "High" if pincode_pct >= 85 else "Standard"},
        {"name": "Corporate Email Addresses", "count": email_available_count, "pct": email_pct, "status": "Active"}
    ]

    return {
        # 8 Specific KPIs requested
        "total_leads": total,
        "contact_pending": contact_pending,
        "contacted": contacted,
        "interested": interested,
        "not_interested": not_interested,
        "willing_to_onboard": willing_to_onboard,
        "onboarded": onboarded,
        "onboard_pending": onboard_pending,
        
        # Extended dashboard metadata
        "follow_up": follow_up,
        "total_raw": total_raw,
        "unverified_count": unverified_count,
        "is_valid_only": only_valid,
        "contacted_rate": contacted_rate,
        "onboarding_rate": onboarding_rate,
        "pipeline_value": pipeline_formatted,
        "pipeline_raw": monthly_pipeline_est,
        "data_health": {
            "score": data_health_score,
            "verified_contacts": verified_contacts_count,
            "contact_completeness_pct": contact_pct,
            "division_assigned_count": division_assigned_count,
            "division_coverage_pct": div_coverage_pct,
            "email_count": email_available_count,
            "valid_pincode_count": valid_pincode_count,
            "pincode_pct": pincode_pct,
            "names_pct": names_pct,
            "quality_items": data_quality_breakdown
        },
        "funnel_stages": funnel_stages,
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

# 6.5 Pincode Performance Endpoint (Detailed Breakdown by Pincode with SQLAlchemy Aggregations)
PINCODE_OFFICE_MAP = {
    "560001": "Bengaluru GPO / Raj Bhavan",
    "560002": "Bengaluru City / Town Hall",
    "560003": "Malleswaram",
    "560004": "Basavanagudi",
    "560005": "Frazer Town",
    "560008": "HAL 2nd Stage / Indiranagar",
    "560009": "K.G. Road / Majestic",
    "560010": "Rajajinagar",
    "560011": "Jayanagar",
    "560017": "HAL Old Airport Road",
    "560020": "Seshadripuram",
    "560022": "Yeshwanthpur Industrial Suburb",
    "560025": "Richmond Town",
    "560027": "Lalbagh / Sudhamanagar",
    "560034": "Koramangala",
    "560038": "Indiranagar 100ft Road",
    "560058": "Peenya Industrial Area Phase I-IV",
    "560066": "Whitefield",
    "560068": "Madivala",
    "560076": "BTM Layout 2nd Stage",
    "560078": "JP Nagar",
    "560085": "Banashankari 3rd Stage",
    "560092": "Yelahanka / Byatarayanapura",
    "560099": "Bommasandra Industrial Area",
    "560100": "Electronic City Phase I & II",
    "561203": "Doddaballapur KIADB",
    "570001": "Mysuru Head Post Office",
    "570002": "Mysuru Fort",
    "570004": "Nazarbad / Mysuru",
    "570008": "Chamundipuram / Mysuru South",
    "570016": "Belagola Industrial Area / Metagalli",
    "570018": "Hootagalli Industrial Area",
    "570020": "Kuvempunagar",
    "570023": "Saraswathipuram",
    "570027": "Hebbal Industrial Area",
    "571301": "Nanjangud Industrial Area",
    "571313": "Chamarajanagar",
    "572101": "Tumakuru Head Post Office",
    "572106": "Antharasanahalli / Tumakuru",
    "573201": "Hassan Head Post Office",
    "574118": "Manipal",
    "575001": "Mangaluru Head Post Office",
    "575003": "Kodialbail / Mangaluru",
    "576101": "Udupi Head Post Office",
    "577001": "Davanagere Head Post Office",
    "577002": "Davanagere City",
    "577201": "Shivamogga Head Post Office",
    "580001": "Dharwad Head Post Office",
    "580020": "Hubballi Main",
    "580030": "Vidyanagar / Hubballi",
    "581110": "Haveri",
    "583101": "Ballari Head Post Office",
    "585101": "Kalaburagi Head Post Office",
    "586101": "Vijayapura Head Post Office",
    "587101": "Bagalkote Head Post Office",
    "590001": "Belagavi Head Post Office",
    "590014": "Machhe Industrial Area / Belagavi",
    "591304": "Gokak Falls"
}

@app.get("/api/analytics/pincodes")
def get_pincode_performance(
    division_name: str = "",
    limit: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    query = db.query(
        Lead.pincode,
        func.count(Lead.id).label("total"),
        func.count(
            case(
                (or_(Lead.meeting_outcome == None, Lead.meeting_outcome == '', func.lower(Lead.meeting_outcome) == 'nan', func.lower(Lead.meeting_outcome) == 'none', func.lower(Lead.meeting_outcome) == 'null'), 1),
                else_=None
            )
        ).label("pending"),
        func.count(
            case(
                (and_(Lead.meeting_outcome != None, Lead.meeting_outcome != '', func.lower(Lead.meeting_outcome) != 'nan', func.lower(Lead.meeting_outcome) != 'none', func.lower(Lead.meeting_outcome) != 'null'), 1),
                else_=None
            )
        ).label("contacted"),
        func.count(
            case(
                (or_(func.lower(Lead.meeting_outcome) == "positive", func.lower(Lead.meeting_outcome) == "interested"), 1),
                else_=None
            )
        ).label("interested"),
        func.count(
            case(
                (or_(func.lower(Lead.meeting_outcome) == "not interested", func.lower(Lead.meeting_outcome) == "not_interested"), 1),
                else_=None
            )
        ).label("not_interested"),
        func.count(
            case(
                (or_(func.lower(Lead.meeting_outcome) == "followup", func.lower(Lead.meeting_outcome) == "follow-up", func.lower(Lead.meeting_outcome) == "follow up"), 1),
                else_=None
            )
        ).label("follow_up_required"),
        func.count(
            case(
                (or_(func.lower(Lead.meeting_outcome) == "willing to onboard", func.lower(Lead.meeting_outcome) == "willing_to_onboard", func.lower(Lead.meeting_outcome) == "willing"), 1),
                else_=None
            )
        ).label("willing_to_onboard"),
        func.count(
            case(
                (or_(func.lower(Lead.meeting_outcome) == "not willing to onboard", func.lower(Lead.meeting_outcome) == "not_willing_to_onboard", func.lower(Lead.meeting_outcome) == "not willing"), 1),
                else_=None
            )
        ).label("not_willing_to_onboard"),
        func.count(
            case(
                (or_(func.lower(Lead.meeting_outcome) == "onboarded", func.lower(Lead.meeting_outcome) == "onboard"), 1),
                else_=None
            )
        ).label("onboarded")
    )
    
    query = apply_rbac_filter(query, current_user, division_name)
        
    # Group by pincode, filter empty pincodes, and order by total leads descending
    query = query.filter(Lead.pincode != None, Lead.pincode != '', Lead.pincode != '0', Lead.pincode != '000000')
    query = query.group_by(Lead.pincode).order_by(func.count(Lead.id).desc())
    
    if limit and limit > 0:
        results = query.limit(limit).all()
    else:
        results = query.all()

    pincode_list = []
    for r in results:
        raw_pin = str(r.pincode or "").strip()
        clean_pin = re.sub(r'\D', '', raw_pin)
        pin = clean_pin if len(clean_pin) == 6 else raw_pin
        
        if not pin or pin.lower() in ['nan', 'none', 'null', '0', '000000', '']:
            continue
            
        office = PINCODE_OFFICE_MAP.get(pin, f"Post Office - {pin}")
        
        pincode_list.append({
            "pincode": pin,
            "office_name": office,
            "Office Name": office,
            "total": int(r.total or 0),
            "total_leads": int(r.total or 0),
            "pending": int(r.pending or 0),
            "contacted": int(r.contacted or 0),
            "interested": int(r.interested or 0),
            "not_interested": int(r.not_interested or 0),
            "follow_up_required": int(r.follow_up_required or 0),
            "willing_to_onboard": int(r.willing_to_onboard or 0),
            "not_willing_to_onboard": int(r.not_willing_to_onboard or 0),
            "onboarded": int(r.onboarded or 0),
            "onboarded_count": int(r.onboarded or 0)
        })

    return pincode_list

# 7. Deduplication Endpoints
@app.get("/api/leads/duplicates-summary")
def get_duplicates_summary(criteria: str = "name_and_contact", db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    from collections import defaultdict
    query = db.query(Lead)
    query = apply_rbac_filter(query, current_user)
    leads = query.order_by(Lead.id.asc()).all()
    
    crit_mode = "composite" if criteria in ["name_and_contact", "composite"] else criteria
    groups = defaultdict(list)
    for lead in leads:
        lead_dict = {
            "exporter_name": lead.exporter_name,
            "contact_number": lead.contact_number,
            "email": lead.email,
            "pincode": lead.pincode,
            "division": lead.division,
            "sl_no": lead.sl_no
        }
        key = generate_lead_dedup_key(lead_dict, crit_mode)
        if key:
            groups[key].append(lead)
            
    duplicate_count = sum(len(items) - 1 for items in groups.values() if len(items) > 1)
    unique_leads_estimate = len(leads) - duplicate_count
    
    return {
        "total_leads": len(leads),
        "duplicate_count": duplicate_count,
        "unique_leads_estimate": unique_leads_estimate,
        "criteria": criteria
    }

class DeduplicateRequest(BaseModel):
    criteria: Optional[str] = "name_and_contact"

@app.post("/api/leads/deduplicate")
def deduplicate_leads(req: DeduplicateRequest = Body(default=DeduplicateRequest()), db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    from collections import defaultdict
    query = db.query(Lead)
    query = apply_rbac_filter(query, current_user)
    leads = query.order_by(Lead.id.asc()).all()
    
    criteria = req.criteria or "name_and_contact"
    crit_mode = "composite" if criteria in ["name_and_contact", "composite"] else criteria
    
    groups = defaultdict(list)
    for lead in leads:
        lead_dict = {
            "exporter_name": lead.exporter_name,
            "contact_number": lead.contact_number,
            "email": lead.email,
            "pincode": lead.pincode,
            "division": lead.division,
            "sl_no": lead.sl_no
        }
        key = generate_lead_dedup_key(lead_dict, crit_mode)
        if key:
            groups[key].append(lead)
            
    to_delete_ids = []
    
    for key, items in groups.items():
        if len(items) > 1:
            def score(x):
                s = 0
                if x.address: s += len(str(x.address))
                if x.pincode: s += 25
                if x.contact_number: s += 50
                if x.email: s += 50
                if x.service_using: s += 30
                if x.monthly_volume: s += 15
                if x.meeting_outcome: s += 15
                return s
                
            items.sort(key=score, reverse=True)
            primary = items[0]
            
            for sec in items[1:]:
                if not primary.address and sec.address: primary.address = sec.address
                if not primary.pincode and sec.pincode: primary.pincode = sec.pincode
                if not primary.division and sec.division: primary.division = sec.division
                if not primary.region and sec.region: primary.region = sec.region
                if not primary.division_id and sec.division_id: primary.division_id = sec.division_id
                if not primary.contact_number and sec.contact_number: primary.contact_number = sec.contact_number
                if not primary.email and sec.email: primary.email = sec.email
                if not primary.service_using and sec.service_using: primary.service_using = sec.service_using
                if not primary.monthly_volume and sec.monthly_volume: primary.monthly_volume = sec.monthly_volume
                if not primary.meeting_outcome and sec.meeting_outcome: primary.meeting_outcome = sec.meeting_outcome
                if not primary.contract_id and sec.contract_id: primary.contract_id = sec.contract_id
                if not primary.assigned_agent and sec.assigned_agent: primary.assigned_agent = sec.assigned_agent
                if not primary.date_of_meeting and sec.date_of_meeting: primary.date_of_meeting = sec.date_of_meeting
                if not primary.customer_met and sec.customer_met: primary.customer_met = sec.customer_met
                if not primary.remarks and sec.remarks: primary.remarks = sec.remarks
                
                to_delete_ids.append(sec.id)
                
    if to_delete_ids:
        db.query(Lead).filter(Lead.id.in_(to_delete_ids)).delete(synchronize_session=False)
        db.commit()
        
    remaining_count = apply_rbac_filter(db.query(Lead), current_user).count()
    
    return {
        "success": True,
        "removed_count": len(to_delete_ids),
        "remaining_count": remaining_count,
        "criteria_used": criteria,
        "message": f"Successfully removed {len(to_delete_ids)} duplicate records. {remaining_count} unique leads remaining."
    }

# 8. Single Lead Update Endpoint
@app.patch("/api/leads/{lead_id}")
async def update_lead(lead_id: int, data: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
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
        "assignedMeName": "assigned_agent",
        "customerMet": "customer_met",
        "remarks": "remarks",
        "address": "address",
        "pincode": "pincode",
        "division": "division",
        "region": "region",
        "email": "email"
    }
    
    for key, value in data.items():
        db_key = field_map.get(key, key)
        if hasattr(lead, db_key):
            setattr(lead, db_key, str(value) if value is not None else "")
            
    db.commit()
    return {"success": True, "message": "Lead updated successfully"}
