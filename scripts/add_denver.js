// Add Denver, CO
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Denver',
  state: 'Colorado',
  state_code: 'CO',
  dorm_cost_min: 900, dorm_cost_max: 1600,
  shared_apt_min: 900, shared_apt_max: 1500,
  studio_apt_min: 1500, studio_apt_max: 2300,
  food_budget: 320, food_average: 540, food_comfortable: 850,
  transportation: 90, utilities: 150, personal_expenses: 240,
  public_tuition_min: 11000, public_tuition_max: 32000,
  private_tuition_min: 30000, private_tuition_max: 60000,
  community_tuition_min: 2000, community_tuition_max: 7000,
  health_insurance: 3000, books_supplies: 1200,
  cost_of_living_index: 127.0,
  population: 711000,
  popular_universities: ['University of Colorado Denver', 'University of Denver', 'Metropolitan State University of Denver']
};

async function run(){
  try{
    console.log('Adding Denver, Colorado...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Denver added/updated.');
  }catch(e){
    console.error('❌ Failed to add Denver:', e.message);
    process.exit(1);
  }
}

run();


