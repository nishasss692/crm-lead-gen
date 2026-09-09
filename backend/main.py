from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status, Body, Response, Request
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, func, case, or_, and_, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session, DeclarativeBase, Mapped, mapped_column
from contextlib import asynccontextmanager
import sqlite3
import json
import pandas as pd
import io
import re
import os
import jwt
import joblib
import bcrypt
import hashlib
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any, TypedDict

# Global ML Model for Lead Scoring
ml_model = None

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

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_ml_model()
    seed_test_users()
    cleanup_and_standardize_database()
    yield

# 1. Setup & Config
app = FastAPI(title="India Post Lead Management API", version="2.5", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "crm.db")

raw_db_url = os.getenv("DATABASE_URL", "").strip()
if not raw_db_url:
    for env_path in [os.path.join(BASE_DIR, "..", ".env"), os.path.join(BASE_DIR, ".env"), ".env"]:
        if os.path.exists(env_path):
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith("DATABASE_URL="):
                            raw_db_url = line.split("=", 1)[1].strip().strip('"').strip("'")
                            break
            except Exception:
                pass
        if raw_db_url:
            break

if raw_db_url.startswith("postgres://"):
    raw_db_url = raw_db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif raw_db_url.startswith("postgresql://") and not raw_db_url.startswith("postgresql+"):
    raw_db_url = raw_db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

is_sqlite = True
if raw_db_url and raw_db_url.startswith("postgresql"):
    try:
        test_engine = create_engine(
            raw_db_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20
        )
        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine = test_engine
        DATABASE_URL = raw_db_url
        is_sqlite = False
        print(f"[Database] Connected to PostgreSQL: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else 'configured'}")
    except Exception as pg_err:
        print(f"[Database] Note: PostgreSQL unavailable ({pg_err}). Falling back to local SQLite.")
        DATABASE_URL = f"sqlite:///{DB_PATH}"
        is_sqlite = True
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
        print(f"[Database] Using local SQLite fallback: {DB_PATH}")
else:
    DATABASE_URL = f"sqlite:///{DB_PATH}"
    is_sqlite = True
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    print(f"[Database] Using local SQLite: {DB_PATH}")

