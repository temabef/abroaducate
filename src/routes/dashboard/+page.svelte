<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import {
		Target,
		Calendar,
		Rocket,
		Check,
		ArrowRight,
		PlusCircle,
		CheckCircle2,
		FileText,
		MoreHorizontal,
		ExternalLink,
		Zap,
		Award,
		Briefcase,
		BookOpen,
		BarChart2,
		Lock,
		CreditCard,
		Settings,
		LogOut,
		Trash2,
		ChevronDown,
		ChevronUp,
		Radio,
		GraduationCap,
		ChevronLeft,
		FolderOpen,
		Clock,
		Edit3,
		AlertTriangle,
		RefreshCw,
		User,
		MapPin,
		Mail,
		PenLine,
		ScrollText,
		Plane
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import { createDefaultDocumentSlots, computePhase } from '$lib/copilot/handoff-packet';
	import {
		setProgramStatus,
		getTrackedPrograms,
		removeTrackedProgram
	} from '$lib/services/programService';
	import { calculateScholarshipMatch } from '$lib/services/scholarshipMatching';
	import { decodeHtmlEntities, formatCurrencyAmount } from '$lib/utils/htmlEntities';
	import type { DocumentSlot, DocumentPhase } from '$lib/copilot/handoff-packet';
	import StrategyDocumentLinker from '$lib/components/StrategyDocumentLinker.svelte';
	import AddDocumentModal from '$lib/components/AddDocumentModal.svelte';

	let { data }: { data: any } = $props();
	let session = $derived(data.session);
	let supabase = $derived(data.supabase);
	let profile = $derived(data.profile);
	let savedScholarships = $derived(data.savedScholarships || []);
	let unlockedScholarshipMeta = $derived(data.unlockedScholarshipMeta || []);
	let userDocuments = $derived(data.userDocuments || []);
	let isProfileComplete = $derived(
		Boolean(profile && (profile.current_level || profile.current_education_level) && profile.gpa)
	);
	let localProfileUnlocked = $state(
		Boolean(
			(data.profile?.current_level || data.profile?.current_education_level) && data.profile?.gpa
		)
	);
	let isProfileReady = $derived(localProfileUnlocked || isProfileComplete);
	let trackedProgramsData = $state<any[]>(data.trackedProgramsData ?? []);
	let manuallyUnlockedStrategies = $state<Record<string, any>>(data.profile?.workspace_data?.scholarship_strategies || {});
	let serverSelectedId = $derived(data.initialSelectedProgramId);

	// Add-existing-document modal
	let showAddDocModal = $state(false);

	function handleDocCreated(info: { id: string; type: string; title: string }) {
		// Navigate to the new doc edit page so the user can keep working on it.
		const urlMap: Record<string, string> = {
			'sop': `/sop/${info.id}`,
			'cover-letter': `/cover-letters/${info.id}`,
			'personal-statement': `/personal-statements/${info.id}`,
			'academic-cv': `/academic-cv/${info.id}`
		};
		const url = urlMap[info.type] || '/dashboard';
		goto(url);
	}

	// ── Dashboard View System ──────────────────────────────────────────────
	type DashboardView = 'hub' | 'program-detail' | 'scholarship-detail';
	let currentView = $state<DashboardView>('hub');
	let detailScholarshipId = $state<string | null>(null);

	// Push a history entry so the browser back button returns to the hub
	// instead of leaving the dashboard entirely.
	function pushViewState(view: DashboardView, id?: string | null) {
		if (!browser) return;
		const url = new URL(window.location.href);
		if (view === 'hub') {
			url.searchParams.delete('view');
			url.searchParams.delete('programId');
			url.searchParams.delete('scholarshipId');
		} else if (view === 'program-detail' && id) {
			url.searchParams.set('view', 'program');
			url.searchParams.set('programId', id);
			url.searchParams.delete('scholarshipId');
		} else if (view === 'scholarship-detail' && id) {
			url.searchParams.set('view', 'scholarship');
			url.searchParams.set('scholarshipId', id);
			url.searchParams.delete('programId');
		}
		history.pushState({ view, id }, '', url.toString());
	}

	const detailScholarship = $derived.by(() => {
		if (!detailScholarshipId) return null;
		const saved = savedScholarships.find((s: any) => s.id === detailScholarshipId);
		const meta = unlockedScholarshipMeta.find((m: any) => m.id === detailScholarshipId);
		return saved || meta || { id: detailScholarshipId, title: 'Scholarship', provider: '' };
	});
	const detailScholarshipStrategy = $derived(
		detailScholarshipId ? (manuallyUnlockedStrategies[detailScholarshipId] || profile?.workspace_data?.scholarship_strategies?.[detailScholarshipId] || null) : null
	);

	// All scholarships for the hub (merged saved + unlocked, deduplicated)
	const allHubScholarships = $derived.by(() => {
		const map = new Map<string, any>();
		for (const s of savedScholarships) {
			map.set(s.id, { ...s, hasStrategy: !!(manuallyUnlockedStrategies[s.id] || profile?.workspace_data?.scholarship_strategies?.[s.id]) });
		}
		const stratKeys = Object.keys({ ...(profile?.workspace_data?.scholarship_strategies || {}), ...manuallyUnlockedStrategies });
		for (const id of stratKeys) {
			if (!map.has(id)) {
				const meta = unlockedScholarshipMeta.find((m: any) => m.id === id);
				map.set(id, { id, title: meta?.title || 'Scholarship', provider: meta?.provider || '', amount: meta?.amount || '', hasStrategy: true });
			}
		}
		return Array.from(map.values());
	});

	function goToHub() {
		currentView = 'hub';
		selectedProgramId = null;
		detailScholarshipId = null;
		pushViewState('hub');
	}
	function goToProgramDetail(programId: string) {
		const tracked = trackedPrograms.find((p: any) => p.program?.id === programId);
		if (tracked) {
			selectProgram(programId, tracked.workspaceData);
			currentView = 'program-detail';
			pushViewState('program-detail', programId);
		}
	}
	function goToScholarshipDetail(scholarshipId: string) {
		detailScholarshipId = scholarshipId;
		currentView = 'scholarship-detail';
		pushViewState('scholarship-detail', scholarshipId);
	}
	function timeAgo(dateStr: string) {
		const d = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - d.getTime();
		const diffH = Math.floor(diffMs / 3600000);
		if (diffH < 1) return 'just now';
		if (diffH < 24) return `${diffH}h ago`;
		const diffD = Math.floor(diffH / 24);
		return `${diffD}d ago`;
	}

	// ── Persistence Sync ────────────────────────────────────────────────────
	$effect(() => {
		if (profile && !isSavingProfile) {
			inlineGpa = String(profile.gpa ?? '');
			inlineLevel = profile.current_education_level ?? profile.current_level ?? '';
			inlineField = profile.field_of_study ?? '';
			inlineNationality = profile.nationality ?? '';
			inlineTargetLevel = profile.target_level ?? '';
			inlineIelts = String(profile.ielts_score ?? '');
		}
	});

	function scrollToFootprint() {
		const el = document.getElementById('academic-footprint-box');
		const wrapper = document.querySelector('[data-dash-main]');
		if (el && wrapper) {
			const offsetTop = el.getBoundingClientRect().top + wrapper.scrollTop - wrapper.getBoundingClientRect().top - 20;
			wrapper.scrollTo({ top: offsetTop, behavior: 'smooth' });
			el.classList.add('ring-2', 'ring-orange-500', 'ring-offset-2');
			setTimeout(() => {
				el.classList.remove('ring-2', 'ring-orange-500', 'ring-offset-2');
			}, 2000);
		} else if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}

	// ── Inline Profile Form ─────────────────────────────────────────────────
	let inlineGpa = $state<string>('');
	let inlineLevel = $state<string>('');
	let inlineField = $state<string>('');
	let inlineNationality = $state<string>('');
	let inlineTargetLevel = $state<string>('');
	let inlineIelts = $state<string>('');
	let isSavingProfile = $state(false);
	let profileSaveSuccess = $state(false);
	let isEditingFootprint = $state(false);

	async function saveInlineProfile() {
		if (!session?.user?.id || !supabase) return;
		isSavingProfile = true;
		profileSaveSuccess = false;
		const updates = {
			user_id: session.user.id,
			gpa: parseFloat(inlineGpa) || null,
			current_level: inlineLevel || null,
			field_of_study: inlineField || null,
			nationality: inlineNationality || null,
			target_level: inlineTargetLevel || null,
			ielts_score: parseFloat(inlineIelts) || null,
			updated_at: new Date().toISOString()
		};
		// Safely handle missing unique constraint by explicitly checking
		const { data: exist } = await supabase.from('user_profiles').select('id').eq('user_id', session.user.id).limit(1).maybeSingle();
		let error = null;

		if (exist?.id) {
			const { error: updErr } = await supabase.from('user_profiles').update(updates).eq('user_id', session.user.id);
			error = updErr;
		} else {
			const { error: insErr } = await supabase.from('user_profiles').insert(updates);
			error = insErr;
		}
		if (!error) {
			localProfileUnlocked = true; // â† Flips isProfileReady immediately
			profileSaveSuccess = true;
			isEditingFootprint = false;
			if (selectedProgram) fetchMatchingScholarships(selectedProgram);

			// If we were trying to generate a specific scholarship, resume it
			if (activeScholarshipId) {
				const s = matchingScholarships.find((m) => m.id === activeScholarshipId);
				if (s) generateScholarshipStrategy(s);
			}
		}
		isSavingProfile = false;
	}

	// Ã¢â€€Ã¢â€€ State Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€
	let selectedProgramId = $state<string | null>(null);
	let programDetailTab = $state<'timeline' | 'scholarships' | 'documents'>('timeline');
	let documents = $state<DocumentSlot[]>([]);
	let isSavingWorkspace = $state(false);
	let matchingScholarships = $state<any[]>([]);

	// Linked documents per program — which of the user's generated/uploaded
	// documents are linked to this specific program. Persists in workspace_data.
	type LinkedDocKey = 'sop' | 'cover-letter' | 'personal-statement';
	let linkedDocuments = $state<Partial<Record<LinkedDocKey, string>>>({});

	// Supporting documents checklist (non-AI physical docs)
	type SupportingDoc = { id: string; label: string; ready: boolean };
	let supportingDocs = $state<SupportingDoc[]>([]);

	function defaultSupportingDocs(prog: any): SupportingDoc[] {
		const list: SupportingDoc[] = [
			{ id: 'transcript', label: 'Academic Transcripts', ready: false },
			{ id: 'passport', label: 'Passport Copy', ready: false },
			{ id: 'recommendation', label: 'Letters of Recommendation', ready: false }
		];
		if (prog?.english_required || prog?.rubric_criteria?.english_level_required) {
			list.push({ id: 'english', label: 'English Proficiency (IELTS/TOEFL)', ready: false });
		}
		if (prog?.german_required || prog?.rubric_criteria?.german_level_required) {
			list.push({ id: 'german', label: 'German Proficiency (TestDaF/DSH)', ready: false });
		}
		return list;
	}
	let isLoadingScholarships = $state(false);

	// Tracked programs (from server)
	const trackedPrograms = $derived(trackedProgramsData || []);

	// The currently-selected full program object from DB
	const selectedProgram = $derived(
		selectedProgramId
			? (trackedPrograms.find((p: any) => p.program?.id === selectedProgramId)?.program ?? null)
			: null
	);

	// Old program-level strategy (kept for backwards compat, not displayed)
	const _legacyProgramStrategy = $derived(
		selectedProgramId
			? (trackedPrograms.find((p: any) => p.program?.id === selectedProgramId)?.workspaceData
					?.funding_strategy ?? null)
			: null
	);

	// ── Scholarship Strategy State ─────────────────────────────────────────
	let activeScholarshipStrategy = $state<any>(null);
	let activeScholarshipName = $state<string>('');
	let activeScholarshipId = $state<string | null>(null);
	let isGeneratingScholarshipStrategy = $state<Record<string, boolean>>({});
	let scholarshipStrategyError = $state<string | null>(null);
	let showBillingModal = $state(false);
	let generationPhase = $state<string>('');
	let strategyActiveTab = $state<'overview' | 'audit' | 'action'>('overview');
	let detailStrategyTab = $state<'overview' | 'audit' | 'action'>('overview');
	let showStrategyLinker = $state(false);
	let strategyTargetDocument = $state<{ docId?: string, type?: string, text?: string | null, name?: string | null } | null>(null);

	const LOADING_PHASES = [
		'Analyzing your academic footprint...',
		'Identifying targeted narrative angles...',
		'Finalizing your personal Clarity Report...'
	];

	function cyclePhases(scholarshipId: string) {
		let i = 0;
		generationPhase = LOADING_PHASES[0];
		const interval = setInterval(() => {
			if (!isGeneratingScholarshipStrategy[scholarshipId]) {
				clearInterval(interval);
				return;
			}
			i = (i + 1) % LOADING_PHASES.length;
			generationPhase = LOADING_PHASES[i];
		}, 2000);
	}

	const unlockedScholarships = $derived.by(() => {
		const strategies = {
			...(profile?.workspace_data?.scholarship_strategies || {}),
			...manuallyUnlockedStrategies
		};
		return Object.keys(strategies).map((id) => {
			// Look up name/provider from all available data sources, not just the current
			// program's matchingScholarships (which is empty on hub/scholarship-detail views).
			const match = (matchingScholarships as any[]).find((m: any) => m.id === id)
				|| (savedScholarships as any[]).find((s: any) => s.id === id)
				|| (unlockedScholarshipMeta as any[]).find((m: any) => m.id === id);
			return {
				id,
				title: match?.title || 'Scholarship Strategy',
				provider: match?.provider || '',
				amount: match?.amount || ''
			};
		});
	});

	function initiateScholarshipStrategyGeneration(scholarship: any) {
		if (!session?.user?.id) return;
		activeScholarshipId = scholarship.id;
		activeScholarshipName = scholarship.title;

		const cached = manuallyUnlockedStrategies[scholarship.id] || profile?.workspace_data?.scholarship_strategies?.[scholarship.id];
		if (cached) {
			activeScholarshipStrategy = cached;
			tick().then(() => {
				const el = document.getElementById('strategy-result-view');
				const wrapper = document.querySelector('[data-dash-main]');
				if (el && wrapper) {
					wrapper.scrollTo({ top: el.getBoundingClientRect().top + wrapper.scrollTop - wrapper.getBoundingClientRect().top - 20, behavior: 'smooth' });
				} else if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
			});
			return; 
		}

		if (!isProfileReady) {
			activeScholarshipStrategy = null;
			scrollToFootprint();
			return;
		}

		// Prefer the SOP linked to this program (if any) — no picker needed
		const linkedSopId = linkedDocuments?.['sop'];
		if (linkedSopId) {
			const linkedDoc = userDocuments.find((d: any) => d.id === linkedSopId);
			if (linkedDoc) {
				processScholarshipStrategyGeneration({
					docId: linkedDoc.id,
					type: linkedDoc.type,
					name: linkedDoc.program_name || 'My Document'
				}, scholarship);
				return;
			}
		}

		// Otherwise always show the pre-check modal so the user can choose
		// (paste, pick from saved, or skip).
		showStrategyLinker = true;
	}

	function processScholarshipStrategyGeneration(info: any, sInfo?: any) {
		strategyTargetDocument = info;
		const finalRef = sInfo || (matchingScholarships as any[]).find(m => m.id === activeScholarshipId) || (savedScholarships as any[]).find((s: any) => s.id === activeScholarshipId) || { id: activeScholarshipId, title: activeScholarshipName };
		generateScholarshipStrategy(finalRef);
	}

	async function generateScholarshipStrategy(scholarship: any) {
		if (!session?.user?.id) return;

		activeScholarshipId = scholarship.id;
		activeScholarshipName = scholarship.title;

		// 3. Start remote generation
		isGeneratingScholarshipStrategy = {
			...isGeneratingScholarshipStrategy,
			[scholarship.id]: true
		};
		scholarshipStrategyError = null;
		activeScholarshipStrategy = null;
		cyclePhases(scholarship.id);

		try {
			const payload = {
				scholarshipId: scholarship.id,
				programId: selectedProgramId,
				documentId: strategyTargetDocument?.docId,
				documentType: strategyTargetDocument?.type,
				documentText: strategyTargetDocument?.text,
				documentName: strategyTargetDocument?.name
			};
			const res = await fetch('/api/scholarship-strategy', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			const result = await res.json();
			if (result.error) {
				if (result.error.includes('credit') || result.error.includes('Credit')) {
					showBillingModal = true;
				} else {
					scholarshipStrategyError = result.error;
				}
			} else {
				activeScholarshipStrategy = result.strategy;
				// Add to local state for instant reactivity
				manuallyUnlockedStrategies[scholarship.id] = result.strategy;
				await tick();
				let attempts = 0;
				const tryScroll = () => {
					const el = document.getElementById('strategy-result-view');
					const wrapper = document.querySelector('[data-dash-main]');
					if (el && wrapper) {
						// Custom offset scroll honoring the main content wrapper
						const offsetTop = el.getBoundingClientRect().top + wrapper.scrollTop - wrapper.getBoundingClientRect().top - 20;
						wrapper.scrollTo({ top: offsetTop, behavior: 'smooth' });
					} else if (el) {
						el.scrollIntoView({ behavior: 'smooth', block: 'center' });
					} else if (attempts < 5) {
						attempts++;
						setTimeout(tryScroll, 100);
					}
				};
				tryScroll();
			}
		} catch (e: any) {
			scholarshipStrategyError = e.message || 'Failed to generate strategy';
		} finally {
			isGeneratingScholarshipStrategy = {
				...isGeneratingScholarshipStrategy,
				[scholarship.id]: false
			};
		}
	}

	function toggleBookmark(sId: string) {
		// Mock toggle for now or emit event - user wants to see specifically what's saved
		console.log('Toggling bookmark for:', sId);
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

	const integratedTimeline = $derived.by(() => {
		if (!selectedProgram) return [];

		// 1. Sort program steps strictly by step_number
		let programSteps = normalizeTimelineSteps(selectedProgram.application_steps).map((s, i) => ({
			...s,
			originalIndex: i
		}));

		programSteps.sort((a, b) => {
			const numA = typeof a.step_number === 'number' ? a.step_number : a.originalIndex;
			const numB = typeof b.step_number === 'number' ? b.step_number : b.originalIndex;
			return numA - numB;
		});

		// 2. Prepare scholarship steps
		let scholarshipSteps: any[] = [];
		if (matchingScholarships && matchingScholarships.length > 0) {
			matchingScholarships.forEach((s: any) => {
				if (s.deadline) {
					scholarshipSteps.push({
						is_mandatory: false,
						step_number: '$$',
						title: `Apply for ${s.title}`,
						description: `Matched scholarship from ${s.provider}. Maximize your funding (${s.amount}).`,
						deadline: s.deadline,
						estimated_month: new Date(s.deadline).toLocaleDateString('en-US', {
							month: 'short',
							year: 'numeric'
						}),
						is_scholarship: true,
						scholarship_id: s.id
					});
				}
			});
		}

		// Sort scholarships by date natively
		scholarshipSteps.sort(
			(a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
		);

		// 3. Interleave them using an Academic Year approach (Sept = month 1, Aug = month 12)
		function getAcademicMonth(textData: string) {
			const t = textData.toLowerCase();
			if (t.includes('sep')) return 1;
			if (t.includes('oct')) return 2;
			if (t.includes('nov')) return 3;
			if (t.includes('dec')) return 4;
			if (t.includes('jan')) return 5;
			if (t.includes('feb')) return 6;
			if (t.includes('mar')) return 7;
			if (t.includes('apr')) return 8;
			if (t.includes('may')) return 9;
			if (t.includes('jun')) return 10;
			if (t.includes('jul')) return 11;
			if (t.includes('aug')) return 12;
			return 999;
		}

		let finalTimeline: any[] = [];
		let pIndex = 0;
		let sIndex = 0;

		while (pIndex < programSteps.length && sIndex < scholarshipSteps.length) {
			const pText =
				(programSteps[pIndex].estimated_month || '') + ' ' + (programSteps[pIndex].deadline || '');
			const pMonth = getAcademicMonth(pText);

			const sDateRaw = new Date(scholarshipSteps[sIndex].deadline).getMonth(); // 0 = Jan, 8 = Sept
			const sMonth = sDateRaw >= 8 ? sDateRaw - 7 : sDateRaw + 5; // Convert strictly to Academic cycle mapping

			if (sMonth <= pMonth) {
				finalTimeline.push(scholarshipSteps[sIndex]);
				sIndex++;
			} else {
				finalTimeline.push(programSteps[pIndex]);
				pIndex++;
			}
		}

		// Push remaining
		while (sIndex < scholarshipSteps.length) finalTimeline.push(scholarshipSteps[sIndex++]);
		while (pIndex < programSteps.length) finalTimeline.push(programSteps[pIndex++]);

		return finalTimeline;
	});

	// Auto-select program based on server hint — handled entirely in onMount below

	function buildDocuments(prog: any, savedWorkspace?: any) {
		// Linked AI documents (new model) — which of the user's generated/uploaded
		// documents are tied to this specific program.
		linkedDocuments = savedWorkspace?.linked_documents ?? {};

		// Supporting documents checklist (transcripts, language cert, etc.)
		if (savedWorkspace?.supporting_docs?.length) {
			supportingDocs = savedWorkspace.supporting_docs;
		} else {
			supportingDocs = defaultSupportingDocs(prog);
		}

		// Legacy documents slot — kept for backwards compatibility with any
		// existing saved workspaces. Not used in the new Documents tab.
		if (savedWorkspace?.documents?.length) {
			documents = savedWorkspace.documents;
		} else {
			documents = [];
		}
	}

	async function syncWorkspace() {
		if (!session?.user?.id || !selectedProgramId || !selectedProgram) return;
		isSavingWorkspace = true;
		await setProgramStatus(supabase, session.user.id, selectedProgramId, 'strategy', undefined, {
			documents,
			linked_documents: linkedDocuments,
			supporting_docs: supportingDocs
		});
		isSavingWorkspace = false;
	}

	// Link an existing document to this program
	async function linkDocument(key: LinkedDocKey, docId: string) {
		linkedDocuments = { ...linkedDocuments, [key]: docId };
		await syncWorkspace();
	}

	// Unlink a document from this program
	async function unlinkDocument(key: LinkedDocKey) {
		const next = { ...linkedDocuments };
		delete next[key];
		linkedDocuments = next;
		await syncWorkspace();
	}

	// Toggle supporting doc ready state
	async function toggleSupportingDoc(id: string) {
		supportingDocs = supportingDocs.map((d) => (d.id === id ? { ...d, ready: !d.ready } : d));
		await syncWorkspace();
	}

	// Documents the user has created/uploaded, grouped by type
	const userDocsByType = $derived.by(() => {
		const map: Record<string, any[]> = { sop: [], 'cover-letter': [], 'personal-statement': [] };
		for (const d of userDocuments) {
			if (map[d.type]) map[d.type].push(d);
		}
		return map;
	});

	// Get the linked document details (name, word count) for display
	function getLinkedDoc(key: LinkedDocKey) {
		const id = linkedDocuments[key];
		if (!id) return null;
		return userDocuments.find((d: any) => d.id === id) ?? null;
	}

	function selectProgram(programId: string, workspaceData?: any) {
		selectedProgramId = programId;
		const prog = trackedPrograms.find((p: any) => p.program?.id === programId)?.program;
		buildDocuments(prog, workspaceData);
		if (prog) fetchMatchingScholarships(prog);
	}

	// ── Per-user personal bonus re-ranking ──────────────────────────────────
	// Applied on top of the precomputed base score at request time.
	// Keeps the DB query cheap (still reads top-5 precomputed rows) while
	// surfacing the most personally relevant scholarship first.
	//
	// Bonus signals (additive, max +30):
	//   +15  nationality matches scholarship nationality_restrictions (or open)
	//   +10  user GPA meets or exceeds scholarship min_gpa
	//   +5   user IELTS meets or exceeds scholarship min_ielts
	function personalBonus(s: any): number {
		if (!profile) return 0;
		let bonus = 0;

		// Nationality: +15 if open (no restrictions) or user nationality is listed
		const restrictions: string[] = Array.isArray(s.nationality_restrictions)
			? s.nationality_restrictions
			: [];
		if (restrictions.length === 0) {
			bonus += 15;
		} else if (profile.nationality) {
			const nat = profile.nationality.toLowerCase();
			if (restrictions.some((r: string) => r.toLowerCase().includes(nat) || nat.includes(r.toLowerCase()))) {
				bonus += 15;
			}
		}

		// GPA: +10 if user GPA meets minimum (or no minimum set)
		if (!s.min_gpa) {
			bonus += 10;
		} else if (profile.gpa && Number(profile.gpa) >= Number(s.min_gpa)) {
			bonus += 10;
		} else if (profile.gpa && Number(s.min_gpa) > 0) {
			// Partial: proportional to how close they are (max +7)
			bonus += Math.round((Number(profile.gpa) / Number(s.min_gpa)) * 7);
		}

		// IELTS: +5 if user score meets minimum (or no minimum set)
		if (!s.min_ielts) {
			bonus += 5;
		} else if (profile.ielts_score && Number(profile.ielts_score) >= Number(s.min_ielts)) {
			bonus += 5;
		}

		return bonus;
	}

	// ── Match badge helpers (mirrors logic in programs/[id]/+page.svelte) ──
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

	async function fetchMatchingScholarships(prog: any) {
		if (!supabase) return;
		isLoadingScholarships = true;
		const today = new Date().toISOString().slice(0, 10);

		// 1. Prefer precomputed matches from program_scholarship_matches
		const { data: matches, error: matchError } = await supabase
			.from('public_program_scholarship_matches')
			.select('*')
			.eq('program_id', prog.id)
			.order('rank_in_program', { ascending: true })
			.limit(3);

		if (!matchError && matches && matches.length > 0) {
			// Shape the precomputed match rows
			const shaped = matches.map((m: any) => ({
				id: m.scholarship_id,
				title: m.scholarship_title,
				provider: m.scholarship_provider,
				amount: m.scholarship_amount,
				deadline: m.scholarship_deadline,
				location: m.scholarship_location,
				type: m.scholarship_type,
				website: m.scholarship_website,
				level: m.scholarship_level,
				field: m.scholarship_field,
				funding_category: m.funding_category,
				description: m.scholarship_description,
				matchScore: m.score,
				match_rules: m.match_rules,
				covers: m.covers
			}));

			// Fetch the personal-bonus fields (nationality_restrictions, min_gpa,
			// min_ielts) for these specific scholarships — one tiny query.
			if (profile) {
				const ids = shaped.map((s: any) => s.id);
				const { data: extras } = await supabase
					.from('scholarships')
					.select('id, nationality_restrictions, min_gpa, min_ielts')
					.in('id', ids);
				if (extras) {
					const extrasMap = Object.fromEntries(extras.map((e: any) => [e.id, e]));
					for (const s of shaped) {
						const ex = extrasMap[s.id];
						if (ex) {
							s.nationality_restrictions = ex.nationality_restrictions;
							s.min_gpa = ex.min_gpa;
							s.min_ielts = ex.min_ielts;
						}
					}
				}
			}

			// Re-rank by base score + personal bonus (in-memory, no extra DB round-trip)
			matchingScholarships = shaped
				.map((s: any) => ({ ...s, _personalScore: s.matchScore + personalBonus(s) }))
				.sort((a: any, b: any) => b._personalScore - a._personalScore);
			isLoadingScholarships = false;
			return;
		}

		// 2. No legacy fallback — if precomputed matches return zero, show nothing.
		// The old broad-country fallback was showing scholarships from Japan, Kazakhstan,
		// Qatar etc. on European programs. Zero matches is honest.
		matchingScholarships = [];
		isLoadingScholarships = false;
	}

	async function handleSignOut() {
		await supabase.auth.signOut();
		window.location.href = '/';
	}

	// Ã¢â€€Ã¢â€€ Delete Program Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€
	let confirmDeleteId = $state<string | null>(null);
	let docsExpanded = $state(true);

	async function deleteProgram(programId: string) {
		if (!session?.user?.id) return;
		const success = await removeTrackedProgram(supabase, session.user.id, programId);
		if (success) {
			// Reload the page to reflect changes (server re-fetches data)
			window.location.href = '/dashboard';
		}
		confirmDeleteId = null;
	}

	// Ã¢â€€Ã¢â€€ Derived doc lists Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€Ã¢â€€
	const todoDocs = $derived(documents.filter((d) => d.phase === 'not_started'));
	const readyDocs = $derived(documents.filter((d) => d.phase === 'ready'));
	const progressPct = $derived(
		documents.length ? Math.round((readyDocs.length / documents.length) * 100) : 0
	);

	// Server already fetched tracked programs + upserted the incoming programId.
	// On mount we just pick up the selection from the URL (or server fallback)
	// and open the program-detail view.
	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const urlProgramId = urlParams.get('programId');
		const urlScholarshipId = urlParams.get('scholarshipId');

		const targetId = urlProgramId ?? serverSelectedId ?? null;
		if (targetId) {
			const match = (trackedProgramsData || []).find((p: any) => p.program?.id === targetId);
			if (match) {
				selectProgram(targetId, match.workspaceData);
				currentView = 'program-detail';
				// Replace (not push) so the initial load doesn't add an extra history entry
				const url = new URL(window.location.href);
				url.searchParams.set('view', 'program');
				history.replaceState({ view: 'program-detail', id: targetId }, '', url.toString());
			}
		}

		if (urlScholarshipId) {
			detailScholarshipId = urlScholarshipId;
			currentView = 'scholarship-detail';
			const url = new URL(window.location.href);
			url.searchParams.set('view', 'scholarship');
			history.replaceState({ view: 'scholarship-detail', id: urlScholarshipId }, '', url.toString());
		}

		// Handle browser back/forward button
		const handlePopState = (e: PopStateEvent) => {
			const state = e.state as { view?: DashboardView; id?: string } | null;
			if (!state || state.view === 'hub' || !state.view) {
				// Going back to hub — restore hub state without pushing another entry
				currentView = 'hub';
				selectedProgramId = null;
				detailScholarshipId = null;
			} else if (state.view === 'program-detail' && state.id) {
				const match = (trackedProgramsData || []).find((p: any) => p.program?.id === state.id);
				if (match) {
					selectProgram(state.id, match.workspaceData);
					currentView = 'program-detail';
				}
			} else if (state.view === 'scholarship-detail' && state.id) {
				detailScholarshipId = state.id;
				currentView = 'scholarship-detail';
			}
		};

		window.addEventListener('popstate', handlePopState);
		return () => window.removeEventListener('popstate', handlePopState);
	});

	const statsReady = $derived(
		trackedPrograms.filter((p: any) => p.status === 'ready' || p.status === 'submitted').length
	);
</script>

<svelte:head>
	<title>Dashboard | Abroaducate</title>
</svelte:head>

{#if currentView === 'hub'}
<div class="hub-shell">
	<div class="hub-header">
		<div class="hub-header-left"><div class="hub-brand"><div class="hub-brand-icon"><Rocket size={22} /></div><div><h1 class="hub-brand-title">My Study Abroad Hub</h1><p class="hub-brand-sub">Your centralized command center</p></div></div></div>
		<div class="hub-header-right"><a href="/programs" class="hub-action-btn"><PlusCircle size={14} /> Add Program</a><a href="/scholarships" class="hub-action-btn hub-action-secondary"><Award size={14} /> Find Scholarships</a></div>
	</div>

	<!-- Profile completion nudge -->
	{#if (Math.round(([!!inlineGpa && inlineGpa !== '0', !!inlineLevel, !!inlineField, !!inlineNationality, !!inlineTargetLevel, !!inlineIelts && inlineIelts !== '0'].filter(Boolean).length / 6) * 100)) < 100}
	{@const _fields = [
		{ label: 'GPA', filled: !!inlineGpa && inlineGpa !== '0' },
		{ label: 'Current level', filled: !!inlineLevel },
		{ label: 'Field of study', filled: !!inlineField },
		{ label: 'Nationality', filled: !!inlineNationality },
		{ label: 'Target degree', filled: !!inlineTargetLevel },
		{ label: 'IELTS score', filled: !!inlineIelts && inlineIelts !== '0' }
	]}
	{@const _pct = Math.round((_fields.filter(f => f.filled).length / _fields.length) * 100)}
	<div class="profile-nudge">
		<div class="profile-nudge-left">
			<div class="profile-nudge-icon"><User size={16} /></div>
			<div class="profile-nudge-text">
				<span class="profile-nudge-title">Your profile is {_pct}% complete</span>
				<span class="profile-nudge-sub">
					{#if !inlineNationality}Add your nationality to see better scholarship matches.{:else if !inlineGpa || inlineGpa === '0'}Add your GPA to unlock personalised match scores.{:else if !inlineIelts || inlineIelts === '0'}Add your IELTS score for more accurate matching.{:else}Complete your profile for the best match results.{/if}
				</span>
			</div>
		</div>
		<div class="profile-nudge-right">
			<div class="profile-nudge-bar-wrap">
				<div class="profile-nudge-bar" style="width: {_pct}%"></div>
			</div>
			<div class="profile-nudge-pills">
				{#each _fields as f}
					<span class="profile-nudge-pill {f.filled ? 'pill-done' : 'pill-todo'}">{f.label}</span>
				{/each}
			</div>
		</div>
		<button class="profile-nudge-cta" onclick={scrollToFootprint}>
			Complete profile <ArrowRight size={13} />
		</button>
	</div>
	{/if}
	<div class="hub-section"><div class="hub-section-header"><h2 class="hub-section-title"><FolderOpen size={18} class="text-orange-500" /> My Programs</h2><span class="hub-section-count">{trackedPrograms.length}</span></div>{#if trackedPrograms.length > 0}<div class="hub-card-grid">{#each trackedPrograms as tp}<button class="hub-card hub-card-program" onclick={() => goToProgramDetail(tp.program.id)}><div class="hub-card-top"><span class="hub-card-badge badge-program">{tp.program.country}</span><span class="hub-card-status">{tp.status}</span></div><h3 class="hub-card-title">{tp.program.program_name}</h3><p class="hub-card-sub">{tp.program.university_name}</p><div class="hub-card-footer"><span class="hub-card-meta">Tuition: €{tp.program.tuition_per_semester || 0}/sem</span><span class="hub-card-action">Open <ArrowRight size={12} /></span></div></button>{/each}<a href="/programs" class="hub-card hub-card-add"><PlusCircle size={24} class="text-slate-300" /><span class="hub-card-add-text">Add Program</span></a></div>{:else}<div class="hub-empty"><FolderOpen size={32} class="text-slate-300 mx-auto mb-2" /><p class="hub-empty-title">No programs tracked yet</p><p class="hub-empty-sub">Find programs to start building your strategy.</p><a href="/programs" class="hub-empty-cta"><PlusCircle size={14} /> Find Programs</a></div>{/if}</div>
	<div class="hub-section"><div class="hub-section-header"><h2 class="hub-section-title"><Award size={18} class="text-indigo-500" /> My Scholarships</h2><span class="hub-section-count">{allHubScholarships.length}</span></div>{#if allHubScholarships.length > 0}<div class="hub-card-grid">{#each allHubScholarships as s}<button class="hub-card hub-card-scholarship" onclick={() => goToScholarshipDetail(s.id)}><div class="hub-card-top">{#if s.hasStrategy}<span class="hub-card-badge badge-unlocked"><Zap size={10} fill="currentColor" /> Strategy</span>{:else}<span class="hub-card-badge badge-saved"><BookOpen size={10} /> Saved</span>{/if}{#if s.amount}<span class="hub-card-amount">{s.amount}</span>{/if}</div><h3 class="hub-card-title">{s.title}</h3><p class="hub-card-sub">{s.provider}</p><div class="hub-card-footer"><span class="hub-card-action">{s.hasStrategy ? 'View Strategy' : 'Details'} <ArrowRight size={12} /></span></div></button>{/each}<a href="/scholarships" class="hub-card hub-card-add"><Award size={24} class="text-slate-300" /><span class="hub-card-add-text">Find Scholarships</span></a></div>{:else}<div class="hub-empty"><Award size={32} class="text-slate-300 mx-auto mb-2" /><p class="hub-empty-title">No scholarships yet</p><a href="/scholarships" class="hub-empty-cta"><Award size={14} /> Browse Scholarships</a></div>{/if}</div>
	<!-- My Documents section -->
	<div class="hub-section">
		<div class="hub-section-header">
			<h2 class="hub-section-title"><FileText size={18} class="text-emerald-500" /> My Documents</h2>
			<span class="hub-section-count">{userDocuments.length}</span>
		</div>

		<!-- Generate new document cards — always visible -->
		<div class="hub-generate-row">
			<p class="hub-generate-label">Generate a new document</p>
			<div class="hub-generate-grid">
				<a href="/sop" class="hub-generate-card">
					<div class="hub-generate-icon" style="background:#fff7ed;color:#ea580c;"><ScrollText size={18} strokeWidth={2} /></div>
					<span class="hub-generate-name">Statement of Purpose</span>
					<span class="hub-generate-hint">SOP / Personal Essay</span>
				</a>
				<a href="/cover-letters" class="hub-generate-card">
					<div class="hub-generate-icon" style="background:#f0fdf4;color:#16a34a;"><Mail size={18} strokeWidth={2} /></div>
					<span class="hub-generate-name">Cover Letter</span>
					<span class="hub-generate-hint">For programs & professors</span>
				</a>
				<a href="/personal-statements" class="hub-generate-card">
					<div class="hub-generate-icon" style="background:#eff6ff;color:#2563eb;"><PenLine size={18} strokeWidth={2} /></div>
					<span class="hub-generate-name">Personal Statement</span>
					<span class="hub-generate-hint">Scholarship & admission</span>
				</a>
				<a href="/academic-cv" class="hub-generate-card">
					<div class="hub-generate-icon" style="background:#faf5ff;color:#7c3aed;"><GraduationCap size={18} strokeWidth={2} /></div>
					<span class="hub-generate-name">CV Templates</span>
					<span class="hub-generate-hint">Free European CV templates</span>
				</a>
				<button type="button" onclick={() => (showAddDocModal = true)} class="hub-generate-card hub-generate-add" style="cursor:pointer;border-style:dashed;">
					<div class="hub-generate-icon" style="background:#f1f5f9;color:#475569;"><FileText size={18} strokeWidth={2} /></div>
					<span class="hub-generate-name">Add existing document</span>
					<span class="hub-generate-hint">Paste SOP, CV, or cover letter</span>
				</button>
			</div>
		</div>

		<!-- Existing documents -->
		{#if userDocuments.length > 0}
			<p class="hub-generate-label" style="margin-top:1.25rem;">Your documents</p>
			<div class="hub-card-grid">
				{#each userDocuments as doc}
					{@const editUrl = doc.type === 'sop'
						? `/sop/${doc.id}`
						: doc.type === 'cover-letter'
						? `/cover-letters/${doc.id}`
						: doc.type === 'academic-cv'
						? `/academic-cv/${doc.id}`
						: `/personal-statements/${doc.id}`}
					<a href={editUrl} class="hub-card hub-card-doc">
						<div class="hub-card-top">
							<span class="hub-card-badge badge-doc">{doc.icon} {doc.typeName}</span>
							<span class="hub-card-status">{doc.status || 'draft'}</span>
						</div>
						<h3 class="hub-card-title">{doc.university_name || 'Untitled'}</h3>
						<p class="hub-card-sub">{doc.program_name || doc.typeName}</p>
						<div class="hub-card-footer">
							<span class="hub-card-meta">{doc.word_count || 0} words</span>
							<span class="hub-card-action">Edit <ArrowRight size={12} /></span>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
{:else if currentView === 'scholarship-detail'}
<div class="hub-shell">
	<button onclick={goToHub} class="hub-back-btn"><ChevronLeft size={16} /> Back to Hub</button>
	{#if detailScholarship}
		<div class="scholarship-detail-header"><div class="sd-icon"><Award size={28} /></div><div><h1 class="sd-title">{detailScholarship.title}</h1><p class="sd-provider">{detailScholarship.provider || ''}</p>{#if detailScholarship.amount}<span class="sd-amount">{detailScholarship.amount}</span>{/if}</div></div>
		{#if detailScholarshipStrategy}
			<div style="margin-top:1.5rem">
				<!-- Summary banner -->
				<div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6">
					<div class="flex items-center justify-between mb-3">
						<span class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-white border border-emerald-200 rounded-full px-3 py-1"><Zap size={11} fill="currentColor" /> Clarity Engine Strategy</span>
						<button class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors" onclick={() => initiateScholarshipStrategyGeneration(detailScholarship)}>
							<RefreshCw size={12} class={isGeneratingScholarshipStrategy[detailScholarship.id] ? "animate-spin" : ""} />
							Regenerate
						</button>
					</div>
					<p class="text-emerald-900 font-medium leading-relaxed">{detailScholarshipStrategy.summary}</p>
				</div>

				<!-- Accordion Tabs -->
				<div class="flex gap-1 mb-4 border-b border-slate-200 pb-0">
					<button
						onclick={() => detailStrategyTab = 'overview'}
						class="px-4 py-2.5 text-sm font-bold rounded-t-lg border-b-2 transition-all {detailStrategyTab === 'overview' ? 'text-orange-600 border-orange-500 bg-orange-50' : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50'}"
					>Overview</button>
					<button
						onclick={() => detailStrategyTab = 'audit'}
						class="px-4 py-2.5 text-sm font-bold rounded-t-lg border-b-2 transition-all {detailStrategyTab === 'audit' ? 'text-emerald-600 border-emerald-500 bg-emerald-50' : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50'}"
					>Document Audit</button>
					<button
						onclick={() => detailStrategyTab = 'action'}
						class="px-4 py-2.5 text-sm font-bold rounded-t-lg border-b-2 transition-all {detailStrategyTab === 'action' ? 'text-blue-600 border-blue-500 bg-blue-50' : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50'}"
					>Action Path</button>
				</div>

				<div class="animate-in fade-in duration-200">
					{#if detailStrategyTab === 'overview'}
						<div class="space-y-5">
							{#if detailScholarshipStrategy.rubric?.length > 0}
								<div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
									<div class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-4">Committee Rubric</div>
									<div class="space-y-4">
										{#each detailScholarshipStrategy.rubric as item}
											<div>
												<div class="flex justify-between items-start mb-1">
													<div class="font-bold text-sm text-slate-800">{item.label}</div>
													<span class="text-[10px] font-bold uppercase tracking-wider text-orange-500">{item.weight === 3 ? 'High' : item.weight === 2 ? 'Med' : item.weight === 1 ? 'Low' : '–'}</span>
												</div>
												<div class="text-slate-500 text-[13px] leading-snug mb-2">{item.reason}</div>
												<div class="flex gap-1">
													{#each [1,2,3] as w}
														<div class="h-1.5 flex-1 rounded-full border border-black/5 {item.weight >= w ? item.weight === 3 ? 'bg-emerald-500' : item.weight === 2 ? 'bg-amber-400' : 'bg-rose-400' : 'bg-slate-100'}"></div>
													{/each}
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>

					{:else if detailStrategyTab === 'audit'}
						<div class="space-y-4">
							{#if detailScholarshipStrategy.document_audit?.length > 0}
								<div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
									<div class="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 mb-4">Document Insights</div>
									<ul class="space-y-3">
										{#each detailScholarshipStrategy.document_audit as insight}
											<li class="flex items-start gap-2 text-[13px] text-emerald-900 border-l-2 border-emerald-400 pl-3 py-0.5">{insight}</li>
										{/each}
									</ul>
								</div>
							{:else}
								<p class="text-slate-400 text-sm italic">No document was linked during strategy generation. <a href="/scholarships/{detailScholarship.id}" class="text-orange-500 underline">Re-generate with a document</a> for a deep audit.</p>
							{/if}
							{#if detailScholarshipStrategy.narrative_angles?.length > 0}
								<div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
									<div class="text-[10px] font-extrabold uppercase tracking-widest text-indigo-500 mb-4">SOP Narrative Angles</div>
									<ul class="space-y-3">
										{#each detailScholarshipStrategy.narrative_angles as angle}
											<li class="p-3 bg-indigo-50/60 rounded-xl text-[13px] font-medium text-indigo-900 border border-indigo-100 leading-relaxed">"{angle}"</li>
										{/each}
									</ul>
								</div>
							{/if}
						</div>

					{:else if detailStrategyTab === 'action'}
						<div class="space-y-4">
							{#if detailScholarshipStrategy.top_actions?.length > 0}
								<div class="bg-blue-50 border border-blue-200 rounded-2xl p-5">
									<div class="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 mb-4">Chronological Action Path</div>
									<ol class="space-y-3">
										{#each detailScholarshipStrategy.top_actions as action, i}
											<li class="flex gap-3 text-[13px] text-blue-900">
												<div class="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold mt-0.5">{i+1}</div>
												<span class="leading-relaxed font-medium">{action}</span>
											</li>
										{/each}
									</ol>
								</div>
							{/if}
							{#if detailScholarshipStrategy.red_flags?.length > 0}
								<div class="bg-rose-50 border border-rose-200 rounded-2xl p-5">
									<div class="text-[10px] font-extrabold uppercase tracking-widest text-rose-600 mb-4">Risks to Bridge</div>
									<ul class="space-y-2">
										{#each detailScholarshipStrategy.red_flags as flag}
											<li class="flex items-start gap-2 text-[13px] text-rose-900">
												<AlertTriangle size={13} class="text-rose-500 mt-0.5 flex-shrink-0" />
												<span class="leading-snug">{flag}</span>
											</li>
										{/each}
									</ul>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<div class="hub-empty" style="margin-top:2rem"><Lock size={32} class="text-slate-300 mx-auto mb-2" /><p class="hub-empty-title">No strategy generated yet</p><p class="hub-empty-sub">Visit the scholarship page to generate a personalized strategy.</p><a href="/scholarships/{detailScholarship.id}" class="hub-empty-cta"><Zap size={14} /> Go to Scholarship Page</a></div>
		{/if}

		<!-- Document Studio for Scholarship Applications -->
		<div class="s-card docs-card" style="margin-top:1.5rem">
			<div class="docs-toggle" style="cursor:default;pointer-events:none">
				<h3 class="sc-title">
					<FileText size={18} class="text-indigo-500" />
					Application Documents
					<span class="docs-badge">Scholarship</span>
				</h3>
			</div>
			<p class="docs-desc">Ready to apply? Use our generators to draft the documents this scholarship needs.</p>
			<div class="docs-grid" style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))">
				<div class="doc-item">
					<div class="doc-top"><span class="doc-name" style="display:flex;align-items:center;gap:0.375rem;"><ScrollText size={14} /> Statement of Purpose</span></div>
					<div class="doc-actions">
						<a href="/sop?scholarshipId={detailScholarship?.id}" class="doc-gen-btn flex items-center gap-1">Generate <ArrowRight size={14} /></a>
					</div>
				</div>
				<div class="doc-item">
					<div class="doc-top"><span class="doc-name" style="display:flex;align-items:center;gap:0.375rem;"><Mail size={14} /> Cover Letter</span></div>
					<div class="doc-actions">
						<a href="/cover-letters?scholarshipId={detailScholarship?.id}" class="doc-gen-btn flex items-center gap-1">Generate <ArrowRight size={14} /></a>
					</div>
				</div>
				<div class="doc-item">
					<div class="doc-top"><span class="doc-name" style="display:flex;align-items:center;gap:0.375rem;"><PenLine size={14} /> Personal Statement</span></div>
					<div class="doc-actions">
						<a href="/personal-statements?scholarshipId={detailScholarship?.id}" class="doc-gen-btn flex items-center gap-1">Generate <ArrowRight size={14} /></a>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
{:else if currentView === 'program-detail'}
<div class="hub-shell">
	<button onclick={goToHub} class="hub-back-btn"><ChevronLeft size={16} /> Back to Hub</button>

	<!-- ── MAIN CONTENT ── -->
	<div data-dash-main>
		{#if !selectedProgram}
			<div class="main-empty">
				<Plane size={32} class="text-slate-300 mx-auto mb-2" />
				<h3 class="main-empty-title">Select a Program</h3>
				<p class="main-empty-sub">
					Choose a program from your tracked list to view its strategy timeline, tracking, and
					resources.
				</p>
				<a href="/programs" class="main-empty-cta">Find Programs <ArrowRight size={16} /></a>
			</div>
		{:else}
			<!-- Program Header & Tabs Layout -->
			<div class="flex flex-col xl:flex-row gap-6 mt-4">
				
				<!-- LEFT COLUMN (Main Content) -->
				<div class="flex-1 min-w-0">
					<!-- Program Header -->
					<div class="bg-slate-900 rounded-3xl p-6 text-white mb-6 relative overflow-hidden shadow-xl shadow-slate-900/10">
						<div class="absolute -top-10 -right-10 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl"></div>
						<div class="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
						
						<div class="relative z-10 flex flex-col md:flex-row justify-between items-start gap-4">
							<div class="flex-1">
								<div class="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase tracking-widest mb-3 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
									<MapPin size={12}/> {selectedProgram.country} &middot; {selectedProgram.city}
								</div>
								<h2 class="text-3xl font-extrabold mb-2 leading-tight">{selectedProgram.program_name}</h2>
								<div class="text-slate-300 font-medium text-lg">{selectedProgram.university_name}</div>
							</div>
							
							<div class="text-left md:text-right flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-0 w-full md:w-auto">
								<span class="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-slate-200 mb-0 md:mb-3 border border-white/10">
									{#if isSavingWorkspace}
										<RefreshCw size={10} class="animate-spin"/> Saving...
									{:else}
										<Check size={10}/> Synced
									{/if}
								</span>
								<a href={selectedProgram.official_source_url || selectedProgram.direct_application_url || '#'} target="_blank" rel="noopener" class="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5">
									Official Site <ExternalLink size={14} />
								</a>
							</div>
						</div>
					</div>

					<!-- Cost Strip -->
					<div class="flex flex-wrap gap-0 bg-white border border-slate-200 rounded-2xl p-2 mb-6 shadow-sm overflow-hidden">
						<div class="flex-1 min-w-[140px] p-4 bg-slate-50/50 rounded-xl m-1 border border-slate-100">
							<div class="text-[10px] flex items-center gap-1.5 uppercase font-bold text-slate-400 tracking-wider mb-1"><Target size={12}/> Tuition</div>
							<div class="text-emerald-600 font-extrabold text-lg">€{selectedProgram.tuition_per_semester || 0}<span class="text-xs font-bold text-emerald-600/60 uppercase">/sem</span></div>
						</div>
						<div class="flex-1 min-w-[140px] p-4 m-1">
							<div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Semester Fee</div>
							<div class="text-slate-700 font-bold text-lg">€{selectedProgram.semester_fee || 0}<span class="text-xs text-slate-400">/sem</span></div>
						</div>
						<div class="flex-1 min-w-[140px] p-4 m-1">
							<div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">App Fee</div>
							<div class="text-slate-700 font-bold text-lg">€{selectedProgram.application_fee || 0}</div>
						</div>
						<div class="flex-1 min-w-[140px] p-4 bg-orange-50/50 rounded-xl m-1 border border-orange-100">
							<div class="text-[10px] flex items-center gap-1.5 uppercase font-bold text-orange-600/70 tracking-wider mb-1"><Zap size={12}/> Est. Living</div>
							<div class="text-orange-700 font-extrabold text-lg">€{selectedProgram.living_cost_per_month || 0}<span class="text-xs font-bold text-orange-700/60 uppercase">/mo</span></div>
						</div>
					</div>

					<!-- Tabs -->
					<div class="flex flex-wrap gap-2 mb-6">
						<button onclick={() => programDetailTab = 'timeline'} class="px-5 py-3 font-bold text-sm rounded-xl transition-all border {programDetailTab === 'timeline' ? 'text-indigo-600 border-indigo-200 bg-indigo-50 shadow-sm' : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-100'} flex items-center gap-2">
							<Target size={16}/> Application Timeline
						</button>
						<button onclick={() => programDetailTab = 'scholarships'} class="px-5 py-3 font-bold text-sm rounded-xl transition-all border {programDetailTab === 'scholarships' ? 'text-emerald-600 border-emerald-200 bg-emerald-50 shadow-sm' : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-100'} flex items-center gap-2">
							<Award size={16}/> Scholarships Radar
						</button>
						<button onclick={() => programDetailTab = 'documents'} class="px-5 py-3 font-bold text-sm rounded-xl transition-all border {programDetailTab === 'documents' ? 'text-blue-600 border-blue-200 bg-blue-50 shadow-sm' : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-100'} flex items-center gap-2">
							<FileText size={16}/> Documents
						</button>
					</div>

					<!-- TAB CONTENT -->
					<div class="animate-in fade-in duration-300 relative z-10">
						
						<!-- TIMELINE TAB -->
						{#if programDetailTab === 'timeline'}
							<div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
								<div class="mb-8 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-4">
									<div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 flex-shrink-0">
										<Target size={20} />
									</div>
									<div>
										<h4 class="text-sm font-bold text-indigo-900 mb-1">Standard Pathway</h4>
										<p class="text-sm text-indigo-700/80 leading-relaxed">
											{selectedProgram.funding_pathway_explanation || 'Follow the chronological steps below to maximize your chances. Your tracked scholarship deadlines are automatically injected into this timeline.'}
										</p>
									</div>
								</div>

								<div class="timeline ml-4">
									{#if integratedTimeline.length > 0}
										{#each integratedTimeline as step, index}
											<div class="tl-step {step.is_scholarship ? 'tl-step-scholarship' : ''}">
												<div
													class="tl-dot {step.is_scholarship
														? 'tl-dot-scholarship'
														: step.is_mandatory
															? 'tl-dot-required'
															: 'tl-dot-optional'}"
												>
													{#if step.is_scholarship}
														<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /></svg>
													{:else}
														<span>{step.step_number || index + 1}</span>
													{/if}
												</div>
												<div class="tl-content">
													<div class="tl-month">{step.estimated_month || ''}</div>
													<h4 class="tl-title">{step.title}</h4>
													<p class="tl-desc">{step.description}</p>
													
													{#if step.is_scholarship && step.scholarship_id}
														<button 
															onclick={() => {
																programDetailTab = 'scholarships';
																const s = matchingScholarships.find(m => m.id === step.scholarship_id) || savedScholarships.find((ss:any) => ss.id === step.scholarship_id);
																if (s) {
																	activeScholarshipId = s.id;
																	activeScholarshipName = s.title;
																	activeScholarshipStrategy = manuallyUnlockedStrategies[s.id] || profile?.workspace_data?.scholarship_strategies?.[s.id];
																}
															}}
															class="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-lg hover:bg-emerald-50 hover:border-emerald-300 transition-colors uppercase tracking-widest"
														>
															<Zap size={10} fill="currentColor"/> View Scholarship
														</button>
													{/if}
												</div>
											</div>
										{/each}
									{:else}
										<div class="text-slate-400 text-sm italic py-8 text-center">No timeline steps available.</div>
									{/if}
								</div>
							</div>

						<!-- SCHOLARSHIPS TAB -->
						{:else if programDetailTab === 'scholarships'}
							<div class="space-y-6">
								<!-- Radar Matches -->
								<div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
									<div class="flex items-center gap-2 mb-2">
										<Zap size={20} class="text-emerald-500" strokeWidth={2.5} />
										<h4 class="text-lg font-extrabold text-slate-900">Scholarship Radar</h4>
									</div>
									<p class="text-sm text-slate-500 mb-6 max-w-xl">
										We found these matching funds based on your target level and field. Unlock a strategy to see how you stack up.
									</p>

									{#if scholarshipStrategyError}
										<div class="text-sm text-rose-600 mb-6 font-bold bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-3">
											<AlertTriangle size={16}/> {scholarshipStrategyError}
										</div>
									{/if}

									{#if isLoadingScholarships}
										<div class="flex items-center justify-center py-12">
											<div class="w-8 h-8 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
										</div>
									{:else if matchingScholarships.length > 0}
										<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
											{#each matchingScholarships as s}
										{@const isActive = activeScholarshipId === s.id}
										{@const isCached = unlockedScholarships.some((u) => u.id === s.id)}
										{@const fit = matchPercent(s._personalScore ?? s.matchScore) ?? (s._personalScore ?? s.matchScore)}
										{@const covers = coversLabel(s.covers)}
										{@const rules = ruleLabels(s.match_rules)}
										<div
											class="border rounded-2xl p-5 flex flex-col transition-all {isActive
												? 'border-emerald-500 bg-emerald-50/50 shadow-md shadow-emerald-500/10'
												: 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-lg hover:shadow-slate-200/50'}"
										>
											<div class="flex justify-between items-start mb-3 gap-2">
												<span
													class="px-2 py-1 rounded-md text-[10px] font-extrabold tracking-widest uppercase {fit >= 80
														? 'bg-emerald-100 text-emerald-700'
														: fit >= 60
															? 'bg-amber-100 text-amber-700'
															: 'bg-rose-100 text-rose-700'}"
													title={rules.length > 0 ? `Match: ${rules.join(', ')}` : undefined}
												>{fit}% Match</span>
												<span class="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">{formatCurrencyAmount(s.amount)}</span>
										</div>
										<h5 class="text-sm font-bold text-slate-900 mb-1 leading-tight">{decodeHtmlEntities(s.title)}</h5>
										<p class="text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-wider">{decodeHtmlEntities(s.provider)}</p>
											{#if covers || rules.length > 0}
												<div class="flex flex-wrap gap-1 mb-4">
													{#if covers}
														<span class="inline-flex items-center px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-semibold rounded">
															{covers}
														</span>
													{/if}
													{#each rules as rule}
														<span class="inline-flex items-center px-2 py-0.5 bg-slate-50 border border-slate-100 text-slate-600 text-[10px] font-medium rounded">
															{rule}
														</span>
													{/each}
												</div>
											{:else}
												<div class="flex-1"></div>
											{/if}

													{#if isActive && activeScholarshipStrategy}
														<div class="w-full py-2.5 bg-emerald-600 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 shadow-sm">
															<CheckCircle2 size={14} /> Unlocked Below
														</div>
													{:else}
														<button
															class="w-full py-2.5 bg-white border-2 border-slate-200 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-2 {isActive && !isProfileReady ? 'border-orange-400 bg-orange-50 text-orange-700' : ''}"
															onclick={() => {
																if (isCached) {
																	activeScholarshipId = s.id;
																	activeScholarshipName = s.title;
																	activeScholarshipStrategy = manuallyUnlockedStrategies[s.id] || profile?.workspace_data?.scholarship_strategies?.[s.id];
																} else {
																	generateScholarshipStrategy(s);
																}
															}}
															disabled={isGeneratingScholarshipStrategy[s.id]}
														>
															{#if isGeneratingScholarshipStrategy[s.id]}
																<RefreshCw size={14} class="animate-spin" />
																<span class="animate-pulse">Loading...</span>
															{:else}
																<Zap size={14} fill={isCached ? 'currentColor' : 'none'} class="text-emerald-500" />
																{isCached ? 'View Strategy' : 'Reveal (1 Credit)'}
															{/if}
														</button>
													{/if}
												</div>
											{/each}
										</div>
									{:else}
										<div class="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
											<p class="text-slate-500 font-medium">No matching scholarships found right now.</p>
										</div>
									{/if}
								</div>

								<!-- Active Strategy Detail View -->
								{#if activeScholarshipStrategy}
									<div class="bg-slate-900 rounded-3xl p-6 shadow-2xl shadow-slate-900/20 text-white" id="strategy-result-view">
										<div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
											<h3 class="text-xl font-bold mb-0">{activeScholarshipName}</h3>
											<button onclick={() => activeScholarshipStrategy = null} class="text-xs font-bold text-slate-400 hover:text-white transition-colors bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">Close View</button>
										</div>
										
										<!-- Strategy Tabs -->
										<div class="flex flex-wrap gap-2 mb-6 border-b border-slate-700/50 pb-0">
											<button onclick={() => strategyActiveTab = 'overview'} class="px-5 py-3 font-bold text-sm tracking-wide rounded-t-xl transition-all border-b-2 {strategyActiveTab === 'overview' ? 'text-orange-400 border-orange-500 bg-slate-800/50' : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/30'}">Overview</button>
											<button onclick={() => strategyActiveTab = 'audit'} class="px-5 py-3 font-bold text-sm tracking-wide rounded-t-xl transition-all border-b-2 {strategyActiveTab === 'audit' ? 'text-emerald-400 border-emerald-500 bg-slate-800/50' : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/30'}">Document Audit</button>
											<button onclick={() => strategyActiveTab = 'action'} class="px-5 py-3 font-bold text-sm tracking-wide rounded-t-xl transition-all border-b-2 {strategyActiveTab === 'action' ? 'text-blue-400 border-blue-500 bg-slate-800/50' : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/30'}">Action Path</button>
										</div>

										<div class="animate-in fade-in slide-in-from-bottom-2 duration-300">
											{#if strategyActiveTab === 'overview'}
												<div class="space-y-6">
													<div class="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-6 shadow-inner">
														<div class="flex items-center justify-between mb-3">
															<h3 class="text-[10px] font-bold text-orange-400 uppercase tracking-widest flex items-center gap-1.5"><Zap size={12} fill="currentColor"/> Clarity Engine Assessment</h3>
															<button class="inline-flex items-center gap-1.5 text-[10px] font-bold text-orange-400 hover:text-orange-300 transition-colors uppercase tracking-widest bg-orange-500/20 px-2 py-1 rounded-md" onclick={() => initiateScholarshipStrategyGeneration({id: activeScholarshipId, title: activeScholarshipName})}>
																<RefreshCw size={10} class={activeScholarshipId && isGeneratingScholarshipStrategy[activeScholarshipId] ? "animate-spin" : ""} />
																Regenerate
															</button>
														</div>
														<p class="text-lg text-orange-100 font-medium leading-relaxed">{activeScholarshipStrategy.summary || 'Use this plan to improve your odds.'}</p>
													</div>

													<div class="rounded-2xl border border-slate-700 bg-slate-800 p-6">
														<div class="text-[10px] font-bold text-slate-400 mb-5 uppercase tracking-widest">Committee Rubric</div>
														{#if activeScholarshipStrategy.rubric?.length > 0}
															<div class="space-y-5">
																{#each activeScholarshipStrategy.rubric as item}
																	<div class="group">
																		<div class="flex items-center justify-between gap-3 mb-2">
																			<div class="text-sm font-semibold text-slate-200">{item.label}</div>
																			<div class="text-[10px] font-bold uppercase tracking-widest text-emerald-400">{item.weight === 3 ? 'High' : item.weight === 2 ? 'Medium' : 'Low'}</div>
																		</div>
																		<div class="h-1.5 rounded-full bg-slate-700 overflow-hidden mb-2">
																			<div class="h-full rounded-full bg-emerald-500" style={`width: ${item.weight === 3 ? '100%' : item.weight === 2 ? '66%' : '33%'}`}></div>
																		</div>
																		<p class="text-xs text-slate-400 leading-snug">{item.reason}</p>
																	</div>
																{/each}
															</div>
														{/if}
													</div>
												</div>

											{:else if strategyActiveTab === 'audit'}
												<div class="space-y-6">
													{#if activeScholarshipStrategy.document_audit?.length > 0}
														<div class="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6">
															<h3 class="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-4">Document Insights</h3>
															<ul class="space-y-4">
																{#each activeScholarshipStrategy.document_audit as audit}
																	<li class="flex items-start gap-3 text-emerald-100 text-sm md:text-base leading-relaxed border-l-2 border-emerald-500/50 pl-4 py-1">{audit}</li>
																{/each}
															</ul>
														</div>
													{:else}
														<div class="rounded-2xl border border-slate-700 bg-slate-800 p-6 flex flex-col items-center text-center">
															<FileText size={32} class="text-slate-600 mb-3"/>
															<p class="text-slate-300 font-medium mb-1">No document was analyzed</p>
															<p class="text-slate-500 text-sm max-w-sm mb-4">Generate this strategy again and attach an SOP or CV to get personalized writing feedback.</p>
															<button onclick={() => initiateScholarshipStrategyGeneration({id: activeScholarshipId, title: activeScholarshipName})} class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold text-xs rounded-lg transition-colors shadow-lg shadow-emerald-500/20">
																Re-generate with Document
															</button>
														</div>
													{/if}

													<div class="rounded-2xl border border-slate-700 bg-slate-800 p-6">
														<div class="text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-widest">Narrative Angles to Leverage</div>
														{#if activeScholarshipStrategy.narrative_angles?.length > 0}
															<ul class="space-y-3">
																{#each activeScholarshipStrategy.narrative_angles as angle}
																	<li class="bg-slate-700/50 p-4 rounded-xl border border-slate-600/50 text-slate-200 text-sm leading-relaxed">
																		<span class="text-orange-400 font-extrabold mr-1">»</span> {angle}
																	</li>
																{/each}
															</ul>
														{/if}
													</div>
												</div>

											{:else if strategyActiveTab === 'action'}
												<div class="space-y-6">
													<div class="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-6">
														<div class="text-[10px] font-bold text-blue-400 mb-5 uppercase tracking-widest">Chronological Action Path</div>
														{#if activeScholarshipStrategy.top_actions?.length > 0}
															<ol class="space-y-4">
																{#each activeScholarshipStrategy.top_actions as action, index}
																	<li class="flex gap-4">
																		<div class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-500/20 mt-0.5">{index + 1}</div>
																		<div class="text-blue-50 text-sm md:text-base leading-relaxed pt-0.5">{action}</div>
																	</li>
																{/each}
															</ol>
														{/if}
													</div>
													
													<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
														<div class="rounded-2xl border border-slate-700 bg-slate-800 p-6">
															<div class="text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-widest">Required Evidence</div>
															<ul class="space-y-3">
																{#each activeScholarshipStrategy.evidence || [] as ev}
																	<li class="flex items-start gap-2 text-sm text-slate-300">
																		<Check size={14} class="text-emerald-500 flex-shrink-0 mt-0.5"/>
																		<span class="leading-snug">{ev}</span>
																	</li>
																{/each}
															</ul>
														</div>

														<div class="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6">
															<div class="text-[10px] font-bold text-rose-400 mb-4 uppercase tracking-widest">Risks to Bridge</div>
															<ul class="space-y-3">
																{#each activeScholarshipStrategy.red_flags || [] as rf}
																	<li class="flex items-start gap-2 text-sm text-rose-200">
																		<AlertTriangle size={14} class="text-rose-500 flex-shrink-0 mt-0.5"/>
																		<span class="leading-snug">{rf}</span>
																	</li>
																{/each}
															</ul>
														</div>
													</div>
												</div>
											{/if}
										</div>
									</div>
								{/if}
							</div>

						<!-- DOCUMENTS TAB -->
						{:else if programDetailTab === 'documents'}
							<!-- AI Documents section — linked to this specific program -->
							<div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-5">
								<div class="flex items-center gap-2 mb-1">
									<FileText size={20} class="text-blue-500" strokeWidth={2.5} />
									<h4 class="text-lg font-extrabold text-slate-900">Application Documents</h4>
								</div>
								<p class="text-sm text-slate-500 mb-5">Link your existing documents to this program, or generate new ones tailored to {selectedProgram?.program_name ?? 'this program'}.</p>

								<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
									{#each [
										{ key: 'sop' as LinkedDocKey, label: 'Statement of Purpose', hint: 'SOP / Motivation Letter', href: '/sop', color: '#ea580c', bg: '#fff7ed', iconName: 'sop' },
										{ key: 'cover-letter' as LinkedDocKey, label: 'Cover Letter', hint: 'For program / professor', href: '/cover-letters', color: '#16a34a', bg: '#f0fdf4', iconName: 'cl' },
										{ key: 'personal-statement' as LinkedDocKey, label: 'Personal Statement', hint: 'Scholarship / admission', href: '/personal-statements', color: '#2563eb', bg: '#eff6ff', iconName: 'ps' }
									] as slot}
										{@const linked = getLinkedDoc(slot.key)}
										{@const userDocs = userDocsByType[slot.key] ?? []}
										<div class="border border-slate-200 rounded-2xl p-4 bg-white">
											<div class="flex items-start gap-3 mb-3">
												<div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style="background:{slot.bg};color:{slot.color};">
													{#if slot.iconName === 'sop'}<ScrollText size={18} />
													{:else if slot.iconName === 'cl'}<Mail size={18} />
													{:else if slot.iconName === 'ps'}<PenLine size={18} />
													{:else}<GraduationCap size={18} />
													{/if}
												</div>
												<div class="flex-1 min-w-0">
													<h5 class="font-bold text-slate-900 text-sm">{slot.label}</h5>
													<p class="text-xs text-slate-500">{slot.hint}</p>
												</div>
											</div>

											{#if linked}
												<!-- Linked state -->
												<div class="bg-emerald-50 border border-emerald-100 rounded-lg p-3 mb-3">
													<div class="flex items-center gap-2 mb-1">
														<CheckCircle2 size={14} class="text-emerald-600" />
														<span class="text-xs font-bold text-emerald-700 uppercase tracking-wider">Linked</span>
													</div>
													<p class="text-sm font-semibold text-slate-900 truncate">{linked.program_name || 'Untitled'}</p>
													<p class="text-xs text-slate-500">{linked.word_count || 0} words · {linked.status || 'draft'}</p>
												</div>
												<div class="flex gap-2">
													<a href="/{slot.key === 'sop' ? 'sop' : slot.key === 'cover-letter' ? 'cover-letters' : slot.key === 'personal-statement' ? 'personal-statements' : 'academic-cv'}/{linked.id}" class="flex-1 text-center py-2 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
														Edit
													</a>
													<button onclick={() => unlinkDocument(slot.key)} class="px-3 py-2 text-xs font-bold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
														Unlink
													</button>
												</div>
											{:else if userDocs.length > 0}
												<!-- Pick from existing -->
												<p class="text-xs text-slate-500 mb-2">Link one of your documents:</p>
												<div class="space-y-1.5 mb-3 max-h-32 overflow-y-auto">
													{#each userDocs as d}
														<button onclick={() => linkDocument(slot.key, d.id)} class="w-full text-left px-3 py-2 text-xs border border-slate-200 rounded-md hover:border-orange-300 hover:bg-orange-50 transition-colors">
															<span class="font-semibold text-slate-900 block truncate">{d.program_name || 'Untitled'}</span>
															<span class="text-slate-400">{d.word_count || 0} w · {d.status || 'draft'}</span>
														</button>
													{/each}
												</div>
												<a href="{slot.href}?programId={selectedProgramId}" class="block text-center w-full py-2 text-xs font-bold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
													Or generate new
												</a>
											{:else}
												<!-- Empty — generate button only -->
												<p class="text-xs text-slate-500 mb-3">You don't have any yet.</p>
												<a href="{slot.href}?programId={selectedProgramId}" class="block text-center w-full py-2 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
													Generate new
												</a>
											{/if}
										</div>
									{/each}
								</div>
							</div>

							<!-- Supporting documents checklist -->
							<div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
								<div class="flex items-center gap-2 mb-1">
									<CheckCircle2 size={20} class="text-emerald-500" strokeWidth={2.5} />
									<h4 class="text-lg font-extrabold text-slate-900">Supporting Documents</h4>
								</div>
								<p class="text-sm text-slate-500 mb-5">Physical documents you'll need to upload when applying. Mark them ready as you gather each.</p>

								<div class="space-y-2">
									{#each supportingDocs as doc}
										<label class="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
											<input
												type="checkbox"
												checked={doc.ready}
												onchange={() => toggleSupportingDoc(doc.id)}
												class="w-4 h-4 rounded text-emerald-500 border-slate-300 focus:ring-emerald-500"
											/>
											<span class="text-sm font-semibold text-slate-900 flex-1 {doc.ready ? 'line-through opacity-60' : ''}">{doc.label}</span>
											{#if doc.ready}
												<span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">Ready</span>
											{/if}
										</label>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- RIGHT COLUMN (Sidebar) -->
				<div class="w-full xl:w-80 shrink-0">
					<div class="sticky top-6 space-y-6">
						
						<!-- Profile Match Card -->
						<div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 overflow-hidden relative">
							<div class="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
								<User size={100} />
							</div>
							
							<div class="flex items-center gap-2 mb-6 relative z-10">
								<User size={18} class="text-indigo-500" strokeWidth={2.5} />
								<h3 class="text-sm font-bold text-slate-900 uppercase tracking-widest">Profile Match</h3>
							</div>
							
							{#if isProfileReady}
								<div class="mb-5 relative z-10">
									<div class="flex justify-between text-xs font-bold mb-1.5">
										<span class="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12}/> Complete</span>
										<span class="text-slate-500">100%</span>
									</div>
									<div class="h-2 bg-slate-100 rounded-full overflow-hidden">
										<div class="h-full bg-emerald-500 w-full rounded-full"></div>
									</div>
								</div>
								
								<div class="space-y-3 mb-6 relative z-10">
									<div class="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
										<span class="text-slate-500">Target Level</span>
										<span class="font-bold text-slate-800 text-right truncate max-w-[120px]">{profile?.target_level || profile?.current_education_level || 'N/A'}</span>
									</div>
									<div class="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
										<span class="text-slate-500">Target Field</span>
										<span class="font-bold text-slate-800 text-right truncate max-w-[120px]" title={profile?.field_of_study}>{profile?.field_of_study || 'N/A'}</span>
									</div>
									<div class="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
										<span class="text-slate-500">GPA</span>
										<span class="font-bold text-slate-800">{profile?.gpa || 'N/A'}</span>
									</div>
									<div class="flex justify-between items-center text-sm">
										<span class="text-slate-500">Nationality</span>
										<span class="font-bold text-slate-800 truncate max-w-[120px] text-right">{profile?.nationality || 'N/A'}</span>
									</div>
								</div>
								
								<a href="/profile" class="block w-full py-3 text-center bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all relative z-10">Edit Profile</a>
							{:else}
								<div class="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-4 relative z-10">
									<div class="flex gap-2 mb-2">
										<AlertTriangle size={16} class="text-orange-600 flex-shrink-0 mt-0.5" />
										<p class="text-xs text-orange-900 font-bold">Profile Incomplete</p>
									</div>
									<p class="text-[11px] text-orange-800 leading-relaxed mb-4">We cannot generate accurate scholarship matches or strategies without your academic footprint.</p>
									<a href="/profile" class="inline-flex w-full justify-center items-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-orange-500/20">
										Complete Profile <ArrowRight size={14}/>
									</a>
								</div>
							{/if}
						</div>

						<!-- Quick Actions -->
						<div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
							<h3 class="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Actions</h3>
							<button onclick={() => { confirmDeleteId = selectedProgramId; }} class="w-full py-3 px-4 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-2 border border-transparent hover:border-rose-100">
								<Trash2 size={16} /> Untrack Program
							</button>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
{/if}

<!-- Delete Confirmation Modal -->
{#if confirmDeleteId}
	<div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
		<div class="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl relative overflow-hidden text-center">
			<div class="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
				<AlertTriangle size={32} />
			</div>
			<h3 class="text-xl font-extrabold text-slate-900 mb-2">Untrack Program?</h3>
			<p class="text-sm text-slate-500 mb-8 font-medium">Are you sure you want to remove this program from your dashboard? This action cannot be undone.</p>
			
			<div class="flex flex-col gap-3">
				<button onclick={() => deleteProgram(confirmDeleteId!)} class="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2">
					<Trash2 size={16}/> Yes, Untrack
				</button>
				<button onclick={() => confirmDeleteId = null} class="w-full py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

<StrategyDocumentLinker 
	bind:show={showStrategyLinker} 
	{userDocuments} 
	scholarshipTitle={activeScholarshipName} 
	onProcessGeneration={processScholarshipStrategyGeneration} 
/>

<AddDocumentModal bind:show={showAddDocModal} onCreated={handleDocCreated} />

<!-- Billing / Out of Credits Modal -->
{#if showBillingModal}
	<div
		class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
	>
		<div
			class="bg-white rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl transform transition-all"
		>
			<div
				class="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-center relative overflow-hidden"
			>
				<!-- background pattern -->
				<div class="absolute inset-0 opacity-20">
					<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
						<defs>
							<pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
								<circle cx="2" cy="2" r="1.5" fill="#fff" />
							</pattern>
						</defs>
						<rect width="100%" height="100%" fill="url(#grid)" />
					</svg>
				</div>
				<div class="relative z-10">
					<div
						class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md"
					>
						<svg
							width="32"
							height="32"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							class="text-white"
							><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg
						>
					</div>
					<h3 class="text-2xl font-bold text-white mb-2" style="font-family: 'Outfit', sans-serif;">
						Unlock AI Strategies
					</h3>
					<p class="text-orange-100 text-sm">
						You need Intelligence Credits to generate personalized admission workflows.
					</p>
				</div>
			</div>

			<div class="p-6">
				<div class="space-y-4 mb-8">
					<div class="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
						<div class="mt-0.5 text-emerald-500">
							<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"
								><path d="M20 6L9 17l-5-5" /></svg
							>
						</div>
						<div>
							<div class="font-bold text-slate-800 text-sm">Tailored "Win" Strategy</div>
							<div class="text-xs text-slate-500">
								Finds red flags in your profile relative to the exact program rubric.
							</div>
						</div>
					</div>
					<div class="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
						<div class="mt-0.5 text-emerald-500">
							<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"
								><path d="M20 6L9 17l-5-5" /></svg
							>
						</div>
						<div>
							<div class="font-bold text-slate-800 text-sm">Document Generation</div>
							<div class="text-xs text-slate-500">
								Use credits to generate motivation letters and CVs perfectly aligned with the
								program.
							</div>
						</div>
					</div>
				</div>

				<div class="space-y-3">
					<a
						href="/pricing"
						class="block text-center w-full py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition-colors shadow-lg shadow-slate-900/20"
					>
						Get Intelligence Credits
					</a>
					<button
						onclick={() => (showBillingModal = false)}
						class="w-full py-3 text-slate-500 hover:text-slate-800 font-semibold text-sm transition-colors"
					>
						Maybe Later
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.main-empty {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		min-height: 400px;
	}
	.main-empty-title {
		font-family: 'Outfit', sans-serif;
		font-size: 1.5rem;
		font-weight: 800;
		color: #0f172a;
		margin-bottom: 0.5rem;
	}
	.main-empty-sub {
		font-size: 0.9375rem;
		color: #64748b;
		max-width: 24rem;
		margin-bottom: 1.5rem;
	}
	.main-empty-cta {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		background: #f97316;
		color: white;
		font-weight: 700;
		font-size: 0.875rem;
		padding: 0.75rem 1.5rem;
		border-radius: 999px;
		text-decoration: none;
		transition: all 0.2s;
	}
	.main-empty-cta:hover {
		background: #ea580c;
		transform: translateY(-1px);
	}
	.s-card {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 1rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
		transition: box-shadow 0.2s;
	}
	.s-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
	}
	.sc-title {
		font-family: 'Outfit', sans-serif;
		font-size: 1rem;
		font-weight: 700;
		color: #0f172a;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}
	.timeline {
		display: flex;
		flex-direction: column;
	}
	.tl-step {
		display: flex;
		gap: 1rem;
		position: relative;
		padding-bottom: 1.5rem;
	}
	.tl-step:last-child {
		padding-bottom: 0;
	}
	.tl-step:not(:last-child)::after {
		content: '';
		position: absolute;
		left: 1rem;
		top: 2.25rem;
		bottom: 0;
		width: 2px;
		background: linear-gradient(180deg, #e2e8f0, #f1f5f9);
	}
	.tl-dot {
		width: 2rem;
		height: 2rem;
		border-radius: 999px;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 800;
		z-index: 1;
	}
	.tl-dot-required {
		background: linear-gradient(135deg, #f97316, #ea580c);
		color: white;
	}
	.tl-dot-optional {
		background: #f1f5f9;
		color: #64748b;
		border: 2px solid #e2e8f0;
	}
	.tl-content {
		flex: 1;
		padding-top: 0.125rem;
	}
	.tl-title {
		font-size: 1rem;
		font-weight: 700;
		color: #0f172a;
		margin-bottom: 0.25rem;
	}
	.tl-desc {
		font-size: 0.875rem;
		color: #475569;
		line-height: 1.5;
		margin-bottom: 0.5rem;
	}
	.docs-card {
		border-top: 3px solid #6366f1;
	}
	.docs-toggle {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		color: #94a3b8;
	}
	.docs-badge {
		font-size: 0.5625rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		background: #eef2ff;
		color: #6366f1;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		margin-left: 0.5rem;
	}
	.docs-desc {
		font-size: 0.8125rem;
		color: #64748b;
		margin-bottom: 1rem;
	}
	.docs-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 0.75rem;
	}
	.doc-item {
		background: #f8fafc;
		border: 1.5px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 0.875rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		transition: all 0.15s;
	}
	.doc-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.doc-name {
		font-size: 0.8125rem;
		font-weight: 700;
		color: #0f172a;
	}
	.doc-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: auto;
	}
	.doc-gen-btn {
		font-size: 0.625rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #6366f1;
		background: #eef2ff;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		text-decoration: none;
	}
	.doc-gen-btn:hover {
		background: #e0e7ff;
		color: #4f46e5;
	}
	@media (max-width: 768px) {
		.docs-grid {
			grid-template-columns: 1fr;
		}
	}
	/* â•â•â•â•â•â•â•â•â•â•â• HUB VIEW STYLES â•â•â•â•â•â•â•â•â•â•â• */
	.hub-shell { max-width: 1200px; margin: 0 auto; padding: 2rem 2.5rem; margin-top: 64px; min-height: calc(100vh - 64px); background: #f8fafc; }
	.hub-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
	.hub-header-left { display: flex; align-items: center; }
	.hub-brand { display: flex; align-items: center; gap: 0.875rem; }
	.hub-brand-icon { width: 3rem; height: 3rem; border-radius: 1rem; background: linear-gradient(135deg, #f97316, #ea580c); display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 12px rgba(249,115,22,0.25); }
	.hub-brand-title { font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 800; color: #0f172a; }
	.hub-brand-sub { font-size: 0.8125rem; color: #64748b; font-weight: 500; }
	.hub-header-right { display: flex; gap: 0.5rem; }
	.hub-action-btn { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; font-size: 0.8125rem; font-weight: 700; border-radius: 0.625rem; text-decoration: none; transition: all 0.2s; background: #0f172a; color: white; }
	.hub-action-btn:hover { background: #1e293b; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.15); }
	.hub-action-secondary { background: white; color: #64748b; border: 1px solid #e2e8f0; }
	.hub-action-secondary:hover { background: #f8fafc; color: #0f172a; border-color: #94a3b8; }

	/* Sections */
	.hub-section { margin-bottom: 2.5rem; }

	/* Generate new document row */
	.hub-generate-row { margin-bottom: 0.5rem; }
	.hub-generate-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin-bottom: 0.75rem; }
	.hub-generate-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.75rem; }
	.hub-generate-card { display: flex; flex-direction: column; align-items: flex-start; gap: 0.375rem; background: white; border: 1.5px solid #e2e8f0; border-radius: 0.875rem; padding: 1rem; text-decoration: none; color: inherit; transition: all 0.18s; }
	.hub-generate-card:hover { border-color: #f97316; box-shadow: 0 4px 16px rgba(249,115,22,0.08); transform: translateY(-2px); }
	.hub-generate-icon { width: 2.25rem; height: 2.25rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
	.hub-generate-name { font-size: 0.8125rem; font-weight: 700; color: #0f172a; line-height: 1.3; }
	.hub-generate-hint { font-size: 0.6875rem; color: #94a3b8; font-weight: 500; }
	.hub-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
	.hub-section-title { font-family: 'Outfit', sans-serif; font-size: 1.125rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 0.5rem; }
	.hub-section-count { font-size: 0.75rem; font-weight: 800; background: #f1f5f9; color: #64748b; padding: 0.125rem 0.625rem; border-radius: 999px; }

	/* Card Grid */
	.hub-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
	.hub-card { background: white; border: 1.5px solid #e2e8f0; border-radius: 1rem; padding: 1.25rem; text-align: left; cursor: pointer; transition: all 0.2s; text-decoration: none; display: flex; flex-direction: column; color: inherit; }
	.hub-card:hover { border-color: #94a3b8; box-shadow: 0 8px 24px rgba(0,0,0,0.06); transform: translateY(-2px); }
	.hub-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
	.hub-card-title { font-size: 0.9375rem; font-weight: 700; color: #0f172a; margin-bottom: 0.25rem; line-height: 1.3; display: -webkit-box; line-clamp: 2; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
	.hub-card-sub { font-size: 0.75rem; color: #64748b; margin-bottom: 0.75rem; flex: 1; }
	.hub-card-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 0.75rem; border-top: 1px solid #f1f5f9; }
	.hub-card-meta { font-size: 0.6875rem; font-weight: 600; color: #94a3b8; }
	.hub-card-action { font-size: 0.6875rem; font-weight: 700; color: #f97316; display: flex; align-items: center; gap: 0.25rem; }
	.hub-card-amount { font-size: 0.6875rem; font-weight: 800; color: #059669; background: #ecfdf5; padding: 0.125rem 0.5rem; border-radius: 999px; }
	.hub-card-status { font-size: 0.5625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; background: #f1f5f9; padding: 0.125rem 0.375rem; border-radius: 999px; }

	/* Badge variants */
	.hub-card-badge { font-size: 0.5625rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; padding: 0.1875rem 0.5rem; border-radius: 999px; display: inline-flex; align-items: center; gap: 0.25rem; }
	.badge-program { background: #fff7ed; color: #ea580c; }
	.badge-unlocked { background: #fef3c7; color: #b45309; }
	.badge-saved { background: #eef2ff; color: #6366f1; }
	.badge-doc { background: #ecfdf5; color: #059669; }

	/* Program card hover accent */
	.hub-card-program:hover { border-color: #f97316; }
	.hub-card-scholarship:hover { border-color: #6366f1; }
	.hub-card-doc:hover { border-color: #059669; }

	/* Add card */
	.hub-card-add { border-style: dashed; border-color: #e2e8f0; align-items: center; justify-content: center; gap: 0.5rem; min-height: 120px; background: #fafbfc; }
	.hub-card-add:hover { border-color: #94a3b8; background: white; }
	.hub-card-add-text { font-size: 0.8125rem; font-weight: 700; color: #94a3b8; }

	/* Empty states */
	.hub-empty { text-align: center; padding: 2.5rem 1.5rem; background: #fafbfc; border: 1.5px dashed #e2e8f0; border-radius: 1rem; }
	.hub-empty-title { font-size: 0.9375rem; font-weight: 700; color: #94a3b8; margin-bottom: 0.25rem; }
	.hub-empty-sub { font-size: 0.8125rem; color: #94a3b8; margin-bottom: 1rem; }
	.hub-empty-cta { display: inline-flex; align-items: center; gap: 0.375rem; background: #f97316; color: white; font-size: 0.8125rem; font-weight: 700; padding: 0.625rem 1.25rem; border-radius: 999px; text-decoration: none; transition: all 0.2s; }
	.hub-empty-cta:hover { background: #ea580c; transform: translateY(-1px); }

	/* Back button */
	.hub-back-btn { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.8125rem; font-weight: 700; color: #64748b; background: white; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.5rem 0.875rem; cursor: pointer; transition: all 0.15s; margin-bottom: 1.5rem; }
	.hub-back-btn:hover { color: #0f172a; border-color: #94a3b8; }
	/* Scholarship Detail */
	.scholarship-detail-header { display: flex; align-items: flex-start; gap: 1.25rem; margin-bottom: 1.5rem; }
	.sd-icon { width: 3.5rem; height: 3.5rem; border-radius: 1rem; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
	.sd-title { font-family: 'Outfit', sans-serif; font-size: 1.75rem; font-weight: 800; color: #0f172a; line-height: 1.2; }
	.sd-provider { font-size: 0.875rem; color: #64748b; margin-top: 0.25rem; }
	.sd-amount { display: inline-block; font-size: 0.8125rem; font-weight: 800; color: #059669; background: #ecfdf5; padding: 0.25rem 0.75rem; border-radius: 999px; margin-top: 0.5rem; }

	@media (max-width: 768px) {
		.hub-shell { padding: 1rem; }
		.hub-card-grid { grid-template-columns: 1fr; }
		.hub-header { flex-direction: column; align-items: flex-start; }
	}

	/* Profile completion nudge */
	.profile-nudge {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		background: white;
		border: 1.5px solid #fed7aa;
		border-radius: 1rem;
		padding: 1rem 1.25rem;
		margin-bottom: 1.75rem;
		box-shadow: 0 1px 4px rgba(249,115,22,0.06);
		flex-wrap: wrap;
	}
	.profile-nudge-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-shrink: 0;
	}
	.profile-nudge-icon {
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 0.625rem;
		background: #fff7ed;
		color: #f97316;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.profile-nudge-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.profile-nudge-title {
		font-size: 0.875rem;
		font-weight: 700;
		color: #0f172a;
	}
	.profile-nudge-sub {
		font-size: 0.75rem;
		color: #64748b;
		max-width: 280px;
	}
	.profile-nudge-right {
		flex: 1;
		min-width: 200px;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.profile-nudge-bar-wrap {
		height: 6px;
		background: #f1f5f9;
		border-radius: 9999px;
		overflow: hidden;
	}
	.profile-nudge-bar {
		height: 100%;
		background: linear-gradient(90deg, #f97316, #ea580c);
		border-radius: 9999px;
		transition: width 0.5s ease;
	}
	.profile-nudge-pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}
	.profile-nudge-pill {
		font-size: 0.625rem;
		font-weight: 700;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
	}
	.pill-done { background: #d1fae5; color: #065f46; }
	.pill-todo { background: #f1f5f9; color: #94a3b8; }
	.profile-nudge-cta {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		background: #f97316;
		color: white;
		border: none;
		border-radius: 0.625rem;
		font-size: 0.8125rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.profile-nudge-cta:hover { background: #ea580c; transform: translateY(-1px); }
</style>
