<script lang="ts">
	import { goto } from '$app/navigation';
	import { CheckCircle2, X, Sparkles } from 'lucide-svelte';
	import SampleStrategyModal from './SampleStrategyModal.svelte';

	let { show = $bindable(false) } = $props();

	let showSample = $state(false);

	function closeAndBrowse() {
		show = false;
		goto('/programs');
	}

	function close() {
		show = false;
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			close();
		}
	}

	const steps = [
		{ n: 1, text: 'Browse 2,500+ low and tuition-free European degree programs' },
		{ n: 2, text: 'Check your eligibility and generate an application strategy for free' },
		{ n: 3, text: 'Use our Relocation Toolkit to sort your visa blocked account & travel eSIM' },
	];

	const features = [
		'Eligibility match using your profile',
		'Committee rubric breakdown',
		'Essay narrative angles tailored to you',
		'Step-by-step action path (6-7 steps)',
		'Official Visa & Blocked Account guidelines',
	];
</script>

{#if show}
	<div
		class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="welcome-overlay-title"
	>
		<div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
			<div class="p-8">
				<!-- Close button -->
				<button
					onclick={close}
					class="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors"
					aria-label="Close"
				>
					<X size={20} />
				</button>

				<!-- Icon + Heading -->
				<div class="text-center mb-6">
					<div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
						<Sparkles size={30} />
					</div>
					<h2 id="welcome-overlay-title" class="text-3xl font-extrabold text-slate-900 mb-2" style="font-family: 'Outfit', sans-serif;">
						Welcome to Abroaducate!
					</h2>
					<p class="text-lg text-slate-600">
						Everything on Abroaducate is <span class="font-bold text-emerald-600">100% Free</span> — no credit limits or cards required.
					</p>
				</div>

				<!-- How to get started -->
				<div class="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 mb-5 border border-orange-100">
					<p class="font-semibold text-slate-900 mb-4 text-center">How to get started:</p>
					<ol class="space-y-3">
						{#each steps as s}
							<li class="flex items-start gap-3">
								<span class="w-7 h-7 rounded-full bg-orange-600 text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
									{s.n}
								</span>
								<span class="text-slate-700 leading-relaxed">{s.text}</span>
							</li>
						{/each}
					</ol>
				</div>

				<!-- What you get -->
				<div class="bg-white border-2 border-orange-200 rounded-xl p-5 mb-6">
					<p class="font-semibold text-slate-900 mb-3">What you get for free:</p>
					<ul class="space-y-2">
						{#each features as f}
							<li class="flex items-center gap-2 text-sm text-slate-700">
								<CheckCircle2 size={16} class="text-green-600 shrink-0" />
								<span>{f}</span>
							</li>
						{/each}
					</ul>
					<p class="text-xs text-slate-500 mt-3 text-center">Instant, tailored guidance for your study abroad journey.</p>
				</div>

				<!-- CTAs -->
				<div class="flex flex-col sm:flex-row gap-3">
					<button
						onclick={() => { showSample = true; }}
						class="flex-1 py-3 px-4 border-2 border-slate-300 text-slate-700 hover:border-orange-400 hover:text-orange-700 rounded-xl text-sm font-semibold transition-all"
					>
						See Sample First
					</button>
					<button
						onclick={closeAndBrowse}
						class="flex-1 py-3 px-6 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all"
					>
						Start Browsing Programs →
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
	@keyframes slideUp {
		from { opacity: 0; transform: translateY(20px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.animate-fadeIn { animation: fadeIn 0.2s ease-out; }
	.animate-slideUp { animation: slideUp 0.3s ease-out; }
</style>
