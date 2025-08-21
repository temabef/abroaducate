// Add Buffalo, NY
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Buffalo',
  state: 'New York',
  state_code: 'NY',
  dorm_cost_min: 750, dorm_cost_max: 1400,
  shared_apt_min: 650, shared_apt_max: 1100,
  studio_apt_min: 1000, studio_apt_max: 1600,
  food_budget: 270, food_average: 460, food_comfortable: 720,
  transportation: 75, utilities: 150, personal_expenses: 200,
  public_tuition_min: 10000, public_tuition_max: 29000,
  private_tuition_min: 28000, private_tuition_max: 52000,
  community_tuition_min: 1800, community_tuition_max: 6000,
  health_insurance: 2800, books_supplies: 1100,
  cost_of_living_index: 92.1,
  population: 278000,
  popular_universities: ['University at Buffalo (SUNY Buffalo)', 'Canisius University']
};

async function run(){
  try{
    console.log('Adding Buffalo, New York...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Buffalo added/updated.');
  }catch(e){
    console.error('❌ Failed to add Buffalo:', e.message);
    process.exit(1);
  }
}

run();


