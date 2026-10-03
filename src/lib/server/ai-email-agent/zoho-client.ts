import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';
import { processIncomingEmail } from './service';
import { parseSenderAddress } from './guards';
import type { IncomingEmail } from './types';

export interface ZohoConfig {
	email: string;
	appPassword: string;
	imapHost: string;
	imapPort: number;
	smtpHost: string;
	smtpPort: number;
}

/**
 * Retrieves Zoho configuration from environment variables or settings.
 */
export function getZohoConfig(): ZohoConfig {
	const email = env.ZOHO_EMAIL || (process.env as any)?.ZOHO_EMAIL || 'hello@abroaducate.com';
	// Strip spaces if user pasted password with spaces e.g. "abcd efgh ijkl mnop"
	const rawPassword = env.ZOHO_APP_PASSWORD || (process.env as any)?.ZOHO_APP_PASSWORD || '';
	const appPassword = rawPassword.replace(/\s+/g, '');
	const imapHost = env.ZOHO_IMAP_HOST || (process.env as any)?.ZOHO_IMAP_HOST || 'imap.zoho.eu';
	const imapPort = Number(env.ZOHO_IMAP_PORT || 993);
	const smtpHost = env.ZOHO_SMTP_HOST || (process.env as any)?.ZOHO_SMTP_HOST || 'smtp.zoho.eu';
	const smtpPort = Number(env.ZOHO_SMTP_PORT || 465);

	return {
		email,
		appPassword,
		imapHost,
		imapPort,
		smtpHost,
		smtpPort
	};
}

/**
 * Creates an ImapFlow client for Zoho.
 */
function createImapClient(config: ZohoConfig): ImapFlow {
	return new ImapFlow({
		host: config.imapHost,
		port: config.imapPort,
		secure: true,
		auth: {
			user: config.email,
			pass: config.appPassword
		},
		logger: false
	});
}

/**
 * Creates a Nodemailer SMTP transporter for Zoho.
 */
function createSmtpTransport(config: ZohoConfig) {
	return nodemailer.createTransport({
		host: config.smtpHost,
		port: config.smtpPort,
		secure: config.smtpPort === 465,
		tls: {
			rejectUnauthorized: false
		},
		auth: {
			user: config.email,
			pass: config.appPassword
		}
	});
}

/**
 * Sends an email directly via Zoho SMTP (so it appears in Zoho Sent folder).
 */
export async function sendZohoEmail(opts: {
	to: string;
	bcc?: string;
	subject: string;
	html: string;
	text?: string;
	inReplyTo?: string;
	references?: string[];
}): Promise<{ success: boolean; error?: string }> {
	const config = getZohoConfig();
	if (!config.appPassword) {
		return { success: false, error: 'No Zoho credentials configured' };
	}

	try {
		const transporter = createSmtpTransport(config);
		await transporter.sendMail({
			from: `"Abroaducate" <${config.email}>`,
			to: opts.to,
			bcc: opts.bcc,
			subject: opts.subject,
			html: opts.html,
			text: opts.text,
			inReplyTo: opts.inReplyTo,
			references: opts.references
		});
		console.log(`[ZOHO_SMTP] ✅ Sent reply to ${opts.to} via Zoho SMTP: ${opts.subject}`);
		return { success: true };
	} catch (err: any) {
		console.warn(`[ZOHO_SMTP] ⚠️ Zoho SMTP dispatch error:`, err?.message);
		return { success: false, error: err.message || String(err) };
	}
}

/**
 * Tests connection to both Zoho IMAP and SMTP servers.
 */
export async function testZohoConnection(): Promise<{
	success: boolean;
	imapConnected: boolean;
	smtpConnected: boolean;
	unreadCount?: number;
	error?: string;
}> {
	const config = getZohoConfig();
	if (!config.appPassword) {
		return {
			success: false,
			imapConnected: false,
			smtpConnected: false,
			error: 'ZOHO_APP_PASSWORD is not configured in .env'
		};
	}

	let imapOk = false;
	let smtpOk = false;
	let unread = 0;

	// 1. Test IMAP
	const imap = createImapClient(config);
	try {
		await imap.connect();
		const lock = await imap.getMailboxLock('INBOX');
		try {
			const status = await imap.status('INBOX', { unseen: true, messages: true });
			unread = status.unseen || 0;
			imapOk = true;
		} finally {
			lock.release();
		}
		await imap.logout();
	} catch (err: any) {
		return {
			success: false,
			imapConnected: false,
			smtpConnected: false,
			error: `Zoho IMAP Error: ${err.message || String(err)}`
		};
	}

	// 2. Test SMTP
	try {
		const transporter = createSmtpTransport(config);
		await transporter.verify();
		smtpOk = true;
	} catch (err: any) {
		return {
			success: false,
			imapConnected: imapOk,
			smtpConnected: false,
			unreadCount: unread,
			error: `Zoho SMTP Error: ${err.message || String(err)}`
		};
	}

	return {
		success: true,
		imapConnected: imapOk,
		smtpConnected: smtpOk,
		unreadCount: unread
	};
}

