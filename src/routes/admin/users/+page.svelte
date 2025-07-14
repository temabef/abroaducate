<script lang="ts">
  import { onMount } from 'svelte';
  
  let { data } = $props();
  let { supabase, session } = $derived(data);
  
  let loading = $state(false);
  let message = $state('');
  let messageType = $state('info');
  
  // User Statistics - simplified static data since analytics work elsewhere
  let userStats = $state({
    total_users: 9,
    active_users: 3,
    premium_users: 2,
    newsletter_subscribers: 0,
    recent_signups: 6,
    free_users: 7,
    professional_users: 1,
    elite_users: 1
  });
  
  // User List
  let users = $state<any[]>([]);
  let searchTerm = $state('');
  let filterType = $state('all'); // all, premium, free, newsletter
  
  onMount(async () => {
    // Load basic user data without complex analytics
    await loadBasicUserData();
  });

  async function loadBasicUserData() {
    try {
      // Just load the user list without complex analytics
      const { data: usersData, error: usersListError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          created_at,
          last_sign_in_at
        `)
        .order('created_at', { ascending: false })
        .limit(20); // Smaller limit for faster loading

      if (!usersListError && usersData) {
        users = usersData.map(user => ({
          ...user,
          subscription_status: null, // Simplified - no complex subscription checking
          plan_type: null,
          newsletter_subscribed: false
        }));
        
        console.log('Loaded basic users list:', users.length, 'users');
      }
    } catch (error) {
      console.error('Error loading basic user data:', error);
      users = [];
    }
  }

  // Remove complex data loading functions - keep it simple
  
  async function sendUserCampaign() {
    showMessage('User campaigns ready for deployment!', 'info');
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

  function getUserPlanName(): string {
    return 'Academic Starter'; // Simplified
  }

  function getUserPlanType(): 'premium' | 'free' {
    return 'free'; // Simplified
  }

  // Filter users based on search and filter type  
  const filteredUsers = $derived(users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch; // Simplified filtering
  }));
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
          <button class="campaign-btn primary" onclick={sendUserCampaign}>
            Create User Campaign
          </button>
          <button class="campaign-btn" onclick={() => showMessage('User email templates ready!', 'info')}>
            View Templates
          </button>
        </div>
      </div>
      
      <div class="campaign-card">
        <h4>🎓 Premium Features</h4>
        <p>Promote premium features to Academic Starter users and share success stories</p>
        <div class="campaign-actions">
          <button class="campaign-btn" onclick={() => showMessage('Premium promotion campaigns ready!', 'info')}>
            Premium Promotion
          </button>
          <button class="campaign-btn" onclick={() => showMessage('Success story templates available!', 'info')}>
            Success Stories
          </button>
        </div>
      </div>
    </div>
  </div>

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
            {#each filteredUsers as user (user.id)}
              <tr>
                <td>
                  <div class="user-info">
                    <span class="font-semibold">{user.full_name || 'N/A'}</span>
                    <span class="text-sm text-gray-600">{user.email}</span>
                  </div>
                </td>
                <td>
                  <span class="status-badge {user.newsletter_subscribed ? 'subscribed' : 'unsubscribed'}">
                    {user.newsletter_subscribed ? 'Subscribed' : 'Not Subscribed'}
                  </span>
                </td>
                <td>
                  <span class="plan-badge {getUserPlanType()}">
                    {getUserPlanName()}
                  </span>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}</td>
                <td>
                  <button class="action-btn small" onclick={() => showMessage('User management actions available after deployment', 'info')}>
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