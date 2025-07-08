<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  // State management
  let loading = false;
  let message = '';
  let messageType = 'info';
  
  // Newsletter settings
  let settings = {
    newsletter_enabled: false,
    scholarship_digest_enabled: false,
    send_frequency: 'weekly',
    send_day: 1,
    send_time: '09:00',
    max_emails_per_batch: 100,
    default_from_name: 'Abroaducate Team'
  };

  // Statistics
  let stats = {
    total_subscribers: 0,
    active_subscribers: 0,
    total_by_source: {},
    engagement_stats: {}
  };

  // Import management
  let importFiles: FileList | null = null;
  let importSource = '';
  let importInProgress = false;
  let importResults = null;

  onMount(async () => {
    await loadNewsletterData();
  });

  async function loadNewsletterData() {
    try {
      loading = true;
      
      const response = await fetch('/api/newsletter/settings');
      const data = await response.json();

      if (response.ok) {
        settings = { ...settings, ...data.settings };
        stats = data.statistics || stats;
      } else {
        if (response.status === 403) {
          showMessage('Admin access required', 'error');
          goto('/admin');
          return;
        }
        showMessage(data.error || 'Failed to load newsletter data', 'error');
      }
    } catch (error) {
      showMessage('Error loading newsletter data', 'error');
      console.error('Error:', error);
    } finally {
      loading = false;
    }
  }

  async function updateSettings() {
    try {
      loading = true;
      
      const response = await fetch('/api/newsletter/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('Settings updated successfully', 'success');
        await loadNewsletterData(); // Refresh data
      } else {
        showMessage(data.error || 'Failed to update settings', 'error');
      }
    } catch (error) {
      showMessage('Error updating settings', 'error');
      console.error('Error:', error);
    } finally {
      loading = false;
    }
  }

  async function toggleSystemStatus(enable: boolean) {
    try {
      loading = true;
      
      const action = enable ? 'enable_system' : 'disable_system';
      const response = await fetch('/api/newsletter/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      const data = await response.json();

      if (response.ok) {
        showMessage(data.message, 'success');
        await loadNewsletterData();
      } else {
        showMessage(data.error || 'Failed to update system status', 'error');
      }
    } catch (error) {
      showMessage('Error updating system status', 'error');
    } finally {
      loading = false;
    }
  }

  async function handleEmailImport() {
    if (!importFiles || importFiles.length === 0) {
      showMessage('Please select a file to import', 'error');
      return;
    }

    if (!importSource.trim()) {
      showMessage('Please specify a source name', 'error');
      return;
    }

    try {
      importInProgress = true;
      
      // Read file content
      const file = importFiles[0];
      const content = await file.text();
      
      // Parse emails (support CSV, JSON, or plain text)
      let emails: string[] = [];
      
      if (file.name.endsWith('.json')) {
        emails = JSON.parse(content);
      } else if (file.name.endsWith('.csv')) {
        // Simple CSV parsing - assumes emails are in first column or one per line
        emails = content.split('\n')
          .map(line => line.split(',')[0].trim())
          .filter(email => email && email.includes('@'));
      } else {
        // Plain text - one email per line
        emails = content.split('\n')
          .map(line => line.trim())
          .filter(email => email && email.includes('@'));
      }

      if (emails.length === 0) {
        showMessage('No valid emails found in file', 'error');
        return;
      }

      if (emails.length > 10000) {
        showMessage('Maximum 10,000 emails per import. Please split your file.', 'error');
        return;
      }

      // Import emails
      const response = await fetch('/api/newsletter/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails,
          source: importSource.trim(),
          validateEmails: true,
          overwriteExisting: false
        })
      });

      const data = await response.json();

      if (response.ok) {
        importResults = data.result;
        showMessage(`Successfully imported ${data.result.imported} emails from ${emails.length} total`, 'success');
        await loadNewsletterData(); // Refresh stats
        
        // Clear form
        importSource = '';
        importFiles = null;
      } else {
        showMessage(data.error || 'Import failed', 'error');
      }
    } catch (error) {
      showMessage('Error processing import', 'error');
      console.error('Import error:', error);
    } finally {
      importInProgress = false;
    }
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

  function getStatusColor(enabled: boolean): string {
    return enabled ? 'text-green-600' : 'text-red-600';
  }

  function getStatusText(enabled: boolean): string {
    return enabled ? 'ENABLED' : 'DISABLED';
  }
