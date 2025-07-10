-- Email Templates for Registered Users
-- These are different from imported leads - more personalized and feature-focused

-- 1. Welcome Series for New Registered Users
INSERT INTO email_templates (
    name,
    subject,
    content,
    template_type,
    is_active,
    created_at
) VALUES 
(
    'Welcome Series - New User',
    'Welcome to Abroaducate! Your Study Abroad Journey Starts Here 🎓',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Abroaducate</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to Abroaducate!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your study abroad journey starts now</p>
    </div>

    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #2c3e50; margin-top: 0;">Hi {{user_name}},</h2>
        <p>Thank you for joining Abroaducate! You''ve just taken the first step toward your international education dreams.</p>
    </div>

    <div style="margin-bottom: 25px;">
        <h3 style="color: #2c3e50;">🚀 Get Started with These Features:</h3>
        
        <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 15px; background: white;">
            <h4 style="color: #667eea; margin-top: 0;">✍️ Statement of Purpose Generator</h4>
            <p>Create compelling SOPs tailored to your target universities with AI assistance.</p>
            <a href="{{base_url}}/submit-sop" style="color: #667eea; text-decoration: none; font-weight: bold;">Start Writing →</a>
        </div>

        <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 15px; background: white;">
            <h4 style="color: #667eea; margin-top: 0;">🎓 Scholarship Database</h4>
            <p>Access thousands of scholarships and get weekly updates on new opportunities.</p>
            <a href="{{base_url}}/scholarships" style="color: #667eea; text-decoration: none; font-weight: bold;">Browse Scholarships →</a>
        </div>

        <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 15px; background: white;">
            <h4 style="color: #667eea; margin-top: 0;">🏫 University Matching</h4>
            <p>Find universities that match your profile and career goals.</p>
            <a href="{{base_url}}/universities" style="color: #667eea; text-decoration: none; font-weight: bold;">Find Universities →</a>
        </div>
    </div>

    <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3 style="color: #2c3e50; margin-top: 0;">💡 Pro Tip</h3>
        <p>Complete your profile to get personalized recommendations and scholarship matches!</p>
        <div style="text-align: center; margin-top: 15px;">
            <a href="{{base_url}}/account" style="background: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Complete Profile</a>
        </div>
    </div>

    <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
        <p>Need help? Reply to this email or contact our support team.</p>
        <p>
            <a href="{{base_url}}/dashboard" style="color: #667eea;">Visit Dashboard</a> | 
            <a href="{{unsubscribe_link}}" style="color: #667eea;">Unsubscribe</a>
        </p>
    </div>

</body>
</html>',
    'welcome_series',
    true,
    NOW()
),

