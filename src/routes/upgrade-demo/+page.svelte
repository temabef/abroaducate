<script>
    import UpgradeModal from '$lib/components/UpgradeModal.svelte';
    import UpgradeToast from '$lib/components/UpgradeToast.svelte';
    import { trackInteraction } from '$lib/stores/upgradeStrategy';
    
    let showModal = false;
    let showToast = false;
    
    let modalConfig = {
        limitType: 'documents',
        featureType: 'academic_cv',
        currentPlan: 'free',
        currentUsage: 1,
        limit: 1
    };
    
    let toastConfig = {
        limitType: 'documents',
        featureType: 'sop',
        currentUsage: 2,
        limit: 2,
        planType: 'free'
    };
    
    function showAcademicCVModal() {
        modalConfig = {
            limitType: 'documents',
            featureType: 'academic_cv',
            currentPlan: 'free',
            currentUsage: 1,
            limit: 1
        };
        trackInteraction('documents', 'academic_cv', 'shown');
        showModal = true;
    }
    
    function showSOPModal() {
        modalConfig = {
            limitType: 'documents',
            featureType: 'sop',
            currentPlan: 'free',
            currentUsage: 2,
            limit: 2
        };
        trackInteraction('documents', 'sop', 'shown');
        showModal = true;
    }
    
    function showAIFeaturesModal() {
        modalConfig = {
            limitType: 'ai_features',
            featureType: 'reviews',
            currentPlan: 'free',
            currentUsage: 3,
            limit: 3
        };
        trackInteraction('ai_features', 'reviews', 'shown');
        showModal = true;
    }
    
    function showSOPToast() {
        toastConfig = {
            limitType: 'documents',
            featureType: 'sop',
            currentUsage: 1,
            limit: 2,
            planType: 'free'
        };
        showToast = true;
    }
    
    function showAIToast() {
        toastConfig = {
            limitType: 'ai_features',
            featureType: 'reviews',
            currentUsage: 2,
            limit: 3,
            planType: 'free'
        };
        showToast = true;
    }
    
    function handleUpgrade(event) {
        console.log('Upgrade clicked:', event.detail);
        trackInteraction(modalConfig.limitType, modalConfig.featureType, 'upgraded');
        showModal = false;
        showToast = false;
        alert(`Redirecting to pricing for ${event.detail.planType} plan!`);
    }
    
    function handleDismiss() {
        trackInteraction(modalConfig.limitType, modalConfig.featureType, 'dismissed');
        showModal = false;
        showToast = false;
    }
</script>

