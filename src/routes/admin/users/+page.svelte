<!--
To enable fast admin user panel loading, create this RPC in Supabase SQL editor:

CREATE OR REPLACE FUNCTION admin_user_panel_data()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  updated_at timestamptz,
  subscription_plan varchar,
  subscription_status varchar,
  current_period_end timestamptz,
  newsletter_status varchar,
  weekly_updates boolean,
  marketing_emails boolean,
  scholarship_digest boolean,
  newsletter_subscribed_at timestamptz
) AS $$
  SELECT
    p.id AS user_id,
    p.email,
    p.full_name,
    p.created_at,
    p.updated_at,
    us.plan_type AS subscription_plan,
    us.status AS subscription_status,
    us.current_period_end,
    ns.status AS newsletter_status,
    ns.weekly_updates,
    ns.marketing_emails,
    ns.scholarship_digest,
    ns.subscribed_at AS newsletter_subscribed_at
  FROM profiles p
  LEFT JOIN user_subscriptions us ON us.user_id = p.id AND us.status = 'active'
  LEFT JOIN newsletter_subscribers ns ON ns.user_id = p.id;
$$ LANGUAGE sql STABLE;
-->

<script lang="ts">
  import { onMount } from 'svelte';
  
  let { data } = $props();
  let { supabase, session } = $derived(data);

  // Debug: Log session user ID
  console.log('Session user ID:', session?.user?.id);

  // Debug: Log Supabase URL and session user
  console.log('Supabase URL:', supabase?.rest?.url || supabase?.url);
  console.log('Session user:', session?.user);
  
  let loading = $state(false);
  let message = $state('');
  let messageType = $state('info');
  
  // Pagination state
  let pageSize = 10;
  let currentPage = $state(1);
  let totalUsers = $state(0);
  let totalPages = $state(1);

  // User Statistics - dynamic
  let userStats = $state({
    total_users: 0,
    active_users: 0,
    premium_users: 0,
    newsletter_subscribers: 0,
    recent_signups: 0,
    free_users: 0,
    professional_users: 0,
    elite_users: 0
  });
  
  // User List
  let users = $state<any[]>([]);
  let searchTerm = $state('');
  let filterType = $state('all'); // all, premium, free, newsletter
  let now = new Date();
  
  onMount(async () => {
    await loadUserData();
  });

  $effect(() => {
    currentPage; // reference to make this effect depend on currentPage
    loadUserData();
  });

  async function loadUserData() {
    loading = true;
    try {
      // Fetch paginated users and total count
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data: usersData, error, count } = await supabase
        .rpc('admin_user_panel_data', {}, { count: 'exact' })
        .range(from, to);
      if (error) throw error;
      users = usersData || [];
      totalUsers = count || 0;
      totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
      computeUserStats(users);
    } catch (error) {
      console.error('Error loading user data:', error);
      users = [];
      userStats = {
        total_users: 0,
        active_users: 0,
        premium_users: 0,
        newsletter_subscribers: 0,
        recent_signups: 0,
        free_users: 0,
        professional_users: 0,
        elite_users: 0
      };
    } finally {
      loading = false;
    }
  }

  // Compute real statistics from user list
  function computeUserStats(userList: any[]) {
    const now = new Date();
    const daysAgo = (dateStr: string, days: number) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return (now.getTime() - d.getTime()) < days * 24 * 60 * 60 * 1000;
    };
    let total = userList.length;
    let active = userList.filter(u => daysAgo(u.updated_at || u.last_sign_in_at, 30)).length;
    let recent = userList.filter(u => daysAgo(u.created_at, 30)).length;
    let premium = userList.filter(u => ['professional','elite'].includes((u.subscription_plan||'').toLowerCase()) && u.subscription_status === 'active').length;
    let free = userList.filter(u => (u.subscription_plan||'free').toLowerCase() === 'free').length;
    let professional = userList.filter(u => (u.subscription_plan||'').toLowerCase() === 'professional').length;
    let elite = userList.filter(u => (u.subscription_plan||'').toLowerCase() === 'elite').length;
    let newsletter = userList.filter(u => u.newsletter_status === 'subscribed' || u.weekly_updates || u.marketing_emails || u.scholarship_digest).length;
    userStats = {
      total_users: total,
      active_users: active,
      premium_users: premium,
      newsletter_subscribers: newsletter,
      recent_signups: recent,
      free_users: free,
      professional_users: professional,
      elite_users: elite
    };
  }

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

  // Plan badge helper
  function getUserPlanType(user: any): 'premium' | 'free' {
    if (["professional","elite"].includes((user.subscription_plan||'').toLowerCase())) return 'premium';
    return 'free';
  }
  function getUserPlanName(user: any): string {
    if (!user.subscription_plan) return 'Academic Starter';
    if (user.subscription_plan.toLowerCase() === 'professional') return 'Academic Professional';
    if (user.subscription_plan.toLowerCase() === 'elite') return 'Academic Elite';
    return 'Academic Starter';
  }

  // Newsletter badge helper
  function isNewsletterSubscribed(user: any): boolean {
    return user.newsletter_status === 'subscribed' || user.weekly_updates || user.marketing_emails || user.scholarship_digest;
  }

  // Filter users based on search and filter type  
  const filteredUsers = $derived(users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesFilter = true;
    if (filterType === 'premium') matchesFilter = getUserPlanType(user) === 'premium';
    if (filterType === 'free') matchesFilter = getUserPlanType(user) === 'free';
    if (filterType === 'newsletter') matchesFilter = isNewsletterSubscribed(user);
    return matchesSearch && matchesFilter;
  }));

  // Pagination controls
  function nextPage() {
    if (currentPage < totalPages) currentPage += 1;
  }
  function prevPage() {
    if (currentPage > 1) currentPage -= 1;
  }

  // Management actions
  function handleManageUser(user: any) {
    // Example: show a modal or dropdown for actions
    showMessage(`Manage user: ${user.email} (coming soon)`, 'info');
    // TODO: Implement real actions (view, disable, etc.)
  }

  // Modal state
  let showUserModal = $state(false);
  let selectedUser = $state(null);
  let editFullName = $state('');
  let disableMessage = $state('');
  let disableSuccess = $state(false);

  function openUserModal(user) {
    selectedUser = user;
    editFullName = user.full_name || '';
    showUserModal = true;
    disableMessage = '';
    disableSuccess = false;
  }
  function closeUserModal() {
    showUserModal = false;
    selectedUser = null;
    editFullName = '';
    disableMessage = '';
    disableSuccess = false;
  }
  async function saveUserEdit() {
    if (!selectedUser) return;
    const { error } = await supabase.from('profiles').update({ full_name: editFullName }).eq('id', selectedUser.user_id);
    if (error) {
      disableMessage = 'Error updating user: ' + error.message;
      disableSuccess = false;
    } else {
      selectedUser.full_name = editFullName;
      disableMessage = 'User updated successfully!';
      disableSuccess = true;
      await loadUserData();
    }
  }
  async function disableUser() {
    if (!selectedUser) return;
    // Soft disable: set a disabled flag (add this column if not present)
    const { error } = await supabase.from('profiles').update({ disabled: true }).eq('id', selectedUser.user_id);
    if (error) {
      disableMessage = 'Error disabling user: ' + error.message;
      disableSuccess = false;
    } else {
      disableMessage = 'User disabled successfully!';
      disableSuccess = true;
      await loadUserData();
    }
  }

