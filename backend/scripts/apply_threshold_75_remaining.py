import pandas as pd
import sqlite3
import os
from datetime import datetime

# -----------------------
# Config
# -----------------------
ROOT = os.path.dirname(os.path.dirname(__file__))
UNMATCHED_CSV = os.path.join(ROOT, "manual_review_remaining.csv")
DB_PATH = os.path.join(ROOT, "suburbs.db")
AUTO_APPLY_THRESHOLD = 75
MANUAL_REVIEW_CSV = os.path.join(ROOT, "manual_review_threshold_75.csv")
BACKUP_DIR = os.path.join(ROOT, "backups")

# Create backup directory if needed
os.makedirs(BACKUP_DIR, exist_ok=True)

# -----------------------
# Step 1: Backup DB
# -----------------------
timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup_path = os.path.join(BACKUP_DIR, f"suburbs_pré_apply_75_{timestamp}.db")
import shutil
shutil.copy(DB_PATH, backup_path)
print(f"✓ Backup created: {backup_path}")

# -----------------------
# Step 2: Load CSV
# -----------------------
if not os.path.exists(UNMATCHED_CSV):
    print(f"error: {UNMATCHED_CSV} not found")
    raise SystemExit(1)

df = pd.read_csv(UNMATCHED_CSV)
print(f"Total unmatched rows: {len(df)}")

# -----------------------
# Step 3: Identify top candidate score column
# -----------------------
# Expected columns: rowid, suburb_name, state, postcode, ssc, candidate_ssc1, score1, matched_canonical_key1, ...
# Filter by score1 >= threshold
if 'score1' not in df.columns:
    print("error: score1 column not found. Available columns:", df.columns.tolist())
    raise SystemExit(1)

df['score1'] = pd.to_numeric(df['score1'], errors='coerce').fillna(0)
df['auto_apply'] = df['score1'] >= AUTO_APPLY_THRESHOLD

auto_apply_df = df[df['auto_apply']]
manual_review_df = df[~df['auto_apply']]

print(f"Rows eligible for auto-apply (score >= {AUTO_APPLY_THRESHOLD}): {len(auto_apply_df)}")
print(f"Rows needing manual review: {len(manual_review_df)}")

# -----------------------
# Step 4: Export manual review CSV
# -----------------------
manual_review_df.to_csv(MANUAL_REVIEW_CSV, index=False)
print(f"✓ Manual review CSV exported: {MANUAL_REVIEW_CSV}")

# -----------------------
# Step 5: Apply auto SSCs to SQLite
# -----------------------
if len(auto_apply_df) > 0:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    for idx, row in auto_apply_df.iterrows():
        rowid = int(row['rowid'])
        candidate_ssc = row['candidate_ssc1']
        
        if pd.isna(candidate_ssc) or candidate_ssc == '':
            continue
        
        cursor.execute("""
            UPDATE suburbs
            SET ssc = ?
            WHERE rowid = ?
        """, (str(candidate_ssc).strip(), rowid))
    
    conn.commit()
    conn.close()
    print(f"✓ Auto-applied SSCs to {len(auto_apply_df)} rows in {DB_PATH}")

# -----------------------
# Step 6: Verify remaining
# -----------------------
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()
cursor.execute("SELECT COUNT(*) FROM suburbs WHERE ssc IS NULL OR ssc = ''")
remaining = cursor.fetchone()[0]
conn.close()
print(f"Remaining rows without SSC: {remaining}")

print("✅ Processing complete.")
