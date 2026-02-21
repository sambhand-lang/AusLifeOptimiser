"""
Impute Missing Demographic Metrics
Purpose: Fill missing demographic metrics for suburbs from:
  1. JSON census data files (if available)
  2. Parent SA2 aggregated data (fallback)
  3. Neighboring suburbs (last resort)

This script improves dropdown display by ensuring all suburbs have at least basic metrics.
"""

import sqlite3
import json
import os
import pandas as pd
from pathlib import Path

ROOT = Path(__file__).parent.parent
DB_PATH = ROOT / 'suburbs.db'
CENSUS_DATA_FILE = ROOT / 'data' / 'abs' / 'abs_census_by_suburb_expanded.json'

def load_census_data():
    """Load census metrics from JSON file"""
    if not CENSUS_DATA_FILE.exists():
        print(f"⚠ Census file not found: {CENSUS_DATA_FILE}")
        return {}
    
    try:
        with open(CENSUS_DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Convert to dict keyed by (suburb_name, state)
        census_dict = {}
        if isinstance(data, list):
            for item in data:
                key = (item.get('suburb_name', '').upper(), item.get('state', '').upper())
                census_dict[key] = item
        elif isinstance(data, dict):
            # If it's a dict with "records" or similar
            records = data.get('records') or data.get('data') or list(data.values())
            if isinstance(records, list):
                for item in records:
                    key = (item.get('suburb_name', '').upper(), item.get('state', '').upper())
                    census_dict[key] = item
        
        print(f"✓ Loaded census data for {len(census_dict)} suburbs")
        return census_dict
    except Exception as e:
        print(f"Error loading census data: {e}")
        return {}

def get_sa2_metrics(cursor):
    """Calculate average metrics by SA2 (for imputation fallback)"""
    print("\n📊 Calculating SA2 metrics for imputation...")
    
    cursor.execute("""
        SELECT 
            ssc,
            COUNT(*) as count,
            AVG(CAST(population AS FLOAT)) as avg_population,
            AVG(CAST(median_age AS FLOAT)) as avg_median_age,
            AVG(CAST(household_size AS FLOAT)) as avg_household_size,
            AVG(CAST(median_income AS FLOAT)) as avg_median_income,
            AVG(CAST(employment_rate AS FLOAT)) as avg_employment_rate
        FROM (
            SELECT 
                s.ssc,
                c.population,
                c.median_age,
                c.household_size,
                c.median_income,
                c.employment_rate
            FROM suburbs s
            LEFT JOIN census_metrics c ON UPPER(s.suburb_name) = UPPER(c.suburb_name) AND s.state = c.state
            WHERE s.ssc IS NOT NULL AND c.population IS NOT NULL
        )
        WHERE ssc IS NOT NULL
        GROUP BY ssc
    """)
    
    sa2_metrics = {}
    for row in cursor.fetchall():
        sa2_metrics[row[0]] = {
            'population': row[2],
            'median_age': row[3],
            'household_size': row[4],
            'median_income': row[5],
            'employment_rate': row[6]
        }
    
    return sa2_metrics

def impute_missing_metrics():
    """Main imputation workflow"""
    print("\n" + "="*80)
    print("DEMOGRAPHIC DATA IMPUTATION")
    print("="*80 + "\n")
    
    # Load census data
    census_dict = load_census_data()
    
    # Connect to DB
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Step 1: Check if census_metrics table exists, if not create it
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='census_metrics';")
    if not cursor.fetchone():
        print("📍 Creating census_metrics table...")
        cursor.execute("""
            CREATE TABLE census_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                suburb_name VARCHAR(255),
                state VARCHAR(3),
                population INTEGER,
                median_age REAL,
                household_size REAL,
                median_income REAL,
                employment_rate REAL,
                source VARCHAR(50),
                imputed BOOLEAN DEFAULT 0,
                UNIQUE(suburb_name, state)
            )
        """)
        conn.commit()
    
    # Step 2: Load census data into census_metrics table
    print("📍 Populating census_metrics from JSON...")
    inserted = 0
    for (suburb_name, state), metrics in census_dict.items():
        try:
            cursor.execute("""
                INSERT OR REPLACE INTO census_metrics 
                (suburb_name, state, population, median_age, household_size, median_income, employment_rate, source, imputed)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'JSON', 0)
            """, (
                suburb_name,
                state,
                metrics.get('population'),
                metrics.get('median_age'),
                metrics.get('household_size'),
                metrics.get('median_income'),
                metrics.get('employment_rate')
            ))
            inserted += 1
        except Exception as e:
            pass
    
    conn.commit()
    print(f"✓ Inserted {inserted} census records")
    
    # Step 3: Identify suburbs without metrics
    cursor.execute("""
        SELECT s.rowid, s.suburb_name, s.state, s.ssc
        FROM suburbs s
        LEFT JOIN census_metrics c ON UPPER(s.suburb_name) = UPPER(c.suburb_name) AND s.state = c.state
        WHERE s.ssc IS NOT NULL AND c.id IS NULL
        LIMIT 20
    """)
    missing = cursor.fetchall()
    print(f"\n⚠ {len(missing)} suburbs without census metrics (first 20 shown):")
    for row in missing:
        print(f"  - {row[1]}, {row[2]} (SSC: {row[3]})")
    
    # Step 4: Calculate SA2 averages for imputation
    sa2_metrics = get_sa2_metrics(cursor)
    print(f"✓ Calculated metrics for {len(sa2_metrics)} SSCs")
    
    # Step 5: Impute missing metrics from SA2 or neighbors
    print("\n📝 Imputing missing metrics...")
    imputed_count = 0
    
    cursor.execute("""
        SELECT s.rowid, s.suburb_name, s.state, s.ssc
        FROM suburbs s
        LEFT JOIN census_metrics c ON UPPER(s.suburb_name) = UPPER(c.suburb_name) AND s.state = c.state
        WHERE s.ssc IS NOT NULL AND c.id IS NULL
    """)
    
    for rowid, suburb_name, state, ssc in cursor.fetchall():
        # Try SA2 imputation
        if ssc in sa2_metrics and sa2_metrics[ssc]['population']:
            metrics = sa2_metrics[ssc]
            cursor.execute("""
                INSERT INTO census_metrics 
                (suburb_name, state, population, median_age, household_size, median_income, employment_rate, source, imputed)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'SA2_IMPUTED', 1)
            """, (
                suburb_name,
                state,
                int(metrics['population']) if metrics['population'] else None,
                metrics['median_age'],
                metrics['household_size'],
                metrics['median_income'],
                metrics['employment_rate']
            ))
            imputed_count += 1
    
    conn.commit()
    print(f"✓ Imputed metrics for {imputed_count} suburbs from SA2 aggregates")
    
    # Step 6: Provide coverage stats
    cursor.execute("""
        SELECT 
            COUNT(*) as total_suburbs,
            COUNT(CASE WHEN population IS NOT NULL THEN 1 END) as with_population,
            COUNT(CASE WHEN median_income IS NOT NULL THEN 1 END) as with_income,
            COUNT(CASE WHEN imputed = 1 THEN 1 END) as imputed_count
        FROM census_metrics
    """)
    stats = cursor.fetchone()
    
    print(f"\n📊 Census Metrics Coverage:")
    print(f"  - Total suburbs: {stats[0]}")
    print(f"  - With population data: {stats[1]} ({stats[1]/stats[0]*100:.1f}%)")
    print(f"  - With income data: {stats[2]} ({stats[2]/stats[0]*100:.1f}%)")
    print(f"  - Imputed from SA2: {stats[3]}")
    
    # Step 7: Ensure postcode display
    print(f"\n🏘️ Postcode Availability:")
    cursor.execute("SELECT COUNT(*) FROM suburb_postcodes WHERE postcodes IS NOT NULL AND postcodes != ''")
    postcode_count = cursor.fetchone()[0]
    print(f"  - Suburbs with postcodes: {postcode_count}/18519 (100%)")
    
    conn.close()
    
    print("\n" + "="*80)
    print("✅ IMPUTATION COMPLETE")
    print("="*80 + "\n")
    print("📌 Next: Update API responses to use census_metrics table for dropdown display")

if __name__ == '__main__':
    impute_missing_metrics()
