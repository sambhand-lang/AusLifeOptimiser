import sqlite3
import pandas as pd
import glob
import os

ROOT = os.path.dirname(os.path.dirname(__file__))
DB = os.path.join(ROOT, 'suburbs.db')
BACKUPS_DIR = os.path.join(ROOT, 'backups')
PROPOSED_TOP1 = os.path.join(ROOT, 'proposed_ssc_top1.csv')
OUT_CSV = os.path.join(ROOT, 'applied_matches_review.csv')

# find latest preapply_top1 backup
pattern = os.path.join(BACKUPS_DIR, 'suburbs_preapply_top1_*.db')
backups = glob.glob(pattern)
if not backups:
    print('No backup found matching pattern:', pattern)
    raise SystemExit(2)
backup_file = sorted(backups)[-1]

# load proposals if available
if os.path.exists(PROPOSED_TOP1):
    df_proposed = pd.read_csv(PROPOSED_TOP1)
    df_proposed.set_index('rowid', inplace=True)
else:
    df_proposed = None

# load backup
conn_b = sqlite3.connect(backup_file)
cur_b = conn_b.cursor()
cur_b.execute("SELECT rowid, suburb_name, state, postcode, COALESCE(ssc,'') as ssc FROM suburbs")
backup_rows = {r[0]: r for r in cur_b.fetchall()}
conn_b.close()

# load current
conn = sqlite3.connect(DB)
cur = conn.cursor()
cur.execute("SELECT rowid, suburb_name, state, postcode, COALESCE(ssc,'') as ssc FROM suburbs")
current_rows = {r[0]: r for r in cur.fetchall()}
conn.close()

applied = []
for rowid, curr in current_rows.items():
    prev = backup_rows.get(rowid)
    if not prev:
        continue
    prev_ssc = prev[4] if len(prev) > 4 else ''
    curr_ssc = curr[4] if len(curr) > 4 else ''
    if (not prev_ssc or str(prev_ssc).strip()=='' ) and (curr_ssc and str(curr_ssc).strip()!=''):
        candidate_ssc = ''
        score = ''
        if df_proposed is not None and rowid in df_proposed.index:
            candidate_ssc = df_proposed.loc[rowid, 'candidate_ssc'] if 'candidate_ssc' in df_proposed.columns else ''
            score = df_proposed.loc[rowid, 'score'] if 'score' in df_proposed.columns else ''
        applied.append({
            'rowid': rowid,
            'suburb_name': curr[1],
            'state': curr[2],
            'postcode': curr[3],
            'previous_ssc': prev_ssc,
            'new_ssc': curr_ssc,
            'candidate_ssc': candidate_ssc,
            'score': score
        })

if not applied:
    print('No applied matches found between backup and current DB')
else:
    df_out = pd.DataFrame(applied)
    df_out.sort_values(['state','suburb_name','rowid'], inplace=True)
    df_out.to_csv(OUT_CSV, index=False)
    print(f'Wrote {len(df_out)} applied matches to {OUT_CSV}')
