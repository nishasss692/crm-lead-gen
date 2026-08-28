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
    
    # Check if users already exist
    if db.query(User).first():
        print("Users already exist in the database.")
        db.close()
        return

    users = [
        # Central Office (sees everything)
        User(username="co_user", password_hash=get_password_hash("password123"), role="CO"),
        
        # Regional Office (sees only North region)
        User(username="ro_user", password_hash=get_password_hash("password123"), role="RO", region="North"),
        
        # Division (sees only Mumbai division)
        User(username="div_user", password_hash=get_password_hash("password123"), role="Division", division="Mumbai"),
        
        # Marketing Executive (sees only Mumbai division in North region)
        User(username="me_user", password_hash=get_password_hash("password123"), role="ME", region="North", division="Mumbai"),
    ]
    
    db.add_all(users)
    db.commit()
    print("Test users seeded successfully.")
    
    db.close()

if __name__ == "__main__":
    seed_users()
