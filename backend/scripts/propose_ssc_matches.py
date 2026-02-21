import sqlite3
import json
import pandas as pd
from fuzzywuzzy import fuzz, process

# Load canonical list
with open('data/canonical_suburbs_with_ssc.json', 'r', encoding='utf-8') as f:
    raw = json.load(f)
if isinstance(raw, dict) and 'canonicalSuburbs' in raw:
    canonical_list = raw['canonicalSuburbs']
elif isinstance(raw, list):
    canonical_list = raw
else:
    canonical_list = []

canonical_lookup = {}
for sub in canonical_list:
    ssc = sub.get('ssc') or sub.get('SSC')
    suburb_name = (sub.get('suburb') or sub.get('suburb_name') or '').upper().strip()
    state = (sub.get('state') or '').upper().strip()
    if ssc and suburb_name and state:
        canonical_lookup[f"{suburb_name}|{state}"] = ssc

canonical_keys = list(canonical_lookup.keys())

# Connect DB
conn = sqlite3.connect('suburbs.db')
cur = conn.cursor()

# Fetch rows still missing SSC
cur.execute("SELECT rowid, suburb_name, state, postcode FROM suburbs WHERE ssc IS NULL OR TRIM(ssc)=''")
rows = cur.fetchall()

proposals = []
for rowid, suburb_name, state, postcode in rows:
    norm_key = (str(suburb_name or '').upper().strip() + '|' + str(state or '').upper().strip())
    # exact
    if norm_key in canonical_lookup:
        proposals.append((rowid, suburb_name, state, postcode, canonical_lookup[norm_key], 100, norm_key, canonical_lookup[norm_key]))
        continue
    # get top 3
    match_list = process.extract(norm_key, canonical_keys, scorer=fuzz.token_sort_ratio, limit=3)
    for match_key, score in match_list:
        proposals.append((rowid, suburb_name, state, postcode, canonical_lookup.get(match_key), score, norm_key, match_key))

# Save proposals to CSV with one row per candidate
df = pd.DataFrame(proposals, columns=['rowid','suburb_name','state','postcode','candidate_ssc','score','norm_key','matched_canonical_key'])
df.to_csv('proposed_ssc_matches.csv', index=False)
print(f"Proposals written: {len(df)} rows (up to 3 candidates per record)")

# Summary: count unique rowids
print('Unique records proposed:', df['rowid'].nunique())
# Top sample
print(df.sort_values(['rowid','score'], ascending=[True, False]).head(20).to_string(index=False))

conn.close()
