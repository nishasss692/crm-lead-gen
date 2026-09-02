import sqlite3
import hashlib

def hash_pwd(p: str) -> str:
    return hashlib.sha256(p.encode('utf-8')).hexdigest()

def seed():
    conn = sqlite3.connect('crm.db')
    cursor = conn.cursor()
    
    # Check if users table exists, create if not
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id VARCHAR UNIQUE,
        password VARCHAR,
        role VARCHAR,
        assigned_region VARCHAR,
        assigned_division VARCHAR
    )
    ''')
    
    # Insert official test users
    users = [
        ('CO_ADMIN', hash_pwd('password123'), 'CO', None, None),
        ('RO_BG', hash_pwd('password123'), 'RO', 'Bengaluru HQ Region', None),
        ('RO_SK', hash_pwd('password123'), 'RO', 'South Karnataka Region', None),
        ('RO_NK', hash_pwd('password123'), 'RO', 'North Karnataka Region', None),
        ('DIV_MYS', hash_pwd('password123'), 'DO', None, 'Mysuru'),
        ('DIV_BGE', hash_pwd('password123'), 'DO', None, 'BG East'),
        ('ME_MYS_01', hash_pwd('password123'), 'ME', None, 'Mysuru'),
        ('ME001', hash_pwd('password123'), 'ME', 'Bengaluru HQ Region', 'BG East'),
        ('DIV001', hash_pwd('password123'), 'DO', 'Bengaluru HQ Region', 'BG East'),
        ('RO001', hash_pwd('password123'), 'RO', 'Bengaluru HQ Region', None),
        ('CO001', hash_pwd('password123'), 'CO', None, None)
    ]
    
    for u in users:
        cursor.execute('''
        INSERT OR REPLACE INTO users (employee_id, password, role, assigned_region, assigned_division)
        VALUES (?, ?, ?, ?, ?)
        ''', u)
    
    conn.commit()
    conn.close()
    print("Database seeded with test users successfully.")

if __name__ == "__main__":
    seed()
