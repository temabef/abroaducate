<script lang="ts">
  export let activities: Array<{
    document_type: string;
    document_title: string;
    last_activity: string;
    document_id: string;
    action_type: string;
  }> = [];

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  function getActivityIcon(documentType: string) {
    switch (documentType) {
      case 'sop': return '📄';
      case 'cover_letter': return '📧';
      case 'personal_statement': return '💭';
      default: return '📝';
    }
  }

  function getEditUrl(documentType: string, documentId: string) {
    switch (documentType) {
      case 'sop': return `/sop/${documentId}`;
      case 'cover_letter': return `/cover-letters/${documentId}`;
      case 'personal_statement': return `/personal-statements/${documentId}`;
      default: return '#';
    }
  }

  function getActionColor(actionType: string) {
    switch (actionType) {
      case 'created': return 'text-green-600';
      case 'edited': return 'text-blue-600';
      case 'shared': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  }
</script>

<section class="bg-white border border-gray-200 rounded-lg p-6">
  <h2 class="text-lg font-bold text-gray-900 mb-4">📈 Recent Activity</h2>
  
  {#if activities.length === 0}
    <div class="text-center py-8">
      <div class="text-4xl mb-3">📝</div>
      <h3 class="text-lg font-semibold text-gray-700 mb-2">No recent activity</h3>
      <p class="text-gray-500 text-sm">Start creating documents to see your activity here</p>
    </div>
  {:else}
    <div class="space-y-3">
      {#each activities as activity, index}
        <div class="flex items-start gap-3 py-2 border-b border-gray-100 last:border-b-0">
          <div class="text-lg flex-shrink-0 mt-0.5">
            {getActivityIcon(activity.document_type)}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-700 mb-1">
              <span class={`font-medium capitalize mr-1 ${getActionColor(activity.action_type)}`}>
                {activity.action_type}
              </span>
              <a 
                href={getEditUrl(activity.document_type, activity.document_id)} 
                class="text-blue-600 hover:text-blue-800 hover:underline font-medium truncate"
              >
                {activity.document_title}
              </a>
            </p>
            <span class="text-xs text-gray-400">{formatTime(activity.last_activity)}</span>
          </div>
        </div>
      {/each}
    </div>
    
    {#if activities.length >= 10}
      <div class="mt-4 pt-4 border-t border-gray-100 text-center">
        <button class="text-sm text-blue-600 hover:text-blue-800 font-medium">View all activity</button>
      </div>
    {/if}
  {/if}
</section>

 