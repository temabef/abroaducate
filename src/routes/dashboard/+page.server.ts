import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getTrackedPrograms, setProgramStatus } from '$lib/services/programService';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = await locals.getSession();
	const supabase = locals.supabase;

	if (!session?.user?.id || !supabase) {
		throw redirect(303, `/auth?next=${encodeURIComponent(url.pathname + url.search)}`);
	}

	const userId = session.user.id;
	const incomingProgramId = url.searchParams.get('programId');

	// --- Step 1: Upsert the incoming program -----------------------------
	if (incomingProgramId) {
		const success = await setProgramStatus(supabase, userId, incomingProgramId, 'saved');
		console.log(`[DASHBOARD] upsert '${incomingProgramId}' → ${success ? 'OK' : 'FAILED'}`);
	}

	// --- Step 2: Fetch the incoming program DIRECTLY (most robust path) --
	let incomingProgram: any = null;
	if (incomingProgramId) {
		const { data, error } = await supabase
			.from('programs')
			.select('*')
			.eq('id', incomingProgramId)
			.single();
		if (error) {
			console.error(`[DASHBOARD] ERROR fetching program '${incomingProgramId}':`, error.message, error.code);
		} else {
			incomingProgram = data;
			console.log(`[DASHBOARD] incomingProgram fetched: '${data?.id}'`);
		}
	}

	// --- Step 3: Fetch all tracked program IDs for this user -------------
	let trackedProgramsData: any[] = [];
	try {
		const rawTracked = await getTrackedPrograms(supabase, userId);
		console.log(`[DASHBOARD] rawTracked rows: ${rawTracked.length}`);

		if (rawTracked.length > 0) {
			const programIds: string[] = rawTracked.map((r: any) => r.program_id);
			const { data: progData, error: progError } = await supabase
				.from('programs')
				.select('*')
				.in('id', programIds);

			if (progError) {
				console.error('[DASHBOARD] tracked programs fetch ERROR:', progError.message);
			} else {
				const dbPrograms: any[] = progData ?? [];
				trackedProgramsData = rawTracked
					.map((interaction: any) => {
						const p = dbPrograms.find((p: any) => p.id === interaction.program_id);
						if (!p) return null;
						return {
							id: interaction.id,
							status: interaction.status,
							matchScore: interaction.match_score ?? null,
							workspaceData: interaction.workspace_data ?? null,
							addedAt: new Date(interaction.created_at).toLocaleDateString(),
							program: p
						};
					})
					.filter(Boolean);
			}
		}

		// 4. If the incoming program isn't in the tracked list yet, add it as a preview entry
		if (incomingProgram && !trackedProgramsData.some((t: any) => t.program?.id === incomingProgramId)) {
			trackedProgramsData.unshift({
				id: null,
				status: 'saved',
				matchScore: null,
				workspaceData: null,
				addedAt: new Date().toLocaleDateString(),
				program: incomingProgram
			});
		}
	} catch (err) {
		console.error('[DASHBOARD] Fatal error:', err);
		// Even if tracking fails, we can still show the incoming program
		if (incomingProgram) {
			trackedProgramsData = [{
				id: null,
				status: 'saved',
				matchScore: null,
				workspaceData: null,
				addedAt: new Date().toLocaleDateString(),
				program: incomingProgram
			}];
		}
	}

	// Only auto-select when the user explicitly navigated here with a programId.
	// Without it, always show the hub so returning users see their overview.
	const initialSelectedProgramId = incomingProgramId ?? null;

	console.log(`[DASHBOARD] returning ${trackedProgramsData.length} programs, initialSelected=${initialSelectedProgramId}`);

	let userProfile = null;
	const { data: profileData, error: profileErr } = await supabase
		.from('user_profiles')
		.select('*')
		.eq('user_id', userId)
		.order('updated_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	if (!profileErr && profileData) {
		userProfile = profileData;
	} else {
		console.log('[DASHBOARD] User profile missing or err:', profileErr?.message);
	}

	// --- Step 4: Fetch bookmarked scholarships --------------------------
	let savedScholarships: any[] = [];
	try {
		const { data: interactionData } = await supabase
			.from('user_scholarship_interactions')
			.select('scholarship_id')
			.eq('user_id', userId)
			.eq('is_saved', true);

		if (interactionData && interactionData.length > 0) {
			const sIds = interactionData.map(i => i.scholarship_id);
			const { data: sData } = await supabase
				.from('public_scholarships_decoded')
				.select('*')
				.in('id', sIds);
			savedScholarships = sData || [];
		}
	} catch (err) {
		console.error('[DASHBOARD] saved scholarships fetch ERROR:', err);
	}

	// --- Step 5: Fetch metadata for unlocked scholarship strategies ------
	let unlockedScholarshipMeta: any[] = [];
	try {
		const strategyKeys = Object.keys(userProfile?.workspace_data?.scholarship_strategies || {});
		if (strategyKeys.length > 0) {
			const { data: metaData } = await supabase
				.from('public_scholarships_decoded')
				.select('id, title, provider, amount')
				.in('id', strategyKeys);
			unlockedScholarshipMeta = metaData || [];
		}
	} catch (err) {
		console.error('[DASHBOARD] unlocked scholarship meta fetch ERROR:', err);
	}

	// --- Step 6: Fetch user's generated documents -----------------------
	let userDocuments: any[] = [];
	try {
		const [sopsRes, clRes, psRes, cvRes] = await Promise.all([
			supabase.from('sops').select('id, university_name, program_name, status, word_count, updated_at').eq('user_id', userId).order('updated_at', { ascending: false }),
			supabase.from('cover_letters').select('id, university_name, program_name, status, word_count, updated_at').eq('user_id', userId).order('updated_at', { ascending: false }),
			supabase.from('personal_statements').select('id, university_name, program_name, status, word_count, updated_at').eq('user_id', userId).order('updated_at', { ascending: false }),
			supabase.from('academic_cvs').select('id, university_name, program_name, status, word_count, updated_at').eq('user_id', userId).order('updated_at', { ascending: false })
		]);
		userDocuments = [
			...(sopsRes.data || []).map((s: any) => ({ ...s, type: 'sop', typeName: 'Statement of Purpose', icon: '📝' })),
			...(clRes.data || []).map((c: any) => ({ ...c, type: 'cover-letter', typeName: 'Cover Letter', icon: '📄' })),
			...(psRes.data || []).map((p: any) => ({ ...p, type: 'personal-statement', typeName: 'Personal Statement', icon: '✍️' })),
			...(cvRes.data || []).map((v: any) => ({ ...v, type: 'academic-cv', typeName: 'Academic CV', icon: '🎓' }))
		].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
		console.log(`[DASHBOARD] Documents loaded: ${userDocuments.length}`);
	} catch (err) {
		console.error('[DASHBOARD] documents fetch ERROR:', err);
	}

	return {
		userId,
		profile: userProfile,
		trackedProgramsData,
		savedScholarships,
		unlockedScholarshipMeta,
		userDocuments,
		initialSelectedProgramId
	};
};
