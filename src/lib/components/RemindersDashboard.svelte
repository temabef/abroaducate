<script lang="ts">
  import { onMount } from 'svelte';
  import { getSupabase } from '$lib/supabase';
  import CalendarIntegration from './CalendarIntegration.svelte';

  const supabase = getSupabase();

  interface ScholarshipReminder {
    scholarship_id: string;
    title: string;
    provider: string;
    deadline: string;
    daysUntil: number;
    urgency: 'critical' | 'urgent' | 'important' | 'moderate';
    needsReminder: boolean;
  }

  interface EmailPreferences {
    email_enabled: boolean;
    email_deadlines: boolean;
    email_frequency: string;
  }

  let upcomingReminders: ScholarshipReminder[] = [];
  let emailPreferences: EmailPreferences | null = null;
  let loading = true;
  let testEmailSending = false;
  let testEmailResult = '';

  onMount(async () => {
    await loadReminderData();
    loading = false;
  });

  async function loadReminderData() {
    try {
      const response = await fetch('/api/email-reminders');
      if (response.ok) {
        const data = await response.json();
        upcomingReminders = data.upcomingReminders || [];
        emailPreferences = data.preferences;
      }
    } catch (error) {
      console.error('Error loading reminder data:', error);
    }
  }

  async function sendTestEmail() {
    if (upcomingReminders.length === 0) {
      testEmailResult = 'No upcoming deadlines to test with';
      return;
    }

    testEmailSending = true;
    testEmailResult = '';

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) {
      testEmailResult = 'User not logged in';
      testEmailSending = false;
      return;
    }

    try {
      const testScholarship = upcomingReminders[0];
      const response = await fetch('/api/email-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'deadline',
          recipients: [session.user.email],
          scholarshipData: testScholarship,
          userPreferences: emailPreferences
        })
      });

      if (response.ok) {
        testEmailResult = '✅ Test email sent successfully!';
      } else {
        testEmailResult = '❌ Failed to send test email';
      }
    } catch (error) {
      testEmailResult = '❌ Error sending test email';
      console.error('Test email error:', error);
    }

    testEmailSending = false;
    setTimeout(() => { testEmailResult = ''; }, 5000);
  }

  function getUrgencyColor(urgency: string): string {
    switch (urgency) {
      case 'critical': return '#DC2626'; // red-600
      case 'urgent': return '#EA580C';   // orange-600
      case 'important': return '#D97706'; // amber-600
      case 'moderate': return '#2563EB';  // blue-600
      default: return '#6B7280';         // gray-500
    }
  }

  function getUrgencyBadge(urgency: string): string {
    switch (urgency) {
      case 'critical': return 'URGENT';
      case 'urgent': return 'HIGH';
      case 'important': return 'MEDIUM';
      case 'moderate': return 'LOW';
      default: return 'NORMAL';
    }
  }

  function formatDeadlineDate(deadline: string): string {
    return new Date(deadline).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
</script>

<div class="reminders-dashboard">
  <div class="dashboard-header">
    <h2 class="dashboard-title">📬 Reminders & Notifications</h2>
    <p class="dashboard-subtitle">Manage your scholarship deadline reminders and email preferences</p>
  </div>

  {#if loading}
    <div class="loading-state">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="text-gray-600 mt-2">Loading your reminders...</p>
    </div>
  {:else}
    <!-- Email Status Overview -->
    <div class="email-status-card">
      <div class="status-header">
        <h3 class="status-title">📧 Email Notifications</h3>
        <div class="status-indicator {emailPreferences?.email_enabled ? 'enabled' : 'disabled'}">
          {emailPreferences?.email_enabled ? 'ENABLED' : 'DISABLED'}
        </div>
      </div>
      
      <div class="status-details">
        <div class="status-row">
          <span class="status-label">Deadline Reminders:</span>
          <span class="status-value {emailPreferences?.email_deadlines ? 'active' : 'inactive'}">
            {emailPreferences?.email_deadlines ? '✅ ON' : '❌ OFF'}
          </span>
        </div>
        <div class="status-row">
          <span class="status-label">Email Frequency:</span>
          <span class="status-value">{emailPreferences?.email_frequency || 'daily'}</span>
        </div>
      </div>

      <div class="status-actions">
        <a href="/account/preferences" class="settings-button">
          ⚙️ Manage Settings
        </a>
        <button 
          class="test-email-button" 
          on:click={sendTestEmail}
          disabled={testEmailSending || !emailPreferences?.email_enabled}
        >
          {testEmailSending ? '📤 Sending...' : '🧪 Send Test Email'}
        </button>
      </div>

      {#if testEmailResult}
        <div class="test-result {testEmailResult.includes('✅') ? 'success' : 'error'}">
          {testEmailResult}
        </div>
      {/if}
    </div>

    <!-- Upcoming Reminders -->
    <div class="reminders-section">
      <div class="section-header">
        <h3 class="section-title">⏰ Upcoming Deadline Reminders</h3>
        <span class="reminders-count">{upcomingReminders.length} active</span>
      </div>

      {#if upcomingReminders.length === 0}
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <h4 class="empty-title">No Upcoming Deadlines</h4>
          <p class="empty-description">
            You don't have any scholarship deadlines in the next 7 days. 
            <a href="/scholarships" class="empty-link">Browse scholarships</a> to find more opportunities.
          </p>
        </div>
      {:else}
        <div class="reminders-grid">
          {#each upcomingReminders as reminder}
            <div class="reminder-card" style="border-left-color: {getUrgencyColor(reminder.urgency)}">
              <div class="reminder-header">
                <div class="reminder-title">{reminder.title}</div>
                <div class="urgency-badge" style="background-color: {getUrgencyColor(reminder.urgency)}15; color: {getUrgencyColor(reminder.urgency)}">
                  {getUrgencyBadge(reminder.urgency)}
                </div>
              </div>
              
              <div class="reminder-details">
                <div class="detail-row">
                  <span class="detail-label">Provider:</span>
                  <span class="detail-value">{reminder.provider}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Deadline:</span>
                  <span class="detail-value">{formatDeadlineDate(reminder.deadline)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time Remaining:</span>
                  <span class="detail-value time-remaining" style="color: {getUrgencyColor(reminder.urgency)}">
                    {reminder.daysUntil === 0 ? 'Due Today!' : 
                     reminder.daysUntil === 1 ? '1 day left' : 
                     `${reminder.daysUntil} days left`}
                  </span>
                </div>
              </div>

              <div class="reminder-actions">
                <CalendarIntegration 
                  scholarship={{
                    id: reminder.scholarship_id,
                    title: reminder.title,
                    provider: reminder.provider,
                    deadline: reminder.deadline
                  }}
                />
                <a 
                  href="/scholarships/my-applications" 
                  class="view-button"
                >
                  👁️ View Details
                </a>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <div class="section-header">
        <h3 class="section-title">🚀 Quick Actions</h3>
      </div>
      
      <div class="actions-grid">
        <a href="/scholarships" class="action-card">
          <div class="action-icon">🔍</div>
          <div class="action-content">
            <div class="action-title">Browse Scholarships</div>
            <div class="action-description">Find new scholarship opportunities</div>
          </div>
        </a>

        <a href="/scholarships/my-applications" class="action-card">
          <div class="action-icon">📊</div>
          <div class="action-content">
            <div class="action-title">View Dashboard</div>
            <div class="action-description">Check all your applications</div>
          </div>
        </a>

        <a href="/account/preferences" class="action-card">
          <div class="action-icon">⚙️</div>
          <div class="action-content">
            <div class="action-title">Email Settings</div>
            <div class="action-description">Manage notification preferences</div>
          </div>
        </a>

        <button class="action-card" on:click={loadReminderData}>
          <div class="action-icon">🔄</div>
          <div class="action-content">
            <div class="action-title">Refresh Data</div>
            <div class="action-description">Update reminder information</div>
          </div>
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .reminders-dashboard {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
  }

  .dashboard-header {
    margin-bottom: 32px;
    text-align: center;
  }

  .dashboard-title {
    font-size: 28px;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 8px;
  }

  .dashboard-subtitle {
    color: #6b7280;
    font-size: 16px;
    margin: 0;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
  }

  .email-status-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    padding: 24px;
    margin-bottom: 32px;
  }

  .status-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .status-title {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .status-indicator {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
  }

  .status-indicator.enabled {
    background-color: #d1fae5;
    color: #065f46;
  }

  .status-indicator.disabled {
    background-color: #fee2e2;
    color: #991b1b;
  }

  .status-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 20px;
  }

  .status-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .status-label {
    color: #6b7280;
    font-weight: 500;
  }

  .status-value {
    font-weight: 600;
  }

  .status-value.active {
    color: #059669;
  }

  .status-value.inactive {
    color: #dc2626;
  }

  .status-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .settings-button, .test-email-button {
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .settings-button {
    background-color: #2563eb;
    color: white;
  }

  .settings-button:hover {
    background-color: #1d4ed8;
  }

  .test-email-button {
    background-color: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .test-email-button:hover:not(:disabled) {
    background-color: #e5e7eb;
  }

  .test-email-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .test-result {
    margin-top: 12px;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 14px;
    text-align: center;
  }

  .test-result.success {
    background-color: #d1fae5;
    color: #065f46;
  }

  .test-result.error {
    background-color: #fee2e2;
    color: #991b1b;
  }

  .reminders-section {
    margin-bottom: 32px;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .section-title {
    font-size: 20px;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .reminders-count {
    background-color: #e5e7eb;
    color: #374151;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  }

  .empty-state {
    background: white;
    border-radius: 12px;
    padding: 48px 24px;
    text-align: center;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .empty-title {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 8px;
  }

  .empty-description {
    color: #6b7280;
    margin: 0;
  }

  .empty-link {
    color: #2563eb;
    text-decoration: none;
    font-weight: 500;
  }

  .empty-link:hover {
    text-decoration: underline;
  }

  .reminders-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
  }

  .reminder-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    padding: 20px;
    border-left: 4px solid;
  }

  .reminder-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .reminder-title {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    line-height: 1.4;
    flex: 1;
    margin-right: 12px;
  }

  .urgency-badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .reminder-details {
    margin-bottom: 16px;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .detail-label {
    color: #6b7280;
    font-weight: 500;
    font-size: 14px;
  }

  .detail-value {
    color: #1f2937;
    font-weight: 600;
    font-size: 14px;
  }

  .time-remaining {
    font-weight: 700;
  }

  .reminder-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .view-button {
    padding: 6px 12px;
    background-color: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s;
  }

  .view-button:hover {
    background-color: #e5e7eb;
  }

  .quick-actions {
    margin-bottom: 32px;
  }

  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
  }

  .action-card {
    display: flex;
    align-items: center;
    gap: 16px;
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    text-decoration: none;
    color: inherit;
    transition: all 0.2s;
    border: 1px solid transparent;
    cursor: pointer;
  }

  .action-card:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border-color: #e5e7eb;
    transform: translateY(-1px);
  }

  .action-icon {
    font-size: 24px;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #eff6ff;
    border-radius: 12px;
    flex-shrink: 0;
  }

  .action-content {
    flex: 1;
  }

  .action-title {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 4px;
  }

  .action-description {
    font-size: 14px;
    color: #6b7280;
  }

  @media (max-width: 768px) {
    .reminders-dashboard {
      padding: 16px;
    }

    .status-details {
      grid-template-columns: 1fr;
    }

    .status-actions {
      flex-direction: column;
      align-items: stretch;
    }

    .reminders-grid {
      grid-template-columns: 1fr;
    }

    .actions-grid {
      grid-template-columns: 1fr;
    }

    .reminder-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .reminder-title {
      margin-right: 0;
    }
  }
</style> 