<script lang="ts">
	import { 
		GraduationCap, MapPin, Banknote, Calendar, 
		ExternalLink, ChevronRight, CheckCircle2, ShieldCheck, 
		Building2, ArrowRight, Sparkles
	} from 'lucide-svelte';
	import SEO from '$lib/components/SEO.svelte';

	let { data } = $props();
	const category = $derived(data.category);
	const programs = $derived(data.programs || []);
	const totalCount = $derived(data.totalCount || 0);

	// JSON-LD Schema
	const breadcrumbJsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.abroaducate.com/' },
			{ '@type': 'ListItem', position: 2, name: 'Degree Programs', item: 'https://www.abroaducate.com/programs' },
			{ '@type': 'ListItem', position: 3, name: category.heading, item: `https://www.abroaducate.com/programs/category/${category.slug}` }
		]
	});

	const itemListJsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		name: category.title,
		description: category.metaDescription,
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
	title={category.title}
	description={category.metaDescription}
	canonical={`https://www.abroaducate.com/programs/category/${category.slug}`}
	type="website"
/>

<svelte:head>
	{@html `<script type="application/ld+json">${JSON.stringify(breadcrumbJsonLd)}</script>`}
	{@html `<script type="application/ld+json">${JSON.stringify(itemListJsonLd)}</script>`}
</svelte:head>

<div class="category-hub-page min-h-screen bg-slate-50">
	<!-- Hero Section -->
	<div class="relative bg-white border-b border-slate-200/80 pt-8 pb-10 px-4 sm:px-6 overflow-hidden">
		<!-- Background Glows -->
		<div class="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
		<div class="absolute bottom-0 left-1/4 w-72 h-72 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>

		<div class="max-w-6xl mx-auto">
			<nav class="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-5" aria-label="Breadcrumb">
				<a href="/" class="hover:text-slate-900 transition-colors">Home</a>
				<ChevronRight size={12} class="text-slate-400" />
				<a href="/programs" class="hover:text-slate-900 transition-colors">Programs</a>
				<ChevronRight size={12} class="text-slate-400" />
				<span class="text-orange-600 font-bold">{category.heading}</span>
			</nav>

			<div class="max-w-3xl">
				<div class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200/80 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wide mb-3.5">
					<Sparkles size={13} />
					<span>Featured European Catalog &bull; {totalCount} Programs</span>
				</div>
				<h1 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3" style="font-family: 'Outfit', sans-serif; text-wrap: balance;">
					{category.heading}
				</h1>
				<p class="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl" style="text-wrap: balance;">
					{category.description}
				</p>
			</div>
		</div>
	</div>

	<!-- Programs Grid -->
	<div class="max-w-6xl mx-auto px-4 sm:px-6 py-10">
		<div class="flex items-center justify-between mb-6">
			<div>
				<h2 class="text-xl font-extrabold text-slate-900" style="font-family: 'Outfit', sans-serif;">
					Curated Degrees
				</h2>
				<p class="text-xs text-slate-500 mt-0.5">Showing {programs.length} of {totalCount} verified degrees</p>
			</div>
			<a href="/programs" class="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1">
				<span>Explore Full Catalog</span>
				<ChevronRight size={14} />
			</a>
		</div>

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
	</div>
</div>
