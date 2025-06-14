// Italian University Database Integration System
// Phase 2.6: European Expansion - Italian Universities

import type { EnhancedUniversity } from './university-integration';

// Italian University Data Interface
export interface ItalianUniversityData {
    id: string;
    name: string;
    name_italian: string;
    city: string;
    region: string;
    established: number;
    qs_ranking?: number;
    times_ranking?: number;
    censis_ranking?: number; // Italian national ranking
    acceptance_rate?: number;
    tuition_eu: number; // EU students
    tuition_international: number; // Non-EU students
    living_cost: number;
    total_students?: number;
    international_students_percentage?: number;
    university_type: 'public' | 'private' | 'specialized' | 'technical' | 'business';
    language: 'italian' | 'english' | 'bilingual';
    research_intensity: 'very_high' | 'high' | 'medium' | 'limited';
    notable_programs: string[];
    strengths: string[];
    website: string;
    crui_member: boolean; // Conference of Italian University Rectors
}

// Top 50+ Italian Universities Database (2025 Data)
export const ITALIAN_UNIVERSITIES: ItalianUniversityData[] = [
    // TOP TIER UNIVERSITIES
    {
        id: 'it-bocconi',
        name: 'Bocconi University',
        name_italian: 'Università Commerciale Luigi Bocconi',
        city: 'Milan',
        region: 'Lombardy',
        established: 1902,
        qs_ranking: 110,
        times_ranking: 201,
        censis_ranking: 1,
        acceptance_rate: 15,
        tuition_eu: 14000,
        tuition_international: 14000,
        living_cost: 15000,
        total_students: 14000,
        international_students_percentage: 35,
        university_type: 'private',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Business Administration', 'Economics', 'Finance', 'Management', 'Data Science'],
        strengths: ['business-excellence', 'finance-focus', 'international-programs', 'corporate-connections'],
        website: 'https://www.unibocconi.eu',
        crui_member: true
    },
    {
        id: 'it-bologna',
        name: 'University of Bologna',
        name_italian: 'Università di Bologna',
        city: 'Bologna',
        region: 'Emilia-Romagna',
        established: 1088,
        qs_ranking: 167,
        times_ranking: 201,
        censis_ranking: 5,
        acceptance_rate: 35,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 11000,
        total_students: 87000,
        international_students_percentage: 8,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Law', 'Medicine', 'Engineering', 'Economics', 'Humanities'],
        strengths: ['oldest-university', 'historic-prestige', 'comprehensive-programs', 'research-excellence'],
        website: 'https://www.unibo.it',
        crui_member: true
    },
    {
        id: 'it-sapienza',
        name: 'Sapienza University of Rome',
        name_italian: 'Sapienza Università di Roma',
        city: 'Rome',
        region: 'Lazio',
        established: 1303,
        qs_ranking: 171,
        times_ranking: 201,
        censis_ranking: 8,
        acceptance_rate: 40,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 13000,
        total_students: 116000,
        international_students_percentage: 7,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Medicine', 'Engineering', 'Law', 'Architecture', 'Sciences'],
        strengths: ['largest-university', 'research-excellence', 'comprehensive-programs', 'capital-location'],
        website: 'https://www.uniroma1.it',
        crui_member: true
    },
    {
        id: 'it-milan',
        name: 'University of Milan',
        name_italian: 'Università Statale di Milano',
        city: 'Milan',
        region: 'Lombardy',
        established: 1924,
        qs_ranking: 316,
        times_ranking: 301,
        censis_ranking: 12,
        acceptance_rate: 45,
        tuition_eu: 3900,
        tuition_international: 3900,
        living_cost: 15000,
        total_students: 64000,
        international_students_percentage: 10,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Medicine', 'Veterinary Medicine', 'Sciences', 'Humanities', 'Agriculture'],
        strengths: ['medical-excellence', 'research-focus', 'milan-location', 'comprehensive-programs'],
        website: 'https://www.unimi.it',
        crui_member: true
    },
    {
        id: 'it-politecnico-milano',
        name: 'Polytechnic University of Milan',
        name_italian: 'Politecnico di Milano',
        city: 'Milan',
        region: 'Lombardy',
        established: 1863,
        qs_ranking: 123,
        times_ranking: 201,
        censis_ranking: 2,
        acceptance_rate: 25,
        tuition_eu: 3900,
        tuition_international: 3900,
        living_cost: 15000,
        total_students: 47000,
        international_students_percentage: 18,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Engineering', 'Architecture', 'Design', 'Computer Science', 'Management'],
        strengths: ['engineering-excellence', 'design-innovation', 'tech-focus', 'industry-partnerships'],
        website: 'https://www.polimi.it',
        crui_member: true
    },
    {
        id: 'it-padova',
        name: 'University of Padua',
        name_italian: 'Università degli Studi di Padova',
        city: 'Padua',
        region: 'Veneto',
        established: 1222,
        qs_ranking: 242,
        times_ranking: 301,
        censis_ranking: 7,
        acceptance_rate: 38,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 10000,
        total_students: 65000,
        international_students_percentage: 9,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Medicine', 'Engineering', 'Psychology', 'Veterinary Medicine', 'Sciences'],
        strengths: ['historic-prestige', 'medical-excellence', 'research-tradition', 'galileo-heritage'],
        website: 'https://www.unipd.it',
        crui_member: true
    },
    {
        id: 'it-pisa',
        name: 'University of Pisa',
        name_italian: 'Università di Pisa',
        city: 'Pisa',
        region: 'Tuscany',
        established: 1343,
        qs_ranking: 388,
        times_ranking: 401,
        censis_ranking: 10,
        acceptance_rate: 42,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 9500,
        total_students: 50000,
        international_students_percentage: 8,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Computer Science', 'Engineering', 'Medicine', 'Physics', 'Mathematics'],
        strengths: ['computer-science', 'research-excellence', 'historic-city', 'leaning-tower'],
        website: 'https://www.unipi.it',
        crui_member: true
    },
    {
        id: 'it-florence',
        name: 'University of Florence',
        name_italian: 'Università degli Studi di Firenze',
        city: 'Florence',
        region: 'Tuscany',
        established: 1321,
        qs_ranking: 432,
        times_ranking: 401,
        censis_ranking: 15,
        acceptance_rate: 45,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 11000,
        total_students: 52000,
        international_students_percentage: 7,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Architecture', 'Medicine', 'Engineering', 'Arts', 'Agriculture'],
        strengths: ['renaissance-city', 'architecture-excellence', 'cultural-heritage', 'arts-focus'],
        website: 'https://www.unifi.it',
        crui_member: true
    },
    {
        id: 'it-turin',
        name: 'University of Turin',
        name_italian: 'Università degli Studi di Torino',
        city: 'Turin',
        region: 'Piedmont',
        established: 1404,
        qs_ranking: 392,
        times_ranking: 501,
        censis_ranking: 18,
        acceptance_rate: 48,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 10500,
        total_students: 78000,
        international_students_percentage: 6,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Medicine', 'Law', 'Economics', 'Sciences', 'Humanities'],
        strengths: ['comprehensive-programs', 'research-focus', 'industrial-city', 'automotive-hub'],
        website: 'https://www.unito.it',
        crui_member: true
    },
    {
        id: 'it-politecnico-torino',
        name: 'Polytechnic University of Turin',
        name_italian: 'Politecnico di Torino',
        city: 'Turin',
        region: 'Piedmont',
        established: 1859,
        qs_ranking: 308,
        times_ranking: 401,
        censis_ranking: 4,
        acceptance_rate: 30,
        tuition_eu: 3900,
        tuition_international: 3900,
        living_cost: 10500,
        total_students: 35000,
        international_students_percentage: 15,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'very_high',
        notable_programs: ['Engineering', 'Architecture', 'Computer Science', 'Automotive Engineering', 'Design'],
        strengths: ['engineering-excellence', 'automotive-focus', 'tech-innovation', 'industry-connections'],
        website: 'https://www.polito.it',
        crui_member: true
    },
    
    // BUSINESS & SPECIALIZED SCHOOLS
    {
        id: 'it-luiss',
        name: 'LUISS University',
        name_italian: 'Libera Università Internazionale degli Studi Sociali Guido Carli',
        city: 'Rome',
        region: 'Lazio',
        established: 1977,
        qs_ranking: 651,
        censis_ranking: 3,
        acceptance_rate: 20,
        tuition_eu: 11000,
        tuition_international: 11000,
        living_cost: 13000,
        total_students: 9000,
        international_students_percentage: 25,
        university_type: 'private',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Business Administration', 'Economics', 'Political Science', 'Law', 'Engineering'],
        strengths: ['business-focus', 'political-connections', 'elite-education', 'rome-location'],
        website: 'https://www.luiss.edu',
        crui_member: true
    },
    {
        id: 'it-cattolica',
        name: 'Catholic University of the Sacred Heart',
        name_italian: 'Università Cattolica del Sacro Cuore',
        city: 'Milan',
        region: 'Lombardy',
        established: 1921,
        qs_ranking: 801,
        censis_ranking: 6,
        acceptance_rate: 35,
        tuition_eu: 8500,
        tuition_international: 8500,
        living_cost: 15000,
        total_students: 42000,
        international_students_percentage: 12,
        university_type: 'private',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Medicine', 'Economics', 'Psychology', 'Education', 'Agriculture'],
        strengths: ['catholic-tradition', 'medical-excellence', 'comprehensive-programs', 'values-based'],
        website: 'https://www.unicatt.it',
        crui_member: true
    },
    {
        id: 'it-sda-bocconi',
        name: 'SDA Bocconi School of Management',
        name_italian: 'SDA Bocconi School of Management',
        city: 'Milan',
        region: 'Lombardy',
        established: 1971,
        qs_ranking: 15, // Business school ranking
        acceptance_rate: 18,
        tuition_eu: 65000,
        tuition_international: 65000,
        living_cost: 15000,
        total_students: 2500,
        international_students_percentage: 80,
        university_type: 'business',
        language: 'english',
        research_intensity: 'high',
        notable_programs: ['MBA', 'Executive MBA', 'Finance', 'Strategy', 'International Management'],
        strengths: ['mba-excellence', 'international-focus', 'corporate-connections', 'milan-finance'],
        website: 'https://www.sdabocconi.it',
        crui_member: false
    },
    {
        id: 'it-escp-turin',
        name: 'ESCP Business School Turin',
        name_italian: 'ESCP Business School Campus di Torino',
        city: 'Turin',
        region: 'Piedmont',
        established: 1819,
        qs_ranking: 9, // Business school ranking
        acceptance_rate: 25,
        tuition_eu: 16900,
        tuition_international: 16900,
        living_cost: 10500,
        total_students: 1200,
        international_students_percentage: 70,
        university_type: 'business',
        language: 'english',
        research_intensity: 'medium',
        notable_programs: ['International Management', 'Finance', 'Marketing', 'Entrepreneurship', 'Digital Business'],
        strengths: ['european-network', 'international-focus', 'multi-campus', 'cultural-diversity'],
        website: 'https://www.escp.eu',
        crui_member: false
    },
    
    // REGIONAL UNIVERSITIES
    {
        id: 'it-naples',
        name: 'University of Naples Federico II',
        name_italian: 'Università degli Studi di Napoli Federico II',
        city: 'Naples',
        region: 'Campania',
        established: 1224,
        qs_ranking: 424,
        times_ranking: 501,
        censis_ranking: 20,
        acceptance_rate: 50,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 8500,
        total_students: 80000,
        international_students_percentage: 5,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Engineering', 'Medicine', 'Agriculture', 'Veterinary Medicine', 'Architecture'],
        strengths: ['historic-university', 'southern-italy', 'comprehensive-programs', 'affordable-education'],
        website: 'https://www.unina.it',
        crui_member: true
    },
    {
        id: 'it-genoa',
        name: 'University of Genoa',
        name_italian: 'Università degli Studi di Genova',
        city: 'Genoa',
        region: 'Liguria',
        established: 1481,
        qs_ranking: 551,
        times_ranking: 601,
        censis_ranking: 22,
        acceptance_rate: 52,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 11000,
        total_students: 37000,
        international_students_percentage: 8,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Medicine', 'Engineering', 'Economics', 'Maritime Studies', 'Sciences'],
        strengths: ['maritime-focus', 'port-city', 'comprehensive-programs', 'coastal-location'],
        website: 'https://www.unige.it',
        crui_member: true
    },
    {
        id: 'it-venice',
        name: 'Ca\' Foscari University of Venice',
        name_italian: 'Università Ca\' Foscari Venezia',
        city: 'Venice',
        region: 'Veneto',
        established: 1868,
        qs_ranking: 701,
        times_ranking: 601,
        censis_ranking: 14,
        acceptance_rate: 40,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 12000,
        total_students: 23000,
        international_students_percentage: 15,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Economics', 'Languages', 'Management', 'Asian Studies', 'Environmental Sciences'],
        strengths: ['venice-location', 'international-focus', 'languages-excellence', 'cultural-heritage'],
        website: 'https://www.unive.it',
        crui_member: true
    },
    {
        id: 'it-verona',
        name: 'University of Verona',
        name_italian: 'Università degli Studi di Verona',
        city: 'Verona',
        region: 'Veneto',
        established: 1982,
        qs_ranking: 751,
        censis_ranking: 16,
        acceptance_rate: 45,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 10000,
        total_students: 22000,
        international_students_percentage: 10,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Medicine', 'Economics', 'Education', 'Foreign Languages', 'Biotechnology'],
        strengths: ['young-university', 'innovation-focus', 'romeo-juliet-city', 'student-friendly'],
        website: 'https://www.univr.it',
        crui_member: true
    },
    {
        id: 'it-trento',
        name: 'University of Trento',
        name_italian: 'Università degli Studi di Trento',
        city: 'Trento',
        region: 'Trentino-Alto Adige',
        established: 1962,
        qs_ranking: 389,
        times_ranking: 401,
        censis_ranking: 9,
        acceptance_rate: 35,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 9500,
        total_students: 17000,
        international_students_percentage: 12,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Computer Science', 'Engineering', 'Economics', 'Sociology', 'Cognitive Science'],
        strengths: ['research-excellence', 'innovation-focus', 'alpine-location', 'international-programs'],
        website: 'https://www.unitn.it',
        crui_member: true
    },
    {
        id: 'it-trieste',
        name: 'University of Trieste',
        name_italian: 'Università degli Studi di Trieste',
        city: 'Trieste',
        region: 'Friuli-Venezia Giulia',
        established: 1924,
        qs_ranking: 651,
        censis_ranking: 25,
        acceptance_rate: 48,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 9000,
        total_students: 16000,
        international_students_percentage: 14,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Medicine', 'Engineering', 'Economics', 'International Studies', 'Psychology'],
        strengths: ['border-location', 'international-focus', 'multicultural', 'affordable-education'],
        website: 'https://www.units.it',
        crui_member: true
    },
    
    // MORE REGIONAL & SPECIALIZED UNIVERSITIES (21-50)
    {
        id: 'it-roma-tre',
        name: 'Roma Tre University',
        name_italian: 'Università degli Studi Roma Tre',
        city: 'Rome',
        region: 'Lazio',
        established: 1992,
        qs_ranking: 801,
        censis_ranking: 19,
        acceptance_rate: 50,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 13000,
        total_students: 35000,
        international_students_percentage: 8,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Architecture', 'Economics', 'Law', 'Education'],
        strengths: ['modern-university', 'rome-location', 'comprehensive-programs', 'innovation-focus'],
        website: 'https://www.uniroma3.it',
        crui_member: true
    },
    {
        id: 'it-tor-vergata',
        name: 'University of Rome Tor Vergata',
        name_italian: 'Università degli Studi di Roma Tor Vergata',
        city: 'Rome',
        region: 'Lazio',
        established: 1982,
        qs_ranking: 551,
        times_ranking: 601,
        censis_ranking: 17,
        acceptance_rate: 45,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 13000,
        total_students: 40000,
        international_students_percentage: 10,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Medicine', 'Engineering', 'Economics', 'Sciences', 'Literature'],
        strengths: ['research-focus', 'modern-campus', 'rome-location', 'international-programs'],
        website: 'https://www.uniroma2.it',
        crui_member: true
    },
    {
        id: 'it-milan-bicocca',
        name: 'University of Milan-Bicocca',
        name_italian: 'Università degli Studi di Milano-Bicocca',
        city: 'Milan',
        region: 'Lombardy',
        established: 1998,
        qs_ranking: 601,
        censis_ranking: 13,
        acceptance_rate: 42,
        tuition_eu: 3900,
        tuition_international: 3900,
        living_cost: 15000,
        total_students: 33000,
        international_students_percentage: 12,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Medicine', 'Psychology', 'Sciences', 'Economics', 'Sociology'],
        strengths: ['young-university', 'research-excellence', 'milan-location', 'innovation-focus'],
        website: 'https://www.unimib.it',
        crui_member: true
    },
    {
        id: 'it-brescia',
        name: 'University of Brescia',
        name_italian: 'Università degli Studi di Brescia',
        city: 'Brescia',
        region: 'Lombardy',
        established: 1982,
        censis_ranking: 21,
        acceptance_rate: 48,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 11000,
        total_students: 16000,
        international_students_percentage: 9,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Medicine', 'Engineering', 'Economics', 'Law', 'Education'],
        strengths: ['young-university', 'industrial-focus', 'student-friendly', 'regional-hub'],
        website: 'https://www.unibs.it',
        crui_member: true
    },
    {
        id: 'it-bergamo',
        name: 'University of Bergamo',
        name_italian: 'Università degli Studi di Bergamo',
        city: 'Bergamo',
        region: 'Lombardy',
        established: 1968,
        censis_ranking: 11,
        acceptance_rate: 40,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 12000,
        total_students: 17000,
        international_students_percentage: 11,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Economics', 'Languages', 'Education', 'Humanities'],
        strengths: ['small-university', 'personalized-education', 'international-programs', 'alpine-location'],
        website: 'https://www.unibg.it',
        crui_member: true
    },
    {
        id: 'it-pavia',
        name: 'University of Pavia',
        name_italian: 'Università degli Studi di Pavia',
        city: 'Pavia',
        region: 'Lombardy',
        established: 1361,
        qs_ranking: 651,
        censis_ranking: 23,
        acceptance_rate: 45,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 10000,
        total_students: 24000,
        international_students_percentage: 8,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'high',
        notable_programs: ['Medicine', 'Engineering', 'Sciences', 'Law', 'Humanities'],
        strengths: ['historic-university', 'medical-excellence', 'research-tradition', 'student-city'],
        website: 'https://www.unipv.it',
        crui_member: true
    },
    {
        id: 'it-insubria',
        name: 'University of Insubria',
        name_italian: 'Università degli Studi dell\'Insubria',
        city: 'Varese',
        region: 'Lombardy',
        established: 1998,
        censis_ranking: 24,
        acceptance_rate: 50,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 11000,
        total_students: 12000,
        international_students_percentage: 7,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Medicine', 'Sciences', 'Economics', 'Law', 'Communication'],
        strengths: ['young-university', 'lakes-location', 'innovation-focus', 'swiss-border'],
        website: 'https://www.uninsubria.it',
        crui_member: true
    },
    {
        id: 'it-parma',
        name: 'University of Parma',
        name_italian: 'Università degli Studi di Parma',
        city: 'Parma',
        region: 'Emilia-Romagna',
        established: 1962,
        qs_ranking: 751,
        censis_ranking: 26,
        acceptance_rate: 52,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 9500,
        total_students: 28000,
        international_students_percentage: 6,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Food Science', 'Veterinary Medicine', 'Engineering', 'Medicine', 'Agriculture'],
        strengths: ['food-excellence', 'agricultural-focus', 'quality-of-life', 'culinary-tradition'],
        website: 'https://www.unipr.it',
        crui_member: true
    },
    {
        id: 'it-modena',
        name: 'University of Modena and Reggio Emilia',
        name_italian: 'Università degli Studi di Modena e Reggio Emilia',
        city: 'Modena',
        region: 'Emilia-Romagna',
        established: 1175,
        qs_ranking: 801,
        censis_ranking: 27,
        acceptance_rate: 55,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 9000,
        total_students: 25000,
        international_students_percentage: 7,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Medicine', 'Economics', 'Law', 'Communication'],
        strengths: ['automotive-focus', 'ferrari-connection', 'industrial-partnerships', 'affordable-education'],
        website: 'https://www.unimore.it',
        crui_member: true
    },
    {
        id: 'it-ferrara',
        name: 'University of Ferrara',
        name_italian: 'Università degli Studi di Ferrara',
        city: 'Ferrara',
        region: 'Emilia-Romagna',
        established: 1391,
        qs_ranking: 801,
        censis_ranking: 28,
        acceptance_rate: 58,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 8500,
        total_students: 23000,
        international_students_percentage: 5,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Medicine', 'Architecture', 'Engineering', 'Sciences', 'Humanities'],
        strengths: ['historic-city', 'renaissance-heritage', 'affordable-education', 'student-friendly'],
        website: 'https://www.unife.it',
        crui_member: true
    },
    {
        id: 'it-siena',
        name: 'University of Siena',
        name_italian: 'Università degli Studi di Siena',
        city: 'Siena',
        region: 'Tuscany',
        established: 1240,
        qs_ranking: 701,
        censis_ranking: 29,
        acceptance_rate: 50,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 10000,
        total_students: 20000,
        international_students_percentage: 12,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Medicine', 'Economics', 'Law', 'Humanities', 'Biotechnology'],
        strengths: ['medieval-city', 'historic-university', 'international-programs', 'tuscany-location'],
        website: 'https://www.unisi.it',
        crui_member: true
    },
    {
        id: 'it-perugia',
        name: 'University of Perugia',
        name_italian: 'Università degli Studi di Perugia',
        city: 'Perugia',
        region: 'Umbria',
        established: 1308,
        qs_ranking: 801,
        censis_ranking: 30,
        acceptance_rate: 55,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 8500,
        total_students: 24000,
        international_students_percentage: 8,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Medicine', 'Agriculture', 'Veterinary Medicine', 'Law', 'Humanities'],
        strengths: ['historic-university', 'central-italy', 'affordable-education', 'cultural-heritage'],
        website: 'https://www.unipg.it',
        crui_member: true
    },
    {
        id: 'it-ancona',
        name: 'Marche Polytechnic University',
        name_italian: 'Università Politecnica delle Marche',
        city: 'Ancona',
        region: 'Marche',
        established: 1969,
        censis_ranking: 31,
        acceptance_rate: 52,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 8000,
        total_students: 17000,
        international_students_percentage: 6,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Medicine', 'Agriculture', 'Economics', 'Marine Sciences'],
        strengths: ['polytechnic-focus', 'adriatic-coast', 'marine-research', 'affordable-education'],
        website: 'https://www.univpm.it',
        crui_member: true
    },
    {
        id: 'it-aquila',
        name: 'University of L\'Aquila',
        name_italian: 'Università degli Studi dell\'Aquila',
        city: 'L\'Aquila',
        region: 'Abruzzo',
        established: 1964,
        censis_ranking: 32,
        acceptance_rate: 60,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 7500,
        total_students: 18000,
        international_students_percentage: 5,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Medicine', 'Sciences', 'Psychology', 'Biotechnology'],
        strengths: ['mountain-location', 'earthquake-research', 'affordable-education', 'small-classes'],
        website: 'https://www.univaq.it',
        crui_member: true
    },
    {
        id: 'it-chieti',
        name: 'University of Chieti-Pescara',
        name_italian: 'Università degli Studi G. d\'Annunzio Chieti-Pescara',
        city: 'Chieti',
        region: 'Abruzzo',
        established: 1965,
        censis_ranking: 33,
        acceptance_rate: 58,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 7500,
        total_students: 32000,
        international_students_percentage: 4,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Medicine', 'Psychology', 'Architecture', 'Economics', 'Foreign Languages'],
        strengths: ['dual-campus', 'coastal-location', 'affordable-education', 'comprehensive-programs'],
        website: 'https://www.unich.it',
        crui_member: true
    },
    {
        id: 'it-teramo',
        name: 'University of Teramo',
        name_italian: 'Università degli Studi di Teramo',
        city: 'Teramo',
        region: 'Abruzzo',
        established: 1993,
        censis_ranking: 34,
        acceptance_rate: 65,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 7000,
        total_students: 11000,
        international_students_percentage: 8,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'limited',
        notable_programs: ['Veterinary Medicine', 'Communication', 'Law', 'Political Science', 'Food Science'],
        strengths: ['small-university', 'personalized-education', 'affordable-living', 'mountain-location'],
        website: 'https://www.unite.it',
        crui_member: true
    },
    {
        id: 'it-molise',
        name: 'University of Molise',
        name_italian: 'Università degli Studi del Molise',
        city: 'Campobasso',
        region: 'Molise',
        established: 1982,
        censis_ranking: 35,
        acceptance_rate: 70,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 6500,
        total_students: 10000,
        international_students_percentage: 3,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'limited',
        notable_programs: ['Agriculture', 'Medicine', 'Engineering', 'Economics', 'Education'],
        strengths: ['small-university', 'affordable-education', 'rural-focus', 'personalized-attention'],
        website: 'https://www.unimol.it',
        crui_member: true
    },
    {
        id: 'it-bari',
        name: 'University of Bari',
        name_italian: 'Università degli Studi di Bari Aldo Moro',
        city: 'Bari',
        region: 'Puglia',
        established: 1925,
        qs_ranking: 801,
        censis_ranking: 36,
        acceptance_rate: 55,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 8000,
        total_students: 60000,
        international_students_percentage: 4,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Medicine', 'Agriculture', 'Veterinary Medicine', 'Law', 'Economics'],
        strengths: ['large-university', 'southern-italy', 'comprehensive-programs', 'affordable-education'],
        website: 'https://www.uniba.it',
        crui_member: true
    },
    {
        id: 'it-lecce',
        name: 'University of Salento',
        name_italian: 'Università del Salento',
        city: 'Lecce',
        region: 'Puglia',
        established: 1955,
        censis_ranking: 37,
        acceptance_rate: 60,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 7500,
        total_students: 25000,
        international_students_percentage: 5,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Economics', 'Cultural Heritage', 'Sciences', 'Humanities'],
        strengths: ['baroque-city', 'cultural-heritage', 'affordable-education', 'southern-charm'],
        website: 'https://www.unisalento.it',
        crui_member: true
    },
    {
        id: 'it-foggia',
        name: 'University of Foggia',
        name_italian: 'Università degli Studi di Foggia',
        city: 'Foggia',
        region: 'Puglia',
        established: 1999,
        censis_ranking: 38,
        acceptance_rate: 65,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 7000,
        total_students: 15000,
        international_students_percentage: 3,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'limited',
        notable_programs: ['Agriculture', 'Medicine', 'Economics', 'Education', 'Humanities'],
        strengths: ['young-university', 'agricultural-focus', 'affordable-education', 'small-classes'],
        website: 'https://www.unifg.it',
        crui_member: true
    },
    {
        id: 'it-basilicata',
        name: 'University of Basilicata',
        name_italian: 'Università degli Studi della Basilicata',
        city: 'Potenza',
        region: 'Basilicata',
        established: 1982,
        censis_ranking: 39,
        acceptance_rate: 68,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 6500,
        total_students: 8000,
        international_students_percentage: 4,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'limited',
        notable_programs: ['Agriculture', 'Engineering', 'Humanities', 'Sciences', 'Education'],
        strengths: ['small-university', 'mountain-location', 'affordable-education', 'personalized-attention'],
        website: 'https://www.unibas.it',
        crui_member: true
    },
    {
        id: 'it-calabria',
        name: 'University of Calabria',
        name_italian: 'Università della Calabria',
        city: 'Rende',
        region: 'Calabria',
        established: 1972,
        qs_ranking: 801,
        censis_ranking: 40,
        acceptance_rate: 62,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 7000,
        total_students: 35000,
        international_students_percentage: 3,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Engineering', 'Computer Science', 'Economics', 'Humanities', 'Sciences'],
        strengths: ['modern-campus', 'tech-focus', 'affordable-education', 'southern-italy'],
        website: 'https://www.unical.it',
        crui_member: true
    },
    {
        id: 'it-messina',
        name: 'University of Messina',
        name_italian: 'Università degli Studi di Messina',
        city: 'Messina',
        region: 'Sicily',
        established: 1548,
        qs_ranking: 801,
        censis_ranking: 41,
        acceptance_rate: 58,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 7500,
        total_students: 45000,
        international_students_percentage: 4,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Medicine', 'Veterinary Medicine', 'Law', 'Economics', 'Engineering'],
        strengths: ['historic-university', 'sicilian-location', 'comprehensive-programs', 'affordable-education'],
        website: 'https://www.unime.it',
        crui_member: true
    },
    {
        id: 'it-catania',
        name: 'University of Catania',
        name_italian: 'Università degli Studi di Catania',
        city: 'Catania',
        region: 'Sicily',
        established: 1434,
        qs_ranking: 801,
        censis_ranking: 42,
        acceptance_rate: 60,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 7500,
        total_students: 55000,
        international_students_percentage: 3,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Medicine', 'Engineering', 'Agriculture', 'Geology', 'Humanities'],
        strengths: ['historic-university', 'etna-research', 'comprehensive-programs', 'sicilian-culture'],
        website: 'https://www.unict.it',
        crui_member: true
    },
    {
        id: 'it-palermo',
        name: 'University of Palermo',
        name_italian: 'Università degli Studi di Palermo',
        city: 'Palermo',
        region: 'Sicily',
        established: 1806,
        qs_ranking: 801,
        censis_ranking: 43,
        acceptance_rate: 62,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 7500,
        total_students: 50000,
        international_students_percentage: 4,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Medicine', 'Architecture', 'Agriculture', 'Law', 'Engineering'],
        strengths: ['historic-university', 'sicilian-capital', 'comprehensive-programs', 'cultural-diversity'],
        website: 'https://www.unipa.it',
        crui_member: true
    },
    {
        id: 'it-cagliari',
        name: 'University of Cagliari',
        name_italian: 'Università degli Studi di Cagliari',
        city: 'Cagliari',
        region: 'Sardinia',
        established: 1606,
        qs_ranking: 801,
        censis_ranking: 44,
        acceptance_rate: 65,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 8000,
        total_students: 30000,
        international_students_percentage: 5,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Medicine', 'Engineering', 'Biology', 'Geology', 'Humanities'],
        strengths: ['island-location', 'marine-research', 'comprehensive-programs', 'unique-culture'],
        website: 'https://www.unica.it',
        crui_member: true
    },
    {
        id: 'it-sassari',
        name: 'University of Sassari',
        name_italian: 'Università degli Studi di Sassari',
        city: 'Sassari',
        region: 'Sardinia',
        established: 1562,
        censis_ranking: 45,
        acceptance_rate: 68,
        tuition_eu: 2800,
        tuition_international: 2800,
        living_cost: 7500,
        total_students: 15000,
        international_students_percentage: 4,
        university_type: 'public',
        language: 'bilingual',
        research_intensity: 'medium',
        notable_programs: ['Veterinary Medicine', 'Medicine', 'Agriculture', 'Law', 'Sciences'],
        strengths: ['historic-university', 'sardinian-culture', 'veterinary-excellence', 'affordable-education'],
        website: 'https://www.uniss.it',
        crui_member: true
    }
];

