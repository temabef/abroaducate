<script lang="ts">
  import { onMount } from 'svelte';
  
  // Campaign Management State
  let loading = false;
  let message = '';
  let messageType = 'info';
  
  // Campaign Data
  let campaigns = [];
  let templates = [];
  let segments = [];
  let selectedTemplate = '';
  let selectedSegments = ['imported_lead'];
  let campaignName = '';
  let scheduleDate = '';
  let previewMode = false;
  
  // Dashboard Data
  let dashboardStats = {
    recent_campaigns: [],
    summary: {}
  };

  onMount(async () => {
    await loadDashboardData();
    await loadTemplates();
    await loadSegments();
  });

  async function loadDashboardData() {
    try {
      loading = true;
      const response = await fetch('/api/newsletter/campaigns/dashboard');
      const data = await response.json();
      
      if (response.ok) {
        dashboardStats = data;
      } else {
        showMessage(data.error || 'Failed to load dashboard', 'error');
      }
    } catch (error) {
      showMessage('Error loading dashboard', 'error');
      console.error('Dashboard error:', error);
    } finally {
      loading = false;
    }
  }

  async function loadTemplates() {
    try {
      const response = await fetch('/api/newsletter/templates');
      const data = await response.json();
      
      if (response.ok) {
        templates = data.templates || [];
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }

  async function loadSegments() {
    try {
      const response = await fetch('/api/newsletter/segments');
      const data = await response.json();
      
      if (response.ok) {
        segments = data.segments || [];
      }
    } catch (error) {
      console.error('Error loading segments:', error);
    }
  }

  async function createCampaign() {
    if (!campaignName.trim() || !selectedTemplate) {
      showMessage('Please fill in campaign name and select a template', 'error');
      return;
    }

    try {
      loading = true;
      
      const campaignData = {
        campaign_name: campaignName.trim(),
        template_id: selectedTemplate,
        target_segments: selectedSegments,
        schedule_for: scheduleDate ? new Date(scheduleDate).toISOString() : null
      };

      const response = await fetch('/api/newsletter/campaigns/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData)
      });

      const data = await response.json();

      if (response.ok) {
        showMessage(`Campaign created successfully! ${data.recipient_count} recipients targeted.`, 'success');
        await loadDashboardData();
        resetForm();
      } else {
        showMessage(data.error || 'Failed to create campaign', 'error');
      }
    } catch (error) {
      showMessage('Error creating campaign', 'error');
      console.error('Campaign creation error:', error);
    } finally {
      loading = false;
    }
  }

  async function sendCampaign(campaignId: string, immediately = false) {
    try {
      loading = true;
      
      const response = await fetch('/api/newsletter/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          send_immediately: immediately,
          batch_size: 100
        })
      });

      const data = await response.json();

      if (response.ok) {
        const status = immediately ? 'started' : 'scheduled';
        showMessage(`Campaign ${status} successfully! ${data.total_recipients} recipients.`, 'success');
        await loadDashboardData();
      } else {
        showMessage(data.error || 'Failed to send campaign', 'error');
      }
    } catch (error) {
      showMessage('Error sending campaign', 'error');
      console.error('Campaign send error:', error);
    } finally {
      loading = false;
    }
  }

  function resetForm() {
    campaignName = '';
    selectedTemplate = '';
    selectedSegments = ['imported_lead'];
    scheduleDate = '';
  }

  function showMessage(text: string, type: 'success' | 'error' | 'info' = 'info') {
    message = text;
    messageType = type;
    setTimeout(() => {
      message = '';
    }, 5000);
  }

  function formatNumber(num: number): string {
    return new Intl.NumberFormat().format(num);
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'sent': return 'text-green-600';
      case 'sending': return 'text-blue-600';
      case 'scheduled': return 'text-yellow-600';
      case 'draft': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  }

  function getSelectedSegmentInfo() {
    return segments.filter(s => selectedSegments.includes(s.segment));
  }

  $: totalTargetedSubscribers = getSelectedSegmentInfo().reduce((sum, seg) => sum + (seg.active_count || 0), 0);
