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
                    content: `You are an expert academic CV writer. Create clean, professional academic CVs using a simple single-column format with horizontal line separators between sections. Follow standard academic formatting conventions and ensure the CV is professional, scannable, and appropriate for academic applications.`
                },
                {
                    role: "user", 
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 2500
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

    let prompt = `Create a professional academic CV for the ${cvData.template.replace('_', ' ')} field using this EXACT FORMAT:

${cvData.personalInfo.fullName.toUpperCase()}
${cvData.personalInfo.address || 'Address'}
${cvData.personalInfo.phone || 'Phone'} | ${cvData.personalInfo.email}${cvData.personalInfo.website ? ' | ' + cvData.personalInfo.website : ''}

_______________________________________________________________________________

EDUCATION`;

    // Education Section
    if (cvData.education && cvData.education.length > 0) {
        cvData.education.forEach((edu: any) => {
            if (edu.degree && edu.institution) {
                prompt += `\n• ${edu.degree}, ${edu.institution}`;
                if (edu.year) prompt += ` (${edu.year})`;
                if (edu.gpa) prompt += `\n  GPA: ${edu.gpa}`;
                if (edu.thesis) prompt += `\n  Thesis: "${edu.thesis}"`;
                if (edu.advisor) prompt += `\n  Advisor: ${edu.advisor}`;
            }
        });
    }

    prompt += `\n\n_______________________________________________________________________________

RESEARCH EXPERIENCE & INTERESTS`;

    // Research Experience
    if (cvData.research && cvData.research.length > 0) {
        cvData.research.forEach((research: any) => {
            if (research.title) {
                prompt += `\n• ${research.title}`;
                if (research.institution) prompt += `, ${research.institution}`;
                if (research.duration) prompt += ` (${research.duration})`;
                if (research.supervisor) prompt += `\n  Supervisor: ${research.supervisor}`;
                if (research.description) prompt += `\n  ${research.description}`;
            }
        });
    }

    // Publications Section
    if (cvData.publications && cvData.publications.length > 0) {
        prompt += `\n\n_______________________________________________________________________________

PUBLICATIONS`;
        cvData.publications.forEach((pub: any) => {
            if (pub.citation) {
                prompt += `\n• ${pub.citation} (${pub.year})`;
            }
        });
    }

    // Professional Experience
    if (cvData.experience && cvData.experience.length > 0) {
        prompt += `\n\n_______________________________________________________________________________

RELEVANT WORK EXPERIENCE`;
        cvData.experience.forEach((exp: any) => {
            if (exp.title && exp.organization) {
                prompt += `\n• ${exp.title}, ${exp.organization}`;
                if (exp.duration) prompt += ` (${exp.duration})`;
                if (exp.description) prompt += `\n  ${exp.description}`;
            }
        });
    }

    // Awards and Honors
    if (cvData.awards && cvData.awards.length > 0) {
        prompt += `\n\n_______________________________________________________________________________

HONORS AND AWARDS`;
        cvData.awards.forEach((award: any) => {
            if (award.title) {
                prompt += `\n• ${award.title}`;
                if (award.organization) prompt += `, ${award.organization}`;
                if (award.year) prompt += ` (${award.year})`;
            }
        });
    }

    // Skills
    if (cvData.skills && (cvData.skills.technical?.length > 0 || cvData.skills.software?.length > 0)) {
        prompt += `\n\n_______________________________________________________________________________

TECHNICAL SKILLS`;
        if (cvData.skills.technical && cvData.skills.technical.length > 0) {
            prompt += `\n${cvData.skills.technical.join(', ')}`;
        }
        if (cvData.skills.software && cvData.skills.software.length > 0) {
            prompt += `\n\nSOFTWARE & TOOLS\n${cvData.skills.software.join(', ')}`;
        }
    }

    // Languages
    if (cvData.skills && cvData.skills.languages && cvData.skills.languages.length > 0) {
        prompt += `\n\n_______________________________________________________________________________

LANGUAGES SPOKEN\n${cvData.skills.languages.join(', ')}`;
    }

    prompt += `\n\n_______________________________________________________________________________

REFERENCES\nAvailable on request

FORMATTING INSTRUCTIONS:
1. Use the EXACT format shown above with underscores as section dividers
2. Keep it single-column, clean, and professional
3. Use bullet points (•) for each entry
4. Maintain consistent spacing and indentation
5. Put institution/organization names after titles, separated by commas
6. Include dates in parentheses at the end of entries
7. Use proper academic formatting conventions
8. Keep the header simple with name in ALL CAPS
9. End with "References: Available on request"
10. Field-specific guidance: ${templateGuides[cvData.template as keyof typeof templateGuides]}

Generate a clean, professional academic CV that follows this exact formatting structure.`;

    return prompt;
} 