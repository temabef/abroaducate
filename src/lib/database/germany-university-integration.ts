// German University Database Integration System
// Phase 2.3: European Expansion - German Universities

import type { EnhancedUniversity } from './university-integration';

// German University Rankings Data (Based on CHE, QS, Times Higher Education)
export interface GermanUniversityData {
    id: string;
    name: string;
    city: string;
    state: string;
    region: string;
    established: number;
    che_ranking?: number;
    qs_ranking?: number;
    times_ranking?: number;
    acceptance_rate?: number;
    tuition_eu: number; // Usually 0 or very low
    tuition_non_eu: number; // Usually 0 or low
    semester_fee: number; // Administrative fees
    living_cost: number;
    total_students?: number;
    international_students_percentage?: number;
    university_type: 'technical' | 'research' | 'applied_sciences' | 'art_music' | 'specialized' | 'private';
    language: 'german' | 'english' | 'bilingual';
    research_intensity: 'very_high' | 'high' | 'medium' | 'limited';
    notable_programs: string[];
    strengths: string[];
    website: string;
    tu9_member: boolean; // TU9 (Technical Universities Excellence)
    u15_member: boolean; // German Universities Excellence Initiative
}

// Top 50+ German Universities Database (2025 Data)
export const GERMAN_UNIVERSITIES: GermanUniversityData[] = [
    // TU9 TECHNICAL UNIVERSITIES (Engineering Excellence)
    {
        id: 'de-tu-munich',
        name: 'Technical University of Munich',
        city: 'Munich',
        state: 'Bavaria',
        region: 'Southern Germany',
        established: 1868,
        che_ranking: 1,
        qs_ranking: 37,
        times_ranking: 30,
        acceptance_rate: 25,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 150,
        living_cost: 12000,
        total_students: 45000,
        international_students_percentage: 35,
        university_type: 'technical',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Engineering', 'Computer Science', 'Physics', 'Mathematics', 'Architecture'],
        strengths: ['engineering-excellence', 'research-powerhouse', 'industry-partnerships', 'innovation-hub'],
        website: 'https://www.tum.de',
        tu9_member: true,
        u15_member: true
    },
    {
        id: 'de-rwth-aachen',
        name: 'RWTH Aachen University',
        city: 'Aachen',
        state: 'North Rhine-Westphalia',
        region: 'Western Germany',
        established: 1870,
        che_ranking: 2,
        qs_ranking: 106,
        times_ranking: 108,
        acceptance_rate: 30,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 320,
        living_cost: 10500,
        total_students: 47000,
        international_students_percentage: 22,
        university_type: 'technical',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Mechanical Engineering', 'Electrical Engineering', 'Computer Science', 'Materials Science'],
        strengths: ['engineering-powerhouse', 'automotive-research', 'industry-connections', 'european-location'],
        website: 'https://www.rwth-aachen.de',
        tu9_member: true,
        u15_member: true
    },
    {
        id: 'de-kit-karlsruhe',
        name: 'Karlsruhe Institute of Technology',
        city: 'Karlsruhe',
        state: 'Baden-Württemberg',
        region: 'Southern Germany',
        established: 1825,
        che_ranking: 3,
        qs_ranking: 119,
        times_ranking: 133,
        acceptance_rate: 28,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 180,
        living_cost: 11000,
        total_students: 25000,
        international_students_percentage: 25,
        university_type: 'technical',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Computer Science', 'Physics', 'Engineering', 'Mathematics', 'Chemistry'],
        strengths: ['research-excellence', 'computer-science', 'physics-research', 'innovation'],
        website: 'https://www.kit.edu',
        tu9_member: true,
        u15_member: true
    },
    {
        id: 'de-tu-berlin',
        name: 'Technical University of Berlin',
        city: 'Berlin',
        state: 'Berlin',
        region: 'Eastern Germany',
        established: 1879,
        che_ranking: 4,
        qs_ranking: 154,
        times_ranking: 149,
        acceptance_rate: 35,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 350,
        living_cost: 11500,
        total_students: 35000,
        international_students_percentage: 28,
        university_type: 'technical',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Engineering', 'Computer Science', 'Architecture', 'Economics', 'Planning'],
        strengths: ['capital-location', 'startup-ecosystem', 'international-focus', 'innovation'],
        website: 'https://www.tu-berlin.de',
        tu9_member: true,
        u15_member: false
    },
    {
        id: 'de-tu-dresden',
        name: 'Technical University of Dresden',
        city: 'Dresden',
        state: 'Saxony',
        region: 'Eastern Germany',
        established: 1828,
        che_ranking: 5,
        qs_ranking: 173,
        times_ranking: 169,
        acceptance_rate: 32,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 290,
        living_cost: 9500,
        total_students: 32000,
        international_students_percentage: 18,
        university_type: 'technical',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Engineering', 'Medicine', 'Natural Sciences', 'Computer Science'],
        strengths: ['research-excellence', 'affordable-living', 'historic-city', 'comprehensive-programs'],
        website: 'https://tu-dresden.de',
        tu9_member: true,
        u15_member: true
    },

    // TRADITIONAL RESEARCH UNIVERSITIES
    {
        id: 'de-lmu-munich',
        name: 'Ludwig Maximilian University of Munich',
        city: 'Munich',
        state: 'Bavaria',
        region: 'Southern Germany',
        established: 1472,
        che_ranking: 6,
        qs_ranking: 54,
        times_ranking: 32,
        acceptance_rate: 20,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 150,
        living_cost: 12000,
        total_students: 52000,
        international_students_percentage: 18,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Medicine', 'Law', 'Philosophy', 'Physics', 'Biology'],
        strengths: ['historic-prestige', 'research-excellence', 'comprehensive-university', 'munich-location'],
        website: 'https://www.lmu.de',
        tu9_member: false,
        u15_member: true
    },
    {
        id: 'de-heidelberg',
        name: 'Heidelberg University',
        city: 'Heidelberg',
        state: 'Baden-Württemberg',
        region: 'Southern Germany',
        established: 1386,
        che_ranking: 7,
        qs_ranking: 87,
        times_ranking: 44,
        acceptance_rate: 18,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 180,
        living_cost: 11500,
        total_students: 30000,
        international_students_percentage: 20,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Medicine', 'Natural Sciences', 'Law', 'Philosophy', 'Theology'],
        strengths: ['oldest-university', 'medical-excellence', 'research-prestige', 'beautiful-city'],
        website: 'https://www.uni-heidelberg.de',
        tu9_member: false,
        u15_member: true
    },
    {
        id: 'de-humboldt-berlin',
        name: 'Humboldt University of Berlin',
        city: 'Berlin',
        state: 'Berlin',
        region: 'Eastern Germany',
        established: 1810,
        che_ranking: 8,
        qs_ranking: 120,
        times_ranking: 74,
        acceptance_rate: 22,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 320,
        living_cost: 11500,
        total_students: 35000,
        international_students_percentage: 19,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Philosophy', 'History', 'Law', 'Medicine', 'Natural Sciences'],
        strengths: ['historic-prestige', 'capital-location', 'humanities-excellence', 'research-tradition'],
        website: 'https://www.hu-berlin.de',
        tu9_member: false,
        u15_member: true
    },
    {
        id: 'de-fu-berlin',
        name: 'Free University of Berlin',
        city: 'Berlin',
        state: 'Berlin',
        region: 'Eastern Germany',
        established: 1948,
        che_ranking: 9,
        qs_ranking: 118,
        times_ranking: 83,
        acceptance_rate: 25,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 350,
        living_cost: 11500,
        total_students: 38000,
        international_students_percentage: 23,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Political Science', 'Medicine', 'Law', 'Philosophy', 'Biology'],
        strengths: ['international-focus', 'political-science', 'liberal-tradition', 'research-excellence'],
        website: 'https://www.fu-berlin.de',
        tu9_member: false,
        u15_member: true
    },
    {
        id: 'de-goettingen',
        name: 'University of Göttingen',
        city: 'Göttingen',
        state: 'Lower Saxony',
        region: 'Northern Germany',
        established: 1737,
        che_ranking: 10,
        qs_ranking: 214,
        times_ranking: 113,
        acceptance_rate: 28,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 380,
        living_cost: 9500,
        total_students: 31000,
        international_students_percentage: 15,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Physics', 'Mathematics', 'Medicine', 'Law', 'Theology'],
        strengths: ['nobel-prize-tradition', 'physics-excellence', 'research-heritage', 'affordable-living'],
        website: 'https://www.uni-goettingen.de',
        tu9_member: false,
        u15_member: true
    },

    // UNIVERSITIES OF APPLIED SCIENCES (Practical Focus)
    {
        id: 'de-haw-hamburg',
        name: 'Hamburg University of Applied Sciences',
        city: 'Hamburg',
        state: 'Hamburg',
        region: 'Northern Germany',
        established: 1970,
        che_ranking: 11,
        acceptance_rate: 45,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 330,
        living_cost: 11000,
        total_students: 17000,
        international_students_percentage: 12,
        university_type: 'applied_sciences',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Business', 'Computer Science', 'Design', 'Media'],
        strengths: ['practical-focus', 'industry-partnerships', 'port-city', 'applied-research'],
        website: 'https://www.haw-hamburg.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-hs-munich',
        name: 'Munich University of Applied Sciences',
        city: 'Munich',
        state: 'Bavaria',
        region: 'Southern Germany',
        established: 1971,
        che_ranking: 12,
        acceptance_rate: 42,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 150,
        living_cost: 12000,
        total_students: 18000,
        international_students_percentage: 20,
        university_type: 'applied_sciences',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Business', 'Computer Science', 'Design', 'Social Work'],
        strengths: ['practical-education', 'munich-location', 'industry-connections', 'modern-facilities'],
        website: 'https://www.hm.edu',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-fh-aachen',
        name: 'FH Aachen University of Applied Sciences',
        city: 'Aachen',
        state: 'North Rhine-Westphalia',
        region: 'Western Germany',
        established: 1971,
        che_ranking: 13,
        acceptance_rate: 48,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 290,
        living_cost: 10500,
        total_students: 15000,
        international_students_percentage: 25,
        university_type: 'applied_sciences',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Business', 'Architecture', 'Design', 'Computer Science'],
        strengths: ['engineering-focus', 'international-programs', 'border-location', 'practical-training'],
        website: 'https://www.fh-aachen.de',
        tu9_member: false,
        u15_member: false
    },

    // ADDITIONAL RESEARCH UNIVERSITIES
    {
        id: 'de-tu-darmstadt',
        name: 'Technical University of Darmstadt',
        city: 'Darmstadt',
        state: 'Hesse',
        region: 'Central Germany',
        established: 1877,
        che_ranking: 14,
        qs_ranking: 269,
        acceptance_rate: 33,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 350,
        living_cost: 11000,
        total_students: 26000,
        international_students_percentage: 18,
        university_type: 'technical',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Computer Science', 'Engineering', 'Architecture', 'Mathematics'],
        strengths: ['computer-science-excellence', 'research-focus', 'industry-partnerships', 'innovation'],
        website: 'https://www.tu-darmstadt.de',
        tu9_member: true,
        u15_member: false
    },
    {
        id: 'de-uni-stuttgart',
        name: 'University of Stuttgart',
        city: 'Stuttgart',
        state: 'Baden-Württemberg',
        region: 'Southern Germany',
        established: 1829,
        che_ranking: 15,
        qs_ranking: 279,
        acceptance_rate: 35,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 180,
        living_cost: 11500,
        total_students: 27000,
        international_students_percentage: 22,
        university_type: 'technical',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Aerospace Engineering', 'Automotive Engineering', 'Computer Science', 'Architecture'],
        strengths: ['automotive-industry', 'aerospace-research', 'engineering-excellence', 'industry-hub'],
        website: 'https://www.uni-stuttgart.de',
        tu9_member: true,
        u15_member: false
    },
    {
        id: 'de-uni-freiburg',
        name: 'University of Freiburg',
        city: 'Freiburg',
        state: 'Baden-Württemberg',
        region: 'Southern Germany',
        established: 1457,
        che_ranking: 16,
        qs_ranking: 192,
        times_ranking: 108,
        acceptance_rate: 24,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 180,
        living_cost: 11000,
        total_students: 25000,
        international_students_percentage: 16,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Medicine', 'Law', 'Natural Sciences', 'Humanities', 'Economics'],
        strengths: ['research-excellence', 'beautiful-location', 'comprehensive-university', 'international-focus'],
        website: 'https://www.uni-freiburg.de',
        tu9_member: false,
        u15_member: true
    },
    {
        id: 'de-uni-cologne',
        name: 'University of Cologne',
        city: 'Cologne',
        state: 'North Rhine-Westphalia',
        region: 'Western Germany',
        established: 1388,
        che_ranking: 17,
        qs_ranking: 145,
        acceptance_rate: 26,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 290,
        living_cost: 11000,
        total_students: 48000,
        international_students_percentage: 14,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Economics', 'Law', 'Medicine', 'Philosophy', 'Business'],
        strengths: ['business-economics', 'large-student-body', 'historic-city', 'comprehensive-programs'],
        website: 'https://www.uni-koeln.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-hamburg',
        name: 'University of Hamburg',
        city: 'Hamburg',
        state: 'Hamburg',
        region: 'Northern Germany',
        established: 1919,
        che_ranking: 18,
        qs_ranking: 205,
        acceptance_rate: 30,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 330,
        living_cost: 11000,
        total_students: 43000,
        international_students_percentage: 12,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Law', 'Medicine', 'Economics', 'Natural Sciences', 'Humanities'],
        strengths: ['port-city', 'media-industry', 'comprehensive-university', 'international-trade'],
        website: 'https://www.uni-hamburg.de',
        tu9_member: false,
        u15_member: false
    },

    // SPECIALIZED & PRIVATE UNIVERSITIES
    {
        id: 'de-mannheim',
        name: 'University of Mannheim',
        city: 'Mannheim',
        state: 'Baden-Württemberg',
        region: 'Southern Germany',
        established: 1967,
        che_ranking: 19,
        qs_ranking: 341,
        acceptance_rate: 22,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 180,
        living_cost: 11000,
        total_students: 12000,
        international_students_percentage: 25,
        university_type: 'specialized',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Business Administration', 'Economics', 'Social Sciences', 'Computer Science'],
        strengths: ['business-excellence', 'economics-focus', 'industry-connections', 'international-programs'],
        website: 'https://www.uni-mannheim.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-esmt-berlin',
        name: 'ESMT Berlin',
        city: 'Berlin',
        state: 'Berlin',
        region: 'Eastern Germany',
        established: 2002,
        che_ranking: 20,
        acceptance_rate: 15,
        tuition_eu: 45000,
        tuition_non_eu: 45000,
        semester_fee: 0,
        living_cost: 11500,
        total_students: 1500,
        international_students_percentage: 85,
        university_type: 'private',
        language: 'english',
        research_intensity: 'high',
        notable_programs: ['MBA', 'Management', 'Technology Management', 'Innovation'],
        strengths: ['business-school-excellence', 'international-focus', 'executive-education', 'berlin-location'],
        website: 'https://www.esmt.org',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-bonn',
        name: 'University of Bonn',
        city: 'Bonn',
        state: 'North Rhine-Westphalia',
        region: 'Western Germany',
        established: 1818,
        che_ranking: 21,
        qs_ranking: 240,
        times_ranking: 201,
        acceptance_rate: 40,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 320,
        living_cost: 10800,
        total_students: 38000,
        international_students_percentage: 16,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Mathematics', 'Economics', 'Agriculture', 'Law', 'Medicine'],
        strengths: ['research-excellence', 'mathematics-center', 'international-relations', 'historic-campus'],
        website: 'https://www.uni-bonn.de',
        tu9_member: false,
        u15_member: true
    },
    {
        id: 'de-uni-jena',
        name: 'University of Jena',
        city: 'Jena',
        state: 'Thuringia',
        region: 'Eastern Germany',
        established: 1558,
        che_ranking: 22,
        qs_ranking: 350,
        times_ranking: 330,
        acceptance_rate: 50,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 250,
        living_cost: 9200,
        total_students: 18000,
        international_students_percentage: 12,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Optics', 'Physics', 'Philosophy', 'Biology', 'Psychology'],
        strengths: ['optics-research', 'affordable-living', 'historic-university', 'science-focus'],
        website: 'https://www.uni-jena.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-konstanz',
        name: 'University of Konstanz',
        city: 'Konstanz',
        state: 'Baden-Württemberg',
        region: 'Southern Germany',
        established: 1966,
        che_ranking: 23,
        qs_ranking: 420,
        times_ranking: 350,
        acceptance_rate: 45,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 180,
        living_cost: 11500,
        total_students: 11000,
        international_students_percentage: 14,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Political Science', 'Biology', 'Psychology', 'Computer Science', 'Economics'],
        strengths: ['lake-constance-location', 'research-focus', 'international-atmosphere', 'excellence-initiative'],
        website: 'https://www.uni-konstanz.de',
        tu9_member: false,
        u15_member: true
    },
    {
        id: 'de-uni-frankfurt',
        name: 'Goethe University Frankfurt',
        city: 'Frankfurt',
        state: 'Hesse',
        region: 'Central Germany',
        established: 1914,
        che_ranking: 24,
        qs_ranking: 280,
        times_ranking: 210,
        acceptance_rate: 42,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 380,
        living_cost: 12000,
        total_students: 48000,
        international_students_percentage: 20,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Finance', 'Economics', 'Law', 'Social Sciences', 'Medicine'],
        strengths: ['finance-hub', 'european-central-bank-proximity', 'business-connections', 'research-excellence'],
        website: 'https://www.uni-frankfurt.de',
        tu9_member: false,
        u15_member: true
    },
    {
        id: 'de-uni-kiel',
        name: 'University of Kiel',
        city: 'Kiel',
        state: 'Schleswig-Holstein',
        region: 'Northern Germany',
        established: 1665,
        che_ranking: 25,
        qs_ranking: 480,
        times_ranking: 420,
        acceptance_rate: 55,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 260,
        living_cost: 10000,
        total_students: 27000,
        international_students_percentage: 10,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Marine Sciences', 'Medicine', 'Economics', 'Agriculture', 'Computer Science'],
        strengths: ['marine-research', 'baltic-sea-location', 'sustainable-development', 'affordable-living'],
        website: 'https://www.uni-kiel.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-muenster',
        name: 'University of Münster',
        city: 'Münster',
        state: 'North Rhine-Westphalia',
        region: 'Western Germany',
        established: 1780,
        che_ranking: 26,
        qs_ranking: 390,
        times_ranking: 360,
        acceptance_rate: 48,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 310,
        living_cost: 10500,
        total_students: 45000,
        international_students_percentage: 12,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Law', 'Business', 'Medicine', 'Religious Studies', 'Natural Sciences'],
        strengths: ['bicycle-friendly-city', 'student-atmosphere', 'interdisciplinary-research', 'historic-city'],
        website: 'https://www.uni-muenster.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-erlangen',
        name: 'University of Erlangen-Nuremberg',
        city: 'Erlangen',
        state: 'Bavaria',
        region: 'Southern Germany',
        established: 1743,
        che_ranking: 27,
        qs_ranking: 340,
        times_ranking: 320,
        acceptance_rate: 45,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 140,
        living_cost: 10800,
        total_students: 39000,
        international_students_percentage: 15,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Engineering', 'Medicine', 'Business', 'Computer Science', 'Materials Science'],
        strengths: ['industry-partnerships', 'medical-technology', 'engineering-excellence', 'siemens-cooperation'],
        website: 'https://www.fau.eu',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-mainz',
        name: 'Johannes Gutenberg University Mainz',
        city: 'Mainz',
        state: 'Rhineland-Palatinate',
        region: 'Western Germany',
        established: 1477,
        che_ranking: 28,
        qs_ranking: 440,
        times_ranking: 390,
        acceptance_rate: 52,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 320,
        living_cost: 10500,
        total_students: 31000,
        international_students_percentage: 14,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Media Studies', 'Medicine', 'Chemistry', 'Translation', 'Music'],
        strengths: ['media-hub', 'interdisciplinary-approach', 'historic-tradition', 'student-friendly'],
        website: 'https://www.uni-mainz.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-bremen',
        name: 'University of Bremen',
        city: 'Bremen',
        state: 'Bremen',
        region: 'Northern Germany',
        established: 1971,
        che_ranking: 29,
        qs_ranking: 460,
        times_ranking: 420,
        acceptance_rate: 58,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 380,
        living_cost: 10200,
        total_students: 19000,
        international_students_percentage: 17,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Marine Sciences', 'Social Sciences', 'Space Technology', 'Materials Science', 'Global Studies'],
        strengths: ['marine-research', 'space-technology', 'social-sciences', 'international-outlook'],
        website: 'https://www.uni-bremen.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-rostock',
        name: 'University of Rostock',
        city: 'Rostock',
        state: 'Mecklenburg-Vorpommern',
        region: 'Northern Germany',
        established: 1419,
        che_ranking: 64,
        qs_ranking: 630,
        times_ranking: 600,
        acceptance_rate: 68,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 230,
        living_cost: 9400,
        total_students: 14000,
        international_students_percentage: 11,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Maritime Systems', 'Medicine', 'Life Sciences', 'Engineering', 'Computer Science'],
        strengths: ['baltic-sea-location', 'maritime-research', 'historic-university', 'affordable-living'],
        website: 'https://www.uni-rostock.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-giessen',
        name: 'University of Giessen',
        city: 'Giessen',
        state: 'Hesse',
        region: 'Central Germany',
        established: 1607,
        che_ranking: 31,
        qs_ranking: 580,
        times_ranking: 520,
        acceptance_rate: 58,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 310,
        living_cost: 9500,
        total_students: 28000,
        international_students_percentage: 12,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Agriculture', 'Veterinary Medicine', 'Life Sciences', 'Cultural Studies', 'Education'],
        strengths: ['agricultural-research', 'affordable-living', 'life-sciences', 'veterinary-medicine'],
        website: 'https://www.uni-giessen.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-potsdam',
        name: 'University of Potsdam',
        city: 'Potsdam',
        state: 'Brandenburg',
        region: 'Eastern Germany',
        established: 1991,
        che_ranking: 32,
        qs_ranking: 600,
        times_ranking: 550,
        acceptance_rate: 62,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 290,
        living_cost: 10500,
        total_students: 21000,
        international_students_percentage: 15,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Earth Sciences', 'Computer Science', 'Cognitive Sciences', 'Sports Science', 'Jewish Studies'],
        strengths: ['berlin-proximity', 'research-institutes-network', 'beautiful-campus', 'cognitive-sciences'],
        website: 'https://www.uni-potsdam.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-passau',
        name: 'University of Passau',
        city: 'Passau',
        state: 'Bavaria',
        region: 'Southern Germany',
        established: 1978,
        che_ranking: 33,
        qs_ranking: 650,
        times_ranking: 600,
        acceptance_rate: 65,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 150,
        living_cost: 9800,
        total_students: 12000,
        international_students_percentage: 16,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Law', 'Business', 'Computer Science', 'International Studies', 'Cultural Studies'],
        strengths: ['international-focus', 'border-location', 'language-center', 'digitalization-focus'],
        website: 'https://www.uni-passau.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-bayreuth',
        name: 'University of Bayreuth',
        city: 'Bayreuth',
        state: 'Bavaria',
        region: 'Southern Germany',
        established: 1975,
        che_ranking: 34,
        qs_ranking: 620,
        times_ranking: 580,
        acceptance_rate: 60,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 150,
        living_cost: 9500,
        total_students: 13000,
        international_students_percentage: 12,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Economics', 'African Studies', 'Sports Economics', 'Polymer Science', 'Environmental Science'],
        strengths: ['interdisciplinary-approach', 'african-studies', 'ecological-research', 'small-campus'],
        website: 'https://www.uni-bayreuth.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-siegen',
        name: 'University of Siegen',
        city: 'Siegen',
        state: 'North Rhine-Westphalia',
        region: 'Western Germany',
        established: 1972,
        che_ranking: 35,
        qs_ranking: 700,
        times_ranking: 650,
        acceptance_rate: 68,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 300,
        living_cost: 9200,
        total_students: 18000,
        international_students_percentage: 13,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Media Studies', 'Economics', 'Education', 'Architecture'],
        strengths: ['engineering-focus', 'affordable-living', 'small-classes', 'practical-orientation'],
        website: 'https://www.uni-siegen.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-jacobs-university',
        name: 'Jacobs University Bremen',
        city: 'Bremen',
        state: 'Bremen',
        region: 'Northern Germany',
        established: 2001,
        che_ranking: 36,
        qs_ranking: 750,
        times_ranking: 700,
        acceptance_rate: 40,
        tuition_eu: 20000,
        tuition_non_eu: 20000,
        semester_fee: 0,
        living_cost: 12000,
        total_students: 1500,
        international_students_percentage: 80,
        university_type: 'private',
        language: 'english',
        research_intensity: 'high',
        notable_programs: ['Computer Science', 'International Business', 'Psychology', 'Global Economics', 'Robotics'],
        strengths: ['international-campus', 'english-instruction', 'small-classes', 'research-opportunities'],
        website: 'https://www.jacobs-university.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-hs-bochum',
        name: 'Bochum University of Applied Sciences',
        city: 'Bochum',
        state: 'North Rhine-Westphalia',
        region: 'Western Germany',
        established: 1971,
        che_ranking: 37,
        acceptance_rate: 75,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 340,
        living_cost: 9800,
        total_students: 8000,
        international_students_percentage: 10,
        university_type: 'applied_sciences',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Business', 'Sustainable Development', 'Architecture', 'Healthcare'],
        strengths: ['practical-orientation', 'industry-connections', 'ruhr-area-location', 'sustainable-campus'],
        website: 'https://www.hochschule-bochum.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-hmtm-hannover',
        name: 'Hannover University of Music, Drama and Media',
        city: 'Hannover',
        state: 'Lower Saxony',
        region: 'Northern Germany',
        established: 1897,
        che_ranking: 38,
        acceptance_rate: 20,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 390,
        living_cost: 10500,
        total_students: 1500,
        international_students_percentage: 40,
        university_type: 'art_music',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Music Performance', 'Music Education', 'Media Management', 'Acting', 'Sound Design'],
        strengths: ['music-excellence', 'international-competitions', 'performance-opportunities', 'cultural-hub'],
        website: 'https://www.hmtm-hannover.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-ulm',
        name: 'University of Ulm',
        city: 'Ulm',
        state: 'Baden-Württemberg',
        region: 'Southern Germany',
        established: 1967,
        che_ranking: 39,
        qs_ranking: 340,
        times_ranking: 310,
        acceptance_rate: 50,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 170,
        living_cost: 10000,
        total_students: 10000,
        international_students_percentage: 15,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Medicine', 'Computer Science', 'Engineering', 'Mathematics', 'Physics'],
        strengths: ['medical-research', 'quantum-technology', 'science-focus', 'einstein-birthplace'],
        website: 'https://www.uni-ulm.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-marburg',
        name: 'University of Marburg',
        city: 'Marburg',
        state: 'Hesse',
        region: 'Central Germany',
        established: 1527,
        che_ranking: 40,
        qs_ranking: 520,
        times_ranking: 480,
        acceptance_rate: 55,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 310,
        living_cost: 9800,
        total_students: 25000,
        international_students_percentage: 12,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Medicine', 'Psychology', 'Peace Studies', 'Pharmaceutical Sciences', 'German Literature'],
        strengths: ['historic-university', 'medieval-town', 'pharmaceutical-research', 'student-atmosphere'],
        website: 'https://www.uni-marburg.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-duesseldorf',
        name: 'Heinrich Heine University Düsseldorf',
        city: 'Düsseldorf',
        state: 'North Rhine-Westphalia',
        region: 'Western Germany',
        established: 1965,
        che_ranking: 41,
        qs_ranking: 530,
        times_ranking: 490,
        acceptance_rate: 58,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 300,
        living_cost: 11000,
        total_students: 35000,
        international_students_percentage: 15,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Medicine', 'Business', 'Law', 'Media Studies', 'Natural Sciences'],
        strengths: ['medical-research', 'business-hub', 'international-focus', 'cultural-city'],
        website: 'https://www.uni-duesseldorf.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-wuerzburg',
        name: 'University of Würzburg',
        city: 'Würzburg',
        state: 'Bavaria',
        region: 'Southern Germany',
        established: 1402,
        che_ranking: 42,
        qs_ranking: 540,
        times_ranking: 500,
        acceptance_rate: 52,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 140,
        living_cost: 10000,
        total_students: 28000,
        international_students_percentage: 10,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Medicine', 'Biology', 'Physics', 'Psychology', 'Teacher Education'],
        strengths: ['medical-research', 'historic-university', 'nobel-laureates', 'beautiful-city'],
        website: 'https://www.uni-wuerzburg.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-hannover',
        name: 'Leibniz University Hannover',
        city: 'Hannover',
        state: 'Lower Saxony',
        region: 'Northern Germany',
        established: 1831,
        che_ranking: 43,
        qs_ranking: 560,
        times_ranking: 520,
        acceptance_rate: 60,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 380,
        living_cost: 10500,
        total_students: 30000,
        international_students_percentage: 14,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Engineering', 'Natural Sciences', 'Law', 'Economics', 'Humanities'],
        strengths: ['engineering-focus', 'research-excellence', 'industry-connections', 'quantum-technology'],
        website: 'https://www.uni-hannover.de',
        tu9_member: true,
        u15_member: false
    },
    {
        id: 'de-uni-saarland',
        name: 'Saarland University',
        city: 'Saarbrücken',
        state: 'Saarland',
        region: 'Western Germany',
        established: 1948,
        che_ranking: 44,
        qs_ranking: 570,
        times_ranking: 530,
        acceptance_rate: 62,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 290,
        living_cost: 9800,
        total_students: 16000,
        international_students_percentage: 18,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Computer Science', 'Linguistics', 'Law', 'Medicine', 'European Studies'],
        strengths: ['computer-science-excellence', 'french-german-cooperation', 'border-location', 'ai-research'],
        website: 'https://www.uni-saarland.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-augsburg',
        name: 'University of Augsburg',
        city: 'Augsburg',
        state: 'Bavaria',
        region: 'Southern Germany',
        established: 1970,
        che_ranking: 65,
        qs_ranking: 640,
        times_ranking: 610,
        acceptance_rate: 69,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 130,
        living_cost: 9900,
        total_students: 20000,
        international_students_percentage: 14,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Business Administration', 'Law', 'Computer Science', 'Materials Science', 'Environmental Ethics'],
        strengths: ['business-focus', 'environmental-studies', 'historic-city', 'interdisciplinary-approach'],
        website: 'https://www.uni-augsburg.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-greifswald',
        name: 'University of Greifswald',
        city: 'Greifswald',
        state: 'Mecklenburg-Vorpommern',
        region: 'Northern Germany',
        established: 1456,
        che_ranking: 46,
        qs_ranking: 750,
        times_ranking: 700,
        acceptance_rate: 70,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 240,
        living_cost: 9200,
        total_students: 10000,
        international_students_percentage: 8,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Medicine', 'Baltic Studies', 'Law', 'Biology', 'Physics'],
        strengths: ['medical-research', 'baltic-sea-location', 'historic-university', 'affordable-living'],
        website: 'https://www.uni-greifswald.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-halle',
        name: 'Martin Luther University Halle-Wittenberg',
        city: 'Halle',
        state: 'Saxony-Anhalt',
        region: 'Eastern Germany',
        established: 1502,
        che_ranking: 47,
        qs_ranking: 670,
        times_ranking: 620,
        acceptance_rate: 68,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 230,
        living_cost: 9500,
        total_students: 21000,
        international_students_percentage: 10,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Agriculture', 'Medicine', 'Natural Sciences', 'Social Sciences', 'Humanities'],
        strengths: ['agricultural-research', 'reformation-history', 'affordable-living', 'cultural-heritage'],
        website: 'https://www.uni-halle.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-kassel',
        name: 'University of Kassel',
        city: 'Kassel',
        state: 'Hesse',
        region: 'Central Germany',
        established: 1971,
        che_ranking: 48,
        qs_ranking: 720,
        times_ranking: 680,
        acceptance_rate: 72,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 300,
        living_cost: 9800,
        total_students: 25000,
        international_students_percentage: 14,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Environmental Engineering', 'Organic Agriculture', 'Art', 'Social Work', 'Renewable Energy'],
        strengths: ['sustainability-focus', 'interdisciplinary-approach', 'organic-farming', 'art-documenta'],
        website: 'https://www.uni-kassel.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-magdeburg',
        name: 'Otto von Guericke University Magdeburg',
        city: 'Magdeburg',
        state: 'Saxony-Anhalt',
        region: 'Eastern Germany',
        established: 1993,
        che_ranking: 49,
        qs_ranking: 690,
        times_ranking: 650,
        acceptance_rate: 70,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 110,
        living_cost: 9200,
        total_students: 14000,
        international_students_percentage: 16,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Medicine', 'Economics', 'Computer Science', 'Natural Sciences'],
        strengths: ['engineering-focus', 'neuroscience-research', 'affordable-living', 'industry-connections'],
        website: 'https://www.ovgu.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-bayreuth',
        name: 'University of Bayreuth',
        city: 'Bayreuth',
        state: 'Bavaria',
        region: 'Southern Germany',
        established: 1975,
        che_ranking: 50,
        qs_ranking: 580,
        times_ranking: 540,
        acceptance_rate: 65,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 120,
        living_cost: 9800,
        total_students: 13500,
        international_students_percentage: 12,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['African Studies', 'Economics', 'Environmental Science', 'Law', 'Sports Science'],
        strengths: ['african-studies', 'environmental-research', 'interdisciplinary-approach', 'small-university'],
        website: 'https://www.uni-bayreuth.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-siegen',
        name: 'University of Siegen',
        city: 'Siegen',
        state: 'North Rhine-Westphalia',
        region: 'Western Germany',
        established: 1972,
        che_ranking: 51,
        qs_ranking: 750,
        times_ranking: 710,
        acceptance_rate: 75,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 280,
        living_cost: 9500,
        total_students: 19000,
        international_students_percentage: 13,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Media Studies', 'Economics', 'Education', 'Architecture'],
        strengths: ['media-research', 'engineering', 'affordable-living', 'small-city-environment'],
        website: 'https://www.uni-siegen.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-passau',
        name: 'University of Passau',
        city: 'Passau',
        state: 'Bavaria',
        region: 'Southern Germany',
        established: 1978,
        che_ranking: 52,
        qs_ranking: 680,
        times_ranking: 650,
        acceptance_rate: 70,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 130,
        living_cost: 9600,
        total_students: 12000,
        international_students_percentage: 16,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Law', 'Business Administration', 'Computer Science', 'Cultural Studies', 'International Relations'],
        strengths: ['border-location', 'digital-humanities', 'international-focus', 'small-university'],
        website: 'https://www.uni-passau.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-bamberg',
        name: 'University of Bamberg',
        city: 'Bamberg',
        state: 'Bavaria',
        region: 'Southern Germany',
        established: 1647,
        che_ranking: 53,
        qs_ranking: 720,
        times_ranking: 680,
        acceptance_rate: 72,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 120,
        living_cost: 9700,
        total_students: 13000,
        international_students_percentage: 10,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Psychology', 'Education', 'Information Systems', 'Oriental Studies', 'Linguistics'],
        strengths: ['historic-city', 'social-sciences', 'digital-humanities', 'unesco-heritage'],
        website: 'https://www.uni-bamberg.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-luebeck',
        name: 'University of Lübeck',
        city: 'Lübeck',
        state: 'Schleswig-Holstein',
        region: 'Northern Germany',
        established: 1964,
        che_ranking: 54,
        qs_ranking: 660,
        times_ranking: 630,
        acceptance_rate: 60,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 210,
        living_cost: 10200,
        total_students: 5500,
        international_students_percentage: 14,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Medicine', 'Computer Science', 'Medical Engineering', 'Life Sciences', 'Psychology'],
        strengths: ['medical-focus', 'life-sciences', 'baltic-sea-location', 'research-excellence'],
        website: 'https://www.uni-luebeck.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-koblenz',
        name: 'University of Koblenz',
        city: 'Koblenz',
        state: 'Rhineland-Palatinate',
        region: 'Western Germany',
        established: 1990,
        che_ranking: 55,
        qs_ranking: 750,
        times_ranking: 700,
        acceptance_rate: 75,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 300,
        living_cost: 9800,
        total_students: 9000,
        international_students_percentage: 10,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Computer Science', 'Education', 'Environmental Sciences', 'Cultural Studies', 'Mathematics'],
        strengths: ['rhine-location', 'computer-science', 'teacher-education', 'unesco-world-heritage'],
        website: 'https://www.uni-koblenz.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-hildesheim',
        name: 'University of Hildesheim',
        city: 'Hildesheim',
        state: 'Lower Saxony',
        region: 'Northern Germany',
        established: 1978,
        che_ranking: 56,
        qs_ranking: 770,
        times_ranking: 730,
        acceptance_rate: 78,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 380,
        living_cost: 9600,
        total_students: 8500,
        international_students_percentage: 12,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Education', 'Cultural Studies', 'Information Science', 'Translation', 'Psychology'],
        strengths: ['teacher-education', 'cultural-studies', 'small-university', 'personal-atmosphere'],
        website: 'https://www.uni-hildesheim.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-vechta',
        name: 'University of Vechta',
        city: 'Vechta',
        state: 'Lower Saxony',
        region: 'Northern Germany',
        established: 1995,
        che_ranking: 57,
        qs_ranking: 800,
        times_ranking: 750,
        acceptance_rate: 80,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 360,
        living_cost: 9200,
        total_students: 5500,
        international_students_percentage: 8,
        university_type: 'research',
        language: 'german',
        research_intensity: 'medium',
        notable_programs: ['Education', 'Social Work', 'Gerontology', 'Psychology', 'Cultural Studies'],
        strengths: ['teacher-education', 'social-sciences', 'rural-location', 'small-university'],
        website: 'https://www.uni-vechta.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-flensburg',
        name: 'University of Flensburg',
        city: 'Flensburg',
        state: 'Schleswig-Holstein',
        region: 'Northern Germany',
        established: 1946,
        che_ranking: 58,
        qs_ranking: 790,
        times_ranking: 740,
        acceptance_rate: 78,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 240,
        living_cost: 9500,
        total_students: 6000,
        international_students_percentage: 15,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Education', 'European Studies', 'Energy Sciences', 'Danish Studies', 'Economics'],
        strengths: ['danish-border-location', 'teacher-education', 'sustainability', 'scandinavian-studies'],
        website: 'https://www.uni-flensburg.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-erfurt',
        name: 'University of Erfurt',
        city: 'Erfurt',
        state: 'Thuringia',
        region: 'Eastern Germany',
        established: 1379,
        che_ranking: 59,
        qs_ranking: 730,
        times_ranking: 690,
        acceptance_rate: 73,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 220,
        living_cost: 9300,
        total_students: 6000,
        international_students_percentage: 10,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Education', 'Religious Studies', 'Communication', 'Public Policy', 'History'],
        strengths: ['teacher-education', 'humanities', 'historic-city', 'affordable-living'],
        website: 'https://www.uni-erfurt.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-weimar',
        name: 'Bauhaus University Weimar',
        city: 'Weimar',
        state: 'Thuringia',
        region: 'Eastern Germany',
        established: 1860,
        che_ranking: 60,
        qs_ranking: 600,
        times_ranking: 580,
        acceptance_rate: 65,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 210,
        living_cost: 9300,
        total_students: 4000,
        international_students_percentage: 27,
        university_type: 'specialized',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Architecture', 'Design', 'Civil Engineering', 'Media', 'Art'],
        strengths: ['bauhaus-tradition', 'creative-environment', 'design-excellence', 'cultural-heritage'],
        website: 'https://www.uni-weimar.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-osnabrueck',
        name: 'University of Osnabrück',
        city: 'Osnabrück',
        state: 'Lower Saxony',
        region: 'Northern Germany',
        established: 1974,
        che_ranking: 61,
        qs_ranking: 710,
        times_ranking: 670,
        acceptance_rate: 72,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 340,
        living_cost: 9700,
        total_students: 14000,
        international_students_percentage: 12,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Cognitive Science', 'Law', 'Economics', 'European Studies', 'Psychology'],
        strengths: ['cognitive-science', 'peace-city', 'european-focus', 'interdisciplinary-approach'],
        website: 'https://www.uni-osnabrueck.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-oldenburg',
        name: 'University of Oldenburg',
        city: 'Oldenburg',
        state: 'Lower Saxony',
        region: 'Northern Germany',
        established: 1973,
        che_ranking: 62,
        qs_ranking: 680,
        times_ranking: 640,
        acceptance_rate: 70,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 370,
        living_cost: 9800,
        total_students: 16000,
        international_students_percentage: 13,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Renewable Energy', 'Marine Sciences', 'Neuroscience', 'Education', 'Economics'],
        strengths: ['sustainability-focus', 'renewable-energy', 'north-sea-research', 'interdisciplinary'],
        website: 'https://www.uni-oldenburg.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-paderborn',
        name: 'University of Paderborn',
        city: 'Paderborn',
        state: 'North Rhine-Westphalia',
        region: 'Western Germany',
        established: 1972,
        che_ranking: 63,
        qs_ranking: 700,
        times_ranking: 660,
        acceptance_rate: 71,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 300,
        living_cost: 9600,
        total_students: 20000,
        international_students_percentage: 15,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Computer Science', 'Business Information Systems', 'Engineering', 'Cultural Studies', 'Mathematics'],
        strengths: ['computer-science', 'business-informatics', 'it-campus', 'industry-connections'],
        website: 'https://www.uni-paderborn.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-rostock',
        name: 'University of Rostock',
        city: 'Rostock',
        state: 'Mecklenburg-Vorpommern',
        region: 'Northern Germany',
        established: 1419,
        che_ranking: 64,
        qs_ranking: 630,
        times_ranking: 600,
        acceptance_rate: 68,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 230,
        living_cost: 9400,
        total_students: 14000,
        international_students_percentage: 11,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Maritime Systems', 'Medicine', 'Life Sciences', 'Engineering', 'Computer Science'],
        strengths: ['baltic-sea-location', 'maritime-research', 'historic-university', 'affordable-living'],
        website: 'https://www.uni-rostock.de',
        tu9_member: false,
        u15_member: false
    },
    {
        id: 'de-uni-augsburg',
        name: 'University of Augsburg',
        city: 'Augsburg',
        state: 'Bavaria',
        region: 'Southern Germany',
        established: 1970,
        che_ranking: 65,
        qs_ranking: 640,
        times_ranking: 610,
        acceptance_rate: 69,
        tuition_eu: 0,
        tuition_non_eu: 0,
        semester_fee: 130,
        living_cost: 9900,
        total_students: 20000,
        international_students_percentage: 14,
        university_type: 'research',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Business Administration', 'Law', 'Computer Science', 'Materials Science', 'Environmental Ethics'],
        strengths: ['business-focus', 'environmental-studies', 'historic-city', 'interdisciplinary-approach'],
        website: 'https://www.uni-augsburg.de',
        tu9_member: false,
        u15_member: false
    }
];

