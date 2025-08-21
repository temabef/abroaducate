// Add New Brunswick, NJ (Rutgers University-New Brunswick)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'New Brunswick',
  state: 'New Jersey',
  state_code: 'NJ',
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
  cost_of_living_index: 112.3,
  population: 55000,
  popular_universities: ['Rutgers University-New Brunswick', 'Rutgers Robert Wood Johnson Medical School', 'Middlesex County College']
};

async function run(){
  try{
    console.log('Adding New Brunswick, New Jersey...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ New Brunswick added/updated.');
  }catch(e){
    console.error('❌ Failed to add New Brunswick:', e.message);
    process.exit(1);
  }
}

run();
