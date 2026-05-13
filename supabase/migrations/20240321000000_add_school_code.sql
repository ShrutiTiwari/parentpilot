-- Add school_code column
ALTER TABLE schools ADD COLUMN school_code VARCHAR(6);

-- Create a function to generate random school codes
CREATE OR REPLACE FUNCTION generate_school_code()
RETURNS VARCHAR(6) AS $$
DECLARE
    chars VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result VARCHAR(6) := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * 36 + 1)::INTEGER, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update existing schools with random codes
UPDATE schools
SET school_code = generate_school_code()
WHERE school_code IS NULL;

-- Make school_code required and unique
ALTER TABLE schools ALTER COLUMN school_code SET NOT NULL;
ALTER TABLE schools ADD CONSTRAINT schools_school_code_key UNIQUE (school_code);

-- Create a trigger to automatically generate school codes for new schools
CREATE OR REPLACE FUNCTION set_school_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.school_code IS NULL THEN
        NEW.school_code := generate_school_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_school_code_trigger
    BEFORE INSERT ON schools
    FOR EACH ROW
    EXECUTE FUNCTION set_school_code(); 