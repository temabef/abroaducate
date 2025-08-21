// Add Arlington, VA (George Mason University)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Arlington',
  state: 'Virginia',
  state_code: 'VA',
  // Housing (monthly)
  dorm_cost_min: 950, dorm_cost_max: 1700,
  shared_apt_min: 1200, shared_apt_max: 2000,
  studio_apt_min: 1900, studio_apt_max: 3000,
  // Living (monthly)
  food_budget: 340, food_average: 570, food_comfortable: 850,
  transportation: 85, utilities: 160, personal_expenses: 260,
  // Tuition (annual)
  public_tuition_min: 10500, public_tuition_max: 32000,
  private_tuition_min: 30000, private_tuition_max: 58000,
  community_tuition_min: 1900, community_tuition_max: 6500,
  // Additional (annual)
  health_insurance: 3200, books_supplies: 1300,
  // City info
  cost_of_living_index: 118.5,
  population: 238000,
  popular_universities: ['George Mason University', 'Marymount University', 'Northern Virginia Community College']
};

async function run(){
  try{
    console.log('Adding Arlington, Virginia...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Arlington added/updated.');
  }catch(e){
    console.error('❌ Failed to add Arlington:', e.message);
    process.exit(1);
  }
}

run();
