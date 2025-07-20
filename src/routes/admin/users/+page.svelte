<!-- Simple User Management Page -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import type { User } from '$lib/types';

  // State management
  let users: User[] = $state([]);
  let loading = $state(true);
  let searchTerm = $state('');
  let currentPage = $state(1);
  let itemsPerPage = $state(10);
  let filteredUsers = $state<User[]>([]);

  // Analytics data
  let totalUsers = $state(0);
  let activeUsers = $state(0);
  let recentSignups = $state(0);
  let premiumUsers = $state(0);

  // Pagination
  $effect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    filteredUsers = users
      .filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .slice(startIndex, endIndex);
  });

  const totalPages = $derived(Math.ceil(users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  ).length / itemsPerPage));

  // Load users
  async function loadUsers() {
    loading = true;
    try {
      // Try API endpoint first
      const response = await fetch('/api/admin/get-users');
      if (response.ok) {
        const data = await response.json();
        users = data.users || [];
        totalUsers = users.length;
      } else {
        // Fallback to direct Supabase query
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        users = data || [];
        totalUsers = users.length;
      }

      // Calculate analytics
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      activeUsers = users.filter(user => {
        const lastActive = new Date(user.updated_at);
        return lastActive >= thirtyDaysAgo;
      }).length;

      recentSignups = users.filter(user => {
        const signupDate = new Date(user.created_at);
        return signupDate >= thirtyDaysAgo;
      }).length;

      premiumUsers = users.filter(user => 
        user.subscription_plan === 'professional' || user.subscription_plan === 'elite'
      ).length;

    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      loading = false;
    }
  }

  // Format date
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  // Get user initials
  function getUserInitials(user: User): string {
    if (user.full_name) {
      return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user.email.split('@')[0].slice(0, 2).toUpperCase();
  }

  // Get user display name
  function getUserDisplayName(user: User): string {
    return user.full_name || user.email.split('@')[0];
  }

  onMount(() => {
    loadUsers();
  });
</script>

<svelte:head>
  <title>User Management - Admin Dashboard</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">👥 User Management</h1>
    <p class="text-gray-600">Simple user overview and management</p>
  </div>

  <!-- Analytics Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex items-center">
        <div class="p-3 rounded-full bg-blue-100 text-blue-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
          </svg>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">Total Users</p>
          <p class="text-2xl font-semibold text-gray-900">{totalUsers}</p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex items-center">
        <div class="p-3 rounded-full bg-green-100 text-green-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">Active Users</p>
          <p class="text-2xl font-semibold text-gray-900">{activeUsers}</p>
          <p class="text-xs text-gray-500">Last 30 days</p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex items-center">
        <div class="p-3 rounded-full bg-purple-100 text-purple-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
          </svg>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">Recent Signups</p>
          <p class="text-2xl font-semibold text-gray-900">{recentSignups}</p>
          <p class="text-xs text-gray-500">Last 30 days</p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex items-center">
        <div class="p-3 rounded-full bg-yellow-100 text-yellow-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
          </svg>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">Premium Users</p>
          <p class="text-2xl font-semibold text-gray-900">{premiumUsers}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Search and Controls -->
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
    <div class="flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div class="flex-1 max-w-md">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input
            type="text"
            bind:value={searchTerm}
            placeholder="Search users by email or name..."
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <button
        onclick={loadUsers}
        disabled={loading}
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        {loading ? 'Loading...' : '🔄 Refresh'}
      </button>
    </div>
  </div>

  <!-- User List -->
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-200">
      <h3 class="text-lg font-medium text-gray-900">
        👤 User List ({users.filter(user => 
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
        ).length} users)
      </h3>
    </div>

    {#if loading}
      <div class="p-8 text-center">
        <div class="inline-flex items-center">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading users...
        </div>
      </div>
    {:else if filteredUsers.length === 0}
      <div class="p-8 text-center text-gray-500">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No users found</h3>
        <p class="mt-1 text-sm text-gray-500">
          {searchTerm ? 'Try adjusting your search terms.' : 'No users have registered yet.'}
        </p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each filteredUsers as user}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                        {getUserInitials(user)}
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{getUserDisplayName(user)}</div>
                      <div class="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {user.subscription_plan || 'free'}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(user.created_at)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(user.updated_at)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              onclick={() => currentPage = Math.max(1, currentPage - 1)}
              disabled={currentPage === 1}
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onclick={() => currentPage = Math.min(totalPages, currentPage + 1)}
              disabled={currentPage === totalPages}
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Showing <span class="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span class="font-medium">{Math.min(currentPage * itemsPerPage, users.filter(user => 
                  user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
                ).length)}</span> of <span class="font-medium">{users.filter(user => 
                  user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
                ).length}</span> results
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onclick={() => currentPage = Math.max(1, currentPage - 1)}
                  disabled={currentPage === 1}
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span class="sr-only">Previous</span>
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
                
                {#each Array.from({length: totalPages}, (_, i) => i + 1) as page}
                  <button
                    onclick={() => currentPage = page}
                    class="relative inline-flex items-center px-4 py-2 border text-sm font-medium {page === currentPage ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}"
                  >
                    {page}
                  </button>
                {/each}
                
                <button
                  onclick={() => currentPage = Math.min(totalPages, currentPage + 1)}
                  disabled={currentPage === totalPages}
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span class="sr-only">Next</span>
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      {/if}
    {/if}
  </div>

  <!-- Help Section -->
  <div class="mt-8 bg-blue-50 rounded-lg p-6">
    <div class="flex">
      <div class="flex-shrink-0">
        <svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <div class="ml-3">
        <h3 class="text-sm font-medium text-blue-800">📋 About This Page</h3>
        <div class="mt-2 text-sm text-blue-700">
          <p><strong>Total Users:</strong> All registered users from the system</p>
          <p><strong>Active Users:</strong> Users who have been active in the last 30 days</p>
          <p><strong>Recent Signups:</strong> Users who registered in the last 30 days</p>
          <p><strong>Premium Users:</strong> Users with Professional or Elite subscriptions</p>
        </div>
        <div class="mt-3 text-sm text-blue-700">
          <p><strong>🔧 What You Can Do</strong></p>
          <p>• View Users: See all registered users with their details</p>
          <p>• Search: Find specific users by email or name</p>
          <p>• Monitor Growth: Track user registration and activity</p>
          <p>• Refresh Data: Get the latest user information</p>
        </div>
      </div>
    </div>
  </div>
</div> 