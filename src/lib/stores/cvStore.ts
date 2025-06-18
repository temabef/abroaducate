import { writable } from 'svelte/store';

interface CVFormData {
    // Personal Information
    personalInfo: {
        fullName: string;
        email: string;
        phone: string;
        address: string;
        website?: string;
        orcid?: string;
        linkedin?: string;
    };
    
    // Academic Field
    academicField: 'stem' | 'humanities' | 'social_sciences' | 'medical' | 'business' | 'arts' | 'other';
    
    // Education
    education: Array<{
        degree: string;
        institution: string;
        year: string;
        gpa?: string;
        location: string;
        thesis?: string;
        advisor?: string;
    }>;
    
    // Experience
    experience: Array<{
        title: string;
        institution: string;
        duration: string;
        description: string;
        location: string;
    }>;
    
    // Publications
    publications: Array<{
        title: string;
        authors: string;
        journal: string;
        year: string;
        doi?: string;
    }>;
    
    // Skills & Competencies
    skills: {
        technical: string[];
        languages: Array<{
            language: string;
            proficiency: string;
        }>;
        software: string[];
    };
    
    // Awards & Honors
    awards: Array<{
        title: string;
        organization: string;
        year: string;
        description?: string;
    }>;
    
    // Optional Sections
    optional: {
        conferences: Array<{
            title: string;
            event: string;
            year: string;
            location: string;
        }>;
        grants: Array<{
            title: string;
            agency: string;
            amount?: string;
            year: string;
        }>;
        teaching: Array<{
            course: string;
            institution: string;
            role: string;
            year: string;
        }>;
        service: Array<{
            role: string;
            organization: string;
            duration: string;
        }>;
    };
}

const defaultCVData: CVFormData = {
    personalInfo: {
        fullName: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        orcid: '',
        linkedin: ''
    },
    academicField: 'stem',
    education: [],
    experience: [],
    publications: [],
    skills: {
        technical: [],
        languages: [],
        software: []
    },
    awards: [],
    optional: {
        conferences: [],
        grants: [],
        teaching: [],
        service: []
    }
};

export const cvFormStore = writable<CVFormData>(defaultCVData);

// Helper functions for adding/removing array items
export function addEducation() {
    cvFormStore.update(data => ({
        ...data,
        education: [...data.education, {
            degree: '',
            institution: '',
            year: '',
            gpa: '',
            location: '',
            thesis: '',
            advisor: ''
        }]
    }));
}

export function removeEducation(index: number) {
    cvFormStore.update(data => ({
        ...data,
        education: data.education.filter((_, i) => i !== index)
    }));
}

export function addExperience() {
    cvFormStore.update(data => ({
        ...data,
        experience: [...data.experience, {
            title: '',
            institution: '',
            duration: '',
            description: '',
            location: ''
        }]
    }));
}

export function removeExperience(index: number) {
    cvFormStore.update(data => ({
        ...data,
        experience: data.experience.filter((_, i) => i !== index)
    }));
}

export function addPublication() {
    cvFormStore.update(data => ({
        ...data,
        publications: [...data.publications, {
            title: '',
            authors: '',
            journal: '',
            year: '',
            doi: ''
        }]
    }));
}

export function removePublication(index: number) {
    cvFormStore.update(data => ({
        ...data,
        publications: data.publications.filter((_, i) => i !== index)
    }));
}

export function addAward() {
    cvFormStore.update(data => ({
        ...data,
        awards: [...data.awards, {
            title: '',
            organization: '',
            year: '',
            description: ''
        }]
    }));
}

export function removeAward(index: number) {
    cvFormStore.update(data => ({
        ...data,
        awards: data.awards.filter((_, i) => i !== index)
    }));
}

// Reset function
export function resetCVForm() {
    cvFormStore.set(defaultCVData);
} 