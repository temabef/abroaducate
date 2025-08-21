// Add Sacramento, CA (UC Davis, Sacramento State)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Sacramento',
  state: 'California',
  state_code: 'CA',
  // Housing (monthly)
  dorm_cost_min: 1100, dorm_cost_max: 1900,
  shared_apt_min: 1300, shared_apt_max: 2100,
  studio_apt_min: 2000, studio_apt_max: 3000,
  // Living (monthly)
  food_budget: 380, food_average: 620, food_comfortable: 950,
  transportation: 95, utilities: 170, personal_expenses: 300,
  // Tuition (annual)
  public_tuition_min: 12000, public_tuition_max: 35000,
  private_tuition_min: 35000, private_tuition_max: 68000,
  community_tuition_min: 2200, community_tuition_max: 7500,
  // Additional (annual)
  health_insurance: 3300, books_supplies: 1300,
  // City info
  cost_of_living_index: 125.8,
  population: 513000,
  popular_universities: ['UC Davis', 'Sacramento State University', 'American River College', 'Sacramento City College']
};

async function run(){
  try{
    console.log('Adding Sacramento, California...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Sacramento added/updated.');
  }catch(e){
    console.error('❌ Failed to add Sacramento:', e.message);
    process.exit(1);
  }
}

run();
