<script lang="ts">
	import { Search, SlidersHorizontal, Filter, GraduationCap, Bookmark, MapPin, Banknote } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getProgramDeadlineLifecycle, getProgramDeadlineSortValue } from '$lib/utils/programDeadlines';

	let { data }: { data: any } = $props();
	let session = $derived(data.session);

	// Server-loaded data
	let programs = $derived(data.programs || []);
	let totalCount = $derived(data.totalCount || 0);
	let currentPage = $derived(data.page || 1);
	let totalPages = $derived(data.totalPages || 1);
	let countryOptions = $derived(data.countryOptions || []);

	// Local filter state — synced with URL on change
	let searchQuery = $state(data.filters?.q || '');
	let showMobileFilters = $state(false);
	let selectedCountries = $state<string[]>(data.filters?.countries || []);
	let selectedLanguages = $state<string[]>(data.filters?.languages || []);
	let selectedDegreeLevels = $state<string[]>(data.filters?.degreeLevels || []);
	let selectedIntakes = $state<string[]>(data.filters?.intakes || []);
	let selectedTiers = $state<string[]>(data.filters?.tiers || []);
	let maxTuition = $state(data.filters?.maxTuition ?? 10000);
	let sortBy = $state(data.filters?.sort || 'recommended');

	// Debounced search input
	let searchTimer: ReturnType<typeof setTimeout>;
	function onSearchInput() {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => applyFilters(1), 300);
	}

	function applyFilters(targetPage = 1) {
		const params = new URLSearchParams();
		if (searchQuery.trim()) params.set('q', searchQuery.trim());
		selectedCountries.forEach((c) => params.append('country', c));
		selectedLanguages.forEach((l) => params.append('lang', l));
		selectedDegreeLevels.forEach((l) => params.append('level', l));
		selectedIntakes.forEach((i) => params.append('intake', i));
		selectedTiers.forEach((t) => params.append('tier', t));
		if (maxTuition < 10000) params.set('maxTuition', String(maxTuition));
		if (sortBy !== 'recommended') params.set('sort', sortBy);
		if (targetPage > 1) params.set('page', String(targetPage));

		const qs = params.toString();
		goto(qs ? `/programs?${qs}` : '/programs', {
			keepFocus: true,
			noScroll: false
		});
	}

	// React to filter changes (excluding searchQuery which has its own debounce)
	let filterSig = $derived(
		JSON.stringify([selectedCountries, selectedLanguages, selectedDegreeLevels, selectedIntakes, selectedTiers, maxTuition, sortBy])
	);
	let lastFilterSig = $state(filterSig);
	$effect(() => {
		if (filterSig !== lastFilterSig) {
			lastFilterSig = filterSig;
			applyFilters(1);
		}
	});

	function deadlineTime(program: any) {
		return getProgramDeadlineSortValue(program);
	}

	function deadlineLabel(program: any) {
		return getProgramDeadlineLifecycle(program).shortLabel;
	}

	function deadlineClass(program: any) {
		const deadline = getProgramDeadlineLifecycle(program);
		if (deadline.isExpired) return 'text-slate-400';
		if (deadline.status === 'not_published') return 'text-slate-500';
		return 'text-slate-700';
	}

	// No client-side sort — server already returns sorted data.
	const sortedPrograms = $derived(programs);

	function handleBookmark(e: MouseEvent, programId: string) {
		e.preventDefault();
		if (session) {
			window.location.href = `/dashboard?programId=${programId}`;
		} else {
			window.location.href = `/auth?next=${encodeURIComponent(`/dashboard?programId=${programId}`)}`;
		}
	}

	function goToPage(p: number) {
		if (p < 1 || p > totalPages) return;
		applyFilters(p);
	}

	function clearAllFilters() {
		selectedCountries = [];
		selectedLanguages = [];
		selectedDegreeLevels = [];
		selectedIntakes = [];
		selectedTiers = [];
		maxTuition = 10000;
		searchQuery = '';
		sortBy = 'recommended';
	}

	function tierMeta(tier?: string) {
		switch (tier) {
			case 'zero_tuition':
				return { label: 'No tuition', class: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
			case 'low_tuition':
				return { label: 'Low tuition', class: 'bg-sky-50 text-sky-700 border-sky-100' };
			case 'scholarship_funded':
				return { label: 'Scholarship-funded', class: 'bg-amber-50 text-amber-700 border-amber-100' };
			case 'paid':
				return { label: 'Paid', class: 'bg-slate-100 text-slate-600 border-slate-200' };
			default:
				return { label: 'Low tuition', class: 'bg-sky-50 text-sky-700 border-sky-100' };
		}
	}
</script>

<svelte:head>
	<title>Find Programs | Abroaducate</title>
</svelte:head>

<div class="discovery-layout">
	<!-- HEADER: Page Title & Search -->
	<div class="discovery-header">
		<div class="header-content">
			<h1 class="page-title">Program Discovery</h1>
			<p class="page-subtitle">Find low-tuition and free programs across top European universities.</p>
			
			<div class="search-bar">
				<Search size={20} class="text-slate-400 ml-4" />
				<input 
					type="text" 
					bind:value={searchQuery}
					oninput={onSearchInput}
					placeholder="Search for programs by title, field, or university..." 
					class="search-input"
				/>
				<button class="mobile-filter-btn" onclick={() => showMobileFilters = !showMobileFilters}>
					<SlidersHorizontal size={20} />
				</button>
			</div>
		</div>
	</div>

	<div class="discovery-body max-w-7xl mx-auto px-6 py-8 flex gap-8">
		
		<!-- SIDEBAR: Filters (Desktop) -->
		<aside class="w-64 flex-shrink-0 hidden lg:block space-y-8">
			<div>
				<h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
					<Filter size={18} /> Filters
				</h3>
				
				<!-- Filter Group -->
				<div class="mb-6">
					<h4 class="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wider">Funding Tier</h4>
					<div class="space-y-2">
						<label class="flex items-center gap-3 cursor-pointer group">
							<input type="checkbox" value="zero_tuition" bind:group={selectedTiers} class="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-500 transition-colors" />
							<span class="text-slate-700 text-sm group-hover:text-orange-600 transition-colors">No tuition</span>
						</label>
						<label class="flex items-center gap-3 cursor-pointer group">
							<input type="checkbox" value="low_tuition" bind:group={selectedTiers} class="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-500 transition-colors" />
							<span class="text-slate-700 text-sm group-hover:text-orange-600 transition-colors">Low tuition (≤ €10k/yr)</span>
						</label>
						<label class="flex items-center gap-3 cursor-pointer group">
							<input type="checkbox" value="scholarship_funded" bind:group={selectedTiers} class="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-500 transition-colors" />
							<span class="text-slate-700 text-sm group-hover:text-orange-600 transition-colors">Scholarship-funded</span>
						</label>
					</div>
					<p class="text-xs text-slate-400 mt-2 leading-snug">Pick the funding paths that work for you. Scholarship-funded programs have at least one matching scholarship in our database that covers tuition.</p>
				</div>

				<!-- Filter Group -->
				<div class="mb-6">
					<h4 class="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wider">Country</h4>
					<div class="space-y-2">
						{#each countryOptions as country}
							<label class="flex items-center gap-3 cursor-pointer group">
								<input type="checkbox" value={country} bind:group={selectedCountries} class="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-500 transition-colors" />
								<span class="text-slate-700 text-sm group-hover:text-orange-600 transition-colors">{country}</span>
							</label>
						{/each}
					</div>
				</div>

				<!-- Filter Group -->
				<div class="mb-6">
					<h4 class="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wider">Language</h4>
					<div class="space-y-2">
						<label class="flex items-center gap-3 cursor-pointer group">
							<input type="checkbox" value="English" bind:group={selectedLanguages} class="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-500 transition-colors" />
							<span class="text-slate-700 text-sm group-hover:text-orange-600 transition-colors">English programs</span>
						</label>
					</div>
				</div>

				<!-- Filter Group -->
				<div class="mb-6">
					<h4 class="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wider">Annual Tuition Budget</h4>
					{#if selectedTiers.length > 0 && selectedTiers.every((t) => t === 'scholarship_funded')}
						<p class="text-xs text-slate-500 leading-snug bg-amber-50 border border-amber-100 rounded-md p-3">
							Tuition cap is ignored while Scholarship-funded is the only selected tier — these programs are meant to be funded by a matching scholarship.
						</p>
					{:else}
						<div class="space-y-4">
							<div class="flex justify-between items-center text-sm font-bold text-slate-700">
								<span>€0</span>
								<span class="text-orange-500 whitespace-nowrap">Max: €{maxTuition.toLocaleString()}</span>
							</div>
							<input 
								type="range" 
								min="0" 
								max="10000" 
								step="500" 
								bind:value={maxTuition} 
								class="w-full h-2 cursor-pointer accent-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 rounded-lg" 
							/>
						</div>
					{/if}
				</div>

				<!-- Filter Group -->
				<div class="mb-6">
					<h4 class="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wider">Intake Semester</h4>
					<div class="space-y-2">
						<label class="flex items-center gap-3">
							<input type="checkbox" value="winter" bind:group={selectedIntakes} class="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-500" />
							<span class="text-slate-700 text-sm">Winter Semester</span>
						</label>
						<label class="flex items-center gap-3">
							<input type="checkbox" value="summer" bind:group={selectedIntakes} class="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-500" />
							<span class="text-slate-700 text-sm">Summer Semester</span>
						</label>
					</div>
				</div>

				<!-- Filter Group -->
				<div class="mb-6">
					<h4 class="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wider">Degree Level</h4>
					<div class="space-y-2">
						<label class="flex items-center gap-3">
							<input type="checkbox" value="bachelor" bind:group={selectedDegreeLevels} class="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-500" />
							<span class="text-slate-700 text-sm">Bachelor's (BSc, BA)</span>
						</label>
						<label class="flex items-center gap-3">
							<input type="checkbox" value="master" bind:group={selectedDegreeLevels} class="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-500" />
							<span class="text-slate-700 text-sm">Master's (MSc, MA)</span>
						</label>
						<label class="flex items-center gap-3">
							<input type="checkbox" value="phd" bind:group={selectedDegreeLevels} class="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-500" />
							<span class="text-slate-700 text-sm">PhD / Doctorate</span>
						</label>
					</div>
				</div>
			</div>
		</aside>

		<!-- MAIN: Program Grid -->
		<main class="flex-1">
			<div class="flex justify-between items-center mb-6">
				<p class="text-sm text-slate-500 font-medium tracking-wide uppercase">Explore Programs</p>
				<select bind:value={sortBy} class="text-sm border-slate-200 rounded-lg text-slate-700 py-1.5 pl-3 pr-8 focus:ring-orange-500 focus:border-orange-500 shadow-sm cursor-pointer">
					<option value="recommended">Sort by: Recommended</option>
					<option value="lowest-fee">Sort by: Lowest Fee</option>
					<option value="deadline">Sort by: Deadline (Soonest)</option>
				</select>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
				{#each sortedPrograms as program}
					<a href={`/programs/${program.id}`} class="program-card">
						<div class="p-5 flex flex-col h-full">
							<div class="flex justify-between items-start mb-4">
								<div class="flex flex-col gap-1.5">
									<div class="uni-badge w-fit">
										<GraduationCap size={16} class="text-slate-400" />
										<span class="text-xs font-semibold text-slate-500 tracking-wide uppercase truncate max-w-[180px]">
											{program.university_name}
										</span>
									</div>
									{#if program.universities?.type}
										<span class="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md w-fit border border-blue-100 uppercase tracking-wide">
											{program.universities.type}
										</span>
									{/if}
									{#if program.tuition_tier}
										{@const tm = tierMeta(program.tuition_tier)}
										<span class="text-[10px] font-bold px-2 py-0.5 rounded-md w-fit border uppercase tracking-wide {tm.class}">
											{tm.label}
										</span>
									{/if}
								</div>
								<button onclick={(e) => handleBookmark(e, program.id)} class="text-slate-300 hover:text-orange-500 transition-colors" aria-label="Start Strategy">
									<Bookmark size={20} />
								</button>
							</div>

							<h3 class="text-xl font-bold text-slate-900 mb-2 leading-tight group-hover:text-orange-600 transition-colors">
								{program.program_name}
							</h3>
							
							<div class="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-4">
								<div class="flex items-center gap-1.5">
									<MapPin size={14} />
									<span>{program.city || 'Germany'}, {program.country}</span>
								</div>
								{#if program.intake}
									<div class="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-md text-xs font-medium text-slate-600">
										{program.intake}
									</div>
								{/if}
							</div>

							<div class="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
								<div>
									<p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Tuition</p>
									<p class="text-sm font-bold text-emerald-600 flex items-center gap-1">
										<Banknote size={14} /> €{program.tuition_per_semester || 0} / sem
									</p>
								</div>
								<div>
									<p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Deadline</p>
									<p class="text-sm font-medium truncate {deadlineClass(program)}">{deadlineLabel(program)}</p>
								</div>
							</div>
						</div>
					</a>
				{/each}
			</div>

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
					<p class="text-sm text-slate-500">
						Showing <strong>{(currentPage - 1) * data.pageSize + 1}</strong>–<strong>{Math.min(currentPage * data.pageSize, totalCount)}</strong> of <strong>{totalCount}</strong> programs
					</p>
					<div class="flex items-center gap-2">
						<button
							onclick={() => goToPage(currentPage - 1)}
							disabled={currentPage === 1}
							class="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
						>
							Prev
						</button>
						{#each Array.from({ length: Math.min(5, totalPages) }, (_, i) => Math.max(1, currentPage - 2) + i).filter((p) => p <= totalPages) as p}
							<button
								onclick={() => goToPage(p)}
								class="w-10 h-10 flex items-center justify-center text-sm font-bold rounded-xl border transition-colors {currentPage === p ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}"
							>
								{p}
							</button>
						{/each}
						<button
							onclick={() => goToPage(currentPage + 1)}
							disabled={currentPage === totalPages}
							class="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
						>
							Next
						</button>
					</div>
				</div>
			{/if}
			{#if sortedPrograms.length === 0}
				<div class="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
					<p class="text-slate-500 mb-2">No programs match your current filters.</p>
					<button onclick={clearAllFilters} class="text-orange-500 font-medium hover:underline">Clear all filters</button>
				</div>
			{/if}
		</main>
	</div>
</div>

<style>
	.discovery-header {
		background: #0f172a;
		padding: 4rem 1.5rem 3rem;
		text-align: center;
		position: relative;
		overflow: hidden;
	}

	.discovery-header::before {
		content: '';
		position: absolute;
		top: 0; left: 0; right: 0; bottom: 0;
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
		color: rgba(255, 255, 255, 0.7);
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
		padding: 1rem 1rem;
		font-size: 1rem;
		color: #0f172a;
		background: transparent;
	}

	.mobile-filter-btn {
		display: none;
		padding: 0.75rem;
		color: #475569;
		background: #f1f5f9;
		border-radius: 50%;
	}

	.program-card {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 1.25rem;
		transition: all 0.2s ease;
		text-decoration: none;
		display: block;
		position: relative;
		overflow: hidden;
	}

	.program-card:hover {
		border-color: #cbd5e1;
		transform: translateY(-4px);
		box-shadow: 0 12px 24px -8px rgba(15, 23, 42, 0.08);
	}

	.uni-badge {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		background: #f8fafc;
		border: 1px solid #f1f5f9;
		padding: 0.25rem 0.625rem;
		border-radius: 9999px;
	}

	@media (max-width: 1024px) {
		.mobile-filter-btn {
			display: block;
			margin-right: 0.5rem;
		}
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
