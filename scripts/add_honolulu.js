// Add Honolulu, HI (University of Hawaii)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Honolulu',
  state: 'Hawaii',
  state_code: 'HI',
  // Housing (monthly) - Higher due to island location
  dorm_cost_min: 1200, dorm_cost_max: 2200,
  shared_apt_min: 1500, shared_apt_max: 2500,
  studio_apt_min: 2200, studio_apt_max: 3500,
  // Living (monthly) - Higher food costs due to imports
  food_budget: 450, food_average: 750, food_comfortable: 1100,
  transportation: 100, utilities: 200, personal_expenses: 350,
  // Tuition (annual)
  public_tuition_min: 11000, public_tuition_max: 32000,
  private_tuition_min: 30000, private_tuition_max: 58000,
  community_tuition_min: 2000, community_tuition_max: 7000,
  // Additional (annual)
  health_insurance: 3200, books_supplies: 1300,
  // City info
  cost_of_living_index: 165.7,
  population: 345000,
  popular_universities: ['University of Hawaii at Manoa', 'Hawaii Pacific University', 'Chaminade University', 'Kapiolani Community College']
};

async function run(){
  try{
    console.log('Adding Honolulu, Hawaii...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Honolulu added/updated.');
  }catch(e){
    console.error('❌ Failed to add Honolulu:', e.message);
    process.exit(1);
  }
}

run();
