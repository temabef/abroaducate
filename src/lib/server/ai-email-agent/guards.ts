import type { IncomingEmail } from './types';

// In-memory sliding window rate limiter
const hourlyLimits = new Map<string, { count: number; firstTimestamp: number }>();
const MAX_EMAILS_PER_HOUR = 5;
const ONE_HOUR_MS = 60 * 60 * 1000;

// Known automated/system address fragments
const AUTOMATED_EMAIL_PATTERNS = [
	'mailer-daemon',
	'postmaster',
	'no-reply',
	'noreply',
	'donotreply',
	'do-not-reply',
	'bounce',
	'bounces',
	'notification',
	'notifications',
	'system@',
	'automated@',
	'auto-reply',
	'autoreply',
	'alert@',
	'alerts@'
];

// Self addresses to never reply to (avoids infinite ping-pong)
const SELF_ADDRESSES = [
	'hello@abroaducate.com',
	'support@abroaducate.com',
	'admin@abroaducate.com',
	'team@abroaducate.com'
];

// Subject indicators of automated responses / bounces
const AUTOMATED_SUBJECT_PATTERNS = [
	/^out of office/i,
	/^automatic reply/i,
	/^auto:/i,
	/^undelivered mail returned/i,
	/^delivery status notification/i,
	/^mail delivery failed/i,
	/^failure notice/i,
	/^returned mail/i,
	/^delayed mail/i
];

export interface GuardCheckResult {
	allowed: boolean;
	reason?: string;
	status: 'allowed' | 'skipped_loop' | 'skipped_spam';
}

/**
 * Checks whether an incoming email should be processed or skipped to prevent
 * infinite loops, autoreply cascades, bot loops, or spam flooding.
 */
export function checkEmailSafety(email: IncomingEmail): GuardCheckResult {
	const fromLower = email.fromEmail.toLowerCase().trim();
	const subjectLower = (email.subject || '').trim();

	// 1. Prevent replying to our own addresses
	if (SELF_ADDRESSES.some((self) => fromLower.includes(self))) {
		return {
			allowed: false,
			reason: 'Sender is Abroaducate internal address (self-loop prevention)',
			status: 'skipped_loop'
		};
	}

	// 2. Check for automated sender addresses
	for (const pattern of AUTOMATED_EMAIL_PATTERNS) {
		if (fromLower.includes(pattern)) {
			return {
				allowed: false,
				reason: `Sender contains automated address pattern "${pattern}"`,
				status: 'skipped_loop'
			};
		}
	}

	// 3. Check subject patterns (Out of Office, Bounces)
	for (const regex of AUTOMATED_SUBJECT_PATTERNS) {
		if (regex.test(subjectLower)) {
			return {
				allowed: false,
				reason: `Subject matches automated reply / bounce pattern: "${email.subject}"`,
				status: 'skipped_loop'
			};
		}
	}

	// 4. Check email headers if provided
	if (email.headers) {
		const headers = email.headers;
		const autoSubmitted = (headers['auto-submitted'] || headers['Auto-Submitted'] || '').toLowerCase();
		if (autoSubmitted && autoSubmitted !== 'no') {
			return {
				allowed: false,
				reason: `Header Auto-Submitted is "${autoSubmitted}"`,
				status: 'skipped_loop'
			};
		}

		const precedence = (headers['precedence'] || headers['Precedence'] || '').toLowerCase();
		if (['bulk', 'junk', 'list', 'auto_reply'].includes(precedence)) {
			return {
				allowed: false,
				reason: `Header Precedence is "${precedence}"`,
				status: 'skipped_loop'
			};
		}

		const xAutoreply = (headers['x-autoreply'] || headers['X-Autoreply'] || '').toLowerCase();
		if (xAutoreply === 'yes' || xAutoreply === 'true') {
			return {
				allowed: false,
				reason: 'Header X-Autoreply detected',
				status: 'skipped_loop'
			};
		}
	}

	// 5. In-memory sliding rate limit
	const now = Date.now();
	const limitEntry = hourlyLimits.get(fromLower);

	if (limitEntry) {
		if (now - limitEntry.firstTimestamp < ONE_HOUR_MS) {
			if (limitEntry.count >= MAX_EMAILS_PER_HOUR) {
				return {
					allowed: false,
					reason: `Rate limit exceeded: > ${MAX_EMAILS_PER_HOUR} emails received from ${fromLower} within 1 hour`,
					status: 'skipped_spam'
				};
			}
			limitEntry.count++;
		} else {
			hourlyLimits.set(fromLower, { count: 1, firstTimestamp: now });
		}
	} else {
		hourlyLimits.set(fromLower, { count: 1, firstTimestamp: now });
	}

	// 6. Clean body length check (ignore empty ping or 0-length spam)
	const cleanBody = (email.text || '').trim();
	if (cleanBody.length < 5 && !email.subject) {
		return {
			allowed: false,
			reason: 'Empty body and subject',
			status: 'skipped_spam'
		};
	}

	return {
		allowed: true,
		status: 'allowed'
	};
}

/**
 * Parses an RFC-style email header string into name and clean email address.
 * E.g.: '"Sarah Miller" <sarah@example.com>' -> { name: 'Sarah Miller', email: 'sarah@example.com' }
 */
export function parseSenderAddress(fromHeader: string): { name: string; email: string } {
	if (!fromHeader) return { name: '', email: '' };

	const match = fromHeader.match(/^(?:["']?([^"']*)["']?\s*)?<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?$/);
	if (match) {
		const name = (match[1] || '').trim();
		const email = (match[2] || '').trim().toLowerCase();
		return {
			name: name || email.split('@')[0],
			email
		};
	}

	// Fallback regex for standard email extraction
	const emailMatch = fromHeader.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
	const email = emailMatch ? emailMatch[0].toLowerCase() : fromHeader.trim().toLowerCase();
	return {
		name: email.split('@')[0],
		email
	};
}
