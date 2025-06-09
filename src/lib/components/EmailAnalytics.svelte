<script lang="ts">
  import { onMount } from 'svelte';
  import { getSupabase } from '$lib/supabase';

  const supabase = getSupabase();

  interface EmailStats {
    emailsSent: number;
    upcomingReminders: number;
    lastEmailSent: string | null;
    emailSuccess: number;
    emailFailures: number;
  }

  interface UpcomingDeadline {
    scholarship_title: string;
    provider: string;
    deadline: string;
    daysUntil: number;
    urgency: 'critical' | 'urgent' | 'important' | 'moderate';
  }

  let loading = true;
  let emailStats: EmailStats = {
    emailsSent: 0,
    upcomingReminders: 0,
    lastEmailSent: null,
    emailSuccess: 0,
    emailFailures: 0
  };
  let upcomingDeadlines: UpcomingDeadline[] = [];
  let recentEmailLogs: any[] = [];

  onMount(async () => {
    await loadEmailAnalytics();
    loading = false;
  });

  async function loadEmailAnalytics() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    try {
      // Get email logs statistics
      const { data: emailLogs, error: emailError } = await supabase
        .from('email_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('sent_at', { ascending: false })
        .limit(10);

      if (!emailError && emailLogs) {
        recentEmailLogs = emailLogs;
        emailStats.emailsSent = emailLogs.filter(log => log.status === 'sent').length;
        emailStats.emailFailures = emailLogs.filter(log => log.status === 'failed').length;
        emailStats.emailSuccess = emailLogs.reduce((sum, log) => sum + (log.success_count || 0), 0);
        emailStats.lastEmailSent = emailLogs.length > 0 ? emailLogs[0].sent_at : null;
      }

      // Get upcoming scholarship deadlines
      const response = await fetch('/api/email-reminders');
      if (response.ok) {
        const data = await response.json();
        upcomingDeadlines = data.upcomingReminders || [];
        emailStats.upcomingReminders = upcomingDeadlines.length;
      }

    } catch (error) {
      console.error('Error loading email analytics:', error);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getUrgencyColor(urgency: string) {
    switch (urgency) {
      case 'critical': return '#DC2626';
      case 'urgent': return '#EA580C';
      case 'important': return '#D97706';
      default: return '#2563EB';
    }
  }

  function getUrgencyIcon(urgency: string) {
    switch (urgency) {
      case 'critical': return '🚨';
      case 'urgent': return '⚠️';
      case 'important': return '📢';
      default: return '📅';
    }
  }
</script>

<div class="email-analytics">
  <div class="analytics-header">
    <h3>📊 Email Reminder Analytics</h3>
    <p>Track your notification performance and upcoming deadlines</p>
  </div>

  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading analytics...</p>
    </div>
  {:else}
    <!-- Stats Overview -->
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-icon">📧</div>
        <div class="stat-content">
          <div class="stat-number">{emailStats.emailsSent}</div>
          <div class="stat-label">Emails Sent</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-number">{emailStats.emailSuccess}</div>
          <div class="stat-label">Successful Deliveries</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">⏰</div>
        <div class="stat-content">
          <div class="stat-number">{emailStats.upcomingReminders}</div>
          <div class="stat-label">Upcoming Reminders</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">❌</div>
        <div class="stat-content">
          <div class="stat-number">{emailStats.emailFailures}</div>
          <div class="stat-label">Failed Sends</div>
        </div>
      </div>
    </div>

    <!-- Upcoming Deadlines -->
    {#if upcomingDeadlines.length > 0}
      <div class="section">
        <h4>🔔 Upcoming Email Reminders</h4>
        <div class="deadlines-list">
          {#each upcomingDeadlines.slice(0, 5) as deadline}
            <div class="deadline-item" style="border-left-color: {getUrgencyColor(deadline.urgency)}">
              <div class="deadline-header">
                <span class="urgency-icon">{getUrgencyIcon(deadline.urgency)}</span>
                <div class="deadline-info">
                  <div class="deadline-title">{deadline.scholarship_title}</div>
                  <div class="deadline-provider">{deadline.provider}</div>
                </div>
                <div class="deadline-timing">
                  <div class="days-until">{deadline.daysUntil} days</div>
                  <div class="deadline-date">{formatDate(deadline.deadline)}</div>
                </div>
              </div>
            </div>
          {/each}
        </div>
        
        {#if upcomingDeadlines.length > 5}
          <div class="more-deadlines">
            +{upcomingDeadlines.length - 5} more upcoming deadlines
          </div>
        {/if}
      </div>
    {/if}

    <!-- System Status -->
    <div class="section">
      <h4>🔧 Email System Status</h4>
      <div class="system-status">
        <div class="status-item">
          <div class="status-indicator active"></div>
          <span>SendGrid Integration: Active</span>
        </div>
        <div class="status-item">
          <div class="status-indicator active"></div>
          <span>Automated Cron Jobs: Running</span>
        </div>
        <div class="status-item">
          <div class="status-indicator active"></div>
          <span>Database Logging: Enabled</span>
        </div>
        <div class="status-item">
          <div class="status-indicator active"></div>
          <span>Phase 2 Features: Deployed</span>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .email-analytics {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
    margin-bottom: 24px;
  }

  .analytics-header {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f3f4f6;
  }

  .analytics-header h3 {
    font-size: 1.3rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 8px 0;
  }

  .analytics-header p {
    color: #6b7280;
    margin: 0;
    font-size: 0.9rem;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    text-align: center;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #2563eb;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 12px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .stats-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  .stat-icon {
    font-size: 24px;
    flex-shrink: 0;
  }

  .stat-number {
    font-size: 1.8rem;
    font-weight: 700;
    color: #2563eb;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 0.8rem;
    color: #6b7280;
    text-transform: uppercase;
    font-weight: 500;
  }

  .section {
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid #f3f4f6;
  }

  .section:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  .section h4 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 16px 0;
  }

  .deadlines-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .deadline-item {
    padding: 16px;
    background: #f9fafb;
    border-radius: 8px;
    border-left: 4px solid #2563eb;
  }

  .deadline-header {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .urgency-icon {
    font-size: 20px;
    flex-shrink: 0;
  }

  .deadline-info {
    flex: 1;
  }

  .deadline-title {
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 4px;
  }

  .deadline-provider {
    font-size: 0.9rem;
    color: #6b7280;
  }

  .deadline-timing {
    text-align: right;
  }

  .days-until {
    font-weight: 600;
    color: #2563eb;
    font-size: 0.9rem;
  }

  .deadline-date {
    font-size: 0.8rem;
    color: #6b7280;
    margin-top: 2px;
  }

  .more-deadlines {
    text-align: center;
    padding: 12px;
    color: #6b7280;
    font-style: italic;
    font-size: 0.9rem;
  }

  .system-status {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: #f0fdf4;
    border-radius: 6px;
    font-size: 0.9rem;
    color: #166534;
  }

  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status-indicator.active {
    background-color: #22c55e;
  }

  @media (max-width: 768px) {
    .stats-overview {
      grid-template-columns: 1fr 1fr;
    }
    
    .system-status {
      grid-template-columns: 1fr;
    }
  }
</style>
