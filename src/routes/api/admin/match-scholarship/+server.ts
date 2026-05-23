import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { rematchScholarship } from '$lib/server/scholarshipMatcher';

/**
 * POST /api/admin/match-scholarship
 * Body: { scholarship_id: string, rolloverIfPast?: boolean, persistRollover?: boolean }
 *
 * Re-scores a single scholarship against every program and updates the
 * program_scholarship_matches table. Called from the admin scholarships UI
 * right after saving a scholarship.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const supabase = locals.supabase;
	if (!supabase) throw error(500, 'Supabase not initialised');

	// Admin-only via Postgres RPC (same pattern as bulk-import-programs)
	const { data: isAdmin } = await supabase.rpc('can_manage_scholarships');
	if (!isAdmin) throw error(403, 'Admin access required');

	const body = await request.json().catch(() => null);
	if (!body?.scholarship_id) throw error(400, 'scholarship_id is required');

	try {
		const result = await rematchScholarship(supabase, body.scholarship_id, {
			rolloverIfPast: body.rolloverIfPast ?? true,
			persistRollover: body.persistRollover ?? false
		});
		return json({ ok: true, ...result });
	} catch (e: any) {
		console.error('match-scholarship failed', e);
		throw error(500, e?.message ?? 'match failed');
	}
};
