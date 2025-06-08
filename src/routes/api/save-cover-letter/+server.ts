import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (!session?.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        const { coverLetterData, generatedContent } = await request.json();
        
        if (!coverLetterData || !generatedContent) {
            return json({ error: 'Cover letter data and content are required' }, { status: 400 });
        }
        
        // Save cover letter to database
        const { data, error } = await supabase
            .from('cover_letters')
            .insert({
                user_id: session.user.id,
                position_type: coverLetterData.positionType,
                job_title: coverLetterData.jobTitle,
                company_name: coverLetterData.companyName,
                application_deadline: coverLetterData.applicationDeadline,
                form_data: coverLetterData,
                generated_content: generatedContent,
                word_count: generatedContent.split(/\s+/).length,
                status: 'final',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();
            
        if (error) {
            console.error('Error saving cover letter:', error);
            throw error;
        }
        
        return json({
            success: true,
            coverLetterId: data.id,
            message: 'Cover letter saved successfully'
        });
        
    } catch (error) {
        console.error('Error in save cover letter API:', error);
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