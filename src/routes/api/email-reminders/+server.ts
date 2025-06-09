import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SENDGRID_API_KEY, FROM_EMAIL } from '$env/static/private';

// Email service configuration - now using SvelteKit env vars
const fromEmail = FROM_EMAIL || 'noreply@abroaducate.com';

interface EmailReminderRequest {
  type: 'deadline' | 'milestone' | 'document';
  recipients: string[];
  scholarshipData: {
    title: string;
    provider: string;
    deadline: string;
    daysUntil: number;
    urgency: 'critical' | 'urgent' | 'important' | 'moderate';
  };
  userPreferences?: {
    emailEnabled: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
  };
}

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
      console.log(`Email sent successfully to ${to}`);
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

// Email template generator
function generateEmailTemplate(data: EmailReminderRequest['scholarshipData']) {
  const { title, provider, deadline, daysUntil, urgency } = data;
  
  const urgencyColors = {
    critical: '#DC2626', // red-600
    urgent: '#EA580C',   // orange-600
    important: '#D97706', // amber-600
    moderate: '#2563EB'   // blue-600
  };

  const urgencyLabels = {
    critical: 'URGENT',
    urgent: 'IMPORTANT',
    important: 'NOTICE',
    moderate: 'REMINDER'
  };

  const subject = `${urgencyLabels[urgency]}: ${title} deadline in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Scholarship Deadline Reminder</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <!-- Header -->
      <div style="text-align: center; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="color: #1E40AF; margin: 0; font-size: 28px;">🎓 Abroaducate</h1>
        <p style="color: #666; margin: 5px 0 0 0;">Scholarship Application Tracker</p>
      </div>

      <!-- Alert Banner -->
      <div style="background-color: ${urgencyColors[urgency]}15; border-left: 4px solid ${urgencyColors[urgency]}; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <h2 style="color: ${urgencyColors[urgency]}; margin: 0 0 5px 0; font-size: 18px;">
          ⏰ ${urgencyLabels[urgency]}: Deadline Approaching
        </h2>
        <p style="margin: 0; color: #555;">
          Your scholarship application deadline is ${daysUntil === 0 ? 'TODAY' : `in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`}
        </p>
      </div>

      <!-- Scholarship Details -->
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">📋 Scholarship Details</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: 600; width: 30%;">Scholarship:</td>
            <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${title}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: 600;">Provider:</td>
            <td style="padding: 8px 0; color: #1f2937;">${provider}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: 600;">Deadline:</td>
            <td style="padding: 8px 0; color: ${urgencyColors[urgency]}; font-weight: 600;">${new Date(deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: 600;">Time Remaining:</td>
            <td style="padding: 8px 0; color: ${urgencyColors[urgency]}; font-weight: 600;">
              ${daysUntil === 0 ? 'DUE TODAY!' : `${daysUntil} day${daysUntil === 1 ? '' : 's'} left`}
            </td>
          </tr>
        </table>
      </div>

      <!-- Action Items -->
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">✅ Recommended Actions</h3>
        <ul style="margin: 0; padding-left: 20px; color: #374151;">
          <li style="margin: 8px 0;">Review your application materials</li>
          <li style="margin: 8px 0;">Check document requirements and deadlines</li>
          <li style="margin: 8px 0;">Prepare any missing documents</li>
          <li style="margin: 8px 0;">Submit your application well before the deadline</li>
        </ul>
      </div>

      <!-- CTA Buttons -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://abroaducate.com/scholarships/my-applications" 
           style="display: inline-block; background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 0 10px 10px 0;">
          📊 View Dashboard
        </a>
        <a href="https://abroaducate.com/scholarships" 
           style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 0 10px 10px 0;">
          🔍 Browse More Scholarships
        </a>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
        <p style="margin: 5px 0;">This reminder was sent from your <strong>Abroaducate</strong> scholarship tracker.</p>
        <p style="margin: 5px 0;">
          <a href="https://abroaducate.com/account/preferences" style="color: #2563EB; text-decoration: none;">Manage email preferences</a> | 
          <a href="https://abroaducate.com/scholarships/my-applications" style="color: #2563EB; text-decoration: none;">Unsubscribe</a>
        </p>
        <p style="margin: 15px 0 5px 0; color: #9ca3af;">© 2024 Abroaducate. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
🎓 ABROADUCATE - Scholarship Deadline Reminder

${urgencyLabels[urgency]}: ${title}

Your scholarship application deadline is ${daysUntil === 0 ? 'TODAY' : `in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`}!

Scholarship Details:
- Scholarship: ${title}
- Provider: ${provider}
- Deadline: ${new Date(deadline).toLocaleDateString()}
- Time Remaining: ${daysUntil === 0 ? 'DUE TODAY!' : `${daysUntil} days left`}

Recommended Actions:
✅ Review your application materials
✅ Check document requirements
✅ Prepare any missing documents
✅ Submit before the deadline

Visit your dashboard: https://abroaducate.com/scholarships/my-applications

Best regards,
The Abroaducate Team
  `;

  return { subject, htmlContent, textContent };
}

