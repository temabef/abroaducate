import type { GermanyProgram, ProgramProfile, FundingLane } from '$lib/copilot/types';
import { germanyPrograms } from './germany-programs';

function buildFundingLanes(program: GermanyProgram): FundingLane[] {
	return [
		{
			id: `${program.id}-lane-program`,
			funding_type: 'program_specific',
			title: `${program.university} Program-Linked Funding`,
			coverage: 'Partial living support + research assistant opportunities',
			deadline: 'Rolling after admission shortlist',
			eligibility_rules: [
				'Admitted or near-admit candidate',
				'Strong academic profile in ' + program.studyField,
				'Department fit and available project budget'
			],
			effort_level: 'high',
			next_action: 'Prepare portfolio of relevant projects and research interests for department outreach.',
			official_url: program.officialUrl
		},
		{
			id: `${program.id}-lane-country`,
			funding_type: 'country_wide',
			title: 'Germany-Wide Scholarship Routes (DAAD, Deutschlandstipendium)',
			coverage: 'Potential living support depending on scholarship terms',
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
			id: `${program.id}-lane-professor`,
			funding_type: 'professor_based',
			title: 'Professor / Research Group Funding',
			coverage: 'Project-based stipend or paid research support',
			deadline: 'Depends on lab openings',
			eligibility_rules: [
				'Strong research or project evidence',
				'Targeted outreach to relevant labs',
				'Clear research-interest alignment'
			],
			effort_level: 'high',
			next_action: 'Draft tailored professor outreach emails with a focused research pitch.',
			official_url: program.officialUrl
		}
	];
}

function toApplicationWindowState(intakes: string[]): 'open' | 'closing_soon' | 'closed' {
	const now = new Date();
	const month = now.getMonth();
	const winterDeadlineMonth = 6; // July
	const summerDeadlineMonth = 0; // January

	const hasWinter = intakes.some((i) => i.toLowerCase().includes('winter') || i.toLowerCase().includes('fall'));
	const hasSummer = intakes.some((i) => i.toLowerCase().includes('summer'));

	if (hasWinter && month >= 4 && month <= 5) return 'closing_soon';
	if (hasWinter && month <= winterDeadlineMonth) return 'open';
	if (hasSummer && month >= 10) return 'open';
	if (hasSummer && month === 11) return 'closing_soon';

	return 'open';
}

function germanProgramToProfile(program: GermanyProgram): ProgramProfile {
	const tuitionLabel =
		program.tuitionEurPerSemester === 0
			? 'EUR 0 / semester'
			: `EUR ${program.tuitionEurPerSemester.toLocaleString()} / semester`;

	return {
		id: program.id,
		country: 'Germany',
		university: program.university,
		program_name: program.programName,
		degree_level: 'Master',
		tuition: tuitionLabel,
		application_fee: program.applicationMethod === 'Uni-Assist' ? 'EUR 75 (Uni-Assist)' : 'EUR 0',
		living_cost_estimate: `EUR ${program.livingCostEurPerMonth.toLocaleString()} / month`,
		next_intake: program.intakes.includes('Winter') ? 'Winter 2026' : 'Summer 2027',
		deadline: program.deadlineSummary,
		application_window_state: toApplicationWindowState(program.intakes),
		requirements: [
			`Min GPA: ${program.requirements.minGpa4Scale} / 4.0`,
			program.requirements.englishRequired ? 'English proficiency evidence required' : '',
			program.requirements.germanRequired ? 'German proficiency evidence required' : '',
			program.requirements.workExperiencePreferred ? 'Work/research experience preferred' : '',
			`Relevant fields: ${program.requirements.relevantFieldKeywords.join(', ')}`
		].filter(Boolean),
		funding_lanes: buildFundingLanes(program)
	};
}

export const programCatalog: ProgramProfile[] = germanyPrograms.map(germanProgramToProfile);

export function findProgramById(id: string): ProgramProfile | undefined {
	return programCatalog.find((p) => p.id === id);
}

export function findGermanyProgramById(id: string): GermanyProgram | undefined {
	return germanyPrograms.find((p) => p.id === id);
}
