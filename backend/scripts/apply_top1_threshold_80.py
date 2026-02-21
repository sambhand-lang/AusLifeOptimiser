import os
import shutil
import sqlite3
import pandas as pd
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(__file__))
DB = os.path.join(ROOT, 'suburbs.db')
CSV = os.path.join(ROOT, 'proposed_ssc_top1.csv')
BACKUPS = os.path.join(ROOT, 'backups')
THRESHOLD = 80

if not os.path.exists(CSV):
    print('error: proposed_ssc_top1.csv not found')
    raise SystemExit(2)

# Backup
os.makedirs(BACKUPS, exist_ok=True)
ts = datetime.utcnow().strftime('%Y%m%d-%H%M%S')
dest = os.path.join(BACKUPS, f'suburbs_preapply_top1_{ts}.db')
shutil.copy2(DB, dest)
print('backup:', dest)

# Load proposals
df = pd.read_csv(CSV)
if 'score' not in df.columns:
    print('error: score column not found in CSV')
    raise SystemExit(3)

df['score'] = pd.to_numeric(df['score'], errors='coerce').fillna(0)
apply_df = df[df['score'] >= THRESHOLD].copy()
print(f'Applying {len(apply_df)} matches with score >= {THRESHOLD}')

if len(apply_df) > 0:
    print('Sample to apply:')
    print(apply_df.head(20).to_string(index=False))

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
        print('update_err', rowid, e)

conn.commit()
cur.execute("SELECT COUNT(*) FROM suburbs WHERE ssc IS NULL OR TRIM(ssc)=''")
remaining = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM suburbs")
total = cur.fetchone()[0]
conn.close()

print('updated rows:', updated)
print('total rows:', total)
print('remaining without ssc:', remaining)
print('done')
