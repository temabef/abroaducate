// Script to populate US cities cost data for budget calculator
// Run this after setting up the database

import { createClient } from '@supabase/supabase-js';

// You'll need to add your Supabase credentials
const SUPABASE_URL = 'your_supabase_url';
const SUPABASE_SERVICE_KEY = 'your_service_key';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Comprehensive US cities data for international students
const citiesData = [
  // NEW YORK
  {
    city: 'New York',
    state: 'New York', 
    state_code: 'NY',
    dorm_cost_min: 1200, dorm_cost_max: 2200,
    shared_apt_min: 1000, shared_apt_max: 1800,
    studio_apt_min: 2000, studio_apt_max: 3500,
    food_budget: 400, food_average: 650, food_comfortable: 1000,
    transportation: 120, utilities: 200, personal_expenses: 300,
    public_tuition_min: 20000, public_tuition_max: 40000,
    private_tuition_min: 35000, private_tuition_max: 65000,
    community_tuition_min: 12000, community_tuition_max: 18000,
    health_insurance: 3000, books_supplies: 1500,
    cost_of_living_index: 184.0,
    population: 8400000,
    popular_universities: ['Columbia University', 'NYU', 'Fordham University', 'The New School', 'CUNY System']
  },
  
  // LOS ANGELES
  {
    city: 'Los Angeles',
    state: 'California',
    state_code: 'CA', 
    dorm_cost_min: 1000, dorm_cost_max: 1900,
    shared_apt_min: 800, shared_apt_max: 1600,
    studio_apt_min: 1800, studio_apt_max: 3200,
    food_budget: 350, food_average: 580, food_comfortable: 950,
    transportation: 100, utilities: 180, personal_expenses: 280,
    public_tuition_min: 18000, public_tuition_max: 35000,
    private_tuition_min: 30000, private_tuition_max: 58000,
    community_tuition_min: 10000, community_tuition_max: 16000,
    health_insurance: 2800, books_supplies: 1400,
    cost_of_living_index: 173.0,
    population: 4000000,
    popular_universities: ['UCLA', 'USC', 'Pepperdine University', 'LMU', 'Cal State LA']
  },
  
  // CHICAGO
  {
    city: 'Chicago',
    state: 'Illinois',
    state_code: 'IL',
    dorm_cost_min: 950, dorm_cost_max: 1700,
    shared_apt_min: 700, shared_apt_max: 1350,
    studio_apt_min: 1400, studio_apt_max: 2800,
    food_budget: 320, food_average: 520, food_comfortable: 820,
    transportation: 95, utilities: 170, personal_expenses: 260,
    public_tuition_min: 17000, public_tuition_max: 32000,
    private_tuition_min: 28000, private_tuition_max: 55000,
    community_tuition_min: 9500, community_tuition_max: 16000,
    health_insurance: 2600, books_supplies: 1300,
    cost_of_living_index: 128.0,
    population: 2700000,
    popular_universities: ['University of Chicago', 'Northwestern University', 'DePaul University', 'UIC', 'IIT']
  },
  
  // BOSTON
  {
    city: 'Boston',
    state: 'Massachusetts',
    state_code: 'MA',
    dorm_cost_min: 1100, dorm_cost_max: 2000,
    shared_apt_min: 900, shared_apt_max: 1700,
    studio_apt_min: 1800, studio_apt_max: 3500,
    food_budget: 380, food_average: 600, food_comfortable: 980,
    transportation: 110, utilities: 190, personal_expenses: 290,
    public_tuition_min: 19000, public_tuition_max: 38000,
    private_tuition_min: 32000, private_tuition_max: 62000,
    community_tuition_min: 11000, community_tuition_max: 17000,
    health_insurance: 2900, books_supplies: 1450,
    cost_of_living_index: 161.0,
    population: 685000,
    popular_universities: ['Harvard University', 'MIT', 'Boston University', 'Northeastern', 'Tufts University']
  },
  
  // AUSTIN
  {
    city: 'Austin',
    state: 'Texas',
    state_code: 'TX',
    dorm_cost_min: 800, dorm_cost_max: 1400,
    shared_apt_min: 600, shared_apt_max: 1100,
    studio_apt_min: 1200, studio_apt_max: 2200,
    food_budget: 280, food_average: 450, food_comfortable: 700,
    transportation: 80, utilities: 140, personal_expenses: 220,
    public_tuition_min: 15000, public_tuition_max: 28000,
    private_tuition_min: 25000, private_tuition_max: 45000,
    community_tuition_min: 8000, community_tuition_max: 14000,
    health_insurance: 2200, books_supplies: 1100,
    cost_of_living_index: 119.0,
    population: 965000,
    popular_universities: ['University of Texas at Austin', 'Texas State University', 'St. Edwards University']
  },
  
  // SEATTLE
  {
    city: 'Seattle',
    state: 'Washington',
    state_code: 'WA',
    dorm_cost_min: 1000, dorm_cost_max: 1800,
    shared_apt_min: 800, shared_apt_max: 1500,
    studio_apt_min: 1600, studio_apt_max: 3000,
    food_budget: 350, food_average: 570, food_comfortable: 920,
    transportation: 105, utilities: 175, personal_expenses: 275,
    public_tuition_min: 16500, public_tuition_max: 31000,
    private_tuition_min: 28000, private_tuition_max: 52000,
    community_tuition_min: 9000, community_tuition_max: 15500,
    health_insurance: 2500, books_supplies: 1250,
    cost_of_living_index: 152.0,
    population: 750000,
    popular_universities: ['University of Washington', 'Seattle University', 'Seattle Pacific University']
  },
  
  // MIAMI
  {
    city: 'Miami',
    state: 'Florida',
    state_code: 'FL',
    dorm_cost_min: 900, dorm_cost_max: 1600,
    shared_apt_min: 700, shared_apt_max: 1300,
    studio_apt_min: 1400, studio_apt_max: 2600,
    food_budget: 300, food_average: 500, food_comfortable: 800,
    transportation: 90, utilities: 160, personal_expenses: 250,
    public_tuition_min: 16000, public_tuition_max: 30000,
    private_tuition_min: 28000, private_tuition_max: 52000,
    community_tuition_min: 9000, community_tuition_max: 15000,
    health_insurance: 2400, books_supplies: 1200,
    cost_of_living_index: 142.0,
    population: 470000,
    popular_universities: ['University of Miami', 'Florida International University', 'Miami Dade College']
  },
  
  // ATLANTA
  {
    city: 'Atlanta',
    state: 'Georgia',
    state_code: 'GA',
    dorm_cost_min: 850, dorm_cost_max: 1500,
    shared_apt_min: 650, shared_apt_max: 1200,
    studio_apt_min: 1300, studio_apt_max: 2400,
    food_budget: 290, food_average: 480, food_comfortable: 750,
    transportation: 85, utilities: 150, personal_expenses: 230,
    public_tuition_min: 15500, public_tuition_max: 29000,
    private_tuition_min: 26000, private_tuition_max: 48000,
    community_tuition_min: 8500, community_tuition_max: 14500,
    health_insurance: 2300, books_supplies: 1150,
    cost_of_living_index: 116.0,
    population: 500000,
    popular_universities: ['Georgia Tech', 'Emory University', 'Georgia State University', 'Morehouse College']
  },
  
  // DENVER
  {
    city: 'Denver',
    state: 'Colorado',
    state_code: 'CO',
    dorm_cost_min: 900, dorm_cost_max: 1600,
    shared_apt_min: 700, shared_apt_max: 1300,
    studio_apt_min: 1400, studio_apt_max: 2500,
    food_budget: 310, food_average: 500, food_comfortable: 780,
    transportation: 90, utilities: 155, personal_expenses: 240,
    public_tuition_min: 16000, public_tuition_max: 30000,
    private_tuition_min: 27000, private_tuition_max: 49000,
    community_tuition_min: 8800, community_tuition_max: 15000,
    health_insurance: 2400, books_supplies: 1200,
    cost_of_living_index: 125.0,
    population: 715000,
    popular_universities: ['University of Colorado Denver', 'Denver University', 'Colorado State University']
  },
  
  // PHILADELPHIA
  {
    city: 'Philadelphia',
    state: 'Pennsylvania',
    state_code: 'PA',
    dorm_cost_min: 950, dorm_cost_max: 1700,
    shared_apt_min: 750, shared_apt_max: 1400,
    studio_apt_min: 1500, studio_apt_max: 2700,
    food_budget: 320, food_average: 520, food_comfortable: 820,
    transportation: 95, utilities: 170, personal_expenses: 260,
    public_tuition_min: 17500, public_tuition_max: 33000,
    private_tuition_min: 29000, private_tuition_max: 56000,
    community_tuition_min: 9200, community_tuition_max: 16000,
    health_insurance: 2600, books_supplies: 1300,
    cost_of_living_index: 132.0,
    population: 1600000,
    popular_universities: ['University of Pennsylvania', 'Temple University', 'Drexel University', 'Villanova']
  },
  
  // PHOENIX
  {
    city: 'Phoenix',
    state: 'Arizona',
    state_code: 'AZ',
    dorm_cost_min: 800, dorm_cost_max: 1400,
    shared_apt_min: 600, shared_apt_max: 1100,
    studio_apt_min: 1200, studio_apt_max: 2100,
    food_budget: 270, food_average: 430, food_comfortable: 680,
    transportation: 75, utilities: 135, personal_expenses: 210,
    public_tuition_min: 14500, public_tuition_max: 27000,
    private_tuition_min: 24000, private_tuition_max: 44000,
    community_tuition_min: 7800, community_tuition_max: 13500,
    health_insurance: 2100, books_supplies: 1050,
    cost_of_living_index: 108.0,
    population: 1700000,
    popular_universities: ['Arizona State University', 'University of Arizona', 'Grand Canyon University']
  }
];

async function populateData() {
  console.log('🚀 Starting to populate US cities cost data...');
  
  try {
    // Clear existing data (optional)
    console.log('🧹 Clearing existing data...');
    const { error: deleteError } = await supabase
      .from('us_cities_cost_data')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteError) {
      console.warn('⚠️  Warning clearing data:', deleteError.message);
    }
    
    // Insert new data
    console.log(`📊 Inserting ${citiesData.length} cities...`);
    
    const { data, error } = await supabase
      .from('us_cities_cost_data')
      .insert(citiesData);
    
    if (error) {
      console.error('❌ Error inserting data:', error);
      return;
    }
    
    console.log('✅ Successfully populated cities data!');
    console.log(`📈 Added ${citiesData.length} cities to the database`);
    
    // Verify data
    const { count } = await supabase
      .from('us_cities_cost_data')
      .select('*', { count: 'exact', head: true });
    
    console.log(`🔍 Verification: ${count} total cities in database`);
    
  } catch (error) {
    console.error('💥 Script error:', error);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  populateData();
}

export { populateData, citiesData };
