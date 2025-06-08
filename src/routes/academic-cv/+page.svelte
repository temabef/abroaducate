<script lang="ts">
    import { onMount } from 'svelte';
    import type { PageData } from './$types';
    import AcademicCVBuilder from '$lib/components/AcademicCVBuilder.svelte';
    
    export let data: PageData;
    let { supabase, session } = data;
    
    let userData: any = null;
    let loading = true;
    
    onMount(async () => {
        if (session?.user) {
            // Fetch user profile data
            const response = await fetch('/api/get-user-profile');
            if (response.ok) {
                userData = await response.json();
            }
        }
        
        loading = false;
    });
</script>

<svelte:head>
    <title>Academic CV Builder - Professional CV Generator</title>
    <meta name="description" content="Create professional academic CVs tailored to your field. Generate polished CVs for academic applications, fellowships, and career advancement." />
</svelte:head>

<div class="min-h-screen bg-gray-50 pt-20">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Header Section -->
        <div class="text-center mb-12">
            <h1 class="text-4xl font-bold text-gray-900 mb-4">📄 Academic CV Builder</h1>
            <p class="text-xl text-gray-600 max-w-3xl mx-auto">
                Create professional academic CVs tailored to your field and career stage. 
                Generate polished, field-specific CVs that showcase your academic achievements effectively.
            </p>
        </div>

        {#if loading}
            <div class="flex justify-center items-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        {:else}
            <!-- CV Builder Component -->
            <div class="mb-12">
                <AcademicCVBuilder existingUserData={userData} />
            </div>

            <!-- Educational Content -->
            <div class="bg-white rounded-lg shadow-lg p-8 mb-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">🎯 Academic CV Guide</h2>
                
                <!-- Field-Specific Tips -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div class="bg-blue-50 rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-blue-900 mb-3">🔬 STEM Fields</h3>
                        <ul class="text-sm text-blue-800 space-y-2">
                            <li>• Emphasize research publications and technical skills</li>
                            <li>• Include methodologies and quantifiable results</li>
                            <li>• Highlight programming languages and software</li>
                            <li>• Show conference presentations and patents</li>
                        </ul>
                    </div>
                    
                    <div class="bg-purple-50 rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-purple-900 mb-3">📚 Humanities</h3>
                        <ul class="text-sm text-purple-800 space-y-2">
                            <li>• Focus on teaching and scholarly publications</li>
                            <li>• Include languages and cultural competencies</li>
                            <li>• Highlight conference presentations and lectures</li>
                            <li>• Show editorial and review work</li>
                        </ul>
                    </div>
                    
                    <div class="bg-green-50 rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-green-900 mb-3">🌍 Social Sciences</h3>
                        <ul class="text-sm text-green-800 space-y-2">
                            <li>• Balance research and community engagement</li>
                            <li>• Include fieldwork and policy applications</li>
                            <li>• Show both qualitative and quantitative methods</li>
                            <li>• Highlight public impact and outreach</li>
                        </ul>
                    </div>
                </div>

                <!-- CV Structure Guide -->
                <div class="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">📋 Essential CV Sections</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 class="font-medium text-gray-800 mb-2">Core Sections (All Fields)</h4>
                            <ul class="text-sm text-gray-600 space-y-1">
                                <li>• Contact Information</li>
                                <li>• Education & Degrees</li>
                                <li>• Research Experience</li>
                                <li>• Publications</li>
                                <li>• Professional Experience</li>
                                <li>• Awards & Honors</li>
                            </ul>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-800 mb-2">Field-Specific Additions</h4>
                            <ul class="text-sm text-gray-600 space-y-1">
                                <li>• Teaching Experience (Humanities)</li>
                                <li>• Technical Skills (STEM)</li>
                                <li>• Clinical Experience (Medical)</li>
                                <li>• Exhibitions/Performances (Arts)</li>
                                <li>• Fieldwork (Social Sciences)</li>
                                <li>• Certifications (Professional)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Best Practices -->
                <div class="bg-yellow-50 rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-yellow-900 mb-4">💡 Academic CV Best Practices</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 class="font-medium text-yellow-800 mb-2">✅ Do</h4>
                            <ul class="text-sm text-yellow-700 space-y-1">
                                <li>• Use reverse chronological order</li>
                                <li>• Include complete publication citations</li>
                                <li>• Quantify achievements and impact</li>
                                <li>• Tailor sections to your field</li>
                                <li>• Keep formatting clean and consistent</li>
                                <li>• Include ongoing/submitted work</li>
                            </ul>
                        </div>
                        <div>
                            <h4 class="font-medium text-yellow-800 mb-2">❌ Don't</h4>
                            <ul class="text-sm text-yellow-700 space-y-1">
                                <li>• Include personal photos or age</li>
                                <li>• Use generic job CV formatting</li>
                                <li>• Exceed length expectations (varies by field)</li>
                                <li>• Include irrelevant non-academic work</li>
                                <li>• Use inconsistent citation styles</li>
                                <li>• Forget to update regularly</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Success Stories -->
            <div class="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-lg text-white p-8">
                <h2 class="text-2xl font-bold mb-6">🏆 Academic CV Success</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="text-center">
                        <div class="text-3xl font-bold mb-2">10k+</div>
                        <div class="text-indigo-200">Academic CVs Generated</div>
                    </div>
                    <div class="text-center">
                        <div class="text-3xl font-bold mb-2">85%</div>
                        <div class="text-indigo-200">Report Improved Applications</div>
                    </div>
                    <div class="text-center">
                        <div class="text-3xl font-bold mb-2">6</div>
                        <div class="text-indigo-200">Academic Field Templates</div>
                    </div>
                </div>
            </div>
        {/if}
    </div>
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