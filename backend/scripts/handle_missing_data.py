"""
Handle Missing Data - Simplified Approach
Purpose: Populate postcode display and create demographic cache for dropdown
"""

import sqlite3
import os
from pathlib import Path

ROOT = Path(__file__).parent.parent
DB_PATH = ROOT / 'suburbs.db'

def fix_postcode_display():
    """Copy postcodes from suburb_postcodes to suburbs table for display"""
    print("\n" + "="*80)
    print("POSTCODE DISPLAY FIX")
    print("="*80 + "\n")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check current state
    cursor.execute("""
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN postcode IS NOT NULL AND postcode != '' THEN 1 END) as with_postcode,
            COUNT(CASE WHEN postcode IS NULL OR postcode = '' THEN 1 END) as missing_postcode
        FROM suburbs WHERE ssc IS NOT NULL
    """)
    stats = cursor.fetchone()
    
    total, with_pc, missing_pc = stats
    print(f"Suburbs with SSC: {total}")
    print(f"  ✓ With postcode: {with_pc} ({with_pc/total*100:.1f}%)")
    print(f"  ⚠ Missing postcode: {missing_pc} ({missing_pc/total*100:.1f}%)")
    
    # These are duplicate/variant records with same SSC - they should inherit the primary postcode
    if missing_pc > 0:
        print(f"\n📍 Populating missing postcodes from suburb_postcodes...")
        
        # Get the primary postcode for each SSC and assign to all suburbs with that SSC
        cursor.execute("""
            UPDATE suburbs
            SET postcode = (
                SELECT SUBSTR(sp.postcodes, 1, INSTR(sp.postcodes || ',', ',') - 1)
                FROM suburb_postcodes sp
                WHERE sp.ssc = suburbs.ssc
                LIMIT 1
            )
            WHERE ssc IS NOT NULL AND (postcode IS NULL OR postcode = '')
        """)
        
        updated = cursor.rowcount
        conn.commit()
        print(f"  ✓ Updated {updated} rows")
        
        # Final verification
        cursor.execute("""
            SELECT COUNT(*) FROM suburbs 
            WHERE ssc IS NOT NULL AND (postcode IS NULL OR postcode = '')
        """)
        remaining = cursor.fetchone()[0]
        print(f"\n  ✓ Final check: {remaining} suburbs still missing postcodes")
    else:
        print("\n  ✓ All suburbs with SSC already have postcodes!")
    
    conn.close()

def create_suburb_demographics_cache():
    """Create demographic cache table for faster dropdown queries"""
    print("\n" + "="*80)
    print("DEMOGRAPHIC CACHE SETUP")
    print("="*80 + "\n")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create demographics cache table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS suburb_demographics_cache (
            ssc VARCHAR(5) PRIMARY KEY,
            suburb_name VARCHAR(255),
            state VARCHAR(3),
            postcode VARCHAR(10),
            all_postcodes TEXT,
            population INTEGER DEFAULT 10000,
            median_age REAL DEFAULT 38,
            household_size REAL DEFAULT 2.6,
            median_income INTEGER DEFAULT 75000,
            employment_rate REAL DEFAULT 0.65,
            source VARCHAR(50) DEFAULT 'IMPUTED',
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    
    print("✓ Created suburb_demographics_cache table")
    
    # Populate from suburbs and suburb_postcodes
    cursor.execute("""
        INSERT OR IGNORE INTO suburb_demographics_cache
        (ssc, suburb_name, state, postcode, all_postcodes)
        SELECT 
            s.ssc,
            s.suburb_name,
            s.state,
            s.postcode,
            sp.postcodes
        FROM suburbs s
        LEFT JOIN suburb_postcodes sp ON s.ssc = sp.ssc
        WHERE s.ssc IS NOT NULL
    """)
    
    inserted = cursor.rowcount
    conn.commit()
    print(f"✓ Populated {inserted} records")
    
    # Verify
    cursor.execute("SELECT COUNT(*), COUNT(DISTINCT ssc) FROM suburb_demographics_cache")
    rows, sscs = cursor.fetchone()
    print(f"\n📊 Cache Statistics:")
    print(f"  - Total records: {rows}")
    print(f"  - Unique SSCs: {sscs}")
    
    # Show sample
    print(f"\n📋 Sample Cached Records:")
    cursor.execute("SELECT ssc, suburb_name, state, postcode, all_postcodes FROM suburb_demographics_cache LIMIT 5")
    for ssc, name, state, pc, all_pcs in cursor.fetchall():
        print(f"  - {name}, {state} {pc} | SSC: {ssc} | All: {all_pcs}")
    
    conn.close()

def verify_final_state():
    """Verify all data is ready for production"""
    print("\n" + "="*80)
    print("FINAL DATA VERIFICATION")
    print("="*80 + "\n")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Overall coverage
    cursor.execute("""
        SELECT 
            COUNT(*) as total_suburbs,
            COUNT(DISTINCT ssc) as total_ssc,
            COUNT(CASE WHEN postcode IS NOT NULL AND postcode != '' THEN 1 END) as with_postcode,
            COUNT(CASE WHEN ssc IS NOT NULL THEN 1 END) as with_ssc
        FROM suburbs
    """)
    
    total, unique_ssc, with_pc, with_ssc = cursor.fetchone()
    
    print("✅ Database Health Check:")
    print(f"  - Total suburb records: {total}")
    print(f"  - SSC assignments: {with_ssc}/{total} (100%)" if with_ssc == total else f"  - SSC assignments: {with_ssc}/{total}")
    print(f"  - Unique SSCs: {unique_ssc}")
    print(f"  - With postcodes: {with_pc}/{total} ({with_pc/total*100:.1f}%)")
    
    # Dropdown readiness
    cursor.execute("""
        SELECT 
            COUNT(DISTINCT CASE WHEN s.postcode IS NOT NULL AND s.postcode != '' THEN s.ssc END) as ready_for_dropdown,
            COUNT(DISTINCT sp.ssc) as in_postcode_table,
            COUNT(DISTINCT sdc.ssc) as in_demographics_cache
        FROM suburbs s
        LEFT JOIN suburb_postcodes sp ON s.ssc = sp.ssc
        LEFT JOIN suburb_demographics_cache sdc ON s.ssc = sdc.ssc
        WHERE s.ssc IS NOT NULL
    """)
    
    dropdown_ready, postcode_mapped, demo_cached = cursor.fetchone()
    
    print(f"\n✅ Dropdown Readiness:")
    print(f"  - SSCs ready for display: {dropdown_ready}")
    print(f"  - In postcode mapping: {postcode_mapped}")
    print(f"  - In demographics cache: {demo_cached}")
    
    if dropdown_ready == unique_ssc:
        print("\n✅ PRODUCTION READY: All suburbs can be displayed in dropdowns with postcodes!")
    
    conn.close()

if __name__ == '__main__':
    fix_postcode_display()
    create_suburb_demographics_cache()
    verify_final_state()
    
    print("\n" + "="*80)
    print("✅ DATA PREPARATION COMPLETE")
    print("="*80)
    print("\n📌 API Endpoints Available:")
    print("   - GET /api/dropdowns/suburbs - Get all suburbs")
    print("   - GET /api/dropdowns/suburbs?state=NSW - Filter by state")
    print("   - GET /api/dropdowns/search?q=Sydney - Search typeahead")
    print("   - GET /api/dropdowns/suburbs/{ssc} - Get single suburb")
    print("   - GET /api/v2/suburbs/{ssc}/details - Get full suburb data")
    print()
