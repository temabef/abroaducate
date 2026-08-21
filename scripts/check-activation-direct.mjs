#!/usr/bin/env node
/**
 * Week 1 Activation Dashboard - Direct Query Version
 * Runs individual queries directly (no RPC needed)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
	console.error('❌ Missing Supabase credentials');
	process.exit(1);
}

// Bypass SSL verification for localhost development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false
	}
});

console.log('🔍 Running Week 1 Activation Dashboard...\n');
console.log('📅 Analysis Period: July 29 - August 5, 2026\n');

const results = {};

// Check 4: Activation Rate - Before vs After Fix
console.log('📊 Check 4: ACTIVATION RATE COMPARISON...');
try {
	// Before fix (July 22-28)
	const { count: beforeSignups, error: error1 } = await supabase
		.from('user_profiles')
		.select('*', { count: 'exact', head: true })
		.gte('created_at', '2026-07-22')
		.lt('created_at', '2026-07-29');

	const { data: beforeActivated, error: error2 } = await supabase
		.from('credit_transactions')
		.select('user_id')
		.lt('amount', 0)
		.not('action_type', 'like', 'STRIPE_%')
		.gte('created_at', '2026-07-22')
		.lt('created_at', '2026-07-29');

	const beforeActivatedCount = new Set(beforeActivated?.map((r) => r.user_id) || []).size;
	const beforeRate = beforeSignups ? ((beforeActivatedCount / beforeSignups) * 100).toFixed(2) : 0;

	// After fix (July 29 - Aug 5)
	const { count: afterSignups, error: error3 } = await supabase
		.from('user_profiles')
		.select('*', { count: 'exact', head: true })
		.gte('created_at', '2026-07-29')
		.lt('created_at', '2026-08-06');

	const { data: afterActivated, error: error4 } = await supabase
		.from('credit_transactions')
		.select('user_id')
		.lt('amount', 0)
		.not('action_type', 'like', 'STRIPE_%')
		.gte('created_at', '2026-07-29')
		.lt('created_at', '2026-08-06');

	const afterActivatedCount = new Set(afterActivated?.map((r) => r.user_id) || []).size;
	const afterRate = afterSignups ? ((afterActivatedCount / afterSignups) * 100).toFixed(2) : 0;

	results.activationComparison = {
		before: {
			period: 'Before Fix (July 22-28)',
			signups: beforeSignups || 0,
			activated: beforeActivatedCount,
			rate: beforeRate
		},
		after: {
			period: 'After Fix (July 29 - Aug 5)',
			signups: afterSignups || 0,
			activated: afterActivatedCount,
			rate: afterRate
		}
	};

	console.log('   ✅ Before Fix: ' + beforeActivatedCount + '/' + beforeSignups + ' = ' + beforeRate + '%');
	console.log('   ✅ After Fix: ' + afterActivatedCount + '/' + afterSignups + ' = ' + afterRate + '%');
	console.log('   📈 Change: ' + ((afterRate - beforeRate) > 0 ? '+' : '') + (afterRate - beforeRate).toFixed(2) + ' percentage points\n');
} catch (err) {
	console.error('   ❌ Error:', err.message);
	results.activationComparison = { error: err.message };
}

// Check 6: Feature Usage (Last 7 Days)
console.log('📊 Check 6: FEATURE USAGE (LAST 7 DAYS)...');
try {
	const { data, error } = await supabase
		.from('credit_transactions')
		.select('action_type, user_id, amount')
		.lt('amount', 0)
		.not('action_type', 'like', 'STRIPE_%')
		.gte('created_at', '2026-07-29')
		.lt('created_at', '2026-08-06');

	if (error) throw error;

	const usage = {};
	data.forEach((t) => {
		if (!usage[t.action_type]) {
			usage[t.action_type] = { total_uses: 0, unique_users: new Set(), total_credits: 0 };
		}
		usage[t.action_type].total_uses++;
		usage[t.action_type].unique_users.add(t.user_id);
		usage[t.action_type].total_credits += Math.abs(t.amount);
	});

	const featureUsage = Object.keys(usage)
		.map((key) => ({
			feature: key,
			total_uses: usage[key].total_uses,
			unique_users: usage[key].unique_users.size,
			avg_credits: (usage[key].total_credits / usage[key].total_uses).toFixed(2)
		}))
		.sort((a, b) => b.total_uses - a.total_uses);

	results.featureUsage = featureUsage;

	console.table(featureUsage);
	console.log();
} catch (err) {
	console.error('   ❌ Error:', err.message);
	results.featureUsage = { error: err.message };
}

// Check 7: User Segments by Credit Balance
console.log('📊 Check 7: USER SEGMENTS BY CREDIT BALANCE...');
try {
	const { data, error } = await supabase.from('user_profiles').select('credits');

	if (error) throw error;

	const segments = {
		never_activated: 0, // 3 credits
		tested_once: 0, // 1-2 credits
		used_all: 0, // 0 credits
		small_purchase: 0, // 4-19 credits
		bought_credits: 0 // 20+ credits
	};

	data.forEach((p) => {
		if (p.credits === 3) segments.never_activated++;
		else if (p.credits >= 1 && p.credits <= 2) segments.tested_once++;
		else if (p.credits === 0) segments.used_all++;
		else if (p.credits >= 4 && p.credits <= 19) segments.small_purchase++;
		else if (p.credits >= 20) segments.bought_credits++;
	});

	const total = data.length;
	const segmentData = [
		{
			segment: '🆕 Never Activated (3 credits)',
			users: segments.never_activated,
			percentage: ((segments.never_activated / total) * 100).toFixed(2) + '%'
		},
		{
			segment: '✅ Tested Once (1-2 left)',
			users: segments.tested_once,
			percentage: ((segments.tested_once / total) * 100).toFixed(2) + '%'
		},
		{
			segment: '🔥 Used All (0 credits)',
			users: segments.used_all,
			percentage: ((segments.used_all / total) * 100).toFixed(2) + '%'
		},
		{
			segment: '🛒 Small Purchase (4-19)',
			users: segments.small_purchase,
			percentage: ((segments.small_purchase / total) * 100).toFixed(2) + '%'
		},
		{
			segment: '💰 Bought Credits (20+)',
			users: segments.bought_credits,
			percentage: ((segments.bought_credits / total) * 100).toFixed(2) + '%'
		}
	];

	results.userSegments = segmentData;

	console.table(segmentData);
	console.log();
} catch (err) {
	console.error('   ❌ Error:', err.message);
	results.userSegments = { error: err.message };
}

// Check 8: Overall Platform Activation
console.log('📊 Check 8: OVERALL PLATFORM ACTIVATION STATS...');
try {
	const { count: totalUsers } = await supabase
		.from('user_profiles')
		.select('*', { count: 'exact', head: true });

	const { data: activated } = await supabase
		.from('credit_transactions')
		.select('user_id')
		.lt('amount', 0)
		.not('action_type', 'like', 'STRIPE_%');

	const { data: paying } = await supabase
		.from('credit_transactions')
		.select('user_id')
		.like('action_type', 'STRIPE_%');

	const activatedCount = new Set(activated?.map((r) => r.user_id) || []).size;
	const payingCount = new Set(paying?.map((r) => r.user_id) || []).size;

	const overallStats = {
		total_users: totalUsers || 0,
		activated_users: activatedCount,
		paying_users: payingCount,
		lifetime_activation_rate: ((activatedCount / (totalUsers || 1)) * 100).toFixed(2) + '%',
		conversion_to_paid_rate: ((payingCount / (totalUsers || 1)) * 100).toFixed(2) + '%'
	};

	results.overallStats = overallStats;

	console.table([overallStats]);
	console.log();
} catch (err) {
	console.error('   ❌ Error:', err.message);
	results.overallStats = { error: err.message };
}

// Generate Summary
console.log('\n' + '='.repeat(80));
console.log('📋 SUMMARY & NEXT STEPS');
console.log('='.repeat(80) + '\n');

if (results.activationComparison && !results.activationComparison.error) {
	const { before, after } = results.activationComparison;
	const improvement = (parseFloat(after.rate) - parseFloat(before.rate)).toFixed(2);

	let recommendation = '';
	if (parseFloat(after.rate) >= 25) {
		recommendation = `🎉 FIX IS WORKING! Activation at ${after.rate}% (target: 25%+). Continue optimizing discovery and trust signals.`;
	} else if (parseFloat(after.rate) >= 15) {
		recommendation = `✅ FIX IS EFFECTIVE. Activation at ${after.rate}% (target: 15-25%). Next: Improve feature discovery on programs page.`;
	} else if (parseFloat(after.rate) >= 10) {
		recommendation = `⚠️ PARTIAL IMPROVEMENT. Activation at ${after.rate}% (target: 15%+). Next: Add sample strategy preview + onboarding banner.`;
	} else {
		recommendation = `❌ FIX NOT EFFECTIVE. Activation at ${after.rate}% (target: 15%+). Check trigger status and investigate behavioral blockers.`;
	}

	console.log(recommendation);
	console.log(`\n📊 Before: ${before.activated}/${before.signups} = ${before.rate}%`);
	console.log(`📊 After: ${after.activated}/${after.signups} = ${after.rate}%`);
	console.log(`📈 Improvement: ${improvement > 0 ? '+' : ''}${improvement} percentage points\n`);

	results.summary = {
		recommendation,
		before_rate: before.rate + '%',
		after_rate: after.rate + '%',
		improvement: improvement + ' pp'
	};
}

// Save report
const reportPath = join(process.cwd(), 'docs', 'WEEK1_REPORT_2026-08-05.md');
let markdown = `# Week 1 Activation Fix Results\n\n`;
markdown += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
markdown += `**Fix Deployed:** July 29, 2026\n`;
markdown += `**Analysis Period:** 7 days (July 29 - August 5, 2026)\n\n`;
markdown += `---\n\n`;

if (results.summary) {
	markdown += `## Summary\n\n`;
	markdown += `${results.summary.recommendation}\n\n`;
	markdown += `- **Before Fix:** ${results.summary.before_rate}\n`;
	markdown += `- **After Fix:** ${results.summary.after_rate}\n`;
	markdown += `- **Improvement:** ${results.summary.improvement}\n\n`;
	markdown += `---\n\n`;
}

if (results.activationComparison) {
	markdown += `## Activation Rate Comparison\n\n`;
	markdown += `\`\`\`json\n${JSON.stringify(results.activationComparison, null, 2)}\n\`\`\`\n\n`;
}

if (results.featureUsage) {
	markdown += `## Feature Usage (Last 7 Days)\n\n`;
	markdown += `\`\`\`json\n${JSON.stringify(results.featureUsage, null, 2)}\n\`\`\`\n\n`;
}

if (results.userSegments) {
	markdown += `## User Segments by Credit Balance\n\n`;
	markdown += `\`\`\`json\n${JSON.stringify(results.userSegments, null, 2)}\n\`\`\`\n\n`;
}

if (results.overallStats) {
	markdown += `## Overall Platform Stats\n\n`;
	markdown += `\`\`\`json\n${JSON.stringify(results.overallStats, null, 2)}\n\`\`\`\n\n`;
}

writeFileSync(reportPath, markdown);
console.log(`✅ Report saved to: ${reportPath}\n`);
