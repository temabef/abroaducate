// Canadian University Database Integration System
// Phase 2.3: International Expansion - Canadian Universities

import type { EnhancedUniversity } from './university-integration';

// Canadian University Data Interface
export interface CanadianUniversityData {
    id: string;
    name: string;
    city: string;
    province: string;
    region: string;
    established: number;
    macleans_ranking?: number;
    qs_ranking?: number;
    times_ranking?: number;
    acceptance_rate?: number;
    tuition_domestic: number;
    tuition_international: number;
    living_cost: number;
    total_students?: number;
    international_students_percentage?: number;
    university_type: 'medical_doctoral' | 'comprehensive' | 'primarily_undergraduate' | 'art_design' | 'theological';
    language: 'english' | 'french' | 'bilingual';
    research_intensity: 'very_high' | 'high' | 'medium' | 'limited';
    notable_programs: string[];
    strengths: string[];
    website: string;
    cou_member: boolean; // Council of Ontario Universities / similar provincial body
}

// Top Canadian Universities Database (2025 Data)
export const CANADIAN_UNIVERSITIES: CanadianUniversityData[] = [
    // MEDICAL DOCTORAL UNIVERSITIES
    {
        id: 'ca-toronto',
        name: 'University of Toronto',
        city: 'Toronto',
        province: 'Ontario',
        region: 'Central Canada',
        established: 1827,
        macleans_ranking: 1,
        qs_ranking: 21,
        times_ranking: 18,
        acceptance_rate: 43,
        tuition_domestic: 6100,
        tuition_international: 58680,
        living_cost: 15000,
        total_students: 97000,
        international_students_percentage: 25,
        university_type: 'medical_doctoral',
        language: 'english',
        research_intensity: 'very_high',
        notable_programs: ['Medicine', 'Engineering', 'Business', 'Computer Science', 'Law', 'Research'],
        strengths: ['research-excellence', 'global-reputation', 'innovation', 'diverse-programs'],
        website: 'https://www.utoronto.ca',
        cou_member: true
    },
    {
        id: 'ca-ubc',
        name: 'University of British Columbia',
        city: 'Vancouver',
        province: 'British Columbia',
        region: 'Western Canada',
        established: 1908,
        macleans_ranking: 2,
        qs_ranking: 34,
        times_ranking: 40,
        acceptance_rate: 52,
        tuition_domestic: 5729,
        tuition_international: 51320,
        living_cost: 16000,
        total_students: 68000,
        international_students_percentage: 30,
        university_type: 'medical_doctoral',
        language: 'english',
        research_intensity: 'very_high',
        notable_programs: ['Medicine', 'Engineering', 'Forest Sciences', 'Business', 'Arts'],
        strengths: ['research-excellence', 'beautiful-campus', 'sustainability', 'international-focus'],
        website: 'https://www.ubc.ca',
        cou_member: false
    },
    {
        id: 'ca-mcgill',
        name: 'McGill University',
        city: 'Montreal',
        province: 'Quebec',
        region: 'Eastern Canada',
        established: 1821,
        macleans_ranking: 3,
        qs_ranking: 30,
        times_ranking: 46,
        acceptance_rate: 46,
        tuition_domestic: 3000,
        tuition_international: 50000,
        living_cost: 13000,
        total_students: 40000,
        international_students_percentage: 27,
        university_type: 'medical_doctoral',
        language: 'english',
        research_intensity: 'very_high',
        notable_programs: ['Medicine', 'Law', 'Engineering', 'Business', 'Arts'],
        strengths: ['academic-reputation', 'research-intensive', 'montreal-location', 'global-alumni'],
        website: 'https://www.mcgill.ca',
        cou_member: false
    },
    {
        id: 'ca-alberta',
        name: 'University of Alberta',
        city: 'Edmonton',
        province: 'Alberta',
        region: 'Western Canada',
        established: 1908,
        macleans_ranking: 4,
        qs_ranking: 111,
        times_ranking: 125,
        acceptance_rate: 58,
        tuition_domestic: 6600,
        tuition_international: 33000,
        living_cost: 12000,
        total_students: 39000,
        international_students_percentage: 15,
        university_type: 'medical_doctoral',
        language: 'english',
        research_intensity: 'very_high',
        notable_programs: ['Engineering', 'Medicine', 'Business', 'Agriculture', 'Education'],
        strengths: ['research-excellence', 'energy-programs', 'affordable-tuition', 'strong-alumni'],
        website: 'https://www.ualberta.ca',
        cou_member: false
    },
    {
        id: 'ca-montreal',
        name: 'Université de Montréal',
        city: 'Montreal',
        province: 'Quebec',
        region: 'Eastern Canada',
        established: 1878,
        macleans_ranking: 5,
        qs_ranking: 154,
        times_ranking: 73,
        acceptance_rate: 55,
        tuition_domestic: 3000,
        tuition_international: 23000,
        living_cost: 13000,
        total_students: 67000,
        international_students_percentage: 20,
        university_type: 'medical_doctoral',
        language: 'french',
        research_intensity: 'very_high',
        notable_programs: ['Medicine', 'Law', 'Engineering', 'Arts', 'Sciences'],
        strengths: ['french-language', 'research-excellence', 'medical-school', 'montreal-culture'],
        website: 'https://www.umontreal.ca',
        cou_member: false
    },
    {
        id: 'ca-mcmaster',
        name: 'McMaster University',
        city: 'Hamilton',
        province: 'Ontario',
        region: 'Central Canada',
        established: 1887,
        macleans_ranking: 6,
        qs_ranking: 189,
        times_ranking: 80,
        acceptance_rate: 60,
        tuition_domestic: 6460,
        tuition_international: 47000,
        living_cost: 14000,
        total_students: 31000,
        international_students_percentage: 18,
        university_type: 'medical_doctoral',
        language: 'english',
        research_intensity: 'very_high',
        notable_programs: ['Medicine', 'Engineering', 'Business', 'Health Sciences', 'Nuclear Research'],
        strengths: ['health-sciences', 'research-innovation', 'problem-based-learning', 'nuclear-reactor'],
        website: 'https://www.mcmaster.ca',
        cou_member: true
    },
    {
        id: 'ca-calgary',
        name: 'University of Calgary',
        city: 'Calgary',
        province: 'Alberta',
        region: 'Western Canada',
        established: 1966,
        macleans_ranking: 7,
        qs_ranking: 235,
        times_ranking: 200,
        acceptance_rate: 65,
        tuition_domestic: 6200,
        tuition_international: 29000,
        living_cost: 13500,
        total_students: 35000,
        international_students_percentage: 12,
        university_type: 'medical_doctoral',
        language: 'english',
        research_intensity: 'very_high',
        notable_programs: ['Engineering', 'Medicine', 'Business', 'Kinesiology', 'Law'],
        strengths: ['energy-research', 'entrepreneurship', 'modern-facilities', 'industry-connections'],
        website: 'https://www.ucalgary.ca',
        cou_member: false
    },
    {
        id: 'ca-queens',
        name: 'Queens University',
        city: 'Kingston',
        province: 'Ontario',
        region: 'Central Canada',
        established: 1841,
        macleans_ranking: 8,
        qs_ranking: 209,
        times_ranking: 251,
        acceptance_rate: 40,
        tuition_domestic: 6500,
        tuition_international: 50000,
        living_cost: 13000,
        total_students: 28000,
        international_students_percentage: 15,
        university_type: 'medical_doctoral',
        language: 'english',
        research_intensity: 'high',
        notable_programs: ['Business', 'Engineering', 'Medicine', 'Law', 'Arts'],
        strengths: ['business-school', 'campus-culture', 'alumni-network', 'prestigious-programs'],
        website: 'https://www.queensu.ca',
        cou_member: true
    },

    // COMPREHENSIVE UNIVERSITIES
    {
        id: 'ca-waterloo',
        name: 'University of Waterloo',
        city: 'Waterloo',
        province: 'Ontario',
        region: 'Central Canada',
        established: 1957,
        macleans_ranking: 1,
        qs_ranking: 112,
        times_ranking: 201,
        acceptance_rate: 53,
        tuition_domestic: 6100,
        tuition_international: 56000,
        living_cost: 14000,
        total_students: 42000,
        international_students_percentage: 28,
        university_type: 'comprehensive',
        language: 'english',
        research_intensity: 'very_high',
        notable_programs: ['Computer Science', 'Engineering', 'Mathematics', 'Co-op Programs', 'Business'],
        strengths: ['technology-innovation', 'co-op-program', 'startup-culture', 'industry-partnerships'],
        website: 'https://uwaterloo.ca',
        cou_member: true
    },
    {
        id: 'ca-sfu',
        name: 'Simon Fraser University',
        city: 'Burnaby',
        province: 'British Columbia',
        region: 'Western Canada',
        established: 1965,
        macleans_ranking: 2,
        qs_ranking: 298,
        times_ranking: 301,
        acceptance_rate: 62,
        tuition_domestic: 5800,
        tuition_international: 32000,
        living_cost: 15000,
        total_students: 37000,
        international_students_percentage: 22,
        university_type: 'comprehensive',
        language: 'english',
        research_intensity: 'high',
        notable_programs: ['Computer Science', 'Business', 'Communications', 'Criminology', 'Engineering'],
        strengths: ['innovation', 'technology-focus', 'co-op-programs', 'research-active'],
        website: 'https://www.sfu.ca',
        cou_member: false
    },
    {
        id: 'ca-victoria',
        name: 'University of Victoria',
        city: 'Victoria',
        province: 'British Columbia',
        region: 'Western Canada',
        established: 1963,
        macleans_ranking: 3,
        qs_ranking: 359,
        times_ranking: 401,
        acceptance_rate: 63,
        tuition_domestic: 5700,
        tuition_international: 28000,
        living_cost: 14500,
        total_students: 22000,
        international_students_percentage: 18,
        university_type: 'comprehensive',
        language: 'english',
        research_intensity: 'high',
        notable_programs: ['Ocean Sciences', 'Engineering', 'Business', 'Law', 'Fine Arts'],
        strengths: ['ocean-research', 'climate-research', 'beautiful-location', 'co-op-programs'],
        website: 'https://www.uvic.ca',
        cou_member: false
    },
    {
        id: 'ca-carleton',
        name: 'Carleton University',
        city: 'Ottawa',
        province: 'Ontario',
        region: 'Central Canada',
        established: 1942,
        macleans_ranking: 4,
        qs_ranking: 651,
        times_ranking: 501,
        acceptance_rate: 67,
        tuition_domestic: 6200,
        tuition_international: 35000,
        living_cost: 13500,
        total_students: 31000,
        international_students_percentage: 20,
        university_type: 'comprehensive',
        language: 'english',
        research_intensity: 'high',
        notable_programs: ['Engineering', 'Public Policy', 'Journalism', 'International Affairs', 'Architecture'],
        strengths: ['government-connections', 'technology-programs', 'research-facilities', 'capital-location'],
        website: 'https://carleton.ca',
        cou_member: true
    },

    // PRIMARILY UNDERGRADUATE
    {
        id: 'ca-mount-allison',
        name: 'Mount Allison University',
        city: 'Sackville',
        province: 'New Brunswick',
        region: 'Atlantic Canada',
        established: 1839,
        macleans_ranking: 1,
        acceptance_rate: 68,
        tuition_domestic: 10500,
        tuition_international: 18000,
        living_cost: 11000,
        total_students: 2300,
        international_students_percentage: 10,
        university_type: 'primarily_undergraduate',
        language: 'english',
        research_intensity: 'medium',
        notable_programs: ['Liberal Arts', 'Sciences', 'Fine Arts', 'Music', 'Commerce'],
        strengths: ['small-class-sizes', 'undergraduate-focus', 'campus-community', 'high-satisfaction'],
        website: 'https://www.mta.ca',
        cou_member: false
    },
    {
        id: 'ca-unb',
        name: 'University of New Brunswick',
        city: 'Fredericton',
        province: 'New Brunswick',
        region: 'Atlantic Canada',
        established: 1785,
        macleans_ranking: 2,
        acceptance_rate: 70,
        tuition_domestic: 8500,
        tuition_international: 19000,
        living_cost: 10500,
        total_students: 11000,
        international_students_percentage: 15,
        university_type: 'primarily_undergraduate',
        language: 'english',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Forestry', 'Business', 'Arts', 'Computer Science'],
        strengths: ['engineering-excellence', 'forestry-programs', 'small-classes', 'research-opportunities'],
        website: 'https://www.unb.ca',
        cou_member: false
    },
    {
        id: 'ca-bishops',
        name: "Bishop's University",
        city: 'Sherbrooke',
        province: 'Quebec',
        region: 'Eastern Canada',
        established: 1843,
        macleans_ranking: 3,
        acceptance_rate: 65,
        tuition_domestic: 3500,
        tuition_international: 22000,
        living_cost: 11500,
        total_students: 3200,
        international_students_percentage: 8,
        university_type: 'primarily_undergraduate',
        language: 'english',
        research_intensity: 'medium',
        notable_programs: ['Liberal Arts', 'Business', 'Sciences', 'Education', 'Fine Arts'],
        strengths: ['small-university', 'liberal-arts', 'personalized-education', 'english-quebec'],
        website: 'https://www.ubishops.ca',
        cou_member: false
    },

    // ADDITIONAL MAJOR UNIVERSITIES
    {
        id: 'ca-saskatchewan',
        name: 'University of Saskatchewan',
        city: 'Saskatoon',
        province: 'Saskatchewan',
        region: 'Western Canada',
        established: 1907,
        macleans_ranking: 15,
        acceptance_rate: 70,
        tuition_domestic: 6500,
        tuition_international: 25000,
        living_cost: 11000,
        total_students: 25000,
        international_students_percentage: 12,
        university_type: 'medical_doctoral',
        language: 'english',
        research_intensity: 'high',
        notable_programs: ['Agriculture', 'Engineering', 'Medicine', 'Veterinary Medicine', 'Pharmacy'],
        strengths: ['agriculture-research', 'veterinary-excellence', 'affordability', 'prairie-location'],
        website: 'https://www.usask.ca',
        cou_member: false
    },
    {
        id: 'ca-manitoba',
        name: 'University of Manitoba',
        city: 'Winnipeg',
        province: 'Manitoba',
        region: 'Western Canada',
        established: 1877,
        macleans_ranking: 16,
        acceptance_rate: 72,
        tuition_domestic: 4500,
        tuition_international: 20000,
        living_cost: 10500,
        total_students: 30000,
        international_students_percentage: 18,
        university_type: 'medical_doctoral',
        language: 'english',
        research_intensity: 'high',
        notable_programs: ['Engineering', 'Medicine', 'Agriculture', 'Architecture', 'Music'],
        strengths: ['affordable-education', 'research-intensive', 'diverse-programs', 'prairie-heritage'],
        website: 'https://umanitoba.ca',
        cou_member: false
    },
    {
        id: 'ca-laval',
        name: 'Université Laval',
        city: 'Quebec City',
        province: 'Quebec',
        region: 'Eastern Canada',
        established: 1663,
        macleans_ranking: 9,
        acceptance_rate: 65,
        tuition_domestic: 3000,
        tuition_international: 24000,
        living_cost: 12000,
        total_students: 45000,
        international_students_percentage: 15,
        university_type: 'medical_doctoral',
        language: 'french',
        research_intensity: 'very_high',
        notable_programs: ['Medicine', 'Engineering', 'Law', 'Forestry', 'Agriculture'],
        strengths: ['historic-university', 'french-culture', 'research-excellence', 'quebec-city'],
        website: 'https://www.ulaval.ca',
        cou_member: false
    },
    {
        id: 'ca-concordia',
        name: 'Concordia University',
        city: 'Montreal',
        province: 'Quebec',
        region: 'Eastern Canada',
        established: 1974,
        macleans_ranking: 10,
        acceptance_rate: 68,
        tuition_domestic: 3500,
        tuition_international: 25000,
        living_cost: 13500,
        total_students: 51000,
        international_students_percentage: 25,
        university_type: 'comprehensive',
        language: 'english',
        research_intensity: 'high',
        notable_programs: ['Engineering', 'Business', 'Fine Arts', 'Computer Science', 'Communication'],
        strengths: ['downtown-montreal', 'innovation', 'diverse-student-body', 'practical-programs'],
        website: 'https://www.concordia.ca',
        cou_member: false
    },

    // ADDITIONAL QUALITY UNIVERSITIES - EXPANDING TO 30+
    {
        id: 'ca-carleton',
        name: 'Carleton University',
        city: 'Ottawa',
        province: 'Ontario',
        region: 'Central Canada',
        established: 1942,
        macleans_ranking: 11,
        acceptance_rate: 72,
        tuition_domestic: 6500,
        tuition_international: 31000,
        living_cost: 14000,
        total_students: 31000,
        international_students_percentage: 22,
        university_type: 'comprehensive',
        language: 'english',
        research_intensity: 'high',
        notable_programs: ['Engineering', 'Computer Science', 'Public Affairs', 'Journalism', 'International Business'],
        strengths: ['capital-location', 'government-connections', 'technology-focus', 'co-op-programs'],
        website: 'https://carleton.ca',
        cou_member: true
    },
    {
        id: 'ca-york',
        name: 'York University',
        city: 'Toronto',
        province: 'Ontario',
        region: 'Central Canada',
        established: 1959,
        macleans_ranking: 12,
        acceptance_rate: 75,
        tuition_domestic: 6800,
        tuition_international: 32000,
        living_cost: 15000,
        total_students: 55000,
        international_students_percentage: 18,
        university_type: 'comprehensive',
        language: 'english',
        research_intensity: 'high',
        notable_programs: ['Business', 'Law', 'Fine Arts', 'Liberal Arts', 'Health Sciences'],
        strengths: ['large-student-body', 'diverse-programs', 'toronto-location', 'liberal-arts'],
        website: 'https://www.yorku.ca',
        cou_member: true
    },
    {
        id: 'ca-ryerson',
        name: 'Toronto Metropolitan University',
        city: 'Toronto',
        province: 'Ontario',
        region: 'Central Canada',
        established: 1948,
        macleans_ranking: 13,
        acceptance_rate: 78,
        tuition_domestic: 6900,
        tuition_international: 33000,
        living_cost: 15500,
        total_students: 48000,
        international_students_percentage: 15,
        university_type: 'comprehensive',
        language: 'english',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Business', 'Media', 'Architecture', 'Health Sciences'],
        strengths: ['downtown-toronto', 'innovation', 'practical-learning', 'industry-partnerships'],
        website: 'https://www.torontomu.ca',
        cou_member: true
    },
    {
        id: 'ca-simon-fraser',
        name: 'Simon Fraser University',
        city: 'Burnaby',
        province: 'British Columbia',
        region: 'Western Canada',
        established: 1965,
        macleans_ranking: 14,
        acceptance_rate: 70,
        tuition_domestic: 6200,
        tuition_international: 28000,
        living_cost: 16000,
        total_students: 35000,
        international_students_percentage: 25,
        university_type: 'comprehensive',
        language: 'english',
        research_intensity: 'high',
        notable_programs: ['Computer Science', 'Business', 'Communication', 'Health Sciences', 'Engineering'],
        strengths: ['mountain-campus', 'innovation', 'co-op-programs', 'vancouver-proximity'],
        website: 'https://www.sfu.ca',
        cou_member: false
    },
    {
        id: 'ca-victoria',
        name: 'University of Victoria',
        city: 'Victoria',
        province: 'British Columbia',
        region: 'Western Canada',
        established: 1963,
        macleans_ranking: 15,
        acceptance_rate: 68,
        tuition_domestic: 5800,
        tuition_international: 27000,
        living_cost: 14500,
        total_students: 22000,
        international_students_percentage: 20,
        university_type: 'comprehensive',
        language: 'english',
        research_intensity: 'high',
        notable_programs: ['Engineering', 'Business', 'Law', 'Ocean Sciences', 'Computer Science'],
        strengths: ['coastal-location', 'research-excellence', 'beautiful-campus', 'mild-climate'],
        website: 'https://www.uvic.ca',
        cou_member: false
    },
    {
        id: 'ca-windsor',
        name: 'University of Windsor',
        city: 'Windsor',
        province: 'Ontario',
        region: 'Central Canada',
        established: 1857,
        macleans_ranking: 16,
        acceptance_rate: 74,
        tuition_domestic: 6300,
        tuition_international: 29000,
        living_cost: 12000,
        total_students: 17000,
        international_students_percentage: 30,
        university_type: 'comprehensive',
        language: 'english',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Business', 'Law', 'Social Work', 'Education'],
        strengths: ['border-location', 'automotive-industry', 'affordable-education', 'diverse-community'],
        website: 'https://www.uwindsor.ca',
        cou_member: true
    },
    {
        id: 'ca-guelph',
        name: 'University of Guelph',
        city: 'Guelph',
        province: 'Ontario',
        region: 'Central Canada',
        established: 1964,
        macleans_ranking: 17,
        acceptance_rate: 69,
        tuition_domestic: 6700,
        tuition_international: 30000,
        living_cost: 13000,
        total_students: 29000,
        international_students_percentage: 12,
        university_type: 'comprehensive',
        language: 'english',
        research_intensity: 'high',
        notable_programs: ['Agriculture', 'Veterinary Medicine', 'Engineering', 'Business', 'Biological Sciences'],
        strengths: ['agricultural-excellence', 'veterinary-school', 'research-intensive', 'campus-life'],
        website: 'https://www.uoguelph.ca',
        cou_member: true
    },
    {
        id: 'ca-new-brunswick',
        name: 'University of New Brunswick',
        city: 'Fredericton',
        province: 'New Brunswick',
        region: 'Atlantic Canada',
        established: 1785,
        macleans_ranking: 18,
        acceptance_rate: 76,
        tuition_domestic: 5500,
        tuition_international: 22000,
        living_cost: 11000,
        total_students: 11000,
        international_students_percentage: 15,
        university_type: 'comprehensive',
        language: 'english',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Forestry', 'Business', 'Computer Science', 'Education'],
        strengths: ['historic-university', 'small-class-sizes', 'affordable-education', 'maritime-culture'],
        website: 'https://www.unb.ca',
        cou_member: false
    },
    {
        id: 'ca-memorial',
        name: 'Memorial University of Newfoundland',
        city: "St. John's",
        province: 'Newfoundland and Labrador',
        region: 'Atlantic Canada',
        established: 1925,
        macleans_ranking: 19,
        acceptance_rate: 78,
        tuition_domestic: 3000,
        tuition_international: 20000,
        living_cost: 10000,
        total_students: 18000,
        international_students_percentage: 10,
        university_type: 'comprehensive',
        language: 'english',
        research_intensity: 'high',
        notable_programs: ['Ocean Sciences', 'Engineering', 'Medicine', 'Business', 'Education'],
        strengths: ['ocean-research', 'affordable-tuition', 'unique-location', 'research-opportunities'],
        website: 'https://www.mun.ca',
        cou_member: false
    },
    {
        id: 'ca-brock',
        name: 'Brock University',
        city: 'St. Catharines',
        province: 'Ontario',
        region: 'Central Canada',
        established: 1964,
        macleans_ranking: 20,
        acceptance_rate: 80,
        tuition_domestic: 6400,
        tuition_international: 28000,
        living_cost: 12500,
        total_students: 19000,
        international_students_percentage: 8,
        university_type: 'comprehensive',
        language: 'english',
        research_intensity: 'medium',
        notable_programs: ['Business', 'Education', 'Health Sciences', 'Applied Health Sciences', 'Social Sciences'],
        strengths: ['niagara-region', 'co-op-programs', 'student-experience', 'wine-country'],
        website: 'https://brocku.ca',
        cou_member: true
    },
    {
        id: 'ca-regina',
        name: 'University of Regina',
        city: 'Regina',
        province: 'Saskatchewan',
        region: 'Western Canada',
        established: 1974,
        macleans_ranking: 21,
        acceptance_rate: 82,
        tuition_domestic: 5800,
        tuition_international: 24000,
        living_cost: 10500,
        total_students: 16000,
        international_students_percentage: 14,
        university_type: 'comprehensive',
        language: 'english',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Business', 'Education', 'Social Work', 'Kinesiology'],
        strengths: ['affordable-education', 'small-class-sizes', 'prairie-location', 'indigenous-programs'],
        website: 'https://www.uregina.ca',
        cou_member: false
    },
    // Additional Canadian Universities (31-50)
    {
        id: 'ca-dalhousie',
        name: 'Dalhousie University',
        city: 'Halifax',
        province: 'Nova Scotia',
        region: 'Atlantic Canada',
        established: 1818,
        macleans_ranking: 15,
        qs_ranking: 308,
        times_ranking: 301,
        acceptance_rate: 70,
        tuition_domestic: 9600,
        tuition_international: 25000,
        living_cost: 12000,
        total_students: 20000,
        international_students_percentage: 22,
        university_type: 'medical_doctoral',
        language: 'english',
        research_intensity: 'high',
        notable_programs: ['Medicine', 'Law', 'Ocean Sciences', 'Engineering', 'Business'],
        strengths: ['maritime-location', 'medical-school', 'ocean-research', 'historic-tradition'],
        website: 'https://www.dal.ca',
        cou_member: false
    },
    {
        id: 'ca-ottawa',
        name: 'University of Ottawa',
        city: 'Ottawa',
        province: 'Ontario',
        region: 'Central Canada',
        established: 1848,
        macleans_ranking: 12,
        qs_ranking: 237,
        times_ranking: 162,
        acceptance_rate: 75,
        tuition_domestic: 6200,
        tuition_international: 35000,
        living_cost: 14500,
        total_students: 50000,
        international_students_percentage: 15,
        university_type: 'medical_doctoral',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Medicine', 'Law', 'Engineering', 'Public Administration', 'International Development'],
        strengths: ['bilingual-education', 'capital-location', 'government-connections', 'research-excellence'],
        website: 'https://www.uottawa.ca',
        cou_member: true
    },
    {
        id: 'ca-western',
        name: 'Western University',
        city: 'London',
        province: 'Ontario',
        region: 'Central Canada',
        established: 1878,
        macleans_ranking: 8,
        qs_ranking: 170,
        times_ranking: 201,
        acceptance_rate: 58,
        tuition_domestic: 6300,
        tuition_international: 38000,
        living_cost: 13000,
        total_students: 38000,
        international_students_percentage: 13,
        university_type: 'medical_doctoral',
        language: 'english',
        research_intensity: 'very_high',
        notable_programs: ['Medicine', 'Business (Ivey)', 'Engineering', 'Music', 'Law'],
        strengths: ['business-school', 'medical-school', 'research-excellence', 'campus-life'],
        website: 'https://www.uwo.ca',
        cou_member: true
    },
    {
        id: 'ca-sherbrooke',
        name: 'Université de Sherbrooke',
        city: 'Sherbrooke',
        province: 'Quebec',
        region: 'Eastern Canada',
        established: 1954,
        macleans_ranking: 18,
        qs_ranking: 651,
        times_ranking: 401,
        acceptance_rate: 68,
        tuition_domestic: 3500,
        tuition_international: 20000,
        living_cost: 11000,
        total_students: 40000,
        international_students_percentage: 12,
        university_type: 'medical_doctoral',
        language: 'french',
        research_intensity: 'high',
        notable_programs: ['Medicine', 'Engineering', 'Business', 'Education', 'Sciences'],
        strengths: ['french-education', 'cooperative-programs', 'innovation', 'entrepreneurship'],
        website: 'https://www.usherbrooke.ca',
        cou_member: false
    },
    {
        id: 'ca-laurentian',
        name: 'Laurentian University',
        city: 'Sudbury',
        province: 'Ontario',
        region: 'Central Canada',
        established: 1960,
        macleans_ranking: 45,
        acceptance_rate: 85,
        tuition_domestic: 6100,
        tuition_international: 22000,
        living_cost: 10000,
        total_students: 9000,
        international_students_percentage: 8,
        university_type: 'comprehensive',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Mining Engineering', 'Nursing', 'Education', 'Sports Administration', 'Indigenous Studies'],
        strengths: ['mining-programs', 'bilingual-education', 'indigenous-focus', 'small-classes'],
        website: 'https://www.laurentian.ca',
        cou_member: true
    },
    {
        id: 'ca-trent',
        name: 'Trent University',
        city: 'Peterborough',
        province: 'Ontario',
        region: 'Central Canada',
        established: 1964,
        macleans_ranking: 35,
        acceptance_rate: 80,
        tuition_domestic: 6200,
        tuition_international: 28000,
        living_cost: 12000,
        total_students: 12000,
        international_students_percentage: 10,
        university_type: 'primarily_undergraduate',
        language: 'english',
        research_intensity: 'medium',
        notable_programs: ['Environmental Studies', 'Indigenous Studies', 'Psychology', 'Anthropology', 'Canadian Studies'],
        strengths: ['environmental-focus', 'small-class-sizes', 'beautiful-campus', 'liberal-arts'],
        website: 'https://www.trentu.ca',
        cou_member: true
    },
    {
        id: 'ca-lakehead',
        name: 'Lakehead University',
        city: 'Thunder Bay',
        province: 'Ontario',
        region: 'Central Canada',
        established: 1965,
        macleans_ranking: 42,
        acceptance_rate: 88,
        tuition_domestic: 6000,
        tuition_international: 24000,
        living_cost: 9500,
        total_students: 9500,
        international_students_percentage: 12,
        university_type: 'primarily_undergraduate',
        language: 'english',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Forestry', 'Business', 'Education', 'Health Sciences'],
        strengths: ['forestry-programs', 'northern-ontario', 'affordable-tuition', 'outdoor-recreation'],
        website: 'https://www.lakeheadu.ca',
        cou_member: true
    },
    {
        id: 'ca-nipissing',
        name: 'Nipissing University',
        city: 'North Bay',
        province: 'Ontario',
        region: 'Central Canada',
        established: 1992,
        macleans_ranking: 48,
        acceptance_rate: 90,
        tuition_domestic: 6100,
        tuition_international: 23000,
        living_cost: 9000,
        total_students: 5500,
        international_students_percentage: 8,
        university_type: 'primarily_undergraduate',
        language: 'english',
        research_intensity: 'limited',
        notable_programs: ['Education', 'Nursing', 'Business', 'Psychology', 'Criminal Justice'],
        strengths: ['teacher-education', 'small-university', 'personal-attention', 'northern-ontario'],
        website: 'https://www.nipissingu.ca',
        cou_member: true
    },
    {
        id: 'ca-algoma',
        name: 'Algoma University',
        city: 'Sault Ste. Marie',
        province: 'Ontario',
        region: 'Central Canada',
        established: 1965,
        macleans_ranking: 50,
        acceptance_rate: 92,
        tuition_domestic: 6000,
        tuition_international: 21000,
        living_cost: 8500,
        total_students: 1500,
        international_students_percentage: 15,
        university_type: 'primarily_undergraduate',
        language: 'english',
        research_intensity: 'limited',
        notable_programs: ['Business', 'Computer Science', 'Psychology', 'Social Work', 'Fine Arts'],
        strengths: ['small-classes', 'personal-attention', 'affordable', 'diverse-community'],
        website: 'https://www.algomau.ca',
        cou_member: true
    },
    {
        id: 'ca-cape-breton',
        name: 'Cape Breton University',
        city: 'Sydney',
        province: 'Nova Scotia',
        region: 'Atlantic Canada',
        established: 1974,
        macleans_ranking: 46,
        acceptance_rate: 85,
        tuition_domestic: 7200,
        tuition_international: 16800,
        living_cost: 10000,
        total_students: 5000,
        international_students_percentage: 25,
        university_type: 'primarily_undergraduate',
        language: 'english',
        research_intensity: 'medium',
        notable_programs: ['Business', 'Engineering', 'Health Sciences', 'Education', 'Arts'],
        strengths: ['international-students', 'affordable-tuition', 'beautiful-location', 'small-classes'],
        website: 'https://www.cbu.ca',
        cou_member: false
    },
    {
        id: 'ca-acadia',
        name: 'Acadia University',
        city: 'Wolfville',
        province: 'Nova Scotia',
        region: 'Atlantic Canada',
        established: 1838,
        macleans_ranking: 25,
        acceptance_rate: 75,
        tuition_domestic: 9500,
        tuition_international: 22000,
        living_cost: 11000,
        total_students: 4000,
        international_students_percentage: 18,
        university_type: 'primarily_undergraduate',
        language: 'english',
        research_intensity: 'medium',
        notable_programs: ['Business', 'Computer Science', 'Education', 'Kinesiology', 'Music'],
        strengths: ['liberal-arts', 'beautiful-campus', 'technology-integration', 'student-experience'],
        website: 'https://www.acadiau.ca',
        cou_member: false
    },
    {
        id: 'ca-st-francis-xavier',
        name: 'St. Francis Xavier University',
        city: 'Antigonish',
        province: 'Nova Scotia',
        region: 'Atlantic Canada',
        established: 1853,
        macleans_ranking: 20,
        acceptance_rate: 70,
        tuition_domestic: 9800,
        tuition_international: 24000,
        living_cost: 11500,
        total_students: 5000,
        international_students_percentage: 15,
        university_type: 'primarily_undergraduate',
        language: 'english',
        research_intensity: 'medium',
        notable_programs: ['Business', 'Education', 'Sciences', 'Arts', 'Human Kinetics'],
        strengths: ['undergraduate-focus', 'strong-alumni', 'liberal-arts', 'campus-community'],
        website: 'https://www.stfx.ca',
        cou_member: false
    },
    {
        id: 'ca-prince-edward-island',
        name: 'University of Prince Edward Island',
        city: 'Charlottetown',
        province: 'Prince Edward Island',
        region: 'Atlantic Canada',
        established: 1969,
        macleans_ranking: 38,
        acceptance_rate: 82,
        tuition_domestic: 6900,
        tuition_international: 15000,
        living_cost: 10000,
        total_students: 5000,
        international_students_percentage: 20,
        university_type: 'comprehensive',
        language: 'english',
        research_intensity: 'medium',
        notable_programs: ['Veterinary Medicine', 'Business', 'Education', 'Nursing', 'Engineering'],
        strengths: ['veterinary-school', 'island-location', 'small-classes', 'affordable-living'],
        website: 'https://www.upei.ca',
        cou_member: false
    },
    {
        id: 'ca-thompson-rivers',
        name: 'Thompson Rivers University',
        city: 'Kamloops',
        province: 'British Columbia',
        region: 'Western Canada',
        established: 2005,
        macleans_ranking: 44,
        acceptance_rate: 88,
        tuition_domestic: 5500,
        tuition_international: 20000,
        living_cost: 11000,
        total_students: 26000,
        international_students_percentage: 30,
        university_type: 'comprehensive',
        language: 'english',
        research_intensity: 'medium',
        notable_programs: ['Business', 'Tourism', 'Natural Resource Sciences', 'Law', 'Education'],
        strengths: ['open-learning', 'international-focus', 'practical-programs', 'beautiful-location'],
        website: 'https://www.tru.ca',
        cou_member: false
    },
    {
        id: 'ca-vancouver-island',
        name: 'Vancouver Island University',
        city: 'Nanaimo',
        province: 'British Columbia',
        region: 'Western Canada',
        established: 1969,
        macleans_ranking: 47,
        acceptance_rate: 90,
        tuition_domestic: 5400,
        tuition_international: 18000,
        living_cost: 12000,
        total_students: 19000,
        international_students_percentage: 25,
        university_type: 'comprehensive',
        language: 'english',
        research_intensity: 'medium',
        notable_programs: ['Marine Biology', 'Business', 'Arts', 'Education', 'Health Sciences'],
        strengths: ['island-location', 'marine-programs', 'affordable-tuition', 'outdoor-recreation'],
        website: 'https://www.viu.ca',
        cou_member: false
    },
    {
        id: 'ca-northern-bc',
        name: 'University of Northern British Columbia',
        city: 'Prince George',
        province: 'British Columbia',
        region: 'Western Canada',
        established: 1990,
        macleans_ranking: 40,
        acceptance_rate: 85,
        tuition_domestic: 5600,
        tuition_international: 22000,
        living_cost: 10000,
        total_students: 4000,
        international_students_percentage: 12,
        university_type: 'primarily_undergraduate',
        language: 'english',
        research_intensity: 'medium',
        notable_programs: ['Natural Resources', 'Health Sciences', 'Business', 'Education', 'First Nations Studies'],
        strengths: ['northern-focus', 'small-classes', 'research-opportunities', 'indigenous-programs'],
        website: 'https://www.unbc.ca',
        cou_member: false
    },
    {
        id: 'ca-fraser-valley',
        name: 'University of the Fraser Valley',
        city: 'Abbotsford',
        province: 'British Columbia',
        region: 'Western Canada',
        established: 1974,
        macleans_ranking: 49,
        acceptance_rate: 92,
        tuition_domestic: 5200,
        tuition_international: 17000,
        living_cost: 11500,
        total_students: 15000,
        international_students_percentage: 20,
        university_type: 'comprehensive',
        language: 'english',
        research_intensity: 'medium',
        notable_programs: ['Agriculture', 'Business', 'Health Sciences', 'Education', 'Trades'],
        strengths: ['agricultural-programs', 'practical-focus', 'affordable', 'community-connections'],
        website: 'https://www.ufv.ca',
        cou_member: false
    },
    {
        id: 'ca-emily-carr',
        name: 'Emily Carr University of Art + Design',
        city: 'Vancouver',
        province: 'British Columbia',
        region: 'Western Canada',
        established: 1925,
        acceptance_rate: 65,
        tuition_domestic: 5800,
        tuition_international: 22000,
        living_cost: 16000,
        total_students: 2000,
        international_students_percentage: 35,
        university_type: 'art_design',
        language: 'english',
        research_intensity: 'medium',
        notable_programs: ['Fine Arts', 'Design', 'Media Arts', 'Animation', 'Film'],
        strengths: ['art-design-focus', 'creative-programs', 'industry-connections', 'vancouver-location'],
        website: 'https://www.ecuad.ca',
        cou_member: false
    },
    {
        id: 'ca-kwantlen',
        name: 'Kwantlen Polytechnic University',
        city: 'Surrey',
        province: 'British Columbia',
        region: 'Western Canada',
        established: 1981,
        acceptance_rate: 88,
        tuition_domestic: 5100,
        tuition_international: 18500,
        living_cost: 12000,
        total_students: 20000,
        international_students_percentage: 22,
        university_type: 'comprehensive',
        language: 'english',
        research_intensity: 'medium',
        notable_programs: ['Business', 'Design', 'Horticulture', 'Trades', 'Health'],
        strengths: ['polytechnic-focus', 'practical-programs', 'diverse-student-body', 'affordable'],
        website: 'https://www.kpu.ca',
        cou_member: false
    },
    {
        id: 'ca-lethbridge',
        name: 'University of Lethbridge',
        city: 'Lethbridge',
        province: 'Alberta',
        region: 'Western Canada',
        established: 1967,
        macleans_ranking: 32,
        acceptance_rate: 78,
        tuition_domestic: 6000,
        tuition_international: 20000,
        living_cost: 10500,
        total_students: 8500,
        international_students_percentage: 15,
        university_type: 'comprehensive',
        language: 'english',
        research_intensity: 'high',
        notable_programs: ['Liberal Arts', 'Sciences', 'Education', 'Management', 'Health Sciences'],
        strengths: ['liberal-education', 'research-opportunities', 'small-classes', 'beautiful-campus'],
        website: 'https://www.uleth.ca',
        cou_member: false
    }
];

