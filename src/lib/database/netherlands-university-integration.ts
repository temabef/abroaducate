// Netherlands University Database Integration System
// Phase 2.4: European Expansion - Dutch Universities

import type { EnhancedUniversity } from './university-integration';

// Dutch University Rankings Data (Based on QS, Times Higher Education, CWTS Leiden)
export interface DutchUniversityData {
    id: string;
    name: string;
    city: string;
    province: string;
    region: string;
    established: number;
    qs_ranking?: number;
    times_ranking?: number;
    leiden_ranking?: number;
    acceptance_rate?: number;
    tuition_eu: number; // EU/EEA students
    tuition_non_eu: number; // Non-EU students
    living_cost: number;
    total_students?: number;
    international_students_percentage?: number;
    university_type: 'research' | 'applied_sciences' | 'technical' | 'specialized' | 'art_design';
    language: 'dutch' | 'english' | 'bilingual';
    research_intensity: 'very_high' | 'high' | 'medium' | 'limited';
    notable_programs: string[];
    strengths: string[];
    website: string;
    u4_member: boolean; // U4 Network (Utrecht, Ghent, Göttingen, Uppsala)
    guild_member: boolean; // The Guild of European Research-Intensive Universities
}

// Top 30+ Dutch Universities Database (2025 Data)
export const DUTCH_UNIVERSITIES: DutchUniversityData[] = [
    // RESEARCH UNIVERSITIES (WO - Wetenschappelijk Onderwijs)
    {
        id: 'nl-delft',
        name: 'Delft University of Technology',
        city: 'Delft',
        province: 'South Holland',
        region: 'Randstad',
        established: 1842,
        qs_ranking: 47,
        times_ranking: 58,
        leiden_ranking: 12,
        acceptance_rate: 35,
        tuition_eu: 2314,
        tuition_non_eu: 18750,
        living_cost: 12000,
        total_students: 26000,
        international_students_percentage: 35,
        university_type: 'technical',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Engineering', 'Architecture', 'Computer Science', 'Aerospace Engineering', 'Civil Engineering'],
        strengths: ['engineering-excellence', 'innovation-hub', 'industry-partnerships', 'sustainability-focus'],
        website: 'https://www.tudelft.nl',
        u4_member: false,
        guild_member: true
    },
    {
        id: 'nl-amsterdam',
        name: 'University of Amsterdam',
        city: 'Amsterdam',
        province: 'North Holland',
        region: 'Randstad',
        established: 1632,
        qs_ranking: 53,
        times_ranking: 61,
        leiden_ranking: 8,
        acceptance_rate: 25,
        tuition_eu: 2314,
        tuition_non_eu: 15500,
        living_cost: 14000,
        total_students: 42000,
        international_students_percentage: 28,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Business', 'Economics', 'Psychology', 'Medicine', 'Law', 'Computer Science'],
        strengths: ['research-excellence', 'international-focus', 'business-programs', 'liberal-arts'],
        website: 'https://www.uva.nl',
        u4_member: false,
        guild_member: true
    },
    {
        id: 'nl-utrecht',
        name: 'Utrecht University',
        city: 'Utrecht',
        province: 'Utrecht',
        region: 'Central Netherlands',
        established: 1636,
        qs_ranking: 105,
        times_ranking: 69,
        leiden_ranking: 15,
        acceptance_rate: 30,
        tuition_eu: 2314,
        tuition_non_eu: 15500,
        living_cost: 11500,
        total_students: 32000,
        international_students_percentage: 22,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Medicine', 'Veterinary Medicine', 'Law', 'Social Sciences', 'Natural Sciences'],
        strengths: ['research-excellence', 'medical-programs', 'veterinary-excellence', 'historic-prestige'],
        website: 'https://www.uu.nl',
        u4_member: true,
        guild_member: true
    },
    {
        id: 'nl-leiden',
        name: 'Leiden University',
        city: 'Leiden',
        province: 'South Holland',
        region: 'Randstad',
        established: 1575,
        qs_ranking: 126,
        times_ranking: 77,
        leiden_ranking: 18,
        acceptance_rate: 28,
        tuition_eu: 2314,
        tuition_non_eu: 15500,
        living_cost: 12500,
        total_students: 27000,
        international_students_percentage: 20,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Law', 'Medicine', 'Archaeology', 'International Relations', 'Psychology'],
        strengths: ['oldest-university', 'law-excellence', 'international-law', 'research-tradition'],
        website: 'https://www.universiteitleiden.nl',
        u4_member: false,
        guild_member: true
    },
    {
        id: 'nl-eindhoven',
        name: 'Eindhoven University of Technology',
        city: 'Eindhoven',
        province: 'North Brabant',
        region: 'South Netherlands',
        established: 1956,
        qs_ranking: 120,
        times_ranking: 167,
        leiden_ranking: 25,
        acceptance_rate: 40,
        tuition_eu: 2314,
        tuition_non_eu: 16500,
        living_cost: 10500,
        total_students: 12000,
        international_students_percentage: 45,
        university_type: 'technical',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Engineering', 'Computer Science', 'Industrial Design', 'Architecture', 'Applied Physics'],
        strengths: ['technology-focus', 'innovation-hub', 'industry-collaboration', 'design-excellence'],
        website: 'https://www.tue.nl',
        u4_member: false,
        guild_member: false
    },
    {
        id: 'nl-erasmus',
        name: 'Erasmus University Rotterdam',
        city: 'Rotterdam',
        province: 'South Holland',
        region: 'Randstad',
        established: 1913,
        qs_ranking: 179,
        times_ranking: 72,
        leiden_ranking: 30,
        acceptance_rate: 32,
        tuition_eu: 2314,
        tuition_non_eu: 15500,
        living_cost: 12000,
        total_students: 29000,
        international_students_percentage: 25,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Business Administration', 'Economics', 'Medicine', 'Law', 'Social Sciences'],
        strengths: ['business-excellence', 'economics-focus', 'port-city-advantage', 'international-business'],
        website: 'https://www.eur.nl',
        u4_member: false,
        guild_member: false
    },
    {
        id: 'nl-groningen',
        name: 'University of Groningen',
        city: 'Groningen',
        province: 'Groningen',
        region: 'North Netherlands',
        established: 1614,
        qs_ranking: 139,
        times_ranking: 80,
        leiden_ranking: 22,
        acceptance_rate: 35,
        tuition_eu: 2314,
        tuition_non_eu: 15500,
        living_cost: 10000,
        total_students: 34000,
        international_students_percentage: 30,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Psychology', 'Business', 'Medicine', 'Natural Sciences', 'Humanities'],
        strengths: ['student-city', 'international-focus', 'research-excellence', 'affordable-living'],
        website: 'https://www.rug.nl',
        u4_member: false,
        guild_member: false
    },
    {
        id: 'nl-twente',
        name: 'University of Twente',
        city: 'Enschede',
        province: 'Overijssel',
        region: 'East Netherlands',
        established: 1961,
        qs_ranking: 201,
        times_ranking: 201,
        acceptance_rate: 45,
        tuition_eu: 2314,
        tuition_non_eu: 16500,
        living_cost: 9500,
        total_students: 12000,
        international_students_percentage: 35,
        university_type: 'technical',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Engineering', 'Computer Science', 'Business Administration', 'Applied Physics'],
        strengths: ['entrepreneurship', 'technology-focus', 'campus-university', 'innovation'],
        website: 'https://www.utwente.nl',
        u4_member: false,
        guild_member: false
    },
    {
        id: 'nl-maastricht',
        name: 'Maastricht University',
        city: 'Maastricht',
        province: 'Limburg',
        region: 'South Netherlands',
        established: 1976,
        qs_ranking: 234,
        times_ranking: 121,
        acceptance_rate: 38,
        tuition_eu: 2314,
        tuition_non_eu: 15500,
        living_cost: 11000,
        total_students: 18000,
        international_students_percentage: 55,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Medicine', 'Business', 'Law', 'Psychology', 'European Studies'],
        strengths: ['international-focus', 'problem-based-learning', 'european-location', 'medical-excellence'],
        website: 'https://www.maastrichtuniversity.nl',
        u4_member: false,
        guild_member: false
    },
    {
        id: 'nl-tilburg',
        name: 'Tilburg University',
        city: 'Tilburg',
        province: 'North Brabant',
        region: 'South Netherlands',
        established: 1927,
        qs_ranking: 356,
        times_ranking: 201,
        acceptance_rate: 42,
        tuition_eu: 2314,
        tuition_non_eu: 15500,
        living_cost: 10500,
        total_students: 17000,
        international_students_percentage: 25,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Economics', 'Business', 'Law', 'Social Sciences', 'Psychology'],
        strengths: ['economics-excellence', 'business-focus', 'social-sciences', 'research-quality'],
        website: 'https://www.tilburguniversity.edu',
        u4_member: false,
        guild_member: false
    },

    // UNIVERSITIES OF APPLIED SCIENCES (HBO - Hoger Beroepsonderwijs)
    {
        id: 'nl-hva',
        name: 'Amsterdam University of Applied Sciences',
        city: 'Amsterdam',
        province: 'North Holland',
        region: 'Randstad',
        established: 1992,
        acceptance_rate: 55,
        tuition_eu: 2314,
        tuition_non_eu: 8500,
        living_cost: 14000,
        total_students: 45000,
        international_students_percentage: 15,
        university_type: 'applied_sciences',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Business', 'Engineering', 'Media & Information', 'Health', 'Education'],
        strengths: ['practical-focus', 'industry-connections', 'amsterdam-location', 'applied-research'],
        website: 'https://www.hva.nl',
        u4_member: false,
        guild_member: false
    },
    {
        id: 'nl-rotterdam-uas',
        name: 'Rotterdam University of Applied Sciences',
        city: 'Rotterdam',
        province: 'South Holland',
        region: 'Randstad',
        established: 1988,
        acceptance_rate: 60,
        tuition_eu: 2314,
        tuition_non_eu: 8500,
        living_cost: 12000,
        total_students: 37000,
        international_students_percentage: 12,
        university_type: 'applied_sciences',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Business', 'Engineering', 'Health Care', 'Art & Design', 'Built Environment'],
        strengths: ['practical-education', 'port-city-focus', 'sustainability', 'innovation'],
        website: 'https://www.hr.nl',
        u4_member: false,
        guild_member: false
    },
    {
        id: 'nl-hague-uas',
        name: 'The Hague University of Applied Sciences',
        city: 'The Hague',
        province: 'South Holland',
        region: 'Randstad',
        established: 1987,
        acceptance_rate: 58,
        tuition_eu: 2314,
        tuition_non_eu: 8500,
        living_cost: 13000,
        total_students: 26000,
        international_students_percentage: 20,
        university_type: 'applied_sciences',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['International Business', 'Law', 'IT', 'Public Administration', 'Security Studies'],
        strengths: ['international-focus', 'government-connections', 'security-studies', 'diplomatic-city'],
        website: 'https://www.thehagueuniversity.com',
        u4_member: false,
        guild_member: false
    },
    {
        id: 'nl-fontys',
        name: 'Fontys University of Applied Sciences',
        city: 'Eindhoven',
        province: 'North Brabant',
        region: 'South Netherlands',
        established: 1996,
        acceptance_rate: 65,
        tuition_eu: 2314,
        tuition_non_eu: 8500,
        living_cost: 10500,
        total_students: 44000,
        international_students_percentage: 10,
        university_type: 'applied_sciences',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Business', 'Arts', 'Health', 'Education'],
        strengths: ['large-network', 'practical-focus', 'regional-connections', 'diverse-programs'],
        website: 'https://fontys.nl',
        u4_member: false,
        guild_member: false
    },
    {
        id: 'nl-saxion',
        name: 'Saxion University of Applied Sciences',
        city: 'Enschede',
        province: 'Overijssel',
        region: 'East Netherlands',
        established: 1998,
        acceptance_rate: 62,
        tuition_eu: 2314,
        tuition_non_eu: 8500,
        living_cost: 9500,
        total_students: 27000,
        international_students_percentage: 15,
        university_type: 'applied_sciences',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Business', 'Health', 'Art & Design', 'Hotel Management'],
        strengths: ['practical-education', 'industry-partnerships', 'affordable-location', 'innovation-focus'],
        website: 'https://www.saxion.edu',
        u4_member: false,
        guild_member: false
    },

    // SPECIALIZED INSTITUTIONS
    {
        id: 'nl-wageningen',
        name: 'Wageningen University & Research',
        city: 'Wageningen',
        province: 'Gelderland',
        region: 'Central Netherlands',
        established: 1918,
        qs_ranking: 124,
        times_ranking: 59,
        leiden_ranking: 35,
        acceptance_rate: 45,
        tuition_eu: 2314,
        tuition_non_eu: 18750,
        living_cost: 10500,
        total_students: 12000,
        international_students_percentage: 40,
        university_type: 'specialized',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Agriculture', 'Environmental Sciences', 'Food Technology', 'Life Sciences', 'Forestry'],
        strengths: ['agriculture-excellence', 'sustainability-focus', 'food-security', 'environmental-research'],
        website: 'https://www.wur.nl',
        u4_member: false,
        guild_member: false
    },
    {
        id: 'nl-iss',
        name: 'International Institute of Social Studies',
        city: 'The Hague',
        province: 'South Holland',
        region: 'Randstad',
        established: 1952,
        acceptance_rate: 35,
        tuition_eu: 2314,
        tuition_non_eu: 15500,
        living_cost: 13000,
        total_students: 1500,
        international_students_percentage: 85,
        university_type: 'specialized',
        language: 'english',
        research_intensity: 'very_high',
        notable_programs: ['Development Studies', 'International Relations', 'Public Policy', 'Economics'],
        strengths: ['development-studies', 'international-focus', 'policy-research', 'global-network'],
        website: 'https://www.iss.nl',
        u4_member: false,
        guild_member: false
    },
    {
        id: 'nl-rietveld',
        name: 'Gerrit Rietveld Academie',
        city: 'Amsterdam',
        province: 'North Holland',
        region: 'Randstad',
        established: 1924,
        acceptance_rate: 25,
        tuition_eu: 2314,
        tuition_non_eu: 8500,
        living_cost: 14000,
        total_students: 1200,
        international_students_percentage: 50,
        university_type: 'art_design',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Fine Arts', 'Design', 'Architecture', 'Fashion Design', 'Graphic Design'],
        strengths: ['art-excellence', 'design-innovation', 'creative-freedom', 'amsterdam-culture'],
        website: 'https://www.rietveldacademie.nl',
        u4_member: false,
        guild_member: false
    },
    {
        id: 'nl-design-academy',
        name: 'Design Academy Eindhoven',
        city: 'Eindhoven',
        province: 'North Brabant',
        region: 'South Netherlands',
        established: 1947,
        acceptance_rate: 30,
        tuition_eu: 2314,
        tuition_non_eu: 8500,
        living_cost: 10500,
        total_students: 700,
        international_students_percentage: 60,
        university_type: 'art_design',
        language: 'english',
        research_intensity: 'medium',
        notable_programs: ['Industrial Design', 'Fashion Design', 'Graphic Design', 'Spatial Design'],
        strengths: ['design-excellence', 'innovation-focus', 'industry-connections', 'creative-thinking'],
        website: 'https://www.designacademy.nl',
        u4_member: false,
        guild_member: false
    },
    {
        id: 'nl-nyenrode',
        name: 'Nyenrode Business University',
        city: 'Breukelen',
        province: 'Utrecht',
        region: 'Central Netherlands',
        established: 1946,
        qs_ranking: 0,
        times_ranking: 0,
        acceptance_rate: 40,
        tuition_eu: 18000,
        tuition_non_eu: 25000,
        living_cost: 12000,
        total_students: 3000,
        international_students_percentage: 30,
        university_type: 'specialized',
        language: 'english',
        research_intensity: 'medium',
        notable_programs: ['MBA', 'Executive Education', 'Business', 'Management', 'Finance'],
        strengths: ['business-focus', 'executive-education', 'industry-connections', 'castle-campus'],
        website: 'https://www.nyenrode.nl/en',
        u4_member: false,
        guild_member: false
    },
    {
        id: 'nl-radboud',
        name: 'Radboud University',
        city: 'Nijmegen',
        province: 'Gelderland',
        region: 'Eastern Netherlands',
        established: 1923,
        qs_ranking: 209,
        times_ranking: 136,
        acceptance_rate: 60,
        tuition_eu: 2168,
        tuition_non_eu: 16000,
        living_cost: 11000,
        total_students: 24000,
        international_students_percentage: 15,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Medicine', 'Neuroscience', 'Physics', 'Computer Science', 'Religious Studies'],
        strengths: ['research-excellence', 'neuroscience-focus', 'green-campus', 'student-satisfaction'],
        website: 'https://www.ru.nl/en',
        u4_member: false,
        guild_member: false
    },
    {
        id: 'nl-open-university',
        name: 'Open University of the Netherlands',
        city: 'Heerlen',
        province: 'Limburg',
        region: 'Southern Netherlands',
        established: 1984,
        qs_ranking: 0,
        times_ranking: 0,
        acceptance_rate: 90,
        tuition_eu: 2000,
        tuition_non_eu: 8000,
        living_cost: 0,
        total_students: 15000,
        international_students_percentage: 5,
        university_type: 'specialized',
        language: 'dutch',
        research_intensity: 'medium',
        notable_programs: ['Psychology', 'Law', 'Management', 'Computer Science', 'Environmental Sciences'],
        strengths: ['distance-learning', 'flexible-study', 'lifelong-learning', 'accessibility'],
        website: 'https://www.ou.nl/en',
        u4_member: false,
        guild_member: false
    },
    {
        id: 'nl-vu-amsterdam',
        name: 'Vrije Universiteit Amsterdam',
        city: 'Amsterdam',
        province: 'North Holland',
        region: 'Western Netherlands',
        established: 1880,
        qs_ranking: 236,
        times_ranking: 121,
        acceptance_rate: 65,
        tuition_eu: 2168,
        tuition_non_eu: 15500,
        living_cost: 13000,
        total_students: 30000,
        international_students_percentage: 15,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Business', 'Psychology', 'Computer Science', 'Law', 'Earth Sciences'],
        strengths: ['interdisciplinary-approach', 'sustainability-focus', 'diverse-community', 'research-excellence'],
        website: 'https://www.vu.nl/en',
        u4_member: false,
        guild_member: false
    },
    {
        id: 'nl-inholland',
        name: 'Inholland University of Applied Sciences',
        city: 'Multiple Locations',
        province: 'Multiple Provinces',
        region: 'Western Netherlands',
        established: 2002,
        qs_ranking: 0,
        times_ranking: 0,
        acceptance_rate: 80,
        tuition_eu: 2168,
        tuition_non_eu: 8500,
        living_cost: 12000,
        total_students: 29000,
        international_students_percentage: 10,
        university_type: 'applied_sciences',
        language: 'bilingual',
        research_intensity: 'limited',
        notable_programs: ['Business', 'Education', 'Engineering', 'Healthcare', 'Media'],
        strengths: ['practical-education', 'industry-connections', 'multiple-campuses', 'international-programs'],
        website: 'https://www.inholland.nl/inhollandcom',
        u4_member: false,
        guild_member: false
    },
    {
        id: 'nl-han',
        name: 'HAN University of Applied Sciences',
        city: 'Arnhem/Nijmegen',
        province: 'Gelderland',
        region: 'Eastern Netherlands',
        established: 1996,
        qs_ranking: 0,
        times_ranking: 0,
        acceptance_rate: 75,
        tuition_eu: 2168,
        tuition_non_eu: 9000,
        living_cost: 10500,
        total_students: 36000,
        international_students_percentage: 8,
        university_type: 'applied_sciences',
        language: 'bilingual',
        research_intensity: 'limited',
        notable_programs: ['Engineering', 'Business', 'Health', 'Education', 'Social Work'],
        strengths: ['practical-focus', 'dual-campus', 'industry-partnerships', 'applied-research'],
        website: 'https://hanuniversity.com',
        u4_member: false,
        guild_member: false
    },
    {
        id: 'nl-windesheim',
        name: 'Windesheim University of Applied Sciences',
        city: 'Zwolle',
        province: 'Overijssel',
        region: 'Eastern Netherlands',
        established: 1986,
        qs_ranking: 0,
        times_ranking: 0,
        acceptance_rate: 80,
        tuition_eu: 2168,
        tuition_non_eu: 8500,
        living_cost: 10000,
        total_students: 25000,
        international_students_percentage: 5,
        university_type: 'applied_sciences',
        language: 'bilingual',
        research_intensity: 'limited',
        notable_programs: ['Business', 'Education', 'Engineering', 'ICT', 'Health Care'],
        strengths: ['practical-education', 'student-satisfaction', 'regional-connections', 'personal-approach'],
        website: 'https://www.windesheim.com',
        u4_member: false,
        guild_member: false
    },
    {
        id: 'nl-zuyd',
        name: 'Zuyd University of Applied Sciences',
        city: 'Maastricht/Heerlen/Sittard',
        province: 'Limburg',
        region: 'Southern Netherlands',
        established: 2002,
        qs_ranking: 0,
        times_ranking: 0,
        acceptance_rate: 80,
        tuition_eu: 2168,
        tuition_non_eu: 8500,
        living_cost: 10500,
        total_students: 14000,
        international_students_percentage: 15,
        university_type: 'applied_sciences',
        language: 'bilingual',
        research_intensity: 'limited',
        notable_programs: ['Hotel Management', 'Arts', 'Business', 'Healthcare', 'Technology'],
        strengths: ['euregional-focus', 'practical-education', 'arts-programs', 'hospitality-education'],
        website: 'https://www.zuyd.nl/en',
        u4_member: false,
        guild_member: false
    },
    {
        id: 'nl-avans',
        name: 'Avans University of Applied Sciences',
        city: 'Breda/Den Bosch/Tilburg',
        province: 'North Brabant',
        region: 'Southern Netherlands',
        established: 2004,
        qs_ranking: 0,
        times_ranking: 0,
        acceptance_rate: 75,
        tuition_eu: 2168,
        tuition_non_eu: 8700,
        living_cost: 11000,
        total_students: 33000,
        international_students_percentage: 7,
        university_type: 'applied_sciences',
        language: 'bilingual',
        research_intensity: 'limited',
        notable_programs: ['Business', 'Engineering', 'Art & Design', 'ICT', 'Built Environment'],
        strengths: ['quality-education', 'student-satisfaction', 'industry-connections', 'multi-campus'],
        website: 'https://www.avans.nl/international',
        u4_member: false,
        guild_member: false
    },
    {
        id: 'nl-nhtv',
        name: 'Breda University of Applied Sciences',
        city: 'Breda',
        province: 'North Brabant',
        region: 'Southern Netherlands',
        established: 1966,
        qs_ranking: 0,
        times_ranking: 0,
        acceptance_rate: 70,
        tuition_eu: 2168,
        tuition_non_eu: 9500,
        living_cost: 11000,
        total_students: 7000,
        international_students_percentage: 25,
        university_type: 'applied_sciences',
        language: 'bilingual',
        research_intensity: 'limited',
        notable_programs: ['Tourism', 'Hospitality', 'Leisure Management', 'Game Development', 'Media'],
        strengths: ['tourism-expertise', 'international-focus', 'industry-connections', 'specialized-programs'],
        website: 'https://www.buas.nl/en',
        u4_member: false,
        guild_member: false
    }
];

