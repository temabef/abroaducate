// Add Philadelphia, PA
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Philadelphia',
  state: 'Pennsylvania',
  state_code: 'PA',
  dorm_cost_min: 1000, dorm_cost_max: 1800,
  shared_apt_min: 900, shared_apt_max: 1500,
  studio_apt_min: 1600, studio_apt_max: 2400,
  food_budget: 320, food_average: 540, food_comfortable: 850,
  transportation: 90, utilities: 150, personal_expenses: 250,
  public_tuition_min: 12000, public_tuition_max: 34000,
  private_tuition_min: 35000, private_tuition_max: 65000,
  community_tuition_min: 2000, community_tuition_max: 7000,
  health_insurance: 3200, books_supplies: 1200,
  cost_of_living_index: 121.6,
  population: 1570000,
  popular_universities: ['University of Pennsylvania', 'Temple University', 'Drexel University']
};

async function run(){
  try{
    console.log('Adding Philadelphia, Pennsylvania...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Philadelphia added/updated.');
  }catch(e){
    console.error('❌ Failed to add Philadelphia:', e.message);
    process.exit(1);
  }
}

run();


