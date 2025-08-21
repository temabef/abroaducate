import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const { calculation, user_preferences } = await request.json();
    
    if (!calculation) {
      return json({ error: 'Calculation data required' }, { status: 400 });
    }

    // For now, return a JSON response with PDF data
    // In production, you would generate an actual PDF using libraries like Puppeteer or jsPDF
    const pdfContent = {
      title: `US Study Budget Plan - ${calculation.city}, ${calculation.state}`,
      user_email: session.user.email,
      generated_at: new Date().toISOString(),
      
      budget_summary: {
        city: calculation.city,
        state: calculation.state,
        total_annual_cost: calculation.totalCost,
        tuition: calculation.tuition,
        housing: calculation.housing,
        food_living: calculation.food + calculation.personal,
        insurance: calculation.insurance,
        books_supplies: calculation.books,
        transportation: calculation.transportation
      },
      
      scholarship_potential: {
        estimated_savings: calculation.scholarshipEstimate,
        recommendations: [
          'Apply for merit-based scholarships early',
          'Look for state-specific financial aid',
          'Consider work-study programs',
          'Apply for departmental scholarships'
        ]
      },
      
      user_preferences: user_preferences,
      
      next_steps: [
        'Research universities in ' + calculation.city,
        'Start scholarship applications 6-8 months early',
        'Prepare required documents (transcripts, essays, recommendations)',
        'Apply for student visa after acceptance',
        'Secure housing arrangements',
        'Plan arrival and orientation'
      ],
      
      cost_breakdown: {
        monthly_costs: {
          housing: Math.round(calculation.housing / 12),
          food: Math.round(calculation.food / 12),
          transportation: Math.round(calculation.transportation / 12),
          personal: Math.round(calculation.personal / 12)
        },
        annual_costs: {
          tuition: calculation.tuition,
          housing: calculation.housing,
          living_expenses: calculation.food + calculation.personal + calculation.transportation,
          insurance: calculation.insurance,
          books: calculation.books
        }
      }
    };

    // Track PDF generation
    try {
      await locals.supabase
        .from('budget_calculator_usage')
        .insert({
          user_id: session.user.id,
          action: 'pdf_generated',
          city: calculation.city,
          state: calculation.state,
          total_cost: calculation.totalCost,
          metadata: {
            user_preferences: user_preferences,
            pdf_content: pdfContent
          }
        });
    } catch (trackingError) {
      console.error('Error tracking PDF generation:', trackingError);
      // Continue even if tracking fails
    }

    // In a real implementation, you would:
    // 1. Generate PDF using puppeteer or similar
    // 2. Save to cloud storage
    // 3. Send email with PDF attachment
    // 4. Return download link or PDF blob
    
    // For now, return the structured data that would be in the PDF
    return new Response(JSON.stringify(pdfContent, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="US-Budget-Plan-${calculation.city}-${calculation.state}.json"`
      }
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