// Campaign modal state
let showCampaignModal = $state(false);
let campaignType = $state('');
let campaignSubject = $state('');
let campaignBody = $state('');
let campaignMessage = $state('');
let showTemplatesModal = $state(false);
let selectedTemplate = $state('');
let showPromoModal = $state(false);
let promoSubject = $state('Upgrade to Premium!');
let promoBody = $state('Unlock premium features by upgrading your plan.');
let promoMessage = $state('');

function openCampaignModal() {
  campaignType = 'user';
  campaignSubject = '';
  campaignBody = '';
  campaignMessage = '';
  showCampaignModal = true;
}
function openTemplatesModal() {
  showTemplatesModal = true;
  selectedTemplate = '';
}
function openPromoModal() {
  showPromoModal = true;
  promoSubject = 'Upgrade to Premium!';
  promoBody = 'Unlock premium features by upgrading your plan.';
  promoMessage = '';
}
function closeCampaignModal() {
  showCampaignModal = false;
}
function closeTemplatesModal() {
  showTemplatesModal = false;
}
function closePromoModal() {
  showPromoModal = false;
}
function selectTemplate(template) {
  selectedTemplate = template;
  campaignSubject = template.subject;
  campaignBody = template.body;
  showTemplatesModal = false;
  showCampaignModal = true;
}
async function sendCampaign() {
  campaignMessage = '';
  try {
    const response = await fetch('/api/newsletter/campaigns/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaign_id: '2f9c92e0-9917-49c5-8d6b-4489964294c9',
        send_immediately: true
      })
    });
    const result = await response.json();
    if (result.success) {
      campaignMessage = 'Campaign sent to all users!';
    } else {
      campaignMessage = 'Error: ' + (result.error || 'Unknown error');
    }
  } catch (e) {
    campaignMessage = 'Error sending campaign: ' + e.message;
  }
}
async function sendPromo() {
  // TODO: Integrate with backend/email system
  promoMessage = 'Premium promotion sent (simulated)!';
}
</script>

