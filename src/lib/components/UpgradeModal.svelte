<script>
    import { createEventDispatcher } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    
    export let isOpen = false;
    export let limitType = 'documents'; // documents, ai_features, university_matching, etc.
    export let currentPlan = 'free';
    export let currentUsage = 0;
    export let limit = 0;
    export let featureType = ''; // sop, cover_letter, reviews, etc.
    
    const dispatch = createEventDispatcher();
    
    // Dynamic content based on limit type
    const limitContent = {
        documents: {
            sop: {
                icon: '📄',
                title: 'SOP Limit Reached!',
                subtitle: 'You\'ve used all 2 SOPs for this month',
                feature: 'Statement of Purpose',
                benefit: 'Create compelling SOPs that get you into top universities'
            },
            cover_letter: {
                icon: '✉️',
                title: 'Cover Letter Limit Reached!',
                subtitle: 'You\'ve used all 2 Cover Letters for this month',
                feature: 'Cover Letters',
                benefit: 'Professional cover letters that land interviews'
            },
            personal_statement: {
                icon: '📝',
                title: 'Personal Statement Limit Reached!',
                subtitle: 'You\'ve used your 1 Personal Statement for this month',
                feature: 'Personal Statements',
                benefit: 'Powerful personal statements that showcase your story'
            },
            academic_cv: {
                icon: '🎓',
                title: 'Academic CV Limit Reached!',
                subtitle: 'You\'ve used your 1 Academic CV for this month',
                feature: 'Academic CVs',
                benefit: 'Professional CVs that highlight your achievements'
            }
        },
        ai_features: {
            reviews: {
                icon: '🤖',
                title: 'AI Review Limit Reached!',
                subtitle: 'You\'ve used all 3 AI reviews for this month',
                feature: 'AI Document Reviews',
                benefit: 'Get expert-level feedback to perfect your documents'
            },
            text_enhancements: {
                icon: '✨',
                title: 'AI Enhancement Limit Reached!',
                subtitle: 'You\'ve used all 5 text enhancements for this month',
                feature: 'AI Text Enhancements',
                benefit: 'Make your writing more compelling and persuasive'
            }
        }
    };
    
    $: content = limitContent[limitType]?.[featureType] || {
        icon: '🚀',
        title: 'Limit Reached!',
        subtitle: 'You\'ve reached your monthly limit',
        feature: 'Premium Features',
        benefit: 'Unlock unlimited access to all features'
    };
    
    // Success stories for social proof
    const successStories = [
        { name: "Sarah M.", school: "Harvard", quote: "Got into my dream school with Professional plan!" },
        { name: "David K.", school: "MIT", quote: "Elite plan helped me apply to 15+ universities effortlessly." },
        { name: "Amara L.", school: "Stanford", quote: "The AI features saved me weeks of writing time." }
    ];
    
    $: randomStory = successStories[Math.floor(Math.random() * successStories.length)];
    
    function handleUpgrade(planType) {
        dispatch('upgrade', { planType });
        isOpen = false;
    }
    
    function closeModal() {
        dispatch('close');
        isOpen = false;
    }
</script>

