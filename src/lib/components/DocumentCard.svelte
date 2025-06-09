<script lang="ts">
  export let type: 'sop' | 'cover_letter' | 'personal_statement';
  export let title: string;
  export let lastEdited: string;
  export let metadata: string;
  export let editUrl: string;
  export let wordCount: number | null = null;

  let exporting = false;

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  function getDocumentIcon(type: string) {
    switch (type) {
      case 'sop': return '📄';
      case 'cover_letter': return '📧';
      case 'personal_statement': return '💭';
      default: return '📝';
    }
  }

  async function exportDocument(format: 'pdf' | 'word') {
    exporting = true;
    try {
      // For now, we'll redirect to the edit page where export is available
      window.open(editUrl, '_blank');
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      exporting = false;
    }
  }
</script>

<div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-gray-300">
  <div class="flex items-start gap-3 mb-4">
    <div class="text-2xl flex-shrink-0 mt-1">
      {getDocumentIcon(type)}
    </div>
    <div class="flex-1 min-w-0">
      <h3 class="font-semibold text-gray-900 text-sm mb-1 truncate">{title}</h3>
      <div class="text-xs text-gray-600 mb-1">
        <span class="capitalize">{metadata}</span>
        {#if wordCount}
          <span class="text-gray-500">• {wordCount} words</span>
        {/if}
      </div>
      <span class="text-xs text-gray-400 block">Last edited: {formatDate(lastEdited)}</span>
    </div>
  </div>
  
  <div class="flex gap-2 mt-3">
    <a href={editUrl} class="px-3 py-2 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors no-underline flex items-center gap-1">
      ✏️ Edit
    </a>
    <button 
      onclick={() => exportDocument('pdf')} 
      disabled={exporting}
      class="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors border-none cursor-pointer flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      📄 PDF
    </button>
    <button 
      onclick={() => exportDocument('word')} 
      disabled={exporting}
      class="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors border-none cursor-pointer flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      📝 Word
    </button>
  </div>
</div> 