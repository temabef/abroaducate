import type { ProgramProfile } from '$lib/copilot/types';

export const programMvpProfile: ProgramProfile = {
	id: 'rwth-software-systems',
	country: 'Germany',
	university: 'RWTH Aachen University',
	program_name: 'M.Sc. Software Systems Engineering',
	degree_level: 'Master',
	tuition: 'EUR 0 / semester',
	application_fee: 'EUR 0',
	living_cost_estimate: 'EUR 950 / month',
	next_intake: 'Winter 2026',
	deadline: 'Apply by 15 July 2026',
	application_window_state: 'closing_soon',
	requirements: [
		'Bachelor in a relevant computing field',
		'English proficiency evidence (IELTS/TOEFL or accepted equivalent)',
		'Strong academic performance and technical foundation',
		'Statement of purpose and required transcripts'
	],
	funding_lanes: [
		{
			id: 'rwth-lane-program',
			funding_type: 'program_specific',
			title: 'RWTH Program-Linked Funding Path',
			coverage: 'Partial living support + research assistant opportunities',
			deadline: 'Rolling after admission shortlist',
			eligibility_rules: [
				'Admitted or near-admit candidate',
				'Strong technical profile',
				'Department fit and available project budget'
			],
			effort_level: 'high',
			next_action: 'Prepare portfolio of projects and technical proof for department outreach.',
			official_url: 'https://www.rwth-aachen.de'
		},
		{
			id: 'rwth-lane-country',
			funding_type: 'country_wide',
			title: 'Germany-Wide Scholarship Routes',
			coverage: 'Potential tuition/living support depending on scholarship terms',
			deadline: 'Varies by scholarship cycle',
			eligibility_rules: [
				'Country-specific eligibility rules',
				'Academic merit and motivation quality',
				'Complete application documentation'
			],
			effort_level: 'medium',
			next_action: 'Shortlist two scholarship calls aligned with this program timeline.',
			official_url: 'https://www.daad.de/en/'
		},
		{
			id: 'rwth-lane-professor',
			funding_type: 'professor_based',
			title: 'Professor / Research Group Funding',
			coverage: 'Project-based stipend or paid research support',
			deadline: 'Depends on lab openings',
			eligibility_rules: [
				'Strong research or engineering project evidence',
				'Targeted outreach to relevant labs',
				'Clear research-interest alignment'
			],
			effort_level: 'high',
			next_action: 'Draft tailored professor outreach emails with a focused research pitch.',
			official_url: 'https://www.rwth-aachen.de'
		}
	]
};
