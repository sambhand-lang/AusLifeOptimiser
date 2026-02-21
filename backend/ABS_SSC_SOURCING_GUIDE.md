# Sourcing abs_census_by_ssc.json from ABS

**Objective:** Obtain 2021 Census data at SSC (Statistical Small Area) level  
**Format Required:** JSON with SSC codes as keys  
**Data Year:** 2021  
**Last Updated:** February 21, 2026

---

## Option 1: ABS TableBuilder (Recommended)

### Access

**Website:** https://www.abs.gov.au/census/find-census-data/datapacks

**Free Tool:** ABS Census TableBuilder
- No registration required for basic access
- Real-time data extraction
- Filter by geography

### Steps

1. **Go to ABS Census Data Download**
   ```
   https://www.abs.gov.au/census/find-census-data/datapacks
   ```

2. **Select Dataset**
   - Census Year: 2021
   - Geography Type: Statistical Small Areas (SSC)
   - Dataset: "Census 2021 - All persons data by SSC"

3. **Select Variables** (Required fields)
   - Total Population
   - Median Age
   - Median Household Income
   - Employment Status (Full-time/Part-time/Employed %)
   - Average Household Size

4. **Download as CSV**
   - Format: CSV (Comma-separated)
   - Include headers: YES
   - All states/territories: YES

5. **Expected Columns**
   ```
   SSC_CODE_2021, SSC_NAME_2021, STATE_CODE_2021, STATE_NAME_2021,
   TOTAL_PERSONS, MEDIAN_AGE, MEDIAN_HOUSEHOLD_INCOME_WEEKLY,
   EMPLOYMENT_STATUS_EMPLOYED, AVERAGE_PERSONS_PER_HOUSEHOLD
   ```

### Manual Conversion

If TableBuilder provides weekly income, convert to annual:

```
Annual Income = Weekly Income × 52
```

Example:
```
1298 per week × 52 = 67496 annual
```

---

## Option 2: Download DataPack

### Access

**Website:** https://www.abs.gov.au/census/find-census-data/datapacks

**Steps**

1. Select "Census 2021 DataPacks" (regional or national)
2. Download ZIP file containing CSVs
3. Extract and locate: Census_2021_A01_B01_SSC_Unrestricted_XLS

### Challenge

DataPacks include ALL variables (100+). Need to filter:

```bash
# Extract specific columns from DataPack CSV
awk -F',' '{print $1,$2,$3,$4,$5}' census_datapack_ssc.csv > filtered_data.csv
```

---

## Option 3: Direct SQL/Database Query (Advanced)

**If you have direct ABS database access:**

```sql
SELECT 
  ssc_code,
  G01_COUNT_PERSONS AS population,
  (SELECT PERCENT FROM demographics WHERE measure='median_age') AS median_age,
  (SELECT AMOUNT FROM income WHERE measure='median_weekly') * 52 AS median_income,
  (SELECT PERCENT FROM employment WHERE status='employed') AS employment_rate,
  AVG_HOUSEHOLD_SIZE AS household_size
FROM ssc_demographics_2021
WHERE state_code IN ('NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT')
ORDER BY ssc_code;
```

---

## Expected File Format

### Input CSV: `census_2021_ssc_export.csv`

```csv
SSC_CODE_2021,Population,Median_Age,Median_Income,Employment_Rate,Household_Size
13610,37890,35,67500,72.1,2.4
13804,28450,37,72000,68.3,2.8
10570,15150,35,85000,71.5,2.2
10635,202044,34,78000,72.8,2.4
10654,12530,35,102000,73,2.58
...
```

### Output JSON: `data/abs_census_by_ssc.json`

```json
{
  "metadata": {
    "version": "1.0",
    "source": "Australian Bureau of Statistics",
    "dataset": "Census 2021 - SSC Level Data",
    "downloadDate": "2026-02-21T10:30:00.000Z",
    "totalRecords": 18519
  },
  "data": {
    "13610": {
      "population": 37890,
      "medianAge": 35,
      "medianIncome": 67500,
      "employmentRate": 0.721,
      "householdSize": 2.4,
      "datasetYear": 2021
    },
    "13804": {
      "population": 28450,
      "medianAge": 37,
      "medianIncome": 72000,
      "employmentRate": 0.683,
      "householdSize": 2.8,
      "datasetYear": 2021
    }
  }
}
```

---

## Parsing Script Usage

Once you have the CSV file:

### Step 1: Save CSV

```bash
# Save downloaded CSV as:
census_2021_ssc_export.csv  (in backend/ directory)
```

### Step 2: Run Parser