// Enhanced university conversion for German universities
export class GermanUniversityDataManager {
    private cache: Map<string, EnhancedUniversity[]> = new Map();
    private lastFetch: number = 0;
    private cacheTimeout: number = 86400000; // 24 hours

    /**
     * Fetch German universities with optional state filtering
     */
    async fetchGermanUniversities(state?: string, limit: number = 100): Promise<EnhancedUniversity[]> {
        const cacheKey = `german-${state || 'all'}-${limit}`;
        const now = Date.now();

        // Check cache
        if (this.cache.has(cacheKey) && (now - this.lastFetch) < this.cacheTimeout) {
            console.log(`📦 Returning cached German universities for ${state || 'all states'}`);
            return this.cache.get(cacheKey)!;
        }

        console.log(`🇩🇪 Fetching German universities from database for ${state || 'all states'}`);

        try {
            // Filter by state if specified
            let universities = GERMAN_UNIVERSITIES;
            if (state) {
                universities = universities.filter(uni => 
                    uni.state.toLowerCase() === state.toLowerCase()
                );
            }

            // Apply limit - ensure we can get all universities if needed
            universities = universities.slice(0, Math.min(limit, universities.length));

            // Convert to enhanced format
            const enhanced = universities.map(uni => this.convertToEnhanced(uni));

            // Cache the results
            this.cache.set(cacheKey, enhanced);
            this.lastFetch = now;

            console.log(`✅ Successfully processed ${enhanced.length} German universities`);
            return enhanced;

        } catch (error) {
            console.error('❌ Error fetching German universities:', error);
            return [];
        }
    }

