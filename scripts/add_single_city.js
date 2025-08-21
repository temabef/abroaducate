// Simple script to add one city at a time with error handling
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// San Diego data (first priority city)
const sanDiegoData = {
  city: 'San Diego',
  state: 'California',
  state_code: 'CA',
  
  // Housing costs (monthly)
  dorm_cost_min: 1100,
  dorm_cost_max: 1900,
  shared_apt_min: 900,
  shared_apt_max: 1500,
  studio_apt_min: 1800,
  studio_apt_max: 2800,
  
  // Living costs (monthly)
  food_budget: 350,
  food_average: 550,
  food_comfortable: 850,
  transportation: 72,
  utilities: 150,
  personal_expenses: 250,
  
  // Tuition costs (annual)
  public_tuition_min: 14500,
  public_tuition_max: 47000,
  private_tuition_min: 35000,
  private_tuition_max: 65000,
  community_tuition_min: 1500,
  community_tuition_max: 8000,
  
  // Additional costs (annual)
  health_insurance: 3500,
  books_supplies: 1200,
  
  // City data
  cost_of_living_index: 173.2,
  population: 1420000,
  popular_universities: [
    'UC San Diego (UCSD)',
    'San Diego State University',
    'University of San Diego',
    'Point Loma Nazarene University',
    'San Diego Community College'
  ]
};

async function addSanDiego() {
  try {
    console.log('🏖️ Adding San Diego, California...');
    
    // Check if it already exists
    const { data: existing } = await supabase
      .from('us_cities_cost_data')
      .select('city, state')
      .eq('city', 'San Diego')
      .eq('state', 'California')
      .single();
    
    if (existing) {
      console.log('ℹ️  San Diego already exists, updating...');
    } else {
      console.log('➕ Adding new city: San Diego');
    }
    
    const { data, error } = await supabase
      .from('us_cities_cost_data')
      .upsert([sanDiegoData])
      .select();
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Successfully added San Diego!');
    console.log(`📊 Housing: $${sanDiegoData.shared_apt_min}-${sanDiegoData.studio_apt_max}/month`);
    console.log(`🎓 Tuition: $${sanDiegoData.public_tuition_min}-${sanDiegoData.public_tuition_max}/year`);
    console.log(`📈 COL Index: ${sanDiegoData.cost_of_living_index}`);
    
    // Verify addition
    const { count } = await supabase
      .from('us_cities_cost_data')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total cities in database: ${count}`);
    
    return data;
    
  } catch (error) {
    console.error('❌ Error adding San Diego:', error.message);
    throw error;
  }
}

addSanDiego()
  .then(() => {
    console.log('\n🎉 San Diego addition completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed to add San Diego:', error.message);
    process.exit(1);
  });

