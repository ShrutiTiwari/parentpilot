-- Add missing security columns to feedback_messages table (only if they don't exist)
DO $$ 
BEGIN
    -- Add ip_address column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback_messages' AND column_name = 'ip_address') THEN
        ALTER TABLE public.feedback_messages ADD COLUMN ip_address INET;
    END IF;
    
    -- Add submission_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback_messages' AND column_name = 'submission_count') THEN
        ALTER TABLE public.feedback_messages ADD COLUMN submission_count INTEGER DEFAULT 1;
    END IF;
    
    -- Add is_suspicious column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback_messages' AND column_name = 'is_suspicious') THEN
        ALTER TABLE public.feedback_messages ADD COLUMN is_suspicious BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add flagged_reason column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback_messages' AND column_name = 'flagged_reason') THEN
        ALTER TABLE public.feedback_messages ADD COLUMN flagged_reason TEXT;
    END IF;
    
    -- Add content_hash column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback_messages' AND column_name = 'content_hash') THEN
        ALTER TABLE public.feedback_messages ADD COLUMN content_hash TEXT;
    END IF;
END $$;

-- Create indexes for rate limiting (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_feedback_messages_ip_created ON public.feedback_messages(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_messages_user_created ON public.feedback_messages(user_id, created_at);

-- Create function to check for suspicious content
CREATE OR REPLACE FUNCTION check_suspicious_content()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for common spam patterns
    IF (
        -- Too many capital letters
        (length(regexp_replace(NEW.subject || ' ' || NEW.message, '[^A-Z]', '', 'g')) > length(NEW.subject || NEW.message) * 0.3)
        OR
        -- Too many exclamation marks
        (length(regexp_replace(NEW.subject || ' ' || NEW.message, '[^!]', '', 'g')) > 5)
        OR
        -- Contains suspicious keywords
        (NEW.subject || ' ' || NEW.message) ~* '(viagra|casino|loan|credit|buy now|click here|free money|lottery|winner)'
        OR
        -- Too many links
        (length(regexp_replace(NEW.subject || ' ' || NEW.message, 'https?://[^\s]+', '', 'g')) < length(NEW.subject || NEW.message) * 0.7)
    ) THEN
        NEW.is_suspicious := TRUE;
        NEW.flagged_reason := 'Suspicious content detected';
    END IF;
    
    -- Generate simple content hash for duplicate detection (using MD5 which is available by default)
    NEW.content_hash := md5(NEW.subject || NEW.message);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for suspicious content detection (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'check_suspicious_content_trigger') THEN
        CREATE TRIGGER check_suspicious_content_trigger
            BEFORE INSERT ON public.feedback_messages
            FOR EACH ROW
            EXECUTE FUNCTION check_suspicious_content();
    END IF;
END $$;

-- Create function to enforce rate limiting
CREATE OR REPLACE FUNCTION enforce_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
    recent_count INTEGER;
    user_recent_count INTEGER;
BEGIN
    -- Check IP-based rate limiting (max 5 submissions per hour)
    IF NEW.ip_address IS NOT NULL THEN
        SELECT COUNT(*) INTO recent_count
        FROM public.feedback_messages
        WHERE ip_address = NEW.ip_address
        AND created_at > NOW() - INTERVAL '1 hour';
        
        IF recent_count >= 5 THEN
            RAISE EXCEPTION 'Rate limit exceeded: Too many submissions from this IP address';
        END IF;
    END IF;
    
    -- Check user-based rate limiting (max 10 submissions per day for authenticated users)
    IF NEW.user_id IS NOT NULL THEN
        SELECT COUNT(*) INTO user_recent_count
        FROM public.feedback_messages
        WHERE user_id = NEW.user_id
        AND created_at > NOW() - INTERVAL '24 hours';
        
        IF user_recent_count >= 10 THEN
            RAISE EXCEPTION 'Rate limit exceeded: Too many submissions for this user';
        END IF;
    END IF;
    
    -- Check for duplicate content (same hash within 24 hours)
    IF EXISTS (
        SELECT 1 FROM public.feedback_messages 
        WHERE content_hash = NEW.content_hash 
        AND created_at > NOW() - INTERVAL '24 hours'
        AND (ip_address = NEW.ip_address OR user_id = NEW.user_id)
    ) THEN
        RAISE EXCEPTION 'Duplicate content detected: Similar feedback already submitted';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rate limiting (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'enforce_rate_limit_trigger') THEN
        CREATE TRIGGER enforce_rate_limit_trigger
            BEFORE INSERT ON public.feedback_messages
            FOR EACH ROW
            EXECUTE FUNCTION enforce_rate_limit();
    END IF;
END $$;

-- Add comments for security documentation
COMMENT ON COLUMN public.feedback_messages.ip_address IS 'Client IP address for rate limiting and abuse detection';
COMMENT ON COLUMN public.feedback_messages.submission_count IS 'Number of submissions from this user/IP';
COMMENT ON COLUMN public.feedback_messages.is_suspicious IS 'Flag for suspicious content detection';
COMMENT ON COLUMN public.feedback_messages.flagged_reason IS 'Reason why content was flagged as suspicious';
COMMENT ON COLUMN public.feedback_messages.content_hash IS 'MD5 hash of content for duplicate detection'; 