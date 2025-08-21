// Add Minneapolis, Minnesota to budget calculator
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const minneapolisData = {
  city: 'Minneapolis',
  state: 'Minnesota',
  state_code: 'MN',
  
  // Housing costs (monthly) - Twin Cities metro area
  dorm_cost_min: 800,
  dorm_cost_max: 1550,
  shared_apt_min: 600,
  shared_apt_max: 1150,
  studio_apt_min: 1100,
  studio_apt_max: 2000,
  
  // Living costs (monthly)
  food_budget: 290,
  food_average: 470,
  food_comfortable: 750,
  transportation: 75,        // Metro Transit system
  utilities: 135,
  personal_expenses: 225,
  
  // Tuition costs (annual) - University of Minnesota system
  public_tuition_min: 14000,
  public_tuition_max: 35000,   // UMN out-of-state/international
  private_tuition_min: 28000,
  private_tuition_max: 55000,
  community_tuition_min: 4500,
  community_tuition_max: 15000,
  
  // Additional costs (annual)
  health_insurance: 2500,
  books_supplies: 1150,
  
  // City data
  cost_of_living_index: 114.2,
  population: 430000,
  popular_universities: [
    'University of Minnesota',
    'Augsburg University',
    'Minneapolis Community and Technical College',
    'Capella University',
    'Walden University'
  ]
};

async function addMinneapolis() {
  try {
    console.log('🌟 Adding Minneapolis, Minnesota (University of Minnesota)...');
    
    const { data, error } = await supabase
      .from('us_cities_cost_data')
      .upsert([minneapolisData])
      .select();
    
    if (error) throw error;
    
    console.log('✅ Successfully added Minneapolis!');
    console.log(`📊 Housing: $${minneapolisData.shared_apt_min}-${minneapolisData.studio_apt_max}/month`);
    console.log(`🎓 UMN Tuition: $${minneapolisData.public_tuition_min}-${minneapolisData.public_tuition_max}/year`);
    console.log(`📈 COL Index: ${minneapolisData.cost_of_living_index} (Very affordable!)`);
    console.log(`🏫 Major University: University of Minnesota (45,000+ students)`);
    
    const { count } = await supabase
      .from('us_cities_cost_data')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total cities: ${count}`);
    
  } catch (error) {
    console.error('❌ Error adding Minneapolis:', error.message);
    throw error;
  }
}

addMinneapolis()
  .then(() => console.log('🎉 Minneapolis added successfully!'))
  .catch(console.error);

