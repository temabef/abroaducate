// Add Lubbock, TX (Texas Tech University)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Lubbock',
  state: 'Texas',
  state_code: 'TX',
  // Housing (monthly)
  dorm_cost_min: 700, dorm_cost_max: 1200,
  shared_apt_min: 850, shared_apt_max: 1400,
  studio_apt_min: 1200, studio_apt_max: 1800,
  // Living (monthly)
  food_budget: 270, food_average: 450, food_comfortable: 700,
  transportation: 65, utilities: 120, personal_expenses: 200,
  // Tuition (annual)
  public_tuition_min: 8000, public_tuition_max: 24000,
  private_tuition_min: 24000, private_tuition_max: 46000,
  community_tuition_min: 1500, community_tuition_max: 5000,
  // Additional (annual)
  health_insurance: 2600, books_supplies: 1000,
  // City info
  cost_of_living_index: 85.2,
  population: 258000,
  popular_universities: ['Texas Tech University', 'Lubbock Christian University', 'South Plains College']
};

async function run(){
  try{
    console.log('Adding Lubbock, Texas...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Lubbock added/updated.');
  }catch(e){
    console.error('❌ Failed to add Lubbock:', e.message);
    process.exit(1);
  }
}

run();
