// Add Gainesville, FL (UF)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Gainesville',
  state: 'Florida',
  state_code: 'FL',
  dorm_cost_min: 800, dorm_cost_max: 1500,
  shared_apt_min: 800, shared_apt_max: 1300,
  studio_apt_min: 1300, studio_apt_max: 1900,
  food_budget: 280, food_average: 480, food_comfortable: 760,
  transportation: 60, utilities: 140, personal_expenses: 210,
  public_tuition_min: 9000, public_tuition_max: 28000,
  private_tuition_min: 28000, private_tuition_max: 52000,
  community_tuition_min: 1800, community_tuition_max: 6000,
  health_insurance: 2800, books_supplies: 1100,
  cost_of_living_index: 95.8,
  population: 145000,
  popular_universities: ['University of Florida']
};

async function run(){
  try{
    console.log('Adding Gainesville, Florida...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Gainesville added/updated.');
  }catch(e){
    console.error('❌ Failed to add Gainesville:', e.message);
    process.exit(1);
  }
}

run();


