<script lang="ts">
  import { onMount } from 'svelte';
  
  let { data } = $props();
  let { supabase, session } = $derived(data);
  
  // Admin stats
  let stats = $state({
    totalUsers: 0,
    totalScholarships: 0,
    totalApplications: 0,
    totalAdmins: 0
  });
  
  // Admin permissions
  let permissions = $state({
    canManageScholarships: false,
    canManageAdmins: false,
    canAccessAnalytics: false,
    canManageContent: false
  });
  
  let adminRole = $state<string | null>(null);
  let isLoading = $state(true);
  
  onMount(async () => {
    try {
      // Get current user's role using the new function
      const { data: roleData, error: roleError } = await supabase.rpc('get_current_user_admin_role');
      
      if (!roleError && roleData) {
        adminRole = roleData;
      }
      
      // Check all permissions
      const [
        { data: canManage, error: scholarshipError },
        { data: canManageAdmins, error: adminError },
        { data: canAccessAnalytics, error: analyticsError },
        { data: canManageContent, error: contentError }
              ] = await Promise.all([
          supabase.rpc('can_manage_scholarships'),
          supabase.rpc('can_manage_admins_nuclear'),
          supabase.rpc('can_access_analytics'),
          supabase.rpc('can_manage_content')
        ]);
      
      permissions = {
        canManageScholarships: !!canManage,
        canManageAdmins: !!canManageAdmins,
        canAccessAnalytics: !!canAccessAnalytics,
        canManageContent: !!canManageContent
      };
      
      // Load stats
      await loadStats();
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      isLoading = false;
    }
  });
  
  async function loadStats() {
    try {
      // Get accurate total users count from auth.users table
      const { data: totalUsersData, error: usersError } = await supabase.rpc('get_total_users_count');
      
      if (!usersError && totalUsersData !== null) {
        stats.totalUsers = totalUsersData;
      } else {
        // Fallback to profiles table if function fails
        const { count: profilesCount, error: profilesError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        stats.totalUsers = profilesCount || 1;
      }
      
      // Get total scholarships count
      const { count: scholarshipsCount, error: scholarshipsError } = await supabase
        .from('scholarships')
        .select('*', { count: 'exact', head: true });
      
      if (!scholarshipsError) {
        stats.totalScholarships = scholarshipsCount || 0;
      }
      
      // Get total applications count if the table exists
      try {
        const { count: applicationsCount, error: applicationsError } = await supabase
          .from('scholarship_applications')
          .select('*', { count: 'exact', head: true });
        
        if (!applicationsError) {
          stats.totalApplications = applicationsCount || 0;
        }
      } catch (e) {
        console.log('Scholarship applications table may not exist:', e);
      }
      
      // Get total admins count using the nuclear function
      try {
        const { data: adminUsers, error: adminError } = await supabase.rpc('get_admin_users_nuclear');
        if (!adminError && adminUsers) {
          stats.totalAdmins = adminUsers.length;
        } else {
          // Direct table access as fallback
          const { count: adminsCount, error: directError } = await supabase
            .from('admin_users')
            .select('*', { count: 'exact', head: true });
          
          if (!directError) {
            stats.totalAdmins = adminsCount || 0;
          }
        }
      } catch (e) {
        console.log('Admin count error:', e);
        stats.totalAdmins = 3; // Known count as fallback
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }
</script>

<svelte:head>
  <title>Admin Dashboard - Abroaducate</title>
</svelte:head>

<div class="space-y-6">
  <!-- Welcome Section -->
  <div class="bg-white rounded-lg shadow-sm p-6">
    <h1 class="text-2xl font-bold text-gray-900 mb-2">Welcome to the Admin Dashboard</h1>
    <p class="text-gray-600">
      You are logged in as <span class="font-semibold">{session?.user?.email}</span>
      {#if adminRole}
        with role: <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
          {adminRole === 'super-admin' ? 'bg-purple-100 text-purple-800' : 
          adminRole === 'admin' ? 'bg-blue-100 text-blue-800' : 
          'bg-green-100 text-green-800'}">
          {adminRole}
        </span>
      {/if}
    </p>
  </div>
  
  <!-- Stats Overview -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0 bg-yellow-100 rounded-md p-3">
          <svg class="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dt class="text-sm font-medium text-gray-500 truncate">Total Users</dt>
          <dd class="flex items-baseline">
            <div class="text-2xl font-semibold text-gray-900">
              {isLoading ? '...' : stats.totalUsers}
            </div>
          </dd>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0 bg-blue-100 rounded-md p-3">
          <svg class="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dt class="text-sm font-medium text-gray-500 truncate">Total Scholarships</dt>
          <dd class="flex items-baseline">
            <div class="text-2xl font-semibold text-gray-900">
              {isLoading ? '...' : stats.totalScholarships}
            </div>
          </dd>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0 bg-green-100 rounded-md p-3">
          <svg class="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dt class="text-sm font-medium text-gray-500 truncate">Applications</dt>
          <dd class="flex items-baseline">
            <div class="text-2xl font-semibold text-gray-900">
              {isLoading ? '...' : stats.totalApplications}
            </div>
          </dd>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0 bg-purple-100 rounded-md p-3">
          <svg class="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dt class="text-sm font-medium text-gray-500 truncate">Admin Users</dt>
          <dd class="flex items-baseline">
            <div class="text-2xl font-semibold text-gray-900">
              {isLoading ? '...' : stats.totalAdmins}
            </div>
          </dd>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Admin Role Information -->
  <div class="bg-white rounded-lg shadow-sm p-6">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Admin Role Information</h2>
    <div class="space-y-4">
      <div class="bg-purple-50 p-4 rounded-lg">
        <h3 class="font-medium text-purple-800 mb-2">Super-Admin</h3>
        <ul class="list-disc pl-5 text-sm text-purple-700 space-y-1">
          <li>Full access to all admin features</li>
          <li>Can add/remove other admins</li>
          <li>Can manage system settings</li>
          <li>Can manage scholarships and content</li>
          <li>Can view analytics</li>
        </ul>
      </div>
      
      <div class="bg-blue-50 p-4 rounded-lg">
        <h3 class="font-medium text-blue-800 mb-2">Admin</h3>
        <ul class="list-disc pl-5 text-sm text-blue-700 space-y-1">
          <li>Can manage scholarships and content</li>
          <li>Can view analytics</li>
          <li>Cannot manage other admins</li>
        </ul>
      </div>
      
      <div class="bg-green-50 p-4 rounded-lg">
        <h3 class="font-medium text-green-800 mb-2">Scholarship-Admin</h3>
        <ul class="list-disc pl-5 text-sm text-green-700 space-y-1">
          <li>Limited access to scholarship management only</li>
          <li>Cannot access other admin features</li>
        </ul>
      </div>
    </div>
  </div>
  
  <!-- Quick Actions -->
  <div class="bg-white rounded-lg shadow-sm p-6">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#if permissions.canManageScholarships}
        <a href="/admin/scholarships" class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 flex items-center">
          <div class="flex-shrink-0 bg-blue-100 rounded-full p-2 mr-3">
            <svg class="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-900">Manage Scholarships</h3>
            <p class="text-xs text-gray-500 mt-1">Add, edit, or remove scholarship listings</p>
          </div>
        </a>
      {/if}
      
      {#if permissions.canManageAdmins}
        <a href="/admin/settings" class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 flex items-center">
          <div class="flex-shrink-0 bg-purple-100 rounded-full p-2 mr-3">
            <svg class="h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-900">Manage Admin Users</h3>
            <p class="text-xs text-gray-500 mt-1">Add or remove admin users</p>
          </div>
        </a>
      {/if}
      
      {#if permissions.canAccessAnalytics}
        <a href="/analytics" class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 flex items-center">
          <div class="flex-shrink-0 bg-green-100 rounded-full p-2 mr-3">
            <svg class="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-900">View Analytics</h3>
            <p class="text-xs text-gray-500 mt-1">See usage statistics and reports</p>
          </div>
        </a>
      {/if}
      
      {#if permissions.canManageAdmins}
        <a href="/admin-debug/auth-check" class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 flex items-center">
          <div class="flex-shrink-0 bg-yellow-100 rounded-full p-2 mr-3">
            <svg class="h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-900">Auth Debug</h3>
            <p class="text-xs text-gray-500 mt-1">Troubleshoot admin permissions</p>
          </div>
        </a>
      {/if}
    </div>
  </div>
  
  <!-- Your Permissions -->
  <div class="bg-white rounded-lg shadow-sm p-6">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Your Permissions</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="flex items-center">
        <div class="mr-3 flex-shrink-0">
          {#if permissions.canManageScholarships}
            <svg class="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          {:else}
            <svg class="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          {/if}
        </div>
        <div>
          <p class="text-sm font-medium text-gray-900">Manage Scholarships</p>
          <p class="text-xs text-gray-500">Add, edit, or remove scholarship listings</p>
        </div>
      </div>
      
      <div class="flex items-center">
        <div class="mr-3 flex-shrink-0">
          {#if permissions.canManageAdmins}
            <svg class="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          {:else}
            <svg class="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          {/if}
        </div>
        <div>
          <p class="text-sm font-medium text-gray-900">Manage Admin Users</p>
          <p class="text-xs text-gray-500">Add or remove admin users</p>
        </div>
      </div>
      
      <div class="flex items-center">
        <div class="mr-3 flex-shrink-0">
          {#if permissions.canAccessAnalytics}
            <svg class="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          {:else}
            <svg class="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          {/if}
        </div>
        <div>
          <p class="text-sm font-medium text-gray-900">View Analytics</p>
          <p class="text-xs text-gray-500">See usage statistics and reports</p>
        </div>
      </div>
      
      <div class="flex items-center">
        <div class="mr-3 flex-shrink-0">
          {#if permissions.canManageContent}
            <svg class="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          {:else}
            <svg class="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          {/if}
        </div>
        <div>
          <p class="text-sm font-medium text-gray-900">Manage Content</p>
          <p class="text-xs text-gray-500">Edit website content and university data</p>
        </div>
      </div>
    </div>
  </div>
</div>
