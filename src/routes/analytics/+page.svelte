<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import type { PageData } from './$types';
    
    export let data: PageData;
    
    let { supabase, session } = data;
    let sopText = '';
    let analyzing = false;
    let analysisResult: any = null;
    let error = '';
    let selectedAnalysis = 'comprehensive';
    
    const analysisOptions = [
        { value: 'comprehensive', label: '🔍 Comprehensive Analysis', description: 'Complete analysis with all features' },
        { value: 'plagiarism', label: '📝 Plagiarism Check', description: 'Check for originality and similar content' },
        { value: 'grammar', label: '✏️ Grammar & Style', description: 'Grammar, spelling, and writing style' },
        { value: 'tone', label: '🎭 Tone Analysis', description: 'Analyze writing tone and personality' },
        { value: 'readability', label: '📊 Readability Score', description: 'Reading difficulty and clarity metrics' }
    ];
    
    onMount(async () => {
        if (!session?.user) {
            goto('/auth/login');
            return;
        }
        
        // Check if user has access to analytics
        const userPlan = await getUserPlan();
        if (userPlan === 'free') {
            goto('/account?upgrade=analytics');
            return;
        }
        
        // Load existing SOP if available
        await loadExistingSOP();
    });
    
    async function getUserPlan(): Promise<string> {
        try {
            const { data } = await supabase
                .from('user_subscriptions')
                .select('plan_type')
                .eq('user_id', session.user.id)
                .eq('status', 'active')
                .single();
            
            return data?.plan_type || 'free';
        } catch (error) {
            return 'free';
        }
    }
    
    async function loadExistingSOP(): Promise<void> {
        try {
            const { data } = await supabase
                .from('sops')
                .select('generated_sop')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            
            if (data?.generated_sop) {
                sopText = data.generated_sop;
            }
        } catch (error) {
            console.log('No existing SOP found');
        }
    }
    
    async function runAnalysis(): Promise<void> {
        if (!sopText.trim()) {
            error = 'Please enter text to analyze';
            return;
        }
        
        analyzing = true;
        error = '';
        analysisResult = null;
        
        try {
            const response = await fetch('/api/analyze-sop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: sopText,
                    analysisType: selectedAnalysis
                })
            });
            
            const responseData = await response.json();
            
            if (!response.ok) {
                if (response.status === 403 && responseData.upgradeRequired) {
                    // Usage limit exceeded
                    error = `${responseData.message} Consider upgrading your plan for more usage.`;
                    return;
                }
                throw new Error(responseData.message || 'Analysis failed');
            }
            
            analysisResult = responseData;
            
        } catch (err: any) {
            error = err.message || 'Failed to analyze text';
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
    
    function getProgressColor(score: number): string {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    }
</script>

<svelte:head>
    <title>SOP Analytics - Advanced Analysis</title>
    <meta name="description" content="Get detailed analytics and insights for your Statement of Purpose" />
</svelte:head>

<div class="analytics-page">
    <div class="analytics-container">
        <!-- Header -->
        <div class="page-header">
            <h1>🔬 SOP Analytics</h1>
            <p>Get comprehensive insights and analysis for your Statement of Purpose</p>
        </div>
        
        <!-- Analysis Type Selection -->
        <div class="analysis-selection">
            <h2>Choose Analysis Type</h2>
            <div class="analysis-grid">
                {#each analysisOptions as option}
                    <button 
                        class="analysis-option"
                        class:selected={selectedAnalysis === option.value}
                        on:click={() => selectedAnalysis = option.value}
                    >
                        <div class="option-label">{option.label}</div>
                        <div class="option-description">{option.description}</div>
                    </button>
                {/each}
            </div>
        </div>
        
        <!-- Text Input -->
        <div class="text-input-section">
            <h2>SOP Text</h2>
            <textarea
                bind:value={sopText}
                placeholder="Paste your Statement of Purpose here for analysis..."
                class="sop-textarea"
                rows="10"
            ></textarea>
            
            <div class="input-actions">
                <button 
                    class="btn-analyze"
                    on:click={runAnalysis}
                    disabled={analyzing || !sopText.trim()}
                >
                    {#if analyzing}
                        <div class="loading-spinner"></div>
                        Analyzing...
                    {:else}
                        🔍 Run Analysis
                    {/if}
                </button>
                
                <div class="word-count">
                    {sopText.split(/\s+/).filter(w => w.length > 0).length} words
                </div>
            </div>
        </div>
        
        <!-- Error Display -->
        {#if error}
            <div class="error-message">
                ⚠️ {error}
            </div>
        {/if}
        
        <!-- Analysis Results -->
        {#if analysisResult}
            <div class="results-section">
                <h2>📊 Analysis Results</h2>
                
                {#if selectedAnalysis === 'comprehensive'}
                    <!-- Comprehensive Results -->
                    <div class="comprehensive-results">
                        <!-- Overall Score -->
                        <div class="overall-score-card">
                            <div class="score-circle">
                                <div class="score-number {getScoreColor(analysisResult.overall_score)}">
                                    {analysisResult.overall_score}
                                </div>
                                <div class="score-label">Overall Score</div>
                            </div>
                            <div class="score-breakdown">
                                <div class="breakdown-item">
                                    <span>Originality</span>
                                    <div class="progress-bar">
                                        <div class="progress {getProgressColor(analysisResult.plagiarism.originality_score)}" 
                                             style="width: {analysisResult.plagiarism.originality_score}%"></div>
                                    </div>
                                    <span class="{getScoreColor(analysisResult.plagiarism.originality_score)}">{analysisResult.plagiarism.originality_score}%</span>
                                </div>
                                <div class="breakdown-item">
                                    <span>Grammar</span>
                                    <div class="progress-bar">
                                        <div class="progress {getProgressColor(analysisResult.grammar.score)}" 
                                             style="width: {analysisResult.grammar.score}%"></div>
                                    </div>
                                    <span class="{getScoreColor(analysisResult.grammar.score)}">{analysisResult.grammar.score}%</span>
                                </div>
                                <div class="breakdown-item">
                                    <span>Tone</span>
                                    <div class="progress-bar">
                                        <div class="progress {getProgressColor(analysisResult.tone.score)}" 
                                             style="width: {analysisResult.tone.score}%"></div>
                                    </div>
                                    <span class="{getScoreColor(analysisResult.tone.score)}">{analysisResult.tone.score}%</span>
                                </div>
                                <div class="breakdown-item">
                                    <span>Readability</span>
                                    <div class="progress-bar">
                                        <div class="progress {getProgressColor(analysisResult.readability.score)}" 
                                             style="width: {analysisResult.readability.score}%"></div>
                                    </div>
                                    <span class="{getScoreColor(analysisResult.readability.score)}">{analysisResult.readability.score}%</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Detailed Analysis Cards -->
                        <div class="analysis-cards-grid">
                            <!-- Plagiarism Card -->
                            <div class="analysis-card">
                                <h3>📝 Originality Analysis</h3>
                                <div class="card-score {getScoreColor(analysisResult.plagiarism.originality_score)}">
                                    {analysisResult.plagiarism.originality_score}% Original
                                </div>
                                <div class="risk-level risk-{analysisResult.plagiarism.risk_level}">
                                    Risk Level: {analysisResult.plagiarism.risk_level.toUpperCase()}
                                </div>
                                {#if analysisResult.plagiarism.similar_phrases.length > 0}
                                    <div class="issues-list">
                                        <h4>Flagged Phrases:</h4>
                                        {#each analysisResult.plagiarism.similar_phrases.slice(0, 3) as phrase}
                                            <div class="issue-item">
                                                "{phrase.text.substring(0, 100)}..."
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                            
                            <!-- Grammar Card -->
                            <div class="analysis-card">
                                <h3>✏️ Grammar & Style</h3>
                                <div class="card-score {getScoreColor(analysisResult.grammar.score)}">
                                    {analysisResult.grammar.score}% Score
                                </div>
                                <div class="stats-grid">
                                    <div class="stat">
                                        <span class="stat-number">{analysisResult.grammar.errors.length}</span>
                                        <span class="stat-label">Issues Found</span>
                                    </div>
                                    <div class="stat">
                                        <span class="stat-number">{analysisResult.grammar.readability.grade_level}</span>
                                        <span class="stat-label">Grade Level</span>
                                    </div>
                                </div>
                                {#if analysisResult.grammar.errors.length > 0}
                                    <div class="issues-list">
                                        <h4>Top Issues:</h4>
                                        {#each analysisResult.grammar.errors.slice(0, 3) as error}
                                            <div class="issue-item">
                                                <span class="error-type">{error.type}</span>
                                                {error.suggestion}
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                            
                            <!-- Tone Card -->
                            <div class="analysis-card">
                                <h3>🎭 Tone Analysis</h3>
                                <div class="card-score {getScoreColor(analysisResult.tone.score)}">
                                    {analysisResult.tone.score}% Score
                                </div>
                                <div class="tone-info">
                                    <div class="tone-primary">
                                        Primary Tone: <strong>{analysisResult.tone.tone_analysis.primary_tone}</strong>
                                    </div>
                                    <div class="confidence">
                                        Confidence: {analysisResult.tone.tone_analysis.confidence_level}%
                                    </div>
                                </div>
                                {#if analysisResult.tone.tone_analysis.personality_traits}
                                    <div class="traits">
                                        <h4>Personality Traits:</h4>
                                        <div class="trait-tags">
                                            {#each analysisResult.tone.tone_analysis.personality_traits as trait}
                                                <span class="trait-tag">{trait}</span>
                                            {/each}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                            
                            <!-- Readability Card -->
                            <div class="analysis-card">
                                <h3>📊 Readability</h3>
                                <div class="card-score {getScoreColor(analysisResult.readability.score)}">
                                    {analysisResult.readability.readability_level}
                                </div>
                                <div class="stats-grid">
                                    <div class="stat">
                                        <span class="stat-number">{analysisResult.readability.statistics.total_words}</span>
                                        <span class="stat-label">Words</span>
                                    </div>
                                    <div class="stat">
                                        <span class="stat-number">{analysisResult.readability.statistics.total_sentences}</span>
                                        <span class="stat-label">Sentences</span>
                                    </div>
                                    <div class="stat">
                                        <span class="stat-number">{analysisResult.readability.statistics.avg_words_per_sentence}</span>
                                        <span class="stat-label">Avg Words/Sentence</span>
                                    </div>
                                    <div class="stat">
                                        <span class="stat-number">{analysisResult.readability.grade_level}</span>
                                        <span class="stat-label">Grade Level</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                {:else}
                    <!-- Single Analysis Results -->
                    <div class="single-analysis-result">
                        {#if selectedAnalysis === 'plagiarism'}
                            <div class="plagiarism-results">
                                <div class="main-score">
                                    <span class="score-large {getScoreColor(analysisResult.originality_score)}">
                                        {analysisResult.originality_score}%
                                    </span>
                                    <span class="score-label">Originality Score</span>
                                </div>
                                <div class="risk-indicator risk-{analysisResult.risk_level}">
                                    Risk Level: {analysisResult.risk_level.toUpperCase()}
                                </div>
                                <!-- More detailed plagiarism results... -->
                            </div>
                        {:else if selectedAnalysis === 'grammar'}
                            <div class="grammar-results">
                                <div class="main-score">
                                    <span class="score-large {getScoreColor(analysisResult.score)}">
                                        {analysisResult.score}%
                                    </span>
                                    <span class="score-label">Grammar Score</span>
                                </div>
                                <!-- Grammar specific results... -->
                            </div>
                        {:else if selectedAnalysis === 'tone'}
                            <div class="tone-results">
                                <div class="main-score">
                                    <span class="score-large {getScoreColor(analysisResult.score)}">
                                        {analysisResult.score}%
                                    </span>
                                    <span class="score-label">Tone Score</span>
                                </div>
                                <!-- Tone specific results... -->
                            </div>
                        {:else if selectedAnalysis === 'readability'}
                            <div class="readability-results">
                                <div class="main-score">
                                    <span class="score-large {getScoreColor(analysisResult.score)}">
                                        {analysisResult.readability_level}
                                    </span>
                                    <span class="score-label">Readability Level</span>
                                </div>
                                <!-- Readability specific results... -->
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    .analytics-page {
        min-height: 100vh;
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        padding: 2rem 0;
    }
    
    .analytics-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 2rem;
    }
    
    .page-header {
        text-align: center;
        margin-bottom: 3rem;
    }
    
    .page-header h1 {
        font-size: 2.5rem;
        font-weight: 700;
        color: #1F2937;
        margin-bottom: 0.5rem;
    }
    
    .page-header p {
        color: #6B7280;
        font-size: 1.1rem;
    }
    
    .analysis-selection {
        background: white;
        border-radius: 1rem;
        padding: 2rem;
        margin-bottom: 2rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    
    .analysis-selection h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1F2937;
        margin-bottom: 1.5rem;
    }
    
    .analysis-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1rem;
    }
    
    .analysis-option {
        background: #F8FAFC;
        border: 2px solid #E2E8F0;
        border-radius: 0.75rem;
        padding: 1.5rem;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: left;
    }
    
    .analysis-option:hover {
        border-color: #667eea;
        background: #F0F4FF;
    }
    
    .analysis-option.selected {
        border-color: #667eea;
        background: linear-gradient(135deg, #667eea20, #764ba220);
    }
    
    .option-label {
        font-size: 1.1rem;
        font-weight: 600;
        color: #1F2937;
        margin-bottom: 0.5rem;
    }
    
    .option-description {
        color: #6B7280;
        font-size: 0.9rem;
    }
    
    .text-input-section {
        background: white;
        border-radius: 1rem;
        padding: 2rem;
        margin-bottom: 2rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    
    .text-input-section h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1F2937;
        margin-bottom: 1rem;
    }
    
    .sop-textarea {
        width: 100%;
        border: 2px solid #E2E8F0;
        border-radius: 0.75rem;
        padding: 1rem;
        font-size: 1rem;
        line-height: 1.6;
        resize: vertical;
        transition: border-color 0.2s ease;
    }
    
    .sop-textarea:focus {
        outline: none;
        border-color: #667eea;
    }
    
    .input-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 1rem;
    }
    
    .btn-analyze {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 0.75rem 2rem;
        border-radius: 0.5rem;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .btn-analyze:hover:not(:disabled) {
        transform: translateY(-2px);
    }
    
    .btn-analyze:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .word-count {
        color: #6B7280;
        font-size: 0.9rem;
    }
    
    .error-message {
        background: #FEF2F2;
        border: 1px solid #FECACA;
        color: #DC2626;
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 2rem;
    }
    
    .results-section {
        background: white;
        border-radius: 1rem;
        padding: 2rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    
    .results-section h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1F2937;
        margin-bottom: 2rem;
    }
    
    .overall-score-card {
        background: linear-gradient(135deg, #667eea10, #764ba210);
        border: 1px solid #E2E8F0;
        border-radius: 1rem;
        padding: 2rem;
        margin-bottom: 2rem;
        display: flex;
        gap: 3rem;
        align-items: center;
    }
    
    .score-circle {
        text-align: center;
        min-width: 120px;
    }
    
    .score-number {
        font-size: 3rem;
        font-weight: 700;
        display: block;
    }
    
    .score-label {
        color: #6B7280;
        font-size: 0.9rem;
        font-weight: 500;
    }
    
    .score-breakdown {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .breakdown-item {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .breakdown-item span:first-child {
        min-width: 80px;
        font-weight: 500;
        color: #374151;
    }
    
    .progress-bar {
        flex: 1;
        height: 8px;
        background: #E5E7EB;
        border-radius: 4px;
        overflow: hidden;
    }
    
    .progress {
        height: 100%;
        transition: width 0.3s ease;
    }
    
    .analysis-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
    }
    
    .analysis-card {
        background: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 0.75rem;
        padding: 1.5rem;
    }
    
    .analysis-card h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1F2937;
        margin-bottom: 1rem;
    }
    
    .card-score {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 1rem;
    }
    
    .risk-level {
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-weight: 600;
        font-size: 0.875rem;
        margin-bottom: 1rem;
    }
    
    .risk-low {
        background: #D1FAE5;
        color: #065F46;
    }
    
    .risk-medium {
        background: #FEF3C7;
        color: #92400E;
    }
    
    .risk-high {
        background: #FEE2E2;
        color: #991B1B;
    }
    
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin-bottom: 1rem;
    }
    
    .stat {
        text-align: center;
    }
    
    .stat-number {
        display: block;
        font-size: 1.5rem;
        font-weight: 700;
        color: #1F2937;
    }
    
    .stat-label {
        font-size: 0.8rem;
        color: #6B7280;
    }
    
    .issues-list h4 {
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;
    }
    
    .issue-item {
        background: white;
        border: 1px solid #E5E7EB;
        border-radius: 0.5rem;
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
    }
    
    .error-type {
        background: #EF4444;
        color: white;
        padding: 0.2rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 600;
        margin-right: 0.5rem;
    }
    
    .tone-info {
        margin-bottom: 1rem;
    }
    
    .tone-primary {
        font-size: 1.1rem;
        margin-bottom: 0.5rem;
        color: #374151;
    }
    
    .confidence {
        color: #6B7280;
    }
    
    .traits h4 {
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;
    }
    
    .trait-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }
    
    .trait-tag {
        background: #667eea;
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.8rem;
        font-weight: 500;
    }
    
    .single-analysis-result {
        text-align: center;
        padding: 3rem 2rem;
    }
    
    .main-score {
        margin-bottom: 2rem;
    }
    
    .score-large {
        font-size: 4rem;
        font-weight: 700;
        display: block;
    }
    
    @media (max-width: 768px) {
        .analytics-container {
            padding: 0 1rem;
        }
        
        .overall-score-card {
            flex-direction: column;
            gap: 2rem;
        }
        
        .analysis-cards-grid {
            grid-template-columns: 1fr;
        }
        
        .breakdown-item {
            flex-direction: column;
            align-items: stretch;
            gap: 0.5rem;
        }
        
        .stats-grid {
            grid-template-columns: 1fr;
        }
    }
</style> 