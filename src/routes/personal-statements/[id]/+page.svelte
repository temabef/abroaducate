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
  let { personalStatement, supabase, session } = data;
  
  // Editor state
  let content = personalStatement?.generated_content || personalStatement?.content || '';
  let title = `${personalStatement?.program_name || 'Personal Statement'} - ${personalStatement?.institution_name || 'Institution'}`;
  let hasUnsavedChanges = false;
  let saving = false;
  let lastSaved: Date | null = null;
  let wordCount = 0;
  let characterCount = 0;
  let showSaveToast = false;
  let showCopyToast = false;
  
  // Version history with plan-based limits
  let versions: any[] = [];
  let showVersionHistory = false;
  let versionHistoryAllowed = true;
  let versionUpgradeMessage = '';
  let planType = 'free'; // Will be populated from user data
  
  // Auto-save
  let autoSaveInterval: NodeJS.Timeout;
  let saveTimeout: NodeJS.Timeout;
  
  // Inline editing
  let selectedText = '';
  let showEditPopup = false;
  let editingText = false;
  let popupPosition = { x: 0, y: 0 };
  let selectedRange: Range | null = null;
  
  // Personal statement edit options
  const editOptions = [
    { label: 'Make Personal', value: 'make_personal', icon: '❤️' },
    { label: 'More Reflective', value: 'more_reflective', icon: '🤔' },
    { label: 'Add Detail', value: 'add_detail', icon: '📝' },
    { label: 'Concise', value: 'concise', icon: '✂️' }
  ];
  
  // Add state variables for the AI analysis
  let analyzing = false;
  let analysisResult = null;
  let analysisError = '';
  
  onMount(async () => {
    // Check if personalStatement exists
    if (!personalStatement) {
      console.error('Personal statement not found');
      goto('/dashboard');
      return;
    }
    
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
    const target = event.target as HTMLElement;
    const personalStatementContent = document.getElementById('personal-statement-content');
    const popup = document.querySelector('.edit-popup');
    
    if ((!personalStatementContent?.contains(target) || !target.closest('#personal-statement-content')) && 
        (!popup || !popup.contains(target))) {
      showEditPopup = false;
      selectedText = '';
      selectedRange = null;
    }
  }
  
  function handleSelectionChange() {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === '') {
      showEditPopup = false;
      selectedText = '';
      selectedRange = null;
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
    
    // Store the range for precise replacement later
    selectedRange = range.cloneRange();
    
    popupPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    };
    
    selectedText = textContent;
    showEditPopup = true;
  }
  
  async function handleEditOption(editType: string) {
    if (!selectedText || !personalStatement || !selectedRange) return;
    
    // Store the range before we clear the popup/selection
    const rangeToUse = selectedRange.cloneRange();
    
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
      
      // Replace text at exact selected position using DOM Range
      replaceTextInRange(rangeToUse, result.editedText);
      
      // Update the content variable from the DOM
      const contentDiv = document.getElementById('personal-statement-content');
      if (contentDiv) {
        content = contentDiv.textContent || '';
      }
      
      updateWordCount();
      hasUnsavedChanges = true;
      
      // Save document and create version for AI edits (these are significant changes)
      await saveDocumentWithVersion(true);
      
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
      const selection = window.getSelection();
      if (selection) {
        if (selection.removeAllRanges) {
          selection.removeAllRanges();
        } else if (selection.empty) {
          selection.empty();
        }
      }
    }
    selectedText = '';
    selectedRange = null;
    showEditPopup = false;
  }
  
  function replaceTextInRange(range: Range, newText: string) {
    try {
      // Validate the range is still valid
      if (!range || !range.startContainer || !range.endContainer) {
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
        const contentDiv = document.getElementById('personal-statement-content');
        if (contentDiv) {
          contentDiv.textContent = content;
        }
      }
    }
  }
  
  function updateWordCount() {
    const words = content.trim().split(/\s+/).filter((word: string) => word.length > 0);
    wordCount = words.length;
    characterCount = content.length;
  }
  
  async function saveDocument() {
    await saveDocumentWithVersion(false); // false = auto-save (smart versioning)
  }

  async function saveDocumentWithVersion(isSignificantChange = false) {
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
      
      // Create version snapshot
      await createVersionSnapshot(isSignificantChange);
      
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save. Please try again.');
    } finally {
      saving = false;
    }
  }
  
  async function createVersionSnapshot(isSignificantChange = false) {
    if (!personalStatement) return;
    
    try {
      if (!versionHistoryAllowed) {
        console.log('Version history not allowed for this plan/document type');
        return;
      }

      const config: VersionHistoryConfig = {
        planType,
        documentType: 'personal_statement',
        userId: session?.user?.id || ''
      };

      const result = await createVersionSnapshotWithLimits(
        supabase,
        config,
        personalStatement.id,
        content,
        isSignificantChange,
        versions
      );

      if (result.success && result.versionCreated) {
        // Update version number
        await supabase
          .from('personal_statements')
          .update({ version: (personalStatement.version || 0) + 1 })
          .eq('id', personalStatement.id);
          
        personalStatement.version = (personalStatement.version || 0) + 1;
        
        // Refresh version history
        await loadVersionHistoryWithLimits();
        
        console.log(result.message);
      } else if (result.upgradeRequired) {
        versionUpgradeMessage = result.message || '';
      }
      
    } catch (error) {
      console.error('Error creating Personal Statement version snapshot:', error);
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
    if (!personalStatement) return;
    
    try {
      const config: VersionHistoryConfig = {
        planType,
        documentType: 'personal_statement',
        userId: session?.user?.id || ''
      };

      const result = await getVersionHistory(supabase, config, personalStatement.id);
      
      versions = result.versions;
      versionHistoryAllowed = result.hasAccess;
      
      if (result.upgradeMessage) {
        versionUpgradeMessage = result.upgradeMessage;
      }
      
    } catch (error) {
      console.error('Error loading Personal Statement version history:', error);
      versions = [];
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
  
  function copyToClipboard(): void {
    navigator.clipboard.writeText(content)
      .then(() => {
        // Show custom toast instead of alert
        showCopyToast = true;
        setTimeout(() => showCopyToast = false, 3000);
        trackAnalytics('copy_personal_statement');
      })
      .catch(err => {
        console.error('Error copying text: ', err);
        alert('Failed to copy personal statement. Please try again.');
      });
  }
  
  // Add export functionality
  let exporting = false;
  

  
  async function exportToWord(): Promise<void> {
    if (!personalStatement) return;
    exporting = true;
    
    try {
      const response = await fetch('/api/export-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content,
          title: title,
          type: 'personal_statement',
          metadata: {
            author: session?.user?.user_metadata?.full_name || session?.user?.email,
            institution: personalStatement.institution_name,
            program: personalStatement.program_name,
            date: new Date().toLocaleDateString()
          }
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/[^\w\s]/gi, '')}_Personal_Statement.rtf`;
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
  
  // Add analytics tracking function
  async function trackAnalytics(eventType: string): Promise<void> {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          documentType: 'personal_statement',
          documentId: personalStatement.id
        })
      });
    } catch (error) {
      console.error('Error tracking analytics:', error);
    }
  }
  
  // Add the runAnalysis function
  async function runAnalysis(analysisType: string) {
    if (analyzing) return;
    
    analyzing = true;
    analysisError = '';
    
    const resultsDiv = document.getElementById('analysis-results');
    if (resultsDiv) {
      resultsDiv.innerHTML = `
        <div class="flex items-center justify-center p-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span class="text-gray-600">Analyzing your personal statement...</span>
        </div>
      `;
    }
    
    try {
      const response = await fetch('/api/analyze-sop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content,
          analysisType: analysisType,
          documentType: 'personal_statement',
          institutionName: personalStatement.institution_name,
          programName: personalStatement.program_name
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }
      
      const result = await response.json();
      analysisResult = result;
      
      // Display the analysis results
      displayAnalysisResults(analysisType, result);
      
      // Track the analysis event
      trackAnalytics(`analyze_${analysisType}`);
      
    } catch (error: any) {
      console.error('Analysis error:', error);
      analysisError = error.message || 'Failed to analyze personal statement';
      
      if (resultsDiv) {
        resultsDiv.innerHTML = `
          <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-center gap-2 text-red-800">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              ${analysisError}
            </div>
          </div>
        `;
      }
    } finally {
      analyzing = false;
    }
  }
  
  // Function to get appropriate color for scores
  function getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }
  
  // Function to display analysis results
  function displayAnalysisResults(type: string, result: any) {
    const resultsDiv = document.getElementById('analysis-results');
    if (!resultsDiv) return;
    
    let html = '';
    
    if (type === 'comprehensive') {
      html = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="lg:col-span-2 text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div class="text-4xl font-bold ${getScoreColor(result.overall_score)} mb-2">
              ${result.overall_score}%
            </div>
            <div class="text-gray-600">Overall Quality Score</div>
          </div>
          
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <span class="font-medium">Originality</span>
              <span class="${getScoreColor(result.plagiarism.originality_score)}">${result.plagiarism.originality_score}%</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="font-medium">Grammar</span>
              <span class="${getScoreColor(result.grammar.score)}">${result.grammar.score}%</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="font-medium">Tone</span>
              <span class="${getScoreColor(result.tone.score)}">${result.tone.score}%</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="font-medium">Readability</span>
              <span class="${getScoreColor(result.readability.score)}">${result.readability.score}%</span>
            </div>
          </div>
          
          <div class="space-y-3">
            <h4 class="font-semibold">Key Insights</h4>
            <div class="text-sm text-gray-600 space-y-2">
              <div>• Readability Level: ${result.readability.readability_level}</div>
              <div>• Primary Tone: ${result.tone.tone_analysis.primary_tone}</div>
              <div>• Risk Level: ${result.plagiarism.risk_level}</div>
              <div>• Grade Level: ${result.readability.grade_level}</div>
            </div>
          </div>
        </div>
      `;
    } else if (type === 'plagiarism') {
      html = `
        <div class="bg-gray-50 rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">📝 Originality Analysis</h3>
          <div class="text-center mb-4">
            <div class="text-3xl font-bold ${getScoreColor(result.originality_score)} mb-2">
              ${result.originality_score}%
            </div>
            <div class="text-gray-600">Originality Score</div>
          </div>
          <div class="text-center">
            <span class="px-3 py-1 rounded-full text-sm font-medium ${
              result.risk_level === 'low' ? 'bg-green-100 text-green-800' :
              result.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }">
              Risk Level: ${result.risk_level.toUpperCase()}
            </span>
          </div>
        </div>
      `;
    } else if (type === 'grammar') {
      html = `
        <div class="bg-gray-50 rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">✏️ Grammar & Style Analysis</h3>
          <div class="text-center mb-4">
            <div class="text-3xl font-bold ${getScoreColor(result.score)} mb-2">
              ${result.score}%
            </div>
            <div class="text-gray-600">Grammar Score</div>
          </div>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="text-center">
              <div class="font-semibold">${result.errors?.length || 0}</div>
              <div class="text-gray-600">Issues Found</div>
            </div>
            <div class="text-center">
              <div class="font-semibold">${result.readability?.grade_level || 'N/A'}</div>
              <div class="text-gray-600">Grade Level</div>
            </div>
          </div>
        </div>
      `;
    } else if (type === 'tone') {
      html = `
        <div class="bg-gray-50 rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">🎭 Tone Analysis</h3>
          <div class="text-center mb-4">
            <div class="text-3xl font-bold ${getScoreColor(result.score)} mb-2">
              ${result.score}%
            </div>
            <div class="text-gray-600">Tone Score</div>
          </div>
          <div class="space-y-2 text-sm">
            <div>Primary Tone: <strong>${result.tone_analysis?.primary_tone || 'N/A'}</strong></div>
            <div>Confidence: ${result.tone_analysis?.confidence_level || 0}%</div>
          </div>
        </div>
      `;
    } else if (type === 'readability') {
      html = `
        <div class="bg-gray-50 rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">📊 Readability Analysis</h3>
          <div class="text-center mb-4">
            <div class="text-2xl font-bold ${getScoreColor(result.score)} mb-2">
              ${result.readability_level}
            </div>
            <div class="text-gray-600">Readability Level</div>
          </div>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="text-center">
              <div class="font-semibold">${result.statistics?.total_words || 0}</div>
              <div class="text-gray-600">Words</div>
            </div>
            <div class="text-center">
              <div class="font-semibold">${result.statistics?.total_sentences || 0}</div>
              <div class="text-gray-600">Sentences</div>
            </div>
          </div>
        </div>
      `;
    }
    
    resultsDiv.innerHTML = html;
  }

  async function restoreVersion(version: any) {
    if (!personalStatement) return;
    
    if (confirm('Are you sure you want to restore this version? Current changes will be lost.')) {
      content = version.content;
      hasUnsavedChanges = true;
      showVersionHistory = false;
      updateWordCount();
      await saveDocument();
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
          
          <!-- Export Button -->
          <button
            onclick={exportToWord}
            disabled={exporting}
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {#if exporting}
              ⏳ Generating Word...
            {:else}
              📝 Export as Word
            {/if}
          </button>
        </div>
      </div>
      
      <!-- Version History Indicator -->
      <VersionHistoryIndicator
        currentVersionCount={versions.length}
        {planType}
        documentType="personal_statement"
      />
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

    <!-- AI Analysis Section -->
    <div class="mt-8 bg-white rounded-lg shadow-sm border">
      <div class="border-b bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4">
        <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
          🤖 AI Analysis Tools
          <span class="text-sm font-normal text-gray-600">Improve your Personal Statement with advanced AI insights</span>
        </h2>
      </div>
      
      <div class="p-6">
        <!-- Analysis Type Selection -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-3">Choose Analysis Type</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <button 
              class="p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-left transition-all"
              onclick={() => runAnalysis('comprehensive')}
            >
              <div class="font-medium mb-1">🔍 Comprehensive Analysis</div>
              <div class="text-sm text-gray-600">Complete analysis with all features</div>
            </button>
            <button 
              class="p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-left transition-all"
              onclick={() => runAnalysis('plagiarism')}
            >
              <div class="font-medium mb-1">📝 Plagiarism Check</div>
              <div class="text-sm text-gray-600">Check for originality and similar content</div>
            </button>
            <button 
              class="p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-left transition-all"
              onclick={() => runAnalysis('grammar')}
            >
              <div class="font-medium mb-1">✏️ Grammar & Style</div>
              <div class="text-sm text-gray-600">Grammar, spelling, and writing style</div>
            </button>
            <button 
              class="p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-left transition-all"
              onclick={() => runAnalysis('tone')}
            >
              <div class="font-medium mb-1">🎭 Tone Analysis</div>
              <div class="text-sm text-gray-600">Analyze writing tone and personality</div>
            </button>
            <button 
              class="p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-left transition-all"
              onclick={() => runAnalysis('readability')}
            >
              <div class="font-medium mb-1">📊 Readability Score</div>
              <div class="text-sm text-gray-600">Reading difficulty and clarity metrics</div>
            </button>
          </div>
        </div>
        
        <!-- Analysis Results Display -->
        <div id="analysis-results" class="mt-4">
          <!-- Results will be displayed here -->
        </div>
      </div>
    </div>

    <!-- Additional AI Features Card -->
    <div class="mt-8 bg-white rounded-lg shadow-sm border overflow-hidden">
      <div class="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b">
        <h3 class="text-lg font-bold text-gray-900">✨ Looking for More AI Features?</h3>
      </div>
      <div class="p-6">
        <p class="text-gray-700 mb-4">
          Explore our full suite of AI tools including Word Optimization, Grammar Check, 
          and more in our dedicated AI Features section.
        </p>
        <a 
          href="/ai-features-demo" 
          class="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <span>Explore AI Features</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
          </svg>
        </a>
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

<!-- Copy Toast Notification -->
{#if showCopyToast}
  <div class="fixed top-20 right-6 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
    <span>📋</span>
    <span>Personal statement copied to clipboard!</span>
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