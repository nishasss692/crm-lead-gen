"""
Pincode Master Data Seeder
Seeds PincodeMaster records directly into SQLite (or the configured database)
without requiring an external Excel file.
"""

import os
import sys
from typing import Optional, List, Dict, Any, Union

# Ensure backend directory is in python search path
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# -------------------------------------------------------------------------
# 1. Database Connection & Model Setup
# -------------------------------------------------------------------------
SQLITE_DB_PATH = os.path.join(BACKEND_DIR, "crm.db")
SQLITE_DATABASE_URL = f"sqlite:///{SQLITE_DB_PATH}"

# SQLite Engine & Session for direct local seeding
sqlite_engine = create_engine(SQLITE_DATABASE_URL, connect_args={"check_same_thread": False})
SQLiteSession = sessionmaker(autocommit=False, autoflush=False, bind=sqlite_engine)

# Try importing existing Base and SessionLocal from main.py if available
try:
    from main import Base, SessionLocal as MainSessionLocal, engine as main_engine
except Exception:
    Base = declarative_base()
    MainSessionLocal = None
    main_engine = None

# PincodeMaster Model Definition
class PincodeMaster(Base):
    __tablename__ = "pincode_master"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, autoincrement=True)
    pincode = Column(Integer, nullable=False, index=True)
    office_name = Column(String, nullable=True)
    division = Column(String, nullable=True)
    region = Column(String, nullable=True)

    def __repr__(self):
        return f"<PincodeMaster(id={self.id}, pincode={self.pincode}, office='{self.office_name}', division='{self.division}', region='{self.region}')>"

# Ensure the pincode_master table exists in SQLite & Main DB
try:
    Base.metadata.create_all(bind=sqlite_engine)
except Exception:
    pass

if main_engine is not None and main_engine != sqlite_engine:
    try:
        Base.metadata.create_all(bind=main_engine)
    except Exception:
        pass

# -------------------------------------------------------------------------
# 2. Test / Seed Data
# -------------------------------------------------------------------------

# Option A: Dictionary Structure (id, pincode, office_name, division, region)
TEST_PINCODES_DICT: List[Dict[str, Any]] = [
    {
        "id": 1,
        "pincode": 560001,
        "office_name": "Bengaluru GPO / Raj Bhavan",
        "division": "BG East",
        "region": "Bengaluru HQ Region",
    },
    {
        "id": 2,
        "pincode": 560002,
        "office_name": "Bengaluru City / Town Hall",
        "division": "BG West",
        "region": "Bengaluru HQ Region",
    },
    {
        "id": 3,
        "pincode": 560004,
        "office_name": "Basavanagudi",
        "division": "BG South",
        "region": "Bengaluru HQ Region",
    },
    {
        "id": 4,
        "pincode": 560034,
        "office_name": "Koramangala",
        "division": "BG South",
        "region": "Bengaluru HQ Region",
    },
    {
        "id": 5,
        "pincode": 560058,
        "office_name": "Peenya Industrial Area Phase I-IV",
        "division": "BG West",
        "region": "Bengaluru HQ Region",
    },
    {
        "id": 6,
        "pincode": 560066,
        "office_name": "Whitefield",
        "division": "BG East",
        "region": "Bengaluru HQ Region",
    },
    {
        "id": 7,
        "pincode": 560100,
        "office_name": "Electronic City Phase I & II",
        "division": "BG South",
        "region": "Bengaluru HQ Region",
    },
    {
        "id": 8,
        "pincode": 570001,
        "office_name": "Mysuru Head Post Office",
        "division": "Mysuru",
        "region": "South Karnataka Region",
    },
    {
        "id": 9,
        "pincode": 571313,
        "office_name": "Chamarajanagar",
        "division": "Chamarajanagar",
        "region": "South Karnataka Region",
    },
    {
        "id": 10,
        "pincode": 572101,
        "office_name": "Tumakuru Head Post Office",
        "division": "Tumakuru",
        "region": "South Karnataka Region",
    },
    {
        "id": 11,
        "pincode": 573201,
        "office_name": "Hassan Head Post Office",
        "division": "Hassan",
        "region": "South Karnataka Region",
    },
    {
        "id": 12,
        "pincode": 575001,
        "office_name": "Mangaluru Head Post Office",
        "division": "Mangaluru",
        "region": "South Karnataka Region",
    },
    {
        "id": 13,
        "pincode": 576101,
        "office_name": "Udupi Head Post Office",
        "division": "Udupi",
        "region": "South Karnataka Region",
    },
    {
        "id": 14,
        "pincode": 577001,
        "office_name": "Davanagere Head Post Office",
        "division": "Davanagere",
        "region": "South Karnataka Region",
    },
    {
        "id": 15,
        "pincode": 577201,
        "office_name": "Shivamogga Head Post Office",
        "division": "Shivamogga",
        "region": "South Karnataka Region",
    },
    {
        "id": 16,
        "pincode": 580001,
        "office_name": "Dharwad Head Post Office",
        "division": "Dharwad",
        "region": "North Karnataka Region",
    },
    {
        "id": 17,
        "pincode": 581110,
        "office_name": "Haveri",
        "division": "Haveri",
        "region": "North Karnataka Region",
    },
    {
        "id": 18,
        "pincode": 583101,
        "office_name": "Ballari Head Post Office",
        "division": "Ballari",
        "region": "North Karnataka Region",
    },
    {
        "id": 19,
        "pincode": 585101,
        "office_name": "Kalaburagi Head Post Office",
        "division": "Kalaburagi",
        "region": "North Karnataka Region",
    },
    {
        "id": 20,
        "pincode": 590001,
        "office_name": "Belagavi Head Post Office",
        "division": "Belagavi",
        "region": "North Karnataka Region",
    },
]

