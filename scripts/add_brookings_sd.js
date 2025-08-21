// Add Brookings, SD (South Dakota State University)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Brookings',
  state: 'South Dakota',
  state_code: 'SD',
  // Housing (monthly)
  dorm_cost_min: 700, dorm_cost_max: 1200,
  shared_apt_min: 850, shared_apt_max: 1400,
  studio_apt_min: 1200, studio_apt_max: 1800,
  // Living (monthly)
  food_budget: 270, food_average: 450, food_comfortable: 700,
  transportation: 65, utilities: 120, personal_expenses: 200,
  // Tuition (annual)
  public_tuition_min: 8000, public_tuition_max: 24000,
  private_tuition_min: 24000, private_tuition_max: 46000,
  community_tuition_min: 1500, community_tuition_max: 5000,
  // Additional (annual)
  health_insurance: 2600, books_supplies: 1000,
  // City info
  cost_of_living_index: 90.5,
  population: 24000,
  popular_universities: ['South Dakota State University']
};

async function run(){
  try{
    console.log('Adding Brookings, South Dakota...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Brookings (SD) added/updated.');
  }catch(e){
    console.error('❌ Failed to add Brookings (SD):', e.message);
    process.exit(1);
  }
}

run();
