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

  // Automated batch settings
  let autoSendEnabled = $state(false);
  let totalRecipients = $state(80);
  let autoBatchSize = $state(20);
  let delayBetweenBatches = $state(2); // minutes
  let autoSending = $state(false);
  let autoProgress = $state({ sent: 0, total: 0, currentBatch: 0, totalBatches: 0, nextBatchTime: null });
  let autoCampaignId = $state(null);

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
  let hasActiveCampaign = $state(false);

  let emailLogs = $state([]);
  let loadingLogs = $state(false);

  // Save campaign progress to localStorage
  function saveCampaignProgress() {
    if (campaignId) {
      localStorage.setItem('newsletter_active_campaign', JSON.stringify({
        campaignId,
        batchProgress,
        showProgress,
        composerSubject,
        composerHtml,
        composerBatchSize
      }));
    } else {
      localStorage.removeItem('newsletter_active_campaign');
    }
  }

  // Load campaign progress from localStorage
  function loadCampaignProgress() {
    try {
      const saved = localStorage.getItem('newsletter_active_campaign');
      if (saved) {
        const data = JSON.parse(saved);
        campaignId = data.campaignId;
        batchProgress = data.batchProgress;
        showProgress = data.showProgress;
        composerSubject = data.composerSubject || '';
        composerHtml = data.composerHtml || '';
        composerBatchSize = data.composerBatchSize || 100;
        hasActiveCampaign = true;
        return true;
      }
    } catch (error) {
      console.error('Error loading campaign progress:', error);
    }
    return false;
  }

  // Clear campaign progress
  function clearCampaignProgress() {
    campaignId = null;
    batchProgress = { sent: 0, total: 0, batchSent: 0, batchFailed: 0, done: false };
    showProgress = false;
    hasActiveCampaign = false;
    localStorage.removeItem('newsletter_active_campaign');
  }

  // Auto-save progress when it changes
  $effect(() => {
    if (campaignId || showProgress) {
      saveCampaignProgress();
    }
  });

  onMount(async () => {
    // Track newsletter admin page view
    analytics.trackPageView('Newsletter Admin', {
      section: 'compose'
    });
    
    // Try to restore campaign progress
    const hasRestored = loadCampaignProgress();
    
    await loadAnalytics();
    await loadRecentCampaigns();
    await loadSubscriberList();

    if (hasRestored) {
      showMessage('📧 Campaign progress restored. You can continue where you left off.', 'info');
    }
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

    // Clear any existing campaign when starting new one
    clearCampaignProgress();
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
          clearCampaignProgress();
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
    clearCampaignProgress();
  }

  async function resumeCampaign() {
    if (!campaignId) return;
    
    // Verify campaign still exists and get current progress
    try {
      const response = await fetch(`/api/newsletter/campaigns/${campaignId}/status`);
      if (response.ok) {
        const data = await response.json();
        batchProgress = {
          sent: data.sent_count || 0,
          total: data.total_recipients || 0,
          batchSent: 0,
          batchFailed: 0,
          done: data.done || false
        };
        showProgress = true;
        hasActiveCampaign = true;
        showMessage('📧 Campaign resumed successfully!', 'success');
      } else {
        showMessage('Campaign not found or completed.', 'error');
        clearCampaignProgress();
      }
    } catch (error) {
      showMessage('Error resuming campaign.', 'error');
      clearCampaignProgress();
    }
  }

  function formatNumber(num: number): string {
    return new Intl.NumberFormat().format(num);
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  // Template functions
  function loadTemplate(type: string) {
    switch(type) {
      case 'welcome':
        composerSubject = 'Welcome to Abroaducate! 🎉';
        composerHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Abroaducate!</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f6fb;">
  <div style="max-width:600px;margin:0 auto;background:white;padding:40px;">
    <div style="text-align:center;margin-bottom:30px;">
      <img src="https://abroaducate.com/logopn.png" alt="Abroaducate" style="width:180px;height:auto;">
      <h1 style="color:#1E40AF;margin:20px 0;">Welcome to Abroaducate!</h1>
    </div>
    
    <div style="line-height:1.6;color:#374151;">
      <p>Hi there,</p>
      <p>We're excited to welcome you to <strong>Abroaducate</strong> – your all-in-one platform for discovering, tracking, and winning scholarships and academic opportunities abroad.</p>
      
      <div style="background:#f3f4f6;padding:20px;border-radius:8px;margin:20px 0;">
        <h3 style="margin-top:0;color:#1E40AF;">What you can do:</h3>
        <ul style="padding-left:20px;">
          <li><strong>🔍 Find Scholarships:</strong> Search and filter hundreds of scholarships</li>
          <li><strong>💾 Save & Track:</strong> Save scholarships and track applications</li>
          <li><strong>📝 AI-Powered Tools:</strong> Generate SOPs and cover letters</li>
          <li><strong>📧 Personalized Alerts:</strong> Get scholarship digests and reminders</li>
        </ul>
      </div>
      
      <p>Ready to get started? Click below to explore scholarships!</p>
    </div>
    
    <div style="text-align:center;margin:30px 0;">
      <a href="https://abroaducate.com" style="background:#2563eb;color:white;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:600;display:inline-block;">Start Exploring Scholarships</a>
    </div>
    
    <div style="border-top:1px solid #e5e7eb;padding-top:20px;margin-top:30px;text-align:center;color:#6b7280;font-size:0.9rem;">
      <p>You're receiving this because you signed up for Abroaducate updates.</p>
      <p><a href="https://abroaducate.com/newsletter/unsubscribe" style="color:#2563eb;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`;
        break;
      case 'newsletter':
        composerSubject = 'Your Weekly Scholarship Digest 📰';
        composerHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Scholarship Digest</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f6fb;">
  <div style="max-width:600px;margin:0 auto;background:white;padding:40px;">
    <div style="text-align:center;margin-bottom:30px;">
      <img src="https://abroaducate.com/logopn.png" alt="Abroaducate" style="width:150px;height:auto;">
      <h1 style="color:#1E40AF;margin:20px 0;">Weekly Scholarship Digest</h1>
      <p style="color:#6b7280;">Your curated list of scholarship opportunities</p>
    </div>
    
    <div style="line-height:1.6;color:#374151;">
      <h2 style="color:#1E40AF;">🎯 Featured Scholarships</h2>
      
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0;">
        <h3 style="margin-top:0;color:#059669;">Fulbright Scholarship Program</h3>
        <p><strong>Amount:</strong> $50,000</p>
        <p><strong>Deadline:</strong> October 15, 2024</p>
        <p><strong>Eligibility:</strong> International students pursuing graduate studies</p>
        <a href="#" style="color:#2563eb;text-decoration:none;">Learn More →</a>
      </div>
      
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0;">
        <h3 style="margin-top:0;color:#059669;">Chevening Scholarships</h3>
        <p><strong>Amount:</strong> £18,000</p>
        <p><strong>Deadline:</strong> November 2, 2024</p>
        <p><strong>Eligibility:</strong> Students from Chevening-eligible countries</p>
        <a href="#" style="color:#2563eb;text-decoration:none;">Learn More →</a>
      </div>
      
      <h2 style="color:#1E40AF;">💡 Tips & Resources</h2>
      <ul style="padding-left:20px;">
        <li>Start your applications early</li>
        <li>Tailor your SOP to each scholarship</li>
        <li>Get strong letters of recommendation</li>
        <li>Proofread everything carefully</li>
      </ul>
    </div>
    
    <div style="text-align:center;margin:30px 0;">
      <a href="https://abroaducate.com/scholarships" style="background:#2563eb;color:white;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:600;display:inline-block;">View All Scholarships</a>
    </div>
  </div>
</body>
</html>`;
        break;
      case 'announcement':
        composerSubject = 'Important Announcement from Abroaducate 📢';
        composerHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Important Announcement</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f6fb;">
  <div style="max-width:600px;margin:0 auto;background:white;padding:40px;">
    <div style="text-align:center;margin-bottom:30px;">
      <img src="https://abroaducate.com/logopn.png" alt="Abroaducate" style="width:150px;height:auto;">
      <h1 style="color:#dc2626;margin:20px 0;">Important Announcement</h1>
    </div>
    
    <div style="line-height:1.6;color:#374151;">
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;margin:20px 0;">
        <h2 style="color:#dc2626;margin-top:0;">🚨 Urgent Update</h2>
        <p>We have an important announcement regarding our platform updates and new features.</p>
      </div>
      
      <h2 style="color:#1E40AF;">What's New</h2>
      <ul style="padding-left:20px;">
        <li>Enhanced scholarship search functionality</li>
        <li>New AI-powered application tools</li>
        <li>Improved deadline tracking system</li>
        <li>Better mobile experience</li>
      </ul>
      
      <p>We're committed to providing you with the best tools for your study abroad journey.</p>
    </div>
    
    <div style="text-align:center;margin:30px 0;">
      <a href="https://abroaducate.com" style="background:#2563eb;color:white;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:600;display:inline-block;">Learn More</a>
    </div>
  </div>
</body>
</html>`;
        break;
      case 'promotion':
        composerSubject = 'Special Offer: Premium Features Unlocked! 🎉';
        composerHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Special Offer</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f6fb;">
  <div style="max-width:600px;margin:0 auto;background:white;padding:40px;">
    <div style="text-align:center;margin-bottom:30px;">
      <img src="https://abroaducate.com/logopn.png" alt="Abroaducate" style="width:150px;height:auto;">
      <h1 style="color:#059669;margin:20px 0;">Special Offer Just for You! 🎉</h1>
    </div>
    
    <div style="line-height:1.6;color:#374151;">
      <div style="background:linear-gradient(135deg,#059669,#10b981);color:white;border-radius:8px;padding:30px;margin:20px 0;text-align:center;">
        <h2 style="margin-top:0;color:white;">Limited Time Offer</h2>
        <p style="font-size:1.2rem;margin:20px 0;">Get 50% off Premium features for the next 7 days!</p>
        <div style="font-size:2rem;font-weight:bold;margin:20px 0;">$49 → $24.50</div>
      </div>
      
      <h2 style="color:#1E40AF;">What You'll Get</h2>
      <ul style="padding-left:20px;">
        <li>✅ Unlimited AI document generation</li>
        <li>✅ Priority scholarship matching</li>
        <li>✅ Advanced analytics and insights</li>
        <li>✅ Priority customer support</li>
        <li>✅ Early access to new features</li>
      </ul>
      
      <p><strong>Offer expires in 7 days!</strong> Don't miss this opportunity to supercharge your study abroad journey.</p>
    </div>
    
    <div style="text-align:center;margin:30px 0;">
      <a href="https://abroaducate.com/pricing" style="background:#059669;color:white;padding:16px 40px;text-decoration:none;border-radius:6px;font-weight:600;font-size:1.1rem;display:inline-block;">Claim Your Discount</a>
    </div>
    
    <div style="text-align:center;margin-top:30px;color:#6b7280;font-size:0.9rem;">
      <p>This offer is valid for 7 days only. Terms and conditions apply.</p>
    </div>
  </div>
</body>
</html>`;
        break;
    }
    showMessage(`Template "${type}" loaded successfully!`, 'success');
  }

  // Editor helper functions
  function insertText(before: string, after: string) {
    const textarea = document.getElementById('html-content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = composerHtml.substring(start, end);
      const newText = before + selectedText + after;
      composerHtml = composerHtml.substring(0, start) + newText + composerHtml.substring(end);
      
      // Set cursor position after inserted text
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
      }, 0);
    }
  }

  // Automated batch sending functions
  async function startAutoSend() {
    if (!composerSubject.trim() || !composerHtml.trim()) {
      showMessage('Please fill in subject and HTML content.', 'error');
      return;
    }

    // Check SendGrid limits (adjust based on your plan)
    const maxDailySends = 100; // Free plan limit - adjust for your plan
    const maxBatchSize = 100; // Free plan limit - adjust for your plan
    
    if (autoBatchSize > maxBatchSize) {
      showMessage(`Batch size cannot exceed ${maxBatchSize} for your current SendGrid plan.`, 'error');
      return;
    }
    
    if (totalRecipients > maxDailySends) {
      showMessage(`Total recipients (${totalRecipients}) exceeds your daily SendGrid limit (${maxDailySends}).`, 'error');
      return;
    }

    if (!confirm(`Start automated sending to ${totalRecipients} recipients in batches of ${autoBatchSize}?\n\nThis will send ${Math.ceil(totalRecipients / autoBatchSize)} batches with ${delayBetweenBatches} minute delays between each.`)) {
      return;
    }

    autoSending = true;
    autoProgress = {
      sent: 0,
      total: totalRecipients,
      currentBatch: 0,
      totalBatches: Math.ceil(totalRecipients / autoBatchSize),
      nextBatchTime: null
    };

    try {
      // Start new campaign
      const response = await fetch('/api/newsletter/batch-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: composerSubject,
          html: composerHtml,
          batch_size: autoBatchSize,
          total_recipients: totalRecipients
        })
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        autoCampaignId = data.campaign_id;
        autoProgress.sent = data.sent_count;
        autoProgress.currentBatch = 1;
        
        showMessage(`✅ Started automated sending! Sent batch 1 of ${autoProgress.totalBatches}`, 'success');
        
        // Schedule next batch
        if (autoProgress.currentBatch < autoProgress.totalBatches) {
          scheduleNextBatch();
        }
      } else {
        showMessage(data.error || 'Failed to start automated sending.', 'error');
        autoSending = false;
      }
    } catch (error) {
      showMessage('Error starting automated sending.', 'error');
      autoSending = false;
    }
  }

  function scheduleNextBatch() {
    const delayMs = delayBetweenBatches * 60 * 1000; // Convert minutes to milliseconds
    const nextBatchTime = new Date(Date.now() + delayMs);
    
    autoProgress.nextBatchTime = nextBatchTime;
    
    setTimeout(async () => {
      if (autoSending && autoProgress.currentBatch < autoProgress.totalBatches) {
        await sendNextAutoBatch();
      }
    }, delayMs);
  }

  async function sendNextAutoBatch() {
    if (!autoCampaignId || autoProgress.currentBatch >= autoProgress.totalBatches) {
      return;
    }

    try {
      const response = await fetch('/api/newsletter/batch-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: composerSubject,
          html: composerHtml,
          campaign_id: autoCampaignId,
          batch_size: autoBatchSize
        })
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        autoProgress.sent += data.batch_sent;
        autoProgress.currentBatch++;
        
        showMessage(`✅ Sent batch ${autoProgress.currentBatch} of ${autoProgress.totalBatches} (${autoProgress.sent}/${autoProgress.total} sent)`, 'success');
        
        if (autoProgress.currentBatch < autoProgress.totalBatches) {
          scheduleNextBatch();
        } else {
          // All batches complete
          autoSending = false;
          showMessage(`🎉 Automated sending complete! Sent ${autoProgress.sent} emails to ${autoProgress.total} recipients.`, 'success');
          
          // Track completion
          analytics.trackEvent('newsletter_auto_complete', {
            campaign_id: autoCampaignId,
            total_sent: autoProgress.sent,
            total_recipients: autoProgress.total,
            batches_sent: autoProgress.currentBatch
          });
        }
      } else {
        showMessage(data.error || 'Failed to send batch.', 'error');
        autoSending = false;
      }
    } catch (error) {
      showMessage('Error sending batch.', 'error');
      autoSending = false;
    }
  }

  function stopAutoSend() {
    autoSending = false;
    autoProgress.nextBatchTime = null;
    showMessage('⏹️ Automated sending stopped.', 'info');
  }

  function formatTimeRemaining() {
    if (!autoProgress.nextBatchTime) return '';
    
    const now = new Date();
    const timeLeft = autoProgress.nextBatchTime.getTime() - now.getTime();
    
    if (timeLeft <= 0) return 'Sending now...';
    
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

  // Test SendGrid configuration
  async function testSendGridConfig() {
    try {
      const response = await fetch('/api/newsletter/test-sendgrid');
      const data = await response.json();
      
      if (response.ok && data.success) {
        showMessage('✅ SendGrid is working! Test email sent to your inbox.', 'success');
      } else {
        showMessage(`❌ SendGrid test failed: ${data.error}`, 'error');
        console.error('SendGrid test details:', data);
      }
    } catch (error) {
      showMessage('❌ Failed to test SendGrid configuration.', 'error');
      console.error('SendGrid test error:', error);
    }
  }
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
    
    <!-- SendGrid Test Button -->
    <div class="sendgrid-test-section">
      <h3>🔧 SendGrid Configuration Test</h3>
      <p>Test if your SendGrid email service is properly configured for newsletter automation.</p>
      <button onclick={testSendGridConfig} class="test-sendgrid-btn">
        🧪 Test SendGrid Configuration
      </button>
      <small>This will send a test email to your admin email address to verify SendGrid is working.</small>
    </div>
  </div>

  <!-- Compose Newsletter Section -->
  <div class="compose-section">
    <h2>✉️ Compose Newsletter</h2>
    
    <!-- Campaign Info Card -->
    <div class="campaign-info-card">
      <div class="campaign-stats">
        <div class="stat-item">
          <span class="stat-label">Active Subscribers</span>
          <span class="stat-value">{formatNumber(activeSubscribers)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Batch Size</span>
          <span class="stat-value">{composerBatchSize}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Estimated Batches</span>
          <span class="stat-value">{Math.ceil(activeSubscribers / composerBatchSize)}</span>
        </div>
      </div>
    </div>

    <!-- Template Selection -->
    <div class="template-section">
      <h3>📋 Choose Template</h3>
      <div class="template-grid">
        <button class="template-card" onclick={() => loadTemplate('welcome')}>
          <div class="template-icon">👋</div>
          <div class="template-title">Welcome Email</div>
          <div class="template-desc">Welcome new subscribers</div>
        </button>
        <button class="template-card" onclick={() => loadTemplate('newsletter')}>
          <div class="template-icon">📰</div>
          <div class="template-title">Newsletter</div>
          <div class="template-desc">Regular newsletter update</div>
        </button>
        <button class="template-card" onclick={() => loadTemplate('announcement')}>
          <div class="template-icon">📢</div>
          <div class="template-title">Announcement</div>
          <div class="template-desc">Important announcement</div>
        </button>
        <button class="template-card" onclick={() => loadTemplate('promotion')}>
          <div class="template-icon">🎉</div>
          <div class="template-title">Promotion</div>
          <div class="template-desc">Special offer or promotion</div>
        </button>
      </div>
    </div>

    <!-- Compose Form -->
    <div class="compose-form">
      <div class="form-row">
        <div class="form-group">
          <label for="subject">📧 Subject Line</label>
          <input 
            id="subject"
            type="text" 
            bind:value={composerSubject} 
            placeholder="Enter compelling subject line..."
            maxlength="100"
          />
          <div class="char-count">{composerSubject.length}/100</div>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="batch-size">📦 Batch Size</label>
          <div class="batch-size-controls">
            <input 
              id="batch-size"
              type="number" 
              min="1" 
              max="1000" 
              bind:value={composerBatchSize}
              placeholder="Batch size"
            />
            <div class="batch-presets">
              <button type="button" onclick={() => composerBatchSize = 50} class="preset-btn">50</button>
              <button type="button" onclick={() => composerBatchSize = 100} class="preset-btn">100</button>
              <button type="button" onclick={() => composerBatchSize = 200} class="preset-btn">200</button>
              <button type="button" onclick={() => composerBatchSize = 500} class="preset-btn">500</button>
            </div>
          </div>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="html-content">📝 Email Content</label>
          <div class="editor-toolbar">
            <button type="button" onclick={() => insertText('<h1>', '</h1>')} class="toolbar-btn">H1</button>
            <button type="button" onclick={() => insertText('<h2>', '</h2>')} class="toolbar-btn">H2</button>
            <button type="button" onclick={() => insertText('<strong>', '</strong>')} class="toolbar-btn">Bold</button>
            <button type="button" onclick={() => insertText('<em>', '</em>')} class="toolbar-btn">Italic</button>
            <button type="button" onclick={() => insertText('<a href="">', '</a>')} class="toolbar-btn">Link</button>
            <button type="button" onclick={() => insertText('<img src="" alt="" style="max-width:100%;">')} class="toolbar-btn">Image</button>
            <button type="button" onclick={() => insertText('<div style="background:#f3f4f6;padding:1rem;border-radius:8px;margin:1rem 0;">', '</div>')} class="toolbar-btn">Box</button>
            <button type="button" onclick={() => insertText('<button style="background:#2563eb;color:white;padding:12px 24px;border:none;border-radius:6px;text-decoration:none;display:inline-block;">', '</button>')} class="toolbar-btn">Button</button>
          </div>
          <textarea 
            id="html-content"
            bind:value={composerHtml} 
            placeholder="Write your email content here... Use the toolbar above for formatting."
            rows="15"
          />
          <div class="editor-stats">
            <span>Words: {composerHtml.split(/\s+/).filter(word => word.length > 0).length}</span>
            <span>Characters: {composerHtml.length}</span>
          </div>
        </div>
      </div>

      <!-- Test Email Section -->
      <div class="test-section">
        <h3>🧪 Test Your Email</h3>
        <div class="test-form">
          <div class="form-group">
            <label for="test-email">Test Email Address</label>
            <input 
              id="test-email"
              type="email" 
              bind:value={composerTestEmail} 
              placeholder="your@email.com"
            />
          </div>
          <button onclick={sendTestEmail} disabled={composerLoading || sendingBatch} class="test-btn">
            {composerLoading ? 'Sending...' : 'Send Test Email'}
          </button>
        </div>
        {#if composerTestMessage}
          <div class="test-message {composerTestMessage.startsWith('✅') ? 'success' : 'error'}">
            {composerTestMessage}
          </div>
        {/if}
      </div>

      <!-- Automated Sending Section -->
      <div class="auto-send-section">
        <h3>🤖 Automated Batch Sending</h3>
        <div class="auto-send-controls">
          <div class="auto-send-toggle">
            <label class="toggle-label">
              <input type="checkbox" bind:checked={autoSendEnabled} />
              <span class="toggle-slider"></span>
              Enable Automated Sending
            </label>
          </div>
          
          {#if autoSendEnabled}
            <div class="auto-send-settings">
              <div class="setting-row">
                <div class="form-group">
                  <label for="total-recipients">Total Recipients</label>
                  <input 
                    id="total-recipients"
                    type="number" 
                    bind:value={totalRecipients} 
                    min="1" 
                    max="10000"
                    placeholder="80"
                  />
                </div>
                <div class="form-group">
                  <label for="auto-batch-size">Batch Size</label>
                  <input 
                    id="auto-batch-size"
                    type="number" 
                    bind:value={autoBatchSize} 
                    min="1" 
                    max="500"
                    placeholder="20"
                  />
                </div>
                <div class="form-group">
                  <label for="delay-between">Delay Between Batches (minutes)</label>
                  <input 
                    id="delay-between"
                    type="number" 
                    bind:value={delayBetweenBatches} 
                    min="1" 
                    max="10"
                    placeholder="2"
                  />
                </div>
              </div>
              
              <div class="auto-send-summary">
                <div class="summary-item">
                  <span class="label">Total Batches:</span>
                  <span class="value">{Math.ceil(totalRecipients / autoBatchSize)}</span>
                </div>
                <div class="summary-item">
                  <span class="label">Total Time:</span>
                  <span class="value">{Math.ceil(totalRecipients / autoBatchSize) * delayBetweenBatches} minutes</span>
                </div>
                <div class="summary-item">
                  <span class="label">Last Batch Size:</span>
                  <span class="value">{totalRecipients % autoBatchSize || autoBatchSize}</span>
                </div>
              </div>
              
              <div class="auto-send-actions">
                {#if !autoSending}
                  <button onclick={startAutoSend} disabled={!composerSubject.trim() || !composerHtml.trim()} class="auto-start-btn">
                    🚀 Start Automated Sending
                  </button>
                {:else}
                  <button onclick={stopAutoSend} class="auto-stop-btn">
                    ⏹️ Stop Automated Sending
                  </button>
                {/if}
              </div>
            </div>
          {/if}
        </div>
        
        {#if autoSending}
          <div class="auto-progress-section">
            <div class="auto-progress-header">
              <h4>🤖 Automated Sending Progress</h4>
              <div class="auto-progress-stats">
                <span>Batch {autoProgress.currentBatch} of {autoProgress.totalBatches}</span>
                <span>{autoProgress.sent}/{autoProgress.total} sent</span>
                {#if autoProgress.nextBatchTime}
                  <span>Next batch in: {formatTimeRemaining()}</span>
                {/if}
              </div>
            </div>
            
            <div class="auto-progress-bar-container">
              <div class="auto-progress-bar">
                <div class="auto-progress-fill" style="width:{Math.min(100, (autoProgress.sent / (autoProgress.total || 1)) * 100)}%"></div>
              </div>
            </div>
            
            <div class="auto-progress-details">
              <div class="detail-item">
                <span class="label">Current Batch:</span>
                <span class="value">{autoProgress.currentBatch}/{autoProgress.totalBatches}</span>
              </div>
              <div class="detail-item">
                <span class="label">Emails Sent:</span>
                <span class="value">{autoProgress.sent}/{autoProgress.total}</span>
              </div>
              <div class="detail-item">
                <span class="label">Progress:</span>
                <span class="value">{Math.round((autoProgress.sent / (autoProgress.total || 1)) * 100)}%</span>
              </div>
              {#if autoProgress.nextBatchTime}
                <div class="detail-item">
                  <span class="label">Next Batch:</span>
                  <span class="value">{autoProgress.nextBatchTime.toLocaleTimeString()}</span>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <div class="primary-actions">
          <button onclick={() => composerPreview = !composerPreview} disabled={sendingBatch} class="preview-btn">
            {composerPreview ? '👁️ Hide Preview' : '👁️ Show Preview'}
          </button>
          <button
            onclick={sendToAllSubscribers}
            disabled={composerLoading || sendingBatch || !composerSubject.trim() || !composerHtml.trim()}
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendingBatch ? 'Sending...' : `📤 Send to All (${formatNumber(activeSubscribers)})`}
          </button>
        </div>
        
        <div class="secondary-actions">
          {#if hasActiveCampaign && !showProgress}
            <button onclick={resumeCampaign} disabled={sendingBatch} class="resume-btn">
              📧 Resume Campaign
            </button>
          {/if}
          {#if showProgress}
            <button onclick={resetBatchProgress} disabled={sendingBatch} class="reset-btn">
              🔄 Reset Campaign
            </button>
          {/if}
        </div>
      </div>

      <!-- Preview Section -->
      {#if composerPreview}
        <div class="preview-section">
          <h3>👁️ Email Preview</h3>
          <div class="preview-container">
            <div class="preview-header">
              <strong>Subject:</strong> {composerSubject || 'No subject'}
            </div>
            <div class="preview-content">
              {@html composerHtml || '<p style="color:#6b7280;font-style:italic;">No content to preview</p>'}
            </div>
          </div>
        </div>
      {/if}

      <!-- Progress Section -->
      {#if showProgress}
        <div class="progress-section">
          <div class="progress-header">
            <h3>📊 Campaign Progress</h3>
            <div class="progress-stats">
              <span class="stat">Sent: <strong>{formatNumber(batchProgress.sent)}</strong></span>
              <span class="stat">Total: <strong>{formatNumber(batchProgress.total)}</strong></span>
              <span class="stat">Progress: <strong>{Math.round((batchProgress.sent / (batchProgress.total || 1)) * 100)}%</strong></span>
            </div>
          </div>
          
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div class="progress-fill" style="width:{Math.min(100, (batchProgress.sent / (batchProgress.total || 1)) * 100)}%"></div>
            </div>
          </div>
          
          <div class="batch-info">
            <div class="batch-stat">
              <span class="label">Last Batch:</span>
              <span class="value success">{formatNumber(batchProgress.batchSent)} sent</span>
              <span class="value error">{formatNumber(batchProgress.batchFailed)} failed</span>
            </div>
            {#if batchProgress.done}
              <div class="completion-message">
                ✅ Campaign completed successfully!
              </div>
            {:else}
              <button onclick={sendNextBatch} disabled={sendingBatch} class="next-batch-btn">
                {sendingBatch ? '📤 Sending Next Batch...' : '📤 Send Next Batch'}
              </button>
            {/if}
          </div>
        </div>
      {/if}
    </div>
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
      <button onclick={fetchEmailLogs} disabled={loadingLogs} style="margin-bottom:0.5rem;">{loadingLogs ? 'Refreshing...' : 'Refresh Log'}</button>
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
    padding: 2rem;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .header h1 {
    color: #1f2937;
    margin-bottom: 0.5rem;
    font-size: 2.5rem;
    font-weight: 700;
  }

  .header p {
    color: #6b7280;
    font-size: 1.1rem;
  }

  .message {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    font-weight: 500;
  }

  .message.success {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #a7f3d0;
  }

  .message.error {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  .message.info {
    background: #dbeafe;
    color: #1e40af;
    border: 1px solid #bfdbfe;
  }

  /* Analytics Section */
  .analytics-section {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .analytics-section h2 {
    color: #1f2937;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  .analytics-card {
    background: #f8fafc;
    padding: 1.5rem;
    border-radius: 8px;
    text-align: center;
    border: 1px solid #e2e8f0;
  }

  .analytics-card h4 {
    color: #64748b;
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .big-number {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.25rem 0;
  }

  .analytics-card small {
    color: #6b7280;
    font-size: 0.75rem;
  }

  /* Compose Section */
  .compose-section {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .compose-section h2 {
    color: #1f2937;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    font-weight: 600;
  }

  /* Campaign Info Card */
  .campaign-info-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1.5rem;
    border-radius: 12px;
    margin-bottom: 2rem;
  }

  .campaign-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }

  .stat-item {
    text-align: center;
  }

  .stat-label {
    display: block;
    font-size: 0.875rem;
    opacity: 0.9;
    margin-bottom: 0.5rem;
  }

  .stat-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
  }

  /* Template Section */
  .template-section {
    margin-bottom: 2rem;
  }

  .template-section h3 {
    color: #1f2937;
    margin-bottom: 1rem;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .template-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .template-card {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    padding: 1.5rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .template-card:hover {
    border-color: #3b82f6;
    background: #eff6ff;
    transform: translateY(-2px);
  }

  .template-icon {
    font-size: 2rem;
  }

  .template-title {
    font-weight: 600;
    color: #1f2937;
  }

  .template-desc {
    font-size: 0.875rem;
    color: #6b7280;
  }

  /* Form Styles */
  .compose-form {
    margin-top: 2rem;
  }

  .form-row {
    margin-bottom: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group label {
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }

  .form-group input,
  .form-group textarea {
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.2s ease;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .char-count {
    font-size: 0.75rem;
    color: #6b7280;
    text-align: right;
    margin-top: 0.25rem;
  }

  /* Batch Size Controls */
  .batch-size-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .batch-presets {
    display: flex;
    gap: 0.5rem;
  }

  .preset-btn {
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .preset-btn:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
  }

  /* Editor Toolbar */
  .editor-toolbar {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
  }

  .toolbar-btn {
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .toolbar-btn:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
  }

  .editor-stats {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: #6b7280;
  }

  /* Test Section */
  .test-section {
    background: #f8fafc;
    border-radius: 8px;
    padding: 1.5rem;
    margin: 2rem 0;
  }

  .test-section h3 {
    color: #1f2937;
    margin-bottom: 1rem;
    font-size: 1.125rem;
    font-weight: 600;
  }

  .test-form {
    display: flex;
    gap: 1rem;
    align-items: end;
  }

  .test-btn {
    padding: 0.75rem 1.5rem;
    background: #059669;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .test-btn:hover:not(:disabled) {
    background: #047857;
  }

  .test-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .test-message {
    margin-top: 1rem;
    padding: 0.75rem;
    border-radius: 6px;
    font-weight: 500;
  }

  .test-message.success {
    background: #d1fae5;
    color: #065f46;
  }

  .test-message.error {
    background: #fee2e2;
    color: #991b1b;
  }

  /* Action Buttons */
  .action-buttons {
    margin: 2rem 0;
  }

  .primary-actions {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .secondary-actions {
    display: flex;
    gap: 1rem;
  }

  .preview-btn {
    padding: 0.75rem 1.5rem;
    background: #6b7280;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .preview-btn:hover:not(:disabled) {
    background: #4b5563;
  }

  .send-btn {
    padding: 0.75rem 1.5rem;
    background: #059669;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .send-btn:hover:not(:disabled) {
    background: #047857;
  }

  .resume-btn {
    padding: 0.75rem 1.5rem;
    background: #f59e0b;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .resume-btn:hover:not(:disabled) {
    background: #d97706;
  }

  .reset-btn {
    padding: 0.75rem 1.5rem;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .reset-btn:hover:not(:disabled) {
    background: #dc2626;
  }

  .preview-btn:disabled,
  .send-btn:disabled,
  .resume-btn:disabled,
  .reset-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Preview Section */
  .preview-section {
    margin-top: 2rem;
    padding: 1.5rem;
    background: #f8fafc;
    border-radius: 8px;
  }

  .preview-section h3 {
    color: #1f2937;
    margin-bottom: 1rem;
    font-size: 1.125rem;
    font-weight: 600;
  }

  .preview-container {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
  }

  .preview-header {
    background: #f1f5f9;
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;
    font-weight: 500;
  }

  .preview-content {
    padding: 2rem;
    max-height: 400px;
    overflow-y: auto;
  }

  /* Progress Section */
  .progress-section {
    margin-top: 2rem;
    padding: 1.5rem;
    background: #f8fafc;
    border-radius: 8px;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .progress-header h3 {
    color: #1f2937;
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
  }

  .progress-stats {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
  }

  .stat {
    color: #6b7280;
  }

  .stat strong {
    color: #1f2937;
  }

  .progress-bar-container {
    margin: 1rem 0;
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #059669, #10b981);
    transition: width 0.3s ease;
  }

  .batch-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
  }

  .batch-stat {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .batch-stat .label {
    color: #6b7280;
    font-size: 0.875rem;
  }

  .batch-stat .value {
    font-weight: 600;
  }

  .batch-stat .value.success {
    color: #059669;
  }

  .batch-stat .value.error {
    color: #dc2626;
  }

  .completion-message {
    color: #059669;
    font-weight: 600;
    font-size: 1.125rem;
  }

  .next-batch-btn {
    padding: 0.75rem 1.5rem;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .next-batch-btn:hover:not(:disabled) {
    background: #1d4ed8;
  }

  .next-batch-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Automated Sending Section */
  .auto-send-section {
    background: #f8fafc;
    border-radius: 8px;
    padding: 1.5rem;
    margin: 2rem 0;
    border: 2px solid #e2e8f0;
  }

  .auto-send-section h3 {
    color: #1f2937;
    margin-bottom: 1rem;
    font-size: 1.125rem;
    font-weight: 600;
  }

  .auto-send-controls {
    margin-bottom: 1rem;
  }

  .auto-send-toggle {
    margin-bottom: 1rem;
  }

  .toggle-label {
    display: flex;
    align-items: center;
    cursor: pointer;
    font-weight: 600;
    color: #374151;
  }

  .toggle-label input {
    display: none;
  }

  .toggle-slider {
    width: 50px;
    height: 24px;
    background: #d1d5db;
    border-radius: 12px;
    position: relative;
    margin-right: 0.75rem;
    transition: background-color 0.2s ease;
  }

  .toggle-slider:before {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    top: 2px;
    left: 2px;
    transition: transform 0.2s ease;
  }

  .toggle-label input:checked + .toggle-slider {
    background: #059669;
  }

  .toggle-label input:checked + .toggle-slider:before {
    transform: translateX(26px);
  }

  .auto-send-settings {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid #e2e8f0;
  }

  .setting-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .auto-send-summary {
    background: #f1f5f9;
    border-radius: 6px;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .summary-item:last-child {
    margin-bottom: 0;
  }

  .summary-item .label {
    font-weight: 500;
    color: #374151;
  }

  .summary-item .value {
    font-weight: 600;
    color: #1f2937;
  }

  .auto-send-actions {
    text-align: center;
  }

  .auto-start-btn {
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #059669, #10b981);
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 1rem;
  }

  .auto-start-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
  }

  .auto-start-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .auto-stop-btn {
    padding: 0.75rem 1.5rem;
    background: #dc2626;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;
    font-size: 1rem;
  }

  .auto-stop-btn:hover {
    background: #b91c1c;
  }

  .auto-progress-section {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid #e2e8f0;
    margin-top: 1rem;
  }

  .auto-progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .auto-progress-header h4 {
    color: #1f2937;
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
  }

  .auto-progress-stats {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .auto-progress-bar-container {
    margin: 1rem 0;
  }

  .auto-progress-bar {
    width: 100%;
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
  }

  .auto-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #059669, #10b981);
    transition: width 0.3s ease;
  }

  .auto-progress-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background: #f8fafc;
    border-radius: 4px;
  }

  .detail-item .label {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .detail-item .value {
    font-weight: 600;
    color: #1f2937;
  }

  /* Campaigns Section */
  .campaigns-section {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .campaigns-section h2 {
    color: #1f2937;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .campaigns-table {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
  }

  .table-header {
    background: #f8fafc;
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
    padding: 1rem;
    font-weight: 600;
    color: #374151;
    font-size: 0.875rem;
  }

  .table-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
    padding: 1rem;
    border-top: 1px solid #e2e8f0;
    align-items: center;
  }

  .table-row:hover {
    background: #f8fafc;
  }

  .col-name {
    font-weight: 500;
    color: #1f2937;
  }

  .col-date,
  .col-sent,
  .col-opens,
  .col-clicks,
  .col-unsubs {
    color: #6b7280;
    font-size: 0.875rem;
  }

  /* Subscribers Section */
  .subscribers-section {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .subscribers-section h2 {
    color: #1f2937;
    margin-bottom: 1rem;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .subscribers-section p {
    color: #6b7280;
    margin-bottom: 1.5rem;
  }

  .subscribers-table {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
  }

  .subscribers-table .table-header {
    grid-template-columns: 2fr 1fr 1fr;
  }

  .subscribers-table .table-row {
    grid-template-columns: 2fr 1fr 1fr;
  }

  .col-email {
    font-weight: 500;
    color: #1f2937;
  }

  .col-status {
    font-size: 0.875rem;
  }

  .col-status.active {
    color: #059669;
  }

  .col-status.inactive {
    color: #dc2626;
  }

  .col-date {
    color: #6b7280;
    font-size: 0.875rem;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .newsletter-admin {
      padding: 1rem;
    }

    .analytics-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .template-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .campaign-stats {
      grid-template-columns: 1fr;
    }

    .test-form {
      flex-direction: column;
      align-items: stretch;
    }

    .primary-actions,
    .secondary-actions {
      flex-direction: column;
    }

    .progress-header {
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }

    .batch-info {
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }

    .table-header,
    .table-row {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .table-header {
      display: none;
    }

    .table-row {
      padding: 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 0.5rem;
    }
  }

  .sendgrid-test-section {
    margin-top: 2rem;
    padding: 1.5rem;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }

  .sendgrid-test-section h3 {
    margin: 0 0 0.5rem 0;
    color: #1f2937;
    font-size: 1.1rem;
  }

  .sendgrid-test-section p {
    margin: 0 0 1rem 0;
    color: #6b7280;
    font-size: 0.9rem;
  }

  .test-sendgrid-btn {
    background: #059669;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 0.5rem;
  }

  .test-sendgrid-btn:hover {
    background: #047857;
    transform: translateY(-1px);
  }

  .sendgrid-test-section small {
    color: #6b7280;
    font-size: 0.8rem;
  }
</style>