<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { PageData } from './$types';
  
  export let data: PageData;
  let { personalStatement, supabase, session } = data;
  
  // Editor state
  let content = personalStatement?.generated_content || '';
  let title = `${personalStatement?.program_name || 'Personal Statement'} - ${personalStatement?.institution_name || 'Institution'}`;
  let hasUnsavedChanges = false;
  let saving = false;
  let lastSaved: Date | null = null;
  let wordCount = 0;
  let characterCount = 0;
  let showSaveToast = false;
  
  // Auto-save
  let autoSaveInterval: NodeJS.Timeout;
  let saveTimeout: NodeJS.Timeout;
  
  // Inline editing
  let selectedText = '';
  let showEditPopup = false;
  let editingText = false;
  let popupPosition = { x: 0, y: 0 };
  
  // Personal statement edit options
  const editOptions = [
    { label: 'Make Personal', value: 'make_personal', icon: '❤️' },
    { label: 'More Reflective', value: 'more_reflective', icon: '🤔' },
    { label: 'Add Detail', value: 'add_detail', icon: '📝' },
    { label: 'Concise', value: 'concise', icon: '✂️' }
  ];
  
  onMount(async () => {
    updateWordCount();
    setupTextSelection();
    
    // Set up auto-save every 30 seconds
    autoSaveInterval = setInterval(() => {
      if (hasUnsavedChanges && !saving) {
        saveDocument();
      }
    }, 30000);
  });
  
  onDestroy(() => {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    if (saveTimeout) clearTimeout(saveTimeout);
    document.removeEventListener('mouseup', handleTextSelection);
    document.removeEventListener('click', handleDocumentClick);
    document.removeEventListener('selectionchange', handleSelectionChange);
  });
  
  function setupTextSelection() {
    if (typeof document !== 'undefined') {
      document.addEventListener('mouseup', handleTextSelection);
      document.addEventListener('click', handleDocumentClick);
      document.addEventListener('selectionchange', handleSelectionChange);
    }
  }
  
  function handleDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const personalStatementContent = document.getElementById('personal-statement-content');
    const popup = document.querySelector('.edit-popup');
    
    if (!personalStatementContent?.contains(target) && !popup?.contains(target)) {
      showEditPopup = false;
      selectedText = '';
    }
  }
  
  function handleSelectionChange() {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === '') {
      showEditPopup = false;
      selectedText = '';
    }
  }
  
  function handleTextSelection(event: Event) {
    const selection = window.getSelection();
    
    if (!selection || selection.rangeCount === 0) return;
    
    const textContent = selection.toString().trim();
    if (textContent.length < 5) return;
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    const personalStatementContent = document.getElementById('personal-statement-content');
    if (!personalStatementContent || !personalStatementContent.contains(range.commonAncestorContainer)) {
      return;
    }
    
    popupPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    };
    
    selectedText = textContent;
    showEditPopup = true;
  }
  
  async function handleEditOption(editType: string) {
    if (!selectedText || !personalStatement) return;
    
    editingText = true;
    showEditPopup = false;
    
    try {
      const response = await fetch('/api/edit-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedText,
          editType,
          context: content,
          documentType: 'personal_statement',
          applicationType: personalStatement.application_type
        })
      });
      
      if (!response.ok) throw new Error('Failed to edit text');
      
      const result = await response.json();
      
      // Replace selected text in personal statement content
      content = content.replace(selectedText, result.editedText);
      
      // Force update of the contenteditable div
      const contentDiv = document.getElementById('personal-statement-content');
      if (contentDiv) {
        contentDiv.innerHTML = content.replace(/\n/g, '<br>');
      }
      
      updateWordCount();
      hasUnsavedChanges = true;
      await saveDocument();
      
    } catch (error) {
      console.error('Error editing text:', error);
      alert('Failed to edit text. Please try again.');
    } finally {
      editingText = false;
      clearSelection();
    }
  }
  
  function clearSelection() {
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
    selectedText = '';
    showEditPopup = false;
  }
  
  function updateWordCount() {
    const words = content.trim().split(/\s+/).filter((word: string) => word.length > 0);
    wordCount = words.length;
    characterCount = content.length;
  }
  
  async function saveDocument() {
    if (saving) return;
    
    saving = true;
    
    try {
      const response = await fetch('/api/save-personal-statement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: personalStatement.id,
          personalStatementData: {
            applicationType: personalStatement.application_type,
            programName: personalStatement.program_name,
            institutionName: personalStatement.institution_name,
            applicationDeadline: personalStatement.application_deadline
          },
          generatedContent: content,
          status: 'final'
        })
      });
      
      if (!response.ok) throw new Error('Failed to save');
      
      hasUnsavedChanges = false;
      lastSaved = new Date();
      
      // Show save toast
      showSaveToast = true;
      setTimeout(() => showSaveToast = false, 3000);
      
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save. Please try again.');
    } finally {
      saving = false;
    }
  }
  
  function handleContentChange() {
    hasUnsavedChanges = true;
    updateWordCount();
    
    // Debounced save - save 2 seconds after user stops typing
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      if (hasUnsavedChanges) saveDocument();
    }, 2000);
  }
  
  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(content);
      alert('Personal statement copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy personal statement. Please select and copy manually.');
    }
  }
