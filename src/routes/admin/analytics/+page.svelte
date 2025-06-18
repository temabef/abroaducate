<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  
  let { data } = $props();
  let { supabase } = $derived(data);
  
  let analytics = $state({
    // User Analytics
    totalUsers: 0,
    freeUsers: 0,
    professionalUsers: 0,
    eliteUsers: 0,
    activeUsers: 0,
    recentSignups: 0,
    
    // Document Analytics (Global)
    totalSOPs: 0,
    totalCoverLetters: 0,
    totalPersonalStatements: 0,
    totalDocuments: 0,
    
    // AI Features Analytics (Global)
    totalAIUsage: 0,
    grammarChecks: 0,
    toneAnalysis: 0,
    plagiarismChecks: 0,
    textEnhancements: 0,
    wordOptimizations: 0,
    reviews: 0,
    
    // Scholarship Analytics
    totalScholarships: 0,
    totalApplications: 0,
    adminUsers: 0
  });
  
  let loading = $state(true);
  let error = $state<string | null>(null);
  
  onMount(async () => {
    await loadAnalytics();
  });
  
  async function loadAnalytics() {
    loading = true;
    error = null;
    
    try {
      // Use the new centralized analytics function for consistent data
      const { data: analyticsData, error: analyticsError } = await supabase
        .rpc('get_dashboard_analytics');
      
      if (analyticsError) {
        console.error('Analytics RPC error:', analyticsError);
        throw new Error(analyticsError.message);
      }
      
      if (analyticsData && analyticsData.length > 0) {
        const data = analyticsData[0];
        
        analytics = {
          // User Analytics
          totalUsers: Number(data.total_users) || 0,
          freeUsers: Number(data.free_users) || 0,
          professionalUsers: Number(data.professional_users) || 0,
          eliteUsers: Number(data.elite_users) || 0,
          activeUsers: Number(data.active_users_30d) || 0,
          recentSignups: Number(data.new_users_30d) || 0,
          
          // Document Analytics (Global totals)
          totalSOPs: Number(data.total_sops) || 0,
          totalCoverLetters: Number(data.total_cover_letters) || 0,
          totalPersonalStatements: Number(data.total_personal_statements) || 0,
          totalDocuments: Number(data.total_documents) || 0,
          
          // AI Features Analytics (Global totals)
          totalAIUsage: Number(data.total_ai_usage) || 0,
          grammarChecks: Number(data.grammar_checks_count) || 0,
          toneAnalysis: Number(data.tone_analysis_count) || 0,
          plagiarismChecks: Number(data.plagiarism_checks_count) || 0,
          textEnhancements: Number(data.text_enhancements_count) || 0,
          wordOptimizations: Number(data.word_optimizations_count) || 0,
          reviews: Number(data.reviews_count) || 0,
          
          // Scholarship Analytics
          totalScholarships: Number(data.total_scholarships) || 0,
          totalApplications: Number(data.total_applications) || 0,
          adminUsers: Number(data.admin_users_count) || 0
        };
      } else {
        throw new Error('No analytics data returned from function');
      }
      
    } catch (e) {
      error = `Failed to load analytics: ${e}`;
      console.error('Analytics error:', e);
      
      // Fallback to individual queries if the function fails
      console.log('Falling back to individual analytics queries...');
      await loadAnalyticsFallback();
    } finally {
      loading = false;
    }
  }
  
  // Fallback analytics loading (simplified version of original)
  async function loadAnalyticsFallback() {
    try {
      const [usersResult, subscriptionsResult, sopsResult, scholarshipsResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('user_subscriptions').select('plan_type').eq('status', 'active'),
        supabase.from('sops').select('id', { count: 'exact', head: true }),
        supabase.from('scholarships').select('id', { count: 'exact', head: true })
      ]);
      
      const planCounts = subscriptionsResult.data?.reduce((acc: Record<string, number>, sub: any) => {
        acc[sub.plan_type] = (acc[sub.plan_type] || 0) + 1;
        return acc;
      }, {}) || {};
      
      const totalUsers = usersResult.count || 0;
      const paidUsers = (planCounts.professional || 0) + (planCounts.elite || 0);
      
      analytics = {
        totalUsers,
        freeUsers: Math.max(0, totalUsers - paidUsers),
        professionalUsers: planCounts.professional || 0,
        eliteUsers: planCounts.elite || 0,
        activeUsers: 0, // Will be 0 in fallback
        recentSignups: 0, // Will be 0 in fallback
        totalSOPs: sopsResult.count || 0,
        totalCoverLetters: 0, // Simplified for fallback
        totalPersonalStatements: 0, // Simplified for fallback
        totalDocuments: sopsResult.count || 0,
        totalAIUsage: 0, // Simplified for fallback
        grammarChecks: 0,
        toneAnalysis: 0,
        plagiarismChecks: 0,
        textEnhancements: 0,
        wordOptimizations: 0,
        reviews: 0,
        totalScholarships: scholarshipsResult.count || 0,
        totalApplications: 0, // Simplified for fallback
        adminUsers: 0 // Simplified for fallback
      };
    } catch (fallbackError) {
      console.error('Fallback analytics failed:', fallbackError);
      error = 'Unable to load analytics data. Please check database connection.';
    }
  }
