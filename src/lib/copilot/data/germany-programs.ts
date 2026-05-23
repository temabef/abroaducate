import type { GermanyProgram } from '$lib/copilot/types';

export const germanyPrograms: GermanyProgram[] = [
	{
		id: 'tum-data-engineering',
		university: 'Technical University of Munich',
		programName: 'M.Sc. Data Engineering and Analytics',
		city: 'Munich',
		studyField: 'Data Science',
		degreeLevel: 'masters',
		language: 'English',
		tuitionEurPerSemester: 0,
		semesterFeeEur: 150,
		blockedAccountEurPerYear: 11208,
		livingCostEurPerMonth: 1350,
		applicationMethod: 'Direct',
		intakes: ['Winter'],
		deadlineSummary: 'Winter intake; prepare documents early in spring.',
		officialUrl: 'https://www.tum.de',
		affordabilityNotes: [
			'No tuition for many public-track international master\'s routes in Germany.',
			'Munich has a high living-cost profile.',
			'Students should plan for blocked-account requirements and semester fees.'
		],
		requirements: {
			minGpa4Scale: 3.3,
			englishRequired: true,
			germanRequired: false,
			relevantFieldKeywords: ['data', 'computer', 'software', 'statistics', 'analytics'],
			workExperiencePreferred: false
		}
	},
	{
		id: 'rwth-software-systems',
		university: 'RWTH Aachen University',
		programName: 'M.Sc. Software Systems Engineering',
		city: 'Aachen',
		studyField: 'Software Engineering',
		degreeLevel: 'masters',
		language: 'English',
		tuitionEurPerSemester: 0,
		semesterFeeEur: 320,
		blockedAccountEurPerYear: 11208,
		livingCostEurPerMonth: 950,
		applicationMethod: 'Direct',
		intakes: ['Winter'],
		deadlineSummary: 'Winter intake; competitive technical profile expected.',
		officialUrl: 'https://www.rwth-aachen.de',
		affordabilityNotes: [
			'Public-university cost structure keeps tuition low.',
			'Semester fee often covers transport and student services.',
			'Aachen is more affordable than Munich or Berlin.'
		],
		requirements: {
			minGpa4Scale: 3.1,
			englishRequired: true,
			germanRequired: false,
			relevantFieldKeywords: ['software', 'computer', 'engineering', 'systems', 'it'],
			workExperiencePreferred: false
		}
	},
	{
		id: 'heidelberg-molecular-bio',
		university: 'Heidelberg University',
		programName: 'M.Sc. Molecular Biosciences',
		city: 'Heidelberg',
		studyField: 'Biology',
		degreeLevel: 'masters',
		language: 'English',
		tuitionEurPerSemester: 1500,
		semesterFeeEur: 170,
		blockedAccountEurPerYear: 11208,
		livingCostEurPerMonth: 1050,
		applicationMethod: 'Direct',
		intakes: ['Winter'],
		deadlineSummary: 'Tuition may apply depending on state rules; verify latest state policy.',
		officialUrl: 'https://www.uni-heidelberg.de',
		affordabilityNotes: [
			'Still lower-cost than many US and UK pathways, even where tuition applies.',
			'Strong research environment for science-focused applicants.',
			'Applicants should check Baden-Wurttemberg fee rules.'
		],
		requirements: {
			minGpa4Scale: 3.4,
			englishRequired: true,
			germanRequired: false,
			relevantFieldKeywords: ['biology', 'biochemistry', 'biotech', 'molecular', 'life science'],
			workExperiencePreferred: true
		}
	},
	{
		id: 'tu-berlin-cs',
		university: 'TU Berlin',
		programName: 'M.Sc. Computer Science',
		city: 'Berlin',
		studyField: 'Computer Science',
		degreeLevel: 'masters',
		language: 'English',
		tuitionEurPerSemester: 0,
		semesterFeeEur: 315,
		blockedAccountEurPerYear: 11208,
		livingCostEurPerMonth: 1150,
		applicationMethod: 'Uni-Assist',
		intakes: ['Winter', 'Summer'],
		deadlineSummary: 'Uni-Assist processing can take time; start early.',
		officialUrl: 'https://www.tu.berlin',
		affordabilityNotes: [
			'No tuition, but Berlin living costs can climb quickly.',
			'Uni-Assist adds process friction, so document readiness matters.',
			'Good fit for students who can move quickly on admin tasks.'
		],
		requirements: {
			minGpa4Scale: 3.0,
			englishRequired: true,
			germanRequired: false,
			relevantFieldKeywords: ['computer', 'software', 'informatics', 'it', 'cs'],
			workExperiencePreferred: false
		}
	},
	{
		id: 'mannheim-economics',
		university: 'University of Mannheim',
		programName: 'M.Sc. Economics',
		city: 'Mannheim',
		studyField: 'Economics',
		degreeLevel: 'masters',
		language: 'English',
		tuitionEurPerSemester: 1500,
		semesterFeeEur: 190,
		blockedAccountEurPerYear: 11208,
		livingCostEurPerMonth: 980,
		applicationMethod: 'Direct',
		intakes: ['Fall'],
		deadlineSummary: 'Strong quantitative preparation improves competitiveness.',
		officialUrl: 'https://www.uni-mannheim.de',
		affordabilityNotes: [
			'Still significantly cheaper than many comparable international pathways.',
			'Applicants should compare tuition-bearing states against total cost.',
			'Better fit for users open to low-debt, not only zero-tuition paths.'
		],
		requirements: {
			minGpa4Scale: 3.3,
			englishRequired: true,
			germanRequired: false,
			relevantFieldKeywords: ['economics', 'finance', 'statistics', 'econometrics', 'business'],
			workExperiencePreferred: false
		}
	},
	{
		id: 'freiburg-renewable-energy',
		university: 'University of Freiburg',
		programName: 'M.Sc. Renewable Energy Engineering and Management',
		city: 'Freiburg',
		studyField: 'Engineering',
		degreeLevel: 'masters',
		language: 'English',
		tuitionEurPerSemester: 1500,
		semesterFeeEur: 190,
		blockedAccountEurPerYear: 11208,
		livingCostEurPerMonth: 980,
		applicationMethod: 'Direct',
		intakes: ['Winter'],
		deadlineSummary: 'Interdisciplinary fit matters more than pure GPA alone.',
		officialUrl: 'https://www.uni-freiburg.de',
		affordabilityNotes: [
			'Suitable for applicants targeting sustainability and engineering careers.',
			'Freiburg is generally more manageable than Germany\'s highest-cost cities.',
			'Applicants should verify current tuition rules for international students.'
		],
		requirements: {
			minGpa4Scale: 3.0,
			englishRequired: true,
			germanRequired: false,
			relevantFieldKeywords: ['engineering', 'energy', 'environment', 'sustainability', 'management'],
			workExperiencePreferred: true
		}
	}
];
