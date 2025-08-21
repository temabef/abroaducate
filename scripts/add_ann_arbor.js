// Add Ann Arbor, Michigan to budget calculator
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const annArborData = {
  city: 'Ann Arbor',
  state: 'Michigan',
  state_code: 'MI',
  
  // Housing costs (monthly) - University of Michigan area
  dorm_cost_min: 850,
  dorm_cost_max: 1600,
  shared_apt_min: 650,
  shared_apt_max: 1200,
  studio_apt_min: 1200,
  studio_apt_max: 2100,
  
  // Living costs (monthly)
  food_budget: 300,
  food_average: 480,
  food_comfortable: 750,
  transportation: 65,        // AATA bus system + University transportation
  utilities: 140,
  personal_expenses: 230,
  
  // Tuition costs (annual) - University of Michigan (prestigious)
  public_tuition_min: 15500,
  public_tuition_max: 52000,   // UMich out-of-state/international
  private_tuition_min: 30000,
  private_tuition_max: 58000,
  community_tuition_min: 4000,
  community_tuition_max: 14000,
  
  // Additional costs (annual)
  health_insurance: 2600,
  books_supplies: 1200,
  
  // City data
  cost_of_living_index: 124.8,
  population: 120000,
  popular_universities: [
    'University of Michigan',
    'Eastern Michigan University',
    'Washtenaw Community College',
    'Concordia University Ann Arbor'
  ]
};

async function addAnnArbor() {
  try {
    console.log('🏫 Adding Ann Arbor, Michigan (University of Michigan)...');
    
    const { data, error } = await supabase
      .from('us_cities_cost_data')
      .upsert([annArborData])
      .select();
    
    if (error) throw error;
    
    console.log('✅ Successfully added Ann Arbor!');
    console.log(`📊 Housing: $${annArborData.shared_apt_min}-${annArborData.studio_apt_max}/month`);
    console.log(`🎓 UMich Tuition: $${annArborData.public_tuition_min}-${annArborData.public_tuition_max}/year`);
    console.log(`📈 COL Index: ${annArborData.cost_of_living_index}`);
    console.log(`🏫 Major University: University of Michigan (Top 25 globally)`);
    
    const { count } = await supabase
      .from('us_cities_cost_data')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total cities: ${count}`);
    
  } catch (error) {
    console.error('❌ Error adding Ann Arbor:', error.message);
    throw error;
  }
}

addAnnArbor()
  .then(() => console.log('🎉 Ann Arbor added successfully!'))
  .catch(console.error);

