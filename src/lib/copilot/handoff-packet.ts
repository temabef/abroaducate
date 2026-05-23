import type { ProgramProfile, StoryVault, FundingLane } from '$lib/copilot/types';

export interface PersonalDetails {
	fullName: string;
	email: string;
	dateOfBirth: string;
	nationality: string;
	phone: string;
}

export interface AcademicDetails {
	degreeTitle: string;
	universityName: string;
	graduationYear: string;
	gpaValue: number | null;
	gpaScale: string;
	fieldOfStudy: string;
	relevantCoursework: string;
	languageTestType: string;
	languageTestScore: string;
	languageTestDate: string;
}

// ── Document Coaching Card types ──────────────────────────────

export type DocumentPhase = 'not_started' | 'drafting' | 'self_review' | 'ready';

export interface ActionStep {
	id: string;
	label: string;
	completed: boolean;
	/** Optional key into StoryVault to show as "raw material" hint */
	vaultKey?: keyof StoryVault | string;
	/** Human-readable hint shown when vault data exists for vaultKey */
	vaultHint?: string;
}

export interface SelfCheckItem {
	id: string;
	label: string;
	checked: boolean;
}

export interface DocumentSlot {
	id: string;
	name: string;
	guidance: string;
	phase: DocumentPhase;
	actionSteps: ActionStep[];
	selfCheckItems: SelfCheckItem[];
	tips: string[];
	notes: string;
}

/** Compute the correct phase from step/check completion */
export function computePhase(doc: DocumentSlot): DocumentPhase {
	const stepsCompleted = doc.actionSteps.filter((s) => s.completed).length;
	const allStepsDone = stepsCompleted === doc.actionSteps.length;
	const allChecksDone = doc.selfCheckItems.every((c) => c.checked);

	if (allStepsDone && allChecksDone) return 'ready';
	if (allStepsDone) return 'self_review';
	if (stepsCompleted > 0) return 'drafting';
	return 'not_started';
}

/** Phase display metadata */
export function phaseLabel(phase: DocumentPhase): string {
	switch (phase) {
		case 'not_started': return 'Not started';
		case 'drafting': return 'Drafting';
		case 'self_review': return 'Self-review';
		case 'ready': return 'Ready';
	}
}

export function phaseColor(phase: DocumentPhase): string {
	switch (phase) {
		case 'not_started': return 'bg-slate-100 text-slate-600';
		case 'drafting': return 'bg-blue-100 text-blue-700';
		case 'self_review': return 'bg-amber-100 text-amber-700';
		case 'ready': return 'bg-emerald-100 text-emerald-700';
	}
}

// ── Per-document coaching content ─────────────────────────────