// Enhanced university conversion for Dutch universities
export class DutchUniversityDataManager {
    private cache: Map<string, EnhancedUniversity[]> = new Map();
    private lastFetch: number = 0;
    private cacheTimeout: number = 86400000; // 24 hours

    /**
     * Fetch Dutch universities with optional province filtering
     */
    async fetchDutchUniversities(province?: string, limit: number = 30): Promise<EnhancedUniversity[]> {
        const cacheKey = `dutch-${province || 'all'}-${limit}`;
        const now = Date.now();

        // Check cache
        if (this.cache.has(cacheKey) && (now - this.lastFetch) < this.cacheTimeout) {
            console.log(`📦 Returning cached Dutch universities for ${province || 'all provinces'}`);
            return this.cache.get(cacheKey)!;
        }

        console.log(`🇳🇱 Fetching Dutch universities from database for ${province || 'all provinces'}`);

        try {
            // Filter by province if specified
            let universities = DUTCH_UNIVERSITIES;
            if (province) {
                universities = universities.filter(uni => 
                    uni.province.toLowerCase() === province.toLowerCase()
                );
            }

            // Apply limit
            universities = universities.slice(0, limit);

            // Convert to enhanced format
            const enhanced = universities.map(uni => this.convertToEnhanced(uni));

            // Cache the results
            this.cache.set(cacheKey, enhanced);
            this.lastFetch = now;

            console.log(`✅ Successfully processed ${enhanced.length} Dutch universities`);
            return enhanced;

        } catch (error) {
            console.error('❌ Error fetching Dutch universities:', error);
            return [];
        }
    }

