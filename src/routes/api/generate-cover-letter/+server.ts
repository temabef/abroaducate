import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';
import { checkUsageLimit, incrementUsage } from '$lib/usage-limits';
import { getModelConfig } from '$lib/ai-models';

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (!session?.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check usage limits before processing
    const usageCheck = await checkUsageLimit(supabase, session.user.id, 'cover_letters_created');
    if (!usageCheck.allowed) {
        return json({
            error: 'Usage limit exceeded',
            message: usageCheck.message,
            planType: usageCheck.planType,
            currentUsage: usageCheck.currentUsage,
            limit: usageCheck.limit,
            upgradeRequired: true
        }, { status: 403 });
    }
    
    try {
        const coverLetterData = await request.json();
        
        if (!coverLetterData.jobTitle || !coverLetterData.companyName) {
            return json({ error: 'Job title and company name are required' }, { status: 400 });
        }
        
        // Generate cover letter using AI
        const generatedCoverLetter = await generateCoverLetterWithAI(coverLetterData, supabase, session.user.id);
        
        // Save to database
        console.log('Attempting to save cover letter to database...');
        console.log('User ID:', session.user.id);
        console.log('Cover letter data keys:', Object.keys(coverLetterData));
        
        const insertData = {
            user_id: session.user.id,
            position_type: coverLetterData.positionType,
            job_title: coverLetterData.jobTitle,
            company_name: coverLetterData.companyName,
            application_deadline: coverLetterData.applicationDeadline || null,
            form_data: coverLetterData,
            generated_content: generatedCoverLetter,
            word_count: generatedCoverLetter.split(/\s+/).length,
            status: 'draft',
            version: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        console.log('Insert data prepared:', Object.keys(insertData));
        
        const { data: savedCoverLetter, error: saveError } = await supabase
            .from('cover_letters')
            .insert(insertData)
            .select('id')
            .single();
            
        if (saveError) {
            console.error('Database save error:', saveError);
            console.error('Save error details:', JSON.stringify(saveError, null, 2));
            throw new Error(`Database save failed: ${saveError.message || JSON.stringify(saveError)}`);
        }
        
        console.log('Cover letter saved successfully with ID:', savedCoverLetter?.id);

        // Increment usage counter after successful generation
        await incrementUsage(supabase, session.user.id, 'cover_letters_created');

        // Log analytics
        console.log('Attempting to log analytics...');
        const { error: analyticsError } = await supabase
            .from('cover_letter_analytics')
            .insert({
                user_id: session.user.id,
                cover_letter_id: savedCoverLetter.id,
                action_type: 'created',
                session_data: {
                    position_type: coverLetterData.positionType,
                    word_count: generatedCoverLetter.split(/\s+/).length,
                    generation_method: 'ai_generated'
                },
                created_at: new Date().toISOString()
            });
            
        if (analyticsError) {
            console.error('Analytics logging error:', analyticsError);
            console.error('Analytics error details:', JSON.stringify(analyticsError, null, 2));
            // Don't throw here - analytics failure shouldn't break the main flow
        } else {
            console.log('Analytics logged successfully');
        }
        
        return json({
            success: true,
            coverLetter: generatedCoverLetter,
            coverLetterId: savedCoverLetter.id
        });
        
    } catch (error) {
        console.error('Error generating cover letter:', error);
        const errorDetails = error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
        } : { message: JSON.stringify(error) };
        console.error('Error details:', errorDetails);
        console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        return json({ 
            error: 'Failed to generate cover letter',
            details: errorDetails.message || 'Unknown error occurred'
        }, { status: 500 });
    }
};

