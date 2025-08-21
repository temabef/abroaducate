// Add Albany, NY (SUNY Albany, RPI)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Albany',
  state: 'New York',
  state_code: 'NY',
  // Housing (monthly)
  dorm_cost_min: 900, dorm_cost_max: 1600,
  shared_apt_min: 1000, shared_apt_max: 1700,
  studio_apt_min: 1600, studio_apt_max: 2400,
  // Living (monthly)
  food_budget: 320, food_average: 540, food_comfortable: 820,
  transportation: 80, utilities: 150, personal_expenses: 250,
  // Tuition (annual)
  public_tuition_min: 10000, public_tuition_max: 30000,
  private_tuition_min: 30000, private_tuition_max: 58000,
  community_tuition_min: 1800, community_tuition_max: 6000,
  // Additional (annual)
  health_insurance: 3000, books_supplies: 1200,
  // City info
  cost_of_living_index: 105.3,
  population: 101000,
  popular_universities: ['SUNY Albany', 'Rensselaer Polytechnic Institute (RPI)', 'Albany Medical College', 'Albany College of Pharmacy']
};

async function run(){
  try{
    console.log('Adding Albany, New York...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Albany added/updated.');
  }catch(e){
    console.error('❌ Failed to add Albany:', e.message);
    process.exit(1);
  }
}

run();