    /**
     * Convert Dutch university data to enhanced format
     */
    private convertToEnhanced(nlUni: DutchUniversityData): EnhancedUniversity {
        // Generate program scores based on notable programs
        const programScores = this.generateProgramScores(nlUni);

        // Calculate total cost (tuition + living)
        const totalCost = nlUni.tuition_non_eu + nlUni.living_cost;

        return {
            id: nlUni.id,
            name: nlUni.name,
            country: 'Netherlands',
            state: nlUni.province,
            city: nlUni.city,
            region: nlUni.region,
            ranking: nlUni.qs_ranking,
            global_ranking: nlUni.qs_ranking || this.estimateGlobalRanking(nlUni),
            national_ranking: this.estimateNationalRanking(nlUni),
            acceptance_rate: nlUni.acceptance_rate || this.estimateAcceptanceRate(nlUni),
            avg_gpa: this.estimateGPAFromAcceptance(nlUni.acceptance_rate || 40),
            avg_sat: undefined, // Dutch universities don't use SAT
            avg_act: undefined, // Dutch universities don't use ACT
            strengths: nlUni.strengths,
            programs: programScores,
            requirements: {
                min_gpa: this.estimateMinGPA(nlUni.acceptance_rate || 40),
                english_test: nlUni.language !== 'dutch',
                research_experience: this.getResearchRequirement(nlUni.research_intensity)
            },
            cost: totalCost,
            living_cost: nlUni.living_cost,
            in_state_tuition: nlUni.tuition_eu,
            out_of_state_tuition: nlUni.tuition_non_eu,
            scholarships: true,
            scholarship_percentage: this.estimateScholarshipAvailability(nlUni),
            median_debt: this.estimateMedianDebt(nlUni.tuition_non_eu),
            graduate_earnings: this.estimateGraduateEarnings(nlUni),
            location_type: this.determineLocationType(nlUni.city),
            class_size: this.determineClassSize(nlUni.total_students || 20000),
            research_opportunities: this.getResearchOpportunities(nlUni.research_intensity),
            student_size: nlUni.total_students,
            ownership_type: 'public',
            website_url: nlUni.website,
            data_source: 'hardcoded',
            last_updated: new Date().toISOString()
        };
    }

