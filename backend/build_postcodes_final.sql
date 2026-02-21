-- Build suburb_postcodes normalization table
-- One row per SSC with denormalized postcode mapping

-- First, clear any existing data
DELETE FROM suburb_postcodes;

-- Insert all unique SSC + Postcode combinations
-- with primary postcode marked (first alphabetically per SSC)
INSERT INTO suburb_postcodes (ssc, postcode, is_primary)
SELECT 
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
FROM (
  -- Get all unique SSC + postcode pairs
  SELECT DISTINCT ssc, postcode
  FROM suburbs
  WHERE ssc IS NOT NULL
    AND postcode IS NOT NULL
    AND postcode != ''
  ORDER BY ssc, postcode
) s;

-- Verify result
.header on
.mode column
SELECT 
  'TOTAL MAPPINGS' as metric,
  COUNT(*) as value 
FROM suburb_postcodes
UNION ALL
SELECT 'UNIQUE SSCs', COUNT(DISTINCT ssc) FROM suburb_postcodes
UNION ALL
SELECT 'PRIMARY POSTCODES', SUM(CASE WHEN is_primary=1 THEN 1 ELSE 0 END) FROM suburb_postcodes  
UNION ALL
SELECT 'SECONDARY POSTCODES', SUM(CASE WHEN is_primary=0 THEN 1 ELSE 0 END) FROM suburb_postcodes
UNION ALL
SELECT 'MULTI-POSTCODE SUBURBS', COUNT(DISTINCT ssc) FROM (
  SELECT ssc FROM suburb_postcodes GROUP BY ssc HAVING COUNT(*) > 1
);

-- Show sample multi-postcode suburbs
.header on  
.mode column
SELECT 
  s.ssc,
  s.suburb_name,
  s.state,
  GROUP_CONCAT(CASE WHEN sp.is_primary=1 THEN '[' || sp.postcode || ']' ELSE sp.postcode END, ', ') as postcodes,
  COUNT(sp.postcode) as postcode_count
FROM suburbs s
INNER JOIN suburb_postcodes sp ON s.ssc = sp.ssc
GROUP BY s.ssc
HAVING COUNT(sp.postcode) > 1
ORDER BY postcode_count DESC
LIMIT 10;
