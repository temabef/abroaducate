import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { env } from '$env/dynamic/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '$lib/server/email.server';

// Create admin client for server operations
const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Thin wrapper that keeps the same call signature used throughout this file
async function sendEmailViaSendGrid(
  to: string,
  subject: string,
  htmlContent: string,
  textContent: string
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({ to, subject, html: htmlContent, text: textContent });
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Production-safe authorization logic with x-authorization fallback
    let authHeader = request.headers.get('authorization');
    const xAuthHeader = request.headers.get('x-authorization');
    if (!authHeader && xAuthHeader) {
      authHeader = xAuthHeader;
    }
    // Verify cron authorization (use runtime env so Vercel env vars work)
    const cronSecret = env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    let forceDigestAllRegistered = false;
    let batchSize = 80;
    let batchOffset = 0;
    let testEmail: string | null = null;
    try {
      const body = await request.json().catch(() => ({}));
      forceDigestAllRegistered = !!body?.force_digest_all_registered;
      if (typeof body?.batch_size === 'number' && body.batch_size > 0) batchSize = Math.min(200, body.batch_size);
      if (typeof body?.offset === 'number' && body.offset >= 0) batchOffset = body.offset;
      if (typeof body?.test_email === 'string' && body.test_email) testEmail = body.test_email;
    } catch {
      // no body or invalid JSON
    }

    // TEST MODE: if test_email is provided, send only to that address and return immediately
    if (testEmail) {
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const { data: scholarships } = await supabase
        .from('scholarships')
        .select('id, title, provider, deadline, amount, description')
        .gte('created_at', twoWeeksAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      const results: any = { test_mode: true, sent_to: testEmail };

      // Send scholarship digest
      if (scholarships && scholarships.length > 0) {
        console.log(`[TEST MODE] Sending scholarship digest to: ${testEmail}`);
        const subject = `${scholarships.length} new scholarships this week — Abroaducate`;
        const html = generateScholarshipDigestHTML(scholarships);
        const text = generateScholarshipDigestText(scholarships);
        const r = await sendEmailViaSendGrid(testEmail, subject, html, text);
        results.digest = { success: r.success, scholarships_count: scholarships.length };
      } else {
        results.digest = { skipped: true, reason: 'No new scholarships in last 2 weeks' };
      }

      // Send a sample deadline reminder
      console.log(`[TEST MODE] Sending sample deadline reminder to: ${testEmail}`);
      const sampleApp = {
        university_name: 'Technical University of Munich',
        program_name: 'MSc Computer Science',
        application_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      };
      const reminderSubject = `Deadline reminder: ${sampleApp.university_name} — 7 days left`;
      const reminderHtml = generateApplicationReminderHTML(sampleApp, 7, 'important');
      const reminderText = generateApplicationReminderText(sampleApp, 7, 'important');
      const r2 = await sendEmailViaSendGrid(testEmail, reminderSubject, reminderHtml, reminderText);
      results.deadline_reminder = { success: r2.success };

      return json({ success: true, ...results });
    }

    console.log('🔄 Starting email reminder cron job...' + (forceDigestAllRegistered ? ` [MANUAL: force digest, batch offset=${batchOffset} size=${batchSize}]` : ''));

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

    // ============ SCHOLARSHIP DIGEST — ALL REGISTERED USERS, EVERY MONDAY ============
    const isMonday = dayOfWeek === 1;

    if (isMonday || forceDigestAllRegistered) {
      console.log('📊 Sending weekly digest to all registered users...');
      let allAuthUsers: any[] = [];
      let authPage = 1;
      while (true) {
        const { data: { users: batch } } = await supabase.auth.admin.listUsers({ page: authPage, perPage: 1000 });
        if (!batch || batch.length === 0) break;
        allAuthUsers = [...allAuthUsers, ...batch];
        if (batch.length < 1000) break;
        authPage++;
      }
      console.log(`📊 Sending digest to ${allAuthUsers.length} registered users...`);
      for (const authUser of allAuthUsers) {
        if (!authUser.email) continue;
        try {
          const emailSent = await sendScholarshipDigest(authUser.email, authUser.id);
          if (emailSent) {
            emailsProcessed.scholarship_digest++;
            totalEmailsSent++;
          }
        } catch (error) {
          console.error(`Error sending digest to ${authUser.email}:`, error);
        }
      }
    } else {
      console.log(`📊 Not Monday (day ${dayOfWeek}) — skipping registered user digest`);
    }

    // ============ APPLICATION DEADLINE REMINDERS (ALL USERS) ============
    // Removed paid-only gate — all users get deadline reminders for programs/scholarships
    // they have saved to their dashboard.

    const { data: allUsersPrefs } = await supabase
      .from('user_preferences')
      .select('user_id, email_deadlines, instant_alerts')
      .eq('email_deadlines', true);

    console.log(`⏰ Processing application reminders for ${allUsersPrefs?.length || 0} users`);

    for (const userPref of allUsersPrefs || []) {
      try {
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
      } catch (error) {
        console.error(`Error processing application reminders for user ${userPref.user_id}:`, error);
      }
    }

    // Subscription expiry alerts and trial ending reminders removed —
    // the platform is now pay-as-you-go credits, not subscriptions.
    // Low-credit warnings are sent at the point of use (spend_credits RPC → API endpoint).

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

      const rawFreq = frequencySettings?.setting_value ?? 'weekly';
      const sendFrequency = typeof rawFreq === 'string' && rawFreq.startsWith('"') ? JSON.parse(rawFreq) : rawFreq;
      const sendDay = typeof sendDaySettings?.setting_value === 'number' ? sendDaySettings.setting_value : 1; // Default Monday

      let shouldSendNewsletter = false;
      if (sendFrequency === 'daily') {
        shouldSendNewsletter = true;
      } else if (sendFrequency === 'weekly') {
        shouldSendNewsletter = dayOfWeek === sendDay;
      } else if (sendFrequency === 'monthly') {
        shouldSendNewsletter = today.getDate() === 1; // First of month
      } else if (sendFrequency === 'bi-weekly') {
        const { data: lastDigestRow } = await supabase
          .from('newsletter_settings')
          .select('setting_value')
          .eq('setting_key', 'last_digest_sent')
          .single();
        const lastSentRaw = lastDigestRow?.setting_value;
        const lastSent = lastSentRaw && lastSentRaw !== 'null' ? new Date(typeof lastSentRaw === 'string' && lastSentRaw.startsWith('"') ? JSON.parse(lastSentRaw) : lastSentRaw) : null;
        const daysSince = (lastSent && !isNaN(lastSent.getTime())) ? (today.getTime() - lastSent.getTime()) / (24 * 60 * 60 * 1000) : 999;
        shouldSendNewsletter = daysSince >= 14; // Every two weeks
      }

      if (shouldSendNewsletter) {
        // Get active newsletter subscribers
        const { data: newsletterSubscribers } = await supabase
          .from('newsletter_subscribers')
          .select('id, email, source')
          .eq('status', 'active')
          .eq('scholarship_digest', true);

        console.log(`📧 Processing newsletter for ${newsletterSubscribers?.length || 0} subscribers`);

        // Deduplicate: skip newsletter subscribers who are already registered users
        // (they'll get the digest via the registered user flow above)
        let dedupedSubscribers = newsletterSubscribers || [];
        if (dedupedSubscribers.length > 0) {
          const emails = dedupedSubscribers.map((s: any) => s.email.toLowerCase());
          // Fetch registered user emails in batches of 500
          const registeredEmails = new Set<string>();
          for (let i = 0; i < emails.length; i += 500) {
            const chunk = emails.slice(i, i + 500);
            const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
            if (authUsers?.users) {
              for (const u of authUsers.users) {
                if (u.email) registeredEmails.add(u.email.toLowerCase());
              }
            }
            break; // listUsers returns all users in one call up to perPage
          }
          const before = dedupedSubscribers.length;
          dedupedSubscribers = dedupedSubscribers.filter((s: any) => !registeredEmails.has(s.email.toLowerCase()));
          const skipped = before - dedupedSubscribers.length;
          if (skipped > 0) console.log(`📧 Skipped ${skipped} newsletter subscribers who are already registered users`);
        }

        // Get batch size setting
        const { data: batchSettings } = await supabase
          .from('newsletter_settings')
          .select('setting_value')
          .eq('setting_key', 'max_emails_per_batch')
          .single();

        const batchSize = batchSettings?.setting_value || 100;

        // Process in batches to avoid overwhelming the email provider
        if (dedupedSubscribers.length > 0) {
          for (let i = 0; i < dedupedSubscribers.length; i += batchSize) {
            const batch = dedupedSubscribers.slice(i, i + batchSize);
            
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
            if (i + batchSize < dedupedSubscribers.length) {
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
    // Get new/recent scholarships from the last 2 weeks (curated digest, up to 10)
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    
    const { data: scholarships } = await supabase
      .from('scholarships')
      .select('id, title, provider, deadline, amount, description')
      .gte('created_at', twoWeeksAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (!scholarships || scholarships.length === 0) {
      console.log(`📊 No new scholarships for ${email}, skipping digest`);
      return false;
    }

    console.log(`📊 Sending scholarship digest to ${email} with ${scholarships.length} new scholarships`);
    
    // Generate email content
    const subject = source 
      ? `${scholarships.length} new scholarships this week — Abroaducate`
      : `${scholarships.length} new scholarships this week — Abroaducate`;
    
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
        const subject = `Deadline reminder: ${app.university_name} — ${daysUntil === 0 ? 'due today' : daysUntil === 1 ? '1 day left' : `${daysUntil} days left`}`;
        
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
    <div style="border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:16px;background:#fff;">
      <h4 style="color:#0f172a;margin:0 0 6px 0;font-size:16px;font-weight:700;font-family:'Outfit',sans-serif;">${s.title}</h4>
      <p style="color:#64748b;margin:0 0 10px 0;font-size:13px;">${s.provider}${s.location ? ` · ${s.location}` : ''}</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px;">
        ${s.amount ? `<span style="background:#f0fdf4;color:#16a34a;font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;border:1px solid #bbf7d0;">${s.amount}</span>` : ''}
        ${s.deadline ? `<span style="background:#fff7ed;color:#ea580c;font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;border:1px solid #fed7aa;">Deadline: ${new Date(s.deadline).toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric'})}</span>` : ''}
        ${s.level ? `<span style="background:#f1f5f9;color:#475569;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;border:1px solid #e2e8f0;">${s.level}</span>` : ''}
      </div>
      <a href="https://abroaducate.com/scholarships/${s.id}" style="color:#f97316;text-decoration:none;font-weight:700;font-size:13px;">View scholarship →</a>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Weekly Scholarship Digest</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#f1f5f9;padding:32px 16px;">
  <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:#0f172a;padding:28px 32px;text-align:center;position:relative;">
      <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(circle at 50% 0%,rgba(249,115,22,0.15),transparent 60%);"></div>
      <div style="position:relative;">
        <p style="color:#fff;font-size:22px;font-weight:800;margin:0;font-family:'Outfit',sans-serif;letter-spacing:-0.5px;">Abroaducate</p>
        <p style="color:#94a3b8;font-size:13px;margin:4px 0 0;">Your study abroad strategy platform</p>
      </div>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px;margin-bottom:24px;">
        <p style="color:#9a3412;font-weight:700;font-size:14px;margin:0 0 4px;">🎓 ${scholarships.length} New Scholarships This Week</p>
        <p style="color:#c2410c;font-size:13px;margin:0;">Fresh opportunities matched to your interests. Don't miss the deadlines.</p>
      </div>

      ${scholarshipCards}

      <div style="text-align:center;margin:28px 0 8px;">
        <a href="https://abroaducate.com/scholarships" style="display:inline-block;background:#f97316;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">Browse All Scholarships</a>
      </div>
      ${source ? `<div style="text-align:center;margin-top:12px;"><a href="https://abroaducate.com/register" style="display:inline-block;background:#0f172a;color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">Create Free Account</a></div>` : ''}
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="color:#64748b;font-size:12px;margin:0;">
        <a href="https://abroaducate.com/settings" style="color:#64748b;text-decoration:none;">Manage email preferences</a>
        &nbsp;·&nbsp;
        <a href="https://abroaducate.com" style="color:#64748b;text-decoration:none;">abroaducate.com</a>
      </p>
    </div>

  </div>
</div>
</body>
</html>`;
}

function generateScholarshipDigestText(scholarships: any[], source?: string): string {
  const scholarshipList = scholarships.map(s => `
- ${s.title}
  Provider: ${s.provider}
  ${s.amount ? `Amount: ${s.amount}` : ''}
  ${s.deadline ? `Deadline: ${new Date(s.deadline).toLocaleDateString()}` : ''}
  Link: https://abroaducate.com/scholarships/${s.id}
  `).join('\n');

  return `Abroaducate — ${scholarships.length} New Scholarships This Week

${scholarshipList}

Browse all scholarships: https://abroaducate.com/scholarships
${source ? 'Create free account: https://abroaducate.com/register' : 'Manage preferences: https://abroaducate.com/settings'}

Abroaducate · abroaducate.com
  `;
}

function generateApplicationReminderHTML(app: any, daysUntil: number, urgency: string): string {
  const isUrgent = daysUntil <= 3;
  const deadlineLabel = daysUntil === 0 ? 'Due today' : daysUntil === 1 ? '1 day left' : `${daysUntil} days left`;
  const deadlineFormatted = new Date(app.application_deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Application Deadline Reminder</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#f1f5f9;padding:32px 16px;">
  <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:#0f172a;padding:28px 32px;text-align:center;position:relative;">
      <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(circle at 50% 0%,rgba(249,115,22,0.15),transparent 60%);"></div>
      <div style="position:relative;">
        <p style="color:#fff;font-size:22px;font-weight:800;margin:0;font-family:'Outfit',sans-serif;letter-spacing:-0.5px;">Abroaducate</p>
        <p style="color:#94a3b8;font-size:13px;margin:4px 0 0;">Your study abroad strategy platform</p>
      </div>
    </div>

    <!-- Body -->
    <div style="padding:32px;">

      <!-- Urgency banner -->
      <div style="background:${isUrgent ? '#fff1f2' : '#fff7ed'};border:1px solid ${isUrgent ? '#fecdd3' : '#fed7aa'};border-radius:10px;padding:16px;margin-bottom:24px;">
        <p style="color:${isUrgent ? '#9f1239' : '#9a3412'};font-weight:700;font-size:14px;margin:0 0 4px;">Deadline reminder — ${deadlineLabel}</p>
        <p style="color:${isUrgent ? '#be123c' : '#c2410c'};font-size:13px;margin:0;">Don't miss your application window for this program.</p>
      </div>

      <!-- Program details -->
      <div style="border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;background:#f8fafc;">
        <h3 style="color:#0f172a;font-size:17px;font-weight:700;margin:0 0 4px;font-family:'Outfit',sans-serif;">${app.program_name}</h3>
        <p style="color:#64748b;font-size:14px;margin:0 0 16px;">${app.university_name}</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <span style="background:${isUrgent ? '#fff1f2' : '#fff7ed'};color:${isUrgent ? '#be123c' : '#ea580c'};font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;border:1px solid ${isUrgent ? '#fecdd3' : '#fed7aa'};">Deadline: ${deadlineFormatted}</span>
          <span style="background:#f1f5f9;color:#475569;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;border:1px solid #e2e8f0;">${deadlineLabel}</span>
        </div>
      </div>

      <div style="text-align:center;margin:28px 0 8px;">
        <a href="https://abroaducate.com/dashboard" style="display:inline-block;background:#f97316;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">Open Dashboard</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="color:#64748b;font-size:12px;margin:0;">
        <a href="https://abroaducate.com/settings" style="color:#64748b;text-decoration:none;">Manage email preferences</a>
        &nbsp;·&nbsp;
        <a href="https://abroaducate.com" style="color:#64748b;text-decoration:none;">abroaducate.com</a>
      </p>
    </div>

  </div>
</div>
</body>
</html>`;
}

function generateApplicationReminderText(app: any, daysUntil: number, urgency: string): string {
  const deadlineLabel = daysUntil === 0 ? 'Due today' : daysUntil === 1 ? '1 day left' : `${daysUntil} days left`;
  return `Abroaducate — Deadline reminder

${app.program_name}
${app.university_name}

Deadline: ${new Date(app.application_deadline).toLocaleDateString()} (${deadlineLabel})

Open your dashboard: https://abroaducate.com/dashboard

Manage preferences: https://abroaducate.com/settings
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
  const cronSecret = env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  return json({
    message: 'Email cron job endpoint is active',
    timestamp: new Date().toISOString(),
    note: 'Use POST method to execute the reminder job'
  });
}; 