    private generateProgramScores(nlUni: DutchUniversityData): { [key: string]: number } {
        const programs: { [key: string]: number } = {};
        const baseScore = this.calculateBaseScore(nlUni);

        // Add scores for notable programs
        nlUni.notable_programs.forEach(program => {
            switch (program) {
                case 'Engineering':
                case 'Civil Engineering':
                case 'Aerospace Engineering':
                    programs['engineering'] = 92;
                    programs['civil-engineering'] = 90;
                    break;
                case 'Computer Science':
                    programs['computer-science'] = 88;
                    programs['technology'] = 85;
                    break;
                case 'Business':
                case 'Business Administration':
                case 'International Business':
                    programs['business'] = 87;
                    programs['international-business'] = 90;
                    break;
                case 'Economics':
                    programs['economics'] = 89;
                    programs['finance'] = 85;
                    break;
                case 'Medicine':
                    programs['pre-medicine'] = 86;
                    programs['biology'] = 83;
                    break;
                case 'Law':
                case 'International Law':
                    programs['political-science'] = 85;
                    programs['international-relations'] = 88;
                    break;
                case 'Psychology':
                    programs['psychology'] = 84;
                    break;
                case 'Architecture':
                    programs['architecture'] = 87;
                    programs['art'] = 82;
                    break;
                case 'Agriculture':
                case 'Environmental Sciences':
                    programs['environmental-science'] = 92;
                    programs['agriculture'] = 95;
                    break;
                case 'Design':
                case 'Industrial Design':
                    programs['art'] = 90;
                    programs['design'] = 93;
                    break;
            }
        });

        // Add location and type bonuses
        const bonuses = this.calculateLocationBonuses(nlUni);
        Object.keys(bonuses).forEach(program => {
            if (programs[program]) {
                programs[program] = Math.min(98, programs[program] + bonuses[program]);
            }
        });

        // Default programs
        const defaultPrograms = ['business', 'engineering', 'computer-science', 'economics', 'international-relations'];
        defaultPrograms.forEach(program => {
            if (!programs[program]) {
                programs[program] = baseScore;
            }
        });

        return programs;
    }

