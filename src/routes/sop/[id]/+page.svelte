<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import type { PageData } from './$types';
    import { formatDistanceToNow, parseISO } from 'date-fns';
import WordCountOptimizer from '$lib/components/WordCountOptimizer.svelte';
import UniversityMatcher from '$lib/components/UniversityMatcher.svelte';
    
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
    let showSOPReadyModal = false;
    
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
    
    onMount(async () => {
        sopId = $page.params.id;
        
        if (!session?.user) {
            goto('/');
            return;
        }
        
        await loadSOP();
        
        // Show "SOP Ready" modal for first-time viewers
        const hasSeenModal = localStorage.getItem(`sop-ready-${sopId}`);
        if (!hasSeenModal) {
            showSOPReadyModal = true;
        }
        
        // Setup text selection detection
        setupTextSelection();
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
            
        } catch (err) {
            console.error('Error loading SOP:', err);
            error = 'Failed to load SOP';
        } finally {
            loading = false;
        }
    }
    
    function setupTextSelection() {
        document.addEventListener('mouseup', handleTextSelection);
        document.addEventListener('touchend', handleTextSelection);
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
        
        // Position popup near selection
        popupPosition = {
            x: rect.left + rect.width / 2,
            y: rect.top - 10
        };
        
        selectedText = textContent;
        showEditPopup = true;
    }
    
    async function handleEditOption(editType: string) {
        if (!selectedText || !sop) return;
        
        editingText = true;
        showEditPopup = false;
        
        try {
            const response = await fetch('/api/edit-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: selectedText,
                    editType,
                    context: sop.content
                })
            });
            
            if (!response.ok) throw new Error('Failed to edit text');
            
            const result = await response.json();
            
            // Replace selected text in SOP content
            sop.content = sop.content.replace(selectedText, result.editedText);
            sop.word_count = sop.content.split(/\s+/).length;
            
            // Save edit to database
            await saveSOP();
            
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
    }
    
    async function recordEdit(originalText: string, editedText: string, editType: string) {
        if (!sop) return;
        
        await supabase
            .from('sop_edits')
            .insert({
                sop_id: sop.id,
                user_id: session?.user?.id,
                original_text: originalText,
                edited_text: editedText,
                edit_type: editType,
                position_start: sop.content.indexOf(originalText),
                position_end: sop.content.indexOf(originalText) + originalText.length
            });
    }
    
    function clearSelection() {
        window.getSelection()?.removeAllRanges();
        selectedText = '';
        showEditPopup = false;
    }
    
    async function copySOP() {
        if (!sop) return;
        
        try {
            await navigator.clipboard.writeText(sop.content);
            alert('SOP copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy:', error);
            alert('Failed to copy SOP. Please select and copy manually.');
        }
    }
    
    function closeSOPReadyModal(dontShowAgain: boolean = false) {
        showSOPReadyModal = false;
        if (dontShowAgain) {
            localStorage.setItem(`sop-ready-${sopId}`, 'seen');
        }
    }
    
    function editSOP() {
        goto(`/sop/${sopId}/edit`);
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
    
    // AI Analysis Functions
    async function runAnalysis(): Promise<void> {
        if (!sop || !sop.content) {
            analysisError = 'No SOP content to analyze';
            return;
        }
        
        analyzing = true;
        analysisError = '';
        analysisResult = null;
        
        try {
            const response = await fetch('/api/analyze-sop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: sop.content,
                    analysisType: selectedAnalysis
                })
            });
            
            const responseData = await response.json();
            
            if (!response.ok) {
                if (response.status === 403 && responseData.upgradeRequired) {
                    analysisError = `${responseData.message} Consider upgrading your plan for more usage.`;
                    return;
                }
                throw new Error(responseData.message || 'Analysis failed');
            }
            
            analysisResult = responseData;
            
        } catch (err: any) {
            analysisError = err.message || 'Failed to analyze text';
            console.error('Analysis error:', err);
        } finally {
            analyzing = false;
        }
    }
    
    function getScoreColor(score: number): string {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    }
    
    // Handle content optimization from WordCountOptimizer
    async function handleContentOptimized(event: CustomEvent) {
        if (!sop) return;
        
        const { optimizedContent, originalWordCount, newWordCount } = event.detail;
        
        // Update SOP content
        const updatedSop = { ...sop };
        updatedSop.content = optimizedContent;
        updatedSop.word_count = newWordCount;
        sop = updatedSop;
        
        // Save to database
        try {
            await saveSOP();
            alert(`Content optimized! Word count changed from ${originalWordCount} to ${newWordCount} words.`);
        } catch (error) {
            console.error('Error saving optimized content:', error);
            alert('Failed to save optimized content. Please try again.');
        }
    }
    
    function getProgressColor(score: number): string {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    }
