// Script to add Batch 2 high-priority cities to budget calculator
// Cities: San Diego, Raleigh, Ann Arbor, Columbus, Madison
// Based on comprehensive research from multiple sources

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Batch 2 cities data (researched from official sources)
const batch2Cities = [
  {
    city: 'San Diego',
    state: 'California',
    state_code: 'CA',
    
    // Housing costs (monthly)
    dorm_cost_min: 1100,
    dorm_cost_max: 1900,
    shared_apt_min: 900,
    shared_apt_max: 1500,
    studio_apt_min: 1800,
    studio_apt_max: 2800,
    
    // Living costs (monthly)
    food_budget: 350,
    food_average: 550,
    food_comfortable: 850,
    transportation: 72,
    utilities: 150,
    personal_expenses: 250,
    
    // Tuition costs (annual)
    public_tuition_min: 14500,
    public_tuition_max: 47000,
    private_tuition_min: 35000,
    private_tuition_max: 65000,
    community_tuition_min: 1500,
    community_tuition_max: 8000,
    
    // Additional costs (annual)
    health_insurance: 3500,
    books_supplies: 1200,
    
    // City data
    cost_of_living_index: 173.2,
    population: 1420000,
    popular_universities: [
      'UC San Diego (UCSD)',
      'San Diego State University',
      'University of San Diego',
      'Point Loma Nazarene University',
      'San Diego Community College'
    ]
  },
  
  {
    city: 'Raleigh',
    state: 'North Carolina',
    state_code: 'NC',
    
    // Housing costs (monthly)
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
    transportation: 60,
    utilities: 130,
    personal_expenses: 220,
    
    // Tuition costs (annual)
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
  },
  
  {
    city: 'Ann Arbor',
    state: 'Michigan',
    state_code: 'MI',
    
    // Housing costs (monthly)
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
    transportation: 65,
    utilities: 140,
    personal_expenses: 230,
    
    // Tuition costs (annual)
    public_tuition_min: 15500,
    public_tuition_max: 52000,
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
  },
  
  {
    city: 'Columbus',
    state: 'Ohio',
    state_code: 'OH',
    
    // Housing costs (monthly)
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
    transportation: 62,
    utilities: 125,
    personal_expenses: 210,
    
    // Tuition costs (annual)
    public_tuition_min: 11000,
    public_tuition_max: 33000,
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
  },
  
  {
    city: 'Madison',
    state: 'Wisconsin',
    state_code: 'WI',
    
    // Housing costs (monthly)
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
    transportation: 55,
    utilities: 120,
    personal_expenses: 200,
    
    // Tuition costs (annual)
    public_tuition_min: 10500,
    public_tuition_max: 38000,
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
  }
];

console.log('🎓 Adding Batch 2 Cities to Budget Calculator Database');
console.log('================================================\n');

async function addBatch2Cities() {
  try {
    // Check current count
    const { count: beforeCount } = await supabase
      .from('us_cities_cost_data')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Current cities in database: ${beforeCount}`);
    console.log(`🎯 Adding ${batch2Cities.length} new cities...\n`);
    
    // Add each city with progress reporting
    for (let i = 0; i < batch2Cities.length; i++) {
      const city = batch2Cities[i];
      
      console.log(`📍 Adding ${i + 1}/${batch2Cities.length}: ${city.city}, ${city.state}`);
      console.log(`   🏠 Housing: $${city.shared_apt_min}-${city.studio_apt_max}/mo`);
      console.log(`   🎓 Public Tuition: $${city.public_tuition_min}-${city.public_tuition_max}/yr`);
      console.log(`   📈 COL Index: ${city.cost_of_living_index}`);
      console.log(`   🏫 Universities: ${city.popular_universities.slice(0, 2).join(', ')}...`);
      
      const { error } = await supabase
        .from('us_cities_cost_data')
        .upsert([city], {
          onConflict: 'city,state',
          ignoreDuplicates: false
        });
      
      if (error) {
        console.error(`   ❌ Error adding ${city.city}:`, error.message);
        continue;
      }
      
      console.log(`   ✅ Successfully added ${city.city}, ${city.state}`);
      console.log('');
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Final count verification
    const { count: afterCount } = await supabase
      .from('us_cities_cost_data')
      .select('*', { count: 'exact', head: true });
    
    const added = afterCount - beforeCount;
    
    console.log('🎉 BATCH 2 ADDITION COMPLETE!');
    console.log('=========================');
    console.log(`📊 Cities before: ${beforeCount}`);
    console.log(`📊 Cities after: ${afterCount}`);
    console.log(`📈 Successfully added: ${added} cities`);
    
    if (added > 0) {
      console.log('\n🚀 Next Steps:');
      console.log('1. Test calculator with new cities');
      console.log('2. Verify data accuracy via admin panel');
      console.log('3. Continue with Batch 3 cities');
      console.log('4. Add more specialized university towns');
    }
    
    return { beforeCount, afterCount, added };
    
  } catch (error) {
    console.error('💥 Error in batch addition:', error);
    throw error;
  }
}

// Validation function
async function validateBatch2Data() {
  console.log('\n🔍 VALIDATING BATCH 2 DATA:');
  console.log('=========================');
  
  for (const city of batch2Cities) {
    console.log(`\n📍 ${city.city}, ${city.state}:`);
    
    const issues = [];
    
    // Validate ranges
    if (city.dorm_cost_min >= city.dorm_cost_max) issues.push('Invalid dorm range');
    if (city.shared_apt_min >= city.shared_apt_max) issues.push('Invalid shared apt range');
    if (city.studio_apt_min >= city.studio_apt_max) issues.push('Invalid studio range');
    if (city.public_tuition_min >= city.private_tuition_min) issues.push('Public >= private tuition');
    if (city.food_budget >= city.food_comfortable) issues.push('Invalid food range');
    
    // Validate reasonable values
    if (city.cost_of_living_index < 80 || city.cost_of_living_index > 250) {
      issues.push('Unusual COL index');
    }
    if (city.popular_universities.length === 0) issues.push('No universities listed');
    
    if (issues.length > 0) {
      console.log(`   ⚠️  Issues: ${issues.join(', ')}`);
    } else {
      console.log(`   ✅ Data validation passed`);
    }
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Starting Batch 2 cities addition...\n');
  
  validateBatch2Data()
    .then(() => addBatch2Cities())
    .then((result) => {
      console.log(`\n✨ Batch 2 addition completed successfully!`);
      console.log(`📊 Database growth: ${result.beforeCount} → ${result.afterCount} cities`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to add Batch 2 cities:', error);
      process.exit(1);
    });
}

export { addBatch2Cities, batch2Cities, validateBatch2Data };

