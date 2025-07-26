import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Define schema for validation
    const personalStatementSchema = z.object({
        applicationType: z.string().min(1).max(100),
        programName: z.string().min(1).max(200),
        institutionName: z.string().min(1).max(200),
        applicationDeadline: z.string().optional().nullable(),
        personalInfo: z.any(), // You can further specify if you know the structure
        personalDetails: z.any(),
        customRequests: z.any(),
        wordLimit: z.number().int().min(0).max(10000).optional(),
        generatedContent: z.string().min(1),
        wordCount: z.number().int().min(0).max(10000).optional()
    });
    
    try {
        const personalStatementData = await request.json();
        
        // Validate and sanitize input
        const parsed = personalStatementSchema.safeParse(personalStatementData);
        if (!parsed.success) {
            return json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
        }
        const data = parsed.data;
        
        console.log('Attempting to save personal statement:', {
            user_id: session.user.id,
            application_type: data.applicationType,
            program_name: data.programName,
            university_name: data.institutionName
        });
        
        // Insert personal statement into database
        const { data: personalStatement, error: insertError } = await supabase
            .from('personal_statements')
            .insert({
                user_id: session.user.id,
                application_type: data.applicationType.trim(),
                program_name: data.programName.trim(),
                institution_name: data.institutionName.trim(),
                application_deadline: data.applicationDeadline || null,
                form_data: {
                    personalInfo: data.personalInfo,
                    personalDetails: data.personalDetails,
                    customRequests: data.customRequests,
                    wordLimit: data.wordLimit
                },
                generated_content: data.generatedContent.trim(),
                word_count: data.wordCount || 0,
                status: 'draft',
                version: 1
            })
            .select('id')
            .single();
            
        if (insertError) {
            console.error('Error inserting personal statement:', insertError);
            throw insertError;
        }
        
        console.log('Personal statement inserted successfully:', personalStatement.id);
        
        // Log analytics (optional - don't fail if this fails)
        try {
            await supabase
                .from('personal_statement_analytics')
                .insert({
                    user_id: session.user.id,
                    personal_statement_id: personalStatement.id,
                    action_type: 'created',
                    session_data: {
                        application_type: data.applicationType,
                        word_count: data.wordCount,
                        generation_method: 'ai_generated'
                    }
                });
        } catch (analyticsError) {
            console.warn('Analytics logging failed:', analyticsError);
            // Don't fail the entire operation if analytics fails
        }
        
        return json({ 
            success: true, 
            personalStatementId: personalStatement.id,
            message: 'Personal statement saved successfully' 
        });
        
    } catch (error) {
        console.error('Error saving personal statement:', error);
        return json({ error: 'Failed to save personal statement' }, { status: 500 });
    }
};

export const PUT: RequestHandler = async ({ request, locals: { supabase } }) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (!session?.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        const { id, personalStatementData, generatedContent, status } = await request.json();
        
        if (!id) {
            return json({ error: 'Personal statement ID is required' }, { status: 400 });
        }
        
        // Update personal statement
        const { data, error } = await supabase
            .from('personal_statements')
            .update({
                application_type: personalStatementData?.applicationType,
                program_name: personalStatementData?.programName,
                institution_name: personalStatementData?.institutionName,
                application_deadline: personalStatementData?.applicationDeadline,
                form_data: personalStatementData,
                generated_content: generatedContent,
                word_count: generatedContent ? generatedContent.split(/\s+/).length : undefined,
                status: status || 'final'
            })
            .eq('id', id)
            .eq('user_id', session.user.id)
            .select()
            .single();
            
        if (error) {
            console.error('Error updating personal statement:', error);
            throw error;
        }
        
        if (!data) {
            return json({ error: 'Personal statement not found or access denied' }, { status: 404 });
        }
        
        return json({
            success: true,
            personalStatement: data,
            message: 'Personal statement updated successfully'
        });
        
    } catch (error) {
        console.error('Error in update personal statement API:', error);
        return json({ error: 'Failed to update personal statement' }, { status: 500 });
    }
}; 