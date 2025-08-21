// Quick script to check cities in database
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCities() {
  try {
    const { data: cities, error } = await supabase
      .from('us_cities_cost_data')
      .select('city, state, cost_of_living_index')
      .order('state', { ascending: true })
      .order('city', { ascending: true });
    
    if (error) throw error;
    
    console.log(`📊 Current cities in database: ${cities.length}`);
    console.log('='.repeat(40));
    
    cities.forEach((city, index) => {
      console.log(`${index + 1}. ${city.city}, ${city.state} (COL: ${city.cost_of_living_index})`);
    });
    
    // Check if San Diego is there
    const sanDiego = cities.find(c => c.city === 'San Diego');
    if (sanDiego) {
      console.log(`\n✅ San Diego found! COL Index: ${sanDiego.cost_of_living_index}`);
    } else {
      console.log(`\n❌ San Diego not found in database`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkCities();

