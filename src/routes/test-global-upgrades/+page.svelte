<script lang="ts">
    import { handleUpgradeRequired } from '$lib/services/upgradeService';
    
    // Test different upgrade scenarios
    function testAcademicCV() {
        handleUpgradeRequired({
            upgradeRequired: true,
            planType: 'free',
            currentUsage: 1,
            limit: 1,
            message: 'You have reached your academic CV limit',
            usageType: 'academic_cvs_created'
        });
    }
    
    function testSOP() {
        handleUpgradeRequired({
            upgradeRequired: true,
            planType: 'free',
            currentUsage: 2,
            limit: 2,
            message: 'You have reached your SOP limit',
            usageType: 'sops_created'
        });
    }
    
    function testCoverLetter() {
        handleUpgradeRequired({
            upgradeRequired: true,
            planType: 'free',
            currentUsage: 2,
            limit: 2,
            message: 'You have reached your cover letter limit',
            usageType: 'cover_letters_created'
        });
    }
    
    function testAIReviews() {
        handleUpgradeRequired({
            upgradeRequired: true,
            planType: 'free',
            currentUsage: 3,
            limit: 3,
            message: 'You have reached your AI review limit',
            usageType: 'ai_reviews'
        });
    }
</script>

<svelte:head>
    <title>Global Upgrade System Test</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4">
        <h1 class="text-4xl font-bold text-gray-900 mb-8 text-center">
            🧪 Global Upgrade System Test
        </h1>
        
        <!-- Test Buttons -->
        <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Test Different Features</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                    on:click={testAcademicCV}
                    class="bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    🎓 Test Academic CV Limit
                </button>
                <button 
                    on:click={testSOP}
                    class="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                    📄 Test SOP Limit
                </button>
                <button 
                    on:click={testCoverLetter}
                    class="bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                >
                    ✉️ Test Cover Letter Limit
                </button>
                <button 
                    on:click={testAIReviews}
                    class="bg-pink-600 text-white py-3 px-4 rounded-lg hover:bg-pink-700 transition-colors"
                >
                    🤖 Test AI Reviews Limit
                </button>
            </div>
        </div>
        
        <!-- Features -->
        <div class="bg-white rounded-xl shadow-lg p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">✨ New Features</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="text-center">
                    <div class="text-4xl mb-3">📏</div>
                    <h3 class="font-bold text-lg mb-2">Compact Design</h3>
                    <p class="text-gray-600 text-sm">No scrolling needed</p>
                </div>
                <div class="text-center">
                    <div class="text-4xl mb-3">👁️</div>
                    <h3 class="font-bold text-lg mb-2">Less Aggressive</h3>
                    <p class="text-gray-600 text-sm">30% opacity backdrop</p>
                </div>
                <div class="text-center">
                    <div class="text-4xl mb-3">🎯</div>
                    <h3 class="font-bold text-lg mb-2">Direct to Pricing</h3>
                    <p class="text-gray-600 text-sm">Focused on conversion</p>
                </div>
            </div>
        </div>
    </div>
</div> 