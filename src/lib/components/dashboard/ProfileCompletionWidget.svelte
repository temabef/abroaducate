<script lang="ts">
  import type { SupabaseClient } from '@supabase/supabase-js';
  import { analyzeProfileCompletion, loadUnifiedProfile } from '$lib/services/unifiedProfile';
  import { onMount } from 'svelte';

  let { supabase, session }: { 
    supabase: SupabaseClient, 
    session: any 
  } = $props();

  let loading = $state(true);
  let profileCompletion = $state<{
    score: number;
    missing_fields: string[];
    next_step: string;
    is_ready_for_matching: boolean;
  } | null>(null);

  let achievements = $state<Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    unlocked: boolean;
    progress?: number;
  }>>([]);

  onMount(async () => {
    await loadProfileCompletion();

    const handler = () => void loadProfileCompletion();
    window.addEventListener('abroaducate:profile-updated', handler);
    return () => window.removeEventListener('abroaducate:profile-updated', handler);
  });

  async function loadProfileCompletion() {
    try {
      loading = true;
      const { profile } = await loadUnifiedProfile(supabase, session);
      
      profileCompletion = analyzeProfileCompletion(profile);
      
      // Calculate achievements based on profile completion
      if (profileCompletion) {
        achievements = calculateAchievements(profileCompletion, profile);
      }
    } catch (error) {
      console.error('Error loading profile completion:', error);
    } finally {
      loading = false;
    }
  }

  function calculateAchievements(completion: any, profile: any) {
    const achievementList = [
      {
        id: 'profile_started',
        title: 'Profile Started',
        description: 'Created your profile',
        icon: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
        unlocked: completion.score > 0
      },
      {
        id: 'halfway_there',
        title: 'Halfway There',
        description: 'Profile 50% complete',
        icon: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
        unlocked: completion.score >= 50
      },
      {
        id: 'almost_done',
        title: 'Almost Done',
        description: 'Profile 80% complete',
        icon: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
        unlocked: completion.score >= 80
      },
      {
        id: 'profile_master',
        title: 'Profile Master',
        description: 'Profile 100% complete',
        icon: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>`,
        unlocked: completion.score >= 100
      },
      {
        id: 'ready_to_match',
        title: 'Ready to Match',
        description: 'Eligible for university matching',
        icon: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/></svg>`,
        unlocked: completion.is_ready_for_matching
      }
    ];

    return achievementList;
  }

  function getCompletionColor(score: number) {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  function getProgressBarColor(score: number) {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  function getNextActionUrl() {
    if (!profileCompletion) {
      return '/dashboard';
    }
    
    // Dashboard now contains the roadmap checklist panel
    return '/dashboard#roadmap';
  }
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <!-- Widget Header -->
  <div class="flex items-center justify-between mb-4">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
      </div>
      <div>
        <h3 class="font-semibold text-gray-900">Profile Completion</h3>
        <p class="text-sm text-gray-600">Complete your profile for better matches</p>
      </div>
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
      <span class="ml-2 text-gray-600 text-sm">Loading...</span>
    </div>
  {:else if profileCompletion}
    <!-- Progress Bar -->
    <div class="mb-4">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium text-gray-700">Completion Progress</span>
        <span class="text-sm font-semibold {getCompletionColor(profileCompletion.score)}">
          {profileCompletion.score}%
        </span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div 
          class="h-2 rounded-full transition-all duration-300 {getProgressBarColor(profileCompletion.score)}"
          style="width: {profileCompletion.score}%"
        ></div>
      </div>
    </div>

    <!-- Status Message -->
    <div class="mb-4">
      {#if profileCompletion.score >= 90}
        <div class="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg p-3 animate-pulse">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          <span class="text-sm font-medium">
            <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Profile Complete! You're ready for matching.
          </span>
        </div>
      {:else if profileCompletion.score >= 70}
        <div class="flex items-center gap-2 text-yellow-700 bg-yellow-50 rounded-lg p-3">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
          </svg>
          <span class="text-sm font-medium">Almost there! Complete a few more fields.</span>
        </div>
      {:else}
        <div class="flex items-center gap-2 text-blue-700 bg-blue-50 rounded-lg p-3">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
          </svg>
          <span class="text-sm font-medium">Let's complete your profile for better matches!</span>
        </div>
      {/if}
    </div>

    <!-- Missing Fields -->
    {#if profileCompletion.missing_fields.length > 0}
      <div class="mb-4">
        <h4 class="text-sm font-medium text-gray-700 mb-2">Still Need:</h4>
        <div class="flex flex-wrap gap-2">
          {#each profileCompletion.missing_fields.slice(0, 3) as field}
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {field}
            </span>
          {/each}
          {#if profileCompletion.missing_fields.length > 3}
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              +{profileCompletion.missing_fields.length - 3} more
            </span>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Achievements -->
    {#if achievements.length > 0}
      <div class="mb-4">
        <h4 class="text-sm font-medium text-gray-700 mb-2">Achievements</h4>
        <div class="flex gap-2 flex-wrap">
          {#each achievements.filter(a => a.unlocked).slice(0, 3) as achievement}
            <div class="flex items-center gap-1 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded-full">
              <span class="text-yellow-600">{@html achievement.icon}</span>
              <span class="text-xs font-medium text-yellow-800">{achievement.title}</span>
            </div>
          {/each}
          {#if achievements.filter(a => a.unlocked).length > 3}
            <div class="flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-full">
              <span class="text-xs font-medium text-gray-600">+{achievements.filter(a => a.unlocked).length - 3} more</span>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Action Button -->
    <div class="flex gap-3">
      {#if profileCompletion.score < 90}
        <button 
          onclick={() => {
            const url = getNextActionUrl();
            window.location.href = url;
          }}
          class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium text-center hover:bg-blue-700 transition-colors"
        >
          {profileCompletion.next_step}
        </button>
      {/if}
      {#if profileCompletion.is_ready_for_matching}
        <a 
          href="/scholarships"
          class="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium text-center hover:bg-green-700 transition-colors"
        >
          Find Matches
        </a>
      {/if}
      <button 
        onclick={loadProfileCompletion}
        class="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        title="Refresh profile data"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
      </button>
    </div>
  {:else}
    <div class="text-center py-4">
      <p class="text-gray-500 text-sm">Unable to load profile data</p>
      <button 
        onclick={loadProfileCompletion}
        class="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        Try Again
      </button>
    </div>
  {/if}
</div>