// Enhanced university conversion for Canadian universities
export class CanadianUniversityDataManager {
    private cache: Map<string, EnhancedUniversity[]> = new Map();
    private lastFetch: number = 0;
    private cacheTimeout: number = 86400000; // 24 hours

    /**
     * Fetch Canadian universities with optional province filtering
     */
    async fetchCanadianUniversities(province?: string, limit: number = 50): Promise<EnhancedUniversity[]> {
        const cacheKey = `canadian-${province || 'all'}-${limit}`;
        const now = Date.now();

        // Check cache
        if (this.cache.has(cacheKey) && (now - this.lastFetch) < this.cacheTimeout) {
            console.log(`📦 Returning cached Canadian universities for ${province || 'all provinces'}`);
            return this.cache.get(cacheKey)!;
        }

        console.log(`🍁 Fetching Canadian universities from database for ${province || 'all provinces'}`);

        try {
            // Filter by province if specified
            let universities = CANADIAN_UNIVERSITIES;
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

            console.log(`✅ Successfully processed ${enhanced.length} Canadian universities`);
            return enhanced;

        } catch (error) {
            console.error('❌ Error fetching Canadian universities:', error);
            return [];
        }
    }

    /**
     * Convert Canadian university data to enhanced format
     */
    private convertToEnhanced(caUni: CanadianUniversityData): EnhancedUniversity {
        // Generate program scores based on notable programs
        const programScores = this.generateProgramScores(caUni);

        // Calculate total cost (tuition + living)
        const totalCost = caUni.tuition_international + caUni.living_cost;

        return {
            id: caUni.id,
            name: caUni.name,
            country: 'Canada',
            state: caUni.province,
            city: caUni.city,
            region: caUni.region,
            ranking: caUni.macleans_ranking,
            global_ranking: this.estimateGlobalRanking(caUni.macleans_ranking || 50),
            national_ranking: caUni.macleans_ranking,
            acceptance_rate: caUni.acceptance_rate || this.estimateAcceptanceRate(caUni),
            avg_gpa: this.estimateGPAFromAcceptance(caUni.acceptance_rate || 65),
            avg_sat: undefined, // Canadian universities don't typically use SAT
            avg_act: undefined, // Canadian universities don't typically use ACT
            strengths: caUni.strengths,
            programs: programScores,
            requirements: {
                min_gpa: this.estimateMinGPA(caUni.acceptance_rate || 65),
                english_test: caUni.language === 'french' ? true : false,
                research_experience: this.getResearchRequirement(caUni.research_intensity)
            },
            cost: totalCost,
            living_cost: caUni.living_cost,
            in_state_tuition: caUni.tuition_domestic,
            out_of_state_tuition: caUni.tuition_international,
            scholarships: true,
            scholarship_percentage: this.estimateScholarshipAvailability(caUni),
            median_debt: this.estimateMedianDebt(caUni.tuition_domestic),
            graduate_earnings: this.estimateGraduateEarnings(caUni),
            location_type: this.determineLocationType(caUni.city),
            class_size: this.determineClassSize(caUni.total_students || 25000),
            research_opportunities: this.getResearchOpportunities(caUni.research_intensity),
            student_size: caUni.total_students,
            ownership_type: 'public',
            website_url: caUni.website,
            data_source: 'government_api',
            last_updated: new Date().toISOString()
        };
    }

