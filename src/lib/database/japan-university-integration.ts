// Japanese University Database Integration System
// Phase 2.4: International Expansion - Japanese Universities

import type { EnhancedUniversity } from './university-integration';

// Japanese University Data Interface
export interface JapaneseUniversityData {
    id: string;
    name: string;
    name_japanese: string;
    city: string;
    state?: string; // Added to fix TypeScript error
    prefecture: string;
    region: string;
    established: number;
    qs_ranking?: number;
    times_ranking?: number;
    japan_ranking?: number;
    acceptance_rate?: number;
    tuition_domestic: number;
    tuition_international: number;
    living_cost: number;
    total_students?: number;
    international_students_percentage?: number;
    university_type: 'national' | 'public' | 'private' | 'specialized';
    language_instruction: 'japanese' | 'english' | 'bilingual';
    research_intensity: 'very_high' | 'high' | 'medium' | 'limited';
    notable_programs: string[];
    strengths: string[];
    website: string;
    english_programs: boolean;
}

// Top Japanese Universities Database (2025 Data)
export const JAPANESE_UNIVERSITIES: JapaneseUniversityData[] = [
    // TOP TIER NATIONAL UNIVERSITIES
    {
        id: 'jp-tokyo',
        name: 'University of Tokyo',
        name_japanese: '東京大学',
        city: 'Tokyo',
        prefecture: 'Tokyo',
        region: 'Kanto',
        established: 1877,
        qs_ranking: 28,
        times_ranking: 29,
        japan_ranking: 1,
        acceptance_rate: 35,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 1200000,
        total_students: 28000,
        international_students_percentage: 12,
        university_type: 'national',
        language_instruction: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Engineering', 'Medicine', 'Law', 'Economics', 'Natural Sciences', 'Liberal Arts'],
        strengths: ['research-excellence', 'global-reputation', 'prestigious-alumni', 'comprehensive-programs'],
        website: 'https://www.u-tokyo.ac.jp',
        english_programs: true
    },
    {
        id: 'jp-kyoto',
        name: 'Kyoto University',
        name_japanese: '京都大学',
        city: 'Kyoto',
        prefecture: 'Kyoto',
        region: 'Kansai',
        established: 1897,
        qs_ranking: 36,
        times_ranking: 68,
        japan_ranking: 2,
        acceptance_rate: 38,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 1000000,
        total_students: 23000,
        international_students_percentage: 10,
        university_type: 'national',
        language_instruction: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Medicine', 'Engineering', 'Natural Sciences', 'Philosophy', 'Agriculture'],
        strengths: ['research-excellence', 'nobel-laureates', 'historic-tradition', 'academic-freedom'],
        website: 'https://www.kyoto-u.ac.jp',
        english_programs: true
    },
    {
        id: 'jp-osaka',
        name: 'Osaka University',
        name_japanese: '大阪大学',
        city: 'Osaka',
        prefecture: 'Osaka',
        region: 'Kansai',
        established: 1931,
        qs_ranking: 68,
        times_ranking: 175,
        japan_ranking: 3,
        acceptance_rate: 42,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 950000,
        total_students: 24000,
        international_students_percentage: 15,
        university_type: 'national',
        language_instruction: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Medicine', 'Engineering', 'Economics', 'International Studies', 'Dentistry'],
        strengths: ['medical-research', 'international-programs', 'industry-connections', 'innovation'],
        website: 'https://www.osaka-u.ac.jp',
        english_programs: true
    },
    {
        id: 'jp-tohoku',
        name: 'Tohoku University',
        name_japanese: '東北大学',
        city: 'Sendai',
        prefecture: 'Miyagi',
        region: 'Tohoku',
        established: 1907,
        qs_ranking: 79,
        times_ranking: 201,
        japan_ranking: 4,
        acceptance_rate: 45,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 850000,
        total_students: 18000,
        international_students_percentage: 18,
        university_type: 'national',
        language_instruction: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Engineering', 'Science', 'Medicine', 'International Studies', 'Materials Science'],
        strengths: ['materials-research', 'international-focus', 'disaster-research', 'innovation'],
        website: 'https://www.tohoku.ac.jp',
        english_programs: true
    },
    {
        id: 'jp-nagoya',
        name: 'Nagoya University',
        name_japanese: '名古屋大学',
        city: 'Nagoya',
        prefecture: 'Aichi',
        region: 'Chubu',
        established: 1939,
        qs_ranking: 112,
        times_ranking: 301,
        japan_ranking: 5,
        acceptance_rate: 48,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 900000,
        total_students: 16000,
        international_students_percentage: 14,
        university_type: 'national',
        language_instruction: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Engineering', 'Science', 'Medicine', 'Law', 'Economics'],
        strengths: ['automotive-research', 'nobel-laureates', 'industry-partnerships', 'research-excellence'],
        website: 'https://www.nagoya-u.ac.jp',
        english_programs: true
    },
    {
        id: 'jp-hokkaido',
        name: 'Hokkaido University',
        name_japanese: '北海道大学',
        city: 'Sapporo',
        prefecture: 'Hokkaido',
        region: 'Hokkaido',
        established: 1876,
        qs_ranking: 145,
        times_ranking: 351,
        japan_ranking: 6,
        acceptance_rate: 52,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 800000,
        total_students: 18500,
        international_students_percentage: 16,
        university_type: 'national',
        language_instruction: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Agriculture', 'Veterinary Medicine', 'Engineering', 'Environmental Science', 'Medicine'],
        strengths: ['agricultural-research', 'environmental-studies', 'beautiful-campus', 'international-programs'],
        website: 'https://www.hokudai.ac.jp',
        english_programs: true
    },
    {
        id: 'jp-kyushu',
        name: 'Kyushu University',
        name_japanese: '九州大学',
        city: 'Fukuoka',
        prefecture: 'Fukuoka',
        region: 'Kyushu',
        established: 1911,
        qs_ranking: 164,
        times_ranking: 401,
        japan_ranking: 7,
        acceptance_rate: 55,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 850000,
        total_students: 19000,
        international_students_percentage: 20,
        university_type: 'national',
        language_instruction: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Engineering', 'Medicine', 'Agriculture', 'Economics', 'International Studies'],
        strengths: ['asia-pacific-focus', 'international-students', 'research-excellence', 'modern-campus'],
        website: 'https://www.kyushu-u.ac.jp',
        english_programs: true
    },
    {
        id: 'jp-tsukuba',
        name: 'University of Tsukuba',
        name_japanese: '筑波大学',
        city: 'Tsukuba',
        prefecture: 'Ibaraki',
        region: 'Kanto',
        established: 1973,
        qs_ranking: 355,
        times_ranking: 401,
        japan_ranking: 8,
        acceptance_rate: 58,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 900000,
        total_students: 16500,
        international_students_percentage: 22,
        university_type: 'national',
        language_instruction: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Sports Science', 'International Studies', 'Medicine', 'Engineering', 'Education'],
        strengths: ['sports-science', 'international-programs', 'research-city', 'modern-facilities'],
        website: 'https://www.tsukuba.ac.jp',
        english_programs: true
    },
    // TOP PRIVATE UNIVERSITIES
    {
        id: 'jp-waseda',
        name: 'Waseda University',
        name_japanese: '早稲田大学',
        city: 'Tokyo',
        prefecture: 'Tokyo',
        region: 'Kanto',
        established: 1882,
        qs_ranking: 199,
        times_ranking: 601,
        japan_ranking: 9,
        acceptance_rate: 65,
        tuition_domestic: 1200000,
        tuition_international: 1400000,
        living_cost: 1200000,
        total_students: 50000,
        international_students_percentage: 18,
        university_type: 'private',
        language_instruction: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Political Science', 'International Relations', 'Business', 'Literature', 'Engineering'],
        strengths: ['political-connections', 'international-programs', 'alumni-network', 'liberal-arts'],
        website: 'https://www.waseda.jp',
        english_programs: true
    },
    {
        id: 'jp-keio',
        name: 'Keio University',
        name_japanese: '慶應義塾大学',
        city: 'Tokyo',
        prefecture: 'Tokyo',
        region: 'Kanto',
        established: 1858,
        qs_ranking: 201,
        times_ranking: 601,
        japan_ranking: 10,
        acceptance_rate: 62,
        tuition_domestic: 1300000,
        tuition_international: 1500000,
        living_cost: 1200000,
        total_students: 33000,
        international_students_percentage: 15,
        university_type: 'private',
        language_instruction: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Business', 'Medicine', 'Economics', 'Law', 'Engineering'],
        strengths: ['business-connections', 'medical-school', 'prestigious-alumni', 'innovation'],
        website: 'https://www.keio.ac.jp',
        english_programs: true
    },
    // MORE TOP UNIVERSITIES (11-50)
    {
        id: 'jp-hitotsubashi',
        name: 'Hitotsubashi University',
        name_japanese: '一橋大学',
        city: 'Tokyo',
        prefecture: 'Tokyo',
        region: 'Kanto',
        established: 1875,
        qs_ranking: 401,
        japan_ranking: 11,
        acceptance_rate: 45,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 1200000,
        total_students: 4500,
        international_students_percentage: 8,
        university_type: 'national',
        language_instruction: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Economics', 'Business', 'Law', 'Social Sciences'],
        strengths: ['business-economics', 'small-classes', 'elite-education', 'corporate-connections'],
        website: 'https://www.hit-u.ac.jp',
        english_programs: true
    },
    {
        id: 'jp-tokyo-tech',
        name: 'Tokyo Institute of Technology',
        name_japanese: '東京工業大学',
        city: 'Tokyo',
        prefecture: 'Tokyo',
        region: 'Kanto',
        established: 1881,
        qs_ranking: 91,
        times_ranking: 301,
        japan_ranking: 12,
        acceptance_rate: 40,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 1200000,
        total_students: 10000,
        international_students_percentage: 20,
        university_type: 'national',
        language_instruction: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Engineering', 'Computer Science', 'Materials Science', 'Physics', 'Chemistry'],
        strengths: ['technology-focus', 'research-excellence', 'industry-partnerships', 'innovation'],
        website: 'https://www.titech.ac.jp',
        english_programs: true
    },
    {
        id: 'jp-kobe',
        name: 'Kobe University',
        name_japanese: '神戸大学',
        city: 'Kobe',
        prefecture: 'Hyogo',
        region: 'Kansai',
        established: 1949,
        qs_ranking: 401,
        japan_ranking: 13,
        acceptance_rate: 50,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 950000,
        total_students: 16000,
        international_students_percentage: 12,
        university_type: 'national',
        language_instruction: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Business', 'Economics', 'Medicine', 'Engineering', 'International Studies'],
        strengths: ['business-school', 'international-focus', 'port-city-location', 'diverse-programs'],
        website: 'https://www.kobe-u.ac.jp',
        english_programs: true
    },
    {
        id: 'jp-yokohama-national',
        name: 'Yokohama National University',
        name_japanese: '横浜国立大学',
        city: 'Yokohama',
        prefecture: 'Kanagawa',
        region: 'Kanto',
        established: 1949,
        japan_ranking: 14,
        acceptance_rate: 55,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 1100000,
        total_students: 10500,
        international_students_percentage: 15,
        university_type: 'national',
        language_instruction: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Engineering', 'Business', 'Economics', 'Education', 'Urban Innovation'],
        strengths: ['engineering-programs', 'urban-studies', 'international-programs', 'modern-campus'],
        website: 'https://www.ynu.ac.jp',
        english_programs: true
    },
    {
        id: 'jp-chiba',
        name: 'Chiba University',
        name_japanese: '千葉大学',
        city: 'Chiba',
        prefecture: 'Chiba',
        region: 'Kanto',
        established: 1949,
        japan_ranking: 15,
        acceptance_rate: 58,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 1000000,
        total_students: 14000,
        international_students_percentage: 10,
        university_type: 'national',
        language_instruction: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Medicine', 'Engineering', 'Pharmacy', 'Horticulture', 'Education'],
        strengths: ['medical-programs', 'pharmaceutical-research', 'agricultural-studies', 'comprehensive-programs'],
        website: 'https://www.chiba-u.ac.jp',
        english_programs: true
    },
    {
        id: 'jp-hiroshima',
        name: 'Hiroshima University',
        name_japanese: '広島大学',
        city: 'Hiroshima',
        prefecture: 'Hiroshima',
        region: 'Chugoku',
        established: 1949,
        japan_ranking: 16,
        acceptance_rate: 60,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 800000,
        total_students: 15000,
        international_students_percentage: 18,
        university_type: 'national',
        language_instruction: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Peace Studies', 'Medicine', 'Engineering', 'Education', 'International Studies'],
        strengths: ['peace-studies', 'international-programs', 'comprehensive-research', 'historic-significance'],
        website: 'https://www.hiroshima-u.ac.jp',
        english_programs: true
    },
    {
        id: 'jp-okayama',
        name: 'Okayama University',
        name_japanese: '岡山大学',
        city: 'Okayama',
        prefecture: 'Okayama',
        region: 'Chugoku',
        established: 1949,
        japan_ranking: 17,
        acceptance_rate: 62,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 750000,
        total_students: 14000,
        international_students_percentage: 12,
        university_type: 'national',
        language_instruction: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Medicine', 'Dentistry', 'Pharmacy', 'Agriculture', 'Engineering'],
        strengths: ['medical-programs', 'dental-school', 'agricultural-research', 'affordable-living'],
        website: 'https://www.okayama-u.ac.jp',
        english_programs: true
    },
    {
        id: 'jp-kanazawa',
        name: 'Kanazawa University',
        name_japanese: '金沢大学',
        city: 'Kanazawa',
        prefecture: 'Ishikawa',
        region: 'Chubu',
        established: 1949,
        japan_ranking: 18,
        acceptance_rate: 65,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 800000,
        total_students: 10500,
        international_students_percentage: 14,
        university_type: 'national',
        language_instruction: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Medicine', 'Pharmacy', 'Engineering', 'Liberal Arts', 'Natural Sciences'],
        strengths: ['medical-research', 'pharmaceutical-studies', 'cultural-heritage', 'comprehensive-programs'],
        website: 'https://www.kanazawa-u.ac.jp',
        english_programs: true
    },
    {
        id: 'jp-niigata',
        name: 'Niigata University',
        name_japanese: '新潟大学',
        city: 'Niigata',
        prefecture: 'Niigata',
        region: 'Chubu',
        established: 1949,
        japan_ranking: 19,
        acceptance_rate: 68,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 750000,
        total_students: 12000,
        international_students_percentage: 10,
        university_type: 'national',
        language_instruction: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Medicine', 'Dentistry', 'Agriculture', 'Engineering', 'Education'],
        strengths: ['medical-programs', 'agricultural-research', 'affordable-education', 'regional-focus'],
        website: 'https://www.niigata-u.ac.jp',
        english_programs: true
    },
    {
        id: 'jp-kumamoto',
        name: 'Kumamoto University',
        name_japanese: '熊本大学',
        city: 'Kumamoto',
        prefecture: 'Kumamoto',
        region: 'Kyushu',
        established: 1949,
        japan_ranking: 20,
        acceptance_rate: 70,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 700000,
        total_students: 10000,
        international_students_percentage: 16,
        university_type: 'national',
        language_instruction: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Medicine', 'Pharmacy', 'Engineering', 'Natural Sciences', 'Education'],
        strengths: ['medical-research', 'pharmaceutical-studies', 'affordable-living', 'natural-environment'],
        website: 'https://www.kumamoto-u.ac.jp',
        english_programs: true
    },
    // TOP PRIVATE UNIVERSITIES (21-40)
    {
        id: 'jp-sophia',
        name: 'Sophia University',
        name_japanese: '上智大学',
        city: 'Tokyo',
        prefecture: 'Tokyo',
        region: 'Kanto',
        established: 1913,
        qs_ranking: 601,
        japan_ranking: 21,
        acceptance_rate: 70,
        tuition_domestic: 1100000,
        tuition_international: 1300000,
        living_cost: 1200000,
        total_students: 13000,
        international_students_percentage: 25,
        university_type: 'private',
        language_instruction: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['International Studies', 'Foreign Languages', 'Liberal Arts', 'Theology', 'Economics'],
        strengths: ['international-focus', 'language-programs', 'catholic-tradition', 'diverse-student-body'],
        website: 'https://www.sophia.ac.jp',
        english_programs: true
    },
    {
        id: 'jp-rikkyo',
        name: 'Rikkyo University',
        name_japanese: '立教大学',
        city: 'Tokyo',
        prefecture: 'Tokyo',
        region: 'Kanto',
        established: 1874,
        japan_ranking: 22,
        acceptance_rate: 72,
        tuition_domestic: 1000000,
        tuition_international: 1200000,
        living_cost: 1200000,
        total_students: 20000,
        international_students_percentage: 12,
        university_type: 'private',
        language_instruction: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Liberal Arts', 'Business', 'International Relations', 'Tourism', 'Psychology'],
        strengths: ['liberal-arts-focus', 'beautiful-campus', 'international-programs', 'student-life'],
        website: 'https://www.rikkyo.ac.jp',
        english_programs: true
    },
    {
        id: 'jp-meiji',
        name: 'Meiji University',
        name_japanese: '明治大学',
        city: 'Tokyo',
        prefecture: 'Tokyo',
        region: 'Kanto',
        established: 1881,
        japan_ranking: 23,
        acceptance_rate: 75,
        tuition_domestic: 1050000,
        tuition_international: 1250000,
        living_cost: 1200000,
        total_students: 33000,
        international_students_percentage: 8,
        university_type: 'private',
        language_instruction: 'japanese',
        research_intensity: 'medium',
        notable_programs: ['Law', 'Business', 'Political Science', 'Literature', 'Engineering'],
        strengths: ['law-programs', 'business-connections', 'large-alumni-network', 'traditional-education'],
        website: 'https://www.meiji.ac.jp',
        english_programs: false
    },
    {
        id: 'jp-aoyama-gakuin',
        name: 'Aoyama Gakuin University',
        name_japanese: '青山学院大学',
        city: 'Tokyo',
        prefecture: 'Tokyo',
        region: 'Kanto',
        established: 1874,
        japan_ranking: 24,
        acceptance_rate: 78,
        tuition_domestic: 1100000,
        tuition_international: 1300000,
        living_cost: 1200000,
        total_students: 19000,
        international_students_percentage: 10,
        university_type: 'private',
        language_instruction: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['International Studies', 'Business', 'Literature', 'Education', 'Social Sciences'],
        strengths: ['international-programs', 'christian-education', 'modern-facilities', 'student-support'],
        website: 'https://www.aoyama.ac.jp',
        english_programs: true
    },
    {
        id: 'jp-chuo',
        name: 'Chuo University',
        name_japanese: '中央大学',
        city: 'Tokyo',
        prefecture: 'Tokyo',
        region: 'Kanto',
        established: 1885,
        japan_ranking: 25,
        acceptance_rate: 80,
        tuition_domestic: 950000,
        tuition_international: 1150000,
        living_cost: 1200000,
        total_students: 26000,
        international_students_percentage: 6,
        university_type: 'private',
        language_instruction: 'japanese',
        research_intensity: 'medium',
        notable_programs: ['Law', 'Business', 'Economics', 'Literature', 'Engineering'],
        strengths: ['law-school', 'business-programs', 'practical-education', 'career-support'],
        website: 'https://www.chuo-u.ac.jp',
        english_programs: false
    },
    {
        id: 'jp-hosei',
        name: 'Hosei University',
        name_japanese: '法政大学',
        city: 'Tokyo',
        prefecture: 'Tokyo',
        region: 'Kanto',
        established: 1880,
        japan_ranking: 26,
        acceptance_rate: 82,
        tuition_domestic: 950000,
        tuition_international: 1150000,
        living_cost: 1200000,
        total_students: 28000,
        international_students_percentage: 5,
        university_type: 'private',
        language_instruction: 'japanese',
        research_intensity: 'medium',
        notable_programs: ['Law', 'Economics', 'Business', 'Social Sciences', 'Engineering'],
        strengths: ['law-programs', 'social-sciences', 'diverse-programs', 'urban-campus'],
        website: 'https://www.hosei.ac.jp',
        english_programs: false
    },
    {
        id: 'jp-kansai',
        name: 'Kansai University',
        name_japanese: '関西大学',
        city: 'Osaka',
        prefecture: 'Osaka',
        region: 'Kansai',
        established: 1886,
        japan_ranking: 27,
        acceptance_rate: 85,
        tuition_domestic: 900000,
        tuition_international: 1100000,
        living_cost: 950000,
        total_students: 29000,
        international_students_percentage: 7,
        university_type: 'private',
        language_instruction: 'japanese',
        research_intensity: 'medium',
        notable_programs: ['Law', 'Economics', 'Business', 'Literature', 'Engineering'],
        strengths: ['comprehensive-programs', 'kansai-culture', 'student-activities', 'career-support'],
        website: 'https://www.kansai-u.ac.jp',
        english_programs: false
    },
    {
        id: 'jp-kwansei-gakuin',
        name: 'Kwansei Gakuin University',
        name_japanese: '関西学院大学',
        city: 'Nishinomiya',
        prefecture: 'Hyogo',
        region: 'Kansai',
        established: 1889,
        japan_ranking: 28,
        acceptance_rate: 75,
        tuition_domestic: 1000000,
        tuition_international: 1200000,
        living_cost: 900000,
        total_students: 25000,
        international_students_percentage: 12,
        university_type: 'private',
        language_instruction: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['International Studies', 'Business', 'Economics', 'Theology', 'Social Sciences'],
        strengths: ['international-programs', 'christian-education', 'beautiful-campus', 'study-abroad'],
        website: 'https://www.kwansei.ac.jp',
        english_programs: true
    },
    {
        id: 'jp-doshisha',
        name: 'Doshisha University',
        name_japanese: '同志社大学',
        city: 'Kyoto',
        prefecture: 'Kyoto',
        region: 'Kansai',
        established: 1875,
        japan_ranking: 29,
        acceptance_rate: 73,
        tuition_domestic: 1050000,
        tuition_international: 1250000,
        living_cost: 1000000,
        total_students: 28000,
        international_students_percentage: 15,
        university_type: 'private',
        language_instruction: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Liberal Arts', 'International Studies', 'Business', 'Theology', 'Engineering'],
        strengths: ['liberal-arts', 'international-focus', 'historic-kyoto', 'christian-tradition'],
        website: 'https://www.doshisha.ac.jp',
        english_programs: true
    },
    {
        id: 'jp-ritsumeikan',
        name: 'Ritsumeikan University',
        city: 'Kyoto',
        state: 'Kyoto Prefecture',
        region: 'Kansai',
        established: 1900,
        juc_ranking: 30,
        qs_ranking: 801,
        times_ranking: 801,
        acceptance_rate: 35,
        tuition_jpy: 1200000,
        tuition_international_jpy: 1300000,
        living_cost_jpy: 960000,
        total_students: 36000,
        international_students_percentage: 8,
        university_type: 'private',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['International Relations', 'Business', 'Information Science', 'Law', 'Film Studies'],
        strengths: ['international-programs', 'dual-campus', 'industry-connections', 'study-abroad'],
        website: 'https://www.ritsumei.ac.jp/eng/'
    },
    {
        id: 'jp-icu',
        name: 'International Christian University',
        city: 'Tokyo',
        state: 'Tokyo Prefecture',
        region: 'Kanto',
        established: 1949,
        juc_ranking: 31,
        qs_ranking: 801,
        times_ranking: 801,
        acceptance_rate: 30,
        tuition_jpy: 1380000,
        tuition_international_jpy: 1380000,
        living_cost_jpy: 1200000,
        total_students: 3000,
        international_students_percentage: 25,
        university_type: 'private',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Liberal Arts', 'International Relations', 'Education', 'Language', 'Peace Studies'],
        strengths: ['english-education', 'small-classes', 'liberal-arts', 'international-faculty'],
        website: 'https://www.icu.ac.jp/en/'
    },
    {
        id: 'jp-soka',
        name: 'Soka University',
        city: 'Tokyo',
        state: 'Tokyo Prefecture',
        region: 'Kanto',
        established: 1971,
        juc_ranking: 32,
        qs_ranking: 801,
        times_ranking: 801,
        acceptance_rate: 40,
        tuition_jpy: 1200000,
        tuition_international_jpy: 1200000,
        living_cost_jpy: 1100000,
        total_students: 8000,
        international_students_percentage: 15,
        university_type: 'private',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Economics', 'International Relations', 'Education', 'Law', 'Engineering'],
        strengths: ['global-citizenship', 'exchange-programs', 'scholarship-opportunities', 'value-creation'],
        website: 'https://www.soka.ac.jp/en/'
    },
    {
        id: 'jp-aoyama-gakuin',
        name: 'Aoyama Gakuin University',
        city: 'Tokyo',
        state: 'Tokyo Prefecture',
        region: 'Kanto',
        established: 1949,
        juc_ranking: 33,
        qs_ranking: 801,
        times_ranking: 801,
        acceptance_rate: 38,
        tuition_jpy: 1250000,
        tuition_international_jpy: 1250000,
        living_cost_jpy: 1200000,
        total_students: 19000,
        international_students_percentage: 5,
        university_type: 'private',
        language: 'japanese',
        research_intensity: 'medium',
        notable_programs: ['Business', 'Law', 'International Politics', 'Literature', 'Science'],
        strengths: ['central-tokyo-location', 'christian-heritage', 'business-connections', 'modern-facilities'],
        website: 'https://www.aoyama.ac.jp/en/'
    },
    {
        id: 'jp-gakushuin',
        name: 'Gakushuin University',
        city: 'Tokyo',
        state: 'Tokyo Prefecture',
        region: 'Kanto',
        established: 1949,
        juc_ranking: 34,
        qs_ranking: 801,
        times_ranking: 801,
        acceptance_rate: 35,
        tuition_jpy: 1200000,
        tuition_international_jpy: 1200000,
        living_cost_jpy: 1200000,
        total_students: 9000,
        international_students_percentage: 3,
        university_type: 'private',
        language: 'japanese',
        research_intensity: 'medium',
        notable_programs: ['Economics', 'Law', 'Literature', 'Science', 'International Relations'],
        strengths: ['imperial-connection', 'traditional-education', 'prestigious-history', 'elite-network'],
        website: 'https://www.gakushuin.ac.jp/en/'
    },
    {
        id: 'jp-osaka-city',
        name: 'Osaka City University',
        city: 'Osaka',
        state: 'Osaka Prefecture',
        region: 'Kansai',
        established: 1949,
        juc_ranking: 35,
        qs_ranking: 801,
        times_ranking: 801,
        acceptance_rate: 45,
        tuition_jpy: 535800,
        tuition_international_jpy: 535800,
        living_cost_jpy: 900000,
        total_students: 8000,
        international_students_percentage: 6,
        university_type: 'public',
        language: 'japanese',
        research_intensity: 'high',
        notable_programs: ['Medicine', 'Business', 'Economics', 'Science', 'Engineering'],
        strengths: ['urban-research', 'medical-programs', 'affordable-tuition', 'osaka-connections'],
        website: 'https://www.osaka-cu.ac.jp/en/'
    },
    {
        id: 'jp-tokyo-medical-dental',
        name: 'Tokyo Medical and Dental University',
        city: 'Tokyo',
        state: 'Tokyo Prefecture',
        region: 'Kanto',
        established: 1928,
        juc_ranking: 36,
        qs_ranking: 351,
        times_ranking: 401,
        acceptance_rate: 15,
        tuition_jpy: 535800,
        tuition_international_jpy: 535800,
        living_cost_jpy: 1200000,
        total_students: 3000,
        international_students_percentage: 10,
        university_type: 'national',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Medicine', 'Dentistry', 'Health Sciences', 'Biomedical Research', 'Public Health'],
        strengths: ['medical-research', 'clinical-excellence', 'specialized-focus', 'international-research'],
        website: 'http://www.tmd.ac.jp/english/'
    },
    {
        id: 'jp-ochanomizu',
        name: 'Ochanomizu University',
        city: 'Tokyo',
        state: 'Tokyo Prefecture',
        region: 'Kanto',
        established: 1875,
        juc_ranking: 37,
        qs_ranking: 801,
        times_ranking: 801,
        acceptance_rate: 30,
        tuition_jpy: 535800,
        tuition_international_jpy: 535800,
        living_cost_jpy: 1200000,
        total_students: 3000,
        international_students_percentage: 8,
        university_type: 'national',
        language: 'japanese',
        research_intensity: 'high',
        notable_programs: ['Science', 'Humanities', 'Education', 'Home Economics', 'Gender Studies'],
        strengths: ['women-education', 'research-focus', 'historic-institution', 'gender-studies'],
        website: 'https://www.ocha.ac.jp/en/'
    },
    {
        id: 'jp-tokyo-foreign',
        name: 'Tokyo University of Foreign Studies',
        city: 'Tokyo',
        state: 'Tokyo Prefecture',
        region: 'Kanto',
        established: 1949,
        juc_ranking: 38,
        qs_ranking: 801,
        times_ranking: 801,
        acceptance_rate: 25,
        tuition_jpy: 535800,
        tuition_international_jpy: 535800,
        living_cost_jpy: 1200000,
        total_students: 4000,
        international_students_percentage: 20,
        university_type: 'national',
        language: 'multilingual',
        research_intensity: 'high',
        notable_programs: ['Language Studies', 'International Relations', 'Global Studies', 'Linguistics', 'Area Studies'],
        strengths: ['language-expertise', 'global-focus', 'cultural-studies', 'diplomatic-connections'],
        website: 'http://www.tufs.ac.jp/english/'
    },
    {
        id: 'jp-nara-women',
        name: 'Nara Women\'s University',
        city: 'Nara',
        state: 'Nara Prefecture',
        region: 'Kansai',
        established: 1949,
        juc_ranking: 39,
        qs_ranking: 801,
        times_ranking: 801,
        acceptance_rate: 35,
        tuition_jpy: 535800,
        tuition_international_jpy: 535800,
        living_cost_jpy: 900000,
        total_students: 2500,
        international_students_percentage: 5,
        university_type: 'national',
        language: 'japanese',
        research_intensity: 'medium',
        notable_programs: ['Humanities', 'Science', 'Education', 'Human Life', 'Social Sciences'],
        strengths: ['women-education', 'historic-location', 'research-focus', 'cultural-heritage'],
        website: 'http://www.nara-wu.ac.jp/nwu/en/'
    },
    // Additional 20 Universities
    {
        id: 'jp-tokyo-science',
        name: 'Tokyo University of Science',
        name_japanese: '東京理科大学',
        city: 'Tokyo',
        prefecture: 'Tokyo',
        region: 'Kanto',
        established: 1881,
        qs_ranking: 701,
        times_ranking: 801,
        japan_ranking: 40,
        acceptance_rate: 38,
        tuition_domestic: 1200000,
        tuition_international: 1400000,
        living_cost: 1100000,
        total_students: 20000,
        international_students_percentage: 7,
        university_type: 'private',
        language_instruction: 'japanese',
        research_intensity: 'high',
        notable_programs: ['Science', 'Engineering', 'Pharmacy', 'Mathematics', 'Computer Science'],
        strengths: ['stem-focus', 'industry-connections', 'research-excellence', 'technical-expertise'],
        website: 'https://www.tus.ac.jp/en/',
        english_programs: false
    },
    {
        id: 'jp-tokyo-denki',
        name: 'Tokyo Denki University',
        name_japanese: '東京電機大学',
        city: 'Tokyo',
        prefecture: 'Tokyo',
        region: 'Kanto',
        established: 1907,
        japan_ranking: 41,
        acceptance_rate: 45,
        tuition_domestic: 1300000,
        tuition_international: 1300000,
        living_cost: 1100000,
        total_students: 10000,
        international_students_percentage: 5,
        university_type: 'private',
        language_instruction: 'japanese',
        research_intensity: 'medium',
        notable_programs: ['Electrical Engineering', 'Computer Science', 'Information Systems', 'Mechanical Engineering', 'Architecture'],
        strengths: ['engineering-focus', 'industry-partnerships', 'practical-education', 'electronics-specialization'],
        website: 'https://www.dendai.ac.jp/en/',
        english_programs: false
    },
    {
        id: 'jp-yokohama-city',
        name: 'Yokohama City University',
        name_japanese: '横浜市立大学',
        city: 'Yokohama',
        prefecture: 'Kanagawa',
        region: 'Kanto',
        established: 1928,
        japan_ranking: 42,
        acceptance_rate: 40,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 1000000,
        total_students: 5000,
        international_students_percentage: 8,
        university_type: 'public',
        language_instruction: 'japanese',
        research_intensity: 'high',
        notable_programs: ['Medicine', 'International Relations', 'Economics', 'Data Science', 'Liberal Arts'],
        strengths: ['medical-education', 'urban-campus', 'global-focus', 'practical-training'],
        website: 'https://www.yokohama-cu.ac.jp/en/',
        english_programs: true
    },
    {
        id: 'jp-osaka-prefecture',
        name: 'Osaka Prefecture University',
        name_japanese: '大阪府立大学',
        city: 'Sakai',
        prefecture: 'Osaka',
        region: 'Kansai',
        established: 1949,
        japan_ranking: 43,
        acceptance_rate: 44,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 900000,
        total_students: 8000,
        international_students_percentage: 6,
        university_type: 'public',
        language_instruction: 'japanese',
        research_intensity: 'high',
        notable_programs: ['Engineering', 'Agriculture', 'Life Sciences', 'Economics', 'Humanities'],
        strengths: ['agricultural-research', 'engineering-excellence', 'sustainable-focus', 'regional-connections'],
        website: 'https://www.osakafu-u.ac.jp/en/',
        english_programs: false
    },
    {
        id: 'jp-saitama',
        name: 'Saitama University',
        name_japanese: '埼玉大学',
        city: 'Saitama',
        prefecture: 'Saitama',
        region: 'Kanto',
        established: 1949,
        japan_ranking: 44,
        acceptance_rate: 55,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 900000,
        total_students: 9000,
        international_students_percentage: 10,
        university_type: 'national',
        language_instruction: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Education', 'Economics', 'Liberal Arts', 'Science'],
        strengths: ['tokyo-proximity', 'practical-education', 'affordable-tuition', 'community-connections'],
        website: 'https://en.saitama-u.ac.jp/',
        english_programs: true
    },
    {
        id: 'jp-gifu',
        name: 'Gifu University',
        name_japanese: '岐阜大学',
        city: 'Gifu',
        prefecture: 'Gifu',
        region: 'Chubu',
        established: 1949,
        japan_ranking: 45,
        acceptance_rate: 58,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 750000,
        total_students: 7000,
        international_students_percentage: 8,
        university_type: 'national',
        language_instruction: 'japanese',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Medicine', 'Agriculture', 'Regional Studies', 'Environmental Science'],
        strengths: ['agricultural-focus', 'regional-development', 'engineering-programs', 'natural-environment'],
        website: 'https://www.gifu-u.ac.jp/en/',
        english_programs: false
    },
    {
        id: 'jp-ehime',
        name: 'Ehime University',
        name_japanese: '愛媛大学',
        city: 'Matsuyama',
        prefecture: 'Ehime',
        region: 'Shikoku',
        established: 1949,
        japan_ranking: 46,
        acceptance_rate: 60,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 700000,
        total_students: 10000,
        international_students_percentage: 5,
        university_type: 'national',
        language_instruction: 'japanese',
        research_intensity: 'medium',
        notable_programs: ['Marine Science', 'Agriculture', 'Medicine', 'Education', 'Science'],
        strengths: ['marine-science-research', 'regional-focus', 'agricultural-studies', 'coastal-location'],
        website: 'https://www.ehime-u.ac.jp/english/',
        english_programs: false
    },
    {
        id: 'jp-yamagata',
        name: 'Yamagata University',
        name_japanese: '山形大学',
        city: 'Yamagata',
        prefecture: 'Yamagata',
        region: 'Tohoku',
        established: 1949,
        japan_ranking: 47,
        acceptance_rate: 60,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 700000,
        total_students: 9000,
        international_students_percentage: 4,
        university_type: 'national',
        language_instruction: 'japanese',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Agriculture', 'Medicine', 'Humanities', 'Education'],
        strengths: ['material-science', 'agricultural-research', 'regional-development', 'food-science'],
        website: 'https://www.yamagata-u.ac.jp/en/',
        english_programs: false
    },
    {
        id: 'jp-showa',
        name: 'Showa University',
        name_japanese: '昭和大学',
        city: 'Tokyo',
        prefecture: 'Tokyo',
        region: 'Kanto',
        established: 1928,
        japan_ranking: 48,
        acceptance_rate: 30,
        tuition_domestic: 3000000,
        tuition_international: 3000000,
        living_cost: 1100000,
        total_students: 8000,
        international_students_percentage: 3,
        university_type: 'private',
        language_instruction: 'japanese',
        research_intensity: 'high',
        notable_programs: ['Medicine', 'Dentistry', 'Pharmacy', 'Nursing', 'Rehabilitation Sciences'],
        strengths: ['medical-education', 'clinical-practice', 'healthcare-specialization', 'hospital-network'],
        website: 'https://www.showa-u.ac.jp/en/',
        english_programs: false
    },
    {
        id: 'jp-iwate',
        name: 'Iwate University',
        name_japanese: '岩手大学',
        city: 'Morioka',
        prefecture: 'Iwate',
        region: 'Tohoku',
        established: 1949,
        japan_ranking: 49,
        acceptance_rate: 65,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 700000,
        total_students: 6000,
        international_students_percentage: 3,
        university_type: 'national',
        language_instruction: 'japanese',
        research_intensity: 'medium',
        notable_programs: ['Agriculture', 'Engineering', 'Education', 'Humanities', 'Science'],
        strengths: ['agricultural-research', 'disaster-recovery', 'regional-development', 'rural-studies'],
        website: 'https://www.iwate-u.ac.jp/english/',
        english_programs: false
    },
    {
        id: 'jp-fukui',
        name: 'University of Fukui',
        name_japanese: '福井大学',
        city: 'Fukui',
        prefecture: 'Fukui',
        region: 'Chubu',
        established: 1949,
        japan_ranking: 50,
        acceptance_rate: 60,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 750000,
        total_students: 5000,
        international_students_percentage: 7,
        university_type: 'national',
        language_instruction: 'japanese',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Medical Sciences', 'Education', 'International Studies', 'Nuclear Engineering'],
        strengths: ['nuclear-technology', 'engineering-expertise', 'medical-education', 'teacher-training'],
        website: 'https://www.u-fukui.ac.jp/eng/',
        english_programs: false
    },
    {
        id: 'jp-akita',
        name: 'Akita University',
        name_japanese: '秋田大学',
        city: 'Akita',
        prefecture: 'Akita',
        region: 'Tohoku',
        established: 1949,
        japan_ranking: 51,
        acceptance_rate: 60,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 700000,
        total_students: 5000,
        international_students_percentage: 6,
        university_type: 'national',
        language_instruction: 'japanese',
        research_intensity: 'medium',
        notable_programs: ['Resource Engineering', 'Medicine', 'Education', 'International Resource Sciences'],
        strengths: ['mining-engineering', 'resource-development', 'regional-healthcare', 'international-resources'],
        website: 'https://www.akita-u.ac.jp/english/',
        english_programs: false
    },
    {
        id: 'jp-shimane',
        name: 'Shimane University',
        name_japanese: '島根大学',
        city: 'Matsue',
        prefecture: 'Shimane',
        region: 'Chugoku',
        established: 1949,
        japan_ranking: 52,
        acceptance_rate: 62,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 700000,
        total_students: 6000,
        international_students_percentage: 5,
        university_type: 'national',
        language_instruction: 'japanese',
        research_intensity: 'medium',
        notable_programs: ['Medicine', 'Education', 'Law and Literature', 'Science and Engineering', 'Life and Environmental Science'],
        strengths: ['rural-medicine', 'environmental-studies', 'regional-development', 'cultural-heritage'],
        website: 'https://www.shimane-u.ac.jp/en/',
        english_programs: false
    },
    {
        id: 'jp-toyama',
        name: 'University of Toyama',
        name_japanese: '富山大学',
        city: 'Toyama',
        prefecture: 'Toyama',
        region: 'Chubu',
        established: 2005,
        japan_ranking: 53,
        acceptance_rate: 58,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 750000,
        total_students: 9000,
        international_students_percentage: 8,
        university_type: 'national',
        language_instruction: 'japanese',
        research_intensity: 'medium',
        notable_programs: ['Pharmaceutical Sciences', 'Engineering', 'Medicine', 'Economics', 'Humanities'],
        strengths: ['pharmaceutical-research', 'manufacturing-technology', 'traditional-medicine', 'alpine-research'],
        website: 'https://www.u-toyama.ac.jp/en/',
        english_programs: false
    },
    {
        id: 'jp-yamanashi',
        name: 'University of Yamanashi',
        name_japanese: '山梨大学',
        city: 'Kofu',
        prefecture: 'Yamanashi',
        region: 'Chubu',
        established: 1949,
        japan_ranking: 54,
        acceptance_rate: 60,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 750000,
        total_students: 5000,
        international_students_percentage: 6,
        university_type: 'national',
        language_instruction: 'japanese',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Medicine', 'Life Sciences', 'Clean Energy', 'Education'],
        strengths: ['fuel-cell-research', 'viticulture-studies', 'medical-engineering', 'clean-energy'],
        website: 'https://www.yamanashi.ac.jp/en/',
        english_programs: false
    },
    {
        id: 'jp-tottori',
        name: 'Tottori University',
        name_japanese: '鳥取大学',
        city: 'Tottori',
        prefecture: 'Tottori',
        region: 'Chugoku',
        established: 1949,
        japan_ranking: 55,
        acceptance_rate: 62,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 700000,
        total_students: 6000,
        international_students_percentage: 5,
        university_type: 'national',
        language_instruction: 'japanese',
        research_intensity: 'medium',
        notable_programs: ['Agriculture', 'Engineering', 'Medicine', 'Regional Sciences', 'Arid Land Sciences'],
        strengths: ['desert-research', 'agricultural-science', 'regional-development', 'veterinary-medicine'],
        website: 'https://www.tottori-u.ac.jp/English/',
        english_programs: false
    },
    {
        id: 'jp-kagawa',
        name: 'Kagawa University',
        name_japanese: '香川大学',
        city: 'Takamatsu',
        prefecture: 'Kagawa',
        region: 'Shikoku',
        established: 1949,
        japan_ranking: 56,
        acceptance_rate: 60,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 750000,
        total_students: 6500,
        international_students_percentage: 4,
        university_type: 'national',
        language_instruction: 'japanese',
        research_intensity: 'medium',
        notable_programs: ['Agriculture', 'Medicine', 'Economics', 'Education', 'Law'],
        strengths: ['olive-research', 'island-studies', 'marine-resources', 'regional-development'],
        website: 'https://www.kagawa-u.ac.jp/english/',
        english_programs: false
    },
    {
        id: 'jp-miyazaki',
        name: 'University of Miyazaki',
        name_japanese: '宮崎大学',
        city: 'Miyazaki',
        prefecture: 'Miyazaki',
        region: 'Kyushu',
        established: 1949,
        japan_ranking: 57,
        acceptance_rate: 65,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 700000,
        total_students: 5500,
        international_students_percentage: 3,
        university_type: 'national',
        language_instruction: 'japanese',
        research_intensity: 'medium',
        notable_programs: ['Agriculture', 'Medicine', 'Engineering', 'Regional Innovation', 'Education'],
        strengths: ['agricultural-sciences', 'veterinary-medicine', 'tropical-agriculture', 'food-science'],
        website: 'http://www.miyazaki-u.ac.jp/en/',
        english_programs: false
    },
    {
        id: 'jp-nagasaki',
        name: 'Nagasaki University',
        name_japanese: '長崎大学',
        city: 'Nagasaki',
        prefecture: 'Nagasaki',
        region: 'Kyushu',
        established: 1949,
        japan_ranking: 58,
        qs_ranking: 701,
        times_ranking: 801,
        acceptance_rate: 50,
        tuition_domestic: 535800,
        tuition_international: 535800,
        living_cost: 750000,
        total_students: 9000,
        international_students_percentage: 9,
        university_type: 'national',
        language_instruction: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Medicine', 'Tropical Medicine', 'Atomic Sciences', 'Fisheries', 'Global Health'],
        strengths: ['radiation-medicine', 'tropical-disease-research', 'international-health', 'peace-studies'],
        website: 'https://www.nagasaki-u.ac.jp/en/',
        english_programs: true
    },
    {
        id: 'jp-international-christian',
        name: 'International Christian University',
        name_japanese: '国際基督教大学',
        city: 'Tokyo',
        prefecture: 'Tokyo',
        region: 'Kanto',
        established: 1953,
        japan_ranking: 59,
        acceptance_rate: 30,
        tuition_domestic: 1700000,
        tuition_international: 1700000,
        living_cost: 1100000,
        total_students: 3000,
        international_students_percentage: 25,
        university_type: 'private',
        language_instruction: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Liberal Arts', 'International Relations', 'Education', 'Cultural Studies', 'Peace Studies'],
        strengths: ['liberal-arts-education', 'bilingual-campus', 'global-outlook', 'small-classes'],
        website: 'https://www.icu.ac.jp/en/',
        english_programs: true
    }
];

