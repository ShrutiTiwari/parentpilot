-- Create school_authorizations table
CREATE TABLE school_authorizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    school_id UUID REFERENCES schools(id),
    school_code TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, school_id)
);

-- Add RLS policies
ALTER TABLE school_authorizations ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own authorizations
CREATE POLICY "Users can view their own authorizations"
    ON school_authorizations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy to allow users to create their own authorizations
CREATE POLICY "Users can create their own authorizations"
    ON school_authorizations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own authorizations
CREATE POLICY "Users can delete their own authorizations"
    ON school_authorizations
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_school_authorizations_updated_at
    BEFORE UPDATE ON school_authorizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 