<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import AIFeatureWidget from '$lib/components/AIFeatureWidget.svelte';
    
    export let existingSOP: string = '';
    export let universityName: string = '';
    export let programName: string = '';
    export let session: any = null;
    
    const dispatch = createEventDispatcher();
    
    let sopText: string = existingSOP;
    let reviewMode: 'quick' | 'detailed' | 'university_specific' = 'detailed';
    let inputMethod: 'paste' | 'upload' | 'existing' = existingSOP ? 'existing' : 'paste';
    let uploadedFile: File | null = null;
    let analysisResult: any = null;
    
    // Authentication state
    let pendingAnalysis = false;
    
    // Text resize functionality
    let textareaExpanded = false;
    let textSize: 'small' | 'medium' | 'large' = 'medium';
    
    // Handle file upload
    async function handleFileUpload(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (file) {
            uploadedFile = file;
            
            if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                const text = await file.text();
                sopText = text;
            } else if (file.type === 'application/pdf') {
                alert('PDF support coming soon! Please copy and paste your text for now.');
            } else {
                alert('Please upload a .txt file or copy and paste your SOP text.');
            }
        }
    }
    
    // Handle successful analysis
    function handleAnalysisSuccess(event: CustomEvent) {
        analysisResult = event.detail.result;
        dispatch('analysisComplete', { result: analysisResult });
    }
    
    // Handle authentication required
    function handleAuthRequired() {
        dispatch('auth');
    }
    
    // Export analysis function
    function exportAnalysis() {
        if (!analysisResult) return;
        
        // Create formatted text document
        let formattedContent = `SOP ANALYSIS REPORT
Generated on: ${new Date().toLocaleDateString()}

=====================================================
DOCUMENT INFORMATION
=====================================================
University: ${universityName || 'Not specified'}
Program: ${programName || 'Not specified'}
Word Count: ${sopText.split(/\s+/).length} words
Review Mode: ${reviewMode}

`;

        // Overall Analysis
        if (analysisResult.overallAnalysis) {
            const overall = analysisResult.overallAnalysis;
            formattedContent += `=====================================================
OVERALL ANALYSIS
=====================================================
Total Score: ${overall.totalScore || 'N/A'}/100
Estimated Impression: ${overall.estimatedImpression ? formatImpression(overall.estimatedImpression) : 'N/A'}

Detailed Scores:
- Readability: ${overall.readabilityScore || 'N/A'}/100
- Coherence: ${overall.coherenceScore || 'N/A'}/100
- Relevance: ${overall.relevanceScore || 'N/A'}/100
- Impact: ${overall.strengthScore || 'N/A'}/100

`;

            // Key Recommendations
            if (overall.recommendations?.length > 0) {
                formattedContent += `KEY RECOMMENDATIONS:
${overall.recommendations.map((rec: any) => `• ${rec}`).join('\n')}

`;
            }

            // Strengths
            if (overall.overallStrengths?.length > 0) {
                formattedContent += `STRENGTHS:
${overall.overallStrengths.map((strength: any) => `✓ ${strength}`).join('\n')}

`;
            }

            // Weaknesses
            if (overall.overallWeaknesses?.length > 0) {
                formattedContent += `AREAS FOR IMPROVEMENT:
${overall.overallWeaknesses.map((weakness: any) => `⚠ ${weakness}`).join('\n')}

`;
            }

            // Critical Issues
            if (overall.criticalIssues?.length > 0) {
                formattedContent += `CRITICAL ISSUES:
${overall.criticalIssues.map((issue: any) => `🚨 ${issue}`).join('\n')}

`;
            }
        }

        // Paragraph Analysis
        if (analysisResult.paragraphAnalyses?.length > 0) {
            formattedContent += `=====================================================
PARAGRAPH-BY-PARAGRAPH ANALYSIS
=====================================================

`;
            analysisResult.paragraphAnalyses.forEach((paragraph: any, index: number) => {
                formattedContent += `PARAGRAPH ${index + 1} ${paragraph.category ? `(${paragraph.category.replace('_', ' ').toUpperCase()})` : ''}
Score: ${paragraph.score || 'N/A'}/100 ${paragraph.importance ? `| Priority: ${paragraph.importance.toUpperCase()}` : ''}

Original Text:
"${paragraph.originalText || 'Not available'}"

`;
                
                if (paragraph.strengths?.length > 0) {
                    formattedContent += `Strengths:
${paragraph.strengths.map((s: any) => `✓ ${s}`).join('\n')}

`;
                }

                if (paragraph.weaknesses?.length > 0) {
                    formattedContent += `Areas to Improve:
${paragraph.weaknesses.map((w: any) => `⚠ ${w}`).join('\n')}

`;
                }

                if (paragraph.suggestions?.length > 0) {
                    formattedContent += `Improvement Suggestions:
${paragraph.suggestions.map((s: any) => `→ ${s}`).join('\n')}

`;
                }

                if (paragraph.improvedText) {
                    formattedContent += `Suggested Improvement:
"${paragraph.improvedText}"

`;
                }

                formattedContent += '---\n\n';
            });
        }

        // Raw analysis fallback
        if (analysisResult.analysis && typeof analysisResult.analysis === 'string') {
            formattedContent += `=====================================================
DETAILED ANALYSIS
=====================================================
${analysisResult.analysis}
`;
        }

        formattedContent += `
=====================================================
EXPORT INFORMATION
=====================================================
Exported from: Abroaducate SOP Reviewer
Timestamp: ${new Date().toISOString()}
Session: ${reviewMode} review mode
`;

        // Create and download the file
        const blob = new Blob([formattedContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SOP_Analysis_Report_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Start new review
    function startNewReview() {
        analysisResult = null;
        sopText = '';
        inputMethod = 'paste';
    }
    
    // Get formatted options for AI widget
    $: reviewOptions = {
        reviewMode,
        universityName: universityName || 'Target University',
        programName: programName || 'Graduate Program'
    };
    
    // Reactive effect to handle session changes
    $: if (session && pendingAnalysis && sopText.trim() && !loading) {
        // User just logged in and has pending analysis, auto-trigger analysis
        pendingAnalysis = false;
        setTimeout(() => {
            analyzeSOP();
        }, 1000); // Delay to ensure session is fully established after redirect
    }
    
    // Calculate stats
    $: paragraphs = sopText.split('\n\n').filter(p => p.trim().length > 0);
    $: wordCount = sopText.split(/\s+/).filter(w => w.length > 0).length;
    
    // Score color helper
    function getScoreColor(score: number): string {
        if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
        if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
        if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    }
    
    // Format impression text
    function formatImpression(impression: string): string {
        return impression.replace('_', ' ').toUpperCase();
    }

    let loading = false;
    let error = '';

    async function analyzeSOP() {
        error = '';
        if (!sopText.trim()) {
            error = 'Please enter your SOP text.';
            return;
        }
        
        // Check if user is authenticated
        if (!session) {
            pendingAnalysis = true;
            dispatch('auth');
            return;
        }
        
        loading = true;
        try {
            const response = await fetch('/api/ai-features', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'sop_review',
                    content: sopText,
                    options: {
                        reviewMode,
                        universityName,
                        programName
                    }
                })
            });
            const data = await response.json();
            if (!response.ok || data.error) {
                error = data.error || 'Failed to analyze SOP.';
                return;
            }
            analysisResult = data.result;
        } catch (e: any) {
            error = e?.message || 'Failed to analyze SOP.';
        } finally {
            loading = false;
        }
    }
