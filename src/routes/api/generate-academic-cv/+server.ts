import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
});

export const POST: RequestHandler = async ({ request }) => {
    try {
        const cvData = await request.json();
        
        const prompt = buildCVPrompt(cvData);
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are an expert academic CV writer with extensive knowledge of academic standards and field-specific requirements. Create professional, well-formatted academic CVs that follow academic conventions for different fields. Focus on clarity, proper academic formatting, and field-appropriate emphasis.`
                },
                {
                    role: "user", 
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 2000
        });

        const cv = completion.choices[0]?.message?.content || '';
        
        return json({ cv });
        
    } catch (error) {
        console.error('Error generating academic CV:', error);
        return json({ error: 'Failed to generate CV' }, { status: 500 });
    }
};

function buildCVPrompt(cvData: any): string {
    const templateGuides = {
        stem: 'STEM fields emphasize research, publications, technical skills, and quantifiable achievements. Include methodologies, tools, and technologies used.',
        humanities: 'Humanities fields focus on teaching, publications, languages, conferences, and scholarly engagement. Emphasize critical thinking and cultural competency.',
        social_sciences: 'Social sciences balance research, fieldwork, community engagement, and policy relevance. Include both qualitative and quantitative methods.',
        business: 'Business/Economics emphasizes practical experience, certifications, quantifiable results, and industry connections alongside academic achievements.',
        medical: 'Medical fields require clinical experience, certifications, continuing education, and patient care alongside research. Include licenses and specializations.',
        arts: 'Arts and creative fields showcase portfolio work, exhibitions, performances, grants, and creative collaborations alongside traditional academic metrics.'
    };

    let prompt = `Create a professional academic CV for the ${cvData.template.replace('_', ' ')} field. 

TEMPLATE GUIDANCE: ${templateGuides[cvData.template as keyof typeof templateGuides]}

PERSONAL INFORMATION:
Name: ${cvData.personalInfo.fullName}
Email: ${cvData.personalInfo.email}
Phone: ${cvData.personalInfo.phone || 'Not provided'}
Address: ${cvData.personalInfo.address || 'Not provided'}`;

    if (cvData.personalInfo.website) {
        prompt += `\nWebsite: ${cvData.personalInfo.website}`;
    }

    // Education Section
    if (cvData.education && cvData.education.length > 0) {
        prompt += `\n\nEDUCATION:`;
        cvData.education.forEach((edu: any) => {
            if (edu.degree && edu.institution) {
                prompt += `\n- ${edu.degree}, ${edu.institution}`;
                if (edu.year) prompt += ` (${edu.year})`;
                if (edu.gpa) prompt += ` - GPA: ${edu.gpa}`;
                if (edu.thesis) prompt += `\n  Thesis: "${edu.thesis}"`;
                if (edu.advisor) prompt += `\n  Advisor: ${edu.advisor}`;
            }
        });
    }

    // Research Experience
    if (cvData.research && cvData.research.length > 0) {
        prompt += `\n\nRESEARCH EXPERIENCE:`;
        cvData.research.forEach((research: any) => {
            if (research.title) {
                prompt += `\n- ${research.title}`;
                if (research.institution) prompt += ` - ${research.institution}`;
                if (research.duration) prompt += ` (${research.duration})`;
                if (research.supervisor) prompt += `\n  Supervisor: ${research.supervisor}`;
                if (research.description) prompt += `\n  ${research.description}`;
            }
        });
    }

    // Publications
    if (cvData.publications && cvData.publications.length > 0) {
        prompt += `\n\nPUBLICATIONS:`;
        cvData.publications.forEach((pub: any) => {
            if (pub.citation) {
                prompt += `\n- [${pub.type.toUpperCase()}] ${pub.citation} (${pub.year})`;
            }
        });
    }

    // Professional Experience
    if (cvData.experience && cvData.experience.length > 0) {
        prompt += `\n\nPROFESSIONAL EXPERIENCE:`;
        cvData.experience.forEach((exp: any) => {
            if (exp.title && exp.organization) {
                prompt += `\n- ${exp.title} - ${exp.organization}`;
                if (exp.duration) prompt += ` (${exp.duration})`;
                if (exp.description) prompt += `\n  ${exp.description}`;
            }
        });
    }

    // Awards and Honors
    if (cvData.awards && cvData.awards.length > 0) {
        prompt += `\n\nAWARDS AND HONORS:`;
        cvData.awards.forEach((award: any) => {
            if (award.title) {
                prompt += `\n- ${award.title}`;
                if (award.organization) prompt += ` - ${award.organization}`;
                if (award.year) prompt += ` (${award.year})`;
                if (award.amount) prompt += ` - ${award.amount}`;
            }
        });
    }

    // Skills
    if (cvData.skills) {
        if (cvData.skills.technical && cvData.skills.technical.length > 0) {
            prompt += `\n\nTECHNICAL SKILLS: ${cvData.skills.technical.join(', ')}`;
        }
        if (cvData.skills.software && cvData.skills.software.length > 0) {
            prompt += `\n\nSOFTWARE & TOOLS: ${cvData.skills.software.join(', ')}`;
        }
        if (cvData.skills.languages && cvData.skills.languages.length > 0) {
            prompt += `\n\nLANGUAGES: ${cvData.skills.languages.join(', ')}`;
        }
    }

    // Custom requests
    if (cvData.customRequests) {
        prompt += `\n\nADDITIONAL INSTRUCTIONS: ${cvData.customRequests}`;
    }

    prompt += `\n\nPlease create a well-formatted, professional academic CV following these guidelines:
1. Use clear section headers and consistent formatting
2. Prioritize sections based on the ${cvData.template.replace('_', ' ')} field conventions
3. Include proper academic formatting (reverse chronological order for education/experience)
4. Use action verbs and quantify achievements where possible
5. Maintain professional tone appropriate for academic contexts
6. Format for clarity and easy scanning by academic committees
7. Include all provided information in appropriate sections
8. Add any missing standard sections that would be expected in this field
9. Ensure the CV is polished and ready for academic applications

Format the output as a clean, professional CV that can be easily copied and pasted.`;

    return prompt;
} 