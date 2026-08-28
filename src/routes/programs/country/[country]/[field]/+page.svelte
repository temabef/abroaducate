<script lang="ts">
	import { 
		GraduationCap, MapPin, Banknote, Calendar, 
		ExternalLink, ChevronRight, CheckCircle2, ShieldCheck, 
		Building2, ArrowRight, BookOpen, Globe
	} from 'lucide-svelte';
	import SEO from '$lib/components/SEO.svelte';

	let { data } = $props();
	const country = $derived(data.country);
	const field = $derived(data.field);
	const programs = $derived(data.programs || []);
	const totalCount = $derived(data.totalCount || 0);
	const availableFields = $derived(data.availableFields || []);

	// JSON-LD Schema
	const breadcrumbJsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.abroaducate.com/' },
			{ '@type': 'ListItem', position: 2, name: 'Degree Programs', item: 'https://www.abroaducate.com/programs' },
			{ '@type': 'ListItem', position: 3, name: country.name, item: `https://www.abroaducate.com/programs/country/${country.slug}` },
			{ '@type': 'ListItem', position: 4, name: field.name, item: `https://www.abroaducate.com/programs/country/${country.slug}/${field.slug}` }
		]
	});

	const itemListJsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		name: data.dynamicTitle,
		description: data.dynamicDescription,
		numberOfItems: programs.length,
		itemListElement: programs.slice(0, 15).map((p: any, idx: number) => ({
			'@type': 'ListItem',
			position: idx + 1,
			name: `${p.program_name} - ${p.university_name}`,
			url: `https://www.abroaducate.com/programs/${p.id}`
		}))
	});
</script>

<SEO 
	title={data.dynamicTitle}
	description={data.dynamicDescription}
	canonical={`https://www.abroaducate.com/programs/country/${country.slug}/${field.slug}`}
	type="website"
/>

<svelte:head>
	{@html `<script type="application/ld+json">${JSON.stringify(breadcrumbJsonLd)}</script>`}
	{@html `<script type="application/ld+json">${JSON.stringify(itemListJsonLd)}</script>`}
</svelte:head>

<div class="country-field-hub min-h-screen bg-slate-50">
	<!-- Hero Section -->
	<div class="relative bg-white border-b border-slate-200/80 pt-8 pb-10 px-4 sm:px-6 overflow-hidden">
		<!-- Background Glows -->
		<div class="absolute top-0 right-1/4 w-72 h-72 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
		<div class="absolute bottom-0 left-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

		<div class="max-w-6xl mx-auto">
			<!-- Breadcrumb Navigation -->
			<nav class="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-5 flex-wrap" aria-label="Breadcrumb">
				<a href="/" class="hover:text-slate-900 transition-colors">Home</a>
				<ChevronRight size={12} class="text-slate-400" />
				<a href="/programs" class="hover:text-slate-900 transition-colors">Programs</a>
				<ChevronRight size={12} class="text-slate-400" />
				<a href={`/programs/country/${country.slug}`} class="hover:text-slate-900 transition-colors">{country.name}</a>
				<ChevronRight size={12} class="text-slate-400" />
				<span class="text-orange-600 font-bold">{field.name}</span>
			</nav>

			<!-- Hero Heading -->
			<div class="max-w-3xl mb-6">
				<div class="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-200/80 text-orange-700 rounded-full text-xs font-bold uppercase tracking-wide mb-3.5">
					<Globe size={13} class="text-orange-600" />
					<span>{country.name} &bull; {field.name}</span>
				</div>
				<h1 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3" style="font-family: 'Outfit', sans-serif; text-wrap: balance;">
					{field.name} Programs in {country.name}
				</h1>
				<p class="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl" style="text-wrap: balance;">
					Compare {totalCount} accredited, English-taught {field.name} degree programs in {country.name}. Check tuition fees, requirements, and admission deadlines.
				</p>
			</div>

			<!-- Other Fields Quick Switcher -->
			<div class="flex items-center gap-2 flex-wrap pt-2">
				<span class="text-xs font-bold text-slate-400 mr-1">Other Fields in {country.name}:</span>
				{#each availableFields as f}
					{#if f.slug !== field.slug}
						<a 
							href={`/programs/country/${country.slug}/${f.slug}`}
							class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
						>
							{f.name}
						</a>
					{/if}
				{/each}
			</div>
		</div>
	</div>

	<!-- Programs Grid Section -->
	<div class="max-w-6xl mx-auto px-4 sm:px-6 py-10">
		<div class="flex items-center justify-between mb-6">
			<div>
				<h2 class="text-xl font-extrabold text-slate-900" style="font-family: 'Outfit', sans-serif;">
					Matching {field.name} Degrees
				</h2>
				<p class="text-xs text-slate-500 mt-0.5">Found {programs.length} accredited universities</p>
			</div>
		</div>

		{#if programs.length === 0}
			<div class="bg-white rounded-2xl p-10 text-center border border-slate-200">
				<BookOpen size={36} class="mx-auto text-slate-300 mb-3" />
				<h3 class="text-lg font-bold text-slate-800">No programs currently listed in this specific category</h3>
				<p class="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
					Explore all available degrees in {country.name} or browse our full European catalog.
				</p>
				<a href={`/programs/country/${country.slug}`} class="px-5 py-2.5 bg-orange-600 text-white text-xs font-bold rounded-xl shadow-sm">
					View All {country.name} Programs
				</a>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
				{#each programs as p}
					<div class="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between hover:shadow-lg hover:border-orange-400/50 transition-all duration-200">
						<div>
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
		{/if}
	</div>
</div>
