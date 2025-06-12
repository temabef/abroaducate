<script lang="ts">
    import AIFeatureWidget from '$lib/components/AIFeatureWidget.svelte';
    
    let { data } = $props();
    
    let activeTab = $state('enhance');
    let sampleText = `Dear Admissions Committee,

I am writing to express my genuine interest in pursuing a Master's degree in Computer Science at your esteemed institution. Having completed my undergraduate studies in Computer Engineering with a focus on artificial intelligence, I am eager to deepen my knowledge and contribute to cutting-edge research in this rapidly evolving field.

During my academic journey, I have maintained a strong GPA while working on several challenging projects that have shaped my technical skills and research interests. My senior capstone project involved developing a machine learning model for natural language processing, which resulted in a 15% improvement in accuracy compared to existing benchmarks.

I believe that your program's emphasis on both theoretical foundations and practical applications aligns perfectly with my career goals. I am particularly drawn to the research opportunities in your AI lab and hope to contribute meaningfully to ongoing projects while pursuing my own research interests in deep learning and computer vision.`;
</script>

<svelte:head>
    <title>AI Text Enhancement - Abroaducate</title>
    <meta name="description" content="Enhance your academic writing with AI-powered suggestions for clarity, flow, and professional impact." />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
    <!-- Navigation Breadcrumb -->
    <div class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center space-x-2 py-4 text-sm">
                <a href="/dashboard" class="text-blue-600 hover:text-blue-800 transition-colors">Dashboard</a>
                <span class="text-gray-400">›</span>
                <span class="text-gray-600 font-medium">Text Enhancement</span>
            </div>
        </div>
    </div>
    
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Page Header -->
        <div class="text-center mb-12">
            <h1 class="text-4xl font-bold text-gray-900 mb-4">
                ✨ AI Text Enhancement
            </h1>
            <p class="text-xl text-gray-600 max-w-4xl mx-auto">
                Transform your academic writing with intelligent suggestions for clarity, flow, 
                professional tone, and compelling impact across all document types.
            </p>
        </div>
        
        <!-- Feature Highlights -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                <div class="text-3xl mb-3">✨</div>
                <h3 class="font-semibold text-gray-900 mb-2">Professional Polish</h3>
                <p class="text-sm text-gray-600">Enhance tone, clarity, and academic style</p>
            </div>
            
            <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                <div class="text-3xl mb-3">🎯</div>
                <h3 class="font-semibold text-gray-900 mb-2">Context-Aware</h3>
                <p class="text-sm text-gray-600">Tailored improvements for your specific needs</p>
            </div>
            
            <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                <div class="text-3xl mb-3">⚡</div>
                <h3 class="font-semibold text-gray-900 mb-2">Instant Results</h3>
                <p class="text-sm text-gray-600">Get enhanced text in seconds, not hours</p>
            </div>
            
            <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                <div class="text-3xl mb-3">📊</div>
                <h3 class="font-semibold text-gray-900 mb-2">Smart Analysis</h3>
                <p class="text-sm text-gray-600">Understand what makes great writing</p>
            </div>
        </div>
        
        <!-- Enhancement Tabs -->
        <div class="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <!-- Tab Navigation -->
            <div class="border-b border-gray-200">
                <nav class="flex space-x-8 px-6" aria-label="Enhancement Types">
                    <button
                        class={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'enhance' 
                                ? 'border-blue-500 text-blue-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                        onclick={() => activeTab = 'enhance'}
                    >
                        ✨ General Enhancement
                    </button>
                    <button
                        class={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'grammar' 
                                ? 'border-blue-500 text-blue-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                        onclick={() => activeTab = 'grammar'}
                    >
                        ✅ Grammar & Style
                    </button>
                    <button
                        class={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'tone' 
                                ? 'border-blue-500 text-blue-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                        onclick={() => activeTab = 'tone'}
                    >
                        🎭 Tone Analysis
                    </button>
                    <button
                        class={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'words' 
                                ? 'border-blue-500 text-blue-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                        onclick={() => activeTab = 'words'}
                    >
                        📝 Word Optimization
                    </button>
                </nav>
            </div>
            
            <!-- Tab Content -->
            <div class="p-6">
                {#if activeTab === 'enhance'}
                    <div class="space-y-6">
                        <div>
                            <h3 class="text-xl font-bold text-gray-900 mb-3">✨ Professional Text Enhancement</h3>
                            <p class="text-gray-600 mb-6">
                                Improve your writing's clarity, flow, and professional impact with AI-powered suggestions 
                                tailored for academic and professional contexts.
                            </p>
                        </div>
                        
                        <AIFeatureWidget 
                            featureType="text_enhancement"
                            content={sampleText}
                            options={{ enhancementType: "professional" }}
                            placeholder="Paste your text here to enhance its clarity, flow, and professional tone..."
                            buttonText="✨ Enhance Text"
                        />
                    </div>
                    
                {:else if activeTab === 'grammar'}
                    <div class="space-y-6">
                        <div>
                            <h3 class="text-xl font-bold text-gray-900 mb-3">✅ Grammar & Style Check</h3>
                            <p class="text-gray-600 mb-6">
                                Identify and fix grammar errors, improve sentence structure, and enhance overall writing style 
                                for clear, polished communication.
                            </p>
                        </div>
                        
                        <AIFeatureWidget 
                            featureType="grammar_check"
                            content="This sentance has some grammer mistakes and could be improoved. The writing style might also benfit from some enhancements to make it more profesional and polished."
                            placeholder="Enter text to check for grammar errors and style improvements..."
                            buttonText="✅ Check Grammar & Style"
                        />
                    </div>
                    
                {:else if activeTab === 'tone'}
                    <div class="space-y-6">
                        <div>
                            <h3 class="text-xl font-bold text-gray-900 mb-3">🎭 Tone & Style Analysis</h3>
                            <p class="text-gray-600 mb-6">
                                Analyze your writing's tone, style, and emotional impact. Get recommendations for 
                                achieving the perfect balance of professionalism and personality.
                            </p>
                        </div>
                        
                        <AIFeatureWidget 
                            featureType="tone_analysis"
                            content="I am extremely passionate about this opportunity and would be absolutely thrilled to contribute to your team! This position represents everything I've been working towards, and I believe my enthusiasm and dedication would make me an incredible asset."
                            placeholder="Enter text to analyze its tone, style, and emotional impact..."
                            buttonText="🎭 Analyze Tone & Style"
                        />
                    </div>
                    
                {:else if activeTab === 'words'}
                    <div class="space-y-6">
                        <div>
                            <h3 class="text-xl font-bold text-gray-900 mb-3">📝 Word Count Optimization</h3>
                            <p class="text-gray-600 mb-6">
                                Optimize your text for specific word count requirements while maintaining clarity and impact. 
                                Perfect for meeting application limits and essay requirements.
                            </p>
                        </div>
                        
                        <AIFeatureWidget 
                            featureType="word_optimization"
                            content="This is a sample paragraph that demonstrates how we can optimize text for specific word count requirements. The goal is to maintain the core message and meaning while adjusting the length to meet specific requirements, whether we need to expand for more detail or condense for brevity."
                            options={{ targetWordCount: 500 }}
                            placeholder="Enter text to optimize for specific word count requirements..."
                            buttonText="📝 Optimize Word Count"
                        />
                    </div>
                {/if}
            </div>
        </div>
        
        <!-- Additional Tools Section -->
        <div class="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Academic Writing Tips -->
            <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                <h3 class="text-xl font-bold text-gray-900 mb-4">📚 Writing Best Practices</h3>
                <div class="space-y-3 text-sm">
                    <div class="flex items-start gap-3">
                        <div class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">1</div>
                        <p class="text-gray-700"><strong>Clarity First:</strong> Use simple, direct language to convey complex ideas</p>
                    </div>
                    <div class="flex items-start gap-3">
                        <div class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">2</div>
                        <p class="text-gray-700"><strong>Active Voice:</strong> Write with confidence using active constructions</p>
                    </div>
                    <div class="flex items-start gap-3">
                        <div class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">3</div>
                        <p class="text-gray-700"><strong>Show, Don't Tell:</strong> Use specific examples and concrete details</p>
                    </div>
                    <div class="flex items-start gap-3">
                        <div class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">4</div>
                        <p class="text-gray-700"><strong>Professional Tone:</strong> Balance personality with academic formality</p>
                    </div>
                </div>
            </div>
            
            <!-- Related Tools -->
            <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
                <h3 class="text-xl font-bold text-gray-900 mb-4">🛠️ Related Tools</h3>
                <div class="space-y-3">
                    <a href="/sop-review" 
                       class="block p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
                        <div class="font-medium text-gray-900">📊 SOP Review</div>
                        <div class="text-sm text-gray-600">Comprehensive document analysis and feedback</div>
                    </a>
                    <a href="/ai-features-demo" 
                       class="block p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
                        <div class="font-medium text-gray-900">🤖 AI Features Demo</div>
                        <div class="text-sm text-gray-600">Try all our AI-powered writing tools</div>
                    </a>
                    <a href="/sop" 
                       class="block p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
                        <div class="font-medium text-gray-900">📝 Document Generator</div>
                        <div class="text-sm text-gray-600">Create new academic documents from scratch</div>
                    </a>
                </div>
            </div>
        </div>
        
        <!-- Quick Actions -->
        <div class="mt-8 text-center">
            <div class="inline-flex gap-4">
                <a 
                    href="/ai-features-demo" 
                    class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
                >
                    🤖 Try All AI Features
                </a>
                <a 
                    href="/sop-review" 
                    class="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium"
                >
                    📊 Comprehensive Review
                </a>
                <a 
                    href="/dashboard" 
                    class="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium"
                >
                    🏠 Dashboard
                </a>
            </div>
        </div>
    </div>
</div> 