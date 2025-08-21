// Add Berkeley, California to budget calculator
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const berkeleyData = {
  city: 'Berkeley',
  state: 'California',
  state_code: 'CA',
  
  // Housing costs (monthly) - Bay Area premium pricing
  dorm_cost_min: 1200,
  dorm_cost_max: 2100,
  shared_apt_min: 1000,
  shared_apt_max: 1800,
  studio_apt_min: 2000,
  studio_apt_max: 3500,
  
  // Living costs (monthly)
  food_budget: 400,
  food_average: 650,
  food_comfortable: 1000,
  transportation: 100,        // AC Transit + BART access
  utilities: 180,
  personal_expenses: 300,
  
  // Tuition costs (annual) - UC Berkeley system
  public_tuition_min: 14500,
  public_tuition_max: 47000,   // UC Berkeley out-of-state/international
  private_tuition_min: 35000,
  private_tuition_max: 65000,
  community_tuition_min: 1500,
  community_tuition_max: 8500,
  
  // Additional costs (annual)
  health_insurance: 3200,
  books_supplies: 1400,
  
  // City data
  cost_of_living_index: 181.3,
  population: 125000,
  popular_universities: [
    'UC Berkeley',
    'Berkeley City College',
    'Graduate Theological Union',
    'Wright Institute'
  ]
};

async function addBerkeley() {
  try {
    console.log('🌉 Adding Berkeley, California (UC Berkeley)...');
    
    const { data, error } = await supabase
      .from('us_cities_cost_data')
      .upsert([berkeleyData])
      .select();
    
    if (error) throw error;
    
    console.log('✅ Successfully added Berkeley!');
    console.log(`📊 Housing: $${berkeleyData.shared_apt_min}-${berkeleyData.studio_apt_max}/month`);
    console.log(`🎓 UC Berkeley Tuition: $${berkeleyData.public_tuition_min}-${berkeleyData.public_tuition_max}/year`);
    console.log(`📈 COL Index: ${berkeleyData.cost_of_living_index} (Bay Area premium)`);
    console.log(`🏫 Major University: UC Berkeley (Top public research university)`);
    
    const { count } = await supabase
      .from('us_cities_cost_data')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total cities: ${count}`);
    
  } catch (error) {
    console.error('❌ Error adding Berkeley:', error.message);
    throw error;
  }
}

addBerkeley()
  .then(() => console.log('🎉 Berkeley added successfully!'))
  .catch(console.error);

