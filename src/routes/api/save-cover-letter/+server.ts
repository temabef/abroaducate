import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Define schema for validation
    const coverLetterSchema = z.object({
        positionType: z.string().min(1).max(100),
        jobTitle: z.string().min(1).max(200),
        companyName: z.string().min(1).max(200),
        applicationDeadline: z.string().optional().nullable(),
        personalInfo: z.any(),
        positionDetails: z.any(),
        customRequests: z.any(),
        jobDescription: z.any(),
        requirements: z.any(),
        generatedContent: z.string().min(1),
        wordCount: z.number().int().min(0).max(10000).optional()
    });
    
    try {
        const coverLetterData = await request.json();
        
        // Validate and sanitize input
        const parsed = coverLetterSchema.safeParse(coverLetterData);
        if (!parsed.success) {
            return json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
        }
        const data = parsed.data;
        
        // Insert cover letter into database
        const { data: coverLetter, error: insertError } = await supabase
            .from('cover_letters')
            .insert({
                user_id: session.user.id,
                position_type: data.positionType.trim(),
                job_title: data.jobTitle.trim(),
                company_name: data.companyName.trim(),
                application_deadline: data.applicationDeadline || null,
                form_data: {
                    personalInfo: data.personalInfo,
                    positionDetails: data.positionDetails,
                    customRequests: data.customRequests,
                    jobDescription: data.jobDescription,
                    requirements: data.requirements
                },
                generated_content: data.generatedContent.trim(),
                word_count: data.wordCount || 0,
                status: 'draft',
                version: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select('id')
            .single();
            
        if (insertError) {
            console.error('Error inserting cover letter:', insertError);
            throw insertError;
        }
        
        // Log analytics
        await supabase
            .from('cover_letter_analytics')
            .insert({
                user_id: session.user.id,
                cover_letter_id: coverLetter.id,
                action_type: 'created',
                session_data: {
                    position_type: data.positionType,
                    word_count: data.wordCount,
                    generation_method: 'ai_generated'
                },
                created_at: new Date().toISOString()
            });
        
        return json({ 
            success: true, 
            coverLetterId: coverLetter.id,
            message: 'Cover letter saved successfully' 
        });
        
    } catch (error) {
        console.error('Error saving cover letter:', error);
        return json({ error: 'Failed to save cover letter' }, { status: 500 });
    }
};

export const PUT: RequestHandler = async ({ request, locals: { supabase } }) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (!session?.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        const { id, coverLetterData, generatedContent, status } = await request.json();
        
        if (!id) {
            return json({ error: 'Cover letter ID is required' }, { status: 400 });
        }
        
        // Update cover letter
        const { data, error } = await supabase
            .from('cover_letters')
            .update({
                position_type: coverLetterData?.positionType,
                job_title: coverLetterData?.jobTitle,
                company_name: coverLetterData?.companyName,
                application_deadline: coverLetterData?.applicationDeadline,
                form_data: coverLetterData,
                generated_content: generatedContent,
                word_count: generatedContent ? generatedContent.split(/\s+/).length : undefined,
                status: status || 'final',
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', session.user.id)
            .select()
            .single();
            
        if (error) {
            console.error('Error updating cover letter:', error);
            throw error;
        }
        
        if (!data) {
            return json({ error: 'Cover letter not found or access denied' }, { status: 404 });
        }
        
        return json({
            success: true,
            coverLetter: data,
            message: 'Cover letter updated successfully'
        });
        
    } catch (error) {
        console.error('Error in update cover letter API:', error);
        return json({ error: 'Failed to update cover letter' }, { status: 500 });
    }
}; 