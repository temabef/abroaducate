import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';
import type { FormData, WorkExperience, Organization, CommunityService } from '$lib/types';
import { checkComprehensiveUsageLimit, incrementComprehensiveUsage } from '$lib/comprehensive-usage-limits.server';
import { getModelConfig } from '$lib/ai-models';
import { z } from 'zod';

// Helper function to build the prompt, ensuring no "undefined" values
function buildPrompt(formData: FormData): string {
    const sections = [
        `**University Application Details:**`,
        `- University: ${formData.universityData.university || 'Not provided'}`,
        `- Country: ${formData.universityData.country || 'Not provided'}`,
        `- Program: ${formData.universityData.program || 'Not provided'}`,

        `\n**Academic Background:**`,
        `- Degree Type: ${formData.academicData.degreeType || 'Not provided'}`,
        `- Field of Study: ${formData.academicData.fieldOfStudy || 'Not provided'}`,
        `- University Name (Previous): ${formData.academicData.universityName || 'Not provided'}`,
        `- GPA: ${formData.academicData.gpa || 'N/A'}`,
        `- Aspirations: ${formData.customAspiration || formData.selectedAspirations.join(', ') || 'Not specified'}`,
        `- Key Qualities: ${formData.selectedQualities.join(', ') || 'N/A'}`,

        ...(formData.showWorkExperienceForm && formData.workExperiences.length > 0 && formData.workExperiences.some((w: WorkExperience) => w.company) ? [
            `\n**Work Experience:**`,
            ...formData.workExperiences.filter((w: WorkExperience) => w.company).map((we: WorkExperience, index: number) =>
                `  Work Experience ${index + 1}:\n` +
                `    - Company: ${we.company}\n` +
                `    - Position: ${we.position}\n` +
                `    - Responsibilities: ${we.responsibilities.filter((r: string) => r).join('; ')}`
            )
        ] : []),

        ...(formData.showOrganizationsForm && formData.organizations.length > 0 && formData.organizations.some((o: Organization) => o.name) ? [
            `\n**Organizational Experience:**`,
            ...formData.organizations.filter((o: Organization) => o.name).map((org: Organization) =>
                `  - Organization: ${org.name} (${org.role})\n` +
                `    - Contribution: ${org.description}`
            )
        ] : []),

        ...(formData.showCommunityServiceForm && formData.communityServices.length > 0 && formData.communityServices.some((c: CommunityService) => c.organization) ? [
            `\n**Community Service:**`,
            ...formData.communityServices.filter((c: CommunityService) => c.organization).map((cs: CommunityService) =>
                `  - Organization: ${cs.organization} (${cs.role})\n` +
                `    - Impact: ${cs.impact}`
            )
        ] : []),

        ...(formData.showHobbiesForm && formData.hobbies ? [`\n**Hobbies & Interests:**\n- ${formData.hobbies}`] : []),
    ];

    const instruction = `Generate a comprehensive, compelling, and professional Statement of Purpose (SOP) between 750-1000 words for a university application, based on the following applicant's data. The tone should be formal and academic. The SOP should have a clear opening, a well-structured body detailing the applicant's journey and suitability, and a strong conclusion outlining their future goals.`;

    return `${instruction}\n\n--- APPLICANT DATA ---\n${sections.join('\n')}`;
}

async function generateSOPWithAI(formData: FormData, supabase: any, userId: string): Promise<string> {
    try {
        console.log('Starting SOP generation with AI...');
        console.log('Form data keys:', Object.keys(formData));
        
        // Get AI model based on user's subscription
        const modelConfig = await getModelConfig(supabase, userId, 'sop');
        console.log('AI model config:', modelConfig);

        const prompt = buildPrompt(formData);
        console.log('Generated prompt length:', prompt.length);

        console.log('Making OpenAI API request...');
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
                        content: 'You are an expert academic writer specializing in Statement of Purpose documents. Create compelling, professional SOPs that showcase the applicant\'s unique qualifications and motivations.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: modelConfig.temperature,
                max_tokens: modelConfig.max_tokens
            })
        });

        console.log('OpenAI response status:', response.status);

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
        console.log('OpenAI response received, choices count:', aiResponse.choices?.length);
        
        if (!aiResponse.choices || !aiResponse.choices[0] || !aiResponse.choices[0].message) {
            console.error('Invalid OpenAI response structure:', aiResponse);
            throw new Error('Invalid response from OpenAI API');
        }

        const generatedText = aiResponse.choices[0].message.content.trim();
        console.log('Generated SOP text length:', generatedText.length);
        
        return generatedText;

    } catch (error) {
        console.error('OpenAI API error:', error);
        console.log('Falling back to template-based generation...');
        // Fallback to template-based generation
        return generateFallbackSOP(formData);
    }
}

