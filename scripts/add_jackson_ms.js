// Add Jackson, MS (Jackson State University)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Jackson',
  state: 'Mississippi',
  state_code: 'MS',
  // Housing (monthly)
  dorm_cost_min: 650, dorm_cost_max: 1100,
  shared_apt_min: 800, shared_apt_max: 1300,
  studio_apt_min: 1100, studio_apt_max: 1700,
  // Living (monthly)
  food_budget: 250, food_average: 420, food_comfortable: 650,
  transportation: 60, utilities: 110, personal_expenses: 180,
  // Tuition (annual)
  public_tuition_min: 7500, public_tuition_max: 22000,
  private_tuition_min: 22000, private_tuition_max: 42000,
  community_tuition_min: 1400, community_tuition_max: 4800,
  // Additional (annual)
  health_insurance: 2500, books_supplies: 900,
  // City info
  cost_of_living_index: 84.1,
  population: 153000,
  popular_universities: ['Jackson State University', 'Millsaps College', 'Belhaven University']
};

async function run(){
  try{
    console.log('Adding Jackson, Mississippi...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Jackson (MS) added/updated.');
  }catch(e){
    console.error('❌ Failed to add Jackson (MS):', e.message);
    process.exit(1);
  }
}

run();
