-- =============================================
-- ENHANCED NEWSLETTER IMPORT API
-- Supports the 8000 email segmentation strategy
-- =============================================

-- Function: Batch import with proper segmentation
CREATE OR REPLACE FUNCTION batch_import_newsletter_subscribers_segmented(
    p_emails JSONB, -- Array of email objects: [{"email": "test@example.com", "name": "optional"}]
    p_source VARCHAR(100),
    p_segment VARCHAR(50) DEFAULT 'imported_lead',
    p_batch_name VARCHAR(100) DEFAULT NULL,
    p_content_preferences JSONB DEFAULT '{"scholarships": true, "study_tips": true, "announcements": false}'::jsonb
)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result JSONB;
    batch_id VARCHAR(100);
    email_record JSONB;
    processed_count INTEGER := 0;
    success_count INTEGER := 0;
    duplicate_count INTEGER := 0;
    invalid_count INTEGER := 0;
    error_messages TEXT[] := ARRAY[]::TEXT[];
    subscriber_result JSONB;
BEGIN
    -- Generate batch ID
    batch_id := COALESCE(
        p_batch_name, 
        p_source || '_' || to_char(NOW(), 'YYYY_MM_DD_HH24_MI_SS')
    );
    
    -- Validate input
    IF p_emails IS NULL OR jsonb_array_length(p_emails) = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Email array is required and cannot be empty'
        );
    END IF;
    
    IF jsonb_array_length(p_emails) > 10000 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Maximum 10,000 emails per batch import'
        );
    END IF;
    
    -- Process each email
    FOR email_record IN SELECT * FROM jsonb_array_elements(p_emails)
    LOOP
        processed_count := processed_count + 1;
        
        -- Extract email from the JSON object
        IF email_record ? 'email' THEN
            SELECT add_segmented_newsletter_subscriber(
                (email_record->>'email')::VARCHAR(255),
                p_source,
                p_segment,
                batch_id,
                p_content_preferences
            ) INTO subscriber_result;
            
            IF (subscriber_result->>'success')::boolean THEN
                IF (subscriber_result->>'is_new_subscriber')::boolean THEN
                    success_count := success_count + 1;
                ELSE
                    duplicate_count := duplicate_count + 1;
                END IF;
            ELSE
                invalid_count := invalid_count + 1;
                error_messages := array_append(error_messages, 
                    (email_record->>'email') || ': ' || (subscriber_result->>'error')
                );
            END IF;
        ELSE
            invalid_count := invalid_count + 1;
            error_messages := array_append(error_messages, 'Missing email field in record');
        END IF;
        
        -- Prevent infinite loops
        IF processed_count > 10000 THEN
            EXIT;
        END IF;
    END LOOP;
    
    -- Return comprehensive results
    result := jsonb_build_object(
        'success', true,
        'batch_id', batch_id,
        'summary', jsonb_build_object(
            'total_processed', processed_count,
            'successfully_imported', success_count,
            'duplicates_skipped', duplicate_count,
            'invalid_emails', invalid_count,
            'error_count', array_length(error_messages, 1)
        ),
        'details', jsonb_build_object(
            'source', p_source,
            'segment', p_segment,
            'batch_name', batch_id,
            'import_timestamp', NOW()
        )
    );
    
    -- Include errors if not too many
    IF array_length(error_messages, 1) <= 20 THEN
        result := result || jsonb_build_object('errors', error_messages);
    ELSE
        result := result || jsonb_build_object(
            'errors', error_messages[1:20],
            'additional_errors', array_length(error_messages, 1) - 20
        );
    END IF;
    
    RETURN result;
END;
$$;

-- Function: Get import batch statistics
CREATE OR REPLACE FUNCTION get_import_batch_stats(p_batch_id VARCHAR(100) DEFAULT NULL)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result JSONB;
BEGIN
    IF p_batch_id IS NOT NULL THEN
        -- Get specific batch stats
        SELECT jsonb_build_object(
            'batch_id', p_batch_id,
            'total_emails', COUNT(*),
            'active_emails', COUNT(*) FILTER (WHERE status = 'active'),
            'unsubscribed', COUNT(*) FILTER (WHERE status = 'unsubscribed'),
            'converted_users', COUNT(*) FILTER (WHERE converted_to_user = true),
            'avg_engagement', COALESCE(AVG(engagement_score), 0),
            'import_date', MIN(subscribed_at),
            'source', MAX(source),
            'segment', MAX(email_segment),
            'performance', jsonb_build_object(
                'conversion_rate', ROUND(
                    (COUNT(*) FILTER (WHERE converted_to_user = true)::DECIMAL / COUNT(*) * 100), 2
                ),
                'unsubscribe_rate', ROUND(
                    (COUNT(*) FILTER (WHERE status = 'unsubscribed')::DECIMAL / COUNT(*) * 100), 2
                ),
                'engagement_rate', ROUND(
                    (COUNT(*) FILTER (WHERE engagement_score > 3)::DECIMAL / COUNT(*) * 100), 2
                )
            )
        ) INTO result
        FROM newsletter_subscribers
        WHERE import_batch_id = p_batch_id;
    ELSE
        -- Get all batch summaries
        SELECT jsonb_agg(
            jsonb_build_object(
                'batch_id', import_batch_id,
                'total_emails', total_imported,
                'active_emails', still_active,
                'converted_users', converted,
                'unsubscribed', unsubscribed,
                'conversion_rate', conversion_rate_percent,
                'unsubscribe_rate', unsubscribe_rate_percent,
                'import_date', import_date,
                'source', source
            )
        ) INTO result
        FROM newsletter_import_performance
        WHERE import_batch_id IS NOT NULL;
    END IF;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Function: Smart email content recommendations
