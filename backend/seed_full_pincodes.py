"""
Seed full Pincode Master Data from user-provided Karnataka Circle dataset into SQLite crm.db
and PostgreSQL (if configured).
"""
import os
import sys
import csv
import re

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import PincodeMaster, DB_PATH, engine as main_engine

sqlite_engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SQLiteSession = sessionmaker(autocommit=False, autoflush=False, bind=sqlite_engine)

CSV_FILE = os.path.join(BACKEND_DIR, "karnataka_pincodes_master.csv")

CANONICAL_DIV_MAP = {
    'bg east': 'BG East',
    'bg south': 'BG South',
    'bg west': 'BG West',
    'bg gpo': 'BG GPO',
    'bagalkot': 'Bagalkote',
    'shimoga': 'Shivamogga',
    'tumkur': 'Tumakuru',
    'davanagere': 'Davangere',
    'chikmagalur': 'Chikkamagaluru',
    'vijayapur': 'Vijayapura',
    'yadagiri': 'Yadgir',
    'kolar': 'Kolar'
}

def seed_full_data():
    if not os.path.exists(CSV_FILE):
        print(f"[ERROR] CSV file not found at: {CSV_FILE}")
        return

    with open(CSV_FILE, "r", encoding="utf-8", errors="ignore") as f:
        reader = list(csv.DictReader(f))

    # Target engines: SQLite and main_engine (if different, e.g. Postgres)
    engines = [sqlite_engine]
    if main_engine is not None and main_engine != sqlite_engine:
        engines.append(main_engine)

    for eng in engines:
        SessionClass = sessionmaker(autocommit=False, autoflush=False, bind=eng)
        session = SessionClass()
        count = 0
        try:
            for row in reader:
                raw_pin = re.sub(r'\D', '', row.get("Pincode", ""))
                if len(raw_pin) != 6:
                    continue
                pin = int(raw_pin)
                office_name = row.get("Office Name", "").strip()
                raw_div = row.get("Division", "").strip()
                region = row.get("Region", "").strip()
                division = CANONICAL_DIV_MAP.get(raw_div.lower(), raw_div)

                existing = session.query(PincodeMaster).filter_by(pincode=pin).first()
                if existing:
                    existing.office_name = office_name
                    existing.division = division
                    existing.region = region
                    session.merge(existing)
                else:
                    rec = PincodeMaster(
                        pincode=pin,
                        office_name=office_name,
                        division=division,
                        region=region
                    )
                    session.add(rec)
                count += 1
            session.commit()
            print(f"[OK] Successfully processed and seeded {count} post offices into {eng.url}.")
        except Exception as e:
            session.rollback()
            print(f"[ERROR] Seeding error for {eng.url}: {e}")
        finally:
            session.close()

if __name__ == "__main__":
    seed_full_data()
