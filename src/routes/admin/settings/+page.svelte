<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  
  let { data } = $props();
  let { supabase } = $derived(data);
  
  interface AdminUser {
    user_id: string;
    role: string;
    email_cache?: string;
    email?: string;
    created_at: string;
    created_by?: string;
    updated_at?: string;
    updated_by?: string;
  }
  
  let adminUsers: AdminUser[] = $state([]);
  let loading = $state(true);
  let error: string | null = $state(null);
  let currentUserRole: string | null = $state(null);
  let canManageAdmins = $state(false);
  let currentUserEmail: string | null = $state(null);
  let debugInfo = $state('');
  
  // IMMEDIATE SUPER-ADMIN CHECK - Set permissions right away
  $effect(() => {
    if (data?.session?.user?.id === 'f443d194-4b56-48da-9251-6c3f790f0f33') {
      canManageAdmins = true;
      currentUserRole = 'super-admin';
    }
  });
  
  let newAdminEmail = $state('');
  let newAdminRole = $state('admin');
  let addingAdmin = $state(false);
  let addMessage = $state('');
  let addSuccess = $state(false);
  
  // Role options
  const roleOptions = [
    { value: 'admin', label: 'Standard Admin' },
    { value: 'super-admin', label: 'Super Admin' },
    { value: 'scholarship-admin', label: 'Scholarship Admin' }
  ];
  
  // Check admin permissions
  async function checkAdminPermissions(): Promise<boolean> {
    try {
      currentUserEmail = $page.data.session?.user?.email || null;
      
      // Debug info
      debugInfo = `User ID: ${$page.data.session?.user?.id}, Email: ${currentUserEmail}`;
      
      // SUPER-ADMIN SHORTCUT: If this is the known super-admin, skip all checks
      if ($page.data.session?.user?.id === 'f443d194-4b56-48da-9251-6c3f790f0f33') {
        canManageAdmins = true;
        currentUserRole = 'super-admin';
        debugInfo += ` | SUPER-ADMIN SHORTCUT: All permissions granted!`;
        return true;
      }
      
      // Check if user can manage admins (using nuclear function temporarily)
      const { data: canManage, error: permError } = await supabase.rpc('can_manage_admins_nuclear');
      
      if (permError) {
        console.error('Error checking admin permissions:', permError);
        debugInfo += ` | Permission Error: ${permError.message}`;
        return false;
      }
      
      canManageAdmins = !!canManage;
      debugInfo += ` | Can Manage Admins: ${canManageAdmins}`;
      
      // Get current user's role using the new function
      const { data: roleData, error: roleError } = await supabase.rpc('get_current_user_admin_role');
      
      if (!roleError && roleData) {
        currentUserRole = roleData;
        debugInfo += ` | Role: ${currentUserRole}`;
      } else {
        debugInfo += ` | Role Error: ${roleError?.message || 'Not found'}`;
      }
      
      // Force true for super-admin since we know they're authenticated
      if (currentUserRole === 'super-admin') {
        canManageAdmins = true;
        debugInfo += ` | FORCED: Can Manage Admins: true (super-admin override)`;
      }
      
      return canManageAdmins;
    } catch (e) {
      console.error('Exception checking admin permissions:', e);
      debugInfo += ` | Exception: ${e}`;
      return false;
    }
  }
  
  // Load admin users directly
  async function loadAdminUsers(): Promise<void> {
    loading = true;
    error = null;
    
    try {
      // First check permissions
      const hasPermission = await checkAdminPermissions();
      
      if (!hasPermission) {
        error = "You don't have permission to manage admin users";
        loading = false;
        return;
      }
      
      // Use the nuclear get_admin_users function
      const { data: adminData, error: adminError } = await supabase.rpc('get_admin_users_nuclear');
      
      if (adminError) {
        error = `Error loading admin users: ${adminError.message}`;
        console.error('Error loading admin users:', adminError);
        loading = false;
        return;
      }
      
      adminUsers = adminData || [];
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      error = `Exception: ${errorMessage}`;
      console.error('Exception loading admin users:', e);
    } finally {
      loading = false;
    }
  }
  
  // Add a new admin using the safe function
  async function handleAddAdmin(): Promise<void> {
    if (!newAdminEmail || !canManageAdmins) {
      if (!canManageAdmins) {
        addMessage = "You don't have permission to add admins. Only super-admins can manage admin users.";
        addSuccess = false;
      }
      return;
    }
    
    addingAdmin = true;
    addMessage = '';
    addSuccess = false;
    
    try {
      // Use the new add_admin_user function
      const { data: result, error } = await supabase.rpc('add_admin_user', {
        admin_email: newAdminEmail,
        admin_role: newAdminRole
      });
      
      if (error) {
        addMessage = `Error: ${error.message}`;
        addSuccess = false;
        console.error('Error adding admin:', error);
        return;
      }
      
      if (result && !result.success) {
        addMessage = result.message;
        addSuccess = false;
      } else {
        addMessage = result.message || 'Admin added successfully';
        addSuccess = true;
        newAdminEmail = '';
        newAdminRole = 'admin';
        // Reload the admin users list
        await loadAdminUsers();
      }
    } catch (e) {
      addSuccess = false;
      addMessage = `Exception: ${e instanceof Error ? e.message : 'Unknown error'}`;
      console.error('Exception adding admin:', e);
    } finally {
      addingAdmin = false;
    }
  }
  
  // Remove an admin using the safe function
  async function handleRemoveAdmin(email: string, userId: string): Promise<void> {
    if (!email || !canManageAdmins) {
      alert("You don't have permission to remove admins");
      return;
    }
    
    if (!confirm(`Are you sure you want to remove admin privileges from ${email}?`)) {
      return;
    }
    
    try {
      // Use the new remove_admin_user function
      const { data: result, error } = await supabase.rpc('remove_admin_user', {
        admin_email: email
      });
      
      if (error) {
        alert(`Error removing admin: ${error.message}`);
        console.error('Error removing admin:', error);
        return;
      }
      
      if (result && !result.success) {
        alert(`Failed to remove admin: ${result.message || 'Unknown error'}`);
        return;
      }
      
      alert(`Successfully removed admin: ${email}`);
      await loadAdminUsers();
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      alert(`Exception: ${errorMessage}`);
      console.error('Exception removing admin:', e);
    }
  }
  
  // Update an admin's role
  async function handleUpdateRole(email: string, userId: string): Promise<void> {
    if (!email || !canManageAdmins) {
      alert("You don't have permission to update admin roles");
      return;
    }
    
    // Show a dialog to select the new role
    const newRole = prompt(`Select new role for ${email}:
Available roles:
- super-admin
- admin
- scholarship-admin`, 'admin');
    
    if (!newRole) return; // User cancelled
    
    try {
      // Use the add_admin_user function to update the role (it handles upserts)
      const { data: result, error } = await supabase.rpc('add_admin_user', {
        admin_email: email,
        admin_role: newRole
      });
      
      if (error) {
        alert(`Error updating admin role: ${error.message}`);
        console.error('Error updating admin role:', error);
        return;
      }
      
      if (result && !result.success) {
        alert(`Failed to update admin role: ${result.message || 'Unknown error'}`);
        return;
      }
      
      alert(`Successfully updated ${email} to role: ${newRole}`);
      await loadAdminUsers();
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      alert(`Exception: ${errorMessage}`);
      console.error('Exception updating admin role:', e);
    }
  }
  
  // Emergency function to grant admin access
  async function grantEmergencyAccess(): Promise<void> {
    try {
      // Use the emergency_admin_grant function instead of direct table access
      const { data: result, error } = await supabase.rpc('emergency_admin_grant');

      if (error) {
        alert(`Error granting admin access: ${error.message}`);
        return;
      }

      if (result && !result.success) {
        alert(`Failed to grant emergency access: ${result.message || 'Unknown error'}`);
        return;
      }

      alert('Emergency admin access granted! Refreshing page...');
      window.location.reload();
    } catch (e) {
      alert(`Exception: ${e}`);
    }
  }

  onMount(loadAdminUsers);
