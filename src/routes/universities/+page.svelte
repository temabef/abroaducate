<script lang="ts">
	import { Search, Library, GraduationCap, MapPin, Building2, Filter, Globe, ArrowRight, ShieldCheck, TrendingUp, Users } from 'lucide-svelte';

	let { data } = $props();
	let universities = $derived(data.universities || []);

	let searchQuery = $state('');
	let selectedCountries = $state<string[]>([]);
	let selectedCities = $state<string[]>([]);
	let selectedTypes = $state<string[]>([]);
	let selectedTuitionTypes = $state<string[]>([]);
	let minPrograms = $state(0);
	let displayLimit = $state(12);

	function programCount(uni: any) {
		const nested = uni.programs;
		if (Array.isArray(nested) && nested[0]?.count !== undefined) return Number(nested[0].count || 0);
		if (typeof nested?.count === 'number') return nested.count;
		if (typeof uni.program_count === 'number') return uni.program_count;
		return 0;
	}

	function hasValue(value: any) {
		const text = String(value || '').trim();
		return Boolean(text && text !== '--' && text.toLowerCase() !== 'n/a');
	}

	const countryOptions = $derived(
		[...new Set(universities.map((u: any) => u.country).filter(Boolean))].sort()
	);

	const typeOptions = $derived(
		[...new Set(universities.map((u: any) => u.type).filter(Boolean))].sort()
	);

	const cityOptions = $derived(
		[...new Set(universities.map((u: any) => u.city).filter(Boolean))].sort()
	);

	const tuitionOptions = $derived(
		[...new Set(universities.map((u: any) => u.tuition_type).filter(Boolean))].sort()
	);

	$effect(() => {
		searchQuery; selectedCountries; selectedCities; selectedTypes; selectedTuitionTypes; minPrograms;
		displayLimit = 12;
	});

	const filteredUniversities = $derived(
		universities.filter((uni: any) => {
			const query = searchQuery.toLowerCase();
			const searchMatch =
				!query ||
				uni.name?.toLowerCase().includes(query) ||
				uni.country?.toLowerCase().includes(query) ||
				uni.city?.toLowerCase().includes(query) ||
				uni.type?.toLowerCase().includes(query) ||
				uni.tuition_type?.toLowerCase().includes(query);

			const countryMatch = selectedCountries.length === 0 || selectedCountries.includes(uni.country);
			const cityMatch = selectedCities.length === 0 || selectedCities.includes(uni.city);
			const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(uni.type);
			const tuitionMatch = selectedTuitionTypes.length === 0 || selectedTuitionTypes.includes(uni.tuition_type);
			const programMatch = programCount(uni) >= minPrograms;

			return searchMatch && countryMatch && cityMatch && typeMatch && tuitionMatch && programMatch;
		})
	);

	function clearFilters() {
		searchQuery = '';
		selectedCountries = [];
		selectedCities = [];
		selectedTypes = [];
		selectedTuitionTypes = [];
		minPrograms = 0;
	}

	function loadMore() {
		displayLimit += 12;
	}
</script>

<svelte:head>
	<title>Affordable University Discovery - Abroaducate</title>
	<meta name="description" content="Discover curated, highly affordable universities worldwide." />
</svelte:head>

