// Add Charlotte, NC
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Charlotte',
  state: 'North Carolina',
  state_code: 'NC',
  dorm_cost_min: 900, dorm_cost_max: 1600,
  shared_apt_min: 1000, shared_apt_max: 1600,
  studio_apt_min: 1600, studio_apt_max: 2300,
  food_budget: 300, food_average: 520, food_comfortable: 820,
  transportation: 85, utilities: 150, personal_expenses: 240,
  public_tuition_min: 10000, public_tuition_max: 30000,
  private_tuition_min: 30000, private_tuition_max: 58000,
  community_tuition_min: 2000, community_tuition_max: 7000,
  health_insurance: 3000, books_supplies: 1200,
  cost_of_living_index: 106.0,
  population: 897000,
  popular_universities: ['UNC Charlotte', 'Queens University of Charlotte']
};

async function run(){
  try{
    console.log('Adding Charlotte, North Carolina...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Charlotte added/updated.');
  }catch(e){
    console.error('❌ Failed to add Charlotte:', e.message);
    process.exit(1);
  }
}

run();


