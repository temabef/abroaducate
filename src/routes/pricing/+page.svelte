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

		<!-- Sample Output Section -->
		<div class="mt-24 max-w-4xl mx-auto">
			<div class="text-center mb-12">
				<span class="inline-block px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-bold tracking-wider uppercase mb-4 border border-emerald-200">
					Real Output Example
				</span>
				<h2 class="text-3xl font-bold text-slate-900 mb-4" style="font-family: 'Outfit', sans-serif;">
					Here's what 1 credit gets you
				</h2>
				<p class="text-slate-600 max-w-xl mx-auto">
					This is a real AI Fit Check output for a Computer Science applicant targeting TU Berlin. One credit. Thirty seconds.
				</p>
			</div>

			<!-- Mock terminal / output card -->
			<div class="bg-[#0f172a] rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
				<!-- Terminal bar -->
				<div class="flex items-center gap-2 px-5 py-3.5 border-b border-slate-700/60 bg-slate-800/50">
					<span class="w-3 h-3 rounded-full bg-red-500/80"></span>
					<span class="w-3 h-3 rounded-full bg-yellow-500/80"></span>
					<span class="w-3 h-3 rounded-full bg-emerald-500/80"></span>
					<span class="ml-3 text-xs text-slate-400 font-mono">AI Fit Check — Computer Science (M.Sc.) · TU Berlin</span>
				</div>

				<div class="p-7 space-y-6 font-mono text-sm">
					<!-- Match score -->
					<div class="flex items-center justify-between">
						<span class="text-slate-400">Overall Match Score</span>
						<div class="flex items-center gap-3">
							<div class="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
								<div class="h-full bg-emerald-500 rounded-full" style="width: 82%"></div>
							</div>
							<span class="text-emerald-400 font-bold text-base">82 / 100</span>
						</div>
					</div>

					<div class="border-t border-slate-700/60"></div>

					<!-- Strengths -->
					<div>
						<p class="text-orange-400 font-bold mb-3 text-xs uppercase tracking-widest">✦ Your Strengths</p>
						<ul class="space-y-2 text-slate-300">
							<li class="flex items-start gap-2"><span class="text-emerald-400 mt-0.5">✓</span> Strong GPA (3.7) exceeds TU Berlin's typical threshold of 3.0</li>
							<li class="flex items-start gap-2"><span class="text-emerald-400 mt-0.5">✓</span> IELTS 7.0 meets the B2/C1 English requirement</li>
							<li class="flex items-start gap-2"><span class="text-emerald-400 mt-0.5">✓</span> Bachelor's in Computer Engineering is a direct field match</li>
						</ul>
					</div>

					<!-- Gaps -->
					<div>
						<p class="text-red-400 font-bold mb-3 text-xs uppercase tracking-widest">⚠ Gaps to Address</p>
						<ul class="space-y-2 text-slate-300">
							<li class="flex items-start gap-2"><span class="text-red-400 mt-0.5">✗</span> No research experience listed — TU Berlin values this for M.Sc. applicants</li>
							<li class="flex items-start gap-2"><span class="text-red-400 mt-0.5">✗</span> SOP does not mention specific TU Berlin research groups or professors</li>
						</ul>
					</div>

					<!-- Recommendation -->
					<div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
						<p class="text-orange-400 font-bold mb-2 text-xs uppercase tracking-widest">→ Recommendation</p>
						<p class="text-slate-300 leading-relaxed">
							Your profile is competitive. The main risk is a generic SOP. Mention Prof. Klaus-Robert Müller's machine learning group specifically — it aligns with your background and signals you've done your research. Add any project work (even coursework) that involved data or algorithms as a proxy for research experience.
						</p>
					</div>

					<!-- Matched scholarships -->
					<div>
						<p class="text-slate-400 font-bold mb-3 text-xs uppercase tracking-widest">🎓 Top Matched Scholarships</p>
						<ul class="space-y-2 text-slate-300">
							<li class="flex items-start gap-2"><span class="text-orange-400 mt-0.5">◆</span> DAAD Study Scholarships — 94% match · Deadline: Oct 15</li>
							<li class="flex items-start gap-2"><span class="text-orange-400 mt-0.5">◆</span> Deutschlandstipendium — 88% match · Deadline: Nov 30</li>
							<li class="flex items-start gap-2"><span class="text-orange-400 mt-0.5">◆</span> Heinrich Böll Foundation — 76% match · Deadline: Sep 1</li>
						</ul>
					</div>
				</div>
			</div>

			<p class="text-center text-sm text-slate-400 mt-5">
				Output tailored to your actual profile and the specific program you're applying to.
			</p>
		</div>

		<!-- Final CTA -->
		<div class="mt-16 max-w-2xl mx-auto text-center">
			<p class="text-slate-500 text-sm mb-2">New accounts get 3 free credits — no card required.</p>
			<a
				href="/dashboard"
				class="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full font-bold text-base transition-colors shadow-lg shadow-orange-500/20"
			>
				Try it free <ArrowRight size={18} />
			</a>
		</div>

	</div>
</div>
