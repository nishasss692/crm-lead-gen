import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import User, Base, engine, get_password_hash

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_users():
    db = SessionLocal()
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    users_data = [
        # Central Office User (CO)
        User(employee_id="CO_ADMIN", password=get_password_hash("password123"), role="CO", assigned_region=None, assigned_division=None),
        
        # Regional Office User (RO)
        User(employee_id="RO_BG", password=get_password_hash("password123"), role="RO", assigned_region="Bengaluru HQ Region", assigned_division=None),
        
        # Division User (Division)
        User(employee_id="DIV_MYS", password=get_password_hash("password123"), role="Division", assigned_region=None, assigned_division="Mysuru"),
        
        # Marketing Executive User (ME)
        User(employee_id="ME_MYS_01", password=get_password_hash("password123"), role="ME", assigned_region=None, assigned_division="Mysuru"),
        
        # Backward compatibility aliases for UI demo buttons
        User(employee_id="co_user", password=get_password_hash("password123"), role="CO", assigned_region=None, assigned_division=None),
        User(employee_id="ro_user", password=get_password_hash("password123"), role="RO", assigned_region="Bengaluru HQ Region", assigned_division=None),
        User(employee_id="div_user", password=get_password_hash("password123"), role="Division", assigned_region=None, assigned_division="Mysuru"),
        User(employee_id="me_user", password=get_password_hash("password123"), role="ME", assigned_region=None, assigned_division="Mysuru"),
    ]
    
    for u in users_data:
        existing_user = db.query(User).filter(User.employee_id == u.employee_id).first()
        if existing_user:
            existing_user.password = u.password
            existing_user.role = u.role
            existing_user.assigned_region = u.assigned_region
            existing_user.assigned_division = u.assigned_division
        else:
            db.add(u)
            
    db.commit()
    print("[User Auth] Seeded/updated 4-tier test accounts successfully: CO_ADMIN, RO_BG, DIV_MYS, ME_MYS_01.")
    db.close()

if __name__ == "__main__":
    seed_users()
