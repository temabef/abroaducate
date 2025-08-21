// Add Raleigh, North Carolina to budget calculator
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const raleighData = {
  city: 'Raleigh',
  state: 'North Carolina',
  state_code: 'NC',
  
  // Housing costs (monthly) - Research Triangle area
  dorm_cost_min: 750,
  dorm_cost_max: 1400,
  shared_apt_min: 600,
  shared_apt_max: 1100,
  studio_apt_min: 1100,
  studio_apt_max: 1900,
  
  // Living costs (monthly)
  food_budget: 280,
  food_average: 450,
  food_comfortable: 700,
  transportation: 60,        // GoRaleigh bus system
  utilities: 130,
  personal_expenses: 220,
  
  // Tuition costs (annual) - NC State, UNC system
  public_tuition_min: 9000,
  public_tuition_max: 28000,
  private_tuition_min: 25000,
  private_tuition_max: 52000,
  community_tuition_min: 3000,
  community_tuition_max: 12000,
  
  // Additional costs (annual)
  health_insurance: 2400,
  books_supplies: 1100,
  
  // City data
  cost_of_living_index: 118.5,
  population: 470000,
  popular_universities: [
    'NC State University',
    'UNC Raleigh',
    'Shaw University',
    'Meredith College',
    'Wake Technical Community College'
  ]
};

async function addRaleigh() {
  try {
    console.log('🌳 Adding Raleigh, North Carolina...');
    
    const { data, error } = await supabase
      .from('us_cities_cost_data')
      .upsert([raleighData])
      .select();
    
    if (error) throw error;
    
    console.log('✅ Successfully added Raleigh!');
    console.log(`📊 Housing: $${raleighData.shared_apt_min}-${raleighData.studio_apt_max}/month`);
    console.log(`🎓 Public Tuition: $${raleighData.public_tuition_min}-${raleighData.public_tuition_max}/year`);
    console.log(`📈 COL Index: ${raleighData.cost_of_living_index} (Very affordable!)`);
    
    const { count } = await supabase
      .from('us_cities_cost_data')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total cities: ${count}`);
    
  } catch (error) {
    console.error('❌ Error adding Raleigh:', error.message);
    throw error;
  }
}

addRaleigh()
  .then(() => console.log('🎉 Raleigh added successfully!'))
  .catch(console.error);

