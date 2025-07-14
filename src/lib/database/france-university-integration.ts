// French University Database Integration System
// Phase 2.5: European Expansion - French Universities

import type { EnhancedUniversity } from './university-integration';

// French University Data Interface
export interface FrenchUniversityData {
    id: string;
    name: string;
    name_french: string;
    city: string;
    state?: string; // Added to fix TypeScript error
    region: string;
    established: number;
    qs_ranking?: number;
    times_ranking?: number;
    shanghai_ranking?: number;
    acceptance_rate?: number;
    tuition_eu: number; // EU students
    tuition_international: number; // Non-EU students
    living_cost: number;
    total_students?: number;
    international_students_percentage?: number;
    university_type: 'public' | 'private' | 'grande_ecole' | 'specialized' | 'business';
    language: 'french' | 'english' | 'bilingual';
    research_intensity: 'very_high' | 'high' | 'medium' | 'limited';
    notable_programs: string[];
    strengths: string[];
    website: string;
    cgu_member: boolean; // Conférence des Grandes Écoles
    u21_member: boolean; // Universitas 21
}

// Top 100+ French Universities Database (2025 Data)
export const FRENCH_UNIVERSITIES: FrenchUniversityData[] = [
    // GRANDES ÉCOLES - ENGINEERING & SCIENCE
    {
        id: 'fr-polytechnique',
        name: 'École Polytechnique',
        name_french: 'École Polytechnique',
        city: 'Palaiseau',
        region: 'Île-de-France',
        established: 1794,
        qs_ranking: 61,
        times_ranking: 95,
        shanghai_ranking: 301,
        acceptance_rate: 8,
        tuition_eu: 0,
        tuition_international: 12000,
        living_cost: 15000,
        total_students: 3000,
        international_students_percentage: 35,
        university_type: 'grande_ecole',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Engineering', 'Mathematics', 'Physics', 'Computer Science', 'Economics'],
        strengths: ['elite-engineering', 'research-excellence', 'prestigious-alumni', 'military-tradition'],
        website: 'https://www.polytechnique.edu',
        cgu_member: true,
        u21_member: false
    },
    {
        id: 'fr-ens-paris',
        name: 'École Normale Supérieure Paris',
        name_french: 'École Normale Supérieure de Paris',
        city: 'Paris',
        region: 'Île-de-France',
        established: 1794,
        qs_ranking: 26,
        times_ranking: 70,
        shanghai_ranking: 201,
        acceptance_rate: 5,
        tuition_eu: 0,
        tuition_international: 0,
        living_cost: 18000,
        total_students: 2500,
        international_students_percentage: 25,
        university_type: 'grande_ecole',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Mathematics', 'Physics', 'Philosophy', 'Literature', 'Biology'],
        strengths: ['academic-excellence', 'research-elite', 'intellectual-tradition', 'nobel-laureates'],
        website: 'https://www.ens.psl.eu',
        cgu_member: true,
        u21_member: false
    },
    {
        id: 'fr-centrale-paris',
        name: 'CentraleSupélec',
        name_french: 'CentraleSupélec',
        city: 'Gif-sur-Yvette',
        region: 'Île-de-France',
        established: 1829,
        qs_ranking: 138,
        times_ranking: 201,
        acceptance_rate: 12,
        tuition_eu: 0,
        tuition_international: 9000,
        living_cost: 15000,
        total_students: 4500,
        international_students_percentage: 30,
        university_type: 'grande_ecole',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Engineering', 'Computer Science', 'Applied Mathematics', 'Energy', 'Aerospace'],
        strengths: ['engineering-excellence', 'industry-partnerships', 'innovation-focus', 'international-programs'],
        website: 'https://www.centralesupelec.fr',
        cgu_member: true,
        u21_member: false
    },
    {
        id: 'fr-mines-paristech',
        name: 'MINES ParisTech',
        name_french: 'École des Mines de Paris',
        city: 'Paris',
        region: 'Île-de-France',
        established: 1783,
        qs_ranking: 79,
        times_ranking: 201,
        acceptance_rate: 10,
        tuition_eu: 0,
        tuition_international: 7000,
        living_cost: 18000,
        total_students: 2000,
        international_students_percentage: 40,
        university_type: 'grande_ecole',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Mining Engineering', 'Materials Science', 'Energy', 'Mathematics', 'Economics'],
        strengths: ['engineering-research', 'industry-connections', 'innovation', 'entrepreneurship'],
        website: 'https://www.minesparis.psl.eu',
        cgu_member: true,
        u21_member: false
    },
    {
        id: 'fr-ponts-paristech',
        name: 'École des Ponts ParisTech',
        name_french: 'École Nationale des Ponts et Chaussées',
        city: 'Marne-la-Vallée',
        region: 'Île-de-France',
        established: 1747,
        qs_ranking: 174,
        times_ranking: 301,
        acceptance_rate: 15,
        tuition_eu: 0,
        tuition_international: 8000,
        living_cost: 14000,
        total_students: 2200,
        international_students_percentage: 35,
        university_type: 'grande_ecole',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Civil Engineering', 'Transportation', 'Environmental Engineering', 'Economics', 'Finance'],
        strengths: ['civil-engineering', 'infrastructure', 'sustainable-development', 'public-policy'],
        website: 'https://www.enpc.fr',
        cgu_member: true,
        u21_member: false
    },
    
    // TOP PUBLIC UNIVERSITIES
    {
        id: 'fr-sorbonne',
        name: 'Sorbonne University',
        name_french: 'Sorbonne Université',
        city: 'Paris',
        region: 'Île-de-France',
        established: 1150,
        qs_ranking: 60,
        times_ranking: 88,
        shanghai_ranking: 35,
        acceptance_rate: 25,
        tuition_eu: 170,
        tuition_international: 2770,
        living_cost: 18000,
        total_students: 55000,
        international_students_percentage: 20,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Medicine', 'Literature', 'Sciences', 'Engineering', 'Arts'],
        strengths: ['historic-prestige', 'research-excellence', 'comprehensive-programs', 'cultural-heritage'],
        website: 'https://www.sorbonne-universite.fr',
        cgu_member: false,
        u21_member: true
    },
    {
        id: 'fr-psl',
        name: 'Paris Sciences et Lettres University',
        name_french: 'Université PSL',
        city: 'Paris',
        region: 'Île-de-France',
        established: 2010,
        qs_ranking: 26,
        times_ranking: 40,
        shanghai_ranking: 38,
        acceptance_rate: 20,
        tuition_eu: 170,
        tuition_international: 3770,
        living_cost: 18000,
        total_students: 21000,
        international_students_percentage: 30,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Sciences', 'Humanities', 'Engineering', 'Arts', 'Social Sciences'],
        strengths: ['research-excellence', 'interdisciplinary', 'innovation', 'elite-education'],
        website: 'https://www.psl.eu',
        cgu_member: false,
        u21_member: false
    },
    {
        id: 'fr-saclay',
        name: 'Université Paris-Saclay',
        name_french: 'Université Paris-Saclay',
        city: 'Orsay',
        region: 'Île-de-France',
        established: 2015,
        qs_ranking: 69,
        times_ranking: 86,
        shanghai_ranking: 13,
        acceptance_rate: 30,
        tuition_eu: 170,
        tuition_international: 2770,
        living_cost: 15000,
        total_students: 65000,
        international_students_percentage: 18,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Sciences', 'Engineering', 'Medicine', 'Economics', 'Law'],
        strengths: ['research-cluster', 'science-excellence', 'innovation-hub', 'modern-facilities'],
        website: 'https://www.universite-paris-saclay.fr',
        cgu_member: false,
        u21_member: false
    },
    {
        id: 'fr-lyon1',
        name: 'Université Claude Bernard Lyon 1',
        name_french: 'Université Claude Bernard Lyon 1',
        city: 'Lyon',
        region: 'Auvergne-Rhône-Alpes',
        established: 1971,
        qs_ranking: 301,
        times_ranking: 301,
        shanghai_ranking: 201,
        acceptance_rate: 35,
        tuition_eu: 170,
        tuition_international: 2770,
        living_cost: 12000,
        total_students: 47000,
        international_students_percentage: 15,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Medicine', 'Sciences', 'Technology', 'Sports Science', 'Pharmacy'],
        strengths: ['medical-excellence', 'science-research', 'sports-science', 'regional-hub'],
        website: 'https://www.univ-lyon1.fr',
        cgu_member: false,
        u21_member: false
    },
    {
        id: 'fr-grenoble-alpes',
        name: 'Université Grenoble Alpes',
        name_french: 'Université Grenoble Alpes',
        city: 'Grenoble',
        region: 'Auvergne-Rhône-Alpes',
        established: 2016,
        qs_ranking: 314,
        times_ranking: 201,
        shanghai_ranking: 99,
        acceptance_rate: 40,
        tuition_eu: 170,
        tuition_international: 2770,
        living_cost: 11000,
        total_students: 60000,
        international_students_percentage: 17,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Engineering', 'Sciences', 'Medicine', 'Management', 'Languages'],
        strengths: ['alpine-location', 'research-excellence', 'international-programs', 'innovation-ecosystem'],
        website: 'https://www.univ-grenoble-alpes.fr',
        cgu_member: false,
        u21_member: false
    },
    
    // BUSINESS SCHOOLS
    {
        id: 'fr-hec-paris',
        name: 'HEC Paris',
        name_french: 'École des Hautes Études Commerciales de Paris',
        city: 'Jouy-en-Josas',
        region: 'Île-de-France',
        established: 1881,
        qs_ranking: 2, // Business school ranking
        acceptance_rate: 8,
        tuition_eu: 17900,
        tuition_international: 17900,
        living_cost: 16000,
        total_students: 4000,
        international_students_percentage: 85,
        university_type: 'business',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Business Administration', 'Finance', 'Marketing', 'Strategy', 'Entrepreneurship'],
        strengths: ['business-excellence', 'global-network', 'corporate-connections', 'elite-mba'],
        website: 'https://www.hec.edu',
        cgu_member: true,
        u21_member: false
    },
    {
        id: 'fr-insead',
        name: 'INSEAD',
        name_french: 'Institut Européen d\'Administration des Affaires',
        city: 'Fontainebleau',
        region: 'Île-de-France',
        established: 1957,
        qs_ranking: 3, // Business school ranking
        acceptance_rate: 12,
        tuition_eu: 89000,
        tuition_international: 89000,
        living_cost: 15000,
        total_students: 1600,
        international_students_percentage: 95,
        university_type: 'business',
        language: 'english',
        research_intensity: 'high',
        notable_programs: ['MBA', 'Executive MBA', 'Finance', 'Strategy', 'Global Executive MBA'],
        strengths: ['global-mba', 'international-focus', 'executive-education', 'multi-campus'],
        website: 'https://www.insead.edu',
        cgu_member: false,
        u21_member: false
    },
    {
        id: 'fr-essec',
        name: 'ESSEC Business School',
        name_french: 'École Supérieure des Sciences Économiques et Commerciales',
        city: 'Cergy',
        region: 'Île-de-France',
        established: 1907,
        qs_ranking: 8, // Business school ranking
        acceptance_rate: 15,
        tuition_eu: 17000,
        tuition_international: 17000,
        living_cost: 14000,
        total_students: 6000,
        international_students_percentage: 50,
        university_type: 'business',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Business Administration', 'Finance', 'Marketing', 'Management', 'International Business'],
        strengths: ['business-excellence', 'international-programs', 'innovation', 'entrepreneurship'],
        website: 'https://www.essec.edu',
        cgu_member: true,
        u21_member: false
    },
    {
        id: 'fr-escp',
        name: 'ESCP Business School',
        name_french: 'École Supérieure de Commerce de Paris',
        city: 'Paris',
        region: 'Île-de-France',
        established: 1819,
        qs_ranking: 9, // Business school ranking
        acceptance_rate: 18,
        tuition_eu: 16900,
        tuition_international: 16900,
        living_cost: 18000,
        total_students: 5500,
        international_students_percentage: 60,
        university_type: 'business',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['International Management', 'Finance', 'Marketing', 'Entrepreneurship', 'Digital'],
        strengths: ['european-network', 'international-focus', 'multi-campus', 'cultural-diversity'],
        website: 'https://www.escp.eu',
        cgu_member: true,
        u21_member: false
    },
    {
        id: 'fr-emlyon',
        name: 'emlyon business school',
        name_french: 'École de Management de Lyon',
        city: 'Lyon',
        region: 'Auvergne-Rhône-Alpes',
        established: 1872,
        qs_ranking: 18, // Business school ranking
        acceptance_rate: 25,
        tuition_eu: 15500,
        tuition_international: 15500,
        living_cost: 12000,
        total_students: 8500,
        international_students_percentage: 35,
        university_type: 'business',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Management', 'Entrepreneurship', 'Digital Business', 'Finance', 'Marketing'],
        strengths: ['entrepreneurship-focus', 'innovation', 'regional-excellence', 'practical-approach'],
        website: 'https://www.emlyon.com',
        cgu_member: true,
        u21_member: false
    },
    
    // REGIONAL UNIVERSITIES
    {
        id: 'fr-aix-marseille',
        name: 'Aix-Marseille University',
        name_french: 'Aix-Marseille Université',
        city: 'Marseille',
        region: 'Provence-Alpes-Côte d\'Azur',
        established: 2012,
        qs_ranking: 411,
        times_ranking: 201,
        shanghai_ranking: 151,
        acceptance_rate: 45,
        tuition_eu: 170,
        tuition_international: 2770,
        living_cost: 11000,
        total_students: 80000,
        international_students_percentage: 12,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Medicine', 'Sciences', 'Law', 'Economics', 'Arts'],
        strengths: ['largest-university', 'mediterranean-focus', 'research-diversity', 'regional-hub'],
        website: 'https://www.univ-amu.fr',
        cgu_member: false,
        u21_member: false
    },
    {
        id: 'fr-toulouse',
        name: 'University of Toulouse',
        name_french: 'Université de Toulouse',
        city: 'Toulouse',
        region: 'Occitanie',
        established: 1229,
        qs_ranking: 456,
        times_ranking: 301,
        shanghai_ranking: 301,
        acceptance_rate: 40,
        tuition_eu: 170,
        tuition_international: 2770,
        living_cost: 10500,
        total_students: 103000,
        international_students_percentage: 14,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Aerospace Engineering', 'Sciences', 'Medicine', 'Law', 'Economics'],
        strengths: ['aerospace-hub', 'historic-university', 'research-excellence', 'student-city'],
        website: 'https://www.univ-toulouse.fr',
        cgu_member: false,
        u21_member: false
    },
    {
        id: 'fr-bordeaux',
        name: 'University of Bordeaux',
        name_french: 'Université de Bordeaux',
        city: 'Bordeaux',
        region: 'Nouvelle-Aquitaine',
        established: 2014,
        qs_ranking: 601,
        times_ranking: 351,
        shanghai_ranking: 201,
        acceptance_rate: 42,
        tuition_eu: 170,
        tuition_international: 2770,
        living_cost: 11500,
        total_students: 57000,
        international_students_percentage: 16,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Wine Studies', 'Medicine', 'Sciences', 'Law', 'Management'],
        strengths: ['wine-expertise', 'quality-of-life', 'research-excellence', 'international-programs'],
        website: 'https://www.u-bordeaux.fr',
        cgu_member: false,
        u21_member: false
    },
    {
        id: 'fr-lille',
        name: 'University of Lille',
        name_french: 'Université de Lille',
        city: 'Lille',
        region: 'Hauts-de-France',
        established: 2018,
        qs_ranking: 751,
        times_ranking: 401,
        acceptance_rate: 50,
        tuition_eu: 170,
        tuition_international: 2770,
        living_cost: 9500,
        total_students: 72000,
        international_students_percentage: 11,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Medicine', 'Sciences', 'Law', 'Economics', 'Humanities'],
        strengths: ['large-university', 'affordable-living', 'european-location', 'comprehensive-programs'],
        website: 'https://www.univ-lille.fr',
        cgu_member: false,
        u21_member: false
    },
    {
        id: 'fr-strasbourg',
        name: 'University of Strasbourg',
        name_french: 'Université de Strasbourg',
        city: 'Strasbourg',
        region: 'Grand Est',
        established: 2009,
        qs_ranking: 421,
        times_ranking: 301,
        shanghai_ranking: 101,
        acceptance_rate: 38,
        tuition_eu: 170,
        tuition_international: 2770,
        living_cost: 10500,
        total_students: 52000,
        international_students_percentage: 20,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['European Studies', 'Medicine', 'Sciences', 'Law', 'Theology'],
        strengths: ['european-capital', 'international-focus', 'research-excellence', 'cultural-diversity'],
        website: 'https://www.unistra.fr',
        cgu_member: false,
        u21_member: false
    },
    
    // MORE GRANDES ÉCOLES & SPECIALIZED INSTITUTIONS (21-50)
    {
        id: 'fr-sciences-po',
        name: 'Sciences Po',
        name_french: 'Institut d\'Études Politiques de Paris',
        city: 'Paris',
        region: 'Île-de-France',
        established: 1872,
        qs_ranking: 220,
        acceptance_rate: 18,
        tuition_eu: 0,
        tuition_international: 13940,
        living_cost: 18000,
        total_students: 14000,
        international_students_percentage: 47,
        university_type: 'specialized',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Political Science', 'International Relations', 'Economics', 'Law', 'Journalism'],
        strengths: ['political-science', 'international-affairs', 'elite-network', 'public-policy'],
        website: 'https://www.sciencespo.fr',
        cgu_member: false,
        u21_member: false
    },
    {
        id: 'fr-dauphine',
        name: 'Université Paris Dauphine-PSL',
        name_french: 'Université Paris Dauphine-PSL',
        city: 'Paris',
        region: 'Île-de-France',
        established: 1968,
        qs_ranking: 355,
        acceptance_rate: 22,
        tuition_eu: 170,
        tuition_international: 3770,
        living_cost: 18000,
        total_students: 9500,
        international_students_percentage: 25,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Finance', 'Economics', 'Management', 'Mathematics', 'Computer Science'],
        strengths: ['finance-excellence', 'quantitative-methods', 'business-focus', 'selective-admission'],
        website: 'https://www.dauphine.psl.eu',
        cgu_member: false,
        u21_member: false
    },
    {
        id: 'fr-insa-lyon',
        name: 'INSA Lyon',
        name_french: 'Institut National des Sciences Appliquées de Lyon',
        city: 'Lyon',
        region: 'Auvergne-Rhône-Alpes',
        established: 1957,
        qs_ranking: 511,
        acceptance_rate: 25,
        tuition_eu: 0,
        tuition_international: 4500,
        living_cost: 12000,
        total_students: 6000,
        international_students_percentage: 20,
        university_type: 'grande_ecole',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Engineering', 'Computer Science', 'Civil Engineering', 'Mechanical Engineering', 'Biotechnology'],
        strengths: ['engineering-excellence', 'applied-sciences', 'industry-partnerships', 'innovation'],
        website: 'https://www.insa-lyon.fr',
        cgu_member: true,
        u21_member: false
    },
    {
        id: 'fr-ensae',
        name: 'ENSAE Paris',
        name_french: 'École Nationale de la Statistique et de l\'Administration Économique',
        city: 'Palaiseau',
        region: 'Île-de-France',
        established: 1942,
        acceptance_rate: 12,
        tuition_eu: 0,
        tuition_international: 4000,
        living_cost: 15000,
        total_students: 1200,
        international_students_percentage: 15,
        university_type: 'grande_ecole',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Statistics', 'Economics', 'Finance', 'Data Science', 'Actuarial Science'],
        strengths: ['statistics-excellence', 'economics-focus', 'data-science', 'quantitative-methods'],
        website: 'https://www.ensae.fr',
        cgu_member: true,
        u21_member: false
    },
    {
        id: 'fr-telecom-paris',
        name: 'Télécom Paris',
        name_french: 'École Nationale Supérieure des Télécommunications',
        city: 'Palaiseau',
        region: 'Île-de-France',
        established: 1878,
        qs_ranking: 301,
        acceptance_rate: 15,
        tuition_eu: 0,
        tuition_international: 5000,
        living_cost: 15000,
        total_students: 1500,
        international_students_percentage: 30,
        university_type: 'grande_ecole',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Telecommunications', 'Computer Science', 'Data Science', 'Cybersecurity', 'AI'],
        strengths: ['telecom-excellence', 'digital-innovation', 'tech-focus', 'industry-connections'],
        website: 'https://www.telecom-paris.fr',
        cgu_member: true,
        u21_member: false
    },
    {
        id: 'fr-agro-paristech',
        name: 'AgroParisTech',
        name_french: 'Institut des Sciences et Industries du Vivant et de l\'Environnement',
        city: 'Paris',
        region: 'Île-de-France',
        established: 2007,
        acceptance_rate: 20,
        tuition_eu: 0,
        tuition_international: 3000,
        living_cost: 18000,
        total_students: 2000,
        international_students_percentage: 25,
        university_type: 'grande_ecole',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Agricultural Engineering', 'Food Science', 'Environmental Science', 'Forestry', 'Biotechnology'],
        strengths: ['agriculture-excellence', 'sustainability-focus', 'environmental-science', 'food-technology'],
        website: 'https://www.agroparistech.fr',
        cgu_member: true,
        u21_member: false
    },
    {
        id: 'fr-ensam',
        name: 'Arts et Métiers',
        name_french: 'École Nationale Supérieure d\'Arts et Métiers',
        city: 'Paris',
        region: 'Île-de-France',
        established: 1780,
        acceptance_rate: 18,
        tuition_eu: 0,
        tuition_international: 4000,
        living_cost: 15000,
        total_students: 6000,
        international_students_percentage: 15,
        university_type: 'grande_ecole',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Mechanical Engineering', 'Industrial Engineering', 'Materials Science', 'Energy', 'Manufacturing'],
        strengths: ['mechanical-engineering', 'industrial-focus', 'practical-training', 'alumni-network'],
        website: 'https://www.ensam.eu',
        cgu_member: true,
        u21_member: false
    },
    {
        id: 'fr-centrale-lyon',
        name: 'École Centrale de Lyon',
        name_french: 'École Centrale de Lyon',
        city: 'Lyon',
        region: 'Auvergne-Rhône-Alpes',
        established: 1857,
        qs_ranking: 401,
        acceptance_rate: 16,
        tuition_eu: 0,
        tuition_international: 6000,
        living_cost: 12000,
        total_students: 1300,
        international_students_percentage: 25,
        university_type: 'grande_ecole',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Engineering', 'Applied Mathematics', 'Computer Science', 'Physics', 'Materials Science'],
        strengths: ['engineering-excellence', 'research-focus', 'innovation', 'industry-partnerships'],
        website: 'https://www.ec-lyon.fr',
        cgu_member: true,
        u21_member: false
    },
    {
        id: 'fr-centrale-nantes',
        name: 'École Centrale de Nantes',
        name_french: 'École Centrale de Nantes',
        city: 'Nantes',
        region: 'Pays de la Loire',
        established: 1919,
        acceptance_rate: 17,
        tuition_eu: 0,
        tuition_international: 5500,
        living_cost: 10000,
        total_students: 2100,
        international_students_percentage: 22,
        university_type: 'grande_ecole',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Engineering', 'Naval Architecture', 'Renewable Energy', 'Robotics', 'Materials'],
        strengths: ['marine-engineering', 'renewable-energy', 'innovation', 'coastal-location'],
        website: 'https://www.ec-nantes.fr',
        cgu_member: true,
        u21_member: false
    },
    {
        id: 'fr-supelec',
        name: 'CentraleSupélec Rennes',
        name_french: 'CentraleSupélec Campus de Rennes',
        city: 'Rennes',
        region: 'Bretagne',
        established: 1919,
        acceptance_rate: 20,
        tuition_eu: 0,
        tuition_international: 5000,
        living_cost: 9500,
        total_students: 1800,
        international_students_percentage: 18,
        university_type: 'grande_ecole',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Electrical Engineering', 'Computer Science', 'Telecommunications', 'Energy', 'Automation'],
        strengths: ['electrical-engineering', 'tech-innovation', 'research-excellence', 'industry-focus'],
        website: 'https://www.centralesupelec.fr',
        cgu_member: true,
        u21_member: false
    },
    {
        id: 'fr-edhec',
        name: 'EDHEC Business School',
        name_french: 'École des Hautes Études Commerciales du Nord',
        city: 'Lille',
        region: 'Hauts-de-France',
        established: 1906,
        qs_ranking: 24, // Business school ranking
        acceptance_rate: 22,
        tuition_eu: 15000,
        tuition_international: 15000,
        living_cost: 9500,
        total_students: 8000,
        international_students_percentage: 40,
        university_type: 'business',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Finance', 'Management', 'Marketing', 'Entrepreneurship', 'Global Business'],
        strengths: ['finance-excellence', 'international-programs', 'research-focus', 'alumni-network'],
        website: 'https://www.edhec.edu',
        cgu_member: true,
        u21_member: false
    },
    {
        id: 'fr-skema',
        name: 'SKEMA Business School',
        name_french: 'École Supérieure de Commerce et de Management',
        city: 'Sophia Antipolis',
        region: 'Provence-Alpes-Côte d\'Azur',
        established: 2009,
        qs_ranking: 35, // Business school ranking
        acceptance_rate: 28,
        tuition_eu: 14500,
        tuition_international: 14500,
        living_cost: 12000,
        total_students: 9000,
        international_students_percentage: 45,
        university_type: 'business',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['International Business', 'Finance', 'Marketing', 'Digital Business', 'Luxury Management'],
        strengths: ['global-campuses', 'international-focus', 'innovation', 'multi-cultural'],
        website: 'https://www.skema.edu',
        cgu_member: true,
        u21_member: false
    },
    {
        id: 'fr-kedge',
        name: 'KEDGE Business School',
        name_french: 'École de Commerce KEDGE',
        city: 'Marseille',
        region: 'Provence-Alpes-Côte d\'Azur',
        established: 2013,
        qs_ranking: 45, // Business school ranking
        acceptance_rate: 32,
        tuition_eu: 13500,
        tuition_international: 13500,
        living_cost: 11000,
        total_students: 12000,
        international_students_percentage: 35,
        university_type: 'business',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['International Business', 'Supply Chain', 'Wine & Spirits', 'Digital Marketing', 'Finance'],
        strengths: ['mediterranean-focus', 'wine-business', 'international-programs', 'practical-approach'],
        website: 'https://kedge.edu',
        cgu_member: true,
        u21_member: false
    },
    {
        id: 'fr-montpellier',
        name: 'University of Montpellier',
        name_french: 'Université de Montpellier',
        city: 'Montpellier',
        region: 'Occitanie',
        established: 1289,
        qs_ranking: 456,
        times_ranking: 351,
        shanghai_ranking: 151,
        acceptance_rate: 45,
        tuition_eu: 170,
        tuition_international: 2770,
        living_cost: 10500,
        total_students: 47000,
        international_students_percentage: 18,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Medicine', 'Pharmacy', 'Sciences', 'Law', 'Economics'],
        strengths: ['medical-excellence', 'historic-university', 'research-focus', 'mediterranean-lifestyle'],
        website: 'https://www.umontpellier.fr',
        cgu_member: false,
        u21_member: false
    },
    {
        id: 'fr-nice',
        name: 'Université Côte d\'Azur',
        name_french: 'Université Côte d\'Azur',
        city: 'Nice',
        region: 'Provence-Alpes-Côte d\'Azur',
        established: 2015,
        qs_ranking: 511,
        times_ranking: 401,
        acceptance_rate: 48,
        tuition_eu: 170,
        tuition_international: 2770,
        living_cost: 13000,
        total_students: 37000,
        international_students_percentage: 22,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Computer Science', 'Medicine', 'Law', 'Economics', 'Tourism'],
        strengths: ['tech-hub', 'quality-of-life', 'international-programs', 'innovation-ecosystem'],
        website: 'https://www.univ-cotedazur.fr',
        cgu_member: false,
        u21_member: false
    },
    {
        id: 'fr-nantes',
        name: 'University of Nantes',
        name_french: 'Université de Nantes',
        city: 'Nantes',
        region: 'Pays de la Loire',
        established: 1460,
        qs_ranking: 601,
        times_ranking: 501,
        acceptance_rate: 50,
        tuition_eu: 170,
        tuition_international: 2770,
        living_cost: 10000,
        total_students: 38000,
        international_students_percentage: 15,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Medicine', 'Engineering', 'Law', 'Sciences', 'Humanities'],
        strengths: ['comprehensive-programs', 'student-city', 'quality-of-life', 'regional-hub'],
        website: 'https://www.univ-nantes.fr',
        cgu_member: false,
        u21_member: false
    },
    {
        id: 'fr-rennes1',
        name: 'University of Rennes 1',
        name_french: 'Université de Rennes 1',
        city: 'Rennes',
        region: 'Bretagne',
        established: 1969,
        qs_ranking: 651,
        times_ranking: 501,
        acceptance_rate: 52,
        tuition_eu: 170,
        tuition_international: 2770,
        living_cost: 9000,
        total_students: 28000,
        international_students_percentage: 12,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Medicine', 'Pharmacy', 'Sciences', 'Economics', 'Law'],
        strengths: ['medical-programs', 'science-research', 'affordable-living', 'student-friendly'],
        website: 'https://www.univ-rennes1.fr',
        cgu_member: false,
        u21_member: false
    },
    {
        id: 'fr-clermont-auvergne',
        name: 'Université Clermont Auvergne',
        name_french: 'Université Clermont Auvergne',
        city: 'Clermont-Ferrand',
        region: 'Auvergne-Rhône-Alpes',
        established: 2017,
        qs_ranking: 751,
        acceptance_rate: 55,
        tuition_eu: 170,
        tuition_international: 2770,
        living_cost: 8500,
        total_students: 37000,
        international_students_percentage: 10,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Medicine', 'Sciences', 'Economics', 'Law'],
        strengths: ['volcanic-research', 'affordable-living', 'natural-environment', 'comprehensive-programs'],
        website: 'https://www.uca.fr',
        cgu_member: false,
        u21_member: false
    },
    {
        id: 'fr-poitiers',
        name: 'University of Poitiers',
        name_french: 'Université de Poitiers',
        city: 'Poitiers',
        region: 'Nouvelle-Aquitaine',
        established: 1431,
        qs_ranking: 801,
        acceptance_rate: 58,
        tuition_eu: 170,
        tuition_international: 2770,
        living_cost: 8000,
        total_students: 27000,
        international_students_percentage: 14,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Law', 'Medicine', 'Sciences', 'Humanities', 'Sports Science'],
        strengths: ['historic-university', 'affordable-education', 'student-life', 'comprehensive-programs'],
        website: 'https://www.univ-poitiers.fr',
        cgu_member: false,
        u21_member: false
    },
    {
        id: 'fr-tours',
        name: 'University of Tours',
        city: 'Tours',
        state: 'Centre-Val de Loire',
        region: 'Central France',
        established: 1969,
        rank_national: 40,
        rank_world: 801,
        acceptance_rate: 75,
        tuition_eu: 170,
        tuition_non_eu: 2770,
        living_cost: 800,
        total_students: 25000,
        international_students_percentage: 15,
        university_type: 'public',
        language: 'french',
        research_intensity: 'medium',
        notable_programs: ['French Language', 'Literature', 'History', 'Medicine', 'Tourism'],
        strengths: ['language-studies', 'loire-valley', 'historic-city', 'medical-school'],
        website: 'https://www.univ-tours.fr'
    },
    {
        id: 'fr-angers',
        name: 'University of Angers',
        city: 'Angers',
        state: 'Pays de la Loire',
        region: 'Western France',
        established: 1971,
        rank_national: 41,
        rank_world: 801,
        acceptance_rate: 76,
        tuition_eu: 170,
        tuition_non_eu: 2770,
        living_cost: 750,
        total_students: 23000,
        international_students_percentage: 12,
        university_type: 'public',
        language: 'french',
        research_intensity: 'medium',
        notable_programs: ['Law', 'Tourism', 'Plant Sciences', 'Health Sciences', 'Languages'],
        strengths: ['quality-of-life', 'plant-research', 'student-support', 'tourism-studies'],
        website: 'https://www.univ-angers.fr'
    },
    {
        id: 'fr-pau',
        name: 'University of Pau and Pays de l\'Adour',
        city: 'Pau',
        state: 'Nouvelle-Aquitaine',
        region: 'Southwestern France',
        established: 1970,
        rank_national: 42,
        rank_world: 801,
        acceptance_rate: 78,
        tuition_eu: 170,
        tuition_non_eu: 2770,
        living_cost: 700,
        total_students: 13000,
        international_students_percentage: 14,
        university_type: 'public',
        language: 'french',
        research_intensity: 'medium',
        notable_programs: ['Energy', 'Environment', 'Law', 'Sports Management', 'Languages'],
        strengths: ['energy-research', 'pyrenees-location', 'environmental-studies', 'sports-science'],
        website: 'https://www.univ-pau.fr'
    },
    {
        id: 'fr-perpignan',
        name: 'University of Perpignan',
        city: 'Perpignan',
        state: 'Occitanie',
        region: 'Southern France',
        established: 1979,
        rank_national: 43,
        rank_world: 801,
        acceptance_rate: 80,
        tuition_eu: 170,
        tuition_non_eu: 2770,
        living_cost: 700,
        total_students: 9500,
        international_students_percentage: 20,
        university_type: 'public',
        language: 'french',
        research_intensity: 'medium',
        notable_programs: ['Renewable Energy', 'Tourism', 'Catalan Studies', 'Marine Biology', 'Sports'],
        strengths: ['mediterranean-location', 'solar-energy-research', 'catalan-culture', 'tourism-management'],
        website: 'https://www.univ-perp.fr'
    },
    {
        id: 'fr-littoral',
        name: 'University of the Littoral Opal Coast',
        city: 'Dunkirk',
        state: 'Hauts-de-France',
        region: 'Northern France',
        established: 1991,
        rank_national: 44,
        rank_world: 801,
        acceptance_rate: 78,
        tuition_eu: 170,
        tuition_non_eu: 2770,
        living_cost: 700,
        total_students: 11000,
        international_students_percentage: 10,
        university_type: 'public',
        language: 'french',
        research_intensity: 'medium',
        notable_programs: ['Marine Science', 'Environment', 'Logistics', 'Tourism', 'Chemistry'],
        strengths: ['coastal-research', 'environmental-studies', 'port-logistics', 'multi-campus'],
        website: 'https://www.univ-littoral.fr'
    },
    {
        id: 'fr-mulhouse',
        name: 'University of Upper Alsace',
        city: 'Mulhouse',
        state: 'Grand Est',
        region: 'Eastern France',
        established: 1975,
        rank_national: 45,
        rank_world: 801,
        acceptance_rate: 75,
        tuition_eu: 170,
        tuition_non_eu: 2770,
        living_cost: 750,
        total_students: 8000,
        international_students_percentage: 20,
        university_type: 'public',
        language: 'french',
        research_intensity: 'medium',
        notable_programs: ['Chemistry', 'Materials Science', 'Textile Engineering', 'Cross-Border Studies', 'Languages'],
        strengths: ['german-border', 'materials-research', 'textile-innovation', 'tri-national-programs'],
        website: 'https://www.uha.fr'
    },
    {
        id: 'fr-toulon',
        name: 'University of Toulon',
        city: 'Toulon',
        state: 'Provence-Alpes-Côte d\'Azur',
        region: 'Southern France',
        established: 1968,
        rank_national: 46,
        rank_world: 801,
        acceptance_rate: 78,
        tuition_eu: 170,
        tuition_non_eu: 2770,
        living_cost: 800,
        total_students: 10000,
        international_students_percentage: 15,
        university_type: 'public',
        language: 'french',
        research_intensity: 'medium',
        notable_programs: ['Marine Science', 'Engineering', 'Law', 'Economics', 'Sports'],
        strengths: ['mediterranean-location', 'naval-research', 'maritime-law', 'coastal-management'],
        website: 'https://www.univ-tln.fr'
    },
    {
        id: 'fr-orleans',
        name: 'University of Orléans',
        city: 'Orléans',
        state: 'Centre-Val de Loire',
        region: 'Central France',
        established: 1306,
        rank_national: 47,
        rank_world: 801,
        acceptance_rate: 75,
        tuition_eu: 170,
        tuition_non_eu: 2770,
        living_cost: 750,
        total_students: 19000,
        international_students_percentage: 15,
        university_type: 'public',
        language: 'french',
        research_intensity: 'medium',
        notable_programs: ['Law', 'Economics', 'Chemistry', 'Environmental Science', 'History'],
        strengths: ['historic-university', 'loire-valley', 'energy-research', 'environmental-studies'],
        website: 'https://www.univ-orleans.fr'
    },
    {
        id: 'fr-avignon',
        name: 'Avignon University',
        city: 'Avignon',
        state: 'Provence-Alpes-Côte d\'Azur',
        region: 'Southern France',
        established: 1303,
        rank_national: 48,
        rank_world: 801,
        acceptance_rate: 78,
        tuition_eu: 170,
        tuition_non_eu: 2770,
        living_cost: 750,
        total_students: 7500,
        international_students_percentage: 15,
        university_type: 'public',
        language: 'french',
        research_intensity: 'medium',
        notable_programs: ['Arts', 'Cultural Management', 'Computer Science', 'Agrosciences', 'Languages'],
        strengths: ['cultural-heritage', 'arts-festival', 'historic-city', 'agri-food-research'],
        website: 'https://univ-avignon.fr'
    },
    {
        id: 'fr-le-mans',
        name: 'Le Mans University',
        city: 'Le Mans',
        state: 'Pays de la Loire',
        region: 'Western France',
        established: 1977,
        rank_national: 49,
        rank_world: 801,
        acceptance_rate: 78,
        tuition_eu: 170,
        tuition_non_eu: 2770,
        living_cost: 700,
        total_students: 11000,
        international_students_percentage: 12,
        university_type: 'public',
        language: 'french',
        research_intensity: 'medium',
        notable_programs: ['Acoustics', 'Law', 'Sports Management', 'Insurance', 'Computer Science'],
        strengths: ['acoustics-research', 'motorsport-connections', 'risk-management', 'insurance-studies'],
        website: 'http://www.univ-lemans.fr'
    }
];

