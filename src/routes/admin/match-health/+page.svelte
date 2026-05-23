<script lang="ts">
	import { onMount } from 'svelte';
	import {
		AlertTriangle,
		CheckCircle2,
		BarChart2,
		RefreshCw,
		Search,
		TrendingDown,
		Award,
		BookOpen,
		Info,
		ChevronLeft,
		ChevronRight
	} from 'lucide-svelte';

	let { data } = $props();
	let { supabase } = $derived(data);

	let isLoading = $state(true);
	let isRefreshing = $state(false);
	let lastRefreshed = $state<Date | null>(null);

	let totalPrograms = $state(0);
	let totalScholarships = $state(0);
	let totalMatches = $state(0);
	let programsWithZeroMatches = $state(0);

	let thinPrograms = $state<any[]>([]);
	let orphanScholarships = $state<any[]>([]);
	let scoreDistribution = $state<Array<{ bucket: string; count: number; pct: number }>>([]);

	let programSearch = $state('');
	let scholarshipSearch = $state('');

	// Pagination
	const PAGE_SIZE = 10;
	let programPage = $state(1);
	let orphanPage = $state(1);

	// Reset page when search changes
	$effect(() => { programSearch; programPage = 1; });
	$effect(() => { scholarshipSearch; orphanPage = 1; });

	const filteredThinPrograms = $derived(
		thinPrograms.filter((p) =>
			!programSearch ||
			p.program_name?.toLowerCase().includes(programSearch.toLowerCase()) ||
			p.university_name?.toLowerCase().includes(programSearch.toLowerCase()) ||
			p.country?.toLowerCase().includes(programSearch.toLowerCase())
		)
	);

	const programPageCount = $derived(Math.max(1, Math.ceil(filteredThinPrograms.length / PAGE_SIZE)));
	const pagedThinPrograms = $derived(
		filteredThinPrograms.slice((programPage - 1) * PAGE_SIZE, programPage * PAGE_SIZE)
	);

	const filteredOrphanScholarships = $derived(
		orphanScholarships.filter((s) =>
			!scholarshipSearch ||
			s.title?.toLowerCase().includes(scholarshipSearch.toLowerCase()) ||
			s.provider?.toLowerCase().includes(scholarshipSearch.toLowerCase())
		)
	);

	const orphanPageCount = $derived(Math.max(1, Math.ceil(filteredOrphanScholarships.length / PAGE_SIZE)));
	const pagedOrphanScholarships = $derived(
		filteredOrphanScholarships.slice((orphanPage - 1) * PAGE_SIZE, orphanPage * PAGE_SIZE)
	);

	const health = $derived.by(() => {
		if (totalPrograms === 0) return { score: 0, label: 'No data', color: 'text-gray-400' };
		const coverage = ((totalPrograms - programsWithZeroMatches) / totalPrograms) * 100;
		const score = Math.round(coverage);
		if (coverage >= 95) return { score, label: 'Excellent', color: 'text-emerald-600' };
		if (coverage >= 80) return { score, label: 'Good', color: 'text-blue-600' };
		if (coverage >= 60) return { score, label: 'Fair', color: 'text-amber-600' };
		return { score, label: 'Needs work', color: 'text-red-600' };
	});

	onMount(async () => {
		await loadAll();
	});

	async function loadAll() {
		isLoading = true;
		try {
			await Promise.all([loadSummary(), loadThinPrograms(), loadOrphanScholarships(), loadScoreDistribution()]);
			lastRefreshed = new Date();
		} catch (e) {
			console.error('Match-health load error:', e);
		} finally {
			isLoading = false;
		}
	}

	async function loadSummary() {
		const [{ count: pc }, { count: sc }, { count: mc }] = await Promise.all([
			supabase.from('programs').select('*', { count: 'exact', head: true }),
			supabase.from('scholarships').select('*', { count: 'exact', head: true }).eq('is_active', true),
			supabase.from('program_scholarship_matches').select('*', { count: 'exact', head: true })
		]);
		totalPrograms = pc ?? 0;
		totalScholarships = sc ?? 0;
		totalMatches = mc ?? 0;
	}

	async function loadThinPrograms() {
		const { data: matchRows } = await supabase
			.from('program_scholarship_matches')
			.select('program_id');

		const countMap = new Map<string, number>();
		for (const row of matchRows ?? []) {
			countMap.set(row.program_id, (countMap.get(row.program_id) ?? 0) + 1);
		}

		const { data: programs } = await supabase
			.from('programs')
			.select('id, program_name, university_name, country, degree_level, tuition_tier')
			.order('program_name', { ascending: true });

		if (!programs) return;

		const withCounts = programs.map((p: any) => ({
			...p,
			match_count: countMap.get(p.id) ?? 0
		}));

		// Sort ascending by match count — programs with fewest matches first
		thinPrograms = withCounts.sort((a: any, b: any) => a.match_count - b.match_count);
		programsWithZeroMatches = withCounts.filter((p: any) => p.match_count === 0).length;
	}

	async function loadOrphanScholarships() {
		const { data: allScholarships } = await supabase
			.from('scholarships')
			.select('id, title, provider, location, deadline, funding_category')
			.eq('is_active', true)
			.order('title', { ascending: true });

		if (!allScholarships) return;

		const { data: matchedIds } = await supabase
			.from('program_scholarship_matches')
			.select('scholarship_id');

		const matchedSet = new Set((matchedIds ?? []).map((m: any) => m.scholarship_id));
		orphanScholarships = allScholarships.filter((s: any) => !matchedSet.has(s.id));
	}

	async function loadScoreDistribution() {
		const { data } = await supabase.from('program_scholarship_matches').select('score');
		if (!data || data.length === 0) return;

		let b90 = 0, b75 = 0, b60 = 0, b45 = 0, bLow = 0;
		for (const row of data) {
			const s = row.score ?? 0;
			if (s >= 90) b90++;
			else if (s >= 75) b75++;
			else if (s >= 60) b60++;
			else if (s >= 45) b45++;
			else bLow++;
		}

		const total = data.length;
		const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
		scoreDistribution = [
			{ bucket: '90-100', count: b90, pct: pct(b90) },
			{ bucket: '75-89', count: b75, pct: pct(b75) },
			{ bucket: '60-74', count: b60, pct: pct(b60) },
			{ bucket: '45-59', count: b45, pct: pct(b45) },
			{ bucket: 'Under 45', count: bLow, pct: pct(bLow) }
		];
	}

	async function triggerRematch() {
		isRefreshing = true;
		try {
			const res = await fetch('/api/cron/match-scholarships', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});
			const result = await res.json();
			if (result.ok || result.matched !== undefined) {
				await loadAll();
			}
		} catch (e) {
			console.error('Rematch error:', e);
		} finally {
			isRefreshing = false;
		}
	}

	function tierBadge(tier: string | null) {
		if (tier === 'zero_tuition') return { label: 'Zero Tuition', cls: 'badge-green' };
		if (tier === 'low_tuition') return { label: 'Low Tuition', cls: 'badge-blue' };
		if (tier === 'scholarship_funded') return { label: 'Scholarship Funded', cls: 'badge-purple' };
		return { label: 'Unknown', cls: 'badge-gray' };
	}

	function formatDate(d: string | null) {
		if (!d) return '-';
		return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function barColor(bucket: string) {
		if (bucket === '90-100') return 'bar-green';
		if (bucket === '75-89') return 'bar-blue';
		if (bucket === '60-74') return 'bar-amber';
		return 'bar-red';
	}
</script>

<svelte:head>
	<title>Match Health - Admin</title>
</svelte:head>

<div class="mh-page">
	<!-- Header -->
	<div class="mh-header">
		<div>
			<h1 class="mh-title">Scholarship Match Health</h1>
			<p class="mh-subtitle">
				Coverage, orphan scholarships, and score distribution across all programs.
				{#if lastRefreshed}
					<span class="mh-refreshed">Last refreshed {lastRefreshed.toLocaleTimeString()}</span>
				{/if}
			</p>
		</div>
		<button class="mh-refresh-btn" onclick={triggerRematch} disabled={isRefreshing}>
			<RefreshCw size={16} />
			{isRefreshing ? 'Running rematch...' : 'Run rematch now'}
		</button>
	</div>

	{#if isLoading}
		<div class="mh-loading">
			<div class="mh-spinner"></div>
			<p>Loading match data...</p>
		</div>
	{:else}
		<!-- Summary Cards -->
		<div class="mh-stats-grid">
			<div class="mh-stat-card">
				<div class="mh-stat-icon mh-icon-blue"><BookOpen size={20} /></div>
				<div>
					<div class="mh-stat-value">{totalPrograms.toLocaleString()}</div>
					<div class="mh-stat-label">Total programs</div>
				</div>
			</div>

			<div class="mh-stat-card">
				<div class="mh-stat-icon mh-icon-purple"><Award size={20} /></div>
				<div>
					<div class="mh-stat-value">{totalScholarships.toLocaleString()}</div>
					<div class="mh-stat-label">Active scholarships</div>
				</div>
			</div>

			<div class="mh-stat-card">
				<div class="mh-stat-icon mh-icon-green"><BarChart2 size={20} /></div>
				<div>
					<div class="mh-stat-value">{totalMatches.toLocaleString()}</div>
					<div class="mh-stat-label">Total match rows</div>
					<div class="mh-stat-hint">Program&thinsp;&times;&thinsp;scholarship pairings stored in DB</div>
				</div>
			</div>

			<div class="mh-stat-card">
				<div class="mh-stat-icon {programsWithZeroMatches > 0 ? 'mh-icon-amber' : 'mh-icon-green'}">
					{#if programsWithZeroMatches > 0}
						<AlertTriangle size={20} />
					{:else}
						<CheckCircle2 size={20} />
					{/if}
				</div>
				<div>
					<div class="mh-stat-value {programsWithZeroMatches > 0 ? 'text-amber-600' : 'text-emerald-600'}">
						{programsWithZeroMatches}
					</div>
					<div class="mh-stat-label">Programs with 0 matches</div>
					<div class="mh-stat-hint">Students see no scholarships on these programs</div>
				</div>
			</div>

			<div class="mh-stat-card">
				<div class="mh-stat-icon {orphanScholarships.length > 0 ? 'mh-icon-amber' : 'mh-icon-green'}">
					{#if orphanScholarships.length > 0}
						<TrendingDown size={20} />
					{:else}
						<CheckCircle2 size={20} />
					{/if}
				</div>
				<div>
					<div class="mh-stat-value {orphanScholarships.length > 0 ? 'text-amber-600' : 'text-emerald-600'}">
						{orphanScholarships.length}
					</div>
					<div class="mh-stat-label">Scholarships matching 0 programs</div>
					<div class="mh-stat-hint">Too narrow to score &ge;25 against any program — not broken</div>
				</div>
			</div>

			<div class="mh-stat-card">
				<div class="mh-stat-icon mh-icon-navy"><CheckCircle2 size={20} /></div>
				<div>
					<div class="mh-stat-value {health.color}">{health.score}%</div>
					<div class="mh-stat-label">
						Coverage &mdash; <span class="{health.color} font-semibold">{health.label}</span>
					</div>
					<div class="mh-stat-hint">% of programs that have at least 1 match</div>
				</div>
			</div>
		</div>

		<!-- Explainer -->
		<div class="mh-explainer">
			<Info size={16} class="mh-explainer-icon" />
			<div class="mh-explainer-text">
				<strong>How matching works:</strong>
				Each program is scored against every active scholarship (country, field, level, deadline, nationality, tuition coverage).
				Only pairings scoring &ge;25 are saved — up to 5 per program.
				<strong>{totalMatches.toLocaleString()} rows</strong> = {totalPrograms.toLocaleString()} programs &times; ~5 scholarships each.
				Scholarships that never score &ge;25 against any program appear in the "0 programs" list — they are too narrow or too specific for your current catalog.
				Run <code>node scripts/match-scholarships-to-programs.js --apply --rollover-scholarships --persist-rollover</code> to refresh all matches.
			</div>
		</div>

		<!-- Score Distribution -->
		<div class="mh-card">
			<h2 class="mh-card-title">
				<BarChart2 size={18} />
				Score distribution ({totalMatches.toLocaleString()} match rows)
			</h2>
			<div class="mh-dist-grid">
				{#each scoreDistribution as row}
					<div class="mh-dist-row">
						<div class="mh-dist-label">{row.bucket}</div>
						<div class="mh-dist-bar-wrap">
							<div class="mh-dist-bar {barColor(row.bucket)}" style="width: {row.pct}%"></div>
						</div>
						<div class="mh-dist-count">
							{row.count.toLocaleString()} <span class="mh-dist-pct">({row.pct}%)</span>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Thin Programs Table -->
		<div class="mh-card">
			<div class="mh-card-header">
				<div>
					<h2 class="mh-card-title" style="margin-bottom:0">
						<TrendingDown size={18} />
						Programs sorted by match count
					</h2>
					<p class="mh-card-sub">
						{thinPrograms.length} programs total &mdash; {programsWithZeroMatches} with 0 matches.
						Red = no scholarships shown to students. Amber = only 1&ndash;2 matches.
					</p>
				</div>
				<div class="mh-search-wrap">
					<Search size={14} />
					<input
						type="text"
						placeholder="Search programs..."
						bind:value={programSearch}
						class="mh-search"
					/>
				</div>
			</div>
			<div class="mh-table-wrap">
				<table class="mh-table">
					<thead>
						<tr>
							<th>#</th>
							<th>Program</th>
							<th>University</th>
							<th>Country</th>
							<th>Tier</th>
							<th>Matches</th>
							<th>Action</th>
						</tr>
					</thead>
					<tbody>
						{#each pagedThinPrograms as prog, i}
							{@const badge = tierBadge(prog.tuition_tier)}
							{@const rowNum = (programPage - 1) * PAGE_SIZE + i + 1}
							<tr class="{prog.match_count === 0 ? 'row-danger' : prog.match_count <= 2 ? 'row-warn' : ''}">
								<td class="td-secondary">{rowNum}</td>
								<td class="td-name">{prog.program_name}</td>
								<td class="td-secondary">{prog.university_name}</td>
								<td class="td-secondary">{prog.country}</td>
								<td><span class="badge {badge.cls}">{badge.label}</span></td>
								<td>
									<span class="match-count {prog.match_count === 0 ? 'count-zero' : prog.match_count <= 2 ? 'count-low' : 'count-ok'}">
										{prog.match_count}
									</span>
								</td>
								<td><a href="/admin/programs/{prog.id}" class="mh-link">Edit</a></td>
							</tr>
						{:else}
							<tr><td colspan="7" class="td-empty">No programs found.</td></tr>
						{/each}
					</tbody>
				</table>
			</div>
			<!-- Pagination -->
			<div class="mh-pagination">
				<span class="mh-page-info">
					Showing {Math.min((programPage - 1) * PAGE_SIZE + 1, filteredThinPrograms.length)}–{Math.min(programPage * PAGE_SIZE, filteredThinPrograms.length)} of {filteredThinPrograms.length}
				</span>
				<div class="mh-page-btns">
					<button class="mh-page-btn" onclick={() => programPage--} disabled={programPage <= 1}>
						<ChevronLeft size={16} />
					</button>
					{#each Array.from({ length: programPageCount }, (_, i) => i + 1).filter(p => Math.abs(p - programPage) <= 2 || p === 1 || p === programPageCount) as p, idx}
						{@const pages = Array.from({ length: programPageCount }, (_, i) => i + 1).filter(pg => Math.abs(pg - programPage) <= 2 || pg === 1 || pg === programPageCount)}
						{#if idx > 0 && p - pages[idx - 1] > 1}
							<span class="mh-page-ellipsis">…</span>
						{/if}
						<button
							class="mh-page-btn {p === programPage ? 'mh-page-btn-active' : ''}"
							onclick={() => programPage = p}
						>{p}</button>
					{/each}
					<button class="mh-page-btn" onclick={() => programPage++} disabled={programPage >= programPageCount}>
						<ChevronRight size={16} />
					</button>
				</div>
			</div>
		</div>

		<!-- Orphan Scholarships Table -->
		<div class="mh-card">
			<div class="mh-card-header">
				<div>
					<h2 class="mh-card-title" style="margin-bottom:0">
						<AlertTriangle size={18} />
						Scholarships matching 0 programs ({orphanScholarships.length})
					</h2>
					<p class="mh-card-sub">
						These scholarships are active but scored below 25 against every program in your catalog.
						They are not broken &mdash; they are just too narrow (e.g. institution-specific, very restricted nationality, or field mismatch).
						Consider broadening their criteria or adding more programs in their target country/field.
					</p>
				</div>
				<div class="mh-search-wrap">
					<Search size={14} />
					<input
						type="text"
						placeholder="Search scholarships..."
						bind:value={scholarshipSearch}
						class="mh-search"
					/>
				</div>
			</div>

			{#if orphanScholarships.length === 0}
				<div class="mh-empty-state">
					<CheckCircle2 size={32} class="text-emerald-500" />
					<p>All active scholarships match at least one program.</p>
				</div>
			{:else}
				<div class="mh-table-wrap">
					<table class="mh-table">
						<thead>
							<tr>
								<th>#</th>
								<th>Scholarship</th>
								<th>Provider</th>
								<th>Location</th>
								<th>Deadline</th>
								<th>Category</th>
								<th>Action</th>
							</tr>
						</thead>
						<tbody>
							{#each pagedOrphanScholarships as s, i}
								{@const rowNum = (orphanPage - 1) * PAGE_SIZE + i + 1}
								<tr>
									<td class="td-secondary">{rowNum}</td>
									<td class="td-name">{s.title}</td>
									<td class="td-secondary">{s.provider || '-'}</td>
									<td class="td-secondary">{s.location || '-'}</td>
									<td class="td-secondary">{formatDate(s.deadline)}</td>
									<td>
										{#if s.funding_category}
											<span class="badge badge-gray">{s.funding_category}</span>
										{:else}
											<span class="td-secondary">-</span>
										{/if}
									</td>
									<td><a href="/admin/scholarships/{s.id}" class="mh-link">Edit</a></td>
								</tr>
							{:else}
								<tr><td colspan="7" class="td-empty">No results.</td></tr>
							{/each}
						</tbody>
					</table>
				</div>
				<!-- Pagination -->
				<div class="mh-pagination">
					<span class="mh-page-info">
						Showing {Math.min((orphanPage - 1) * PAGE_SIZE + 1, filteredOrphanScholarships.length)}–{Math.min(orphanPage * PAGE_SIZE, filteredOrphanScholarships.length)} of {filteredOrphanScholarships.length}
					</span>
					<div class="mh-page-btns">
						<button class="mh-page-btn" onclick={() => orphanPage--} disabled={orphanPage <= 1}>
							<ChevronLeft size={16} />
						</button>
						{#each Array.from({ length: orphanPageCount }, (_, i) => i + 1).filter(p => Math.abs(p - orphanPage) <= 2 || p === 1 || p === orphanPageCount) as p, idx}
							{@const pages = Array.from({ length: orphanPageCount }, (_, i) => i + 1).filter(pg => Math.abs(pg - orphanPage) <= 2 || pg === 1 || pg === orphanPageCount)}
							{#if idx > 0 && p - pages[idx - 1] > 1}
								<span class="mh-page-ellipsis">…</span>
							{/if}
							<button
								class="mh-page-btn {p === orphanPage ? 'mh-page-btn-active' : ''}"
								onclick={() => orphanPage = p}
							>{p}</button>
						{/each}
						<button class="mh-page-btn" onclick={() => orphanPage++} disabled={orphanPage >= orphanPageCount}>
							<ChevronRight size={16} />
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.mh-page { display: flex; flex-direction: column; gap: 1.5rem; }

	.mh-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
	.mh-title { font-size: 1.5rem; font-weight: 700; color: #111827; }
	.mh-subtitle { font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem; }
	.mh-refreshed { margin-left: 0.5rem; color: #9ca3af; }

	.mh-refresh-btn {
		display: flex; align-items: center; gap: 0.5rem;
		padding: 0.625rem 1.25rem; background: #1e293b; color: white;
		border: none; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600;
		cursor: pointer; transition: background 0.2s; white-space: nowrap;
	}
	.mh-refresh-btn:hover:not(:disabled) { background: #0f172a; }
	.mh-refresh-btn:disabled { opacity: 0.6; cursor: not-allowed; }

	.mh-loading { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem; color: #6b7280; }
	.mh-spinner {
		width: 2rem; height: 2rem;
		border: 3px solid #e5e7eb; border-top-color: #f97316;
		border-radius: 50%; animation: mh-spin 0.8s linear infinite;
	}
	@keyframes mh-spin { to { transform: rotate(360deg); } }

	.mh-stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
	.mh-stat-card {
		background: white; border: 1px solid #e5e7eb; border-radius: 0.75rem;
		padding: 1.25rem; display: flex; align-items: center; gap: 1rem;
		box-shadow: 0 1px 3px rgba(0,0,0,0.06);
	}
	.mh-stat-icon {
		width: 2.5rem; height: 2.5rem; border-radius: 0.625rem;
		display: flex; align-items: center; justify-content: center; flex-shrink: 0;
	}
	.mh-icon-blue   { background: #dbeafe; color: #2563eb; }
	.mh-icon-purple { background: #ede9fe; color: #7c3aed; }
	.mh-icon-green  { background: #d1fae5; color: #059669; }
	.mh-icon-amber  { background: #fef3c7; color: #d97706; }
	.mh-icon-red    { background: #fee2e2; color: #dc2626; }
	.mh-icon-navy   { background: #e0e7ff; color: #1e293b; }
	.mh-stat-value { font-size: 1.5rem; font-weight: 700; color: #111827; line-height: 1; }
	.mh-stat-label { font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem; }
	.mh-stat-hint { font-size: 0.6875rem; color: #9ca3af; margin-top: 0.125rem; line-height: 1.4; max-width: 160px; }

	/* Explainer banner */
	.mh-explainer {
		display: flex; gap: 0.75rem; align-items: flex-start;
		background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 0.75rem;
		padding: 1rem 1.25rem; font-size: 0.875rem; color: #0c4a6e; line-height: 1.6;
	}
	.mh-explainer-icon { color: #0284c7; flex-shrink: 0; margin-top: 2px; }
	.mh-explainer-text code {
		background: #e0f2fe; padding: 0.1rem 0.4rem; border-radius: 0.25rem;
		font-size: 0.8rem; font-family: monospace;
	}

	.mh-card {
		background: white; border: 1px solid #e5e7eb; border-radius: 0.75rem;
		padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
	}
	.mh-card-header {
		display: flex; align-items: flex-start; justify-content: space-between;
		gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap;
	}
	.mh-card-title {
		display: flex; align-items: center; gap: 0.5rem;
		font-size: 1rem; font-weight: 600; color: #111827; margin-bottom: 1.25rem;
	}
	.mh-card-header .mh-card-title { margin-bottom: 0; }
	.mh-card-sub { font-size: 0.8125rem; color: #6b7280; margin-top: 0.375rem; max-width: 560px; line-height: 1.5; }

	.mh-search-wrap {
		display: flex; align-items: center; gap: 0.5rem;
		background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem;
		padding: 0.375rem 0.75rem; color: #9ca3af;
	}
	.mh-search { border: none; outline: none; background: transparent; font-size: 0.875rem; color: #374151; width: 180px; }

	.mh-dist-grid { display: flex; flex-direction: column; gap: 0.75rem; }
	.mh-dist-row { display: grid; grid-template-columns: 90px 1fr 120px; align-items: center; gap: 1rem; }
	.mh-dist-label { font-size: 0.875rem; font-weight: 600; color: #374151; }
	.mh-dist-bar-wrap { background: #f3f4f6; border-radius: 9999px; height: 10px; overflow: hidden; }
	.mh-dist-bar { height: 100%; border-radius: 9999px; transition: width 0.6s ease; min-width: 2px; }
	.bar-green { background: #10b981; }
	.bar-blue  { background: #3b82f6; }
	.bar-amber { background: #f59e0b; }
	.bar-red   { background: #ef4444; }
	.mh-dist-count { font-size: 0.875rem; font-weight: 600; color: #374151; text-align: right; }
	.mh-dist-pct { font-weight: 400; color: #9ca3af; }

	.mh-table-wrap { overflow-x: auto; border-radius: 0.5rem; border: 1px solid #e5e7eb; }
	.mh-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
	.mh-table thead tr { background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
	.mh-table th { padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
	.mh-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
	.mh-table tbody tr:last-child td { border-bottom: none; }
	.mh-table tbody tr:hover { background: #fafafa; }
	.row-danger { background: #fff5f5 !important; }
	.row-warn   { background: #fffbeb !important; }
	.td-name { font-weight: 500; color: #111827; max-width: 260px; }
	.td-secondary { color: #6b7280; }
	.td-empty { text-align: center; color: #9ca3af; padding: 2rem; }

	.badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 600; white-space: nowrap; }
	.badge-green  { background: #d1fae5; color: #065f46; }
	.badge-blue   { background: #dbeafe; color: #1e40af; }
	.badge-purple { background: #ede9fe; color: #5b21b6; }
	.badge-gray   { background: #f3f4f6; color: #374151; }

	.match-count { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 700; }
	.count-zero { background: #fee2e2; color: #dc2626; }
	.count-low  { background: #fef3c7; color: #92400e; }
	.count-ok   { background: #d1fae5; color: #065f46; }

	.mh-link { font-size: 0.8rem; font-weight: 600; color: #f97316; text-decoration: none; }
	.mh-link:hover { text-decoration: underline; }

	.mh-empty-state { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 3rem; color: #6b7280; font-size: 0.9rem; }

	/* Pagination */
	.mh-pagination {
		display: flex; align-items: center; justify-content: space-between;
		padding: 0.875rem 1rem 0; border-top: 1px solid #f3f4f6; margin-top: 0.5rem;
		flex-wrap: wrap; gap: 0.75rem;
	}
	.mh-page-info { font-size: 0.8125rem; color: #6b7280; }
	.mh-page-btns { display: flex; align-items: center; gap: 0.25rem; }
	.mh-page-btn {
		display: flex; align-items: center; justify-content: center;
		min-width: 2rem; height: 2rem; padding: 0 0.5rem;
		border: 1px solid #e5e7eb; border-radius: 0.375rem;
		background: white; font-size: 0.8125rem; font-weight: 500; color: #374151;
		cursor: pointer; transition: all 0.15s;
	}
	.mh-page-btn:hover:not(:disabled) { background: #f9fafb; border-color: #d1d5db; }
	.mh-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
	.mh-page-btn-active { background: #0f172a !important; color: white !important; border-color: #0f172a !important; }
	.mh-page-ellipsis { font-size: 0.8125rem; color: #9ca3af; padding: 0 0.25rem; }
</style>
