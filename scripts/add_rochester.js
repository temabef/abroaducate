// Add Rochester, New York to budget calculator
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const rochesterData = {
  city: 'Rochester',
  state: 'New York',
  state_code: 'NY',
  
  // Housing costs (monthly) - Upstate NY (more affordable than NYC)
  dorm_cost_min: 800,
  dorm_cost_max: 1500,
  shared_apt_min: 550,
  shared_apt_max: 1000,
  studio_apt_min: 1000,
  studio_apt_max: 1800,
  
  // Living costs (monthly)
  food_budget: 280,
  food_average: 450,
  food_comfortable: 700,
  transportation: 65,         // RTS transit system
  utilities: 145,
  personal_expenses: 220,
  
  // Tuition costs (annual) - University of Rochester + RIT
  public_tuition_min: 17000,
  public_tuition_max: 35000,
  private_tuition_min: 30000,
  private_tuition_max: 58000,   // Rochester + RIT range
  community_tuition_min: 4500,
  community_tuition_max: 15000,
  
  // Additional costs (annual)
  health_insurance: 2700,
  books_supplies: 1250,
  
  // City data
  cost_of_living_index: 122.4,
  population: 210000,
  popular_universities: [
    'University of Rochester',
    'Rochester Institute of Technology (RIT)',
    'Monroe Community College',
    'Nazareth College',
    'St. John Fisher College'
  ]
};

async function addRochester() {
  try {
    console.log('🏭 Adding Rochester, New York (University of Rochester + RIT)...');
    
    const { data, error } = await supabase
      .from('us_cities_cost_data')
      .upsert([rochesterData])
      .select();
    
    if (error) throw error;
    
    console.log('✅ Successfully added Rochester!');
    console.log(`📊 Housing: $${rochesterData.shared_apt_min}-${rochesterData.studio_apt_max}/month`);
    console.log(`🎓 Private Tuition: $${rochesterData.private_tuition_min}-${rochesterData.private_tuition_max}/year`);
    console.log(`📈 COL Index: ${rochesterData.cost_of_living_index} (Affordable NY)`);
    console.log(`🏫 Major Universities: University of Rochester + RIT (Strong STEM)`);
    
    const { count } = await supabase
      .from('us_cities_cost_data')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total cities: ${count}`);
    
  } catch (error) {
    console.error('❌ Error adding Rochester:', error.message);
    throw error;
  }
}

addRochester()
  .then(() => console.log('🎉 Rochester added successfully!'))
  .catch(console.error);

