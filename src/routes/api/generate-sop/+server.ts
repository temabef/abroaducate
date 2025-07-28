import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';
import type { FormData, WorkExperience, Organization, CommunityService } from '$lib/types';
import { checkComprehensiveUsageLimit, incrementComprehensiveUsage } from '$lib/comprehensive-usage-limits';
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
        `- Aspirations: ${formData.selectedAspirations || formData.customAspiration || 'Not specified'}`,
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
            gpa: z.number().min(0).max(4.0).optional(),
            major: z.string().min(1).max(200),
            graduationYear: z.number().int().min(2000).max(2030).optional(),
            relevantCourses: z.array(z.any()).optional().default([]),
            projects: z.array(z.any()).optional().default([]),
            achievements: z.array(z.any()).optional().default([])
        }),
        selectedQualities: z.array(z.string()).min(1).max(10),
        selectedAspirations: z.array(z.string()).min(1).max(10),
        customAspiration: z.string().max(500).optional().default(''),
        isBestChoiceSelected: z.boolean(),
        isCustomQuality: z.boolean().optional().default(false),
        customQualityReason: z.string().max(500).optional().default(''),
        workExperiences: z.array(z.any()).optional().default([]),
        organizations: z.array(z.any()).optional().default([]),
        communityServices: z.array(z.any()).optional().default([]),
        hobbies: z.string().max(1000).optional().default(''),
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
        const openaiData = await generateSOPWithAI(data, supabase, session.user.id);

        const generatedSopText = openaiData.choices[0].message.content.trim();

        // Calculate word count
        const wordCount = generatedSopText.split(/\s+/).length;
        
        // Insert a new record with the form data and generated SOP
        // Handle both new schema (content) and old schema (generated_sop) for backward compatibility
        const insertPayload = {
            user_id: session.user.id,
            university_name: data.universityData.university.trim(),
            program_name: data.universityData.program.trim(),
            word_count: wordCount,
            form_data: data,
            status: 'draft'
        };

        // Try with new schema first (content column)
        let insertData, insertError;
        
        const result = await supabase
            .from('sops')
            .insert({
                ...insertPayload,
                content: generatedSopText,
                original_content: generatedSopText
            })
            .select()
            .single();
            
        insertData = result.data;
        insertError = result.error;
        
        // If new schema fails, try old schema (generated_sop column)
        if (insertError && insertError.message?.includes('content')) {
            console.log('Trying old schema format with generated_sop column...');
            const oldResult = await supabase
                .from('sops')
                .insert({
                    user_id: session.user.id,
                    university: data.universityData.university.trim(),
                    program: data.universityData.program.trim(),
                    generated_sop: generatedSopText,
                    form_data: data
                })
                .select()
                .single();
                
            insertData = oldResult.data;
            insertError = oldResult.error;
        }
        
        if (insertError) {
            console.error('Database save error:', insertError);
            throw new Error(`Database save failed: ${insertError.message}`);
        }
        
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
        return json({ error: 'Failed to generate SOP' }, { status: 500, headers: securityHeaders });
    }
};