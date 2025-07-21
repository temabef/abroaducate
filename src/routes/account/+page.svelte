<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import type { PageData } from './$types';
    
    export let data: PageData;
    
    type PlanTier = 'free' | 'professional' | 'elite';

    interface UserSubscription {
        id: string;
        user_id: string;
        plan_type: PlanTier;
        status: 'active' | 'inactive' | 'cancelled';
        created_at: string;
        current_period_end: string;
    }

    interface UsageData {
        reviews: number;
        text_enhancements: number;
        word_optimizations: number;
        grammar_check: number;
        plagiarism_checks: number;
        tone_analysis: number;
        university_matching: number;
        sops_created: number;
        cover_letters_created: number;
        personal_statements_created: number;
        academic_cvs_created: number;
        cold_emails_created: number;
    }
    
    interface PlanLimits {
        documents_total: number | null;
        sops: number | null;
        cover_letters: number | null;
        personal_statements: number | null;
        academic_cvs: number | null;
        cold_emails: number | null;
        reviews: number | null;
        text_enhancements: number | null;
        word_optimizations: number | null;
        grammar_check: number | null;
        plagiarism_checks: number | null;
        tone_analysis: number | null;
        university_matching: number | null;
        visa_interview_questions: number;
        version_history: number | null;
        email_notifications: string;
        support: string;
        inline_editing: number | null;
    }
    
    let { supabase, session } = data;
    let userSubscription: UserSubscription | null = null;
    let usage: UsageData = {
        reviews: 0,
        text_enhancements: 0,
        word_optimizations: 0,
        grammar_check: 0,
        plagiarism_checks: 0,
        tone_analysis: 0,
        university_matching: 0,
        sops_created: 0,
        cover_letters_created: 0,
        personal_statements_created: 0,
        academic_cvs_created: 0,
        cold_emails_created: 0
    };
    let planLimits: PlanLimits = {
        documents_total: 0,
        sops: 0,
        cover_letters: 0,
        personal_statements: 0,
        academic_cvs: 0,
        cold_emails: 0,
        reviews: 0,
        text_enhancements: 0,
        word_optimizations: 0,
        grammar_check: 0,
        plagiarism_checks: 0,
        tone_analysis: 0,
        university_matching: 0,
        visa_interview_questions: 0,
        version_history: 0,
        email_notifications: '',
        support: '',
        inline_editing: 0
    };
    let loading = true;
    let showCancelModal = false;
    let emailStatus = { enabled: false, frequency: 'weekly' };
    let applications = [];
    let scholarshipApplications = [];
    let totalDocuments = 0;
    let userStats = {
        totalLogins: 0,
        accountAge: '',
        lastLogin: ''
    };
    
    // Updated plan mapping with correct names
    const planColors = {
        free: 'bg-gradient-to-r from-gray-400 to-gray-600 text-white',
        professional: 'bg-gradient-to-r from-blue-500 to-blue-700 text-white',
        elite: 'bg-gradient-to-r from-purple-500 to-purple-700 text-white'
    };
    
    const planNames: Record<PlanTier, string> = {
        free: 'Academic Starter',
        professional: 'Academic Professional', 
        elite: 'Academic Elite'
    };
    
    const planIcons: Record<PlanTier, string> = {
        free: '🎓',
        professional: '⭐',
        elite: '👑'
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
            // Fetch user subscription with correct tier names
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
            
            // Get comprehensive usage from the new ai_usage_log table
            const { data: aiUsageData, error: aiUsageError } = await supabase
                .from('ai_usage_log')
                .select('feature_type, created_at')
                .eq('user_id', session.user.id)
                .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

            if (aiUsageError) {
                console.error('Error fetching AI usage:', aiUsageError);
            }

                    // Process usage data
        const currentUsage: any = {};
        if (aiUsageData) {
            aiUsageData.forEach(log => {
                currentUsage[log.feature_type] = (currentUsage[log.feature_type] || 0) + 1;
            });
        }

            // Get document counts using the same logic as dashboard
            // Get current month boundaries
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            
            // Query individual tables like dashboard does
            const { data: sops } = await supabase
                .from('sops')
                .select('id, created_at')
                .eq('user_id', session.user.id)
                .gte('created_at', firstDayOfMonth);

            const { data: coverLetters } = await supabase
                .from('cover_letters')
                .select('id, created_at')
                .eq('user_id', session.user.id)
                .gte('created_at', firstDayOfMonth);

            const { data: personalStatements } = await supabase
                .from('personal_statements')
                .select('id, created_at')
                .eq('user_id', session.user.id)
                .gte('created_at', firstDayOfMonth);

            const { data: academicCVs } = await supabase
                .from('academic_cvs')
                .select('id, created_at')
                .eq('user_id', session.user.id)
                .gte('created_at', firstDayOfMonth);

            const { data: coldEmails } = await supabase
                .from('cold_emails')
                .select('id, created_at')
                .eq('user_id', session.user.id)
                .gte('created_at', firstDayOfMonth);

            usage = {
                // AI Features (using comprehensive-usage-limits.ts structure)
                reviews: currentUsage.reviews || 0,
                text_enhancements: currentUsage.text_enhancements || 0,
                word_optimizations: currentUsage.word_optimizations || 0,
                grammar_check: currentUsage.grammar_check || 0,
                plagiarism_checks: currentUsage.plagiarism_checks || 0,
                tone_analysis: currentUsage.tone_analysis || 0,
                university_matching: currentUsage.university_matching || 0,
                
                // Document Generation - using real table data like dashboard
                sops_created: sops?.length || 0,
                cover_letters_created: coverLetters?.length || 0,
                personal_statements_created: personalStatements?.length || 0,
                academic_cvs_created: academicCVs?.length || 0,
                cold_emails_created: coldEmails?.length || 0
            };
            
            // Get plan limits based on subscription tier
            const currentPlan: PlanTier = userSubscription?.plan_type || 'free';
            planLimits = getPlanLimits(currentPlan);
            
        } catch (error) {
            console.error('Error loading account data:', error);
        } finally {
            loading = false;
        }
    }

    function getPlanLimits(planType: PlanTier) {
        // Based on actual pricing page implementation
        const limits: Record<PlanTier, PlanLimits> = {
            free: {
                // Document limits per month - UPDATED to match pricing page
                documents_total: 4, // 1 SOP + 1 Cover Letter + 1 Personal Statement + 1 Academic CV
                sops: 1,
                cover_letters: 1,
                personal_statements: 1,
                academic_cvs: 1,
                cold_emails: 0, // Not included in free plan based on pricing
                
                // AI Feature limits per month - UPDATED to match pricing page
                reviews: 1,
                text_enhancements: 1,
                word_optimizations: 1,
                grammar_check: 1,
                plagiarism_checks: 1,
                tone_analysis: 1,
                university_matching: 25, // Reduced from 50+ for performance
                
                // Other features
                visa_interview_questions: 5,
                version_history: 3,
                email_notifications: 'Weekly scholarship digest only',
                support: 'Community support',
                inline_editing: 5
            },
            professional: {
                // Document limits per month - UPDATED to match pricing page
                documents_total: 50, // Flexible allocation across all document types
                sops: 50, // Flexible allocation
                cover_letters: 50, // Flexible allocation
                personal_statements: 50, // Flexible allocation
                academic_cvs: 50, // Flexible allocation
                cold_emails: 50, // Professional plan includes cold emails
                
                // AI Feature limits per month - UPDATED to match pricing page
                reviews: 15,
                text_enhancements: 25,
                word_optimizations: 15,
                grammar_check: 25,
                plagiarism_checks: 10,
                tone_analysis: 25,
                university_matching: 200, // Reduced from 500+ for performance
                
                // Other features
                visa_interview_questions: 20,
                version_history: 50,
                email_notifications: 'Daily emails + deadline reminders',
                support: '48h email response',
                inline_editing: 50
            },
            elite: {
                // Unlimited for most features - UPDATED to match pricing page
                documents_total: null, // UNLIMITED
                sops: null, // UNLIMITED
                cover_letters: null, // UNLIMITED
                personal_statements: null, // UNLIMITED
                academic_cvs: null, // UNLIMITED
                cold_emails: null, // UNLIMITED (500 per month from pricing)
                
                // AI Feature limits - UPDATED to match pricing page
                reviews: null, // UNLIMITED
                text_enhancements: null, // UNLIMITED
                word_optimizations: null, // UNLIMITED
                grammar_check: null, // UNLIMITED
                plagiarism_checks: null, // UNLIMITED
                tone_analysis: null, // UNLIMITED
                university_matching: 500, // Reduced from 1500+ for performance
                
                // Other features
                visa_interview_questions: 30,
                version_history: 100, // 100 versions with 1-year retention
                email_notifications: 'Instant alerts + all features',
                support: '24h priority response',
                inline_editing: null // UNLIMITED
            }
        };
        return limits[planType] || limits.free;
    }

    function getUsagePercentage(used: number, limit: number | null): number {
        if (limit === null) return 0; // Unlimited
        return Math.min((used / limit) * 100, 100);
    }

    function getUsageColor(percentage: number): string {
        if (percentage >= 90) return 'bg-red-500';
        if (percentage >= 75) return 'bg-yellow-500';
        return 'bg-green-500';
    }

    function formatDate(dateString: string | null): string {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    }

    function getAccountAge(): string {
        if (!session?.user?.created_at) return 'Unknown';
        const created = new Date(session.user.created_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - created.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 365) {
            return `${Math.floor(diffDays / 365)} year(s)`;
        }
        return `${diffDays} day(s)`;
    }

    async function handleUpgrade(planType: 'professional' | 'elite') {
        goto(`/subscribe?plan=${planType}`);
    }

    async function handleCancelSubscription() {
        showCancelModal = true;
    }

    async function confirmCancelSubscription() {
        showCancelModal = false;
        // TODO: Implement actual cancellation logic with Stripe
        console.log('Cancel subscription - integrate with Stripe');
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        goto('/');
    }

    function getFeatureStatus(planType: string, feature: string): { available: boolean; label: string } {
        const features = {
            free: {
                email_notifications: { available: true, label: 'Weekly scholarship digest' },
                version_history: { available: true, label: 'Cover letters only (3 versions)' },
                priority_support: { available: false, label: 'Community support only' },
                advanced_analytics: { available: false, label: 'Basic stats only' },
                gpa_analysis: { available: true, label: 'Quick assessment' },
                custom_templates: { available: false, label: 'Coming soon' }
            },
            professional: {
                email_notifications: { available: true, label: 'Daily emails + deadline reminders' },
                version_history: { available: true, label: 'All documents (10 versions)' },
                priority_support: { available: true, label: '48h email response' },
                advanced_analytics: { available: true, label: 'Full dashboard' },
                gpa_analysis: { available: true, label: 'Comprehensive + Quick' },
                custom_templates: { available: false, label: 'Coming soon' }
            },
            elite: {
                email_notifications: { available: true, label: 'Instant alerts + all features' },
                version_history: { available: true, label: 'Unlimited versions' },
                priority_support: { available: true, label: '24h priority response' },
                advanced_analytics: { available: true, label: 'Advanced insights + API' },
                gpa_analysis: { available: true, label: 'All features + recommendations' },
                custom_templates: { available: true, label: 'Full template editor' }
            }
        };
        return features[planType as keyof typeof features]?.[feature as keyof typeof features['free']] || { available: false, label: 'Not available' };
    }
