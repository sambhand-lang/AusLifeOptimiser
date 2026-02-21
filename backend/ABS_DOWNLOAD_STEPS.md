# How to Download ABS Census 2021 SSC Data

**Objective:** Get 2021 Census SSC-level data directly from ABS  
**Output:** CSV file with 6 required columns  
**Time Required:** 10-15 minutes

---

## Step 1: Visit ABS TableBuilder

**URL:** https://www.abs.gov.au/census/find-census-data/datapacks

**Steps:**
1. Click "Census TableBuilder"
2. You may see a login prompt (free registration optional, many tools work without login)
3. Select "Census 2021"

---

## Step 2: Create a New Table

1. Click "Create custom table"
2. Select Geography: **Statistical Small Areas (SSC)**
   - NOT suburbs
   - NOT postcodes  
   - Must be "SSC"

3. From the list, select **all of Australia**
   - You'll see checkboxes for each state
   - Check: NSW, VIC, QLD, WA, SA, TAS, ACT, NT

---

## Step 3: Add Required Variables

Select these exact variables from "Census Data":

### Required Variables (Find these in the variables list):

| Variable | Where to Find | Exact Name |
|----------|---------------|-----------|
| **Population** | People → Basic Demographics | Total Persons |
| **Median Age** | People → Age → Median Age | Median Age in Years |
| **Median Income** | Income → Household Income | Median Total Household Income (Weekly) |
| **Employment Rate** | Work → Employment Status | Employed (%) |
| **Household Size** | Households → Size | Average Household Size |

**Add to Table:**
- Drag each variable to the table builder
- Rows: SSC Code
- Columns: Each variable

---

## Step 4: Review Preview

Before downloading:
- [ ] Rows: ~18,519 (one per SSC)
- [ ] Columns: 6 (SSC_CODE, Population, Median Age, Median Income, Employment Rate, Household Size)
- [ ] No empty cells (all SSCs should have data)

**If counts don't match:**
- Click "Reset" and try again
- Ensure you selected all states
- Double-check variable names

---

## Step 5: Download as CSV

1. Click "Download"
2. Select format: **CSV (Comma Separated Values)**
3. Options:
   - Include margins: **NO**
   - Include standard error: **NO**
   - Include notes: **NO**

The download starts automatically.

---

## Step 6: Save to Correct Location

**Save as:** `census_2021_ssc_export.csv`  
**Location:** `C:\Sameer\Projects\AusFinanceTools\backend\`

**Verify:**
```powershell
ls c:\Sameer\Projects\AusFinanceTools\backend\census_2021_ssc_export.csv
```

Should show file exists with size ~3-5 MB.

---

## Step 7: Prepare CSV Format

**Open the CSV in a text editor** (NOT Excel - to preserve formatting):
- Use: VS Code, Notepad++, or PowerShell

### Check Header Row

Should look exactly like:
```
SSC_CODE_2021,Population,Median_Age,Median_Income,Employment_Rate,Household_Size
```

**If header is different:**

| If you see | Change to |
|-----------|----------|
| SSC Code 2021 | SSC_CODE_2021 |
| Total Person | Population |
| Age Median | Median_Age |
| Household Income | Median_Income |
| Employed % | Employment_Rate |
| Persons per Household | Household_Size |

---

### Check Data Rows

Each row should look like:
```
13610,37890,35,1298,72.1,2.4
```

| Column | Meaning | Example | Valid Range |
|--------|---------|---------|------------|
| SSC_CODE | Region ID | 13610 | 4-5 digits |
| Population | Total persons | 37890 | 100-300,000 |
| Median_Age | Age in years | 35 | 20-50 |
| Median_Income | Weekly AUD | 1298 | 500-3000 |
| Employment_Rate | Percentage | 72.1 | 30-85 |
| Household_Size | Average persons | 2.4 | 1.5-4.0 |

**If numbers have commas:**
- ABS sometimes exports: `1,298` for income
- Parser handles this automatically ✓

**If income in annual (e.g., 67500):**
- Divide by 52: `67500 / 52 = 1298` (weekly)
- OR keep annual and update parser

---

## Step 8: Alternative Download Method (DataPack)

If TableBuilder doesn't work:

1. Go back to https://www.abs.gov.au/census/find-census-data/datapacks
2. Download "Census 2021 DataPacks"
3. Choose your state or National Pack
4. Extract ZIP file
5. Find file: `Census_2021_A01_B01_XLS.csv` or similar

This has ALL variables. Extract just our 6:

```powershell
$csv = Import-Csv "census_datapack_ssc.csv"
$csv | Select-Object @{N="SSC_CODE_2021"; E={$_.SSC}}, `
                      @{N="Population"; E={$_.'Total Persons'}}, `
                      @{N="Median_Age"; E={$_.'Median Age in Years'}}, `
                      @{N="Median_Income"; E={$_.'Median Total Household Income (Weekly)'}}, `
                      @{N="Employment_Rate"; E={$_.'Employed (%)'}}, `
                      @{N="Household_Size"; E={$_.'Average Household Size'}} `
  | Export-Csv "census_2021_ssc_export.csv" -NoTypeInformation
