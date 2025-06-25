import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals: { supabase } }) => {
    try {
        // Test 1: Check if we can connect to Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
            return json({ error: 'Not authenticated' }, { status: 401 });
        }
        
        // Test 2: Test scholarship save functionality
        
        // First, get a sample scholarship
        const { data: scholarships, error: scholarshipError } = await supabase
            .from('scholarships')
            .select('id, title, provider')
            .eq('is_active', true)
            .limit(1);
            
        if (scholarshipError || !scholarships || scholarships.length === 0) {
            return json({ 
                success: false,
                error: 'No scholarships found to test with',
                details: scholarshipError 
            }, { status: 400 });
        }
        
        const testScholarship = scholarships[0];
        
        // Test saving a scholarship
        const { data: saveResult, error: saveError } = await supabase
            .from('user_scholarship_interactions')
            .insert({
                user_id: session.user.id,
                scholarship_id: testScholarship.id,
                is_saved: true,
                is_applied: false
            })
            .select('id')
            .single();
            
        if (saveError) {
            // Check if it already exists
            const { data: existing, error: existingError } = await supabase
                .from('user_scholarship_interactions')
                .select('id, is_saved')
                .eq('user_id', session.user.id)
                .eq('scholarship_id', testScholarship.id)
                .single();
                
            if (existing) {
                // Update existing
                const { error: updateError } = await supabase
                    .from('user_scholarship_interactions')
                    .update({ is_saved: true })
                    .eq('id', existing.id);
                    
                return json({
                    success: !updateError,
                    message: 'Updated existing interaction',
                    scholarship: testScholarship,
                    user_id: session.user.id,
                    interaction_id: existing.id,
                    was_already_saved: existing.is_saved,
                    update_error: updateError
                });
            } else {
                return json({
                    success: false,
                    error: 'Failed to save scholarship',
                    details: saveError,
                    scholarship: testScholarship,
                    user_id: session.user.id
                }, { status: 400 });
            }
        }
        
        // Test retrieving saved scholarships
        const { data: savedScholarships, error: retrieveError } = await supabase
            .from('user_scholarship_interactions')
            .select(`
                scholarship_id,
                is_saved,
                is_applied,
                scholarships!inner(
                    id,
                    title,
                    provider,
                    amount,
                    deadline
                )
            `)
            .eq('user_id', session.user.id)
            .eq('is_saved', true);
            
        // Clean up test record
        if (saveResult?.id) {
            await supabase
                .from('user_scholarship_interactions')
                .delete()
                .eq('id', saveResult.id);
        }
        
        return json({ 
            success: true,
            message: 'Scholarship save functionality test completed',
            test_scholarship: testScholarship,
            save_successful: !!saveResult,
            user_id: session.user.id,
            saved_scholarships_count: savedScholarships?.length || 0,
            saved_scholarships: savedScholarships,
            retrieve_error: retrieveError
        });
        
    } catch (error) {
        console.error('Scholarship save test error:', error);
        return json({ 
            error: 'Scholarship save test failed', 
            details: error 
        }, { status: 500 });
    }
}; 