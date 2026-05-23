<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import AuthenticationFlow from '$lib/components/AuthenticationFlow.svelte';
	import { analyzeStoryVault, defaultStoryVault, loadStoryVault, saveStoryVault } from '$lib/copilot/storyVault';
	import { buildPlaybook } from '$lib/copilot/playbook';
	import { simulateAcceptance } from '$lib/copilot/simulator';
	import { programCatalog, findGermanyProgramById } from '$lib/copilot/data/program-catalog';
	import { createDefaultDocumentSlots, computePhase, phaseLabel, phaseColor } from '$lib/copilot/handoff-packet';
	import type { FundingLane, StoryVault } from '$lib/copilot/types';
	import type { DocumentPhase, DocumentSlot } from '$lib/copilot/handoff-packet';
	import { CheckCircle2, MoreHorizontal, FileText, ChevronRight, ArrowRight } from 'lucide-svelte';
	import { setProgramStatus } from '$lib/services/programService';

	type FlowStep = 'right-fit' | 'strategy' | 'onboarding-wall';
	type FitBand = 'Good fit' | 'Needs prep' | 'High risk';
	type FitResult = { band: FitBand; reasons: string[]; improvements: string[]; rawScore: number };

	let { data }: { data: any } = $props();
	let { session, supabase, profile, interaction } = $derived(data);

	// Load program from query params or first default
	let searchParams = browser ? new URLSearchParams(window.location.search) : new URLSearchParams();
	let selectedProgramId = $state(searchParams.get('programId') || programCatalog[0].id);
	
	let program = $derived(programCatalog.find((p) => p.id === selectedProgramId) ?? programCatalog[0]);
	let step = $state<FlowStep>('strategy');
	let isLoading = $state(true);
	let vault = $state<StoryVault | null>(null);
	
	let programFit = $state<FitResult | null>(null);
	let fundingFit = $state<FitResult | null>(null);
	let laneProgress = $state<Record<string, boolean>>({});
	let documents = $state<DocumentSlot[]>([]);

	/**
	 * Phase 6: Sync current workspace state to Supabase JSONB
	 */
	async function syncWorkspace() {
		if (!session?.user?.id) return;
		const workspace_data = { laneProgress, documents };
		await setProgramStatus(supabase, session.user.id, program.id, step === 'onboarding-wall' ? 'saved' : 'strategy', programFit?.rawScore, workspace_data);
	}

	function calculateMatchScore() {
		if (!profile || !profile.current_gpa_value) return { score: 65, band: 'Needs prep' as FitBand, reasons: [] };
		
		const minReq = program.requirements.find(r => r.includes('Min GPA'))?.split(': ')[1]?.split(' /')[0];
		const minGpa = minReq ? parseFloat(minReq) : 3.0;
		const userGpa = toGpa4(profile.current_gpa_value, profile.current_gpa_scale || '4.0') || 2.0;
		
		let score = 60 + (userGpa - minGpa) * 30;
		
		// Penalties for missing specific keywords
		const reasons: string[] = [];
		if (userGpa >= minGpa) reasons.push('Academic background exceeds minimum entry requirements');
		else reasons.push('GPA is slightly below the preferred threshold; focus on SOP');

		if (program.requirements.some(r => r.includes('English proficiency')) && profile.citizenship === 'English Native') {
			score += 5;
			reasons.push('English proficiency requirement waived (Native Speaker)');
		}

		const finalScore = Math.min(Math.max(Math.round(score), 10), 99);
		return {
			score: finalScore,
			band: finalScore >= 75 ? 'Good fit' : finalScore >= 50 ? 'Needs prep' : 'High risk' as FitBand,
			reasons
		};
	}

	function toGpa4(value: number | null, scale: string): number | null {
		if (value === null || Number.isNaN(value)) return null;
		if (scale === '4.0') return value;
		if (scale === '5.0') return (value / 5) * 4;
		if (value >= 90) return 4; if (value >= 80) return 3.5;
		if (value >= 70) return 3; if (value >= 60) return 2.5;
		return 2;
	}

	function createSupplementalDocumentSlot(id: string, name: string, guidance: string): DocumentSlot {
		return {
			id,
			name,
			guidance,
			phase: 'not_started',
			actionSteps: [],
			selfCheckItems: [],
			tips: [],
			notes: ''
		};
	}

	function applyDocumentPhase(doc: DocumentSlot, nextPhase: DocumentPhase) {
		doc.phase = nextPhase;
		if (nextPhase === 'ready') {
			doc.actionSteps = doc.actionSteps.map((step) => ({ ...step, completed: true }));
			doc.selfCheckItems = doc.selfCheckItems.map((item) => ({ ...item, checked: true }));
			return;
		}

		if (nextPhase === 'self_review') {
			doc.actionSteps = doc.actionSteps.map((step) => ({ ...step, completed: true }));
			doc.selfCheckItems = doc.selfCheckItems.map((item) => ({ ...item, checked: false }));
			return;
		}

		if (nextPhase === 'drafting') {
			doc.actionSteps = doc.actionSteps.map((step, index) => ({ ...step, completed: index === 0 }));
			doc.selfCheckItems = doc.selfCheckItems.map((item) => ({ ...item, checked: false }));
			return;
		}

		doc.actionSteps = doc.actionSteps.map((step) => ({ ...step, completed: false }));
		doc.selfCheckItems = doc.selfCheckItems.map((item) => ({ ...item, checked: false }));
	}

	onMount(async () => {
		try {
			if (!session?.user?.id) return;
			vault = (await loadStoryVault(supabase, session)) ?? defaultStoryVault(session.user.id);
			
			// Hydrate state from Cloud Interaction Data first
			if (interaction?.workspace_data) {
				laneProgress = interaction.workspace_data.laneProgress || {};
				documents = interaction.workspace_data.documents || [];
				step = interaction.status === 'saved' ? 'strategy' : (interaction.status as FlowStep);
			} else {
				// Initialize fresh workspace
				laneProgress = Object.fromEntries(program.funding_lanes.map((lane: FundingLane) => [lane.id, false]));
				
				// Dynamic Requirements Engine
				const slots = createDefaultDocumentSlots();
				if (program.requirements.some(r => r.includes('English proficiency'))) {
					slots.push(createSupplementalDocumentSlot('ielts', 'English Certificate (IELTS/TOEFL)', 'Upload your official English-language test result or accepted waiver document.'));
				}
				if (program.requirements.some(r => r.includes('German proficiency'))) {
					slots.push(createSupplementalDocumentSlot('german', 'German Certificate', 'Add your German-language proof if this program requires it.'));
				}
				if (program.requirements.some(r => r.includes('Work/research'))) {
					slots.push(createSupplementalDocumentSlot('portfolio', 'Professional Portfolio', 'Collect the portfolio, project samples, or research evidence requested by this program.'));
				}
				documents = slots;
			}

			// Perform real-time fit analysis
			if (profile?.onboarding_completed) {
				const { score, band, reasons } = calculateMatchScore();
				programFit = { band, reasons, improvements: [], rawScore: score };
				fundingFit = { band, reasons: ['Eligible for standard university grants'], improvements: [], rawScore: score - 10 };
				step = 'strategy';
				await syncWorkspace();
			} else {
				step = 'onboarding-wall';
			}
		} catch (err) {
			console.error("Strategy Board failed to initialize:", err);
		} finally {
			isLoading = false;
		}
	});

	// UI Helpers for the Kanban
	const todoDocs = $derived(documents.filter(d => computePhase(d) === 'not_started'));
	const inProgressDocs = $derived(documents.filter(d => computePhase(d) === 'drafting' || computePhase(d) === 'self_review'));
	const submittedDocs = $derived(documents.filter(d => computePhase(d) === 'ready'));

	async function toggleLane(id: string) {
		laneProgress[id] = !laneProgress[id];
		await syncWorkspace();
	}

	async function updateDocStatus(docId: string, newPhase: DocumentPhase) {
		const idx = documents.findIndex(d => d.id === docId);
		if (idx !== -1) {
			applyDocumentPhase(documents[idx], newPhase);
			await syncWorkspace();
		}
	}
