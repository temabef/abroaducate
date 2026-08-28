export interface CountryMeta {
	slug: string;
	name: string;
	title: string;
	metaDescription: string;
	tagline: string;
	heroSub: string;
	livingCost: string;
	blockedAccount: string;
	postStudyWork: string;
	tuitionSummary: string;
	ieltsRequirement: string;
	primaryAffiliate: 'expatrio' | 'translated' | 'airalo' | 'grey';
	faqs: Array<{ q: string; a: string }>;
}

export interface FieldMeta {
	slug: string;
	name: string;
	searchKeywords: string[];
	description: string;
}

export const COUNTRY_HUBS: Record<string, CountryMeta> = {
	germany: {
		slug: 'germany',
		name: 'Germany',
		title: 'Tuition-Free Universities in Germany (2026/2027) — Study in English',
		metaDescription: 'Explore 1,200+ accredited, English-taught Bachelor & Master degrees in Germany with €0 tuition fees. Compare TUM, RWTH Aachen, and TU Berlin with visa guides.',
		tagline: 'World-Class Education with 0 EUR Tuition',
		heroSub: 'Discover accredited English-taught degrees at German public universities. Get complete cost breakdowns, application deadlines, and visa blocked account requirements.',
		livingCost: '€934 / month',
		blockedAccount: '€11,904 / year (Official German Blocked Account)',
		postStudyWork: '18-Month Post-Study Job Seeker Visa',
		tuitionSummary: '€0 / semester at public universities',
		ieltsRequirement: 'IELTS 6.5+ or English MOI letter (accepted by select universities)',
		primaryAffiliate: 'expatrio',
		faqs: [
			{
				q: 'Are public universities in Germany really tuition-free for international students?',
				a: 'Yes. In 15 out of 16 German federal states, public universities charge €0 tuition for both EU and non-EU international students. Students only pay a minor semester contribution (€150–€350) which includes a public transport ticket.'
			},
			{
				q: 'How much money do I need in a German Blocked Account for a student visa?',
				a: 'As of 2026, the German Federal Foreign Office requires international students to deposit €11,904 (€992/month) into an embassy-approved blocked account such as Expatrio.'
			},
			{
				q: 'Can I study in Germany in English without knowing German?',
				a: 'Yes. Germany offers thousands of degree programs taught 100% in English. While knowing basic conversational German helps daily life, many international students complete their entire degrees and land tech jobs in English.'
			}
		]
	},
	italy: {
		slug: 'italy',
		name: 'Italy',
		flagEmoji: '🇮🇹',
		title: 'Study in Italy in English: Universities & DSU Scholarships 2026',
		metaDescription: 'Find affordable English-taught degrees in Italy with DSU regional scholarships up to €7,000/year. Explore Politecnico di Milano, Sapienza, and Padova.',
		tagline: 'Affordable Degrees with DSU Scholarships up to €7,000/yr',
		heroSub: 'Study at prestigious historic universities in Milan, Rome, and Padua with low income-based tuition and generous regional living grants.',
		livingCost: '€700–€900 / month',
		blockedAccount: '€6,000 / year proof of financial resources',
		postStudyWork: '12-Month Post-Study Permesso di Soggiorno',
		tuitionSummary: '€900–€2,500 / year (Reduced to €0 with DSU grant)',
		ieltsRequirement: 'IELTS 6.0+ or English medium of instruction certificate',
		primaryAffiliate: 'translated',
		faqs: [
			{
				q: 'What is the Italian DSU Scholarship?',
				a: 'The DSU (Diritto allo Studio Universitario) is an Italian regional scholarship based on family income (ISEE-U parificato). It provides 100% tuition fee waiver, free student cafeteria meals, and a yearly cash stipend of up to €7,000.'
			},
			{
				q: 'What are the top universities in Italy for English degrees?',
				a: 'Top choices include Politecnico di Milano, Politecnico di Torino, University of Bologna, Sapienza University of Rome, University of Padova, and University of Trento.'
			},
			{
				q: 'Do I need certified translations for Italian university applications?',
				a: 'Yes. Italian consulates and Universitaly require sworn translations and a Declaration of Value (DOV) or CIMEA comparability certificate for your academic transcripts and diplomas.'
			}
		]
	},
	austria: {
		slug: 'austria',
		name: 'Austria',
		flagEmoji: '🇦🇹',
		title: 'Study in Austria in English (2026/2027) — Low Tuition Universities',
		metaDescription: 'Explore accredited English-taught Master degrees in Austria for only €727/semester. Compare TU Wien, University of Vienna, and TU Graz.',
		tagline: 'Low-Cost European Degrees in Vienna & Graz',
		heroSub: 'Enjoy world-leading quality of life and high-tech academic programs in Austria with low statutory tuition for international students.',
		livingCost: '€950 / month',
		blockedAccount: '€700–€1,000 / month bank statement proof',
		postStudyWork: '12-Month Red-White-Red Card search permit',
		tuitionSummary: '€726.72 / semester for Non-EU students',
		ieltsRequirement: 'IELTS 6.5+ or TOEFL iBT 90+',
		primaryAffiliate: 'expatrio',
		faqs: [
			{
				q: 'How much is tuition for international students in Austria?',
				a: 'Public universities in Austria charge non-EU students a low statutory tuition fee of exactly €726.72 per semester (plus ~€24 student union fee).'
			},
			{
				q: 'Are programs at TU Wien and TU Graz taught in English?',
				a: 'Yes, both TU Wien and TU Graz offer extensive English-taught Master programs in Computer Science, Data Science, Software Engineering, and Biomedical Engineering.'
			}
		]
	},
	sweden: {
		slug: 'sweden',
		name: 'Sweden',
		flagEmoji: '🇸🇪',
		title: 'English Master\'s Degrees in Sweden (2026) — Study in Sweden',
		metaDescription: 'Discover 900+ English Master degrees in Sweden at KTH, Lund, Uppsala, and Chalmers. Learn about Swedish Institute scholarships and visa requirements.',
		tagline: 'Pioneering Technology, Innovation & Sustainability',
		heroSub: 'Study in one of the most innovative and English-fluent countries in the world. Compare programs on UniversityAdmissions.se and discover funding.',
		livingCost: '€950 / month (approx. 10,000 SEK)',
		blockedAccount: '10,314 SEK / month proof of maintenance for Migrationsverket',
		postStudyWork: '12-Month Post-Study Job Seeker Residence Permit',
		tuitionSummary: '€7,000–€15,000 / year (SI Global Scholarships cover 100%)',
		ieltsRequirement: 'IELTS 6.5 (English 6 requirement)',
		primaryAffiliate: 'airalo',
		faqs: [
			{
				q: 'How do international students apply to Swedish universities?',
				a: 'All university applications in Sweden are processed through the centralized national portal: UniversityAdmissions.se (with major deadlines in mid-January and mid-April).'
			},
			{
				q: 'Can international students get scholarships in Sweden?',
				a: 'Yes. The Swedish Institute (SI) Scholarship for Global Professionals covers 100% of tuition, living expenses (12,000 SEK/month), and travel grants for international Master students.'
			}
		]
	},
	france: {
		slug: 'france',
		name: 'France',
		flagEmoji: '🇫🇷',
		title: 'Study in France in English (2026/2027) — Subsidized Universities',
		metaDescription: 'Explore affordable English-taught Master & Bachelor degrees in France. Learn about Campus France admissions and CAF housing subsidies for international students.',
		tagline: 'Subsidized Public Higher Education & CAF Rent Support',
		heroSub: 'Study in Paris, Lyon, Toulouse, or Grenoble in English with generous government housing subsidies (CAF) that refund 30–40% of your rent.',
		livingCost: '€750 / month (after CAF rent subsidy)',
		blockedAccount: '€615 / month minimum bank proof of resources',
		postStudyWork: '24-Month APS / Job Seeker Visa for Master graduates',
		tuitionSummary: '€243–€3,770 / year at public institutions',
		ieltsRequirement: 'IELTS 6.0+ or English MOI',
		primaryAffiliate: 'translated',
		faqs: [
			{
				q: 'What is the CAF housing subsidy for international students in France?',
				a: 'CAF (Caisse d\'Allocations Familiales) is a French government welfare program available to ALL legal international students, reimbursing between €100 and €250 of your monthly rent.'
			},
			{
				q: 'What is the application process via Campus France?',
				a: 'Students from 68+ countries must apply through the "Etudes en France" (EEF) portal and complete a brief pre-consular interview before receiving their VLS-TS student visa.'
			}
		]
	},
	poland: {
		slug: 'poland',
		name: 'Poland',
		flagEmoji: '🇵🇱',
		title: 'Study in Poland in English (2026) — Low Living Cost European Degrees',
		metaDescription: 'Discover budget-friendly English-taught degree programs in Poland with living costs from €500/month. Explore Warsaw University of Technology and AGH.',
		tagline: 'High-Quality European Degrees with the Lowest Living Costs',
		heroSub: 'Study in Warsaw, Krakow, or Wroclaw with low tuition and the most affordable student living costs in the European Union.',
		livingCost: '€500–€650 / month (~2,500 PLN)',
		blockedAccount: '€3,000–€4,000 bank statement proof',
		postStudyWork: '9-Month Post-Study Job Seeker Permit',
		tuitionSummary: '€1,500–€3,000 / year',
		ieltsRequirement: 'IELTS 5.5–6.0 or English proficiency letter',
		primaryAffiliate: 'grey',
		faqs: [
			{
				q: 'Is Poland affordable for international students?',
				a: 'Poland has among the lowest cost of living in the EU. Student dormitories cost €120–€200/month, and monthly living expenses rarely exceed €500–€600.'
			}
		]
	}
};

