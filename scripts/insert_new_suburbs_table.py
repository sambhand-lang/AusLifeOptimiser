import csv
import sqlite3

CSV_PATH = r"2021 Census GCP Suburbs and Localities for AUS/Suburb_rows.csv"
DB_PATH = r"backend/suburbs.db"

def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    with open(CSV_PATH, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            cur.execute('''INSERT OR REPLACE INTO suburbs (
                SAL_ID, Suburb_Name, SAL_CODE_2021, Population, Median_Age, Median_Rent_Weekly, Median_Income_Weekly, HH_Size, Postcode, Median_House_Price, One_Year_Growth_Pct, School_Count, Commute_Time_Mins, Parks_Count, Rental_Yield_Pct, State
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''', (
                row['SAL_ID'],
                row['Suburb_Name'],
                row['SAL_CODE_2021'],
                int(row['Population']) if row['Population'] else None,
                float(row['Median_Age']) if row['Median_Age'] else None,
                int(row['Median_Rent_Weekly']) if row['Median_Rent_Weekly'] else None,
                int(row['Median_Income_Weekly']) if row['Median_Income_Weekly'] else None,
                float(row['HH_Size']) if row['HH_Size'] else None,
                row['Postcode'],
                int(row['Median_House_Price']) if row['Median_House_Price'] else None,
                float(row['One_Year_Growth_Pct']) if row['One_Year_Growth_Pct'] else None,
                int(row['School_Count']) if row['School_Count'] else None,
                int(row['Commute_Time_Mins']) if row['Commute_Time_Mins'] else None,
                int(row['Parks_Count']) if row['Parks_Count'] else None,
                float(row['Rental_Yield_Pct']) if row['Rental_Yield_Pct'] else None,
                row['State']
            ))
    conn.commit()
    conn.close()

if __name__ == "__main__":
    main()
