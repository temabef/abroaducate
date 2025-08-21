import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const { calculation, user_preferences, created_at } = await request.json();
    
    if (!calculation) {
      return json({ error: 'Calculation data required' }, { status: 400 });
    }

    // Save calculation to user's account
    const { data, error } = await locals.supabase
      .from('budget_calculations')
      .upsert({
        user_id: session.user.id,
        city: calculation.city,
        state: calculation.state,
        university_type: user_preferences?.university_type || 'public',
        housing_type: user_preferences?.housing_type || 'shared',
        lifestyle_type: user_preferences?.lifestyle_type || 'average',
        
        // Cost breakdown
        total_cost: calculation.totalCost,
        tuition_cost: calculation.tuition,
        housing_cost: calculation.housing,
        food_cost: calculation.food,
        personal_cost: calculation.personal,
        transportation_cost: calculation.transportation,
        insurance_cost: calculation.insurance,
        books_cost: calculation.books,
        
        // Additional data
        scholarship_estimate: calculation.scholarshipEstimate,
        cost_of_living_index: calculation.costOfLivingIndex,
        
        // Metadata
        calculation_data: calculation,
        user_preferences: user_preferences,
        
        // Timestamps
        created_at: created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Error saving calculation:', error);
      return json({ error: 'Failed to save calculation' }, { status: 500 });
    }

    // Track save action
    try {
      await locals.supabase
        .from('budget_calculator_usage')
        .insert({
          user_id: session.user.id,
          action: 'calculation_saved',
          city: calculation.city,
          state: calculation.state,
          total_cost: calculation.totalCost,
          metadata: {
            user_preferences: user_preferences,
            calculation_id: data[0]?.id
          }
        });
    } catch (trackingError) {
      console.error('Error tracking calculation save:', trackingError);
      // Continue even if tracking fails
    }

    return json({ 
      success: true, 
      calculation_id: data[0]?.id,
      message: 'Calculation saved successfully!'
    });

  } catch (error) {
    console.error('Error in save calculation API:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

