// Add Pittsburgh, PA
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Pittsburgh',
  state: 'Pennsylvania',
  state_code: 'PA',
  // Housing (monthly)
  dorm_cost_min: 950, dorm_cost_max: 1700,
  shared_apt_min: 900, shared_apt_max: 1500,
  studio_apt_min: 1500, studio_apt_max: 2300,
  // Living (monthly)
  food_budget: 300, food_average: 520, food_comfortable: 820,
  transportation: 85, utilities: 150, personal_expenses: 240,
  // Tuition (annual)
  public_tuition_min: 12000, public_tuition_max: 34000,
  private_tuition_min: 35000, private_tuition_max: 65000,
  community_tuition_min: 2000, community_tuition_max: 7000,
  // Additional (annual)
  health_insurance: 3200, books_supplies: 1200,
  // City info
  cost_of_living_index: 103.7,
  population: 302000,
  popular_universities: ['Carnegie Mellon University', 'University of Pittsburgh']
};

async function run(){
  try{
    console.log('Adding Pittsburgh, Pennsylvania...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Pittsburgh added/updated.');
  }catch(e){
    console.error('❌ Failed to add Pittsburgh:', e.message);
    process.exit(1);
  }
}

run();