    private calculateLocationBonuses(nlUni: DutchUniversityData): { [key: string]: number } {
        const bonuses: { [key: string]: number } = {};

        // Guild and U4 bonuses
        if (nlUni.guild_member) {
            bonuses['research'] = 8;
        }
        if (nlUni.u4_member) {
            bonuses['international'] = 10;
        }

        // City-based specialties
        switch (nlUni.city) {
            case 'Amsterdam':
                bonuses['business'] = 5;
                bonuses['international'] = 8;
                bonuses['art'] = 10;
                break;
            case 'Rotterdam':
                bonuses['business'] = 8;
                bonuses['logistics'] = 10;
                bonuses['international-trade'] = 8;
                break;
            case 'The Hague':
                bonuses['international-relations'] = 10;
                bonuses['law'] = 8;
                bonuses['security-studies'] = 10;
                break;
            case 'Delft':
                bonuses['engineering'] = 10;
                bonuses['technology'] = 8;
                break;
            case 'Eindhoven':
                bonuses['technology'] = 8;
                bonuses['design'] = 10;
                bonuses['innovation'] = 8;
                break;
            case 'Wageningen':
                bonuses['agriculture'] = 15;
                bonuses['environmental-science'] = 12;
                break;
        }

        // University type bonuses
        switch (nlUni.university_type) {
            case 'technical':
                bonuses['engineering'] = 8;
                bonuses['computer-science'] = 6;
                break;
            case 'art_design':
                bonuses['art'] = 15;
                bonuses['design'] = 12;
                break;
            case 'specialized':
                if (nlUni.notable_programs.includes('Agriculture')) {
                    bonuses['agriculture'] = 15;
                    bonuses['environmental-science'] = 10;
                }
                break;
        }

        return bonuses;
    }