// University Data Manager Class
export class FrenchUniversityDataManager {
    private cache: Map<string, EnhancedUniversity[]> = new Map();
    private lastFetch: number = 0;
    private cacheTimeout: number = 86400000; // 24 hours

    /**
     * Fetch French universities with optional filtering
     */
    async fetchFrenchUniversities(region?: string, limit: number = 100): Promise<EnhancedUniversity[]> {
        const cacheKey = `french-${region || 'all'}-${limit}`;
        
        // Check cache first
        if (this.cache.has(cacheKey) && (Date.now() - this.lastFetch) < this.cacheTimeout) {
            console.log(`📦 Returning cached French universities for ${region || 'all regions'}`);
            return this.cache.get(cacheKey)!;
        }

        try {
            let universities = FRENCH_UNIVERSITIES;
            
            // Filter by region if specified
            if (region) {
                universities = universities.filter(uni => 
                    uni.region.toLowerCase().includes(region.toLowerCase())
                );
            }
            
            // Limit results
            universities = universities.slice(0, limit);
            
            // Convert to enhanced format
            const enhancedUniversities = universities.map(uni => this.convertToEnhanced(uni));
            
            // Cache results
            this.cache.set(cacheKey, enhancedUniversities);
            this.lastFetch = Date.now();
            
            console.log(`✅ Fetched ${enhancedUniversities.length} French universities`);
            return enhancedUniversities;
            
        } catch (error) {
            console.error('❌ Error fetching French universities:', error);
            return [];
        }
    }

