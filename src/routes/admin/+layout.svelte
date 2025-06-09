<script lang="ts">
  import { page } from '$app/stores';
  
  let { children, data } = $props();
  let { session } = $derived(data);
  
  // Simple admin check - enhanced for role-based access
  let isAdmin = $derived(
    session?.user?.email === 'admin@abroaducate.com' || 
    session?.user?.email?.includes('admin') ||
    session?.user?.user_metadata?.role === 'admin'
  );
</script>

<div class="min-h-screen bg-gray-100">
  {#if isAdmin}
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
                href="/admin/scholarships" 
                class="px-3 py-2 rounded-md text-sm font-medium {$page.url.pathname.includes('/scholarships') ? 'bg-yellow-100 text-yellow-700' : 'text-gray-600 hover:text-gray-900'}"
              >
                Scholarships
              </a>
              <a 
                href="/admin/users" 
                class="px-3 py-2 rounded-md text-sm font-medium {$page.url.pathname.includes('/users') ? 'bg-yellow-100 text-yellow-700' : 'text-gray-600 hover:text-gray-900'}"
              >
                Users
              </a>
              <a 
                href="/admin/analytics" 
                class="px-3 py-2 rounded-md text-sm font-medium {$page.url.pathname.includes('/analytics') ? 'bg-yellow-100 text-yellow-700' : 'text-gray-600 hover:text-gray-900'}"
              >
                Analytics
              </a>
            </div>
          </div>
          <div class="flex items-center">
            <span class="text-sm text-gray-600 mr-4">
              Admin: {session?.user?.email || 'Unknown'}
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
    
    <!-- Admin Content -->
    {@render children()}
  {:else}
    <!-- Access Denied -->
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="text-6xl mb-4">🔒</div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p class="text-gray-600 mb-6">You need admin privileges to access this area.</p>
        <a href="/" class="bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-yellow-700">
          Return Home
        </a>
      </div>
    </div>
  {/if}
</div> 