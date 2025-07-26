import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const GET: RequestHandler = async ({ url, locals }) => {
    try {
        console.log('Document checklists GET request started');
        const session = await locals.getSession();
        const country = url.searchParams.get('country') || 'US';
        const category = url.searchParams.get('category');
        
        console.log(`Parameters: country=${country}, category=${category}, authenticated=${!!session?.user}`);
        
        // Create Supabase client with user's access token (if authenticated)
        const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
            global: {
                headers: session?.access_token ? {
                    Authorization: `Bearer ${session.access_token}`
                } : {}
            }
        });
        
        // For non-authenticated users, show preview mode
        if (!session?.user) {
            console.log('Preview mode - user not authenticated');
            // Build query for preview (no user-specific data)
            let query = supabase
                .from('document_checklists')
                .select('*')
                .eq('is_active', true)
                .eq('country', country);

            if (category) {
                query = query.eq('category', category);
            }

            const { data: checklists, error: checklistsError } = await query
                .order('priority_level', { ascending: false })
                .order('created_at', { ascending: true });

            if (checklistsError) {
                console.error('Error fetching checklists for preview:', checklistsError);
                return json({ error: 'Failed to fetch checklists' }, { status: 500 });
            }

            console.log(`Preview mode: Found ${checklists?.length || 0} checklists`);

            // Return preview data without progress, limited to first checklist for demo
            const previewChecklists = checklists?.slice(0, 1).map(checklist => ({
                ...checklist,
                user_progress: null,
                is_preview: true
            })) || [];

            return json({
                success: true,
                data: previewChecklists,
                is_preview: true,
                message: 'Sign up to access all checklists and track your progress!'
            });
        }

        const userId = session.user.id;
        console.log(`Authenticated user: ${userId}`);

        // Document checklists are now completely free for all users
        // No usage limit checks needed

        // Build query
        let query = supabase
            .from('document_checklists')
            .select('*')
            .eq('is_active', true)
            .eq('country', country);

        if (category) {
            query = query.eq('category', category);
        }

        console.log('Fetching checklists from database...');
        const { data: checklists, error: checklistsError } = await query
            .order('priority_level', { ascending: false })
            .order('created_at', { ascending: true });

        if (checklistsError) {
            console.error('Error fetching checklists for authenticated user:', checklistsError);
            return json({ error: 'Failed to fetch checklists' }, { status: 500 });
        }

        console.log(`Found ${checklists?.length || 0} checklists`);
        
        if (!checklists || checklists.length === 0) {
            console.log(`No checklists found for country=${country}, category=${category}`);
            return json({
                success: true,
                data: [],
                message: 'No checklists found for the selected criteria'
            });
        }

        // Get user's progress for these checklists from the new table
        const checklistIds = checklists?.map(c => c.id) || [];
        console.log(`Fetching progress for ${checklistIds.length} checklists`);
        const { data: progressData, error: progressError } = await supabase
            .from('simple_checklist_progress')
            .select('*')
            .eq('user_id', userId)
            .in('checklist_id', checklistIds);

        if (progressError) {
            console.error('Error fetching progress:', progressError);
            // Continue anyway, just without progress data
        }

        console.log(`Found progress data for ${progressData?.length || 0} checklists`);

        // Filter out any potential duplicates based on checklist ID, name, and category
        const uniqueChecklists = [];
        const seenKeys = new Set();
        
        for (const checklist of checklists || []) {
            // Create a unique key based on name and category
            const key = `${checklist.category}_${checklist.name}`;
            
            if (!seenKeys.has(key)) {
                seenKeys.add(key);
                uniqueChecklists.push(checklist);
            } else {
                console.log(`Filtered out duplicate checklist: ${checklist.name} in category ${checklist.category}`);
            }
        }
        
        console.log(`Filtered ${checklists?.length || 0} to ${uniqueChecklists.length} unique checklists`);

        // Combine checklists with progress data
        const checklistsWithProgress = uniqueChecklists.map(checklist => {
            const progress = progressData?.find(p => p.checklist_id === checklist.id);
            return {
                ...checklist,
                user_progress: progress || null
            };
        });

        // Document checklists are now free for all users - no filtering needed
        const filteredChecklists = checklistsWithProgress;
        console.log(`Returning ${filteredChecklists?.length || 0} checklists with progress`);

        return json({
            success: true,
            data: filteredChecklists,
            usage: {
                planType: 'unlimited', // All users get unlimited access
                currentUsage: 0,
                limit: null
            }
        });

    } catch (error) {
        console.error('Unexpected error in document-checklists GET:', error);
        return json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
};

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        const session = await locals.getSession();
        
        if (!session?.user) {
            return json({ error: 'Authentication required' }, { status: 401 });
        }

        // Define schema for validation
        const documentChecklistSchema = z.object({
            action: z.enum(['start_checklist', 'toggle_item', 'update_notes', 'reset_checklist']),
            checklistId: z.string().min(1),
            itemId: z.string().min(1).optional(),
            notes: z.string().max(1000).optional().default('')
        });

        // Create Supabase client with user's access token
        const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
            global: {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            }
        });

        const userId = session.user.id;
        const requestData = await request.json();

        // Validate and sanitize input
        const parsed = documentChecklistSchema.safeParse(requestData);
        if (!parsed.success) {
            return json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
        }
        const data = parsed.data;

        console.log(`Document checklists POST request: action=${data.action}, checklistId=${data.checklistId}, itemId=${data.itemId || 'N/A'}`);

        if (!data.action || !data.checklistId) {
            return json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Progress tracking is now free for all users - no checks needed

        switch (data.action) {
            case 'start_checklist':
                return await startChecklist(supabase, userId, data.checklistId);
                
            case 'toggle_item':
                if (!data.itemId) {
                    return json({ error: 'Item ID required for toggle action' }, { status: 400 });
                }
                return await toggleChecklistItem(supabase, userId, data.checklistId, data.itemId);
                
            case 'update_notes':
                return await updateChecklistNotes(supabase, userId, data.checklistId, data.notes || '');
                
            case 'reset_checklist':
                return await resetChecklist(supabase, userId, data.checklistId);
                
            default:
                return json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error) {
        console.error('Error in document checklists:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};

// Helper functions
async function startChecklist(supabase: any, userId: string, checklistId: string) {
    try {
        // First, verify the checklist exists
        const { data: checklist, error: checklistError } = await supabase
            .from('document_checklists')
            .select('id, name')
            .eq('id', checklistId)
            .single();

        if (checklistError) {
            console.error('Error verifying checklist existence:', checklistError);
            return json({ error: `Checklist not found: ${checklistError.message}` }, { status: 404 });
        }

        if (!checklist) {
            console.error(`Checklist with ID ${checklistId} not found`);
            return json({ error: 'Checklist not found' }, { status: 404 });
        }

        console.log(`Starting checklist for user ${userId}, checklist ${checklistId} (${checklist.name})`);

        // Use the new non-RLS table instead
        const { data, error } = await supabase
            .from('simple_checklist_progress')
            .upsert({
                user_id: userId,
                checklist_id: checklistId,
                completed_items: [],
                progress_percentage: 0,
                started_at: new Date().toISOString(),
                last_updated: new Date().toISOString()
            }, { 
                onConflict: 'user_id,checklist_id'
            })
            .select()
            .single();

        if (error) {
            console.error('Error starting checklist with simple table:', error);
            console.error('Error details:', JSON.stringify(error));
            return json({ 
                error: `Failed to start checklist: ${error.message}`,
                details: error.details || 'No additional details' 
            }, { status: 500 });
        }

        // Log analytics
        await logChecklistAnalytics(supabase, userId, checklistId, 'started');

        return json({ 
            success: true, 
            data,
            message: `Successfully started checklist: ${checklist.name}`
        });
    } catch (err) {
        console.error('Unexpected error in startChecklist:', err);
        return json({ 
            error: 'Internal server error while starting checklist',
            details: err instanceof Error ? err.message : 'Unknown error'
        }, { status: 500 });
    }
}

async function toggleChecklistItem(supabase: any, userId: string, checklistId: string, itemId: string) {
    try {
        // Get current progress
        const { data: currentProgress, error: fetchError } = await supabase
            .from('simple_checklist_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('checklist_id', checklistId)
            .single();

        if (fetchError) {
            console.error('Error fetching progress:', fetchError);
            
            // If no progress record exists yet, create one
            if (fetchError.code === 'PGRST116') {
                // First start the checklist
                await startChecklist(supabase, userId, checklistId);
                
                // Then set the initial item as completed
                const { data, error } = await supabase
                    .from('simple_checklist_progress')
                    .update({
                        completed_items: [itemId],
                        progress_percentage: 10, // Approximate starting percentage
                        last_updated: new Date().toISOString()
                    })
                    .eq('user_id', userId)
                    .eq('checklist_id', checklistId)
                    .select()
                    .single();
                    
                if (error) {
                    console.error('Error updating new progress:', error);
                    return json({ error: 'Failed to update progress' }, { status: 500 });
                }
                
                await logChecklistAnalytics(supabase, userId, checklistId, 'item_completed', itemId);
                return json({ success: true, data });
            }
            
            return json({ error: 'Failed to fetch progress' }, { status: 500 });
        }

        // Get checklist to calculate total items
        const { data: checklist, error: checklistError } = await supabase
            .from('document_checklists')
            .select('items')
            .eq('id', checklistId)
            .single();

        if (checklistError) {
            console.error('Error fetching checklist:', checklistError);
            return json({ error: 'Failed to fetch checklist' }, { status: 500 });
        }

        // Ensure completed_items is an array
        let currentCompletedItems = [];
        if (currentProgress.completed_items) {
            // Handle both array and JSON string formats
            if (typeof currentProgress.completed_items === 'string') {
                try {
                    currentCompletedItems = JSON.parse(currentProgress.completed_items);
                } catch (e) {
                    console.error('Error parsing completed_items:', e);
                    currentCompletedItems = [];
                }
            } else {
                currentCompletedItems = currentProgress.completed_items;
            }
        }
        
        // Make sure it's an array even if it was stored as something else
        if (!Array.isArray(currentCompletedItems)) {
            currentCompletedItems = [];
        }

        // Toggle item completion
        let updatedCompletedItems;
        if (currentCompletedItems.includes(itemId)) {
            // Remove item
            updatedCompletedItems = currentCompletedItems.filter(id => id !== itemId);
        } else {
            // Add item
            updatedCompletedItems = [...currentCompletedItems, itemId];
        }

        // Calculate total items
        const totalItems = Array.isArray(checklist.items) ? checklist.items.length : 
                          (typeof checklist.items === 'object' ? Object.keys(checklist.items).length : 0);
                          
        if (totalItems === 0) {
            console.error('Checklist has no items:', checklist);
            return json({ error: 'Invalid checklist format' }, { status: 500 });
        }

        // Calculate new progress percentage
        const progressPercentage = Math.round((updatedCompletedItems.length / totalItems) * 100);
        const isCompleted = progressPercentage === 100;

        // Update progress
        const { data, error } = await supabase
            .from('simple_checklist_progress')
            .update({
                completed_items: updatedCompletedItems,
                progress_percentage: progressPercentage,
                completed_at: isCompleted ? new Date().toISOString() : null,
                last_updated: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('checklist_id', checklistId)
            .select()
            .single();

        if (error) {
            console.error('Error updating progress:', error);
            console.error('Error details:', JSON.stringify(error));
            return json({ error: 'Failed to update progress' }, { status: 500 });
        }

        // Log analytics
        await logChecklistAnalytics(supabase, userId, checklistId, 'item_completed', itemId);
        
        if (isCompleted) {
            await logChecklistAnalytics(supabase, userId, checklistId, 'completed');
        }

        return json({ success: true, data });
    } catch (err) {
        console.error('Unexpected error in toggleChecklistItem:', err);
        return json({ 
            error: 'Failed to update progress',
            details: err instanceof Error ? err.message : 'Unknown error'
        }, { status: 500 });
    }
}

async function updateChecklistNotes(supabase: any, userId: string, checklistId: string, notes: string) {
    const { data, error } = await supabase
        .from('simple_checklist_progress')
        .update({
            notes,
            last_updated: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('checklist_id', checklistId)
        .select()
        .single();

    if (error) {
        console.error('Error updating notes:', error);
        return json({ error: 'Failed to update notes' }, { status: 500 });
    }

    return json({ success: true, data });
}

async function resetChecklist(supabase: any, userId: string, checklistId: string) {
    const { data, error } = await supabase
        .from('simple_checklist_progress')
        .update({
            completed_items: [],
            progress_percentage: 0,
            completed_at: null,
            last_updated: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('checklist_id', checklistId)
        .select()
        .single();

    if (error) {
        console.error('Error resetting checklist:', error);
        return json({ error: 'Failed to reset checklist' }, { status: 500 });
    }

    // Log analytics
    await logChecklistAnalytics(supabase, userId, checklistId, 'reset');

    return json({ success: true, data });
}

async function logChecklistAnalytics(supabase: any, userId: string, checklistId: string, action: string, itemId?: string) {
    try {
        await supabase
            .from('checklist_analytics')
            .insert({
                user_id: userId,
                checklist_id: checklistId,
                action_type: action,
                item_id: itemId || null,
                session_data: {
                    timestamp: new Date().toISOString(),
                    user_agent: 'unknown' // Could be enhanced with actual user agent
                }
            });
    } catch (error) {
        console.error('Error logging analytics:', error);
        // Don't fail the main operation if analytics fails
    }
} 