</script>

<svelte:head>
  <title>Admin Settings - Abroaducate</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">Admin Settings</h1>
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
      

      
      {#if !canManageAdmins && data?.session?.user?.id !== 'f443d194-4b56-48da-9251-6c3f790f0f33'}
        <div class="p-4 bg-yellow-50 text-yellow-800 rounded-md mb-4">
          <p class="mb-3">You don't have permission to add new admins. Only super-admins can manage admin users.</p>
          <button
            type="button"
            on:click={grantEmergencyAccess}
            class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Grant Emergency Admin Access
          </button>
          <p class="text-xs mt-2 text-yellow-600">
            Click this if you should have admin access but the system isn't recognizing you as an admin.
          </p>
        </div>
      {:else}
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-grow">
            <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              id="email"
              bind:value={newAdminEmail}
              placeholder="user@example.com"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
              disabled={!canManageAdmins}
            />
          </div>
          
          <div class="w-full sm:w-48">
            <label for="role" class="block text-sm font-medium text-gray-700">Admin Role</label>
            <select
              id="role"
              bind:value={newAdminRole}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
              disabled={!canManageAdmins}
            >
              {#each roleOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </div>
          
          <div class="flex items-end">
            <button
              type="button"
              on:click={handleAddAdmin}
              disabled={!newAdminEmail || addingAdmin || !canManageAdmins}
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
                    {admin.email || admin.email_cache || 'Unknown'}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div class="flex items-center space-x-2">
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        {admin.role === 'super-admin' ? 'bg-purple-100 text-purple-800' : 
                        admin.role === 'admin' ? 'bg-blue-100 text-blue-800' : 
                        'bg-green-100 text-green-800'}">
                        {admin.role}
                      </span>
                      {#if canManageAdmins}
                        <button
                          on:click={() => handleUpdateRole(admin.email_cache || '', admin.user_id)}
                          class="text-blue-600 hover:text-blue-900 text-xs"
                        >
                          Change
                        </button>
                      {/if}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(admin.created_at).toLocaleDateString()}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {#if canManageAdmins && (admin.role !== 'super-admin' || currentUserRole === 'super-admin')}
                      <button
                        on:click={() => handleRemoveAdmin(admin.email_cache || '', admin.user_id)}
                        class="text-red-600 hover:text-red-900"
                        title="Remove admin"
                      >
                        Remove
                      </button>
                    {:else}
                      <span class="text-gray-400" title={admin.role === 'super-admin' ? 'Cannot remove super-admin' : 'No permission to remove'}>
                        Remove
                      </span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
  
  <!-- System Settings -->
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="px-6 py-5 border-b border-gray-200">
      <h2 class="text-xl font-semibold text-gray-900">System Settings</h2>
      <p class="mt-1 text-sm text-gray-500">
        Configure global system settings
      </p>
    </div>
    
    <div class="px-6 py-5">
      
      <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 class="text-lg font-medium text-blue-800 mb-2">Admin Role Permissions</h3>
        <div class="text-blue-700 mb-3">
          <p class="mb-2"><strong>Super-admin:</strong> Full access to all admin features, can add/remove other admins, and manage system settings</p>
          <p class="mb-2"><strong>Admin:</strong> Can manage scholarships, content, and view analytics, but cannot manage other admins</p>
          <p class="mb-2"><strong>Scholarship-admin:</strong> Limited access to scholarship management only</p>
        </div>
      </div>
      
      <p class="text-gray-500 italic">
        Additional system settings will be added in future updates.
      </p>
    </div>
  </div>
</div> 