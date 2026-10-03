import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { checkEmailSafety } from './guards';
import { ABROADUCATE_KNOWLEDGE_BASE, getStudentProfileByEmail } from './knowledge';
import { executeLLM, type ChatMessage } from './llm';
import { buildAbroaducateEmailHtml, buildEscalationAlertEmail } from './templates';
import { sendEmail } from '../email.server';
import type { IncomingEmail, EmailAgentResult, EmailClassification, EmailAgentSettings } from './types';

const DEFAULT_SETTINGS: EmailAgentSettings = {
	agentEnabled: true,
	autonomousMode: true,
	escalationEmail: 'hello@abroaducate.com',
	dailyReplyLimitPerUser: 10,
	modelName: 'gpt-4o-mini'
};

/**
 * Loads current settings from Supabase ai_email_settings table.
 */
export async function getEmailAgentSettings(): Promise<EmailAgentSettings> {
	if (!PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
		return DEFAULT_SETTINGS;
	}

	try {
		const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
		const { data } = await supabase.from('ai_email_settings').select('key, value');

		if (!data || data.length === 0) return DEFAULT_SETTINGS;

		const settings: EmailAgentSettings = { ...DEFAULT_SETTINGS };
		for (const row of data) {
			if (row.key === 'agent_enabled') settings.agentEnabled = Boolean(row.value);
			if (row.key === 'autonomous_mode') settings.autonomousMode = Boolean(row.value);
			if (row.key === 'escalation_email') settings.escalationEmail = String(row.value);
			if (row.key === 'daily_reply_limit_per_user') settings.dailyReplyLimitPerUser = Number(row.value) || 10;
			if (row.key === 'model_name') settings.modelName = String(row.value);
		}
		return settings;
	} catch {
		return DEFAULT_SETTINGS;
	}
}

/**
 * Persists an email interaction log into Supabase.
 */