```bash
cd c:\Sameer\Projects\AusFinanceTools\backend
node parse_abs_ssc_data.js
```

### Step 3: Verify Output

```bash
# Check file was created
ls -la data/abs_census_by_ssc.json

# Verify record count
jq '.metadata.totalRecords' data/abs_census_by_ssc.json
```

---

## Critical Rules (No Exceptions)

✅ **MUST:**
- Keys are SSC codes (5 digits: e.g., "13610")
- No pipe delimiters (|)
- No state suffixes (_NSW)
- Employment rate stored as decimal (0.721 not 72.1)
- Income in AUD (annual, not weekly)
- All numeric values valid

❌ **MUST NOT:**
- Manual edits to final JSON
- Duplicate SSC codes
- NULL or missing values (use parser defaults)
- Abbreviations (use full SSC codes)
- Mix data years (2021 only)

---

## Data Validation Checklist

After parsing, verify:

```bash
# 1. Check JSON is valid
node -e "console.log(JSON.parse(require('fs').readFileSync('./data/abs_census_by_ssc.json', 'utf-8')))"

# 2. Count records
jq '.data | length' data/abs_census_by_ssc.json
# Should return: ~18,519 (all Australian SSCs)

# 3. Verify employment rate range
jq '.data | to_entries | map(select(.value.employmentRate < 0 or .value.employmentRate > 1)) | length' data/abs_census_by_ssc.json
# Should return: 0 (all rates between 0.0 and 1.0)

# 4. Check for missing fields
jq '.data | to_entries | map(select(.value.population == null or .value.medianAge == null)) | length' data/abs_census_by_ssc.json
# Should return: 0 (all fields present)

# 5. Sample record
jq '.data["13610"]' data/abs_census_by_ssc.json
```

---

## Timeline & Expectations

| Stage | Timeframe | Action |
|-------|-----------|--------|
| Download | 5-10 min | Get CSV from ABS |
| Parse | 1 min | Run `parse_abs_ssc_data.js` |
| Validate | 5 min | Run checks above |
| Integrate | 2 hours | Run `derive_demographics_by_hierarchy.js` |
| **Total** | **~3 hours** | Complete population |

---

## Expected Results After Integration

Once `abs_census_by_ssc.json` is populated:

```
Derivation Step Distribution:
  STEP 1 (Direct SSC Match):  18,519 suburbs (100%) ✅ TRUE CENSUS DATA
  STEP 2 (SA2 Inherited):     0 suburbs
  STEP 3 (SA3 Inherited):     0 suburbs
  STEP 4 (State Average):     0 suburbs
```

**Impact:**
- Move from 99.1% state averages → **100% ABS Census 2021 data**
- All metrics sourced from official ABS Census
- Maximum geographic precision (SSC level)
- Fully defensible data lineage

---

## Troubleshooting

### Issue: "Input file not found"

**Solution:**
```bash
# Verify file exists in correct location
ls -la census_2021_ssc_export.csv

# Should be in: c:\Sameer\Projects\AusFinanceTools\backend\
```

### Issue: "Missing required fields"

**Solution:**
Check CSV header matches:
```
SSC_CODE_2021, Population, Median_Age, Median_Income, Employment_Rate, Household_Size
```

**Case-sensitive!** Must match exactly.

### Issue: "Invalid numeric values"

**Solution:**
Check CSV doesn't have:
- Commas in numbers: Use 1234, not 1,234
- Text values: Use 72.1, not "72.1%"
- Empty cells: Must have values

### Issue: Parser skips records

**Solution:**
```bash
# See which lines had issues:
# - Look for: "⚠️ Line N: ..." messages
# - Check source CSV for those rows
# - Fix CSV and re-run parser
```

---

## Contact ABS for Help

**If data unavailable:**
- Email: client.services@abs.gov.au
- Phone: 1300 135 070
- Website: https://www.abs.gov.au/about/contact-us

---

## References

- [ABS Census 2021 Data Download](https://www.abs.gov.au/census/find-census-data/datapacks)
- [ABS ASGS 2021 Geography](https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs)
- [ABS TableBuilder Help](https://www.abs.gov.au/websitedbs/databashe.nsf/home/tablebuilder)

---

**Next Steps:**
1. Download CSV from ABS ✓ (You complete)
2. Save as `census_2021_ssc_export.csv` ✓ (You complete)
3. Run: `node parse_abs_ssc_data.js` ✓ (Automated)
4. Verify output: `data/abs_census_by_ssc.json` ✓ (Automated)
5. Run: `node derive_demographics_by_hierarchy.js` ✓ (Ready to run)

**Result:** 100% of 18,519 suburbs with authentic ABS Census 2021 demographics! 🎯

