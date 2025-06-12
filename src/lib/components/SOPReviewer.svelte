<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import AIFeatureWidget from '$lib/components/AIFeatureWidget.svelte';
    
    export let existingSOP: string = '';
    export let universityName: string = '';
    export let programName: string = '';
    
    const dispatch = createEventDispatcher();
    
    interface ParagraphAnalysis {
        id: number;
        originalText: string;
        score: number;
        strengths: string[];
        weaknesses: string[];
        suggestions: string[];
        improvedText?: string;
        category: 'introduction' | 'academic_background' | 'experience' | 'goals' | 'conclusion' | 'other';
        importance: 'high' | 'medium' | 'low';
    }
    
    interface OverallAnalysis {
        totalScore: number;
        wordCount: number;
        readabilityScore: number;
        coherenceScore: number;
        relevanceScore: number;
        strengthScore: number;
        overallStrengths: string[];
        overallWeaknesses: string[];
        criticalIssues: string[];
        recommendations: string[];
        estimatedImpression: 'excellent' | 'good' | 'fair' | 'needs_improvement';
    }
    
    let sopText: string = existingSOP;
    let analyzing: boolean = false;
    let analysisComplete: boolean = false;
    let paragraphAnalyses: ParagraphAnalysis[] = [];
    let overallAnalysis: OverallAnalysis | null = null;
    let selectedParagraph: number | null = null;
    let showImproved: boolean = false;
    let reviewMode: 'quick' | 'detailed' | 'university_specific' = 'detailed';
    let uploadedFile: File | null = null;
    
    // Input methods
    let inputMethod: 'paste' | 'upload' | 'existing' = existingSOP ? 'existing' : 'paste';
    
    async function handleFileUpload(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (file) {
            uploadedFile = file;
            
            if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                const text = await file.text();
                sopText = text;
            } else if (file.type === 'application/pdf') {
                // For now, show message about PDF support
                alert('PDF support coming soon! Please copy and paste your text for now.');
            } else {
                alert('Please upload a .txt file or copy and paste your SOP text.');
            }
        }
    }
    
    // Handle AI analysis result from new unified system
    function handleAnalysisSuccess(event: CustomEvent) {
        const { result } = event.detail;
        paragraphAnalyses = result.paragraphAnalyses || [];
        overallAnalysis = result.overallAnalysis || null;
        analysisComplete = true;
        analyzing = false;
    }
    
    function selectParagraph(index: number) {
        selectedParagraph = selectedParagraph === index ? null : index;
    }
    
    function getScoreColor(score: number): string {
        if (score >= 80) return 'text-green-600 bg-green-50';
        if (score >= 60) return 'text-yellow-600 bg-yellow-50';
        if (score >= 40) return 'text-orange-600 bg-orange-50';
        return 'text-red-600 bg-red-50';
    }
    
    function getScoreIcon(score: number): string {
        if (score >= 80) return '🟢';
        if (score >= 60) return '🟡';
        if (score >= 40) return '🟠';
        return '🔴';
    }
    
    function getCategoryIcon(category: string): string {
        const icons = {
            introduction: '🚀',
            academic_background: '📚',
            experience: '💼',
            goals: '🎯',
            conclusion: '🏁',
            other: '📝'
        };
        return icons[category as keyof typeof icons] || '📝';
    }
    
    function getImpressionColor(impression: string): string {
        const colors = {
            excellent: 'text-green-600 bg-green-50 border-green-200',
            good: 'text-blue-600 bg-blue-50 border-blue-200',
            fair: 'text-yellow-600 bg-yellow-50 border-yellow-200',
            needs_improvement: 'text-red-600 bg-red-50 border-red-200'
        };
        return colors[impression as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200';
    }
    
    function exportAnalysis() {
        if (!overallAnalysis || !paragraphAnalyses.length) return;
        
        const analysisData = {
            overall: overallAnalysis,
            paragraphs: paragraphAnalyses,
            metadata: {
                university: universityName,
                program: programName,
                reviewMode,
                timestamp: new Date().toISOString(),
                wordCount: sopText.split(/\s+/).length
            }
        };
        
        const blob = new Blob([JSON.stringify(analysisData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sop-analysis-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Calculate paragraph count and word distribution
    $: paragraphs = sopText.split('\n\n').filter(p => p.trim().length > 0);
    $: wordCount = sopText.split(/\s+/).filter(w => w.length > 0).length;
</script>

<div class="sop-reviewer">
    <!-- Header -->
    <div class="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-lg">
        <h2 class="text-2xl font-bold mb-2">🔍 SOP Review & Enhancement</h2>
        <p class="opacity-90">Get comprehensive AI-powered analysis of your Statement of Purpose</p>
        {#if universityName && programName}
            <div class="mt-3 bg-white/20 rounded-lg p-3">
                <p class="text-sm">🎯 <strong>Target:</strong> {universityName} - {programName}</p>
            </div>
        {/if}
    </div>
    
    <!-- Main Content -->
    <div class="bg-white border-l border-r border-b rounded-b-lg">
        <!-- Input Section -->
        {#if !analysisComplete}
            <div class="p-6 border-b">
                <!-- Input Method Selection -->
                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-3">How would you like to provide your SOP?</label>
                    <div class="flex gap-4">
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
                        <textarea
                            bind:value={sopText}
                            placeholder="Paste your Statement of Purpose here..."
                            class="w-full h-80 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                            disabled={inputMethod === 'existing' && !!existingSOP}
                        ></textarea>
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
                
                <!-- AI Analysis Widget -->
                <AIFeatureWidget 
                    featureType="sop_review"
                    content={sopText}
                    options={{
                        universityName: universityName,
                        programName: programName,
                        reviewMode: reviewMode
                    }}
                    placeholder="Paste your Statement of Purpose here..."
                    buttonText="🔍 Analyze My SOP"
                    disabled={sopText.trim().length === 0}
                    on:success={handleAnalysisSuccess}
                />
            </div>
        {/if}
        
        <!-- Analysis Results -->
        {#if analysisComplete && overallAnalysis}
            <div class="p-6">
                <!-- Overall Score Card -->
                <div class="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6 mb-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-bold text-gray-900">📊 Overall Analysis</h3>
                        <div class="flex items-center gap-4">
                            <div class={`px-4 py-2 rounded-full border ${getImpressionColor(overallAnalysis.estimatedImpression)}`}>
                                <span class="font-medium">{overallAnalysis.estimatedImpression.replace('_', ' ').toUpperCase()}</span>
                            </div>
                            <div class="text-3xl font-bold text-blue-600">{overallAnalysis.totalScore}/100</div>
                        </div>
                    </div>
                    
                    <!-- Detailed Metrics -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-gray-900">{overallAnalysis.readabilityScore}</div>
                            <div class="text-sm text-gray-600">Readability</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-gray-900">{overallAnalysis.coherenceScore}</div>
                            <div class="text-sm text-gray-600">Coherence</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-gray-900">{overallAnalysis.relevanceScore}</div>
                            <div class="text-sm text-gray-600">Relevance</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-gray-900">{overallAnalysis.strengthScore}</div>
                            <div class="text-sm text-gray-600">Impact</div>
                        </div>
                    </div>
                    
                    <!-- Quick Stats -->
                    <div class="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span>📝 {overallAnalysis.wordCount} words</span>
                        <span>📄 {paragraphAnalyses.length} paragraphs</span>
                        <span>⏱️ ~{Math.ceil(overallAnalysis.wordCount / 200)} min read</span>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="flex flex-wrap gap-3 mb-6">
                    <button
                        onclick={() => showImproved = !showImproved}
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        {showImproved ? '📝 Show Original' : '✨ Show Improvements'}
                    </button>
                    <button
                        onclick={exportAnalysis}
                        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        📥 Export Analysis
                    </button>
                    <button
                        onclick={() => { analysisComplete = false; sopText = ''; }}
                        class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        🔄 New Review
                    </button>
                </div>
                
                <!-- Critical Issues (if any) -->
                {#if overallAnalysis.criticalIssues.length > 0}
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <h4 class="font-bold text-red-800 mb-2">🚨 Critical Issues to Address</h4>
                        <ul class="space-y-1">
                            {#each overallAnalysis.criticalIssues as issue}
                                <li class="text-sm text-red-700">• {issue}</li>
                            {/each}
                        </ul>
                    </div>
                {/if}
                
                <!-- Overall Strengths & Weaknesses -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 class="font-bold text-green-800 mb-3">💪 Key Strengths</h4>
                        <ul class="space-y-2">
                            {#each overallAnalysis.overallStrengths as strength}
                                <li class="text-sm text-green-700 flex items-start gap-2">
                                    <span class="text-green-500 mt-0.5">✓</span>
                                    {strength}
                                </li>
                            {/each}
                        </ul>
                    </div>
                    
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 class="font-bold text-yellow-800 mb-3">🔧 Areas for Improvement</h4>
                        <ul class="space-y-2">
                            {#each overallAnalysis.overallWeaknesses as weakness}
                                <li class="text-sm text-yellow-700 flex items-start gap-2">
                                    <span class="text-yellow-500 mt-0.5">⚠</span>
                                    {weakness}
                                </li>
                            {/each}
                        </ul>
                    </div>
                </div>
                
                <!-- Paragraph-by-Paragraph Analysis -->
                <div class="space-y-4">
                    <h4 class="text-lg font-bold text-gray-900 mb-4">📋 Paragraph Analysis</h4>
                    
                    {#each paragraphAnalyses as analysis, index}
                        <div class="border border-gray-200 rounded-lg overflow-hidden">
                            <!-- Paragraph Header -->
                            <button
                                onclick={() => selectParagraph(index)}
                                class="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                            >
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <span class="text-lg">{getCategoryIcon(analysis.category)}</span>
                                        <div>
                                            <div class="font-medium text-gray-900">
                                                Paragraph {index + 1} • {analysis.category.replace('_', ' ')}
                                            </div>
                                            <div class="text-sm text-gray-600">
                                                {analysis.originalText.substring(0, 100)}...
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <span class={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(analysis.score)}`}>
                                            {getScoreIcon(analysis.score)} {analysis.score}/100
                                        </span>
                                        <svg 
                                            class={`w-5 h-5 text-gray-400 transition-transform ${selectedParagraph === index ? 'rotate-180' : ''}`}
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                        >
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </div>
                                </div>
                            </button>
                            
                            <!-- Paragraph Details -->
                            {#if selectedParagraph === index}
                                <div class="p-4 border-t border-gray-200">
                                    <!-- Original vs Improved Text -->
                                    <div class="mb-4">
                                        <div class="bg-gray-50 rounded-lg p-4 mb-3">
                                            <h5 class="font-medium text-gray-900 mb-2">
                                                {showImproved && analysis.improvedText ? '✨ Improved Version' : '📝 Original Text'}
                                            </h5>
                                            <p class="text-gray-700 leading-relaxed">
                                                {showImproved && analysis.improvedText ? analysis.improvedText : analysis.originalText}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <!-- Analysis Details -->
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <!-- Strengths -->
                                        <div class="bg-green-50 rounded-lg p-3">
                                            <h6 class="font-medium text-green-800 mb-2">✅ Strengths</h6>
                                            <ul class="space-y-1">
                                                {#each analysis.strengths as strength}
                                                    <li class="text-sm text-green-700">• {strength}</li>
                                                {/each}
                                            </ul>
                                        </div>
                                        
                                        <!-- Weaknesses -->
                                        <div class="bg-red-50 rounded-lg p-3">
                                            <h6 class="font-medium text-red-800 mb-2">❌ Issues</h6>
                                            <ul class="space-y-1">
                                                {#each analysis.weaknesses as weakness}
                                                    <li class="text-sm text-red-700">• {weakness}</li>
                                                {/each}
                                            </ul>
                                        </div>
                                        
                                        <!-- Suggestions -->
                                        <div class="bg-blue-50 rounded-lg p-3">
                                            <h6 class="font-medium text-blue-800 mb-2">💡 Suggestions</h6>
                                            <ul class="space-y-1">
                                                {#each analysis.suggestions as suggestion}
                                                    <li class="text-sm text-blue-700">• {suggestion}</li>
                                                {/each}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
                
                <!-- Recommendations -->
                <div class="mt-8 bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <h4 class="font-bold text-purple-800 mb-4">🎯 Strategic Recommendations</h4>
                    <div class="space-y-3">
                        {#each overallAnalysis.recommendations as recommendation, index}
                            <div class="flex items-start gap-3">
                                <div class="bg-purple-200 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">
                                    {index + 1}
                                </div>
                                <p class="text-purple-700">{recommendation}</p>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    .sop-reviewer {
        max-width: 100%;
        margin: 0 auto;
    }
    
    textarea {
        font-family: 'Georgia', serif;
        line-height: 1.6;
    }
    
    .animate-spin {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
</style>