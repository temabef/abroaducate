<script lang="ts">
    import { onMount } from 'svelte';
    import { invalidate, afterNavigate } from '$app/navigation';
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import GlobalUpgradeHandler from '$lib/components/GlobalUpgradeHandler.svelte';
// Removed light footer per request
    import { analytics } from '$lib/utils/posthog';
    import AdBootstrap from '$lib/components/AdBootstrap.svelte';
    import { subscriptionState } from '$lib/stores/subscription';

	let { data, children } = $props();
    let { supabase, session } = $derived(data);
    let identifiedUserId: string | null = null;

    function computeIsPremium(sub: any | null): boolean {
        if (!sub) return false;
        if (sub.plan_type === 'free') return false;
        return ['active','trialing','past_due'].includes(sub.status) || sub.admin_override === true;
    }

	onMount(() => {
        // Dev-only: aggressively unregister any service workers and delete caches
        try {
            if (import.meta.env.DEV) {
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then((regs) => {
                        regs.forEach((reg) => reg.unregister().catch(() => {}));
                    }).catch(() => {});
                }
                if ('caches' in window) {
                    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
                }
            }
        } catch {}

        // Initialize subscription store based on current session
        try {
            if (session?.user?.id) {
                subscriptionState.set({ loaded: false, isPremium: false, planType: null, status: null, userId: session.user.id });
            } else {
                subscriptionState.set({ loaded: true, isPremium: false, planType: null, status: null, userId: null });
            }
        } catch {}

        // Fetch current subscription immediately if session exists
        (async () => {
            if (session?.user?.id) {
                try {
                    const { data: sub } = await supabase
                        .from('user_subscriptions')
                        .select('plan_type, status, admin_override')
                        .eq('user_id', session.user.id)
                        .in('status', ['active','trialing','past_due'])
                        .single();
                    const isPremium = computeIsPremium(sub);
                    subscriptionState.set({
                        loaded: true,
                        isPremium,
                        planType: sub?.plan_type || null,
                        status: sub?.status || null,
                        userId: session.user.id
                    });
                } catch {
                    subscriptionState.set({ loaded: true, isPremium: false, planType: null, status: null, userId: session.user.id });
                }
            }
        })();

        // Track SPA navigations
        afterNavigate(() => {
            try { analytics.trackPageView(document.title || 'Page', { path: location.pathname }); } catch {}
            // Removed posthog session recording call for stability
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}

			// Identify user in analytics when session becomes available
            if (newSession?.user) {
                try {
                    if (identifiedUserId === newSession.user.id) return;
                    // Fetch subscription detail for enrichment and store
                    let subRow: any = null;
                    try {
                        const { data: sub, error } = await supabase
                            .from('user_subscriptions')
                            .select('plan_type, status, admin_override')
                            .eq('user_id', newSession.user.id)
                            .in('status', ['active','trialing','past_due'])
                            .single();
                        if (!error) subRow = sub;
                    } catch {}

                    const planType = subRow?.plan_type || 'free';
                    const isPremium = computeIsPremium(subRow);

                    try {
                        analytics.identify(newSession.user.id, {
                            email: newSession.user.email,
                            plan_type: planType
                        });
                    } catch {}

                    try {
                        subscriptionState.set({
                            loaded: true,
                            isPremium,
                            planType,
                            status: subRow?.status || null,
                            userId: newSession.user.id
                        });
                    } catch {}
                    identifiedUserId = newSession.user.id;
                } catch {}
			} else {
                    // Signed out
                    try {
                        subscriptionState.set({ loaded: true, isPremium: false, planType: null, status: null, userId: null });
                    } catch {}
                }
		});
		return () => subscription.unsubscribe();
	});
</script>

<Navbar {data} />
<AdBootstrap />

{@render children()}

<!-- Global upgrade handler - works everywhere -->
<GlobalUpgradeHandler /> 