-- Simple Auth Restore - December 2024

REVOKE ALL ON user_usage FROM anon;
DROP FUNCTION IF EXISTS increment_usage CASCADE;

CREATE OR REPLACE FUNCTION increment_usage(
    user_uuid UUID,
    usage_type TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    IF user_uuid != auth.uid() THEN
        RETURN FALSE;
    END IF;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_usage TO authenticated;

SELECT 'Auth Fixed' as status; 