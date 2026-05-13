-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time_start TIME,
    time_end TIME,
    year_group TEXT,
    category TEXT,
    source TEXT,
    venue TEXT,
    school_id UUID REFERENCES schools(id),
    created_by_user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL DEFAULT 'school',
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create todos table
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    created_by_user_id UUID REFERENCES auth.users(id),
    todo_type TEXT NOT NULL DEFAULT 'school',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Create policies for events
CREATE POLICY "Users can view events for their authorized schools"
    ON public.events
    FOR SELECT
    USING (
        event_type = 'school' AND (
            EXISTS (
                SELECT 1 FROM public.school_authorizations
                WHERE school_authorizations.user_id = auth.uid()
                AND school_authorizations.is_approved = true
                AND school_authorizations.school_id = events.school_id
            )
        )
        OR
        event_type = 'personal' AND created_by_user_id = auth.uid()
    );

CREATE POLICY "Users can insert events for their authorized schools"
    ON public.events
    FOR INSERT
    WITH CHECK (
        event_type = 'school' AND (
            EXISTS (
                SELECT 1 FROM public.school_authorizations
                WHERE school_authorizations.user_id = auth.uid()
                AND school_authorizations.is_approved = true
                AND school_authorizations.school_id = events.school_id
            )
        )
        OR
        event_type = 'personal' AND created_by_user_id = auth.uid()
    );

CREATE POLICY "Users can update events for their authorized schools"
    ON public.events
    FOR UPDATE
    USING (
        event_type = 'school' AND (
            EXISTS (
                SELECT 1 FROM public.school_authorizations
                WHERE school_authorizations.user_id = auth.uid()
                AND school_authorizations.is_approved = true
                AND school_authorizations.school_id = events.school_id
            )
        )
        OR
        event_type = 'personal' AND created_by_user_id = auth.uid()
    );

CREATE POLICY "Users can delete events for their authorized schools"
    ON public.events
    FOR DELETE
    USING (
        event_type = 'school' AND (
            EXISTS (
                SELECT 1 FROM public.school_authorizations
                WHERE school_authorizations.user_id = auth.uid()
                AND school_authorizations.is_approved = true
                AND school_authorizations.school_id = events.school_id
            )
        )
        OR
        event_type = 'personal' AND created_by_user_id = auth.uid()
    );

-- Create policies for todos
CREATE POLICY "Users can view todos for their authorized schools"
    ON public.todos
    FOR SELECT
    USING (
        todo_type = 'school' AND (
            EXISTS (
                SELECT 1 FROM public.school_authorizations
                WHERE school_authorizations.user_id = auth.uid()
                AND school_authorizations.is_approved = true
                AND school_authorizations.school_id = (
                    SELECT school_id FROM events WHERE id = todos.event_id
                )
            )
        )
        OR
        todo_type = 'personal' AND created_by_user_id = auth.uid()
    );

CREATE POLICY "Users can insert todos for their authorized schools"
    ON public.todos
    FOR INSERT
    WITH CHECK (
        todo_type = 'school' AND (
            EXISTS (
                SELECT 1 FROM public.school_authorizations
                WHERE school_authorizations.user_id = auth.uid()
                AND school_authorizations.is_approved = true
                AND school_authorizations.school_id = (
                    SELECT school_id FROM events WHERE id = todos.event_id
                )
            )
        )
        OR
        todo_type = 'personal' AND created_by_user_id = auth.uid()
    );

CREATE POLICY "Users can update todos for their authorized schools"
    ON public.todos
    FOR UPDATE
    USING (
        todo_type = 'school' AND (
            EXISTS (
                SELECT 1 FROM public.school_authorizations
                WHERE school_authorizations.user_id = auth.uid()
                AND school_authorizations.is_approved = true
                AND school_authorizations.school_id = (
                    SELECT school_id FROM events WHERE id = todos.event_id
                )
            )
        )
        OR
        todo_type = 'personal' AND created_by_user_id = auth.uid()
    );

CREATE POLICY "Users can delete todos for their authorized schools"
    ON public.todos
    FOR DELETE
    USING (
        todo_type = 'school' AND (
            EXISTS (
                SELECT 1 FROM public.school_authorizations
                WHERE school_authorizations.user_id = auth.uid()
                AND school_authorizations.is_approved = true
                AND school_authorizations.school_id = (
                    SELECT school_id FROM events WHERE id = todos.event_id
                )
            )
        )
        OR
        todo_type = 'personal' AND created_by_user_id = auth.uid()
    );

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todos_updated_at
    BEFORE UPDATE ON todos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 