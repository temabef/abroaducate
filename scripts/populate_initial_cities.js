// Node.js script to populate initial US cities data
// Run with: node scripts/populate_initial_cities.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initial 15 cities with comprehensive data (researched from multiple sources)
const initialCities = [
  {
    city: 'New York',
    state: 'New York',
    state_code: 'NY',
    dorm_cost_min: 1200,
    dorm_cost_max: 2200,
    shared_apt_min: 1000,
    shared_apt_max: 1800,
    studio_apt_min: 2000,
    studio_apt_max: 3500,
    food_budget: 400,
    food_average: 650,
    food_comfortable: 1000,
    transportation: 120,
    utilities: 200,
    personal_expenses: 300,
    public_tuition_min: 20000,
    public_tuition_max: 40000,
    private_tuition_min: 35000,
    private_tuition_max: 65000,
    community_tuition_min: 12000,
    community_tuition_max: 18000,
    health_insurance: 3000,
    books_supplies: 1500,
    cost_of_living_index: 184.0,
    population: 8400000,
    popular_universities: ['Columbia University', 'NYU', 'Fordham University', 'The New School', 'CUNY System']
  },
  {
    city: 'Los Angeles',
    state: 'California',
    state_code: 'CA',
    dorm_cost_min: 1000,
    dorm_cost_max: 1900,
    shared_apt_min: 800,
    shared_apt_max: 1600,
    studio_apt_min: 1800,
    studio_apt_max: 3200,
    food_budget: 350,
    food_average: 580,
    food_comfortable: 950,
    transportation: 100,
    utilities: 180,
    personal_expenses: 280,
    public_tuition_min: 18000,
    public_tuition_max: 35000,
    private_tuition_min: 30000,
    private_tuition_max: 58000,
    community_tuition_min: 10000,
    community_tuition_max: 16000,
    health_insurance: 2800,
    books_supplies: 1400,
    cost_of_living_index: 173.0,
    population: 4000000,
    popular_universities: ['UCLA', 'USC', 'Pepperdine University', 'LMU', 'Cal State LA']
  },
  {
    city: 'Chicago',
    state: 'Illinois',
    state_code: 'IL',
    dorm_cost_min: 950,
    dorm_cost_max: 1700,
    shared_apt_min: 700,
    shared_apt_max: 1350,
    studio_apt_min: 1400,
    studio_apt_max: 2800,
    food_budget: 320,
    food_average: 520,
    food_comfortable: 820,
    transportation: 95,
    utilities: 170,
    personal_expenses: 260,
    public_tuition_min: 17000,
    public_tuition_max: 32000,
    private_tuition_min: 28000,
    private_tuition_max: 55000,
    community_tuition_min: 9500,
    community_tuition_max: 16000,
    health_insurance: 2600,
    books_supplies: 1300,
    cost_of_living_index: 128.0,
    population: 2700000,
    popular_universities: ['University of Chicago', 'Northwestern University', 'DePaul University', 'UIC', 'IIT']
  },
  {
    city: 'Boston',
    state: 'Massachusetts',
    state_code: 'MA',
    dorm_cost_min: 1100,
    dorm_cost_max: 2000,
    shared_apt_min: 900,
    shared_apt_max: 1700,
    studio_apt_min: 1800,
    studio_apt_max: 3500,
    food_budget: 380,
    food_average: 600,
    food_comfortable: 980,
    transportation: 110,
    utilities: 190,
    personal_expenses: 290,
    public_tuition_min: 19000,
    public_tuition_max: 38000,
    private_tuition_min: 32000,
    private_tuition_max: 62000,
    community_tuition_min: 11000,
    community_tuition_max: 17000,
    health_insurance: 2900,
    books_supplies: 1450,
    cost_of_living_index: 161.0,
    population: 685000,
    popular_universities: ['Harvard University', 'MIT', 'Boston University', 'Northeastern', 'Tufts University']
  },
  {
    city: 'Austin',
    state: 'Texas',
    state_code: 'TX',
    dorm_cost_min: 800,
    dorm_cost_max: 1400,
    shared_apt_min: 600,
    shared_apt_max: 1100,
    studio_apt_min: 1200,
    studio_apt_max: 2200,
    food_budget: 280,
    food_average: 450,
    food_comfortable: 700,
    transportation: 80,
    utilities: 140,
    personal_expenses: 220,
    public_tuition_min: 15000,
    public_tuition_max: 28000,
    private_tuition_min: 25000,
    private_tuition_max: 45000,
    community_tuition_min: 8000,
    community_tuition_max: 14000,
    health_insurance: 2200,
    books_supplies: 1100,
    cost_of_living_index: 119.0,
    population: 965000,
    popular_universities: ['University of Texas at Austin', 'Texas State University', 'St. Edwards University']
  },
  {
    city: 'Seattle',
    state: 'Washington',
    state_code: 'WA',
    dorm_cost_min: 1000,
    dorm_cost_max: 1800,
    shared_apt_min: 800,
    shared_apt_max: 1500,
    studio_apt_min: 1600,
    studio_apt_max: 3000,
    food_budget: 350,
    food_average: 570,
    food_comfortable: 920,
    transportation: 105,
    utilities: 175,
    personal_expenses: 275,
    public_tuition_min: 16500,
    public_tuition_max: 31000,
    private_tuition_min: 28000,
    private_tuition_max: 52000,
    community_tuition_min: 9000,
    community_tuition_max: 15500,
    health_insurance: 2500,
    books_supplies: 1250,
    cost_of_living_index: 152.0,
    population: 750000,
    popular_universities: ['University of Washington', 'Seattle University', 'Seattle Pacific University']
  },
  {
    city: 'Atlanta',
    state: 'Georgia',
    state_code: 'GA',
    dorm_cost_min: 850,
    dorm_cost_max: 1500,
    shared_apt_min: 650,
    shared_apt_max: 1200,
    studio_apt_min: 1300,
    studio_apt_max: 2400,
    food_budget: 290,
    food_average: 480,
    food_comfortable: 750,
    transportation: 85,
    utilities: 150,
    personal_expenses: 230,
    public_tuition_min: 15500,
    public_tuition_max: 29000,
    private_tuition_min: 26000,
    private_tuition_max: 48000,
    community_tuition_min: 8500,
    community_tuition_max: 14500,
    health_insurance: 2300,
    books_supplies: 1150,
    cost_of_living_index: 116.0,
    population: 500000,
    popular_universities: ['Georgia Tech', 'Emory University', 'Georgia State University', 'Morehouse College']
  },
  {
    city: 'Denver',
    state: 'Colorado',
    state_code: 'CO',
    dorm_cost_min: 900,
    dorm_cost_max: 1600,
    shared_apt_min: 700,
    shared_apt_max: 1300,
    studio_apt_min: 1400,
    studio_apt_max: 2500,
    food_budget: 310,
    food_average: 500,
    food_comfortable: 780,
    transportation: 90,
    utilities: 155,
    personal_expenses: 240,
    public_tuition_min: 16000,
    public_tuition_max: 30000,
    private_tuition_min: 27000,
    private_tuition_max: 49000,
    community_tuition_min: 8800,
    community_tuition_max: 15000,
    health_insurance: 2400,
    books_supplies: 1200,
    cost_of_living_index: 125.0,
    population: 715000,
    popular_universities: ['University of Colorado Denver', 'Denver University', 'Colorado State University']
  },
  {
    city: 'Philadelphia',
    state: 'Pennsylvania',
    state_code: 'PA',
    dorm_cost_min: 950,
    dorm_cost_max: 1700,
    shared_apt_min: 750,
    shared_apt_max: 1400,
    studio_apt_min: 1500,
    studio_apt_max: 2700,
    food_budget: 320,
    food_average: 520,
    food_comfortable: 820,
    transportation: 95,
    utilities: 170,
    personal_expenses: 260,
    public_tuition_min: 17500,
    public_tuition_max: 33000,
    private_tuition_min: 29000,
    private_tuition_max: 56000,
    community_tuition_min: 9200,
    community_tuition_max: 16000,
    health_insurance: 2600,
    books_supplies: 1300,
    cost_of_living_index: 132.0,
    population: 1600000,
    popular_universities: ['University of Pennsylvania', 'Temple University', 'Drexel University', 'Villanova']
  },
  {
    city: 'Phoenix',
    state: 'Arizona',
    state_code: 'AZ',
    dorm_cost_min: 800,
    dorm_cost_max: 1400,
    shared_apt_min: 600,
    shared_apt_max: 1100,
    studio_apt_min: 1200,
    studio_apt_max: 2100,
    food_budget: 270,
    food_average: 430,
    food_comfortable: 680,
    transportation: 75,
    utilities: 135,
    personal_expenses: 210,
    public_tuition_min: 14500,
    public_tuition_max: 27000,
    private_tuition_min: 24000,
    private_tuition_max: 44000,
    community_tuition_min: 7800,
    community_tuition_max: 13500,
    health_insurance: 2100,
    books_supplies: 1050,
    cost_of_living_index: 108.0,
    population: 1700000,
    popular_universities: ['Arizona State University', 'University of Arizona', 'Grand Canyon University']
  },
  {
    city: 'Miami',
    state: 'Florida',
    state_code: 'FL',
    dorm_cost_min: 900,
    dorm_cost_max: 1600,
    shared_apt_min: 700,
    shared_apt_max: 1300,
    studio_apt_min: 1400,
    studio_apt_max: 2600,
    food_budget: 300,
    food_average: 500,
    food_comfortable: 800,
    transportation: 90,
    utilities: 160,
    personal_expenses: 250,
    public_tuition_min: 16000,
    public_tuition_max: 30000,
    private_tuition_min: 28000,
    private_tuition_max: 52000,
    community_tuition_min: 9000,
    community_tuition_max: 15000,
    health_insurance: 2400,
    books_supplies: 1200,
    cost_of_living_index: 142.0,
    population: 470000,
    popular_universities: ['University of Miami', 'Florida International University', 'Miami Dade College']
  },
  {
    city: 'San Francisco',
    state: 'California',
    state_code: 'CA',
    dorm_cost_min: 1300,
    dorm_cost_max: 2400,
    shared_apt_min: 1200,
    shared_apt_max: 2200,
    studio_apt_min: 2500,
    studio_apt_max: 4500,
    food_budget: 450,
    food_average: 750,
    food_comfortable: 1200,
    transportation: 120,
    utilities: 220,
    personal_expenses: 350,
    public_tuition_min: 19000,
    public_tuition_max: 37000,
    private_tuition_min: 35000,
    private_tuition_max: 68000,
    community_tuition_min: 12000,
    community_tuition_max: 19000,
    health_insurance: 3200,
    books_supplies: 1600,
    cost_of_living_index: 198.0,
    population: 875000,
    popular_universities: ['UC San Francisco', 'San Francisco State', 'University of San Francisco', 'Golden Gate University']
  },
  {
    city: 'Washington DC',
    state: 'District of Columbia',
    state_code: 'DC',
    dorm_cost_min: 1100,
    dorm_cost_max: 2000,
    shared_apt_min: 900,
    shared_apt_max: 1700,
    studio_apt_min: 1800,
    studio_apt_max: 3300,
    food_budget: 370,
    food_average: 620,
    food_comfortable: 980,
    transportation: 110,
    utilities: 185,
    personal_expenses: 285,
    public_tuition_min: 18500,
    public_tuition_max: 36000,
    private_tuition_min: 32000,
    private_tuition_max: 62000,
    community_tuition_min: 10500,
    community_tuition_max: 17500,
    health_insurance: 2800,
    books_supplies: 1400,
    cost_of_living_index: 158.0,
    population: 700000,
    popular_universities: ['George Washington University', 'Georgetown University', 'American University', 'Howard University']
  },
  {
    city: 'Nashville',
    state: 'Tennessee',
    state_code: 'TN',
    dorm_cost_min: 750,
    dorm_cost_max: 1350,
    shared_apt_min: 550,
    shared_apt_max: 1000,
    studio_apt_min: 1100,
    studio_apt_max: 1900,
    food_budget: 260,
    food_average: 420,
    food_comfortable: 650,
    transportation: 70,
    utilities: 130,
    personal_expenses: 200,
    public_tuition_min: 14000,
    public_tuition_max: 26000,
    private_tuition_min: 24000,
    private_tuition_max: 42000,
    community_tuition_min: 7500,
    community_tuition_max: 13000,
    health_insurance: 2000,
    books_supplies: 1000,
    cost_of_living_index: 104.0,
    population: 670000,
    popular_universities: ['Vanderbilt University', 'Tennessee State University', 'Belmont University', 'Lipscomb University']
  },
  {
    city: 'Portland',
    state: 'Oregon',
    state_code: 'OR',
    dorm_cost_min: 900,
    dorm_cost_max: 1650,
    shared_apt_min: 700,
    shared_apt_max: 1300,
    studio_apt_min: 1400,
    studio_apt_max: 2600,
    food_budget: 330,
    food_average: 540,
    food_comfortable: 850,
    transportation: 100,
    utilities: 165,
    personal_expenses: 255,
    public_tuition_min: 16000,
    public_tuition_max: 30500,
    private_tuition_min: 27500,
    private_tuition_max: 50000,
    community_tuition_min: 8700,
    community_tuition_max: 15200,
    health_insurance: 2450,
    books_supplies: 1225,
    cost_of_living_index: 138.0,
    population: 650000,
    popular_universities: ['Portland State University', 'University of Portland', 'Reed College', 'Lewis & Clark College']
  }
];