```

---

## Validation Checklist

Before running parser, verify:

```powershell
# 1. File exists
Test-Path "c:\Sameer\Projects\AusFinanceTools\backend\census_2021_ssc_export.csv"

# 2. Can read first 5 lines
Get-Content "census_2021_ssc_export.csv" -TotalCount 5

# 3. Line count (should be ~18,520 including header)
(Get-Content "census_2021_ssc_export.csv" | Measure-Object -Line).Lines

# 4. Check for obvious errors
(Import-Csv "census_2021_ssc_export.csv")[0]  # Should show all columns
```

---

## Troubleshooting

### "Can't find SSC option"
- Make sure you're in Census 2021 (not 2016)
- Geography list might be scrolled - look for "Statistical Small Area"

### "Downloaded file is too small"
- Verify you selected all states (NSW, VIC, QLD, WA, SA, TAS, ACT, NT)

### "CSV has different column names"
- TableBuilder varies slightly - column names just need to be recognizable
- Parser will attempt to match variations
- If parser fails, open CSV in Excel and rename columns manually

### "Numbers have commas"
- This is normal: `67,500` for income (weekly)
- Parser handles this automatically ✓

### "Income is in annual, not weekly"
- TableBuilder default is weekly
- If you got annual, convert: `divide by 52`
- OR update parser INPUT_FILE section to divide

---

## What Happens Next

Once CSV is saved in correct location:

```bash
cd c:\Sameer\Projects\AusFinanceTools\backend

# Run the parser
node parse_abs_ssc_data.js

# Expected output:
# ✓ Reading CSV: census_2021_ssc_export.csv
# ✓ Processing records...
# ✓ Total records processed: 18519
# ✓ Output: data/abs_census_by_ssc.json
# ✓ Sample records displayed
```

---

## Sample Output Format

Parser will create: `data/abs_census_by_ssc.json`

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
      "medianIncome": 1298,
      "employmentRate": 0.721,
      "householdSize": 2.4,
      "datasetYear": 2021
    }
  }
}
```

**Note:** `employmentRate` stored as decimal (0.721 = 72.1%)

---

## Support

**ABS Help:**
- Website: https://www.abs.gov.au/census
- Phone: 1300 135 070
- Email: client.services@abs.gov.au

**If cannot download manually:**
1. Check email for TableBuilder account confirmation
2. Try incognito browser (clears cache)
3. Try different browser (Chrome, Firefox, Edge)

---

## Next Steps

- [ ] Download CSV from ABS
- [ ] Save as `census_2021_ssc_export.csv`
- [ ] Run `node parse_abs_ssc_data.js`
- [ ] Verify `data/abs_census_by_ssc.json` created
- [ ] Run `node derive_demographics_by_hierarchy.js`
- [ ] Run verification script

**Timeline:** 10 min (download) + 5 min (automated) = complete!