# Option B: Tuple Structure format example (id, pincode, office_name, division, region)
TEST_PINCODES_TUPLES = [
    (21, 561203, "Doddaballapur KIADB", "BG East", "Bengaluru HQ Region"),
    (22, 570020, "Kuvempunagar", "Mysuru", "South Karnataka Region"),
    (23, 580020, "Hubballi Main", "Dharwad", "North Karnataka Region"),
]


def _normalize_item(item: Union[Dict[str, Any], tuple, list]) -> Dict[str, Any]:
    """Helper to standardize dict or tuple into a uniform dict."""
    if isinstance(item, dict):
        return {
            "id": item.get("id"),
            "pincode": int(item["pincode"]),
            "office_name": str(item.get("office_name") or ""),
            "division": str(item.get("division") or ""),
            "region": str(item.get("region") or ""),
        }
    elif isinstance(item, (tuple, list)):
        if len(item) == 5:
            return {
                "id": item[0],
                "pincode": int(item[1]),
                "office_name": str(item[2]),
                "division": str(item[3]),
                "region": str(item[4]),
            }
        elif len(item) == 4:
            return {
                "id": None,
                "pincode": int(item[0]),
                "office_name": str(item[1]),
                "division": str(item[2]),
                "region": str(item[3]),
            }
    raise ValueError(f"Invalid pincode row format: {item}")


# -------------------------------------------------------------------------
# 3. Data Seeder Function
# -------------------------------------------------------------------------
def seed_pincodes(
    data: Optional[List[Any]] = None,
    session: Optional[Session] = None
) -> int:
    """
    Seeds pincode records into the database table using session.merge() to prevent duplicates.
    
    :param data: List of dicts or tuples containing pincode data. Defaults to TEST_PINCODES_DICT.
    :param session: SQLAlchemy session. Defaults to a new SQLiteSession.
    :return: Number of records processed.
    """
    if data is None:
        data = TEST_PINCODES_DICT

    close_session = False
    if session is None:
        session = SQLiteSession()
        close_session = True

    processed_count = 0
    try:
        for raw_row in data:
            row = _normalize_item(raw_row)

            # Check if record with this pincode already exists
            existing = session.query(PincodeMaster).filter_by(pincode=row["pincode"]).first()
            resolved_id = existing.id if existing else row.get("id")

            record = PincodeMaster(
                id=resolved_id,
                pincode=row["pincode"],
                office_name=row["office_name"],
                division=row["division"],
                region=row["region"]
            )

            session.merge(record)
            processed_count += 1

        session.commit()
        return processed_count
    except Exception as e:
        session.rollback()
        print(f"[Pincode Seeder] Error during seeding: {e}")
        raise
    finally:
        if close_session:
            session.close()


# -------------------------------------------------------------------------
# 4. Main Execution Block
# -------------------------------------------------------------------------
if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    print("=" * 65)
    print("[INIT] India Post CRM - Pincode Master Data Seeder")
    print(f"[PATH] Target SQLite Database: {SQLITE_DB_PATH}")
    print("=" * 65)

    # 1. Seed into SQLite database
    sqlite_sess = SQLiteSession()
    count_sqlite = seed_pincodes(TEST_PINCODES_DICT, session=sqlite_sess)
    sqlite_sess.close()
    print(f"[OK] Successfully seeded {count_sqlite} pincode records into SQLite database!")

    # 2. Optionally also sync into the configured MainSessionLocal (PostgreSQL) if connected
    if MainSessionLocal is not None and main_engine is not None and main_engine != sqlite_engine:
        try:
            main_sess = MainSessionLocal()
            count_main = seed_pincodes(TEST_PINCODES_DICT, session=main_sess)
            main_sess.close()
            print(f"[OK] Also synced {count_main} pincode records into active Database ({main_engine.url.drivername})!")
        except Exception as err:
            print(f"[INFO] Note: Remote database sync skipped ({err}). SQLite seeding completed.")

    # 3. Verify and print a preview of seeded rows from SQLite
    verify_sess = SQLiteSession()
    total_in_db = verify_sess.query(PincodeMaster).count()
    samples = verify_sess.query(PincodeMaster).limit(5).all()
    verify_sess.close()

    print("\n[INFO] Database Status:")
    print(f"   Total records in pincode_master: {total_in_db}")
    print("   Preview of records:")
    for s in samples:
        print(f"   - PIN {s.pincode}: {s.office_name} ({s.division} Div, {s.region})")

    print("\n[SUCCESS] Pincode Master Data seeding completed successfully!\n")
