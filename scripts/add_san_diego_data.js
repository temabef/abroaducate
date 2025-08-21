// Script to add San Diego, California data to budget calculator
// Based on research from UCSD, SDSU, and cost of living sources

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// San Diego data (researched from multiple sources - December 2024)
const sanDiegoData = {
  city: 'San Diego',
  state: 'California',
  state_code: 'CA',
  
  // Housing costs (monthly) - Based on UCSD housing, local apartments
  dorm_cost_min: 1100,      // UCSD residence halls (shared room)
  dorm_cost_max: 1900,      // UCSD apartments (single room)
  shared_apt_min: 900,      // Shared apartment off-campus
  shared_apt_max: 1500,     // Nice shared apartment near campus
  studio_apt_min: 1800,     // Basic studio apartment
  studio_apt_max: 2800,     // Luxury studio near beach/downtown
  
  // Living costs (monthly) - Based on student budget guides
  food_budget: 350,         // Cooking at home, basic groceries
  food_average: 550,        // Mix of cooking and eating out
  food_comfortable: 850,    // Frequent dining out, premium groceries
  transportation: 72,       // UC San Diego student transit pass
  utilities: 150,           // Electricity, gas, internet (shared)
  personal_expenses: 250,   // Entertainment, personal items, etc.
  
  // Tuition costs (annual) - 2024-2025 academic year
  public_tuition_min: 14500,    // UC San Diego (CA resident baseline)
  public_tuition_max: 47000,    // UC San Diego (international students)
  private_tuition_min: 35000,   // Private colleges (lower range)
  private_tuition_max: 65000,   // Premium private institutions
  community_tuition_min: 1500,  // San Diego Community College (resident)
  community_tuition_max: 8000,  // Community college (international)
  
  // Additional costs (annual)
  health_insurance: 3500,    // UCSD student health insurance plan
  books_supplies: 1200,      // Books, supplies, technology
  
  // City data
  cost_of_living_index: 173.2,  // Numbeo index (US average = 100)
  population: 1420000,           // San Diego metro area
  popular_universities: [
    'UC San Diego (UCSD)',
    'San Diego State University',
    'University of San Diego',
    'Point Loma Nazarene University',
    'San Diego Community College'
  ],
  
  // Research metadata
  data_sources: [
    'UCSD Housing & Dining Services',
    'San Diego State University',
    'Apartments.com San Diego',
    'Numbeo Cost of Living',
    'UC System tuition schedule'
  ],
  last_updated: new Date().toISOString(),
  research_confidence: 'high',
  notes: 'Data collected from official university sources and verified with local housing websites. Costs reflect 2024-2025 academic year.'
};

console.log('🏖️ Adding San Diego, California to Budget Calculator');
console.log('==============================================\n');

async function addSanDiegoData() {
  try {
    console.log('📊 San Diego Cost Summary:');
    console.log(`   🏠 Housing Range: $${sanDiegoData.shared_apt_min} - $${sanDiegoData.studio_apt_max}/month`);
    console.log(`   🍕 Food Range: $${sanDiegoData.food_budget} - $${sanDiegoData.food_comfortable}/month`);
    console.log(`   🎓 Public Tuition: $${sanDiegoData.public_tuition_min} - $${sanDiegoData.public_tuition_max}/year`);
    console.log(`   📈 Cost of Living Index: ${sanDiegoData.cost_of_living_index}`);
    console.log(`   🏫 Universities: ${sanDiegoData.popular_universities.join(', ')}`);
    
    console.log('\n💾 Adding to database...');
    
    const { data, error } = await supabase
      .from('us_cities_cost_data')
      .upsert([sanDiegoData], {
        onConflict: 'city,state',
        ignoreDuplicates: false
      });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Successfully added San Diego data!');
    
    // Verify the addition
    const { count: totalCities } = await supabase
      .from('us_cities_cost_data')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Database now contains ${totalCities} cities`);
    
    console.log('\n🎯 Next steps:');
    console.log('1. Test calculator with San Diego data');
    console.log('2. Add Raleigh, North Carolina next');
    console.log('3. Continue with high-priority cities');
    
    return data;
    
  } catch (error) {
    console.error('❌ Error adding San Diego data:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addSanDiegoData()
    .then(() => {
      console.log('\n🚀 San Diego data addition completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to add San Diego data:', error);
      process.exit(1);
    });
}

export { addSanDiegoData, sanDiegoData };

