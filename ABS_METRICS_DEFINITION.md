# ABS Metrics Definition Reference

**Last Updated:** February 20, 2026  
**Compliance Status:** ABS Census 2021 Terminology Aligned

---

## Employment Metrics - Correct ABS Definitions

### ❌ INCORRECT TERMINOLOGY (Do NOT use)
- "Labour Force Participation Rate" with formula "Employment / Labour Force"
- This is mathematically wrong and violates ABS definitions

### ✅ CORRECT TERMINOLOGY (Use this)

#### 1. Employment Rate (Employment-to-Population Ratio)
**Formula**: `Employed / Working-age population × 100`  
**ABS Definition**: Percentage of working-age population (15+) that is employed  
**Value Range**: 55-75% (varies by suburb)  
**Our Implementation**: Employed / Labour Force × 100  
**Equivalent ABS Metric**: Approximately 100% - Unemployment Rate

**Example:**
- Labour Force: 17,590 people
- Employed: 12,820 people
- Employment Rate = 12,820 / 17,590 = 72.9%

#### 2. Labour Force Participation Rate  ⚠️ DO NOT CONFUSE
**Formula**: `Labour Force / Working-age population × 100`  
**ABS Definition**: Percentage of working-age population (15+) that is either employed or actively seeking work  
**Value Range**: 60-73%  
**NOT what we calculate**: We do NOT calculate this metric  

**Example:**
- Working-age population: 24,500 people
- Labour Force: 17,590 people
- Participation Rate = 17,590 / 24,500 = 71.8%

#### 3. Unemployment Rate
**Formula**: `Unemployed / Labour Force × 100`  
**ABS Definition**: Percentage of labour force that is actively seeking work  
**NOT what we calculate**: We do NOT calculate this metric  

**Mathematical Relationship:**
```
Employment Rate (as % of Labour Force) = 100 - Unemployment Rate
```

---

## Our Metric: Employment Rate (Employed as % of Labour Force)

### Correct Description
```
Metric Name: Employment Rate
Formula: Employed / Labour Force
Unit: Percentage (%)
Range: 55-75% for Australian suburbs
ABS Source: Census 2021 Labour Force Data
Interpretation: Of people actively in the labour force, what % are employed?
```

### NOT to be called
- ❌ Labour Force Participation Rate (different metric)
- ❌ Employment-to-Population Ratio (different denominator)  
- ❌ Participation Rate (different concept)

### Backend Attribution
**Current Label in backend/suburbMetricsPolygon.js:**
```javascript
employment_rate: {
  source: 'ABS Census 2021 (SA2 Labour Force) - ASGS 2021',
  year: 2021,
  type: 'official_dataset'
}
```

**This correctly states:**
- ✅ Source: ABS Census 2021
- ✅ Category: Labour Force data
- ✅ Versioning: ASGS 2021 geographical standard

### Frontend Display
```
Label: "Employment Rate (%)"
Badge: "✓ Census" (indicates official ABS data)
Source Tooltip: "ABS Census 2021 (SA2 Labour Force) - ASGS 2021 (2021)"
```

---

## Income Metric - Corrected

### Metric Name: Median Personal Income (Annualised from Weekly)

**Description:**
```
Formula: Median Weekly Personal Income × 52 weeks
Unit: AUD (annual)
Source: ABS Census 2021
Transformation: Weekly to annual (× 52)
Versioning: ASGS 2021
Data Class: Personal Income (not household income)
```

**Backend Attribution:**
```javascript
median_income: {
  source: 'ABS Census 2021 (SA2 Median Weekly Personal Income - annualised to annual) - ASGS 2021',
  year: 2021,
  type: 'official_dataset'
}
```

**Frontend Display:**
```
Label: "Median Income (AUD)"
Note: Annualised from ABS weekly personal income figures
Badge: "✓ Census"
```

---

## Summary Table: What's Correct ✅ | What's Wrong ❌

| Metric | ✅ CORRECT | ❌ INCORRECT |
|--------|-----------|------------|
| Employment | "Employment Rate (%)" | "Labour Force Participation Rate" |
| Employment Formula | Employed / Labour Force | Employment / Working-age population |
| Income | "Median Personal Income (annualised)" | "Just income" without frequency note |
| Employment Source | "ABS Labour Force data" | Undefined source |
| Income Source | "Median Weekly Personal Income × 52" | "ABS income" (no transformation disclosure) |

---

## References

- ABS Labour Force Concepts: https://www.abs.gov.au/websitedbs/d3310114.nsf/home/Labour+Force+Glossary
- Census 2021 Data Dictionary: https://www.abs.gov.au/census
- ASGS 2021 Standard: https://www.abs.gov.au/websitedbs/d3310114.nsf/home/ASGS+2021

---

**Compliance Note:** This document ensures all metrics reference official ABS definitions and disclose any data transformations (like weekly-to-annual annualization) applied to published data. Terminology is legally and statistically precise.