{#if isOpen}
    <!-- Backdrop -->
    <div 
        class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        transition:fade={{ duration: 200 }}
        on:click={closeModal}
    >
        <!-- Modal -->
        <div 
            class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
            transition:scale={{ duration: 300, start: 0.9 }}
            on:click|stopPropagation
        >
            <!-- Close Button -->
            <button 
                on:click={closeModal}
                class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
            
            <!-- Header Section -->
            <div class="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-8 rounded-t-2xl">
                <div class="text-center">
                    <div class="text-6xl mb-4">{content.icon}</div>
                    <h2 class="text-3xl font-bold mb-2">{content.title}</h2>
                    <p class="text-blue-100 text-lg">{content.subtitle}</p>
                </div>
                
                {#if limit !== undefined && limit !== null && limit > 1}
                    <!-- Progress Bar -->
                    <div class="mt-6 bg-white bg-opacity-20 rounded-full h-3">
                        <div class="bg-white rounded-full h-3 transition-all duration-500" style="width: 100%"></div>
                    </div>
                    <p class="text-center text-sm text-blue-100 mt-2">
                        {currentUsage}/{limit} {content.feature.toLowerCase()} used this month
                    </p>
                {/if}
            </div>
            
            <!-- Content Section -->
            <div class="p-8">
                <!-- Value Proposition -->
                <div class="text-center mb-8">
                    <h3 class="text-2xl font-semibold text-gray-800 mb-4">
                        Ready to Unlock Your Full Potential? 🚀
                    </h3>
                    <p class="text-gray-600 text-lg leading-relaxed">
                        You're clearly serious about your academic journey. Don't let limits hold you back from achieving your dreams!
                    </p>
                </div>
                
                <!-- Upgrade Options -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <!-- Professional Plan -->
                    <div class="border-2 border-blue-200 rounded-xl p-6 hover:border-blue-400 transition-all duration-300 hover:shadow-lg relative">
                        <div class="absolute -top-3 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Most Popular
                        </div>
                        
                        <div class="text-center mb-4">
                            <h4 class="text-xl font-bold text-gray-800">Academic Professional</h4>
                            <div class="text-3xl font-bold text-blue-600 my-2">$12<span class="text-sm text-gray-500">/month</span></div>
                        </div>
                        
                        <ul class="space-y-3 mb-6">
                            <li class="flex items-center">
                                <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                                <span class="text-gray-700"><strong>50 documents/month</strong></span>
                            </li>
                            <li class="flex items-center">
                                <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                                <span class="text-gray-700">15 AI reviews + 25 enhancements</span>
                            </li>
                            <li class="flex items-center">
                                <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                                <span class="text-gray-700">500+ universities</span>
                            </li>
                            <li class="flex items-center">
                                <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                                <span class="text-gray-700">GPT-4o-mini AI</span>
                            </li>
                        </ul>
                        
                        <button 
                            on:click={() => handleUpgrade('professional')}
                            class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
                        >
                            Upgrade to Professional
                        </button>
                    </div>
                    
                    <!-- Elite Plan -->
                    <div class="border-2 border-purple-200 rounded-xl p-6 hover:border-purple-400 transition-all duration-300 hover:shadow-lg relative">
                        <div class="absolute -top-3 left-4 bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Best Value
                        </div>
                        
                        <div class="text-center mb-4">
                            <h4 class="text-xl font-bold text-gray-800">Academic Elite</h4>
                            <div class="text-3xl font-bold text-purple-600 my-2">$29<span class="text-sm text-gray-500">/month</span></div>
                        </div>
                        
                        <ul class="space-y-3 mb-6">
                            <li class="flex items-center">
                                <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                                <span class="text-gray-700"><strong>UNLIMITED everything</strong></span>
                            </li>
                            <li class="flex items-center">
                                <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                                <span class="text-gray-700">1500+ universities</span>
                            </li>
                            <li class="flex items-center">
                                <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                                <span class="text-gray-700">GPT-4o AI (Best model)</span>
                            </li>
                            <li class="flex items-center">
                                <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                                <span class="text-gray-700">Custom templates</span>
                            </li>
                        </ul>
                        
                        <button 
                            on:click={() => handleUpgrade('elite')}
                            class="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all duration-300 transform hover:scale-105"
                        >
                            Upgrade to Elite
                        </button>
                    </div>
                </div>
                
                <!-- Social Proof -->
                <div class="bg-gray-50 rounded-xl p-6 mb-6">
                    <div class="text-center">
                        <h4 class="text-lg font-semibold text-gray-800 mb-4">Join 10,000+ Students Already Succeeding</h4>
                        <div class="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                            <p class="text-gray-700 italic mb-2">"{randomStory.quote}"</p>
                            <p class="text-sm text-gray-600">— {randomStory.name}, {randomStory.school}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Urgency Elements -->
                <div class="text-center mb-6">
                    <div class="inline-flex items-center bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium">
                        ⏰ Application deadlines are approaching!
                    </div>
                </div>
                
                <!-- Guarantee -->
                <div class="text-center">
                    <p class="text-sm text-gray-500 mb-4">
                        ✅ Cancel anytime • ✅ 30-day money-back guarantee • ✅ Instant access
                    </p>
                    <button 
                        on:click={closeModal}
                        class="text-gray-400 hover:text-gray-600 text-sm underline"
                    >
                        Maybe later (continue with free plan)
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    /* Custom animations */
    @keyframes pulse-border {
        0%, 100% { border-color: rgb(59 130 246); }
        50% { border-color: rgb(147 51 234); }
    }
    
    .animate-pulse-border {
        animation: pulse-border 2s ease-in-out infinite;
    }
</style> 