</script>

<svelte:head>
    <title>{sop ? `${sop.university_name} SOP` : 'Loading SOP'} - SOP Generator</title>
</svelte:head>

<!-- SOP Ready Modal -->
{#if showSOPReadyModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-8 max-w-lg mx-4">
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <h2 class="text-2xl font-bold text-gray-900 mb-4">
                    Your Statement of Purpose is ready! 🎉
                </h2>
                <p class="text-gray-600 mb-4">
                    You can now highlight any text in your SOP to make specific improvements. 
                    Simply select text and choose from editing options like "Make Concise" or "Add Detail".
                </p>
                <div class="flex items-center justify-center gap-2 mb-6">
                    <input 
                        type="checkbox" 
                        id="dontShowAgain" 
                        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label for="dontShowAgain" class="text-sm text-gray-600">
                        Don't show me this again
                    </label>
                </div>
            </div>
            <button
                onclick={() => {
                    const checkbox = document.getElementById('dontShowAgain') as HTMLInputElement;
                    closeSOPReadyModal(checkbox?.checked || false);
                }}
                class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
                Got it!
            </button>
        </div>
    </div>
{/if}

<!-- Edit Popup -->
{#if showEditPopup}
    <div 
        class="fixed z-40 bg-white rounded-lg shadow-xl border p-4"
        style="left: {popupPosition.x - 100}px; top: {popupPosition.y - 60}px;"
    >
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
                            onclick={reviewSOP}
                            class="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors flex items-center gap-2"
                        >
                            🔍 Review SOP
                        </button>
                        <button
                            onclick={editSOP}
                            class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            Edit SOP
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- SOP Content -->
        <div class="max-w-4xl mx-auto px-4 py-8">
            <div class="bg-white rounded-lg shadow-sm p-8">
                <div 
                    id="sop-content"
                    class="prose prose-lg max-w-none leading-relaxed text-gray-800 select-text"
                    style="min-height: 600px; max-height: none; overflow-y: visible;"
                >
                    {#each sop.content.split('\n') as paragraph}
                        {#if paragraph.trim()}
                            <p class="mb-4">{paragraph}</p>
                        {/if}
                    {/each}
                </div>
            </div>
            
            <!-- Word Count Optimization Section -->
            {#if sop}
                <div class="mt-8">
                    <WordCountOptimizer
                        sopContent={sop.content}
                        universityName={sop.university_name}
                        programName={sop.program_name}
                        programType="masters"
                        currentWordCount={sop.word_count || 0}
                        on:contentOptimized={handleContentOptimized}
                    />
                </div>
            {/if}

            <!-- University Matching Section -->
            {#if sop?.form_data}
                <div class="mt-8">
                    <UniversityMatcher 
                        userProfile={{
                            gpa: sop.form_data.academicData?.gpa || '',
                            field: sop.form_data.academicData?.fieldOfStudy || sop.program_name,
                            qualities: sop.form_data.selectedQualities || [],
                            degree_level: 'masters'
                        }}
                    />
                </div>
            {/if}
            
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
            
            <!-- Help Text -->
            <div class="mt-6 p-4 bg-blue-50 rounded-lg">
                <div class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div>
                        <h3 class="font-semibold text-blue-900 mb-1">💡 Pro Tip</h3>
                        <p class="text-blue-800 text-sm">
                            Highlight any text in your SOP to make specific improvements. 
                            You can make sections more concise, add detail, or adjust the tone to match your target program.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div> 