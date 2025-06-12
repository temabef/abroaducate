<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import type { PageData } from './$types';
    import { formatDistanceToNow, parseISO } from 'date-fns';
    import WordCountOptimizer from '$lib/components/WordCountOptimizer.svelte';
    import InlineAIEditor from '$lib/components/InlineAIEditor.svelte';
    import AIFeatureWidget from '$lib/components/AIFeatureWidget.svelte';
    
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
        
        if (!sopContent?.contains(target) && !popup?.contains(target)) {
            showEditPopup = false;
            selectedText = '';
        }
    }
    
    function handleSelectionChange() {
        // Hide popup when selection is cleared
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
    
    // Handle text editing with new unified system
    function handleTextEdited(event: CustomEvent) {
        if (!sop) return;
        
        const { originalText, editedText, editType } = event.detail;
        
        // Replace selected text in SOP content
        sop.content = sop.content.replace(originalText, editedText);
        sop.word_count = sop.content.split(/\s+/).filter(w => w.length > 0).length;
        
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
        // Legacy function - now handled by InlineAIEditor
        // Just trigger the inline editor with the edit type
        showEditPopup = true;
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



<!-- Edit Popup -->
{#if showEditPopup}
    <div 
        class="edit-popup fixed z-40 bg-white rounded-lg shadow-xl border p-4"
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

                    </div>
                </div>
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
            
            <!-- New Inline AI Editor -->
            <InlineAIEditor 
                {selectedText}
                editType="improve"
                context={sop?.content || ''}
                show={showEditPopup}
                position={popupPosition}
                on:textEdited={handleTextEdited}
                on:close={closeInlineEditor}
            />
            
            <!-- SOP Analysis Section -->
            {#if sop && sop.content}
                <div class="mt-8">
                    <h3 class="text-lg font-semibold mb-4">🔍 AI Analysis</h3>
                    
                    <AIFeatureWidget 
                        featureType="sop_review"
                        content={sop.content}
                        options={{
                            universityName: sop.university_name,
                            programName: sop.program_name,
                            reviewMode: selectedAnalysis
                        }}
                        placeholder="SOP content will be analyzed..."
                        buttonText="🔍 Analyze SOP"
                        showUsageInfo={true}
                        on:success={handleAnalysisSuccess}
                    />
                </div>
            {/if}
        </div>
    {/if}
</div> 