-- Weekly Scholarship Automation for Imported Leads
-- This will automatically send weekly scholarship updates to your imported email list

-- 1. Create function to get latest scholarships for email
CREATE OR REPLACE FUNCTION get_weekly_scholarships_for_email()
RETURNS JSON AS $$
DECLARE
    scholarship_data JSON;
BEGIN
    -- Get scholarships added or updated in the last week
    SELECT json_agg(
        json_build_object(
            'title', title,
            'description', description,
            'amount', amount,
            'deadline', deadline,
            'university', university,
            'country', country,
            'level', level,
            'eligibility', eligibility,
            'application_link', application_link
        )
    )
    INTO scholarship_data
    FROM scholarships 
    WHERE (
        created_at >= NOW() - INTERVAL '7 days' 
        OR updated_at >= NOW() - INTERVAL '7 days'
    )
    AND is_active = true
    ORDER BY created_at DESC
    LIMIT 10;

    -- If no new scholarships this week, get 10 most recent active ones
    IF scholarship_data IS NULL THEN
        SELECT json_agg(
            json_build_object(
                'title', title,
                'description', description,
                'amount', amount,
                'deadline', deadline,
                'university', university,
                'country', country,
                'level', level,
                'eligibility', eligibility,
                'application_link', application_link
            )
        )
        INTO scholarship_data
        FROM scholarships 
        WHERE is_active = true
        AND deadline > NOW()
        ORDER BY deadline ASC
        LIMIT 10;
    END IF;

    RETURN scholarship_data;
END;
$$ LANGUAGE plpgsql;

