// Add Bloomington, IN (Indiana University)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Bloomington',
  state: 'Indiana',
  state_code: 'IN',
  dorm_cost_min: 800, dorm_cost_max: 1500,
  shared_apt_min: 750, shared_apt_max: 1250,
  studio_apt_min: 1200, studio_apt_max: 1850,
  food_budget: 270, food_average: 470, food_comfortable: 740,
  transportation: 55, utilities: 130, personal_expenses: 210,
  public_tuition_min: 10000, public_tuition_max: 30000,
  private_tuition_min: 28000, private_tuition_max: 52000,
  community_tuition_min: 1800, community_tuition_max: 6000,
  health_insurance: 2700, books_supplies: 1100,
  cost_of_living_index: 97.8,
  population: 79000,
  popular_universities: ['Indiana University Bloomington']
};

async function run(){
  try{
    console.log('Adding Bloomington, Indiana...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Bloomington added/updated.');
  }catch(e){
    console.error('❌ Failed to add Bloomington:', e.message);
    process.exit(1);
  }
}

run();