</script>

<svelte:head>
	<title>Strategy Board | {program.program_name}</title>
</svelte:head>

{#if isLoading}
	<div class="flex items-center justify-center p-20">
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy"></div>
	</div>
{:else}
	<div class="max-w-7xl mx-auto space-y-6">
		<div class="flex items-center justify-between mb-8">
			<div>
				<h1 class="text-2xl font-bold text-slate-900" style="font-family: 'Outfit', sans-serif;">Study Abroad Strategy Board</h1>
				<p class="text-sm text-slate-500 mt-1">{program.program_name} at {program.university}</p>
			</div>
			<button class="bg-brand-navy text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors">
				Quick Review
			</button>
		</div>

		{#if step === 'right-fit' || step === 'onboarding-wall'}
			<!-- ONBOARDING WALL -->
			<div class="bg-white rounded-3xl border border-slate-200 p-10 shadow-sm max-w-2xl mx-auto text-center">
				<div class="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
					<span class="text-2xl">🎓</span>
				</div>
				<h2 class="text-2xl font-extrabold text-slate-900 mb-4" style="font-family: 'Outfit', sans-serif;">Unlock Your AI Strategy Board</h2>
				<p class="text-slate-600 mb-8 text-lg">
					To instantly calculate your Match Score for <strong>{program.program_name}</strong> and generate personalized application documents, we need your base academic profile.
				</p>
				
				<div class="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-8 text-left">
					<h3 class="font-bold text-slate-800 text-sm mb-3 uppercase tracking-wider">With a completed profile, you get:</h3>
					<ul class="space-y-3">
						<li class="flex items-center gap-3 text-sm text-slate-600">
							<CheckCircle2 size={16} class="text-emerald-500" /> Instant 0-100% acceptance probability scores
						</li>
						<li class="flex items-center gap-3 text-sm text-slate-600">
							<CheckCircle2 size={16} class="text-emerald-500" /> Automated matching to your top-fit funding lanes for this program
						</li>
						<li class="flex items-center gap-3 text-sm text-slate-600">
							<CheckCircle2 size={16} class="text-emerald-500" /> 1-Click Motivation Letters and Academic CVs
						</li>
					</ul>
				</div>

				<a href="/onboarding" class="inline-flex justify-center items-center w-full bg-brand-navy text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-800 transition-colors text-lg">
					Complete Global Profile (60 seconds) <ArrowRight size={20} class="ml-2" />
				</a>
			</div>
		{:else}
			<!-- DASHBOARD GRID MATCHING THE MOCKUP -->
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
				
				<!-- COLUMN 1: MATCH SCORE (3 spans) -->
				<div class="lg:col-span-3 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
					<div class="flex items-center justify-between mb-8">
						<div>
							<h3 class="font-bold text-slate-900" style="font-family: 'Outfit', sans-serif;">Program Match Score</h3>
							<p class="text-xs text-slate-500">Your calculated probability</p>
						</div>
						<MoreHorizontal size={18} class="text-slate-400" />
					</div>

					<div class="relative flex justify-center mb-8">
						<!-- Massive SVG Circle -->
						<div class="w-48 h-48 relative flex items-center justify-center">
							<svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
								<circle cx="50" cy="50" r="45" fill="none" class="stroke-slate-100" stroke-width="8"></circle>
								<!-- The stroke-dasharray circumferences is 2*PI*45 ~ 283 -->
								<circle cx="50" cy="50" r="45" fill="none" class="stroke-emerald-500 transition-all duration-1000" stroke-width="8" 
									stroke-linecap="round" stroke-dasharray="283" stroke-dashoffset={283 - (283 * (programFit?.rawScore || 0) / 100)}></circle>
							</svg>
							<div class="absolute text-center">
								<div class="text-5xl font-extrabold text-slate-900 tracking-tighter" style="font-family: 'Outfit', sans-serif;">
									{programFit?.rawScore}<span class="text-2xl text-slate-400 font-medium">/100</span>
								</div>
								<div class="text-sm font-bold text-emerald-600 uppercase tracking-wider mt-1">{programFit?.band}</div>
							</div>
						</div>
					</div>

					<div class="flex justify-between border-t border-slate-100 pt-4 mb-6">
						<div>
							<div class="text-xl font-bold">{programFit?.rawScore}/100</div>
							<div class="text-xs text-slate-500">Academic Sub-score</div>
						</div>
						<div class="text-right">
							<div class="text-xl font-bold">{fundingFit?.rawScore}/100</div>
							<div class="text-xs text-slate-500">Funding Match</div>
						</div>
					</div>

					<div class="space-y-4">
						{#if programFit?.reasons}
							{#each programFit.reasons as reason}
								<div class="flex gap-3">
									<CheckCircle2 size={18} class="text-emerald-500 flex-shrink-0 mt-0.5" />
									<p class="text-xs text-slate-600 leading-relaxed">{reason}</p>
								</div>
							{/each}
						{/if}
						<div class="flex gap-3">
							<CheckCircle2 size={18} class="text-emerald-500 flex-shrink-0 mt-0.5" />
							<p class="text-xs text-slate-600 leading-relaxed">Budget gap requires locking in at least two funding lanes.</p>
						</div>
					</div>
				</div>

				<!-- COLUMN 2: FUNDING LANES (4 spans) -->
				<div class="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm h-full">
					<div class="flex items-center justify-between mb-6">
						<div>
							<h3 class="font-bold text-slate-900" style="font-family: 'Outfit', sans-serif;">Funding Lanes</h3>
							<p class="text-xs text-slate-500">Scholarships tailored for you</p>
						</div>
						<MoreHorizontal size={18} class="text-slate-400" />
					</div>

					<div class="grid grid-cols-[auto_1fr_auto_auto] gap-4 mb-3 px-3">
						<div class="w-4"></div>
						<div class="text-xs font-semibold text-slate-400">Name</div>
						<div class="text-xs font-semibold text-slate-400 text-right">Amount</div>
						<div class="text-xs font-semibold text-slate-400 text-right w-16">Status</div>
					</div>

					<div class="space-y-2">
						{#each program.funding_lanes as lane}
							<button 
								onclick={() => toggleLane(lane.id)}
								class="w-full grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
							>
								<div class="w-4 h-4 rounded border flex items-center justify-center {laneProgress[lane.id] ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-300'}">
									{#if laneProgress[lane.id]}<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>{/if}
								</div>
								<div class="text-sm font-semibold text-slate-800 text-left line-clamp-1">{lane.title}</div>
								<div class="text-sm font-medium text-slate-600 text-right">€{lane.coverage.includes('€') ? lane.coverage.split('€')[1].split(' ')[0] : '800'}</div>
								<div class="w-16 flex justify-end">
									<span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-500">Eligible</span>
								</div>
							</button>
						{/each}
					</div>
				</div>

				<!-- COLUMN 3: APPLICATION HANDOFF / KANBAN (5 spans) -->
				<div class="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm h-full">
					<div class="flex items-center justify-between mb-6">
						<div>
							<h3 class="font-bold text-slate-900" style="font-family: 'Outfit', sans-serif;">Application Handoff</h3>
							<p class="text-xs text-slate-500">Documents needed for submission</p>
						</div>
						<MoreHorizontal size={18} class="text-slate-400" />
					</div>

					<!-- Kanban Columns -->
					<div class="grid grid-cols-3 gap-4">
						<!-- To Do -->
						<div>
							<div class="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-2 mb-4">
								To Do <span class="bg-white text-slate-400 px-1.5 py-0.5 rounded text-[10px]">{todoDocs.length}</span>
							</div>
							<div class="space-y-3">
								{#each todoDocs as doc}
									{@const route = doc.id === 'motivation' ? 'sop' : doc.id === 'cv' ? 'academic-cv' : doc.id === 'recommendation' ? 'cover-letters' : null}
									<div class="block bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-indigo-300">
										<div class="flex justify-between items-start mb-3">
											<div class="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
												<FileText size={16} />
											</div>
											<button 
												onclick={(e) => { e.preventDefault(); updateDocStatus(doc.id, 'ready'); }}
												class="text-[10px] font-bold text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-wider"
											>
												Mark Ready
											</button>
										</div>
										<svelte:element this={route ? 'a' : 'div'} href={route ? `/${route}?programId=${program.id}` : null} class="block">
											<h4 class="font-bold text-sm text-slate-800 mb-1">{doc.name}</h4>
											<div class="text-xs text-slate-500 font-medium tracking-wide">Not Started</div>
										</svelte:element>
									</div>
								{/each}
							</div>
						</div>

						<!-- In Progress -->
						<div>
							<div class="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-2 mb-4">
								In Progress <span class="bg-white text-slate-400 px-1.5 py-0.5 rounded text-[10px]">{inProgressDocs.length}</span>
							</div>
							<div class="space-y-3">
								{#each inProgressDocs as doc}
									{@const route = doc.id === 'motivation' ? 'sop' : doc.id === 'cv' ? 'academic-cv' : doc.id === 'recommendation' ? 'cover-letters' : null}
									<div class="block bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-amber-300">
										<div class="flex justify-between items-start mb-3">
											<div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
												<FileText size={16} />
											</div>
											<button 
												onclick={(e) => { e.preventDefault(); updateDocStatus(doc.id, 'ready'); }}
												class="text-[10px] font-bold text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-wider"
											>
												Mark Ready
											</button>
										</div>
										<svelte:element this={route ? 'a' : 'div'} href={route ? `/${route}?programId=${program.id}` : null} class="block">
											<h4 class="font-bold text-sm text-slate-800 mb-1">{doc.name}</h4>
											<div class="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
												<div class="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Drafting
											</div>
										</svelte:element>
									</div>
								{/each}
							</div>
						</div>

						<!-- Submitted/Ready -->
						<div>
							<div class="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-2 mb-4">
								Ready <span class="bg-white text-slate-400 px-1.5 py-0.5 rounded text-[10px]">{submittedDocs.length}</span>
							</div>
							<div class="space-y-3">
								{#each submittedDocs as doc}
									{@const route = doc.id === 'motivation' ? 'sop' : doc.id === 'cv' ? 'academic-cv' : doc.id === 'recommendation' ? 'cover-letters' : null}
									<div class="block bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-emerald-300">
										<div class="flex justify-between items-start mb-3">
											<div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
												<CheckCircle2 size={16} />
											</div>
											<button 
												onclick={(e) => { e.preventDefault(); updateDocStatus(doc.id, 'not_started'); }}
												class="text-[10px] font-bold text-slate-400 hover:text-orange-600 transition-colors uppercase tracking-wider"
											>
												Reset
											</button>
										</div>
										<svelte:element this={route ? 'a' : 'div'} href={route ? `/${route}?programId=${program.id}` : null} class="block">
											<h4 class="font-bold text-sm text-slate-800 mb-1">{doc.name}</h4>
											<div class="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
												Ready
											</div>
										</svelte:element>
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>

			</div>
		{/if}
	</div>
{/if}
