# ABS Census 2021 SSC Data Acquisition

**Status:** 🟢 Ready to Download  
**Target Date:** February 21, 2026  
**Objective:** Populate 18,519 Australian suburbs with authentic 2021 Census demographics

---

## Quick Start (Two Options)

### Option A: Test with Sample Data (5 minutes)

Perfect for verifying the workflow before downloading 18,519 records from ABS:

```powershell
cd c:\Sameer\Projects\AusFinanceTools\backend

# Run validation tests
node test_parser_with_sample.js

# Copy sample to real filename for testing
Copy-Item census_2021_ssc_export_SAMPLE.csv census_2021_ssc_export.csv

# Run the parser
node parse_abs_ssc_data.js

# Check output was created
type data\abs_census_by_ssc.json | head -20
```

**Expected Result:** 
- Sample CSV parsed ✓
- `data/abs_census_by_ssc.json` created with 50 records ✓
- Ready for real ABS download ✓

---

### Option B: Download from ABS Now (15 minutes)

Follow the step-by-step guide in [ABS_DOWNLOAD_STEPS.md](./ABS_DOWNLOAD_STEPS.md):

1. Visit: https://www.abs.gov.au/census/find-census-data/datapacks
2. Create table with SSC geography
3. Select 6 required variables
4. Download as CSV
5. Save as `census_2021_ssc_export.csv`
6. Run parser

---

## What's New in This Release

### Files Created:

| File | Purpose |
|------|---------|
| `ABS_DOWNLOAD_STEPS.md` | Step-by-step ABS download guide |
| `census_2021_ssc_export_SAMPLE.csv` | 50-record sample for testing |
| `test_parser_with_sample.js` | Validation test suite |
| `parse_abs_ssc_data.js` | Main parser (existing) |
| `derive_demographics_by_hierarchy.js` | Algorithm (existing) |

---

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: Acquire CSV from ABS                            │
│ census_2021_ssc_export.csv (18,519 rows)                │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Step 2: Parse & Normalize                               │
│ node parse_abs_ssc_data.js                              │
│ Output: data/abs_census_by_ssc.json                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Step 3: Derive Through Hierarchy                        │
│ node derive_demographics_by_hierarchy.js                │
│ Output: demographic_derivation_results (18,519 rows)   │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Step 4: Verify Results                                  │
│ node verify_demographics_population.js                  │
│ Check: 18,519 suburbs with 100% coverage               │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ RESULT: All 18,519 suburbs with ABS Census 2021 data   │
│ ✓ Population, Age, Income, Employment, Household Size   │
└─────────────────────────────────────────────────────────┘
```

---

## Test with Sample Data

### Step 1: Run Validation Tests

```powershell
cd c:\Sameer\Projects\AusFinanceTools\backend
node test_parser_with_sample.js
```

**Output should show:**
```
✓ Test 1: Sample CSV file exists
✓ Test 2: Parse sample CSV file
✓ Test 3: Validate required fields in sample
✓ Test 4: Validate data types and ranges
✓ Test 5: Sample data transformations
✓ Test 6: Verify output directory exists

🎉 All tests passed!

Next steps:
  1. Copy sample file: copy census_2021_ssc_export_SAMPLE.csv census_2021_ssc_export.csv
  2. Run parser: node parse_abs_ssc_data.js
  3. Check output: type data\abs_census_by_ssc.json
```

### Step 2: Use Sample Data for Parser Test

```powershell
# Copy sample to test file
Copy-Item census_2021_ssc_export_SAMPLE.csv census_2021_ssc_export.csv

# Run parser with sample data
node parse_abs_ssc_data.js
```

**Expected output:**
```
✓ Reading CSV: census_2021_ssc_export.csv
✓ Found 50 records
✓ Processing records...

Processing: [████████████████████████████████] 50/50

✓ Processed 50 records successfully
✓ Output: data/abs_census_by_ssc.json