export function createDefaultDocumentSlots(): DocumentSlot[] {
	return [
		{
			id: 'transcript',
			name: 'Academic Transcripts',
			guidance: 'Your official university transcript showing all courses, grades, and GPA. Most German programs require this as the first eligibility check.',
			phase: 'not_started',
			actionSteps: [
				{ id: 'tr-1', label: 'Request official transcript from your university registrar', completed: false },
				{ id: 'tr-2', label: 'Verify your GPA and grading scale are clearly shown', completed: false, vaultKey: 'gpaValue', vaultHint: 'Your Story Vault GPA' },
				{ id: 'tr-3', label: 'Get a certified English translation if transcript is not in English or German', completed: false },
				{ id: 'tr-4', label: 'Check if the program requires a specific credential evaluation (e.g. anabin check)', completed: false }
			],
			selfCheckItems: [
				{ id: 'tr-c1', label: 'GPA or grade average is clearly visible on the document', checked: false },
				{ id: 'tr-c2', label: 'All completed semesters and courses are listed', checked: false },
				{ id: 'tr-c3', label: 'Translation is certified (if applicable)', checked: false }
			],
			tips: [
				'Start this early — some universities take 2-4 weeks to issue official transcripts.',
				'German universities often require an "apostille" or certified translation. Check your specific program requirements.',
				'If you are still studying, request a "Transcript of Records to date" — most programs accept this for applications.'
			],
			notes: ''
		},
		{
			id: 'cv',
			name: 'Curriculum Vitae (CV)',
			guidance: 'A professional academic CV highlighting your education, projects, work experience, and skills. German programs expect a structured, clear format.',
			phase: 'not_started',
			actionSteps: [
				{ id: 'cv-1', label: 'Write your education section (degree, university, dates, GPA)', completed: false, vaultKey: 'academicHighlights', vaultHint: 'Your academic highlights from Story Vault' },
				{ id: 'cv-2', label: 'Add your projects and research (use your Story Vault projects)', completed: false, vaultKey: 'projects', vaultHint: 'Your projects from Story Vault' },
				{ id: 'cv-3', label: 'Add work experience and internships', completed: false, vaultKey: 'workExperience', vaultHint: 'Your work experience from Story Vault' },
				{ id: 'cv-4', label: 'Add leadership and extracurricular activities', completed: false, vaultKey: 'leadershipExperience', vaultHint: 'Your leadership experience from Story Vault' },
				{ id: 'cv-5', label: 'List technical skills, languages, and certifications', completed: false },
				{ id: 'cv-6', label: 'Format: clean layout, consistent dates, max 2 pages', completed: false }
			],
			selfCheckItems: [
				{ id: 'cv-c1', label: 'CV is maximum 2 pages', checked: false },
				{ id: 'cv-c2', label: 'Used active verbs and quantified results where possible', checked: false },
				{ id: 'cv-c3', label: 'Contact info (name, email, nationality) is at the top', checked: false },
				{ id: 'cv-c4', label: 'No spelling or grammar errors', checked: false }
			],
			tips: [
				'Use the Europass CV format if you are unsure — it is well-recognized in Germany.',
				'Quantify achievements: "Led a team of 5" is stronger than "Worked in a team".',
				'Include your GitHub, portfolio, or LinkedIn if relevant to your field.',
				'Put education first if you are a recent graduate; work first if experienced.'
			],
			notes: ''
		},
		{
			id: 'motivation',
			name: 'Motivation Letter / Statement of Purpose',
			guidance: 'The most critical document. This is where you convince the committee you are the right fit. Generic letters are the #1 reason for rejection.',
			phase: 'not_started',
			actionSteps: [
				{ id: 'mot-1', label: 'Write your opening: Why this specific field excites you', completed: false, vaultKey: 'reusableAnswers', vaultHint: 'Your "Why this program" answer from Story Vault' },
				{ id: 'mot-2', label: 'Write the "What you bring" section: your relevant background, projects, and experience', completed: false, vaultKey: 'projects', vaultHint: 'Your projects from Story Vault' },
				{ id: 'mot-3', label: 'Write the "Career goals" section: where this degree takes you', completed: false, vaultKey: 'careerGoals', vaultHint: 'Your career goals from Story Vault' },
				{ id: 'mot-4', label: 'Add program-specific references: mention specific professors, labs, or courses at this university', completed: false },
				{ id: 'mot-5', label: 'Include your "Why Germany" narrative', completed: false, vaultKey: 'reusableAnswers', vaultHint: 'Your "Why Germany" answer from Story Vault' },
				{ id: 'mot-6', label: 'Revise and proofread — read it aloud to catch awkward phrasing', completed: false }
			],
			selfCheckItems: [
				{ id: 'mot-c1', label: 'Letter is under 1 page (or within the specified word limit)', checked: false },
				{ id: 'mot-c2', label: 'It mentions this specific program and university by name', checked: false },
				{ id: 'mot-c3', label: 'It is NOT generic — someone reading it would know which program you are applying to', checked: false },
				{ id: 'mot-c4', label: 'Your personal motivation comes through (not just facts)', checked: false },
				{ id: 'mot-c5', label: 'No spelling or grammar errors', checked: false }
			],
			tips: [
				'The biggest mistake: writing a letter that could apply to any program. Committees notice immediately.',
				'Use your Story Vault personal stories as raw material — admissions committees value authenticity over polish.',
				'Structure: Why this field → What you bring → Where this takes you. Keep it logical.',
				'Do not repeat your CV. The motivation letter should show your thinking and personality, not list achievements.',
				'Have someone else read it. Fresh eyes catch what you miss.'
			],
			notes: ''
		},
		{
			id: 'language',
			name: 'Language Proficiency Proof',
			guidance: 'Most English-taught programs in Germany require IELTS, TOEFL, or equivalent. Some accept a waiver for degrees taught in English.',
			phase: 'not_started',
			actionSteps: [
				{ id: 'lang-1', label: 'Check the specific language requirements for this program', completed: false },
				{ id: 'lang-2', label: 'Decide which test to take (IELTS, TOEFL iBT, Cambridge, Duolingo)', completed: false, vaultKey: 'englishLevel', vaultHint: 'Your self-assessed English level from Story Vault' },
				{ id: 'lang-3', label: 'Register for the test (book early — test center spots fill up)', completed: false },
				{ id: 'lang-4', label: 'Prepare for the test (aim for IELTS 6.5+ or TOEFL 90+)', completed: false },
				{ id: 'lang-5', label: 'Take the test and receive your official score report', completed: false },
				{ id: 'lang-6', label: 'Alternatively: check if your university can issue an "English Medium Instruction" certificate', completed: false }
			],
			selfCheckItems: [
				{ id: 'lang-c1', label: 'Score meets the minimum requirement for this program', checked: false },
				{ id: 'lang-c2', label: 'Score report is within 2 years of your application date', checked: false },
				{ id: 'lang-c3', label: 'You have the official score report (not just a screenshot)', checked: false }
			],
			tips: [
				'Book your test at least 6-8 weeks before the application deadline — score delivery takes time.',
				'If your bachelor\'s was taught entirely in English, check if the program accepts an "English Medium Instruction" letter from your university. This can save time and money.',
				'IELTS Academic (not General Training) is required for university applications.',
				'Some programs have minimum sub-scores (e.g., no band below 6.0). Check carefully.'
			],
			notes: ''
		},
		{
			id: 'cover-letter',
			name: 'Cover Letter',
			guidance: 'A cover letter is often required for specific scholarship applications, research assistant positions, or when a program asks for a brief introduction alongside your CV.',
			phase: 'not_started',
			actionSteps: [
				{ id: 'cl-1', label: 'Identify the recipient and program/role', completed: false },
				{ id: 'cl-2', label: 'Write a strong opening stating exactly what you are applying for', completed: false },
				{ id: 'cl-3', label: 'Highlight 1-2 key achievements that make you a perfect fit', completed: false, vaultKey: 'academicHighlights', vaultHint: 'Your academic highlights from Story Vault' },
				{ id: 'cl-4', label: 'State your availability or next steps', completed: false },
				{ id: 'cl-5', label: 'Keep it concise — maximum 1 page', completed: false }
			],
			selfCheckItems: [
				{ id: 'cl-c1', label: 'Letter is under 1 page', checked: false },
				{ id: 'cl-c2', label: 'Clearly states the position or program being applied for', checked: false },
				{ id: 'cl-c3', label: 'No spelling or grammar errors', checked: false }
			],
			tips: [
				'A cover letter is generally shorter and more direct than a Motivation Letter.',
				'Focus on what you can bring to the role/program immediately.',
				'Ensure your contact information matches your CV exactly.'
			],
			notes: ''
		},
		{
			id: 'cold-email',
			name: 'Cold Email',
			guidance: 'Many programs or scholarships advise you to secure a supervisor first. A concise, persuasive cold email is how you introduce your research fit to a potential professor.',
			phase: 'not_started',
			actionSteps: [
				{ id: 'ce-1', label: 'Identify the target professor and read their recent publications', completed: false },
				{ id: 'ce-2', label: 'Draft a short email connecting your background to their current lab work', completed: false, vaultKey: 'academicHighlights', vaultHint: 'Your research highlights from Story Vault' },
				{ id: 'ce-3', label: 'Attach your Academic CV (and Research Proposal if required)', completed: false },
				{ id: 'ce-4', label: 'Send during their working hours (e.g. Tuesday morning in Germany time)', completed: false }
			],
			selfCheckItems: [
				{ id: 'ce-c1', label: 'Email is under 3 short paragraphs', checked: false },
				{ id: 'ce-c2', label: 'Explicitly references a specific project or paper of theirs', checked: false },
				{ id: 'ce-c3', label: 'Subject line is clear and professional (e.g. "Prospective MSc Student: Research on [Topic]")', checked: false }
			],
			tips: [
				'Professors are incredibly busy. Your goal is to get a "Yes, let\'s talk" or "Send more info," not to tell your whole life story.',
				'Do not send the exact same email to 50 professors. Personalization is mandatory.',
				'If they don\'t reply in 7-10 days, one polite follow-up is acceptable.'
			],
			notes: ''
		},
		{
			id: 'recommendation',
			name: 'Letters of Recommendation',
			guidance: 'Most programs need 1-2 academic references from professors who know your work. The key is giving your recommenders enough context and time.',
			phase: 'not_started',
			actionSteps: [
				{ id: 'rec-1', label: 'Identify 2-3 professors or supervisors who know your academic work', completed: false, vaultKey: 'academicHighlights', vaultHint: 'Your academic highlights — choose recommenders who can speak to these' },
				{ id: 'rec-2', label: 'Email them: explain the program, why you are applying, and strengths to highlight', completed: false },
				{ id: 'rec-3', label: 'Provide them with your CV and a brief about the program', completed: false },
				{ id: 'rec-4', label: 'Give them at least 4 weeks before the deadline', completed: false },
				{ id: 'rec-5', label: 'Follow up politely 1-2 weeks before deadline if needed', completed: false },
				{ id: 'rec-6', label: 'Confirm letters are submitted (some programs have an online form for recommenders)', completed: false }
			],
			selfCheckItems: [
				{ id: 'rec-c1', label: 'Asked at least 4 weeks before the application deadline', checked: false },
				{ id: 'rec-c2', label: 'Gave recommenders context about the specific program', checked: false },
				{ id: 'rec-c3', label: 'Confirmed letters are submitted or received', checked: false }
			],
			tips: [
				'Choose people who know you well over people with big titles. A genuine, detailed letter beats a vague one from a famous professor.',
				'Write a brief for your recommenders: program name, why you are applying, 2-3 strengths you would like them to highlight. This makes their job easier and gets you a better letter.',
				'Do not wait until the last minute — professors are busy. 4-6 weeks is respectful.',
				'Thank your recommenders regardless of outcome. Good academic relationships last.'
			],
			notes: ''
		},
		{
			id: 'passport',
			name: 'Passport Copy',
			guidance: 'A clear scan of your passport bio-data page. This is usually the simplest document but has a critical validity requirement.',
			phase: 'not_started',
			actionSteps: [
				{ id: 'pass-1', label: 'Check your passport expiry date', completed: false },
				{ id: 'pass-2', label: 'Ensure passport is valid for at least 6 months beyond your planned start date', completed: false },
				{ id: 'pass-3', label: 'Scan the bio-data page (the page with your photo and personal details)', completed: false },
				{ id: 'pass-4', label: 'If expired or expiring soon: start renewal process now', completed: false }
			],
			selfCheckItems: [
				{ id: 'pass-c1', label: 'Passport is valid for at least 6 months beyond the program start date', checked: false },
				{ id: 'pass-c2', label: 'Scan is clear and all text is legible', checked: false }
			],
			tips: [
				'Passport renewal can take weeks to months depending on your country. Start early if needed.',
				'Use a flat scanner or a scanning app (CamScanner, Adobe Scan) — not a blurry phone photo.',
				'You will also need this passport for your visa application later, so keep it accessible.'
			],
			notes: ''
		}
	];
}

