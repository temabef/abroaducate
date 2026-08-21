<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { Flame, Sparkles } from 'lucide-svelte';

	let count = $state(0);
	let loading = $state(true);

	onMount(async () => {
		if (!browser) {
			loading = false;
			return;
		}
		try {
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
			// silently fail
		} finally {
			loading = false;
		}
	});
</script>

{#if !loading && count > 0}
	<p class="text-sm text-orange-600 font-semibold flex items-center gap-1.5 animate-pulse">
		<Flame size={16} class="text-orange-500 shrink-0 fill-orange-500/20" />
		<span>{count} students unlocked strategies today</span>
	</p>
{:else if !loading}
	<p class="text-sm text-orange-600 font-semibold flex items-center gap-1.5">
		<Sparkles size={16} class="text-orange-500 shrink-0" />
		<span>Join 5,500+ students using Abroaducate</span>
	</p>
{/if}