✓ Sample records:
{
  "13610": {
    "population": 37890,
    "medianAge": 35,
    "medianIncome": 67496,
    "employmentRate": 0.721,
    "householdSize": 2.4,
    "datasetYear": 2021
  },
  "13804": {
    "population": 28450,
    "medianAge": 37,
    "medianIncome": 72020,
    "employmentRate": 0.683,
    "householdSize": 2.8,
    "datasetYear": 2021
  }
}
```

### Step 3: Verify Output

```powershell
# Check file created
ls -la data\abs_census_by_ssc.json

# Count records
type data\abs_census_by_ssc.json | jq '.data | length'
# Expected output: 50

# Validate JSON
type data\abs_census_by_ssc.json | jq empty
# Expected: No output (valid JSON)

# Show sample record
type data\abs_census_by_ssc.json | jq '.data["13610"]'
```

---

## Download Real ABS Data

When ready to populate all 18,519 suburbs:

### Step 1: Visit ABS Website

**URL:** https://www.abs.gov.au/census/find-census-data/datapacks

Follow detailed steps in [ABS_DOWNLOAD_STEPS.md](./ABS_DOWNLOAD_STEPS.md)

### Step 2: Verify CSV Format

Ensure your downloaded CSV has exactly these columns:

```
SSC_CODE_2021,Population,Median_Age,Median_Income,Employment_Rate,Household_Size
```

### Step 3: Save in Correct Location

```
c:\Sameer\Projects\AusFinanceTools\backend\census_2021_ssc_export.csv
```

### Step 4: Run Parser

```powershell
cd c:\Sameer\Projects\AusFinanceTools\backend
node parse_abs_ssc_data.js
```

**Expected output:**
```
✓ Reading CSV: census_2021_ssc_export.csv
✓ Found 18519 records
✓ Processing records...

[████████████████████████████████] 18519/18519

✓ Processed 18519 records successfully
✓ Output: data/abs_census_by_ssc.json
```

---

## Data Validation Checklist

Before committing to production:

```powershell
# 1. File exists and is readable
Test-Path "data\abs_census_by_ssc.json"

# 2. Contains expected number of records
$json = Get-Content "data\abs_census_by_ssc.json" | ConvertFrom-Json
$json.data.PSObject.Properties.Name.Count
# Should be: ~18,519

# 3. All required fields present
$json.data.PSObject.Properties.Value[0]
# Should have: population, medianAge, medianIncome, employmentRate, householdSize, datasetYear

# 4. Data types correct
# - population: integer (1000-300000)
# - medianAge: number (20-50)
# - medianIncome: integer (50000-200000)
# - employmentRate: number (0.30-0.85)
# - householdSize: number (1.5-4.0)

# 5. No missing fields
$json.data.PSObject.Properties.Value | Where-Object {
  -not $_.population -or -not $_.employmentRate
} | Measure-Object
# Should return: 0 (no missing fields)
```

---

## Running the Full Pipeline

Once you have valid `census_2021_ssc_export.csv`:

### Run All Steps

```powershell
cd c:\Sameer\Projects\AusFinanceTools\backend

# 1. Parse CSV to JSON (2 min)
Write-Host "Step 1: Parsing CSV..." -ForegroundColor Green
node parse_abs_ssc_data.js

# 2. Derive through hierarchy (3 min)
Write-Host "Step 2: Deriving demographics..." -ForegroundColor Green
node derive_demographics_by_hierarchy.js

# 3. Verify results (2 min)
Write-Host "Step 3: Verifying results..." -ForegroundColor Green
node verify_demographics_population.js

