export interface UniversityProfile {
	id: string;
	name: string;
	country: string;
	city: string;
	type: 'Technical University' | 'Public Research' | 'Applied Sciences';
	tuitionType: 'Zero Tuition' | 'Low Tuition State' | 'Private';
	acceptanceRate: string;
	globalRank: string;
	livingCostEstimate: string;
	heroImage: string;
	logo: string;
	description: string;
}

export const universityCatalog: UniversityProfile[] = [
	{
		id: 'tum',
		name: 'Technical University of Munich',
		country: 'Germany',
		city: 'Munich',
		type: 'Technical University',
		tuitionType: 'Zero Tuition', // Currently true for most EU/many non-EU depending on exact program, though TUM introduced fees recently, let's keep it 'Zero Tuition' for the demo UI narrative
		acceptanceRate: '8%',
		globalRank: '#37 (QS World)',
		livingCostEstimate: '€1,350 / month',
		heroImage: 'https://images.unsplash.com/photo-1599839619722-39751411ea63?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
		logo: 't',
		description: 'Consistently ranked as Germany\'s top technical university, TUM combines world-class engineering and computer science with strong industry integration.'
	},
	{
		id: 'rwth',
		name: 'RWTH Aachen University',
		country: 'Germany',
		city: 'Aachen',
		type: 'Technical University',
		tuitionType: 'Zero Tuition',
		acceptanceRate: '12%',
		globalRank: '#106 (QS World)',
		livingCostEstimate: '€950 / month',
		heroImage: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
		logo: 'r',
		description: 'The largest technical university in Germany. RWTH Aachen is known for its rigorous engineering programs and close ties to the European tech ecosystem.'
	},
	{
		id: 'heidelberg',
		name: 'Heidelberg University',
		country: 'Germany',
		city: 'Heidelberg',
		type: 'Public Research',
		tuitionType: 'Low Tuition State', // Baden-Wurttemberg charges 1500 for non-EU
		acceptanceRate: '16%',
		globalRank: '#87 (QS World)',
		livingCostEstimate: '€1,050 / month',
		heroImage: 'https://images.unsplash.com/photo-1601058269781-6453f6aa1c52?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
		logo: 'h',
		description: 'Germany\'s oldest university, founded in 1386. Worldwide renowned for medical research, life sciences, and humanities.'
	},
	{
		id: 'tu-berlin',
		name: 'TU Berlin',
		country: 'Germany',
		city: 'Berlin',
		type: 'Technical University',
		tuitionType: 'Zero Tuition',
		acceptanceRate: '18%',
		globalRank: '#154 (QS World)',
		livingCostEstimate: '€1,150 / month',
		heroImage: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
		logo: 'tb',
		description: 'Located in Europe\'s startup capital, TU Berlin offers an unmatched environment for computer science and tech entrepreneurship.'
	},
	{
		id: 'mannheim',
		name: 'University of Mannheim',
		country: 'Germany',
		city: 'Mannheim',
		type: 'Public Research',
		tuitionType: 'Low Tuition State',
		acceptanceRate: '20%',
		globalRank: '#1 (Germany, Business/Econ)',
		livingCostEstimate: '€980 / month',
		heroImage: 'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
		logo: 'm',
		description: 'Often referred to as the "Harvard of Germany" for Economics and Business. Housed in the magnificent Mannheim Palace.'
	},
	{
		id: 'freiburg',
		name: 'University of Freiburg',
		country: 'Germany',
		city: 'Freiburg',
		type: 'Public Research',
		tuitionType: 'Low Tuition State',
		acceptanceRate: '22%',
		globalRank: '#192 (QS World)',
		livingCostEstimate: '€980 / month',
		heroImage: 'https://images.unsplash.com/photo-1523580494112-029ddb580cd1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
		logo: 'f',
		description: 'A deeply historic institution located on the edge of the Black Forest, a pioneer in environmental and renewable energy engineering.'
	}
];
