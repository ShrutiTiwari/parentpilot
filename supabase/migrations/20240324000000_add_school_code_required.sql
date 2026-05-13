-- Add school_code_required column to events table
ALTER TABLE events ADD COLUMN school_code_required BOOLEAN DEFAULT FALSE; 