<svelte:head>
  <title>User Management - Admin</title>
</svelte:head>

<div class="user-management">
  <div class="header">
    <h1>👥 User Management</h1>
    <p>Manage your {formatNumber(userStats.total_users)} registered users and their email preferences</p>
  </div>

  <!-- Message Display -->
  {#if message}
    <div class="message {messageType}">
      {message}
    </div>
  {/if}

  <!-- User Statistics -->
  <div class="stats-section">
    <h2>📊 User Statistics</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Total Users</h3>
        <p class="big-number">{formatNumber(userStats.total_users)}</p>
        <p class="stat-note">Registered accounts</p>
      </div>
      
      <div class="stat-card">
        <h3>Active Users</h3>
        <p class="big-number">{formatNumber(userStats.active_users)}</p>
        <p class="stat-note">Last 30 days</p>
      </div>
      
      <div class="stat-card">
        <h3>Premium Users</h3>
        <p class="big-number">{formatNumber(userStats.premium_users)}</p>
        <p class="stat-note">Professional + Elite</p>
      </div>
      
      <div class="stat-card">
        <h3>Newsletter Subs</h3>
        <p class="big-number">{formatNumber(userStats.newsletter_subscribers)}</p>
        <p class="stat-note">Opted in to emails</p>
      </div>
      
      <div class="stat-card">
        <h3>Recent Signups</h3>
        <p class="big-number">{formatNumber(userStats.recent_signups)}</p>
        <p class="stat-note">Last 30 days</p>
      </div>
    </div>
  </div>

  <!-- Plan Breakdown (matching Analytics Dashboard) -->
  <div class="plans-section">
    <h2>💎 Subscription Plan Breakdown</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Academic Starter</h3>
        <p class="big-number">{formatNumber(userStats.free_users)}</p>
        <p class="stat-note">{userStats.total_users > 0 ? Math.round((userStats.free_users / userStats.total_users) * 100) : 0}% of total users</p>
      </div>
      
      <div class="stat-card">
        <h3>Academic Professional</h3>
        <p class="big-number">{formatNumber(userStats.professional_users)}</p>
        <p class="stat-note">{userStats.total_users > 0 ? Math.round((userStats.professional_users / userStats.total_users) * 100) : 0}% of total users</p>
      </div>
      
      <div class="stat-card">
        <h3>Academic Elite</h3>
        <p class="big-number">{formatNumber(userStats.elite_users)}</p>
        <p class="stat-note">{userStats.total_users > 0 ? Math.round((userStats.elite_users / userStats.total_users) * 100) : 0}% of total users</p>
      </div>
      
      <div class="stat-card">
        <h3>Conversion Rate</h3>
        <p class="big-number">{userStats.total_users > 0 ? Math.round((userStats.premium_users / userStats.total_users) * 100) : 0}%</p>
        <p class="stat-note">Free to Premium conversion</p>
      </div>
    </div>
  </div>

  <!-- Email Campaign Management for Users -->
  <div class="email-section">
    <h2>📧 Email Campaigns for Registered Users</h2>
    <div class="campaign-options">
      <div class="campaign-card">
        <h4>📚 Study Tips & Updates</h4>
        <p>Send personalized study abroad tips and platform updates to your registered users</p>
        <div class="campaign-actions">
          <button class="campaign-btn primary" onclick={openCampaignModal}>
            Create User Campaign
          </button>
          <button class="campaign-btn" onclick={openTemplatesModal}>
            View Templates
          </button>
        </div>
      </div>
      <div class="campaign-card">
        <h4>🎓 Premium Features</h4>
        <p>Promote premium features to Academic Starter users and share success stories</p>
        <div class="campaign-actions">
          <button class="campaign-btn" onclick={openPromoModal}>
            Premium Promotion
          </button>
          <button class="campaign-btn" disabled>
            Success Stories
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Campaign Modals -->
{#if showCampaignModal}
  <div class="modal-backdrop" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.3);z-index:1000;display:flex;align-items:center;justify-content:center;">
    <div class="modal-content" style="background:#fff;padding:2rem;border-radius:12px;min-width:350px;max-width:95vw;box-shadow:0 2px 16px rgba(0,0,0,0.15);">
      <h2>Create User Campaign</h2>
      <label>Subject:</label>
      <input type="text" bind:value={campaignSubject} style="width:100%;margin-bottom:1rem;">
      <label>Message:</label>
      <textarea bind:value={campaignBody} style="width:100%;height:120px;margin-bottom:1rem;"></textarea>
      <button onclick={sendCampaign} style="margin-right:1rem;">Send Campaign</button>
      <button onclick={closeCampaignModal} style="background:#eee;">Close</button>
      {#if campaignMessage}
        <div style="margin-top:1rem;color:green;">{campaignMessage}</div>
      {/if}
    </div>
  </div>
{/if}

{#if showTemplatesModal}
  <div class="modal-backdrop" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.3);z-index:1000;display:flex;align-items:center;justify-content:center;">
    <div class="modal-content" style="background:#fff;padding:2rem;border-radius:12px;min-width:350px;max-width:95vw;box-shadow:0 2px 16px rgba(0,0,0,0.15);">
      <h2>Email Templates</h2>
      <ul style="list-style:none;padding:0;">
        <li style="margin-bottom:1rem;">
          <button onclick={() => selectTemplate({subject:'Welcome to Abroaducate!',body:'Thank you for joining. Here are some tips to get started...'})}>Welcome Email</button>
        </li>
        <li style="margin-bottom:1rem;">
          <button onclick={() => selectTemplate({subject:'Platform Update',body:'Check out our latest features and improvements.'})}>Platform Update</button>
        </li>
        <li style="margin-bottom:1rem;">
          <button onclick={() => selectTemplate({subject:'Upgrade Offer',body:'Unlock premium features by upgrading your plan.'})}>Upgrade Offer</button>
        </li>
      </ul>
      <button onclick={closeTemplatesModal} style="background:#eee;">Close</button>
    </div>
  </div>
{/if}

{#if showPromoModal}
  <div class="modal-backdrop" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.3);z-index:1000;display:flex;align-items:center;justify-content:center;">
    <div class="modal-content" style="background:#fff;padding:2rem;border-radius:12px;min-width:350px;max-width:95vw;box-shadow:0 2px 16px rgba(0,0,0,0.15);">
      <h2>Premium Promotion</h2>
      <label>Subject:</label>
      <input type="text" bind:value={promoSubject} style="width:100%;margin-bottom:1rem;">
      <label>Message:</label>
      <textarea bind:value={promoBody} style="width:100%;height:120px;margin-bottom:1rem;"></textarea>
      <button onclick={sendPromo} style="margin-right:1rem;">Send Promotion</button>
      <button onclick={closePromoModal} style="background:#eee;">Close</button>
      {#if promoMessage}
        <div style="margin-top:1rem;color:green;">{promoMessage}</div>
      {/if}
    </div>
  </div>
{/if}

  <!-- User List Management -->
  <div class="users-section">
    <h2>👤 User List & Management</h2>
    
    <!-- Search and Filter -->
    <div class="controls">
      <div class="search-bar">
        <input 
          type="text" 
          placeholder="Search users by email or name..." 
          bind:value={searchTerm}
        />
      </div>
      
      <div class="filter-tabs">
        <button 
          class="filter-tab" 
          class:active={filterType === 'all'} 
          onclick={() => filterType = 'all'}
        >
          All Users ({formatNumber(userStats.total_users)})
        </button>
        <button 
          class="filter-tab" 
          class:active={filterType === 'premium'} 
          onclick={() => filterType = 'premium'}
        >
          Premium ({formatNumber(userStats.premium_users)})
        </button>
        <button 
          class="filter-tab" 
          class:active={filterType === 'free'} 
          onclick={() => filterType = 'free'}
        >
          Academic Starter ({formatNumber(userStats.free_users)})
        </button>
        <button 
          class="filter-tab" 
          class:active={filterType === 'newsletter'} 
          onclick={() => filterType = 'newsletter'}
        >
          Newsletter Subs ({formatNumber(userStats.newsletter_subscribers)})
        </button>
      </div>
    </div>
    
    <!-- Pagination controls above the user table -->
    <div class="pagination-controls" style="margin-bottom: 1rem; display: flex; align-items: center; gap: 1rem;">
      <button onclick={prevPage} disabled={currentPage === 1}>Previous</button>
      <span>Page {currentPage} of {totalPages}</span>
      <button onclick={nextPage} disabled={currentPage === totalPages}>Next</button>
      <span>({totalUsers} users total)</span>
    </div>
    
    <!-- User Table -->
    <div class="user-table-container">
      {#if loading}
        <div class="loading-state">Loading users...</div>
      {:else}
        <table class="user-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Status</th>
              <th>Plan</th>
              <th>Signed Up</th>
              <th>Last Seen</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredUsers as user (user.user_id)}
              <tr>
                <td>
                  <div class="user-info">
                    <span class="font-semibold">{user.full_name || 'N/A'}</span>
                    <span class="text-sm text-gray-600">{user.email}</span>
                  </div>
                </td>
                <td>
                  <span class="status-badge {isNewsletterSubscribed(user) ? 'subscribed' : 'unsubscribed'}">
                    {isNewsletterSubscribed(user) ? 'Subscribed' : 'Not Subscribed'}
                  </span>
                </td>
                <td>
                  <span class="plan-badge {getUserPlanType(user)}">
                    {getUserPlanName(user)}
                  </span>
                </td>
                <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</td>
                <td>{user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}</td>
                <td>
                  <button class="action-btn small" onclick={() => openUserModal(user)}>
                    Manage
                  </button>
                </td>
              </tr>
            {:else}
              <tr>
                <td colspan="6" class="text-center py-8">No users found.</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  </div>

  <!-- Deployment Instructions -->
  <div class="deployment-section">
    <h2>🚀 After Deployment: User Email Management</h2>
    <div class="deployment-info">
      <h4>Registered User Email Strategy:</h4>
      <ul>
        <li><strong>Welcome Series:</strong> Automated onboarding emails for new users</li>
        <li><strong>Feature Updates:</strong> Monthly platform updates and new features</li>
        <li><strong>Personalized Tips:</strong> Study abroad advice based on user's profile</li>
        <li><strong>Premium Promotion:</strong> Targeted upgrade campaigns for Academic Starter users</li>
        <li><strong>Success Stories:</strong> User testimonials and achievements</li>
        <li><strong>Re-engagement:</strong> Win back inactive users</li>
      </ul>
      
      <h4>Difference from Imported Leads (8,300+ emails):</h4>
      <ul>
        <li><strong>Imported Leads:</strong> Focus on trust-building and platform introduction</li>
        <li><strong>Registered Users:</strong> Focus on value delivery and engagement</li>
        <li><strong>Academic Starter:</strong> Encourage premium upgrades</li>
        <li><strong>Academic Professional/Elite:</strong> Retention and advanced features</li>
      </ul>
    </div>
  </div>
</div>

<style>
  .user-management {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 2rem;
    background-color: #f9fafb;
    border-radius: 12px;
    font-family: 'Inter', sans-serif;
  }

  .header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .header h1 {
    font-size: 2.25rem;
    font-weight: 700;
    color: #111827;
  }

  .header p {
    font-size: 1rem;
    color: #6b7280;
    margin-top: 0.5rem;
  }

  .message {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    text-align: center;
  }

  .message.info {
    background-color: #e0f2fe;
    color: #0c4a6e;
  }

  .message.success {
    background-color: #dcfce7;
    color: #166534;
  }

  .message.error {
    background-color: #fee2e2;
    color: #991b1b;
  }

  .stats-section,
  .plans-section,
  .email-section,
  .users-section {
    background-color: #ffffff;
    padding: 1.5rem;
    border-radius: 12px;
    margin-bottom: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 1.5rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  .stat-card {
    background-color: #f9fafb;
    padding: 1.5rem;
    border-radius: 8px;
    text-align: center;
  }

  .stat-card h3 {
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
    text-transform: uppercase;
  }

  .big-number {
    font-size: 2.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0.5rem 0;
  }

  .stat-note {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .campaign-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  .campaign-card {
    background-color: #f9fafb;
    padding: 1.5rem;
    border-radius: 8px;
  }

  .campaign-card h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
  }

  .campaign-card p {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0.5rem 0 1rem;
    min-height: 40px;
  }

  .campaign-actions {
    display: flex;
    gap: 0.5rem;
  }

  .campaign-btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: 1px solid #d1d5db;
    background-color: #ffffff;
    color: #374151;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .campaign-btn.primary {
    background-color: #2563eb;
    color: #ffffff;
    border-color: #2563eb;
  }

  .campaign-btn:hover {
    background-color: #f3f4f6;
  }

  .campaign-btn.primary:hover {
    background-color: #1d4ed8;
  }

  .controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .search-bar {
    flex-grow: 1;
  }

  .search-bar input {
    width: 100%;
    max-width: 400px;
    padding: 0.6rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.875rem;
  }

  .filter-tabs {
    display: flex;
    background-color: #e5e7eb;
    border-radius: 8px;
    padding: 4px;
  }

  .filter-tab {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: none;
    background-color: transparent;
    color: #4b5563;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .filter-tab.active {
    background-color: #ffffff;
    color: #111827;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .user-table-container {
    overflow-x: auto;
    background-color: #fff;
    border-radius: 8px;
  }

  .user-table {
    width: 100%;
    border-collapse: collapse;
  }

  .user-table th, .user-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
    white-space: nowrap;
  }

  .user-table th {
    font-size: 0.75rem;
    text-transform: uppercase;
    color: #6b7280;
    font-weight: 600;
  }

  .user-info .font-semibold {
    display: block;
  }

  .status-badge, .plan-badge {
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
  }

  .status-badge.subscribed {
    background-color: #dcfce7;
    color: #166534;
  }

  .status-badge.unsubscribed {
    background-color: #fee2e2;
    color: #991b1b;
  }

  .plan-badge.premium {
    background-color: #dbeafe;
    color: #1e40af;
  }

  .plan-badge.free {
    background-color: #e5e7eb;
    color: #4b5563;
  }

  .action-btn.small {
    font-size: 0.875rem;
    padding: 0.3rem 0.8rem;
  }
</style> 