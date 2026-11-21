<script lang="ts">
	import { dailyLimitNotice, dismissDailyLimitNotice } from '$lib/services/upgradeService';
	import { Clock, X } from 'lucide-svelte';
</script>

{#if $dailyLimitNotice.show}
	<div class="limit-notice" role="status">
		<Clock size={18} class="shrink-0" />
		<p>{$dailyLimitNotice.message}</p>
		<button onclick={dismissDailyLimitNotice} aria-label="Dismiss"><X size={16} /></button>
	</div>
{/if}

<style>
	.limit-notice {
		position: fixed;
		left: 50%;
		bottom: 1.5rem;
		transform: translateX(-50%);
		z-index: 60;
		display: flex;
		align-items: flex-start;
		gap: 0.6rem;
		width: min(30rem, calc(100vw - 2rem));
		padding: 0.9rem 1rem;
		border-radius: 0.9rem;
		background: #0f172a;
		color: #f8fafc;
		box-shadow: 0 12px 40px rgba(15, 23, 42, 0.25);
		font-size: 0.875rem;
		line-height: 1.5;
	}
	.limit-notice p {
		flex: 1;
		margin: 0;
	}
	.limit-notice button {
		color: #94a3b8;
		background: none;
		border: 0;
		cursor: pointer;
		padding: 0.1rem;
	}
	.limit-notice button:hover {
		color: #ffffff;
	}
</style>
