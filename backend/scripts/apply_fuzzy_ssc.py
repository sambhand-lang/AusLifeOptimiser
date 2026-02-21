import sqlite3
import json
import pandas as pd
from fuzzywuzzy import fuzz, process

# -----------------------------
# Step 1: Load canonical SSC suburbs
# -----------------------------
with open('data/canonical_suburbs_with_ssc.json', 'r', encoding='utf-8') as f:
    canonical_raw = json.load(f)

# canonical_raw may be an object with key `canonicalSuburbs` or it may be an array
if isinstance(canonical_raw, dict) and 'canonicalSuburbs' in canonical_raw:
    canonical_list = canonical_raw['canonicalSuburbs']
elif isinstance(canonical_raw, list):
    canonical_list = canonical_raw
else:
    canonical_list = []

# Build lookup: "SUBURB|STATE" -> SSC (normalize keys)
canonical_lookup = {}
for sub in canonical_list:
    ssc = sub.get('ssc') or sub.get('SSC')
    suburb_name = (sub.get('suburb') or sub.get('suburb_name') or '').upper().strip()
    state = (sub.get('state') or '').upper().strip()
    if ssc and suburb_name and state:
        key = f"{suburb_name}|{state}"
        # prefer first occurrence
        if key not in canonical_lookup:
            canonical_lookup[key] = ssc

# For fuzzy choices we want the keys list
canonical_keys = list(canonical_lookup.keys())

# -----------------------------
# Step 2: Connect to SQLite
# -----------------------------
conn = sqlite3.connect('suburbs.db')
cursor = conn.cursor()

# -----------------------------
# Step 3: Fetch all suburbs
# -----------------------------
cursor.execute("SELECT rowid, suburb_name, state, postcode, ssc FROM suburbs")
all_suburbs = cursor.fetchall()

df_suburbs = pd.DataFrame(all_suburbs, columns=['rowid', 'suburb_name', 'state', 'postcode', 'ssc'])

# Normalize fields
df_suburbs['norm_key'] = (df_suburbs['suburb_name'].fillna('').str.upper().str.strip() + '|' + df_suburbs['state'].fillna('').str.upper().str.strip())

# -----------------------------
# Step 4: Fuzzy match missing SSC
# -----------------------------
from functools import lru_cache

@lru_cache(maxsize=32768)
def best_match(key, threshold=85):
    if key in canonical_lookup:
        return canonical_lookup[key], 100
    match = process.extractOne(key, canonical_keys, scorer=fuzz.token_sort_ratio)
    if not match:
        return None, 0
    matched_key, score = match
    if score >= threshold:
        return canonical_lookup[matched_key], score
    return None, score

# Apply only to rows without SSC
mask_missing = df_suburbs['ssc'].isnull() | (df_suburbs['ssc'].astype(str).str.strip() == '')
missing_df = df_suburbs[mask_missing].copy()

results = missing_df['norm_key'].apply(lambda k: best_match(k, threshold=85))
missing_df[['ssc_match', 'confidence']] = pd.DataFrame(results.tolist(), index=missing_df.index)

# Assign high-confidence SSC
high_conf = missing_df[missing_df['confidence'] >= 85]
print(f"High-confidence matches to apply: {len(high_conf)}")
for idx, r in high_conf.iterrows():
    try:
        cursor.execute("UPDATE suburbs SET ssc = ? WHERE rowid = ?", (r['ssc_match'], int(r['rowid'])))
    except Exception as e:
        print('update_err', r['rowid'], str(e))

conn.commit()

# Export low-confidence for manual review
low_conf = missing_df[missing_df['confidence'] < 85].copy()
low_conf.to_csv('unmatched_suburbs_manual_review.csv', index=False)
print(f"Low-confidence rows exported: {len(low_conf)} -> unmatched_suburbs_manual_review.csv")

# -----------------------------
# Step 5: Build suburb_postcodes normalization table
# -----------------------------
cursor.execute('''
CREATE TABLE IF NOT EXISTS suburb_postcodes (
    ssc TEXT,
    suburb_name TEXT,
    state TEXT,
    postcodes TEXT,
    PRIMARY KEY (ssc)
)
''')

# Aggregate postcodes per SSC
cursor.execute("SELECT ssc, suburb_name, state, GROUP_CONCAT(DISTINCT postcode) FROM suburbs WHERE ssc IS NOT NULL GROUP BY ssc, suburb_name, state")
rows = cursor.fetchall()
for ssc, suburb_name, state, postcodes in rows:
    if postcodes is None:
        postcodes_json = '[]'
    else:
        pcs = [p for p in postcodes.split(',') if p and p.strip()]
        postcodes_json = json.dumps(sorted(set(pcs)))
    cursor.execute("INSERT OR REPLACE INTO suburb_postcodes (ssc, suburb_name, state, postcodes) VALUES (?, ?, ?, ?)", (ssc, suburb_name, state, postcodes_json))

conn.commit()

# -----------------------------
# Step 6: Verification
# -----------------------------
cursor.execute("SELECT COUNT(*) FROM suburb_postcodes")
print(f"Total canonical suburbs in suburb_postcodes table: {cursor.fetchone()[0]}")

cursor.execute("SELECT COUNT(*) FROM suburbs WHERE ssc IS NULL OR TRIM(ssc)=''")
print(f"Suburbs still missing SSC: {cursor.fetchone()[0]}")

conn.close()
print('Normalization complete ✅')