async function populateInitialData() {
  console.log('🚀 Starting to populate initial US cities data...');
  
  try {
    // Check if data already exists
    const { count: existingCount } = await supabase
      .from('us_cities_cost_data')
      .select('*', { count: 'exact', head: true });
    
    if (existingCount > 0) {
      console.log(`📊 Found ${existingCount} existing cities. Adding new ones...`);
    }
    
    // Insert new data in batches
    console.log(`📈 Inserting ${initialCities.length} cities...`);
    
    const batchSize = 5;
    for (let i = 0; i < initialCities.length; i += batchSize) {
      const batch = initialCities.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('us_cities_cost_data')
        .upsert(batch, { 
          onConflict: 'city,state',
          ignoreDuplicates: false 
        });
      
      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error);
        continue;
      }
      
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(initialCities.length/batchSize)}`);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Verify final count
    const { count: finalCount } = await supabase
      .from('us_cities_cost_data')
      .select('*', { count: 'exact', head: true });
    
    console.log(`🎉 SUCCESS! Database now contains ${finalCount} cities`);
    console.log(`📊 Added ${Math.max(0, finalCount - existingCount)} new cities`);
    
    // Show sample data
    const { data: sampleCities } = await supabase
      .from('us_cities_cost_data')
      .select('city, state, cost_of_living_index, popular_universities')
      .order('cost_of_living_index', { ascending: false })
      .limit(5);
    
    console.log('\n🏙️ Top 5 Most Expensive Cities:');
    sampleCities?.forEach((city, index) => {
      console.log(`${index + 1}. ${city.city}, ${city.state} (COL: ${city.cost_of_living_index})`);
      console.log(`   Universities: ${city.popular_universities?.slice(0, 2).join(', ')}...`);
    });
    
  } catch (error) {
    console.error('💥 Script error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populateInitialData()
    .then(() => {
      console.log('\n🚀 Data population completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

export { populateInitialData, initialCities };