// University Data Manager Class
export class JapaneseUniversityDataManager {
    private cache: Map<string, EnhancedUniversity[]> = new Map();
    private lastFetch: number = 0;
    private cacheTimeout: number = 86400000; // 24 hours

    /**
     * Fetch Japanese universities with optional filtering
     */
    async fetchJapaneseUniversities(region?: string, limit: number = 100): Promise<EnhancedUniversity[]> {
        const cacheKey = `japanese-${region || 'all'}-${limit}`;
        
        // Check cache first
        if (this.cache.has(cacheKey) && (Date.now() - this.lastFetch) < this.cacheTimeout) {
            return this.cache.get(cacheKey)!;
        }

        try {
            let universities = JAPANESE_UNIVERSITIES;
            
            // Filter by region if specified
            if (region) {
                universities = universities.filter(uni => 
                    uni.region.toLowerCase() === region.toLowerCase()
                );
            }
            
            // Limit results
            universities = universities.slice(0, limit);
            
            // Convert to enhanced format
            const enhancedUniversities = universities.map(uni => this.convertToEnhanced(uni));
            
            // Cache results
            this.cache.set(cacheKey, enhancedUniversities);
            this.lastFetch = Date.now();
            
            console.log(`✅ Fetched ${enhancedUniversities.length} Japanese universities`);
            return enhancedUniversities;
            
        } catch (error) {
            console.error('❌ Error fetching Japanese universities:', error);
            return [];
        }
    }

