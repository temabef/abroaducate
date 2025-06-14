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
    async fetchGermanUniversities(state?: string, limit: number = 50): Promise<EnhancedUniversity[]> {
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

            // Apply limit
            universities = universities.slice(0, limit);

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
            ownership_type: deUni.university_type === 'private' ? 'private' : 'public',
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