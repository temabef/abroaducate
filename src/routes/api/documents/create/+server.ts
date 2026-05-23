/**
 * Create a document from pasted text.
 * POST /api/documents/create
 * Body: { type: 'sop' | 'cover-letter' | 'personal-statement' | 'academic-cv', title: string, content: string }
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const VALID_TYPES = ['sop', 'cover-letter', 'personal-statement', 'academic-cv'] as const;
type DocType = (typeof VALID_TYPES)[number];

const TABLE_MAP: Record<DocType, string> = {
	sop: 'sops',
	'cover-letter': 'cover_letters',
	'personal-statement': 'personal_statements',
	'academic-cv': 'academic_cvs'
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const { data: { session } } = await locals.supabase.auth.getSession();
	if (!session?.user) throw error(401, 'Authentication required');

	const body = await request.json().catch(() => null);
	if (!body) throw error(400, 'Invalid JSON body');

	const type = body.type as DocType;
	const title = String(body.title || '').trim();
	const content = String(body.content || '').trim();

	if (!VALID_TYPES.includes(type)) throw error(400, 'Invalid document type');
	if (!title) throw error(400, 'Title is required');
	if (content.length < 30) throw error(400, 'Content is too short (minimum 30 characters)');

	const table = TABLE_MAP[type];
	const wordCount = content.split(/\s+/).filter(Boolean).length;

	// Each table has slightly different column names — normalise here
	const row: Record<string, any> = {
		user_id: session.user.id,
		program_name: title,
		status: 'draft',
		word_count: wordCount
	};

	// SOP + CL + PS all have `content` and a `generated_*` column; we fill both
	// so existing edit pages work without changes.
	if (type === 'sop') {
		row.content = content;
		row.generated_sop = content;
	} else if (type === 'cover-letter') {
		row.content = content;
		row.generated_content = content;
		row.university_name = title;
		row.job_title = title;
		row.company_name = title;
	} else if (type === 'personal-statement') {
		row.content = content;
		row.generated_content = content;
	} else if (type === 'academic-cv') {
		row.content = content;
		row.generated_cv = content;
	}

	const { data, error: insertErr } = await locals.supabase
		.from(table)
		.insert(row)
		.select('id')
		.single();

	if (insertErr) {
		console.error(`[documents/create] Insert failed for ${type}:`, insertErr);
		throw error(500, insertErr.message);
	}

	return json({ ok: true, id: data.id, type, title });
};
