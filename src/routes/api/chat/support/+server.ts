/**
 * AI Support Chat endpoint.
 *
 * Scoped strictly to Abroaducate platform questions:
 * - Finding programs and scholarships
 * - How the platform works (dashboard, credits, documents)
 * - Study abroad in the 9 supported countries
 * - Application process and deadlines
 * - General study abroad advice for African/South Asian students
 *
 * Rate limit: 10 messages per user per day (free), 50 (paid).
 * Each message costs ~$0.001 with gpt-4o-mini — negligible.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

const DAILY_LIMIT_FREE = 10;
const DAILY_LIMIT_PAID = 50;
const MAX_MESSAGES_IN_CONTEXT = 10; // Keep last 10 turns to control token cost

const SYSTEM_PROMPT = `You are the Abroaducate support assistant. Abroaducate is a study abroad platform that helps students from Africa and South Asia find low-tuition and free programs in Europe, and match them with scholarships.

WHAT YOU CAN HELP WITH:
- Finding programs: 2,597 programs across Germany, France, Italy, Poland, Lithuania, Estonia, Austria, Czechia, Sweden
- Scholarships: 679+ scholarships with automatic matching to programs
- How the platform works: dashboard, credit system, document generation, strategy feature
- Application process: deadlines, required documents, how to apply
- Study abroad advice: visa requirements, living costs, language requirements for the 10 countries
- Credit system: 3 free credits on signup, credit packs (20/$4.99, 50/$9.99, 130/$24.99)
- Documents: SOP, cover letter, personal statement, academic CV generation

WHAT YOU MUST NOT DO:
- Write documents, essays, or SOPs for users (direct them to the document generator)
- Give specific legal, medical, or financial advice
- Answer questions unrelated to study abroad or the platform
- Make up specific deadlines or requirements — always say "check the official program page"

TONE: Helpful, direct, honest. If you don't know something, say so and suggest where to find the answer.

IMPORTANT: Always end responses about specific deadlines or requirements with: "Verify this on the official program or scholarship page — deadlines can change."

Keep responses concise — 2-4 sentences for simple questions, up to 6 for complex ones.`;

// Simple in-memory rate limiter (resets on server restart — good enough for now)
const rateLimitMap = new Map<string, { count: number; date: string }>();

function getTodayStr(): string {
	return new Date().toISOString().slice(0, 10);
}

function checkRateLimit(userId: string, limit: number): boolean {
	const today = getTodayStr();
	const entry = rateLimitMap.get(userId);
	if (!entry || entry.date !== today) {
		rateLimitMap.set(userId, { count: 1, date: today });
		return true;
	}
	if (entry.count >= limit) return false;
	entry.count++;
	return true;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!OPENAI_API_KEY) {
		return json({ error: 'AI service not configured' }, { status: 500 });
	}

	// Auth check
	const { data: { session } } = await locals.supabase.auth.getSession();
	if (!session?.user) {
		return json({ error: 'Please sign in to use the support chat.' }, { status: 401 });
	}

	const userId = session.user.id;

	// Check subscription for rate limit tier
	const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
	const { data: sub } = await supabaseAdmin
		.from('user_subscriptions')
		.select('plan_type, status')
		.eq('user_id', userId)
		.in('status', ['active', 'trialing'])
		.maybeSingle();

	const isPaid = !!sub;
	const limit = isPaid ? DAILY_LIMIT_PAID : DAILY_LIMIT_FREE;

	if (!checkRateLimit(userId, limit)) {
		return json({
			error: `You've reached your daily chat limit (${limit} messages). Come back tomorrow, or browse the platform directly.`
		}, { status: 429 });
	}

	// Parse messages
	const body = await request.json().catch(() => null);
	if (!body?.messages || !Array.isArray(body.messages)) {
		return json({ error: 'Invalid request' }, { status: 400 });
	}

	// Keep only the last N turns to control cost
	const messages = body.messages
		.filter((m: any) => m.role === 'user' || m.role === 'assistant')
		.slice(-MAX_MESSAGES_IN_CONTEXT)
		.map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));

	if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
		return json({ error: 'Invalid message format' }, { status: 400 });
	}

	// Call OpenAI
	try {
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${OPENAI_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: 'gpt-4o-mini',
				messages: [
					{ role: 'system', content: SYSTEM_PROMPT },
					...messages
				],
				temperature: 0.4,
				max_tokens: 400
			})
		});

		if (!response.ok) {
			const err = await response.text().catch(() => '');
			console.error('[support-chat] OpenAI error:', response.status, err);
			return json({ error: 'AI service temporarily unavailable. Please try again.' }, { status: 502 });
		}

		const data = await response.json();
		const reply = data.choices?.[0]?.message?.content ?? '';

		return json({ reply });

	} catch (e: any) {
		console.error('[support-chat] Error:', e);
		return json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
	}
};
