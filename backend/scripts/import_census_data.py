
import sqlite3
import csv
from pathlib import Path

# Paths
ROOT = Path(__file__).parent.parent
DB_PATH = ROOT / 'suburbs.db'
CENSUS_CSV = Path(r'C:\Sameer\Projects\AusFinanceTools\2021 Census GCP Suburbs and Localities for AUS\Final\2021_Census_Suburb_Data.csv')

# Census table schema
CENSUS_FIELDS = ['ssc', 'suburb_name', 'state', 'population', 'median_age', 'household_size', 'median_income', 'census_year']

# Map CSV columns to schema
CSV_FIELD_MAP = {
    'SAL_CODE_2021': 'ssc',
    'SAL_NAME': 'suburb_name',
    'STATE_NAME': 'state',
    'Total_Population': 'population',
    'Median_Age': 'median_age',
    'Household_Size': 'household_size',
    'Median_Income': 'median_income',
    'Census_Year': 'census_year'
}

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

insert_sql = f"INSERT OR IGNORE INTO census ({', '.join(CENSUS_FIELDS)}) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
row_count = 0
null_ssc_count = 0

with open(CENSUS_CSV, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        sal_code = row.get('SAL_CODE_2021')
        if sal_code and sal_code.startswith('SAL'):
            ssc = str(int(sal_code[3:]))  # Remove 'SAL' and convert to int, then back to str
        else:
            ssc = None
        suburb_name = row.get('SAL_NAME')
        state = row.get('STATE_NAME')
        population = int(row.get('Total_Population')) if row.get('Total_Population') else None
        median_age = int(row.get('Median_Age')) if row.get('Median_Age') else None
        household_size = float(row.get('Household_Size')) if row.get('Household_Size') else None
        median_income = int(row.get('Median_Income')) if row.get('Median_Income') else None
        census_year = int(row.get('Census_Year')) if row.get('Census_Year') else 2021
        if not ssc:
            null_ssc_count += 1
            continue
        cursor.execute(insert_sql, (ssc, suburb_name, state, population, median_age, household_size, median_income, census_year))
        row_count += 1

conn.commit()
print(f"Imported {row_count} census records.")
if null_ssc_count:
    print(f"Warning: {null_ssc_count} records had null SSC codes and were skipped.")

# Verify row count
cursor.execute("SELECT COUNT(*) FROM census")
total_rows = cursor.fetchone()[0]
print(f"Total rows in census table: {total_rows}")

# Validate no null SSC codes
cursor.execute("SELECT COUNT(*) FROM census WHERE ssc IS NULL OR ssc = ''")
null_ssc_rows = cursor.fetchone()[0]
print(f"Rows with null SSC codes: {null_ssc_rows}")

conn.close()