</script>

<div class="sop-reviewer">
    <!-- Header -->
    <div class="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-lg">
        <h2 class="text-2xl font-bold mb-2">🔍 SOP Review & Enhancement</h2>
        <p class="opacity-90">Get comprehensive AI-powered analysis with our unified review system</p>
        {#if universityName && programName}
            <div class="mt-3 bg-white/20 rounded-lg p-3">
                <p class="text-sm">🎯 <strong>Target:</strong> {universityName} - {programName}</p>
            </div>
        {/if}
    </div>
    
    <!-- Main Content -->
    <div class="bg-white border-l border-r border-b rounded-b-lg">
        {#if !analysisResult}
            <!-- Input Section -->
            <div class="p-6 border-b">
                <!-- Input Method Selection -->
                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-3">How would you like to provide your SOP?</label>
                    <div class="flex gap-4 flex-wrap">
                        <label class="flex items-center">
                            <input type="radio" bind:group={inputMethod} value="paste" class="mr-2">
                            <span>📝 Copy & Paste</span>
                        </label>
                        <label class="flex items-center">
                            <input type="radio" bind:group={inputMethod} value="upload" class="mr-2">
                            <span>📄 Upload File</span>
                        </label>
                        {#if existingSOP}
                            <label class="flex items-center">
                                <input type="radio" bind:group={inputMethod} value="existing" class="mr-2">
                                <span>✅ Use Current SOP</span>
                            </label>
                        {/if}
                    </div>
                </div>
                
                <!-- File Upload -->
                {#if inputMethod === 'upload'}
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Upload SOP File</label>
                        <input 
                            type="file" 
                            accept=".txt,.pdf,.doc,.docx"
                            onchange={handleFileUpload}
                            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p class="text-xs text-gray-500 mt-1">Supported formats: .txt, .pdf (coming soon)</p>
                    </div>
                {/if}
                
                <!-- Text Input -->
                {#if inputMethod === 'paste' || inputMethod === 'existing'}
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            SOP Text ({wordCount} words, {paragraphs.length} paragraphs)
                        </label>
                        
                        <!-- Helpful Tips -->
                        <div class="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 class="text-sm font-semibold text-blue-800 mb-2">💡 Tips for Better Analysis:</h4>
                            <ul class="text-xs text-blue-700 space-y-1">
                                <li>• <strong>Separate paragraphs clearly:</strong> Add double line breaks between paragraphs</li>
                                <li>• <strong>Ideal length:</strong> 600-800 words (4-6 well-structured paragraphs)</li>
                                <li>• <strong>Structure:</strong> Introduction → Background → Experience → Goals → Conclusion</li>
                                <li>• <strong>Best results:</strong> Each paragraph should focus on one main idea</li>
                            </ul>
                        </div>
                        
                        <div class="relative">
                        <textarea
                            bind:value={sopText}
                            placeholder="Paste your Statement of Purpose here...

💡 For best analysis results, make sure your paragraphs are clearly separated with double line breaks.

Example format:
This is paragraph 1 with my introduction and motivation for applying...

This is paragraph 2 discussing my academic background and relevant coursework...

This is paragraph 3 covering my professional experience and achievements..."
                                class="w-full {textareaExpanded ? 'h-96' : 'h-80'} p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y transition-all duration-300 {
                                    textSize === 'small' ? 'text-sm' : 
                                    textSize === 'large' ? 'text-lg' : 'text-base'
                                }"
                                disabled={inputMethod === 'existing' && !!existingSOP}
                        ></textarea>
                            
                            <!-- Text Control Buttons -->
                            <div class="absolute top-2 right-2 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-1 border border-gray-200">
                                <!-- Text Size Controls -->
                                <div class="flex items-center gap-1">
                                    <button
                                        onclick={() => textSize = 'small'}
                                        class="px-2 py-1 text-xs rounded {textSize === 'small' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'} transition-colors"
                                        title="Small text"
                                    >
                                        A
                                    </button>
                                    <button
                                        onclick={() => textSize = 'medium'}
                                        class="px-2 py-1 text-sm rounded {textSize === 'medium' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'} transition-colors"
                                        title="Medium text"
                                    >
                                        A
                                    </button>
                                    <button
                                        onclick={() => textSize = 'large'}
                                        class="px-2 py-1 text-base rounded {textSize === 'large' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'} transition-colors"
                                        title="Large text"
                                    >
                                        A
                                    </button>
                                </div>
                                
                                <!-- Expand/Collapse Button -->
                                <button
                                    onclick={() => textareaExpanded = !textareaExpanded}
                                    class="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                                    title={textareaExpanded ? 'Collapse textarea' : 'Expand textarea'}
                                >
                                    {textareaExpanded ? '🔽' : '🔼'}
                                </button>
                            </div>
                        </div>
                        
                        <!-- Real-time feedback -->
                        <div class="mt-2 flex items-center justify-between text-xs text-gray-500">
                            <span>
                                {#if wordCount < 400}
                                    ⚠️ Consider adding more content (current: {wordCount} words, ideal: 600-800)
                                {:else if wordCount > 1000}
                                    ⚠️ Consider condensing content (current: {wordCount} words, ideal: 600-800)
                                {:else}
                                    ✅ Good length: {wordCount} words
                                {/if}
                            </span>
                            <span>
                                {#if paragraphs.length < 3}
                                    ⚠️ Add more paragraphs for better structure
                                {:else if paragraphs.length > 7}
                                    ⚠️ Consider combining some paragraphs
                                {:else}
                                    ✅ Good structure: {paragraphs.length} paragraphs
                                {/if}
                            </span>
                        </div>
                    </div>
                {/if}
                
                <!-- Review Mode Selection -->
                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-3">Review Type</label>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label class={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            reviewMode === 'quick' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}>
                            <input type="radio" bind:group={reviewMode} value="quick" class="sr-only">
                            <div class="font-medium text-gray-900">⚡ Quick Review</div>
                            <div class="text-sm text-gray-600">Overall assessment and key suggestions</div>
                        </label>
                        
                        <label class={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            reviewMode === 'detailed' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}>
                            <input type="radio" bind:group={reviewMode} value="detailed" class="sr-only">
                            <div class="font-medium text-gray-900">🔍 Detailed Analysis</div>
                            <div class="text-sm text-gray-600">Paragraph-by-paragraph breakdown</div>
                        </label>
                        
                        <label class={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            reviewMode === 'university_specific' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}>
                            <input type="radio" bind:group={reviewMode} value="university_specific" class="sr-only">
                            <div class="font-medium text-gray-900">🎯 University-Specific</div>
                            <div class="text-sm text-gray-600">Tailored to target university</div>
                        </label>
                    </div>
                </div>

                <!-- Analyze Button (now truly below review type) -->
                <div class="mt-6 text-center">
                    <button
                        class="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold text-lg shadow hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        onclick={analyzeSOP}
                        disabled={loading || !sopText.trim()}
                    >
                        {#if loading}
                            <span class="animate-spin mr-2">🔄</span>Analyzing...
                        {:else}
                            🔍 Analyze My SOP
                        {/if}
                    </button>
                    {#if error}
                        <div class="mt-3 text-red-600 text-sm">{error}</div>
                    {/if}
                </div>
            </div>
            
            <!-- AI Feature Widget for SOP Review -->
            <!-- Removed <AIFeatureWidget ... /> to prevent duplicate blue box -->
        {:else}
            <!-- Analysis Results -->
            <div class="p-6">
                <!-- Overall Score Card -->
                <div class="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6 mb-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-bold text-gray-900">📊 Overall Analysis</h3>
                        <div class="flex items-center gap-4">
                            {#if analysisResult.overallAnalysis?.estimatedImpression}
                                <div class={`px-4 py-2 rounded-full border ${getScoreColor(analysisResult.overallAnalysis.totalScore || 0)}`}>
                                    <span class="font-medium">{formatImpression(analysisResult.overallAnalysis.estimatedImpression)}</span>
                                </div>
                            {/if}
                            {#if analysisResult.overallAnalysis?.totalScore}
                                <div class="text-3xl font-bold text-blue-600">{analysisResult.overallAnalysis.totalScore}/100</div>
                            {/if}
                        </div>
                    </div>
                    
                    <!-- Detailed Metrics -->
                    {#if analysisResult.overallAnalysis}
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div class="text-center">
                                <div class="text-2xl font-bold text-gray-900">{analysisResult.overallAnalysis.readabilityScore || 'N/A'}</div>
                                <div class="text-sm text-gray-600">Readability</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-gray-900">{analysisResult.overallAnalysis.coherenceScore || 'N/A'}</div>
                                <div class="text-sm text-gray-600">Coherence</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-gray-900">{analysisResult.overallAnalysis.relevanceScore || 'N/A'}</div>
                                <div class="text-sm text-gray-600">Relevance</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-gray-900">{analysisResult.overallAnalysis.strengthScore || 'N/A'}</div>
                                <div class="text-sm text-gray-600">Impact</div>
                            </div>
                        </div>
                        
                        <!-- Quick Stats -->
                        <div class="flex flex-wrap gap-4 text-sm text-gray-600">
                            <span>📝 {analysisResult.overallAnalysis.wordCount || wordCount} words</span>
                            <span>📄 {analysisResult.paragraphAnalyses?.length || paragraphs.length} paragraphs</span>
                            <span>⏱️ ~{Math.ceil((analysisResult.overallAnalysis.wordCount || wordCount) / 200)} min read</span>
                        </div>
                    {/if}
                </div>
                
                <!-- Action Buttons -->
                <div class="flex flex-wrap gap-3 mb-6">
                    <button
                        onclick={exportAnalysis}
                        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        📥 Export Analysis
                    </button>
                    <button
                        onclick={startNewReview}
                        class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        🔄 New Review
                    </button>
                </div>
                
                <!-- Analysis Details -->
                <div class="bg-white border rounded-lg p-6">
                    <h4 class="font-bold text-gray-900 mb-4">📋 Detailed Analysis</h4>
                    
                    {#if analysisResult.analysis && typeof analysisResult.analysis === 'string'}
                        <!-- Raw text analysis fallback -->
                        <div class="prose max-w-none text-gray-700">
                            <div class="whitespace-pre-wrap">{analysisResult.analysis}</div>
                        </div>
                    {:else}
                        <!-- Structured analysis display -->
                        <div class="space-y-6">
                            
                            <!-- Overall Feedback -->
                            {#if analysisResult.overallAnalysis?.recommendations?.length > 0}
                                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h5 class="font-bold text-blue-800 mb-3">💡 Key Recommendations</h5>
                                    <ul class="space-y-2">
                                        {#each analysisResult.overallAnalysis.recommendations as recommendation}
                                            <li class="text-sm text-blue-700 flex items-start gap-2">
                                                <span class="text-blue-500 mt-0.5">📌</span>
                                                {recommendation}
                                            </li>
                                        {/each}
                                    </ul>
                                </div>
                            {/if}
                            
                            <!-- Paragraph Analysis -->
                            {#if analysisResult.paragraphAnalyses?.length > 0}
                                <div>
                                    <h5 class="font-bold text-gray-900 mb-4">📝 Paragraph-by-Paragraph Analysis</h5>
                                    <div class="space-y-4">
                                        {#each analysisResult.paragraphAnalyses as paragraph}
                                            <div class="border border-gray-200 rounded-lg overflow-hidden">
                                                <!-- Paragraph Header -->
                                                <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                                    <div class="flex items-center justify-between">
                                                        <div class="flex items-center gap-3">
                                                            <h6 class="font-semibold text-gray-900">
                                                                {#if paragraph.category === 'introduction'}🚀{:else if paragraph.category === 'academic_background'}📚{:else if paragraph.category === 'experience'}💼{:else if paragraph.category === 'goals'}🎯{:else if paragraph.category === 'conclusion'}🏁{:else}📝{/if}
                                                                Paragraph {paragraph.index + 1}
                                                                {#if paragraph.category}
                                                                    <span class="text-sm text-gray-600">({paragraph.category.replace('_', ' ')})</span>
                                                                {/if}
                                                            </h6>
                                                            {#if paragraph.importance}
                                                                <span class={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                    paragraph.importance === 'high' ? 'bg-red-100 text-red-700' :
                                                                    paragraph.importance === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-green-100 text-green-700'
                                                                }`}>
                                                                    {paragraph.importance} priority
                                                                </span>
                                                            {/if}
                                                        </div>
                                                        <div class={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(paragraph.score || 0)}`}>
                                                            {paragraph.score || 'N/A'}/100
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <!-- Paragraph Content -->
                                                <div class="p-4 space-y-4">
                                                    <!-- Original Text Preview -->
                                                    {#if paragraph.originalText}
                                                        <div>
                                                            <strong class="text-gray-700">Original Text:</strong>
                                                            <p class="text-gray-600 italic mt-1 p-3 bg-gray-50 rounded border-l-4 border-gray-300">
                                                                "{paragraph.originalText.length > 200 ? paragraph.originalText.substring(0, 200) + '...' : paragraph.originalText}"
                                                            </p>
                                                        </div>
                                                    {/if}
                                                    
                                                    <!-- Strengths & Suggestions Grid -->
                                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <!-- Strengths -->
                                                        {#if paragraph.strengths?.length > 0}
                                                            <div>
                                                                <strong class="text-green-700 flex items-center gap-1 mb-2">
                                                                    <span>✅</span> Strengths
                                                                </strong>
                                                                <ul class="text-sm space-y-1">
                                                                    {#each paragraph.strengths as strength}
                                                                        <li class="text-green-600 flex items-start gap-2">
                                                                            <span class="text-green-500 mt-0.5">•</span>
                                                                            {strength}
                                                                        </li>
                                                                    {/each}
                                                                </ul>
                                                            </div>
                                                        {/if}
                                                        
                                                        <!-- Weaknesses -->
                                                        {#if paragraph.weaknesses?.length > 0}
                                                            <div>
                                                                <strong class="text-orange-700 flex items-center gap-1 mb-2">
                                                                    <span>⚠️</span> Areas to Improve
                                                                </strong>
                                                                <ul class="text-sm space-y-1">
                                                                    {#each paragraph.weaknesses as weakness}
                                                                        <li class="text-orange-600 flex items-start gap-2">
                                                                            <span class="text-orange-500 mt-0.5">•</span>
                                                                            {weakness}
                                                                        </li>
                                                                    {/each}
                                                                </ul>
                                                            </div>
                                                        {/if}
                                                    </div>
                                                    
                                                    <!-- Suggestions -->
                                                    {#if paragraph.suggestions?.length > 0}
                                                        <div>
                                                            <strong class="text-blue-700 flex items-center gap-1 mb-2">
                                                                <span>💡</span> Improvement Suggestions
                                                            </strong>
                                                            <ul class="text-sm space-y-1">
                                                                {#each paragraph.suggestions as suggestion}
                                                                    <li class="text-blue-600 flex items-start gap-2">
                                                                        <span class="text-blue-500 mt-0.5">→</span>
                                                                        {suggestion}
                                                                    </li>
                                                                {/each}
                                                            </ul>
                                                        </div>
                                                    {/if}
                                                    
                                                    <!-- Improved Text -->
                                                    {#if paragraph.improvedText}
                                                        <div class="mt-4 p-3 bg-green-50 rounded border-l-4 border-green-400">
                                                            <strong class="text-green-700 flex items-center gap-1 mb-2">
                                                                <span>✨</span> Suggested Improvement
                                                            </strong>
                                                            <p class="text-green-700 italic">"{paragraph.improvedText}"</p>
                                                        </div>
                                                    {/if}
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            {:else}
                                <!-- Fallback for JSON display -->
                                <div class="bg-gray-50 p-4 rounded border">
                                    <h5 class="font-bold text-gray-900 mb-2">Analysis Result</h5>
                                    <pre class="text-sm text-gray-700 overflow-auto whitespace-pre-wrap">{JSON.stringify(analysisResult, null, 2)}</pre>
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
                
                <!-- Critical Issues (if available) -->
                {#if analysisResult.overallAnalysis?.criticalIssues?.length > 0}
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                        <h4 class="font-bold text-red-800 mb-2">🚨 Critical Issues to Address</h4>
                        <ul class="space-y-1">
                            {#each analysisResult.overallAnalysis.criticalIssues as issue}
                                <li class="text-sm text-red-700">• {issue}</li>
                            {/each}
                        </ul>
                    </div>
                {/if}
                
                <!-- Strengths & Weaknesses (if available) -->
                {#if analysisResult.overallAnalysis?.overallStrengths || analysisResult.overallAnalysis?.overallWeaknesses}
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        {#if analysisResult.overallAnalysis.overallStrengths?.length > 0}
                            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                                <h4 class="font-bold text-green-800 mb-3">💪 Key Strengths</h4>
                                <ul class="space-y-2">
                                    {#each analysisResult.overallAnalysis.overallStrengths as strength}
                                        <li class="text-sm text-green-700 flex items-start gap-2">
                                            <span class="text-green-500 mt-0.5">✓</span>
                                            {strength}
                                        </li>
                                    {/each}
                                </ul>
                            </div>
                        {/if}
                        
                        {#if analysisResult.overallAnalysis.overallWeaknesses?.length > 0}
                            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h4 class="font-bold text-yellow-800 mb-3">🔧 Areas for Improvement</h4>
                                <ul class="space-y-2">
                                    {#each analysisResult.overallAnalysis.overallWeaknesses as weakness}
                                        <li class="text-sm text-yellow-700 flex items-start gap-2">
                                            <span class="text-yellow-500 mt-0.5">⚠</span>
                                            {weakness}
                                        </li>
                                    {/each}
                                </ul>
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div> 