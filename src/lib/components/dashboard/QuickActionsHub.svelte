<script lang="ts">
  import type { SupabaseClient } from '@supabase/supabase-js';

  let { supabase, session }: { 
    supabase: SupabaseClient, 
    session: any 
  } = $props();

  import { onMount } from 'svelte';

  let usageLimits = $state<{[key: string]: {current: number; limit: number | null; planType: string}} | null>(null);
  let loading = $state(true);

  onMount(async () => {
    await loadUsageLimits();
  });

  async function loadUsageLimits() {
    try {
      // Get usage limits for key features
      const features = ['sop_generation', 'text_enhancements', 'university_matching'];
      const limits: {[key: string]: any} = {};
      
      for (const feature of features) {
        try {
          const response = await fetch(`/api/check-usage-limit?feature=${feature}&user_id=${session?.user?.id}`);
          if (response.ok) {
            const result = await response.json();
            limits[feature] = {
              current: result.currentUsage || 0,
              limit: result.limit,
              planType: result.planType || 'free'
            };
          }
        } catch (error) {
          console.log(`Could not load usage for ${feature}:`, error);
        }
      }
      
      usageLimits = limits;
    } catch (error) {
      console.error('Error loading usage limits:', error);
    } finally {
      loading = false;
    }
  }

  // Helper functions for usage limits
  function getUsageInfo(actionId: string) {
    if (!usageLimits) return null;
    
    const featureMap: {[key: string]: string} = {
      'generate_sop': 'sop_generation',
      'gpa_converter': 'text_enhancements',
      'university_matching': 'university_matching'
    };
    
    const feature = featureMap[actionId];
    return feature ? usageLimits[feature] : null;
  }

  function getUsageBadgeColor(current: number, limit: number | null) {
    if (limit === null) return 'bg-green-100 text-green-800'; // Unlimited
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return 'bg-red-100 text-red-800';
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  }

  function formatUsageText(current: number, limit: number | null) {
    if (limit === null) return '∞';
    return `${current}/${limit}`;
  }

  // Define quick action items with icons and descriptions
  const quickActions = [
    {
      id: 'generate_sop',
      title: 'Generate SOP',
      description: 'Create Statement of Purpose',
      href: '/sop',
      icon: 'document',
      color: 'from-blue-500 to-purple-600',
      category: 'Documents',
      hasUsageLimit: true
    },
    {
      id: 'gpa_converter',
      title: 'GPA Converter',
      description: 'Convert your grades',
      href: '/tools/gpa-converter',
      icon: 'calculator',
      color: 'from-green-500 to-teal-600',
      category: 'Tools',
      hasUsageLimit: true
    },
    {
      id: 'find_scholarships',
      title: 'Find Scholarships',
      description: 'Browse opportunities',
      href: '/scholarships',
      icon: 'currency',
      color: 'from-yellow-500 to-orange-600',
      category: 'Search',
      hasUsageLimit: false
    },
    {
      id: 'university_matching',
      title: 'University Matching',
      description: 'Find your perfect fit',
      href: '/universities',
      icon: 'building',
      color: 'from-purple-500 to-pink-600',
      category: 'Search',
      hasUsageLimit: true
    },
    {
      id: 'cover_letter',
      title: 'Cover Letter',
      description: 'Professional letters',
      href: '/cover-letters',
      icon: 'mail',
      color: 'from-indigo-500 to-blue-600',
      category: 'Documents',
      hasUsageLimit: false
    },
    {
      id: 'visa_interview',
      title: 'Visa Interview',
      description: 'Practice & prepare',
      href: '/tools/visa-interview',
      icon: 'chat',
      color: 'from-red-500 to-pink-600',
      category: 'Tools',
      hasUsageLimit: false
    }
  ];

  function getIcon(iconName: string) {
    const icons = {
      document: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      calculator: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      currency: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      building: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      mail: 'M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      chat: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
    };
    return icons[iconName as keyof typeof icons] || icons.document;
  }

  // Track click analytics
  function handleActionClick(actionId: string) {
    // You can add analytics tracking here
    console.log('Quick action clicked:', actionId);
  }
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <!-- Widget Header -->
  <div class="flex items-center justify-between mb-4">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
      </div>
      <div>
        <h3 class="font-semibold text-gray-900">Quick Actions</h3>
        <p class="text-sm text-gray-600">Jump to your most-used tools</p>
      </div>
    </div>
    <a href="/tools" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
      All Tools
    </a>
  </div>

  <!-- Quick Actions Grid -->
  <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
    {#each quickActions as action}
      <a 
        href={action.href}
        onclick={() => handleActionClick(action.id)}
        class="group p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all duration-200 bg-white hover:bg-gray-50"
      >
        <div class="flex flex-col items-center text-center">
          <!-- Icon -->
          <div class="w-12 h-12 bg-gradient-to-br {action.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIcon(action.icon)}></path>
            </svg>
          </div>
          
          <!-- Content -->
          <h4 class="font-medium text-gray-900 text-sm mb-1 group-hover:text-blue-600 transition-colors">
            {action.title}
          </h4>
          <p class="text-xs text-gray-500 line-clamp-2 mb-2">
            {action.description}
          </p>
          
          <!-- Usage Limit Badge -->
          {#if action.hasUsageLimit && !loading}
            {@const usageInfo = getUsageInfo(action.id)}
            {#if usageInfo}
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {getUsageBadgeColor(usageInfo.current, usageInfo.limit)}">
                {formatUsageText(usageInfo.current, usageInfo.limit)}
              </span>
            {/if}
          {/if}
        </div>
      </a>
    {/each}
  </div>

  <!-- Additional Actions -->
  <div class="mt-4 pt-4 border-t border-gray-200">
    <div class="flex justify-between items-center">
      <div class="flex gap-3">
        <a 
          href="/applications/new"
          class="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Track Application
        </a>
        <a 
          href="/profile"
          class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
          Edit Profile
        </a>
      </div>
      <a 
        href="/account"
        class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
      >
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
        Settings
      </a>
    </div>
  </div>
</div>
