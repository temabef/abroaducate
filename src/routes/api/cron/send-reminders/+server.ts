import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SUPABASE_SERVICE_ROLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/private';
import { createClient } from '@supabase/supabase-js';

// Create admin client for server operations
const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const POST: RequestHandler = async ({ request }) => {
  try {
    console.log('🔄 Starting hybrid email reminder cron job...');

    // Get the current day of week (0 = Sunday, 1 = Monday, etc.)
    const today = new Date();
    const dayOfWeek = today.getDay();

    let totalEmailsSent = 0;
    let emailsProcessed = {
      scholarship_digest: 0,
      application_reminders: 0,
      subscription_alerts: 0,
      instant_alerts: 0
    };

    // ============ SCHOLARSHIP DIGEST (EVERYONE - WEEKLY/DAILY) ============
    
    // Send scholarship digest based on user preferences
    const { data: scholarshipUsers } = await supabase
      .from('user_preferences')
      .select(`
        user_id,
        scholarship_digest,
        scholarship_frequency
      `)
      .eq('scholarship_digest', true);

    console.log(`📊 Processing scholarship digest for ${scholarshipUsers?.length || 0} users`);

    for (const user of scholarshipUsers || []) {
      const shouldSendToday = 
        (user.scholarship_frequency === 'weekly' && dayOfWeek === 1) || // Monday for weekly
        (user.scholarship_frequency === 'daily'); // Every day for daily

      if (shouldSendToday) {
        try {
          // Get user email from auth.users
          const { data: authUser } = await supabase.auth.admin.getUserById(user.user_id);
          
          if (authUser.user?.email) {
            await sendScholarshipDigest(authUser.user.email, user.user_id);
            emailsProcessed.scholarship_digest++;
            totalEmailsSent++;
          }
        } catch (error) {
          console.error(`Error sending scholarship digest to user ${user.user_id}:`, error);
        }
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
        // Check if user has active paid subscription
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('plan_type, status')
          .eq('user_id', userPref.user_id)
          .eq('status', 'active')
          .single();

        // Only send to users with active paid subscriptions
        if (subscription && ['professional', 'elite'].includes(subscription.plan_type)) {
          const { data: authUser } = await supabase.auth.admin.getUserById(userPref.user_id);
          
          if (authUser.user?.email) {
            const remindersSent = await sendApplicationReminders(
              authUser.user.email, 
              userPref.user_id,
              userPref.instant_alerts || false
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
              await sendSubscriptionAlert(
                authUser.user.email,
                subscription.user_id,
                subscription.plan_type,
                daysAhead
              );
              emailsProcessed.subscription_alerts++;
              totalEmailsSent++;
            }
          }
        } catch (error) {
          console.error(`Error sending subscription alert for user ${subscription.user_id}:`, error);
        }
      }
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
          instant_alert_emails: emailsProcessed.instant_alerts
        });
    } catch (logError) {
      console.error('Error logging email activity:', logError);
    }

    console.log('✅ Hybrid email cron job completed successfully:', emailsProcessed);

    return json({
      success: true,
      total_emails_sent: totalEmailsSent,
      breakdown: emailsProcessed
    });

  } catch (error) {
    console.error('❌ Error in hybrid email cron job:', error);
    return json({ error: 'Failed to process emails' }, { status: 500 });
  }
};

// ============ EMAIL SENDING FUNCTIONS ============

async function sendScholarshipDigest(email: string, userId: string): Promise<void> {
  // Get new scholarships from the last week/day based on frequency
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const { data: scholarships } = await supabase
    .from('scholarships')
    .select('id, title, provider, deadline, amount')
    .gte('created_at', oneWeekAgo.toISOString())
    .limit(10);

  if (scholarships && scholarships.length > 0) {
    console.log(`📊 Sending scholarship digest to ${email} with ${scholarships.length} new scholarships`);
    
    // Here you would integrate with your SendGrid template for scholarship digest
    // For now, we'll just log the activity
    
    try {
      await supabase
        .from('email_logs')
        .insert({
          user_id: userId,
          email_type: 'scholarship_digest',
          recipient: email,
          status: 'sent',
          content_summary: `${scholarships.length} new scholarships`,
          sent_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging scholarship digest email:', logError);
    }
  }
}

async function sendApplicationReminders(email: string, userId: string, instantAlerts: boolean): Promise<number> {
  // Get upcoming application deadlines
  const { data: applications } = await supabase
    .from('applications')
    .select('id, application_deadline')
    .eq('user_id', userId)
    .not('application_deadline', 'is', null);

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
      
      // Here you would integrate with your SendGrid template for application reminders
      
      try {
        await supabase
          .from('email_logs')
          .insert({
            user_id: userId,
            email_type: 'application_reminder',
            recipient: email,
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

  return remindersSent;
}

async function sendSubscriptionAlert(email: string, userId: string, planType: string, daysUntilExpiry: number): Promise<void> {
  console.log(`🔔 Sending subscription alert to ${email} - ${planType} expires in ${daysUntilExpiry} days`);
  
  // Here you would integrate with your SendGrid template for subscription alerts
  
  try {
    await supabase
      .from('email_logs')
      .insert({
        user_id: userId,
        email_type: 'subscription_alert',
        recipient: email,
        status: 'sent',
        content_summary: `${planType} subscription expires in ${daysUntilExpiry} days`,
        sent_at: new Date().toISOString()
      });
  } catch (logError) {
    console.error('Error logging subscription alert email:', logError);
  }
}

// GET endpoint for manual testing
export const GET: RequestHandler = async ({ request }) => {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  return json({
    message: 'Cron job endpoint is active',
    timestamp: new Date().toISOString(),
    note: 'Use POST method to execute the reminder job'
  });
}; 