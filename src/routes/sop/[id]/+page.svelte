<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import type { PageData } from './$types';
    import { formatDistanceToNow, parseISO } from 'date-fns';
    import WordCountOptimizer from '$lib/components/WordCountOptimizer.svelte';
    import AIFeatureWidget from '$lib/components/AIFeatureWidget.svelte';
    import VersionHistoryIndicator from '$lib/components/VersionHistoryIndicator.svelte';
    import { 
        createVersionSnapshot as createVersionSnapshotWithLimits,
        getVersionHistory,
        isVersionHistoryAllowed,
        type VersionHistoryConfig 
    } from '$lib/versionHistory';
    
    export let data: PageData;
    let { supabase, session } = data;
    
    type SOP = {
        id: string;
        university_name: string;
        program_name: string;
        application_deadline: string | null;
        content: string;
        original_content: string;
        status: 'draft' | 'final' | 'submitted';
        application_submitted: boolean;
        created_at: string;
        updated_at: string;
        word_count: number;
        version?: number;
        application_notes?: string;
        submission_date?: string;
        form_data?: any;
    };
    
    let sop: SOP | null = null;
    let loading = true;
    let error = '';
    let selectedText = '';
    let showEditPopup = false;
    let editingText = false;
    let popupPosition = { x: 0, y: 0 };
    let selectedRange: Range | null = null;

    
    // Edit options
    const editOptions = [
        { label: 'Make Concise', value: 'concise', icon: '✂️' },
        { label: 'Add Detail', value: 'detailed', icon: '📝' },
        { label: 'Research Focus', value: 'research', icon: '🔬' },
        { label: 'Academic Tone', value: 'academic', icon: '🎓' },
        { label: 'Technical Style', value: 'technical', icon: '⚙️' }
    ];
    
    let sopId: string;
    
    // Add AI Analysis variables
    let analyzing = false;
    let analysisResult: any = null;
    let analysisError = '';
    let selectedAnalysis = 'comprehensive';
    
    const analysisOptions = [
        { value: 'comprehensive', label: '🔍 Comprehensive Analysis', description: 'Complete analysis with all features' },
        { value: 'plagiarism', label: '📝 Plagiarism Check', description: 'Check for originality and similar content' },
        { value: 'grammar', label: '✏️ Grammar & Style', description: 'Grammar, spelling, and writing style' },
        { value: 'tone', label: '🎭 Tone Analysis', description: 'Analyze writing tone and personality' },
        { value: 'readability', label: '📊 Readability Score', description: 'Reading difficulty and clarity metrics' }
    ];
    
    // Export variables
    let exporting = false;
    let showCopyToast = false;
    
    // Version history with plan-based limits
    let versions: any[] = [];
    let showVersionHistory = false;
    let versionHistoryAllowed = true;
    let versionUpgradeMessage = '';
    let planType = 'free'; // Will be populated from user data
    
    // Content editing variables
    let content = '';
    let saving = false;
    let lastSaved: Date | null = null;
    let hasUnsavedChanges = false;
    let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;
    
    onMount(async () => {
        sopId = $page.params.id;
        
        if (!session?.user) {
            goto('/');
            return;
        }
        
        await loadSOP();
        await loadUserPlan();
        await loadVersionHistoryWithLimits();
        
        // Setup text selection detection
        setupTextSelection();
    });
    
    onDestroy(() => {
        document.removeEventListener('mouseup', handleTextSelection);
        document.removeEventListener('touchend', handleTextSelection);
        document.removeEventListener('click', handleDocumentClick);
        document.removeEventListener('selectionchange', handleSelectionChange);
    });
    
    async function loadSOP() {
        try {
            const { data: sopData, error: sopError } = await supabase
                .from('sops')
                .select('*')
                .eq('id', sopId)
                .eq('user_id', session?.user?.id)
                .single();
                
            if (sopError) {
                error = 'SOP not found or access denied';
                return;
            }
            
            sop = sopData;
            
            if (sop) {
                // Handle both old and new schema - check for content or generated_sop field
                if (!sop.content && (sopData as any).generated_sop) {
                    sop.content = (sopData as any).generated_sop;
                }
                
                // If still no content, show error
                if (!sop.content) {
                    error = 'SOP content not found. Please regenerate your SOP.';
                    return;
                }
                
                // Calculate word count if not stored
                if (!sop.word_count) {
                    sop.word_count = sop.content.split(/\s+/).length;
                }
                
                // Initialize content variable for binding
                content = sop.content;
            }
            
        } catch (err) {
            console.error('Error loading SOP:', err);
            error = 'Failed to load SOP';
        } finally {
            loading = false;
        }
    }
    
    function setupTextSelection() {
        if (typeof document !== 'undefined') {
            document.addEventListener('mouseup', handleTextSelection);
            document.addEventListener('touchend', handleTextSelection);
            document.addEventListener('click', handleDocumentClick);
            document.addEventListener('selectionchange', handleSelectionChange);
        }
    }
    
    function handleDocumentClick(event: Event) {
        // Hide popup when clicking outside the SOP content or popup
        if (typeof document === 'undefined') return;
        const target = event.target as HTMLElement;
        const sopContent = document.getElementById('sop-content');
        const popup = document.querySelector('.edit-popup');
        
        if ((!sopContent?.contains(target) || !target.closest('#sop-content')) && 
            (!popup || !popup.contains(target))) {
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
        if (!selection || selection.rangeCount === 0) return;
        
        const textContent = selection.toString().trim();
        if (textContent.length < 10) return; // Minimum selection length
        
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Check if selection is within SOP content
        const sopContent = document.getElementById('sop-content');
        if (!sopContent || !sopContent.contains(range.commonAncestorContainer)) return;
        
        // Store the range for precise replacement later
        selectedRange = range.cloneRange();
        
        // Position popup near selection
        popupPosition = {
            x: rect.left + rect.width / 2,
            y: rect.top - 10
        };
        
        selectedText = textContent;
        showEditPopup = true;
    }
    
    // Handle text editing with new unified system
    function handleTextEdited(event: CustomEvent) {
        if (!sop) return;
        
        const { originalText, editedText, editType } = event.detail;
        
        // Replace selected text in SOP content
        sop.content = sop.content.replace(originalText, editedText);
                        sop.word_count = sop.content.split(/\s+/).filter((w: string) => w.length > 0).length;
        
        // Save changes
        saveSOP();
        
        // Record edit history
        recordEdit(originalText, editedText, editType);
        
        // Clear selection
        clearSelection();
    }
    
    function closeInlineEditor() {
        showEditPopup = false;
        clearSelection();
    }
    
    async function handleEditOption(editType: string) {
        if (!selectedText || !sop || !selectedRange) return;
        
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
                    context: sop.content,
                    documentType: 'sop',
                    programType: 'academic'
                })
            });
            
            if (!response.ok) throw new Error('Failed to edit text');
            
            const result = await response.json();
            
            // Replace text at exact selected position using DOM Range
            replaceTextInRange(rangeToUse, result.editedText);
            
            // Update the content variable from the DOM
            const sopContent = document.getElementById('sop-content');
            if (sopContent && sop) {
                content = sopContent.textContent || '';
                sop.content = content;
                sop.word_count = content.split(/\s+/).filter((w: string) => w.length > 0).length;
            }
            
            // Save document and create version for AI edits (these are significant changes)
            await saveSOPWithVersion(true); // true = significant change
            
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
    
    async function saveSOP() {
        await saveSOPWithVersion(false); // false = auto-save (smart versioning)
    }
    
    async function saveSOPWithVersion(isSignificantChange = false) {
        if (!sop) return;
        
        const { error } = await supabase
            .from('sops')
            .update({
                content: sop.content,
                word_count: sop.word_count,
                updated_at: new Date().toISOString()
            })
            .eq('id', sop.id);
            
        if (error) {
            console.error('Error saving SOP:', error);
            throw error;
        }
        
        // Create version snapshot 
        await createVersionSnapshot(isSignificantChange);
    }
    
    async function createVersionSnapshot(isSignificantChange = false) {
        if (!sop) return;
        
        try {
            console.log('📝 Creating version snapshot for SOP:', {
                sopId: sop.id,
                contentLength: sop.content.length,
                isSignificantChange,
                currentVersions: versions.length,
                planType,
                versionHistoryAllowed
            });

            if (!versionHistoryAllowed) {
                console.log('Version history not allowed for this plan/document type');
                return;
            }

            const config: VersionHistoryConfig = {
                planType,
                documentType: 'sop',
                userId: session?.user?.id || ''
            };

            const result = await createVersionSnapshotWithLimits(
                supabase,
                config,
                sop.id,
                sop.content,
                isSignificantChange,
                versions
            );

            console.log('✅ Version creation result:', result);

            if (result.success && result.versionCreated) {
                // Update version number
                await supabase
                    .from('sops')
                    .update({ version: (sop.version || 0) + 1 })
                    .eq('id', sop.id);
                    
                sop.version = (sop.version || 0) + 1;
                
                // Refresh version history
                await loadVersionHistoryWithLimits();
                
                console.log(result.message);
            } else if (result.upgradeRequired) {
                versionUpgradeMessage = result.message || '';
            }
            
        } catch (error) {
            console.error('Error creating SOP version snapshot:', error);
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
        if (!sop) return;
        
        try {
            console.log('🔍 Loading version history for SOP:', {
                sopId: sop.id,
                planType,
                userId: session?.user?.id
            });

            const config: VersionHistoryConfig = {
                planType,
                documentType: 'sop',
                userId: session?.user?.id || ''
            };

            const result = await getVersionHistory(supabase, config, sop.id);
            
            console.log('📊 Version history result:', {
                versionsCount: result.versions.length,
                hasAccess: result.hasAccess,
                upgradeMessage: result.upgradeMessage,
                versions: result.versions
            });
            
            versions = result.versions;
            versionHistoryAllowed = result.hasAccess;
            
            if (result.upgradeMessage) {
                versionUpgradeMessage = result.upgradeMessage;
            }
            
        } catch (error) {
            console.error('Error loading SOP version history:', error);
            versions = [];
        }
    }

    async function restoreVersion(version: any) {
        if (!sop) return;
        
        if (confirm('Are you sure you want to restore this version? Current changes will be lost.')) {
            content = version.content;
            sop.content = content;
            sop.word_count = content.split(/\s+/).filter((w: string) => w.length > 0).length;
            showVersionHistory = false;
            await saveSOP();
        }
    }
    
    async function recordEdit(originalText: string, editedText: string, editType: string) {
        if (!sop) return;
        
        try {
            await supabase
                .from('sop_edits')
                .insert({
                    sop_id: sop.id,
                    user_id: session?.user?.id,
                    original_text: originalText.substring(0, 100), // Truncate for storage
                    edited_text: editedText.substring(0, 100),
                    edit_type: editType,
                    created_at: new Date().toISOString()
                });
        } catch (error) {
            console.error('Error recording edit:', error);
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

    function handleContentChange() {
        if (!sop) return;
        
        // Update the SOP content
        sop.content = content;
        sop.word_count = content.split(/\s+/).filter((w: string) => w.length > 0).length;
        
        hasUnsavedChanges = true;
        
        // Clear existing timeout
        if (autoSaveTimeout) {
            clearTimeout(autoSaveTimeout);
        }
        
        // Set new auto-save timeout
        autoSaveTimeout = setTimeout(async () => {
            await autoSaveSOP();
        }, 2000); // Auto-save after 2 seconds of inactivity
    }
    
    async function autoSaveSOP() {
        if (!sop || !hasUnsavedChanges) return;
        
        saving = true;
        try {
            await saveSOP();
            lastSaved = new Date();
            hasUnsavedChanges = false;
        } catch (error) {
            console.error('Auto-save failed:', error);
        } finally {
            saving = false;
        }
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
            if (sop) {
                const firstOccurrence = sop.content.indexOf(selectedText);
                if (firstOccurrence !== -1) {
                    sop.content = sop.content.substring(0, firstOccurrence) + 
                                 newText + 
                                 sop.content.substring(firstOccurrence + selectedText.length);
                    
                    // Update the DOM manually
                    const sopContent = document.getElementById('sop-content');
                    if (sopContent) {
                        sopContent.textContent = sop.content;
                    }
                }
            }
        }
    }
    
    async function copySOP() {
        if (!sop) return;
        
        try {
            // Use the current content from the editor
            await navigator.clipboard.writeText(content || sop.content);
            // Show custom toast instead of alert
            showCopyToast = true;
            setTimeout(() => showCopyToast = false, 3000);
        } catch (error) {
            console.error('Failed to copy:', error);
            alert('Failed to copy SOP. Please select and copy manually.');
        }
    }
    
    function reviewSOP() {
        if (!sop) return;
        
        // Create URL with pre-populated parameters
        const params = new URLSearchParams({
            sop: sop.content || '',
            university: sop.university_name || '',
            program: sop.program_name || ''
        });
        
        goto(`/sop-review?${params.toString()}`);
    }
    
    function backToDashboard() {
        goto('/dashboard');
    }
    
    // AI Analysis Functions - Now using unified system
    function handleAnalysisSuccess(event: CustomEvent) {
        const { result } = event.detail;
        analysisResult = result;
        analysisError = '';
        analyzing = false;
    }
    
    function handleAnalysisError() {
        analysisError = 'Analysis failed. Please try again.';
        analyzing = false;
    }
    
    function getScoreColor(score: number): string {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    }
    
    // Handle content optimization from WordCountOptimizer
    function handleContentOptimized(event: CustomEvent) {
        if (!sop) return;
        
        const { optimizedContent } = event.detail;
        sop.content = optimizedContent;
        sop.word_count = optimizedContent.split(/\s+/).filter((w: string) => w.length > 0).length;
        
        // Save the optimized content
        saveSOP();
    }
    
    function getProgressColor(score: number): string {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    }

    
    
    async function exportSOPToWord() {
        if (!sop) return;
        exporting = true;
        
        try {
            const response = await fetch('/api/export-word', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: content || sop.content,
                    title: `${sop.university_name} - ${sop.program_name} SOP`,
                    type: 'sop',
                    metadata: {
                        author: session?.user?.user_metadata?.full_name || session?.user?.email,
                        institution: sop.university_name,
                        program: sop.program_name,
                        date: new Date().toLocaleDateString()
                    }
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${sop.university_name}_${sop.program_name}_SOP.rtf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
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

    // Add a function to run analysis
    async function runAnalysis() {
        if (!sop || analyzing) return;
        
        analyzing = true;
        analysisError = '';
        
        try {
            // Call the appropriate analysis endpoint based on selected analysis type
            const response = await fetch('/api/analyze-sop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: content || sop.content,
                    analysisType: selectedAnalysis,
                    universityName: sop.university_name,
                    programName: sop.program_name
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Analysis failed');
            }
            
            const result = await response.json();
            analysisResult = result;
            
        } catch (error: any) {
            console.error('Analysis error:', error);
            analysisError = error.message || 'Failed to analyze SOP';
        } finally {
            analyzing = false;
        }
    }
</script>

<svelte:head>
    <title>{sop ? `${sop.university_name} SOP` : 'Loading SOP'} - SOP Generator</title>
</svelte:head>

<!-- Edit Popup -->
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
                    class="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors disabled:opacity-50"
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
    <div class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-30">
        <div class="bg-white rounded-lg p-6 flex items-center gap-4">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="text-gray-700">Improving your text...</span>
        </div>
    </div>
{/if}

<div class="min-h-screen bg-gray-50 pt-20">
    {#if loading}
        <div class="flex justify-center items-center py-20">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    {:else if error}
        <div class="max-w-4xl mx-auto px-4 py-8">
            <div class="text-center">
                <h1 class="text-2xl font-bold text-red-600 mb-4">Error</h1>
                <p class="text-gray-600 mb-6">{error}</p>
                <button
                    onclick={backToDashboard}
                    class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    {:else if sop}
        <!-- Header -->
        <div class="bg-white shadow-sm border-b">
            <div class="max-w-4xl mx-auto px-4 py-6">
                <div class="flex justify-between items-start">
                    <div>
                        <button
                            onclick={backToDashboard}
                            class="text-blue-600 hover:text-blue-700 mb-2 flex items-center gap-2"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                            Back to Dashboard
                        </button>
                        <h1 class="text-3xl font-bold text-gray-900">{sop.university_name}</h1>
                        <p class="text-gray-600">{sop.program_name}</p>
                        <div class="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>{sop.word_count} words</span>
                            <span>•</span>
                            <span>Updated {formatDistanceToNow(parseISO(sop.updated_at), { addSuffix: true })}</span>
                            {#if sop.application_deadline}
                                <span>•</span>
                                <span>Deadline: {new Date(sop.application_deadline).toLocaleDateString()}</span>
                            {/if}
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <button
                            onclick={copySOP}
                            class="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                            </svg>
                            Copy SOP
                        </button>
                        <button
                            onclick={exportSOPToWord}
                            disabled={exporting}
                            class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {#if exporting}
                                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Generating...
                            {:else}
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                </svg>
                                📝 Export as Word
                            {/if}
                        </button>
                        <button
                            onclick={reviewSOP}
                            class="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors flex items-center gap-2"
                        >
                            🔍 Review SOP
                        </button>
                    </div>
                </div>
                
                <!-- Version History Indicator -->
                <VersionHistoryIndicator
                    currentVersionCount={versions.length}
                    {planType}
                    documentType="sop"
                />
            </div>
        </div>
        
        <!-- Inline Editing Instructions -->
        <div class="max-w-4xl mx-auto px-4 pt-6">
            <div class="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-6">
                <h3 class="font-medium text-blue-900 mb-2 flex items-center gap-2">
                    💡 Inline Editing Available
                </h3>
                <p class="text-sm text-blue-800">
                    Highlight any text in your SOP below to see academic editing options popup automatically. Choose from options like "Make Concise", "Add Detail", "Research Focus", or "Academic Tone".
                </p>
            </div>
        </div>
        
        <!-- SOP Content -->
        <div class="max-w-4xl mx-auto px-4 py-8">
            <div class="bg-white rounded-lg shadow-sm p-8">
                <div 
                    id="sop-content"
                    contenteditable="true"
                    bind:textContent={content}
                    oninput={handleContentChange}
                    class="prose prose-lg max-w-none leading-relaxed text-gray-800 select-text p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style="min-height: 600px; max-height: none; overflow-y: visible; white-space: pre-wrap; outline: none;"
                    data-placeholder="Your SOP content will appear here..."
                >
                    {content}
                </div>
            </div>
            
            <!-- AI Analysis Section -->
            <div class="mt-8 bg-white rounded-lg shadow-sm border">
                <div class="border-b bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4">
                    <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                        🤖 AI Analysis Tools
                        <span class="text-sm font-normal text-gray-600">Improve your SOP with advanced AI insights</span>
                    </h2>
                </div>
                
                <div class="p-6">
                    <!-- Analysis Type Selection -->
                    <div class="mb-6">
                        <h3 class="text-lg font-semibold mb-3">Choose Analysis Type</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {#each analysisOptions as option}
                                <button 
                                    class={`p-3 rounded-lg border text-left transition-all ${
                                        selectedAnalysis === option.value
                                            ? 'border-blue-500 bg-blue-50 text-blue-900'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                    onclick={() => selectedAnalysis = option.value}
                                >
                                    <div class="font-medium mb-1">{option.label}</div>
                                    <div class="text-sm text-gray-600">{option.description}</div>
                                </button>
                            {/each}
                        </div>
                    </div>
                    
                    <!-- Analysis Button -->
                    <div class="mb-6">
                        <button 
                            class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            onclick={runAnalysis}
                            disabled={analyzing}
                        >
                            {#if analyzing}
                                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Analyzing...
                            {:else}
                                🔍 Run Analysis
                            {/if}
                        </button>
                    </div>
                    
                    <!-- Error Display -->
                    {#if analysisError}
                        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div class="flex items-center gap-2 text-red-800">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                {analysisError}
                            </div>
                        </div>
                    {/if}
                    
                    <!-- Analysis Results -->
                    {#if analysisResult}
                        <div class="space-y-6">
                            {#if selectedAnalysis === 'comprehensive'}
                                <!-- Comprehensive Analysis Results -->
                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <!-- Overall Score -->
                                    <div class="lg:col-span-2 text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                                        <div class="text-4xl font-bold {getScoreColor(analysisResult.overall_score)} mb-2">
                                            {analysisResult.overall_score}%
                                        </div>
                                        <div class="text-gray-600">Overall SOP Quality Score</div>
                                    </div>
                                    
                                    <!-- Individual Scores -->
                                    <div class="space-y-4">
                                        <div class="flex justify-between items-center">
                                            <span class="font-medium">Originality</span>
                                            <span class="{getScoreColor(analysisResult.plagiarism.originality_score)}">{analysisResult.plagiarism.originality_score}%</span>
                                        </div>
                                        <div class="flex justify-between items-center">
                                            <span class="font-medium">Grammar</span>
                                            <span class="{getScoreColor(analysisResult.grammar.score)}">{analysisResult.grammar.score}%</span>
                                        </div>
                                        <div class="flex justify-between items-center">
                                            <span class="font-medium">Tone</span>
                                            <span class="{getScoreColor(analysisResult.tone.score)}">{analysisResult.tone.score}%</span>
                                        </div>
                                        <div class="flex justify-between items-center">
                                            <span class="font-medium">Readability</span>
                                            <span class="{getScoreColor(analysisResult.readability.score)}">{analysisResult.readability.score}%</span>
                                        </div>
                                    </div>
                                    
                                    <!-- Quick Insights -->
                                    <div class="space-y-3">
                                        <h4 class="font-semibold">Key Insights</h4>
                                        <div class="text-sm text-gray-600 space-y-2">
                                            <div>• Readability Level: {analysisResult.readability.readability_level}</div>
                                            <div>• Primary Tone: {analysisResult.tone.tone_analysis.primary_tone}</div>
                                            <div>• Risk Level: {analysisResult.plagiarism.risk_level}</div>
                                            <div>• Grade Level: {analysisResult.readability.grade_level}</div>
                                        </div>
                                    </div>
                                </div>
                            {:else}
                                <!-- Single Analysis Results -->
                                <div class="bg-gray-50 rounded-lg p-6">
                                    {#if selectedAnalysis === 'plagiarism'}
                                        <h3 class="text-lg font-semibold mb-4">📝 Originality Analysis</h3>
                                        <div class="text-center mb-4">
                                            <div class="text-3xl font-bold {getScoreColor(analysisResult.originality_score)} mb-2">
                                                {analysisResult.originality_score}%
                                            </div>
                                            <div class="text-gray-600">Originality Score</div>
                                        </div>
                                        <div class="text-center">
                                            <span class={`px-3 py-1 rounded-full text-sm font-medium ${
                                                analysisResult.risk_level === 'low' ? 'bg-green-100 text-green-800' :
                                                analysisResult.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                Risk Level: {analysisResult.risk_level.toUpperCase()}
                                            </span>
                                        </div>
                                    {:else if selectedAnalysis === 'grammar'}
                                        <h3 class="text-lg font-semibold mb-4">✏️ Grammar & Style Analysis</h3>
                                        <div class="text-center mb-4">
                                            <div class="text-3xl font-bold {getScoreColor(analysisResult.score)} mb-2">
                                                {analysisResult.score}%
                                            </div>
                                            <div class="text-gray-600">Grammar Score</div>
                                        </div>
                                        <div class="grid grid-cols-2 gap-4 text-sm">
                                            <div class="text-center">
                                                <div class="font-semibold">{analysisResult.errors.length}</div>
                                                <div class="text-gray-600">Issues Found</div>
                                            </div>
                                            <div class="text-center">
                                                <div class="font-semibold">{analysisResult.readability.grade_level}</div>
                                                <div class="text-gray-600">Grade Level</div>
                                            </div>
                                        </div>
                                    {:else if selectedAnalysis === 'tone'}
                                        <h3 class="text-lg font-semibold mb-4">🎭 Tone Analysis</h3>
                                        <div class="text-center mb-4">
                                            <div class="text-3xl font-bold {getScoreColor(analysisResult.score)} mb-2">
                                                {analysisResult.score}%
                                            </div>
                                            <div class="text-gray-600">Tone Score</div>
                                        </div>
                                        <div class="space-y-2 text-sm">
                                            <div>Primary Tone: <strong>{analysisResult.tone_analysis.primary_tone}</strong></div>
                                            <div>Confidence: {analysisResult.tone_analysis.confidence_level}%</div>
                                        </div>
                                    {:else if selectedAnalysis === 'readability'}
                                        <h3 class="text-lg font-semibold mb-4">📊 Readability Analysis</h3>
                                        <div class="text-center mb-4">
                                            <div class="text-2xl font-bold {getScoreColor(analysisResult.score)} mb-2">
                                                {analysisResult.readability_level}
                                            </div>
                                            <div class="text-gray-600">Readability Level</div>
                                        </div>
                                        <div class="grid grid-cols-2 gap-4 text-sm">
                                            <div class="text-center">
                                                <div class="font-semibold">{analysisResult.statistics.total_words}</div>
                                                <div class="text-gray-600">Words</div>
                                            </div>
                                            <div class="text-center">
                                                <div class="font-semibold">{analysisResult.statistics.total_sentences}</div>
                                                <div class="text-gray-600">Sentences</div>
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
            </div>
            
            <!-- Additional AI Features Card -->
            <div class="mt-8 bg-white rounded-lg shadow-sm border overflow-hidden">
                <div class="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b">
                    <h3 class="text-lg font-bold text-gray-900">✨ Looking for More AI Features?</h3>
                </div>
                <div class="p-6">
                    <p class="text-gray-700 mb-4">
                        Explore our full suite of AI tools including Word Optimization, SOP Review, 
                        Grammar Check, and more in our dedicated AI Features section.
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


        </div>
    {/if}
</div>

<!-- Copy Toast Notification -->
{#if showCopyToast}
  <div class="fixed top-20 right-6 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
    <span>📋</span>
    <span>SOP copied to clipboard!</span>
  </div>
{/if}

<style>
  /* Placeholder styling for contenteditable */
  #sop-content:empty:before {
    content: attr(data-placeholder);
    color: #9CA3AF;
    font-style: italic;
  }
  
  #sop-content:focus:before {
    content: none;
  }
</style> 