-- 2. Monthly Feature Updates for Registered Users
(
    'Monthly Feature Updates',
    'New Features This Month: {{month_year}} 🚀',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monthly Feature Updates</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 28px;">🆕 What''s New at Abroaducate</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">{{month_year}} Feature Updates</p>
    </div>

    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #2c3e50; margin-top: 0;">Hi {{user_name}},</h2>
        <p>We''ve been busy improving your study abroad experience. Here''s what''s new this month!</p>
    </div>

    {{#each features}}
    <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: white;">
        <h3 style="color: #2c3e50; margin-top: 0;">{{icon}} {{title}}</h3>
        <p style="margin: 10px 0;">{{description}}</p>
        <div style="text-align: center; margin-top: 15px;">
            <a href="{{link}}" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 20px; font-weight: bold; display: inline-block;">Try It Now</a>
        </div>
    </div>
    {{/each}}

    <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3 style="color: #856404; margin-top: 0;">🎯 Coming Next Month</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Enhanced IELTS practice tests</li>
            <li>Video interview preparation</li>
            <li>More scholarship partnerships</li>
        </ul>
    </div>

    <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3 style="color: #2c3e50; margin-top: 0;">📊 Your Progress</h3>
        <p>You''ve been making great progress on your study abroad journey:</p>
        <ul style="margin: 10px 0; padding-left: 20px;">
            <li>{{sop_count}} Statements of Purpose created</li>
            <li>{{scholarship_applications}} Scholarship applications tracked</li>
            <li>{{university_matches}} Universities matched to your profile</li>
        </ul>
        <div style="text-align: center; margin-top: 15px;">
            <a href="{{base_url}}/dashboard" style="background: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">View Dashboard</a>
        </div>
    </div>

    <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
        <p>Have feedback about our new features? We''d love to hear from you!</p>
        <p>
            <a href="{{base_url}}/contact" style="color: #667eea;">Contact Support</a> | 
            <a href="{{unsubscribe_link}}" style="color: #667eea;">Unsubscribe</a>
        </p>
    </div>

</body>
</html>',
    'feature_updates',
    true,
    NOW()
),

-- 3. Premium Upgrade Campaign for Free Users
(
    'Premium Upgrade Campaign',
    'Unlock Your Full Study Abroad Potential with Premium 🌟',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Upgrade to Premium</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 28px;">🌟 Ready for Premium?</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Unlock advanced features to boost your applications</p>
    </div>

    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #2c3e50; margin-top: 0;">Hi {{user_name}},</h2>
        <p>You''ve been making great progress with Abroaducate! Ready to take your applications to the next level?</p>
    </div>

    <div style="margin-bottom: 25px;">
        <h3 style="color: #2c3e50;">🚀 What You Get with Premium:</h3>
        
        <div style="border: 2px solid #f5576c; border-radius: 8px; padding: 20px; margin-bottom: 15px; background: white;">
            <h4 style="color: #f5576c; margin-top: 0;">✍️ Unlimited SOP Generations</h4>
            <p>Create as many Statements of Purpose as you need - no limits!</p>
        </div>

        <div style="border: 2px solid #f5576c; border-radius: 8px; padding: 20px; margin-bottom: 15px; background: white;">
            <h4 style="color: #f5576c; margin-top: 0;">🎯 Advanced University Matching</h4>
            <p>Get detailed compatibility scores and admission probability analysis.</p>
        </div>

        <div style="border: 2px solid #f5576c; border-radius: 8px; padding: 20px; margin-bottom: 15px; background: white;">
            <h4 style="color: #f5576c; margin-top: 0;">📝 Professional Review Service</h4>
            <p>Get your documents reviewed by study abroad experts.</p>
        </div>

        <div style="border: 2px solid #f5576c; border-radius: 8px; padding: 20px; margin-bottom: 15px; background: white;">
            <h4 style="color: #f5576c; margin-top: 0;">🎓 Priority Scholarship Matching</h4>
            <p>Get matched to scholarships before they''re public.</p>
        </div>
    </div>

    <div style="background: #fff8e1; border: 2px solid #ffcc02; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
        <h3 style="color: #f57f17; margin-top: 0;">🎉 Limited Time Offer</h3>
        <p style="font-size: 18px; font-weight: bold; color: #2c3e50;">Get 30% OFF your first month!</p>
        <p style="font-size: 14px; color: #666;">Use code: <strong>UPGRADE30</strong></p>
        <div style="margin-top: 20px;">
            <a href="{{base_url}}/pricing?promo=UPGRADE30" style="background: #f5576c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block;">Upgrade Now</a>
        </div>
    </div>

    <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3 style="color: #2c3e50; margin-top: 0;">💭 What Our Premium Users Say</h3>
        <blockquote style="border-left: 4px solid #667eea; padding-left: 15px; margin: 15px 0; font-style: italic; color: #555;">
            "The unlimited SOP generations helped me tailor my applications perfectly. Got accepted to my dream university!"
        </blockquote>
        <p style="text-align: right; margin: 0; font-size: 14px; color: #666;">- Sarah M., Premium User</p>
    </div>

    <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
        <p>Questions about Premium? We''re here to help!</p>
        <p>
            <a href="{{base_url}}/contact" style="color: #667eea;">Contact Support</a> | 
            <a href="{{unsubscribe_link}}" style="color: #667eea;">Unsubscribe</a>
        </p>
    </div>

</body>
</html>',
    'premium_upgrade',
    true,
    NOW()
),

-- 4. Re-engagement Campaign for Inactive Users
(
    'Re-engagement Campaign',
    'We Miss You! Come Back and Continue Your Journey 🎯',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>We Miss You</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 28px;">🎯 Don''t Give Up!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your study abroad dreams are still within reach</p>
    </div>

    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #2c3e50; margin-top: 0;">Hi {{user_name}},</h2>
        <p>We noticed you haven''t visited Abroaducate in a while. Your study abroad journey is important to us, and we''re here to help you succeed!</p>
    </div>

    <div style="margin-bottom: 25px;">
        <h3 style="color: #2c3e50;">🚀 What''s New Since Your Last Visit:</h3>
        
        <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 15px; background: white;">
            <h4 style="color: #667eea; margin-top: 0;">🆕 New Scholarships Added</h4>
            <p>{{new_scholarships_count}} new scholarships have been added to our database!</p>
        </div>

        <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 15px; background: white;">
            <h4 style="color: #667eea; margin-top: 0;">🏫 University Database Expanded</h4>
            <p>More universities and programs to explore for your perfect match.</p>
        </div>

        <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 15px; background: white;">
            <h4 style="color: #667eea; margin-top: 0;">✨ Improved AI Tools</h4>
            <p>Our SOP generator and review tools are now even smarter!</p>
        </div>
    </div>

    <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
        <h3 style="color: #2c3e50; margin-top: 0;">🎁 Welcome Back Offer</h3>
        <p>As a welcome back gift, enjoy <strong>free access to premium features</strong> for the next 7 days!</p>
        <div style="margin-top: 20px;">
            <a href="{{base_url}}/dashboard?welcome_back=true" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block;">Continue Your Journey</a>
        </div>
    </div>

    <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3 style="color: #856404; margin-top: 0;">⏰ Upcoming Deadlines</h3>
        <p>Don''t miss these important dates:</p>
        <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Spring 2024 applications: Many deadlines approaching</li>
            <li>Scholarship applications: New opportunities weekly</li>
            <li>IELTS/TOEFL prep: Start early for better scores</li>
        </ul>
    </div>

    <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
        <p>Need help getting back on track? Our support team is here for you!</p>
        <p>
            <a href="{{base_url}}/contact" style="color: #667eea;">Get Help</a> | 
            <a href="{{unsubscribe_link}}" style="color: #667eea;">Unsubscribe</a>
        </p>
    </div>

</body>
</html>',
    'reengagement',
    true,
    NOW()
)

ON CONFLICT (name) DO UPDATE SET
    content = EXCLUDED.content,
    template_type = EXCLUDED.template_type,
    updated_at = NOW();

-- Function to create user campaigns
CREATE OR REPLACE FUNCTION create_user_campaign(
    campaign_type TEXT DEFAULT 'feature_updates',
    target_segment TEXT DEFAULT 'registered_user'
)
RETURNS TEXT AS $$
DECLARE
    campaign_id UUID;
    template_name TEXT;
    campaign_subject TEXT;
    campaign_content TEXT;
BEGIN
    -- Generate campaign ID
    campaign_id := gen_random_uuid();
    
    -- Select template based on campaign type
    CASE campaign_type
        WHEN 'welcome' THEN
            template_name := 'Welcome Series - New User';
        WHEN 'feature_updates' THEN
            template_name := 'Monthly Feature Updates';
        WHEN 'premium_upgrade' THEN
            template_name := 'Premium Upgrade Campaign';
        WHEN 'reengagement' THEN
            template_name := 'Re-engagement Campaign';
        ELSE
            template_name := 'Monthly Feature Updates';
    END CASE;
    
    -- Get template content
    SELECT subject, content INTO campaign_subject, campaign_content
    FROM email_templates 
    WHERE name = template_name;
    
    -- Create campaign
    INSERT INTO email_campaigns (
        id,
        name,
        subject,
        content,
        target_segment,
        status,
        created_at
    )
    VALUES (
        campaign_id,
        'User Campaign: ' || template_name,
        campaign_subject,
        campaign_content,
        target_segment,
        'draft',
        NOW()
    );
    
    -- Add registered users as recipients
    INSERT INTO campaign_recipients (
        campaign_id,
        email,
        segment,
        created_at
    )
    SELECT 
        campaign_id,
        email,
        'registered_user',
        NOW()
    FROM newsletter_subscribers 
    WHERE segment = 'user_registration' 
    AND is_active = true;
    
    RETURN 'Campaign created successfully with ID: ' || campaign_id;
END;
$$ LANGUAGE plpgsql; 