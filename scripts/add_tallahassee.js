// Add Tallahassee, FL (Florida State University, Florida A&M)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Tallahassee',
  state: 'Florida',
  state_code: 'FL',
  // Housing (monthly) - College town pricing
  dorm_cost_min: 900, dorm_cost_max: 1600,
  shared_apt_min: 1000, shared_apt_max: 1700,
  studio_apt_min: 1600, studio_apt_max: 2400,
  // Living (monthly)
  food_budget: 320, food_average: 540, food_comfortable: 820,
  transportation: 75, utilities: 140, personal_expenses: 240,
  // Tuition (annual)
  public_tuition_min: 10000, public_tuition_max: 30000,
  private_tuition_min: 28000, private_tuition_max: 55000,
  community_tuition_min: 1800, community_tuition_max: 6000,
  // Additional (annual)
  health_insurance: 2900, books_supplies: 1100,
  // City info
  cost_of_living_index: 98.5,
  population: 194000,
  popular_universities: ['Florida State University', 'Florida A&M University', 'Tallahassee Community College', 'Flagler College']
};

async function run(){
  try{
    console.log('Adding Tallahassee, Florida...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Tallahassee added/updated.');
  }catch(e){
    console.error('❌ Failed to add Tallahassee:', e.message);
    process.exit(1);
  }
}

run();