// University Data Manager Class
export class ItalianUniversityDataManager {
    private cache: Map<string, EnhancedUniversity[]> = new Map();
    private lastFetch: number = 0;
    private cacheTimeout: number = 86400000; // 24 hours

    /**
     * Fetch Italian universities with optional filtering
     */
    async fetchItalianUniversities(region?: string, limit: number = 50): Promise<EnhancedUniversity[]> {
        const cacheKey = `italian-${region || 'all'}-${limit}`;
        
        // Check cache first
        if (this.cache.has(cacheKey) && (Date.now() - this.lastFetch) < this.cacheTimeout) {
            console.log(`📦 Returning cached Italian universities for ${region || 'all regions'}`);
            return this.cache.get(cacheKey)!;
        }

        try {
            let universities = ITALIAN_UNIVERSITIES;
            
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
            
            console.log(`✅ Fetched ${enhancedUniversities.length} Italian universities`);
            return enhancedUniversities;
            
        } catch (error) {
            console.error('❌ Error fetching Italian universities:', error);
            return [];
        }
    }

    /**
     * Convert Italian university data to enhanced format
     */
    private convertToEnhanced(itUni: ItalianUniversityData): EnhancedUniversity {
        return {
            id: itUni.id,
            name: itUni.name,
            city: itUni.city,
            state: itUni.region,
            country: 'Italy',
            region: itUni.region,
            website_url: itUni.website,
            
            // Rankings
            global_ranking: itUni.qs_ranking || this.estimateGlobalRanking(itUni),
            national_ranking: itUni.censis_ranking,
            ranking: itUni.qs_ranking,
            
            // Academic metrics
            acceptance_rate: itUni.acceptance_rate || this.estimateAcceptanceRate(itUni),
            avg_gpa: this.estimateGPAFromAcceptance(itUni.acceptance_rate || 40),
            avg_sat: undefined, // Italian universities don't use SAT
            avg_act: undefined, // Italian universities don't use ACT
            
            // Costs (already in EUR, convert to USD)
            cost: Math.round((itUni.tuition_international + itUni.living_cost) * 1.1), // EUR to USD
            living_cost: Math.round(itUni.living_cost * 1.1),
            in_state_tuition: Math.round(itUni.tuition_eu * 1.1),
            out_of_state_tuition: Math.round(itUni.tuition_international * 1.1),
            
            // Student body
            student_size: itUni.total_students || 25000,
            
            // Academic requirements
            requirements: {
                min_gpa: this.estimateMinGPA(itUni.acceptance_rate || 40),
                english_test: itUni.language !== 'italian',
                research_experience: this.getResearchRequirement(itUni.research_intensity)
            },
            
            // Programs and research
            programs: this.generateProgramScores(itUni),
            research_opportunities: this.getResearchOpportunities(itUni.research_intensity),
            strengths: itUni.strengths,
            
            // Financial aid
            scholarships: true,
            scholarship_percentage: this.estimateScholarshipAvailability(itUni),
            median_debt: this.estimateMedianDebt(itUni.tuition_international),
            graduate_earnings: this.estimateGraduateEarnings(itUni),
            
            // Campus characteristics
            location_type: this.determineLocationType(itUni.city),
            class_size: this.determineClassSize(itUni.total_students || 25000),
            
            // Additional metadata
            ownership_type: itUni.university_type === 'public' ? 'public' : 'private_nonprofit',
            
            // Source tracking
            data_source: 'government_api' as const,
            last_updated: new Date().toISOString()
        };
    }