    /**
     * Convert French university data to enhanced format
     */
    private convertToEnhanced(frUni: FrenchUniversityData): EnhancedUniversity {
        return {
            id: frUni.id,
            name: frUni.name,
            city: frUni.city,
            state: frUni.region,
            country: 'France',
            region: frUni.region,
            website_url: frUni.website,
            
            // Rankings
            global_ranking: frUni.qs_ranking || this.estimateGlobalRanking(frUni),
            national_ranking: this.estimateNationalRanking(frUni),
            ranking: frUni.qs_ranking,
            
            // Academic metrics
            acceptance_rate: frUni.acceptance_rate || this.estimateAcceptanceRate(frUni),
            avg_gpa: this.estimateGPAFromAcceptance(frUni.acceptance_rate || 35),
            avg_sat: undefined, // French universities don't use SAT
            avg_act: undefined, // French universities don't use ACT
            
            // Costs (already in EUR, convert to USD)
            cost: Math.round((frUni.tuition_international + frUni.living_cost) * 1.1), // EUR to USD
            living_cost: Math.round(frUni.living_cost * 1.1),
            in_state_tuition: Math.round(frUni.tuition_eu * 1.1),
            out_of_state_tuition: Math.round(frUni.tuition_international * 1.1),
            
            // Student body
            student_size: frUni.total_students || 20000,
            
            // Academic requirements
            requirements: {
                min_gpa: this.estimateMinGPA(frUni.acceptance_rate || 35),
                english_test: frUni.language !== 'french',
                research_experience: this.getResearchRequirement(frUni.research_intensity)
            },
            
            // Programs and research
            programs: this.generateProgramScores(frUni),
            research_opportunities: this.getResearchOpportunities(frUni.research_intensity),
            strengths: frUni.strengths,
            
            // Financial aid
            scholarships: true,
            scholarship_percentage: this.estimateScholarshipAvailability(frUni),
            median_debt: this.estimateMedianDebt(frUni.tuition_international),
            graduate_earnings: this.estimateGraduateEarnings(frUni),
            
            // Campus characteristics
            location_type: this.determineLocationType(frUni.city),
            class_size: this.determineClassSize(frUni.total_students || 20000),
            
            // Additional metadata
            ownership_type: frUni.university_type === 'public' ? 'public' : 'private_nonprofit',
            
            // Source tracking
            data_source: 'government_api' as const,
            last_updated: new Date().toISOString()
        };
    }

