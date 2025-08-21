// Add Eugene, OR
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Eugene',
  state: 'Oregon',
  state_code: 'OR',
  dorm_cost_min: 800, dorm_cost_max: 1500,
  shared_apt_min: 800, shared_apt_max: 1300,
  studio_apt_min: 1300, studio_apt_max: 1900,
  food_budget: 290, food_average: 500, food_comfortable: 780,
  transportation: 60, utilities: 140, personal_expenses: 210,
  public_tuition_min: 11000, public_tuition_max: 32000,
  private_tuition_min: 28000, private_tuition_max: 52000,
  community_tuition_min: 1800, community_tuition_max: 6500,
  health_insurance: 2900, books_supplies: 1100,
  cost_of_living_index: 109.5,
  population: 178000,
  popular_universities: ['University of Oregon', 'Lane Community College']
};

async function run(){
  try{
    console.log('Adding Eugene, Oregon...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Eugene added/updated.');
  }catch(e){
    console.error('❌ Failed to add Eugene:', e.message);
    process.exit(1);
  }
}

run();


