// Add Tucson, AZ (University of Arizona)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Tucson',
  state: 'Arizona',
  state_code: 'AZ',
  dorm_cost_min: 800, dorm_cost_max: 1500,
  shared_apt_min: 800, shared_apt_max: 1300,
  studio_apt_min: 1300, studio_apt_max: 1900,
  food_budget: 290, food_average: 500, food_comfortable: 780,
  transportation: 70, utilities: 140, personal_expenses: 220,
  public_tuition_min: 10500, public_tuition_max: 30000,
  private_tuition_min: 28000, private_tuition_max: 52000,
  community_tuition_min: 1800, community_tuition_max: 6000,
  health_insurance: 2900, books_supplies: 1100,
  cost_of_living_index: 96.6,
  population: 543000,
  popular_universities: ['University of Arizona']
};

async function run(){
  try{
    console.log('Adding Tucson, Arizona...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Tucson added/updated.');
  }catch(e){
    console.error('❌ Failed to add Tucson:', e.message);
    process.exit(1);
  }
}

run();