Write-Host "✅ Complete! All 18,519 suburbs populated with ABS Census 2021 data" -ForegroundColor Green
```

---

## Critical Format Requirements

### Input CSV: `census_2021_ssc_export.csv`

**Must have:**
```
✓ Exactly 6 columns
✓ Headers: SSC_CODE_2021, Population, Median_Age, Median_Income, Employment_Rate, Household_Size
✓ 18,519 data rows (one per Australian SSC)
✓ No NULL values
✓ No missing fields
```

**Column Specifications:**

| Column | Format | Range | Example |
|--------|--------|-------|---------|
| SSC_CODE_2021 | 5-digit code | 10000-99999 | 13610 |
| Population | Integer | 100-300,000 | 37890 |
| Median_Age | Decimal | 20-50 | 35.0 |
| Median_Income | Integer (weekly AUD) | 500-3000 | 1298 |
| Employment_Rate | Decimal percentage | 30-100 | 72.1 |
| Household_Size | Decimal | 1.5-4.0 | 2.4 |

### Output JSON: `data/abs_census_by_ssc.json`

**Format:**
```json
{
  "metadata": {
    "version": "1.0",
    "source": "Australian Bureau of Statistics",
    "dataset": "Census 2021 - SSC Level Data",
    "downloadDate": "2026-02-21T...",
    "totalRecords": 18519
  },
  "data": {
    "13610": {
      "population": 37890,
      "medianAge": 35,
      "medianIncome": 67496,
      "employmentRate": 0.721,
      "householdSize": 2.4,
      "datasetYear": 2021
    }
  }
}
```

**Transformation Rules:**
- Median_Income (weekly) × 52 = medianIncome (annual)
- Employment_Rate (percentage) ÷ 100 = employmentRate (decimal)
- All other fields: direct copy with type conversion

---

## Error Handling

### If Parser Fails

```
Error: ENOENT: no such file or directory
  → Solution: Verify census_2021_ssc_export.csv exists in backend/

Error: CSV validation failed - missing required fields
  → Solution: Check CSV headers match exactly (case-sensitive)

Error: Invalid numeric value in row N
  → Solution: Check that column contains only numbers (remove text/symbols)

Error: Total records processed: 0
  → Solution: CSV file is empty or headers don't match
```

---

## FAQ

**Q: Why decimal for employment rate instead of percentage?**
A: Decimal (0.721) is more reliable for calculations and comparisons. Parser handles conversion automatically.

**Q: Can I manually edit the JSON?**
A: No - it violates data integrity. Always use the parser (re-run if needed).

**Q: What if ABS data has yearly instead of weekly income?**
A: Divide by 52 before saving. Detailed instructions in ABS_DOWNLOAD_STEPS.md.

**Q: How long does parsing take?**
A: ~2 minutes for 18,519 records (1 record per ~6ms).

**Q: What if I download wrong data?**
A: Delete `data/abs_census_by_ssc.json` and start over with correct CSV.

---

## Next Steps

- [ ] **Option A (Testing):** Run `test_parser_with_sample.js` → ✓ Verify workflow
- [ ] **Option B (Real Data):** Follow [ABS_DOWNLOAD_STEPS.md](./ABS_DOWNLOAD_STEPS.md) → Download CSV from ABS
- [ ] Save CSV as `census_2021_ssc_export.csv`
- [ ] Run `node parse_abs_ssc_data.js`
- [ ] Run `node derive_demographics_by_hierarchy.js`
- [ ] Run `node verify_demographics_population.js`
- [ ] Deploy to production ✅

---

## Support Files

| File | Purpose |
|------|---------|
| [ABS_DOWNLOAD_STEPS.md](./ABS_DOWNLOAD_STEPS.md) | Download guide with screenshots |
| [ABS_SSC_SOURCING_GUIDE.md](./ABS_SSC_SOURCING_GUIDE.md) | Detailed sourcing options |
| [DEMOGRAPHIC_INTEGRATION_WORKFLOW.md](./DEMOGRAPHIC_INTEGRATION_WORKFLOW.md) | 6-phase complete workflow |
| [parse_abs_ssc_data.js](./parse_abs_ssc_data.js) | CSV → JSON parser |
| [derive_demographics_by_hierarchy.js](./derive_demographics_by_hierarchy.js) | 4-step hierarchy algorithm |
| [census_2021_ssc_export_SAMPLE.csv](./census_2021_ssc_export_SAMPLE.csv) | 50-record sample for testing |
| [test_parser_with_sample.js](./test_parser_with_sample.js) | Validation test suite |

---

**Last Updated:** February 21, 2026  
**Status:** 🟢 Ready for data acquisition  
**Next Phase:** Download from ABS + parse + integrate

