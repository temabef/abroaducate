// Add Milwaukee, WI (University of Wisconsin-Milwaukee)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Milwaukee',
  state: 'Wisconsin',
  state_code: 'WI',
  // Housing (monthly)
  dorm_cost_min: 800, dorm_cost_max: 1400,
  shared_apt_min: 1000, shared_apt_max: 1600,
  studio_apt_min: 1500, studio_apt_max: 2300,
  // Living (monthly)
  food_budget: 300, food_average: 500, food_comfortable: 780,
  transportation: 75, utilities: 140, personal_expenses: 220,
  // Tuition (annual)
  public_tuition_min: 9000, public_tuition_max: 28000,
  private_tuition_min: 26000, private_tuition_max: 50000,
  community_tuition_min: 1700, community_tuition_max: 5500,
  // Additional (annual)
  health_insurance: 2800, books_supplies: 1100,
  // City info
  cost_of_living_index: 97.8,
  population: 590000,
  popular_universities: ['University of Wisconsin-Milwaukee', 'Marquette University', 'Milwaukee School of Engineering', 'Milwaukee Area Technical College']
};

async function run(){
  try{
    console.log('Adding Milwaukee, Wisconsin...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Milwaukee added/updated.');
  }catch(e){
    console.error('❌ Failed to add Milwaukee:', e.message);
    process.exit(1);
  }
}

run();
