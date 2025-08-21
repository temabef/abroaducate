// Add Tempe, AZ (Arizona State University)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Tempe',
  state: 'Arizona',
  state_code: 'AZ',
  dorm_cost_min: 900, dorm_cost_max: 1600,
  shared_apt_min: 1000, shared_apt_max: 1600,
  studio_apt_min: 1600, studio_apt_max: 2300,
  food_budget: 320, food_average: 540, food_comfortable: 820,
  transportation: 80, utilities: 150, personal_expenses: 240,
  public_tuition_min: 11000, public_tuition_max: 32000,
  private_tuition_min: 30000, private_tuition_max: 58000,
  community_tuition_min: 2000, community_tuition_max: 7000,
  health_insurance: 3000, books_supplies: 1200,
  cost_of_living_index: 114.4,
  population: 181000,
  popular_universities: ['Arizona State University (ASU)']
};

async function run(){
  try{
    console.log('Adding Tempe, Arizona...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Tempe added/updated.');
  }catch(e){
    console.error('❌ Failed to add Tempe:', e.message);
    process.exit(1);
  }
}

run();


