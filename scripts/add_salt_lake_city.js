// Add Salt Lake City, UT
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Salt Lake City',
  state: 'Utah',
  state_code: 'UT',
  dorm_cost_min: 850, dorm_cost_max: 1500,
  shared_apt_min: 800, shared_apt_max: 1300,
  studio_apt_min: 1400, studio_apt_max: 2100,
  food_budget: 300, food_average: 520, food_comfortable: 820,
  transportation: 85, utilities: 140, personal_expenses: 230,
  public_tuition_min: 10000, public_tuition_max: 30000,
  private_tuition_min: 28000, private_tuition_max: 52000,
  community_tuition_min: 1800, community_tuition_max: 6500,
  health_insurance: 3000, books_supplies: 1200,
  cost_of_living_index: 112.7,
  population: 200000,
  popular_universities: ['University of Utah', 'Westminster College']
};

async function run(){
  try{
    console.log('Adding Salt Lake City, Utah...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Salt Lake City added/updated.');
  }catch(e){
    console.error('❌ Failed to add Salt Lake City:', e.message);
    process.exit(1);
  }
}

run();