CREATE OR REPLACE FUNCTION get_email_content_recommendations(
    p_segment VARCHAR(50) DEFAULT 'imported_lead',
    p_days_since_import INTEGER DEFAULT 0
)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    content_recs JSONB := '[]'::jsonb;
    welcome_series JSONB;
    ongoing_content JSONB;
BEGIN
    -- Welcome series for new imports (first 30 days)
    IF p_days_since_import <= 30 THEN
        welcome_series := jsonb_build_array(
            jsonb_build_object(
                'type', 'welcome_email',
                'send_after_days', 0,
                'subject', 'Welcome to Abroaducate - Your Scholarship Journey Starts Here',
                'priority', 10,
                'content_type', 'introduction'
            ),
            jsonb_build_object(
                'type', 'scholarship_digest',
                'send_after_days', 3,
                'subject', '🎓 This Week''s Top Scholarship Opportunities',
                'priority', 9,
                'content_type', 'scholarships'
            ),
            jsonb_build_object(
                'type', 'study_tips',
                'send_after_days', 7,
                'subject', '📚 5 Essential Tips for Scholarship Applications',
                'priority', 7,
                'content_type', 'educational'
            ),
            jsonb_build_object(
                'type', 'platform_intro',
                'send_after_days', 14,
                'subject', '🚀 Introducing Abroaducate - Your AI Study Abroad Assistant',
                'priority', 8,
                'content_type', 'conversion'
            )
        );
        content_recs := content_recs || welcome_series;
    END IF;
    
    -- Ongoing content based on segment
    ongoing_content := jsonb_build_array();
    
    CASE p_segment
        WHEN 'imported_lead' THEN
            ongoing_content := jsonb_build_array(
                jsonb_build_object(
                    'type', 'weekly_scholarships',
                    'frequency', 'weekly',
                    'subject_template', '🎓 {{scholarship_count}} New Scholarships This Week',
                    'priority', 8,
                    'content_focus', 'general_scholarships'
                ),
                jsonb_build_object(
                    'type', 'monthly_tips',
                    'frequency', 'monthly',
                    'subject_template', '📖 Study Abroad Success Stories & Tips',
                    'priority', 6,
                    'content_focus', 'educational_content'
                ),
                jsonb_build_object(
                    'type', 'conversion_campaign',
                    'frequency', 'monthly',
                    'subject_template', '🎯 Unlock Personalized Scholarship Matching',
                    'priority', 7,
                    'content_focus', 'platform_benefits'
                )
            );
            
        WHEN 'website_signup' THEN
            ongoing_content := jsonb_build_array(
                jsonb_build_object(
                    'type', 'enhanced_digest',
                    'frequency', 'weekly',
                    'subject_template', '✨ Premium Scholarship Digest - {{scholarship_count}} Opportunities',
                    'priority', 9,
                    'content_focus', 'curated_scholarships'
                )
            );
            
        WHEN 'user_registration' THEN
            ongoing_content := jsonb_build_array(
                jsonb_build_object(
                    'type', 'personalized_digest',
                    'frequency', 'weekly',
                    'subject_template', '🎯 Scholarships Matched to Your Profile',
                    'priority', 10,
                    'content_focus', 'personalized_content'
                )
            );
    END CASE;
    
    content_recs := content_recs || ongoing_content;
    
    RETURN jsonb_build_object(
        'segment', p_segment,
        'days_since_import', p_days_since_import,
        'recommendations', content_recs,
        'next_review_date', (NOW() + INTERVAL '7 days')::date
    );
END;
$$;

-- Function: Calculate engagement scores
CREATE OR REPLACE FUNCTION update_engagement_scores()
RETURNS INTEGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    -- Update engagement scores based on email interactions
    UPDATE newsletter_subscribers 
    SET 
        engagement_score = GREATEST(0, LEAST(10, 
            -- Base score from email opens (0-4 points)
            COALESCE(LEAST(total_opens * 0.5, 4), 0) +
            -- Bonus for recent opens (0-2 points)
            CASE WHEN last_opened > NOW() - INTERVAL '30 days' THEN 2 ELSE 0 END +
            -- Score from clicks (0-3 points)
            COALESCE(LEAST(total_clicks * 1.0, 3), 0) +
            -- Penalty for long inactivity (-2 points)
            CASE WHEN last_email_sent < NOW() - INTERVAL '90 days' THEN -2 ELSE 0 END +
            -- Bonus for being subscribed long-term (0-1 point)
            CASE WHEN subscribed_at < NOW() - INTERVAL '6 months' THEN 1 ELSE 0 END
        )),
        conversion_likelihood = CASE 
            WHEN engagement_score >= 7 THEN 'high'
            WHEN engagement_score >= 4 THEN 'medium'
            WHEN engagement_score >= 1 THEN 'low'
            ELSE 'unknown'
        END,
        updated_at = NOW()
    WHERE status = 'active';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;