    /**
     * Convert German university data to enhanced format
     */
    private convertToEnhanced(deUni: GermanUniversityData): EnhancedUniversity {
        // Generate program scores based on notable programs
        const programScores = this.generateProgramScores(deUni);

        // Calculate total cost (tuition + living + semester fee)
        const totalCost = deUni.tuition_non_eu + deUni.living_cost + (deUni.semester_fee * 2); // 2 semesters

        return {
            id: deUni.id,
            name: deUni.name,
            country: 'Germany',
            state: deUni.state,
            city: deUni.city,
            region: deUni.region,
            ranking: deUni.che_ranking,
            global_ranking: deUni.qs_ranking || this.estimateGlobalRanking(deUni.che_ranking || 50),
            national_ranking: deUni.che_ranking,
            acceptance_rate: deUni.acceptance_rate || this.estimateAcceptanceRate(deUni),
            avg_gpa: this.estimateGPAFromAcceptance(deUni.acceptance_rate || 35),
            avg_sat: undefined, // German universities don't use SAT
            avg_act: undefined, // German universities don't use ACT
            strengths: deUni.strengths,
            programs: programScores,
            requirements: {
                min_gpa: this.estimateMinGPA(deUni.acceptance_rate || 35),
                english_test: deUni.language === 'german' ? true : false,
                research_experience: this.getResearchRequirement(deUni.research_intensity)
            },
            cost: totalCost,
            living_cost: deUni.living_cost,
            in_state_tuition: deUni.tuition_eu + deUni.semester_fee * 2,
            out_of_state_tuition: deUni.tuition_non_eu + deUni.semester_fee * 2,
            scholarships: true,
            scholarship_percentage: this.estimateScholarshipAvailability(deUni),
            median_debt: this.estimateMedianDebt(deUni.tuition_non_eu),
            graduate_earnings: this.estimateGraduateEarnings(deUni),
            location_type: this.determineLocationType(deUni.city),
            class_size: this.determineClassSize(deUni.total_students || 25000),
            research_opportunities: this.getResearchOpportunities(deUni.research_intensity),
            student_size: deUni.total_students,
            ownership_type: deUni.university_type === 'private' ? 'private_nonprofit' : 'public',
            website_url: deUni.website,
            data_source: 'hardcoded',
            last_updated: new Date().toISOString()
        };
    }

