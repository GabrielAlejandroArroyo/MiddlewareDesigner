import sqlite3
import os

db_path = 'middleware/middleware_config.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("UPDATE backend_services SET openapi_url = replace(openapi_url, 'localhost', '127.0.0.1'), host = '127.0.0.1'")
    conn.commit()
    print(f"Updated {cursor.rowcount} services to 127.0.0.1")
    conn.close()
else:
    print("Database not found")
