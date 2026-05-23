import type { AcceptanceSimulation, GermanyProgram, StoryVault } from '$lib/copilot/types';

function normalizeField(value: string): string {
	return value.trim().toLowerCase();
}

export function simulateAcceptance(program: GermanyProgram, vault: StoryVault): AcceptanceSimulation {
	let score = 35;
	const rationale: string[] = [];
	const gaps: string[] = [];
	const recommendedActions: string[] = [];

	const gpa = vault.standardizedGpa ?? 0;
	if (gpa >= program.requirements.minGpa4Scale + 0.3) {
		score += 25;
		rationale.push(`Your GPA is comfortably above this program's baseline fit.`);
	} else if (gpa >= program.requirements.minGpa4Scale) {
		score += 15;
		rationale.push(`Your GPA is within a viable range for this program.`);
	} else if (gpa > 0) {
		score -= 10;
		gaps.push(`Your GPA is below the current baseline used for this path.`);
		recommendedActions.push('Strengthen the rest of your profile and target slightly wider-fit programs.');
	} else {
		gaps.push('Your GPA has not been added to the Story Vault yet.');
		recommendedActions.push('Add your GPA to improve fit analysis and path ranking.');
	}

	const field = normalizeField(vault.fieldOfStudy);
	const keywordHit = program.requirements.relevantFieldKeywords.some((keyword) =>
		field.includes(keyword.toLowerCase())
	);
	if (keywordHit) {
		score += 15;
		rationale.push(`Your field background appears aligned with the program focus.`);
	} else if (field) {
		score -= 5;
		gaps.push(`Your stated field does not strongly align with this program's common feeder backgrounds.`);
		recommendedActions.push('Clarify transferable coursework, projects, or experience that support your fit.');
	}

	if (program.requirements.englishRequired) {
		if (vault.englishLevel === 'advanced' || vault.englishLevel === 'native' || vault.englishLevel === 'upper-intermediate') {
			score += 10;
			rationale.push('Your English readiness supports an English-taught program.');
		} else {
			gaps.push('Your English readiness may be weak for a competitive English-taught application.');
			recommendedActions.push('Prepare an English proficiency plan and evidence strategy.');
		}
	}

	if (program.requirements.germanRequired) {
		if (vault.germanLevel === 'advanced' || vault.germanLevel === 'native' || vault.germanLevel === 'upper-intermediate') {
			score += 10;
			rationale.push('Your German readiness supports this pathway.');
		} else {
			score -= 15;
			gaps.push('This path expects stronger German readiness than your current profile shows.');
			recommendedActions.push('Improve German readiness or prioritize English-taught alternatives first.');
		}
	}

	if (vault.projects.length > 0 || vault.workExperience.length > 0) {
		score += 10;
		rationale.push('You have profile substance beyond academics, which strengthens competitiveness.');
	} else {
		gaps.push('Your profile lacks visible project or work evidence.');
		recommendedActions.push('Document projects, internships, or applied work inside the Story Vault.');
	}

	if (vault.personalStories.length > 0 && vault.reusableAnswers.whyThisProgram.trim()) {
		score += 5;
		rationale.push('You already have material that can support a targeted application narrative.');
	} else {
		gaps.push('Your story-to-program narrative is still weak or incomplete.');
		recommendedActions.push('Write why this program fits your goals before applying.');
	}

	if (program.requirements.workExperiencePreferred && vault.workExperience.length === 0) {
		gaps.push('This path benefits from stronger work or applied experience.');
		recommendedActions.push('Highlight practical experience or choose programs with lower experience expectations.');
	}

	score = Math.max(20, Math.min(92, score));

	const band =
		score >= 80 ? 'Strong' :
		score >= 65 ? 'Competitive' :
		score >= 50 ? 'Possible' :
		'Needs Work';

	const readyToApplyNow = score >= 65 && gaps.length <= 2;

	if (!readyToApplyNow) {
		recommendedActions.push('Use the Application Playbook to close the highest-friction gaps before submitting.');
	}

	return {
		score,
		band,
		readyToApplyNow,
		rationale,
		gaps,
		recommendedActions: [...new Set(recommendedActions)]
	};
}
