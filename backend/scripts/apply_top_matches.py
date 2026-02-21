import shutil
import sqlite3
import pandas as pd
import os
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(__file__))
DB = os.path.join(ROOT, 'suburbs.db')
BACKUPS = os.path.join(ROOT, 'backups')
CSV = os.path.join(ROOT, 'proposed_ssc_top1.csv')
THRESHOLD = 85

# Backup DB
os.makedirs(BACKUPS, exist_ok=True)
ts = datetime.utcnow().strftime('%Y%m%d-%H%M%S')
dest = os.path.join(BACKUPS, f'suburbs_preapply_{ts}.db')
shutil.copy2(DB, dest)
print(f'backup: {dest}')

# Load proposals
if not os.path.exists(CSV):
    print('error: proposed_ssc_top1.csv not found')
    raise SystemExit(2)

df = pd.read_csv(CSV)
df['score'] = pd.to_numeric(df['score'], errors='coerce').fillna(0)
apply_df = df[df['score'] >= THRESHOLD]
print(f'Applying {len(apply_df)} matches with score >= {THRESHOLD}')

# Apply updates
conn = sqlite3.connect(DB)
cur = conn.cursor()
updated = 0
for _, r in apply_df.iterrows():
    rowid = int(r['rowid'])
    ssc = str(r['candidate_ssc'])
    try:
        cur.execute('UPDATE suburbs SET ssc = ? WHERE rowid = ? AND (ssc IS NULL OR TRIM(ssc) = "")', (ssc, rowid))
        if cur.rowcount:
            updated += cur.rowcount
    except Exception as e:
        print('err updating', rowid, e)

conn.commit()
# Post-check
cur.execute("SELECT COUNT(*) FROM suburbs WHERE ssc IS NULL OR TRIM(ssc)=''")
remaining = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM suburbs")
total = cur.fetchone()[0]
conn.close()
print(f'updated rows: {updated}')
print(f'total rows: {total}, remaining without ssc: {remaining}')
print('Done')