</script>

<svelte:head>
  <title>Admin Analytics - Abroaducate</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
    <p class="text-gray-600 mt-2">Global system metrics and user statistics</p>
  </div>
  
  {#if loading}
    <div class="animate-pulse">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {#each Array(16) as _}
          <div class="bg-white p-6 rounded-lg shadow">
            <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div class="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        {/each}
      </div>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 rounded-md p-4">
      <div class="text-red-800">
        <strong>Error:</strong> {error}
      </div>
    </div>
  {:else}
    <!-- User Analytics -->
    <div>
      <h2 class="text-xl font-semibold text-gray-900 mb-4">👥 User Analytics</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Total Users -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-lg">👥</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Total Users
                  </dt>
                  <dd class="text-3xl font-semibold text-gray-900">
                    {analytics.totalUsers.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Active Users -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-lg">⚡</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Active Users (30d)
                  </dt>
                  <dd class="text-3xl font-semibold text-gray-900">
                    {analytics.activeUsers.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Recent Signups -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-lg">📈</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    New Users (30d)
                  </dt>
                  <dd class="text-3xl font-semibold text-gray-900">
                    {analytics.recentSignups.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Admin Users -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-lg">👨‍💼</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Admin Users
                  </dt>
                  <dd class="text-3xl font-semibold text-gray-900">
                    {analytics.adminUsers.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Subscription Plan Breakdown -->
    <div>
      <h2 class="text-xl font-semibold text-gray-900 mb-4">💎 Subscription Plan Breakdown</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Free Users -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-lg">🆓</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Academic Starter (Free)
                  </dt>
                  <dd class="text-3xl font-semibold text-gray-900">
                    {analytics.freeUsers.toLocaleString()}
                  </dd>
                  <dd class="text-xs text-gray-500 mt-1">
                    {analytics.totalUsers > 0 ? Math.round((analytics.freeUsers / analytics.totalUsers) * 100) : 0}% of total users
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Professional Users -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-lg">💼</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Academic Professional
                  </dt>
                  <dd class="text-3xl font-semibold text-gray-900">
                    {analytics.professionalUsers.toLocaleString()}
                  </dd>
                  <dd class="text-xs text-gray-500 mt-1">
                    {analytics.totalUsers > 0 ? Math.round((analytics.professionalUsers / analytics.totalUsers) * 100) : 0}% of total users
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Elite Users -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-lg">👑</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Academic Elite
                  </dt>
                  <dd class="text-3xl font-semibold text-gray-900">
                    {analytics.eliteUsers.toLocaleString()}
                  </dd>
                  <dd class="text-xs text-gray-500 mt-1">
                    {analytics.totalUsers > 0 ? Math.round((analytics.eliteUsers / analytics.totalUsers) * 100) : 0}% of total users
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Total Premium Users -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-lg">💰</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Total Premium Users
                  </dt>
                  <dd class="text-3xl font-semibold text-gray-900">
                    {(analytics.professionalUsers + analytics.eliteUsers).toLocaleString()}
                  </dd>
                  <dd class="text-xs text-gray-500 mt-1">
                    {analytics.totalUsers > 0 ? Math.round(((analytics.professionalUsers + analytics.eliteUsers) / analytics.totalUsers) * 100) : 0}% conversion rate
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Document Analytics -->
    <div>
      <h2 class="text-xl font-semibold text-gray-900 mb-4">📄 Global Document Analytics</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- SOPs Generated -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-lg">📄</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    SOPs Generated
                  </dt>
                  <dd class="text-3xl font-semibold text-gray-900">
                    {analytics.totalSOPs.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Cover Letters -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-lg">💼</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Cover Letters
                  </dt>
                  <dd class="text-3xl font-semibold text-gray-900">
                    {analytics.totalCoverLetters.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Personal Statements -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-lg">💭</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Personal Statements
                  </dt>
                  <dd class="text-3xl font-semibold text-gray-900">
                    {analytics.totalPersonalStatements.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Total Documents -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-lg">📊</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Total Documents
                  </dt>
                  <dd class="text-3xl font-semibold text-gray-900">
                    {analytics.totalDocuments.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI Features Analytics -->
    <div>
      <h2 class="text-xl font-semibold text-gray-900 mb-4">🤖 Global AI Features Analytics</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Total AI Usage -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-cyan-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-lg">🤖</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Total AI Usage
                  </dt>
                  <dd class="text-3xl font-semibold text-gray-900">
                    {analytics.totalAIUsage.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Reviews -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-lg">📊</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    SOP Reviews
                  </dt>
                  <dd class="text-3xl font-semibold text-gray-900">
                    {analytics.reviews.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Grammar Checks -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-lg">✅</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Grammar Checks
                  </dt>
                  <dd class="text-3xl font-semibold text-gray-900">
                    {analytics.grammarChecks.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Tone Analysis -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-lg">🎭</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Tone Analysis
                  </dt>
                  <dd class="text-3xl font-semibold text-gray-900">
                    {analytics.toneAnalysis.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Text Enhancements -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-pink-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-lg">✨</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Text Enhancements
                  </dt>
                  <dd class="text-3xl font-semibold text-gray-900">
                    {analytics.textEnhancements.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Word Optimizations -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-lg">📝</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Word Optimizations
                  </dt>
                  <dd class="text-3xl font-semibold text-gray-900">
                    {analytics.wordOptimizations.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Plagiarism Checks -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-lg">🔍</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Plagiarism Checks
                  </dt>
                  <dd class="text-3xl font-semibold text-gray-900">
                    {analytics.plagiarismChecks.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Scholarship Analytics -->
    <div>
      <h2 class="text-xl font-semibold text-gray-900 mb-4">🎓 Scholarship Analytics</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Total Scholarships -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-lg">🎓</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Total Scholarships
                  </dt>
                  <dd class="text-3xl font-semibold text-gray-900">
                    {analytics.totalScholarships.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Applications -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-lg">📋</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Applications
                  </dt>
                  <dd class="text-3xl font-semibold text-gray-900">
                    {analytics.totalApplications.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Admin Users -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-lg">👨‍💼</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Admin Users
                  </dt>
                  <dd class="text-3xl font-semibold text-gray-900">
                    {analytics.adminUsers.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- System Information -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">ℹ️ System Information</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
        <div>
          <span class="font-medium">Last Updated:</span> {new Date().toLocaleString()}
        </div>
        <div>
          <span class="font-medium">Data Source:</span> Global Supabase Database
        </div>
        <div>
          <span class="font-medium">Status:</span> 
          <span class="text-green-600 font-medium">Active</span>
        </div>
      </div>
      
      <div class="mt-4 pt-4 border-t border-gray-200">
        <button 
          onclick={loadAnalytics} 
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
    </div>
  {/if}
</div> 