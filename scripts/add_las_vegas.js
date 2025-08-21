// Add Las Vegas, NV (UNLV)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Las Vegas',
  state: 'Nevada',
  state_code: 'NV',
  // Housing (monthly)
  dorm_cost_min: 1000, dorm_cost_max: 1800,
  shared_apt_min: 1200, shared_apt_max: 2000,
  studio_apt_min: 1800, studio_apt_max: 2800,
  // Living (monthly)
  food_budget: 340, food_average: 560, food_comfortable: 880,
  transportation: 85, utilities: 150, personal_expenses: 260,
  // Tuition (annual)
  public_tuition_min: 10000, public_tuition_max: 30000,
  private_tuition_min: 28000, private_tuition_max: 55000,
  community_tuition_min: 1800, community_tuition_max: 6000,
  // Additional (annual)
  health_insurance: 3000, books_supplies: 1200,
  // City info
  cost_of_living_index: 111.5,
  population: 656000,
  popular_universities: ['University of Nevada, Las Vegas (UNLV)', 'Nevada State University', 'College of Southern Nevada']
};

async function run(){
  try{
    console.log('Adding Las Vegas, Nevada...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Las Vegas added/updated.');
  }catch(e){
    console.error('❌ Failed to add Las Vegas:', e.message);
    process.exit(1);
  }
}

run();