    /**
     * Convert Japanese university data to enhanced format
     */
    private convertToEnhanced(jpUni: JapaneseUniversityData): EnhancedUniversity {
        return {
            id: jpUni.id,
            name: jpUni.name,
            city: jpUni.city,
            state: jpUni.prefecture,
            country: 'Japan',
            region: jpUni.region,
            website_url: jpUni.website,
            
            // Rankings
            global_ranking: jpUni.qs_ranking || this.estimateGlobalRanking(jpUni.japan_ranking || 50),
            national_ranking: jpUni.japan_ranking,
            ranking: jpUni.japan_ranking,
            
            // Academic metrics
            acceptance_rate: jpUni.acceptance_rate || this.estimateAcceptanceRate(jpUni),
            avg_gpa: this.estimateGPAFromRanking(jpUni.japan_ranking || 50),
            avg_sat: this.estimateSATFromRanking(jpUni.japan_ranking || 50, 'math') + 
                    this.estimateSATFromRanking(jpUni.japan_ranking || 50, 'verbal'),
            
            // Costs (convert from JPY to USD)
            cost: Math.round((jpUni.tuition_international + jpUni.living_cost) / 150),
            living_cost: Math.round(jpUni.living_cost / 150),
            in_state_tuition: Math.round(jpUni.tuition_domestic / 150),
            out_of_state_tuition: Math.round(jpUni.tuition_international / 150),
            
            // Student body
            student_size: jpUni.total_students || 15000,
            
            // Academic requirements
            requirements: {
                min_gpa: this.estimateMinGPA(jpUni.acceptance_rate || 60),
                english_test: true,
                research_experience: this.getResearchRequirement(jpUni.research_intensity)
            },
            
            // Programs and research
            programs: this.generateProgramScores(jpUni),
            research_opportunities: this.getResearchOpportunities(jpUni.research_intensity),
            strengths: jpUni.strengths,
            
            // Financial aid
            scholarships: true,
            scholarship_percentage: this.estimateScholarshipAvailability(jpUni),
            median_debt: this.estimateMedianDebt(jpUni.tuition_international),
            graduate_earnings: this.estimateGraduateEarnings(jpUni),
            
            // Campus characteristics
            location_type: this.determineLocationType(jpUni.city),
            class_size: this.determineClassSize(jpUni.total_students || 15000),
            
            // Additional metadata
            ownership_type: jpUni.university_type === 'national' ? 'public' : 
                           jpUni.university_type === 'private' ? 'private_nonprofit' : 'public',
            
            // Source tracking
            data_source: 'government_api' as const,
            last_updated: new Date().toISOString()
        };
    }

