import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { FormData, UniversityData } from '$lib/types';

// --- Initial State ---

const initialFormData: FormData = {
	currentStep: 1,
	universityData: {
		university: '',
		country: '',
		program: ''
	},
	academicData: {
		degreeType: '',
		fieldOfStudy: '',
		universityName: '',
		gpa: ''
	},
	relevantCourses: [{ name: '', description: '' }],
	projects: [{ title: '', description: '', technologies: '' }],
	achievements: [{ title: '', description: '', date: '' }],
	selectedQualities: [],
	selectedAspirations: [],
	customAspiration: '',
	isBestChoiceSelected: false,
	isCustomQuality: false,
	customQualityReason: '',
	showWorkExperienceForm: false,
	workExperiences: [{ 
		company: '', 
		position: '', 
		responsibilities: [''], 
		companyDescription: '', 
		skills: '', 
		projects: '' 
	}],
	showOrganizationsForm: false,
	organizations: [{ name: '', role: '', description: '' }],
	showCommunityServiceForm: false,
	communityServices: [{ organization: '', role: '', impact: '' }],
	showHobbiesForm: false,
	hobbies: '',
	showAchievementsForm: false
};

// --- Store Creation ---

function createFormStore() {
	const { subscribe, set, update }: Writable<FormData> = writable(initialFormData);

	return {
		subscribe,
		set,
		update,
		updateUniversityData: (data: Partial<UniversityData>) => {
			update(s => ({ ...s, universityData: { ...s.universityData, ...data } }));
		},
		// Helper functions for dynamic sections
		addRelevantCourse: () => {
			update(s => ({ ...s, relevantCourses: [...s.relevantCourses, { name: '', description: '' }] }));
		},
		removeRelevantCourse: (index: number) => {
			update(s => ({ ...s, relevantCourses: s.relevantCourses.filter((_, i) => i !== index) }));
		},
		addProject: () => {
			update(s => ({ ...s, projects: [...s.projects, { title: '', description: '', technologies: '' }] }));
		},
		removeProject: (index: number) => {
			update(s => ({ ...s, projects: s.projects.filter((_, i) => i !== index) }));
		},
		addAchievement: () => {
			update(s => ({ ...s, achievements: [...s.achievements, { title: '', description: '', date: '' }] }));
		},
		removeAchievement: (index: number) => {
			update(s => ({ ...s, achievements: s.achievements.filter((_, i) => i !== index) }));
		}
	};
}

export const formStore = createFormStore();

// Store to track pending SOP generation
export const pendingGeneration = writable<boolean>(false);

// --- Persistence Functions ---

export function saveStateToSessionStorage(state: FormData) {
	if (typeof window !== 'undefined') {
		sessionStorage.setItem('formState', JSON.stringify(state));
	}
}

export function loadStateFromSessionStorage(): Partial<FormData> {
	if (typeof window !== 'undefined') {
		const saved = sessionStorage.getItem('formState');
		if (saved) {
			try {
				return JSON.parse(saved);
			} catch (e) {
				console.error('Error parsing saved form state:', e);
			}
		}
	}
	return {};
}

export function clearStateFromSessionStorage() {
	if (typeof window !== 'undefined') {
		sessionStorage.removeItem('formState');
	}
} 