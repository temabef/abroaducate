#!/usr/bin/env node

/**
 * Clean spam contact form submissions from database
 * 
 * Identifies and optionally deletes spam based on:
 * - Random character names/messages
 * - No vowels in name
 * - Very short messages with gibberish
 * 
 * Usage:
 *   node scripts/clean-spam-submissions.mjs         # Dry run (preview only)
 *   node scripts/clean-spam-submissions.mjs --apply # Actually delete spam
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error('❌ Missing environment variables: PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const APPLY_CHANGES = process.argv.includes('--apply');

/**
 * Detect if text looks like random gibberish
 */
function isLikelyGibberish(text) {
	if (!text || text.length < 5) return false;

	// Check for vowels - legitimate names have vowels
	const vowels = text.match(/[aeiouAEIOU]/g);
	const vowelRatio = vowels ? vowels.length / text.length : 0;
	
	// If less than 10% vowels, likely gibberish
	if (vowelRatio < 0.1 && text.length > 10) return true;

	// Check for excessive uppercase/lowercase mixing (random case patterns)
	const upperCount = (text.match(/[A-Z]/g) || []).length;
	const lowerCount = (text.match(/[a-z]/g) || []).length;
	if (upperCount > 3 && lowerCount > 3) {
		const caseRatio = Math.min(upperCount, lowerCount) / Math.max(upperCount, lowerCount);
		if (caseRatio > 0.4 && caseRatio < 0.8) return true; // Excessive mixing
	}

	// Check for repeated patterns that look random
	if (/([A-Z]{2,}[a-z]{2,}){3,}/.test(text)) return true;

	return false;
}

/**
 * Main cleanup function
 */
async function cleanSpamSubmissions() {
	console.log(`\n🔍 Scanning contact form submissions for spam...\n`);

	// Fetch all submissions
	const { data: submissions, error } = await supabase
		.from('contact_submissions')
		.select('*')
		.order('created_at', { ascending: false });

	if (error) {
		console.error('❌ Error fetching submissions:', error);
		process.exit(1);
	}

	if (!submissions || submissions.length === 0) {
		console.log('✅ No submissions found in database.');
		return;
	}

	console.log(`📊 Found ${submissions.length} total submissions\n`);

	// Identify spam
	const spamSubmissions = submissions.filter(sub => {
		const nameGibberish = isLikelyGibberish(sub.name);
		const messageGibberish = isLikelyGibberish(sub.message);
		const subjectGibberish = sub.subject ? isLikelyGibberish(sub.subject) : false;

		// Flag as spam if 2+ fields are gibberish
		const gibberishCount = [nameGibberish, messageGibberish, subjectGibberish].filter(Boolean).length;
		
		return gibberishCount >= 2;
	});

	if (spamSubmissions.length === 0) {
		console.log('✅ No spam detected in submissions!');
		return;
	}

	console.log(`🚨 Found ${spamSubmissions.length} likely spam submissions:\n`);

	// Display spam submissions
	spamSubmissions.forEach((sub, index) => {
		console.log(`${index + 1}. ID: ${sub.id}`);
		console.log(`   Name: ${sub.name}`);
		console.log(`   Email: ${sub.email}`);
		console.log(`   Subject: ${sub.subject || '(none)'}`);
		console.log(`   Message: ${sub.message.substring(0, 50)}...`);
		console.log(`   Date: ${new Date(sub.created_at).toLocaleString()}`);
		console.log('');
	});

	if (!APPLY_CHANGES) {
		console.log('🔎 DRY RUN — No changes made.');
		console.log(`\n💡 To delete these ${spamSubmissions.length} spam submissions, run:`);
		console.log('   node scripts/clean-spam-submissions.mjs --apply\n');
		return;
	}

	// Delete spam submissions
	console.log(`\n🗑️  Deleting ${spamSubmissions.length} spam submissions...\n`);

	const spamIds = spamSubmissions.map(s => s.id);
	const { error: deleteError } = await supabase
		.from('contact_submissions')
		.delete()
		.in('id', spamIds);

	if (deleteError) {
		console.error('❌ Error deleting submissions:', deleteError);
		process.exit(1);
	}

	console.log(`✅ Successfully deleted ${spamSubmissions.length} spam submissions!`);
	console.log(`📊 Remaining submissions: ${submissions.length - spamSubmissions.length}\n`);
}

// Run
cleanSpamSubmissions()
	.catch(err => {
		console.error('❌ Script error:', err);
		process.exit(1);
	});
