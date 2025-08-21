// Add Boulder, CO (CU Boulder)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Boulder',
  state: 'Colorado',
  state_code: 'CO',
  dorm_cost_min: 1100, dorm_cost_max: 1900,
  shared_apt_min: 1100, shared_apt_max: 1700,
  studio_apt_min: 1800, studio_apt_max: 2600,
  food_budget: 340, food_average: 560, food_comfortable: 880,
  transportation: 85, utilities: 160, personal_expenses: 260,
  public_tuition_min: 13000, public_tuition_max: 36000,
  private_tuition_min: 32000, private_tuition_max: 62000,
  community_tuition_min: 2200, community_tuition_max: 7500,
  health_insurance: 3200, books_supplies: 1200,
  cost_of_living_index: 167.5,
  population: 108000,
  popular_universities: ['University of Colorado Boulder']
};

async function run(){
  try{
    console.log('Adding Boulder, Colorado...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Boulder added/updated.');
  }catch(e){
    console.error('❌ Failed to add Boulder:', e.message);
    process.exit(1);
  }
}

run();


