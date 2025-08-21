// Add Athens, GA (UGA)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Athens',
  state: 'Georgia',
  state_code: 'GA',
  dorm_cost_min: 750, dorm_cost_max: 1400,
  shared_apt_min: 700, shared_apt_max: 1200,
  studio_apt_min: 1200, studio_apt_max: 1800,
  food_budget: 270, food_average: 470, food_comfortable: 740,
  transportation: 55, utilities: 130, personal_expenses: 200,
  public_tuition_min: 9000, public_tuition_max: 27000,
  private_tuition_min: 28000, private_tuition_max: 52000,
  community_tuition_min: 1800, community_tuition_max: 6000,
  health_insurance: 2700, books_supplies: 1100,
  cost_of_living_index: 92.4,
  population: 128000,
  popular_universities: ['University of Georgia (UGA)']
};

async function run(){
  try{
    console.log('Adding Athens, Georgia...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Athens added/updated.');
  }catch(e){
    console.error('❌ Failed to add Athens:', e.message);
    process.exit(1);
  }
}

run();


