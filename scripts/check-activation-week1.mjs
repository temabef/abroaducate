#!/usr/bin/env node
/**
 * Week 1 Activation Dashboard
 * Runs the comprehensive activation check SQL and saves results
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
	console.error('❌ Missing Supabase credentials');
	process.exit(1);
}

// Bypass SSL verification for localhost development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

console.log('🔍 Running Week 1 Activation Dashboard...\n');

// Read the SQL file
const sqlPath = join(process.cwd(), 'database_scripts', 'activation_fix_week1_dashboard.sql');
const sql = readFileSync(sqlPath, 'utf-8');

// Split SQL into individual queries (by check sections)
const queries = sql
	.split(/-- ={40,}/g)
	.filter((q) => q.trim() && !q.startsWith('-- END OF'))
	.map((q) => q.trim());

const results = [];

// Execute each query section
for (let i = 0; i < queries.length; i++) {
	const query = queries[i];
	const match = query.match(/-- (\d+)\.\s+(.+)/);
	if (!match) continue;

	const checkNum = match[1];
	const checkName = match[2].trim();

	// Extract actual SQL (skip comments and blank lines)
	const sqlLines = query
		.split('\n')
		.filter((line) => !line.trim().startsWith('--') && line.trim())
		.join('\n');

	console.log(`📊 Check ${checkNum}: ${checkName}...`);

	try {
		const { data, error } = await supabase.rpc('execute_sql', { query_text: sqlLines });

		if (error) {
			console.error(`   ❌ Error:`, error.message);
			results.push({
				check: `${checkNum}. ${checkName}`,
				status: 'ERROR',
				error: error.message
			});
		} else {
			console.log(`   ✅ Success (${data?.length || 0} rows)\n`);
			results.push({
				check: `${checkNum}. ${checkName}`,
				status: 'SUCCESS',
				data: data
			});
		}
	} catch (err) {
		console.error(`   ❌ Exception:`, err.message);
		results.push({
			check: `${checkNum}. ${checkName}`,
			status: 'ERROR',
			error: err.message
		});
	}
}

// Generate report
console.log('\n' + '='.repeat(80));
console.log('📋 WEEK 1 ACTIVATION DASHBOARD RESULTS');
console.log('='.repeat(80) + '\n');

let markdown = `# Week 1 Activation Fix Results\n\n`;
markdown += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
markdown += `**Fix Deployed:** July 29, 2026\n`;
markdown += `**Analysis Period:** 7 days (July 29 - August 5, 2026)\n\n`;
markdown += `---\n\n`;

for (const result of results) {
	console.log(`\n## ${result.check}`);
	markdown += `## ${result.check}\n\n`;

	if (result.status === 'ERROR') {
		console.log(`❌ ERROR: ${result.error}`);
		markdown += `**Status:** ❌ Error\n\n`;
		markdown += `**Error:** ${result.error}\n\n`;
	} else if (result.data && result.data.length > 0) {
		console.table(result.data);
		markdown += `\`\`\`\n`;
		markdown += JSON.stringify(result.data, null, 2);
		markdown += `\n\`\`\`\n\n`;
	} else {
		console.log('(No data)');
		markdown += `*No data returned*\n\n`;
	}
}

// Save report
const reportPath = join(process.cwd(), 'docs', 'WEEK1_REPORT_2026-08-05.md');
writeFileSync(reportPath, markdown);
console.log(`\n✅ Report saved to: ${reportPath}\n`);
