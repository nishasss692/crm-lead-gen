#!/usr/bin/env python3
"""
Data Migration Script: SQLite (crm.db) -> Supabase PostgreSQL
Transfers all users and 6,840+ leads seamlessly into PostgreSQL.
"""
import os
import sys
import sqlite3
import re

# Ensure Windows terminal doesn't crash on print
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

from sqlalchemy import create_engine, text, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SQLITE_PATH = os.path.join(BASE_DIR, "crm.db")

Base = declarative_base()

class Lead(Base):
    __tablename__ = "leads"
    
    id = Column(Integer, primary_key=True, index=True)
    sl_no = Column(String, nullable=True)
    exporter_name = Column(String, nullable=True, index=True)
    address = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    po_name = Column(String, nullable=True)
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
    contacted_date_1 = Column(String, nullable=True)
    contacted_date_2 = Column(String, nullable=True)
    contacted_date_3 = Column(String, nullable=True)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, unique=True, index=True)
    name = Column(String, nullable=True)
    password = Column(String)
    role = Column(String)
    assigned_region = Column(String, nullable=True)
    assigned_division = Column(String, nullable=True)
    mobile_number = Column(String, nullable=True)

def get_pg_url():
    url = ""
    if len(sys.argv) > 1 and sys.argv[1].strip():
        url = sys.argv[1].strip()
    else:
        url = os.getenv("DATABASE_URL", "").strip()

    # If still not found, search in .env files
    if not url:
        for env_path in [os.path.join(BASE_DIR, "..", ".env"), os.path.join(BASE_DIR, ".env"), ".env"]:
            if os.path.exists(env_path):
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith("DATABASE_URL="):
                            url = line.split("=", 1)[1].strip().strip('"').strip("'")
                            break
            if url:
                break
        
    if not url:
        print("[Error] No PostgreSQL URL provided.")
        print("Usage: python migrate_to_pg.py <postgresql_url>")
        print("   or: set DATABASE_URL in your environment or .env file.")
        sys.exit(1)
        
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
        
    return url

def migrate():
    pg_url = get_pg_url()
    clean_target = pg_url.split("@")[-1] if "@" in pg_url else pg_url[:20]
    print(f"\n=======================================================")
    print(f"[*] Starting Migration: SQLite -> PostgreSQL ({clean_target})")
    print(f"=======================================================\n")

    if not os.path.exists(SQLITE_PATH):
        print(f"[Error] Source SQLite database not found at: {SQLITE_PATH}")
        sys.exit(1)

    # 1. Connect to SQLite
    sqlite_conn = sqlite3.connect(SQLITE_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    s_cur = sqlite_conn.cursor()

    # 2. Connect to PostgreSQL
    try:
        pg_engine = create_engine(pg_url, pool_pre_ping=True)
        with pg_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("[OK] Successfully connected to PostgreSQL destination.")
    except Exception as e:
        print(f"[ERR] Failed to connect to PostgreSQL: {e}")
        sys.exit(1)

    # 3. Create tables in PostgreSQL using models
    Base.metadata.create_all(bind=pg_engine)
    print("[OK] Verified PostgreSQL schema tables (users, leads).")

    PgSession = sessionmaker(bind=pg_engine)
    pg_session = PgSession()

    try:
        # 4. Migrate Users
        print("\n--- Migrating Users ---")
        s_cur.execute("SELECT * FROM users")
        users_rows = s_cur.fetchall()
        user_count = 0
        skipped_users = 0

        for row in users_rows:
            r_dict = dict(row)
            emp_id = r_dict.get("employee_id")
            if not emp_id:
                continue

            existing = pg_session.query(User).filter(User.employee_id == emp_id).first()
            if not existing:
                new_user = User(
                    employee_id=emp_id,
                    name=r_dict.get("name"),
                    password=r_dict.get("password"),
                    role=r_dict.get("role", "ME"),
                    assigned_division=r_dict.get("assigned_division"),
                    assigned_region=r_dict.get("assigned_region"),
                    mobile_number=r_dict.get("mobile_number")
                )
                pg_session.add(new_user)
                user_count += 1
            else:
                skipped_users += 1

        pg_session.commit()
        print(f"[OK] Users migration complete: {user_count} added, {skipped_users} already existed.")

        # 5. Migrate Leads in batches
        print("\n--- Migrating Leads ---")
        s_cur.execute("SELECT count(*) FROM leads")
        total_leads = s_cur.fetchone()[0]
        print(f"Total leads in SQLite to migrate: {total_leads}")

        s_cur.execute("SELECT * FROM leads ORDER BY id ASC")
        batch_size = 500
        leads_added = 0
        batch = []

        # Check if leads already exist in destination
        existing_lead_count = pg_session.query(Lead).count()
        if existing_lead_count > 0:
            print(f"[Notice] PostgreSQL already contains {existing_lead_count} leads.")
            if existing_lead_count >= total_leads:
                print("[OK] Leads already fully migrated in PostgreSQL!")
                total_leads = 0

        if total_leads > 0 and existing_lead_count == 0:
            valid_lead_cols = {c.name for c in Lead.__table__.columns}
            while True:
                rows = s_cur.fetchmany(batch_size)
                if not rows:
                    break
                for row in rows:
                    r = dict(row)
                    filtered_data = {k: v for k, v in r.items() if k in valid_lead_cols}
                    lead_obj = Lead(**filtered_data)
                    batch.append(lead_obj)

                pg_session.bulk_save_objects(batch)
                pg_session.commit()
                leads_added += len(batch)
                print(f"  -> Migrated {leads_added}/{total_leads} leads...")
                batch = []

            print(f"[OK] Leads migration complete: {leads_added} leads successfully loaded into PostgreSQL.")

            # 6. Reset sequences in PostgreSQL
            try:
                with pg_engine.connect() as conn:
                    conn.execute(text("SELECT setval(pg_get_serial_sequence('leads', 'id'), COALESCE(max(id), 1)) FROM leads;"))
                    conn.execute(text("SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(max(id), 1)) FROM users;"))
                    conn.commit()
                print("[OK] Auto-increment sequences synchronized.")
            except Exception as seq_err:
                print(f"[Note] Sequence sync note: {seq_err}")

    except Exception as e:
        pg_session.rollback()
        print(f"[ERR] Error during migration: {e}")
        raise e
    finally:
        pg_session.close()
        sqlite_conn.close()

    print(f"\n=======================================================")
    print(f"[SUCCESS] Migration Completed! PostgreSQL is ready to use.")
    print(f"=======================================================\n")

if __name__ == "__main__":
    migrate()
