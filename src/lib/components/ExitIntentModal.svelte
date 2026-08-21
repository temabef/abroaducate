<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { CheckCircle2, X } from 'lucide-svelte';
	import SampleStrategyModal from './SampleStrategyModal.svelte';

	let { show = $bindable(false) } = $props();

	let showSample = $state(false);
	let hasShown = $state(false);

	function close() {
		show = false;
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) close();
	}

	function handleMouseLeave(e: MouseEvent) {
		// Trigger when mouse moves to very top of viewport (toward browser chrome)
		if (e.clientY <= 8 && !hasShown) {
			hasShown = true;
			show = true;
		}
	}

	function addListener() {
		if (!browser) return;
		const seen = sessionStorage.getItem('exitIntentShown');
		if (!seen) {
			document.addEventListener('mouseleave', handleMouseLeave);
		}
	}

	function removeListener() {
		if (!browser) return;
		document.removeEventListener('mouseleave', handleMouseLeave);
	}

	onMount(() => {
		addListener();
	});

	onDestroy(() => {
		// Guard with browser check — onDestroy can run during SSR cleanup
		if (browser) {
			removeListener();
		}
	});

	// Mark as shown when it appears, and remove listener
	$effect(() => {
		if (show && browser) {
			sessionStorage.setItem('exitIntentShown', 'true');
			removeListener();
		}
	});
</script>

{#if show}
	<div
		class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="exit-intent-title"
	>
		<div class="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slideDown relative">
			<button
				onclick={close}
				class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
				aria-label="Close"
			>
				<X size={20} />
			</button>

			<div class="p-8 text-center">
				<!-- Icon -->
				<div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg class="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
					</svg>
				</div>

				<h3 id="exit-intent-title" class="text-2xl font-extrabold text-slate-900 mb-2" style="font-family: 'Outfit', sans-serif;">
					Before you go...
				</h3>
				<p class="text-slate-600 mb-6">
					Did you know you get <span class="font-bold text-orange-600">3 free credits</span> to try our AI scholarship win strategy?
				</p>

				<!-- What you get -->
				<div class="bg-slate-50 rounded-xl p-4 mb-6 text-left">
					<ul class="space-y-2">
						<li class="flex items-center gap-2 text-sm text-slate-700">
							<CheckCircle2 size={16} class="text-green-600 shrink-0" />
							See which scholarships you qualify for
						</li>
						<li class="flex items-center gap-2 text-sm text-slate-700">
							<CheckCircle2 size={16} class="text-green-600 shrink-0" />
							Get the committee's exact selection rubric
						</li>
						<li class="flex items-center gap-2 text-sm text-slate-700">
							<CheckCircle2 size={16} class="text-green-600 shrink-0" />
							Personalised essay angles & action plan
						</li>
						<li class="flex items-center gap-2 text-sm text-slate-700">
							<CheckCircle2 size={16} class="text-green-600 shrink-0" />
							Tailored to your profile in 30 seconds
						</li>
					</ul>
				</div>

				<div class="flex flex-col gap-3">
					<button
						onclick={() => { showSample = true; close(); }}
						class="w-full py-3 px-4 border-2 border-slate-300 text-slate-700 hover:border-orange-400 hover:text-orange-700 rounded-xl text-sm font-semibold transition-all"
					>
						See Sample Strategy First
					</button>
					<a
						href="/programs"
						onclick={close}
						class="w-full py-3 px-6 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all block"
					>
						Browse Programs Now →
					</a>
					<button
						onclick={close}
						class="text-sm text-slate-400 hover:text-slate-600 transition-colors"
					>
						No thanks, I'll leave
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<SampleStrategyModal bind:show={showSample} />

<style>
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	@keyframes slideDown {
		from { opacity: 0; transform: translateY(-20px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.animate-fadeIn { animation: fadeIn 0.2s ease-out; }
	.animate-slideDown { animation: slideDown 0.3s ease-out; }
</style>
