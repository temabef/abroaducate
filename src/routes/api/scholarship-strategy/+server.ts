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

		// Spend 1 credit — blocks if the user has none left
		const { data: creditSpent, error: creditError } = await supabase.rpc('spend_credits', {
			user_uid: userId,
			required_credits: 1,
			action_name: 'SCHOLARSHIP_STRATEGY_GENERATION'
		});

		if (creditError) {
			console.error('[SCHOLARSHIP STRATEGY] Credit RPC error:', creditError);
			return json({ error: 'Could not process credit. Please try again.' }, { status: 500 });
		}

		if (!creditSpent) {
			return json({ error: 'Insufficient credits. Top up to continue.' }, { status: 402 });
		}

		// Check remaining balance — send low-credit warning email if down to 1
		const { data: balanceRow } = await supabase
			.from('user_profiles')
			.select('credits')
			.eq('user_id', userId)
			.maybeSingle();

		if (balanceRow?.credits === 1) {
			// Fire-and-forget — don't block the strategy generation
			const userEmail = session.user.email;
			if (userEmail) {
				import('$lib/server/email.server').then(({ sendEmail }) => {
					sendEmail({
						to: userEmail,
						subject: 'You have 1 credit left',
						html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f1f5f9;">
<div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
<div style="background:#0f172a;padding:24px 32px;text-align:center;"><p style="color:#fff;font-size:20px;font-weight:800;margin:0;">Abroaducate</p></div>
<div style="padding:32px;">
<div style="background:#fffbeb;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin-bottom:24px;">
<p style="color:#92400e;font-weight:700;font-size:14px;margin:0 0 4px 0;">1 credit remaining</p>
<p style="color:#78350f;font-size:13px;margin:0;">Top up to keep generating strategies and documents.</p>
</div>
<h2 style="color:#0f172a;font-size:20px;font-weight:800;margin:0 0 8px 0;">Top up your credits</h2>
<p style="color:#475569;font-size:15px;margin:0 0 24px 0;">Credits are used for AI strategies, documents, and Right-Fit checks. Browsing programs and scholarships is always free.</p>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px;">
<div style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center;"><div style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;margin-bottom:8px;">Starter</div><div style="font-size:26px;font-weight:800;color:#0f172a;">20</div><div style="font-size:12px;color:#94a3b8;margin-bottom:6px;">credits</div><div style="font-size:14px;font-weight:700;color:#059669;">$4.99</div></div>
<div style="border:2px solid #f97316;border-radius:8px;padding:16px;text-align:center;background:#fff7ed;"><div style="font-size:11px;font-weight:600;color:#ea580c;text-transform:uppercase;margin-bottom:8px;">Popular</div><div style="font-size:26px;font-weight:800;color:#0f172a;">50</div><div style="font-size:12px;color:#94a3b8;margin-bottom:6px;">credits</div><div style="font-size:14px;font-weight:700;color:#059669;">$9.99</div></div>
<div style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center;"><div style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;margin-bottom:8px;">Elite</div><div style="font-size:26px;font-weight:800;color:#0f172a;">130</div><div style="font-size:12px;color:#94a3b8;margin-bottom:6px;">credits</div><div style="font-size:14px;font-weight:700;color:#059669;">$24.99</div></div>
</div>
<div style="text-align:center;"><a href="https://abroaducate.com/pricing" style="display:inline-block;background:#f97316;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;">Top up credits</a></div>
</div>
<div style="padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;"><a href="https://abroaducate.com/settings" style="color:#64748b;font-size:12px;text-decoration:none;">Manage email preferences</a></div>
</div></body></html>`,
						text: `Abroaducate — 1 credit remaining\n\nTop up to keep generating strategies and documents.\n\nStarter: 20 credits — $4.99\nAccelerator: 50 credits — $9.99\nElite: 130 credits — $24.99\n\nhttps://abroaducate.com/pricing`
					}).catch(e => console.error('[LOW CREDIT EMAIL] Failed:', e));
				}).catch(() => {});
			}
		}

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