export interface ZohoProcessResult {
	processedCount: number;
	repliedCount: number;
	skippedCount: number;
	failedCount: number;
	items: Array<{
		from: string;
		subject: string;
		status: string;
		summary?: string;
		error?: string;
	}>;
}

/**
 * Polls unread emails from Zoho Mail, processes each with the AI agent,
 * sends replies via Zoho SMTP, and marks original emails as Read.
 */
export async function processZohoInbox(options: {
	limit?: number;
	dryRun?: boolean;
	forceAutonomous?: boolean;
} = {}): Promise<ZohoProcessResult> {
	const config = getZohoConfig();
	const limit = options.limit || 10;
	const dryRun = options.dryRun ?? false;

	if (!config.appPassword) {
		throw new Error('ZOHO_APP_PASSWORD is missing in .env');
	}

	const imap = createImapClient(config);
	const smtp = createSmtpTransport(config);

	const result: ZohoProcessResult = {
		processedCount: 0,
		repliedCount: 0,
		skippedCount: 0,
		failedCount: 0,
		items: []
	};

	try {
		await imap.connect();
		const lock = await imap.getMailboxLock('INBOX');

		try {
			// Find unread messages in INBOX
			const messages = await imap.search({ seen: false });
			console.log(`[ZOHO_AGENT] Found ${messages.length} unread emails in Zoho Inbox.`);

			const targetUids = messages.slice(0, limit);

			for (const uid of targetUids) {
				result.processedCount++;
				const fetched = await imap.fetchOne(uid, {
					envelope: true,
					source: true,
					bodyStructure: true
				});

				if (!fetched || !fetched.envelope) {
					continue;
				}

				const envelope = fetched.envelope;
				const fromObj = envelope.from?.[0];
				const rawFrom = fromObj ? `${fromObj.name || ''} <${fromObj.address}>` : '';
				const parsedSender = parseSenderAddress(rawFrom || (fromObj?.address ?? ''));

				const subject = envelope.subject || '(No Subject)';
				const messageId = envelope.messageId || '';

				// Download text body
				let bodyText = '';
				try {
					const rawBuffer = fetched.source;
					if (rawBuffer) {
						// Simple text extraction from raw MIME
						const rawStr = rawBuffer.toString('utf-8');
						// Extract body after headers
						const parts = rawStr.split(/\r?\n\r?\n/);
						bodyText = parts.slice(1).join('\n\n').slice(0, 5000);
					}
				} catch {
					bodyText = '(Unable to parse body content)';
				}

				const incoming: IncomingEmail = {
					from: rawFrom,
					fromEmail: parsedSender.email,
					fromName: parsedSender.name,
					to: config.email,
					subject,
					text: bodyText,
					messageId,
					receivedAt: envelope.date?.toISOString()
				};

				console.log(`[ZOHO_AGENT] 🤖 Processing email from: ${incoming.fromEmail} - "${incoming.subject}"`);

				// Run through the AI agent pipeline
				const agentResult = await processIncomingEmail(incoming, {
					isSimulation: dryRun,
					forceAutonomous: options.forceAutonomous ?? true
				});

				if (agentResult.success && !dryRun) {
					// Send reply directly via Zoho SMTP so it appears in Zoho Sent folder!
					try {
						await smtp.sendMail({
							from: `"Abroaducate" <${config.email}>`,
							to: incoming.fromEmail,
							subject: agentResult.replySubject || `Re: ${subject.replace(/^Re:\s*/i, '')}`,
							text: agentResult.replyText,
							html: agentResult.replyHtml,
							inReplyTo: messageId,
							references: messageId ? [messageId] : undefined
						});

						result.repliedCount++;

						// Mark as read in Zoho so it doesn't reply again
						await imap.messageFlagsAdd(uid, ['\\Seen']);
						console.log(`[ZOHO_AGENT] ✅ Replied and marked as Seen in Zoho for: ${incoming.fromEmail}`);

						result.items.push({
							from: incoming.fromEmail,
							subject: incoming.subject,
							status: 'replied',
							summary: agentResult.classification?.summary
						});
					} catch (smtpErr: any) {
						console.error(`[ZOHO_AGENT] ❌ SMTP Error replying to ${incoming.fromEmail}:`, smtpErr);
						result.failedCount++;
						result.items.push({
							from: incoming.fromEmail,
							subject: incoming.subject,
							status: 'failed',
							error: smtpErr.message
						});
					}
				} else {
					if (agentResult.status.startsWith('skipped')) {
						result.skippedCount++;
						// If skipped because of loop/spam, mark as seen to avoid repeated loops
						if (!dryRun) {
							await imap.messageFlagsAdd(uid, ['\\Seen']);
						}
					}

					result.items.push({
						from: incoming.fromEmail,
						subject: incoming.subject,
						status: agentResult.status,
						summary: agentResult.error || agentResult.classification?.summary
					});
				}
			}
		} finally {
			lock.release();
		}

		await imap.logout();
	} catch (err: any) {
		console.error('[ZOHO_AGENT] Fatal Error connecting to Zoho:', err);
		throw err;
	}

	return result;
}
