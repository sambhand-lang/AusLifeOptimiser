# SCORING_V1.md

## Suburb Score Model — Version 1 (Phase 1)

### Metrics Used
- **Median Income** (higher is better)
- **Employment Rate** (higher is better)
- **Commute Time (Driving Minutes)** (lower is better)
- **School Count** (higher is better)
- **Parks** (higher is better)

### Weightings
- Median Income: **30%**
- Employment Rate: **25%**
- Commute Time: **20%**
- School Count: **15%**
- Parks: **10%**

### Rationale
- **Income & Employment**: Directly reflect economic opportunity and stability.
- **Commute**: Shorter commutes improve lifestyle and work-life balance.
- **Schools**: Indicates family-friendliness and education access.
- **Parks**: Supports lifestyle, recreation, and wellbeing.

### Known Limitations
- Only considers five metrics; ignores housing, safety, diversity, and health.
- Parks metric normalization is basic (0–100 scale, not area-adjusted).
- No weighting for population size or density.
- Relies on available realTimeData; missing data leads to exclusion.
- Does not account for metric interdependencies or local context.

### Future Improvements (V2 Ideas)
- Add housing affordability, rental yield, and price growth.
- Include safety/crime, healthcare, and diversity metrics.
- Refine parks metric (area, quality, proximity).
- Support custom weightings and user preferences.
- Use machine learning for dynamic scoring and validation.

---
**Note:** This scoring definition is frozen for Phase 1. Any changes require founder approval and a new version document.
