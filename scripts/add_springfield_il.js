// Add Springfield, IL (University of Illinois Springfield)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Springfield',
  state: 'Illinois',
  state_code: 'IL',
  // Housing (monthly)
  dorm_cost_min: 800, dorm_cost_max: 1400,
  shared_apt_min: 900, shared_apt_max: 1500,
  studio_apt_min: 1400, studio_apt_max: 2100,
  // Living (monthly)
  food_budget: 300, food_average: 500, food_comfortable: 780,
  transportation: 70, utilities: 140, personal_expenses: 220,
  // Tuition (annual)
  public_tuition_min: 10000, public_tuition_max: 30000,
  private_tuition_min: 28000, private_tuition_max: 52000,
  community_tuition_min: 1800, community_tuition_max: 6000,
  // Additional (annual)
  health_insurance: 2800, books_supplies: 1100,
  // City info
  cost_of_living_index: 94.7,
  population: 116000,
  popular_universities: ['University of Illinois Springfield', 'Lincoln Land Community College', 'Robert Morris University', 'Benedictine University']
};

async function run(){
  try{
    console.log('Adding Springfield, Illinois...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Springfield (IL) added/updated.');
  }catch(e){
    console.error('❌ Failed to add Springfield (IL):', e.message);
    process.exit(1);
  }
}

run();
