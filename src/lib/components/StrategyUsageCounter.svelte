<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let count = $state(0);
	let loading = $state(true);

	onMount(async () => {
		// onMount only runs in browser — but double-guard anyway
		if (!browser) {
			loading = false;
			return;
		}
		try {
			// Dynamically import supabase client only in browser
			const { supabase } = await import('$lib/supabase');
			const { count: result, error } = await supabase
				.from('credit_transactions')
				.select('id', { count: 'exact', head: true })
				.eq('action_type', 'SCHOLARSHIP_STRATEGY_GENERATION')
				.gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

			if (!error && result !== null) {
				count = result;
			}
		} catch {
			// silently fail — counter is non-critical
		} finally {
			loading = false;
		}
	});
</script>

{#if !loading && count > 0}
	<p class="text-sm text-orange-600 font-medium flex items-center gap-1.5 animate-pulse">
		🔥 <span>{count} students unlocked strategies today</span>
	</p>
{:else if !loading}
	<p class="text-sm text-orange-600 font-medium flex items-center gap-1.5">
		🔥 <span>Join 5,500+ students using Abroaducate</span>
	</p>
{/if}
