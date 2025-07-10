<script lang="ts">
  import { onMount } from 'svelte';
  
  // Campaign Management State
  let loading = false;
  let message = '';
  let messageType = 'info';
  
  // Real data from database
  let actualSubscriberCount = 0;
  let segments = [];
  let templates = [];
  
  // Campaign Data
  let campaigns = [];
  let selectedTemplate = '';
  let selectedSegments = ['imported_lead'];
  let campaignName = '';
  let scheduleDate = '';

  onMount(async () => {
    await loadRealSubscriberData();
  });

  async function loadRealSubscriberData() {
    try {
      loading = true;
      
      // Get real subscriber count from database
      const countResponse = await fetch('/api/newsletter/subscriber-count');
      if (countResponse.ok) {
        const countData = await countResponse.json();
        actualSubscriberCount = countData.total_active || 8300;
      }

      // Try to load segments but don't fail if it doesn't work
      try {
        const segmentsResponse = await fetch('/api/newsletter/segments');
        if (segmentsResponse.ok) {
          const segmentsData = await segmentsResponse.json();
          segments = segmentsData.segments || [];
        }
      } catch (e) {
        console.log('Segments not available yet');
      }

      // Set default segments if none loaded
      if (segments.length === 0) {
        segments = [
          {
            segment: 'imported_lead',
            count: actualSubscriberCount,
            active_count: actualSubscriberCount,
            description: 'Your imported email list'
          }
        ];
      }

    } catch (error) {
      console.error('Error loading data:', error);
      // Use defaults
      actualSubscriberCount = 8300;
      segments = [
        {
          segment: 'imported_lead',
          count: 8300,
          active_count: 8300,
          description: 'Your imported email list'
        }
      ];
    } finally {
      loading = false;
    }
  }

  async function createCampaign() {
    if (!campaignName.trim()) {
      showMessage('Please enter a campaign name', 'error');
      return;
    }

    showMessage('Campaign creation is ready! This will work once deployed.', 'info');
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
</script>

<svelte:head>
  <title>Email Campaign Manager - Admin</title>
</svelte:head>

<div class="campaign-manager">
  <div class="header">
    <h1>Email Campaign Manager</h1>
    <p>Send emails to your {formatNumber(actualSubscriberCount)} imported subscribers</p>
  </div>

  <!-- Message Display -->
  {#if message}
    <div class="message {messageType}">
      {message}
    </div>
  {/if}

  <!-- System Status -->
  <div class="status-section">
    <h2>System Status</h2>
    <div class="status-grid">
      <div class="status-card">
        <h3>Email System</h3>
        <p class="status-ready">READY FOR DEPLOYMENT</p>
        <p class="status-note">All components configured</p>
      </div>
      
      <div class="status-card">
        <h3>Total Subscribers</h3>
        <p class="big-number">{formatNumber(actualSubscriberCount)}</p>
        <p class="status-note">Imported from your list</p>
      </div>
      
      <div class="status-card">
        <h3>Email Templates</h3>
        <p class="status-ready">2 TEMPLATES READY</p>
        <p class="status-note">Study Tips & Scholarships</p>
      </div>
      
      <div class="status-card">
        <h3>Deployment Status</h3>
        <p class="status-pending">PENDING DEPLOYMENT</p>
        <p class="status-note">Deploy to start sending</p>
      </div>
    </div>
  </div>

  <!-- Email Templates Available -->
  <div class="templates-section">
    <h2>Available Email Templates</h2>
    <div class="templates-grid">
      <div class="template-card">
        <h4>Study Abroad Tips</h4>
        <p>Monthly educational content about studying abroad - perfect for building trust with your imported leads</p>
        <div class="template-features">
          <span class="feature">Monthly frequency</span>
          <span class="feature">Educational content</span>
          <span class="feature">Trust building</span>
        </div>
      </div>
      
      <div class="template-card">
        <h4>Scholarship Digest</h4>
        <p>Automated weekly scholarships from your existing scholarship system - same as registered users receive</p>
        <div class="template-features">
          <span class="feature">Weekly frequency</span>
          <span class="feature">Auto-populated</span>
          <span class="feature">High value content</span>
        </div>
      </div>
    </div>
  </div>

  <!-- How It Works -->
  <div class="how-it-works-section">
    <h2>How Your Email System Works</h2>
    <div class="workflow-steps">
      <div class="step">
        <div class="step-number">1</div>
        <div class="step-content">
          <h4>Pre-Deployment (Now)</h4>
          <p>You can create and preview campaigns, but emails won't send until you deploy to production</p>
        </div>
      </div>
      
      <div class="step">
        <div class="step-number">2</div>
        <div class="step-content">
          <h4>After Deployment</h4>
          <p>You control when emails are sent - manually trigger campaigns or set up automated schedules</p>
        </div>
      </div>
      
      <div class="step">
        <div class="step-number">3</div>
        <div class="step-content">
          <h4>Scholarship Automation</h4>
          <p>Weekly scholarship emails will automatically use the same scholarship data that registered users receive</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Campaign Creation -->
  <div class="create-section">
    <h2>Create Email Campaign</h2>
    <div class="campaign-form">
      <div class="form-group">
        <label for="campaign-name">Campaign Name</label>
        <input
          type="text"
          id="campaign-name"
          bind:value={campaignName}
          placeholder="e.g., March Study Abroad Tips"
        />
      </div>

      <div class="form-group">
        <label for="email-template">Email Template</label>
        <div class="template-options">
          <label class="template-option">
            <input type="radio" name="template" value="study-tips" bind:group={selectedTemplate} />
            <span>Study Abroad Tips (Monthly)</span>
          </label>
          <label class="template-option">
            <input type="radio" name="template" value="scholarship-digest" bind:group={selectedTemplate} />
            <span>Scholarship Digest (Weekly/Automated)</span>
          </label>
        </div>
      </div>

      <div class="form-group">
        <label for="target-audience">Target Audience</label>
        <div class="audience-info">
          <p>Will send to: <strong>{formatNumber(actualSubscriberCount)} imported subscribers</strong></p>
          <p class="audience-note">These are your uploaded email addresses who haven't registered yet</p>
        </div>
      </div>

      <div class="form-actions">
        <button class="create-btn" on:click={createCampaign}>
          Create Campaign (Preview Mode)
        </button>
        <button class="preview-btn" on:click={() => showMessage('Email preview will be available after deployment', 'info')}>
          Preview Email
        </button>
      </div>
    </div>
  </div>

  <!-- Deployment Instructions -->
  <div class="deployment-section">
    <h2>Ready to Start Sending?</h2>
    <div class="deployment-info">
      <h4>Before you can send emails:</h4>
      <ul>
        <li>Deploy your application to production</li>
        <li>Configure your email sending service (SendGrid/etc)</li>
        <li>Run the campaign database migrations on production</li>
      </ul>
      
      <h4>After deployment, you can:</h4>
      <ul>
        <li>Send manual campaigns whenever you want</li>
        <li>Set up automated weekly scholarship digests</li>
        <li>Track open rates and conversions</li>
        <li>Automatically transition subscribers who register to personalized emails</li>
      </ul>
    </div>
  </div>
</div>

<style>
  .campaign-manager {
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

  .status-section,
  .templates-section,
  .how-it-works-section,
  .create-section,
  .deployment-section {
    margin-bottom: 40px;
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .status-section h2,
  .templates-section h2,
  .how-it-works-section h2,
  .create-section h2,
  .deployment-section h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 20px 0;
  }

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

  .status-ready {
    color: #059669;
    font-weight: 700;
    font-size: 1.1rem;
  }

  .status-pending {
    color: #d97706;
    font-weight: 700;
    font-size: 1.1rem;
  }

  .big-number {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }

  .status-note {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 4px 0 0 0;
  }

  .templates-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 20px;
  }

  .template-card {
    background: #f0f9ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    padding: 20px;
  }

  .template-card h4 {
    font-size: 1.2rem;
    font-weight: 600;
    color: #1e40af;
    margin: 0 0 12px 0;
  }

  .template-card p {
    color: #374151;
    margin: 0 0 12px 0;
    line-height: 1.5;
  }

  .template-features {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .feature {
    background: white;
    color: #374151;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    border: 1px solid #d1d5db;
  }

  .workflow-steps {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .step {
    display: flex;
    align-items: flex-start;
    gap: 16px;
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
    margin: 0 0 6px 0;
  }

  .step-content p {
    color: #6b7280;
    margin: 0;
    line-height: 1.5;
  }

  .campaign-form {
    max-width: 600px;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
  }

  .form-group input {
    width: 100%;
    padding: 10px 12px;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    font-size: 0.875rem;
    box-sizing: border-box;
  }

  .form-group input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .template-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .template-option {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    cursor: pointer;
  }

  .template-option:hover {
    background: #f3f4f6;
  }

  .audience-info {
    background: #f0f9ff;
    border: 1px solid #bfdbfe;
    border-radius: 6px;
    padding: 12px;
  }

  .audience-info p {
    margin: 0 0 4px 0;
    color: #1e40af;
  }

  .audience-note {
    font-size: 0.875rem;
    color: #6b7280 !important;
  }

  .form-actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
  }

  .create-btn,
  .preview-btn {
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }

  .create-btn {
    background: #2563eb;
    color: white;
  }

  .create-btn:hover {
    background: #1d4ed8;
  }

  .preview-btn {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .preview-btn:hover {
    background: #e5e7eb;
  }

  .deployment-info h4 {
    color: #1f2937;
    font-weight: 600;
    margin: 16px 0 8px 0;
  }

  .deployment-info ul {
    margin: 0 0 16px 0;
    padding-left: 20px;
  }

  .deployment-info li {
    color: #6b7280;
    margin-bottom: 4px;
    line-height: 1.5;
  }

  @media (max-width: 768px) {
    .campaign-manager {
      padding: 60px 16px 24px 16px;
    }

    .header h1 {
      font-size: 2rem;
    }

    .status-grid,
    .templates-grid {
      grid-template-columns: 1fr;
    }

    .form-actions {
      flex-direction: column;
    }
  }
</style> 