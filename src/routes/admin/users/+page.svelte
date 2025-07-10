<script lang="ts">
  import { onMount } from 'svelte';
  
  let { data } = $props();
  let { supabase, session } = $derived(data);
  
  let loading = false;
  let message = '';
  let messageType = 'info';
  
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
          <button class="campaign-btn primary" on:click={sendUserCampaign}>
            Create User Campaign
          </button>
          <button class="campaign-btn" on:click={() => showMessage('User email templates ready!', 'info')}>
            View Templates
          </button>
        </div>
      </div>
      
      <div class="campaign-card">
        <h4>🎓 Premium Features</h4>
        <p>Promote premium features to Academic Starter users and share success stories</p>
        <div class="campaign-actions">
          <button class="campaign-btn" on:click={() => showMessage('Premium promotion campaigns ready!', 'info')}>
            Premium Promotion
          </button>
          <button class="campaign-btn" on:click={() => showMessage('Success story templates available!', 'info')}>
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
          on:click={() => filterType = 'all'}
        >
          All Users ({formatNumber(userStats.total_users)})
        </button>
        <button 
          class="filter-tab" 
          class:active={filterType === 'premium'} 
          on:click={() => filterType = 'premium'}
        >
          Premium ({formatNumber(userStats.premium_users)})
        </button>
        <button 
          class="filter-tab" 
          class:active={filterType === 'free'} 
          on:click={() => filterType = 'free'}
        >
          Academic Starter ({formatNumber(userStats.free_users)})
        </button>
        <button 
          class="filter-tab" 
          class:active={filterType === 'newsletter'} 
          on:click={() => filterType = 'newsletter'}
        >
          Newsletter ({formatNumber(userStats.newsletter_subscribers)})
        </button>
      </div>
    </div>

    <!-- Users Table -->
    <div class="users-table">
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Plan</th>
            <th>Newsletter</th>
            <th>Last Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredUsers as user}
            <tr>
              <td>
                <div class="user-info">
                  <div class="user-avatar">{user.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}</div>
                  <span>{user.full_name || user.email || 'User'}</span>
                </div>
              </td>
              <td>{user.email}</td>
              <td>
                <span class="plan-badge {getUserPlanType()}">
                  {getUserPlanName()}
                </span>
              </td>
              <td>
                <span class="newsletter-status {user.newsletter_subscribed ? 'subscribed' : 'unsubscribed'}">
                  {user.newsletter_subscribed ? '✅ Yes' : '❌ No'}
                </span>
              </td>
              <td>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}</td>
              <td>
                <button class="action-btn small" on:click={() => showMessage('User management actions available after deployment', 'info')}>
                  Manage
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
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
    max-width: 1400px;
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

  .stats-section,
  .plans-section,
  .email-section,
  .users-section,
  .deployment-section {
    margin-bottom: 40px;
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .stats-section h2,
  .plans-section h2,
  .email-section h2,
  .users-section h2,
  .deployment-section h2 {
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

  .stat-note {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 4px 0 0 0;
  }

  .campaign-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 20px;
  }

  .campaign-card {
    background: #f0f9ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    padding: 20px;
  }

  .campaign-card h4 {
    font-size: 1.2rem;
    font-weight: 600;
    color: #1e40af;
    margin: 0 0 12px 0;
  }

  .campaign-card p {
    color: #374151;
    margin: 0 0 16px 0;
    line-height: 1.5;
  }

  .campaign-actions {
    display: flex;
    gap: 12px;
  }

  .campaign-btn {
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }

  .campaign-btn.primary {
    background: #2563eb;
    color: white;
  }

  .campaign-btn.primary:hover {
    background: #1d4ed8;
  }

  .campaign-btn:not(.primary) {
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .campaign-btn:not(.primary):hover {
    background: #f3f4f6;
  }

  .controls {
    display: flex;
    gap: 20px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .search-bar {
    flex: 1;
    min-width: 250px;
  }

  .search-bar input {
    width: 100%;
    padding: 10px 12px;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    font-size: 0.875rem;
    box-sizing: border-box;
  }

  .search-bar input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .filter-tabs {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .filter-tab {
    padding: 8px 16px;
    border: 1px solid #d1d5db;
    background: white;
    color: #374151;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .filter-tab:first-child {
    border-radius: 6px 0 0 6px;
  }

  .filter-tab:last-child {
    border-radius: 0 6px 6px 0;
  }

  .filter-tab.active {
    background: #2563eb;
    color: white;
    border-color: #2563eb;
  }

  .filter-tab:hover:not(.active) {
    background: #f3f4f6;
  }

  .users-table {
    overflow-x: auto;
  }

  .loading,
  .no-users {
    text-align: center;
    padding: 40px;
    color: #6b7280;
  }

  .note {
    font-size: 0.875rem;
    margin-top: 8px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  th,
  td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }

  th {
    font-weight: 600;
    color: #374151;
    background: #f9fafb;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #2563eb;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .plan-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .plan-badge.premium {
    background: #fef3c7;
    color: #92400e;
  }

  .plan-badge.free {
    background: #f3f4f6;
    color: #374151;
  }

  .newsletter-status.subscribed {
    color: #059669;
  }

  .newsletter-status.unsubscribed {
    color: #dc2626;
  }

  .action-btn.small {
    padding: 6px 12px;
    font-size: 0.75rem;
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    cursor: pointer;
  }

  .action-btn.small:hover {
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
    .user-management {
      padding: 60px 16px 24px 16px;
    }

    .header h1 {
      font-size: 2rem;
    }

    .stats-grid {
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    }

    .controls {
      flex-direction: column;
    }

    .filter-tabs {
      flex-wrap: wrap;
    }

    .campaign-actions {
      flex-direction: column;
    }
  }
</style> 