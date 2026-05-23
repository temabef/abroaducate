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
		const { programId } = await request.json();

		if (!programId) {
			return json({ error: 'Program ID is required' }, { status: 400 });
		}

		const supabase = locals.supabase;

		// 1. Fetch existing interaction to check if strategy already exists
		const { data: interaction } = await supabase
			.from('user_program_interactions')
			.select('workspace_data')
			.eq('user_id', userId)
			.eq('program_id', programId)
			.single();

		if (interaction?.workspace_data?.funding_strategy) {
			return json({ strategy: interaction.workspace_data.funding_strategy });
		}

		// 2. Fetch the user's profile to feed into AI logic
		const { data: profile } = await supabase
			.from('user_profiles')
			.select('*')
			.eq('user_id', userId)
			.single();

		// 3. Fetch program details
		const { data: program } = await supabase
			.from('programs')
			.select('*')
			.eq('id', programId)
			.single();

		if (!program) {
			return json({ error: 'Program not found' }, { status: 404 });
		}

		// Spend 1 credit — blocks if the user has none left
		const { data: creditSpent, error: creditError } = await supabase.rpc('spend_credits', {
			user_uid: userId,
			required_credits: 1,
			action_name: 'WIN_STRATEGY_GENERATION'
		});

		if (creditError) {
			console.error('[WIN STRATEGY] Credit RPC error:', creditError);
			return json({ error: 'Could not process credit. Please try again.' }, { status: 500 });
		}

		if (!creditSpent) {
			return json({ error: 'Insufficient credits. Top up to continue.' }, { status: 402 });
		}

		// Check remaining balance — send low-credit warning if down to 1
		const { data: balanceRow } = await supabase
			.from('user_profiles')
			.select('credits')
			.eq('user_id', userId)
			.maybeSingle();

		if (balanceRow?.credits === 1) {
			const userEmail = session.user.email;
			if (userEmail) {
				import('$lib/server/email.server').then(({ sendEmail }) => {
					sendEmail({
						to: userEmail,
						subject: 'You have 1 credit left',
						html: `<p>You have 1 credit remaining. <a href="https://abroaducate.com/pricing">Top up here</a>.</p>`,
						text: `You have 1 credit remaining. Top up at https://abroaducate.com/pricing`
					}).catch(() => {});
				}).catch(() => {});
			}
		}

		if (!OPENAI_API_KEY) {
			console.error("[WIN STRATEGY] Missing OPENAI_API_KEY in environment");
			return json({ error: 'System configuration error' }, { status: 500 });
		}

		// 5. Generate Strategy
		// We format the program data as if it were a scholarship, since the underlying AI logic expects that schema.
		const payloadForAI = {
			title: program.program_name,
			provider: program.university_name,
			location: program.country || 'Germany',
			level: program.degree_level,
			tuition: program.tuition_per_semester ? `€${program.tuition_per_semester}/semester` : 'Free / No tuition',
			application_requirements: program.application_requirements || [],
			rubric_criteria: program.rubric_criteria || {},
			funding_opportunities: program.funding_opportunities || program.funding_pathway || 'Check program website',
			application_steps: program.application_steps || [],
			description: `${program.program_name} at ${program.university_name} in ${program.country || 'Germany'}. ${program.description || ''}`
		};
		
		// Structured candidate profile — attached so AI can do precise gap analysis
		payloadForAI.description += `\n\n--- CANDIDATE PROFILE ---
Nationality: ${profile?.nationality || 'Not provided'}
Current Degree: ${profile?.current_level || 'Not provided'}
Applying For: ${profile?.target_level || 'Master\'s'}
Field of Study: ${profile?.field_of_study || 'Not provided'}
GPA: ${profile?.gpa ? `${profile.gpa} / 4.0` : 'Not provided'}
IELTS Score: ${profile?.ielts_score ? `${profile.ielts_score} / 9.0` : 'Not provided'}
TOEFL Score: ${profile?.toefl_score ? `${profile.toefl_score} / 120` : 'Not provided'}

--- PROGRAM MIN REQUIREMENTS ---
Min GPA (if set): ${program.rubric_criteria?.min_gpa || 'Not specified'}
English Level Required: ${program.rubric_criteria?.english_level_required ? 'Yes' : 'Not specified'}
German Level Required: ${program.rubric_criteria?.german_level_required ? 'Yes' : 'No'}`;


		const strategy = await generateScholarshipWinStrategy({
			scholarship: payloadForAI,
			model: 'gpt-4o-mini'
		});

		// 6. Save the generated strategy to workspace_data
		const currentWorkspace = interaction?.workspace_data || {};
		const updatedWorkspace = {
			...currentWorkspace,
			funding_strategy: strategy
		};

		const { error: updateError } = await supabase
			.from('user_program_interactions')
			.update({ workspace_data: updatedWorkspace })
			.eq('user_id', userId)
			.eq('program_id', programId);

		if (updateError) {
			console.error("[WIN STRATEGY] Failed to save strategy:", updateError);
		}

		// 7. Return Result
		return json({ strategy });
		
	} catch (e: any) {
		console.error('[WIN STRATEGY] Critical Error:', e);
		return json({ error: e.message || 'Internal Server Error' }, { status: 500 });
	}
};
