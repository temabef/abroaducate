<script lang="ts">
    import { onMount } from 'svelte';
    import PersonalStatementGenerator from '$lib/components/PersonalStatementGenerator.svelte';
    import { goto } from '$app/navigation';
    
    let showGenerator = true;
    let existingUserData: any = null;
    let existingSOPData: any = null;
    let loading = true;
    
    onMount(async () => {
        // Try to get existing user data to pre-populate fields
        try {
            const response = await fetch('/api/get-user-profile');
            if (response.ok) {
                const data = await response.json();
                existingUserData = data.profile;
            }
        } catch (error) {
            console.log('Could not load user profile:', error);
        }
        
        // Try to get existing SOP data for cross-population
        try {
            const sopResponse = await fetch('/api/get-latest-sop');
            if (sopResponse.ok) {
                const sopData = await sopResponse.json();
                existingSOPData = sopData.sop;
            }
        } catch (error) {
            console.log('Could not load SOP data:', error);
        }
        
        loading = false;
    });
    
    function goHome() {
        goto('/');
    }
</script>

<svelte:head>
    <title>Personal Statement Generator - Abroaducate</title>
    <meta name="description" content="Create compelling personal statements for college applications, scholarships, law school, medical school, and more." />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 pt-20">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center">
                    <button 
                        onclick={goHome}
                        class="flex items-center space-x-2 text-gray-900 hover:text-[#2C3580] transition-colors"
                    >
                        <svg class="w-8 h-8 text-[#2C3580]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                        </svg>
                        <span class="text-xl font-bold">Abroaducate</span>
                    </button>
                </div>
                
                <nav class="flex items-center space-x-4">
                    <button 
                        onclick={goHome}
                        class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                        ← Back to Dashboard
                    </button>
                </nav>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {#if loading}
            <!-- Loading State -->
            <div class="flex justify-center items-center h-64">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2C3580]"></div>
            </div>
        {:else}
            <!-- Page Header -->
            <div class="text-center mb-8">
                <h1 class="text-4xl font-bold text-gray-900 mb-4">💭 Personal Statement Generator</h1>
                <p class="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                    Create compelling personal statements that tell your unique story for college applications, 
                    scholarships, professional programs, and more.
                </p>
                
                <!-- AI Guidance Notice -->
                <div class="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-lg inline-block mb-8 max-w-4xl">
                    <div class="flex items-start gap-3">
                        <span class="text-2xl">⚠️</span>
                        <div>
                            <div class="font-semibold mb-1">Important Disclaimer</div>
                            <p class="text-sm leading-relaxed">
                                This AI-generated personal statement should be used as a <strong>guide and starting point</strong> for your application. 
                                Please review, personalize, and adapt the content to reflect your unique voice and experiences. 
                                <strong>Do not submit AI-generated content directly without thorough review and modification.</strong>
                            </p>
                        </div>
                    </div>
                </div>
                
                <!-- Key Benefits -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 mb-12">
                    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
                        <div class="text-3xl mb-3">🎓</div>
                        <h3 class="font-semibold text-gray-900 mb-2">All Education Levels</h3>
                        <p class="text-gray-600 text-sm">From high school to professional programs - we support every academic journey</p>
                    </div>
                    <div class="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-lg border border-purple-100">
                        <div class="text-3xl mb-3">📝</div>
                        <h3 class="font-semibold text-gray-900 mb-2">Story-Driven</h3>
                        <p class="text-gray-600 text-sm">Focus on personal narrative, character development, and authentic voice</p>
                    </div>
                    <div class="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-100">
                        <div class="text-3xl mb-3">🎯</div>
                        <h3 class="font-semibold text-gray-900 mb-2">Application-Specific</h3>
                        <p class="text-gray-600 text-sm">Tailored prompts for different application types and requirements</p>
                    </div>
                </div>
            </div>
            
            <!-- Generator Component -->
            {#if showGenerator}
                <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                    <PersonalStatementGenerator 
                        {existingUserData} 
                        {existingSOPData} 
                    />
                </div>
            {:else}
                <!-- CTA Section for Anonymous Users -->
                <div class="text-center mb-12">
                    <button
                        onclick={() => showGenerator = true}
                        class="px-8 py-4 bg-gradient-to-r from-[#2C3580] to-[#3c4d9c] text-white rounded-lg hover:bg-[#3c4d9c] transition-all font-semibold text-lg shadow-lg"
                    >
                        ✨ Start Creating Your Personal Statement
                    </button>
                </div>
            {/if}
            
            <!-- Information Section -->
            <div class="mt-12 bg-gray-50 rounded-lg p-6">
                <h2 class="text-2xl font-bold text-gray-900 mb-4">📋 Personal Statement vs Statement of Purpose</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white p-4 rounded-lg border border-gray-200">
                        <h3 class="font-semibold text-[#2C3580] mb-2">Personal Statement</h3>
                        <ul class="text-gray-600 text-sm space-y-1">
                            <li>• Character and personal journey focused</li>
                            <li>• Story-driven narrative structure</li>
                            <li>• Emotional connection and authenticity</li>
                            <li>• Broad application types (undergrad, scholarships, etc.)</li>
                            <li>• Personal growth and values emphasis</li>
                        </ul>
                    </div>
                    <div class="bg-white p-4 rounded-lg border border-gray-200">
                        <h3 class="font-semibold text-[#2C3580] mb-2">Statement of Purpose</h3>
                        <ul class="text-gray-600 text-sm space-y-1">
                            <li>• Academic and research focused</li>
                            <li>• Professional, structured format</li>
                            <li>• Technical expertise and goals</li>
                            <li>• Graduate school applications primarily</li>
                            <li>• Research interests and career objectives</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <!-- Application Types Supported -->
            <div class="mt-8 bg-white rounded-lg p-6 border border-gray-200">
                <h2 class="text-xl font-bold text-gray-900 mb-4">🎯 Application Types We Support</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div class="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg">
                        <h3 class="font-semibold">🎓 Undergraduate</h3>
                        <p class="text-sm opacity-90">College admissions, university applications</p>
                    </div>
                    <div class="p-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-lg">
                        <h3 class="font-semibold">🏆 Scholarships</h3>
                        <p class="text-sm opacity-90">Merit-based, need-based applications</p>
                    </div>
                    <div class="p-4 bg-gradient-to-r from-gray-600 to-gray-800 text-white rounded-lg">
                        <h3 class="font-semibold">⚖️ Law School</h3>
                        <p class="text-sm opacity-90">JD programs, legal studies</p>
                    </div>
                    <div class="p-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg">
                        <h3 class="font-semibold">🏥 Medical School</h3>
                        <p class="text-sm opacity-90">MD, DO, medical programs</p>
                    </div>
                    <div class="p-4 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg">
                        <h3 class="font-semibold">🌍 Study Abroad</h3>
                        <p class="text-sm opacity-90">Exchange programs, international study</p>
                    </div>
                    <div class="p-4 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-lg">
                        <h3 class="font-semibold">💼 Professional</h3>
                        <p class="text-sm opacity-90">MBA, specialized degrees</p>
                    </div>
                </div>
            </div>
        {/if}
    </main>
</div>

<style>
    .animate-spin {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
</style>