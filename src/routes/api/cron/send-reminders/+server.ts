import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET, SENDGRID_API_KEY, FROM_EMAIL } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';

// Create admin client for server operations
const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Email service configuration
const fromName = process.env.FROM_NAME || 'Abroaducate';
const fromEmail = FROM_EMAIL || 'hello@abroaducate.com';
const from = `${fromName} <${fromEmail}>`;

// SendGrid email sending function
async function sendEmailViaSendGrid(to: string, subject: string, htmlContent: string, textContent: string): Promise<{ success: boolean, error?: string }> {
  if (!SENDGRID_API_KEY) {
    const errMsg = '❌ SendGrid API key not configured';
    console.error(errMsg);
    return { success: false, error: errMsg };
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
        from: { email: fromEmail, name: fromName },
        subject: subject,
        content: [
          { type: 'text/plain', value: textContent },
          { type: 'text/html', value: htmlContent }
        ]
      })
    });

    if (response.ok) {
      console.log(`✅ Email sent successfully to ${to}: ${subject}`);
      return { success: true };
    } else {
      const errorText = await response.text();
      console.error(`❌ SendGrid error for ${to}:`, errorText);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error);
    return { success: false, error: String(error) };
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Production-safe authorization logic with x-authorization fallback
    let authHeader = request.headers.get('authorization');
    const xAuthHeader = request.headers.get('x-authorization');
    if (!authHeader && xAuthHeader) {
      authHeader = xAuthHeader;
    }
    // Verify cron authorization
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting email reminder cron job...');

    // Get the current day of week (0 = Sunday, 1 = Monday, etc.)
    const today = new Date();
    const dayOfWeek = today.getDay();

    let totalEmailsSent = 0;
    let emailsProcessed = {
      scholarship_digest: 0,
      application_reminders: 0,
      subscription_alerts: 0,
      trial_end_alerts: 0,
      instant_alerts: 0,
      newsletter_emails: 0
    };

    // ============ SCHOLARSHIP DIGEST (EVERYONE - WEEKLY/DAILY) ============
    // Updated: Use new columns for daily/weekly digest and prevent double sending
    const { data: allUsers } = await supabase
      .from('user_preferences')
      .select(`
        user_id,
        scholarship_digest_weekly,
        scholarship_digest_daily
      `);

    // Get user tiers for all users
    const { data: allSubs } = await supabase
      .from('user_subscriptions')
      .select('user_id, plan_type, status');

    const userTierMap = new Map();
    for (const sub of allSubs || []) {
      if (sub.status === 'active') {
        userTierMap.set(sub.user_id, sub.plan_type);
      }
    }

    for (const user of allUsers || []) {
      const planType = userTierMap.get(user.user_id) || 'free';
      const isPaid = planType === 'professional' || planType === 'elite';
      const isMonday = dayOfWeek === 1;
      let sendDaily = false;
      let sendWeekly = false;
      if (isPaid) {
        if (isMonday) {
          // If both are enabled, send only daily
          if (user.scholarship_digest_daily && user.scholarship_digest_weekly) {
            sendDaily = true;
          } else if (user.scholarship_digest_daily) {
            sendDaily = true;
          } else if (user.scholarship_digest_weekly) {
            sendWeekly = true;
          }
        } else {
          if (user.scholarship_digest_daily) {
            sendDaily = true;
          }
        }
      } else {
        // Free users: only weekly
        if (isMonday && user.scholarship_digest_weekly) {
          sendWeekly = true;
        }
      }
      // Send the appropriate digest
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(user.user_id);
        if (authUser.user?.email) {
          if (sendDaily) {
            const emailSent = await sendScholarshipDigest(authUser.user.email, user.user_id);
            if (emailSent) {
              emailsProcessed.scholarship_digest++;
              totalEmailsSent++;
            }
          } else if (sendWeekly) {
            const emailSent = await sendScholarshipDigest(authUser.user.email, user.user_id);
            if (emailSent) {
              emailsProcessed.scholarship_digest++;
              totalEmailsSent++;
            }
          }
        }
      } catch (error) {
        console.error(`Error sending scholarship digest to user ${user.user_id}:`, error);
      }
    }

    // ============ APPLICATION REMINDERS (PAID USERS ONLY) ============
    
    // Get paid users with application deadline reminders enabled
    const { data: paidUsersPrefs } = await supabase
      .from('user_preferences')
      .select('user_id, email_deadlines, instant_alerts')
      .eq('email_deadlines', true);

    console.log(`⏰ Processing application reminders for ${paidUsersPrefs?.length || 0} users`);

    for (const userPref of paidUsersPrefs || []) {
      try {
        // Check if user has active subscription
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('plan_type')
          .eq('user_id', userPref.user_id)
          .eq('status', 'active')
          .single();

        if (subscription) {
          const { data: authUser } = await supabase.auth.admin.getUserById(userPref.user_id);
          
          if (authUser.user?.email) {
            const remindersSent = await sendApplicationReminders(
              authUser.user.email,
              userPref.user_id,
              userPref.instant_alerts
            );
            emailsProcessed.application_reminders += remindersSent;
            totalEmailsSent += remindersSent;
          }
        }
      } catch (error) {
        console.error(`Error processing application reminders for user ${userPref.user_id}:`, error);
      }
    }

    // ============ SUBSCRIPTION ALERTS (PAID USERS ONLY) ============
    
    // Check for expiring subscriptions (7 days, 3 days, 1 day before expiry)
    const checkDates = [7, 3, 1];
    
    for (const daysAhead of checkDates) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysAhead);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      const { data: expiringSubscriptions } = await supabase
        .from('user_subscriptions')
        .select('user_id, plan_type, expires_at')
        .eq('status', 'active')
        .gte('expires_at', targetDateStr)
        .lt('expires_at', targetDateStr + ' 23:59:59');

      for (const subscription of expiringSubscriptions || []) {
        try {
          // Check if user wants subscription alerts
          const { data: userPref } = await supabase
            .from('user_preferences')
            .select('subscription_alerts')
            .eq('user_id', subscription.user_id)
            .single();

          if (userPref?.subscription_alerts) {
            const { data: authUser } = await supabase.auth.admin.getUserById(subscription.user_id);
            
            if (authUser.user?.email) {
              const emailSent = await sendSubscriptionAlert(
                authUser.user.email,
                subscription.user_id,
                subscription.plan_type,
                daysAhead
              );
              if (emailSent) {
                emailsProcessed.subscription_alerts++;
                totalEmailsSent++;
              }
            }
          }
        } catch (error) {
          console.error(`Error sending subscription alert for user ${subscription.user_id}:`, error);
        }
      }
    }

    // ============ TRIAL ENDING REMINDERS (24H BEFORE) ============
    try {
      const now = new Date();
      const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const { data: trialingSubscriptions } = await supabase
        .from('user_subscriptions')
        .select('user_id, plan_type, current_period_end')
        .eq('status', 'trialing')
        .gte('current_period_end', now.toISOString())
        .lte('current_period_end', cutoff.toISOString());

      for (const sub of trialingSubscriptions || []) {
        try {
          // Check if user wants subscription alerts
          const { data: userPref } = await supabase
            .from('user_preferences')
            .select('subscription_alerts')
            .eq('user_id', sub.user_id)
            .single();

          if (userPref?.subscription_alerts) {
            const { data: authUser } = await supabase.auth.admin.getUserById(sub.user_id);
            if (authUser.user?.email) {
              const ok = await sendTrialEndingReminder(authUser.user.email, sub.user_id, sub.plan_type, sub.current_period_end);
              if (ok) {
                emailsProcessed.trial_end_alerts++;
                totalEmailsSent++;
              }
            }
          }
        } catch (err) {
          console.error('Error sending trial ending reminder for user', sub.user_id, err);
        }
      }
    } catch (err) {
      console.error('Trial ending reminder block error', err);
    }

    // ============ NEWSLETTER SUBSCRIBERS (NON-USERS) ============
    
    // Check if newsletter system is enabled
    const { data: newsletterSettings } = await supabase
      .from('newsletter_settings')
      .select('setting_value')
      .eq('setting_key', 'newsletter_enabled')
      .single();

    const { data: digestSettings } = await supabase
      .from('newsletter_settings')
      .select('setting_value')
      .eq('setting_key', 'scholarship_digest_enabled')
      .single();

    if (newsletterSettings?.setting_value === true && digestSettings?.setting_value === true) {
      // Get newsletter frequency setting
      const { data: frequencySettings } = await supabase
        .from('newsletter_settings')
        .select('setting_value')
        .eq('setting_key', 'send_frequency')
        .single();

      const { data: sendDaySettings } = await supabase
        .from('newsletter_settings')
        .select('setting_value')
        .eq('setting_key', 'send_day')
        .single();

      const sendFrequency = frequencySettings?.setting_value || 'weekly';
      const sendDay = sendDaySettings?.setting_value || 1; // Default to Monday

      let shouldSendNewsletter = false;
      if (sendFrequency === 'daily') {
        shouldSendNewsletter = true;
      } else if (sendFrequency === 'weekly') {
        shouldSendNewsletter = dayOfWeek === sendDay;
      } else if (sendFrequency === 'monthly') {
        shouldSendNewsletter = today.getDate() === 1; // First of month
      }

      if (shouldSendNewsletter) {
        // Get active newsletter subscribers
        const { data: newsletterSubscribers } = await supabase
          .from('newsletter_subscribers')
          .select('id, email, source')
          .eq('status', 'active')
          .eq('scholarship_digest', true);

        console.log(`📧 Processing newsletter for ${newsletterSubscribers?.length || 0} subscribers`);

        // Get batch size setting
        const { data: batchSettings } = await supabase
          .from('newsletter_settings')
          .select('setting_value')
          .eq('setting_key', 'max_emails_per_batch')
          .single();

        const batchSize = batchSettings?.setting_value || 100;

        // Process in batches to avoid overwhelming SendGrid
        if (newsletterSubscribers && newsletterSubscribers.length > 0) {
          for (let i = 0; i < newsletterSubscribers.length; i += batchSize) {
            const batch = newsletterSubscribers.slice(i, i + batchSize);
            
            for (const subscriber of batch) {
              try {
                const emailSent = await sendScholarshipDigest(subscriber.email, null, subscriber.source);
                if (emailSent) {
                  emailsProcessed.newsletter_emails++;
                  totalEmailsSent++;

                  // Update subscriber stats
                  await supabase
                    .from('newsletter_subscribers')
                    .update({
                      last_email_sent: new Date().toISOString(),
                      total_emails_sent: supabase.rpc('increment', { x: 1 })
                    })
                    .eq('id', subscriber.id);
                }
              } catch (error) {
                console.error(`Error sending newsletter to ${subscriber.email}:`, error);
              }
            }

            // Add delay between batches to respect rate limits
            if (i + batchSize < newsletterSubscribers.length) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
            }
          }

          // Update last digest sent setting
          await supabase
            .from('newsletter_settings')
            .update({
              setting_value: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('setting_key', 'last_digest_sent');
        }
      } else {
        console.log(`📧 Newsletter not scheduled for today (${sendFrequency} on day ${sendDay}, today is ${dayOfWeek})`);
      }
    } else {
      console.log('📧 Newsletter system is disabled');
    }

    // Log activity to database
    try {
      await supabase
        .from('email_activity_log')
        .insert({
          date: new Date().toISOString().split('T')[0],
          total_emails_sent: totalEmailsSent,
          scholarship_digest_emails: emailsProcessed.scholarship_digest,
          application_reminder_emails: emailsProcessed.application_reminders,
          subscription_alert_emails: emailsProcessed.subscription_alerts,
          trial_end_alert_emails: emailsProcessed.trial_end_alerts,
          instant_alert_emails: emailsProcessed.instant_alerts,
          newsletter_emails: emailsProcessed.newsletter_emails
        });
    } catch (logError) {
      console.error('Error logging email activity:', logError);
    }

    console.log('✅ Email cron job completed successfully:', emailsProcessed);

    return json({
      success: true,
      total_emails_sent: totalEmailsSent,
      breakdown: emailsProcessed,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in email cron job:', error);
    return json({ 
      error: 'Failed to process emails',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
};

// ============ EMAIL SENDING FUNCTIONS WITH SENDGRID ============

async function sendScholarshipDigest(email: string, userId: string | null, source?: string): Promise<boolean> {
  try {
    // Get new scholarships from the last week
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const { data: scholarships } = await supabase
      .from('scholarships')
      .select('id, title, provider, deadline, amount, description')
      .gte('created_at', oneWeekAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (!scholarships || scholarships.length === 0) {
      console.log(`📊 No new scholarships for ${email}, skipping digest`);
      return false;
    }

    console.log(`📊 Sending scholarship digest to ${email} with ${scholarships.length} new scholarships`);
    
    // Generate email content
    const subject = source 
      ? `🎓 Weekly Scholarship Digest - ${scholarships.length} New Opportunities (${source})`
      : `🎓 Weekly Scholarship Digest - ${scholarships.length} New Opportunities`;
    
    const htmlContent = generateScholarshipDigestHTML(scholarships, source);
    const textContent = generateScholarshipDigestText(scholarships, source);
    
    // Send email via SendGrid
    const sendResult = await sendEmailViaSendGrid(email, subject, htmlContent, textContent);
    const emailSent = sendResult.success;
    
    // Log email activity
    try {
      if (userId) {
        // Log for registered users
        await supabase
          .from('email_logs')
          .insert({
            user_id: userId,
            email_type: 'scholarship_digest',
            recipient: email,
            subject: subject,
            status: emailSent ? 'sent' : 'failed',
            content_summary: emailSent ? `${scholarships.length} new scholarships` : (sendResult.error || 'Unknown error'),
            sent_at: new Date().toISOString()
          });
      } else {
        // Log for newsletter subscribers
        await supabase
          .from('newsletter_email_logs')
          .insert({
            email_address: email,
            subject_line: subject,
            email_type: 'scholarship_digest',
            status: emailSent ? 'sent' : 'failed',
            content_summary: emailSent ? `${scholarships.length} new scholarships` : (sendResult.error || 'Unknown error'),
            sent_at: new Date().toISOString()
          });
      }
    } catch (logError) {
      console.error('Error logging scholarship digest email:', logError);
    }
    
    return emailSent;
  } catch (error) {
    console.error(`Error sending scholarship digest to ${email}:`, error);
    return false;
  }
}

async function sendApplicationReminders(email: string, userId: string, instantAlerts: boolean): Promise<number> {
  try {
    // Get upcoming application deadlines
    const { data: applications } = await supabase
      .from('applications')
      .select('id, university_name, program_name, application_deadline')
      .eq('user_id', userId)
      .not('application_deadline', 'is', null)
      .gte('application_deadline', new Date().toISOString());

    let remindersSent = 0;
    const now = new Date();

    for (const app of applications || []) {
      if (!app.application_deadline) continue;
      
      const deadline = new Date(app.application_deadline);
      const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Send reminders based on urgency and user preferences
      const shouldSendReminder = 
        [30, 14, 7, 3, 1].includes(daysUntil) || // Standard reminder intervals
        (instantAlerts && daysUntil <= 3 && daysUntil > 0); // Instant alerts for elite users

      if (shouldSendReminder && daysUntil >= 0) {
        console.log(`⏰ Sending application reminder to ${email} for deadline in ${daysUntil} days`);
        
        // Generate email content
        const urgency = daysUntil <= 1 ? 'critical' : daysUntil <= 3 ? 'urgent' : daysUntil <= 7 ? 'important' : 'moderate';
        const subject = `⏰ Application Deadline: ${app.university_name} - ${daysUntil} day${daysUntil === 1 ? '' : 's'} remaining`;
        
        const htmlContent = generateApplicationReminderHTML(app, daysUntil, urgency);
        const textContent = generateApplicationReminderText(app, daysUntil, urgency);
        
        // Send email via SendGrid
        const sendResult = await sendEmailViaSendGrid(email, subject, htmlContent, textContent);
        const emailSent = sendResult.success;
        
        // Log email activity
        if (emailSent) {
          try {
            await supabase
              .from('email_logs')
              .insert({
                user_id: userId,
                email_type: 'application_reminder',
                recipient: email,
                subject: subject,
                status: 'sent',
                content_summary: `Application deadline in ${daysUntil} days`,
                sent_at: new Date().toISOString()
              });
            
            remindersSent++;
          } catch (logError) {
            console.error('Error logging application reminder email:', logError);
          }
        }
      }
    }

    return remindersSent;
  } catch (error) {
    console.error(`Error sending application reminders to ${email}:`, error);
    return 0;
  }
}

async function sendSubscriptionAlert(email: string, userId: string, planType: string, daysUntilExpiry: number): Promise<boolean> {
  try {
    console.log(`🔔 Sending subscription alert to ${email} - ${planType} expires in ${daysUntilExpiry} days`);
    
    // Generate email content
    const subject = `🔔 Your ${planType} subscription expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`;
    
    const htmlContent = generateSubscriptionAlertHTML(planType, daysUntilExpiry);
    const textContent = generateSubscriptionAlertText(planType, daysUntilExpiry);
    
    // Send email via SendGrid
    const sendResult = await sendEmailViaSendGrid(email, subject, htmlContent, textContent);
    const emailSent = sendResult.success;
    
    // Log email activity
    try {
      await supabase
        .from('email_logs')
        .insert({
          user_id: userId,
          email_type: 'subscription_alert',
          recipient: email,
          subject: subject,
          status: emailSent ? 'sent' : 'failed',
          content_summary: `${planType} subscription expires in ${daysUntilExpiry} days`,
          sent_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging subscription alert email:', logError);
    }
    
    return emailSent;
  } catch (error) {
    console.error(`Error sending subscription alert to ${email}:`, error);
    return false;
  }
}

async function sendTrialEndingReminder(email: string, userId: string, planType: string, periodEndIso: string): Promise<boolean> {
  try {
    const endDate = new Date(periodEndIso);
    const subject = `⏳ Your ${planType} trial ends soon`;
    const htmlContent = `
      <h2 style="font-family: Inter, Arial; color:#111827;">Your ${planType} trial ends in 24 hours</h2>
      <p style="color:#374151;">You won't be charged today. If you want to continue after the trial, no action is needed. Otherwise, you can cancel anytime before the trial ends.</p>
      <p style="color:#374151;">Trial end: <strong>${endDate.toUTCString()}</strong></p>
      <div style="margin-top:16px;">
        <a href="https://abroaducate.com/subscription/manage" style="background:#2563EB;color:white;padding:10px 16px;border-radius:6px;text-decoration:none;">Manage subscription</a>
      </div>
    `;
    const textContent = `Your ${planType} trial ends in 24 hours. Trial end: ${endDate.toUTCString()}. Manage at https://abroaducate.com/subscription/manage`;

    const send = await sendEmailViaSendGrid(email, subject, htmlContent, textContent);
    const ok = send.success;
    try {
      await supabase.from('email_logs').insert({
        user_id: userId,
        email_type: 'trial_end_alert',
        recipient: email,
        subject,
        status: ok ? 'sent' : 'failed',
        sent_at: new Date().toISOString()
      });
    } catch {}
    return ok;
  } catch (err) {
    console.error('Error sending trial ending reminder:', err);
    return false;
  }
}

// ============ EMAIL TEMPLATE GENERATORS ============

function generateScholarshipDigestHTML(scholarships: any[], source?: string): string {
  const scholarshipCards = scholarships.map(s => `
    <div style="background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <h4 style="color: #1f2937; margin: 0 0 8px 0; font-size: 18px;">${s.title}</h4>
      <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px;">Provider: ${s.provider}</p>
      ${s.amount ? `<p style="color: #059669; margin: 0 0 8px 0; font-weight: 600;">Amount: ${s.amount}</p>` : ''}
      ${s.deadline ? `<p style="color: #dc2626; margin: 0 0 8px 0; font-size: 14px;">Deadline: ${new Date(s.deadline).toLocaleDateString()}</p>` : ''}
      <a href="https://abroaducate.com/scholarships/${s.id}" style="color: #2563eb; text-decoration: none; font-weight: 600;">View Details →</a>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Weekly Scholarship Digest</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="color: #1E40AF; margin: 0; font-size: 28px;">🎓 Abroaducate</h1>
        <h2 style="color: #374151; margin: 10px 0 0 0; font-size: 22px;">Weekly Scholarship Digest</h2>
      </div>
      
      <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <h3 style="color: #1e40af; margin: 0 0 5px 0;">📋 ${scholarships.length} New Scholarships This Week</h3>
        <p style="margin: 0; color: #374151;">Don't miss these new opportunities!${source ? ` (From your ${source} subscription)` : ''}</p>
      </div>
      
      ${scholarshipCards}
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://abroaducate.com/scholarships" style="display: inline-block; background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Browse All Scholarships</a>
        ${source ? '<br><br><a href="https://abroaducate.com/subscribe" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Create Free Account</a>' : ''}
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
        <p style="margin: 5px 0;"><a href="https://abroaducate.com/account/preferences" style="color: #2563EB; text-decoration: none;">Manage email preferences</a></p>
      </div>
    </body>
    </html>
  `;
}

function generateScholarshipDigestText(scholarships: any[], source?: string): string {
  const scholarshipList = scholarships.map(s => `
- ${s.title}
  Provider: ${s.provider}
  ${s.amount ? `Amount: ${s.amount}` : ''}
  ${s.deadline ? `Deadline: ${new Date(s.deadline).toLocaleDateString()}` : ''}
  Link: https://abroaducate.com/scholarships/${s.id}
  `).join('\n');

  return `
🎓 ABROADUCATE - Weekly Scholarship Digest

${scholarships.length} New Scholarships This Week${source ? ` (From your ${source} subscription)` : ''}

${scholarshipList}

Browse all scholarships: https://abroaducate.com/scholarships
${source ? 'Create free account: https://abroaducate.com/subscribe' : 'Manage preferences: https://abroaducate.com/account/preferences'}

Best regards,
The Abroaducate Team
  `;
}

function generateApplicationReminderHTML(app: any, daysUntil: number, urgency: string): string {
  const urgencyColors: Record<string, string> = {
    critical: '#DC2626',
    urgent: '#EA580C',
    important: '#D97706',
    moderate: '#2563EB'
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Application Deadline Reminder</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="color: #1E40AF; margin: 0; font-size: 28px;">🎓 Abroaducate</h1>
      </div>
      
      <div style="background-color: ${urgencyColors[urgency]}15; border-left: 4px solid ${urgencyColors[urgency]}; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <h2 style="color: ${urgencyColors[urgency]}; margin: 0 0 5px 0;">⏰ Application Deadline Reminder</h2>
        <p style="margin: 0; color: #555;">Your application deadline is ${daysUntil === 0 ? 'TODAY' : `in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`}!</p>
      </div>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0;">📋 Application Details</h3>
        <p><strong>University:</strong> ${app.university_name}</p>
        <p><strong>Program:</strong> ${app.program_name}</p>
        <p><strong>Deadline:</strong> <span style="color: ${urgencyColors[urgency]}; font-weight: 600;">${new Date(app.application_deadline).toLocaleDateString()}</span></p>
        <p><strong>Time Remaining:</strong> <span style="color: ${urgencyColors[urgency]}; font-weight: 600;">${daysUntil === 0 ? 'DUE TODAY!' : `${daysUntil} day${daysUntil === 1 ? '' : 's'} left`}</span></p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://abroaducate.com/applications" style="display: inline-block; background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Application</a>
      </div>
    </body>
    </html>
  `;
}

function generateApplicationReminderText(app: any, daysUntil: number, urgency: string): string {
  return `
🎓 ABROADUCATE - Application Deadline Reminder

Your application deadline is ${daysUntil === 0 ? 'TODAY' : `in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`}!

Application Details:
- University: ${app.university_name}
- Program: ${app.program_name}
- Deadline: ${new Date(app.application_deadline).toLocaleDateString()}
- Time Remaining: ${daysUntil === 0 ? 'DUE TODAY!' : `${daysUntil} days left`}

View your application: https://abroaducate.com/applications

Best regards,
The Abroaducate Team
  `;
}

function generateSubscriptionAlertHTML(planType: string, daysUntilExpiry: number): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscription Expiry Alert</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="color: #1E40AF; margin: 0; font-size: 28px;">🎓 Abroaducate</h1>
      </div>
      
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <h2 style="color: #92400e; margin: 0 0 5px 0;">🔔 Subscription Expiry Notice</h2>
        <p style="margin: 0; color: #78350f;">Your ${planType} subscription expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}!</p>
      </div>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0;">💎 Keep Your Access</h3>
        <p>Don't lose access to your premium features:</p>
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
    </body>
    </html>
  `;
}

function generateSubscriptionAlertText(planType: string, daysUntilExpiry: number): string {
  return `
🎓 ABROADUCATE - Subscription Expiry Notice

Your ${planType} subscription expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}!

Don't lose access to your premium features:
- Unlimited document generation
- AI-powered editing tools
- Priority customer support
- Advanced analytics dashboard

Renew your subscription: https://abroaducate.com/subscription/manage

Best regards,
The Abroaducate Team
  `;
}

// GET endpoint for manual testing
export const GET: RequestHandler = async ({ request }) => {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  return json({
    message: 'Email cron job endpoint is active',
    timestamp: new Date().toISOString(),
    sendgrid_configured: !!SENDGRID_API_KEY,
    from_email: fromEmail,
    note: 'Use POST method to execute the reminder job'
  });
}; 