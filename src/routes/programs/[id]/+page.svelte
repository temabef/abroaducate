<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import AuthenticationFlow from '$lib/components/AuthenticationFlow.svelte';
	import { getProgramDeadlineLifecycle } from '$lib/utils/programDeadlines';
	import { decodeHtmlEntities, formatCurrencyAmount } from '$lib/utils/htmlEntities';
	import { 
		Banknote, CalendarDays, GraduationCap, MapPin, 
		Clock, Languages, CheckCircle2, ChevronLeft, ArrowRight
	} from 'lucide-svelte';
	import FundingGuidance from '$lib/components/FundingGuidance.svelte';
	import WorkAndStay from '$lib/components/WorkAndStay.svelte';

	let { data } = $props();
	let session = $derived(data.session);
	let supabase = $derived(data.supabase);
	let program = $derived(data.program);
	let university = $derived(data.university);
	let scholarships = $derived(data.scholarships || []);
	let showAuthModal = $state(false);

	function formatDegree(level: string) {
		const normalized = (level || 'master').toLowerCase();
		if (normalized === 'phd') return 'PhD / Doctorate';
		if (normalized === 'bachelor') return "Bachelor's";
		return "Master's";
	}

	function formatEnglishRequirement(value: any) {
		if (!value || value === false) return 'English';
		if (value === true) return 'English proficiency required';
		return `English (${value})`;
	}

	function formatMoney(value: any, currency = 'EUR') {
		const amount = Number(value || 0);
		const prefix = currency === 'EUR' ? '€' : `${currency} `;
		return `${prefix}${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
	}

	function normalizeTimelineSteps(value: any) {
		if (Array.isArray(value)) return value;
		if (typeof value === 'string') {
			try {
				const parsed = JSON.parse(value);
				return Array.isArray(parsed) ? parsed : [];
			} catch {
				return [];
			}
		}
		return [];
	}

	const viewModel = $derived({
		id: program.id,
		title: program.program_name,
		university: program.university_name,
		universityHref: university?.id ? `/universities/${university.id}` : '/universities',
		location: `${program.city || 'Germany'}, ${program.country}`,
		degreeType: formatDegree(program.degree_level),
		tuition: `${formatMoney(program.tuition_per_semester, program.tuition_currency || 'EUR')}/semester`,
		adminFee: `${formatMoney(program.semester_fee, program.tuition_currency || 'EUR')}/semester`,
		currency: program.tuition_currency || 'EUR',
		durationMonths: program.program_duration_months || 24,
		language: formatEnglishRequirement(program.rubric_criteria?.english_level_required),
		nextIntake: Array.isArray(program.intakes) && program.intakes.length ? program.intakes.join(' / ') + ' Semester' : 'Winter Semester',
		deadline: getProgramDeadlineLifecycle(program),
		description: program.full_description_text || 'See official site for description.',
		applicationSteps: normalizeTimelineSteps(program.application_steps).length > 0
			? normalizeTimelineSteps(program.application_steps)
			: [
				{ step_number: 1, title: 'Verify Eligibility', description: 'Ensure your GPA and language scores meet the requirements set for this program.' },
				{ step_number: 2, title: 'Prepare Documents', description: `Draft your Academic CV and Motivation Letter tailored to ${program.university_name}.` },
				{ step_number: 3, title: 'Submit Application', description: 'Apply through the official portal before the deadline.' }
			],
		requirements: [
			`Bachelor's degree in a related field`,
			program.rubric_criteria?.english_level_required ? formatEnglishRequirement(program.rubric_criteria.english_level_required) : 'English language proficiency',
			'Competitive academic record (GPA)'
		]
	});

	function handleAction() {
		if (session) {
			goto(`/dashboard?programId=${viewModel.id}`);
		} else {
			showAuthModal = true;
		}
	}

	// ── Match badge helpers ───────────────────────────────────────────────
	// score is an internal 0-120-ish number. Express it as a "fit" percentage
	// that's easier for students to read. 100+ = 95%, 85 = 85%, 60 = 65%, etc.
	function matchPercent(score: number | null | undefined): number | null {
		if (score == null) return null;
		if (score >= 100) return 95;
		if (score >= 85) return 90;
		if (score >= 75) return 85;
		if (score >= 65) return 75;
		if (score >= 50) return 65;
		return 50;
	}

	function coversLabel(covers: string[] | null | undefined): string | null {
		if (!Array.isArray(covers) || covers.length === 0) return null;
		const set = new Set(covers.map((c) => c.toLowerCase()));
		const has = (k: string) => set.has(k);
		// Prefer the most comprehensive label
		if (has('tuition') && has('living') && has('travel')) return 'Covers tuition, living & travel';
		if (has('tuition') && has('living')) return 'Covers tuition + living';
		if (has('tuition') && has('travel')) return 'Covers tuition + travel';
		if (has('tuition')) return 'Covers tuition';
		if (has('living') && has('travel')) return 'Covers living + travel';
		if (has('living')) return 'Covers living costs';
		if (has('travel')) return 'Covers travel';
		return null;
	}

	function ruleLabels(rules: string[] | null | undefined): string[] {
		if (!Array.isArray(rules)) return [];
		const map: Record<string, string> = {
			country: 'country',
			broad_region: 'region',
			institution: 'same university',
			level: 'degree level',
			field: 'field',
			nationality_open: 'open to your nationality',
			deadline_viable: 'deadline fits'
		};
		return rules
			.map((r) => map[r])
			.filter((x): x is string => Boolean(x))
			.slice(0, 3);
	}
