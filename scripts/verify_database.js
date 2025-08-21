// Quick verification script for database status
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 BUDGET CALCULATOR DATABASE STATUS');
console.log('==================================\n');

async function verifyDatabase() {
  try {
    const { data: cities, error } = await supabase
      .from('us_cities_cost_data')
      .select('city, state, cost_of_living_index, popular_universities')
      .order('state', { ascending: true })
      .order('city', { ascending: true });
    
    if (error) throw error;
    
    console.log(`📊 Total cities in database: ${cities.length}\n`);
    
    // Group by state
    const stateGroups = {};
    cities.forEach(city => {
      if (!stateGroups[city.state]) {
        stateGroups[city.state] = [];
      }
      stateGroups[city.state].push(city);
    });
    
    // Display by state
    Object.entries(stateGroups).forEach(([state, stateCities]) => {
      console.log(`📍 ${state} (${stateCities.length} cities):`);
      stateCities.forEach(city => {
        const universitiesText = city.popular_universities && city.popular_universities.length > 0
          ? ` - ${city.popular_universities.slice(0, 2).join(', ')}${city.popular_universities.length > 2 ? '...' : ''}`
          : ' - No universities listed';
        console.log(`   • ${city.city} (COL: ${city.cost_of_living_index})${universitiesText}`);
      });
      console.log('');
    });
    
    // Check for new additions
    const targetCities = ['San Diego', 'Raleigh', 'Ann Arbor', 'Columbus', 'Madison'];
    const foundCities = cities.filter(city => targetCities.includes(city.city));
    
    console.log('🎯 BATCH 2 VERIFICATION:');
    console.log('=====================');
    targetCities.forEach(targetCity => {
      const found = foundCities.find(city => city.city === targetCity);
      if (found) {
        console.log(`✅ ${targetCity}, ${found.state} - FOUND`);
      } else {
        console.log(`❌ ${targetCity} - NOT FOUND`);
      }
    });
    
    console.log(`\n📈 Progress: ${foundCities.length}/${targetCities.length} Batch 2 cities added`);
    
    if (cities.length >= 20) {
      console.log('\n🎉 Excellent! Database is growing nicely.');
      console.log('💡 Consider testing the calculator with the new cities.');
    } else {
      console.log('\n📝 Continue adding more cities to reach our target of 25+ cities.');
    }
    
  } catch (error) {
    console.error('❌ Error verifying database:', error.message);
  }
}

verifyDatabase();

