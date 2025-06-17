import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent }) => {
    const { supabase, session } = await parent();
    
    if (!session) {
        throw redirect(303, '/');
    }
    
    return {
        sopId: params.id,
    };
}; 