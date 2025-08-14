<script lang="ts">
    import { onMount } from 'svelte';
    import { invalidate, afterNavigate } from '$app/navigation';
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import GlobalUpgradeHandler from '$lib/components/GlobalUpgradeHandler.svelte';
    import { analytics } from '$lib/utils/posthog';
    import AdBootstrap from '$lib/components/AdBootstrap.svelte';

	let { data, children } = $props();
    let { supabase, session } = $derived(data);
    let identifiedUserId: string | null = null;

	onMount(() => {
        // Track SPA navigations and keep session recording alive
        afterNavigate(() => {
            try { analytics.trackPageView(document.title || 'Page', { path: location.pathname }); } catch {}
            try { (window as any).posthog?.startSessionRecording?.(); } catch {}
        });

        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange(async (event, newSession) => {
			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}

			// Identify user in analytics when session becomes available
            if (newSession?.user) {
                try {
                    if (identifiedUserId === newSession.user.id) return;
                    // Fetch current plan_type for enrichment
                    let planType = 'free';
                    try {
                        const { data: sub } = await supabase
                            .from('user_subscriptions')
                            .select('plan_type')
                            .eq('user_id', newSession.user.id)
                            .in('status', ['active','trialing'])
                            .single();
                        planType = sub?.plan_type || 'free';
                    } catch {}
                    analytics.identify(newSession.user.id, {
                        email: newSession.user.email,
                        plan_type: planType
                    });
                    identifiedUserId = newSession.user.id;
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