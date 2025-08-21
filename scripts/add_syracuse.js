// Add Syracuse, New York to budget calculator
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const syracuseData = {
  city: 'Syracuse',
  state: 'New York',
  state_code: 'NY',
  
  // Housing costs (monthly) - Central NY (affordable)
  dorm_cost_min: 750,
  dorm_cost_max: 1450,
  shared_apt_min: 500,
  shared_apt_max: 950,
  studio_apt_min: 900,
  studio_apt_max: 1650,
  
  // Living costs (monthly)
  food_budget: 270,
  food_average: 430,
  food_comfortable: 680,
  transportation: 60,         // Centro bus system
  utilities: 140,
  personal_expenses: 210,
  
  // Tuition costs (annual) - Syracuse University + SUNY ESF
  public_tuition_min: 16500,
  public_tuition_max: 34000,
  private_tuition_min: 28000,
  private_tuition_max: 56000,   // Syracuse University range
  community_tuition_min: 4200,
  community_tuition_max: 14500,
  
  // Additional costs (annual)
  health_insurance: 2600,
  books_supplies: 1200,
  
  // City data
  cost_of_living_index: 115.8,
  population: 145000,
  popular_universities: [
    'Syracuse University',
    'SUNY College of Environmental Science and Forestry',
    'Le Moyne College',
    'Onondaga Community College'
  ]
};

async function addSyracuse() {
  try {
    console.log('🍊 Adding Syracuse, New York (Syracuse University)...');
    
    const { data, error } = await supabase
      .from('us_cities_cost_data')
      .upsert([syracuseData])
      .select();
    
    if (error) throw error;
    
    console.log('✅ Successfully added Syracuse!');
    console.log(`📊 Housing: $${syracuseData.shared_apt_min}-${syracuseData.studio_apt_max}/month`);
    console.log(`🎓 Syracuse Tuition: $${syracuseData.private_tuition_min}-${syracuseData.private_tuition_max}/year`);
    console.log(`📈 COL Index: ${syracuseData.cost_of_living_index} (Very affordable NY)`);
    console.log(`🏫 Major University: Syracuse University (Strong communications/journalism)`);
    
    const { count } = await supabase
      .from('us_cities_cost_data')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total cities: ${count}`);
    
  } catch (error) {
    console.error('❌ Error adding Syracuse:', error.message);
    throw error;
  }
}

addSyracuse()
  .then(() => console.log('🎉 Syracuse added successfully!'))
  .catch(console.error);

