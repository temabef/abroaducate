// Add Orlando, FL (University of Central Florida)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Orlando',
  state: 'Florida',
  state_code: 'FL',
  // Housing (monthly)
  dorm_cost_min: 900, dorm_cost_max: 1600,
  shared_apt_min: 1100, shared_apt_max: 1800,
  studio_apt_min: 1700, studio_apt_max: 2600,
  // Living (monthly)
  food_budget: 320, food_average: 540, food_comfortable: 820,
  transportation: 80, utilities: 150, personal_expenses: 240,
  // Tuition (annual)
  public_tuition_min: 10000, public_tuition_max: 30000,
  private_tuition_min: 28000, private_tuition_max: 55000,
  community_tuition_min: 1800, community_tuition_max: 6000,
  // Additional (annual)
  health_insurance: 3000, books_supplies: 1200,
  // City info
  cost_of_living_index: 103.1,
  population: 307000,
  popular_universities: ['University of Central Florida', 'Rollins College', 'Valencia College', 'Full Sail University']
};

async function run(){
  try{
    console.log('Adding Orlando, Florida...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Orlando added/updated.');
  }catch(e){
    console.error('❌ Failed to add Orlando:', e.message);
    process.exit(1);
  }
}

run();