</script>

<svelte:head>
	<title>{viewModel.title} | {viewModel.university} | Abroaducate</title>
</svelte:head>

<div class="bg-slate-50 min-h-screen pb-16">
	<!-- Top Navigation Bar -->
	<div class="bg-white border-b border-slate-200 pt-24 pb-4 px-6 md:px-12 sticky top-0 z-40 shadow-sm">
		<div class="max-w-6xl mx-auto flex items-center justify-between">
			<a href="/programs" class="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
				<ChevronLeft size={16} /> Back to Programs
			</a>
			<!-- Floating CTA for scrolling -->
			<button onclick={handleAction} class="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-full text-sm font-bold shadow-md transition-all md:hidden">
				Check Fit
			</button>
		</div>
	</div>

	<!-- Main Detail Content -->
	<div class="max-w-6xl mx-auto px-6 md:px-12 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
		
		<!-- Left / Main Stream -->
		<div class="lg:col-span-2 space-y-10">
			<!-- Header Info -->
			<div>
				<div class="inline-flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600 uppercase tracking-wider mb-4 border border-slate-200">
					<GraduationCap size={14} /> {viewModel.degreeType}
				</div>
				<h1 class="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight" style="font-family: 'Outfit', sans-serif;">
					{viewModel.title}
				</h1>
				<a href={viewModel.universityHref} class="text-xl font-medium text-slate-600 flex items-center gap-2 hover:text-orange-500 transition-colors inline-flex">
					{viewModel.university}
				</a>
				<div class="flex items-center gap-4 mt-3 text-sm text-slate-500">
					<span class="flex items-center gap-1.5"><MapPin size={16} /> {viewModel.location}</span>
					<span class="w-1 h-1 rounded-full bg-slate-300"></span>
					<span class="flex items-center gap-1.5"><Languages size={16} /> {viewModel.language} Taught</span>
				</div>
			</div>

			<!-- Quick Facts Grid -->
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
					<div class="text-slate-400 mb-1"><Banknote size={20} /></div>
					<div class="text-[11px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">Tuition</div>
					<div class="font-semibold text-emerald-600">{viewModel.tuition}</div>
				</div>
				<div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
					<div class="text-slate-400 mb-1"><Clock size={20} /></div>
					<div class="text-[11px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">Duration</div>
					<div class="font-semibold text-slate-800">{viewModel.durationMonths} Months</div>
				</div>
				<div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
					<div class="text-slate-400 mb-1"><CalendarDays size={20} /></div>
					<div class="text-[11px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">Intake</div>
					<div class="font-semibold text-slate-800">{viewModel.nextIntake}</div>
				</div>
				<div class="bg-white p-4 rounded-xl border border-slate-200 ring-1 ring-orange-100 shadow-sm">
					<div class="text-orange-400 mb-1"><CalendarDays size={20} /></div>
					<div class="text-[11px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">Deadline</div>
					<div class="font-semibold {viewModel.deadline.isExpired ? 'text-slate-500' : 'text-orange-600'}">{viewModel.deadline.shortLabel}</div>
					{#if viewModel.deadline.status === 'expired' || viewModel.deadline.status === 'not_published' || viewModel.deadline.status === 'rolling'}
						<div class="mt-1 text-xs text-slate-500 leading-snug">{viewModel.deadline.label}</div>
					{/if}
				</div>
			</div>

			<!-- About -->
			<section>
				<h2 class="text-2xl font-bold text-slate-900 mb-4" style="font-family: 'Outfit', sans-serif;">About the Program</h2>
				<p class="text-slate-600 leading-relaxed text-lg">
					{viewModel.description}
				</p>
			</section>

			<!-- Requirements -->
			<section>
				<h2 class="text-2xl font-bold text-slate-900 mb-4" style="font-family: 'Outfit', sans-serif;">Eligibility & Requirements</h2>
				<div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
					<ul class="divide-y divide-slate-100">
						{#each viewModel.requirements as req}
							<li class="p-4 flex items-start gap-3">
								<CheckCircle2 size={20} class="text-emerald-500 flex-shrink-0 mt-0.5" />
								<span class="text-slate-700 font-medium">{req}</span>
							</li>
						{/each}
					</ul>
				</div>
				<p class="text-sm text-slate-500 italic mt-4">
					Not sure if your background matches? Run a Right-Fit AI check to score your profile against these requirements.
				</p>
			</section>

			<!-- How to Apply Module -->
			<section class="mt-12 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
				<h2 class="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3" style="font-family: 'Outfit', sans-serif;">
					<svg class="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
					Application Pipeline
				</h2>
				<div class="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
					{#each viewModel.applicationSteps as step, i}
						<div class="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group">
							<!-- Step Number Dot -->
							<div class="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-indigo-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
								<span class="font-bold text-sm">{step.step_number || i + 1}</span>
							</div>
							<!-- Card -->
							<div class="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm">
								<div class="flex items-center justify-between mb-1">
									<h3 class="font-bold text-slate-900 text-lg">{step.title}</h3>
									{#if step.estimated_month}
										<span class="text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">{step.estimated_month}</span>
									{/if}
								</div>
								<p class="text-slate-600 text-sm">{step.description}</p>
								{#if step.deadline}
									<p class="text-xs font-bold text-red-500 mt-2">📅 Deadline: {step.deadline}</p>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</section>

			<!-- Fund This Program Module -->
			<section class="mt-12">
				<div class="bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-3xl p-8 shadow-lg text-white relative overflow-hidden">
					<!-- bg pattern -->
					<div class="absolute right-0 top-0 opacity-10">
						<svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/></svg>
					</div>

					<div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
						<div>
							<h2 class="text-3xl font-extrabold mb-2" style="font-family: 'Outfit', sans-serif;">Fund This Program</h2>
							<p class="text-emerald-50 text-lg">
								{#if scholarships.length > 0}
									Tuition is cheap, but you still need living expenses. Apply for these targeted scholarships.
								{:else}
									No scholarships in our catalog match this program yet. Here's how funding works for this type of program.
								{/if}
							</p>
						</div>
						<a href="/scholarships" class="px-5 py-2.5 bg-white text-emerald-700 rounded-xl font-bold hover:bg-emerald-50 transition-colors whitespace-nowrap shadow-sm inline-flex items-center gap-2">
							View All Scholarships <ArrowRight size={16} />
						</a>
					</div>

					{#if scholarships.length > 0}
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
							{#each scholarships as scholarship}
								{@const fit = matchPercent(scholarship.match_score)}
								{@const covers = coversLabel(scholarship.covers)}
								{@const rules = ruleLabels(scholarship.match_rules)}
								<a href={`/scholarships/${scholarship.slug || scholarship.id}`} class="block bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl p-5 border border-white/20 transition-all group">
									<div class="flex justify-between items-start mb-3 gap-3">
										<span class="inline-block px-2.5 py-1 bg-emerald-400/20 text-emerald-100 rounded text-[10px] font-bold uppercase tracking-wider">{scholarship.type || 'Funding'}</span>
										<div class="flex items-center gap-1.5 flex-wrap justify-end">
											{#if fit !== null}
												<span class="text-xs font-bold bg-white text-emerald-700 px-2 py-1 rounded whitespace-nowrap" title={rules.length > 0 ? `Match: ${rules.join(', ')}` : undefined}>
													{fit}% match
												</span>
											{/if}
											{#if scholarship.deadline}
												<span class="text-xs font-bold bg-white/20 px-2 py-1 rounded text-white whitespace-nowrap">
													{new Date(scholarship.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
												</span>
											{/if}
										</div>
									</div>
									<h3 class="font-bold text-xl text-white mb-1 group-hover:underline">{decodeHtmlEntities(scholarship.title)}</h3>
									<p class="text-emerald-100 text-sm mb-3 line-clamp-2">{decodeHtmlEntities(scholarship.description)}</p>
									{#if covers || rules.length > 0}
										<div class="flex flex-wrap gap-1.5 mb-3">
											{#if covers}
												<span class="inline-flex items-center px-2 py-0.5 bg-white/20 text-white text-[11px] font-semibold rounded">
													{covers}
												</span>
											{/if}
											{#each rules as rule}
												<span class="inline-flex items-center px-2 py-0.5 bg-white/10 text-emerald-50 text-[11px] font-medium rounded">
													{rule}
												</span>
											{/each}
										</div>
									{/if}
									<div class="flex items-center gap-1 text-sm font-bold text-white">
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
										{formatCurrencyAmount(scholarship.amount) || 'Funding available'}
									</div>
								</a>
							{/each}
						</div>
					{:else}
						<FundingGuidance
							country={program.country}
							degreeLevel={program.degree_level}
							universityName={program.university_name}
							programName={program.program_name}
						/>
					{/if}

	
				</div>
			</section>

			<!-- Work & Stay Section -->
			<section class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
				<div class="px-8 pt-8 pb-2">
					<h2 class="text-xl font-extrabold text-slate-900 mb-1" style="font-family: 'Outfit', sans-serif;">Work & Stay</h2>
					<p class="text-sm text-slate-500 mb-6">What you can earn and how long you can stay after graduation.</p>
				</div>
				<div class="px-8 pb-8">
					<WorkAndStay country={program.country} />
				</div>
			</section>

		</div>

		<!-- Right Sticky Action Panel -->
		<div class="lg:col-span-1 self-start">
			<div class="sticky top-32">
			<div class="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl border border-slate-800" style="position: relative;">
				<!-- Sparkle Background -->
				<div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: radial-gradient(white 1px, transparent 1px); background-size: 20px 20px;"></div>
				
				<div class="relative z-10">
					<h3 class="text-2xl font-bold mb-2">Want to apply here?</h3>
					<p class="text-slate-400 text-sm leading-relaxed mb-8">
						Don't start writing documents blindly. See exactly how competitive you are and get a step-by-step strategy for this specific program.
					</p>

					<!-- Action CTA / Wall Trigger -->
					<button onclick={handleAction} class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-between transition-all hover:-translate-y-1 shadow-lg hover:shadow-orange-500/30">
						<span>Start Strategy & AI Fit Check</span>
						<ArrowRight size={20} strokeWidth={2.5} />
					</button>
					
					<div class="mt-6 space-y-3">
						<div class="flex items-center gap-3 text-sm text-slate-300">
							<CheckCircle2 size={16} class="text-emerald-400" /> Free signup & strategy board
						</div>
						<div class="flex items-center gap-3 text-sm text-slate-300">
							<CheckCircle2 size={16} class="text-emerald-400" /> Includes 1 Free API Fit Check
						</div>
					</div>

					<!-- Cost Breakdown Mini -->
					<div class="mt-8 pt-6 border-t border-slate-700">
						<h4 class="text-xs uppercase tracking-wider font-bold text-slate-500 mb-3">Estimated Semester Cost</h4>
						<div class="flex justify-between items-center text-sm mb-2 text-slate-300">
							<span>Tuition</span>
							<span class="font-medium text-white">{viewModel.tuition}</span>
						</div>
						<div class="flex justify-between items-center text-sm mb-2 text-slate-300">
							<span>Admin / Union Fees</span>
							<span class="font-medium text-white">{viewModel.adminFee}</span>
						</div>
					</div>
				</div>
			</div>
			</div>
		</div>

	</div>
</div>

<!-- Similar Programs Section -->
{#if data.similarPrograms && data.similarPrograms.length > 0}
<div class="bg-white border-t border-slate-200 py-14">
	<div class="max-w-6xl mx-auto px-6 md:px-12">
		<div class="flex items-center justify-between mb-8">
			<div>
				<p class="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">You might also like</p>
				<h2 class="text-2xl font-extrabold text-slate-900" style="font-family: 'Outfit', sans-serif;">
					Similar programs in {program.country}
				</h2>
			</div>
			<a href="/programs?destination={encodeURIComponent(program.country)}" class="text-sm font-semibold text-slate-500 hover:text-orange-500 transition-colors flex items-center gap-1">
				View all <ArrowRight size={14} />
			</a>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			{#each data.similarPrograms as sp}
				<a href="/programs/{sp.id}" class="similar-card group">
					<div class="similar-card-top">
						<span class="similar-badge">{sp.country}</span>
						{#if sp.tuition_tier === 'zero_tuition'}
							<span class="similar-tier-badge tier-zero">Zero Tuition</span>
						{:else if sp.tuition_tier === 'low_tuition'}
							<span class="similar-tier-badge tier-low">Low Tuition</span>
						{/if}
					</div>
					<h3 class="similar-card-title">{sp.program_name}</h3>
					<p class="similar-card-uni">{sp.university_name}</p>
					<div class="similar-card-footer">
						<span class="similar-card-tuition">€{(sp.tuition_per_semester || 0).toLocaleString()}/sem</span>
						<span class="similar-card-cta">View program <ArrowRight size={12} /></span>
					</div>
				</a>
			{/each}
		</div>
	</div>
</div>
{/if}

<!-- Authentication Modal with Context Return URL -->
<AuthenticationFlow
	bind:show={showAuthModal}
	{supabase}
	mode="signup"
	returnUrl={`/dashboard?programId=${viewModel.id}`}
/>

<style>
	.similar-card {
		display: flex;
		flex-direction: column;
		background: white;
		border: 1.5px solid #e2e8f0;
		border-radius: 1rem;
		padding: 1.25rem;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s ease;
	}
	.similar-card:hover {
		border-color: #f97316;
		box-shadow: 0 8px 24px rgba(249, 115, 22, 0.1);
		transform: translateY(-3px);
	}
	.similar-card-top {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.875rem;
	}
	.similar-badge {
		font-size: 0.625rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		background: #fff7ed;
		color: #ea580c;
		padding: 0.2rem 0.5rem;
		border-radius: 9999px;
	}
	.similar-tier-badge {
		font-size: 0.625rem;
		font-weight: 700;
		padding: 0.2rem 0.5rem;
		border-radius: 9999px;
	}
	.tier-zero { background: #d1fae5; color: #065f46; }
	.tier-low  { background: #dbeafe; color: #1e40af; }
	.similar-card-title {
		font-size: 0.9375rem;
		font-weight: 700;
		color: #0f172a;
		line-height: 1.35;
		margin-bottom: 0.25rem;
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.similar-card-uni {
		font-size: 0.8125rem;
		color: #64748b;
		flex: 1;
		margin-bottom: 0.875rem;
	}
	.similar-card-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 0.75rem;
		border-top: 1px solid #f1f5f9;
	}
	.similar-card-tuition {
		font-size: 0.75rem;
		font-weight: 700;
		color: #059669;
	}
	.similar-card-cta {
		font-size: 0.6875rem;
		font-weight: 700;
		color: #f97316;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
</style>
