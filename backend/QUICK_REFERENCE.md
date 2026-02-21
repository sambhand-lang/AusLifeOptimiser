# Quick Reference - ABS Data Processing

**Print this page or bookmark for quick reference during ABS data download/processing**

---

## TL;DR - What to Do

### Step 1: Download ABS Data (15 minutes)
```
1. Go to: https://www.abs.gov.au/census/find-census-data/datapacks
2. Select: Census 2021, Geography: SSC (Statistical Small Areas)
3. Download CSV with columns:
   SSC_CODE_2021, Population, Median_Age, Median_Income, Employment_Rate, Household_Size
4. Save to: c:\Sameer\Projects\AusFinanceTools\backend\census_2021_ssc_export.csv
```

### Step 2: Process Data (5 minutes)
```powershell
cd c:\Sameer\Projects\AusFinanceTools\backend

# Run parser
node parse_abs_ssc_data.js

# Run algorithm
node derive_demographics_by_hierarchy.js

# Verify results
node verify_demographics_population.js
```

### Result: 18,519 suburbs with 100% ABS Census 2021 data ✅

---

## CSV Format Reference

### Column Names (Exact - Case Sensitive)
```
SSC_CODE_2021
Population
Median_Age
Median_Income
Employment_Rate
Household_Size
```

### Expected Values (Sample Row)
```
13610,37890,35,1298,72.1,2.4
```

| Column | Example | Range | Format |
|--------|---------|-------|--------|
| SSC_CODE_2021 | 13610 | 10000-99999 | 5-digit integer |
| Population | 37890 | 100-300,000 | Integer |
| Median_Age | 35 | 20-50 | Decimal allowed |
| Median_Income | 1298 | 500-5000 | **Weekly AUD** |
| Employment_Rate | 72.1 | 30-100 | **Percentage** |
| Household_Size | 2.4 | 1.5-4.0 | Decimal |

---

## Output Format Reference

### What Parser Creates: `data/abs_census_by_ssc.json`

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

### Key Transformations Applied
- Median_Income: `1298 (weekly) × 52 = 67496 (annual)`
- Employment_Rate: `72.1 (%) ÷ 100 = 0.721 (decimal)`
- Everything else: Direct copy

---

## Parser Output Example

```
================================================================================
📊 ABS CENSUS 2021 SSC DATA PARSER
================================================================================

📂 Reading input file: ./census_2021_ssc_export.csv

Detected columns: SSC_CODE_2021, Population, Median_Age, Median_Income, Employment_Rate, Household_Size

✅ Parsed 18519 SSC records
⚠️  Skipped 0 records

📁 Output saved: ./data/abs_census_by_ssc.json

Summary:
  Total SSC records: 18519
  File size: 45.23 MB

Sample records (first 3):

SSC 13610:
  Population: 37,890
  Median Age: 35 years
  Median Income: $67,496
  Employment Rate: 72.1%
  Household Size: 2.4

SSC 13804:
  Population: 28,450
  Median Age: 37 years
  Median Income: $72,020
  Employment Rate: 68.3%
  Household Size: 2.8

SSC 10570:
  Population: 15,150
  Median Age: 35 years
  Median Income: $85,020
  Employment Rate: 71.5%
  Household Size: 2.2

✅ Parser complete!
```

---

## Expected Results After Full Processing

### Before
```
suburb_demographics: 18,519 records
├── 311 with ABS data (name-based match)
├── 18,208 with state averages
└── Data Quality: 99.1% fallback data ⚠️
```

### After
```
suburb_demographics: 18,519 records
├── 18,519 with ABS SSC data ✅
├── 0 with state averages
└── Data Quality: 100% authentic census data 🎉
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **Parser says "Input file not found"** | Verify `census_2021_ssc_export.csv` exists in `c:\Sameer\Projects\AusFinanceTools\backend\` |
| **"Missing required fields"** | Check CSV headers match exactly (case-sensitive) |
| **"Invalid numeric values in row N"** | Remove any text/commas from numeric columns |
| **Parser produces 0 records** | Check CSV is not empty, header row exists |
| **Wrong employment rate stored** | Parser automatically divides by 100 (72.1% → 0.721 ✓) |
| **Wrong income stored** | Parser automatically multiplies by 52 (1298/week → 67496/year ✓) |
| **Output file not created** | Check `data/` directory exists (parser creates if missing) |
| **"Employment rate out of range"** | Ensure input is percentage (72.1), not decimal (0.721) |

---

## Verification Commands

```powershell
cd c:\Sameer\Projects\AusFinanceTools\backend

