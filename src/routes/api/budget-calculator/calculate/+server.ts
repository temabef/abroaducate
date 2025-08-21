import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface CalculationRequest {
  // Location
  city: string;
  state: string;
  
  // University
  university_type: 'public' | 'private' | 'community';
  custom_tuition?: number;
  
  // Housing
  housing_type: 'dorm' | 'shared' | 'studio';
  custom_housing?: number;
  
  // Lifestyle
  lifestyle: 'budget' | 'average' | 'comfortable';
  custom_food?: number;
  
  // User info (optional)
  session_id?: string;
  user_id?: string;
  email?: string;
  phone?: string;
  interested_in_scholarships?: boolean;
  interested_in_loans?: boolean;
  interested_in_consultation?: boolean;
  
  // Tracking
  source?: string;
  utm_campaign?: string;
  utm_source?: string;
}

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const data: CalculationRequest = await request.json();
    
    // Validate required fields
    if (!data.city || !data.state || !data.university_type || !data.housing_type || !data.lifestyle) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Get city cost data
    const { data: cityData, error: cityError } = await supabase
      .rpc('get_city_cost_data', {
        p_city: data.city,
        p_state: data.state
      });
    
    if (cityError) {
      console.error('Error fetching city data:', cityError);
      return json({ error: 'Failed to fetch city data' }, { status: 500 });
    }
    
    if (!cityData || cityData.length === 0) {
      return json({ error: 'City not found' }, { status: 404 });
    }
    
    const cityInfo = cityData[0];
    
    // Calculate costs
    const tuitionCost = data.custom_tuition || calculateTuitionCost(data.university_type, cityInfo.tuition_costs);
    const housingCost = data.custom_housing || calculateHousingCost(data.housing_type, cityInfo.housing_costs);
    const foodCost = data.custom_food || calculateFoodCost(data.lifestyle, cityInfo.living_costs);
    
    const personalCost = cityInfo.living_costs.personal || 200;
    const transportationCost = cityInfo.living_costs.transportation || 100;
    const utilitiesCost = cityInfo.living_costs.utilities || 150;
    const insuranceCost = cityInfo.additional_costs.health_insurance || 2000;
    const booksCost = cityInfo.additional_costs.books_supplies || 1200;
    
    // Calculate totals
    const monthlyLiving = housingCost + foodCost + personalCost + transportationCost + utilitiesCost;
    const annualLiving = monthlyLiving * 12;
    const totalAnnual = tuitionCost + annualLiving + insuranceCost + booksCost;
    const total4Year = totalAnnual * 4;
    const monthlyTotal = Math.ceil(totalAnnual / 12);
    
    // Generate savings tips
    const savingsTips = generateSavingsTips(totalAnnual, data.university_type, data.housing_type);
    
    // Calculate scholarship potential (up to 40% of total or $25k, whichever is lower)
    const scholarshipEstimate = Math.min(totalAnnual * 0.4, 25000);
    
    // Prepare result
    const result = {
      // Input data
      city: data.city,
      state: data.state,
      university_type: data.university_type,
      housing_type: data.housing_type,
      lifestyle: data.lifestyle,
      
      // Cost breakdown (annual)
      tuition: Math.ceil(tuitionCost),
      housing: Math.ceil(housingCost * 12),
      food: Math.ceil(foodCost * 12),
      personal: Math.ceil(personalCost * 12),
      transportation: Math.ceil(transportationCost * 12),
      utilities: Math.ceil(utilitiesCost * 12),
      insurance: Math.ceil(insuranceCost),
      books: Math.ceil(booksCost),
      
      // Monthly breakdown
      monthly_housing: Math.ceil(housingCost),
      monthly_food: Math.ceil(foodCost),
      monthly_personal: Math.ceil(personalCost),
      monthly_transportation: Math.ceil(transportationCost),
      monthly_utilities: Math.ceil(utilitiesCost),
      monthly_total: monthlyTotal,
      
      // Totals
      total_annual: Math.ceil(totalAnnual),
      total_4_year: Math.ceil(total4Year),
      
      // Additional info
      cost_of_living_index: cityInfo.metadata?.cost_of_living_index || 100,
      popular_universities: cityInfo.metadata?.popular_universities || [],
      savings_tips: savingsTips,
      scholarship_estimate: Math.ceil(scholarshipEstimate),
      
      // Comparison data
      compared_to_national_average: calculateComparisonToAverage(totalAnnual),
      affordability_rating: calculateAffordabilityRating(totalAnnual)
    };
    
    // Save calculation to database
    try {
      const calculationData = {
        user_id: data.user_id || null,
        session_id: data.session_id || `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        city: data.city,
        state: data.state,
        university_type: data.university_type,
        housing_type: data.housing_type,
        lifestyle: data.lifestyle,
        tuition_annual: result.tuition,
        housing_monthly: result.monthly_housing,
        food_monthly: result.monthly_food,
        personal_monthly: result.monthly_personal,
        transportation_monthly: result.monthly_transportation,
        insurance_annual: result.insurance,
        books_annual: result.books,
        total_annual: result.total_annual,
        total_4_year: result.total_4_year,
        monthly_budget: result.monthly_total,
        email: data.email || null,
        phone: data.phone || null,
        interested_in_scholarships: data.interested_in_scholarships || false,
        interested_in_loans: data.interested_in_loans || false,
        interested_in_consultation: data.interested_in_consultation || false,
        source: data.source || 'direct',
        utm_campaign: data.utm_campaign || null,
        utm_source: data.utm_source || null
      };
      
      const { error: insertError } = await supabase
        .from('budget_calculations')
        .insert(calculationData);
      
      if (insertError) {
        console.error('Error saving calculation:', insertError);
        // Don't fail the request if saving fails
      }
      
    } catch (saveError) {
      console.error('Error saving calculation to database:', saveError);
      // Continue with response even if save fails
    }
    
    return json({
      success: true,
      calculation: result
    });
    
  } catch (error) {
    console.error('Error in calculate endpoint:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

// Helper functions
function calculateTuitionCost(type: string, tuitionData: any): number {
  const costs = tuitionData[type];
  if (!costs) {
    // Default values if data is missing
    switch (type) {
      case 'public': return 25000;
      case 'private': return 40000;
      case 'community': return 12000;
      default: return 25000;
    }
  }
  
  // Return average of min and max
  return (costs.min + costs.max) / 2;
}

function calculateHousingCost(type: string, housingData: any): number {
  const costs = housingData[type];
  if (!costs) {
    // Default values if data is missing
    switch (type) {
      case 'dorm': return 1200;
      case 'shared': return 900;
      case 'studio': return 1800;
      default: return 1200;
    }
  }
  
  // Return average of min and max
  return (costs.min + costs.max) / 2;
}

function calculateFoodCost(lifestyle: string, livingData: any): number {
  const foodCosts = livingData.food;
  if (!foodCosts) {
    // Default values if data is missing
    switch (lifestyle) {
      case 'budget': return 400;
      case 'average': return 650;
      case 'comfortable': return 1000;
      default: return 650;
    }
  }
  
  return foodCosts[lifestyle] || 650;
}

function generateSavingsTips(totalAnnual: number, universityType: string, housingType: string): string[] {
  const tips: string[] = [];
  
  // Scholarship tip
  const scholarshipAmount = Math.min(totalAnnual * 0.4, 25000);
  tips.push(`Apply for scholarships to save up to $${Math.floor(scholarshipAmount).toLocaleString()}/year`);
  
  // Housing tips
  if (housingType === 'studio') {
    tips.push('Choose shared housing to save $400-800/month');
  } else if (housingType === 'dorm') {
    tips.push('Consider off-campus shared housing for potential savings');
  }
  
  // University tips
  if (universityType === 'private') {
    tips.push('Consider public universities to save $10,000-20,000/year');
  }
  
  // General tips
  tips.push('Buy used textbooks to save $500-1,000/year');
  tips.push('Use student discounts for transportation and entertainment');
  tips.push('Cook at home instead of dining out to save $200-400/month');
  
  // Work opportunities
  if (totalAnnual > 40000) {
    tips.push('Look into graduate assistantships or campus jobs for funding');
  }
  
  return tips.slice(0, 5); // Return top 5 tips
}

function calculateComparisonToAverage(totalAnnual: number): {
  percentage: number;
  message: string;
  category: 'low' | 'average' | 'high';
} {
  const nationalAverage = 35000; // Approximate US average for international students
  const percentage = Math.round(((totalAnnual - nationalAverage) / nationalAverage) * 100);
  
  let category: 'low' | 'average' | 'high';
  let message: string;
  
  if (percentage < -10) {
    category = 'low';
    message = `${Math.abs(percentage)}% below national average - Great value!`;
  } else if (percentage > 15) {
    category = 'high';
    message = `${percentage}% above national average - Premium location`;
  } else {
    category = 'average';
    message = 'Close to national average cost';
  }
  
  return { percentage, message, category };
}

function calculateAffordabilityRating(totalAnnual: number): {
  rating: number; // 1-5 scale
  label: string;
  description: string;
} {
  let rating: number;
  let label: string;
  let description: string;
  
  if (totalAnnual < 25000) {
    rating = 5;
    label = 'Very Affordable';
    description = 'Excellent value for international students';
  } else if (totalAnnual < 35000) {
    rating = 4;
    label = 'Affordable';
    description = 'Good balance of cost and quality';
  } else if (totalAnnual < 45000) {
    rating = 3;
    label = 'Moderate';
    description = 'Average cost for US education';
  } else if (totalAnnual < 60000) {
    rating = 2;
    label = 'Expensive';
    description = 'Higher than average, but manageable with funding';
  } else {
    rating = 1;
    label = 'Very Expensive';
    description = 'Premium cost - significant funding needed';
  }
  
  return { rating, label, description };
}
