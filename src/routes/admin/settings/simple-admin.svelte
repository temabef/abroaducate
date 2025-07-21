<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabaseClient';
  
  interface AdminUser {
    user_id: string;
    email: string;
    role: string;
    created_at: string;
  }

  let adminUsers: AdminUser[] = [];
  let loading = true;
  let error: string | null = null;
  
  let newAdminEmail = '';
  let newAdminRole = 'admin';
  let addingAdmin = false;
  let addMessage = '';
  let addSuccess = false;
  
  // Role options
  const roleOptions = [
    { value: 'admin', label: 'Standard Admin' },
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'content_admin', label: 'Content Admin' },
    { value: 'scholarship_admin', label: 'Scholarship Admin' }
  ];
  
  // Load admin users directly using simple queries
  async function loadAdminUsers() {
    loading = true;
    error = null;
    
    try {
      // Use the get_admin_users function instead of direct table access
      const { data: admins, error: adminsError } = await supabase.rpc('get_admin_users');
      
      if (adminsError) {
        error = `Error fetching admin users: ${adminsError.message}`;
        return;
      }
      
      // Convert to the expected format
      adminUsers = (admins || []).map((admin: any) => ({
        user_id: admin.user_id,
        email: admin.email_cache || 'Unknown',
        role: admin.role,
        created_at: admin.created_at
      }));
      
      console.log('Admin users loaded:', adminUsers);
    } catch (e: any) {
      error = `Exception: ${e instanceof Error ? e.message : 'Unknown error'}`;
      console.error('Exception loading admin users:', e);
    } finally {
      loading = false;
    }
  }
  
  // Add a new admin using direct queries
  async function handleAddAdmin() {
    if (!newAdminEmail) return;
    
    addingAdmin = true;
    addMessage = '';
    addSuccess = false;
    
    try {
      // Get the user ID from email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', newAdminEmail)
        .single();
      
      if (userError) {
        addMessage = `Error finding user: ${userError.message}`;
        return;
      }
      
      if (!userData) {
        addMessage = `User with email ${newAdminEmail} not found`;
        return;
      }
      
      // Check if this is a protected email
      const protectedEmails = ['admin@abroaducate.com', 'solakolawole62@gmail.com'];
      const isProtected = protectedEmails.includes(newAdminEmail);
      
      // Use the add_admin_user function instead of direct table access
      const { data: result, error: adminError } = await supabase.rpc('add_admin_user', {
        admin_email: newAdminEmail,
        admin_role: isProtected ? 'super-admin' : newAdminRole
      });
      
      if (adminError) {
        addMessage = `Error adding admin: ${adminError.message}`;
        return;
      }
      
      addSuccess = true;
      addMessage = `User ${newAdminEmail} added as ${isProtected ? 'super_admin' : newAdminRole}`;
      newAdminEmail = '';
      await loadAdminUsers();
    } catch (e: any) {
      addSuccess = false;
      addMessage = `Exception: ${e instanceof Error ? e.message : 'Unknown error'}`;
      console.error('Exception adding admin:', e);
    } finally {
      addingAdmin = false;
    }
  }
  
  // Remove an admin directly
  async function handleRemoveAdmin(email: string, userId: string, role: string) {
    if (!confirm(`Are you sure you want to remove admin privileges from ${email || userId}?`)) {
      return;
    }
    if (role === 'super_admin' || role === 'super-admin') {
      alert('Cannot remove super admin users');
      return;
    }
    try {
      // Use the remove_admin_user function instead of direct table access
      const { data: result, error: deleteError } = await supabase.rpc('remove_admin_user', {
        admin_email: email
      });
      if (deleteError) {
        alert(`Error: ${deleteError.message}`);
        return;
      }
      await loadAdminUsers();
    } catch (e: any) {
      alert(`Exception: ${e instanceof Error ? e.message : 'Unknown error'}`);
      console.error('Exception removing admin:', e);
    }
  }

  // Update an admin's role
  async function handleUpdateRole(email: string, userId: string, role: string) {
    if (role === 'super_admin' || role === 'super-admin') {
      alert('Cannot change role of super admin users');
      return;
    }
    // Show a dialog to select the new role
    const newRole = prompt(`Select new role for ${email || userId}:
Available roles:
- super_admin
- admin
- content_admin
- scholarship_admin`);
    if (!newRole) return;
    
    try {
      // Use the add_admin_user function to update role (it handles upserts)
      const { data: result, error: updateError } = await supabase.rpc('add_admin_user', {
        admin_email: email,
        admin_role: newRole
      });
      
      if (updateError) {
        alert(`Error: ${updateError.message}`);
        return;
      }
      
      alert(`Successfully updated ${email || userId} to role: ${newRole}`);
      await loadAdminUsers();
    } catch (e: any) {
      alert(`Exception: ${e instanceof Error ? e.message : 'Unknown error'}`);
      console.error('Exception updating admin role:', e);
    }
  }
  
  onMount(loadAdminUsers);
