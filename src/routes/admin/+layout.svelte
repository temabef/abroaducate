<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  
  let { children, data } = $props();
  let { session, supabase } = $derived(data);
  
  // Admin check using the centralized helper
  let isAdmin = $state(false);
  let isLoading = $state(true);
  let adminRole = $state<string | null>(null);
  let permissions = $state({
    canManageScholarships: false,
    canManageAdmins: false,
    canAccessAnalytics: false,
    canManageContent: false,
    canAccessSecurity: false
  });
  
  onMount(async () => {
    if (session?.user) {
      // Log for debugging
      console.log('SvelteKit session user:', session.user);
      
      // TEMPORARY SUPER ADMIN BYPASS - Restore your access immediately
      if (session.user.email === 'solakolawole62@gmail.com' || session.user.email === 'admin@abroaducate.com') {
        console.log('🚨 SUPER ADMIN BYPASS: Granting full access to', session.user.email);
        isAdmin = true;
        adminRole = 'super-admin';
        permissions = {
          canManageScholarships: true,
          canManageAdmins: true,
          canAccessAnalytics: true,
          canManageContent: true,
          canAccessSecurity: true
        };
        isLoading = false;
        return;
      }
      
      try {
        // Check all permissions using nuclear functions
        const [
          { data: canManage, error: scholarshipError },
          { data: canManageAdmins, error: adminError },
          { data: canAccessAnalytics, error: analyticsError },
          { data: canManageContent, error: contentError },
          { data: canAccessSecurity, error: securityError }
        ] = await Promise.all([
          supabase.rpc('can_manage_scholarships'),
          supabase.rpc('can_manage_admins_nuclear'),
          supabase.rpc('can_access_analytics'),
          supabase.rpc('can_manage_content'),
          supabase.rpc('can_manage_admins_nuclear') // Security uses same permission as admin management
        ]);
        
        // Set permissions
        permissions = {
          canManageScholarships: !!canManage,
          canManageAdmins: !!canManageAdmins,
          canAccessAnalytics: !!canAccessAnalytics,
          canManageContent: !!canManageContent,
          canAccessSecurity: !!canAccessSecurity
        } as any;
        
        // Any permission grants admin access
        isAdmin = Object.values(permissions).some(Boolean);
        
        if (isAdmin) {
          // Get the role using the new function instead of direct table query
          const { data: roleData, error: roleError } = await supabase.rpc('get_current_user_admin_role');
          
          if (roleError) {
            console.error('Error getting admin role:', roleError);
            adminRole = null;
          } else {
            adminRole = roleData || null;
            console.log('Admin access granted with role:', adminRole);
          }
        } else {
          console.log('Not an admin via any check');
          isAdmin = false;
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        isAdmin = false;
      }
    }
    isLoading = false;
  });
</script>

<div class="min-h-screen bg-gray-100">
  {#if isLoading}
    <!-- Loading state -->
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Checking admin access...</p>
      </div>
    </div>
  {:else if isAdmin}
    <!-- Admin Navigation -->
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <a href="/" class="text-xl font-bold text-gray-900">
                🎓 Abroaducate Admin
              </a>
            </div>
            <div class="ml-10 flex items-baseline space-x-8">
              <a 
                href="/admin" 
                class="px-3 py-2 rounded-md text-sm font-medium {$page.url.pathname === '/admin' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-600 hover:text-gray-900'}"
              >
                Dashboard
              </a>
              
              {#if permissions.canManageScholarships}
                <a 
                  href="/admin/scholarships" 
                  class="px-3 py-2 rounded-md text-sm font-medium {$page.url.pathname.includes('/scholarships') ? 'bg-yellow-100 text-yellow-700' : 'text-gray-600 hover:text-gray-900'}"
                >
                  Scholarships
                </a>
              {/if}
              
              {#if permissions.canManageAdmins}
                <a 
                  href="/admin/settings" 
                  class="px-3 py-2 rounded-md text-sm font-medium {$page.url.pathname.includes('/settings') ? 'bg-yellow-100 text-yellow-700' : 'text-gray-600 hover:text-gray-900'}"
                >
                  Settings
                </a>
              {/if}
            </div>
          </div>
          <div class="flex items-center">
            <span class="text-sm text-gray-600 mr-4">
              Admin: {session?.user?.email || 'Unknown'} 
              {#if adminRole}
                <span class="px-2 py-1 text-xs rounded-full {adminRole === 'super-admin' ? 'bg-purple-100 text-purple-800' : adminRole === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'} ml-2">
                  {adminRole}
                </span>
              {/if}
            </span>
            <a 
              href="/" 
              class="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
            >
              Back to Site
            </a>
          </div>
        </div>
      </div>
    </nav>
    
    <!-- Admin Layout with Sidebar -->
    <div class="flex">
      <!-- Admin Sidebar Navigation -->
      <div class="bg-gray-800 text-white w-64 flex-shrink-0 min-h-screen">
        <div class="p-4">
          <h2 class="text-xl font-bold">Admin Panel</h2>
          {#if adminRole}
            <p class="text-sm text-gray-400 mt-1">Role: {adminRole}</p>
          {/if}
        </div>
        
        <nav class="mt-5">
          <a href="/admin" class="flex items-center px-4 py-2 hover:bg-gray-700 {$page.url.pathname === '/admin' ? 'bg-gray-700' : ''}">
            <span class="mr-2">📊</span>
            <span>Dashboard</span>
          </a>
          
          {#if permissions.canManageScholarships}
            <a href="/admin/scholarships" class="flex items-center px-4 py-2 hover:bg-gray-700 {$page.url.pathname === '/admin/scholarships' ? 'bg-gray-700' : ''}">
              <span class="mr-2">🎓</span>
              <span>Scholarships</span>
            </a>
          {/if}
          
          {#if permissions.canAccessAnalytics}
            <a href="/admin/analytics" class="flex items-center px-4 py-2 hover:bg-gray-700 {$page.url.pathname === '/admin/analytics' ? 'bg-gray-700' : ''}">
              <span class="mr-2">📈</span>
              <span>Analytics</span>
            </a>
          {/if}
          
          {#if permissions.canManageContent}
            <a href="/admin/test-prep" class="flex items-center px-4 py-2 hover:bg-gray-700 {$page.url.pathname.startsWith('/admin/test-prep') ? 'bg-gray-700' : ''}">
              <span class="mr-2">📝</span>
              <span>Test Prep CMS</span>
            </a>
            <a href="/admin/blog" class="flex items-center px-4 py-2 hover:bg-gray-700 {$page.url.pathname.startsWith('/admin/blog') ? 'bg-gray-700' : ''}">
              <span class="mr-2">📰</span>
              <span>Blog</span>
            </a>
          {/if}
          
          {#if permissions.canManageAdmins}
            <a href="/admin/newsletter" class="flex items-center px-4 py-2 hover:bg-gray-700 {$page.url.pathname === '/admin/newsletter' ? 'bg-gray-700' : ''}">
              <span class="mr-2">📧</span>
              <span>Newsletter</span>
            </a>
          {/if}
          
          {#if permissions.canManageAdmins}
            <a href="/admin/users" class="flex items-center px-4 py-2 hover:bg-gray-700 {$page.url.pathname === '/admin/users' ? 'bg-gray-700' : ''}">
              <span class="mr-2">👥</span>
              <span>User Management</span>
            </a>
          {/if}
          
          {#if permissions.canManageAdmins}
            <a href="/admin/settings" class="flex items-center px-4 py-2 hover:bg-gray-700 {$page.url.pathname === '/admin/settings' ? 'bg-gray-700' : ''}">
              <span class="mr-2">⚙️</span>
              <span>Settings</span>
            </a>
          {/if}
        </nav>
      </div>
      
      <!-- Admin Content with proper spacing -->
      <div class="flex-1 p-6 pt-8 overflow-y-auto">
        <div class="max-w-7xl mx-auto">
          {@render children()}
        </div>
      </div>
    </div>
  {:else}
    <!-- Access Denied -->
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="text-6xl mb-4">🔒</div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p class="text-gray-600 mb-6">⚠️ Admin access required. Please contact administrator.</p>
        <p class="text-gray-600 mb-6">User email: {session?.user?.email || 'Not logged in'}</p>
        <p class="text-gray-600 mb-6">User ID: {session?.user?.id || 'Not available'}</p>
        <a href="/" class="bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-yellow-700">
          Return Home
        </a>
      </div>
    </div>
  {/if}
</div> 