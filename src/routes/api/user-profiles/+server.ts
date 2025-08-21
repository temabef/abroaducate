import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Map numeric GPA to range buckets used by scholarship system
function gpaToRange(gpa: number | null | undefined): '<2.5' | '2.5-3.0' | '3.0-3.5' | '3.5-4.0' | null {
	if (gpa == null || Number.isNaN(gpa)) return null;
	if (gpa < 2.5) return '<2.5';
	if (gpa < 3.0) return '2.5-3.0';
	if (gpa < 3.5) return '3.0-3.5';
	return '3.5-4.0';
}

export const GET: RequestHandler = async ({ locals }) => {
	const { getSession, supabase } = locals;
	try {
		const session = await getSession();
		if (!session?.user?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { data, error } = await supabase
			.from('user_quick_profile')
			.select('degree_level, field_of_study, preferred_countries, gpa_range, scholarship_priority')
			.eq('user_id', session.user.id)
			.maybeSingle();

		if (error) {
			console.error('GET /api/user-profiles error:', error);
			return json({ error: 'Failed to load profile' }, { status: 500 });
		}

		return json({ profile: data || null });
	} catch (err) {
		console.error('GET /api/user-profiles threw:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const { getSession, supabase } = locals;
	try {
		const session = await getSession();
		if (!session?.user?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		// Accept either gpa (numeric) or gpa_range (string)
		let gpa_range: '<2.5' | '2.5-3.0' | '3.0-3.5' | '3.5-4.0' | null = body.gpa_range || null;
		if (!gpa_range && body.gpa) {
			gpa_range = gpaToRange(parseFloat(String(body.gpa)));
		}

		const payload = {
			user_id: session.user.id,
			degree_level: body.degree_level,
			field_of_study: body.field_of_study,
			preferred_countries: Array.isArray(body.preferred_countries) ? body.preferred_countries : [],
			scholarship_priority: body.scholarship_priority,
			gpa_range: gpa_range || '3.0-3.5'
		};

		const { data, error } = await supabase
			.from('user_quick_profile')
			.upsert(payload, { onConflict: 'user_id', ignoreDuplicates: false })
			.select('degree_level, field_of_study, preferred_countries, gpa_range, scholarship_priority')
			.single();

		if (error) {
			console.error('POST /api/user-profiles error:', error);
			return json({ error: 'Failed to save profile' }, { status: 500 });
		}

		return json({ success: true, profile: data });
	} catch (err) {
		console.error('POST /api/user-profiles threw:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
