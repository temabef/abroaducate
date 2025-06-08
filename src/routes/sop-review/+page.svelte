<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import SOPReviewer from '$lib/components/SOPReviewer.svelte';
    
    export let data;
    
    let existingSOP = '';
    let universityName = '';
    let programName = '';
    
    // Check if we have query parameters for pre-populating
    onMount(() => {
        const urlParams = new URLSearchParams(window.location.search);
        existingSOP = urlParams.get('sop') || '';
        universityName = urlParams.get('university') || '';
        programName = urlParams.get('program') || '';
    });
</script>

<svelte:head>
    <title>SOP Review & Enhancement - Comprehensive AI Analysis</title>
    <meta name="description" content="Get detailed AI-powered analysis of your Statement of Purpose with paragraph-by-paragraph feedback and improvement suggestions." />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
    <!-- Navigation Breadcrumb -->
    <div class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center space-x-2 py-4 text-sm">
                <a href="/dashboard" class="text-blue-600 hover:text-blue-800 transition-colors">Dashboard</a>
                <span class="text-gray-400">›</span>
                <span class="text-gray-600 font-medium">SOP Review</span>
            </div>
        </div>
    </div>
    
    <!-- Main Content -->
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Page Header -->
        <div class="text-center mb-8">
            <h1 class="text-4xl font-bold text-gray-900 mb-4">
                🔍 SOP Review & Enhancement
            </h1>
            <p class="text-xl text-gray-600 max-w-3xl mx-auto">
                Get comprehensive AI-powered analysis of your Statement of Purpose with detailed feedback, 
                scoring, and actionable improvement suggestions.
            </p>
        </div>
        
        <!-- Feature Highlights -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                <div class="text-3xl mb-3">📊</div>
                <h3 class="font-semibold text-gray-900 mb-2">Comprehensive Scoring</h3>
                <p class="text-sm text-gray-600">Get detailed scores for readability, coherence, relevance, and impact</p>
            </div>
            
            <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                <div class="text-3xl mb-3">📝</div>
                <h3 class="font-semibold text-gray-900 mb-2">Paragraph Analysis</h3>
                <p class="text-sm text-gray-600">Detailed breakdown of each paragraph with specific feedback</p>
            </div>
            
            <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                <div class="text-3xl mb-3">💡</div>
                <h3 class="font-semibold text-gray-900 mb-2">Smart Suggestions</h3>
                <p class="text-sm text-gray-600">AI-powered recommendations for improvement and enhancement</p>
            </div>
            
            <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                <div class="text-3xl mb-3">🎯</div>
                <h3 class="font-semibold text-gray-900 mb-2">University-Specific</h3>
                <p class="text-sm text-gray-600">Tailored analysis based on your target university and program</p>
            </div>
        </div>
        
        <!-- SOP Reviewer Component -->
        <div class="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <SOPReviewer 
                {existingSOP}
                {universityName}
                {programName}
            />
        </div>
        
        <!-- Additional Information -->
        <div class="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- How It Works -->
            <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                <h3 class="text-xl font-bold text-gray-900 mb-4">🚀 How It Works</h3>
                <div class="space-y-3">
                    <div class="flex items-start gap-3">
                        <div class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">1</div>
                        <p class="text-gray-700"><strong>Upload or Paste:</strong> Provide your SOP text through multiple input methods</p>
                    </div>
                    <div class="flex items-start gap-3">
                        <div class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">2</div>
                        <p class="text-gray-700"><strong>AI Analysis:</strong> Advanced algorithms analyze content, structure, and relevance</p>
                    </div>
                    <div class="flex items-start gap-3">
                        <div class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">3</div>
                        <p class="text-gray-700"><strong>Detailed Feedback:</strong> Receive comprehensive analysis with actionable suggestions</p>
                    </div>
                    <div class="flex items-start gap-3">
                        <div class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">4</div>
                        <p class="text-gray-700"><strong>Improve & Iterate:</strong> Use insights to enhance your SOP and reanalyze</p>
                    </div>
                </div>
            </div>
            
            <!-- Best Practices -->
            <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
                <h3 class="text-xl font-bold text-gray-900 mb-4">💡 Best Practices</h3>
                <div class="space-y-2">
                    <div class="flex items-start gap-2">
                        <span class="text-green-600 mt-1">✓</span>
                        <p class="text-gray-700"><strong>Length:</strong> Aim for 600-800 words (typically 4-6 paragraphs)</p>
                    </div>
                    <div class="flex items-start gap-2">
                        <span class="text-green-600 mt-1">✓</span>
                        <p class="text-gray-700"><strong>Structure:</strong> Clear introduction, body, and conclusion</p>
                    </div>
                    <div class="flex items-start gap-2">
                        <span class="text-green-600 mt-1">✓</span>
                        <p class="text-gray-700"><strong>Content:</strong> Specific examples and quantifiable achievements</p>
                    </div>
                    <div class="flex items-start gap-2">
                        <span class="text-green-600 mt-1">✓</span>
                        <p class="text-gray-700"><strong>Relevance:</strong> Connect experiences to your target program</p>
                    </div>
                    <div class="flex items-start gap-2">
                        <span class="text-green-600 mt-1">✓</span>
                        <p class="text-gray-700"><strong>Goals:</strong> Articulate clear short-term and long-term objectives</p>
                    </div>
                    <div class="flex items-start gap-2">
                        <span class="text-green-600 mt-1">✓</span>
                        <p class="text-gray-700"><strong>Research:</strong> Demonstrate knowledge of the university/program</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Quick Actions -->
        <div class="mt-8 text-center">
            <div class="inline-flex gap-4">
                <a 
                    href="/sop-generator" 
                    class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
                >
                    📝 Generate New SOP
                </a>
                <a 
                    href="/applications" 
                    class="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium"
                >
                    📋 My Applications
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

<style>
    /* Custom animations for enhanced UX */
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .bg-gradient-to-br {
        animation: fadeInUp 0.6s ease-out;
    }
</style>