    private generateProgramScores(deUni: GermanUniversityData): { [key: string]: number } {
        const programs: { [key: string]: number } = {};
        const baseScore = this.calculateBaseScore(deUni);

        // Add scores for notable programs
        deUni.notable_programs.forEach(program => {
            switch (program) {
                case 'Engineering':
                case 'Mechanical Engineering':
                case 'Electrical Engineering':
                    programs['engineering'] = 95;
                    programs['mechanical-engineering'] = 90;
                    break;
                case 'Computer Science':
                    programs['computer-science'] = 92;
                    programs['technology'] = 88;
                    break;
                case 'Physics':
                    programs['physics'] = 90;
                    programs['mathematics'] = 85;
                    break;
                case 'Medicine':
                    programs['pre-medicine'] = 88;
                    programs['biology'] = 85;
                    break;
                case 'Business':
                case 'Business Administration':
                case 'Economics':
                    programs['business'] = 85;
                    programs['economics'] = 88;
                    break;
                case 'Law':
                    programs['political-science'] = 82;
                    programs['history'] = 80;
                    break;
                case 'Architecture':
                    programs['architecture'] = 88;
                    programs['art'] = 80;
                    break;
            }
        });

        // Add location and type bonuses
        const bonuses = this.calculateLocationBonuses(deUni);
        Object.keys(bonuses).forEach(program => {
            if (programs[program]) {
                programs[program] = Math.min(98, programs[program] + bonuses[program]);
            }
        });

        // Default programs
        const defaultPrograms = ['engineering', 'computer-science', 'business', 'economics', 'physics'];
        defaultPrograms.forEach(program => {
            if (!programs[program]) {
                programs[program] = baseScore;
            }
        });

        return programs;
    }