function generateFallbackSOP(formData: FormData): string {
    const { universityData, academicData, selectedAspirations, customAspiration, selectedQualities } = formData;
    
    const aspirations = customAspiration || selectedAspirations.join(', ') || 'academic and professional growth';
    const qualities = selectedQualities.join(', ') || 'academic excellence';
    
    return `I am writing to express my strong interest in the ${universityData.program} program at ${universityData.university}. With a background in ${academicData.fieldOfStudy} and a passion for ${aspirations}, I am excited about the opportunity to contribute to and grow within your esteemed academic community.

My academic journey has been driven by a deep curiosity and commitment to excellence. I completed my ${academicData.degreeType} in ${academicData.fieldOfStudy} from ${academicData.universityName}, where I developed a strong foundation in my field. Throughout my studies, I have consistently demonstrated ${qualities}, which I believe aligns perfectly with the values and expectations of your program.

The ${universityData.program} program at ${universityData.university} particularly appeals to me because of its reputation for academic rigor and innovative approaches to learning. I am drawn to the program's commitment to fostering critical thinking and practical application of knowledge, which I believe will provide me with the skills and experiences necessary to achieve my career goals.

My long-term aspirations include ${aspirations}, and I am confident that the comprehensive curriculum and research opportunities offered by your program will provide me with the necessary tools to succeed in these endeavors. I am particularly interested in the program's emphasis on practical experience and industry connections, which I believe will be invaluable in preparing me for the challenges and opportunities that lie ahead.

I am excited about the possibility of joining your academic community and contributing to the vibrant intellectual environment at ${universityData.university}. I am confident that my academic background, combined with my passion for learning and commitment to excellence, makes me a strong candidate for this program. I look forward to the opportunity to discuss how my background and goals align with your program's objectives.

Thank you for considering my application. I am eager to contribute to and grow within your academic community.`;
}