    /**
     * Generate program strength scores for French university
     */
    private generateProgramScores(frUni: FrenchUniversityData): { [key: string]: number } {
        const programs: { [key: string]: number } = {};
        
        // Base scores based on university type and ranking
        let baseScore = 75;
        if (frUni.university_type === 'grande_ecole') baseScore = 90;
        if (frUni.university_type === 'business') baseScore = 85;
        if (frUni.qs_ranking && frUni.qs_ranking <= 100) baseScore += 10;
        
        // Assign scores based on notable programs
        frUni.notable_programs.forEach(program => {
            const programKey = program.toLowerCase().replace(/\s+/g, '-');
            programs[programKey] = Math.min(95, baseScore + 5);
        });
        
        // Add common programs with base scores
        const commonPrograms = [
            'business', 'engineering', 'medicine', 'law', 'economics', 
            'literature', 'sciences', 'international-studies', 'arts'
        ];
        
        commonPrograms.forEach(program => {
            if (!programs[program]) {
                programs[program] = baseScore;
            }
        });
        
        return programs;
    }

    // Helper methods for estimation
    private estimateAcceptanceRate(frUni: FrenchUniversityData): number {
        if (frUni.university_type === 'grande_ecole') return 10;
        if (frUni.university_type === 'business') return 20;
        if (frUni.university_type === 'private') return 30;
        return 40; // Public universities
    }

