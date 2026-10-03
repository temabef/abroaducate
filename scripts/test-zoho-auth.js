import dotenv from 'dotenv';
dotenv.config();

import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';

const email = process.env.ZOHO_EMAIL || 'hello@abroaducate.com';
const rawPass = process.env.ZOHO_APP_PASSWORD || '';
const pass = rawPass.replace(/\s+/g, '');
const imapHost = process.env.ZOHO_IMAP_HOST || 'imap.zoho.eu';
const smtpHost = process.env.ZOHO_SMTP_HOST || 'smtp.zoho.eu';

console.log(`Connecting to Zoho Mailbox...`);
console.log(`User: ${email}`);
console.log(`IMAP Server: ${imapHost}:993`);
console.log(`SMTP Server: ${smtpHost}:465`);

async function test() {
	// 1. Test IMAP
	console.log('\n1. Testing IMAP (reading inbox)...');
	const imap = new ImapFlow({
		host: imapHost,
		port: 993,
		secure: true,
		tls: {
			rejectUnauthorized: false
		},
		auth: {
			user: email,
			pass: pass
		},
		logger: false
	});

	try {
		await imap.connect();
		console.log('   ✅ IMAP connection established!');
		const lock = await imap.getMailboxLock('INBOX');
		try {
			const status = await imap.status('INBOX', { unseen: true, messages: true });
			console.log(`   📬 Total messages in Inbox: ${status.messages}`);
			console.log(`   🔥 Unread messages: ${status.unseen}`);

			// Search for unread message subjects
			const unread = await imap.search({ seen: false });
			console.log(`   Found ${unread.length} unread UIDs.`);

			if (unread.length > 0) {
				console.log('\n--- SAMPLE UNREAD STUDENT EMAILS IN ZOHO ---');
				const firstFew = unread.slice(0, 5);
				for (const uid of firstFew) {
					const msg = await imap.fetchOne(uid, { envelope: true });
					const from = msg.envelope?.from?.[0]?.address;
					const subject = msg.envelope?.subject;
					console.log(`   - From: ${from} | Subject: "${subject}"`);
				}
			}
		} finally {
			lock.release();
		}
		await imap.logout();
	} catch (err) {
		console.error('   ❌ IMAP Authentication failed:', err.message);
	}

	// 2. Test SMTP
	console.log('\n2. Testing SMTP (sending capabilities)...');
	const transporter = nodemailer.createTransport({
		host: smtpHost,
		port: 465,
		secure: true,
		tls: {
			rejectUnauthorized: false
		},
		auth: {
			user: email,
			pass: pass
		}
	});

	try {
		await transporter.verify();
		console.log('   ✅ SMTP connection and authentication verified!');
	} catch (err) {
		console.error('   ❌ SMTP Authentication failed:', err.message);
	}
}

test();
