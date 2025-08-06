// University Data
export interface UniversityData {
    university: string;
    country: string;
    program: string;
}

// User interface for admin management
export interface User {
    id: string;
    email: string;
    full_name?: string;
    created_at: string;
    updated_at: string;
    subscription_plan?: string;
    is_admin?: boolean;
    last_sign_in_at?: string;
}

// Academic Data
export interface AcademicData {
    degreeType: string;
    fieldOfStudy: string;
    universityName: string;
    gpa: string;
}

// Relevant Course
export interface RelevantCourse {
    name: string;
    description: string;
}

// Project
export interface Project {
    title: string;
    description: string;
    technologies?: string;
}

// Achievement
export interface Achievement {
    title: string;
    description: string;
    date?: string;
}

// Work Experience
export interface WorkExperience {
    company: string;
    position: string;
    responsibilities: string[];
    companyDescription: string;
    skills: string;
    projects: string;
}

// Organization
export interface Organization {
    name: string;
    role: string;
    description: string;
}

// Community Service
export interface CommunityService {
    organization: string;
    role: string;
    impact: string;
}

// Main Form State
export interface FormData {
    currentStep: number;
    universityData: UniversityData;
    academicData: AcademicData;
    relevantCourses: RelevantCourse[];
    projects: Project[];
    achievements: Achievement[];
    selectedQualities: string[];
    selectedAspirations: string[];
    customAspiration: string;
    isBestChoiceSelected: boolean;
    isCustomQuality: boolean;
    customQualityReason: string;
    showWorkExperienceForm: boolean;
    workExperiences: WorkExperience[];
    showOrganizationsForm: boolean;
    organizations: Organization[];
    showCommunityServiceForm: boolean;
    communityServices: CommunityService[];
    showHobbiesForm: boolean;
    hobbies: string;
    showAchievementsForm: boolean;
} 