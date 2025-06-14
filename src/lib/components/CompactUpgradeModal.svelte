<script>
    import { createEventDispatcher } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    
    export let isOpen = false;
    export let limitType = 'documents';
    export let currentPlan = 'free';
    export let currentUsage = 0;
    export let limit = 0;
    export let featureType = '';
    
    const dispatch = createEventDispatcher();
    
    // Content for different features - compact version
    const limitContent = {
        documents: {
            sop: { icon: '📄', title: 'SOP Limit Reached!', subtitle: 'Ready for unlimited SOPs?' },
            cover_letter: { icon: '✉️', title: 'Cover Letter Limit Reached!', subtitle: 'Ready for unlimited cover letters?' },
            personal_statement: { icon: '📝', title: 'Personal Statement Limit Reached!', subtitle: 'Ready for unlimited statements?' },
            academic_cv: { icon: '🎓', title: 'Academic CV Limit Reached!', subtitle: 'Ready for unlimited CVs?' }
        },
        ai_features: {
            reviews: { icon: '🤖', title: 'AI Review Limit Reached!', subtitle: 'Ready for unlimited AI reviews?' },
            text_enhancements: { icon: '✨', title: 'AI Enhancement Limit Reached!', subtitle: 'Ready for unlimited enhancements?' }
        }
    };
    
    $: content = limitContent[limitType]?.[featureType] || {
        icon: '🚀',
        title: 'Limit Reached!',
        subtitle: 'Ready for unlimited access?'
    };
    
    const testimonials = [
        { name: "Sarah M.", school: "Harvard", quote: "Upgraded and got accepted!" },
        { name: "David K.", school: "MIT", quote: "Best investment I made." },
        { name: "Amara L.", school: "Stanford", quote: "Got into my dream school!" }
    ];
    
    $: randomTestimonial = testimonials[Math.floor(Math.random() * testimonials.length)];
    
    function goToPricing() {
        dispatch('upgrade', { planType: 'pricing' });
        isOpen = false;
    }
    
    function closeModal() {
        dispatch('close');
        isOpen = false;
    }
</script>

{#if isOpen}
    <!-- Less aggressive backdrop -->
    <div 
        class="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        transition:fade={{ duration: 200 }}
        on:click={closeModal}
        on:keydown={(e) => e.key === 'Escape' && closeModal()}
        role="dialog"
        aria-modal="true"
        tabindex="-1"
    >
        <!-- Compact Modal -->
        <div 
            class="bg-white rounded-2xl shadow-2xl max-w-md w-full relative"
            transition:scale={{ duration: 300, start: 0.95 }}
            on:click|stopPropagation
        >
            <!-- Close Button -->
            <button 
                on:click={closeModal}
                class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10"
                aria-label="Close modal"
            >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
            
            <!-- Header -->
            <div class="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-5 rounded-t-2xl text-center">
                <div class="text-4xl mb-2">{content.icon}</div>
                <h2 class="text-lg font-bold mb-1">{content.title}</h2>
                <p class="text-blue-100 text-sm">{content.subtitle}</p>
                
                <!-- Progress Bar -->
                <div class="mt-3 bg-white bg-opacity-20 rounded-full h-1.5">
                    <div class="bg-white rounded-full h-1.5" style="width: 100%"></div>
                </div>
                <p class="text-xs text-blue-100 mt-1">{currentUsage}/{limit} used this month</p>
            </div>
            
            <!-- Content -->
            <div class="p-5">
                <!-- Social Proof -->
                <div class="bg-gray-50 rounded-lg p-3 mb-4 text-center">
                    <p class="text-gray-700 text-sm italic mb-1">"{randomTestimonial.quote}"</p>
                    <p class="text-xs text-gray-600">— {randomTestimonial.name}, {randomTestimonial.school}</p>
                </div>
                
                <!-- Quick Pricing -->
                <div class="grid grid-cols-2 gap-2 mb-4">
                    <div class="border border-blue-200 rounded-lg p-3 text-center">
                        <div class="text-blue-600 font-bold">$12</div>
                        <div class="text-xs text-gray-600">Professional</div>
                        <div class="text-xs text-gray-500">50 docs/month</div>
                    </div>
                    <div class="border border-purple-200 rounded-lg p-3 text-center">
                        <div class="text-purple-600 font-bold">$29</div>
                        <div class="text-xs text-gray-600">Elite</div>
                        <div class="text-xs text-gray-500">Unlimited</div>
                    </div>
                </div>
                
                <!-- Main CTA -->
                <button 
                    on:click={goToPricing}
                    class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 mb-3"
                >
                    🚀 View Plans & Upgrade
                </button>
                
                <!-- Secondary option -->
                <div class="text-center">
                    <button 
                        on:click={closeModal}
                        class="text-gray-400 hover:text-gray-600 text-sm underline"
                    >
                        Maybe later
                    </button>
                </div>
                
                <!-- Guarantee -->
                <div class="text-center mt-3">
                    <p class="text-xs text-gray-500">✅ 30-day guarantee • ✅ Cancel anytime</p>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .transform {
        transition: transform 0.2s ease-in-out;
    }
</style> 