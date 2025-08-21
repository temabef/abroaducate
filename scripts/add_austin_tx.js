// Add Austin, TX (State Capital - University of Texas at Austin)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = {
  city: 'Austin',
  state: 'Texas',
  state_code: 'TX',
  // Housing (monthly) - Tech hub pricing
  dorm_cost_min: 1100, dorm_cost_max: 2000,
  shared_apt_min: 1300, shared_apt_max: 2200,
  studio_apt_min: 2000, studio_apt_max: 3200,
  // Living (monthly)
  food_budget: 380, food_average: 620, food_comfortable: 950,
  transportation: 90, utilities: 160, personal_expenses: 280,
  // Tuition (annual)
  public_tuition_min: 11000, public_tuition_max: 32000,
  private_tuition_min: 32000, private_tuition_max: 62000,
  community_tuition_min: 2000, community_tuition_max: 7000,
  // Additional (annual)
  health_insurance: 3100, books_supplies: 1200,
  // City info
  cost_of_living_index: 119.0,
  population: 978000,
  popular_universities: ['University of Texas at Austin', 'Texas State University', 'Austin Community College', 'St. Edward\'s University']
};

async function run(){
  try{
    console.log('Adding Austin, Texas (State Capital)...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Austin (TX Capital) added/updated.');
  }catch(e){
    console.error('❌ Failed to add Austin (TX Capital):', e.message);
    process.exit(1);
  }
}

run();