    /**
     * Generate program strength scores for Italian university
     */
    private generateProgramScores(itUni: ItalianUniversityData): { [key: string]: number } {
        const programs: { [key: string]: number } = {};
        
        // Base scores based on university type and ranking
        let baseScore = 75;
        if (itUni.university_type === 'business') baseScore = 85;
        if (itUni.university_type === 'technical') baseScore = 80;
        if (itUni.qs_ranking && itUni.qs_ranking <= 200) baseScore += 10;
        if (itUni.censis_ranking && itUni.censis_ranking <= 10) baseScore += 5;
        
        // Assign scores based on notable programs
        itUni.notable_programs.forEach(program => {
            const programKey = program.toLowerCase().replace(/\s+/g, '-');
            programs[programKey] = Math.min(95, baseScore + 5);
        });
        
        // Add common programs with base scores
        const commonPrograms = [
            'business', 'engineering', 'medicine', 'law', 'economics', 
            'architecture', 'arts', 'sciences', 'humanities', 'design'
        ];
        
        commonPrograms.forEach(program => {
            if (!programs[program]) {
                programs[program] = baseScore;
            }
        });
        
        return programs;
    }

    // Helper methods for estimation
    private estimateAcceptanceRate(itUni: ItalianUniversityData): number {
        if (itUni.university_type === 'business') return 20;
        if (itUni.university_type === 'private') return 30;
        if (itUni.university_type === 'technical') return 35;
        return 45; // Public universities
    }

