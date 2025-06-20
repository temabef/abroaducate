import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SENDGRID_API_KEY, FROM_EMAIL } from '$env/static/private';

// Email service configuration
const fromEmail = FROM_EMAIL || 'noreply@abroaducate.com';

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
        from: { email: fromEmail, name: 'Abroaducate' },
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

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Get user session
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const { email, userTier } = await request.json();

    if (!email) {
      return json({ error: 'Email address required' }, { status: 400 });
    }

    // Generate test email template
    const { subject, htmlContent, textContent } = generateTestEmailTemplate(email, userTier || 'free');

    // Send email via SendGrid
    const emailSent = await sendEmailViaSendGrid(email, subject, htmlContent, textContent);

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
          recipient: email,
          status: 'sent',
          content_summary: 'Email system test',
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