// ── Handoff Packet ────────────────────────────────────────────

export interface HandoffPacket {
	generatedAt: string;
	programName: string;
	university: string;
	country: string;
	deadline: string;
	submitMethod: string;
	submitUrl: string;
	personalSummary: { label: string; value: string }[];
	academicSummary: { label: string; value: string }[];
	documentChecklist: { name: string; phase: string; ready: boolean; stepsCompleted: number; totalSteps: number }[];
	fundingLaneSummary: { title: string; status: string; nextAction: string }[];
	missingItems: string[];
}

export function generateHandoffPacket(
	program: ProgramProfile,
	personal: PersonalDetails,
	academic: AcademicDetails,
	documents: DocumentSlot[],
	laneProgress: Record<string, boolean>,
	vault: StoryVault
): HandoffPacket {
	const personalSummary = [
		{ label: 'Full Name', value: personal.fullName || '—' },
		{ label: 'Email', value: personal.email || '—' },
		{ label: 'Date of Birth', value: personal.dateOfBirth || '—' },
		{ label: 'Nationality', value: personal.nationality || '—' },
		{ label: 'Phone', value: personal.phone || '—' }
	];

	const academicSummary = [
		{ label: 'Degree', value: academic.degreeTitle || '—' },
		{ label: 'University', value: academic.universityName || '—' },
		{ label: 'Graduation Year', value: academic.graduationYear || '—' },
		{
			label: 'GPA',
			value: academic.gpaValue ? `${academic.gpaValue} / ${academic.gpaScale}` : '—'
		},
		{ label: 'Field of Study', value: academic.fieldOfStudy || '—' },
		{
			label: 'Language Test',
			value: academic.languageTestType
				? `${academic.languageTestType}: ${academic.languageTestScore} (${academic.languageTestDate})`
				: '—'
		}
	];

	const documentChecklist = documents.map((doc) => ({
		name: doc.name,
		phase: phaseLabel(doc.phase),
		ready: doc.phase === 'ready',
		stepsCompleted: doc.actionSteps.filter((s) => s.completed).length,
		totalSteps: doc.actionSteps.length
	}));

	const fundingLaneSummary = program.funding_lanes.map((lane: FundingLane) => ({
		title: lane.title,
		status: laneProgress[lane.id] ? 'Applied / In progress' : 'Not started',
		nextAction: lane.next_action
	}));

	const missingItems: string[] = [];
	if (!personal.fullName) missingItems.push('Full name not provided');
	if (!personal.email) missingItems.push('Email not provided');
	if (!academic.gpaValue) missingItems.push('GPA not provided');
	documents.forEach((doc) => {
		if (doc.phase !== 'ready') missingItems.push(`${doc.name} is not ready (${phaseLabel(doc.phase)})`);
	});

	const submitUrl = program.funding_lanes[0]?.official_url || '';

	return {
		generatedAt: new Date().toISOString(),
		programName: program.program_name,
		university: program.university,
		country: program.country,
		deadline: program.deadline,
		submitMethod: program.requirements.some((r) => r.includes('Uni-Assist'))
			? 'Uni-Assist Portal'
			: 'Direct University Portal',
		submitUrl,
		personalSummary,
		academicSummary,
		documentChecklist,
		fundingLaneSummary,
		missingItems
	};
}