    /**
     * Generate program strength scores for Japanese university
     */
    private generateProgramScores(jpUni: JapaneseUniversityData): { [key: string]: number } {
        const programs: { [key: string]: number } = {};
        
        // Base scores for all programs
        const baseScore = jpUni.japan_ranking ? Math.max(60, 100 - jpUni.japan_ranking * 2) : 70;
        
        // Assign scores based on notable programs
        jpUni.notable_programs.forEach(program => {
            const programKey = program.toLowerCase().replace(/\s+/g, '-');
            programs[programKey] = Math.min(95, baseScore + 10);
        });
        
        // Add common programs with base scores
        const commonPrograms = [
            'business', 'engineering', 'computer-science', 'economics', 
            'international-studies', 'japanese-studies', 'medicine'
        ];
        
        commonPrograms.forEach(program => {
            if (!programs[program]) {
                programs[program] = baseScore;
            }
        });
        
        return programs;
    }

    // Helper methods for estimation
    private estimateAcceptanceRate(jpUni: JapaneseUniversityData): number {
        if (jpUni.university_type === 'national') return 45;
        if (jpUni.university_type === 'private') return 65;
        return 55;
    }

    private estimateGlobalRanking(nationalRanking: number): number {
        return Math.min(800, nationalRanking * 8);
    }