    private calculateBaseScore(nlUni: DutchUniversityData): number {
        let score = 82; // Higher base for Dutch universities (excellent education system)

        // Guild and U4 bonuses
        if (nlUni.guild_member) score += 8;
        if (nlUni.u4_member) score += 6;
        
        // Research intensity bonus
        switch (nlUni.research_intensity) {
            case 'very_high': score += 8; break;
            case 'high': score += 5; break;
        }

        // Global ranking bonus
        if (nlUni.qs_ranking && nlUni.qs_ranking <= 100) score += 8;
        else if (nlUni.qs_ranking && nlUni.qs_ranking <= 200) score += 5;

        // International focus bonus
        if (nlUni.international_students_percentage && nlUni.international_students_percentage > 30) score += 5;

        return Math.min(92, score);
    }

    private estimateGlobalRanking(nlUni: DutchUniversityData): number {
        if (nlUni.qs_ranking) return nlUni.qs_ranking;
        if (nlUni.times_ranking) return nlUni.times_ranking;
        
        // Estimate based on university characteristics
        let ranking = 300;
        if (nlUni.guild_member) ranking = 150;
        if (nlUni.university_type === 'technical') ranking -= 50;
        if (nlUni.research_intensity === 'very_high') ranking -= 30;
        
        return Math.max(50, ranking);
    }

