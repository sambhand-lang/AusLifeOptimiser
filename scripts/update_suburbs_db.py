import csv
import sqlite3
from datetime import datetime

CSV_PATH = r"2021 Census GCP Suburbs and Localities for AUS/Suburb_rows.csv"
DB_PATH = r"backend/suburbs.db"

def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    with open(CSV_PATH, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            # Insert/update suburb_demographics
            cur.execute('''INSERT OR REPLACE INTO suburb_demographics
                (ssc, suburb_name, state, population, median_age, household_size, median_income, last_updated)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                row['SAL_CODE_2021'],
                row['Suburb_Name'],
                row['State'],
                int(row['Population']) if row['Population'] else None,
                float(row['Median_Age']) if row['Median_Age'] else None,
                float(row['HH_Size']) if row['HH_Size'] else None,
                int(row['Median_Income_Weekly']) if row['Median_Income_Weekly'] else None,
                datetime.now().isoformat()
            ))
            # Insert/update suburb_postcodes
            cur.execute('''INSERT OR REPLACE INTO suburb_postcodes
                (ssc, suburb_name, state, postcodes)
                VALUES (?, ?, ?, ?)
            ''', (
                row['SAL_CODE_2021'],
                row['Suburb_Name'],
                row['State'],
                row['Postcode']
            ))
            # Insert/update suburbs
            cur.execute('''INSERT OR REPLACE INTO suburbs
                (ssc, suburb_name, postcode, state)
                VALUES (?, ?, ?, ?)
            ''', (
                row['SAL_CODE_2021'],
                row['Suburb_Name'],
                row['Postcode'],
                row['State']
            ))
    conn.commit()
    conn.close()

if __name__ == "__main__":
    main()
