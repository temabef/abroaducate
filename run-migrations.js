/**
 * Script to run SQL migrations using the Supabase client
 * 
 * Usage:
 * 1. Set up your environment variables:
 *    - SUPABASE_URL
 *    - SUPABASE_KEY
 * 
 * 2. Run the script:
 *    node run-migrations.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const MIGRATIONS_DIR = './supabase/migrations';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Executes a SQL statement
 * @param {string} sql - The SQL statement to execute
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function executeSql(sql) {
  try {
    // Use the exec_sql RPC function if it exists
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, error: null };
  } catch (e) {
    console.error('Exception executing SQL:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Runs a migration file
 * @param {string} filePath - The path to the migration file
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function runMigration(filePath) {
  try {
    console.log(`Running migration: ${path.basename(filePath)}`);
    
    // Read the SQL file
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Execute the SQL
    const result = await executeSql(sql);
    
    if (!result.success) {
      console.error(`Migration failed: ${result.error}`);
      return result;
    }
    
    console.log(`Migration successful: ${path.basename(filePath)}`);
    return { success: true, error: null };
  } catch (e) {
    console.error(`Error running migration ${path.basename(filePath)}:`, e);
    return { success: false, error: e.message };
  }
}

/**
 * Runs all migration files in the migrations directory
 * @returns {Promise<void>}
 */
async function runAllMigrations() {
  try {
    // Get all migration files
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`Found ${files.length} migration files`);
    
    // Run each migration
    for (const file of files) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const result = await runMigration(filePath);
      
      if (!result.success) {
        console.error(`Migration ${file} failed: ${result.error}`);
        process.exit(1);
      }
    }
    
    console.log('All migrations completed successfully');
  } catch (e) {
    console.error('Error running migrations:', e);
    process.exit(1);
  }
}

// Run the migrations
runAllMigrations(); 