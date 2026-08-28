<script lang="ts">
	import { CheckCircle2, ShieldCheck, ArrowRight, Globe, Sparkles, GraduationCap } from 'lucide-svelte';
	import SEO from '$lib/components/SEO.svelte';
</script>

<SEO 
	title="Abroaducate is 100% Free — No Subscriptions, Ever"
	description="Abroaducate is completely free for all international students. Browse 2,500+ tuition-free degrees in Europe and access our relocation toolkit without paying a dime."
/>

<div class="bg-slate-50 min-h-screen pb-24">
	<!-- Header -->
	<header class="bg-[#0f172a] text-white pt-24 pb-28 px-6 text-center relative overflow-hidden">
		<div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.15),transparent_50%)]"></div>

		<div class="relative z-10 max-w-3xl mx-auto">
			<span class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-bold tracking-wider uppercase mb-6 border border-emerald-500/30">
				<Sparkles size={16} /> 100% Free Platform
			</span>
			<h1 class="text-4xl md:text-5xl font-extrabold mb-6" style="font-family: 'Outfit', sans-serif;">
				No subscriptions. No paywalls. Ever.
			</h1>
			<p class="text-lg text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
				We believe studying abroad shouldn't start with paying expensive software subscriptions. Every search, scholarship match, and application guide on Abroaducate is <strong class="text-white">100% Free</strong>.
			</p>
		</div>
	</header>

	<!-- Explanation Card -->
	<div class="max-w-4xl mx-auto px-6 -mt-14 relative z-20">
		<div class="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-xl">
			<div class="text-center max-w-2xl mx-auto mb-10">
				<h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3" style="font-family: 'Outfit', sans-serif;">
					How does Abroaducate stay free?
				</h2>
				<p class="text-slate-600 text-sm leading-relaxed">
					Instead of charging broke or budget-conscious students for software, we partner with verified relocation service providers that you already need for your visa (like German Blocked Accounts, Health Insurance, and Travel eSIMs).
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
				<div class="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
					<div class="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3">
						<GraduationCap size={24} />
					</div>
					<h3 class="font-bold text-slate-900 text-base mb-1">Free Degree Search</h3>
					<p class="text-xs text-slate-500">Access 2,500+ low & zero-tuition European university programs.</p>
				</div>

				<div class="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
					<div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
						<Sparkles size={24} />
					</div>
					<h3 class="font-bold text-slate-900 text-base mb-1">Free Strategy & Tools</h3>
					<p class="text-xs text-slate-500">Eligibility checks, rubrics, and application roadmaps without credit limits.</p>
				</div>

				<div class="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
					<div class="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
						<ShieldCheck size={24} />
					</div>
					<h3 class="font-bold text-slate-900 text-base mb-1">Verified Relocation</h3>
					<p class="text-xs text-slate-500">Embassy-approved blocked accounts, certified translations & eSIMs.</p>
				</div>
			</div>

			<!-- CTAs -->
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<a 
					href="/programs" 
					class="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-extrabold rounded-xl transition-all shadow-lg hover:shadow-orange-500/30 flex items-center justify-center gap-2 text-base"
				>
					<span>Browse Programs (Free)</span>
					<ArrowRight size={18} />
				</a>
				<a 
					href="/toolkit" 
					class="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-base"
				>
					<span>Explore Relocation Toolkit</span>
					<ArrowRight size={18} />
				</a>
			</div>
		</div>
	</div>
</div>