</script>

<svelte:head>
  <title>{title} - Personal Statement Editor</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 pt-20">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    
    <!-- Header -->
    <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <div class="flex items-center gap-4 text-sm text-gray-600">
            <span>📊 {wordCount} words</span>
            <span>📝 {characterCount} characters</span>
            <span>📋 {personalStatement.application_type.replace('_', ' ').toUpperCase()}</span>
            {#if saving}
              <span class="text-blue-600">💾 Auto-saving...</span>
            {:else if lastSaved}
              <span class="text-green-600">✅ Auto-saved {lastSaved.toLocaleTimeString()}</span>
            {/if}
            {#if hasUnsavedChanges && !saving}
              <span class="text-yellow-600">⚠️ Unsaved changes</span>
            {/if}
          </div>
        </div>
        
        <div class="flex gap-2">
          <button
            onclick={() => goto('/dashboard')}
            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            📋 Back to Dashboard
          </button>
          <button
            onclick={copyToClipboard}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            📎 Copy Personal Statement
          </button>
        </div>
      </div>
    </div>

    <!-- Editing Instructions -->
    <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
      <h3 class="font-semibold text-purple-900 mb-2">📝 Inline Editing Instructions</h3>
      <p class="text-purple-800 text-sm">
        <strong>Highlight any text</strong> in your personal statement to see editing options. 
        Choose from personal narrative improvements, reflective enhancements, detail additions, or concise edits.
      </p>
    </div>

    <!-- Main Editor -->
    <div class="bg-white rounded-lg shadow-sm border">
      <div class="p-8">
        <div
          id="personal-statement-content"
          contenteditable="true"
          bind:textContent={content}
          oninput={handleContentChange}
          class="min-h-96 focus:outline-none text-gray-900 leading-relaxed text-base whitespace-pre-wrap"
          style="line-height: 1.8; font-family: 'Georgia', 'Times New Roman', serif;"
        >
          {content}
        </div>
      </div>
    </div>

    <!-- Personal Statement Writing Tips -->
    <div class="mt-8 bg-white rounded-lg shadow-sm border p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">💡 Personal Statement Tips</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 class="font-medium text-gray-800 mb-2">✅ Do Include</h4>
          <ul class="text-sm text-gray-600 space-y-1">
            <li>• Specific personal experiences and anecdotes</li>
            <li>• Genuine reflection on challenges overcome</li>
            <li>• Clear connection between experiences and goals</li>
            <li>• Unique perspective and authentic voice</li>
            <li>• Concrete examples that demonstrate growth</li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium text-gray-800 mb-2">❌ Avoid</h4>
          <ul class="text-sm text-gray-600 space-y-1">
            <li>• Generic statements or clichés</li>
            <li>• Simply listing achievements or grades</li>
            <li>• Controversial topics without clear relevance</li>
            <li>• Overly dramatic or emotional language</li>
            <li>• Repeating information from other application parts</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Inline Edit Popup -->
{#if showEditPopup}
  <div 
    class="fixed bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-50 edit-popup"
    style="left: {popupPosition.x - 100}px; top: {popupPosition.y - 60}px;"
  >
    <div class="flex gap-1">
      {#each editOptions as option}
        <button
          onclick={() => handleEditOption(option.value)}
          disabled={editingText}
          class="px-3 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 rounded transition-colors disabled:opacity-50"
          title={option.label}
        >
          {option.icon} {option.label}
        </button>
      {/each}
    </div>
  </div>
{/if}

<!-- Loading Overlay -->
{#if editingText}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
    <div class="bg-white rounded-lg p-6 flex items-center gap-3">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
      <span class="text-gray-700">Enhancing your text...</span>
    </div>
  </div>
{/if}

<!-- Save Toast Notification -->
{#if showSaveToast}
  <div class="fixed top-20 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
    <span>✅</span>
    <span>Personal statement saved successfully!</span>
  </div>
{/if}

<style>
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style> 