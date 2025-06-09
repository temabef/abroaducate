import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        const personalStatementData = await request.json();
        
        console.log('Attempting to save personal statement:', {
            user_id: session.user.id,
            application_type: personalStatementData.applicationType,
            program_name: personalStatementData.programName,
            university_name: personalStatementData.institutionName
        });
        
        // Insert personal statement into database
        const { data: personalStatement, error: insertError } = await supabase
            .from('personal_statements')
            .insert({
                user_id: session.user.id,
                application_type: personalStatementData.applicationType,
                program_name: personalStatementData.programName,
                institution_name: personalStatementData.institutionName,
                application_deadline: personalStatementData.applicationDeadline || null,
                form_data: {
                    personalInfo: personalStatementData.personalInfo,
                    personalDetails: personalStatementData.personalDetails,
                    customRequests: personalStatementData.customRequests,
                    wordLimit: personalStatementData.wordLimit
                },
                generated_content: personalStatementData.generatedContent,
                word_count: personalStatementData.wordCount || 0,
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
                        application_type: personalStatementData.applicationType,
                        word_count: personalStatementData.wordCount,
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