// Add Durham, North Carolina to budget calculator
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const durhamData = {
  city: 'Durham',
  state: 'North Carolina',
  state_code: 'NC',
  
  // Housing costs (monthly) - Research Triangle area (Duke vicinity)
  dorm_cost_min: 900,
  dorm_cost_max: 1650,
  shared_apt_min: 650,
  shared_apt_max: 1200,
  studio_apt_min: 1200,
  studio_apt_max: 2200,
  
  // Living costs (monthly)
  food_budget: 300,
  food_average: 480,
  food_comfortable: 750,
  transportation: 70,         // GoTriangle transit + Duke transportation
  utilities: 140,
  personal_expenses: 240,
  
  // Tuition costs (annual) - Duke and NC Central
  public_tuition_min: 9500,
  public_tuition_max: 29000,
  private_tuition_min: 32000,
  private_tuition_max: 62000,   // Duke tuition range
  community_tuition_min: 3200,
  community_tuition_max: 13000,
  
  // Additional costs (annual)
  health_insurance: 2600,
  books_supplies: 1200,
  
  // City data
  cost_of_living_index: 121.5,
  population: 285000,
  popular_universities: [
    'Duke University',
    'North Carolina Central University',
    'Durham Technical Community College',
    'University of North Carolina (nearby)'
  ]
};

async function addDurham() {
  try {
    console.log('🔬 Adding Durham, North Carolina (Duke University)...');
    
    const { data, error } = await supabase
      .from('us_cities_cost_data')
      .upsert([durhamData])
      .select();
    
    if (error) throw error;
    
    console.log('✅ Successfully added Durham!');
    console.log(`📊 Housing: $${durhamData.shared_apt_min}-${durhamData.studio_apt_max}/month`);
    console.log(`🎓 Duke Tuition: $${durhamData.private_tuition_min}-${durhamData.private_tuition_max}/year`);
    console.log(`📈 COL Index: ${durhamData.cost_of_living_index} (Research Triangle)`);
    console.log(`🏫 Major University: Duke University (Top private research)`);
    
    const { count } = await supabase
      .from('us_cities_cost_data')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total cities: ${count}`);
    
  } catch (error) {
    console.error('❌ Error adding Durham:', error.message);
    throw error;
  }
}

addDurham()
  .then(() => console.log('🎉 Durham added successfully!'))
  .catch(console.error);

