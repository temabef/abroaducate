<script lang="ts">
    import AIFeatureWidget from '$lib/components/AIFeatureWidget.svelte';
    
    let sampleSOPText = `As a computer science undergraduate with a deep passion for artificial intelligence and machine learning, I am writing to express my strong interest in pursuing a Master's degree in Computer Science at Stanford University. My academic journey and research experiences have prepared me to contribute meaningfully to Stanford's renowned AI research community.

During my undergraduate studies at UC Berkeley, I maintained a 3.8 GPA while focusing on machine learning, algorithms, and data structures.`;

    let sampleCoverLetterText = `Dear Hiring Manager,

I am writing to express my strong interest in the Software Engineer position at Google. With my background in computer science and passion for building scalable systems, I am excited about the opportunity to contribute.`;

    // Add interactive state management
    let selectedCategory = $state('all');
    let showUsageComparison = $state(false);
</script>

<svelte:head>
    <title>AI Features Demo - Abroaducate</title>
    <meta name="description" content="Experience our unified AI system with 6+ powerful tools for academic writing, document analysis, and optimization." />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
    <!-- Enhanced Header with Better CTAs -->
    <div class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="text-center">
                <div class="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-4">
                    🎉 Unified AI System - Migration Complete
                </div>
            <h1 class="text-4xl font-bold text-gray-900 mb-4">🤖 AI Features Demo</h1>
                <p class="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                    Experience our unified AI system with consistent usage tracking, automatic upgrade integration, 
                    and 6+ powerful tools to enhance your academic writing.
                </p>
                
                <!-- Quick Action Buttons -->
                <div class="flex flex-wrap justify-center gap-4 mb-8">
                    <a href="/sop" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        📝 Create Documents
                    </a>
                    <a href="/text-enhancement" class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium">
                        ✨ Enhance Writing
                    </a>
                    <a href="/sop-review" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium">
                        🔍 Review Documents
                    </a>
                    <button 
                        onclick={() => showUsageComparison = !showUsageComparison}
                        class="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                        📊 Compare Plans
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Usage Limits Comparison (Collapsible) -->
        {#if showUsageComparison}
            <div class="mb-8 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div class="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                    <h2 class="text-xl font-bold text-gray-900">📊 Plan Comparison & Usage Limits</h2>
                </div>
                <div class="p-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <!-- Free Plan -->
                        <div class="border border-gray-200 rounded-lg p-4">
                            <h3 class="font-semibold text-lg text-gray-900 mb-3">🆓 Free Plan</h3>
                            <ul class="text-sm text-gray-700 space-y-2">
                                <li>• <strong>5</strong> AI improvements (reviews, enhancements, optimizations)</li>
                                <li>• <strong>1</strong> plagiarism check</li>
                                <li>• <strong>3</strong> document generations</li>
                                <li>• Basic features access</li>
                            </ul>
                        </div>
                        
                        <!-- Professional Plan -->
                        <div class="border border-blue-300 bg-blue-50 rounded-lg p-4">
                            <h3 class="font-semibold text-lg text-blue-900 mb-3">💼 Professional Plan</h3>
                            <ul class="text-sm text-blue-800 space-y-2">
                                <li>• <strong>25</strong> AI improvements</li>
                                <li>• <strong>5</strong> plagiarism checks</li>
                                <li>• <strong>15</strong> document generations</li>
                                <li>• Priority support</li>
                            </ul>
                        </div>
                        
                        <!-- Elite Plan -->
                        <div class="border border-purple-300 bg-purple-50 rounded-lg p-4">
                            <h3 class="font-semibold text-lg text-purple-900 mb-3">👑 Elite Plan</h3>
                            <ul class="text-sm text-purple-800 space-y-2">
                                <li>• <strong>Unlimited</strong> AI improvements</li>
                                <li>• <strong>Unlimited</strong> plagiarism checks</li>
                                <li>• <strong>Unlimited</strong> document generations</li>
                                <li>• Premium features access</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Feature Category Filter -->
        <div class="mb-8">
            <div class="flex flex-wrap justify-center gap-4">
                <button 
                    onclick={() => selectedCategory = 'all'}
                    class={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedCategory === 'all' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    All Features
                </button>
                <button 
                    onclick={() => selectedCategory = 'analysis'}
                    class={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedCategory === 'analysis' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    📊 Analysis
                </button>
                <button 
                    onclick={() => selectedCategory = 'enhancement'}
                    class={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedCategory === 'enhancement' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    ✨ Enhancement
                </button>
                <button 
                    onclick={() => selectedCategory = 'optimization'}
                    class={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedCategory === 'optimization' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    🔧 Optimization
                </button>
            </div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- SOP Review -->
            {#if selectedCategory === 'all' || selectedCategory === 'analysis'}
                <div class="space-y-4 bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                    <div class="flex items-center justify-between">
                <h2 class="text-2xl font-bold text-gray-900">📊 SOP Review</h2>
                        <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">Analysis</span>
                    </div>
                    <p class="text-gray-600 text-sm mb-4">Comprehensive document analysis with detailed feedback and scoring.</p>
                <AIFeatureWidget 
                    featureType="sop_review"
                    content={sampleSOPText}
                    options={{
                        universityName: "Stanford University",
                        programName: "MS Computer Science"
                    }}
                    buttonText="Analyze SOP"
                />
            </div>
            {/if}
            
            <!-- Text Enhancement -->
            {#if selectedCategory === 'all' || selectedCategory === 'enhancement'}
                <div class="space-y-4 bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                    <div class="flex items-center justify-between">
                <h2 class="text-2xl font-bold text-gray-900">✨ Text Enhancement</h2>
                        <span class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">Enhancement</span>
                    </div>
                    <p class="text-gray-600 text-sm mb-4">Improve writing clarity, flow, and professional impact.</p>
                <AIFeatureWidget 
                    featureType="text_enhancement"
                    content={sampleCoverLetterText}
                    options={{ enhancementType: "professional" }}
                    buttonText="Enhance Text"
                />
            </div>
            {/if}
            
            <!-- Word Count Optimization -->
            {#if selectedCategory === 'all' || selectedCategory === 'optimization'}
                <div class="space-y-4 bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                    <div class="flex items-center justify-between">
                <h2 class="text-2xl font-bold text-gray-900">📝 Word Optimization</h2>
                        <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Optimization</span>
                    </div>
                    <p class="text-gray-600 text-sm mb-4">Optimize text length while maintaining meaning and impact.</p>
                <AIFeatureWidget 
                    featureType="word_optimization"
                    content="This is a sample paragraph that might need optimization for word count."
                    options={{ targetWordCount: 500 }}
                    buttonText="Optimize Length"
                />
            </div>
            {/if}
            
            <!-- Grammar Check -->
            {#if selectedCategory === 'all' || selectedCategory === 'enhancement'}
                <div class="space-y-4 bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                    <div class="flex items-center justify-between">
                <h2 class="text-2xl font-bold text-gray-900">✅ Grammar Check</h2>
                        <span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">Enhancement</span>
                    </div>
                    <p class="text-gray-600 text-sm mb-4">Fix grammar errors and improve writing style.</p>
                <AIFeatureWidget 
                    featureType="grammar_check"
                    content="This sentance has some grammer mistakes that need fixing."
                    buttonText="Check Grammar"
                />
            </div>
            {/if}
            
            <!-- Plagiarism Check -->
            {#if selectedCategory === 'all' || selectedCategory === 'analysis'}
                <div class="space-y-4 bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                    <div class="flex items-center justify-between">
                <h2 class="text-2xl font-bold text-gray-900">🔍 Plagiarism Check</h2>
                        <span class="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">Analysis</span>
                    </div>
                    <p class="text-gray-600 text-sm mb-4">Analyze originality and detect potential issues.</p>
                <AIFeatureWidget 
                    featureType="plagiarism_check"
                    content="Academic integrity is crucial in higher education. Students must ensure their work is original."
                    buttonText="Check Originality"
                />
            </div>
            {/if}
            
            <!-- Tone Analysis -->
            {#if selectedCategory === 'all' || selectedCategory === 'analysis'}
                <div class="space-y-4 bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                    <div class="flex items-center justify-between">
                <h2 class="text-2xl font-bold text-gray-900">🎭 Tone Analysis</h2>
                        <span class="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">Analysis</span>
                    </div>
                    <p class="text-gray-600 text-sm mb-4">Analyze writing tone and style for better impact.</p>
                <AIFeatureWidget 
                    featureType="tone_analysis"
                    content="I am extremely passionate about this opportunity and would be thrilled to contribute!"
                    buttonText="Analyze Tone"
                />
            </div>
            {/if}
        </div>
        
        <!-- Benefits Section -->
        <div class="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8">
            <div class="text-center mb-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-4">🎯 Why Choose Our AI Tools?</h2>
                <p class="text-gray-600 max-w-3xl mx-auto">
                    Our AI features are designed specifically for academic and professional success, 
                    with intelligent analysis and enhancement capabilities.
                </p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="bg-white rounded-lg p-6 text-center shadow-sm">
                    <div class="text-3xl mb-4">🚀</div>
                    <h3 class="font-semibold text-lg text-gray-900 mb-2">Instant Results</h3>
                    <p class="text-sm text-gray-600">Get AI-powered feedback and improvements in seconds, not hours.</p>
                </div>
                
                <div class="bg-white rounded-lg p-6 text-center shadow-sm">
                    <div class="text-3xl mb-4">🎓</div>
                    <h3 class="font-semibold text-lg text-gray-900 mb-2">Academic Focus</h3>
                    <p class="text-sm text-gray-600">Specialized for academic writing, applications, and professional documents.</p>
                </div>
                
                <div class="bg-white rounded-lg p-6 text-center shadow-sm">
                    <div class="text-3xl mb-4">💯</div>
                    <h3 class="font-semibold text-lg text-gray-900 mb-2">Quality Assured</h3>
                    <p class="text-sm text-gray-600">Maintains your voice while enhancing clarity, impact, and professionalism.</p>
                </div>
            </div>
                </div>
                
        <!-- Call to Action Section -->
        <div class="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg text-white p-8 text-center">
            <h2 class="text-2xl font-bold mb-4">Ready to Enhance Your Academic Writing?</h2>
            <p class="text-lg opacity-90 mb-6">Start using our AI tools in your document creation workflow.</p>
            <div class="flex flex-wrap justify-center gap-4">
                <a href="/sop" class="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                    Create SOP
                </a>
                <a href="/pricing" class="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-medium">
                    View Pricing
                </a>
                <a href="/dashboard" class="bg-yellow-500 text-gray-900 px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors font-medium">
                    Go to Dashboard
                </a>
            </div>
        </div>
    </div>
</div> 