async function generateCoverLetterWithAI(data: any, supabase: any, userId: string): Promise<string> {
    const { positionType, jobTitle, companyName, personalInfo, positionDetails, jobDescription, customRequests } = data;
    
    // Debug: Check if API key is available
    console.log('OPENAI_API_KEY available:', !!OPENAI_API_KEY);
    console.log('OPENAI_API_KEY length:', OPENAI_API_KEY ? OPENAI_API_KEY.length : 0);
    
    // Create position-specific prompts
    const basePrompt = `You are an expert career advisor and professional writer specializing in creating compelling cover letters. Create a professional, personalized cover letter that stands out.`;
    
    const positionPrompts = {
        academic: `Focus on research achievements, academic contributions, publications, and intellectual curiosity. Emphasize methodology, scholarly impact, and contribution to the field. Use formal academic tone while being engaging.`,
        
        industry: `Focus on business impact, practical results, leadership, and innovation. Quantify achievements with numbers and percentages. Emphasize problem-solving, team collaboration, and value creation. Use professional business tone.`,
        
        government: `Focus on public service motivation, policy understanding, stakeholder management, and social impact. Emphasize commitment to public good, analytical skills, and collaborative approach.`,
        
        hybrid: `Balance academic rigor with practical application. Emphasize translation of research into real-world solutions, interdisciplinary thinking, and bridging academia-industry gap.`
    };
    
    const contextualPrompt = `
    POSITION CONTEXT:
    - Position Type: ${positionType}
    - Job Title: ${jobTitle}
    - Company/Institution: ${companyName}
    - ${positionPrompts[positionType as keyof typeof positionPrompts]}
    
    APPLICANT INFORMATION:
    - Name: ${personalInfo.name}
    - Background: ${positionDetails.experience || 'Not provided'}
    - Key Achievements: ${positionDetails.achievements || 'Not provided'}
    - Motivations: ${positionDetails.motivations || 'Not provided'}
    - Career Goals: ${positionDetails.careerGoals || 'Not provided'}
    
    ${positionType === 'academic' && positionDetails.publications ? `- Publications: ${positionDetails.publications}` : ''}
    ${positionType === 'academic' && positionDetails.researchArea ? `- Research Area: ${positionDetails.researchArea}` : ''}
    ${positionType === 'industry' && positionDetails.businessImpact ? `- Business Impact: ${positionDetails.businessImpact}` : ''}
    ${positionType === 'industry' && positionDetails.companyResearch ? `- Company Knowledge: ${positionDetails.companyResearch}` : ''}
    
    ${jobDescription ? `JOB REQUIREMENTS: ${jobDescription}` : ''}
    ${customRequests ? `SPECIAL REQUESTS: ${customRequests}` : ''}
    
    INSTRUCTIONS:
    1. Create a compelling cover letter with proper business letter format
    2. Include: Header with contact info, Date, Company address, Salutation, 3-4 body paragraphs, Professional closing
    3. Paragraph 1: Strong opening that grabs attention and states the position
    4. Paragraph 2-3: Highlight relevant experience and achievements with specific examples
    5. Paragraph 4: Express enthusiasm, cultural fit, and call to action
    6. Keep it concise (under 400 words) but impactful
    7. Use active voice and strong action verbs
    8. Tailor language and examples to the ${positionType} context
    9. Make it personal and authentic while professional
    
    Generate ONLY the cover letter content without any additional commentary.`;

    try {
        // Get AI model based on user's subscription
        const modelConfig = await getModelConfig(supabase, userId, 'cover-letter');

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
            const errorText = await response.text();
            console.error('OpenAI API error details:', {
                status: response.status,
                statusText: response.statusText,
                errorText: errorText
            });
            throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
        }
        
        const aiResponse = await response.json();
        console.log('OpenAI response received:', !!aiResponse.choices);
        
        if (!aiResponse.choices || !aiResponse.choices[0] || !aiResponse.choices[0].message) {
            console.error('Invalid OpenAI response structure:', aiResponse);
            throw new Error('Invalid response from OpenAI API');
        }
        
        return aiResponse.choices[0].message.content.trim();
        
    } catch (error) {
        console.error('OpenAI API error:', error);
        const errorDetails = error instanceof Error ? {
            message: error.message,
            name: error.name
        } : { message: String(error) };
        console.error('OpenAI Error details:', errorDetails);
        // For now, let's throw the error to see what's happening instead of falling back
        throw error;
    }
}

function generateFallbackCoverLetter(data: any): string {
    const { positionType, jobTitle, companyName, personalInfo, positionDetails } = data;
    
    const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const salutation = `Dear Hiring Manager,`;
    
    // Position-specific opening
    const openings = {
        academic: `I am writing to express my strong interest in the ${jobTitle} position at ${companyName}. With my research background and academic achievements, I am excited about the opportunity to contribute to your institution's scholarly mission.`,
        
        industry: `I am excited to apply for the ${jobTitle} position at ${companyName}. Your company's innovative approach and market leadership align perfectly with my career goals and professional expertise.`,
        
        government: `I am writing to apply for the ${jobTitle} position at ${companyName}. My commitment to public service and policy expertise make me an ideal candidate for this role.`,
        
        hybrid: `I am pleased to apply for the ${jobTitle} position at ${companyName}. My unique background bridging academic research and practical application positions me well for this interdisciplinary role.`
    };
    
    const experienceParagraph = positionDetails.experience ? 
        `In my previous roles, ${positionDetails.experience.substring(0, 200)}...` :
        `Throughout my career, I have developed expertise in areas directly relevant to this position.`;
    
    const achievementsParagraph = positionDetails.achievements ?
        `Among my key accomplishments, ${positionDetails.achievements.substring(0, 200)}...` :
        `I have consistently delivered results that exceed expectations and create value for organizations.`;
    
    const motivation = positionDetails.motivations ?
        positionDetails.motivations.substring(0, 150) :
        `I am particularly drawn to this opportunity because of the chance to make a meaningful impact.`;
    
    const closing = `I would welcome the opportunity to discuss how my background and enthusiasm can contribute to ${companyName}'s continued success. Thank you for your consideration.`;
    
    return `${personalInfo.name}
${personalInfo.email}
${personalInfo.phone}
${personalInfo.address}

${currentDate}

${companyName}
Hiring Department

${salutation}

${openings[positionType as keyof typeof openings]}

${experienceParagraph}

${achievementsParagraph}

${motivation} I am excited about the possibility of joining your team and contributing to your organization's goals.

${closing}

Sincerely,
${personalInfo.name}`;
}

async function saveCoverLetterToDatabase(supabase: any, userId: string, coverLetterData: any, generatedContent: string) {
    try {
        const { data, error } = await supabase
            .from('cover_letters')
            .insert({
                user_id: userId,
                position_type: coverLetterData.positionType,
                job_title: coverLetterData.jobTitle,
                company_name: coverLetterData.companyName,
                application_deadline: coverLetterData.applicationDeadline,
                form_data: coverLetterData,
                generated_content: generatedContent,
                word_count: generatedContent.split(/\s+/).length,
                status: 'draft',
                created_at: new Date().toISOString()
            });
            
        if (error) {
            console.error('Error saving cover letter:', error);
            throw error;
        }
        
        return data;
    } catch (error) {
        console.error('Database save error:', error);
        // Don't fail the main request if saving fails
        return null;
    }
}