// POST: Send email reminders
export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const requestData: EmailReminderRequest = await request.json();
    const { type, recipients, scholarshipData, userPreferences } = requestData;

    // Check user preferences
    if (userPreferences && !userPreferences.emailEnabled) {
      return json({ 
        success: true, 
        message: 'Email notifications disabled for user',
        sent: 0 
      });
    }

    // Generate email template
    const { subject, htmlContent, textContent } = generateEmailTemplate(scholarshipData);

    // Send emails to all recipients
    const emailResults = await Promise.all(
      recipients.map(email => sendEmailViaSendGrid(email, subject, htmlContent, textContent))
    );

    const successCount = emailResults.filter(result => result).length;
    const failureCount = emailResults.length - successCount;

    // Log email activity to database
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        user_id: session.user.id,
        email_type: type,
        recipients: recipients,
        subject: subject,
        status: failureCount === 0 ? 'sent' : 'partial_failure',
        success_count: successCount,
        failure_count: failureCount,
        scholarship_data: scholarshipData,
        sent_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Error logging email activity:', logError);
    }

    return json({
      success: true,
      message: `Successfully sent ${successCount} email(s)`,
      sent: successCount,
      failed: failureCount
    });

  } catch (error) {
    console.error('Error in email reminders API:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

// GET: Check email preferences and upcoming reminders
export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    
    // Get user email preferences
    const { data: preferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('email_enabled, email_deadlines, email_frequency')
      .eq('user_id', userId)
      .single();

    if (prefError && prefError.code !== 'PGRST116') { // Ignore "not found" error
      console.error('Error fetching preferences:', prefError);
    }

    // Get upcoming scholarship deadlines that need reminders
    const { data: scholarships, error: scholarshipsError } = await supabase
      .from('user_scholarship_interactions')
      .select(`
        scholarship_id,
        scholarships!inner(
          title,
          provider,
          deadline,
          amount,
          location
        )
      `)
      .eq('user_id', userId)
      .filter('scholarships.deadline', 'gte', new Date().toISOString())
      .order('scholarships.deadline', { ascending: true });

    if (scholarshipsError) {
      console.error('Error fetching scholarships:', scholarshipsError);
      return json({ error: 'Failed to fetch scholarship data' }, { status: 500 });
    }

    // Calculate upcoming reminders
    const upcomingReminders = scholarships?.map(item => {
      const scholarship = item.scholarships;
      const deadline = new Date(scholarship.deadline);
      const today = new Date();
      const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let urgency: 'critical' | 'urgent' | 'important' | 'moderate' = 'moderate';
      if (daysUntil <= 1) urgency = 'critical';
      else if (daysUntil <= 3) urgency = 'urgent';
      else if (daysUntil <= 7) urgency = 'important';

      return {
        scholarship_id: item.scholarship_id,
        title: scholarship.title,
        provider: scholarship.provider,
        deadline: scholarship.deadline,
        daysUntil,
        urgency,
        needsReminder: daysUntil <= 7 && daysUntil >= 0
      };
    }).filter(item => item.needsReminder) || [];

    return json({
      success: true,
      preferences: preferences || {
        email_enabled: true,
        email_deadlines: true,
        email_frequency: 'daily'
      },
      upcomingReminders,
      totalUpcoming: upcomingReminders.length
    });

  } catch (error) {
    console.error('Error in email reminders GET:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}; 