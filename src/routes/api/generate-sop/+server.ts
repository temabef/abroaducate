import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private';

// Define interfaces for the expected form data structure
interface Project {
    text: string;
}

interface Award {
    title: string;
    description: string;
}

interface WorkExperience {
    company: string;
    position: string;
    responsibilities: string[];
    companyDescription?: string;
    skills?: string;
    projects?: string;
}

interface Organization {
    name: string;
    role: string;
    description: string;
}

interface CommunityService {
    organization: string;
    role: string;
    impact: string;
}

interface FormData {
    universityData: {
        university: string;
        country: string;
        program: string;
    };
    academicData: {
        degreeType: string;
        fieldOfStudy: string;
        universityName: string;
        gpa: string;
        relevantCourses: string;
        selectedAspiration: string;
        selectedQualities: string[];
        customAspiration: string;
        isCustomQuality: boolean;
        customQualityReason: string;
        isBestChoiceSelected: boolean;
    };
    workExperiences: WorkExperience[];
    extraCurricular: {
        showOrganizationsForm: boolean;
        organizations: Organization[];
        showCommunityServiceForm: boolean;
        communityServices: CommunityService[];
        showHobbiesForm: boolean;
        hobbies: string;
        showAchievementsForm: boolean;
        projects: Project[];
        achievements: Award[];
    };
}

export async function POST({ request }) {
    try {
        const formData: FormData = await request.json(); // Corrected: directly parse the JSON body as FormData

        // --- START NEW DEBUG LOGGING ---
        console.log('Backend: Received formData:', JSON.stringify(formData, null, 2));
        console.log('Backend: formData.workExperiences:', JSON.stringify(formData.workExperiences, null, 2));
        console.log('Backend: formData.extraCurricular:', JSON.stringify(formData.extraCurricular, null, 2));
        console.log('Backend: formData.extraCurricular.organizations:', JSON.stringify(formData.extraCurricular?.organizations, null, 2));
        console.log('Backend: formData.extraCurricular.communityServices:', JSON.stringify(formData.extraCurricular?.communityServices, null, 2));
        console.log('Backend: formData.extraCurricular.projects:', JSON.stringify(formData.extraCurricular?.projects, null, 2));
        console.log('Backend: formData.extraCurricular.achievements:', JSON.stringify(formData.extraCurricular?.achievements, null, 2));
        // --- END NEW DEBUG LOGGING ---


        const prompt = `Generate a comprehensive, compelling, and professional Statement of Purpose (SOP) between 750-1000 words for university admissions, based on the following applicant's data.\n\n        **Opening:** Begin the SOP with an engaging and relevant opening. This could be a brief personal anecdote, a relevant quote, a compelling question, or a concise statement that immediately captures the reader's attention and connects to your aspirations or experiences. Choose the best approach that resonates with the provided information.\n\n        **Structure and Content:** The SOP should clearly articulate your motivation for pursuing the chosen program, demonstrate your relevant academic and professional background, highlight your unique qualities, and explain how your experiences align with the program's objectives and the university's values. Conclude with a strong statement of your future goals and how this program will help you achieve them. Ensure a formal and academic tone throughout.\n\n        **Applicant Details:**\n
        **University Application Details:**\n        - University: ${formData.universityData.university || 'Not provided'}\n        - Country: ${formData.universityData.country || 'Not provided'}\n        - Program: ${formData.universityData.program || 'Not provided'}\n
        **Academic Background:**\n        - Degree Type: ${formData.academicData.degreeType || 'Not provided'}\n        - Field of Study: ${formData.academicData.fieldOfStudy || 'Not provided'}\n        - University Name (Academic): ${formData.academicData.universityName || 'Not provided'}\n        - GPA: ${formData.academicData.gpa || 'N/A'}\n        - Relevant Courses: ${formData.academicData.relevantCourses || 'N/A'}\n        - Primary Aspiration for Program: ${formData.academicData.selectedAspiration || 'N/A'}${formData.academicData.isBestChoiceSelected && formData.academicData.customAspiration ? ` (Custom Aspiration: ${formData.academicData.customAspiration})` : ''}\n        - Key Qualities: ${formData.academicData.selectedQualities && formData.academicData.selectedQualities.length > 0 ? formData.academicData.selectedQualities.join(', ') : 'N/A'}${formData.academicData.isCustomQuality && formData.academicData.customQualityReason ? ` (Custom Quality Reason: ${formData.academicData.customQualityReason})` : ''}\n
        **Work Experience (if applicable):**\n        ${(formData.workExperiences ?? []).length > 0 ? formData.workExperiences.map((we: WorkExperience, index: number) => `
        Work Experience ${index + 1}:
            - Company: ${we.company || 'N/A'}
            - Position: ${we.position || 'N/A'}
            - Responsibilities: ${we.responsibilities.filter(Boolean).join('; ') || 'N/A'}
            ${we.companyDescription ? `- Company Description: ${we.companyDescription}` : ''}
            ${we.skills ? `- Skills Utilized: ${we.skills}` : ''}
            ${we.projects ? `- Projects: ${we.projects}` : ''}
        `).join('\n') : 'N/A'}\n
        **Extra-Curricular Activities (if applicable):**\n        ${(formData.extraCurricular.organizations ?? []).length > 0 ? `
        - Organizations: ${(formData.extraCurricular.organizations ?? []).map((o: Organization) => `${o.name || 'N/A'} (${o.role || 'N/A'}): ${o.description || 'N/A'}`).filter(Boolean).join('; ')}` : ''}\n        ${(formData.extraCurricular.communityServices ?? []).length > 0 ? `
        - Community Services: ${(formData.extraCurricular.communityServices ?? []).map((cs: CommunityService) => `${cs.organization || 'N/A'} (${cs.role || 'N/A'}): ${cs.impact || 'N/A'}`).filter(Boolean).join('; ')}` : ''}\n        ${(formData.extraCurricular.projects ?? []).length > 0 ? `
        - Projects: ${(formData.extraCurricular.projects ?? []).map((p: Project) => p.text || 'N/A').filter(Boolean).join('; ')}` : ''}\n        ${(formData.extraCurricular.achievements ?? []).length > 0 ? `
        - Achievements: ${(formData.extraCurricular.achievements ?? []).map((a: Award) => `${a.title || 'N/A'}: ${a.description || 'N/A'}`).filter(Boolean).join('; ')}` : ''}\n        ${formData.extraCurricular.hobbies ? `
        - Hobbies: ${formData.extraCurricular.hobbies}` : ''}
        ${(!formData.extraCurricular.organizations?.length && !formData.extraCurricular.communityServices?.length && !formData.extraCurricular.projects?.length && !formData.extraCurricular.achievements?.length && !formData.extraCurricular.hobbies) ? 'N/A' : ''}\n\n        Start with a formal salutation and end with a formal closing.\n        `;

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are a helpful assistant for writing Statements of Purpose for university admissions." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 1500,
            })
        });

        if (!openaiResponse.ok) {
            const errorData = await openaiResponse.json();
            console.error('OpenAI API error:', errorData);
            return json({ error: errorData.error.message }, { status: openaiResponse.status });
        }

        const openaiData = await openaiResponse.json();
        const generatedSOP = openaiData.choices[0].message.content;

        return json({ generatedSOP });

    } catch (error) {
        console.error('Error in SOP generation endpoint:', error);
        return json({ error: (error as any).message || 'Internal server error' }, { status: 500 });
    }
}