    private calculateLocationBonuses(deUni: GermanUniversityData): { [key: string]: number } {
        const bonuses: { [key: string]: number } = {};

        // TU9 and U15 bonuses
        if (deUni.tu9_member) {
            bonuses['engineering'] = 10;
            bonuses['computer-science'] = 8;
        }
        if (deUni.u15_member) {
            bonuses['research'] = 10;
        }

        // State-based specialties
        switch (deUni.state) {
            case 'Bavaria':
                bonuses['engineering'] = 5;
                bonuses['technology'] = 5;
                break;
            case 'Baden-Württemberg':
                bonuses['automotive'] = 10;
                bonuses['engineering'] = 8;
                break;
            case 'North Rhine-Westphalia':
                bonuses['business'] = 5;
                bonuses['industry'] = 8;
                break;
            case 'Berlin':
                bonuses['startup'] = 10;
                bonuses['international'] = 8;
                break;
        }

        return bonuses;
    }

    private calculateBaseScore(deUni: GermanUniversityData): number {
        let score = 80; // Higher base for German universities

        // TU9 and U15 bonuses
        if (deUni.tu9_member) score += 10;
        if (deUni.u15_member) score += 8;
        
        // Research intensity bonus
        switch (deUni.research_intensity) {
            case 'very_high': score += 8; break;
            case 'high': score += 5; break;
        }

        // Global ranking bonus
        if (deUni.qs_ranking && deUni.qs_ranking <= 100) score += 8;
        else if (deUni.qs_ranking && deUni.qs_ranking <= 200) score += 5;

        return Math.min(90, score);
    }

