// Add Nashville, TN (Vanderbilt University, Tennessee State University)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Nashville',
  state: 'Tennessee',
  state_code: 'TN',
  // Housing (monthly)
  dorm_cost_min: 1000, dorm_cost_max: 1800,
  shared_apt_min: 1200, shared_apt_max: 2000,
  studio_apt_min: 1800, studio_apt_max: 2800,
  // Living (monthly)
  food_budget: 350, food_average: 580, food_comfortable: 900,
  transportation: 90, utilities: 160, personal_expenses: 280,
  // Tuition (annual)
  public_tuition_min: 11000, public_tuition_max: 32000,
  private_tuition_min: 32000, private_tuition_max: 65000,
  community_tuition_min: 2000, community_tuition_max: 7000,
  // Additional (annual)
  health_insurance: 3100, books_supplies: 1200,
  // City info
  cost_of_living_index: 108.2,
  population: 689000,
  popular_universities: ['Vanderbilt University', 'Tennessee State University', 'Belmont University', 'Lipscomb University']
};

async function run(){
  try{
    console.log('Adding Nashville, Tennessee...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Nashville added/updated.');
  }catch(e){
    console.error('❌ Failed to add Nashville:', e.message);
    process.exit(1);
  }
}

run();
