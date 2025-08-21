// Add Tampa, FL (University of South Florida)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Tampa',
  state: 'Florida',
  state_code: 'FL',
  // Housing (monthly)
  dorm_cost_min: 850, dorm_cost_max: 1500,
  shared_apt_min: 1050, shared_apt_max: 1700,
  studio_apt_min: 1600, studio_apt_max: 2400,
  // Living (monthly)
  food_budget: 310, food_average: 520, food_comfortable: 800,
  transportation: 75, utilities: 140, personal_expenses: 230,
  // Tuition (annual)
  public_tuition_min: 9500, public_tuition_max: 29000,
  private_tuition_min: 27000, private_tuition_max: 52000,
  community_tuition_min: 1700, community_tuition_max: 5500,
  // Additional (annual)
  health_insurance: 2900, books_supplies: 1100,
  // City info
  cost_of_living_index: 100.3,
  population: 384000,
  popular_universities: ['University of South Florida', 'University of Tampa', 'Hillsborough Community College']
};

async function run(){
  try{
    console.log('Adding Tampa, Florida...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Tampa added/updated.');
  }catch(e){
    console.error('❌ Failed to add Tampa:', e.message);
    process.exit(1);
  }
}

run();
