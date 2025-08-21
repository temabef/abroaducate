// Add Boise, ID (Boise State University)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Boise',
  state: 'Idaho',
  state_code: 'ID',
  // Housing (monthly) - Growing tech hub
  dorm_cost_min: 900, dorm_cost_max: 1600,
  shared_apt_min: 1100, shared_apt_max: 1800,
  studio_apt_min: 1700, studio_apt_max: 2600,
  // Living (monthly)
  food_budget: 320, food_average: 540, food_comfortable: 820,
  transportation: 80, utilities: 140, personal_expenses: 240,
  // Tuition (annual)
  public_tuition_min: 9000, public_tuition_max: 28000,
  private_tuition_min: 26000, private_tuition_max: 50000,
  community_tuition_min: 1700, community_tuition_max: 5500,
  // Additional (annual)
  health_insurance: 2800, books_supplies: 1100,
  // City info
  cost_of_living_index: 102.3,
  population: 235000,
  popular_universities: ['Boise State University', 'College of Idaho', 'Idaho State University', 'College of Western Idaho']
};

async function run(){
  try{
    console.log('Adding Boise, Idaho...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Boise added/updated.');
  }catch(e){
    console.error('❌ Failed to add Boise:', e.message);
    process.exit(1);
  }
}

run();