</script>

<svelte:head>
  <title>Email Campaign Manager - Admin</title>
</svelte:head>

<div class="campaign-manager">
  <div class="header">
    <h1>📧 Email Campaign Manager</h1>
    <p>Send emails to your {formatNumber(segments.find(s => s.segment === 'imported_lead')?.active_count || 0)} imported subscribers</p>
  </div>

  <!-- Message Display -->
  {#if message}
    <div class="message {messageType}">
      {message}
    </div>
  {/if}

  <!-- Dashboard Overview -->
  <div class="dashboard-section">
    <h2>📊 Campaign Dashboard</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Total Campaigns</h3>
        <p class="big-number">{dashboardStats.summary?.total_campaigns || 0}</p>
      </div>
      <div class="stat-card">
        <h3>Emails Sent</h3>
        <p class="big-number">{formatNumber(dashboardStats.summary?.total_emails_sent || 0)}</p>
      </div>
      <div class="stat-card">
        <h3>Avg Open Rate</h3>
        <p class="big-number">{dashboardStats.summary?.avg_open_rate || 0}%</p>
      </div>
      <div class="stat-card">
        <h3>Active Campaigns</h3>
        <p class="big-number">{dashboardStats.summary?.active_campaigns || 0}</p>
      </div>
    </div>
  </div>

  <!-- Subscriber Segments -->
  <div class="segments-section">
    <h2>👥 Your Email Segments</h2>
    <div class="segments-grid">
      {#each segments as segment}
        <div class="segment-card">
          <h4>{segment.segment === 'imported_lead' ? '📥 Imported Leads' : 
               segment.segment === 'website_signup' ? '🌐 Website Signups' : 
               segment.segment === 'user_registration' ? '👤 Registered Users' : segment.segment}</h4>
          <p class="segment-count">{formatNumber(segment.active_count)} active</p>
          <p class="segment-total">of {formatNumber(segment.count)} total</p>
          <p class="segment-engagement">Avg engagement: {segment.avg_engagement}/10</p>
          <p class="segment-desc">{segment.description}</p>
        </div>
      {/each}
    </div>
  </div>

  <!-- Create Campaign -->
  <div class="create-campaign-section">
    <h2>✉️ Create New Campaign</h2>
    <div class="campaign-form">
      <div class="form-row">
        <div class="form-group">
          <label for="campaign-name">Campaign Name</label>
          <input
            type="text"
            id="campaign-name"
            bind:value={campaignName}
            placeholder="e.g., February Study Tips"
            disabled={loading}
          />
        </div>

        <div class="form-group">
          <label for="template">Email Template</label>
          <select id="template" bind:value={selectedTemplate} disabled={loading}>
            <option value="">Select a template...</option>
            {#each templates as template}
              <option value={template.id}>
                {template.template_name} ({template.template_category})
              </option>
            {/each}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>Target Segments</label>
        <div class="checkbox-group">
          {#each segments as segment}
            <label class="checkbox-item">
              <input
                type="checkbox"
                bind:group={selectedSegments}
                value={segment.segment}
                disabled={loading}
              />
              <span>
                {segment.segment === 'imported_lead' ? '📥 Imported Leads' : 
                 segment.segment === 'website_signup' ? '🌐 Website Signups' : 
                 segment.segment === 'user_registration' ? '👤 Registered Users' : segment.segment}
                ({formatNumber(segment.active_count)} active)
              </span>
            </label>
          {/each}
        </div>
        {#if totalTargetedSubscribers > 0}
          <p class="targeting-info">
            📧 Will send to <strong>{formatNumber(totalTargetedSubscribers)}</strong> subscribers
          </p>
        {/if}
      </div>

      <div class="form-group">
        <label for="schedule">Schedule (Optional)</label>
        <input
          type="datetime-local"
          id="schedule"
          bind:value={scheduleDate}
          disabled={loading}
        />
        <small>Leave empty to create as draft</small>
      </div>

      <div class="form-actions">
        <button
          class="create-btn"
          on:click={createCampaign}
          disabled={loading || !campaignName.trim() || !selectedTemplate}
        >
          {loading ? 'Creating...' : 'Create Campaign'}
        </button>
        <button class="reset-btn" on:click={resetForm} disabled={loading}>
          Reset Form
        </button>
      </div>
    </div>
  </div>

  <!-- Recent Campaigns -->
  <div class="campaigns-section">
    <h2>📋 Recent Campaigns</h2>
    {#if dashboardStats.recent_campaigns && dashboardStats.recent_campaigns.length > 0}
      <div class="campaigns-table">
        <div class="table-header">
          <div class="col-name">Campaign</div>
          <div class="col-status">Status</div>
          <div class="col-recipients">Recipients</div>
          <div class="col-performance">Performance</div>
          <div class="col-actions">Actions</div>
        </div>
        {#each dashboardStats.recent_campaigns as campaign}
          <div class="table-row">
            <div class="col-name">
              <strong>{campaign.name}</strong>
              <br />
              <small>{campaign.subject}</small>
            </div>
            <div class="col-status">
              <span class="status-badge {getStatusColor(campaign.status)}">
                {campaign.status}
              </span>
              {#if campaign.sent_at}
                <br /><small>Sent {formatDate(campaign.sent_at)}</small>
              {/if}
            </div>
            <div class="col-recipients">
              <strong>{formatNumber(campaign.recipients)}</strong>
              <br />
              <small>{formatNumber(campaign.sent)} sent</small>
            </div>
            <div class="col-performance">
              {#if campaign.sent > 0}
                <div>📧 {campaign.open_rate}% opens</div>
                <div>🔗 {campaign.click_rate}% clicks</div>
              {:else}
                <span class="text-gray-500">Not sent yet</span>
              {/if}
            </div>
            <div class="col-actions">
              {#if campaign.status === 'draft'}
                <button
                  class="send-btn small"
                  on:click={() => sendCampaign(campaign.id, true)}
                  disabled={loading}
                >
                  Send Now
                </button>
              {:else if campaign.status === 'scheduled'}
                <span class="text-yellow-600">⏰ Scheduled</span>
              {:else}
                <span class="text-gray-500">Complete</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="no-campaigns">
        <p>📭 No campaigns created yet</p>
        <p>Create your first campaign using the form above</p>
      </div>
    {/if}
  </div>

  <!-- Quick Tips -->
  <div class="tips-section">
    <h2>💡 Campaign Tips</h2>
    <div class="tips-grid">
      <div class="tip-card">
        <h4>🎯 Start with Imported Leads</h4>
        <p>Your {formatNumber(segments.find(s => s.segment === 'imported_lead')?.active_count || 0)} imported emails are perfect for general study abroad content and scholarship digests.</p>
      </div>
      <div class="tip-card">
        <h4>📅 Send Bi-weekly or Monthly</h4>
        <p>To avoid bombardment, send study tips monthly and scholarship digests bi-weekly to your imported leads.</p>
      </div>
      <div class="tip-card">
        <h4>📊 Monitor Engagement</h4>
        <p>Track open rates and unsubscribes. Good performance for cold lists: 15-25% open rate, <5% unsubscribe rate.</p>
      </div>
      <div class="tip-card">
        <h4>🎨 Use Templates</h4>
        <p>Pre-made templates ensure consistent branding and save time. Customize them for your specific content.</p>
      </div>
    </div>
  </div>
</div>

<style>
  .campaign-manager {
    max-width: 1200px;
    margin: 0 auto;
    padding: 80px 24px 24px 24px; /* Added extra top padding to account for fixed navbar */
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    min-height: 100vh;
  }

  .header {
    text-align: center;
    margin-bottom: 32px;
  }

  .header h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 8px 0;
  }

  .header p {
    color: #6b7280;
    font-size: 1.1rem;
  }

  .message {
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 24px;
    font-weight: 500;
  }

  .message.success {
    background: #dcfce7;
    color: #166534;
    border: 1px solid #bbf7d0;
  }

  .message.error {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }

  .message.info {
    background: #dbeafe;
    color: #1e40af;
    border: 1px solid #bfdbfe;
  }

  .dashboard-section,
  .segments-section,
  .create-campaign-section,
  .campaigns-section,
  .tips-section {
    margin-bottom: 40px;
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .dashboard-section h2,
  .segments-section h2,
  .create-campaign-section h2,
  .campaigns-section h2,
  .tips-section h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 20px 0;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
  }

  .stat-card {
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
  }

  .stat-card h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 8px 0;
  }

  .big-number {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }

  .segments-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }

  .segment-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 20px;
  }

  .segment-card h4 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 8px 0;
  }

  .segment-count {
    font-size: 1.5rem;
    font-weight: 700;
    color: #2563eb;
    margin: 0;
  }

  .segment-total,
  .segment-engagement,
  .segment-desc {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 4px 0;
  }

  .campaign-form {
    max-width: 800px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    font-weight: 600;
    color: #374151;
    margin-bottom: 6px;
    font-size: 0.875rem;
  }

  .form-group input,
  .form-group select {
    width: 100%;
    padding: 10px 12px;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    box-sizing: border-box;
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .form-group small {
    display: block;
    margin-top: 4px;
    color: #6b7280;
    font-size: 0.75rem;
  }

  .checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.875rem;
  }

  .checkbox-item input[type="checkbox"] {
    width: auto;
    margin: 0;
  }

  .targeting-info {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 6px;
    padding: 10px;
    margin-top: 10px;
    font-size: 0.875rem;
    color: #1e40af;
  }

  .form-actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
  }

  .create-btn,
  .send-btn {
    background: #2563eb;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .create-btn:hover:not(:disabled),
  .send-btn:hover:not(:disabled) {
    background: #1d4ed8;
  }

  .create-btn:disabled,
  .send-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .send-btn.small {
    padding: 6px 12px;
    font-size: 0.75rem;
  }

  .reset-btn {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .reset-btn:hover:not(:disabled) {
    background: #e5e7eb;
  }

  .campaigns-table {
    background: #f9fafb;
    border-radius: 8px;
    overflow: hidden;
  }

  .table-header,
  .table-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1.5fr 1fr;
    gap: 16px;
    padding: 16px;
    align-items: center;
  }

  .table-header {
    background: #e5e7eb;
    font-weight: 600;
    color: #374151;
    font-size: 0.875rem;
  }

  .table-row {
    border-bottom: 1px solid #e5e7eb;
  }

  .table-row:last-child {
    border-bottom: none;
  }

  .status-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .text-green-600 {
    background: #dcfce7;
    color: #166534;
  }

  .text-blue-600 {
    background: #dbeafe;
    color: #1e40af;
  }

  .text-yellow-600 {
    background: #fef3c7;
    color: #d97706;
  }

  .text-gray-600 {
    background: #f3f4f6;
    color: #4b5563;
  }

  .text-gray-500 {
    color: #6b7280;
  }

  .no-campaigns {
    text-align: center;
    padding: 40px;
    color: #6b7280;
  }

  .tips-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
  }

  .tip-card {
    background: #f0f9ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    padding: 16px;
  }

  .tip-card h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #1e40af;
    margin: 0 0 8px 0;
  }

  .tip-card p {
    font-size: 0.875rem;
    color: #1f2937;
    margin: 0;
    line-height: 1.5;
  }

  @media (max-width: 768px) {
    .campaign-manager {
      padding: 16px;
    }

    .header h1 {
      font-size: 2rem;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .table-header,
    .table-row {
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .stats-grid,
    .segments-grid,
    .tips-grid {
      grid-template-columns: 1fr;
    }
  }
</style> 