export const POST: RequestHandler = async ({ request, locals: { supabase, getSession } }) => {
    const session = await getSession();
    
    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Security headers for API responses
    const securityHeaders = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
    
    // Define schema for validation
    const sopGenerationSchema = z.object({
        universityData: z.object({
            university: z.string().min(1).max(200),
            program: z.string().min(1).max(200),
            country: z.string().min(1).max(100).optional()
        }),
        academicData: z.object({
            degreeType: z.string().min(1).max(200),
            fieldOfStudy: z.string().min(1).max(200),
            universityName: z.string().min(1).max(200),
            gpa: z.string().optional()
        }),
        selectedQualities: z.array(z.string()).min(1).max(10),
        selectedAspirations: z.array(z.string()).min(1).max(10),
        customAspiration: z.string().max(500).optional().default(''),
        isBestChoiceSelected: z.boolean(),
        isCustomQuality: z.boolean().optional().default(false),
        customQualityReason: z.string().max(500).optional().default(''),
        showWorkExperienceForm: z.boolean().optional().default(false),
        workExperiences: z.array(z.any()).optional().default([]),
        showOrganizationsForm: z.boolean().optional().default(false),
        organizations: z.array(z.any()).optional().default([]),
        showCommunityServiceForm: z.boolean().optional().default(false),
        communityServices: z.array(z.any()).optional().default([]),
        showHobbiesForm: z.boolean().optional().default(false),
        hobbies: z.string().max(1000).optional().default(''),
        showAchievementsForm: z.boolean().optional().default(false),
        relevantCourses: z.array(z.any()).optional().default([]),
        projects: z.array(z.any()).optional().default([]),
        achievements: z.array(z.any()).optional().default([])
    });
    
    try {
        const requestData = await request.json();

        // Validate and sanitize input
        const parsed = sopGenerationSchema.safeParse(requestData);
        if (!parsed.success) {
            return json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400, headers: securityHeaders });
        }
        const data = parsed.data;
        
        // Check usage limits before processing using new comprehensive system
        const usageCheck = await checkComprehensiveUsageLimit(session.user.id, 'sop_generation');
        if (!usageCheck.allowed) {
                    return json({
            error: 'Usage limit exceeded',
            message: usageCheck.message,
            planType: usageCheck.planType,
            currentUsage: usageCheck.currentUsage,
            limit: usageCheck.limit,
            upgradeRequired: true
        }, { status: 403, headers: securityHeaders });
        }
        
        // Generate SOP using OpenAI
        const generatedSopText = await generateSOPWithAI(data, supabase, session.user.id);

        // Calculate word count
        const wordCount = generatedSopText.split(/\s+/).length;
        
        console.log('SOP generated successfully, attempting database save...');
        console.log('Generated text length:', generatedSopText.length);
        console.log('Word count:', wordCount);
        
        // Insert a new record with the form data and generated SOP
        // Handle multiple schema variations for backward compatibility
        let insertData, insertError;
        
        // First, let's check what columns exist in the sops table
        const { data: tableInfo, error: tableError } = await supabase
            .from('information_schema.columns')
            .select('column_name')
            .eq('table_name', 'sops')
            .eq('table_schema', 'public');
            
        if (tableError) {
            console.error('Error checking table schema:', tableError);
        } else {
            console.log('Available columns in sops table:', tableInfo?.map(col => col.column_name));
        }
        
        // Try multiple insert strategies based on available columns
        const insertStrategies = [
            // Strategy 1: New schema with content column
            {
                name: 'New schema with content',
                data: {
                    user_id: session.user.id,
                    university_name: data.universityData.university.trim(),
                    program_name: data.universityData.program.trim(),
                    word_count: wordCount,
                    form_data: data,
                    status: 'draft',
                    content: generatedSopText,
                    original_content: generatedSopText
                }
            },
            // Strategy 2: Old schema with generated_sop column
            {
                name: 'Old schema with generated_sop',
                data: {
                    user_id: session.user.id,
                    university: data.universityData.university.trim(),
                    program: data.universityData.program.trim(),
                    generated_sop: generatedSopText,
                    form_data: data
                }
            },
            // Strategy 3: Minimal schema
            {
                name: 'Minimal schema',
                data: {
                    user_id: session.user.id,
                    content: generatedSopText
                }
            }
        ];
        
        for (const strategy of insertStrategies) {
            try {
                console.log(`Trying insert strategy: ${strategy.name}`);
                const result = await supabase
                    .from('sops')
                    .insert(strategy.data)
                    .select()
                    .single();
                    
                insertData = result.data;
                insertError = result.error;
                
                if (!insertError) {
                    console.log(`✅ Success with strategy: ${strategy.name}`);
                    break;
                } else {
                    console.log(`❌ Failed with strategy: ${strategy.name}`, insertError);
                }
            } catch (strategyError) {
                console.log(`❌ Exception with strategy: ${strategy.name}`, strategyError);
                insertError = strategyError;
            }
        }
        
        if (insertError) {
            console.error('All database insert strategies failed:', insertError);
            throw new Error(`Database save failed: ${insertError.message || JSON.stringify(insertError)}`);
        }
        
        console.log('✅ SOP saved successfully with ID:', insertData?.id);
        
        // Increment usage counter after successful generation
        await incrementComprehensiveUsage(session.user.id, 'sop_generation');
        
        return json({
            success: true,
            sop: generatedSopText,
            sopId: insertData?.id,
            wordCount: wordCount
        }, { headers: securityHeaders });
        
    } catch (error) {
        console.error('Error generating SOP:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        return json({ 
            error: 'Failed to generate SOP',
            details: error.message || 'Unknown error occurred'
        }, { status: 500, headers: securityHeaders });
    }
};