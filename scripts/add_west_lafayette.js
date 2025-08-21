// Add West Lafayette, IN (Purdue)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'West Lafayette',
  state: 'Indiana',
  state_code: 'IN',
  dorm_cost_min: 800, dorm_cost_max: 1500,
  shared_apt_min: 750, shared_apt_max: 1300,
  studio_apt_min: 1300, studio_apt_max: 1900,
  food_budget: 280, food_average: 480, food_comfortable: 760,
  transportation: 60, utilities: 140, personal_expenses: 210,
  public_tuition_min: 10000, public_tuition_max: 30000,
  private_tuition_min: 28000, private_tuition_max: 52000,
  community_tuition_min: 1800, community_tuition_max: 6000,
  health_insurance: 2800, books_supplies: 1100,
  cost_of_living_index: 101.2,
  population: 45800,
  popular_universities: ['Purdue University']
};

async function run(){
  try{
    console.log('Adding West Lafayette, Indiana...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ West Lafayette added/updated.');
  }catch(e){
    console.error('❌ Failed to add West Lafayette:', e.message);
    process.exit(1);
  }
}

run();


