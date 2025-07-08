<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import AIFeatureWidget from '$lib/components/AIFeatureWidget.svelte';
    
  let { data } = $props();
    
    // Sample texts for demonstration
    let sampleTexts = [
        {
            title: "Academic SOP - Too Long",
            content: `During my undergraduate studies in Computer Science at the University of California, Berkeley, I have developed a profound interest in artificial intelligence and machine learning technologies. Throughout my academic journey, I have consistently maintained a high GPA while actively engaging in various research projects and internships that have significantly contributed to my understanding of the field. My passion for AI began during my sophomore year when I enrolled in an introductory machine learning course taught by Professor Johnson. The course opened my eyes to the incredible potential of AI to solve real-world problems and improve human lives in countless ways. Since then, I have dedicated myself to learning everything I can about this fascinating field, taking advanced courses in deep learning, natural language processing, and computer vision.`,
            targetWords: 150,
            category: "Condense"
        },
        {
            title: "Cover Letter - Too Short", 
            content: `I am interested in your software engineering position. I have experience with Python and JavaScript. I think I would be a good fit for your team.`,
            targetWords: 200,
            category: "Expand"
        },
        {
            title: "Personal Statement - Just Right",
            content: `My fascination with renewable energy began during a power outage that lasted three days in my hometown. Watching my community struggle without electricity, I realized the urgent need for sustainable energy solutions. This experience inspired me to pursue environmental engineering, where I have since focused on solar panel efficiency optimization and energy storage systems.`,
            targetWords: 250,
            category: "Maintain"
        }
    ];
    
    let selectedSample = $state(0);
    let customText = $state('');
    let targetWordCount = $state(500);
    let inputMode = $state('sample'); // 'sample' or 'custom'
</script>