<svelte:head>
    <title>Upgrade System Demo - SOP GPT</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-6xl mx-auto px-4">
        <div class="text-center mb-12">
            <h1 class="text-4xl font-bold text-gray-900 mb-4">
                🚀 New Upgrade Experience Demo
            </h1>
            <p class="text-xl text-gray-600">
                Beautiful, conversion-optimized upgrade prompts that actually get users to upgrade!
            </p>
        </div>
        
        <!-- Before vs After Comparison -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <!-- Old Way -->
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h2 class="text-2xl font-bold text-red-600 mb-4">❌ Old Way (Basic Popup)</h2>
                <div class="bg-gray-100 rounded-lg p-4 border">
                    <div class="text-sm text-gray-700 font-mono">
                        localhost:5173 says<br><br>
                        🚀 You've reached your academic cvs_created limit for your free plan.<br><br>
                        Your current plan: free<br>
                        Usage: 1/1<br><br>
                        Upgrade to Professional ($12/month) for 50 documents or Elite ($29/month) for unlimited!<br><br>
                        Would you like to upgrade now?
                    </div>
                    <div class="flex gap-2 mt-4">
                        <button class="px-4 py-2 bg-gray-300 text-gray-700 rounded text-sm">Cancel</button>
                        <button class="px-4 py-2 bg-blue-500 text-white rounded text-sm">OK</button>
                    </div>
                </div>
                <div class="mt-4 text-sm text-gray-600">
                    <strong>Problems:</strong>
                    <ul class="list-disc list-inside mt-2 space-y-1">
                        <li>Ugly browser confirm dialog</li>
                        <li>No visual appeal</li>
                        <li>No social proof</li>
                        <li>No value proposition</li>
                        <li>Terrible user experience</li>
                    </ul>
                </div>
            </div>
            
            <!-- New Way -->
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h2 class="text-2xl font-bold text-green-600 mb-4">✅ New Way (Beautiful Modal)</h2>
                <div class="space-y-4">
                    <button 
                        on:click={showAcademicCVModal}
                        class="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
                    >
                        🎓 Academic CV Limit Demo
                    </button>
                    <button 
                        on:click={showSOPModal}
                        class="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-blue-700 transition-all transform hover:scale-105"
                    >
                        📄 SOP Limit Demo
                    </button>
                    <button 
                        on:click={showAIFeaturesModal}
                        class="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all transform hover:scale-105"
                    >
                        🤖 AI Features Limit Demo
                    </button>
                </div>
                <div class="mt-4 text-sm text-gray-600">
                    <strong>Improvements:</strong>
                    <ul class="list-disc list-inside mt-2 space-y-1">
                        <li>Beautiful, professional design</li>
                        <li>Social proof with testimonials</li>
                        <li>Clear value propositions</li>
                        <li>Psychological triggers</li>
                        <li>Mobile responsive</li>
                        <li>Conversion optimized</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <!-- Toast Notifications Demo -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-12">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">🔔 Smart Toast Notifications</h2>
            <p class="text-gray-600 mb-6">
                Non-intrusive notifications that appear when users are approaching their limits (80%+ usage)
            </p>
            <div class="flex gap-4 flex-wrap">
                <button 
                    on:click={showSOPToast}
                    class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Show SOP Warning Toast
                </button>
                <button 
                    on:click={showAIToast}
                    class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                    Show AI Features Warning Toast
                </button>
            </div>
        </div>
        
        <!-- Conversion Psychology Features -->
        <div class="bg-white rounded-xl shadow-lg p-6">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">🧠 Conversion Psychology Features</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="text-center">
                    <div class="text-4xl mb-3">🏆</div>
                    <h3 class="font-bold text-lg mb-2">Social Proof</h3>
                    <p class="text-gray-600 text-sm">Real testimonials from Harvard, MIT, Stanford students</p>
                </div>
                <div class="text-center">
                    <div class="text-4xl mb-3">⏰</div>
                    <h3 class="font-bold text-lg mb-2">Urgency</h3>
                    <p class="text-gray-600 text-sm">"Application deadlines are approaching!" messaging</p>
                </div>
                <div class="text-center">
                    <div class="text-4xl mb-3">💎</div>
                    <h3 class="font-bold text-lg mb-2">Value Stacking</h3>
                    <p class="text-gray-600 text-sm">Clear feature comparisons and benefit highlighting</p>
                </div>
                <div class="text-center">
                    <div class="text-4xl mb-3">🎯</div>
                    <h3 class="font-bold text-lg mb-2">Personalization</h3>
                    <p class="text-gray-600 text-sm">Content adapts based on which feature they hit limits on</p>
                </div>
                <div class="text-center">
                    <div class="text-4xl mb-3">🛡️</div>
                    <h3 class="font-bold text-lg mb-2">Risk Reversal</h3>
                    <p class="text-gray-600 text-sm">30-day money-back guarantee prominently displayed</p>
                </div>
                <div class="text-center">
                    <div class="text-4xl mb-3">📊</div>
                    <h3 class="font-bold text-lg mb-2">Progress Tracking</h3>
                    <p class="text-gray-600 text-sm">Visual progress bars show how much they've used</p>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Modal Component -->
<UpgradeModal 
    bind:isOpen={showModal}
    limitType={modalConfig.limitType}
    currentPlan={modalConfig.currentPlan}
    currentUsage={modalConfig.currentUsage}
    limit={modalConfig.limit}
    featureType={modalConfig.featureType}
    on:upgrade={handleUpgrade}
    on:close={handleDismiss}
/>

<!-- Toast Component -->
<UpgradeToast 
    bind:isVisible={showToast}
    limitType={toastConfig.limitType}
    featureType={toastConfig.featureType}
    currentUsage={toastConfig.currentUsage}
    limit={toastConfig.limit}
    planType={toastConfig.planType}
    on:upgrade={handleUpgrade}
/> 