async function logInteraction(logData: {
	senderEmail: string;
	senderName?: string;
	recipientEmail: string;
	subject: string;
	incomingBody: string;
	incomingHtml?: string;
	messageId?: string;
	replyBody?: string;
	replyHtml?: string;
	category: string;
	urgency: string;
	status: string;
	escalated: boolean;
	escalationReason?: string;
	confidenceScore?: number;
	modelUsed?: string;
	processingMs: number;
	studentProfileFound: boolean;
	studentUserId?: string;
	errorMessage?: string;
}) {
	if (!PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;

	try {
		const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
		await supabase.from('ai_email_logs').insert({
			sender_email: logData.senderEmail,
			sender_name: logData.senderName,
			recipient_email: logData.recipientEmail,
			subject: logData.subject,
			incoming_body: logData.incomingBody,
			incoming_html: logData.incomingHtml,
			message_id: logData.messageId,
			reply_body: logData.replyBody,
			reply_html: logData.replyHtml,
			category: logData.category,
			urgency: logData.urgency,
			status: logData.status,
			escalated: logData.escalated,
			escalation_reason: logData.escalationReason,
			confidence_score: logData.confidenceScore,
			model_used: logData.modelUsed,
			processing_ms: logData.processingMs,
			student_profile_found: logData.studentProfileFound,
			student_user_id: logData.studentUserId,
			error_message: logData.errorMessage
		});
	} catch (err) {
		console.warn('[AI_EMAIL_AGENT] Failed to persist log:', err);
	}
}

export interface ProcessEmailOptions {
	isSimulation?: boolean; // When true, runs full inference without sending outbound email
	forceAutonomous?: boolean;
}

/**
 * Main AI Email Agent execution pipeline.
 */
export async function processIncomingEmail(
	email: IncomingEmail,
	options: ProcessEmailOptions = {}
): Promise<EmailAgentResult> {
	const startTime = Date.now();
	const settings = await getEmailAgentSettings();

	// Check if agent is globally disabled
	if (!settings.agentEnabled && !options.isSimulation) {
		return {
			success: false,
			status: 'skipped_loop',
			error: 'AI Email Agent is currently disabled in settings',
			processingMs: Date.now() - startTime
		};
	}

	// 1. Guard check: prevent email loops, autoreplies, and bounces
	const guard = checkEmailSafety(email);
	if (!guard.allowed && !options.isSimulation) {
		console.log(`[AI_EMAIL_AGENT] 🛑 Email skipped (${guard.status}): ${guard.reason}`);
		await logInteraction({
			senderEmail: email.fromEmail,
			senderName: email.fromName,
			recipientEmail: email.to,
			subject: email.subject,
			incomingBody: email.text,
			category: 'general_inquiry',
			urgency: 'low',
			status: guard.status,
			escalated: false,
			processingMs: Date.now() - startTime,
			studentProfileFound: false,
			errorMessage: guard.reason
		});

		return {
			success: false,
			status: guard.status,
			error: guard.reason,
			processingMs: Date.now() - startTime
		};
	}

	// 2. Fetch student profile context from Supabase (if available)
	const studentProfile = await getStudentProfileByEmail(email.fromEmail);

	// 3. Construct System Prompt & Instructions
	const systemPrompt = `You are a Senior Student Admissions & Scholarship Advisor at Abroaducate.
Your job is to read incoming emails from international students, prospective applicants, or website visitors, and write a helpful, compassionate, highly accurate, natural, and personal response as a human team member. Never introduce yourself as an AI or mention that you are an artificial intelligence.

${ABROADUCATE_KNOWLEDGE_BASE}

STUDENT PROFILE CONTEXT (from database):
${
	studentProfile.found
		? `- Registered Student: Yes
- Name: ${studentProfile.fullName || 'Student'}
- Target Country: ${studentProfile.targetCountry || 'Not specified'}
- Degree Level: ${studentProfile.studyLevel || 'Not specified'}
- Field of Study: ${studentProfile.fieldOfStudy || 'Not specified'}
- Current Plan: ${studentProfile.subscriptionTier}`
		: `- Registered Student: No record found (Prospective student or guest)`
}

INSTRUCTIONS FOR YOUR RESPONSE:
1. Tone: Warm, empathetic, human, and helpful — exactly like an experienced human advisor writing an email. Never refer to yourself as an AI, bot, or automated system.
2. Address the student warmly: If their name is known, greet them by their first name (e.g. "Hi Sarah,").
3. Directly answer every specific question asked in the email.
4. Helpful links: Reference relevant Abroaducate tools naturally in the text (e.g., [Explore Scholarships](https://www.abroaducate.com/scholarships), [AI SOP Reviewer](https://www.abroaducate.com/dashboard/sop)).
5. If they ask about Germany, mention €0 tuition at public universities, the €11,904 blocked account requirement, and English-taught programs.
6. Escalation criteria: Mark shouldEscalate = true if:
   - They report a severe technical glitch or payment error/charge dispute
   - They request a formal partnership, legal inquiry, or express anger/frustration
   - They require manual document verification that requires admin intervention
7. Formatting: Write the email naturally and conversationally. NEVER use markdown header hashtags (# or ## or ###). For section titles or key points, use bold text (e.g. **DAAD Scholarship Requirements**). Use bullet points and paragraphs cleanly. Sign off naturally:
Best regards,
The Abroaducate Team
8. JSON Output: Return a strictly valid JSON object matching the requested schema.`;

	const userPrompt = `Incoming Email:
From: "${email.fromName || ''}" <${email.fromEmail}>
To: ${email.to}
Subject: ${email.subject}

Content:
${email.text || email.html || '(No body text)'}

Analyze this email and generate:
1. Classification: category ('scholarships' | 'admissions_sop' | 'visa_finance' | 'subscription_billing' | 'urgent_human_needed' | 'general_inquiry'), urgency ('low' | 'normal' | 'high' | 'critical'), confidence (0.0 to 1.0), summary (1-2 sentences), shouldEscalate (boolean), escalationReason (if escalated).
2. replySubject: Proper reply subject line (e.g. "Re: ${email.subject.replace(/^Re:\s*/i, '')}").
3. replyMarkdown: Your comprehensive, professional email response formatted cleanly. Do NOT use markdown header hashtags (# or ## or ###); use bold text (**Section Title**) for section headers.
4. suggestedCtaUrl: Most relevant platform URL for this student (e.g. "https://www.abroaducate.com/scholarships", "https://www.abroaducate.com/dashboard/sop", "https://www.abroaducate.com/dashboard/visa-interview", "https://www.abroaducate.com/calculator", or "https://www.abroaducate.com/pricing").
5. suggestedCtaText: Action button text (e.g. "Explore Scholarships on Abroaducate", "Review My Statement of Purpose", "Launch Visa Interview Simulator").`;

	const messages: ChatMessage[] = [
		{ role: 'system', content: systemPrompt },
		{ role: 'user', content: userPrompt }
	];

	try {
		const llmResponse = await executeLLM(
			{
				messages,
				temperature: 0.3,
				maxTokens: 1500,
				responseFormatJson: true
			},
			settings.modelName
		);

		const parsedJson = JSON.parse(llmResponse.content);

		const classification: EmailClassification = {
			category: parsedJson.classification?.category || 'general_inquiry',
			urgency: parsedJson.classification?.urgency || 'normal',
			summary: parsedJson.classification?.summary || '',
			shouldEscalate: Boolean(parsedJson.classification?.shouldEscalate),
			escalationReason: parsedJson.classification?.escalationReason,
			confidence: Number(parsedJson.classification?.confidence) || 0.9,
			keyQuestions: parsedJson.classification?.keyQuestions || []
		};

		const replySubject = parsedJson.replySubject || `Re: ${email.subject.replace(/^Re:\s*/i, '')}`;
		// Sanitize any stray markdown header hashtags (#, ##, ###) into clean bold text for human readability
		const rawReply = parsedJson.replyMarkdown || '';
		const replyMarkdown = rawReply.replace(/^#{1,6}\s*(.+)$/gm, '**$1**').trim();
		const ctaUrl = parsedJson.suggestedCtaUrl || 'https://www.abroaducate.com';
		const ctaText = parsedJson.suggestedCtaText || 'Visit Abroaducate';

		// Build branded Abroaducate HTML email
		const replyHtml = buildAbroaducateEmailHtml({
			recipientName: email.fromName || studentProfile.fullName,
			bodyMarkdown: replyMarkdown,
			ctaUrl,
			ctaText,
			isEscalated: classification.shouldEscalate
		});

		const shouldSendAutonomously =
			(settings.autonomousMode || options.forceAutonomous) && !options.isSimulation;

		let finalStatus: 'replied' | 'drafted' | 'escalated' | 'failed' = 'drafted';
		let dispatchError = '';

		if (shouldSendAutonomously) {
			// Try sending via Zoho SMTP first (so it lands in Zoho Sent folder)
			let sendSuccess = false;
			try {
				const { sendZohoEmail } = await import('./zoho-client');
				const zohoResult = await sendZohoEmail({
					to: email.fromEmail,
					subject: replySubject,
					html: replyHtml,
					text: replyMarkdown,
					inReplyTo: email.messageId,
					references: email.messageId ? [email.messageId] : undefined
				});
				if (zohoResult.success) {
					sendSuccess = true;
				} else {
					dispatchError = `Zoho SMTP: ${zohoResult.error || 'Failed'}`;
				}
			} catch (zohoErr: any) {
				dispatchError = `Zoho exception: ${zohoErr?.message || String(zohoErr)}`;
				console.warn('[AI_EMAIL_AGENT] Zoho SMTP attempt skipped/failed, using Customer.io fallback:', zohoErr);
			}

			// Fallback to Customer.io if Zoho SMTP was not used or failed
			if (!sendSuccess) {
				const sendResult = await sendEmail({
					to: email.fromEmail,
					fromName: 'Abroaducate',
					fromEmail: 'hello@abroaducate.com',
					replyTo: 'hello@abroaducate.com',
					subject: replySubject,
					html: replyHtml,
					text: replyMarkdown
				});
				sendSuccess = Boolean(sendResult.success);
				if (!sendSuccess) {
					dispatchError += ` | Customer.io: ${sendResult.error || 'Failed'}`;
				}
			}

			if (!sendSuccess) {
				console.error('[AI_EMAIL_AGENT] Failed to dispatch reply email via all providers:', dispatchError);
				finalStatus = 'failed';
			} else {
				finalStatus = classification.shouldEscalate ? 'escalated' : 'replied';
			}

			// If escalated, also alert the admin team
			if (classification.shouldEscalate && settings.escalationEmail) {
				const adminAlertHtml = buildEscalationAlertEmail({
					studentEmail: email.fromEmail,
					studentName: email.fromName || studentProfile.fullName,
					subject: email.subject,
					incomingMessage: email.text,
					reason: classification.escalationReason || 'Flagged by AI for human review',
					category: classification.category,
					urgency: classification.urgency,
					aiDraftReply: replyMarkdown
				});

				await sendEmail({
					to: settings.escalationEmail,
					fromName: 'Abroaducate Alert System',
					fromEmail: 'hello@abroaducate.com',
					subject: `[ESCALATION] ${classification.category.toUpperCase()}: ${email.subject}`,
					html: adminAlertHtml,
					text: `Student escalation alert: ${email.fromEmail} - ${classification.escalationReason}`
				});
			}
		}

		const processingMs = Date.now() - startTime;

		// Persist interaction log to Supabase
		if (!options.isSimulation) {
			await logInteraction({
				senderEmail: email.fromEmail,
				senderName: email.fromName,
				recipientEmail: email.to,
				subject: email.subject,
				incomingBody: email.text,
				incomingHtml: email.html,
				messageId: email.messageId,
				replyBody: replyMarkdown,
				replyHtml,
				category: classification.category,
				urgency: classification.urgency,
				status: finalStatus,
				escalated: classification.shouldEscalate,
				escalationReason: classification.escalationReason,
				confidenceScore: classification.confidence,
				modelUsed: llmResponse.modelUsed,
				processingMs,
				studentProfileFound: studentProfile.found,
				studentUserId: studentProfile.userId,
				errorMessage: finalStatus === 'failed' ? (dispatchError || undefined) : undefined
			});
		}

		return {
			success: finalStatus !== 'failed',
			status: finalStatus,
			replySubject,
			replyText: replyMarkdown,
			replyHtml,
			classification,
			studentProfile,
			escalated: classification.shouldEscalate,
			processingMs
		};
	} catch (err: any) {
		const processingMs = Date.now() - startTime;
		const errorMsg = err?.message || String(err);
		console.error('[AI_EMAIL_AGENT] Execution error:', errorMsg);

		if (!options.isSimulation) {
			await logInteraction({
				senderEmail: email.fromEmail,
				senderName: email.fromName,
				recipientEmail: email.to,
				subject: email.subject,
				incomingBody: email.text,
				category: 'general_inquiry',
				urgency: 'high',
				status: 'failed',
				escalated: true,
				processingMs,
				studentProfileFound: studentProfile.found,
				errorMessage: errorMsg
			});
		}

		return {
			success: false,
			status: 'failed',
			error: errorMsg,
			processingMs
		};
	}
}