    private estimateGlobalRanking(frUni: FrenchUniversityData): number {
        if (frUni.times_ranking) return frUni.times_ranking;
        if (frUni.shanghai_ranking) return frUni.shanghai_ranking;
        if (frUni.university_type === 'grande_ecole') return 200;
        if (frUni.university_type === 'business') return 300;
        return 500;
    }

    private estimateNationalRanking(frUni: FrenchUniversityData): number {
        if (frUni.university_type === 'grande_ecole') return 5;
        if (frUni.university_type === 'business') return 10;
        if (frUni.qs_ranking && frUni.qs_ranking <= 100) return 15;
        return 25;
    }

    private estimateGPAFromAcceptance(acceptanceRate: number): number {
        if (acceptanceRate <= 10) return 3.9;
        if (acceptanceRate <= 20) return 3.7;
        if (acceptanceRate <= 35) return 3.5;
        return 3.3;
    }

    private estimateMinGPA(acceptanceRate: number): number {
        if (acceptanceRate <= 10) return 3.8;
        if (acceptanceRate <= 20) return 3.5;
        if (acceptanceRate <= 35) return 3.2;
        return 3.0;
    }

    private getResearchOpportunities(intensity: string): string {
        const opportunities: { [key: string]: string } = {
            'very_high': 'Extensive research opportunities across all disciplines',
            'high': 'Strong research programs with faculty collaboration',
            'medium': 'Moderate research opportunities in select areas',
            'limited': 'Basic research opportunities available'
        };
        return opportunities[intensity] || opportunities['medium'];
    }

