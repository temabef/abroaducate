<script lang="ts">
    import { onMount } from 'svelte';
    import { invalidate, afterNavigate } from '$app/navigation';
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import DailyLimitNotice from '$lib/components/DailyLimitNotice.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';
	import SupportChat from '$lib/components/SupportChat.svelte';
	import { getAffiliatePartner } from '$lib/utils/affiliateLinks';
    import { analytics } from '$lib/utils/posthog';
    import { subscriptionState } from '$lib/stores/subscription';

	let { data, children } = $props();
    let { supabase, session } = $derived(data);
    let identifiedUserId: string | null = null;

    function computeIsPremium(sub: any | null): boolean {
        if (!sub) return false;
        if (sub.plan_type === 'free') return false;
        return ['active','trialing','past_due'].includes(sub.status) || sub.admin_override === true;
    }

	// Track every affiliate link click site-wide (blog posts, toolkit, homepage cards) in GA4
	// as an `affiliate_click` event with the partner and the page it came from.
	onMount(() => {
		const onClick = (e: MouseEvent) => {
			const link = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
			if (!link) return;
			const partner = link.dataset.affiliate || getAffiliatePartner(link.href);
			if (!partner) return;
			const gtag = (window as any).gtag;
			if (typeof gtag === 'function') {
				gtag('event', 'affiliate_click', {
					partner,
					link_url: link.href,
					link_text: (link.textContent || '').trim().slice(0, 100),
					page_path: window.location.pathname,
					transport_type: 'beacon'
				});
			}
		};
		document.addEventListener('click', onClick, true);
		return () => document.removeEventListener('click', onClick, true);
	});

	onMount(() => {
        // Unregister any legacy or conflicting service workers and delete stale navigation caches
        try {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then((regs) => {
                    regs.forEach((reg) => reg.unregister().catch(() => {}));
                }).catch(() => {});
            }
            if ('caches' in window) {
                caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
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
                        .maybeSingle();
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
                            .maybeSingle();
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

{@render children()}

<SiteFooter />

<!-- Friendly notice when a user hits the daily AI limit -->
<DailyLimitNotice />

<!-- AI Support Chat — floating bottom-right -->
<SupportChat {supabase} {session} />
