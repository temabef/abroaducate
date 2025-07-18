<script lang="ts">
  import { onMount } from 'svelte';
  import { analytics } from '$lib/utils/posthog';
  
  let message = $state('');
  let messageType = $state('info');

  // Composer state
  let composerSubject = $state('');
  let composerHtml = $state('');
  let composerTestEmail = $state('');
  let composerPreview = $state(false);
  let composerLoading = $state(false);
  let composerTestMessage = $state('');
  let composerBatchSize = $state(100);

  // Analytics state
  let totalSubscribers = $state(0);
  let activeSubscribers = $state(0);
  let totalSent = $state(0);
  let totalOpens = $state(0);
  let totalClicks = $state(0);
  let totalUnsubscribes = $state(0);
  let recentCampaigns = $state([]);
  let subscriberList = $state([]);
  let loading = $state(true);

  let campaignId = $state(null);
  let batchProgress = $state({ sent: 0, total: 0, batchSent: 0, batchFailed: 0, done: false });
  let sendingBatch = $state(false);
  let showProgress = $state(false);

  let emailLogs = $state([]);
  let loadingLogs = $state(false);

  onMount(async () => {
    // Track newsletter admin page view
    analytics.trackPageView('Newsletter Admin', {
      section: 'compose'
    });
    
    await loadAnalytics();
    await loadRecentCampaigns();
    await loadSubscriberList();
  });

  async function loadAnalytics() {
    try {
      const response = await fetch('/api/newsletter/analytics');
      if (response.ok) {
        const data = await response.json();
        totalSubscribers = data.total_subscribers || 0;
        activeSubscribers = data.active_subscribers || 0;
        totalSent = data.total_sent || 0;
        totalOpens = data.total_opens || 0;
        totalClicks = data.total_clicks || 0;
        totalUnsubscribes = data.total_unsubscribes || 0;
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }

  async function loadRecentCampaigns() {
    try {
      const response = await fetch('/api/newsletter/campaigns/recent');
      if (response.ok) {
        const data = await response.json();
        recentCampaigns = data.campaigns || [];
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  }

  async function loadSubscriberList() {
    try {
      const response = await fetch('/api/newsletter/subscribers/list');
      if (response.ok) {
        const data = await response.json();
        subscriberList = data.subscribers || [];
      }
    } catch (error) {
      console.error('Error loading subscribers:', error);
    } finally {
      loading = false;
    }
  }

  function showMessage(text: string, type: 'success' | 'error' | 'info' = 'info') {
    message = text;
    messageType = type;
    setTimeout(() => {
      message = '';
    }, 3000);
  }

  async function sendTestEmail() {
    if (!composerTestEmail.trim() || !composerSubject.trim() || !composerHtml.trim()) {
      composerTestMessage = 'Please fill in all fields.';
      return;
    }
    composerLoading = true;
    composerTestMessage = '';
    
    // Track test email event
    analytics.trackEvent('newsletter_test_sent', {
      subject: composerSubject,
      test_email: composerTestEmail.trim()
    });
    
    try {
      const response = await fetch('/api/newsletter/custom-send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: composerSubject,
          html: composerHtml,
          test_email: composerTestEmail.trim()
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        composerTestMessage = `✅ Test email sent to ${composerTestEmail}`;
      } else {
        composerTestMessage = data.error || 'Failed to send test email.';
      }
    } catch (e) {
      composerTestMessage = 'Error sending test email.';
    } finally {
      composerLoading = false;
    }
  }

  async function sendToAllSubscribers() {
    if (!composerSubject.trim() || !composerHtml.trim()) {
      showMessage('Please fill in subject and HTML content.', 'error');
      return;
    }
    
    if (!confirm(`Send this newsletter to all ${activeSubscribers} active subscribers?`)) {
      return;
    }

    // Track newsletter campaign start
    analytics.trackEvent('newsletter_campaign_started', {
      subject: composerSubject,
      total_subscribers: activeSubscribers,
      campaign_type: 'batch_send'
    });

    sendingBatch = true;
    showProgress = true;
    try {
      // Start new campaign and send first batch
      const response = await fetch('/api/newsletter/batch-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: composerSubject,
          html: composerHtml,
          batch_size: composerBatchSize
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        campaignId = data.campaign_id;
        batchProgress = {
          sent: data.sent_count,
          total: data.total_recipients || activeSubscribers,
          batchSent: data.batch_sent,
          batchFailed: data.batch_failed,
          done: data.done
        };
        showMessage(`✅ Sent batch of ${data.batch_sent}.`, 'success');
      } else {
        showMessage(data.error || 'Failed to send newsletter.', 'error');
        showProgress = false;
      }
    } catch (e) {
      showMessage('Error sending newsletter.', 'error');
      showProgress = false;
    } finally {
      sendingBatch = false;
    }
  }

  async function sendNextBatch() {
    if (!campaignId) return;
    sendingBatch = true;
    try {
      const response = await fetch('/api/newsletter/batch-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: composerSubject,
          html: composerHtml,
          campaign_id: campaignId,
          batch_size: composerBatchSize
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        batchProgress = {
          sent: data.sent_count,
          total: data.total_recipients || batchProgress.total,
          batchSent: data.batch_sent,
          batchFailed: data.batch_failed,
          done: data.done
        };
        showMessage(`✅ Sent batch of ${data.batch_sent}.`, 'success');
        if (data.done) {
          showMessage('✅ All subscribers have been sent to!', 'success');
          campaignId = null;
        }
      } else {
        showMessage(data.error || 'Failed to send batch.', 'error');
      }
    } catch (e) {
      showMessage('Error sending batch.', 'error');
    } finally {
      sendingBatch = false;
    }
  }

  function resetBatchProgress() {
    campaignId = null;
    batchProgress = { sent: 0, total: 0, batchSent: 0, batchFailed: 0, done: false };
    showProgress = false;
  }

  function formatNumber(num: number): string {
    return new Intl.NumberFormat().format(num);
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  async function fetchEmailLogs() {
    if (!campaignId) return;
    loadingLogs = true;
    try {
      const response = await fetch(`/api/newsletter/email-logs?campaign_id=${campaignId}`);
      const data = await response.json();
      if (response.ok && data.logs) {
        emailLogs = data.logs;
      } else {
        emailLogs = [];
      }
    } catch (e) {
      emailLogs = [];
    } finally {
      loadingLogs = false;
    }
  }

  $effect(() => {
    if (showProgress && campaignId) {
      fetchEmailLogs();
    }
  });
</script>

<svelte:head>
  <title>Newsletter Management - Admin</title>
</svelte:head>

<div class="newsletter-admin">
  <div class="header">
    <h1>📧 Newsletter System Management</h1>
    <p>Manage your newsletter subscribers, send beautiful campaigns, and view analytics</p>
  </div>

  {#if message}
    <div class="message {messageType}">{message}</div>
  {/if}

  <!-- Analytics Section -->
  <div class="analytics-section">
    <h2>📈 Newsletter Analytics</h2>
    <div class="analytics-grid">
      <div class="analytics-card">
        <h4>Total Subscribers</h4>
        <p class="big-number">{formatNumber(totalSubscribers)}</p>
        <small>All time</small>
      </div>
      <div class="analytics-card">
        <h4>Active Subscribers</h4>
        <p class="big-number">{formatNumber(activeSubscribers)}</p>
        <small>Ready to receive</small>
      </div>
      <div class="analytics-card">
        <h4>Emails Sent</h4>
        <p class="big-number">{formatNumber(totalSent)}</p>
        <small>Total sent</small>
      </div>
      <div class="analytics-card">
        <h4>Opens</h4>
        <p class="big-number">{formatNumber(totalOpens)}</p>
        <small>Total opens</small>
      </div>
      <div class="analytics-card">
        <h4>Clicks</h4>
        <p class="big-number">{formatNumber(totalClicks)}</p>
        <small>Total clicks</small>
      </div>
      <div class="analytics-card">
        <h4>Unsubscribes</h4>
        <p class="big-number">{formatNumber(totalUnsubscribes)}</p>
        <small>Total unsubscribes</small>
      </div>
    </div>
  </div>

  <!-- Compose Newsletter Section -->
  <div class="compose-section">
    <h2>✉️ Compose Newsletter</h2>
    <label>Subject:</label>
    <input type="text" bind:value={composerSubject} style="width:100%;margin-bottom:1rem;" placeholder="Email subject" />
    <label>HTML Content:</label>
    <textarea bind:value={composerHtml} style="width:100%;height:180px;margin-bottom:1rem;font-family:monospace;font-size:1rem;" placeholder="Paste your HTML here..."></textarea>
    <label>Test Email Address:</label>
    <input type="email" bind:value={composerTestEmail} style="width:100%;margin-bottom:1rem;" placeholder="your@email.com" />
    <label>Batch Size:</label>
    <input type="number" min="1" max="1000" bind:value={composerBatchSize} style="width:120px;margin-bottom:1rem;" placeholder="Batch size" />
    <div style="margin-bottom:1rem;">
      <button on:click={sendTestEmail} disabled={composerLoading || sendingBatch} style="margin-right:1rem;">{composerLoading ? 'Sending...' : 'Send Test'}</button>
      <button on:click={() => composerPreview = !composerPreview} disabled={sendingBatch} style="margin-right:1rem;">{composerPreview ? 'Hide Preview' : 'Show Preview'}</button>
      <button on:click={sendToAllSubscribers} disabled={composerLoading || sendingBatch || !composerSubject.trim() || !composerHtml.trim()} style="background:#059669;color:white;margin-left:1rem;">
        {sendingBatch ? 'Sending...' : `Send to All (${formatNumber(activeSubscribers)})`}
      </button>
      {#if showProgress}
        <button on:click={resetBatchProgress} disabled={sendingBatch} style="margin-left:1rem;background:#e5e7eb;color:#374151;">Reset</button>
      {/if}
    </div>
    {#if composerTestMessage}
      <div style="margin-bottom:1rem;color:{composerTestMessage.startsWith('✅') ? 'green' : 'red'};">{composerTestMessage}</div>
    {/if}
    {#if composerPreview}
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-top:1rem;background:#f9fafb;max-height:300px;overflow:auto;">
        <h3 style="margin-top:0;">Live Preview</h3>
        <div>{@html composerHtml}</div>
      </div>
    {/if}
    {#if showProgress}
      <div class="batch-progress">
        <div style="margin-top:1rem;margin-bottom:0.5rem;">
          <strong>Batch Progress:</strong> Sent {formatNumber(batchProgress.sent)} of {formatNumber(batchProgress.total)}
          {#if batchProgress.done}
            <span style="color:green;margin-left:1rem;">✅ Complete!</span>
          {/if}
        </div>
        <div class="progress-bar-wrapper">
          <div class="progress-bar" style="width:{Math.min(100, (batchProgress.sent / (batchProgress.total || 1)) * 100)}%"></div>
        </div>
        <div style="margin-top:0.5rem;">
          Last batch: <span style="color:green;">{formatNumber(batchProgress.batchSent)} sent</span>, <span style="color:red;">{formatNumber(batchProgress.batchFailed)} failed</span>
        </div>
        {#if !batchProgress.done}
          <button on:click={sendNextBatch} disabled={sendingBatch} style="margin-top:1rem;background:#2563eb;color:white;">
            {sendingBatch ? 'Sending...' : 'Send Next Batch'}
          </button>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Recent Campaigns Section -->
  <div class="campaigns-section">
    <h2>🗂️ Recent Campaigns</h2>
    {#if recentCampaigns.length > 0}
      <div class="campaigns-table">
        <div class="table-header">
          <div class="col-name">Subject</div>
          <div class="col-date">Date</div>
          <div class="col-sent">Sent</div>
          <div class="col-opens">Opens</div>
          <div class="col-clicks">Clicks</div>
          <div class="col-unsubs">Unsubs</div>
        </div>
        {#each recentCampaigns as campaign}
          <div class="table-row">
            <div class="col-name">{campaign.subject_line}</div>
            <div class="col-date">{formatDate(campaign.sent_at)}</div>
            <div class="col-sent">{formatNumber(campaign.total_sent)}</div>
            <div class="col-opens">{formatNumber(campaign.total_opens)}</div>
            <div class="col-clicks">{formatNumber(campaign.total_clicks)}</div>
            <div class="col-unsubs">{formatNumber(campaign.total_unsubscribes)}</div>
          </div>
        {/each}
      </div>
    {:else}
      <p style="text-align:center;color:#6b7280;padding:2rem;">No campaigns sent yet</p>
    {/if}
  </div>

  <!-- Subscriber List Section -->
  <div class="subscribers-section">
    <h2>👥 Subscriber List</h2>
    <p>Total: <strong>{formatNumber(totalSubscribers)}</strong> | Active: <strong>{formatNumber(activeSubscribers)}</strong></p>
    {#if subscriberList.length > 0}
      <div class="subscribers-table">
        <div class="table-header">
          <div class="col-email">Email Address</div>
          <div class="col-status">Status</div>
          <div class="col-date">Subscribed</div>
        </div>
        {#each subscriberList.slice(0, 10) as subscriber}
          <div class="table-row">
            <div class="col-email">{subscriber.email}</div>
            <div class="col-status">
              <span class="status-badge {subscriber.status === 'active' ? 'active' : 'inactive'}">
                {subscriber.status}
              </span>
            </div>
            <div class="col-date">{formatDate(subscriber.subscribed_at)}</div>
          </div>
        {/each}
        {#if subscriberList.length > 10}
          <div class="table-row" style="text-align:center;color:#6b7280;">
            <div>... and {formatNumber(subscriberList.length - 10)} more subscribers</div>
          </div>
        {/if}
      </div>
    {:else if loading}
      <p style="text-align:center;color:#6b7280;padding:2rem;">Loading subscribers...</p>
    {:else}
      <p style="text-align:center;color:#6b7280;padding:2rem;">No subscribers found</p>
    {/if}
  </div>

  {#if showProgress && campaignId}
    <div class="email-logs-section">
      <h3 style="margin-top:2rem;">Email Send Log (Most Recent 50)</h3>
      <button on:click={fetchEmailLogs} disabled={loadingLogs} style="margin-bottom:0.5rem;">{loadingLogs ? 'Refreshing...' : 'Refresh Log'}</button>
      {#if loadingLogs}
        <div>Loading logs...</div>
      {:else if emailLogs.length === 0}
        <div>No logs yet.</div>
      {:else}
        <div class="logs-table">
          <div class="logs-header">
            <div class="log-email">Email</div>
            <div class="log-status">Status</div>
            <div class="log-date">Sent At</div>
          </div>
          {#each emailLogs.slice(-50).reverse() as log}
            <div class="logs-row">
              <div class="log-email">{log.email_address}</div>
              <div class="log-status {log.status}">{log.status}</div>
              <div class="log-date">{formatDate(log.sent_at)}</div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .newsletter-admin {
    max-width: 1200px;
    margin: 0 auto;
    padding: 80px 24px 24px 24px;
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
  .analytics-section, .compose-section, .campaigns-section, .subscribers-section {
    margin-bottom: 40px;
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  .analytics-section h2, .compose-section h2, .campaigns-section h2, .subscribers-section h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 20px 0;
  }
  .analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 20px;
  }
  .analytics-card {
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
  }
  .analytics-card h4 {
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
  .analytics-card small {
    color: #6b7280;
    font-size: 0.875rem;
  }
  .campaigns-table, .subscribers-table {
    width: 100%;
    margin-top: 12px;
    border-radius: 8px;
    overflow: hidden;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
  }
  .table-header, .table-row {
    display: flex;
    align-items: center;
    padding: 10px 16px;
  }
  .table-header {
    background: #f3f4f6;
    font-weight: 600;
    color: #374151;
    border-bottom: 1px solid #e5e7eb;
  }
  .table-row {
    border-bottom: 1px solid #e5e7eb;
    font-size: 1rem;
    color: #374151;
  }
  .col-name, .col-date, .col-sent, .col-opens, .col-clicks, .col-unsubs, .col-email, .col-status {
    flex: 1;
    min-width: 120px;
    word-break: break-all;
  }
  .status-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
  }
  .status-badge.active {
    background: #dcfce7;
    color: #166534;
  }
  .status-badge.inactive {
    background: #fef2f2;
    color: #dc2626;
  }
  .batch-progress {
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    margin-top: 1rem;
    margin-bottom: 1rem;
  }
  .progress-bar-wrapper {
    width: 100%;
    height: 16px;
    background: #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
  }
  .progress-bar {
    height: 100%;
    background: #059669;
    transition: width 0.3s;
  }
  .email-logs-section {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    margin-top: 1.5rem;
  }
  .logs-table {
    width: 100%;
    margin-top: 8px;
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
    border: 1px solid #e5e7eb;
  }
  .logs-header, .logs-row {
    display: flex;
    align-items: center;
    padding: 8px 12px;
  }
  .logs-header {
    background: #f3f4f6;
    font-weight: 600;
    color: #374151;
    border-bottom: 1px solid #e5e7eb;
  }
  .logs-row {
    border-bottom: 1px solid #e5e7eb;
    font-size: 1rem;
    color: #374151;
  }
  .log-email, .log-status, .log-date {
    flex: 1;
    min-width: 120px;
    word-break: break-all;
  }
  .log-status.sent {
    color: #059669;
  }
  .log-status.failed {
    color: #dc2626;
  }
</style>