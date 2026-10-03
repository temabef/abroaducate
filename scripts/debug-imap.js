import dotenv from 'dotenv';
dotenv.config();

import { ImapFlow } from 'imapflow';

const email = process.env.ZOHO_EMAIL || 'hello@abroaducate.com';
const pass = (process.env.ZOHO_APP_PASSWORD || '').replace(/\s+/g, '');

const imap = new ImapFlow({
	host: 'imap.zoho.eu',
	port: 993,
	secure: true,
	tls: { rejectUnauthorized: false },
	auth: { user: email, pass: pass },
	logger: {
		debug: (obj) => console.log('[DEBUG]', obj.msg || obj),
		info: (obj) => console.log('[INFO]', obj.msg || obj),
		warn: (obj) => console.warn('[WARN]', obj.msg || obj),
		error: (obj) => console.error('[ERROR]', obj.msg || obj)
	}
});

async function run() {
	try {
		await imap.connect();
		console.log('CONNECTED TO IMAP!');
		await imap.logout();
	} catch (e) {
		console.error('FULL IMAP ERROR:', e);
	}
}

run();