    private estimateNationalRanking(nlUni: DutchUniversityData): number {
        // Estimate national ranking based on global ranking and characteristics
        const globalRank = nlUni.qs_ranking || this.estimateGlobalRanking(nlUni);
        
        if (globalRank <= 60) return Math.ceil(globalRank / 10);
        if (globalRank <= 150) return Math.ceil(globalRank / 15);
        return Math.ceil(globalRank / 20);
    }

    private estimateAcceptanceRate(nlUni: DutchUniversityData): number {
        let rate = 40; // Base rate for Dutch universities
        
        if (nlUni.guild_member) rate = 30;
        if (nlUni.university_type === 'art_design') rate = 25;
        if (nlUni.university_type === 'applied_sciences') rate = 60;
        if (nlUni.qs_ranking && nlUni.qs_ranking <= 100) rate -= 10;
        
        return Math.max(20, Math.min(70, rate));
    }

    private estimateGPAFromAcceptance(acceptanceRate: number): number {
        if (acceptanceRate <= 25) return 3.7;
        if (acceptanceRate <= 35) return 3.4;
        if (acceptanceRate <= 45) return 3.1;
        return 2.9;
    }

    private estimateMinGPA(acceptanceRate: number): number {
        if (acceptanceRate <= 25) return 3.5;
        if (acceptanceRate <= 35) return 3.2;
        if (acceptanceRate <= 45) return 2.9;
        return 2.7;
    }

