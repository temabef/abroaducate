// Add Iowa City, IA
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Iowa City',
  state: 'Iowa',
  state_code: 'IA',
  dorm_cost_min: 700, dorm_cost_max: 1300,
  shared_apt_min: 600, shared_apt_max: 1000,
  studio_apt_min: 1000, studio_apt_max: 1600,
  food_budget: 260, food_average: 450, food_comfortable: 720,
  transportation: 55, utilities: 130, personal_expenses: 200,
  public_tuition_min: 10000, public_tuition_max: 30000,
  private_tuition_min: 27000, private_tuition_max: 50000,
  community_tuition_min: 1700, community_tuition_max: 6000,
  health_insurance: 2700, books_supplies: 1100,
  cost_of_living_index: 93.8,
  population: 75000,
  popular_universities: ['University of Iowa']
};

async function run(){
  try{
    console.log('Adding Iowa City, Iowa...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Iowa City added/updated.');
  }catch(e){
    console.error('❌ Failed to add Iowa City:', e.message);
    process.exit(1);
  }
}

run();