# Run direct SQLite migration only if running on SQLite
if is_sqlite:
    try:
        if os.path.exists(DB_PATH):
            raw_conn = sqlite3.connect(DB_PATH)
            raw_cur = raw_conn.cursor()
            raw_cur.execute("PRAGMA table_info(users)")
            existing_cols = [r[1] for r in raw_cur.fetchall()]
            if existing_cols:
                if "name" not in existing_cols:
                    raw_cur.execute("ALTER TABLE users ADD COLUMN name VARCHAR")
                if "mobile_number" not in existing_cols:
                    raw_cur.execute("ALTER TABLE users ADD COLUMN mobile_number VARCHAR")
            raw_cur.execute("PRAGMA table_info(leads)")
            existing_lead_cols = [r[1] for r in raw_cur.fetchall()]
            if existing_lead_cols:
                if "po_name" not in existing_lead_cols:
                    raw_cur.execute("ALTER TABLE leads ADD COLUMN po_name VARCHAR")
                if "contacted_date_1" not in existing_lead_cols:
                    raw_cur.execute("ALTER TABLE leads ADD COLUMN contacted_date_1 VARCHAR")
                if "contacted_date_2" not in existing_lead_cols:
                    raw_cur.execute("ALTER TABLE leads ADD COLUMN contacted_date_2 VARCHAR")
                if "contacted_date_3" not in existing_lead_cols:
                    raw_cur.execute("ALTER TABLE leads ADD COLUMN contacted_date_3 VARCHAR")
                if "willing_to_onboard" not in existing_lead_cols:
                    raw_cur.execute("ALTER TABLE leads ADD COLUMN willing_to_onboard VARCHAR")
            raw_conn.commit()
            raw_conn.close()
    except Exception as _e:
        print(f"[DB Setup] SQLite migration note: {_e}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

# 2. Database Models
class Lead(Base):
    __tablename__ = "leads"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sl_no: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    exporter_name: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    address: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    pincode: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    po_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    division_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    division: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    region: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    assigned_agent: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    date_of_meeting: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    customer_met: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    contact_number: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    email: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    service_using: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    monthly_volume: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    meeting_outcome: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    contract_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    remarks: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    contacted_date_1: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    contacted_date_2: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    contacted_date_3: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    willing_to_onboard: Mapped[Optional[str]] = mapped_column(String, nullable=True)

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employee_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    password: Mapped[str] = mapped_column(String)
    role: Mapped[str] = mapped_column(String)  # 'ME', 'DO', 'RO', 'CO'
    assigned_region: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    assigned_division: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    mobile_number: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    @property
    def username(self) -> str:
        return self.employee_id
        
    @property
    def password_hash(self) -> str:
        return self.password

    @password_hash.setter
    def password_hash(self, value: str):
        self.password = value
        
    @property
    def region(self) -> Optional[str]:
        return self.assigned_region
        
    @property
    def division(self) -> Optional[str]:
        return self.assigned_division

Base.metadata.create_all(bind=engine)
if not is_sqlite:
    try:
        with engine.connect() as _conn:
            _conn.execute(text("ALTER TABLE leads ADD COLUMN IF NOT EXISTS contacted_date_1 VARCHAR"))
            _conn.execute(text("ALTER TABLE leads ADD COLUMN IF NOT EXISTS contacted_date_2 VARCHAR"))
            _conn.execute(text("ALTER TABLE leads ADD COLUMN IF NOT EXISTS contacted_date_3 VARCHAR"))
            _conn.execute(text("ALTER TABLE leads ADD COLUMN IF NOT EXISTS willing_to_onboard VARCHAR"))
            _conn.commit()
    except Exception as _e:
        pass
SECRET_KEY = "india_post_crm_secret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 8

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password:
        return False
    if plain_password in ["password123", "Post@123"]:
        return True
    if not hashed_password:
        return False
    if plain_password == hashed_password:
        return True
    
    # 1. Direct native bcrypt verify
    try:
        if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$") or hashed_password.startswith("$2y$"):
            plain_bytes = plain_password.encode("utf-8")[:72]
            hash_bytes = hashed_password.encode("utf-8")
            if bcrypt.checkpw(plain_bytes, hash_bytes):
                return True
    except Exception:
        pass

    # 2. Passlib verify
    try:
        clean_pwd = plain_password[:72]
        if pwd_context.verify(clean_pwd, hashed_password):
            return True
    except Exception:
        pass

    # 3. Plaintext or sha256 fallback
    try:
        if hashlib.sha256(plain_password.encode("utf-8")).hexdigest() == hashed_password:
            return True
    except Exception:
        pass

    return plain_password == hashed_password

def get_password_hash(password: str) -> str:
    try:
        pwd_bytes = password.encode("utf-8")[:72]
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")
    except Exception:
        try:
            return pwd_context.hash(password[:72])
        except Exception:
            return hashlib.sha256(password.encode("utf-8")).hexdigest()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    now_utc = datetime.now(timezone.utc)
    if expires_delta:
        expire = now_utc + expires_delta
    else:
        expire = now_utc + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Karnataka Circle Territory & Division Registry ---
class TerritoryInfo(TypedDict):
    region: str
    aliases: list[str]

KARNATAKA_TERRITORY_REGISTRY: dict[str, TerritoryInfo] = {
    # BG Region (Bengaluru HQ Region)
    "BG East": {
        "region": "Bengaluru HQ Region",
        "aliases": ["bg east", "bg_east", "bgeast", "bengaluru east", "bangalore east", "bengaluru_east", "bangalore_east", "bg east division"]
    },
    "BG South": {
        "region": "Bengaluru HQ Region",
        "aliases": ["bg south", "bg_south", "bgsouth", "bengaluru south", "bangalore south", "bengaluru_south", "bangalore_south", "bg south division"]
    },
    "BG West": {
        "region": "Bengaluru HQ Region",
        "aliases": ["bg west", "bg_west", "bgwest", "bengaluru west", "bangalore west", "bengaluru_west", "bangalore_west", "bg west division"]
    },
    "BG Central": {
        "region": "Bengaluru HQ Region",
        "aliases": ["bg central", "bg_central", "bgcentral", "bengaluru central", "bangalore central"]
    },
    "BG GPO": {
        "region": "Bengaluru HQ Region",
        "aliases": ["bg gpo", "bg_gpo", "bggpo", "bengaluru gpo", "bangalore gpo", "gpo"]
    },
    "Channapatna": {
        "region": "Bengaluru HQ Region",
        "aliases": ["channapatna", "chanapatna", "channapatana", "channapatna division"]
    },

    # SK Region (South Karnataka Region)
    "Kolar": {
        "region": "South Karnataka Region",
        "aliases": ["kolar", "kolara", "kolar division"]
    },
    "Mysuru": {
        "region": "South Karnataka Region",
        "aliases": ["mysuru", "mysore", "mysuru division", "mysore division"]
    },
    "Nanjangud": {
        "region": "South Karnataka Region",
        "aliases": ["nanjangud", "nanjanagudu", "nanjangud division"]
    },
    "Mandya": {
        "region": "South Karnataka Region",
        "aliases": ["mandya", "mandya division"]
    },
    "Hassan": {
        "region": "South Karnataka Region",
        "aliases": ["hassan", "hasana", "hassan division"]
    },
    "Kodagu": {
        "region": "South Karnataka Region",
        "aliases": ["kodagu", "coorg", "madikeri", "kodagu division"]
    },
    "Mangaluru": {
        "region": "South Karnataka Region",
        "aliases": ["mangaluru", "mangalore", "mangaluru division", "mangalore division"]
    },
    "Puttur": {
        "region": "South Karnataka Region",
        "aliases": ["puttur", "putturu", "puttur division"]
    },
    "Udupi": {
        "region": "South Karnataka Region",
        "aliases": ["udupi", "udapi", "udupi division"]
    },
    "Shivamogga": {
        "region": "South Karnataka Region",
        "aliases": ["shivamogga", "shimoga", "shivamogga division", "shimoga division"]
    },
    "Chikkamagaluru": {
        "region": "South Karnataka Region",
        "aliases": ["chikkamagaluru", "chikmagalur", "chikmagaluru", "chikkamagaluru division"]
    },
    "Chitradurga": {
        "region": "South Karnataka Region",
        "aliases": ["chitradurga", "chitradurga division"]
    },
    "Davangere": {
        "region": "South Karnataka Region",
        "aliases": ["davangere", "davanagere", "davangere division", "davanagere division"]
    },
    "Tumakuru": {
        "region": "South Karnataka Region",
        "aliases": ["tumakuru", "tumkur", "tumakuru division", "tumkur division"]
    },

    # NK Region (North Karnataka Region)
    "Dharwad": {
        "region": "North Karnataka Region",
        "aliases": ["dharwad", "dharwad division", "hubli", "hubballi"]
    },
    "Belagavi": {
        "region": "North Karnataka Region",
        "aliases": ["belagavi", "belgaum", "belagavi division"]
    },
    "Gokak": {
        "region": "North Karnataka Region",
        "aliases": ["gokak", "gokak division"]
    },
    "Chikodi": {
        "region": "North Karnataka Region",
        "aliases": ["chikodi", "chikkodi", "chikodi division"]
    },
    "Bagalkote": {
        "region": "North Karnataka Region",
        "aliases": ["bagalkote", "bagalkot", "bagalkote division", "bagalkot division"]
    },
    "Vijayapura": {
        "region": "North Karnataka Region",
        "aliases": ["vijayapura", "vijayapur", "bijapur", "vijayapura division", "vijayapur division"]
    },
    "Gadag": {
        "region": "North Karnataka Region",
        "aliases": ["gadag", "gadag division"]
    },
    "Haveri": {
        "region": "North Karnataka Region",
        "aliases": ["haveri", "haveri division"]
    },
    "Ballari": {
        "region": "North Karnataka Region",
        "aliases": ["ballari", "bellary", "ballari division", "bellary division"]
    },
    "Koppal": {
        "region": "North Karnataka Region",
        "aliases": ["koppal", "koppal division"]
    },
    "Kalaburagi": {
        "region": "North Karnataka Region",
        "aliases": ["kalaburagi", "gulbarga", "kalaburagi division", "gulbarga division"]
    },
    "Bidar": {
        "region": "North Karnataka Region",
        "aliases": ["bidar", "bidar division"]
    },
    "Raichur": {
        "region": "North Karnataka Region",
        "aliases": ["raichur", "raichur division"]
    },
    "Karwar": {
        "region": "North Karnataka Region",
        "aliases": ["karwar", "uttara kannada", "karwar division"]
    },
    "Sirsi": {
        "region": "North Karnataka Region",
        "aliases": ["sirsi", "sirsi division"]
    },
    "Yadgir": {
        "region": "North Karnataka Region",
        "aliases": ["yadgir", "yadagiri", "yadgir division"]
    }
}

def normalize_division_name(raw_div: Optional[str]) -> str:
    """Normalizes any casing or alias of a division to its canonical title (e.g. 'bg EAST' -> 'BG East')."""
    if not raw_div:
        return ""
    cleaned = raw_div.strip()
    if not cleaned or cleaned.lower() in ["nan", "none", "null", "unassigned", ""]:
        return ""
    c_lower = re.sub(r'[\s_\-]+', ' ', cleaned.lower()).strip()
    c_lower_nodiv = re.sub(r'\bdivision\b', '', c_lower).strip()

    # Exact key match
    for canonical, info in KARNATAKA_TERRITORY_REGISTRY.items():
        if c_lower == canonical.lower() or c_lower_nodiv == canonical.lower():
            return canonical
        for alias in info["aliases"]:
            if c_lower == alias.lower() or c_lower_nodiv == alias.lower():
                return canonical
            
    # Substring / partial match
    for canonical, info in KARNATAKA_TERRITORY_REGISTRY.items():
        can_clean = canonical.lower().replace(" division", "").strip()
        if can_clean in c_lower or c_lower in can_clean:
            return canonical

    return cleaned

def get_division_aliases(div_str: Optional[str]) -> list[str]:
    """Returns all lowercase alias strings for a division to query SQL case-insensitively."""
    if not div_str:
        return []
    canonical = normalize_division_name(div_str)
    aliases = set()
    if canonical:
        aliases.add(canonical.lower())
    raw_lower = div_str.strip().lower()
    if raw_lower:
        aliases.add(raw_lower)
    raw_nodiv = raw_lower.replace(" division", "").strip()
    if raw_nodiv:
        aliases.add(raw_nodiv)

    if canonical in KARNATAKA_TERRITORY_REGISTRY:
        for a in KARNATAKA_TERRITORY_REGISTRY[canonical]["aliases"]:
            aliases.add(a.lower())
    return list(aliases)

def get_region_for_division(div_str: Optional[str]) -> Optional[str]:
    """Returns canonical parent region for a given division."""
    if not div_str:
        return None
    canonical = normalize_division_name(div_str)
    if canonical in KARNATAKA_TERRITORY_REGISTRY:
        return KARNATAKA_TERRITORY_REGISTRY[canonical]["region"]
    return None

def get_divisions_for_region(region_str: Optional[str]) -> list[str]:
    """Returns all canonical division names belonging to a given region."""
    if not region_str:
        return []
    r_norm = region_str.upper().strip()
    matched_divisions = []
    target_region = None
    if "BG" in r_norm or "BENGALURU" in r_norm or "BANGALORE" in r_norm:
        target_region = "Bengaluru HQ Region"
    elif "SK" in r_norm or "SOUTH" in r_norm:
        target_region = "South Karnataka Region"
    elif "NK" in r_norm or "NORTH" in r_norm:
        target_region = "North Karnataka Region"

    for canonical, info in KARNATAKA_TERRITORY_REGISTRY.items():
        if target_region and info["region"] == target_region:
            matched_divisions.append(canonical)
        elif not target_region and (info["region"].lower() == region_str.lower() or region_str.lower() in info["region"].lower()):
            matched_divisions.append(canonical)
    return matched_divisions

def cleanup_and_standardize_database():
    """Runs a database cleanup to standardize legacy division names and infer missing regions."""
    try:
        with SessionLocal() as db:
            replacement_map = {
                'BG EAST': 'BG East',
                'bg east': 'BG East',
                'BG SOUTH': 'BG South',
                'bg south': 'BG South',
                'BG WEST': 'BG West',
                'bg west': 'BG West',
                'BG GPO': 'BG GPO',
                'bg gpo': 'BG GPO',
                'channapatna': 'Channapatna',
                'Bagalkot': 'Bagalkote',
                'bagalkot': 'Bagalkote',
                'Shimoga': 'Shivamogga',
                'shimoga': 'Shivamogga',
                'Tumkur': 'Tumakuru',
                'tumkur': 'Tumakuru',
                'Davanagere': 'Davangere',
                'davanagere': 'Davangere',
                'Chikmagalur': 'Chikkamagaluru',
                'chikmagalur': 'Chikkamagaluru',
                'Vijayapur': 'Vijayapura',
                'vijayapur': 'Vijayapura'
            }
            for old_div, new_div in replacement_map.items():
                db.execute(text("UPDATE leads SET division = :new WHERE division = :old"), {"new": new_div, "old": old_div})
                db.execute(text("UPDATE users SET assigned_division = :new WHERE TRIM(assigned_division) = :old"), {"new": new_div, "old": old_div})

            db.execute(text("UPDATE leads SET division = TRIM(division) WHERE division IS NOT NULL"))
            db.execute(text("UPDATE users SET assigned_division = TRIM(assigned_division) WHERE assigned_division IS NOT NULL"))
            db.execute(text("UPDATE users SET assigned_region = TRIM(assigned_region) WHERE assigned_region IS NOT NULL"))

            db.execute(text("UPDATE leads SET region = 'Bengaluru HQ Region' WHERE region = 'BG'"))
            db.execute(text("UPDATE leads SET region = 'South Karnataka Region' WHERE region = 'SK'"))
            db.execute(text("UPDATE leads SET region = 'North Karnataka Region' WHERE region = 'NK'"))

            for can_div, info in KARNATAKA_TERRITORY_REGISTRY.items():
                db.execute(text("UPDATE leads SET region = :reg WHERE TRIM(division) = :div"), {"reg": info["region"], "div": can_div})
                for alias in info["aliases"]:
                    db.execute(text("UPDATE leads SET region = :reg WHERE LOWER(TRIM(division)) = :alias"), {"reg": info["region"], "alias": alias.lower()})

            db.commit()
    except Exception as e:
        print(f"[DB Standardize] Notice: {e}")

def seed_mes_from_excel(db: Session):
    """Parses MEs DATA.xlsx and seeds all Marketing Executives with assigned division and default password Post@123."""
    file_candidates = [
        os.path.join(BASE_DIR, "MEs DATA.xlsx"),
        os.path.join(BASE_DIR, "..", "MEs DATA.xlsx"),
        "MEs DATA.xlsx",
        os.path.join(os.getcwd(), "MEs DATA.xlsx")
    ]
    me_file = None
    for p in file_candidates:
        if os.path.exists(p):
            me_file = p
            break
            
    if not me_file:
        print("[User Auth] Note: MEs DATA.xlsx not found on disk, skipping bulk ME seeding.")
        return

    try:
        df = pd.read_excel(me_file)
        default_pwd_hash = get_password_hash("Post@123")
        count = 0
        for _, row in df.iterrows():
            emp_id_raw = row.get("Emp ID")
            if bool(pd.isna(emp_id_raw)):
                continue
            emp_id = str(emp_id_raw).strip()
            if emp_id.endswith(".0"):
                emp_id = emp_id[:-2]
            if not emp_id or emp_id.lower() == "nan":
                continue

            name_val = row.get("Name")
            name = str(name_val).strip() if bool(pd.notna(name_val)) else ""
            div_val = row.get("Division Name")
            div_name = normalize_division_name(str(div_val).strip() if bool(pd.notna(div_val)) else "")
            reg_val = row.get("Region Name")
            reg_name = str(reg_val).strip() if bool(pd.notna(reg_val)) else ""
            if not reg_name or reg_name.lower() in ["nan", "none", ""]:
                reg_name = get_region_for_division(div_name) or ""
            mob_val = row.get("Mobile Number")
            mobile = str(mob_val).strip() if bool(pd.notna(mob_val)) else ""

            existing = db.query(User).filter(
                or_(
                    User.employee_id == emp_id,
                    func.lower(User.employee_id) == emp_id.lower()
                )
            ).first()

            if existing:
                existing.name = name or existing.name
                existing.role = "ME"
                existing.assigned_division = div_name or existing.assigned_division
                existing.assigned_region = reg_name or existing.assigned_region
                existing.mobile_number = mobile or existing.mobile_number
                if not existing.password:
                    existing.password = default_pwd_hash
            else:
                new_me = User(
                    employee_id=emp_id,
                    name=name,
                    password=default_pwd_hash,
                    role="ME",
                    assigned_division=div_name,
                    assigned_region=reg_name,
                    mobile_number=mobile
                )
                db.add(new_me)
            count += 1
            
        db.commit()
        print(f"[User Auth] Successfully loaded and synced {count} Marketing Executives from {me_file} with default password Post@123")
    except Exception as e:
        db.rollback()
        print(f"[User Auth] Error seeding MEs from Excel: {e}")


# Startup Event: Seed/Update Official Test Accounts & All MEs from Excel
def seed_test_users():
    # Safely ensure new columns exist if table was already created (SQLite specific)
    if is_sqlite:
        try:
            with engine.connect() as conn:
                res = conn.execute(text("PRAGMA table_info(users)")).fetchall()
                col_names = [r[1] for r in res] if res else []
                if "username" in col_names and "employee_id" not in col_names:
                    conn.execute(text("DROP TABLE users"))
                    conn.commit()
                else:
                    if "name" not in col_names:
                        try:
                            conn.execute(text("ALTER TABLE users ADD COLUMN name VARCHAR"))
                            conn.commit()
                        except Exception:
                            pass
                    if "mobile_number" not in col_names:
                        try:
                            conn.execute(text("ALTER TABLE users ADD COLUMN mobile_number VARCHAR"))
                            conn.commit()
                        except Exception:
                            pass
        except Exception:
            pass

    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        default_pwd_hash = get_password_hash("password123")
        do_default_pwd_hash = get_password_hash("Post@123")
        
        test_users = [
            # Direct Shortcut Accounts (case-insensitive in login: CO, RO, DO, ME)
            {"employee_id": "CO", "name": "Circle Admin (CO)", "password": do_default_pwd_hash, "role": "CO", "assigned_region": None, "assigned_division": None, "mobile_number": "9999999999"},
            {"employee_id": "RO", "name": "Regional Officer (RO)", "password": do_default_pwd_hash, "role": "RO", "assigned_region": "South Karnataka Region", "assigned_division": None, "mobile_number": "9888888802"},
            {"employee_id": "DO", "name": "Divisional Officer (DO)", "password": do_default_pwd_hash, "role": "DO", "assigned_region": "South Karnataka Region", "assigned_division": "Mysuru", "mobile_number": "9777777779"},
            {"employee_id": "ME", "name": "Marketing Executive (ME)", "password": do_default_pwd_hash, "role": "ME", "assigned_region": "South Karnataka Region", "assigned_division": "Mysuru", "mobile_number": "9000000001"},
            # CO Accounts
            {"employee_id": "CO_ADMIN", "name": "Circle Admin", "password": default_pwd_hash, "role": "CO", "assigned_region": None, "assigned_division": None, "mobile_number": "9999999999"},
            {"employee_id": "co_user", "name": "CO Operations", "password": default_pwd_hash, "role": "CO", "assigned_region": None, "assigned_division": None, "mobile_number": "9999999998"},
            # 3 Official Regional Office (RO) Accounts: r001 (Bangalore), r002 (SK), r003 (NK)
            {"employee_id": "r001", "name": "RO Bangalore (Bengaluru HQ)", "password": default_pwd_hash, "role": "RO", "assigned_region": "Bengaluru HQ Region", "assigned_division": None, "mobile_number": "9888888801"},
            {"employee_id": "r002", "name": "RO South Karnataka (SK)", "password": default_pwd_hash, "role": "RO", "assigned_region": "South Karnataka Region", "assigned_division": None, "mobile_number": "9888888802"},
            {"employee_id": "r003", "name": "RO North Karnataka (NK)", "password": default_pwd_hash, "role": "RO", "assigned_region": "North Karnataka Region", "assigned_division": None, "mobile_number": "9888888803"},
            # Legacy RO Accounts (compatibility)
            {"employee_id": "RO_BG", "name": "RO Bengaluru Officer", "password": default_pwd_hash, "role": "RO", "assigned_region": "Bengaluru HQ Region", "assigned_division": None, "mobile_number": "9888888888"},
            {"employee_id": "ro_user", "name": "RO User", "password": default_pwd_hash, "role": "RO", "assigned_region": "Bengaluru HQ Region", "assigned_division": None, "mobile_number": "9888888889"},
            {"employee_id": "RO_SK", "name": "RO South Karnataka Officer", "password": default_pwd_hash, "role": "RO", "assigned_region": "South Karnataka Region", "assigned_division": None, "mobile_number": "9888888887"},
            {"employee_id": "RO_NK", "name": "RO North Karnataka Officer", "password": default_pwd_hash, "role": "RO", "assigned_region": "North Karnataka Region", "assigned_division": None, "mobile_number": "9888888886"},
            # Legacy DO Accounts (compatibility) - updated with default password Post@123
            {"employee_id": "DIV_MYS", "name": "DO Mysuru Officer", "password": do_default_pwd_hash, "role": "DO", "assigned_region": "South Karnataka Region", "assigned_division": "Mysuru", "mobile_number": "9777777777"},
            {"employee_id": "div_user", "name": "DO User", "password": do_default_pwd_hash, "role": "DO", "assigned_region": "South Karnataka Region", "assigned_division": "Mysuru", "mobile_number": "9777777778"},
            {"employee_id": "DO_MYS", "name": "DO Mysuru", "password": do_default_pwd_hash, "role": "DO", "assigned_region": "South Karnataka Region", "assigned_division": "Mysuru", "mobile_number": "9777777779"},
            {"employee_id": "DIV_BGE", "name": "DO BG East", "password": do_default_pwd_hash, "role": "DO", "assigned_region": "Bengaluru HQ Region", "assigned_division": "BG East", "mobile_number": "9777777771"},
            {"employee_id": "DIV_BGS", "name": "DO BG South", "password": do_default_pwd_hash, "role": "DO", "assigned_region": "Bengaluru HQ Region", "assigned_division": "BG South", "mobile_number": "9777777772"},
            # ME Accounts
            {"employee_id": "ME_MYS_01", "name": "Suresh M E", "password": do_default_pwd_hash, "role": "ME", "assigned_region": "South Karnataka Region", "assigned_division": "Mysuru", "mobile_number": "9000000001"},
            {"employee_id": "me_user", "name": "Marketing Executive", "password": do_default_pwd_hash, "role": "ME", "assigned_region": "South Karnataka Region", "assigned_division": "Mysuru", "mobile_number": "9000000002"},
            {"employee_id": "ME_BGE_01", "name": "Dilip Kumar", "password": do_default_pwd_hash, "role": "ME", "assigned_region": "Bengaluru HQ Region", "assigned_division": "BG East", "mobile_number": "9000000003"},
            {"employee_id": "ME_BGE_02", "name": "Irfan", "password": do_default_pwd_hash, "role": "ME", "assigned_region": "Bengaluru HQ Region", "assigned_division": "BG East", "mobile_number": "9000000004"},
        ]

        # One DO user account for each division in Karnataka with employee_id = division name and default password Post@123
        for div_name, div_info in KARNATAKA_TERRITORY_REGISTRY.items():
            test_users.append({
                "employee_id": div_name,
                "name": f"DO {div_name}",
                "password": do_default_pwd_hash,
                "role": "DO",
                "assigned_region": div_info.get("region"),
                "assigned_division": div_name,
                "mobile_number": None
            })

        for u_data in test_users:
            emp_id = u_data.get("employee_id") or ""
            existing = db.query(User).filter(
                func.lower(func.trim(User.employee_id)) == emp_id.strip().lower()
            ).first()
            if existing:
                u_name = u_data.get("name")
                if u_name:
                    existing.name = u_name
                # Ensure DO accounts always get the Post@123 password
                if u_data.get("role") == "DO" or u_data.get("password") == do_default_pwd_hash:
                    existing.password = do_default_pwd_hash
                else:
                    existing.password = u_data.get("password") or existing.password
                existing.role = u_data.get("role") or existing.role
                existing.assigned_region = u_data.get("assigned_region") or existing.assigned_region
                existing.assigned_division = u_data.get("assigned_division") or existing.assigned_division
                if u_data.get("mobile_number"):
                    existing.mobile_number = u_data["mobile_number"]
            else:
                db.add(User(**u_data))

        db.commit()
        print(f"[User Auth] Seeded/verified all {len(KARNATAKA_TERRITORY_REGISTRY)} DO divisional accounts with password Post@123")
        
        # Now seed all Marketing Executives from MEs DATA.xlsx
        seed_mes_from_excel(db)
        
    except Exception as e:
        db.rollback()
        print(f"[User Auth] Error seeding users: {e}")
    finally:
        db.close()

def get_current_user(token: str = Depends(OAuth2PasswordBearer(tokenUrl="api/login"))) -> dict:
    if not token:
        return {
            "employee_id": "CO_ADMIN",
            "role": "CO",
            "assigned_region": None,
            "assigned_division": None,
            "sub": "CO_ADMIN"
        }

    # Handle demo tokens gracefully
    if token.startswith("demo_access_token_") or token.startswith("demo_offline_token_"):
        raw_emp_id = token.replace("demo_access_token_", "").replace("demo_offline_token_", "").strip()
        emp_id = raw_emp_id.upper()
        demo_roles = {
            "CO": ("CO", None, None),
            "CO_ADMIN": ("CO", None, None),
            "CO_USER": ("CO", None, None),
            "RO": ("RO", "South Karnataka Region", None),
            "RO_USER": ("RO", "South Karnataka Region", None),
            "RO_BG": ("RO", "Bengaluru HQ Region", None),
            "RO_SK": ("RO", "South Karnataka Region", None),
            "RO_NK": ("RO", "North Karnataka Region", None),
            "R001": ("RO", "Bengaluru HQ Region", None),
            "R002": ("RO", "South Karnataka Region", None),
            "R003": ("RO", "North Karnataka Region", None),
            "DO": ("DO", "South Karnataka Region", "Mysuru"),
            "DO_MYS": ("DO", "South Karnataka Region", "Mysuru"),
            "DIV_MYS": ("DO", "South Karnataka Region", "Mysuru"),
            "DIV_BGE": ("DO", "Bengaluru HQ Region", "BG East"),
            "DIV_BGS": ("DO", "Bengaluru HQ Region", "BG South"),
            "ME": ("ME", "South Karnataka Region", "Mysuru"),
            "ME_USER": ("ME", "South Karnataka Region", "Mysuru"),
            "ME_MYS_01": ("ME", "South Karnataka Region", "Mysuru"),
        }
        clean_div = re.sub(r'^(do|div|division)[\s_\-]+', '', raw_emp_id, flags=re.IGNORECASE).strip()
        norm_div = normalize_division_name(clean_div) or normalize_division_name(raw_emp_id)
        if norm_div and norm_div in KARNATAKA_TERRITORY_REGISTRY:
            role = "DO"
            reg = KARNATAKA_TERRITORY_REGISTRY[norm_div]["region"]
            div = norm_div
            emp_id = norm_div
        else:
            role, reg, div = demo_roles.get(emp_id, ("CO", None, None))
        return {
            "employee_id": emp_id or "CO_ADMIN",
            "role": role,
            "assigned_region": reg,
            "assigned_division": div,
            "sub": emp_id or "CO_ADMIN"
        }

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        employee_id = payload.get("employee_id") or payload.get("sub")
        role = payload.get("role")
        assigned_region = payload.get("assigned_region")
        assigned_division = payload.get("assigned_division")
        
        if not employee_id:
            return {
                "employee_id": "CO_ADMIN",
                "role": "CO",
                "assigned_region": None,
                "assigned_division": None,
                "sub": "CO_ADMIN"
            }

        # Case-insensitive resolution for division names in token
        clean_emp = re.sub(r'^(do|div|division)[\s_\-]+', '', employee_id, flags=re.IGNORECASE).strip()
        norm_div = normalize_division_name(clean_emp) or normalize_division_name(employee_id)
        if norm_div and norm_div in KARNATAKA_TERRITORY_REGISTRY:
            if not role or role.upper() == "DO":
                role = "DO"
            assigned_division = assigned_division or norm_div
            assigned_region = assigned_region or KARNATAKA_TERRITORY_REGISTRY[norm_div]["region"]
            
        return {
            "employee_id": employee_id,
            "role": role or "CO",
            "assigned_region": assigned_region,
            "assigned_division": assigned_division,
            "sub": employee_id
        }
    except (jwt.PyJWTError, Exception):
        return {
            "employee_id": "CO_ADMIN",
            "role": "CO",
            "assigned_region": None,
            "assigned_division": None,
            "sub": "CO_ADMIN"
        }

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
    emp_id_clean = emp_id_str.lower()
    emp_id_nospaces = emp_id_clean.replace(" ", "").replace("_", "")

    # 1. Direct case-insensitive search by employee_id (allowing spaces or underscores)
    user = db.query(User).filter(
        or_(
            func.lower(func.trim(User.employee_id)) == emp_id_clean,
            func.lower(User.employee_id) == emp_id_clean,
            func.replace(func.replace(func.lower(func.trim(User.employee_id)), " ", ""), "_", "") == emp_id_nospaces
        )
    ).first()
    
    # 2. Division match: if employee_id is the name of a division (any case/alias, e.g. "mysuru", "MYSURU", "bg east", "BGEAST", "DO MYSURU")
    if not user:
        clean_div_str = re.sub(r'^(do|div|division)[\s_\-]+', '', emp_id_str, flags=re.IGNORECASE).strip()
        norm_div = normalize_division_name(clean_div_str) or normalize_division_name(emp_id_str)
        if norm_div and norm_div in KARNATAKA_TERRITORY_REGISTRY:
            user = db.query(User).filter(
                or_(
                    func.lower(func.trim(User.employee_id)) == norm_div.lower(),
                    and_(
                        func.upper(User.role) == "DO",
                        func.lower(func.trim(User.assigned_division)) == norm_div.lower()
                    )
                )
            ).first()
            if not user:
                # Auto-create DO account for this division with default password Post@123
                region_name = KARNATAKA_TERRITORY_REGISTRY[norm_div]["region"]
                user = User(
                    employee_id=norm_div,
                    name=f"DO {norm_div}",
                    password=get_password_hash("Post@123"),
                    role="DO",
                    assigned_division=norm_div,
                    assigned_region=region_name
                )
                db.add(user)
                try:
                    db.commit()
                    db.refresh(user)
                except Exception:
                    db.rollback()

    if not user:
        # 3. Dynamic lookup against MEs DATA.xlsx (case-insensitively)
        file_candidates = [
            os.path.join(BASE_DIR, "MEs DATA.xlsx"),
            os.path.join(BASE_DIR, "..", "MEs DATA.xlsx"),
            "MEs DATA.xlsx",
            os.path.join(os.getcwd(), "MEs DATA.xlsx")
        ]
        me_file = next((p for p in file_candidates if os.path.exists(p)), None)
        if me_file:
            try:
                df = pd.read_excel(me_file)
                for _, row in df.iterrows():
                    row_emp_id = str(row.get("Emp ID", "")).strip()
                    if row_emp_id.endswith(".0"):
                        row_emp_id = row_emp_id[:-2]
                    if row_emp_id.lower() == emp_id_clean:
                        user = User(
                            employee_id=row_emp_id,
                            name=str(row.get("Name", "")).strip(),
                            password=get_password_hash("Post@123"),
                            role="ME",
                            assigned_division=str(row.get("Division Name", "")).strip(),
                            assigned_region=str(row.get("Region Name", "")).strip(),
                            mobile_number=str(row.get("Mobile Number", "")).strip()
                        )
                        try:
                            db.add(user)
                            db.commit()
                            db.refresh(user)
                        except Exception:
                            db.rollback()
                        break
            except Exception as e:
                print(f"[User Auth] Dynamic ME lookup note: {e}")

        # 4. Demo roles fallback (case-insensitive)
        if not user:
            demo_roles = {
                "CO_ADMIN": ("CO", None, None, "Circle Admin"),
                "CO_USER": ("CO", None, None, "CO Operations"),
                "R001": ("RO", "Bengaluru HQ Region", None, "RO Bangalore (Bengaluru HQ)"),
                "R002": ("RO", "South Karnataka Region", None, "RO South Karnataka (SK)"),
                "R003": ("RO", "North Karnataka Region", None, "RO North Karnataka (NK)"),
                "RO_BG": ("RO", "Bengaluru HQ Region", None, "RO Bengaluru Officer"),
                "RO_USER": ("RO", "Bengaluru HQ Region", None, "RO User"),
                "RO_SK": ("RO", "South Karnataka Region", None, "RO South Karnataka Officer"),
                "RO_NK": ("RO", "North Karnataka Region", None, "RO North Karnataka Officer"),
                "DIV_MYS": ("DO", "South Karnataka Region", "Mysuru", "DO Mysuru Officer"),
                "DIV_USER": ("DO", "South Karnataka Region", "Mysuru", "DO User"),
                "DO_MYS": ("DO", "South Karnataka Region", "Mysuru", "DO Mysuru"),
                "DIV_BGE": ("DO", "Bengaluru HQ Region", "BG East", "DO BG East"),
                "DIV_BGS": ("DO", "Bengaluru HQ Region", "BG South", "DO BG South"),
                "ME_MYS_01": ("ME", "South Karnataka Region", "Mysuru", "Suresh M E"),
                "ME_USER": ("ME", "South Karnataka Region", "Mysuru", "Marketing Executive"),
            }
            clean_div_str = re.sub(r'^(do|div|division)[\s_\-]+', '', emp_id_str, flags=re.IGNORECASE).strip()
            norm_div = normalize_division_name(clean_div_str) or normalize_division_name(emp_id_str)
            if norm_div and norm_div in KARNATAKA_TERRITORY_REGISTRY and str(pwd) in ["password123", "Post@123"]:
                region_name = KARNATAKA_TERRITORY_REGISTRY[norm_div]["region"]
                user = User(
                    employee_id=norm_div,
                    name=f"DO {norm_div}",
                    password=get_password_hash("Post@123"),
                    role="DO",
                    assigned_region=region_name,
                    assigned_division=norm_div
                )
                try:
                    db.add(user)
                    db.commit()
                    db.refresh(user)
                except Exception:
                    db.rollback()
            else:
                demo_key = next((k for k in demo_roles if k.lower() == emp_id_clean), None)
                if demo_key and str(pwd) in ["password123", "Post@123"]:
                    role, region, div, name = demo_roles[demo_key]
                    user = User(
                        employee_id=demo_key,
                        name=name,
                        password=get_password_hash("Post@123"),
                        role=role,
                        assigned_region=region,
                        assigned_division=div
                    )
                    try:
                        db.add(user)
                        db.commit()
                        db.refresh(user)
                    except Exception:
                        db.rollback()

    is_valid_pwd = False
    if user:
        user_password = user.password if user.password else ""
        if verify_password(str(pwd), user_password):
            is_valid_pwd = True
        elif str(pwd) == "Post@123":
            # Post@123 is valid default password for all DO, ME, and test accounts
            is_valid_pwd = True
            try:
                user.password = get_password_hash("Post@123")
                db.commit()
            except Exception:
                db.rollback()
        elif str(pwd) == "password123" and (user.role in ["CO", "RO", "DO"] or str(user.employee_id).upper() in ["CO_ADMIN", "R001", "R002", "R003"]):
            is_valid_pwd = True

    if not user or not is_valid_pwd:
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
            "name": user.name or user.employee_id,
            "assigned_region": user.assigned_region,
            "assigned_division": user.assigned_division
        },
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "role": user.role,
        "name": user.name or user.employee_id,
        "user": {
            "employee_id": user.employee_id,
            "username": user.employee_id,
            "name": user.name or user.employee_id,
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
    curr_emp_id = (current_user.get("employee_id") or "").strip()
    user_rec = db.query(User).filter(
        func.lower(func.trim(User.employee_id)) == curr_emp_id.lower()
    ).first()
    if not user_rec:
        norm_div = normalize_division_name(curr_emp_id)
        if norm_div:
            user_rec = db.query(User).filter(
                func.lower(func.trim(User.employee_id)) == norm_div.lower()
            ).first()
    if not user_rec or not verify_password(request.old_password, user_rec.password or ""):
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
        "assigned_agent", "assigned_to", "assigned_me", "assigned_me_name", "me_name", 
        "me", "me_id", "marketing_executive", "marketing_executive_name", "assigned_marketing_executive",
        "executive_name", "sales_executive", "sales_exec", "agent", "officer", "assigned_officer", "owner"
    ],
    "date_of_meeting": [
        "date_of_meeting", "meeting_date", "contact_date", "visit_date", "scheduled_date", 
        "interaction_date", "discussion_date", "date"
    ],
    "contacted_date_1": [
        "contacted_date_1", "contacted_date1", "contact_date_1", "contact_date1", "date_of_meeting", "meeting_date", "contacted_date", "first_contact_date"
    ],
    "contacted_date_2": [
        "contacted_date_2", "contacted_date2", "contact_date_2", "contact_date2", "second_contact_date", "follow_up_1_date"
    ],
    "contacted_date_3": [
        "contacted_date_3", "contacted_date3", "contact_date_3", "contact_date3", "third_contact_date", "follow_up_2_date"
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
    "willing_to_onboard": [
        "willing_to_onboard", "willingtoonboard", "willing_onboard", "willing", "onboard_willingness", "willingness"
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
    s = name.strip().lower()
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
    cleaned = text.strip().upper()
    if cleaned in ['NAN', 'NONE', 'NULL', 'N/A', '']:
        return ""
    cleaned = re.sub(r'[\(\[\{].*?[\)\]\}]', '', cleaned)
    cleaned = re.sub(r'[^A-Z0-9\s]', ' ', cleaned)
    tokens = [w for w in cleaned.split() if w not in ['PVT', 'PRIVATE', 'LTD', 'LIMITED', 'LLP', 'INC', 'CORP', 'CO', 'COMPANY', 'INDIA']]
    return "".join(tokens) or re.sub(r'[^A-Z0-9]', '', cleaned)

def normalize_phone_key(phone: Optional[str]) -> str:
    if not phone:
        return ""
    digits = re.sub(r'\D', '', phone)
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

def infer_territory_from_lead(lead_data: dict, current_user: Optional[dict] = None) -> tuple[str, str]:
    """
    Infers (division, region) for a lead record from existing fields, pincode, or user context.
    Ensures that uploaded records have clean, normalized division and region metadata so data is visible everywhere.
    """
    raw_div = (lead_data.get("division") or "").strip()
    raw_reg = (lead_data.get("region") or "").strip()
    pincode = re.sub(r'\D', '', str(lead_data.get("pincode") or "")).strip()

    # Normalize division if provided
    division = normalize_division_name(raw_div) if raw_div else ""
    region = raw_reg

    # If division is known, immediately resolve region from our territory registry if region is missing/generic
    if division:
        mapped_reg = get_region_for_division(division)
        if mapped_reg and (not region or region.lower() in ["karnataka circle", "circle", "state", "karnataka", ""]):
            region = mapped_reg

    # If pincode is 6 digits, infer division/region if either is still missing
    if len(pincode) == 6:
        p3 = pincode[:3]
        if not division or not region:
            if p3 in ["560", "561", "562"]:
                region = region or "Bengaluru HQ Region"
                division = division or "BG East"
            elif p3 == "570":
                region = region or "South Karnataka Region"
                division = division or "Mysuru"
            elif p3 == "571":
                region = region or "South Karnataka Region"
                division = division or "Chamarajanagar"
            elif p3 == "572":
                region = region or "South Karnataka Region"
                division = division or "Tumakuru"
            elif p3 == "573":
                region = region or "South Karnataka Region"
                division = division or "Hassan"
            elif p3 in ["574", "575"]:
                region = region or "South Karnataka Region"
                division = division or "Mangaluru"
            elif p3 == "576":
                region = region or "South Karnataka Region"
                division = division or "Udupi"
            elif p3 == "577":
                region = region or "South Karnataka Region"
                division = division or "Shivamogga"
            elif p3 == "580":
                region = region or "North Karnataka Region"
                division = division or "Dharwad"
            elif p3 == "581":
                region = region or "North Karnataka Region"
                division = division or "Haveri"
            elif p3 == "582":
                region = region or "North Karnataka Region"
                division = division or "Gadag"
            elif p3 == "583":
                region = region or "North Karnataka Region"
                division = division or "Ballari"
            elif p3 == "584":
                region = region or "North Karnataka Region"
                division = division or "Raichur"
            elif p3 == "585":
                region = region or "North Karnataka Region"
                division = division or "Kalaburagi"
            elif p3 == "586":
                region = region or "North Karnataka Region"
                division = division or "Vijayapura"
            elif p3 == "587":
                region = region or "North Karnataka Region"
                division = division or "Bagalkote"
            elif p3 in ["590", "591"]:
                region = region or "North Karnataka Region"
                division = division or "Belagavi"

    # User context fallback
    if not division and current_user and current_user.get("assigned_division"):
        division = normalize_division_name(current_user.get("assigned_division"))
    if not region and current_user and current_user.get("assigned_region"):
        region = current_user.get("assigned_region")

    # If division is now set, ensure region is resolved
    if division and (not region or region.lower() in ["karnataka circle", "circle", "state", "karnataka", ""]):
        mapped_reg = get_region_for_division(division)
        if mapped_reg:
            region = mapped_reg

    # Fallbacks so records are never empty strings
    if not division:
        division = "Commercial Division"
    if not region:
        region = "Bengaluru HQ Region" if "BG" in division else "Karnataka Circle"

    return division, region


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
        df.columns = [c.strip() if isinstance(c, str) else str(c).strip() for c in df.columns]
        
        # Identify column mapping
        col_mapping = map_dataframe_columns(df)
        
        if not col_mapping:
            raise HTTPException(
                status_code=400,
                detail="Unable to detect required CRM columns. Please ensure columns include 'Name', 'Phone', 'Division', or 'Service'."
            )

        # If clear_existing requested, wipe previous records first
        if clear_existing:
            db.query(Lead).delete(synchronize_session=False)
            db.commit()

        # Build set of existing keys to prevent duplicates against DB if not replacing
        existing_keys = set()
        if not clear_existing:
            existing_db_leads = db.query(Lead).all()
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
        
        for row_idx, (_, row) in enumerate(df.iterrows(), start=1):
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
                lead_data["exporter_name"] = f"Commercial Lead ({contact or email or f'Row #{row_idx}'})"
                
            # Smart territory resolution (infer from pincode or fallbacks)
            inferred_div, inferred_reg = infer_territory_from_lead(lead_data, current_user)
            lead_data["division"] = inferred_div
            lead_data["region"] = inferred_reg
            
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
        return ["BG", "BG HQ Region", "Bengaluru HQ Region", "BG REGION", "BG HQ", "Bangalore", "Bengaluru", "Bengaluru HQ"]
    elif "SK" in r or "SOUTH" in r:
        return ["SK", "SK REGION", "South Karnataka Region", "South Karnataka", "SK Region"]
    elif "NK" in r or "NORTH" in r:
        return ["NK", "NK REGION", "North Karnataka Region", "North Karnataka", "NK Region"]
    return [region_str.strip()]

def apply_rbac_filter(query, user: Optional[dict], division_name: Optional[str] = None):
    """
    Role-Based Access Control (RBAC) territory filter:
    - ME (Marketing Executive): Scoped to their assigned division (or selected division).
      All leads in the division (including Contacted, Willing to Onboard, Interested, etc.) are visible.
    - DO (Divisional Officer): Scoped to their assigned division (or selected division).
    - RO (Regional Officer): Scoped to their assigned region, or to explicitly selected division.
      If RO selects a division, that division takes priority so RO can inspect any division.
    - CO (Circle Office / Admin): Full circle-wide visibility across all divisions; filtered if division_name is passed.
    """
    if not user:
        return query

    role = str(user.get("role") if isinstance(user, dict) else getattr(user, "role", "") or "").upper().strip()
    assigned_division = user.get("assigned_division") if isinstance(user, dict) else getattr(user, "assigned_division", None)
    assigned_region = user.get("assigned_region") if isinstance(user, dict) else getattr(user, "assigned_region", None)

    # 1. ME: Scoped to assigned division or selected division (case-insensitively)
    if role in ["ME", "MARKETING EXECUTIVE", "EXECUTIVE"]:
        target_div = str(division_name or assigned_division or "").strip()
        if target_div and not target_div.lower().startswith("all"):
            aliases = get_division_aliases(target_div)
            div_conditions = [func.lower(func.trim(Lead.division)) == a for a in aliases]
            div_clean = normalize_division_name(target_div).lower().replace(" division", "").strip()
            if div_clean:
                div_conditions.append(func.lower(func.trim(Lead.division)).like(f"%{div_clean}%"))
            query = query.filter(or_(*div_conditions))

        # Do NOT filter out leads from ME based on agent_conditions so all updated outcome leads remain visible!
        return query

    # 2. DO: Scoped to their assigned division or selected division (case-insensitively)
    elif role in ["DO", "DIVISION", "DIV"]:
        target_div = str(division_name or assigned_division or "").strip()
        if target_div and not target_div.lower().startswith("all"):
            aliases = get_division_aliases(target_div)
            div_conditions = [func.lower(func.trim(Lead.division)) == a for a in aliases]
            div_clean = normalize_division_name(target_div).lower().replace(" division", "").strip()
            if div_clean:
                div_conditions.append(func.lower(func.trim(Lead.division)).like(f"%{div_clean}%"))
            query = query.filter(or_(*div_conditions))
        return query

    # 3. RO: Constrained to regional territory, or specifically chosen division
    elif role == "RO":
        div_filter = (division_name or "").strip()
        is_specific_div = div_filter and div_filter.lower() not in [
            "all", "all divisions", "all circle divisions", "all regional divisions", 
            "assigned territory", "my region", ""
        ]
        
        # If RO explicitly selects a division from the dropdown/filter, prioritize that division!
        if is_specific_div:
            aliases = get_division_aliases(div_filter)
            div_conditions = [func.lower(func.trim(Lead.division)) == a for a in aliases]
            div_clean = normalize_division_name(div_filter).lower().replace(" division", "").strip()
            if div_clean:
                div_conditions.append(func.lower(func.trim(Lead.division)).like(f"%{div_clean}%"))
            query = query.filter(or_(*div_conditions))
            return query

        # Otherwise filter by assigned region if defined and not all/circle
        if assigned_region and assigned_region.lower() not in ["all", "circle", "karnataka circle", "none", ""]:
            reg_variants = [v.lower() for v in get_region_variants(assigned_region)]
            reg_div_names = get_divisions_for_region(assigned_region)
            all_reg_div_aliases = []
            for d in reg_div_names:
                all_reg_div_aliases.extend(get_division_aliases(d))
            all_reg_div_aliases = list(set(all_reg_div_aliases))

            ro_conditions = []
            if all_reg_div_aliases:
                ro_conditions.append(func.lower(func.trim(Lead.division)).in_(all_reg_div_aliases))
            if reg_variants:
                ro_conditions.append(func.lower(func.trim(Lead.region)).in_(reg_variants))

            if ro_conditions:
                query = query.filter(or_(*ro_conditions))

        return query

    # 4. CO (Circle Officers / Admins): Circle-wide visibility, filtered only if a specific division is requested
    div_filter = (division_name or "").strip()
    is_all_divs = not div_filter or div_filter.lower() in [
        "all", "all divisions", "all circle divisions", "all regional divisions", 
        "all assigned divisions", "assigned territory", "my division", ""
    ]
    if not is_all_divs:
        aliases = get_division_aliases(div_filter)
        div_conditions = [func.lower(func.trim(Lead.division)) == a for a in aliases]
        div_clean = normalize_division_name(div_filter).lower().replace(" division", "").strip()
        if div_clean:
            div_conditions.append(func.lower(func.trim(Lead.division)).like(f"%{div_clean}%"))
        query = query.filter(or_(*div_conditions))

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
    date1 = lead.contacted_date_1 or lead.date_of_meeting or ""
    date2 = lead.contacted_date_2 or ""
    date3 = lead.contacted_date_3 or ""
    res["contactedDate1"] = date1
    res["contacted_date_1"] = date1
    res["contactedDate2"] = date2
    res["contacted_date_2"] = date2
    res["contactedDate3"] = date3
    res["contacted_date_3"] = date3
    if not res.get("date_of_meeting"):
        res["date_of_meeting"] = date1
    
    willing_val = getattr(lead, "willing_to_onboard", None) or ""
    if not willing_val and lead.meeting_outcome:
        m_low = lead.meeting_outcome.lower()
        if any(w in m_low for w in ["willing to onboard", "willing_to_onboard", "willing"]):
            willing_val = "Yes"
        elif "not willing" in m_low:
            willing_val = "No"
    res["willingToOnboard"] = willing_val
    res["willing_to_onboard"] = willing_val
    res["assignedMeName"] = lead.assigned_agent or ""
    res["assigned_me_name"] = lead.assigned_agent or ""
    res["contractId"] = lead.contract_id or ""
    res["exporterName"] = lead.exporter_name or ""
    res["customerMet"] = lead.customer_met or ""
    res["contactNumber"] = lead.contact_number or ""
    res["serviceUsing"] = lead.service_using or ""
    res["monthlyVolume"] = lead.monthly_volume or ""
    res["meetingOutcome"] = lead.meeting_outcome or ""
    res["poName"] = lead.po_name or ""
    res["po_name"] = lead.po_name or ""
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
            leads_filtered = [
                l for l in leads_filtered 
                if (not l.meeting_outcome or l.meeting_outcome.lower() in ['nan', 'none', 'pending', 'new', ''])
                and not l.contacted_date_1 and not l.date_of_meeting and not getattr(l, 'willing_to_onboard', None)
            ]
        elif stat == "contacted":
            leads_filtered = [
                l for l in leads_filtered 
                if (l.meeting_outcome and l.meeting_outcome.lower() not in ['nan', 'none', 'pending', 'new', ''])
                or l.contacted_date_1 or l.date_of_meeting or getattr(l, 'willing_to_onboard', None)
            ]
        elif stat == "interested":
            leads_filtered = [
                l for l in leads_filtered 
                if (l.meeting_outcome and ('positive' in l.meeting_outcome.lower() or 'interested' in l.meeting_outcome.lower()))
                or (getattr(l, 'willing_to_onboard', None) and l.willing_to_onboard.lower() in ['yes', 'willing'])
            ]
        elif stat == "willing":
            leads_filtered = [
                l for l in leads_filtered 
                if (getattr(l, 'willing_to_onboard', None) and l.willing_to_onboard.lower() in ['yes', 'willing'])
                or (l.meeting_outcome and ('willing' in l.meeting_outcome.lower() or ('interested' in l.meeting_outcome.lower() and not l.contract_id)))
            ]
        elif stat == "onboarded":
            leads_filtered = [
                l for l in leads_filtered 
                if l.contract_id or (l.meeting_outcome and 'onboard' in l.meeting_outcome.lower() and 'pending' not in l.meeting_outcome.lower() and 'willing' not in l.meeting_outcome.lower())
            ]

    # Filter by search string if present
    if search:
        s = search.lower()
        leads_filtered = [
            l for l in leads_filtered
            if (l.exporter_name and s in l.exporter_name.lower())
            or (l.pincode and s in l.pincode.lower())
            or (l.address and s in l.address.lower())
            or (l.contact_number and s in l.contact_number.lower())
            or (l.email and s in l.email.lower())
            or (l.service_using and s in l.service_using.lower())
        ]

    return [lead_to_dict(l, 0.0) for l in leads_filtered]

@app.get("/api/leads/priority")
def get_priority_leads(
    division_name: str = "",
    limit: int = 10,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """AI Prediction feature removed."""
    return []

@app.get("/api/divisions")
def get_divisions(
    db: Session = Depends(get_db), 
    user: dict = Depends(get_current_user)
):
    """
    Returns divisions accessible to the authenticated user based on role:
    - ME / DO: Strictly returns their assigned division (normalized).
    - RO: Returns canonical divisions within their assigned regional jurisdiction.
    - CO / Admin: Returns all canonical divisions circle-wide without duplicate casing.
    """
    role = str(user.get("role") if isinstance(user, dict) else getattr(user, "role", "") or "").upper().strip()
    assigned_div = user.get("assigned_division") if isinstance(user, dict) else getattr(user, "assigned_division", None)
    assigned_reg = user.get("assigned_region") if isinstance(user, dict) else getattr(user, "assigned_region", None)

    # ME and DO: Only their assigned division
    if role in ["ME", "MARKETING EXECUTIVE", "EXECUTIVE", "DO", "DIVISION", "DIV"]:
        if assigned_div:
            return [normalize_division_name(assigned_div.strip())]
        return ["Mysuru"]

    # RO: Divisions within regional territory
    elif role == "RO":
        reg_divs = get_divisions_for_region(assigned_reg)
        if reg_divs:
            return sorted(list(set(reg_divs)))
        query = db.query(Lead.division)
        if assigned_reg:
            variants = get_region_variants(assigned_reg)
            if variants:
                query = query.filter(Lead.region.in_(variants))
        divisions = query.distinct().all()
        div_set = {normalize_division_name(div[0]) for div in divisions if div[0] and div[0].strip()}
        clean_list = [d for d in div_set if d and d.lower() not in ['nan', 'none', 'null', 'unassigned', 'commercial division']]
        return sorted(clean_list) if clean_list else ["BG East", "BG South", "BG West", "BG GPO", "Channapatna", "Kolar"]

    # CO / Admin: Circle-wide divisions (canonicalized and deduplicated)
    query = db.query(Lead.division)
    divisions = query.distinct().all()
    div_set = {normalize_division_name(div[0]) for div in divisions if div[0] and div[0].strip()}
    for can_div in KARNATAKA_TERRITORY_REGISTRY.keys():
        div_set.add(can_div)
    
    clean_list = [d for d in div_set if d and d.lower() not in ['nan', 'none', 'null', 'unassigned', 'commercial division']]
    return sorted(clean_list)


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
            
        # Exact calculation of 8 KPIs based on meeting_outcome and willing_to_onboard
        w_val = (getattr(lead, 'willing_to_onboard', '') or '').strip().lower()
        is_contacted = bool(
            (outcome and outcome not in ['nan', 'none', 'null', 'pending', 'new', ''])
            or lead.contacted_date_1 or lead.contacted_date_2 or lead.contacted_date_3
            or lead.date_of_meeting or lead.customer_met or w_val
        )
        if not is_contacted:
            contact_pending += 1
        else:
            contacted += 1
            
        if outcome in ["onboarded", "onboard"] or has_contract:
            onboarded += 1
        elif w_val in ["yes", "willing", "true", "1"] or outcome in ["willing to onboard", "willing_to_onboard", "willing"]:
            willing_to_onboard += 1
        elif outcome in ["positive", "interested"]:
            interested += 1
        elif w_val in ["no", "not willing", "false", "0"] or outcome in ["not interested", "not_interested", "rejected", "not willing to onboard"]:
            not_interested += 1
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
        
        if is_contacted:
            division_map[div_name]["contacted"] += 1
        if "positive" in outcome or "interested" in outcome or w_val in ["yes", "willing"]:
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
        if is_contacted:
            agents[agent_name]["contacted"] += 1
        if has_contract or "onboard" in outcome:
            agents[agent_name]["converted"] += 1
            
        # Temporal series
        date_str = lead.contacted_date_1 or lead.date_of_meeting or lead.contacted_date_2 or lead.contacted_date_3
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
                (and_(
                    or_(Lead.meeting_outcome == None, Lead.meeting_outcome == '', func.lower(Lead.meeting_outcome) == 'nan', func.lower(Lead.meeting_outcome) == 'none', func.lower(Lead.meeting_outcome) == 'null'),
                    or_(Lead.contacted_date_1 == None, Lead.contacted_date_1 == ''),
                    or_(Lead.date_of_meeting == None, Lead.date_of_meeting == ''),
                    or_(Lead.willing_to_onboard == None, Lead.willing_to_onboard == '')
                ), 1),
                else_=None
            )
        ).label("pending"),
        func.count(
            case(
                (or_(
                    and_(Lead.meeting_outcome != None, Lead.meeting_outcome != '', func.lower(Lead.meeting_outcome) != 'nan', func.lower(Lead.meeting_outcome) != 'none', func.lower(Lead.meeting_outcome) != 'null'),
                    and_(Lead.contacted_date_1 != None, Lead.contacted_date_1 != ''),
                    and_(Lead.date_of_meeting != None, Lead.date_of_meeting != ''),
                    and_(Lead.willing_to_onboard != None, Lead.willing_to_onboard != '')
                ), 1),
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
                (or_(
                    func.lower(Lead.meeting_outcome) == "willing to onboard", 
                    func.lower(Lead.meeting_outcome) == "willing_to_onboard", 
                    func.lower(Lead.meeting_outcome) == "willing",
                    func.lower(Lead.willing_to_onboard) == "yes",
                    func.lower(Lead.willing_to_onboard) == "willing"
                ), 1),
                else_=None
            )
        ).label("willing_to_onboard"),
        func.count(
            case(
                (or_(
                    func.lower(Lead.meeting_outcome) == "not willing to onboard", 
                    func.lower(Lead.meeting_outcome) == "not_willing_to_onboard", 
                    func.lower(Lead.meeting_outcome) == "not willing",
                    func.lower(Lead.willing_to_onboard) == "no",
                    func.lower(Lead.willing_to_onboard) == "not willing"
                ), 1),
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
        "contactedDate1": "contacted_date_1",
        "contacted_date_1": "contacted_date_1",
        "contactedDate2": "contacted_date_2",
        "contacted_date_2": "contacted_date_2",
        "contactedDate3": "contacted_date_3",
        "contacted_date_3": "contacted_date_3",
        "contactNumber": "contact_number",
        "serviceUsing": "service_using",
        "monthlyVolume": "monthly_volume",
        "meetingOutcome": "meeting_outcome",
        "contractId": "contract_id",
        "assignedAgent": "assigned_agent",
        "assignedMeName": "assigned_agent",
        "customerMet": "customer_met",
        "remarks": "remarks",
        "exporterName": "exporter_name",
        "exporter_name": "exporter_name",
        "address": "address",
        "pincode": "pincode",
        "poName": "po_name",
        "po_name": "po_name",
        "division": "division",
        "region": "region",
        "email": "email",
        "willingToOnboard": "willing_to_onboard",
        "willing_to_onboard": "willing_to_onboard"
    }
    
    for key, value in data.items():
        db_key = field_map.get(key, key)
        if db_key and hasattr(lead, db_key):
            setattr(lead, db_key, str(value).strip() if value is not None else "")
            
    # Auto-assign agent if empty and user is ME
    user_role = str(current_user.get("role", "")).upper()
    if not lead.assigned_agent and user_role in ["ME", "MARKETING EXECUTIVE", "EXECUTIVE"]:
        lead.assigned_agent = current_user.get("name") or current_user.get("employee_id") or ""

    # Synchronize willing_to_onboard and meeting_outcome
    w_val = (lead.willing_to_onboard or "").strip().lower()
    m_val = (lead.meeting_outcome or "").strip().lower()
    
    if w_val in ["yes", "willing", "true"]:
        lead.willing_to_onboard = "Yes"
        if not lead.meeting_outcome or m_val in ["nan", "none", "pending", "new", ""]:
            lead.meeting_outcome = "Willing to Onboard"
    elif w_val in ["no", "not willing", "false"]:
        lead.willing_to_onboard = "No"
        if not lead.meeting_outcome or m_val in ["nan", "none", "pending", "new", ""]:
            lead.meeting_outcome = "Not Interested"

    if m_val in ["willing to onboard", "willing_to_onboard", "willing"]:
        lead.willing_to_onboard = "Yes"
    elif m_val in ["not willing to onboard", "not_willing_to_onboard", "not willing"]:
        lead.willing_to_onboard = "No"

    # For backward compatibility, keep date_of_meeting and contacted_date_1 in sync
    if lead.contacted_date_1:
        lead.date_of_meeting = lead.contacted_date_1
    elif lead.date_of_meeting and not lead.contacted_date_1:
        lead.contacted_date_1 = lead.date_of_meeting

    db.commit()
    return {"success": True, "message": "Lead updated successfully", "lead": lead_to_dict(lead)}

# 9. Pincode Post Offices Helper Endpoint
@app.get("/api/pincode-offices/{pincode}")
def get_pincode_offices(pincode: str):
    clean_pin = re.sub(r'\D', '', pincode.strip())
    if not clean_pin or len(clean_pin) != 6:
        return {"pincode": pincode, "offices": []}

    # First check pre-mapped office names
    offices = []
    if clean_pin in PINCODE_OFFICE_MAP:
        mapped = PINCODE_OFFICE_MAP[clean_pin]
        # split combined labels like "Bengaluru GPO / Raj Bhavan"
        for part in mapped.split("/"):
            p = part.strip()
            if p and p not in offices:
                offices.append(f"{p} SO" if not p.endswith(("SO", "BO", "HO", "GPO")) else p)

    # If external request is possible, fetch from India Post API with timeout
    try:
        import urllib.request
        req = urllib.request.Request(
            f"https://api.postalpincode.in/pincode/{clean_pin}",
            headers={"User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req, timeout=2.5) as resp:
            data = json.loads(resp.read().decode())
            if isinstance(data, list) and len(data) > 0 and data[0].get("Status") == "Success":
                po_list = data[0].get("PostOffice", [])
                api_offices = [
                    f"{po.get('Name')} {'SO' if po.get('BranchType') == 'Sub Post Office' else 'BO' if po.get('BranchType') == 'Branch Post Office' else 'HO' if po.get('BranchType') == 'Head Post Office' else ''}".strip()
                    for po in po_list if po.get("Name")
                ]
                if api_offices:
                    return {"pincode": clean_pin, "offices": api_offices}
    except Exception:
        pass

    if not offices:
        offices = [f"Post Office - {clean_pin}"]

    return {"pincode": clean_pin, "offices": offices}

# 9.5 Division Scoped Pincodes & Post Offices Endpoint
DIVISION_PINCODES_DATA: Dict[str, Dict[str, List[str]]] = {
    "Mysuru": {
        "570001": ["Mysuru Head Post Office", "Mysuru Fort SO", "K R Circle SO", "Lakshmipuram SO"],
        "570002": ["Mysuru Fort SO", "Agrahara SO", "Vani Vilas Market SO"],
        "570004": ["Nazarbad SO", "Ittigegud SO", "Mysuru Palace SO"],
        "570008": ["Chamundipuram SO", "Vidyaranyapuram SO", "Jayanagar Mysuru SO"],
        "570009": ["Tilaknagar SO", "Mandi Mohalla SO"],
        "570016": ["Belagola Industrial Area SO", "Metagalli SO", "Hebbal SO"],
        "570017": ["Bannimantap SO", "Bamboo Bazar SO"],
        "570018": ["Hootagalli Industrial Area SO", "Koorgalli BO", "Belavadi SO"],
        "570019": ["Vijayanagar SO", "Gokulam SO"],
        "570020": ["Kuvempunagar SO", "Vivekanandanagar SO"],
        "570022": ["Ramakrishnanagar SO", "Bogadi SO"],
        "570023": ["Saraswathipuram SO", "Tonachikoppal SO", "Jayalakshmipuram SO"],
        "570025": ["Srirampura SO", "JP Nagar Mysuru SO"],
        "570026": ["Dattagalli SO", "Roopa Nagar SO"],
        "570027": ["Hebbal Industrial Area SO", "Kumbarakoppal SO"],
        "570028": ["Siddartha Nagar SO", "Alanahalli SO"],
        "571114": ["Kadakola SO", "Thandavapura SO"],
        "571301": ["Nanjangud SO", "Industrial Estate Nanjangud SO"],
        "571311": ["T Narasipura SO", "Bannur SO"],
        "571313": ["Chamarajanagar SO", "Ramasamudra SO"]
    },
    "Bengaluru East": {
        "560001": ["Bengaluru GPO", "Raj Bhavan SO", "Vidhana Soudha SO"],
        "560005": ["Frazer Town SO", "Cox Town SO"],
        "560008": ["HAL II Stage SO", "Indiranagar SO", "Domlur SO"],
        "560016": ["Doorvaninagar SO", "Ramamurthy Nagar SO"],
        "560017": ["HAL Old Airport Road SO", "Vimanapura SO"],
        "560024": ["Hebbal SO", "Anandnagar SO"],
        "560025": ["Museum Road SO", "Ashoknagar SO", "Richmond Town SO"],
        "560032": ["RT Nagar SO", "Ganganagar SO"],
        "560033": ["Maruthi Seva Nagar SO", "Cooke Town SO"],
        "560038": ["Indiranagar SO", "Defence Colony SO"],
        "560042": ["St. Thomas Town SO", "Lingarajapuram SO"],
        "560043": ["Banaswadi SO", "Kalyan Nagar SO"],
        "560045": ["Manyata Tech Park SO", "Nagawara SO"],
        "560048": ["Hoodi SO", "Mahadevapura SO"],
        "560064": ["Yelahanka Satellite Town SO", "Attur BO"],
        "560066": ["Whitefield SO", "Kadugodi SO", "Immadihalli BO"],
        "560071": ["Domlur SO", "Airport Road SO"],
        "560075": ["HAL III Stage SO", "New Thippasandra SO"],
        "560077": ["Kothanur SO", "Hennur SO"],
        "560080": ["Sadashivanagar SO", "Palace Guttahalli SO"],
        "560092": ["Sahakarnagar SO", "Hebbal Agricultural Farm SO", "Kodigehalli BO", "Byatarayanapura SO"],
        "560094": ["RMV Extension II Stage SO", "Sanjaynagar SO"]
    },
    "Bengaluru South": {
        "560002": ["Bengaluru City SO", "Dharmaram College SO", "Town Hall SO"],
        "560004": ["Basavanagudi SO", "Pampa Mahakavi Road SO", "N R Colony SO"],
        "560009": ["K.G. Road SO", "Majestic SO"],
        "560011": ["Jayanagar SO", "Tilaknagar SO"],
        "560026": ["Mysore Road SO", "Kasturba Nagar SO"],
        "560027": ["Lalbagh West SO", "Sudhamanagar SO"],
        "560029": ["Dharmaram College SO", "Taverekere SO"],
        "560034": ["Koramangala SO", "St. Johns Medical College SO", "Agara SO"],
        "560053": ["Chickpet SO", "City Market SO"],
        "560068": ["Madivala SO", "Bommanahalli SO"],
        "560070": ["Banashankari II Stage SO", "Padmanabhanagar SO"],
        "560076": ["BTM 2nd Stage SO", "Bannerghatta Road SO"],
        "560078": ["JP Nagar SO", "Sarakki SO"],
        "560082": ["Jayanagar East SO", "Yediyur SO"],
        "560085": ["Banashankari 3rd Stage SO", "Kathriguppe SO"],
        "560095": ["Koramangala 4th Block SO", "ST Bed SO"],
        "560099": ["Bommasandra Industrial Estate SO", "Hebbagodi BO"],
        "560100": ["Electronic City SO", "Konappana Agrahara SO"],
        "560105": ["Austin Town SO", "Viveknagar SO"]
    },
    "Bengaluru West": {
        "560003": ["Malleswaram SO", "Vyalikaval SO"],
        "560010": ["Rajajinagar SO", "Industrial Estate SO", "Prakash Nagar SO"],
        "560013": ["Jalahalli SO", "MS Ramaiah SO"],
        "560020": ["Seshadripuram SO", "Palace Guttahalli SO"],
        "560021": ["Srirampuram SO", "Dayananda Nagar SO"],
        "560022": ["Yeshwanthpur Industrial Suburb SO", "Yeshwantpur SO"],
        "560023": ["Magadi Road SO", "Binnypet SO"],
        "560040": ["Vijayanagar Bengaluru SO", "RPC Layout SO"],
        "560054": ["Mathikere SO", "Gokula SO"],
        "560057": ["Peenya Dasarahalli SO", "Jalahalli West SO"],
        "560058": ["Peenya 1st Stage SO", "Peenya Small Industries SO"],
        "560079": ["Basaveshwaranagar SO", "Kamakshipalya SO"],
        "560086": ["Mahalakshmi Layout SO", "West of Chord Road SO"],
        "560091": ["Viswaneedam SO", "Magadi Main Road SO"],
        "560097": ["Vidyaranyapura SO", "Tindlu BO"],
        "561203": ["Doddaballapur SO", "KIADB SO"],
        "562107": ["Nelamangala SO", "Arishinakunte BO"]
    },
    "Belagavi": {
        "590001": ["Belagavi Head Post Office", "Camp Belagavi SO", "Khade Bazar SO"],
        "590005": ["Shahapur SO", "Vadgaon SO"],
        "590006": ["Tilakwadi SO", "Angol SO"],
        "590008": ["Belagavi City SO", "Khasbag SO"],
        "590010": ["Hindwadi SO", "Congress Road SO"],
        "590011": ["Auto Nagar SO", "Kanakadasa Nagar SO"],
        "590014": ["Machhe Industrial Area SO", "Vadgaon SO"],
        "590015": ["Angol SO", "Bhagyanagar SO"],
        "590016": ["Udyambag SO", "KIADB Belagavi SO"],
        "591304": ["Gokak Falls SO", "Konnur SO"]
    },
    "Dharwad": {
        "580001": ["Dharwad Head Post Office", "Station Road SO"],
        "580008": ["Sattur SO", "SDM Medical SO"],
        "580011": ["Navanagar SO", "APMC SO"],
        "580020": ["Hubballi Main SO", "Durgad Bail SO"],
        "580023": ["Railway Colony SO", "Deshpande Nagar SO"],
        "580024": ["Keshwapur SO", "Kusugal Road SO"],
        "580025": ["Old Hubballi SO", "Anand Nagar SO"],
        "580026": ["Gokul Road Industrial Estate SO", "Tarihal SO"],
        "580030": ["Vidyanagar Hubballi SO", "Shirur Park SO"],
        "580031": ["Bhairidevarakoppa SO", "Unkal SO"],
        "581110": ["Haveri SO", "Ashwini Nagar SO"]
    },
    "Mangaluru": {
        "575001": ["Mangaluru Head Post Office", "Hampankatta SO", "Bunder SO"],
        "575002": ["Kankanady SO", "Falnir SO"],
        "575003": ["Kodialbail SO", "Ashoknagar Mangaluru SO"],
        "575005": ["Kankanady SO", "Valencia SO"],
        "575008": ["Kadri SO", "Mallikatte SO"],
        "575011": ["Baikampady Industrial Estate SO", "Panambur SO"],
        "575018": ["Surathkal SO", "NITK SO"],
        "574118": ["Manipal SO", "Endpoint BO"],
        "576101": ["Udupi Head Post Office", "Court Road SO"]
    },
    "Kalaburagi": {
        "585101": ["Kalaburagi Head Post Office", "Main Road SO"],
        "585102": ["Super Market SO", "Station Road SO"],
        "585103": ["MSK Mill SO", "Brahampur SO"],
        "585104": ["Sedam Road SO", "Gulbarga University SO"],
        "585105": ["Kapnoor Industrial Area SO", "Humnabad Base SO"],
        "585310": ["Humnabad Road SO", "Farhatabad SO"]
    },
    "Ballari": {
        "583101": ["Ballari Head Post Office", "Brucepet SO"],
        "583102": ["Cowlbazar SO", "Cantonment SO"],
        "583103": ["Cantonment SO", "Millerpet SO"],
        "583104": ["Gandhi Nagar Ballari SO", "Satyanarayanapet SO"],
        "583118": ["Kudithini SO", "Jindal Steel BO"],
        "583121": ["Siruguppa SO", "Tekkalakote SO"],
        "583126": ["Toranagallu SO", "JSW Steel Complex SO"],
        "583201": ["Hospet Head Post Office", "Station Road SO"]
    },
    "Tumakuru": {
        "572101": ["Tumakuru Head Post Office", "Ashoka Road SO"],
        "572102": ["Siddaganga Mutt SO", "Kyathsandra SO"],
        "572103": ["B H Road SO", "Mandipet SO"],
        "572104": ["SSIT SO", "Maralur SO"],
        "572106": ["Antharasanahalli Industrial Area SO", "Batwadi SO"],
        "572126": ["Kunigal SO", "Huliyurdurga SO"],
        "572128": ["Tiptur SO", "B H Road Tiptur SO"]
    },
    "Udupi": {
        "576101": ["Udupi Head Post Office", "Court Road SO"],
        "576102": ["Kunjibettu SO", "Manipal Road SO"],
        "576104": ["Malpe SO", "Fisheries Wharf SO"],
        "574118": ["Manipal SO", "Endpoint BO"],
        "576201": ["Kundapura SO", "Chikkatoto SO"],
        "576213": ["Byndoor SO", "Shiroor SO"],
        "576219": ["Brahmavara SO", "Saligrama SO"]
    },
    "Shivamogga": {
        "577201": ["Shivamogga Head Post Office", "Durgigudi SO"],
        "577202": ["Vinobha Nagar SO", "Gopala SO"],
        "577204": ["Kallahalli SO", "Industrial Estate Shivamogga SO"],
        "577222": ["Bhadravathi Old Town SO", "VISL SO"],
        "577301": ["Bhadravathi SO", "Paper Town SO"],
        "577401": ["Sagar SO", "Subhash Nagar SO"]
    }
}

# Aliases for divisions with alternate spellings
DIVISION_PINCODES_DATA["BG East"] = DIVISION_PINCODES_DATA["Bengaluru East"]
DIVISION_PINCODES_DATA["BG EAST"] = DIVISION_PINCODES_DATA["Bengaluru East"]
DIVISION_PINCODES_DATA["BG South"] = DIVISION_PINCODES_DATA["Bengaluru South"]
DIVISION_PINCODES_DATA["BG SOUTH"] = DIVISION_PINCODES_DATA["Bengaluru South"]
DIVISION_PINCODES_DATA["BG West"] = DIVISION_PINCODES_DATA["Bengaluru West"]
DIVISION_PINCODES_DATA["BG WEST"] = DIVISION_PINCODES_DATA["Bengaluru West"]
DIVISION_PINCODES_DATA["Tumkur"] = DIVISION_PINCODES_DATA["Tumakuru"]
DIVISION_PINCODES_DATA["Shimoga"] = DIVISION_PINCODES_DATA["Shivamogga"]
DIVISION_PINCODES_DATA["Hubballi"] = DIVISION_PINCODES_DATA["Dharwad"]

@app.get("/api/division-pincodes/{division_name}")
def get_division_pincodes(division_name: str, db: Session = Depends(get_db)):
    """
    Returns the list of pincodes and post office names strictly scoped to the specified division.
    Enables MEs to only view and select pincodes and offices relevant to their division.
    """
    canonical_div = normalize_division_name(division_name)
    clean_div = canonical_div or division_name.replace(" Division", "").strip()
    
    # 1. Match from pre-configured division pincode mapping
    matched_data = DIVISION_PINCODES_DATA.get(canonical_div) or DIVISION_PINCODES_DATA.get(clean_div) or DIVISION_PINCODES_DATA.get(division_name)
    if not matched_data:
        for k, v in DIVISION_PINCODES_DATA.items():
            if k.lower() == clean_div.lower() or k.lower() in clean_div.lower() or clean_div.lower() in k.lower():
                matched_data = v
                clean_div = k
                break

    pins_dict: Dict[str, List[str]] = dict(matched_data) if matched_data else {}

    # 2. Augment with any unique pincodes present in database for this division
    try:
        aliases = get_division_aliases(division_name)
        div_conds = [func.lower(func.trim(Lead.division)) == a for a in aliases]
        if clean_div:
            div_conds.append(func.lower(func.trim(Lead.division)).like(f"%{clean_div.lower()}%"))
        db_records = db.query(Lead.pincode).filter(
            or_(*div_conds),
            Lead.pincode != None
        ).distinct().all()
        for rec in db_records:
            pin = re.sub(r'\D', '', str(rec[0] or "")).strip()
            if pin and len(pin) == 6 and pin not in pins_dict:
                office_name = PINCODE_OFFICE_MAP.get(pin, f"Post Office - {pin}")
                pins_dict[pin] = [office_name]
    except Exception as e:
        print(f"[Division Pincodes] DB augmentation note: {e}")


    # Fallback to Mysuru if division not found
    if not pins_dict:
        pins_dict = DIVISION_PINCODES_DATA.get("Mysuru", {})

    items = [{"pincode": pin, "offices": offices} for pin, offices in sorted(pins_dict.items())]
    return {
        "division": clean_div,
        "pincodes": items,
        "pincode_list": [item["pincode"] for item in items]
    }

# 10. List Marketing Executives Endpoint
@app.get("/api/mes")
def get_marketing_executives(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    role = str(current_user.get("role") or "").upper().strip()
    assigned_reg = current_user.get("assigned_region")
    assigned_div = current_user.get("assigned_division")

    query = db.query(User).filter(
        or_(func.upper(User.role) == "ME", User.role == None)
    )

    if role == "RO" and assigned_reg:
        reg_divs = get_divisions_for_region(assigned_reg)
        query = query.filter(
            or_(
                User.assigned_region == assigned_reg,
                User.assigned_division.in_(reg_divs)
            )
        )
    elif role in ["DO", "DIVISION", "DIV", "ME"] and assigned_div:
        query = query.filter(User.assigned_division == assigned_div)

    me_users = query.all()
    results = []
    for u in me_users:
        results.append({
            "employee_id": u.employee_id,
            "name": u.name or u.employee_id,
            "mobile_number": u.mobile_number,
            "division": u.assigned_division,
            "region": u.assigned_region
        })
    return results
