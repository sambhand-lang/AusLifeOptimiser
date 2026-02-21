import sqlite3
import pandas as pd
import os
import shutil
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(__file__))
DB = os.path.join(ROOT, 'suburbs.db')
CSV = os.path.join(ROOT, 'proposed_ssc_matches.csv')
BACKUPS = os.path.join(ROOT, 'backups')
THRESHOLD = 85

if not os.path.exists(CSV):
    print('error: proposed_ssc_matches.csv not found')
    raise SystemExit(2)

# Backup
os.makedirs(BACKUPS, exist_ok=True)
ts = datetime.utcnow().strftime('%Y%m%d-%H%M%S')
dest = os.path.join(BACKUPS, f'suburbs_preapply_top3_{ts}.db')
shutil.copy2(DB, dest)
print('backup:', dest)

# Load proposals
# expected columns include: rowid, suburb_name, state, postcode, candidate_ssc?, score?, matched_canonical_key
# Our propose script used columns: rowid, suburb_name, state, postcode, candidate_ssc, score, norm_key, matched_canonical_key
# There may be up to 3 rows per rowid (one per candidate). We'll group and find first candidate with score >= threshold.
df = pd.read_csv(CSV)
# ensure numeric
if 'score' not in df.columns:
    df['score'] = pd.to_numeric(df['score'], errors='coerce').fillna(0)
else:
    df['score'] = pd.to_numeric(df['score'], errors='coerce').fillna(0)

applies = []
for rowid, group in df.groupby('rowid'):
    # sort by score desc
    g = group.sort_values('score', ascending=False)
    high = g[g['score'] >= THRESHOLD]
    if not high.empty:
        # pick top candidate
        top = high.iloc[0]
        candidate_ssc = top['candidate_ssc'] if 'candidate_ssc' in top else top.get('candidate_ssc')
        applies.append((int(rowid), str(candidate_ssc), float(top['score'])))

print('Candidates to apply:', len(applies))

# Apply updates
conn = sqlite3.connect(DB)
cur = conn.cursor()
updated = 0
for rowid, ssc, score in applies:
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
