// Research script for gathering additional US cities data
// This will help us systematically research and add more cities

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Next 15+ cities to research and add (based on student populations and university presence)
const citiesToResearch = [
  // California
  { city: 'San Diego', state: 'California', state_code: 'CA', priority: 'high' },
  { city: 'Berkeley', state: 'California', state_code: 'CA', priority: 'high' },
  { city: 'Irvine', state: 'California', state_code: 'CA', priority: 'medium' },
  
  // New York State
  { city: 'Rochester', state: 'New York', state_code: 'NY', priority: 'medium' },
  { city: 'Syracuse', state: 'New York', state_code: 'NY', priority: 'medium' },
  { city: 'Buffalo', state: 'New York', state_code: 'NY', priority: 'medium' },
  
  // North Carolina
  { city: 'Raleigh', state: 'North Carolina', state_code: 'NC', priority: 'high' },
  { city: 'Durham', state: 'North Carolina', state_code: 'NC', priority: 'high' },
  { city: 'Chapel Hill', state: 'North Carolina', state_code: 'NC', priority: 'medium' },
  
  // Michigan
  { city: 'Ann Arbor', state: 'Michigan', state_code: 'MI', priority: 'high' },
  { city: 'Detroit', state: 'Michigan', state_code: 'MI', priority: 'medium' },
  
  // Virginia
  { city: 'Richmond', state: 'Virginia', state_code: 'VA', priority: 'medium' },
  { city: 'Charlottesville', state: 'Virginia', state_code: 'VA', priority: 'medium' },
  
  // Ohio
  { city: 'Columbus', state: 'Ohio', state_code: 'OH', priority: 'high' },
  { city: 'Cincinnati', state: 'Ohio', state_code: 'OH', priority: 'medium' },
  { city: 'Cleveland', state: 'Ohio', state_code: 'OH', priority: 'medium' },
  
  // Wisconsin
  { city: 'Madison', state: 'Wisconsin', state_code: 'WI', priority: 'high' },
  { city: 'Milwaukee', state: 'Wisconsin', state_code: 'WI', priority: 'medium' },
  
  // Minnesota
  { city: 'Minneapolis', state: 'Minnesota', state_code: 'MN', priority: 'high' },
  
  // Indiana
  { city: 'Bloomington', state: 'Indiana', state_code: 'IN', priority: 'medium' },
  { city: 'West Lafayette', state: 'Indiana', state_code: 'IN', priority: 'medium' },
  
  // Kansas
  { city: 'Lawrence', state: 'Kansas', state_code: 'KS', priority: 'medium' },
  
  // Iowa
  { city: 'Iowa City', state: 'Iowa', state_code: 'IA', priority: 'medium' },
  
  // Connecticut
  { city: 'New Haven', state: 'Connecticut', state_code: 'CT', priority: 'high' },
  
  // Delaware
  { city: 'Newark', state: 'Delaware', state_code: 'DE', priority: 'medium' },
  
  // Utah
  { city: 'Salt Lake City', state: 'Utah', state_code: 'UT', priority: 'medium' },
  
  // Oregon (additional)
  { city: 'Eugene', state: 'Oregon', state_code: 'OR', priority: 'medium' },
  
  // Louisiana
  { city: 'New Orleans', state: 'Louisiana', state_code: 'LA', priority: 'medium' },
  
  // Alabama
  { city: 'Tuscaloosa', state: 'Alabama', state_code: 'AL', priority: 'medium' },
  
  // South Carolina
  { city: 'Columbia', state: 'South Carolina', state_code: 'SC', priority: 'medium' },
  
  // Vermont
  { city: 'Burlington', state: 'Vermont', state_code: 'VT', priority: 'low' },
];

// Data collection template with research notes
const researchTemplate = {
  city: '',
  state: '',
  state_code: '',
  
  // Housing costs (monthly)
  dorm_cost_min: 0,
  dorm_cost_max: 0,
  shared_apt_min: 0,
  shared_apt_max: 0,
  studio_apt_min: 0,
  studio_apt_max: 0,
  
  // Living costs (monthly)
  food_budget: 0,
  food_average: 0,
  food_comfortable: 0,
  transportation: 0,
  utilities: 0,
  personal_expenses: 0,
  
  // Tuition costs (annual)
  public_tuition_min: 0,
  public_tuition_max: 0,
  private_tuition_min: 0,
  private_tuition_max: 0,
  community_tuition_min: 0,
  community_tuition_max: 0,
  
  // Additional costs (annual)
  health_insurance: 0,
  books_supplies: 0,
  
  // City data
  cost_of_living_index: 100.0,
  population: 0,
  popular_universities: [],
  
  // Research metadata
  data_sources: [],
  last_updated: new Date().toISOString(),
  research_confidence: 'low', // low, medium, high
  notes: ''
};

// Research data sources for validation
const dataSources = {
  housing: [
    'apartments.com',
    'rent.com',
    'university housing websites',
    'local real estate sites'
  ],
  tuition: [
    'College Board',
    'IPEDS database',
    'university websites',
    'state education departments'
  ],
  living_costs: [
    'numbeo.com',
    'BLS Consumer Expenditure Survey',
    'MIT Living Wage Calculator',
    'local government data'
  ],
  universities: [
    'U.S. News & World Report',
    'university websites',
    'College Navigator',
    'state higher education boards'
  ]
};

