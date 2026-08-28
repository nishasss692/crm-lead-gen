import sqlite3

def seed():
    conn = sqlite3.connect('crm.db')
    cursor = conn.cursor()
    
    # Check if users table exists, create if not (will be created by SQLAlchemy normally, but just in case)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id VARCHAR,
        password VARCHAR,
        role VARCHAR,
        assigned_region VARCHAR,
        assigned_division VARCHAR
    )
    ''')
    
    # Insert test users
    users = [
        ('ME001', 'password123', 'ME', 'BG HQ Region', 'BG East'),
        ('DIV001', 'password123', 'Division', 'BG HQ Region', 'BG East'),
        ('RO001', 'password123', 'RO', 'BG HQ Region', None),
        ('CO001', 'password123', 'CO', None, None)
    ]
    
    # clear existing to avoid duplicates in testing
    cursor.execute("DELETE FROM users")
    
    cursor.executemany('''
    INSERT INTO users (employee_id, password, role, assigned_region, assigned_division)
    VALUES (?, ?, ?, ?, ?)
    ''', users)
    
    conn.commit()
    conn.close()
    print("Database seeded with test users.")

if __name__ == "__main__":
    seed()
