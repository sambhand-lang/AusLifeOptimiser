import sqlite3
import pandas as pd
import os

ROOT = os.path.dirname(os.path.dirname(__file__))
DB = os.path.join(ROOT, 'suburbs.db')
PROPOSED = os.path.join(ROOT, 'proposed_ssc_matches.csv')
OUT = os.path.join(ROOT, 'manual_review_remaining.csv')

if not os.path.exists(PROPOSED):
    print('error: proposed_ssc_matches.csv not found')
    raise SystemExit(2)

# load proposed (multiple rows per rowid: candidate rows)
df = pd.read_csv(PROPOSED)
# Ensure columns exist
for col in ['rowid','suburb_name','state','postcode','candidate_ssc','score','matched_canonical_key']:
    if col not in df.columns:
        # some variants might name candidate differently; fallback
        pass

# sort candidates per rowid by score desc
df['score'] = pd.to_numeric(df['score'], errors='coerce').fillna(0)
df_sorted = df.sort_values(['rowid','score'], ascending=[True, False])

# take top 3 per rowid and pivot
top3 = df_sorted.groupby('rowid').head(3)
# assign rank
top3['rank'] = top3.groupby('rowid')['score'].rank(method='first', ascending=False).astype(int)

pivot = top3.pivot(index='rowid', columns='rank', values=['candidate_ssc','score','matched_canonical_key'])
# flatten columns
pivot.columns = [f"{v}{k}" for v,k in pivot.columns]

# load current DB and filter remaining ssc null
conn = sqlite3.connect(DB)
cur = conn.cursor()
cur.execute("SELECT rowid, suburb_name, state, postcode, COALESCE(ssc,'') as ssc FROM suburbs")
rows = cur.fetchall()
df_sub = pd.DataFrame(rows, columns=['rowid','suburb_name','state','postcode','ssc'])
conn.close()

remaining = df_sub[(df_sub['ssc'].isnull()) | (df_sub['ssc'].astype(str).str.strip()=='')]
print('Remaining unmatched count:', len(remaining))

# join with pivot suggestions
remaining = remaining.set_index('rowid')
merged = remaining.join(pivot, how='left')
# fillna
merged = merged.reset_index()
merged.to_csv(OUT, index=False)
print('Wrote manual review CSV:', OUT)
