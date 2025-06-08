import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';
import type { FormData, WorkExperience, Organization, CommunityService } from '$lib/types';

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

export const POST: RequestHandler = async ({ request, locals: { supabase, safeGetSession } }) => {
    const { session } = await safeGetSession();

    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData: FormData = await request.json();

        const prompt = buildPrompt(formData);

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 1500,
            })
        });

        if (!openaiResponse.ok) {
            const errorData = await openaiResponse.json();
            console.error('OpenAI API error:', errorData);
            return json({ error: errorData.error.message || 'Failed to generate SOP from AI.' }, { status: openaiResponse.status });
        }

        const openaiData = await openaiResponse.json();
        const generatedSopText = openaiData.choices[0].message.content.trim();

        // Calculate word count
        const wordCount = generatedSopText.split(/\s+/).length;
        
        // Insert a new record with the form data and generated SOP
        // Handle both new schema (content) and old schema (generated_sop) for backward compatibility
        const insertPayload = {
            user_id: session.user.id,
            university_name: formData.universityData.university || 'Unknown University',
            program_name: formData.universityData.program || 'Unknown Program',
            word_count: wordCount,
            form_data: formData,
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
                    university: formData.universityData.university || 'Unknown University',
                    program: formData.universityData.program || 'Unknown Program',
                    generated_sop: generatedSopText,
                    form_data: formData
                })
                .select()
                .single();
                
            insertData = oldResult.data;
            insertError = oldResult.error;
        }

        if (insertError) {
            console.error('Database error after AI generation:', insertError);
            return json({ error: 'Failed to save the generated SOP.' }, { status: 500 });
        }

        return json({ success: true, sopId: insertData.id });

    } catch (error: any) {
        console.error('Error in SOP generation endpoint:', error);
        return json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
};