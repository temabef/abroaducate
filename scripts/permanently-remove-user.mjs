/**
 * permanently-remove-user.mjs
 *
 * Permanently removes a user from both Supabase and Customer.io
 * AND suppresses them in Customer.io to prevent profile recreation.
 *
 * Usage:
 *   node scripts/permanently-remove-user.mjs michaelshodipo70@gmail.com --dry-run
 *   node scripts/permanently-remove-user.mjs michaelshodipo70@gmail.com --apply
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CUSTOMER_IO_SITE_ID = process.env.CUSTOMER_IO_SITE_ID;
const CUSTOMER_IO_TRACK_API_KEY = process.env.CUSTOMER_IO_TRACK_API_KEY;
const CUSTOMER_IO_TRACK_BASE_URL = 'https://track-eu.customer.io/api/v1';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
	console.error('❌ Missing Supabase env vars');
	process.exit(1);
}

if (!CUSTOMER_IO_SITE_ID || !CUSTOMER_IO_TRACK_API_KEY) {
	console.error('❌ Missing Customer.io env vars');
	process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function getCustomerIoAuthHeader() {
	return `Basic ${Buffer.from(`${CUSTOMER_IO_SITE_ID}:${CUSTOMER_IO_TRACK_API_KEY}`).toString('base64')}`;
}

async function deleteCustomerIoProfile(identifier) {
	const authHeader = getCustomerIoAuthHeader();
	const response = await fetch(`${CUSTOMER_IO_TRACK_BASE_URL}/customers/${encodeURIComponent(identifier)}`, {
		method: 'DELETE',
		headers: {
			Authorization: authHeader
		}
	});

	if (!response.ok && response.status !== 404) {
		const errorText = await response.text();
		throw new Error(`Customer.io delete failed: ${response.status} ${errorText}`);
	}

	return response.ok;
}

async function suppressCustomerIoProfile(identifier) {
	const authHeader = getCustomerIoAuthHeader();
	const response = await fetch(`${CUSTOMER_IO_TRACK_BASE_URL}/customers/${encodeURIComponent(identifier)}/suppress`, {
		method: 'POST',
		headers: {
			Authorization: authHeader
		}
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Customer.io suppress failed: ${response.status} ${errorText}`);
	}

	return true;
}

async function permanentlyRemoveUser(email, dryRun = true) {
	console.log(`\n🔍 Looking for: ${email}`);
	console.log(`Mode: ${dryRun ? '🔍 DRY RUN' : '🔥 APPLY'}\n`);

	// 1. Check for registered user
	const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
	if (authError) {
		console.error('❌ Failed to list auth users:', authError.message);
		return;
	}

	const registeredUser = authUsers.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
	let userId = null;

	if (registeredUser) {
		userId = registeredUser.id;
		console.log(`✅ Found registered user: ${registeredUser.id}`);
		console.log(`   Email: ${registeredUser.email}`);
		console.log(`   Created: ${registeredUser.created_at}`);

		if (!dryRun) {
			// Delete from user_profiles first (foreign key constraint)
			const { error: profileError } = await supabase.from('user_profiles').delete().eq('user_id', userId);

			if (profileError) {
				console.error(`❌ Failed to delete user_profiles: ${profileError.message}`);
			} else {
				console.log(`✅ Deleted user_profiles row`);
			}

			// Delete auth user
			const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);
			if (deleteAuthError) {
				console.error(`❌ Failed to delete auth user: ${deleteAuthError.message}`);
			} else {
				console.log(`✅ Deleted auth user: ${userId}`);
			}

			// Delete from Customer.io using user ID
			try {
				await deleteCustomerIoProfile(userId);
				console.log(`✅ Deleted Customer.io profile (ID: ${userId})`);
			} catch (err) {
				console.error(`⚠️  Customer.io delete failed:`, err.message);
			}

			// Suppress by email in Customer.io to prevent recreation
			try {
				await suppressCustomerIoProfile(email);
				console.log(`✅ Suppressed Customer.io profile by email: ${email}`);
			} catch (err) {
				console.error(`❌ Customer.io suppress failed:`, err.message);
			}
		} else {
			console.log(`📋 Would delete user_profiles row`);
			console.log(`📋 Would delete auth user: ${userId}`);
			console.log(`📋 Would delete Customer.io profile (ID: ${userId})`);
			console.log(`📋 Would suppress Customer.io profile by email: ${email}`);
		}
	}

	// 2. Check for newsletter subscriber
	const { data: newsletterSub, error: subError } = await supabase
		.from('newsletter_subscribers')
		.select('*')
		.eq('email', email)
		.maybeSingle();

	if (subError) {
		console.error('❌ Failed to check newsletter_subscribers:', subError.message);
	} else if (newsletterSub) {
		console.log(`\n✅ Found newsletter subscriber: ${newsletterSub.id}`);
		console.log(`   Email: ${newsletterSub.email}`);
		console.log(`   Status: ${newsletterSub.status}`);
		console.log(`   Subscribed: ${newsletterSub.subscribed_at}`);

		if (!dryRun) {
			// Delete newsletter subscriber
			const { error: deleteSubError } = await supabase
				.from('newsletter_subscribers')
				.delete()
				.eq('id', newsletterSub.id);

			if (deleteSubError) {
				console.error(`❌ Failed to delete newsletter subscriber: ${deleteSubError.message}`);
			} else {
				console.log(`✅ Deleted newsletter subscriber: ${newsletterSub.id}`);
			}

			// Delete from Customer.io using newsletter prefix
			try {
				await deleteCustomerIoProfile(`newsletter_${newsletterSub.id}`);
				console.log(`✅ Deleted Customer.io profile (ID: newsletter_${newsletterSub.id})`);
			} catch (err) {
				console.error(`⚠️  Customer.io delete failed:`, err.message);
			}

			// Suppress by email (if not already done above)
			if (!userId) {
				try {
					await suppressCustomerIoProfile(email);
					console.log(`✅ Suppressed Customer.io profile by email: ${email}`);
				} catch (err) {
					console.error(`❌ Customer.io suppress failed:`, err.message);
				}
			}
		} else {
			console.log(`📋 Would delete newsletter subscriber: ${newsletterSub.id}`);
			console.log(`📋 Would delete Customer.io profile (ID: newsletter_${newsletterSub.id})`);
			if (!userId) {
				console.log(`📋 Would suppress Customer.io profile by email: ${email}`);
			}
		}
	}

	if (!registeredUser && !newsletterSub) {
		console.log(`⚠️  No records found in Supabase for: ${email}`);
		console.log(`\nℹ️  The profile may only exist in Customer.io.`);
		console.log(`   You should still suppress it to prevent recreation.\n`);

		if (!dryRun) {
			try {
				await suppressCustomerIoProfile(email);
				console.log(`✅ Suppressed Customer.io profile by email: ${email}`);
			} catch (err) {
				console.error(`❌ Customer.io suppress failed:`, err.message);
			}
		} else {
			console.log(`📋 Would suppress Customer.io profile by email: ${email}`);
		}
	}

	console.log(`\n${'='.repeat(60)}`);
	if (dryRun) {
		console.log(`✅ DRY RUN complete. Run with --apply to execute.`);
	} else {
		console.log(`✅ User permanently removed and suppressed.`);
		console.log(`\nℹ️  The suppression prevents Customer.io from recreating`);
		console.log(`   this profile when future emails are sent.`);
	}
	console.log(`${'='.repeat(60)}\n`);
}

// Parse CLI args
const args = process.argv.slice(2);
const email = args.find((a) => !a.startsWith('--'));
const dryRun = !args.includes('--apply');

if (!email) {
	console.error(`
Usage:
  node scripts/permanently-remove-user.mjs <email> [--apply]

Examples:
  node scripts/permanently-remove-user.mjs michaelshodipo70@gmail.com --dry-run
  node scripts/permanently-remove-user.mjs michaelshodipo70@gmail.com --apply
	`);
	process.exit(1);
}

permanentlyRemoveUser(email, dryRun)
	.then(() => process.exit(0))
	.catch((err) => {
		console.error('❌ Script failed:', err);
		process.exit(1);
	});
