import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createVersionSnapshot, type VersionHistoryConfig } from '$lib/versionHistory';

export const POST: RequestHandler = async ({ request, locals: { supabase, getSession } }) => {
    const session = await getSession();

    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { sopId, editedContent, editHistory, isSignificantChange = false } = await request.json();

        if (!sopId || !editedContent) {
            return json({ error: 'Missing required fields: sopId and editedContent' }, { status: 400 });
        }

        // Get user's plan for version history
        const { data: userData } = await supabase
            .from('user_subscriptions')
            .select('plan_type')
            .eq('user_id', session.user.id)
            .eq('status', 'active')
            .single();
        
        const planType = userData?.plan_type || 'free';

        // Update the SOP with edited content and edit history
        const { data: updatedSop, error: updateError } = await supabase
            .from('sops')
            .update({
                content: editedContent,
                generated_sop: editedContent,
                edit_history: editHistory || [],
                word_count: editedContent.split(/\s+/).filter((w: string) => w.length > 0).length,
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

        // Create version history
        try {
            // Get existing versions
            const { data: existingVersions } = await supabase
                .from('document_versions')
                .select('*')
                .eq('document_id', sopId.toString())
                .eq('document_type', 'sop')
                .order('created_at', { ascending: false });

            const config: VersionHistoryConfig = {
                planType,
                documentType: 'sop',
                userId: session.user.id
            };

            const versionResult = await createVersionSnapshot(
                supabase,
                config,
                sopId,
                editedContent,
                isSignificantChange,
                existingVersions || []
            );

            if (versionResult.success && versionResult.versionCreated) {
                // Update version number in sops table
                await supabase
                    .from('sops')
                    .update({ version: (updatedSop.version || 0) + 1 })
                    .eq('id', sopId);
                
                console.log('Version created successfully:', versionResult.message);
            }
        } catch (versionError) {
            console.error('Version creation failed:', versionError);
            // Don't fail the save if version creation fails
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