// Add Jefferson City, MO (Lincoln University)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Jefferson City',
  state: 'Missouri',
  state_code: 'MO',
  // Housing (monthly)
  dorm_cost_min: 750, dorm_cost_max: 1300,
  shared_apt_min: 800, shared_apt_max: 1400,
  studio_apt_min: 1300, studio_apt_max: 1900,
  // Living (monthly)
  food_budget: 280, food_average: 470, food_comfortable: 740,
  transportation: 65, utilities: 130, personal_expenses: 210,
  // Tuition (annual)
  public_tuition_min: 9000, public_tuition_max: 28000,
  private_tuition_min: 26000, private_tuition_max: 50000,
  community_tuition_min: 1700, community_tuition_max: 5500,
  // Additional (annual)
  health_insurance: 2700, books_supplies: 1100,
  // City info
  cost_of_living_index: 89.2,
  population: 43000,
  popular_universities: ['Lincoln University', 'Columbia College', 'Missouri State University', 'Central Methodist University']
};

async function run(){
  try{
    console.log('Adding Jefferson City, Missouri...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Jefferson City added/updated.');
  }catch(e){
    console.error('❌ Failed to add Jefferson City:', e.message);
    process.exit(1);
  }
}

run();
