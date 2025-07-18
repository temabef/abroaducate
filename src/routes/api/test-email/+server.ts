import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SENDGRID_API_KEY, FROM_EMAIL } from '$env/static/private';

// Email service configuration
const fromName = process.env.FROM_NAME || 'Abroaducate';
const fromEmail = FROM_EMAIL || 'hello@abroaducate.com';
const from = `${fromName} <${fromEmail}>`;

// SendGrid email sending function
async function sendEmailViaSendGrid(to: string, subject: string, htmlContent: string, textContent: string) {
  if (!SENDGRID_API_KEY) {
    console.error('SendGrid API key not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: from,
        subject: subject,
        content: [
          { type: 'text/plain', value: textContent },
          { type: 'text/html', value: htmlContent }
        ]
      })
    });

    if (response.ok) {
      console.log(`Test email sent successfully to ${to}`);
      return true;
    } else {
      console.error('SendGrid error:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

function generateTestEmailTemplate(userEmail: string, userTier: string) {
  const subject = '🧪 Test Email - Your Abroaducate Email Settings Are Working!';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test Email - Abroaducate</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <!-- Header -->
      <div style="text-align: center; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="color: #1E40AF; margin: 0; font-size: 28px;">🎓 Abroaducate</h1>
        <p style="color: #666; margin: 5px 0 0 0;">Email System Test</p>
      </div>

      <!-- Success Banner -->
      <div style="background-color: #059669; color: white; padding: 20px; margin-bottom: 25px; border-radius: 8px; text-align: center;">
        <h2 style="margin: 0 0 10px 0; font-size: 24px;">✅ Email Setup Successful!</h2>
        <p style="margin: 0; font-size: 16px; opacity: 0.9;">
          Your email notifications are working perfectly!
        </p>
      </div>

      <!-- User Info -->
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">📧 Test Details</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: 600; width: 30%;">Email:</td>
            <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${userEmail}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: 600;">Account Tier:</td>
            <td style="padding: 8px 0; color: #1f2937;">${userTier === 'free' ? 'Academic Starter (Free)' : userTier === 'professional' ? 'Academic Professional' : 'Academic Elite'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: 600;">Test Date:</td>
            <td style="padding: 8px 0; color: #1f2937;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
          </tr>
        </table>
      </div>

      <!-- Email Types Available -->
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">📊 Your Email Features</h3>
        <ul style="margin: 0; padding-left: 20px; color: #374151;">
          <li style="margin: 8px 0; color: #059669;">✅ <strong>Weekly Scholarship Digest</strong> - Available for all users</li>
          ${userTier !== 'free' ? `
          <li style="margin: 8px 0; color: #059669;">✅ <strong>Application Deadline Reminders</strong> - Premium feature</li>
          <li style="margin: 8px 0; color: #059669;">✅ <strong>Subscription & Account Alerts</strong> - Premium feature</li>
          ${userTier === 'professional' ? '<li style="margin: 8px 0; color: #059669;">✅ <strong>Daily Scholarship Updates</strong> - Professional feature</li>' : ''}
          ${userTier === 'elite' ? '<li style="margin: 8px 0; color: #059669;">✅ <strong>Instant Deadline Alerts</strong> - Elite feature</li>' : ''}
          ` : `
          <li style="margin: 8px 0; color: #9ca3af;">🔒 Application Deadline Reminders - Upgrade to unlock</li>
          <li style="margin: 8px 0; color: #9ca3af;">🔒 Daily Scholarship Updates - Upgrade to unlock</li>
          `}
        </ul>
      </div>

      <!-- CTA Buttons -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://abroaducate.com/account/preferences" 
           style="display: inline-block; background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 0 10px 10px 0;">
          ⚙️ Manage Email Settings
        </a>
        <a href="https://abroaducate.com/dashboard" 
           style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 0 10px 10px 0;">
          📊 Go to Dashboard
        </a>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
        <p style="margin: 5px 0;">This is a test email from your <strong>Abroaducate</strong> account.</p>
        <p style="margin: 5px 0;">
          <a href="https://abroaducate.com/account/preferences" style="color: #2563EB; text-decoration: none;">Manage email preferences</a>
        </p>
        <p style="margin: 15px 0 5px 0; color: #9ca3af;">© 2024 Abroaducate. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
🎓 ABROADUCATE - Email System Test

✅ SUCCESS: Your email notifications are working perfectly!

Test Details:
- Email: ${userEmail}
- Account Tier: ${userTier === 'free' ? 'Academic Starter (Free)' : userTier === 'professional' ? 'Academic Professional' : 'Academic Elite'}
- Test Date: ${new Date().toLocaleDateString()}

Your Email Features:
✅ Weekly Scholarship Digest - Available for all users
${userTier !== 'free' ? '✅ Application Deadline Reminders - Premium feature\n✅ Subscription & Account Alerts - Premium feature' : '🔒 Premium features - Upgrade to unlock'}

Manage your email settings: https://abroaducate.com/account/preferences
Visit your dashboard: https://abroaducate.com/dashboard

Best regards,
The Abroaducate Team
  `;

  return { subject, htmlContent, textContent };
}

// Additional test email templates
function generateTestScholarshipDigest(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test: Weekly Scholarship Digest</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="color: #1E40AF; margin: 0; font-size: 28px;">🎓 Abroaducate</h1>
        <h2 style="color: #374151; margin: 10px 0 0 0; font-size: 22px;">TEST: Weekly Scholarship Digest</h2>
      </div>
      
      <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <h3 style="color: #1e40af; margin: 0 0 5px 0;">📋 3 New Scholarships This Week</h3>
        <p style="margin: 0; color: #374151;">This is a test of the scholarship digest email template.</p>
      </div>
      
      <div style="background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <h4 style="color: #1f2937; margin: 0 0 8px 0; font-size: 18px;">Test Scholarship #1</h4>
        <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px;">Provider: Test University</p>
        <p style="color: #059669; margin: 0 0 8px 0; font-weight: 600;">Amount: $5,000</p>
        <p style="color: #dc2626; margin: 0 0 8px 0; font-size: 14px;">Deadline: April 15, 2024</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://abroaducate.com/scholarships" style="display: inline-block; background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Browse All Scholarships</a>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
        <p style="margin: 5px 0;">This is a TEST email from your Abroaducate scholarship digest system.</p>
      </div>
    </body>
    </html>
  `;
}

function generateTestApplicationReminder(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test: Application Deadline Reminder</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="color: #1E40AF; margin: 0; font-size: 28px;">🎓 Abroaducate</h1>
      </div>
      
      <div style="background-color: #DC262615; border-left: 4px solid #DC2626; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <h2 style="color: #DC2626; margin: 0 0 5px 0;">⏰ TEST: Application Deadline Reminder</h2>
        <p style="margin: 0; color: #555;">This is a test of the application deadline reminder email template.</p>
      </div>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0;">📋 Application Details</h3>
        <p><strong>University:</strong> Test University</p>
        <p><strong>Program:</strong> Master of Science in Computer Science</p>
        <p><strong>Deadline:</strong> <span style="color: #DC2626; font-weight: 600;">March 15, 2024</span></p>
        <p><strong>Time Remaining:</strong> <span style="color: #DC2626; font-weight: 600;">7 days left</span></p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://abroaducate.com/applications" style="display: inline-block; background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Application</a>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
        <p style="margin: 5px 0;">This is a TEST email from your Abroaducate application tracking system.</p>
      </div>
    </body>
    </html>
  `;
}

function generateTestSubscriptionAlert(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test: Subscription Expiry Alert</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="color: #1E40AF; margin: 0; font-size: 28px;">🎓 Abroaducate</h1>
      </div>
      
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <h2 style="color: #92400e; margin: 0 0 5px 0;">🔔 TEST: Subscription Expiry Notice</h2>
        <p style="margin: 0; color: #78350f;">This is a test of the subscription expiry alert email template.</p>
      </div>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0;">💎 Keep Your Access</h3>
        <p>This is what your subscribers would see when their subscription is about to expire:</p>
        <ul style="color: #374151;">
          <li>Unlimited document generation</li>
          <li>AI-powered editing tools</li>
          <li>Priority customer support</li>
          <li>Advanced analytics dashboard</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://abroaducate.com/subscription/manage" style="display: inline-block; background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Renew Subscription</a>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
        <p style="margin: 5px 0;">This is a TEST email from your Abroaducate subscription management system.</p>
      </div>
    </body>
    </html>
  `;
}

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Get user session
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const { email, recipientEmail, userTier, testType } = await request.json();

    // Use provided email or user's session email
    const targetEmail = recipientEmail || email || session.user.email;

    if (!targetEmail) {
      return json({ error: 'Email address required' }, { status: 400 });
    }

    // Generate test email template based on test type
    let subject, htmlContent, textContent;
    
    if (testType && ['scholarship_digest', 'application_reminder', 'subscription_alert'].includes(testType)) {
      // Use the specialized test templates for different email types
      switch (testType) {
        case 'scholarship_digest':
          subject = '🎓 Test: Weekly Scholarship Digest';
          htmlContent = generateTestScholarshipDigest();
          textContent = 'Test scholarship digest email from Abroaducate';
          break;
        case 'application_reminder':
          subject = '⏰ Test: Application Deadline Reminder';
          htmlContent = generateTestApplicationReminder();
          textContent = 'Test application reminder email from Abroaducate';
          break;
        case 'subscription_alert':
          subject = '🔔 Test: Subscription Expiry Alert';
          htmlContent = generateTestSubscriptionAlert();
          textContent = 'Test subscription alert email from Abroaducate';
          break;
      }
    } else {
      // Use the detailed test email template
      const templateData = generateTestEmailTemplate(targetEmail, userTier || 'free');
      subject = templateData.subject;
      htmlContent = templateData.htmlContent;
      textContent = templateData.textContent;
    }

    // Send email via SendGrid
    const emailSent = await sendEmailViaSendGrid(targetEmail, subject, htmlContent, textContent);

    if (!emailSent) {
      return json({ error: 'Failed to send test email' }, { status: 500 });
    }

    // Log the test email
    try {
      await locals.supabase
        .from('email_logs')
        .insert({
          user_id: session.user.id,
          email_type: 'test_email',
          recipient: targetEmail,
          status: 'sent',
          content_summary: `Email system test (${testType || 'basic'})`,
          sent_at: new Date().toISOString()
        });
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('Error logging test email:', logError);
    }

    return json({ 
      success: true, 
      message: 'Test email sent successfully!' 
    });

  } catch (error) {
    console.error('Error in test-email API:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}; 