// Add Madison, Wisconsin to budget calculator
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const madisonData = {
  city: 'Madison',
  state: 'Wisconsin',
  state_code: 'WI',
  
  // Housing costs (monthly) - University of Wisconsin area
  dorm_cost_min: 750,
  dorm_cost_max: 1450,
  shared_apt_min: 550,
  shared_apt_max: 1000,
  studio_apt_min: 1000,
  studio_apt_max: 1700,
  
  // Living costs (monthly)
  food_budget: 280,
  food_average: 450,
  food_comfortable: 700,
  transportation: 55,        // Madison Metro + university transportation
  utilities: 120,
  personal_expenses: 200,
  
  // Tuition costs (annual) - University of Wisconsin-Madison
  public_tuition_min: 10500,
  public_tuition_max: 38000,   // UW-Madison out-of-state
  private_tuition_min: 28000,
  private_tuition_max: 52000,
  community_tuition_min: 4000,
  community_tuition_max: 13000,
  
  // Additional costs (annual)
  health_insurance: 2400,
  books_supplies: 1100,
  
  // City data
  cost_of_living_index: 112.3,
  population: 260000,
  popular_universities: [
    'University of Wisconsin-Madison',
    'Edgewood College',
    'Madison Area Technical College'
  ]
};

async function addMadison() {
  try {
    console.log('🧀 Adding Madison, Wisconsin (UW-Madison)...');
    
    const { data, error } = await supabase
      .from('us_cities_cost_data')
      .upsert([madisonData])
      .select();
    
    if (error) throw error;
    
    console.log('✅ Successfully added Madison!');
    console.log(`📊 Housing: $${madisonData.shared_apt_min}-${madisonData.studio_apt_max}/month`);
    console.log(`🎓 UW-Madison Tuition: $${madisonData.public_tuition_min}-${madisonData.public_tuition_max}/year`);
    console.log(`📈 COL Index: ${madisonData.cost_of_living_index} (Affordable!)`);
    console.log(`🏫 Major University: University of Wisconsin-Madison (Top public research university)`);
    
    const { count } = await supabase
      .from('us_cities_cost_data')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total cities: ${count}`);
    
  } catch (error) {
    console.error('❌ Error adding Madison:', error.message);
    throw error;
  }
}

addMadison()
  .then(() => console.log('🎉 Madison added successfully!'))
  .catch(console.error);

