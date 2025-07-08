-- Fix Newsletter Import Duplicate Handling
-- This ensures the newsletter_subscribers table handles duplicates gracefully

-- Make sure we have a unique constraint on email (should already exist)
DO $$
BEGIN
    -- Add unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'newsletter_subscribers' 
        AND constraint_type = 'UNIQUE' 
        AND constraint_name = 'newsletter_subscribers_email_key'
    ) THEN
        ALTER TABLE newsletter_subscribers ADD CONSTRAINT newsletter_subscribers_email_key UNIQUE (email);
    END IF;
END $$;

-- Create an improved upsert function for newsletter imports
CREATE OR REPLACE FUNCTION upsert_newsletter_subscriber(
    p_email TEXT,
    p_source TEXT,
    p_scholarship_digest BOOLEAN DEFAULT true,
    p_weekly_updates BOOLEAN DEFAULT true,
    p_status TEXT DEFAULT 'active'
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    is_new BOOLEAN := false;
BEGIN
    -- Clean and validate email
    p_email := LOWER(TRIM(p_email));
    
    -- Basic email validation
    IF p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid email format'
        );
    END IF;
    
    -- Insert or update subscriber
    INSERT INTO newsletter_subscribers (
        email, 
        source, 
        scholarship_digest, 
        weekly_updates, 
        status,
        subscribed_at,
        updated_at
    ) VALUES (
        p_email,
        p_source,
        p_scholarship_digest,
        p_weekly_updates,
        p_status,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        source = CASE 
            WHEN newsletter_subscribers.source = 'manual' THEN newsletter_subscribers.source
            ELSE EXCLUDED.source
        END,
        updated_at = NOW(),
        status = CASE 
            WHEN newsletter_subscribers.status = 'unsubscribed' THEN newsletter_subscribers.status
            ELSE EXCLUDED.status
        END
    RETURNING 
        (xmax = 0) INTO is_new; -- xmax = 0 means it was an INSERT, not UPDATE
    
    RETURN jsonb_build_object(
        'success', true,
        'is_new', is_new,
        'email', p_email
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'email', p_email
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION upsert_newsletter_subscriber(TEXT, TEXT, BOOLEAN, BOOLEAN, TEXT) TO authenticated;

-- Create a batch import function that handles duplicates properly
CREATE OR REPLACE FUNCTION batch_import_newsletter_subscribers(
    p_subscribers JSONB
)
RETURNS JSONB AS $$
DECLARE
    subscriber JSONB;
    import_result JSONB;
    total_count INTEGER := 0;
    new_count INTEGER := 0;
    updated_count INTEGER := 0;
    error_count INTEGER := 0;
    errors TEXT[] := '{}';
    results JSONB := '[]'::jsonb;
BEGIN
    -- Process each subscriber
    FOR subscriber IN SELECT * FROM jsonb_array_elements(p_subscribers)
    LOOP
        total_count := total_count + 1;
        
        -- Call upsert function for each subscriber
        SELECT upsert_newsletter_subscriber(
            subscriber->>'email',
            subscriber->>'source',
            COALESCE((subscriber->>'scholarship_digest')::boolean, true),
            COALESCE((subscriber->>'weekly_updates')::boolean, true),
            COALESCE(subscriber->>'status', 'active')
        ) INTO import_result;
        
        -- Track results
        IF import_result->>'success' = 'true' THEN
            IF import_result->>'is_new' = 'true' THEN
                new_count := new_count + 1;
            ELSE
                updated_count := updated_count + 1;
            END IF;
        ELSE
            error_count := error_count + 1;
            errors := errors || (import_result->>'error');
        END IF;
        
        results := results || import_result;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'total', total_count,
        'new_subscribers', new_count,
        'updated_subscribers', updated_count,
        'errors', error_count,
        'error_details', errors,
        'results', results
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION batch_import_newsletter_subscribers(JSONB) TO authenticated;

SELECT 'Newsletter import duplicate handling fixed!' as result; 