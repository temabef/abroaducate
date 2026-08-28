<script lang="ts">
	import { 
		GraduationCap, MapPin, Banknote, Calendar, 
		ExternalLink, ChevronRight, CheckCircle2, ShieldCheck, 
		Clock, Sparkles, Building2, HelpCircle, ArrowRight, Globe
	} from 'lucide-svelte';
	import SEO from '$lib/components/SEO.svelte';

	let { data } = $props();
	const country = $derived(data.country);
	const programs = $derived(data.programs || []);
	const totalCount = $derived(data.totalCount || 0);
	const tuitionFreeCount = $derived(data.tuitionFreeCount || 0);
	const availableFields = $derived(data.availableFields || []);

	// FAQ state
	let openFaqIndex = $state<number | null>(0);
	function toggleFaq(index: number) {
		openFaqIndex = openFaqIndex === index ? null : index;
	}

	// JSON-LD Schema
	const breadcrumbJsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.abroaducate.com/' },
			{ '@type': 'ListItem', position: 2, name: 'Degree Programs', item: 'https://www.abroaducate.com/programs' },
			{ '@type': 'ListItem', position: 3, name: country.name, item: `https://www.abroaducate.com/programs/country/${country.slug}` }
		]
	});

	const itemListJsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		name: country.title,
		description: country.metaDescription,
		numberOfItems: programs.length,
		itemListElement: programs.slice(0, 15).map((p: any, idx: number) => ({
			'@type': 'ListItem',
			position: idx + 1,
			name: `${p.program_name} - ${p.university_name}`,
			url: `https://www.abroaducate.com/programs/${p.id}`
		}))
	});

	const faqJsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: country.faqs.map((f: any) => ({
			'@type': 'Question',
			name: f.q,
			acceptedAnswer: {
				'@type': 'Answer',
				text: f.a
			}
		}))
	});
</script>

<SEO 
	title={country.title}
	description={country.metaDescription}
	canonical={`https://www.abroaducate.com/programs/country/${country.slug}`}
	type="website"
/>

<svelte:head>
	{@html `<script type="application/ld+json">${JSON.stringify(breadcrumbJsonLd)}</script>`}
	{@html `<script type="application/ld+json">${JSON.stringify(itemListJsonLd)}</script>`}
	{@html `<script type="application/ld+json">${JSON.stringify(faqJsonLd)}</script>`}
</svelte:head>