// Research methodology notes
const researchMethodology = `
RESEARCH METHODOLOGY FOR CITY DATA COLLECTION:

1. PRIMARY SOURCES (Highest Priority):
   - Official university websites for tuition and housing
   - Government databases (BLS, IPEDS, Census)
   - Local housing authority data
   - Transit authority websites

2. SECONDARY SOURCES (Cross-validation):
   - Numbeo.com for cost of living indices
   - Apartments.com/Rent.com for housing costs
   - College Board annual reports
   - Local economic development websites

3. DATA VALIDATION PROCESS:
   - Cross-reference at least 3 sources per data point
   - Check data recency (prefer 2023-2024 data)
   - Account for seasonal variations in housing
   - Verify international student-specific costs

4. QUALITY INDICATORS:
   - HIGH: 3+ recent sources, official data
   - MEDIUM: 2-3 sources, some official data
   - LOW: 1-2 sources, mostly third-party

5. UPDATE FREQUENCY:
   - Tuition: Annually (summer)
   - Housing: Quarterly
   - Living costs: Semi-annually
   - COL Index: Annually
`;

async function generateResearchReport() {
  console.log('📊 BUDGET CALCULATOR DATA COLLECTION RESEARCH REPORT');
  console.log('==================================================\n');
  
  // Get current cities count
  const { count: currentCount } = await supabase
    .from('us_cities_cost_data')
    .select('*', { count: 'exact', head: true });
  
  console.log(`📈 CURRENT STATUS:`);
  console.log(`   - Cities in database: ${currentCount}`);
  console.log(`   - Cities to research: ${citiesToResearch.length}`);
  console.log(`   - Target total: ${currentCount + citiesToResearch.length}`);
  
  console.log(`\n🎯 RESEARCH PRIORITIES:`);
  const highPriority = citiesToResearch.filter(c => c.priority === 'high');
  const mediumPriority = citiesToResearch.filter(c => c.priority === 'medium');
  const lowPriority = citiesToResearch.filter(c => c.priority === 'low');
  
  console.log(`   HIGH PRIORITY (${highPriority.length}):`, highPriority.map(c => `${c.city}, ${c.state_code}`).join(', '));
  console.log(`   MEDIUM PRIORITY (${mediumPriority.length}):`, mediumPriority.map(c => `${c.city}, ${c.state_code}`).join(', '));
  console.log(`   LOW PRIORITY (${lowPriority.length}):`, lowPriority.map(c => `${c.city}, ${c.state_code}`).join(', '));
  
  console.log(`\n📋 DATA SOURCES TO RESEARCH:`);
  Object.entries(dataSources).forEach(([category, sources]) => {
    console.log(`   ${category.toUpperCase()}:`);
    sources.forEach(source => console.log(`     - ${source}`));
  });
  
  console.log(`\n🔬 RESEARCH METHODOLOGY:`);
  console.log(researchMethodology);
  
  console.log(`\n📅 RECOMMENDED RESEARCH SCHEDULE:`);
  console.log(`   Week 1: High priority cities (${highPriority.length} cities)`);
  console.log(`   Week 2: Medium priority cities (${mediumPriority.length} cities)`);
  console.log(`   Week 3: Low priority cities + data validation`);
  console.log(`   Week 4: Cross-reference and quality assurance`);
  
  return {
    currentCount,
    citiesToResearch,
    highPriority,
    mediumPriority,
    lowPriority,
    dataSources,
    researchTemplate
  };
}

// Function to save research progress
async function saveResearchProgress(cityData) {
  try {
    const { data, error } = await supabase
      .from('us_cities_cost_data')
      .upsert([cityData], { 
        onConflict: 'city,state',
        ignoreDuplicates: false 
      });
    
    if (error) throw error;
    
    console.log(`✅ Saved research data for ${cityData.city}, ${cityData.state}`);
    return data;
    
  } catch (error) {
    console.error(`❌ Error saving ${cityData.city}:`, error);
    return null;
  }
}

// Function to validate existing data
async function validateExistingData() {
  try {
    const { data: cities, error } = await supabase
      .from('us_cities_cost_data')
      .select('*')
      .order('city');
    
    if (error) throw error;
    
    console.log(`\n🔍 VALIDATION REPORT FOR ${cities.length} EXISTING CITIES:`);
    console.log('===============================================');
    
    cities.forEach(city => {
      const issues = [];
      
      // Check for missing or suspicious data
      if (!city.popular_universities || city.popular_universities.length === 0) {
        issues.push('No universities listed');
      }
      if (city.cost_of_living_index < 80 || city.cost_of_living_index > 250) {
        issues.push('Unusual COL index');
      }
      if (city.dorm_cost_min >= city.dorm_cost_max) {
        issues.push('Invalid dorm cost range');
      }
      if (city.public_tuition_min >= city.private_tuition_min) {
        issues.push('Public tuition higher than private');
      }
      
      if (issues.length > 0) {
        console.log(`   ⚠️  ${city.city}, ${city.state}: ${issues.join(', ')}`);
      } else {
        console.log(`   ✅ ${city.city}, ${city.state}: Data looks good`);
      }
    });
    
    return cities;
    
  } catch (error) {
    console.error('Error validating data:', error);
    return [];
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Starting comprehensive data collection research...\n');
  
  generateResearchReport()
    .then(async (report) => {
      console.log(`\n🎯 NEXT STEPS:`);
      console.log(`1. Begin with HIGH PRIORITY cities: ${report.highPriority.slice(0, 3).map(c => c.city).join(', ')}`);
      console.log(`2. Use the research template and methodology above`);
      console.log(`3. Cross-reference multiple data sources`);
      console.log(`4. Update database using the admin panel or direct scripts`);
      console.log(`5. Validate and test calculator accuracy`);
      
      // Validate existing data
      await validateExistingData();
      
      console.log(`\n✨ Research framework ready! Let's start gathering data systematically.`);
    })
    .catch((error) => {
      console.error('💥 Error generating research report:', error);
    });
}

export { 
  generateResearchReport, 
  saveResearchProgress, 
  validateExistingData,
  citiesToResearch,
  researchTemplate,
  dataSources 
};

