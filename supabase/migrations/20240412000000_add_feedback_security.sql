-- Add security columns to feedback_messages table
ALTER TABLE public.feedback_messages 
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS submission_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_suspicious BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS flagged_reason TEXT,
ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Create index for rate limiting
CREATE INDEX IF NOT EXISTS idx_feedback_messages_ip_created ON public.feedback_messages(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_messages_user_created ON public.feedback_messages(user_id, created_at);

-- Add constraints for security
ALTER TABLE public.feedback_messages 
ADD CONSTRAINT feedback_messages_subject_length CHECK (char_length(subject) >= 3 AND char_length(subject) <= 100),
ADD CONSTRAINT feedback_messages_message_length CHECK (char_length(message) >= 10 AND char_length(message) <= 1000),
ADD CONSTRAINT feedback_messages_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

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

-- Create trigger for suspicious content detection
CREATE TRIGGER check_suspicious_content_trigger
    BEFORE INSERT ON public.feedback_messages
    FOR EACH ROW
    EXECUTE FUNCTION check_suspicious_content();

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

-- Create trigger for rate limiting
CREATE TRIGGER enforce_rate_limit_trigger
    BEFORE INSERT ON public.feedback_messages
    FOR EACH ROW
    EXECUTE FUNCTION enforce_rate_limit();

-- Create function to get client IP address
CREATE OR REPLACE FUNCTION get_client_ip()
RETURNS INET AS $$
BEGIN
    -- This will be set by your application
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add comments for security documentation
COMMENT ON COLUMN public.feedback_messages.ip_address IS 'Client IP address for rate limiting and abuse detection';
COMMENT ON COLUMN public.feedback_messages.submission_count IS 'Number of submissions from this user/IP';
COMMENT ON COLUMN public.feedback_messages.is_suspicious IS 'Flag for suspicious content detection';
COMMENT ON COLUMN public.feedback_messages.flagged_reason IS 'Reason why content was flagged as suspicious';
COMMENT ON COLUMN public.feedback_messages.content_hash IS 'MD5 hash of content for duplicate detection'; 