</script>

<svelte:head>
  <title>Admin Settings - Abroaducate</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">Admin Settings (Simple Version)</h1>
    <p class="text-gray-600">Manage admin users and system settings</p>
  </div>
  
  <!-- Admin User Management -->
  <div class="bg-white rounded-lg shadow overflow-hidden mb-8">
    <div class="px-6 py-5 border-b border-gray-200">
      <h2 class="text-xl font-semibold text-gray-900">Admin User Management</h2>
      <p class="mt-1 text-sm text-gray-500">
        Add or remove users with administrative privileges
      </p>
    </div>
    
    <!-- Add Admin Form -->
    <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
      <h3 class="text-md font-medium text-gray-900 mb-3">Add New Admin</h3>
      
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-grow">
          <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
          <input
            type="email"
            id="email"
            bind:value={newAdminEmail}
            placeholder="user@example.com"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
          />
        </div>
        
        <div class="w-full sm:w-48">
          <label for="role" class="block text-sm font-medium text-gray-700">Admin Role</label>
          <select
            id="role"
            bind:value={newAdminRole}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
          >
            {#each roleOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>
        
        <div class="flex items-end">
          <button
            type="button"
            onclick={handleAddAdmin}
            disabled={!newAdminEmail || addingAdmin}
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
          >
            {addingAdmin ? 'Adding...' : 'Add Admin'}
          </button>
        </div>
      </div>
      
      {#if addMessage}
        <div class="mt-3 p-3 rounded-md {addSuccess ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}">
          {addMessage}
        </div>
      {/if}
    </div>
    
    <!-- Admin Users List -->
    <div class="px-6 py-5">
      <h3 class="text-md font-medium text-gray-900 mb-3">Current Admin Users</h3>
      
      {#if loading}
        <div class="py-4 text-center text-gray-500">
          Loading admin users...
        </div>
      {:else if error}
        <div class="py-4 text-center text-red-500">
          Error: {error}
        </div>
      {:else if adminUsers.length === 0}
        <div class="py-4 text-center text-gray-500">
          No admin users found.
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Added On
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each adminUsers as admin}
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {admin.email || 'Unknown'}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div class="flex items-center space-x-2">
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        {admin.role === 'super_admin' ? 'bg-purple-100 text-purple-800' : 
                        admin.role === 'admin' ? 'bg-blue-100 text-blue-800' : 
                        'bg-green-100 text-green-800'}">
                        {admin.role}
                      </span>
                      <button
                        onclick={() => handleUpdateRole(admin.email, admin.user_id, admin.role)}
                        class="text-blue-600 hover:text-blue-900 text-xs"
                        disabled={admin.role === 'super_admin' || admin.role === 'super-admin'}
                      >
                        Change
                      </button>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(admin.created_at).toLocaleDateString()}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onclick={() => handleRemoveAdmin(admin.email, admin.user_id, admin.role)}
                      class="text-red-600 hover:text-red-900"
                      title="Remove admin"
                      disabled={admin.role === 'super_admin' || admin.role === 'super-admin'}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
  
  <div class="mt-4">
    <a href="/admin" class="text-blue-500 hover:underline">← Back to Admin Dashboard</a>
  </div>
</div> 