    private estimateAcceptanceRate(deUni: GermanUniversityData): number {
        let rate = 35; // Base rate for German universities
        
        if (deUni.tu9_member || deUni.u15_member) rate = 25;
        if (deUni.university_type === 'private') rate = 20;
        if (deUni.qs_ranking && deUni.qs_ranking <= 100) rate -= 5;
        
        return Math.max(15, Math.min(50, rate));
    }

    private estimateGlobalRanking(nationalRanking: number): number {
        if (nationalRanking <= 5) return nationalRanking * 25;
        if (nationalRanking <= 10) return 100 + nationalRanking * 15;
        return 200 + nationalRanking * 10;
    }

    private estimateGPAFromAcceptance(acceptanceRate: number): number {
        if (acceptanceRate <= 20) return 3.8;
        if (acceptanceRate <= 30) return 3.5;
        if (acceptanceRate <= 40) return 3.2;
        return 3.0;
    }

    private estimateMinGPA(acceptanceRate: number): number {
        if (acceptanceRate <= 20) return 3.7;
        if (acceptanceRate <= 30) return 3.3;
        if (acceptanceRate <= 40) return 3.0;
        return 2.8;
    }

    private getResearchRequirement(intensity: string): string {
        switch (intensity) {
            case 'very_high': return 'Strongly Recommended';
            case 'high': return 'Recommended';
            default: return 'Optional';
        }
    }