</script>

<svelte:head>
    <title>Account Settings - Abroaducate</title>
    <meta name="description" content="Manage your subscription, view usage statistics, and track your academic application progress" />
</svelte:head>

<!-- Add proper spacing from navbar and bottom -->
<div class="min-h-screen bg-gray-50 pt-16 pb-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header with proper spacing -->
        <div class="bg-white border-b border-gray-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8 mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">⚙️ Account Settings</h1>
            <p class="text-lg text-gray-600">Manage your subscription, view comprehensive usage statistics, and track your academic journey</p>
        </div>
        
        {#if loading}
            <div class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span class="ml-3 text-lg text-gray-600">Loading your account data...</span>
            </div>
        {:else}
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <!-- Left Sidebar: Profile & Plan -->
                <div class="lg:col-span-1 space-y-6">
                    <!-- Profile Card -->
                    <div class="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <!-- Plan Header -->
                        <div class="px-6 py-4 {planColors[userSubscription?.plan_type || 'free']}">
                            <div class="flex items-center space-x-3">
                                <div class="text-2xl">{planIcons[userSubscription?.plan_type || 'free']}</div>
                                <div>
                                    <h3 class="font-semibold text-lg">{planNames[userSubscription?.plan_type || 'free']}</h3>
                                    <p class="text-sm opacity-90">Active Plan</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Profile Info -->
                        <div class="p-6">
                            <div class="flex items-center space-x-4 mb-4">
                                <div class="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                                    {session.user.email?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h4 class="text-sm font-medium text-gray-900 truncate">{session.user.email}</h4>
                                    <p class="text-xs text-gray-500">Member for {getAccountAge()}</p>
                                </div>
                            </div>
                            
                            <!-- Quick Stats -->
                            <div class="grid grid-cols-2 gap-3">
                                <div class="text-center p-3 bg-blue-50 rounded-lg">
                                    <div class="text-lg font-bold text-blue-600">
                                        {(usage?.sops_created || 0) + (usage?.cover_letters_created || 0) + (usage?.personal_statements_created || 0) + (usage?.academic_cvs_created || 0) + (usage?.cold_emails_created || 0)}
                                    </div>
                                    <div class="text-xs text-blue-600">Documents</div>
                                </div>
                                <div class="text-center p-3 bg-green-50 rounded-lg">
                                    <div class="text-lg font-bold text-green-600">
                                        {(usage?.reviews || 0) + (usage?.text_enhancements || 0) + (usage?.word_optimizations || 0)}
                                    </div>
                                    <div class="text-xs text-green-600">AI Features</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Plan Management -->
                    <div class="bg-white rounded-lg shadow-sm border p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Plan Management</h3>
                        
                        {#if userSubscription?.current_period_end}
                            <div class="mb-4 p-3 bg-blue-50 rounded-lg">
                                <div class="text-sm text-blue-800">
                                    <strong>Next billing:</strong> {formatDate(userSubscription.current_period_end)}
                                </div>
                            </div>
                        {/if}

                        <div class="space-y-2">
                            {#if userSubscription?.plan_type === 'free'}
                                <button class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium" on:click={() => handleUpgrade('professional')}>
                                    ⭐ Upgrade to Academic Professional
                                </button>
                                <button class="w-full border border-purple-600 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium" on:click={() => handleUpgrade('elite')}>
                                    👑 Upgrade to Academic Elite
                                </button>
                            {:else if userSubscription?.plan_type === 'professional'}
                                <button class="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium" on:click={() => handleUpgrade('elite')}>
                                    👑 Upgrade to Academic Elite
                                </button>
                                <button class="w-full border border-red-600 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium" on:click={handleCancelSubscription}>
                                    Cancel Subscription
                                </button>
                            {:else if userSubscription?.plan_type === 'elite'}
                                <div class="text-center p-3 bg-purple-50 rounded-lg">
                                    <p class="text-sm text-purple-800 font-medium">✨ You have the best plan!</p>
                                </div>
                                <button class="w-full border border-red-600 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium" on:click={handleCancelSubscription}>
                                    Cancel Subscription
                                </button>
                            {/if}
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div class="bg-white rounded-lg shadow-sm border p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                        <div class="space-y-3">
                            <a href="/subscription/manage" class="flex items-center text-blue-600 hover:text-blue-800 transition-colors text-sm">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                                </svg>
                                Manage Billing
                            </a>
                            <a href="/billing/history" class="flex items-center text-blue-600 hover:text-blue-800 transition-colors text-sm">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                Billing History
                            </a>
                            <a href="/account/preferences" class="flex items-center text-blue-600 hover:text-blue-800 transition-colors text-sm">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4 4h5v5H4V4zm6 6h5v5h-5v-5zm6-6h5v5h-5V4zM4 15h5v5H4v-5z"></path>
                                </svg>
                                Email Preferences
                            </a>
                            <button class="flex items-center text-red-600 hover:text-red-800 transition-colors w-full text-left text-sm" on:click={handleLogout}>
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                                </svg>
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Main Content: Usage & Features -->
                <div class="lg:col-span-3 space-y-6">
                    <!-- Document Generation Dashboard -->
                    <div class="bg-white rounded-lg shadow-sm border">
                        <div class="px-6 py-4 border-b border-gray-200">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h3 class="text-lg font-semibold text-gray-900">📝 Document Generation</h3>
                                    <p class="text-sm text-gray-600">Create professional application documents with AI assistance</p>
                                </div>
                                <div class="text-right">
                                    <div class="text-2xl font-bold text-blue-600">
                                        {(usage?.sops_created || 0) + (usage?.cover_letters_created || 0) + (usage?.personal_statements_created || 0) + (usage?.academic_cvs_created || 0) + (usage?.cold_emails_created || 0)}
                                    </div>
                                    <div class="text-xs text-gray-500">This Month</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="p-6">
                            <!-- Overall Progress Bar for Free/Professional -->
                            {#if userSubscription?.plan_type !== 'elite'}
                                {@const totalDocuments = (usage.sops_created || 0) + (usage.cover_letters_created || 0) + (usage.personal_statements_created || 0) + (usage.academic_cvs_created || 0) + (usage.cold_emails_created || 0)}
                                {@const totalLimit = planLimits.documents_total}
                                {@const totalPercentage = getUsagePercentage(totalDocuments, totalLimit)}
                                
                                <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="font-medium text-gray-900">Total Documents This Month</span>
                                        <span class="text-lg font-bold text-blue-600">{totalDocuments}/{totalLimit}</span>
                                    </div>
                                    <div class="w-full bg-gray-200 rounded-full h-3">
                                        <div class="h-3 rounded-full {getUsageColor(totalPercentage)}" style="width: {totalPercentage}%"></div>
                                    </div>
                                    {#if userSubscription?.plan_type === 'professional'}
                                        <p class="text-xs text-gray-600 mt-2">✨ Flexible allocation - use your 50 documents however you need!</p>
                                    {:else if userSubscription?.plan_type === 'free'}
                                        <p class="text-xs text-gray-600 mt-2">💡 Upgrade to Professional for 50 documents with flexible allocation!</p>
                                    {/if}
                                </div>
                            {/if}

                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {#each [
                                    { key: 'sops_created', label: 'Statements of Purpose', icon: '📄', link: '/sop' },
                                    { key: 'cover_letters_created', label: 'Cover Letters', icon: '💼', link: '/cover-letters' },
                                    { key: 'personal_statements_created', label: 'Personal Statements', icon: '💭', link: '/personal-statements' },
                                    { key: 'academic_cvs_created', label: 'Academic CVs', icon: '📋', link: '/academic-cv' },
                                    { key: 'cold_emails_created', label: 'Cold Emails', icon: '📧', link: '/cold-email-generator' }
                                ].filter(doc => userSubscription?.plan_type !== 'free' || doc.key !== 'cold_emails_created') as doc}
                                    {@const currentUsage = (usage as any)[doc.key] || 0}
                                    {@const docType = doc.key.replace('_created', 's')}
                                    {@const limit = (planLimits as any)[docType]}
                                    
                                    <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div class="flex items-center justify-between mb-3">
                                            <div class="flex items-center space-x-2">
                                                <span class="text-lg">{doc.icon}</span>
                                                <span class="font-medium text-gray-900 text-sm">{doc.label}</span>
                                            </div>
                                            <span class="text-xs text-gray-500">
                                                {currentUsage}
                                                {#if userSubscription?.plan_type === 'free'}
                                                    /{limit}
                                                {:else if userSubscription?.plan_type === 'elite'}
                                                    /∞
                                                {:else}
                                                    /50
                                                {/if}
                                            </span>
                                        </div>
                                        
                                        {#if userSubscription?.plan_type === 'free'}
                                            {@const percentage = getUsagePercentage(currentUsage, limit)}
                                            <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
                                                <div class="h-2 rounded-full {getUsageColor(percentage)}" style="width: {percentage}%"></div>
                                            </div>
                                        {:else if userSubscription?.plan_type === 'elite'}
                                            <div class="text-xs text-green-600 font-medium mb-2">Unlimited</div>
                                        {:else}
                                            <div class="text-xs text-blue-600 font-medium mb-2">Flexible allocation</div>
                                        {/if}
                                        
                                        <a href={doc.link} class="text-xs text-blue-600 hover:text-blue-800">Create New →</a>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    </div>

                    <!-- AI Features Dashboard -->
                    <div class="bg-white rounded-lg shadow-sm border">
                        <div class="px-6 py-4 border-b border-gray-200">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h3 class="text-lg font-semibold text-gray-900">🤖 AI Enhancement Features</h3>
                                    <p class="text-sm text-gray-600">AI-powered tools to improve your application documents</p>
                                </div>
                                <div class="text-right">
                                    <div class="text-2xl font-bold text-green-600">
                                        {(usage?.reviews || 0) + (usage?.text_enhancements || 0) + (usage?.word_optimizations || 0) + (usage?.grammar_check || 0)}
                                    </div>
                                    <div class="text-xs text-gray-500">AI Uses This Month</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="p-6">
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {#each [
                                    { key: 'reviews', label: 'AI Reviews & Analysis', icon: '🔍', desc: 'Get detailed feedback on your documents' },
                                    { key: 'text_enhancements', label: 'Text Enhancement', icon: '✨', desc: 'Improve clarity and impact of your writing' },
                                    { key: 'word_optimizations', label: 'Word Count Optimization', icon: '📝', desc: 'Perfect length for application requirements' },
                                    { key: 'grammar_check', label: 'Grammar & Style Check', icon: '📖', desc: 'Professional grammar and style analysis' },
                                    { key: 'plagiarism_checks', label: 'Plagiarism Detection', icon: '🔍', desc: 'Ensure originality of your content' },
                                    { key: 'tone_analysis', label: 'Tone Analysis', icon: '🎭', desc: 'Optimize tone for academic writing' }
                                ] as feature}
                                    {@const currentUsage = (usage as any)[feature.key] || 0}
                                    {@const limit = (planLimits as any)[feature.key] || 0}
                                    {@const percentage = getUsagePercentage(currentUsage, limit)}
                                    
                                    <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div class="flex items-center justify-between mb-2">
                                            <div class="flex items-center space-x-2">
                                                <span class="text-lg">{feature.icon}</span>
                                                <span class="font-medium text-gray-900 text-sm">{feature.label}</span>
                                            </div>
                                            <span class="text-xs text-gray-500">{currentUsage}/{limit === null ? '∞' : limit}</span>
                                        </div>
                                        
                                        <p class="text-xs text-gray-600 mb-3">{feature.desc}</p>
                                        
                                        {#if limit !== null}
                                            <div class="w-full bg-gray-200 rounded-full h-2">
                                                <div class="h-2 rounded-full {getUsageColor(percentage)}" style="width: {percentage}%"></div>
                                            </div>
                                        {:else}
                                            <div class="text-xs text-green-600 font-medium">Unlimited</div>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        </div>
                    </div>

                    <!-- Platform Features Overview -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- University Matching -->
                        <div class="bg-white rounded-lg shadow-sm border p-6">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-lg font-semibold text-gray-900">🏛️ University Matching</h3>
                                <a href="/universities" class="text-blue-600 hover:text-blue-800 text-sm">Explore →</a>
                            </div>
                            
                            <div class="space-y-3">
                                <div class="flex justify-between items-center">
                                    <span class="text-sm text-gray-600">Monthly Searches</span>
                                    <span class="font-medium">{usage.university_matching || 0}/{planLimits.university_matching === null ? '∞' : planLimits.university_matching}</span>
                                </div>
                                
                                {#if planLimits.university_matching !== null}
                                    {@const percentage = getUsagePercentage(usage.university_matching || 0, planLimits.university_matching)}
                                    <div class="w-full bg-gray-200 rounded-full h-2">
                                        <div class="h-2 rounded-full {getUsageColor(percentage)}" style="width: {percentage}%"></div>
                                    </div>
                                {/if}

                                <div class="grid grid-cols-2 gap-2 text-center">
                                    <div class="p-2 bg-blue-50 rounded">
                                        <div class="text-lg font-bold text-blue-600">7,000+</div>
                                        <div class="text-xs text-blue-600">Universities</div>
                                    </div>
                                    <div class="p-2 bg-green-50 rounded">
                                        <div class="text-lg font-bold text-green-600">AI</div>
                                        <div class="text-xs text-green-600">Matching</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Additional Tools -->
                        <div class="bg-white rounded-lg shadow-sm border p-6">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-lg font-semibold text-gray-900">🛠️ Additional Tools</h3>
                            </div>
                            
                            <div class="space-y-4">
                                <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                    <div class="flex items-center space-x-3">
                                        <span class="text-lg">📊</span>
                                        <div>
                                            <div class="font-medium text-sm">GPA Converter</div>
                                            <div class="text-xs text-gray-500">Convert international grades</div>
                                        </div>
                                    </div>
                                    <a href="/gpa-converter" class="text-blue-600 hover:text-blue-800 text-xs">Use →</a>
                                </div>

                                <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                    <div class="flex items-center space-x-3">
                                        <span class="text-lg">🎯</span>
                                        <div>
                                            <div class="font-medium text-sm">Visa Interview Simulator</div>
                                            <div class="text-xs text-gray-500">{planLimits.visa_interview_questions} questions/session</div>
                                        </div>
                                    </div>
                                    <a href="/visa-interview-practice" class="text-blue-600 hover:text-blue-800 text-xs">Practice →</a>
                                </div>

                                <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                    <div class="flex items-center space-x-3">
                                        <span class="text-lg">💰</span>
                                        <div>
                                            <div class="font-medium text-sm">Scholarship Finder</div>
                                            <div class="text-xs text-gray-500">Find funding opportunities</div>
                                        </div>
                                    </div>
                                    <a href="/scholarships" class="text-blue-600 hover:text-blue-800 text-xs">Search →</a>
                                </div>

                                <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                    <div class="flex items-center space-x-3">
                                        <span class="text-lg">📅</span>
                                        <div>
                                            <div class="font-medium text-sm">Application Tracker</div>
                                            <div class="text-xs text-gray-500">Track deadlines & progress</div>
                                        </div>
                                    </div>
                                    <a href="/applications" class="text-blue-600 hover:text-blue-800 text-xs">Track →</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Feature Comparison & Upgrade Suggestions -->
                    {#if userSubscription?.plan_type === 'free'}
                        <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
                            <div class="text-center mb-6">
                                <h3 class="text-xl font-bold text-blue-900">🚀 Unlock More Features</h3>
                                <p class="text-blue-800">You're currently on the Academic Starter plan. Upgrade to access more features!</p>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-white rounded-lg p-4 border">
                                    <div class="text-center mb-3">
                                        <div class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">⭐</div>
                                        <h4 class="font-semibold text-blue-900">Academic Professional</h4>
                                        <p class="text-sm text-blue-600">$12/month</p>
                                    </div>
                                    <ul class="text-xs text-gray-600 space-y-1 mb-4">
                                        <li>✅ 50 documents/month (flexible allocation)</li>
                                        <li>✅ 115 AI features/month</li>
                                        <li>✅ 500+ university database</li>
                                        <li>✅ Email deadline reminders</li>
                                        <li>✅ 20 visa practice questions</li>
                                        <li>✅ 50 cold emails/month</li>
                                        <li>✅ GPT-4o-mini AI engine</li>
                                    </ul>
                                    <button class="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors" on:click={() => handleUpgrade('professional')}>
                                        Upgrade Now
                                    </button>
                                </div>

                                <div class="bg-white rounded-lg p-4 border border-purple-200">
                                    <div class="text-center mb-3">
                                        <div class="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">👑</div>
                                        <h4 class="font-semibold text-purple-900">Academic Elite</h4>
                                        <p class="text-sm text-purple-600">$29/month</p>
                                    </div>
                                    <ul class="text-xs text-gray-600 space-y-1 mb-4">
                                        <li>✅ UNLIMITED documents</li>
                                        <li>✅ UNLIMITED AI features</li>
                                        <li>✅ 1,500+ university database</li>
                                        <li>✅ Priority support (24h)</li>
                                        <li>✅ 30 visa practice questions</li>
                                        <li>✅ 500 cold emails/month</li>
                                        <li>✅ GPT-4o AI engine</li>
                                        <li>✅ Instant deadline alerts</li>
                                    </ul>
                                    <button class="w-full bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 transition-colors" on:click={() => handleUpgrade('elite')}>
                                        Upgrade Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
    
    <!-- Add bottom spacing -->
    <div class="h-16"></div>
</div>

<!-- Cancel Subscription Modal -->
{#if showCancelModal}
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-gray-900">Cancel Subscription</h3>
                <button class="text-gray-400 hover:text-gray-600" on:click={() => showCancelModal = false} aria-label="Close modal">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <p class="text-gray-600 mb-6">Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your current billing period.</p>
            <div class="flex space-x-3">
                <button class="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors" on:click={() => showCancelModal = false}>
                    Keep Subscription
                </button>
                <button class="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors" on:click={confirmCancelSubscription}>
                    Cancel Subscription
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    /* Custom scrollbar for better UX */
    :global(html) {
        scroll-behavior: smooth;
    }
</style> 