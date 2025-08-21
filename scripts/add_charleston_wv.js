// Add Charleston, WV
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Charleston',
  state: 'West Virginia',
  state_code: 'WV',
  // Housing (monthly)
  dorm_cost_min: 850, dorm_cost_max: 1500,
  shared_apt_min: 1000, shared_apt_max: 1700,
  studio_apt_min: 1600, studio_apt_max: 2400,
  // Living (monthly)
  food_budget: 310, food_average: 520, food_comfortable: 800,
  transportation: 75, utilities: 140, personal_expenses: 230,
  // Tuition (annual)
  public_tuition_min: 9500, public_tuition_max: 29000,
  private_tuition_min: 27000, private_tuition_max: 52000,
  community_tuition_min: 1700, community_tuition_max: 5500,
  // Additional (annual)
  health_insurance: 2900, books_supplies: 1100,
  // City info
  cost_of_living_index: 95.2,
  population: 52000,
  popular_universities: ['University of Charleston', 'West Virginia State University', 'West Virginia University Institute of Technology', 'BridgeValley Community and Technical College']
};

async function run(){
  try{
    console.log('Adding Charleston, West Virginia...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Charleston (WV) added/updated.');
  }catch(e){
    console.error('❌ Failed to add Charleston (WV):', e.message);
    process.exit(1);
  }
}

run();