    private getResearchRequirement(intensity: string): string {
        switch (intensity) {
            case 'very_high': return 'Strongly Recommended';
            case 'high': return 'Recommended';
            default: return 'Optional';
        }
    }

    private estimateScholarshipAvailability(nlUni: DutchUniversityData): number {
        let percentage = 30; // Base for Dutch universities
        
        if (nlUni.guild_member) percentage += 15;
        if (nlUni.research_intensity === 'very_high') percentage += 10;
        if (nlUni.international_students_percentage && nlUni.international_students_percentage > 40) percentage += 10;
        
        return Math.min(65, percentage);
    }

    private estimateMedianDebt(tuition: number): number {
        // Dutch students typically have lower debt due to affordable tuition
        return Math.round(tuition * 2.5 + 8000);
    }

    private estimateGraduateEarnings(nlUni: DutchUniversityData): number {
        let earnings = 45000; // Base USD for Dutch graduates
        
        if (nlUni.guild_member) earnings += 8000;
        if (nlUni.city === 'Amsterdam' || nlUni.city === 'Rotterdam') earnings += 5000;
        if (nlUni.university_type === 'technical') earnings += 6000;
        if (nlUni.notable_programs.includes('Business')) earnings += 4000;
        
        return earnings;
    }

    private determineLocationType(city: string): string {
        const majorCities = ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht'];
        const universityCities = ['Leiden', 'Delft', 'Groningen', 'Eindhoven', 'Maastricht'];
        
        if (majorCities.includes(city)) return 'Major City';
        if (universityCities.includes(city)) return 'University City';
        return 'Town';
    }

    private determineClassSize(studentSize: number): string {
        if (studentSize < 10000) return 'Small Classes';
        if (studentSize < 30000) return 'Medium Classes';
        return 'Large Classes';
    }

    private getResearchOpportunities(intensity: string): string {
        switch (intensity) {
            case 'very_high': return 'Extensive Research Opportunities';
            case 'high': return 'Strong Research Programs';
            default: return 'Research Available';
        }
    }

    clearCache(): void {
        this.cache.clear();
        this.lastFetch = 0;
    }

    getDutchStats(): {
        total_universities: number;
        research_universities: number;
        applied_sciences_universities: number;
        guild_universities: number;
        average_tuition_eu: number;
        average_tuition_non_eu: number;
        top_provinces: string[];
    } {
        return {
            total_universities: DUTCH_UNIVERSITIES.length,
            research_universities: DUTCH_UNIVERSITIES.filter(uni => uni.university_type === 'research').length,
            applied_sciences_universities: DUTCH_UNIVERSITIES.filter(uni => uni.university_type === 'applied_sciences').length,
            guild_universities: DUTCH_UNIVERSITIES.filter(uni => uni.guild_member).length,
            average_tuition_eu: DUTCH_UNIVERSITIES.reduce((sum, uni) => sum + uni.tuition_eu, 0) / DUTCH_UNIVERSITIES.length,
            average_tuition_non_eu: DUTCH_UNIVERSITIES.reduce((sum, uni) => sum + uni.tuition_non_eu, 0) / DUTCH_UNIVERSITIES.length,
            top_provinces: ['North Holland', 'South Holland', 'Utrecht', 'North Brabant', 'Gelderland']
        };
    }
}

// Export singleton instance
export const dutchUniversityManager = new DutchUniversityDataManager(); 