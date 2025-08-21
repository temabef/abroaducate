// Add Lawrence, KS (University of Kansas)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Lawrence',
  state: 'Kansas',
  state_code: 'KS',
  dorm_cost_min: 750, dorm_cost_max: 1400,
  shared_apt_min: 650, shared_apt_max: 1150,
  studio_apt_min: 1100, studio_apt_max: 1750,
  food_budget: 260, food_average: 460, food_comfortable: 730,
  transportation: 55, utilities: 130, personal_expenses: 200,
  public_tuition_min: 9500, public_tuition_max: 28000,
  private_tuition_min: 27000, private_tuition_max: 50000,
  community_tuition_min: 1800, community_tuition_max: 6000,
  health_insurance: 2700, books_supplies: 1100,
  cost_of_living_index: 92.7,
  population: 95000,
  popular_universities: ['University of Kansas']
};

async function run(){
  try{
    console.log('Adding Lawrence, Kansas...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Lawrence added/updated.');
  }catch(e){
    console.error('❌ Failed to add Lawrence:', e.message);
    process.exit(1);
  }
}

run();