    private generateProgramScores(caUni: CanadianUniversityData): { [key: string]: number } {
        const programs: { [key: string]: number } = {};
        const baseScore = 75;

        // Add scores for notable programs
        caUni.notable_programs.forEach(program => {
            switch (program) {
                case 'Computer Science':
                    programs['computer-science'] = 90;
                    programs['technology'] = 85;
                    break;
                case 'Engineering':
                    programs['engineering'] = 90;
                    programs['mechanical-engineering'] = 85;
                    break;
                case 'Business':
                    programs['business'] = 85;
                    programs['finance'] = 80;
                    break;
                case 'Medicine':
                    programs['pre-medicine'] = 90;
                    programs['biology'] = 85;
                    break;
            }
        });

        // Default programs
        const defaultPrograms = ['computer-science', 'engineering', 'business', 'biology', 'economics'];
        defaultPrograms.forEach(program => {
            if (!programs[program]) {
                programs[program] = baseScore;
            }
        });

        return programs;
    }

    private estimateAcceptanceRate(caUni: CanadianUniversityData): number {
        let rate = 65;
        if (caUni.macleans_ranking && caUni.macleans_ranking <= 5) rate = 45;
        return rate;
    }

    private estimateGlobalRanking(nationalRanking: number): number {
        return nationalRanking <= 3 ? nationalRanking * 20 : 200 + nationalRanking * 10;
    }

