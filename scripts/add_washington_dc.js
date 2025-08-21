// Add Washington, DC
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Washington',
  state: 'District of Columbia',
  state_code: 'DC',
  // Housing (monthly)
  dorm_cost_min: 1000, dorm_cost_max: 1800,
  shared_apt_min: 1300, shared_apt_max: 2200,
  studio_apt_min: 2100, studio_apt_max: 3500,
  // Living (monthly)
  food_budget: 360, food_average: 600, food_comfortable: 900,
  transportation: 90, utilities: 170, personal_expenses: 280,
  // Tuition (annual)
  public_tuition_min: 11000, public_tuition_max: 35000,
  private_tuition_min: 32000, private_tuition_max: 62000,
  community_tuition_min: 2000, community_tuition_max: 7000,
  // Additional (annual)
  health_insurance: 3400, books_supplies: 1400,
  // City info
  cost_of_living_index: 135.8,
  population: 689000,
  popular_universities: ['George Washington University', 'American University', 'Georgetown University', 'Howard University', 'University of the District of Columbia', 'Catholic University of America']
};

async function run(){
  try{
    console.log('Adding Washington, DC...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Washington DC added/updated.');
  }catch(e){
    console.error('❌ Failed to add Washington DC:', e.message);
    process.exit(1);
  }
}

run();
