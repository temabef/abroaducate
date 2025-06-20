<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';

    export let userTier: string = 'free';

    let emailStats = {
        today_sent: 0,
        status: 'active',
        last_digest: null,
        subscription_days_left: null
    };

    let loading = true;

    onMount(async () => {
        await loadEmailStats();
    });

    async function loadEmailStats() {
        try {
            // Get today's email activity - mock for now since API doesn't exist yet
            emailStats = {
                today_sent: Math.floor(Math.random() * 3),
                status: 'active',
                last_digest: new Date().toISOString(),
                subscription_days_left: userTier !== 'free' ? 25 : null
            };
        } catch (error) {
            console.error('Error loading email stats:', error);
        } finally {
            loading = false;
        }
    }

    function getStatusColor(status: string) {
        switch (status) {
            case 'active': return 'text-green-600';
            case 'limited': return 'text-yellow-600';
            case 'disabled': return 'text-red-600';
            default: return 'text-gray-600';
        }
    }

    function getStatusText() {
        if (userTier === 'free') {
            return 'Scholarship digest only';
        } else {
            return emailStats.status === 'active' ? 'All features active' : 'Limited';
        }
    }
</script>

<div class="bg-white rounded-lg border border-gray-200 p-4">
    <div class="flex items-center justify-between mb-3">
        <h3 class="font-medium text-gray-900">📧 Email Status</h3>
        <span class="w-2 h-2 rounded-full {emailStats.status === 'active' ? 'bg-green-400' : emailStats.status === 'limited' ? 'bg-yellow-400' : 'bg-red-400'}"></span>
    </div>

    {#if loading}
        <div class="animate-pulse">
            <div class="h-4 bg-gray-200 rounded mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
    {:else}
        <div class="space-y-2 text-sm">
            <!-- Today's Activity -->
            <div class="flex justify-between">
                <span class="text-gray-600">Today's Activity</span>
                <span class="font-medium">{emailStats.today_sent} emails</span>
            </div>

            <!-- Status -->
            <div class="flex justify-between">
                <span class="text-gray-600">Status</span>
                <span class="font-medium {getStatusColor(emailStats.status)}">
                    {getStatusText()}
                </span>
            </div>

            <!-- Email Types Based on Tier -->
            <div class="mt-3 pt-3 border-t border-gray-100">
                <div class="text-xs text-gray-500 mb-2">Email Types:</div>
                
                <!-- Scholarship Digest (Everyone) -->
                <div class="flex items-center gap-2 text-xs">
                    <span class="w-2 h-2 bg-blue-400 rounded-full"></span>
                    <span>Weekly scholarship digest</span>
                    <span class="text-green-600">✓</span>
                </div>

                {#if userTier !== 'free'}
                    <!-- Application Reminders (Paid) -->
                    <div class="flex items-center gap-2 text-xs">
                        <span class="w-2 h-2 bg-green-400 rounded-full"></span>
                        <span>Application reminders</span>
                        <span class="text-green-600">✓</span>
                    </div>

                    <!-- Subscription Alerts (Paid) -->
                    <div class="flex items-center gap-2 text-xs">
                        <span class="w-2 h-2 bg-indigo-400 rounded-full"></span>
                        <span>Account alerts</span>
                        <span class="text-green-600">✓</span>
                    </div>

                    {#if userTier === 'professional'}
                        <!-- Daily Scholarships (Professional+) -->
                        <div class="flex items-center gap-2 text-xs">
                            <span class="w-2 h-2 bg-purple-400 rounded-full"></span>
                            <span>Daily scholarship option</span>
                            <span class="text-green-600">✓</span>
                        </div>
                    {/if}

                    {#if userTier === 'elite'}
                        <!-- Instant Alerts (Elite) -->
                        <div class="flex items-center gap-2 text-xs">
                            <span class="w-2 h-2 bg-yellow-400 rounded-full"></span>
                            <span>Instant deadline alerts</span>
                            <span class="text-green-600">✓</span>
                        </div>
                    {/if}
                {:else}
                    <!-- Locked Features for Free Users -->
                    <div class="flex items-center gap-2 text-xs text-gray-400">
                        <span class="w-2 h-2 bg-gray-300 rounded-full"></span>
                        <span>Application reminders</span>
                        <span class="text-gray-400">🔒</span>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-gray-400">
                        <span class="w-2 h-2 bg-gray-300 rounded-full"></span>
                        <span>Daily scholarships</span>
                        <span class="text-gray-400">🔒</span>
                    </div>
                {/if}
            </div>

            <!-- Subscription Info for Paid Users -->
            {#if userTier !== 'free' && emailStats.subscription_days_left}
                <div class="mt-3 pt-3 border-t border-gray-100">
                    <div class="text-xs text-gray-500">
                        Subscription: {emailStats.subscription_days_left} days remaining
                    </div>
                </div>
            {/if}
        </div>
    {/if}

    <div class="mt-4">
        <a href="/account/preferences" class="text-blue-600 hover:text-blue-700 text-sm">
            Manage Settings →
        </a>
    </div>
</div> 