import sqlite3
import os

db_path = 'middleware/middleware_config.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    # Asegurar que host siempre tenga el protocolo
    cursor.execute("UPDATE backend_services SET host = 'http://127.0.0.1' WHERE host = '127.0.0.1'")
    conn.commit()
    print(f"Updated {cursor.rowcount} hosts to include http://")
    conn.close()
else:
    print("Database not found")
