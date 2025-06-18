import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface CoverLetterFormData {
    positionType: 'academic' | 'industry' | 'government' | 'hybrid';
    jobTitle: string;
    companyName: string;
    applicationDeadline?: string;
    jobDescription?: string;
    requirements?: string;
    personalInfo: {
        name: string;
        email: string;
        phone: string;
        address: string;
    };
    positionDetails: {
        // Academic fields
        researchArea?: string;
        publications?: string;
        academicAchievements?: string;
        // Industry fields
        targetRole?: string;
        companyResearch?: string;
        relevantSkills?: string;
        businessImpact?: string;
        // Universal fields
        experience: string;
        achievements: string;
        motivations: string;
        careerGoals: string;
    };
    customRequests?: string;
}

const defaultFormData: CoverLetterFormData = {
    positionType: 'academic',
    jobTitle: '',
    companyName: '',
    personalInfo: {
        name: '',
        email: '',
        phone: '',
        address: ''
    },
    positionDetails: {
        experience: '',
        achievements: '',
        motivations: '',
        careerGoals: ''
    }
};

export const coverLetterFormStore = writable<CoverLetterFormData>(defaultFormData);
export const coverLetterPendingGeneration = writable<boolean>(false);

const COVER_LETTER_STORAGE_KEY = 'coverLetterFormData';

export function saveCoverLetterStateToSessionStorage(state: CoverLetterFormData): void {
    if (browser) {
        try {
            sessionStorage.setItem(COVER_LETTER_STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save cover letter form state:', error);
        }
    }
}

export function loadCoverLetterStateFromSessionStorage(): Partial<CoverLetterFormData> {
    if (browser) {
        try {
            const saved = sessionStorage.getItem(COVER_LETTER_STORAGE_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Failed to load cover letter form state:', error);
        }
    }
    return {};
}

export function clearCoverLetterStateFromSessionStorage(): void {
    if (browser) {
        try {
            sessionStorage.removeItem(COVER_LETTER_STORAGE_KEY);
        } catch (error) {
            console.error('Failed to clear cover letter form state:', error);
        }
    }
} 