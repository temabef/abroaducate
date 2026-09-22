<script lang="ts">
  import { onMount } from 'svelte';

  export let supabase: any;
  export let session: any;
  void supabase;
  
  let usage = {
    current: 0,
    limit: null as number | null,
    planType: 'free'
  };
  
  let loading = true;

  onMount(async () => {
    await loadUsageData();
  });

  async function loadUsageData() {
    if (!session?.user) return;
    
    try {
      const response = await fetch('/api/check-usage-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usageType: 'inline_edits_used'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        usage = {
          current: data.currentUsage || 0,
          limit: data.limit,
          planType: data.planType || 'free'
        };
      }
    } catch (error) {
      console.error('Failed to load usage data:', error);
    } finally {
      loading = false;
    }
  }

  // Update usage after each edit
  export function updateUsage(newUsage: number) {
    usage.current = newUsage;
  }

  function getUsagePercentage() {
    if (!usage.limit) return 0; // Unlimited
    return Math.min(100, (usage.current / usage.limit) * 100);
  }

  function getUsageColor() {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  }

  function getRemainingEdits() {
    if (!usage.limit) return 'Unlimited';
    return Math.max(0, usage.limit - usage.current);
  }
</script>

{#if !loading}
  <div class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
    <div class="flex items-center justify-between mb-2">
      <h3 class="font-medium text-gray-900 flex items-center gap-2">
        ✨ Inline Editing
        <span class="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
          {usage.planType.toUpperCase()}
        </span>
      </h3>
      
      {#if usage.limit}
        <span class="text-sm {getUsageColor()} font-medium">
          {usage.current} / {usage.limit}
        </span>
      {:else}
        <span class="text-sm text-green-600 font-medium">
          {usage.current} / ∞
        </span>
      {/if}
    </div>
    
    {#if usage.limit}
      <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div 
          class="h-2 rounded-full transition-all duration-300 {
            getUsagePercentage() >= 90 ? 'bg-red-500' : 
            getUsagePercentage() >= 70 ? 'bg-yellow-500' : 
            'bg-green-500'
          }"
          style="width: {getUsagePercentage()}%"
        ></div>
      </div>
      
      <p class="text-xs text-gray-600">
        {getRemainingEdits()} edits remaining this month
        {#if getUsagePercentage() >= 90}
          <span class="text-red-600 font-medium">
            • Consider upgrading for more edits
          </span>
        {/if}
      </p>
    {:else}
      <div class="w-full bg-green-200 rounded-full h-2 mb-2">
        <div class="h-2 rounded-full bg-green-500 w-full"></div>
      </div>
      <p class="text-xs text-gray-600">
        Unlimited inline edits with your {usage.planType} plan
      </p>
    {/if}
    
  </div>
{/if} 
