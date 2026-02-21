import sqlite3
import pandas as pd
import os
import shutil
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(__file__))
DB = os.path.join(ROOT, 'suburbs.db')
CSV = os.path.join(ROOT, 'proposed_ssc_top1.csv')
BACKUPS = os.path.join(ROOT, 'backups')
THRESHOLD = 80
POSTCODE_TABLE = 'suburb_postcodes'
OUT_CSV = os.path.join(ROOT, 'suburb_postcodes_normalized.csv')

# Backup DB
os.makedirs(BACKUPS, exist_ok=True)
ts = datetime.utcnow().strftime('%Y%m%d-%H%M%S')
dest = os.path.join(BACKUPS, f'suburbs_preapply_rebuild_{ts}.db')
shutil.copy2(DB, dest)
print('backup:', dest)

# Load proposals
if not os.path.exists(CSV):
    print('error: proposed_ssc_top1.csv not found')
    raise SystemExit(2)

df = pd.read_csv(CSV)
if 'score' not in df.columns:
    df['score'] = 0

df_to_apply = df[df['score'] >= THRESHOLD]
print(f'Rows to apply SSC from CSV (score >= {THRESHOLD}):', len(df_to_apply))

# Apply SSCs by rowid
conn = sqlite3.connect(DB)
cur = conn.cursor()
applied = 0
for _, row in df_to_apply.iterrows():
    try:
        cur.execute('UPDATE suburbs SET ssc = ? WHERE rowid = ? AND (ssc IS NULL OR TRIM(ssc) = "")', (str(row['candidate_ssc']), int(row['rowid'])))
        if cur.rowcount:
            applied += cur.rowcount
    except Exception as e:
        print('update_err', row['rowid'], e)

conn.commit()
print('SSC updates applied (new):', applied)

# Rebuild suburb_postcodes table
cur.execute(f"DROP TABLE IF EXISTS {POSTCODE_TABLE}")
conn.commit()
cur.execute(f"""
CREATE TABLE {POSTCODE_TABLE} (
    ssc TEXT PRIMARY KEY,
    suburb_name TEXT,
    state TEXT,
    postcodes TEXT
)
""")
conn.commit()

# Aggregate by SSC (one row per ssc). Merge postcodes and pick a representative suburb_name/state.
cur.execute("""
SELECT ssc,
       GROUP_CONCAT(DISTINCT postcode) AS postcodes,
       MAX(suburb_name) AS suburb_name,
       MAX(state) AS state
FROM suburbs
WHERE ssc IS NOT NULL AND TRIM(ssc)<>''
GROUP BY ssc
""")
rows = [(r[0], r[2], r[3], r[1]) for r in cur.fetchall()]  # reorder to (ssc, suburb_name, state, postcodes)

# Insert or replace to avoid primary-key conflicts
cur.executemany(f"INSERT OR REPLACE INTO {POSTCODE_TABLE} (ssc, suburb_name, state, postcodes) VALUES (?, ?, ?, ?)", rows)
conn.commit()

# Export CSV
import csv
with open(OUT_CSV, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['ssc','suburb_name','state','postcodes'])
    for r in rows:
        writer.writerow(r)

print(f'Created {POSTCODE_TABLE} with {len(rows)} rows; exported to {OUT_CSV}')

# Final counts
cur.execute("SELECT COUNT(*) FROM suburbs WHERE ssc IS NULL OR TRIM(ssc)=''")
remaining = cur.fetchone()[0]
cur.execute(f"SELECT COUNT(*) FROM {POSTCODE_TABLE}")
postcount = cur.fetchone()[0]
conn.close()
print('remaining without ssc:', remaining)
print('postcodes rows:', postcount)
