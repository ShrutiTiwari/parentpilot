-- Create feedback messages table
CREATE TABLE IF NOT EXISTS public.feedback_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional, for logged-in users
    email TEXT, -- For anonymous users
    category TEXT NOT NULL CHECK (category IN ('bug_report', 'feature_request', 'general_feedback', 'question', 'other')),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
    user_agent TEXT, -- Browser/device info
    page_url TEXT, -- URL where feedback was submitted from
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_messages_user_id ON public.feedback_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_messages_category ON public.feedback_messages(category);
CREATE INDEX IF NOT EXISTS idx_feedback_messages_status ON public.feedback_messages(status);
CREATE INDEX IF NOT EXISTS idx_feedback_messages_created_at ON public.feedback_messages(created_at);

-- Enable RLS
ALTER TABLE public.feedback_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
    ON public.feedback_messages
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback"
    ON public.feedback_messages
    FOR INSERT
    WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Users can update their own feedback (if needed)
CREATE POLICY "Users can update their own feedback"
    ON public.feedback_messages
    FOR UPDATE
    USING (user_id = auth.uid());

-- Admin policy (you can modify this based on your admin user IDs)
-- CREATE POLICY "Admin can view all feedback"
--     ON public.feedback_messages
--     FOR ALL
--     USING (auth.uid() IN ('your-admin-user-id-here'));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feedback_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_feedback_messages_updated_at_trigger
    BEFORE UPDATE ON public.feedback_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_feedback_messages_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.feedback_messages IS 'Stores user feedback, bug reports, and feature requests';
COMMENT ON COLUMN public.feedback_messages.category IS 'Type of feedback: bug_report, feature_request, general_feedback, question, other';
COMMENT ON COLUMN public.feedback_messages.priority IS 'Priority level: low, normal, high, urgent';
COMMENT ON COLUMN public.feedback_messages.status IS 'Status: new, in_progress, resolved, closed';
COMMENT ON COLUMN public.feedback_messages.user_agent IS 'Browser/device information for debugging';
COMMENT ON COLUMN public.feedback_messages.page_url IS 'URL where feedback was submitted from for context'; 