<div class="min-h-screen bg-slate-50">
	<div class="discovery-header">
		<div class="header-content">
			<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-300 text-sm font-semibold border border-orange-500/20 mb-5">
				<GraduationCap size={16} /> Affordable Pathways Curated
			</div>
			<h1 class="page-title">University Discovery</h1>
			<p class="page-subtitle">Browse institutions behind low-tuition and scholarship-friendly programs.</p>

			<div class="search-bar">
				<Search size={20} class="text-slate-400 ml-4" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search by university, country, city, or type..."
					class="search-input"
				/>
			</div>
		</div>
	</div>

	<div class="max-w-7xl mx-auto px-6 py-8 flex gap-8">
		<aside class="w-64 flex-shrink-0 hidden lg:block space-y-8">
			<div>
				<h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
					<Filter size={18} /> Filters
				</h3>

				<div class="mb-6">
					<h4 class="filter-title">Country</h4>
					<div class="space-y-2">
						{#each countryOptions as country}
							<label class="filter-row">
								<input type="checkbox" value={country} bind:group={selectedCountries} class="filter-check" />
								<span>{country}</span>
							</label>
						{/each}
					</div>
				</div>

				<div class="mb-6">
					<h4 class="filter-title">University Type</h4>
					<div class="space-y-2">
						{#each typeOptions as type}
							<label class="filter-row">
								<input type="checkbox" value={type} bind:group={selectedTypes} class="filter-check" />
								<span>{type}</span>
							</label>
						{/each}
					</div>
				</div>

				<div class="mb-6">
					<h4 class="filter-title">Location</h4>
					<div class="space-y-2 max-h-56 overflow-y-auto pr-1">
						{#each cityOptions as city}
							<label class="filter-row">
								<input type="checkbox" value={city} bind:group={selectedCities} class="filter-check" />
								<span>{city}</span>
							</label>
						{/each}
					</div>
				</div>

				<div class="mb-6">
					<h4 class="filter-title">Tuition Profile</h4>
					<div class="space-y-2">
						{#each tuitionOptions as tuitionType}
							<label class="filter-row">
								<input type="checkbox" value={tuitionType} bind:group={selectedTuitionTypes} class="filter-check" />
								<span>{tuitionType}</span>
							</label>
						{/each}
					</div>
				</div>

				<div class="mb-6">
					<h4 class="filter-title">Program Depth</h4>
					<div class="space-y-3">
						<div class="flex justify-between text-sm font-bold text-slate-700">
							<span>Any</span>
							<span class="text-orange-500">{minPrograms}+ programs</span>
						</div>
						<input type="range" min="0" max="40" step="5" bind:value={minPrograms} class="w-full accent-orange-500" />
					</div>
				</div>
			</div>
		</aside>

		<main class="flex-1">
			<div class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
				<div>
					<p class="text-sm text-slate-500 font-medium tracking-wide uppercase">Explore Universities</p>
					<p class="text-sm text-slate-400">More institutions unlock as the catalog grows.</p>
				</div>
				<button onclick={clearFilters} class="text-sm font-bold text-orange-600 hover:text-orange-700 w-fit">
					Clear filters
				</button>
			</div>

			{#if filteredUniversities.length > 0}
				<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
					{#each filteredUniversities.slice(0, displayLimit) as uni}
						<a href={`/universities/${uni.id}`} class="university-card">
							<div class="h-44 relative bg-slate-100 overflow-hidden">
								<img
									src={uni.hero_image_url || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=900&q=80'}
									onerror={(e) => (e.currentTarget as HTMLImageElement).src='https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=900&q=80'}
									alt={uni.name}
									class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
								/>
								<div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/35 to-transparent"></div>
								<div class="absolute bottom-4 left-4 right-4">
									<div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-orange-500 text-white text-[10px] font-bold mb-2 uppercase tracking-wide">
										{uni.tuition_type || 'Affordable pathway'}
									</div>
									<h3 class="text-xl font-bold text-white leading-tight">{uni.name}</h3>
								</div>
							</div>

							<div class="p-5 flex flex-col h-full">
								<p class="text-slate-600 text-sm line-clamp-2 mb-5">
									{uni.description || `${uni.name} is part of Abroaducate's affordable study catalog.`}
								</p>

								<div class="grid grid-cols-2 gap-3 text-sm mb-5">
									<div>
										<div class="metric-label"><MapPin size={14}/> Location</div>
										<div class="metric-value">{uni.city}, {uni.country}</div>
									</div>
									<div>
										<div class="metric-label"><Building2 size={14}/> Type</div>
										<div class="metric-value">{uni.type || 'Institution'}</div>
									</div>
									<div>
										<div class="metric-label"><Library size={14}/> Catalog Depth</div>
										<div class="metric-value">{programCount(uni) > 0 ? `${programCount(uni)}+ programs` : 'Programs inside'}</div>
									</div>
									<div>
										<div class="metric-label"><ShieldCheck size={14}/> Pathway</div>
										<div class="metric-value">{uni.tuition_type || 'Low tuition'}</div>
									</div>
									{#if hasValue(uni.global_rank)}
										<div>
											<div class="metric-label"><TrendingUp size={14}/> Global Rank</div>
											<div class="metric-value">{uni.global_rank}</div>
										</div>
									{/if}
									{#if hasValue(uni.acceptance_rate)}
										<div>
											<div class="metric-label"><Users size={14}/> Selectivity</div>
											<div class="metric-value">{uni.acceptance_rate}</div>
										</div>
									{/if}
								</div>

								<div class="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
									<span class="text-xs font-bold text-slate-400 uppercase tracking-wide">View pathway</span>
									<span class="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 text-orange-500 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-colors">
										<ArrowRight size={16} />
									</span>
								</div>
							</div>
						</a>
					{/each}
				</div>

				{#if displayLimit < filteredUniversities.length}
					<div class="mt-10 flex justify-center">
						<button onclick={loadMore} class="px-8 py-3 bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-600 shadow-sm text-slate-700 font-bold rounded-full text-sm transition-all active:scale-95">
							Load More Universities
						</button>
					</div>
				{/if}
			{:else}
				<div class="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
					<Library size={44} class="mx-auto text-slate-300 mb-4" />
					<p class="text-slate-500 mb-2">No universities match your current filters.</p>
					<button onclick={clearFilters} class="text-orange-500 font-medium hover:underline">Clear all filters</button>
				</div>
			{/if}
		</main>
	</div>
</div>

<style>
	.discovery-header {
		background: #0f172a;
		padding: 7rem 1.5rem 4rem;
		text-align: center;
		position: relative;
		overflow: hidden;
	}

	.discovery-header::before {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at 50% -20%, rgba(249, 115, 22, 0.15), transparent 60%);
		pointer-events: none;
	}

	.header-content {
		position: relative;
		max-width: 48rem;
		margin: 0 auto;
		z-index: 10;
	}

	.page-title {
		font-family: 'Outfit', sans-serif;
		font-size: 3rem;
		font-weight: 800;
		color: white;
		margin-bottom: 0.75rem;
		letter-spacing: -0.02em;
	}

	.page-subtitle {
		font-size: 1.125rem;
		color: rgba(255, 255, 255, 0.72);
		margin-bottom: 2.5rem;
	}

	.search-bar {
		display: flex;
		align-items: center;
		background: white;
		border-radius: 9999px;
		padding: 0.375rem;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
	}

	.search-input {
		flex: 1;
		border: none;
		outline: none;
		padding: 1rem;
		font-size: 1rem;
		color: #0f172a;
		background: transparent;
	}

	.filter-title {
		font-size: 0.75rem;
		font-weight: 700;
		color: #475569;
		margin-bottom: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.filter-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		font-size: 0.875rem;
		color: #334155;
	}

	.filter-row:hover {
		color: #ea580c;
	}

	.filter-check {
		width: 1rem;
		height: 1rem;
		border-radius: 0.25rem;
		color: #f97316;
		border-color: #cbd5e1;
	}

	.university-card {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 1.25rem;
		transition: all 0.2s ease;
		text-decoration: none;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: relative;
	}

	.university-card:hover {
		border-color: #cbd5e1;
		transform: translateY(-4px);
		box-shadow: 0 12px 24px -8px rgba(15, 23, 42, 0.08);
	}

	.metric-label {
		color: #94a3b8;
		margin-bottom: 0.25rem;
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.metric-value {
		font-weight: 700;
		color: #1e293b;
		line-height: 1.25;
	}

	@media (max-width: 640px) {
		.page-title {
			font-size: 2.25rem;
		}

		.search-input {
			font-size: 0.9375rem;
		}
	}
</style>
