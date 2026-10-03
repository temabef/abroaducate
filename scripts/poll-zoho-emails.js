/**
 * Standalone Zoho Mail AI Auto-Responder Poller
 *
 * Runs locally or on a VPS/Server cron to continuously check Zoho Mail for
 * unread student messages, process them through the AI Agent, reply, and mark them as read.
 *
 * Usage:
 *   node -r dotenv/config scripts/poll-zoho-emails.js
 *   node -r dotenv/config scripts/poll-zoho-emails.js --dry-run
 */

import dotenv from 'dotenv';
dotenv.config();

import { processZohoInbox, testZohoConnection } from '../src/lib/server/ai-email-agent/zoho-client.js';

async function main() {
	const isDryRun = process.argv.includes('--dry-run');
	console.log(`[ZOHO_AGENT] 🚀 Starting Zoho Inbox Poller (${isDryRun ? 'DRY RUN' : 'AUTONOMOUS REPLY MODE'})...`);

	console.log('[ZOHO_AGENT] Testing connection to imap.zoho.eu & smtp.zoho.eu...');
	const conn = await testZohoConnection();

	if (!conn.success) {
		console.error('[ZOHO_AGENT] ❌ Connection failed:', conn.error);
		process.exit(1);
	}

	console.log(`[ZOHO_AGENT] ✅ Connected successfully! Found ${conn.unreadCount} unread email(s) in Zoho.`);

	if ((conn.unreadCount || 0) === 0) {
		console.log('[ZOHO_AGENT] Inbox is up to date. No unread emails.');
		process.exit(0);
	}

	console.log('[ZOHO_AGENT] Processing unread messages...');
	const result = await processZohoInbox({
		limit: 15,
		dryRun: isDryRun,
		forceAutonomous: !isDryRun
	});

	console.log('\n--- EXECUTION SUMMARY ---');
	console.log(`Total Processed: ${result.processedCount}`);
	console.log(`Replies Sent:    ${result.repliedCount}`);
	console.log(`Skipped/Loops:   ${result.skippedCount}`);
	console.log(`Failures:        ${result.failedCount}`);
	console.log('-------------------------\n');

	for (const item of result.items) {
		console.log(`[${item.status.toUpperCase()}] ${item.from}: "${item.subject}"`);
		if (item.summary) console.log(`   └─ ${item.summary}`);
		if (item.error) console.log(`   └─ ❌ ${item.error}`);
	}
}

main().catch((err) => {
	console.error('[ZOHO_AGENT] Unhandled fatal error:', err);
	process.exit(1);
});
