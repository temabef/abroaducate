// Add Augusta, GA (Augusta University)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Augusta',
  state: 'Georgia',
  state_code: 'GA',
  // Housing (monthly)
  dorm_cost_min: 750, dorm_cost_max: 1300,
  shared_apt_min: 950, shared_apt_max: 1500,
  studio_apt_min: 1400, studio_apt_max: 2100,
  // Living (monthly)
  food_budget: 280, food_average: 470, food_comfortable: 740,
  transportation: 70, utilities: 130, personal_expenses: 210,
  // Tuition (annual)
  public_tuition_min: 8500, public_tuition_max: 26000,
  private_tuition_min: 25000, private_tuition_max: 48000,
  community_tuition_min: 1600, community_tuition_max: 5200,
  // Additional (annual)
  health_insurance: 2700, books_supplies: 1000,
  // City info
  cost_of_living_index: 90.8,
  population: 202000,
  popular_universities: ['Augusta University', 'Paine College', 'Augusta Technical College']
};

async function run(){
  try{
    console.log('Adding Augusta, Georgia...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Augusta (GA) added/updated.');
  }catch(e){
    console.error('❌ Failed to add Augusta (GA):', e.message);
    process.exit(1);
  }
}

run();