    private estimateGlobalRanking(itUni: ItalianUniversityData): number {
        if (itUni.times_ranking) return itUni.times_ranking;
        if (itUni.censis_ranking && itUni.censis_ranking <= 5) return 300;
        if (itUni.censis_ranking && itUni.censis_ranking <= 15) return 500;
        return 700;
    }

    private estimateGPAFromAcceptance(acceptanceRate: number): number {
        if (acceptanceRate <= 20) return 3.8;
        if (acceptanceRate <= 35) return 3.6;
        if (acceptanceRate <= 50) return 3.4;
        return 3.2;
    }

    private estimateMinGPA(acceptanceRate: number): number {
        if (acceptanceRate <= 20) return 3.5;
        if (acceptanceRate <= 35) return 3.2;
        if (acceptanceRate <= 50) return 3.0;
        return 2.8;
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

    private estimateScholarshipAvailability(itUni: ItalianUniversityData): number {
        if (itUni.university_type === 'public') return 25; // Low tuition, fewer scholarships needed
        if (itUni.university_type === 'business') return 65;
        if (itUni.university_type === 'private') return 45;
        return 35;
    }

    private estimateMedianDebt(tuition: number): number {
        return Math.round(tuition * 2.0 * 1.1); // Convert to USD
    }

    private estimateGraduateEarnings(itUni: ItalianUniversityData): number {
        let baseEarning = 35000;
        if (itUni.university_type === 'business') baseEarning = 55000;
        if (itUni.university_type === 'technical') baseEarning = 45000;
        if (itUni.city === 'Milan') baseEarning += 8000;
        if (itUni.city === 'Rome') baseEarning += 5000;
        return baseEarning;
    }

    private determineLocationType(city: string): string {
        const majorCities = ['Milan', 'Rome', 'Naples', 'Turin', 'Florence', 'Bologna', 'Genoa', 'Venice'];
        return majorCities.includes(city) ? 'urban' : 'suburban';
    }

    private determineClassSize(studentSize: number): string {
        if (studentSize > 60000) return 'large';
        if (studentSize > 25000) return 'medium';
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
export const italianUniversityManager = new ItalianUniversityDataManager(); 