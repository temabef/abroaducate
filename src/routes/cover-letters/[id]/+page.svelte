<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { PageData } from './$types';
  import VersionHistoryIndicator from '$lib/components/VersionHistoryIndicator.svelte';
  import { 
    createVersionSnapshot as createVersionSnapshotWithLimits,
    getVersionHistory,
    isVersionHistoryAllowed,
    type VersionHistoryConfig 
  } from '$lib/versionHistory';
  
  export let data: PageData;
  let { coverLetter, supabase, session } = data;
  
  console.log('Cover letter data:', coverLetter);
  console.log('Generated content:', coverLetter?.generated_content);
  
  // Editor state
  let content = coverLetter?.generated_content || '';
  let title = `${coverLetter?.job_title || 'Cover Letter'} - ${coverLetter?.company_name || 'Company'}`;
  let isEditing = false;
  let hasUnsavedChanges = false;
  let saving = false;
  let lastSaved: Date | null = null;
  let wordCount = 0;
  let characterCount = 0;
  let showSaveToast = false;
  let showCopyToast = false;
  
  // Auto-save
  let autoSaveInterval: NodeJS.Timeout;
  let saveTimeout: NodeJS.Timeout;
  
  // Version history with plan-based limits
  let versions: any[] = [];
  let showVersionHistory = false;
  let versionHistoryAllowed = true;
  let versionUpgradeMessage = '';
  let planType = 'free'; // Will be populated from user data
  
  // Inline editing - Professional context
  let selectedText = '';
  let showEditPopup = false;
  let editingText = false;
  let popupPosition = { x: 0, y: 0 };
  let selectedRange: Range | null = null;
  
  // Professional edit options for cover letters
  const editOptions = [
    { label: 'Make Professional', value: 'professional', icon: '💼' },
    { label: 'More Confident', value: 'confident', icon: '💪' },
    { label: 'Industry Focus', value: 'industry', icon: '🎯' },
    { label: 'Concise', value: 'concise', icon: '✂️' }
  ];
  
  onMount(async () => {
    updateWordCount();
    await loadUserPlan();
    await loadVersionHistoryWithLimits();
    setupTextSelection();
    
    // Set up auto-save every 30 seconds
    autoSaveInterval = setInterval(() => {
      if (hasUnsavedChanges && !saving) {
        saveDocument();
      }
    }, 30000);
    
    // Track analytics
    await trackAnalytics('viewed');
  });
  
  onDestroy(() => {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    if (saveTimeout) clearTimeout(saveTimeout);
    document.removeEventListener('mouseup', handleTextSelection);
    document.removeEventListener('touchend', handleTextSelection);
    document.removeEventListener('click', handleDocumentClick);
    document.removeEventListener('selectionchange', handleSelectionChange);
  });
  
      function setupTextSelection() {
        if (typeof document !== 'undefined') {
            document.addEventListener('mouseup', handleTextSelection);
            document.addEventListener('touchend', handleTextSelection);
            document.addEventListener('click', handleDocumentClick);
            document.addEventListener('selectionchange', handleSelectionChange);
        }
    }
  
  function handleDocumentClick(event: Event) {
    // Hide popup when clicking outside the cover letter content or popup
    const target = event.target as HTMLElement;
    const coverLetterContent = document.getElementById('cover-letter-content');
    const popup = document.querySelector('.edit-popup');
    
    if (!coverLetterContent?.contains(target) && !popup?.contains(target)) {
      showEditPopup = false;
      selectedText = '';
      selectedRange = null;
    }
  }
  
  function handleSelectionChange() {
    // Hide popup when selection is cleared
    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === '') {
      showEditPopup = false;
      selectedText = '';
      selectedRange = null;
    }
  }
  
  function handleTextSelection(event: Event) {
    const selection = window.getSelection();
    console.log('Text selection detected:', selection);
    
    if (!selection || selection.rangeCount === 0) {
      console.log('No selection or no ranges');
      return;
    }
    
    const textContent = selection.toString().trim();
    console.log('Selected text:', textContent);
    
    if (textContent.length < 5) {
      console.log('Text too short, minimum 5 characters');
      return; // Reduced minimum selection length for testing
    }
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Check if selection is within cover letter content
    const coverLetterContent = document.getElementById('cover-letter-content');
    if (!coverLetterContent || !coverLetterContent.contains(range.commonAncestorContainer)) {
      console.log('Selection not within cover letter content');
      return;
    }
    
    // Store the range for precise replacement later
    selectedRange = range.cloneRange();
    
    console.log('Showing popup at position:', rect);
    
    // Position popup near selection
    popupPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    };
    
    selectedText = textContent;
    showEditPopup = true;
    console.log('Popup should be visible now');
  }
  
  async function handleEditOption(editType: string) {
    console.log('Starting handleEditOption with:', { editType, selectedText, hasRange: !!selectedRange });
    
    if (!selectedText || !coverLetter || !selectedRange) {
      console.log('Missing required data:', { selectedText: !!selectedText, coverLetter: !!coverLetter, selectedRange: !!selectedRange });
      return;
    }
    
    // Store the range before we clear the popup/selection
    const rangeToUse = selectedRange.cloneRange();
    console.log('Cloned range for editing');
    
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
          documentType: 'cover_letter',
          positionType: coverLetter.position_type
        })
      });
      
      if (!response.ok) throw new Error('Failed to edit text');
      
      const result = await response.json();
      console.log('Got API result:', result);
      
      // Replace text at exact selected position using DOM Range
      console.log('About to replace text with:', result.editedText);
      replaceTextInRange(rangeToUse, result.editedText);
      
      // Update the content variable from the DOM
      const contentDiv = document.getElementById('cover-letter-content');
      if (contentDiv) {
        content = contentDiv.textContent || '';
      }
      
      updateWordCount();
      hasUnsavedChanges = true;
      
      // Save document and create version for AI edits (these are significant changes)
      await saveDocumentWithVersion(true); // true = significant change
      
      // Record edit history
      await recordEdit(selectedText, result.editedText, editType);
      
    } catch (error) {
      console.error('Error editing text:', error);
      alert('Failed to edit text. Please try again.');
    } finally {
      editingText = false;
      clearSelection();
    }
  }
  
  function clearSelection() {
    window.getSelection()?.removeAllRanges();
    selectedText = '';
    selectedRange = null;
    showEditPopup = false;
  }
  
  function replaceTextInRange(range: Range, newText: string) {
    console.log('replaceTextInRange called with:', { newText, rangeValid: !!range });
    
    try {
      // Validate the range is still valid
      if (!range || !range.startContainer || !range.endContainer) {
        console.log('Range validation failed:', { range: !!range, startContainer: !!range?.startContainer, endContainer: !!range?.endContainer });
        throw new Error('Invalid range provided');
      }
      
      // Delete the selected content
      range.deleteContents();
      
      // Create a text node with the new content
      const textNode = document.createTextNode(newText);
      
      // Insert the new text at the selection point
      range.insertNode(textNode);
      
      // Move cursor to end of inserted text
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      
      // Clear the selection
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
        selection.collapseToEnd();
      }
    } catch (error) {
      console.error('Error replacing text in range:', error);
      console.log('Falling back to simple text replacement');
      
      // Fallback: Use simple string replacement
      const firstOccurrence = content.indexOf(selectedText);
      if (firstOccurrence !== -1) {
        content = content.substring(0, firstOccurrence) + 
                 newText + 
                 content.substring(firstOccurrence + selectedText.length);
        
        // Update the DOM manually
        const contentDiv = document.getElementById('cover-letter-content');
        if (contentDiv) {
          contentDiv.textContent = content;
        }
      }
    }
  }
  
  async function recordEdit(originalText: string, editedText: string, editType: string) {
    if (!coverLetter) return;
    
    try {
      await supabase
        .from('cover_letter_analytics')
        .insert({
          user_id: session.user.id,
          cover_letter_id: coverLetter.id,
          action_type: 'inline_edit',
          session_data: {
            edit_type: editType,
            original_text: originalText.substring(0, 100), // Truncate for storage
            edited_text: editedText.substring(0, 100),
            word_count: wordCount
          },
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error recording edit:', error);
    }
  }
  
  function updateWordCount() {
    const words = content.trim().split(/\s+/).filter((word: string) => word.length > 0);
    wordCount = words.length;
    characterCount = content.length;
  }
  
  function handleContentChange(event: Event) {
    const target = event.target as HTMLElement;
    content = target.textContent || '';
    hasUnsavedChanges = true;
    updateWordCount();
    
    // Debounced save - save 2 seconds after user stops typing
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      if (hasUnsavedChanges) saveDocument();
    }, 2000);
  }
  
  async function saveDocument() {
    await saveDocumentWithVersion(false); // false = auto-save (smart versioning)
  }
  
  async function saveDocumentWithVersion(isSignificantChange = false) {
    if (saving) return;
    
    saving = true;
    try {
      const { error } = await supabase
        .from('cover_letters')
        .update({
          generated_content: content,
          word_count: wordCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', coverLetter.id);
      
      if (error) throw error;
      
      hasUnsavedChanges = false;
      lastSaved = new Date();
      
      // Show save toast
      showSaveToast = true;
      setTimeout(() => showSaveToast = false, 3000);
      
      // Create version snapshot 
      await createVersionSnapshot(isSignificantChange);
      await trackAnalytics('edited');
      
    } catch (error) {
      console.error('Error saving cover letter:', error);
      alert('Error saving document. Please try again.');
    } finally {
      saving = false;
    }
  }
  
  async function createVersionSnapshot(isSignificantChange = false) {
    try {
      if (!versionHistoryAllowed) {
        console.log('Version history not allowed for this plan/document type');
        return;
      }

      const config: VersionHistoryConfig = {
        planType,
        documentType: 'cover_letter',
        userId: session?.user?.id || ''
      };

      const result = await createVersionSnapshotWithLimits(
        supabase,
        config,
        coverLetter.id,
        content,
        isSignificantChange,
        versions
      );

      if (result.success && result.versionCreated) {
        // Update version number
        await supabase
          .from('cover_letters')
          .update({ version: coverLetter.version + 1 })
          .eq('id', coverLetter.id);
          
        coverLetter.version += 1;
        
        // Refresh version history
        await loadVersionHistoryWithLimits();
        
        console.log(result.message);
      } else if (result.upgradeRequired) {
        versionUpgradeMessage = result.message || '';
      }
      
    } catch (error) {
      console.error('Error creating version snapshot:', error);
    }
  }
  
  async function loadUserPlan() {
    try {
      const { data: userData } = await supabase
        .from('user_subscriptions')
        .select('plan_type')
        .eq('user_id', session?.user?.id)
        .eq('status', 'active')
        .single();
      
      planType = userData?.plan_type || 'free';
    } catch (error) {
      console.error('Error loading user plan:', error);
      planType = 'free';
    }
  }

  async function loadVersionHistoryWithLimits() {
    try {
      const config: VersionHistoryConfig = {
        planType,
        documentType: 'cover_letter',
        userId: session?.user?.id || ''
      };

      const result = await getVersionHistory(supabase, config, coverLetter.id);
      
      versions = result.versions;
      versionHistoryAllowed = result.hasAccess;
      
      if (result.upgradeMessage) {
        versionUpgradeMessage = result.upgradeMessage;
      }
      
    } catch (error) {
      console.error('Error loading version history:', error);
      versions = [];
    }
  }
  
  async function restoreVersion(version: any) {
    if (confirm('Are you sure you want to restore this version? Current changes will be lost.')) {
      content = version.content;
      hasUnsavedChanges = true;
      showVersionHistory = false;
      updateWordCount();
      await saveDocument();
    }
  }
  
  async function trackAnalytics(eventType: string) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          documentType: 'cover_letter',
          documentId: coverLetter.id
        })
        });
    } catch (error) {
      console.error('Error tracking analytics:', error);
    }
  }
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function getPositionTypeIcon(positionType: string) {
    const icons = {
      academic: '🎓',
      industry: '💼',
      government: '🏛️',
      hybrid: '🔬'
    };
    return icons[positionType as keyof typeof icons] || '📝';
  }
  
  function copyToClipboard() {
    navigator.clipboard.writeText(content).then(() => {
      // Show custom toast instead of alert
      showCopyToast = true;
      setTimeout(() => showCopyToast = false, 3000);
      trackAnalytics('copied');
    }).catch(err => {
      console.error('Error copying text: ', err);
      alert('Failed to copy cover letter. Please try again.');
    });
  }
  
  // Add export functionality
  let exporting = false;
  

  
  async function exportToWord() {
    if (!coverLetter) return;
    exporting = true;
    
    try {
      const response = await fetch('/api/export-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content,
          title: `${coverLetter.job_title} - ${coverLetter.company_name}`,
          type: 'cover_letter',
          metadata: {
            author: session?.user?.user_metadata?.full_name || session?.user?.email,
            company: coverLetter.company_name,
            date: new Date().toLocaleDateString()
          }
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${coverLetter.job_title}_${coverLetter.company_name}_Cover_Letter.rtf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        await trackAnalytics('exported_word');
      } else {
        throw new Error('Failed to export Word document');
      }
    } catch (error) {
      console.error('Error exporting Word:', error);
      alert('Failed to export Word document. Please try again.');
    } finally {
      exporting = false;
    }
  }
