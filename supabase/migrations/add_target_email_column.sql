-- Add target_email column to learner_access table for email-based sharing
ALTER TABLE learner_access 
ADD COLUMN target_email TEXT;

-- Add index for performance on target_email lookups
CREATE INDEX IF NOT EXISTS idx_learner_access_target_email 
ON learner_access(target_email);

-- Add index for share_code + target_email lookups (used during code claiming)
CREATE INDEX IF NOT EXISTS idx_learner_access_share_code_target_email 
ON learner_access(share_code, target_email);