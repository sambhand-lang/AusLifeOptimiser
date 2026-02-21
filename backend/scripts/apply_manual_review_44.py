import pandas as pd
import sqlite3
import os
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(__file__))
MANUAL_REVIEW_CSV = os.path.join(ROOT, "manual_review_threshold_75.csv")
DB_PATH = os.path.join(ROOT, "suburbs.db")
BACKUP_DIR = os.path.join(ROOT, "backups")

os.makedirs(BACKUP_DIR, exist_ok=True)

# Backup
timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup_path = os.path.join(BACKUP_DIR, f"suburbs_pre_apply_manual_review_44_{timestamp}.db")
import shutil
shutil.copy(DB_PATH, backup_path)
print(f"✓ Backup: {backup_path}")

# Load manual review CSV
df = pd.read_csv(MANUAL_REVIEW_CSV)
print(f"Applying {len(df)} rows with top candidates (score 70-74)")

# Apply all
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
print(f"✓ Applied {applied} SSCs")

# Verify
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()
cursor.execute("SELECT COUNT(*) FROM suburbs WHERE ssc IS NULL OR ssc = ''")
remaining = cursor.fetchone()[0]
conn.close()
print(f"✓ Remaining without SSC: {remaining}")
print("✅ Complete!")
