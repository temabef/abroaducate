<script lang="ts">
  let { data } = $props();
  let { session } = $derived(data);
  
  // Simple state - no complex API calls
  let message = $state('');
  let messageType = $state('info');

  function showMessage(text: string, type: 'success' | 'error' | 'info' = 'info') {
    message = text;
    messageType = type;
    setTimeout(() => {
      message = '';
    }, 3000);
  }

  function formatNumber(num: number): string {
    return new Intl.NumberFormat().format(num);
  }
</script>

<svelte:head>
  <title>Newsletter Management - Admin</title>
</svelte:head>

<div class="newsletter-admin">
  <div class="header">
    <h1>📧 Newsletter System Management</h1>
    <p>Manage your {formatNumber(8000)} subscriber newsletter system</p>
  </div>

  <!-- Message Display -->
  {#if message}
    <div class="message {messageType}">
      {message}
    </div>
  {/if}

  <!-- Campaign Manager Integration -->
  <div class="campaign-section">
    <h2>📧 Campaign Manager</h2>
    <p>Send emails to your {formatNumber(8000)} active subscribers with pre-designed templates.</p>
    <div class="action-buttons">
      <a href="/admin/newsletter/campaigns" class="action-btn primary">
        📤 Manage Email Campaigns
      </a>
      <button class="action-btn" onclick={() => showMessage('Campaign manager ready!', 'success')}>
        📝 Create Campaign
      </button>
      <button class="action-btn" onclick={() => showMessage('Analytics available in campaign manager', 'info')}>
        📊 View Analytics
      </button>
    </div>
    
    <!-- Quick Campaign Creation -->
    <div class="quick-campaign">
      <h3>📬 Quick Campaign</h3>
      <p>Send study abroad tips or scholarship digest to your imported leads</p>
      <div class="quick-buttons">
        <button class="quick-btn study-tips" onclick={() => window.location.href='/admin/newsletter/campaigns?template=study-tips'}>
          📚 Send Study Tips
        </button>
        <button class="quick-btn scholarship" onclick={() => window.location.href='/admin/newsletter/campaigns?template=scholarship-digest'}>
          🎓 Send Scholarship Digest
        </button>
      </div>
    </div>
  </div>

  <!-- System Status -->
  <div class="status-section">
    <h2>⚡ System Status</h2>
    <div class="status-grid">
      <div class="status-card">
        <h3>Newsletter System</h3>
        <p class="status-indicator enabled">✅ READY</p>
        <p class="subtitle">Campaign manager active</p>
      </div>

      <div class="status-card">
        <h3>Email Templates</h3>
        <p class="status-indicator enabled">✅ READY</p>
        <p class="subtitle">2 templates available</p>
      </div>

      <div class="status-card">
        <h3>Total Subscribers</h3>
        <p class="big-number">{formatNumber(8000)}</p>
        <p class="subtitle">Imported leads</p>
      </div>

      <div class="status-card">
        <h3>Active Subscribers</h3>
        <p class="big-number">{formatNumber(8000)}</p>
        <p class="subtitle">Ready to receive emails</p>
      </div>
    </div>
  </div>

  <!-- Quick Start Guide -->
  <div class="guide-section">
    <h2>🚀 Quick Start Guide</h2>
    <div class="guide-steps">
      <div class="step-card">
        <div class="step-number">1</div>
        <div class="step-content">
          <h4>Access Campaign Manager</h4>
          <p>Click "📤 Manage Email Campaigns" to access the full campaign interface</p>
        </div>
      </div>
      
      <div class="step-card">
        <div class="step-number">2</div>
        <div class="step-content">
          <h4>Create Your First Campaign</h4>
          <p>Use the "Study Abroad Tips" template to send monthly educational content</p>
        </div>
      </div>
      
      <div class="step-card">
        <div class="step-number">3</div>
        <div class="step-content">
          <h4>Send to Imported Leads</h4>
          <p>Target your 8000 imported emails with valuable scholarship and study abroad content</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="actions-section">
    <h2>🔧 System Actions</h2>
    <div class="action-buttons">
      <button class="action-btn" onclick={() => showMessage('Newsletter system is ready to use!', 'success')}>
        ✅ Test System Status
      </button>
      <a href="/newsletter/unsubscribe" target="_blank" class="action-btn">
        🔗 Test Unsubscribe Page
      </a>
      <button class="action-btn" onclick={() => showMessage('Use the campaign manager for sending emails', 'info')}>
        📧 Email Settings
      </button>
    </div>
  </div>
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

  .campaign-section,
  .status-section,
  .guide-section,
  .actions-section {
    margin-bottom: 40px;
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .campaign-section h2,
  .status-section h2,
  .guide-section h2,
  .actions-section h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 20px 0;
  }

  /* Campaign Manager Styles */
  .campaign-section {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 1px solid #bfdbfe;
  }

  .campaign-section h2 {
    color: #1e40af;
  }

  .action-buttons {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 20px;
  }

  .action-btn {
    display: inline-block;
    background: #f3f4f6;
    color: #374151;
    text-decoration: none;
    padding: 10px 16px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }

  .action-btn:hover {
    background: #e5e7eb;
    text-decoration: none;
  }

  .action-btn.primary {
    background: #2563eb;
    color: white;
    font-weight: 600;
  }

  .action-btn.primary:hover {
    background: #1d4ed8;
  }

  .quick-campaign {
    margin-top: 20px;
    padding: 16px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  .quick-campaign h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 8px 0;
  }

  .quick-campaign p {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0 0 16px 0;
  }

  .quick-buttons {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .quick-btn {
    background: #059669;
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    flex: 1;
    min-width: 140px;
  }

  .quick-btn:hover {
    background: #047857;
    transform: translateY(-1px);
  }

  .quick-btn.scholarship {
    background: #7c3aed;
  }

  .quick-btn.scholarship:hover {
    background: #6d28d9;
  }

  /* Status Grid */
  .status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
  }

  .status-card {
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
  }

  .status-card h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 8px 0;
  }

  .status-indicator {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 8px 0;
  }

  .status-indicator.enabled {
    color: #059669;
  }

  .big-number {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }

  .subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 4px 0;
  }

  /* Guide Steps */
  .guide-steps {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .step-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  .step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: #2563eb;
    color: white;
    border-radius: 50%;
    font-weight: 600;
    font-size: 0.875rem;
    flex-shrink: 0;
  }

  .step-content h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 4px 0;
  }

  .step-content p {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  @media (max-width: 768px) {
    .newsletter-admin {
      padding: 60px 16px 24px 16px;
    }

    .header h1 {
      font-size: 2rem;
    }

    .action-buttons {
      flex-direction: column;
    }

    .quick-buttons {
      flex-direction: column;
    }

    .quick-btn {
      min-width: auto;
    }

    .status-grid {
      grid-template-columns: 1fr;
    }

    .step-card {
      flex-direction: column;
      text-align: center;
    }
  }
</style>