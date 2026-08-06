import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUsers() {
    console.log("Querying users with 0 credits...");
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('credits', 0)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching users:", error);
        return;
    }

    console.log(`Found ${data.length} users with 0 credits.`);
    if (data.length > 0) {
        console.log(JSON.stringify(data.slice(0, 5), null, 2)); // Show first 5
    }
}

checkUsers();
