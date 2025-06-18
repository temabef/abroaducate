import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface PersonalStatementFormData {
    applicationType: 'undergraduate' | 'scholarship' | 'law_school' | 'medical_school' | 'study_abroad' | 'professional';
    institutionName: string;
    programName: string;
    applicationDeadline?: string;
    wordLimit?: number;
    personalInfo: {
        name: string;
        email: string;
        currentEducation: string;
        hometown: string;
    };
    personalDetails: {
        // Core story elements
        formativeExperience: string;
        challengesOvercome: string;
        valuesAndBeliefs: string;
        passionsAndInterests: string;
        communityImpact: string;
        futureGoals: string;
        whyThisProgram: string;
        // Application-specific fields
        academicInterests?: string; // For undergraduate
        needExplanation?: string; // For scholarships
        legalInterest?: string; // For law school
        serviceExperience?: string; // For medical school
        culturalGoals?: string; // For study abroad
        leadershipExperience?: string; // For professional programs
    };
    customRequests?: string;
}

const defaultFormData: PersonalStatementFormData = {
    applicationType: 'undergraduate',
    institutionName: '',
    programName: '',
    personalInfo: {
        name: '',
        email: '',
        currentEducation: '',
        hometown: ''
    },
    personalDetails: {
        formativeExperience: '',
        challengesOvercome: '',
        valuesAndBeliefs: '',
        passionsAndInterests: '',
        communityImpact: '',
        futureGoals: '',
        whyThisProgram: ''
    }
};

export const personalStatementFormStore = writable<PersonalStatementFormData>(defaultFormData);
export const personalStatementPendingGeneration = writable<boolean>(false);

const PERSONAL_STATEMENT_STORAGE_KEY = 'personalStatementFormData';

export function savePersonalStatementStateToSessionStorage(state: PersonalStatementFormData): void {
    if (browser) {
        try {
            sessionStorage.setItem(PERSONAL_STATEMENT_STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save personal statement form state:', error);
        }
    }
}

export function loadPersonalStatementStateFromSessionStorage(): Partial<PersonalStatementFormData> {
    if (browser) {
        try {
            const saved = sessionStorage.getItem(PERSONAL_STATEMENT_STORAGE_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Failed to load personal statement form state:', error);
        }
    }
    return {};
}

export function clearPersonalStatementStateFromSessionStorage(): void {
    if (browser) {
        try {
            sessionStorage.removeItem(PERSONAL_STATEMENT_STORAGE_KEY);
        } catch (error) {
            console.error('Failed to clear personal statement form state:', error);
        }
    }
} 