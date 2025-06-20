<script lang="ts">
  import { getVersionUsageStats, getVersionHistoryUpgradeMessage } from '$lib/versionHistory';
  
  export let planType: string;
  export let currentVersionCount: number;
  export let documentType: string;
  export let showUpgradePrompt = true;
  
  $: stats = getVersionUsageStats(planType, currentVersionCount);
  $: upgradeMessage = getVersionHistoryUpgradeMessage(planType, documentType);
  
  function getProgressBarColor(percentage: number): string {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  }
  
  function getPlanIcon(planType: string): string {
    const icons = {
      free: '🆓',
      professional: '💼',
      elite: '⭐'
    };
    return icons[planType as keyof typeof icons] || '📝';
  }
</script>

<!-- Version Usage Indicator -->
<div class="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
  <div class="flex items-center justify-between mb-2">
    <div class="flex items-center gap-2">
      <span class="text-lg">{getPlanIcon(planType)}</span>
      <span class="font-medium text-gray-700">Version History</span>
      <span class="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-600 uppercase">
        {planType}
      </span>
      <!-- Smart Versioning Info -->
      <span 
        class="text-blue-500 cursor-help" 
        title="🧠 Smart Versioning: Only significant changes (30+ characters, 5+ words) create new versions to preserve your quota. Small edits are auto-saved without using version slots."
      >
        ℹ️
      </span>
    </div>
    <span class="text-xs text-gray-500 font-mono">{stats.usage}</span>
  </div>
  
  <!-- Progress Bar -->
  <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
    <div 
      class="h-2 rounded-full transition-all duration-300 {getProgressBarColor(stats.percentage)}"
      style="width: {stats.percentage}%"
    ></div>
  </div>
  
  <!-- Status Messages -->
  {#if stats.isNearLimit}
    <div class="flex items-center gap-2 text-orange-600 mb-2">
      <span>⚠️</span>
      <span class="text-xs">Version limit almost reached!</span>
    </div>
  {/if}
  
  {#if stats.upgradeRecommended && showUpgradePrompt}
    <div class="bg-blue-50 border border-blue-200 rounded-md p-2 mt-2">
      <div class="flex items-center gap-2">
        <span class="text-blue-600">💡</span>
        <span class="text-xs text-blue-700">{upgradeMessage}</span>
      </div>
      <button 
        onclick={() => window.location.href = '/pricing'}
        class="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors mt-2"
      >
        Upgrade Now
      </button>
    </div>
  {/if}
  
  <!-- Plan Limits Info -->
  <div class="text-xs text-gray-500 mt-2 space-y-1">
    {#if planType === 'free'}
      <div>• Cover letters only</div>
      <div>• 30-day retention</div>
    {:else if planType === 'professional'}
      <div>• All document types</div>
      <div>• 90-day retention</div>
    {:else if planType === 'elite'}
      <div>• All document types</div>
      <div>• 1-year retention</div>
    {/if}
  </div>
</div> 