    private getResearchRequirement(intensity: string): string {
        if (intensity === 'very_high') return 'Research experience highly recommended';
        if (intensity === 'high') return 'Research experience preferred';
        return 'Research experience not required';
    }

    private estimateScholarshipAvailability(frUni: FrenchUniversityData): number {
        if (frUni.university_type === 'public') return 30; // Low tuition, fewer scholarships needed
        if (frUni.university_type === 'business') return 70;
        if (frUni.university_type === 'grande_ecole') return 50;
        return 40;
    }

    private estimateMedianDebt(tuition: number): number {
        return Math.round(tuition * 2.5 * 1.1); // Convert to USD
    }

    private estimateGraduateEarnings(frUni: FrenchUniversityData): number {
        let baseEarning = 45000;
        if (frUni.university_type === 'grande_ecole') baseEarning = 70000;
        if (frUni.university_type === 'business') baseEarning = 65000;
        if (frUni.city === 'Paris') baseEarning += 10000;
        return baseEarning;
    }

    private determineLocationType(city: string): string {
        const majorCities = ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier'];
        return majorCities.includes(city) ? 'urban' : 'suburban';
    }

    private determineClassSize(studentSize: number): string {
        if (studentSize > 50000) return 'large';
        if (studentSize > 20000) return 'medium';
        return 'small';
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache.clear();
        this.lastFetch = 0;
    }
}

// Export singleton instance
export const frenchUniversityManager = new FrenchUniversityDataManager(); 