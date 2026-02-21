
-- Add SSC column to suburbs table
ALTER TABLE suburbs ADD COLUMN ssc VARCHAR(5);

-- Create index on SSC
CREATE INDEX idx_ssc ON suburbs(ssc);

-- Add unique constraint on (state, suburb_name, postcode) as canonical key
ALTER TABLE suburbs ADD CONSTRAINT unique_suburb_postcode UNIQUE (state, suburb_name, postcode);
