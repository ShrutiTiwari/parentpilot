-- Add year_groups array column to events table for multi-year group support
-- This maintains backward compatibility with existing year_group column

-- Add the new year_groups column
ALTER TABLE public.events 
ADD COLUMN year_groups TEXT[] DEFAULT NULL;

-- Create an index on the year_groups array for better query performance
CREATE INDEX idx_events_year_groups ON public.events USING GIN (year_groups);

-- Populate the new year_groups column from existing year_group data
-- Convert single year_group values to arrays
UPDATE public.events 
SET year_groups = ARRAY[year_group]
WHERE year_group IS NOT NULL 
  AND year_groups IS NULL;

-- Add a check constraint to ensure year_groups is not empty when provided
ALTER TABLE public.events 
ADD CONSTRAINT check_year_groups_not_empty 
CHECK (year_groups IS NULL OR array_length(year_groups, 1) > 0);

-- Add a comment to document the migration
COMMENT ON COLUMN public.events.year_groups IS 'Array of year groups for this event. Replaces year_group column for multi-year group support.';
COMMENT ON COLUMN public.events.year_group IS 'DEPRECATED: Use year_groups array instead. This column will be removed in a future migration.'; 