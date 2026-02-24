import sqlite3
import csv
from pathlib import Path

ROOT = Path(__file__).parent.parent
DB_PATH = ROOT / 'suburbs.db'
OUTPUT_CSV = ROOT / 'backend' / 'missing_sscs_report.csv'
if not OUTPUT_CSV.parent.exists():
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Find SSCs in suburbs table but not in census table
cursor.execute('''
    SELECT s.ssc, s.suburb_name, s.state
    FROM suburbs s
    WHERE s.ssc IS NOT NULL
      AND s.ssc NOT IN (SELECT ssc FROM census)
''')
missing = cursor.fetchall()

with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['ssc', 'suburb_name', 'state'])
    for row in missing:
        writer.writerow(row)

print(f"Exported {len(missing)} missing SSCs to {OUTPUT_CSV}")
conn.close()
