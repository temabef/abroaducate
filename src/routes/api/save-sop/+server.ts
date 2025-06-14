import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals: { supabase, getSession } }) => {
    const session = await getSession();

    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { sopId, editedContent, editHistory } = await request.json();

        if (!sopId || !editedContent) {
            return json({ error: 'Missing required fields: sopId and editedContent' }, { status: 400 });
        }

        // Update the SOP with edited content and edit history
        const { data: updatedSop, error: updateError } = await supabase
            .from('sops')
            .update({
                generated_sop: editedContent,
                edit_history: editHistory || [],
                updated_at: new Date().toISOString()
            })
            .eq('id', sopId)
            .eq('user_id', session.user.id) // Ensure user can only edit their own SOPs
            .select()
            .single();

        if (updateError) {
            console.error('Database error during SOP save:', updateError);
            return json({ error: 'Failed to save SOP changes.' }, { status: 500 });
        }

        if (!updatedSop) {
            return json({ error: 'SOP not found or you do not have permission to edit it.' }, { status: 404 });
        }

        return json({ 
            success: true, 
            message: 'SOP saved successfully!',
            sop: updatedSop
        });

    } catch (error: any) {
        console.error('Error in save SOP endpoint:', error);
        return json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
};

export const GET: RequestHandler = async ({ url, locals: { supabase, getSession } }) => {
    const session = await getSession();

    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const sopId = url.searchParams.get('sopId');

        if (!sopId) {
            // Get all SOPs for the user
            const { data: sops, error } = await supabase
                .from('sops')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Database error fetching SOPs:', error);
                return json({ error: 'Failed to fetch SOPs.' }, { status: 500 });
            }

            return json({ sops });
        } else {
            // Get specific SOP
            const { data: sop, error } = await supabase
                .from('sops')
                .select('*')
                .eq('id', sopId)
                .eq('user_id', session.user.id)
                .single();

            if (error) {
                console.error('Database error fetching SOP:', error);
                return json({ error: 'Failed to fetch SOP.' }, { status: 500 });
            }

            return json({ sop });
        }

    } catch (error: any) {
        console.error('Error in get SOP endpoint:', error);
        return json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}; 