</script>

<svelte:head>
  <title>Newsletter Management - Admin</title>
</svelte:head>

<div class="newsletter-admin">
  <div class="header">
    <h1>📧 Newsletter System Management</h1>
    <p>Manage your 6,000+ subscriber newsletter system</p>
  </div>

  <!-- Message Display -->
  {#if message}
    <div class="message {messageType}">
      {message}
    </div>
  {/if}

  <!-- System Status Overview -->
  <div class="status-section">
    <h2>🚦 System Status</h2>
    <div class="status-grid">
      <div class="status-card">
        <h3>Newsletter System</h3>
        <p class={getStatusColor(settings.newsletter_enabled)}>
          {getStatusText(settings.newsletter_enabled)}
        </p>
        <button 
          class="toggle-btn"
          class:enabled={settings.newsletter_enabled}
          on:click={() => toggleSystemStatus(!settings.newsletter_enabled)}
          disabled={loading}
        >
          {settings.newsletter_enabled ? 'Disable' : 'Enable'} System
        </button>
      </div>

      <div class="status-card">
        <h3>Scholarship Digest</h3>
        <p class={getStatusColor(settings.scholarship_digest_enabled)}>
          {getStatusText(settings.scholarship_digest_enabled)}
        </p>
        <p class="schedule">
          {settings.send_frequency} at {settings.send_time} UTC
        </p>
      </div>

      <div class="status-card">
        <h3>Total Subscribers</h3>
        <p class="big-number">{formatNumber(stats.total_subscribers)}</p>
        <p class="subtitle">{formatNumber(stats.active_subscribers)} active</p>
      </div>

      <div class="status-card">
        <h3>Batch Size</h3>
        <p class="big-number">{settings.max_emails_per_batch}</p>
        <p class="subtitle">emails per batch</p>
      </div>
    </div>
  </div>

  <!-- Statistics Dashboard -->
  <div class="stats-section">
    <h2>📊 Subscriber Statistics</h2>
    <div class="stats-grid">
      {#each Object.entries(stats.total_by_source || {}) as [source, count]}
        <div class="stat-card">
          <h4>{source}</h4>
          <p class="stat-number">{formatNumber(count)}</p>
        </div>
      {/each}
    </div>
  </div>

  <!-- Email Import -->
  <div class="import-section">
    <h2>📥 Import Email Lists</h2>
    <div class="import-form">
      <div class="form-group">
        <label for="source">Source Name</label>
        <input
          type="text"
          id="source"
          bind:value={importSource}
          placeholder="e.g., ebook_productivity, marketing_campaign"
          disabled={importInProgress}
        />
        <small>Use descriptive names like 'ebook_productivity' or 'webinar_attendees'</small>
      </div>

      <div class="form-group">
        <label for="file">Email List File</label>
        <input
          type="file"
          id="file"
          accept=".csv,.json,.txt"
          bind:files={importFiles}
          disabled={importInProgress}
        />
        <small>Supports CSV, JSON, or plain text files (max 10,000 emails)</small>
      </div>

      <button 
        class="import-btn"
        on:click={handleEmailImport}
        disabled={importInProgress || !importSource || !importFiles}
      >
        {#if importInProgress}
          <span class="spinner"></span>
          Importing...
        {:else}
          Import Emails
        {/if}
      </button>

      {#if importResults}
        <div class="import-results">
          <h4>Import Results</h4>
          <div class="results-grid">
            <div>Total: {importResults.total}</div>
            <div>Imported: {importResults.imported}</div>
            <div>Duplicates: {importResults.duplicates}</div>
            <div>Invalid: {importResults.invalid}</div>
          </div>
          {#if importResults.errors.length > 0}
            <details class="errors">
              <summary>Errors ({importResults.errors.length})</summary>
              <ul>
                {#each importResults.errors.slice(0, 10) as error}
                  <li>{error}</li>
                {/each}
                {#if importResults.errors.length > 10}
                  <li>... and {importResults.errors.length - 10} more</li>
                {/if}
              </ul>
            </details>
          {/if}
        </div>
      {/if}
    </div>
  </div>

  <!-- Settings Configuration -->
  <div class="settings-section">
    <h2>⚙️ Newsletter Settings</h2>
    <form on:submit|preventDefault={updateSettings} class="settings-form">
      <div class="form-row">
        <div class="form-group">
          <label for="frequency">Send Frequency</label>
          <select id="frequency" bind:value={settings.send_frequency} disabled={loading}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div class="form-group">
          <label for="day">Send Day</label>
          <select id="day" bind:value={settings.send_day} disabled={loading}>
            <option value={0}>Sunday</option>
            <option value={1}>Monday</option>
            <option value={2}>Tuesday</option>
            <option value={3}>Wednesday</option>
            <option value={4}>Thursday</option>
            <option value={5}>Friday</option>
            <option value={6}>Saturday</option>
          </select>
        </div>

        <div class="form-group">
          <label for="time">Send Time (UTC)</label>
          <input
            type="time"
            id="time"
            bind:value={settings.send_time}
            disabled={loading}
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="batch">Batch Size</label>
          <input
            type="number"
            id="batch"
            bind:value={settings.max_emails_per_batch}
            min="10"
            max="1000"
            disabled={loading}
          />
          <small>Emails sent per batch (affects rate limiting)</small>
        </div>

        <div class="form-group">
          <label for="from">From Name</label>
          <input
            type="text"
            id="from"
            bind:value={settings.default_from_name}
            disabled={loading}
          />
        </div>
      </div>

      <button type="submit" class="update-btn" disabled={loading}>
        {loading ? 'Updating...' : 'Update Settings'}
      </button>
    </form>
  </div>

  <!-- Quick Actions -->
  <div class="actions-section">
    <h2>🚀 Quick Actions</h2>
    <div class="action-buttons">
      <a href="/newsletter/unsubscribe" target="_blank" class="action-btn">
        Test Unsubscribe Page
      </a>
      <button class="action-btn" on:click={loadNewsletterData}>
        Refresh Data
      </button>
      <a href="/api/newsletter/settings" target="_blank" class="action-btn">
        View API Response
      </a>
    </div>
  </div>
</div>

<style>
  .newsletter-admin {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
  .stats-section,
  .import-section,
  .settings-section,
  .actions-section {
    margin-bottom: 40px;
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .status-section h2,
  .stats-section h2,
  .import-section h2,
  .settings-section h2,
  .actions-section h2 {
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

  .status-card p {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 8px 0;
  }

  .big-number {
    font-size: 2rem !important;
    color: #1f2937 !important;
  }

  .subtitle, .schedule {
    font-size: 0.875rem !important;
    color: #6b7280 !important;
    font-weight: 400 !important;
  }

  .toggle-btn {
    background: #dc2626;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .toggle-btn.enabled {
    background: #059669;
  }

  .toggle-btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .toggle-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .stat-card {
    background: #f3f4f6;
    border-radius: 8px;
    padding: 16px;
    text-align: center;
  }

  .stat-card h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 8px 0;
    text-transform: capitalize;
  }

  .stat-number {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }

  .import-form {
    max-width: 600px;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
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

  .import-btn,
  .update-btn {
    background: #2563eb;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .import-btn:hover:not(:disabled),
  .update-btn:hover:not(:disabled) {
    background: #1d4ed8;
  }

  .import-btn:disabled,
  .update-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .import-results {
    margin-top: 20px;
    padding: 16px;
    background: #f3f4f6;
    border-radius: 8px;
  }

  .import-results h4 {
    margin: 0 0 12px 0;
    color: #1f2937;
  }

  .results-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 12px;
  }

  .results-grid > div {
    background: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 0.875rem;
    text-align: center;
  }

  .errors {
    margin-top: 12px;
  }

  .errors summary {
    cursor: pointer;
    color: #dc2626;
    font-weight: 600;
  }

  .errors ul {
    margin: 8px 0 0 16px;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .action-buttons {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
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
  }

  .action-btn:hover {
    background: #e5e7eb;
    text-decoration: none;
  }

  @media (max-width: 768px) {
    .newsletter-admin {
      padding: 16px;
    }

    .header h1 {
      font-size: 2rem;
    }

    .status-grid {
      grid-template-columns: 1fr;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .results-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .action-buttons {
      flex-direction: column;
    }
  }
</style>