export const FIELD_HUBS: Record<string, FieldMeta> = {
	'computer-science': {
		slug: 'computer-science',
		name: 'Computer Science & Software',
		searchKeywords: ['computer science', 'informatics', 'software', 'computing', 'cyber'],
		description: 'Accredited Master and Bachelor programs in Computer Science, Software Engineering, AI, and Cybersecurity.'
	},
	'data-science': {
		slug: 'data-science',
		name: 'Data Science & AI',
		searchKeywords: ['data science', 'data analytics', 'artificial intelligence', 'machine learning', 'data engineering'],
		description: 'Top European programs focusing on Big Data, Machine Learning algorithms, and Applied AI.'
	},
	'engineering': {
		slug: 'engineering',
		name: 'Engineering & Technology',
		searchKeywords: ['engineering', 'mechanical', 'electrical', 'aerospace', 'civil', 'robotics'],
		description: 'Leading European technical degrees in Mechanical, Electrical, Aerospace, and Civil Engineering.'
	},
	'business': {
		slug: 'business',
		name: 'Business & Management',
		searchKeywords: ['business', 'management', 'economics', 'finance', 'marketing'],
		description: 'Globally recognized European Business, Finance, and International Management degrees.'
	},
	'natural-sciences': {
		slug: 'natural-sciences',
		name: 'Natural & Life Sciences',
		searchKeywords: ['science', 'physics', 'chemistry', 'biology', 'mathematics', 'biomedical'],
		description: 'Research-oriented programs in Physics, Chemistry, Molecular Biology, and Applied Mathematics.'
	}
};