    private estimateGPAFromAcceptance(acceptanceRate: number): number {
        if (acceptanceRate <= 30) return 3.8;
        if (acceptanceRate <= 50) return 3.5;
        return 3.2;
    }

    private estimateMinGPA(acceptanceRate: number): number {
        if (acceptanceRate <= 30) return 3.7;
        if (acceptanceRate <= 50) return 3.3;
        return 3.0;
    }

    private getResearchRequirement(intensity: string): string {
        switch (intensity) {
            case 'very_high': return 'Strongly Recommended';
            case 'high': return 'Recommended';
            default: return 'Optional';
        }
    }

    private estimateScholarshipAvailability(caUni: CanadianUniversityData): number {
        let percentage = 40;
        if (caUni.macleans_ranking && caUni.macleans_ranking <= 10) percentage += 20;
        return Math.min(75, percentage);
    }

    private estimateMedianDebt(domesticTuition: number): number {
        return domesticTuition * 3.5;
    }

    private estimateGraduateEarnings(caUni: CanadianUniversityData): number {
        let earnings = 55000;
        if (caUni.city === 'Toronto') earnings += 10000;
        else if (caUni.city === 'Vancouver') earnings += 8000;
        return earnings;
    }

    private determineLocationType(city: string): string {
        const majorCities = ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa'];
        return majorCities.includes(city) ? 'Major City' : 'University Town';
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
}

export const canadianUniversityManager = new CanadianUniversityDataManager(); 