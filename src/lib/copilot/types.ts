export type CopilotLanguageLevel =
	| 'none'
	| 'basic'
	| 'intermediate'
	| 'upper-intermediate'
	| 'advanced'
	| 'native';

export interface StoryVault {
	userId: string;
	preferredCountry: 'Germany';
	degreeLevel: 'masters';
	fieldOfStudy: string;
	targetIntake: string;
	budgetBand: 'strict' | 'balanced' | 'flexible';
	gpaValue?: number;
	gpaScale?: '4.0' | '5.0' | '100';
	standardizedGpa?: number;
	englishLevel: CopilotLanguageLevel;
	germanLevel: CopilotLanguageLevel;
	academicHighlights: string;
	projects: string[];
	leadershipExperience: string[];
	workExperience: string[];
	personalStories: string[];
	careerGoals: string;
	motivationThemes: string[];
	reusableAnswers: {
		whyGermany: string;
		whyThisProgram: string;
		careerVision: string;
		researchInterests: string;
	};
	updatedAt: string;
}

export interface StoryVaultCompletion {
	score: number;
	missingFields: string[];
	readyForSimulation: boolean;
}

export interface GermanyProgram {
	id: string;
	university: string;
	programName: string;
	city: string;
	studyField: string;
	degreeLevel: 'masters';
	language: 'English' | 'German' | 'Mixed';
	tuitionEurPerSemester: number;
	semesterFeeEur: number;
	blockedAccountEurPerYear: number;
	livingCostEurPerMonth: number;
	applicationMethod: 'Uni-Assist' | 'Direct';
	intakes: string[];
	deadlineSummary: string;
	officialUrl: string;
	affordabilityNotes: string[];
	requirements: {
		minGpa4Scale: number;
		englishRequired: boolean;
		germanRequired: boolean;
		relevantFieldKeywords: string[];
		workExperiencePreferred: boolean;
	};
}

export interface AcceptanceSimulation {
	score: number;
	band: 'Strong' | 'Competitive' | 'Possible' | 'Needs Work';
	readyToApplyNow: boolean;
	rationale: string[];
	gaps: string[];
	recommendedActions: string[];
}

export interface PlaybookTask {
	id: string;
	title: string;
	description: string;
	status: 'ready' | 'needs_input' | 'blocked';
	estimatedTime: string;
}

export interface ApplicationPlaybook {
	programId: string;
	requiredDocuments: Array<{
		name: string;
		status: 'ready' | 'needs_input' | 'blocked';
		note: string;
	}>;
	tasks: PlaybookTask[];
	blockers: string[];
	nextBestAction: string;
}

export interface CopilotUsageSnapshot {
	userId: string;
	periodKey: string;
	simulationsUsed: number;
	updatedAt: string;
}

export interface QuickIntakeV1 {
	destination: string;
	level: 'Bachelor' | 'Master' | 'PhD';
	field: string;
	budget: 'strict' | 'balanced' | 'flexible';
	priority: 'no-tuition' | 'low-tuition' | 'high-scholarship';
}

export interface InlinePrompt {
	id: string;
	missing_field: string;
	suggested_action: string;
	severity: 'high' | 'medium' | 'low';
	applies_to: 'story' | 'matches' | 'simulator' | 'playbook';
}

export interface ProgramMatch {
	type: 'program';
	id: string;
	program: GermanyProgram;
	score: number;
	tags: string[];
	reasons: string[];
}

export interface ScholarshipMatch {
	type: 'scholarship';
	id: string;
	title: string;
	provider: string | null;
	amount: string | null;
	deadline: string | null;
	location: string | null;
	score: number;
	tags: string[];
	reasons: string[];
}

export type MatchItem = ProgramMatch | ScholarshipMatch;

export interface StrategyBoardViewModel {
	quickIntake: QuickIntakeV1;
	competitivenessBand: AcceptanceSimulation['band'] | 'Not Run';
	score: number | null;
	topGaps: string[];
	topActions: string[];
	readinessState: 'ready' | 'needs_preparation' | 'incomplete';
}

export type ApplicationWindowState = 'open' | 'closing_soon' | 'closed';

export interface FundingLane {
	id: string;
	funding_type: 'program_specific' | 'country_wide' | 'professor_based';
	title: string;
	coverage: string;
	deadline: string;
	eligibility_rules: string[];
	effort_level: 'low' | 'medium' | 'high';
	next_action: string;
	official_url: string;
}

export interface ProgramProfile {
	id: string;
	country: string;
	university: string;
	program_name: string;
	degree_level: 'Bachelor' | 'Master' | 'PhD';
	tuition: string;
	application_fee: string;
	living_cost_estimate: string;
	next_intake: string;
	deadline: string;
	application_window_state: ApplicationWindowState;
	requirements: string[];
	funding_lanes: FundingLane[];
}
