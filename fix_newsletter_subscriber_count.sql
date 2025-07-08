-- Fix Newsletter Subscriber Count Display
-- The get_newsletter_stats function has a bug that prevents showing correct total counts

-- Drop and recreate the get_newsletter_stats function with correct logic
DROP FUNCTION IF EXISTS get_newsletter_stats();

CREATE OR REPLACE FUNCTION get_newsletter_stats()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    total_subs INTEGER;
    active_subs INTEGER;
    source_stats JSONB;
BEGIN
    -- Get basic counts
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'active')
    INTO total_subs, active_subs
    FROM newsletter_subscribers;
    
    -- Get source breakdown
    SELECT jsonb_object_agg(source, source_count)
    INTO source_stats
    FROM (
        SELECT 
            COALESCE(source, 'unknown') as source,
            COUNT(*) as source_count
        FROM newsletter_subscribers
        WHERE status = 'active'
        GROUP BY source
        ORDER BY source_count DESC
    ) source_breakdown;
    
    -- Build result
    result := jsonb_build_object(
        'total_subscribers', total_subs,
        'active_subscribers', active_subs,
        'total_by_source', COALESCE(source_stats, '{}'::jsonb),
        'engagement_stats', jsonb_build_object(
            'avg_open_rate', COALESCE((
                SELECT AVG(CASE WHEN total_emails_sent > 0 THEN total_opens::float / total_emails_sent ELSE 0 END)
                FROM newsletter_subscribers 
                WHERE total_emails_sent > 0
            ), 0),
            'avg_click_rate', COALESCE((
                SELECT AVG(CASE WHEN total_emails_sent > 0 THEN total_clicks::float / total_emails_sent ELSE 0 END)
                FROM newsletter_subscribers 
                WHERE total_emails_sent > 0
            ), 0),
            'conversion_rate', CASE 
                WHEN total_subs > 0 THEN (
                    SELECT COUNT(*)::float / total_subs
                    FROM newsletter_subscribers 
                    WHERE converted_to_user = true
                )
                ELSE 0 
            END
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_newsletter_stats() TO authenticated;

-- Test the function to make sure it works
SELECT get_newsletter_stats() as newsletter_statistics;

-- Also create a simple view for quick subscriber counts
CREATE OR REPLACE VIEW newsletter_subscriber_summary AS
SELECT 
    COUNT(*) as total_subscribers,
    COUNT(*) FILTER (WHERE status = 'active') as active_subscribers,
    COUNT(*) FILTER (WHERE status = 'unsubscribed') as unsubscribed_count,
    COUNT(*) FILTER (WHERE scholarship_digest = true) as digest_subscribers,
    COUNT(DISTINCT source) as total_sources,
    MAX(subscribed_at) as latest_subscription,
    MIN(subscribed_at) as first_subscription
FROM newsletter_subscribers;

-- Grant access to the view
GRANT SELECT ON newsletter_subscriber_summary TO authenticated;

SELECT 'Newsletter subscriber count display fixed!' as result; 