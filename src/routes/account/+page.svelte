<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import type { PageData } from './$types';
    
    export let data: PageData;
    
    let { supabase, session } = data;
    let userSubscription: any = null;
    let usage: any = null;
    let planLimits: any = null;
    let loading = true;
    let showCancelModal = false;
    
    const planColors = {
        free: 'bg-gray-100 text-gray-800',
        basic: 'bg-green-100 text-green-800',
        pro: 'bg-purple-100 text-purple-800'
    };
    
    const planIcons = {
        free: '🆓',
        basic: '⭐',
        pro: '👑'
    };
    
    onMount(async () => {
        if (!session?.user) {
            goto('/auth/login');
            return;
        }
        
        await loadAccountData();
    });
    
    async function loadAccountData() {
        loading = true;
        try {
            // Fetch user subscription
            const { data: subscriptionData, error: subError } = await supabase
                .from('user_subscriptions')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('status', 'active')
                .single();
            
            if (subError && subError.code !== 'PGRST116') {
                console.error('Error fetching subscription:', subError);
            } else {
                userSubscription = subscriptionData || { plan_type: 'free', status: 'active' };
            }
            
            // Fetch current usage
            const { data: usageData, error: usageError } = await supabase
                .rpc('get_current_usage', { user_uuid: session.user.id });
            
            if (usageError) {
                console.error('Error fetching usage:', usageError);
            } else {
                usage = usageData?.[0] || { sops_created: 0, ai_improvements_used: 0, analytics_generated: 0, plagiarism_checks: 0 };
            }
            
            // Fetch plan limits
            const { data: limitsData, error: limitsError } = await supabase
                .from('plan_limits')
                .select('*')
                .eq('plan_type', userSubscription?.plan_type || 'free')
                .single();
            
            if (limitsError) {
                console.error('Error fetching limits:', limitsError);
            } else {
                planLimits = limitsData;
            }
            
        } catch (error) {
            console.error('Error loading account data:', error);
        } finally {
            loading = false;
        }
    }
    
    function getUsagePercentage(used: number, limit: number | null): number {
        if (limit === null) return 0; // Unlimited
        return Math.min((used / limit) * 100, 100);
    }
    
    function formatDate(dateString: string | null): string {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    }
    
    async function handleUpgrade(planType: 'basic' | 'pro') {
        // Redirect to subscription page with selected plan
        goto(`/subscribe?plan=${planType}`);
    }
    
    async function handleCancelSubscription() {
        showCancelModal = true;
    }
    
    async function confirmCancelSubscription() {
        // This would typically call your subscription cancellation API
        // For now, just close the modal
        showCancelModal = false;
        // TODO: Implement actual cancellation logic
        console.log('Cancel subscription - integrate with Stripe');
    }
    
    async function handleLogout() {
        await supabase.auth.signOut();
        goto('/');
    }
</script>

<svelte:head>
    <title>Account Settings - SOP Generator</title>
    <meta name="description" content="Manage your account settings, subscription, and usage statistics" />
</svelte:head>

