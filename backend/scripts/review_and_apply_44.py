import pandas as pd
import sqlite3
import os

ROOT = os.path.dirname(os.path.dirname(__file__))
MANUAL_REVIEW_CSV = os.path.join(ROOT, "manual_review_threshold_75.csv")
DB_PATH = os.path.join(ROOT, "suburbs.db")

# Load manual review CSV
df = pd.read_csv(MANUAL_REVIEW_CSV)
print(f"\n{'='*80}")
print(f"Manual Review: {len(df)} rows requiring decision")
print(f"{'='*80}\n")

# Group by suburb_name to show unique suburbs
df_unique = df.drop_duplicates(subset=['suburb_name', 'state', 'postcode'])
print(f"Unique suburbs: {len(df_unique)}")
print(f"\nSample (first 5 unique suburbs):\n")

for idx, (i, row) in enumerate(df_unique.head(5).iterrows()):
    print(f"{idx+1}. {row['suburb_name']}, {row['state']} {row['postcode']}")
    print(f"   Top candidate: {row['candidate_ssc1']} (matched: {row['matched_canonical_key1']}) - score {row['score1']}")
    print(f"   Alt:  {row['candidate_ssc2']} (matched: {row['matched_canonical_key2']}) - score {row['score2']}")
    print()

# Propose acceptance of all top candidates
print(f"\n{'='*80}")
print(f"RECOMMENDATION: Accept all {len(df)} rows with top candidates")
print(f"Rationale: These are mostly cross-state duplicates (VIC suburbs in NSW rows)")
print(f"Scores are marginal (70-74) but represent best available matches")
print(f"{'='*80}\n")

# Option to apply
response = input("Apply top candidates to all 44 rows? (yes/no): ").strip().lower()

if response == 'yes':
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    applied = 0
    for _, row in df.iterrows():
        rowid = int(row['rowid'])
        candidate_ssc = row['candidate_ssc1']
        
        if pd.isna(candidate_ssc) or candidate_ssc == '':
            continue
        
        cursor.execute("""
            UPDATE suburbs
            SET ssc = ?
            WHERE rowid = ?
        """, (str(candidate_ssc).strip(), rowid))
        applied += 1
    
    conn.commit()
    conn.close()
    print(f"\n✓ Applied {applied} SSCs")
    
    # Verify
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM suburbs WHERE ssc IS NULL OR ssc = ''")
    remaining = cursor.fetchone()[0]
    conn.close()
    print(f"✓ Remaining without SSC: {remaining}")
    print("✅ Complete!")
else:
    print("Skipped application.")
