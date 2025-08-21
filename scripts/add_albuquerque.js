// Add Albuquerque, NM (University of New Mexico)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Albuquerque',
  state: 'New Mexico',
  state_code: 'NM',
  // Housing (monthly)
  dorm_cost_min: 800, dorm_cost_max: 1500,
  shared_apt_min: 950, shared_apt_max: 1600,
  studio_apt_min: 1400, studio_apt_max: 2200,
  // Living (monthly)
  food_budget: 300, food_average: 500, food_comfortable: 780,
  transportation: 70, utilities: 140, personal_expenses: 220,
  // Tuition (annual)
  public_tuition_min: 9000, public_tuition_max: 28000,
  private_tuition_min: 26000, private_tuition_max: 50000,
  community_tuition_min: 1600, community_tuition_max: 5200,
  // Additional (annual)
  health_insurance: 2800, books_supplies: 1100,
  // City info
  cost_of_living_index: 94.2,
  population: 565000,
  popular_universities: ['University of New Mexico', 'Central New Mexico Community College', 'Southwestern Indian Polytechnic Institute']
};

async function run(){
  try{
    console.log('Adding Albuquerque, New Mexico...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Albuquerque added/updated.');
  }catch(e){
    console.error('❌ Failed to add Albuquerque:', e.message);
    process.exit(1);
  }
}

run();
