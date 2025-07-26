import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { checkComprehensiveUsageLimit, incrementComprehensiveUsage } from '$lib/comprehensive-usage-limits';
import { getModelConfig } from '$lib/ai-models';

export const POST: RequestHandler = async ({ request, locals: { supabase, getSession } }) => {
    const session = await getSession();
    
    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Define schema for validation
    const personalStatementSchema = z.object({
        institutionName: z.string().min(1).max(200),
        personalDetails: z.object({
            formativeExperience: z.string().min(10).max(2000),
            academicInterests: z.string().min(10).max(2000).optional(),
            careerGoals: z.string().min(10).max(2000).optional(),
            relevantExperience: z.string().min(10).max(2000).optional()
        }),
        customRequests: z.string().max(1000).optional().default(''),
        wordLimit: z.number().int().min(100).max(5000).optional()
    });
    
    try {
        const requestData = await request.json();

        // Validate and sanitize input
        const parsed = personalStatementSchema.safeParse(requestData);
        if (!parsed.success) {
            return json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
        }
        const data = parsed.data;
        
        if (!data.institutionName || !data.personalDetails.formativeExperience) {
            return json({ error: 'Institution name and formative experience are required' }, { status: 400 });
        }
        
        // Generate personal statement using AI
        const generatedPersonalStatement = await generatePersonalStatementWithAI(data, supabase, session.user.id);
        
        // Increment usage counter after successful generation
        await incrementComprehensiveUsage(session.user.id, 'personal_statement_generation');
        
        return json({
            success: true,
            personalStatement: generatedPersonalStatement
        });
        
    } catch (error) {
        console.error('Error generating personal statement:', error);
        return json({ error: 'Failed to generate personal statement' }, { status: 500 });
    }
};

async function generatePersonalStatementWithAI(data: any, supabase: any, userId: string): Promise<string> {
    const { applicationType, institutionName, programName, personalInfo, personalDetails, wordLimit, customRequests } = data;
    
    // Create application-specific prompts
    const basePrompt = `You are an expert admissions consultant and personal statement writer specializing in creating compelling, authentic personal narratives. Create a personal statement that tells a powerful story and showcases character.`;
    
    const applicationPrompts = {
        undergraduate: `Focus on personal growth, character development, academic curiosity, and potential. Emphasize experiences that shaped values, challenges overcome, and readiness for college. Use conversational yet thoughtful tone. Show passion for learning and contribution to campus community.`,
        
        scholarship: `Focus on personal journey, financial need/merit justification, community impact, and gratitude. Emphasize overcoming obstacles, giving back, and how the scholarship will enable goals. Use humble yet confident tone. Show genuine appreciation and specific plans.`,
        
        law_school: `Focus on experiences that sparked interest in justice, analytical thinking, advocacy for others, and ethical principles. Emphasize critical thinking, communication skills, and commitment to legal profession. Use professional yet personal tone.`,
        
        medical_school: `Focus on calling to heal, service experiences, empathy development, and resilience. Emphasize patient interactions, understanding of medicine's demands, and compassionate care. Use sincere, service-oriented tone. Show dedication to helping others.`,
        
        study_abroad: `Focus on cultural curiosity, adaptability, global perspective, and personal growth. Emphasize desire to understand different cultures, language learning, and becoming a global citizen. Use adventurous yet respectful tone.`,
        
        professional: `Focus on career progression, leadership experiences, business acumen, and professional goals. Emphasize achievements, team collaboration, and strategic thinking. Use professional yet authentic tone. Show value creation and leadership potential.`
    };
    
    const structureGuidance = {
        undergraduate: `Opening hook about formative experience → Character development through challenges → Academic/extracurricular engagement → Future goals and contribution to campus`,
        scholarship: `Personal background and journey → Financial need/merit context → Community impact and giving back → How scholarship enables goals and future giving`,
        law_school: `What sparked interest in law → Experiences demonstrating analytical/advocacy skills → Understanding of legal profession → Career goals and impact vision`,
        medical_school: `Calling to medicine → Service experiences and patient interactions → Understanding of profession's demands → Commitment to compassionate care`,
        study_abroad: `Cultural curiosity and global interests → Relevant experiences with diversity → Specific program appeal → Growth goals and contribution`,
        professional: `Career journey and achievements → Leadership and business impact → Program fit and learning goals → Professional vision and contribution`
    };
    
    const wordLimitGuidance = wordLimit ? `Keep the personal statement to approximately ${wordLimit} words.` : 'Aim for 500-750 words unless specified otherwise.';
    
    const contextualPrompt = `
    APPLICATION CONTEXT:
    - Application Type: ${applicationType.replace('_', ' ')}
    - Institution: ${institutionName}
    - Program: ${programName}
    - Word Limit: ${wordLimitGuidance}
    - ${applicationPrompts[applicationType as keyof typeof applicationPrompts]}
    
    APPLICANT INFORMATION:
    - Name: ${personalInfo.name}
    - Current Education: ${personalInfo.currentEducation}
    - Hometown: ${personalInfo.hometown}
    
    PERSONAL STORY ELEMENTS:
    - Formative Experience: ${personalDetails.formativeExperience}
    - Challenges Overcome: ${personalDetails.challengesOvercome || 'Not provided'}
    - Core Values: ${personalDetails.valuesAndBeliefs || 'Not provided'}
    - Passions: ${personalDetails.passionsAndInterests || 'Not provided'}
    - Future Goals: ${personalDetails.futureGoals || 'Not provided'}
    - Why This Program: ${personalDetails.whyThisProgram || 'Not provided'}
    
    ${applicationType === 'scholarship' && personalDetails.needExplanation ? `- Financial Context: ${personalDetails.needExplanation}` : ''}
    ${applicationType === 'medical_school' && personalDetails.serviceExperience ? `- Healthcare Experience: ${personalDetails.serviceExperience}` : ''}
    ${applicationType === 'law_school' && personalDetails.legalInterest ? `- Legal Interest: ${personalDetails.legalInterest}` : ''}
    
    ${customRequests ? `SPECIAL REQUESTS: ${customRequests}` : ''}
    
    STRUCTURE GUIDANCE: ${structureGuidance[applicationType as keyof typeof structureGuidance]}
    
    INSTRUCTIONS:
    1. Create a compelling personal statement that tells a cohesive story
    2. Start with an engaging hook that draws the reader in
    3. Use specific examples and anecdotes rather than generic statements
    4. Show character development and personal growth through experiences
    5. Connect experiences to future goals and program fit
    6. Use active voice and vivid, concrete details
    7. Maintain authentic voice throughout - sound like a real person
    8. End with forward-looking vision and contribution to community
    9. Ensure smooth transitions between paragraphs
    10. Adapt tone and content to ${applicationType.replace('_', ' ')} application context
    
    Generate ONLY the personal statement content without any additional commentary.`;

    try {
        // Get AI model based on user's subscription
        const modelConfig = await getModelConfig(supabase, userId, 'personal-statement');

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: modelConfig.model,
                messages: [
                    {
                        role: 'system',
                        content: basePrompt
                    },
                    {
                        role: 'user',
                        content: contextualPrompt
                    }
                ],
                temperature: modelConfig.temperature,
                max_tokens: modelConfig.max_tokens
            })
        });
        
        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }
        
        const aiResponse = await response.json();
        return aiResponse.choices[0].message.content.trim();
        
    } catch (error) {
        console.error('OpenAI API error:', error);
        // Fallback to template-based generation
        return generateFallbackPersonalStatement(data);
    }
}