<svelte:head>
    <title>Word Count Optimization - Abroaducate</title>
    <meta name="description" content="Optimize your text for specific word count requirements while maintaining clarity and impact. Perfect for SOPs, essays, and application documents." />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
    <!-- Navigation Breadcrumb -->
    <div class="bg-white border-b border-gray-200">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between py-4">
                <div class="flex items-center space-x-2 text-sm">
                    <a href="/dashboard" class="text-blue-600 hover:text-blue-800 transition-colors">Dashboard</a>
                    <span class="text-gray-400">›</span>
                    <a href="/ai-features-demo" class="text-blue-600 hover:text-blue-800 transition-colors">AI Tools</a>
                    <span class="text-gray-400">›</span>
                    <span class="text-gray-600 font-medium">Word Optimization</span>
                </div>
                <div class="text-sm text-gray-500">
                    <span class="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        ✅ Integrated with Unified AI System
                    </span>
                </div>
            </div>
        </div>
    </div>
    
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Page Header -->
        <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
                📝 Word Count Optimization
      </h1>
            <p class="text-xl text-gray-600 max-w-4xl mx-auto">
                Optimize your text for specific word count requirements while maintaining clarity, impact, and meaning. 
                Perfect for SOPs, essays, cover letters, and any document with length restrictions.
      </p>
    </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <div class="text-3xl font-bold text-blue-600 mb-2">📊</div>
                <div class="text-lg font-semibold text-gray-900">Smart Analysis</div>
                <div class="text-sm text-gray-600">AI analyzes content structure and meaning</div>
            </div>
            <div class="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <div class="text-3xl font-bold text-green-600 mb-2">🎯</div>
                <div class="text-lg font-semibold text-gray-900">Precise Targeting</div>
                <div class="text-sm text-gray-600">Meet exact word count requirements</div>
            </div>
            <div class="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <div class="text-3xl font-bold text-purple-600 mb-2">✨</div>
                <div class="text-lg font-semibold text-gray-900">Quality Preserved</div>
                <div class="text-sm text-gray-600">Maintains clarity and impact</div>
            </div>
        </div>

        <!-- Input Method Selection -->
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm mb-8">
            <div class="p-6 border-b border-gray-200">
                <h2 class="text-xl font-bold text-gray-900 mb-4">Choose Your Input Method</h2>
                <div class="flex gap-4">
                    <button 
                        onclick={() => inputMode = 'sample'}
                        class={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            inputMode === 'sample' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        📋 Try Sample Texts
                    </button>
                    <button 
                        onclick={() => inputMode = 'custom'}
                        class={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            inputMode === 'custom' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        ✏️ Enter Custom Text
                    </button>
                </div>
            </div>

            {#if inputMode === 'sample'}
                <!-- Sample Text Selection -->
                <div class="p-6">
                    <h3 class="font-semibold text-lg text-gray-900 mb-4">Select a Sample Text:</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {#each sampleTexts as sample, index}
                            <button 
                                onclick={() => selectedSample = index}
                                class={`p-4 border rounded-lg text-left transition-all ${
                                    selectedSample === index 
                                        ? 'border-blue-500 bg-blue-50' 
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div class="font-medium text-gray-900">{sample.title}</div>
                                <div class="text-sm text-gray-600 mt-1">
                                    Current: {sample.content.split(/\s+/).length} words → Target: {sample.targetWords} words
                                </div>
                                <div class="text-xs mt-2">
                                    <span class={`px-2 py-1 rounded-full text-xs font-medium ${
                                        sample.category === 'Expand' ? 'bg-green-100 text-green-800' :
                                        sample.category === 'Condense' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {sample.category}
                                    </span>
                                </div>
                            </button>
                        {/each}
      </div>

                    <!-- Selected Sample Display -->
                    <div class="bg-gray-50 rounded-lg p-4 mb-6">
                        <h4 class="font-medium text-gray-900 mb-2">{sampleTexts[selectedSample].title}</h4>
                        <p class="text-gray-700 text-sm leading-relaxed">{sampleTexts[selectedSample].content}</p>
                        <div class="mt-3 text-xs text-gray-600">
                            Current: {sampleTexts[selectedSample].content.split(/\s+/).length} words | 
                            Target: {sampleTexts[selectedSample].targetWords} words
                        </div>
                    </div>

                    <!-- AI Optimization Widget for Sample -->
                    <AIFeatureWidget 
                        featureType="word_optimization"
                        content={sampleTexts[selectedSample].content}
                        options={{ targetWordCount: sampleTexts[selectedSample].targetWords }}
                        placeholder="Sample text loaded..."
                        buttonText="📝 Optimize Sample Text"
                    />
                </div>
            {:else}
                <!-- Custom Text Input -->
                <div class="p-6">
                    <div class="mb-6">
                        <label for="text-input" class="block text-sm font-medium text-gray-700 mb-2">
                            Enter Your Text to Optimize:
                        </label>
                        <textarea
                            id="text-input"
                            bind:value={customText}
                            placeholder="Paste your text here (SOP, cover letter, essay, etc.)..."
                            rows="8"
                            class="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        ></textarea>
                        <div class="mt-2 flex justify-between text-sm text-gray-600">
                            <span>Current word count: {customText.split(/\s+/).filter(w => w.length > 0).length}</span>
                            <span>Characters: {customText.length}</span>
                        </div>
                    </div>

                    <div class="mb-6">
                        <label for="target-word-count" class="block text-sm font-medium text-gray-700 mb-2">
                            Target Word Count:
                        </label>
                        <input
                            id="target-word-count" 
                            type="number" 
                            bind:value={targetWordCount}
                            placeholder="e.g., 500"
                            class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-48"
                            min="50"
                            max="2000"
                        />
                        <div class="mt-1 text-xs text-gray-500">
                            Recommended range: 50-2000 words
                        </div>
                    </div>

                    <!-- AI Optimization Widget for Custom Text -->
                    <AIFeatureWidget 
                        featureType="word_optimization"
                        content={customText}
                        options={{ targetWordCount: targetWordCount }}
                        placeholder="Enter your text above to optimize..."
                        buttonText="📝 Optimize My Text"
                        disabled={customText.trim().length === 0}
                    />
                </div>
            {/if}
        </div>

        <!-- Features & Benefits -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <!-- How It Works -->
            <div class="bg-white rounded-lg border border-gray-200 p-6">
                <h3 class="text-xl font-bold text-gray-900 mb-4">🛠️ How Word Optimization Works</h3>
                <div class="space-y-4">
                    <div class="flex items-start gap-3">
                        <div class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                        <div>
                            <div class="font-medium text-gray-900">Content Analysis</div>
                            <div class="text-sm text-gray-600">AI analyzes your text structure, key points, and meaning</div>
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <div class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                        <div>
                            <div class="font-medium text-gray-900">Smart Optimization</div>
                            <div class="text-sm text-gray-600">Expands or condenses while preserving core message</div>
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <div class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                        <div>
                            <div class="font-medium text-gray-900">Quality Assurance</div>
                            <div class="text-sm text-gray-600">Maintains readability, flow, and professional tone</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Use Cases -->
            <div class="bg-white rounded-lg border border-gray-200 p-6">
                <h3 class="text-xl font-bold text-gray-900 mb-4">🎯 Perfect For</h3>
                <div class="space-y-3">
                    <div class="flex items-center gap-3">
                        <span class="text-lg">📄</span>
                        <div>
                            <div class="font-medium text-gray-900">Statement of Purpose</div>
                            <div class="text-sm text-gray-600">Meet university word limits (500-1000 words)</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="text-lg">💼</span>
                        <div>
                            <div class="font-medium text-gray-900">Cover Letters</div>
                            <div class="text-sm text-gray-600">Professional length (200-400 words)</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="text-lg">📝</span>
                        <div>
                            <div class="font-medium text-gray-900">Personal Essays</div>
                            <div class="text-sm text-gray-600">Application essay requirements</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="text-lg">📋</span>
                        <div>
                            <div class="font-medium text-gray-900">Academic CVs</div>
                            <div class="text-sm text-gray-600">Concise professional summaries</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Related Tools -->
        <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">🔗 Related AI Tools</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href="/ai-features-demo" 
                   class="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
                    <div class="font-medium text-gray-900">✨ Text Enhancement</div>
                    <div class="text-sm text-gray-600">Improve clarity and professional tone</div>
                </a>
                <a href="/sop-review" 
                   class="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
                    <div class="font-medium text-gray-900">🔍 Document Review</div>
                    <div class="text-sm text-gray-600">Comprehensive analysis and feedback</div>
                </a>
                <a href="/ai-features-demo" 
                   class="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
                    <div class="font-medium text-gray-900">🤖 All AI Features</div>
                    <div class="text-sm text-gray-600">Try all our AI-powered tools</div>
                </a>
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
                    href="/sop" 
                    class="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium"
                >
                    📝 Create Document
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