# Check file exists
Test-Path census_2021_ssc_export.csv

# Check parser output created
Test-Path data\abs_census_by_ssc.json

# Count records
$json = Get-Content data\abs_census_by_ssc.json | ConvertFrom-Json
$json.data.PSObject.Properties.Count

# View one record
$json.data.PSObject.Properties[0] | ForEach-Object {
  Write-Host "SSC: $($_.Name)"
  Write-Host ($_.Value | Convert To-Json)
}

# Check file size (should be 50-80 MB)
(Get-Item data\abs_census_by_ssc.json).Length / 1MB
```

---

## Critical Rules

### ✅ DO:
- [ ] Download from official ABS website only
- [ ] Verify 6 columns present in CSV
- [ ] Run parser before running algorithm
- [ ] Check output file created successfully
- [ ] Run verification script before deploying
- [ ] Keep backup of old demographics

### ❌ DON'T:
- [ ] Manually edit abs_census_by_ssc.json
- [ ] Add state suffixes to SSC codes
- [ ] Use pipe delimiters (|)
- [ ] Change format after parser creates file
- [ ] Deploy without verification
- [ ] Delete old data before verifying new data

---

## File Paths (Copy-Paste Ready)

```
Input (save after downloading):
c:\Sameer\Projects\AusFinanceTools\backend\census_2021_ssc_export.csv

Output (created by parser):
c:\Sameer\Projects\AusFinanceTools\backend\data\abs_census_by_ssc.json

Parser script:
c:\Sameer\Projects\AusFinanceTools\backend\parse_abs_ssc_data.js

Algorithm script:
c:\Sameer\Projects\AusFinanceTools\backend\derive_demographics_by_hierarchy.js

Verification script:
c:\Sameer\Projects\AusFinanceTools\backend\verify_demographics_population.js
```

---

## Copy-Paste Commands

### Test Before Real Data (Optional - Already Done ✅)
```powershell
cd c:\Sameer\Projects\AusFinanceTools\backend
node test_parser_with_sample.js
```

### Process Real ABS Data (When Ready)
```powershell
cd c:\Sameer\Projects\AusFinanceTools\backend
node parse_abs_ssc_data.js
node derive_demographics_by_hierarchy.js
node verify_demographics_population.js
```

### Quick Status Check
```powershell
cd c:\Sameer\Projects\AusFinanceTools\backend
$json = Get-Content data\abs_census_by_ssc.json | ConvertFrom-Json
$json | Select-Object metadata
```

---

## Timeline

- **Step 1 (Download):** 10-15 minutes
- **Step 2 (Parse):** 2-3 minutes (automatic)
- **Step 3 (Algorithm):** 3-5 minutes (automatic)
- **Step 4 (Verify):** 2-3 minutes (automatic)
- **Step 5 (Deploy):** 5 minutes (manual)
- **Total:** ~30-45 minutes

---

## Support

- **Detailed Download Guide:** [ABS_DOWNLOAD_STEPS.md](./ABS_DOWNLOAD_STEPS.md)
- **Full Workflow:** [DEMOGRAPHIC_INTEGRATION_WORKFLOW.md](./DEMOGRAPHIC_INTEGRATION_WORKFLOW.md)
- **ABS Website:** https://www.abs.gov.au/census
- **ABS Support:** 1300 135 070

---

## Status Checklist

- [x] Parser created & tested ✅
- [x] Sample data processed successfully ✅
- [x] Output format verified ✅
- [x] All documentation complete ✅
- [ ] Download real ABS data ← You are here
- [ ] Save as `census_2021_ssc_export.csv`
- [ ] Run: `node parse_abs_ssc_data.js`
- [ ] Run: `node derive_demographics_by_hierarchy.js`
- [ ] Run: `node verify_demographics_population.js`
- [ ] Deploy to production
- [ ] Done! 🎉

---

**Ready? Start with:** [ABS_DOWNLOAD_STEPS.md](./ABS_DOWNLOAD_STEPS.md)

