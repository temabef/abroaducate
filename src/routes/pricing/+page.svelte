<script lang="ts">
	import { CheckCircle2, Zap, Brain, Sparkles, Coins, ArrowRight } from 'lucide-svelte';

	// Credit Packs Configuration
	const creditPacks = [
		{
			id: 'starter',
			name: 'Starter Pack',
			credits: 20,
			price: '$4.99',
			pricePerCredit: '~ $0.25',
			popular: false,
			description: 'Perfect for exploring a couple of tailored program strategies.',
			features: [
				'20 AI Fit Checks OR 10 Documents',
				'Mix and match across any document type',
				'Credits never expire'
			]
		},
		{
			id: 'accelerator',
			name: 'Accelerator Pack',
			credits: 50,
			price: '$9.99',
			pricePerCredit: '~ $0.20',
			popular: true,
			description:
				'The sweet spot. Most students use 50 credits to cover their full application cycle.',
			features: [
				'Best value per credit',
				'50 AI Fit Checks OR 25 Documents',
				'Mix SOPs, Cover Letters, CVs freely',
				'Credits never expire'
			]
		},
		{
			id: 'unlimited',
			name: 'Elite Pack',
			credits: 130,
			price: '$24.99',
			pricePerCredit: '~ $0.19',
			popular: false,
			description: 'For those applying broadly across multiple countries and institutions.',
			features: [
				'Biggest volume discount',
				'130 credits — enough for 40+ applications',
				'All document types covered',
				'Credits never expire'
			]
		}
	];

	// Action Costs Breakdown
	const actionCosts = [
		{ action: 'AI Fit Check & Competitiveness Score', cost: 1, icon: Brain },
		{ action: 'Statement of Purpose (SOP)', cost: 2, icon: Sparkles },
		{ action: 'Cover Letter / Motivation Letter', cost: 2, icon: Zap },
		{ action: 'Personal Statement', cost: 2, icon: Coins }
	];

	let loadingPack = $state<string | null>(null);

	async function handleCheckout(packId: string) {
		try {
			loadingPack = packId;

			const res = await fetch('/api/stripe/create-credit-checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ packId })
			});
			const data = await res.json();

			if (data.error) {
				alert(data.error);
				return;
			}

			if (data.checkoutUrl) {
				window.location.href = data.checkoutUrl;
			}
		} catch (e) {
			console.error(e);
			alert('Failed to initiate checkout. Please try again.');
		} finally {
			loadingPack = null;
		}
	}
</script>

<svelte:head>
	<title>Pay-As-You-Go Credits | Abroaducate</title>
</svelte:head>

<div class="pricing-page bg-slate-50 min-h-screen pb-24">
	<!-- Header -->
	<header class="bg-[#0f172a] text-white pt-24 pb-32 px-6 text-center relative overflow-hidden">
		<!-- Background Glow -->
		<div
			class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.15),transparent_50%)]"
		></div>

		<div class="relative z-10 max-w-3xl mx-auto">
			<span
				class="inline-block px-4 py-1.5 rounded-full bg-orange-500/20 text-orange-400 text-sm font-bold tracking-wider uppercase mb-6 border border-orange-500/30"
			>
				Simple Pay-As-You-Go
			</span>
			<h1
				class="text-4xl md:text-5xl font-extrabold mb-6"
				style="font-family: 'Outfit', sans-serif;"
			>
				No subscriptions. Ever.
			</h1>
			<p class="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
				Study abroad is a one-time journey, not a monthly subscription. Every new account gets <strong
					class="text-white">3 Free Credits</strong
				>. After that, just top up exactly what you need.
			</p>
		</div>
	</header>

	<!-- Main Content / Pricing Cards -->
	<div class="max-w-7xl mx-auto px-6 -mt-20 relative z-20">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
			{#each creditPacks as pack}
				<div
					class={`bg-white rounded-3xl p-8 border ${pack.popular ? 'border-orange-500 shadow-xl shadow-orange-500/10 relative transform md:-translate-y-4' : 'border-slate-200 shadow-md'}`}
				>
					{#if pack.popular}
						<div
							class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase shadow-md"
						>
							Most Popular
						</div>
					{/if}

					<div class="flex justify-between items-start mb-6">
						<div>
							<h3
								class="text-xl font-bold text-slate-900 mb-1"
								style="font-family: 'Outfit', sans-serif;"
							>
								{pack.name}
							</h3>
							<p class="text-sm font-medium text-orange-500">{pack.credits} Credits</p>
						</div>
					</div>

					<div class="mb-6">
						<span
							class="text-4xl font-extrabold text-slate-900 leading-none"
							style="font-family: 'Outfit', sans-serif;">{pack.price}</span
						>
						<span class="text-sm text-slate-500 ml-2 font-medium bg-slate-100 px-2 py-1 rounded-md"
							>{pack.pricePerCredit} / credit</span
						>
					</div>

					<p class="text-slate-600 text-sm leading-relaxed mb-8 h-10">
						{pack.description}
					</p>

					<ul class="space-y-4 mb-8">
						{#each pack.features as feature}
							<li class="flex items-start gap-3">
								<CheckCircle2 size={18} class="text-emerald-500 mt-0.5 flex-shrink-0" />
								<span class="text-sm text-slate-700 font-medium">{feature}</span>
							</li>
						{/each}
					</ul>

					<button
						onclick={() => handleCheckout(pack.id)}
						disabled={loadingPack === pack.id}
						class={`w-full py-3.5 px-6 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${pack.popular ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-orange-500/30' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
					>
						{#if loadingPack === pack.id}
							<div
								class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
							></div>
							Processing...
						{:else}
							Buy {pack.credits} Credits <ArrowRight size={18} />
						{/if}
					</button>
				</div>
			{/each}
		</div>

		<!-- How Credits Work -->
		<div class="mt-24 max-w-4xl mx-auto">
			<div class="text-center mb-12">
				<h2
					class="text-3xl font-bold text-slate-900 mb-4"
					style="font-family: 'Outfit', sans-serif;"
				>
					How much does it cost?
				</h2>
				<p class="text-slate-600">
					You only spend credits when you generate complex AI assessments or write documents.
				</p>
			</div>

			<div class="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					{#each actionCosts as item}
						{@const Icon = item.icon}
						<div
							class="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100"
						>
							<div class="flex items-center gap-3">
								<div
									class="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-slate-200 text-slate-600 shadow-sm"
								>
									<Icon size={20} />
								</div>
								<span class="font-semibold text-slate-800">{item.action}</span>
							</div>
							<div
								class="flex items-center gap-1.5 bg-[#0f172a] text-white px-3 py-1.5 rounded-full font-bold text-sm"
							>
								<Coins size={14} class="text-orange-400" />
								{item.cost}
							</div>
						</div>
					{/each}
				</div>

				<div class="mt-8 pt-8 border-t border-slate-100 text-center">
					<p class="text-sm text-slate-500 flex items-center justify-center gap-2">
						<CheckCircle2 size={16} class="text-emerald-500" />
						Browsing programs, tracking applications, and viewing scholarship matches are
						<strong class="text-slate-800">always free</strong>.
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
