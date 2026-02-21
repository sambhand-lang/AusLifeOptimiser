"""
Quality Spot-Check: Sample Applied Matches
Randomly verify applied SSC assignments to ensure confidence in automation
"""

import pandas as pd
import sqlite3
import random
import os
from pathlib import Path

ROOT = Path(__file__).parent.parent
DB_PATH = ROOT / 'suburbs.db'
APPLIED_CSV = ROOT / 'applied_matches_review.csv'

def spot_check_applied_matches(sample_size=30):
    """
    Randomly sample applied matches and verify their SSC assignments
    """
    if not APPLIED_CSV.exists():
        print("Error: applied_matches_review.csv not found")
        return
    
    # Load applied matches
    df = pd.read_csv(APPLIED_CSV)
    print(f"\n{'='*80}")
    print(f"QUALITY SPOT-CHECK: Applied SSC Matches")
    print(f"{'='*80}")
    print(f"Total applied rows: {len(df)}")
    print(f"Sampling: {min(sample_size, len(df))} random records\n")
    
    # Group by state for better coverage
    states = df['state'].unique()
    per_state = max(1, sample_size // len(states))
    
    samples = []
    for state in states:
        state_rows = df[df['state'] == state]
        if len(state_rows) > 0:
            state_sample = state_rows.sample(n=min(per_state, len(state_rows)), random_state=42)
            samples.append(state_sample)
    
    sample_df = pd.concat(samples, ignore_index=True)
    
    # Connect to DB and verify each sample
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    verified_count = 0
    anomalies = []
    
    for idx, row in sample_df.iterrows():
        rowid = int(row['rowid'])
        applied_ssc = row['new_ssc']
        suburb_name = row['suburb_name']
        state = row['state']
        
        # Verify the SSC was actually applied to the DB
        cursor.execute(
            "SELECT ssc FROM suburbs WHERE rowid = ?",
            (rowid,)
        )
        db_row = cursor.fetchone()
        
        if db_row and db_row[0] == str(applied_ssc):
            verified_count += 1
        else:
            anomalies.append({
                'rowid': rowid,
                'suburb': suburb_name,
                'state': state,
                'expected_ssc': applied_ssc,
                'actual_ssc': db_row[0] if db_row else None,
                'reason': 'Mismatch between applied CSV and DB'
            })
    
    conn.close()
    
    # Print results
    print(f"✓ Verified: {verified_count}/{len(sample_df)} samples")
    print(f"Match rate: {verified_count/len(sample_df)*100:.1f}%\n")
    
    if anomalies:
        print(f"⚠ {len(anomalies)} anomalies detected:")
        for anom in anomalies:
            print(f"  - Row {anom['rowid']}: {anom['suburb']} ({anom['state']})")
            print(f"    Expected: {anom['expected_ssc']}, Got: {anom['actual_ssc']}")
    else:
        print("✅ No anomalies detected - applied matches are consistent with DB\n")
    
    # Group statistics
    print(f"\n📊 Sample Breakdown by State:")
    for state in sorted(sample_df['state'].unique()):
        count = len(sample_df[sample_df['state'] == state])
        print(f"  {state}: {count} samples")
    
    # Score distribution in applied set
    print(f"\n📊 Applied Match Score Distribution:")
    if 'score' in df.columns:
        print(f"  Mean: {df['score'].mean():.1f}")
        print(f"  Min: {df['score'].min():.1f}")
        print(f"  Max: {df['score'].max():.1f}")
        print(f"  75th percentile: {df['score'].quantile(0.75):.1f}")
        print(f"  95th percentile: {df['score'].quantile(0.95):.1f}")
    
    print(f"\n{'='*80}\n")

if __name__ == '__main__':
    spot_check_applied_matches(30)
