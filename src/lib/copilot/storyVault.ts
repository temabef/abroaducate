import { browser } from '$app/environment';
import { loadUnifiedProfile, saveUnifiedProfile } from '$lib/services/unifiedProfile';
import type { StoryVault, StoryVaultCompletion } from '$lib/copilot/types';

function localKey(userId: string) {
	return `abroaducate_story_vault_v1_${userId}`;
}

export function defaultStoryVault(userId: string): StoryVault {
	return {
		userId,
		preferredCountry: 'Germany',
		degreeLevel: 'masters',
		fieldOfStudy: '',
		targetIntake: '',
		budgetBand: 'strict',
		gpaValue: undefined,
		gpaScale: '4.0',
		standardizedGpa: undefined,
		englishLevel: 'intermediate',
		germanLevel: 'none',
		academicHighlights: '',
		projects: [],
		leadershipExperience: [],
		workExperience: [],
		personalStories: [],
		careerGoals: '',
		motivationThemes: [],
		reusableAnswers: {
			whyGermany: '',
			whyThisProgram: '',
			careerVision: '',
			researchInterests: ''
		},
		updatedAt: new Date().toISOString()
	};
}

export async function loadStoryVault(supabase: any, session: any): Promise<StoryVault | null> {
	if (!session?.user?.id) return null;

	const vault = defaultStoryVault(session.user.id);

	try {
		const { profile } = await loadUnifiedProfile(supabase, session);
		if (profile) {
			vault.fieldOfStudy = profile.field_of_study || '';
			vault.targetIntake = profile.target_intake || '';
			vault.gpaValue = profile.current_gpa_value;
			vault.gpaScale = (profile.current_gpa_scale as StoryVault['gpaScale']) || '4.0';
			vault.standardizedGpa = profile.standardized_gpa_4_scale;
			vault.budgetBand =
				profile.budget_range === '50k-100k' || profile.budget_range === '100k+' ? 'flexible' :
				profile.budget_range === '20k-50k' ? 'balanced' :
				'strict';
		}
	} catch {
		// Ignore remote read issues and fall back to local data.
	}

	if (!browser) return vault;

	try {
		const raw = localStorage.getItem(localKey(session.user.id));
		if (!raw) return vault;
		return { ...vault, ...JSON.parse(raw) };
	} catch {
		return vault;
	}
}

export async function saveStoryVault(supabase: any, session: any, vault: StoryVault): Promise<void> {
	if (!session?.user?.id) return;

	const next = { ...vault, updatedAt: new Date().toISOString() };

	if (browser) {
		localStorage.setItem(localKey(session.user.id), JSON.stringify(next));
	}

	await saveUnifiedProfile(supabase, session, {
		degree_level: 'masters',
		field_of_study: next.fieldOfStudy,
		preferred_countries: ['Germany'],
		gpa_range: next.standardizedGpa
			? next.standardizedGpa < 2.5
				? '<2.5'
				: next.standardizedGpa < 3.0
					? '2.5-3.0'
					: next.standardizedGpa < 3.5
						? '3.0-3.5'
						: '3.5-4.0'
			: '3.0-3.5',
		scholarship_priority: 'essential',
		target_intake: next.targetIntake,
		budget_range:
			next.budgetBand === 'flexible' ? '50k-100k' :
			next.budgetBand === 'balanced' ? '20k-50k' :
			'0-20k',
		current_gpa_value: next.gpaValue,
		current_gpa_scale: next.gpaScale,
		onboarding_completed: true
	});
}

export function analyzeStoryVault(vault: StoryVault | null): StoryVaultCompletion {
	if (!vault) {
		return { score: 0, missingFields: ['Story Vault'], readyForSimulation: false };
	}

	const checks = [
		['Field of study', !!vault.fieldOfStudy.trim()],
		['Target intake', !!vault.targetIntake.trim()],
		['GPA', typeof vault.standardizedGpa === 'number'],
		['Academic highlights', !!vault.academicHighlights.trim()],
		['Projects or experience', vault.projects.length + vault.workExperience.length > 0],
		['Personal stories', vault.personalStories.length > 0],
		['Career goals', !!vault.careerGoals.trim()],
		['Why Germany answer', !!vault.reusableAnswers.whyGermany.trim()]
	] as const;

	const complete = checks.filter(([, ok]) => ok).length;
	return {
		score: Math.round((complete / checks.length) * 100),
		missingFields: checks.filter(([, ok]) => !ok).map(([label]) => label),
		readyForSimulation: complete >= 5
	};
}
