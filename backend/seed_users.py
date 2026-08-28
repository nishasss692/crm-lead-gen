import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import User, Base, engine
from passlib.context import CryptContext

# Setup password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_users():
    db = SessionLocal()
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    users_data = [
        # Central Office (sees everything)
        User(username="co_user", password_hash=get_password_hash("password123"), role="CO"),
        
        # Regional Office (sees only North region)
        User(username="ro_user", password_hash=get_password_hash("password123"), role="RO", region="North"),
        
        # Division (sees only Mumbai division)
        User(username="div_user", password_hash=get_password_hash("password123"), role="Division", division="Mumbai"),
        
        # Marketing Executive (sees only Mumbai division in North region)
        User(username="me_user", password_hash=get_password_hash("password123"), role="ME", region="North", division="Mumbai"),
    ]
    
    for u in users_data:
        existing_user = db.query(User).filter(User.username == u.username).first()
        if existing_user:
            # Update password and details if user already exists
            existing_user.password_hash = u.password_hash
            existing_user.role = u.role
            existing_user.region = u.region
            existing_user.division = u.division
        else:
            db.add(u)
            
    db.commit()
    print("Test users seeded/updated successfully.")
    
    db.close()

if __name__ == "__main__":
    seed_users()