-- 2. Create automated weekly scholarship campaign template
INSERT INTO email_templates (
    name,
    subject,
    content,
    template_type,
    is_active,
    created_at
) VALUES (
    'Weekly Scholarship Digest - Auto',
    'This Week''s Scholarship Opportunities - {{week_date}}',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weekly Scholarship Digest</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 28px;">🎓 Weekly Scholarship Digest</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">{{week_date}}</p>
    </div>

    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #2c3e50; margin-top: 0;">📚 This Week''s Opportunities</h2>
        <p>We''ve curated the latest scholarship opportunities just for you. Don''t miss these chances to fund your study abroad dreams!</p>
    </div>

    {{#each scholarships}}
    <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: white;">
        <h3 style="color: #2c3e50; margin-top: 0; font-size: 20px;">{{title}}</h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0;">
            <div>
                <strong style="color: #667eea;">💰 Amount:</strong> {{amount}}
            </div>
            <div>
                <strong style="color: #667eea;">📅 Deadline:</strong> {{deadline}}
            </div>
            <div>
                <strong style="color: #667eea;">🏫 University:</strong> {{university}}
            </div>
            <div>
                <strong style="color: #667eea;">🌍 Country:</strong> {{country}}
            </div>
        </div>

        <p style="margin: 15px 0;"><strong>Description:</strong> {{description}}</p>
        
        <div style="background: #f1f3f4; padding: 10px; border-radius: 5px; margin: 10px 0;">
            <strong>Eligibility:</strong> {{eligibility}}
        </div>

        <div style="text-align: center; margin-top: 20px;">
            <a href="{{application_link}}" style="background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Apply Now</a>
        </div>
    </div>
    {{/each}}

    <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3 style="color: #2c3e50; margin-top: 0;">🚀 Ready to Apply?</h3>
        <p>Need help with your application? Our platform offers:</p>
        <ul style="margin: 10px 0;">
            <li>✅ Statement of Purpose writing assistance</li>
            <li>✅ CV/Resume optimization</li>
            <li>✅ University matching</li>
            <li>✅ Application tracking</li>
        </ul>
        <div style="text-align: center; margin-top: 20px;">
            <a href="https://abroaducate.com/register" style="background: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Get Started Free</a>
        </div>
    </div>

    <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
        <p>You received this email because you subscribed to scholarship updates from Abroaducate.</p>
        <p>
            <a href="{{unsubscribe_link}}" style="color: #667eea;">Unsubscribe</a> | 
            <a href="https://abroaducate.com" style="color: #667eea;">Visit Website</a>
        </p>
    </div>

</body>
</html>',
    'scholarship_digest_auto',
    true,
    NOW()
) ON CONFLICT (name) DO UPDATE SET
    content = EXCLUDED.content,
    updated_at = NOW();

-- 3. Create function to automatically create weekly scholarship campaigns
CREATE OR REPLACE FUNCTION create_weekly_scholarship_campaign()
RETURNS VOID AS $$
DECLARE
    campaign_id UUID;
    scholarship_data JSON;
    current_week TEXT;
BEGIN
    -- Get scholarships for this week
    SELECT get_weekly_scholarships_for_email() INTO scholarship_data;
    
    -- Skip if no scholarships available
    IF scholarship_data IS NULL OR json_array_length(scholarship_data) = 0 THEN
        RETURN;
    END IF;

    -- Format current week date
    SELECT to_char(NOW(), 'Week of Mon DD, YYYY') INTO current_week;

    -- Create campaign
    INSERT INTO email_campaigns (
        id,
        name,
        subject,
        content,
        target_segment,
        status,
        scheduled_at,
        created_at
    )
    VALUES (
        gen_random_uuid(),
        'Auto: Weekly Scholarship Digest - ' || current_week,
        'This Week''s Scholarship Opportunities - ' || current_week,
        replace(
            replace(
                (SELECT content FROM email_templates WHERE name = 'Weekly Scholarship Digest - Auto'),
                '{{week_date}}', current_week
            ),
            '{{scholarships}}', scholarship_data::text
        ),
        'imported_lead',
        'scheduled',
        NOW() + INTERVAL '1 hour', -- Send 1 hour from now
        NOW()
    )
    RETURNING id INTO campaign_id;

    -- Add all imported leads as recipients
    INSERT INTO campaign_recipients (
        campaign_id,
        email,
        segment,
        created_at
    )
    SELECT 
        campaign_id,
        email,
        'imported_lead',
        NOW()
    FROM newsletter_subscribers 
    WHERE segment = 'imported_lead' 
    AND is_active = true;

END;
$$ LANGUAGE plpgsql;

-- 4. Create function to check if weekly campaign should be created
CREATE OR REPLACE FUNCTION should_create_weekly_campaign()
RETURNS BOOLEAN AS $$
DECLARE
    last_campaign_date DATE;
    current_date DATE;
BEGIN
    -- Get current date
    SELECT CURRENT_DATE INTO current_date;
    
    -- Get the date of the last weekly scholarship campaign
    SELECT DATE(created_at) INTO last_campaign_date
    FROM email_campaigns 
    WHERE name LIKE 'Auto: Weekly Scholarship Digest%'
    ORDER BY created_at DESC 
    LIMIT 1;

    -- If no previous campaign or it's been 7+ days, create new one
    IF last_campaign_date IS NULL OR (current_date - last_campaign_date) >= 7 THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 5. Main function to run weekly (call this from a cron job)
CREATE OR REPLACE FUNCTION run_weekly_scholarship_automation()
RETURNS TEXT AS $$
BEGIN
    -- Check if we should create a new campaign
    IF should_create_weekly_campaign() THEN
        -- Create the campaign
        PERFORM create_weekly_scholarship_campaign();
        RETURN 'Weekly scholarship campaign created successfully';
    ELSE
        RETURN 'Weekly campaign already exists for this week';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Instructions for setting up automation:
-- 
-- OPTION 1: Manual trigger (for testing)
-- SELECT run_weekly_scholarship_automation();
--
-- OPTION 2: Set up cron job in your deployment to run this weekly:
-- Call this API endpoint: POST /api/cron/weekly-scholarships
-- Schedule: Every Monday at 9 AM
--
-- OPTION 3: Use pg_cron extension (if available on your Supabase plan):
-- SELECT cron.schedule('weekly-scholarships', '0 9 * * 1', 'SELECT run_weekly_scholarship_automation();'); 