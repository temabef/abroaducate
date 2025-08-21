// Simple script to show our data collection research plan
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('📊 BUDGET CALCULATOR DATA COLLECTION RESEARCH PLAN');
console.log('==============================================\n');

// Next cities to research (prioritized by student populations)
const researchCities = [
  // HIGH PRIORITY (Major university cities)
  { city: 'San Diego', state: 'California', universities: ['UCSD', 'San Diego State'], priority: 'HIGH' },
  { city: 'Raleigh', state: 'North Carolina', universities: ['NC State', 'UNC System'], priority: 'HIGH' },
  { city: 'Ann Arbor', state: 'Michigan', universities: ['University of Michigan'], priority: 'HIGH' },
  { city: 'Columbus', state: 'Ohio', universities: ['Ohio State University'], priority: 'HIGH' },
  { city: 'Madison', state: 'Wisconsin', universities: ['University of Wisconsin'], priority: 'HIGH' },
  { city: 'Minneapolis', state: 'Minnesota', universities: ['University of Minnesota'], priority: 'HIGH' },
  { city: 'New Haven', state: 'Connecticut', universities: ['Yale University'], priority: 'HIGH' },
  
  // MEDIUM PRIORITY (Good student populations)
  { city: 'Durham', state: 'North Carolina', universities: ['Duke University'], priority: 'MEDIUM' },
  { city: 'Berkeley', state: 'California', universities: ['UC Berkeley'], priority: 'MEDIUM' },
  { city: 'Rochester', state: 'New York', universities: ['University of Rochester'], priority: 'MEDIUM' },
  { city: 'Syracuse', state: 'New York', universities: ['Syracuse University'], priority: 'MEDIUM' },
  { city: 'Richmond', state: 'Virginia', universities: ['VCU', 'University of Richmond'], priority: 'MEDIUM' },
  { city: 'Cincinnati', state: 'Ohio', universities: ['University of Cincinnati'], priority: 'MEDIUM' },
  { city: 'Milwaukee', state: 'Wisconsin', universities: ['Marquette University'], priority: 'MEDIUM' },
  { city: 'Salt Lake City', state: 'Utah', universities: ['University of Utah'], priority: 'MEDIUM' },
];

async function showResearchPlan() {
  try {
    // Get current city count
    const { count: currentCount } = await supabase
      .from('us_cities_cost_data')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📈 CURRENT STATUS:`);
    console.log(`   ✅ Cities in database: ${currentCount}`);
    console.log(`   🎯 Cities to research: ${researchCities.length}`);
    console.log(`   📊 Target total: ${currentCount + researchCities.length}+`);
    
    console.log(`\n🎯 RESEARCH PRIORITIES:`);
    
    const highPriority = researchCities.filter(c => c.priority === 'HIGH');
    const mediumPriority = researchCities.filter(c => c.priority === 'MEDIUM');
    
    console.log(`\n   🔥 HIGH PRIORITY (${highPriority.length} cities):`);
    highPriority.forEach((city, i) => {
      console.log(`      ${i + 1}. ${city.city}, ${city.state}`);
      console.log(`         🏫 ${city.universities.join(', ')}`);
    });
    
    console.log(`\n   📝 MEDIUM PRIORITY (${mediumPriority.length} cities):`);
    mediumPriority.forEach((city, i) => {
      console.log(`      ${i + 1}. ${city.city}, ${city.state}`);
      console.log(`         🏫 ${city.universities.join(', ')}`);
    });
    
    console.log(`\n📋 DATA SOURCES TO USE:`);
    console.log(`   🏠 HOUSING COSTS:`);
    console.log(`      • University housing websites (most accurate)`);
    console.log(`      • Apartments.com, Rent.com`);
    console.log(`      • Local real estate sites`);
    console.log(`      • Student housing Facebook groups`);
    
    console.log(`\n   🎓 TUITION COSTS:`);
    console.log(`      • Official university websites`);
    console.log(`      • College Board data`);
    console.log(`      • IPEDS database`);
    console.log(`      • State education departments`);
    
    console.log(`\n   🍕 LIVING COSTS:`);
    console.log(`      • Numbeo.com cost of living`);
    console.log(`      • BLS Consumer Expenditure Survey`);
    console.log(`      • Local government data`);
    console.log(`      • Student budget guides from universities`);
    
    console.log(`\n📅 RESEARCH SCHEDULE:`);
    console.log(`   📅 WEEK 1: High priority cities (${Math.ceil(highPriority.length / 2)} cities)`);
    console.log(`      • ${highPriority.slice(0, Math.ceil(highPriority.length / 2)).map(c => c.city).join(', ')}`);
    console.log(`   📅 WEEK 2: Remaining high priority + start medium`);
    console.log(`      • ${highPriority.slice(Math.ceil(highPriority.length / 2)).map(c => c.city).join(', ')}`);
    console.log(`   📅 WEEK 3: Medium priority cities`);
    console.log(`   📅 WEEK 4: Data validation & quality assurance`);
    
    console.log(`\n🔍 DATA VALIDATION PROCESS:`);
    console.log(`   ✅ Cross-reference 3+ sources per data point`);
    console.log(`   ✅ Prioritize 2023-2024 data`);
    console.log(`   ✅ Check international student specific costs`);
    console.log(`   ✅ Validate cost ranges make sense`);
    console.log(`   ✅ Test calculator with new data`);
    
    console.log(`\n🎯 QUALITY TARGETS:`);
    console.log(`   📊 HIGH confidence: 3+ official sources`);
    console.log(`   📊 MEDIUM confidence: 2-3 mixed sources`);
    console.log(`   📊 LOW confidence: 1-2 sources (flag for review)`);
    
    console.log(`\n🚀 IMMEDIATE NEXT STEPS:`);
    console.log(`   1. Start with: ${highPriority.slice(0, 3).map(c => c.city).join(', ')}`);
    console.log(`   2. Use university housing websites first`);
    console.log(`   3. Cross-reference with Numbeo for COL index`);
    console.log(`   4. Add data via admin panel: /admin/calculator-data`);
    console.log(`   5. Test calculator functionality after each city`);
    
    console.log(`\n💰 IMPACT PROJECTION:`);
    console.log(`   📈 Each additional city = ~50-100 more monthly users`);
    console.log(`   📈 ${researchCities.length} cities = ~1,000-1,500 additional monthly users`);
    console.log(`   📈 Estimated additional revenue: $500-2,000/month`);
    
    console.log(`\n✨ Let's start gathering this data systematically!`);
    console.log(`   🔗 Access admin panel: http://localhost:5173/admin/calculator-data`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run immediately
showResearchPlan();