</script>

<svelte:head>
  <title>Edit: {title} | Cover Letter Editor</title>
  <meta name="description" content="Edit and refine your cover letter with our advanced editor." />
</svelte:head>

<!-- Edit Popup -->
{#if showEditPopup}
  <div 
    class="edit-popup fixed z-40 bg-white rounded-lg shadow-xl border p-4"
    style="left: {popupPosition.x - 150}px; top: {popupPosition.y - 80}px;"
  >
    <div class="flex items-center gap-2 mb-3 text-sm text-gray-600">
      <span>🪄</span>
      <span>Make this part more...</span>
    </div>
    <div class="flex flex-wrap gap-2">
      {#each editOptions as option}
        <button
          onclick={() => handleEditOption(option.value)}
          class="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-blue-100 rounded-lg transition-colors"
          disabled={editingText}
        >
          <span>{option.icon}</span>
          <span>{option.label}</span>
        </button>
      {/each}
    </div>
    <button
      onclick={clearSelection}
      class="absolute -top-2 -right-2 w-6 h-6 bg-gray-500 text-white rounded-full text-xs hover:bg-gray-600"
    >
      ×
    </button>
  </div>
{/if}

<!-- Loading Overlay -->
{#if editingText}
  <div class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-30">
    <div class="bg-white rounded-lg p-6 flex items-center gap-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="text-gray-700">Improving your text...</span>
    </div>
  </div>
{/if}

<!-- Save Toast Notification -->
{#if showSaveToast}
  <div class="fixed top-20 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
    <span>✅</span>
    <span>Cover letter saved successfully!</span>
  </div>
{/if}

<!-- Copy Toast Notification -->
{#if showCopyToast}
  <div class="fixed top-20 right-6 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
    <span>📋</span>
    <span>Cover letter copied to clipboard!</span>
  </div>
{/if}

<!-- Version History Modal -->
{#if showVersionHistory}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick={() => showVersionHistory = false}>
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-hidden" onclick={(e) => e.stopPropagation()}>
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium text-gray-900">Version History</h3>
          <button onclick={() => showVersionHistory = false} class="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
      </div>
      <div class="overflow-y-auto max-h-64">
        {#each versions as version, index}
          <div class="p-4 border-b border-gray-100 hover:bg-gray-50">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-900">
                  Version {version.version_number}
                </p>
                <p class="text-xs text-gray-500">
                  {formatDate(version.created_at)}
                </p>
                <p class="text-xs text-gray-600 mt-1">
                  {version.changes_summary}
                </p>
              </div>
              <button
                onclick={() => restoreVersion(version)}
                class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Restore
              </button>
            </div>
          </div>
        {:else}
          <div class="p-4 text-center text-gray-500">
            {#if !versionHistoryAllowed}
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="flex items-center gap-2 text-blue-700 mb-2">
                  <span>🔒</span>
                  <span class="font-medium">Version History Unavailable</span>
                </div>
                <p class="text-sm text-blue-600 mb-3">{versionUpgradeMessage}</p>
                <button 
                  onclick={() => window.location.href = '/pricing'}
                  class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Upgrade Plan
                </button>
              </div>
            {:else}
              No version history available
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <div class="bg-white border-b border-gray-200 sticky top-0 z-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between py-4">
        <!-- Breadcrumb & Title -->
        <div class="flex items-center space-x-4">
          <nav class="flex items-center space-x-2 text-sm">
            <a href="/dashboard" class="text-blue-600 hover:text-blue-800">Dashboard</a>
            <span class="text-gray-400">›</span>
            <a href="/dashboard" class="text-blue-600 hover:text-blue-800">Cover Letters</a>
            <span class="text-gray-400">›</span>
            <span class="text-gray-600 font-medium">Edit</span>
          </nav>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex items-center space-x-3">
          <!-- Save Status -->
          <div class="flex items-center space-x-2 text-sm">
            {#if saving}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span class="text-blue-600">Auto-saving...</span>
            {:else if hasUnsavedChanges}
              <div class="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span class="text-orange-600">Unsaved changes</span>
            {:else if lastSaved}
              <div class="w-2 h-2 bg-green-400 rounded-full"></div>
              <span class="text-green-600">Auto-saved {formatDate(lastSaved.toISOString())}</span>
            {/if}
          </div>
          
          <!-- Version History -->
          {#if versionHistoryAllowed}
            <button
              onclick={() => showVersionHistory = !showVersionHistory}
              class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              📊 Versions ({versions.length})
            </button>
          {:else}
            <div class="px-3 py-1.5 text-sm font-medium text-gray-500 bg-gray-50 rounded-md border border-gray-300">
              📊 Versions (Upgrade Required)
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      <!-- Main Editor -->
      <div class="lg:col-span-3">
        <div class="bg-white rounded-lg shadow border border-gray-200">
          <!-- Document Header -->
          <div class="border-b border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                  <span>{getPositionTypeIcon(coverLetter.position_type)}</span>
                  <span>{title}</span>
                </h1>
                <p class="text-gray-600 mt-1">
                  {coverLetter.position_type} position • Created {formatDate(coverLetter.created_at)}
                </p>
              </div>
              <div class="text-right">
                <div class="text-sm text-gray-500">
                  {wordCount} words • {characterCount} characters
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  Version {coverLetter.version} • Status: {coverLetter.status}
                </div>
                <!-- Save Status -->
                <div class="text-xs mt-2">
                  {#if saving}
                    <span class="text-blue-600 font-medium">💾 Auto-saving...</span>
                  {:else if lastSaved}
                    <span class="text-green-600 font-medium">✅ Auto-saved {lastSaved.toLocaleTimeString()}</span>
                  {:else if hasUnsavedChanges}
                    <span class="text-orange-600 font-medium">⚠️ Unsaved changes</span>
                  {/if}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Rich Text Editor -->
          <div class="p-6">
            <div 
              id="cover-letter-content"
              contenteditable="true"
              bind:textContent={content}
              oninput={handleContentChange}
              class="prose prose-lg max-w-none leading-relaxed text-gray-800 select-text p-4 border border-gray-300 rounded-lg min-h-96 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-serif text-base"
              style="white-space: pre-wrap; font-family: 'Georgia', serif; outline: none;"
              data-placeholder="Start writing your cover letter..."
            >
              {content}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Sidebar -->
      <div class="lg:col-span-1 space-y-6">
        
        <!-- Position Details -->
        <div class="bg-white rounded-lg shadow border border-gray-200 p-4">
          <h3 class="font-medium text-gray-900 mb-3">Position Details</h3>
          <div class="space-y-2 text-sm">
            <div>
              <span class="text-gray-500">Job Title:</span>
              <p class="font-medium">{coverLetter.job_title}</p>
            </div>
            <div>
              <span class="text-gray-500">Company:</span>
              <p class="font-medium">{coverLetter.company_name}</p>
            </div>
            <div>
              <span class="text-gray-500">Type:</span>
              <p class="font-medium capitalize">{coverLetter.position_type}</p>
            </div>
            {#if coverLetter.application_deadline}
              <div>
                <span class="text-gray-500">Deadline:</span>
                <p class="font-medium">{new Date(coverLetter.application_deadline).toLocaleDateString()}</p>
              </div>
            {/if}
          </div>
        </div>
        
        <!-- Version Usage -->
        <VersionHistoryIndicator 
          planType={planType}
          currentVersionCount={versions.length}
          documentType="cover_letter"
        />
        
        <!-- Quick Actions -->
        <div class="bg-white rounded-lg shadow border border-gray-200 p-4">
          <h3 class="font-medium text-gray-900 mb-3">Quick Actions</h3>
          <div class="space-y-2">
            <button
              onclick={() => goto('/dashboard')}
              class="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
            >
              📋 Back to Dashboard
            </button>
            <button
              onclick={copyToClipboard}
              class="w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              📎 Copy Cover Letter
            </button>
            <button
              onclick={exportToWord}
              disabled={exporting}
              class="w-full text-left px-3 py-2 text-sm bg-green-50 hover:bg-green-100 rounded-md transition-colors disabled:opacity-50"
            >
              {#if exporting}
                ⏳ Generating Word...
              {:else}
                📝 Export as Word
              {/if}
            </button>
          </div>
        </div>
        
        <!-- Inline Editing Instructions -->
        <div class="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <h3 class="font-medium text-blue-900 mb-2">💡 Inline Editing</h3>
          <p class="text-sm text-blue-800">
            Highlight any text in your cover letter to see professional editing options popup automatically.
          </p>
        </div>
        
        <!-- Additional AI Features Card -->
        <div class="bg-white rounded-lg border overflow-hidden shadow border-gray-200">
          <div class="bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-3 border-b">
            <h3 class="text-sm font-bold text-gray-900">✨ Looking for More AI Features?</h3>
          </div>
          <div class="p-4">
            <p class="text-xs text-gray-700 mb-3">
              Explore our full suite of AI tools including Word Optimization, Grammar Check, 
              and more in our dedicated AI Features section.
            </p>
            <a 
              href="/ai-features-demo" 
              class="inline-flex items-center gap-2 bg-purple-600 text-white px-3 py-1 text-xs rounded-lg hover:bg-purple-700 transition-colors"
            >
              <span>Explore AI Features</span>
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </a>
          </div>
        </div>
        
        <!-- Writing Tips -->
        <div class="bg-white rounded-lg shadow border border-gray-200 p-4">
          <h3 class="font-medium text-gray-900 mb-3">📝 Professional Tips</h3>
          <ul class="text-sm text-gray-600 space-y-2">
            <li>• Keep it concise (300-400 words)</li>
            <li>• Quantify achievements with numbers</li>
            <li>• Match company culture and values</li>
            <li>• Show enthusiasm and genuine interest</li>
            <li>• Highlight transferable skills</li>
            <li>• End with a strong call to action</li>
          </ul>
        </div>
        
      </div>
    </div>
  </div>
</div>

<style>
  @media print {
    .no-print {
      display: none !important;
    }
  }
  
  /* Placeholder styling for contenteditable */
  #cover-letter-content:empty:before {
    content: attr(data-placeholder);
    color: #9CA3AF;
    font-style: italic;
  }
  
  #cover-letter-content:focus:before {
    content: none;
  }
</style> 