// Add Columbus, Ohio to budget calculator
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const columbusData = {
  city: 'Columbus',
  state: 'Ohio',
  state_code: 'OH',
  
  // Housing costs (monthly) - Ohio State University area
  dorm_cost_min: 800,
  dorm_cost_max: 1500,
  shared_apt_min: 550,
  shared_apt_max: 1000,
  studio_apt_min: 1000,
  studio_apt_max: 1800,
  
  // Living costs (monthly)
  food_budget: 270,
  food_average: 430,
  food_comfortable: 680,
  transportation: 62,        // COTA bus system
  utilities: 125,
  personal_expenses: 210,
  
  // Tuition costs (annual) - Ohio State University
  public_tuition_min: 11000,
  public_tuition_max: 33000,   // OSU out-of-state
  private_tuition_min: 24000,
  private_tuition_max: 48000,
  community_tuition_min: 3500,
  community_tuition_max: 12000,
  
  // Additional costs (annual)
  health_insurance: 2300,
  books_supplies: 1000,
  
  // City data
  cost_of_living_index: 106.2,
  population: 900000,
  popular_universities: [
    'Ohio State University',
    'Franklin University',
    'Columbus State Community College',
    'Capital University',
    'Ohio Dominican University'
  ]
};

async function addColumbus() {
  try {
    console.log('🌰 Adding Columbus, Ohio (Ohio State University)...');
    
    const { data, error } = await supabase
      .from('us_cities_cost_data')
      .upsert([columbusData])
      .select();
    
    if (error) throw error;
    
    console.log('✅ Successfully added Columbus!');
    console.log(`📊 Housing: $${columbusData.shared_apt_min}-${columbusData.studio_apt_max}/month`);
    console.log(`🎓 OSU Tuition: $${columbusData.public_tuition_min}-${columbusData.public_tuition_max}/year`);
    console.log(`📈 COL Index: ${columbusData.cost_of_living_index} (Very affordable!)`);
    console.log(`🏫 Major University: Ohio State University (65,000+ students)`);
    
    const { count } = await supabase
      .from('us_cities_cost_data')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total cities: ${count}`);
    
  } catch (error) {
    console.error('❌ Error adding Columbus:', error.message);
    throw error;
  }
}

addColumbus()
  .then(() => console.log('🎉 Columbus added successfully!'))
  .catch(console.error);

