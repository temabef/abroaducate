import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Security check for cron jobs
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key';

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
  try {
    // Verify cron job authentication
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🕐 Starting automated scholarship deadline reminders...');

    // Get all users with scholarship applications and their email preferences
    const { data: usersWithScholarships, error: usersError } = await supabase
      .from('user_scholarship_interactions')
      .select(`
        user_id,
        scholarship_id,
        status,
        priority,
        scholarships!inner(
          title,
          provider,
          deadline,
          amount,
          location
        ),
        users!inner(
          email
        )
      `)
      .not('scholarships.deadline', 'is', null)
      .filter('scholarships.deadline', 'gte', new Date().toISOString())
      .eq('status', 'interested')
      .order('scholarships.deadline', { ascending: true });

    if (usersError) {
      console.error('Error fetching users with scholarships:', usersError);
      return json({ error: 'Database error' }, { status: 500 });
    }

    if (!usersWithScholarships || usersWithScholarships.length === 0) {
      console.log('No active scholarship applications found');
      return json({ success: true, message: 'No reminders to send', processed: 0 });
    }

    // Group by user and filter for reminders needed
    const userReminders = new Map();
    const today = new Date();
    
    usersWithScholarships.forEach(item => {
      const scholarship = item.scholarships;
      const userEmail = item.users.email;
      const deadline = new Date(scholarship.deadline);
      const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Send reminders for specific day intervals
      const shouldSendReminder = [30, 14, 7, 3, 1].includes(daysUntil);
      
      if (shouldSendReminder) {
        if (!userReminders.has(item.user_id)) {
          userReminders.set(item.user_id, {
            email: userEmail,
            scholarships: []
          });
        }
        
        let urgency: 'critical' | 'urgent' | 'important' | 'moderate' = 'moderate';
        if (daysUntil <= 1) urgency = 'critical';
        else if (daysUntil <= 3) urgency = 'urgent';
        else if (daysUntil <= 7) urgency = 'important';
        
        userReminders.get(item.user_id).scholarships.push({
          scholarship_id: item.scholarship_id,
          title: scholarship.title,
          provider: scholarship.provider,
          deadline: scholarship.deadline,
          daysUntil,
          urgency,
          priority: item.priority
        });
      }
    });

    console.log(`📧 Found ${userReminders.size} users needing reminders`);

    // Get user preferences for email notifications
    const userIds = Array.from(userReminders.keys());
    const { data: preferences, error: prefsError } = await supabase
      .from('user_preferences')
      .select('user_id, email_enabled, email_deadlines, email_frequency')
      .in('user_id', userIds);

    if (prefsError) {
      console.error('Error fetching user preferences:', prefsError);
    }

    // Create preferences map with defaults
    const prefsMap = new Map();
    preferences?.forEach(pref => {
      prefsMap.set(pref.user_id, pref);
    });

    // Send emails for each user
    let emailsSent = 0;
    let emailsFailed = 0;
    
    for (const [userId, userData] of userReminders) {
      const userPrefs = prefsMap.get(userId) || {
        email_enabled: true,
        email_deadlines: true,
        email_frequency: 'daily'
      };

      // Skip if user has disabled email notifications
      if (!userPrefs.email_enabled || !userPrefs.email_deadlines) {
        console.log(`Skipping user ${userId} - email notifications disabled`);
        continue;
      }

      // Check if we should send based on frequency preference
      const shouldSendBasedOnFrequency = await shouldSendEmailBasedOnFrequency(
        supabase, 
        userId, 
        userPrefs.email_frequency
      );

      if (!shouldSendBasedOnFrequency) {
        console.log(`Skipping user ${userId} - frequency preference not met`);
        continue;
      }

      // Process each scholarship for this user
      for (const scholarship of userData.scholarships) {
        try {
          // Check if we've already sent this specific reminder
          const { data: existingReminder, error: reminderCheckError } = await supabase
            .from('email_logs')
            .select('id')
            .eq('user_id', userId)
            .eq('scholarship_data->>title', scholarship.title)
            .eq('email_type', 'deadline')
            .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
            .single();

          if (existingReminder) {
            console.log(`Reminder already sent for ${scholarship.title} to user ${userId}`);
            continue;
          }

          // Send email reminder
          const emailResponse = await fetch('http://localhost:5173/api/email-reminders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'deadline',
              recipients: [userData.email],
              scholarshipData: scholarship,
              userPreferences: userPrefs
            })
          });

          if (emailResponse.ok) {
            emailsSent++;
            console.log(`✅ Sent reminder for ${scholarship.title} to ${userData.email}`);
            
            // Log the reminder sent
            await supabase
              .from('user_activity')
              .insert({
                user_id: userId,
                activity_type: 'email_reminder_sent',
                entity_type: 'scholarship',
                entity_id: scholarship.scholarship_id,
                metadata: {
                  email_type: 'deadline',
                  days_until_deadline: scholarship.daysUntil,
                  urgency: scholarship.urgency
                }
              });
              
          } else {
            emailsFailed++;
            console.error(`❌ Failed to send reminder for ${scholarship.title} to ${userData.email}`);
          }
          
          // Add delay between emails to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          emailsFailed++;
          console.error(`Error sending reminder for ${scholarship.title}:`, error);
        }
      }
    }

    console.log(`📊 Reminder job completed: ${emailsSent} sent, ${emailsFailed} failed`);

    return json({
      success: true,
      message: 'Reminder job completed',
      statistics: {
        usersProcessed: userReminders.size,
        emailsSent,
        emailsFailed,
        totalReminders: emailsSent + emailsFailed
      }
    });

  } catch (error) {
    console.error('Error in reminder cron job:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

// Helper function to check email frequency preferences
async function shouldSendEmailBasedOnFrequency(
  supabase: any,
  userId: string,
  frequency: string
): Promise<boolean> {
  if (frequency === 'immediate') {
    return true;
  }

  // Get last email sent time
  const { data: lastEmail, error } = await supabase
    .from('email_logs')
    .select('sent_at')
    .eq('user_id', userId)
    .order('sent_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !lastEmail) {
    return true; // First email or error - send it
  }

  const lastEmailTime = new Date(lastEmail.sent_at);
  const now = new Date();
  const hoursSinceLastEmail = (now.getTime() - lastEmailTime.getTime()) / (1000 * 60 * 60);

  if (frequency === 'daily') {
    return hoursSinceLastEmail >= 24;
  } else if (frequency === 'weekly') {
    return hoursSinceLastEmail >= 168; // 24 * 7
  }

  return true;
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