-- Function: Get segmentation dashboard data
CREATE OR REPLACE FUNCTION get_newsletter_dashboard_segmented()
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result JSONB;
    segment_data JSONB;
    performance_data JSONB;
    recent_activity JSONB;
BEGIN
    -- Get segment breakdown
    SELECT jsonb_object_agg(
        email_segment,
        jsonb_build_object(
            'total', segment_count,
            'active', active_count,
            'converted', converted_count,
            'avg_engagement', avg_engagement_score
        )
    ) INTO segment_data
    FROM (
        SELECT 
            COALESCE(email_segment, 'unknown') as email_segment,
            COUNT(*) as segment_count,
            COUNT(*) FILTER (WHERE status = 'active') as active_count,
            COUNT(*) FILTER (WHERE converted_to_user = true) as converted_count,
            ROUND(AVG(engagement_score), 2) as avg_engagement_score
        FROM newsletter_subscribers
        GROUP BY email_segment
    ) segment_stats;
    
    -- Get recent import performance
    SELECT jsonb_agg(
        jsonb_build_object(
            'batch_id', import_batch_id,
            'source', source,
            'imported_count', total_imported,
            'conversion_rate', conversion_rate_percent,
            'import_date', import_date
        )
    ) INTO performance_data
    FROM newsletter_import_performance
    WHERE import_date > NOW() - INTERVAL '30 days'
    ORDER BY import_date DESC
    LIMIT 10;
    
    -- Get recent engagement activity
    SELECT jsonb_agg(
        jsonb_build_object(
            'date', activity_date,
            'opens', email_opens,
            'clicks', email_clicks,
            'unsubscribes', unsubscribes
        )
    ) INTO recent_activity
    FROM (
        SELECT 
            DATE(occurred_at) as activity_date,
            COUNT(*) FILTER (WHERE event_type = 'email_opened') as email_opens,
            COUNT(*) FILTER (WHERE event_type = 'link_clicked') as email_clicks,
            COUNT(*) FILTER (WHERE event_type = 'unsubscribed') as unsubscribes
        FROM newsletter_engagement_events
        WHERE occurred_at > NOW() - INTERVAL '7 days'
        GROUP BY DATE(occurred_at)
        ORDER BY activity_date DESC
    ) daily_activity;
    
    -- Combine all data
    result := jsonb_build_object(
        'segments', COALESCE(segment_data, '{}'::jsonb),
        'recent_imports', COALESCE(performance_data, '[]'::jsonb),
        'recent_activity', COALESCE(recent_activity, '[]'::jsonb),
        'summary', jsonb_build_object(
            'total_subscribers', (SELECT COUNT(*) FROM newsletter_subscribers),
            'active_subscribers', (SELECT COUNT(*) FROM newsletter_subscribers WHERE status = 'active'),
            'imported_leads', (SELECT COUNT(*) FROM newsletter_subscribers WHERE email_segment = 'imported_lead'),
            'converted_users', (SELECT COUNT(*) FROM newsletter_subscribers WHERE converted_to_user = true),
            'avg_engagement', (SELECT ROUND(AVG(engagement_score), 2) FROM newsletter_subscribers WHERE status = 'active')
        ),
        'last_updated', NOW()
    );
    
    RETURN result;
END;
$$;

-- Grant permissions for enhanced functions
GRANT EXECUTE ON FUNCTION batch_import_newsletter_subscribers_segmented(JSONB, VARCHAR, VARCHAR, VARCHAR, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_import_batch_stats(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_email_content_recommendations(VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_engagement_scores() TO authenticated;
GRANT EXECUTE ON FUNCTION get_newsletter_dashboard_segmented() TO authenticated;

-- =============================================
-- ENHANCED IMPORT API COMPLETE
-- =============================================

COMMENT ON FUNCTION batch_import_newsletter_subscribers_segmented IS 'Enhanced import function supporting proper segmentation for the 8000 email strategy';
COMMENT ON FUNCTION get_import_batch_stats IS 'Provides detailed analytics for import batches to track performance';
COMMENT ON FUNCTION get_email_content_recommendations IS 'Smart content recommendations based on subscriber segment and lifecycle stage';
COMMENT ON FUNCTION update_engagement_scores IS 'Calculates engagement scores for all active subscribers';
COMMENT ON FUNCTION get_newsletter_dashboard_segmented IS 'Comprehensive dashboard data for segmented newsletter management'; 