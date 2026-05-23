import type { ApplicationPlaybook, GermanyProgram, StoryVault } from '$lib/copilot/types';

function docReady(note: string, ok: boolean) {
	return { status: ok ? 'ready' : 'needs_input', note };
}

export function buildPlaybook(program: GermanyProgram, vault: StoryVault): ApplicationPlaybook {
	const hasProfile = !!vault.fieldOfStudy.trim() && !!vault.careerGoals.trim();
	const hasStories = vault.personalStories.length > 0;
	const hasEvidence = vault.projects.length + vault.workExperience.length > 0;

	const requiredDocuments = [
		{
			name: 'Academic transcripts',
			...docReady('Gather degree transcript, GPA evidence, and grading scale details.', typeof vault.standardizedGpa === 'number')
		},
		{
			name: 'Curriculum vitae',
			...docReady('Your CV should reflect projects, work experience, and achievements.', hasEvidence)
		},
		{
			name: 'Motivation letter / statement',
			...docReady('Use your Story Vault answers to create a program-specific narrative.', hasProfile && hasStories)
		},
		{
			name: 'Language proof',
			...docReady(
				program.requirements.germanRequired
					? 'Prepare German proof plus any English requirement.'
					: 'Prepare English proof or an accepted waiver route.',
				program.requirements.germanRequired
					? vault.germanLevel === 'advanced' || vault.germanLevel === 'native' || vault.germanLevel === 'upper-intermediate'
					: vault.englishLevel === 'advanced' || vault.englishLevel === 'native' || vault.englishLevel === 'upper-intermediate'
			)
		}
	] as ApplicationPlaybook['requiredDocuments'];

	const blockers = requiredDocuments
		.filter((doc) => doc.status !== 'ready')
		.map((doc) => `${doc.name} still needs input or supporting evidence.`);

	const tasks: ApplicationPlaybook['tasks'] = [
		{
			id: 'confirm-fit',
			title: 'Confirm program fit and intake',
			description: `Review ${program.programName}, its ${program.language}-taught format, and ${program.deadlineSummary}`,
			status: hasProfile ? 'ready' : 'needs_input',
			estimatedTime: '20 min'
		},
		{
			id: 'prepare-story',
			title: 'Finalize your why-this-program narrative',
			description: 'Turn your Story Vault themes into a focused program-specific answer.',
			status: hasStories ? 'ready' : 'needs_input',
			estimatedTime: '45 min'
		},
		{
			id: 'documents',
			title: 'Prepare core documents',
			description: 'Collect transcripts, CV, language proof, and motivation materials before opening the portal.',
			status: blockers.length > 2 ? 'needs_input' : 'ready',
			estimatedTime: '2-4 hours'
		},
		{
			id: 'portal',
			title: `Start the ${program.applicationMethod} application flow`,
			description: `Open the official route and work through it after your core documents are ready.`,
			status: blockers.length === 0 ? 'ready' : 'blocked',
			estimatedTime: '60-90 min'
		}
	];

	const nextBestAction =
		blockers.length > 0
			? `Resolve the highest-friction blocker first: ${blockers[0]}`
			: `Open the official application and start the first portal step for ${program.programName}.`;

	return {
		programId: program.id,
		requiredDocuments,
		tasks,
		blockers,
		nextBestAction
	};
}
