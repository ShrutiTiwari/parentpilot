-- Add city and country columns to schools table
ALTER TABLE schools ADD COLUMN city TEXT;
ALTER TABLE schools ADD COLUMN country TEXT;

-- Update existing schools with default values
UPDATE schools SET country = 'United Kingdom' WHERE country IS NULL; 