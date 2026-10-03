export interface IncomingEmail {
	from: string; // e.g. "John Doe <john@example.com>" or "john@example.com"
	fromEmail: string; // e.g. "john@example.com"
	fromName?: string; // e.g. "John Doe"
	to: string; // e.g. "hello@abroaducate.com"
	subject: string;
	text: string;
	html?: string;
	messageId?: string;
	headers?: Record<string, string>;
	receivedAt?: string;
}

export type EmailCategory =
	| 'scholarships'
	| 'admissions_sop'
	| 'visa_finance'
	| 'subscription_billing'
	| 'urgent_human_needed'
	| 'general_inquiry';

export type EmailUrgency = 'low' | 'normal' | 'high' | 'critical';

export interface EmailClassification {
	category: EmailCategory;
	urgency: EmailUrgency;
	summary: string;
	shouldEscalate: boolean;
	escalationReason?: string;
	confidence: number;
	keyQuestions: string[];
}

export interface StudentProfileContext {
	found: boolean;
	userId?: string;
	fullName?: string;
	targetCountry?: string;
	studyLevel?: string;
	fieldOfStudy?: string;
	subscriptionTier?: string;
	applicationsCount?: number;
}

export interface EmailAgentResult {
	success: boolean;
	status: 'replied' | 'skipped_loop' | 'skipped_spam' | 'escalated' | 'failed' | 'drafted';
	messageId?: string;
	replySubject?: string;
	replyText?: string;
	replyHtml?: string;
	classification?: EmailClassification;
	studentProfile?: StudentProfileContext;
	escalated?: boolean;
	error?: string;
	processingMs: number;
}

export interface EmailAgentSettings {
	agentEnabled: boolean;
	autonomousMode: boolean;
	escalationEmail: string;
	dailyReplyLimitPerUser: number;
	modelName: string;
}
