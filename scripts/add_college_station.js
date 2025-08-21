// Add College Station, TX (Texas A&M)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'College Station',
  state: 'Texas',
  state_code: 'TX',
  dorm_cost_min: 800, dorm_cost_max: 1500,
  shared_apt_min: 700, shared_apt_max: 1200,
  studio_apt_min: 1200, studio_apt_max: 1800,
  food_budget: 280, food_average: 480, food_comfortable: 750,
  transportation: 70, utilities: 140, personal_expenses: 220,
  public_tuition_min: 11000, public_tuition_max: 32000,
  private_tuition_min: 28000, private_tuition_max: 52000,
  community_tuition_min: 1800, community_tuition_max: 6000,
  health_insurance: 2800, books_supplies: 1100,
  cost_of_living_index: 94.5,
  population: 124000,
  popular_universities: ['Texas A&M University']
};

async function run(){
  try{
    console.log('Adding College Station, Texas...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ College Station added/updated.');
  }catch(e){
    console.error('❌ Failed to add College Station:', e.message);
    process.exit(1);
  }
}

run();


