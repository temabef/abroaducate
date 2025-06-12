<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import GlobalUpgradeHandler from '$lib/components/GlobalUpgradeHandler.svelte';

	let { data, children } = $props();
	let { supabase, session } = $derived(data);

	onMount(() => {
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((event, newSession) => {
			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});
		return () => subscription.unsubscribe();
	});
</script>

<Navbar {data} />

{@render children()}

<!-- Global upgrade handler - works everywhere -->
<GlobalUpgradeHandler /> 