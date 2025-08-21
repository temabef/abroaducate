// Add Richmond, VA to us_cities_cost_data
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const data = {
  city: 'Richmond',
  state: 'Virginia',
  state_code: 'VA',

  // Housing (monthly)
  dorm_cost_min: 900,
  dorm_cost_max: 1600,
  shared_apt_min: 700,
  shared_apt_max: 1200,
  studio_apt_min: 1300,
  studio_apt_max: 2000,

  // Living (monthly)
  food_budget: 300,
  food_average: 500,
  food_comfortable: 800,
  transportation: 70,
  utilities: 140,
  personal_expenses: 220,

  // Tuition (annual)
  public_tuition_min: 12000,
  public_tuition_max: 35000,
  private_tuition_min: 30000,
  private_tuition_max: 60000,
  community_tuition_min: 2000,
  community_tuition_max: 8000,

  // Additional (annual)
  health_insurance: 3000,
  books_supplies: 1200,

  // City info
  cost_of_living_index: 104.7,
  population: 229000,
  popular_universities: [
    'Virginia Commonwealth University (VCU)',
    'University of Richmond'
  ]
};

async function run() {
  try {
    console.log('Adding Richmond, Virginia...');
    const { error } = await supabase.from('us_cities_cost_data').upsert([data]);
    if (error) throw error;
    console.log('✅ Richmond added/updated.');
  } catch (e) {
    console.error('❌ Failed to add Richmond:', e.message);
    process.exit(1);
  }
}

run();