<div class="account-page">
    <div class="account-container">
        <div class="account-header">
            <h1>Account Settings</h1>
            <p>Manage your subscription, view usage, and update your preferences</p>
        </div>
        
        {#if loading}
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading account information...</p>
            </div>
        {:else}
            <!-- Profile Information -->
            <div class="account-section">
                <div class="section-header">
                    <h2>👤 Profile Information</h2>
                </div>
                <div class="profile-card">
                    <div class="profile-avatar">
                        {session.user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div class="profile-info">
                        <h3>{session.user.email}</h3>
                        <p>Member since {formatDate(session.user.created_at)}</p>
                        <div class="plan-badge {planColors[userSubscription?.plan_type || 'free']}">
                            {planIcons[userSubscription?.plan_type || 'free']} {userSubscription?.plan_type?.toUpperCase() || 'FREE'} PLAN
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Current Subscription -->
            <div class="account-section">
                <div class="section-header">
                    <h2>💳 Current Subscription</h2>
                </div>
                <div class="subscription-card">
                    <div class="subscription-info">
                        <div class="plan-details">
                            <h3>{userSubscription?.plan_type?.charAt(0).toUpperCase() + userSubscription?.plan_type?.slice(1) || 'Free'} Plan</h3>
                            <p class="plan-description">
                                {#if userSubscription?.plan_type === 'free'}
                                    Perfect for trying out our SOP generation service
                                {:else if userSubscription?.plan_type === 'basic'}
                                    Great for students applying to multiple programs
                                {:else if userSubscription?.plan_type === 'pro'}
                                    Unlimited access to all premium features
                                {/if}
                            </p>
                        </div>
                        
                        {#if userSubscription?.plan_type !== 'free'}
                            <div class="billing-info">
                                <p><strong>Status:</strong> {userSubscription?.status || 'Active'}</p>
                                {#if userSubscription?.current_period_end}
                                    <p><strong>Next billing:</strong> {formatDate(userSubscription.current_period_end)}</p>
                                {/if}
                            </div>
                        {/if}
                    </div>
                    
                    <div class="subscription-actions">
                        {#if userSubscription?.plan_type === 'free'}
                            <button class="btn-primary" on:click={() => handleUpgrade('basic')}>
                                ⭐ Upgrade to Basic
                            </button>
                            <button class="btn-secondary" on:click={() => handleUpgrade('pro')}>
                                👑 Upgrade to Pro
                            </button>
                        {:else if userSubscription?.plan_type === 'basic'}
                            <button class="btn-primary" on:click={() => handleUpgrade('pro')}>
                                👑 Upgrade to Pro
                            </button>
                            <button class="btn-danger" on:click={handleCancelSubscription}>
                                Cancel Subscription
                            </button>
                        {:else if userSubscription?.plan_type === 'pro'}
                            <button class="btn-danger" on:click={handleCancelSubscription}>
                                Cancel Subscription
                            </button>
                        {/if}
                    </div>
                </div>
            </div>
            
            <!-- Usage Statistics -->
            <div class="account-section">
                <div class="section-header">
                    <h2>📊 Usage Statistics</h2>
                    <p>Current month usage and limits</p>
                </div>
                <div class="usage-grid">
                    <!-- SOPs Created -->
                    <div class="usage-card">
                        <div class="usage-icon">📄</div>
                        <div class="usage-info">
                            <h4>SOPs Created</h4>
                            <div class="usage-stats">
                                <span class="usage-current">{usage?.sops_created || 0}</span>
                                <span class="usage-limit">
                                    / {planLimits?.sops_limit === null ? '∞' : planLimits?.sops_limit || 1}
                                </span>
                            </div>
                            {#if planLimits?.sops_limit !== null}
                                <div class="usage-bar">
                                    <div class="usage-progress" style="width: {getUsagePercentage(usage?.sops_created || 0, planLimits?.sops_limit)}%"></div>
                                </div>
                            {/if}
                        </div>
                    </div>
                    
                    <!-- AI Improvements -->
                    <div class="usage-card">
                        <div class="usage-icon">🤖</div>
                        <div class="usage-info">
                            <h4>AI Improvements</h4>
                            <div class="usage-stats">
                                <span class="usage-current">{usage?.ai_improvements_used || 0}</span>
                                <span class="usage-limit">
                                    / {planLimits?.ai_improvements_limit === null ? '∞' : planLimits?.ai_improvements_limit || 3}
                                </span>
                            </div>
                            {#if planLimits?.ai_improvements_limit !== null}
                                <div class="usage-bar">
                                    <div class="usage-progress" style="width: {getUsagePercentage(usage?.ai_improvements_used || 0, planLimits?.ai_improvements_limit)}%"></div>
                                </div>
                            {/if}
                        </div>
                    </div>
                    
                    <!-- Analytics Generated -->
                    <div class="usage-card">
                        <div class="usage-icon">📈</div>
                        <div class="usage-info">
                            <h4>Analytics Reports</h4>
                            <div class="usage-stats">
                                <span class="usage-current">{usage?.analytics_generated || 0}</span>
                                <span class="usage-limit">
                                    / {planLimits?.analytics_limit === null ? '∞' : planLimits?.analytics_limit || 0}
                                </span>
                            </div>
                            {#if planLimits?.analytics_limit !== null && planLimits?.analytics_limit > 0}
                                <div class="usage-bar">
                                    <div class="usage-progress" style="width: {getUsagePercentage(usage?.analytics_generated || 0, planLimits?.analytics_limit)}%"></div>
                                </div>
                            {:else if planLimits?.analytics_limit === 0}
                                <div class="upgrade-prompt">
                                    <button class="btn-upgrade" on:click={() => handleUpgrade('basic')}>
                                        Upgrade to access analytics
                                    </button>
                                </div>
                            {/if}
                        </div>
                    </div>
                    
                    <!-- Plagiarism Checks -->
                    <div class="usage-card">
                        <div class="usage-icon">🔍</div>
                        <div class="usage-info">
                            <h4>Plagiarism Checks</h4>
                            <div class="usage-stats">
                                <span class="usage-current">{usage?.plagiarism_checks || 0}</span>
                                <span class="usage-limit">
                                    / {planLimits?.plagiarism_checks_limit === null ? '∞' : planLimits?.plagiarism_checks_limit || 1}
                                </span>
                            </div>
                            {#if planLimits?.plagiarism_checks_limit !== null}
                                <div class="usage-bar">
                                    <div class="usage-progress" style="width: {getUsagePercentage(usage?.plagiarism_checks || 0, planLimits?.plagiarism_checks_limit)}%"></div>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Account Actions -->
            <div class="account-section">
                <div class="section-header">
                    <h2>⚙️ Account Actions</h2>
                </div>
                <div class="actions-card">
                    <div class="action-links">
                        <a href="/subscription/manage" class="action-link">
                            💳 Manage Subscription
                        </a>
                        <a href="/billing/history" class="action-link">
                            📄 Billing History
                        </a>
                    </div>
                    <button class="btn-logout" on:click={handleLogout}>
                        🚪 Sign Out
                    </button>
                </div>
            </div>
        {/if}
    </div>
</div>

<!-- Cancel Subscription Modal -->
{#if showCancelModal}
            <div class="modal-overlay" on:click={() => showCancelModal = false} role="button" tabindex="0" on:keydown={(e) => e.key === 'Escape' && (showCancelModal = false)}>
            <div class="modal" on:click|stopPropagation role="dialog" tabindex="-1">
            <div class="modal-header">
                <h3>Cancel Subscription</h3>
                <button class="modal-close" on:click={() => showCancelModal = false}>×</button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your current billing period.</p>
                <div class="modal-actions">
                    <button class="btn-secondary" on:click={() => showCancelModal = false}>Keep Subscription</button>
                    <button class="btn-danger" on:click={confirmCancelSubscription}>Yes, Cancel</button>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .account-page {
        min-height: 100vh;
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        padding: 6rem 0 2rem 0; /* Added top padding to account for fixed navbar */
    }
    
    .account-container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 0 2rem;
    }
    
    .account-header {
        text-align: center;
        margin-bottom: 3rem;
    }
    
    .account-header h1 {
        font-size: 2.5rem;
        font-weight: 700;
        color: #1F2937;
        margin-bottom: 0.5rem;
    }
    
    .account-header p {
        color: #6B7280;
        font-size: 1.1rem;
    }
    
    .account-section {
        background: white;
        border-radius: 1rem;
        padding: 2rem;
        margin-bottom: 2rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    
    .section-header {
        margin-bottom: 1.5rem;
    }
    
    .section-header h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1F2937;
        margin-bottom: 0.5rem;
    }
    
    .section-header p {
        color: #6B7280;
    }
    
    .profile-card {
        display: flex;
        align-items: center;
        gap: 1.5rem;
    }
    
    .profile-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 2rem;
        font-weight: 600;
    }
    
    .profile-info h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1F2937;
        margin-bottom: 0.5rem;
    }
    
    .profile-info p {
        color: #6B7280;
        margin-bottom: 1rem;
    }
    
    .plan-badge {
        display: inline-block;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        font-weight: 600;
    }
    
    .subscription-card {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 2rem;
    }
    
    .plan-details h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1F2937;
        margin-bottom: 0.5rem;
    }
    
    .plan-description {
        color: #6B7280;
        margin-bottom: 1rem;
    }
    
    .billing-info p {
        margin-bottom: 0.5rem;
        color: #4B5563;
    }
    
    .subscription-actions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        min-width: 200px;
    }
    
    .usage-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
    }
    
    .usage-card {
        background: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 0.75rem;
        padding: 1.5rem;
        display: flex;
        align-items: flex-start;
        gap: 1rem;
    }
    
    .usage-icon {
        font-size: 2rem;
        opacity: 0.8;
    }
    
    .usage-info {
        flex: 1;
    }
    
    .usage-info h4 {
        font-size: 1rem;
        font-weight: 600;
        color: #1F2937;
        margin-bottom: 0.75rem;
    }
    
    .usage-stats {
        display: flex;
        align-items: baseline;
        gap: 0.25rem;
        margin-bottom: 0.75rem;
    }
    
    .usage-current {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1F2937;
    }
    
    .usage-limit {
        color: #6B7280;
    }
    
    .usage-bar {
        width: 100%;
        height: 4px;
        background: #E5E7EB;
        border-radius: 2px;
        overflow: hidden;
    }
    
    .usage-progress {
        height: 100%;
        background: linear-gradient(90deg, #10B981, #059669);
        transition: width 0.3s ease;
    }
    
    .upgrade-prompt {
        margin-top: 0.5rem;
    }
    
    .btn-upgrade {
        background: #F59E0B;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s ease;
    }
    
    .btn-upgrade:hover {
        background: #D97706;
    }
    
    .actions-card {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    
    .action-links {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
    }
    
    .action-link {
        display: inline-flex;
        align-items: center;
        padding: 0.75rem 1.5rem;
        background: #F3F4F6;
        color: #374151;
        text-decoration: none;
        border-radius: 0.5rem;
        font-weight: 500;
        transition: all 0.2s ease;
        border: 1px solid #E5E7EB;
    }
    
    .action-link:hover {
        background: #E5E7EB;
        color: #1F2937;
        transform: translateY(-1px);
    }
    
    .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s ease;
    }
    
    .btn-primary:hover {
        transform: translateY(-2px);
    }
    
    .btn-secondary {
        background: #6B7280;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s ease;
    }
    
    .btn-secondary:hover {
        background: #4B5563;
    }
    
    .btn-danger {
        background: #DC2626;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s ease;
    }
    
    .btn-danger:hover {
        background: #B91C1C;
    }
    
    .btn-logout {
        background: #374151;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s ease;
    }
    
    .btn-logout:hover {
        background: #1F2937;
    }
    
    .loading-state {
        text-align: center;
        padding: 4rem 0;
    }
    
    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #E5E7EB;
        border-top: 4px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    
    .modal {
        background: white;
        border-radius: 0.75rem;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #E5E7EB;
    }
    
    .modal-header h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1F2937;
    }
    
    .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #6B7280;
        cursor: pointer;
    }
    
    .modal-body {
        padding: 1.5rem;
    }
    
    .modal-body p {
        color: #4B5563;
        margin-bottom: 1.5rem;
    }
    
    .modal-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
    }
    
    @media (max-width: 768px) {
        .account-container {
            padding: 0 1rem;
        }
        
        .subscription-card {
            flex-direction: column;
            gap: 1.5rem;
        }
        
        .subscription-actions {
            min-width: auto;
        }
        
        .usage-grid {
            grid-template-columns: 1fr;
        }
        
        .profile-card {
            flex-direction: column;
            text-align: center;
        }
    }
</style> 