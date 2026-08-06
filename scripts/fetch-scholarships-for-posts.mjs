/**
 * fetch-scholarships-for-posts.mjs
 * 
 * Fetch 5 great scholarships for social media posts
 * Focus on: broad eligibility, upcoming deadlines, clear benefits
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
	process.env.PUBLIC_SUPABASE_URL,
	process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n🔍 Fetching scholarships for social media posts...\n');

const { data: scholarships, error } = await supabase
	.from('scholarships')
	.select('id, scholarship_name, organization_name, country, benefits, application_deadline, eligibility_criteria, scholarship_link, target_countries, degree_levels')
	.gte('application_deadline', new Date().toISOString().split('T')[0])
	.lte('application_deadline', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
	.not('benefits', 'is', null)
	.not('scholarship_link', 'is', null)
	.order('application_deadline', { ascending: true })
	.limit(20);

if (error) {
	console.error('❌ Error fetching scholarships:', error.message);
	process.exit(1);
}

if (!scholarships || scholarships.length === 0) {
	console.log('⚠️  No scholarships found with upcoming deadlines.');
	console.log('Fetching 5 most popular scholarships instead...\n');
	
	const { data: fallback } = await supabase
		.from('scholarships')
		.select('id, scholarship_name, organization_name, country, benefits, application_deadline, eligibility_criteria, scholarship_link, target_countries, degree_levels')
		.not('benefits', 'is', null)
		.not('scholarship_link', 'is', null)
		.order('created_at', { ascending: false })
		.limit(10);
	
	if (fallback && fallback.length > 0) {
		scholarships.push(...fallback);
	}
}

// Filter for broad eligibility
const broadScholarships = scholarships.filter(s => {
	const eligibility = String(s.eligibility_criteria || '').toLowerCase();
	const target = String(s.target_countries || '').toLowerCase();
	
	return (
		target.includes('developing') ||
		target.includes('africa') ||
		target.includes('international') ||
		target.includes('all') ||
		eligibility.includes('international students') ||
		eligibility.includes('all countries') ||
		eligibility.includes('developing countries')
	);
});

// Prioritize fully funded
const sorted = broadScholarships.sort((a, b) => {
	const aFullyFunded = String(a.benefits || '').toLowerCase().includes('fully funded');
	const bFullyFunded = String(b.benefits || '').toLowerCase().includes('fully funded');
	
	if (aFullyFunded && !bFullyFunded) return -1;
	if (!aFullyFunded && bFullyFunded) return 1;
	return 0;
});

// Take top 5
const top5 = sorted.slice(0, 5);

console.log(`✅ Found ${scholarships.length} scholarships, filtered to ${top5.length} for posting:\n`);

top5.forEach((s, i) => {
	console.log(`${i + 1}. ${s.scholarship_name}`);
	console.log(`   Organization: ${s.organization_name}`);
	console.log(`   Country: ${s.country || 'Multiple'}`);
	console.log(`   Deadline: ${s.application_deadline || 'Rolling'}`);
	console.log(`   Benefits: ${String(s.benefits || '').substring(0, 100)}...`);
	console.log(`   Link: ${s.scholarship_link}`);
	console.log('');
});

// Export as JSON for post generation
console.log('\n📋 JSON Output:\n');
console.log(JSON.stringify(top5, null, 2));
