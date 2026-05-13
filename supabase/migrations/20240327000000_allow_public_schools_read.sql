-- Enable RLS on schools table if not already enabled
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Allow public read access to schools (for unauthenticated users)
CREATE POLICY "Allow public read access to schools"
    ON public.schools
    FOR SELECT
    USING (true);

-- Only allow authenticated users to insert schools
CREATE POLICY "Allow authenticated users to insert schools"
    ON public.schools
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Only allow authenticated users to update schools
CREATE POLICY "Allow authenticated users to update schools"
    ON public.schools
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Only allow authenticated users to delete schools
CREATE POLICY "Allow authenticated users to delete schools"
    ON public.schools
    FOR DELETE
    USING (auth.role() = 'authenticated'); 