<div class="country-hub-page min-h-screen bg-slate-50">
	<!-- Hero Section -->
	<div class="relative bg-white border-b border-slate-200/80 pt-8 pb-10 px-4 sm:px-6 overflow-hidden">
		<!-- Background Glows -->
		<div class="absolute top-0 right-1/4 w-72 h-72 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
		<div class="absolute bottom-0 left-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

		<div class="max-w-6xl mx-auto">
			<!-- Breadcrumb Navigation -->
			<nav class="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-5" aria-label="Breadcrumb">
				<a href="/" class="hover:text-slate-900 transition-colors">Home</a>
				<ChevronRight size={12} class="text-slate-400" />
				<a href="/programs" class="hover:text-slate-900 transition-colors">Programs</a>
				<ChevronRight size={12} class="text-slate-400" />
				<span class="text-orange-600 font-bold">{country.name}</span>
			</nav>

			<!-- Hero Heading Area -->
			<div class="mb-8">
				<div class="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-200/80 text-orange-700 rounded-full text-xs font-bold uppercase tracking-wide mb-3.5">
					<Globe size={13} class="text-orange-600" />
					<span>{country.tagline}</span>
				</div>
				<h1 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3" style="font-family: 'Outfit', sans-serif; text-wrap: balance;">
					Study in {country.name} in English
				</h1>
				<p class="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl" style="text-wrap: balance;">
					{country.heroSub}
				</p>
			</div>

			<!-- Key Country Metrics Bar -->
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg shadow-slate-900/5">
				<div class="border-r border-slate-800 pr-2">
					<p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tuition Fees</p>
					<p class="text-xs sm:text-sm font-extrabold text-emerald-400 mt-1">{country.tuitionSummary}</p>
				</div>
				<div class="border-r border-slate-800 pr-2 sm:pl-2">
					<p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estimated Living</p>
					<p class="text-xs sm:text-sm font-extrabold text-white mt-1">{country.livingCost}</p>
				</div>
				<div class="border-r border-slate-800 pr-2 sm:pl-2">
					<p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Visa Funds</p>
					<p class="text-xs sm:text-sm font-extrabold text-amber-300 mt-1">{country.blockedAccount}</p>
				</div>
				<div class="sm:pl-2">
					<p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Work After Study</p>
					<p class="text-xs sm:text-sm font-extrabold text-blue-300 mt-1">{country.postStudyWork}</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Main Content Area -->
	<div class="max-w-6xl mx-auto px-4 sm:px-6 py-10">
		<!-- Sub-category Field Filter Chips -->
		<div class="mb-10">
			<h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Browse {country.name} Degrees by Field:</h2>
			<div class="flex flex-wrap gap-2">
				<a 
					href={`/programs/country/${country.slug}`} 
					class="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold shadow-sm"
				>
					All {country.name} Degrees ({totalCount})
				</a>
				{#each availableFields as field}
					<a 
						href={`/programs/country/${country.slug}/${field.slug}`} 
						class="px-4 py-2 bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-600 border border-slate-200 hover:border-orange-300 rounded-xl text-xs font-semibold transition-all"
					>
						{field.name}
					</a>
				{/each}
			</div>
		</div>

		<!-- Program Listings Header -->
		<div class="flex items-center justify-between mb-6">
			<div>
				<h2 class="text-2xl font-extrabold text-slate-900" style="font-family: 'Outfit', sans-serif;">
					Top English Programs in {country.name}
				</h2>
				<p class="text-xs text-slate-500 mt-0.5">Showing {programs.length} of {totalCount} accredited degrees</p>
			</div>
			<a href={`/programs?country=${encodeURIComponent(country.name)}`} class="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1">
				<span>Open in Advanced Filter</span>
				<ChevronRight size={14} />
			</a>
		</div>

		<!-- Programs Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
			{#each programs as p}
				<div class="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between hover:shadow-lg hover:border-orange-400/50 transition-all duration-200">
					<div>
						<!-- Top Tag -->
						<div class="flex items-center justify-between mb-3">
							<span class="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full {p.tuition_per_semester === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}">
								{p.tuition_per_semester === 0 ? '€0 Tuition Free' : `€${p.tuition_per_semester}/sem`}
							</span>
							<span class="text-xs font-semibold text-slate-500">{p.degree_level}</span>
						</div>

						<h3 class="text-base font-extrabold text-slate-900 leading-snug mb-1 line-clamp-2">
							<a href={`/programs/${p.id}`} class="hover:text-orange-600 transition-colors">
								{p.program_name}
							</a>
						</h3>
						<p class="text-xs font-semibold text-slate-600 flex items-center gap-1 mb-3">
							<Building2 size={13} class="text-slate-400 shrink-0" />
							<span class="line-clamp-1">{p.university_name}</span>
						</p>

						<div class="space-y-1.5 text-xs text-slate-500 mb-5">
							<div class="flex items-center gap-1.5">
								<MapPin size={13} class="text-slate-400 shrink-0" />
								<span>{p.city}, {p.country}</span>
							</div>
							<div class="flex items-center gap-1.5">
								<Calendar size={13} class="text-slate-400 shrink-0" />
								<span>{p.deadline_summary || 'Check Official Site'}</span>
							</div>
						</div>
					</div>

					<!-- Card Footer Actions -->
					<div class="pt-3 border-t border-slate-100 flex items-center gap-2">
						<a 
							href={`/programs/${p.id}`} 
							class="flex-1 text-center py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors"
						>
							View Program & AI Strategy
						</a>
						{#if p.direct_application_url}
							<a 
								href={p.direct_application_url} 
								target="_blank" 
								rel="noopener noreferrer" 
								class="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors"
								title="Apply via Official Portal"
							>
								<ExternalLink size={14} />
							</a>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<!-- Contextual Relocation Toolkit Banner -->
		<div class="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 mb-14 shadow-xl">
			<div class="max-w-3xl">
				<span class="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-xs font-extrabold uppercase mb-3">
					<ShieldCheck size={14} /> Official {country.name} Relocation Checklist
				</span>
				<h3 class="text-2xl font-extrabold text-white mb-2" style="font-family: 'Outfit', sans-serif;">
					Moving to {country.name}? Secure Your Visa Essentials
				</h3>
				<p class="text-slate-300 text-sm leading-relaxed mb-6">
					Access verified providers for {country.name} student visa proof of funds, statutory health insurance, certified document translation, and European travel eSIMs.
				</p>
				<a 
					href="/toolkit" 
					class="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-orange-500/25"
				>
					<span>Open {country.name} Relocation Toolkit</span>
					<ArrowRight size={16} />
				</a>
			</div>
		</div>

		<!-- Frequently Asked Questions Accordion -->
		<div class="max-w-3xl mx-auto">
			<div class="text-center mb-8">
				<h2 class="text-2xl font-extrabold text-slate-900 tracking-tight" style="font-family: 'Outfit', sans-serif;">
					Frequently Asked Questions about Studying in {country.name}
				</h2>
				<p class="text-slate-500 text-xs mt-1">Key immigration, tuition, and admissions rules for international applicants</p>
			</div>

			<div class="space-y-3">
				{#each country.faqs as faq, i}
					<div class="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
						<button 
							onclick={() => toggleFaq(i)}
							class="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-slate-900 text-sm hover:text-orange-600 transition-colors"
						>
							<span>{faq.q}</span>
							<ChevronRight size={18} class="text-slate-400 transition-transform {openFaqIndex === i ? 'rotate-90 text-orange-600' : ''}" />
						</button>
						{#if openFaqIndex === i}
							<div class="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
								{faq.a}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
