// Add Anchorage, AK (University of Alaska Anchorage)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Anchorage',
  state: 'Alaska',
  state_code: 'AK',
  // Housing (monthly) - Higher due to remote location
  dorm_cost_min: 1000, dorm_cost_max: 1800,
  shared_apt_min: 1200, shared_apt_max: 2000,
  studio_apt_min: 1800, studio_apt_max: 2800,
  // Living (monthly) - Higher food costs due to imports
  food_budget: 400, food_average: 680, food_comfortable: 1000,
  transportation: 110, utilities: 180, personal_expenses: 320,
  // Tuition (annual)
  public_tuition_min: 10000, public_tuition_max: 30000,
  private_tuition_min: 28000, private_tuition_max: 55000,
  community_tuition_min: 1800, community_tuition_max: 6000,
  // Additional (annual)
  health_insurance: 3100, books_supplies: 1200,
  // City info
  cost_of_living_index: 131.8,
  population: 291000,
  popular_universities: ['University of Alaska Anchorage', 'Alaska Pacific University', 'Charter College', 'Alaska Career College']
};

async function run(){
  try{
    console.log('Adding Anchorage, Alaska...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Anchorage added/updated.');
  }catch(e){
    console.error('❌ Failed to add Anchorage:', e.message);
    process.exit(1);
  }
}

run();
