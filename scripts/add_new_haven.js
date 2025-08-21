// Add New Haven, Connecticut to budget calculator
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const newHavenData = {
  city: 'New Haven',
  state: 'Connecticut',
  state_code: 'CT',
  
  // Housing costs (monthly) - Yale area (premium location)
  dorm_cost_min: 1000,
  dorm_cost_max: 1850,
  shared_apt_min: 800,
  shared_apt_max: 1500,
  studio_apt_min: 1500,
  studio_apt_max: 2700,
  
  // Living costs (monthly)
  food_budget: 350,
  food_average: 580,
  food_comfortable: 920,
  transportation: 90,         // CT Transit + Yale shuttle
  utilities: 175,
  personal_expenses: 280,
  
  // Tuition costs (annual) - Yale and other institutions
  public_tuition_min: 16000,
  public_tuition_max: 32000,
  private_tuition_min: 35000,
  private_tuition_max: 65000,   // Yale tuition range
  community_tuition_min: 4000,
  community_tuition_max: 14000,
  
  // Additional costs (annual)
  health_insurance: 2800,
  books_supplies: 1350,
  
  // City data
  cost_of_living_index: 155.8,
  population: 135000,
  popular_universities: [
    'Yale University',
    'Southern Connecticut State University',
    'University of New Haven',
    'Albertus Magnus College',
    'Gateway Community College'
  ]
};

async function addNewHaven() {
  try {
    console.log('🏛️ Adding New Haven, Connecticut (Yale University)...');
    
    const { data, error } = await supabase
      .from('us_cities_cost_data')
      .upsert([newHavenData])
      .select();
    
    if (error) throw error;
    
    console.log('✅ Successfully added New Haven!');
    console.log(`📊 Housing: $${newHavenData.shared_apt_min}-${newHavenData.studio_apt_max}/month`);
    console.log(`🎓 Yale Tuition: $${newHavenData.private_tuition_min}-${newHavenData.private_tuition_max}/year`);
    console.log(`📈 COL Index: ${newHavenData.cost_of_living_index} (Premium location)`);
    console.log(`🏫 Major University: Yale University (Ivy League)`);
    
    const { count } = await supabase
      .from('us_cities_cost_data')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total cities: ${count}`);
    
  } catch (error) {
    console.error('❌ Error adding New Haven:', error.message);
    throw error;
  }
}

addNewHaven()
  .then(() => console.log('🎉 New Haven added successfully!'))
  .catch(console.error);