    private estimateScholarshipAvailability(deUni: GermanUniversityData): number {
        let percentage = 25; // Base for German universities
        
        if (deUni.tu9_member || deUni.u15_member) percentage += 15;
        if (deUni.research_intensity === 'very_high') percentage += 10;
        if (deUni.university_type === 'private') percentage += 20;
        
        return Math.min(60, percentage);
    }

    private estimateMedianDebt(tuition: number): number {
        // German universities have very low tuition, so debt is minimal
        return Math.round(tuition * 3 + 15000); // Living costs are main expense
    }

    private estimateGraduateEarnings(deUni: GermanUniversityData): number {
        let earnings = 48000; // Base USD for German graduates
        
        if (deUni.tu9_member || deUni.u15_member) earnings += 8000;
        if (deUni.city === 'Munich' || deUni.city === 'Frankfurt') earnings += 5000;
        if (deUni.university_type === 'private') earnings += 10000;
        
        return earnings;
    }

    private determineLocationType(city: string): string {
        const majorCities = ['Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt', 'Stuttgart', 'Dresden'];
        return majorCities.includes(city) ? 'Major City' : 'University Town';
    }

    private determineClassSize(studentSize: number): string {
        if (studentSize < 15000) return 'Small Classes';
        if (studentSize < 35000) return 'Medium Classes';
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
        console.log(`🧹 German university cache cleared. Total available: ${GERMAN_UNIVERSITIES.length}`);
    }

    getGermanStats(): {
        total_universities: number;
        tu9_universities: number;
        u15_universities: number;
        average_tuition: number;
        top_states: string[];
    } {
        return {
            total_universities: GERMAN_UNIVERSITIES.length,
            tu9_universities: GERMAN_UNIVERSITIES.filter(uni => uni.tu9_member).length,
            u15_universities: GERMAN_UNIVERSITIES.filter(uni => uni.u15_member).length,
            average_tuition: GERMAN_UNIVERSITIES.reduce((sum, uni) => sum + uni.tuition_non_eu, 0) / GERMAN_UNIVERSITIES.length,
            top_states: ['Bavaria', 'Baden-Württemberg', 'North Rhine-Westphalia', 'Berlin', 'Saxony']
        };
    }
}

// Export singleton instance
export const germanUniversityManager = new GermanUniversityDataManager(); 