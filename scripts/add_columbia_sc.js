// Add Columbia, SC (University of South Carolina)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Columbia',
  state: 'South Carolina',
  state_code: 'SC',
  dorm_cost_min: 750, dorm_cost_max: 1400,
  shared_apt_min: 650, shared_apt_max: 1100,
  studio_apt_min: 1100, studio_apt_max: 1700,
  food_budget: 260, food_average: 460, food_comfortable: 730,
  transportation: 55, utilities: 130, personal_expenses: 200,
  public_tuition_min: 10000, public_tuition_max: 30000,
  private_tuition_min: 28000, private_tuition_max: 52000,
  community_tuition_min: 1800, community_tuition_max: 6000,
  health_insurance: 2700, books_supplies: 1100,
  cost_of_living_index: 91.5,
  population: 137000,
  popular_universities: ['University of South Carolina']
};

async function run(){
  try{
    console.log('Adding Columbia, South Carolina...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Columbia (SC) added/updated.');
  }catch(e){
    console.error('❌ Failed to add Columbia (SC):', e.message);
    process.exit(1);
  }
}

run();


