<script lang="ts">
    import { onMount, tick } from 'svelte';
    import { Send, Copy, CheckCircle2, User, Building2, Briefcase, Sparkles, Rocket } from 'lucide-svelte';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
    let { user, profile } = $derived(data);

    let isGenerating = $state(false);
    let showSuccess = $state(false);
    let generatedEmail = $state<{ subject: string; body: string } | null>(null);
    let errorMessage = $state('');
    let copied = $state(false);

    let formData = $state({
        professorName: '',
        professorTitle: 'Dr.',
        university: '',
        department: '',
        professorResearch: '',
        studentResearch: '',
        studentName: '',
        studentProgram: '',
        emailTone: 'professional',
        additionalInfo: ''
    });

    onMount(() => {
        if (profile) {
            formData.studentName = user?.user_metadata?.full_name || '';
            formData.studentProgram = profile.current_level ? `Prospective ${profile.target_level} in ${profile.field_of_study || 'Related Field'}` : '';
        }
    });

    async function generateEmail() {
        isGenerating = true;
        errorMessage = '';
        
        try {
            const response = await fetch('/api/generate-cold-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                generatedEmail = await response.json();
                showSuccess = true;
                setTimeout(() => {
                    document.getElementById('success-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            } else {
                const error = await response.json();
                errorMessage = error.error || 'Unknown error occurred.';
            }
        } catch (error) {
            errorMessage = 'Failed to connect to the server.';
        }
        
        isGenerating = false;
    }

    function copyToClipboard() {
        if (!generatedEmail) return;
        const text = `Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`;
        navigator.clipboard.writeText(text);
        copied = true;
        setTimeout(() => copied = false, 2000);
    }
    
    function startNew() {
        showSuccess = false;
        generatedEmail = null;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
</script>

<svelte:head>
    <title>Cold Email Generator | Clarity Engine</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 pt-20 pb-16 font-sans">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Header -->
        <div class="text-center mb-10">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 mb-6 shadow-sm border border-indigo-200">
                <Send size={32} />
            </div>
            <h1 class="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 tracking-tighter">Academic Cold Email Generator</h1>
            <p class="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Reach out to professors for supervision or research positions. Let our AI craft a persuasive, highly-tailored introduction that highlights your research overlap.
            </p>
        </div>

        {#if errorMessage}
            <div class="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm">
                <div class="flex items-center text-red-800">
                    <span class="font-semibold">Generation Failed:</span>
                    <span class="ml-2">{errorMessage}</span>
                </div>
            </div>
        {/if}

        {#if showSuccess && generatedEmail}
            <!-- Success Section -->
            <div id="success-section" class="bg-white border text-left border-indigo-100 shadow-xl shadow-indigo-100/50 rounded-2xl overflow-hidden mb-8 transform transition-all duration-500">
                <div class="bg-gradient-to-r from-indigo-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                    <h2 class="text-xl font-bold text-white flex items-center gap-2">
                        <CheckCircle2 size={24} class="text-indigo-200" />
                        Your Cold Email is Ready
                    </h2>
                    <button onclick={copyToClipboard} class="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                        {#if copied}
                            <CheckCircle2 size={16} /> Copied!
                        {:else}
                            <Copy size={16} /> Copy to Clipboard
                        {/if}
                    </button>
                </div>
                
                <div class="p-8">
                    <div class="mb-6">
                        <span class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 block">Subject Line</span>
                        <div class="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-800 font-medium">
                            {generatedEmail.subject}
                        </div>
                    </div>
                    
                    <div>
                        <span class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 block">Email Body</span>
                        <div class="bg-slate-50 p-5 rounded-lg border border-slate-200 text-slate-700 whitespace-pre-wrap leading-relaxed shadow-inner">
                            {generatedEmail.body}
                        </div>
                    </div>
                    
                    <div class="mt-8 text-center pt-6 border-t border-slate-100">
                        <button onclick={startNew} class="text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-colors">
                            ← Draft another email
                        </button>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Form Section -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden {showSuccess ? 'opacity-50 pointer-events-none' : ''}">
            <div class="p-8">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <!-- Left Column: Professor Info -->
                    <div>
                        <h3 class="flex items-center gap-2 text-lg font-bold text-slate-900 mb-6 pb-2 border-b border-slate-100">
                            <Building2 size={20} class="text-indigo-600" />
                            Target Professor Details
                        </h3>
                        
                        <div class="space-y-5">
                            <div class="grid grid-cols-3 gap-3">
                                <div class="col-span-1">
                                    <label for="cold-email-professor-title" class="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                                    <select id="cold-email-professor-title" bind:value={formData.professorTitle} class="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5">
                                        <option value="Dr.">Dr.</option>
                                        <option value="Prof.">Prof.</option>
                                        <option value="Prof. Dr.">Prof. Dr.</option>
                                    </select>
                                </div>
                                <div class="col-span-2">
                                    <label for="cold-email-professor-name" class="block text-sm font-semibold text-slate-700 mb-1">Professor Name</label>
                                    <input id="cold-email-professor-name" type="text" bind:value={formData.professorName} class="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5" placeholder="e.g. Hans Müller" required>
                                </div>
                            </div>

                            <div>
                                <label for="cold-email-university" class="block text-sm font-semibold text-slate-700 mb-1">University</label>
                                <input id="cold-email-university" type="text" bind:value={formData.university} class="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5" placeholder="e.g. Technical University of Munich">
                            </div>

                            <div>
                                <label for="cold-email-professor-research" class="block text-sm font-semibold text-slate-700 mb-1">Professor's Research Focus</label>
                                <textarea id="cold-email-professor-research" bind:value={formData.professorResearch} rows="3" class="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5" placeholder="What are they currently researching? Mention specific papers or lab focus." required></textarea>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column: Student Info -->
                    <div>
                        <h3 class="flex items-center gap-2 text-lg font-bold text-slate-900 mb-6 pb-2 border-b border-slate-100">
                            <User size={20} class="text-indigo-600" />
                            Your Profile
                        </h3>
                        
                        <div class="space-y-5">
                            <div>
                                <label for="cold-email-student-name" class="block text-sm font-semibold text-slate-700 mb-1">Your Full Name</label>
                                <input id="cold-email-student-name" type="text" bind:value={formData.studentName} class="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5" placeholder="e.g. Jane Doe" required>
                            </div>

                            <div>
                                <label for="cold-email-student-program" class="block text-sm font-semibold text-slate-700 mb-1">Current Status / Target Program</label>
                                <input id="cold-email-student-program" type="text" bind:value={formData.studentProgram} class="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5" placeholder="e.g. Master's Student in Robotics">
                            </div>

                            <div>
                                <label for="cold-email-student-research" class="block text-sm font-semibold text-slate-700 mb-1">Your Research Interests & Background</label>
                                <textarea id="cold-email-student-research" bind:value={formData.studentResearch} rows="3" class="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5" placeholder="How does your experience overlap with the professor's work?" required></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mt-8 pt-8 border-t border-slate-100">
                    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div class="w-full sm:w-1/3">
                            <label for="cold-email-tone" class="block text-sm font-semibold text-slate-700 mb-1">Tone</label>
                            <select id="cold-email-tone" bind:value={formData.emailTone} class="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5">
                                <option value="professional">Professional & Academic</option>
                                <option value="enthusiastic">Enthusiastic & Passionate</option>
                                <option value="semi-formal">Semi-Formal & Direct</option>
                            </select>
                        </div>
                        
                        <div class="w-full sm:w-auto mt-4 sm:mt-0">
                            <button 
                                onclick={generateEmail}
                                disabled={isGenerating || !formData.professorName || !formData.studentName || !formData.professorResearch || !formData.studentResearch}
                                class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-200 transition-all focus:ring-4 focus:ring-indigo-100"
                            >
                                {#if isGenerating}
                                    <Sparkles size={18} class="animate-pulse" />
                                    Drafting Email...
                                {:else}
                                    <Sparkles size={18} />
                                    Generate Cold Email 
                                    <span class="ml-2 px-2 py-0.5 bg-indigo-800 rounded-full text-xs font-semibold opacity-90">-1 Credit</span>
                                {/if}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</div>
