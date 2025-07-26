import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';

export const POST: RequestHandler = async ({ request, locals: { supabase, getSession } }) => {
    const session = await getSession();

    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Define schema for validation
    const updateChecklistSchema = z.object({
        checklistId: z.string().min(1),
        itemId: z.string().min(1),
        completed: z.boolean(),
        notes: z.string().max(1000).optional().default('')
    });

    try {
        const requestData = await request.json();

        // Validate and sanitize input
        const parsed = updateChecklistSchema.safeParse(requestData);
        if (!parsed.success) {
            return json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
        }
        const data = parsed.data;

        // Update the checklist item
        const { error: updateError } = await supabase
            .from('checklist_items')
            .update({
                completed: data.completed,
                notes: data.notes?.trim() || '',
                updated_at: new Date().toISOString()
            })
            .eq('id', data.itemId)
            .eq('user_id', session.user.id);

        if (updateError) {
            console.error('Error updating checklist item:', updateError);
            return json({ error: 'Failed to update checklist item' }, { status: 500 });
        }

        return json({ success: true });

    } catch (error) {
        console.error('Error in update checklist:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}; 