function generateFallbackPersonalStatement(data: any): string {
    const { applicationType, institutionName, programName, personalInfo, personalDetails } = data;
    
    // Application-specific openings
    const openings = {
        undergraduate: `Growing up in ${personalInfo.hometown}, I never imagined that ${personalDetails.formativeExperience?.substring(0, 100)}... would fundamentally shape my perspective and drive my desire to pursue higher education at ${institutionName}.`,
        
        scholarship: `As a ${personalInfo.currentEducation} from ${personalInfo.hometown}, I am writing to express my gratitude for the opportunity to apply for this scholarship, which would be instrumental in achieving my educational goals.`,
        
        law_school: `The pursuit of justice has been a driving force in my life, shaped by experiences that have shown me the profound impact that legal advocacy can have on individuals and communities.`,
        
        medical_school: `My calling to medicine began with a simple realization: the profound privilege and responsibility of caring for others during their most vulnerable moments.`,
        
        study_abroad: `My fascination with different cultures and global perspectives has led me to seek opportunities that will broaden my understanding of the world and my place in it.`,
        
        professional: `Throughout my career journey, I have consistently sought opportunities that challenge me to grow both professionally and personally while creating meaningful impact.`
    };
    
    const formativeSection = personalDetails.formativeExperience ? 
        `This experience taught me valuable lessons about resilience, determination, and the importance of perseverance in the face of challenges.` :
        `Through various experiences in my academic and personal life, I have developed a strong foundation of values and skills.`;
        
    const challengesSection = personalDetails.challengesOvercome ?
        `When faced with obstacles, I learned that ${personalDetails.challengesOvercome.substring(0, 150)}... These challenges strengthened my resolve and shaped my character.` :
        `Like many students, I have faced my share of challenges, each teaching me important lessons about persistence and growth.`;
        
    const goalsSection = personalDetails.futureGoals ?
        `Looking ahead, ${personalDetails.futureGoals.substring(0, 150)}... I am confident that ${institutionName} provides the ideal environment to pursue these aspirations.` :
        `My future goals align perfectly with the opportunities and values that ${institutionName} represents.`;
        
    const whyProgramSection = personalDetails.whyThisProgram ?
        personalDetails.whyThisProgram.substring(0, 200) :
        `I am particularly drawn to ${institutionName} because of its reputation for excellence and commitment to student success.`;
    
    const closing = `I am excited about the opportunity to contribute to the ${institutionName} community while pursuing my passion for ${programName}. Thank you for considering my application.`;
    
    return `${openings[applicationType as keyof typeof openings]}

${formativeSection}

${challengesSection}

${goalsSection}

${whyProgramSection}

${closing}

Sincerely,
${personalInfo.name}`;
}