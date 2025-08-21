// Add Cincinnati, OH
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Cincinnati',
  state: 'Ohio',
  state_code: 'OH',
  dorm_cost_min: 800, dorm_cost_max: 1500,
  shared_apt_min: 650, shared_apt_max: 1100,
  studio_apt_min: 1100, studio_apt_max: 1800,
  food_budget: 280, food_average: 480, food_comfortable: 750,
  transportation: 65, utilities: 130, personal_expenses: 210,
  public_tuition_min: 11000, public_tuition_max: 32000,
  private_tuition_min: 30000, private_tuition_max: 58000,
  community_tuition_min: 2000, community_tuition_max: 7000,
  health_insurance: 2800, books_supplies: 1200,
  cost_of_living_index: 96.1,
  population: 309000,
  popular_universities: ['University of Cincinnati', 'Xavier University']
};

async function run(){
  try{
    console.log('Adding Cincinnati, Ohio...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Cincinnati added/updated.');
  }catch(e){
    console.error('❌ Failed to add Cincinnati:', e.message);
    process.exit(1);
  }
}

run();


