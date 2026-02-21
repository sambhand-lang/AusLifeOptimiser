-- Rebuild suburb_postcodes with all variants
DELETE FROM suburb_postcodes;

-- Insert all unique (ssc, postcode) combinations
INSERT INTO suburb_postcodes (ssc, postcode, is_primary)
SELECT DISTINCT
  s.ssc,
  s.postcode,
  CASE 
    WHEN s.postcode = (
      SELECT MIN(postcode)
      FROM suburbs s2
      WHERE s2.ssc = s.ssc
        AND s2.postcode IS NOT NULL
        AND s2.postcode != ''
    ) THEN 1
    ELSE 0
  END as is_primary
FROM suburbs s
WHERE s.ssc IS NOT NULL
  AND s.postcode IS NOT NULL
  AND s.postcode != '';

-- Show results
SELECT 
  COUNT(*) as total_mappings,
  COUNT(DISTINCT ssc) as unique_ssc,
  SUM(CASE WHEN is_primary = 1 THEN 1 ELSE 0 END) as primary_count,
  SUM(CASE WHEN is_primary = 0 THEN 1 ELSE 0 END) as secondary_count
FROM suburb_postcodes;
