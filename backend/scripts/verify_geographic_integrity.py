"""
Geographic Integrity Verification
Validates SSC mappings to SA2, postcodes, and coordinates
"""

import sqlite3
import json
import os
from pathlib import Path

ROOT = Path(__file__).parent.parent
DB_PATH = ROOT / 'suburbs.db'
SA2_BOUNDARIES = ROOT / 'data' / 'abs' / 'abs_sa2_boundaries.json'

def load_sa2_data():
    """Load SA2 boundary data"""
    if not SA2_BOUNDARIES.exists():
        print("⚠ SA2 boundaries file not found")
        return set()
    
    try:
        with open(SA2_BOUNDARIES) as f:
            data = json.load(f)
        # Extract SSC keys from features (assuming GeoJSON format)
        ssc_set = set()
        if 'features' in data:
            for feature in data['features']:
                if 'properties' in feature and 'SSC_CODE' in feature['properties']:
                    ssc_set.add(str(feature['properties']['SSC_CODE']))
        return ssc_set
    except Exception as e:
        print(f"Error loading SA2 data: {e}")
        return set()

def check_geography_integrity():
    """Run comprehensive geographic integrity checks"""
    print("\n" + "="*80)
    print("GEOGRAPHIC INTEGRITY VERIFICATION")
    print("="*80 + "\n")
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # 1. Check SSC population in suburbs table
    cursor.execute("SELECT COUNT(DISTINCT ssc) as count FROM suburbs WHERE ssc IS NOT NULL")
    ssc_count = cursor.fetchone()['count']
    print(f"✓ Total distinct SSCs in suburbs table: {ssc_count}")

    # QA Rule: Throw error if census missing and suburb exists in SSC list
    cursor.execute("SELECT ssc, suburb_name, state FROM suburbs WHERE ssc IS NOT NULL")
    all_sscs = {row['ssc']: (row['suburb_name'], row['state']) for row in cursor.fetchall()}

    cursor.execute("SELECT ssc FROM census WHERE ssc IS NOT NULL")
    census_sscs = {row['ssc'] for row in cursor.fetchall()}

    missing_census = set(all_sscs.keys()) - census_sscs
    if missing_census:
        print(f"\n❌ ERROR: {len(missing_census)} SSCs exist in suburbs table but are missing from census data:")
        for ssc in list(missing_census)[:10]:
            suburb, state = all_sscs[ssc]
            print(f"  - {ssc}: {suburb} ({state})")
        raise Exception("QA rule failed: Census data missing for suburb(s) present in SSC list.")
    
    # 2. Check postcodes coverage
    cursor.execute("""
        SELECT COUNT(DISTINCT ssc) as count FROM suburb_postcodes 
        WHERE postcodes IS NOT NULL AND postcodes != ''
    """)
    ssc_postcode_count = cursor.fetchone()['count']
    print(f"✓ SSCs with postcodes in suburb_postcodes: {ssc_postcode_count}")
    
    # 3. Find SSCs without any postcode
    cursor.execute("""
        SELECT DISTINCT s.ssc, s.suburb_name, s.state 
        FROM suburbs s 
        WHERE s.ssc IS NOT NULL 
        AND s.ssc NOT IN (SELECT DISTINCT ssc FROM suburb_postcodes WHERE postcodes IS NOT NULL AND postcodes != '')
    """)
    orphan_postcodes = cursor.fetchall()
    if orphan_postcodes:
        print(f"\n⚠ {len(orphan_postcodes)} SSCs without postcodes:")
        for row in orphan_postcodes[:10]:
            print(f"  - {row['ssc']}: {row['suburb_name']} ({row['state']})")
    else:
        print(f"✓ All SSCs have postcodes mapped")
    
    # 4. Check SA2 alignment
    sa2_set = load_sa2_data()
    if sa2_set:
        cursor.execute("SELECT DISTINCT ssc FROM suburbs WHERE ssc IS NOT NULL")
        ssc_in_db = {row[0] for row in cursor.fetchall()}
        
        # SSCs in DB but not in SA2
        missing_sa2 = ssc_in_db - sa2_set
        if missing_sa2:
            print(f"\n⚠ {len(missing_sa2)} SSCs not found in SA2 boundaries:")
            for ssc in sorted(missing_sa2)[:10]:
                cursor.execute("SELECT suburb_name, state FROM suburbs WHERE ssc = ? LIMIT 1", (ssc,))
                sub = cursor.fetchone()
                if sub:
                    print(f"  - {ssc}: {sub['suburb_name']} ({sub['state']})")
        else:
            print(f"✓ All SSCs align with SA2 boundaries")
        
        # SA2s not in DB
        extra_sa2 = sa2_set - ssc_in_db
        if extra_sa2:
            print(f"⚠ {len(extra_sa2)} SA2 codes in boundaries but not in DB (may be expected)")
    
    # 5. Check for NULL or empty postcodes
    cursor.execute("""
        SELECT COUNT(*) as count FROM suburbs 
        WHERE ssc IS NOT NULL AND (postcode IS NULL OR postcode = '')
    """)
    null_postcode = cursor.fetchone()['count']
    if null_postcode > 0:
        print(f"\n⚠ {null_postcode} rows with SSC but no postcode")
    else:
        print(f"✓ All SSCs have postcodes in suburbs table")
    
    # 6. Check for duplicate SSCs (should be 1 canonical per SSC)
    cursor.execute("""
        SELECT ssc, COUNT(*) as count FROM suburbs 
        WHERE ssc IS NOT NULL 
        GROUP BY ssc 
        HAVING count > 1
        LIMIT 20
    """)
    duplicates = cursor.fetchall()
    if duplicates:
        print(f"\n📋 {len(duplicates)} SSCs have multiple canonical records (duplicates/variants):")
        for row in duplicates[:5]:
            print(f"  - {row['ssc']}: {row['count']} records")
    
    # 7. Verify suburb_postcodes integrity
    cursor.execute("""
        SELECT COUNT(*) as total, 
               COUNT(DISTINCT ssc) as distinct_ssc,
               COUNT(DISTINCT postcodes) as distinct_postcodes
        FROM suburb_postcodes
    """)
    postcode_stats = cursor.fetchone()
    print(f"\n📊 suburb_postcodes table:")
    print(f"  - Total rows: {postcode_stats['total']}")
    print(f"  - Distinct SSCs: {postcode_stats['distinct_ssc']}")
    print(f"  - Distinct postcodes: {postcode_stats['distinct_postcodes']}")
    
    # 8. Check coverage: all suburbs should have at least one postcode
    cursor.execute("""
        SELECT COUNT(DISTINCT ssc) FROM suburbs 
        WHERE ssc IS NOT NULL
    """)
    total_ssc = cursor.fetchone()[0]
    
    coverage = (ssc_postcode_count / total_ssc * 100) if total_ssc > 0 else 0
    print(f"\n✓ Postcode coverage: {coverage:.1f}% ({ssc_postcode_count}/{total_ssc})")
    
    # 9. Total suburbs row count
    cursor.execute("SELECT COUNT(*) FROM suburbs")
    total_rows = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM suburbs WHERE ssc IS NOT NULL")
    ssc_rows = cursor.fetchone()[0]
    ssc_coverage = (ssc_rows / total_rows * 100) if total_rows > 0 else 0
    print(f"✓ SSC assignment coverage: {ssc_coverage:.1f}% ({ssc_rows}/{total_rows} rows)")
    
    conn.close()
    
    print("\n" + "="*80)
    print("VERIFICATION COMPLETE")
    print("="*80 + "\n")

if __name__ == '__main__':
    check_geography_integrity()