    private estimateGPAFromRanking(ranking: number): number {
        if (ranking <= 10) return 3.8;
        if (ranking <= 20) return 3.6;
        if (ranking <= 50) return 3.4;
        return 3.2;
    }

    private estimateMinGPA(acceptanceRate: number): number {
        if (acceptanceRate <= 40) return 3.5;
        if (acceptanceRate <= 60) return 3.2;
        return 3.0;
    }

    private estimateSATFromRanking(ranking: number, type: 'math' | 'verbal'): number {
        const base = type === 'math' ? 650 : 600;
        if (ranking <= 10) return base + 100;
        if (ranking <= 20) return base + 50;
        if (ranking <= 50) return base;
        return base - 50;
    }

    private estimateRetentionRate(type: string): number {
        if (type === 'national') return 92;
        if (type === 'private') return 88;
        return 85;
    }

    private estimateStudentFacultyRatio(type: string): number {
        if (type === 'national') return 12;
        if (type === 'private') return 15;
        return 18;
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

    private estimateScholarshipAvailability(jpUni: JapaneseUniversityData): number {
        if (jpUni.university_type === 'national') return 40;
        if (jpUni.university_type === 'private') return 60;
        return 50;
    }

    private estimateMedianDebt(tuition: number): number {
        return Math.round(tuition * 3.5 / 150); // Convert to USD and estimate debt
    }

    private estimateGraduateEarnings(jpUni: JapaneseUniversityData): number {
        const baseEarning = jpUni.japan_ranking ? Math.max(35000, 60000 - jpUni.japan_ranking * 500) : 45000;
        return baseEarning;
    }

    private determineLocationType(city: string): string {
        const majorCities = ['Tokyo', 'Osaka', 'Kyoto', 'Nagoya', 'Fukuoka', 'Sendai', 'Sapporo'];
        return majorCities.includes(city) ? 'urban' : 'suburban';
    }

    private determineClassSize(studentSize: number): string {
        if (studentSize > 30000) return 'large';
        if (studentSize > 15000) return 'medium';
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
export const japaneseUniversityManager = new JapaneseUniversityDataManager(); 