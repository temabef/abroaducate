export interface AffiliatePartner {
	id: string;
	name: string;
	tagline: string;
	description: string;
	category: 'visa' | 'translation' | 'connectivity' | 'banking' | 'prep' | 'housing';
	categoryLabel: string;
	url: string;
	badge?: string;
	badgeColor?: string; // e.g. 'emerald', 'blue', 'orange'
	ctaText: string;
	features: string[];
	countries?: string[]; // e.g. ['Germany'] or undefined for all Europe
	highlighted?: boolean;
}

export const AFFILIATE_PARTNERS: AffiliatePartner[] = [
	{
		id: 'expatrio',
		name: 'Expatrio',
		tagline: 'Official German Blocked Account & TK Health Insurance',
		description: 'The #1 government-approved Value Package for international students moving to Germany. Includes your €11,904 blocked account, statutory TK health insurance, incoming insurance, and free German bank account in one click.',
		category: 'visa',
		categoryLabel: 'Visa & Blocked Account',
		url: 'https://www.expatrio.com?p=abroaducate123',
		badge: '€49 Cashback • Most Popular',
		badgeColor: 'emerald',
		ctaText: 'Claim Value Package & €49 Cashback →',
		features: [
			'100% German Federal Foreign Office approved',
			'Official Techniker Krankenkasse (TK) Health Insurance',
			'€49 setup fee refunded + Free €95 incoming travel insurance',
			'Includes free German bank account & debit card'
		],
		countries: ['Germany'],
		highlighted: true
	},
	{
		id: 'fintiba',
		name: 'Fintiba',
		tagline: 'Digital Blocked Account & Health Insurance Alternative',
		description: 'Fast, secure online blocked account for your German student visa application with DAK/Barmer health insurance integration.',
		category: 'visa',
		categoryLabel: 'Visa & Blocked Account',
		url: 'https://partner.fintiba.com/abroaducate',
		badge: 'Embassy Approved',
		badgeColor: 'blue',
		ctaText: 'Get Started with Fintiba →',
		features: [
			'Accepted by all German embassies worldwide',
			'Integrated health insurance options',
			'100% paperless registration in 10 minutes'
		],
		countries: ['Germany']
	},
	{
		id: 'airalo',
		name: 'Airalo Europe eSIM',
		tagline: 'Instant Mobile Data (€3.00 Off 1st eSIM)',
		description: 'Never worry about roaming charges or searching for airport SIM kiosks. Download an eSIM to your phone before boarding and get €3.00 off your first package with instant 4G/5G connection across 39 European countries.',
		category: 'connectivity',
		categoryLabel: 'Travel & Mobile Data',
		url: 'https://airalo.go.link/VyEma',
		badge: '€3.00 Discount Voucher',
		badgeColor: 'emerald',
		ctaText: 'Claim €3 Off European eSIM →',
		features: [
			'€3.00 discount automatically applied on your first eSIM',
			'Works across 39 European countries with one digital eSIM',
			'High-speed 4G/5G data packages from just €2 after discount',
			'Keep your original WhatsApp number and SIM active'
		],
		highlighted: true
	},
	{
		id: 'rushtranslate',
		name: 'RushTranslate',
		tagline: 'Official Certified Sworn Translations for Universities',
		description: 'Certified translations of academic transcripts, WAEC/NECO certificates, birth certificates, and diplomas guaranteed to meet university and embassy requirements.',
		category: 'translation',
		categoryLabel: 'Academic Translations',
		url: 'https://rushtranslate.com/certified-translation?ref=abroaducate',
		badge: '100% Acceptance Guarantee',
		badgeColor: 'emerald',
		ctaText: 'Order Certified Translation →',
		features: [
			'Certified translations for admissions & visa offices',
			'Guaranteed acceptance by universities & embassies',
			'Fast 24-hour turnaround with certified digital stamp',
			'Covers German, French, Italian, Spanish, & more'
		],
		highlighted: true
	},
	{
		id: 'translated',
		name: 'Translated.net',
		tagline: 'Professional Translation (Pay After Delivery)',
		description: 'Professional human translation for academic transcripts, certificates, and visa paperwork. Zero upfront risk: review your completed documents first and pay within 5 days of delivery.',
		category: 'translation',
		categoryLabel: 'Academic Translations',
		url: 'https://www.translated.net/en/preventivo.php?refid=7247',
		badge: 'Pay After Delivery',
		badgeColor: 'emerald',
		ctaText: 'Get Quote (Pay After Delivery) →',
		features: [
			'Pay after delivery — review your documents before paying',
			'Professional certified translators across 265 languages',
			'Instant online quote and rapid delivery turnaround',
			'Ideal for transcripts, recommendation letters, and certificates'
		]
	},
	{
		id: 'grey',
		name: 'Grey.co',
		tagline: 'International Bank Accounts & Tuition Payment for Africa',
		description: 'Open foreign currency accounts (EUR, GBP, USD) directly from Nigeria, Ghana, and Kenya. Easily pay university application fees, deposits, and living costs in Europe at competitive FX rates.',
		category: 'banking',
		categoryLabel: 'African Cross-Border Payments',
		url: 'https://app.grey.co/auth/register?referral=IAUZLT',
		badge: 'Built for African Students',
		badgeColor: 'orange',
		ctaText: 'Open Free Global Account →',
		features: [
			'Instant Virtual EUR IBAN & GBP accounts',
			'Seamlessly send money to European universities',
			'Exchange Naira, Cedi, and KES at competitive rates',
			'Virtual debit card for online university application fees'
		],
		highlighted: true
	},
	{
		id: 'studyoverseas-ai',
		name: 'Abroaducate IELTS & GRE Prep',
		tagline: 'Free AI-Powered IELTS, GRE & SAT Mock Tests',
		description: 'Practice with full-length adaptive mock tests, instant AI speaking band scores, 2,000+ vocabulary words, and expert video lessons at zero cost.',
		category: 'prep',
		categoryLabel: 'Free Exam Prep',
		url: 'https://abroaducate.studyoverseas.ai',
		badge: 'Coming Soon • Launching Monday',
		badgeColor: 'blue',
		ctaText: 'Launching Monday — Free Access',
		features: [
			'Full-length IELTS & GRE mock tests with real exam simulation',
			'AI-scored speaking practice with real-time band prediction',
			'Adaptive practice and personalized study planner',
			'Completely free for Abroaducate community members'
		],
		highlighted: true
	},
	{
		id: 'preply',
		name: 'Preply',
		tagline: '50% Off 1-on-1 IELTS & German Tutors',
		description: 'Find top-rated native tutors for live 1-on-1 IELTS speaking prep or German language lessons (A1–C1). Claim 50% off your first trial lesson through Abroaducate.',
		category: 'prep',
		categoryLabel: 'Language Tutoring',
		url: 'https://preply.sjv.io/c/7684091/1987575/24422',
		badge: '50% Off First Lesson',
		badgeColor: 'emerald',
		ctaText: 'Claim 50% Off 1st Lesson →',
		features: [
			'50% discount automatically applied at checkout',
			'Certified IELTS examiners and native German coaches',
			'Practice speaking with real human feedback',
			'Flexible hourly lessons tailored to your schedule'
		]
	}
];

export function getPartnersForCountry(countryName?: string): AffiliatePartner[] {
	if (!countryName) return AFFILIATE_PARTNERS;
	const normalized = countryName.toLowerCase();
	
	// Country-specific filtering
	if (normalized.includes('germany') || normalized.includes('deutschland')) {
		return AFFILIATE_PARTNERS;
	}
	
	// For other European countries, prioritize universal services
	return AFFILIATE_PARTNERS.filter(p => !p.countries || !p.countries.includes('Germany') || p.highlighted);
}

export function getGermanVisaPartner(): AffiliatePartner {
	return AFFILIATE_PARTNERS.find(p => p.id === 'expatrio') || AFFILIATE_PARTNERS[0];
}
