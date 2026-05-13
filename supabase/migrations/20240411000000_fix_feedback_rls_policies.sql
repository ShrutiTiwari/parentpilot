-- Drop existing RLS policies for feedback_messages
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.feedback_messages;
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.feedback_messages;
DROP POLICY IF EXISTS "Users can update their own feedback" ON public.feedback_messages;

-- Create new, more permissive RLS policies
-- Allow users to view their own feedback
CREATE POLICY "Users can view their own feedback"
    ON public.feedback_messages
    FOR SELECT
    USING (user_id = auth.uid() OR user_id IS NULL);

-- Allow users to insert feedback (both authenticated and anonymous)
CREATE POLICY "Users can insert feedback"
    ON public.feedback_messages
    FOR INSERT
    WITH CHECK (true); -- Allow all inserts

-- Allow users to update their own feedback
CREATE POLICY "Users can update their own feedback"
    ON public.feedback_messages
    FOR UPDATE
    USING (user_id = auth.uid());

-- Allow users to delete their own feedback (optional)
CREATE POLICY "Users can delete their own feedback"
    ON public.feedback_messages
    FOR DELETE
    USING (user_id = auth.uid());

-- Admin policy for viewing all feedback (uncomment and modify as needed)
-- CREATE POLICY "Admin can view all feedback"
--     ON public.feedback_messages
--     FOR ALL
--     USING (auth.uid() IN ('your-admin-user-id-here')); 