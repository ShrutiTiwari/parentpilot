-- Create one_off_events table
CREATE TABLE IF NOT EXISTS public.one_off_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    school_name TEXT NOT NULL,
    year_group TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recurring_events table
CREATE TABLE IF NOT EXISTS public.recurring_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    day_of_week INTEGER NOT NULL, -- 0-6 for Sunday-Saturday
    start_time TIME NOT NULL,
    end_time TIME,
    child_name TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create weekend_plans table
CREATE TABLE IF NOT EXISTS public.weekend_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    child_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, completed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.one_off_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekend_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for one_off_events
CREATE POLICY "Users can view one_off_events for their authorized schools"
    ON public.one_off_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.school_authorizations
            WHERE school_authorizations.user_id = auth.uid()
            AND school_authorizations.is_approved = true
            AND school_authorizations.schools.name = one_off_events.school_name
        )
    );

-- Create policies for recurring_events
CREATE POLICY "Users can view recurring_events for their children"
    ON public.recurring_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.child_profiles
            WHERE child_profiles.user_id = auth.uid()
            AND child_profiles.name = recurring_events.child_name
        )
    );

-- Create policies for weekend_plans
CREATE POLICY "Users can view weekend_plans for their children"
    ON public.weekend_plans
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.child_profiles
            WHERE child_profiles.user_id = auth.uid()
            AND child_profiles.name = weekend_plans.child_name
        )
    ); 