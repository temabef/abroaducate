import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateScholarshipWinStrategy } from '$lib/server/scholarshipWinStrategy.server';
import { OPENAI_API_KEY } from '$env/static/private';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.getSession();
		if (!session) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = session.user.id;
		const { scholarshipId, programId, documentText, documentName, documentId, documentType } = await request.json();

		if (!scholarshipId) {
			return json({ error: 'Scholarship ID is required' }, { status: 400 });
		}

		const supabase = locals.supabase;

		// 1. Fetch scholarship details
		const { data: scholarship, error: sError } = await supabase
			.from('scholarships')
			.select('*')
			.eq('id', scholarshipId)
			.single();

		if (sError || !scholarship) {
			return json({ error: 'Scholarship not found' }, { status: 404 });
		}

		// 2. Check for cached strategy in the user profile workspace_data
		const { data: interaction } = await supabase
			.from('user_profiles')
			.select('workspace_data')
			.eq('user_id', userId)
			.order('updated_at', { ascending: false })
			.limit(1)
			.maybeSingle();

		const cached = interaction?.workspace_data?.scholarship_strategies?.[scholarshipId];
		// If they explicitly passed a document or id, they are forcing a fresh generation
		if (cached && !documentText && !documentId) {
			return json({ strategy: cached });
		}

		// 3. Resolve document context
		let finalDocumentText = documentText || '';
		let finalDocumentName = documentName || 'Pasted Strategy Document';

		if (documentId && documentType) {
			// Fetch existing document content — each table has different column names
			const table = documentType === 'sop' ? 'sops' : documentType === 'cover-letter' ? 'cover_letters' : documentType === 'academic-cv' ? 'academic_cvs' : 'personal_statements';
			let docQuery;
			if (documentType === 'sop') {
				docQuery = supabase.from('sops').select('content, generated_sop, program_name, university_name').eq('id', documentId).eq('user_id', userId).single();
			} else if (documentType === 'cover-letter') {
				docQuery = supabase.from('cover_letters').select('content, generated_sop, program_name, university_name').eq('id', documentId).eq('user_id', userId).single();
			} else if (documentType === 'academic-cv') {
				// academic_cvs uses content + generated_cv
				docQuery = supabase.from('academic_cvs').select('content, generated_cv, program_name, university_name').eq('id', documentId).eq('user_id', userId).single();
			} else {
				// personal_statements uses content + generated_content
				docQuery = supabase.from('personal_statements').select('content, generated_content, program_name, university_name').eq('id', documentId).eq('user_id', userId).single();
			}
			const { data: existingDoc } = await docQuery;
			if (existingDoc) {
				// `generated_content` is the personal_statements equivalent of `generated_sop`
				finalDocumentText = existingDoc.content || (existingDoc as any).generated_sop || (existingDoc as any).generated_content || (existingDoc as any).generated_cv || '';
				finalDocumentName = existingDoc.program_name || existingDoc.university_name || 'My Document';
			}
		} else if (documentText) {
			// Optional: Save passed document text as a generic SOP so they can reuse it later
			try {
				await supabase.from('sops').insert({
					user_id: userId,
					program_name: finalDocumentName,
					university_name: scholarship.provider || scholarship.title,
					content: documentText,
					generated_sop: documentText,
					status: 'draft',
					word_count: documentText.split(/\s+/).filter((w: string) => w.length > 0).length,
				});
			} catch (e) {
				console.error("Failed to autosave raw document: ", e);
			}
		}

		// 4. Fetch user profile
		const { data: profile } = await supabase
			.from('user_profiles')
			.select('*')
			.eq('user_id', userId)
			.order('updated_at', { ascending: false })
			.limit(1)
			.maybeSingle();

		if (!OPENAI_API_KEY) {
			return json({ error: 'System configuration error' }, { status: 500 });
		}

		// 5. Build the AI payload — real scholarship data + profile + new document text context
		const payloadForAI = {
			title: scholarship.title,
			provider: scholarship.provider,
			location: scholarship.location,
			level: scholarship.level,
			field: scholarship.field,
			funding_category: scholarship.funding_category,
			deadline: scholarship.deadline,
			min_ielts: scholarship.min_ielts,
			min_toefl: scholarship.min_toefl,
			nationality_restrictions: scholarship.nationality_restrictions,
			min_gpa: scholarship.min_gpa,
			amount: scholarship.amount,
			description: scholarship.description || `${scholarship.title} by ${scholarship.provider}`,
		};

		// Append structured candidate profile for personalized gap analysis
		payloadForAI.description += `\n\n--- CANDIDATE PROFILE ---
Nationality: ${profile?.nationality || 'Not provided'}
Current Degree: ${profile?.current_level || 'Not provided'}
Applying For: ${profile?.target_level || 'Not provided'}
Field of Study: ${profile?.field_of_study || 'Not provided'}
GPA: ${profile?.gpa ? `${profile.gpa} / 4.0` : 'Not provided'}
IELTS Score: ${profile?.ielts_score ? `${profile.ielts_score} / 9.0` : 'Not provided'}
TOEFL Score: ${profile?.toefl_score ? `${profile.toefl_score} / 120` : 'Not provided'}

--- SCHOLARSHIP REQUIREMENTS ---
Min GPA: ${scholarship.min_gpa || 'Not specified'}
Min IELTS: ${scholarship.min_ielts || 'Not specified'}
Nationality Restrictions: ${scholarship.nationality_restrictions || 'Open to all'}
Amount: ${scholarship.amount || 'Not specified'}

--- USER DOCUMENT CONTEXT ---
The user has optionally provided the following document (e.g. SOP, CV) for audit:
${finalDocumentText || "No additional document provided. Perform a 'Lite Strategy' based purely on user stats."}`;

		// Call OpenAI
		const strategy = await generateScholarshipWinStrategy({
			scholarship: payloadForAI,
			model: 'gpt-4o-mini'
		});

		// 7. Cache the strategy against the user profile (targeted update by id to avoid multi-row race)
		const { data: existingProfile } = await supabase
			.from('user_profiles')
			.select('id, workspace_data')
			.eq('user_id', userId)
			.order('updated_at', { ascending: false })
			.limit(1)
			.maybeSingle();

		const currentWorkspace = existingProfile?.workspace_data || {};
		const updatedWorkspaceData = {
			...currentWorkspace,
			scholarship_strategies: {
				...(currentWorkspace.scholarship_strategies || {}),
				[scholarshipId]: strategy
			}
		};

		if (existingProfile?.id) {
			const { error: updErr } = await supabase
				.from('user_profiles')
				.update({
					workspace_data: updatedWorkspaceData,
					updated_at: new Date().toISOString()
				})
				.eq('user_id', userId); 
			if (updErr) throw new Error("DB Update Error: " + updErr.message);
		} else {
			// If the user has no profile row at all, we must insert one to hold the workspace_data
			const { error: insErr } = await supabase
				.from('user_profiles')
				.insert({
					user_id: userId,
					workspace_data: updatedWorkspaceData,
					updated_at: new Date().toISOString()
				});
			if (insErr) throw new Error("DB Insert Error: " + insErr.message);
		}

		// 8. Explicitly bookmark the scholarship so it appears in the dashboard "Saved" lists automatically
		await supabase.from('user_scholarship_interactions').upsert(
			{ user_id: userId, scholarship_id: scholarshipId, is_saved: true },
			{ onConflict: 'user_id,scholarship_id' }
		);

		return json({ strategy });

	} catch (e: any) {
		console.error('[SCHOLARSHIP STRATEGY] Error:', e);
		return json({ error: e.message || 'Internal Server Error' }, { status: 500 });
	}
};
