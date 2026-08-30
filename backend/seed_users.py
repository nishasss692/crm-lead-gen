import os
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import User, Base, get_password_hash, engine as main_engine

# 1. Setup SQLite Connection
DB_URL = "sqlite:///./crm_leads.db"
engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def find_file_path(filename="MEs DATA.xlsx"):
    candidates = [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), filename),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", filename),
        filename,
        os.path.join(os.path.expanduser("~"), "Downloads", filename),
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    return filename

def seed_marketing_executives():
    # Ensure database schema exists in crm_leads.db
    Base.metadata.create_all(bind=engine)
    
    # Also ensure table exists in main_engine (crm.db) if different
    if main_engine is not None and str(main_engine.url) != str(engine.url):
        try:
            Base.metadata.create_all(bind=main_engine)
        except Exception:
            pass

    # 2. Read and Parse Excel File
    file_path = find_file_path("MEs DATA.xlsx")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Could not locate '{file_path}'. Please ensure 'MEs DATA.xlsx' exists.")

    df = pd.read_excel(file_path)

    # Precompute default password hash once
    default_password_hash = get_password_hash("Post@123")

    # 3. Insert / Merge Users into SQLite
    db_sessions = [SessionLocal()]
    
    # Also sync to main_engine session if different
    if main_engine is not None and str(main_engine.url) != str(engine.url):
        MainSession = sessionmaker(autocommit=False, autoflush=False, bind=main_engine)
        db_sessions.append(MainSession())

    imported_me_ids = set()

    try:
        for db in db_sessions:
            user_map = {u.employee_id: u for u in db.query(User).all() if u.employee_id}

            for _, row in df.iterrows():
                emp_id_raw = row.get("Emp ID")
                if pd.isna(emp_id_raw):
                    continue

                # Format Emp ID cleanly as string
                if isinstance(emp_id_raw, float):
                    emp_id_str = str(int(emp_id_raw)) if emp_id_raw.is_integer() else str(emp_id_raw)
                else:
                    emp_id_str = str(emp_id_raw).strip()
                    if emp_id_str.endswith(".0"):
                        emp_id_str = emp_id_str[:-2]

                division_name = str(row.get("Division Name")).strip() if pd.notna(row.get("Division Name")) else None
                region_name = str(row.get("Region Name")).strip() if pd.notna(row.get("Region Name")) else None

                # Clean placeholders
                if division_name in ["nan", "None", ""]:
                    division_name = None
                if region_name in ["nan", "None", ""]:
                    region_name = None

                try:
                    if emp_id_str in user_map:
                        existing_user = user_map[emp_id_str]
                        existing_user.password = default_password_hash
                        existing_user.role = "ME"
                        existing_user.assigned_division = division_name
                        existing_user.assigned_region = region_name
                    else:
                        new_user = User(
                            employee_id=emp_id_str,
                            password=default_password_hash,
                            role="ME",
                            assigned_division=division_name,
                            assigned_region=region_name,
                        )
                        db.add(new_user)
                        user_map[emp_id_str] = new_user
                    
                    imported_me_ids.add(emp_id_str)
                except Exception as row_err:
                    print(f"Warning: Skipping row with Emp ID {emp_id_str}: {row_err}")
                    continue

            db.commit()

        # Print success message stating "Successfully imported X Marketing Executives."
        print(f"Successfully imported {len(imported_me_ids)} Marketing Executives.")
    finally:
        for db in db_sessions:
            db.close()

if __name__ == "__main__":
    seed_marketing_executives()
