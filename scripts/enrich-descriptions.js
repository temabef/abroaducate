/**
 * enrich-descriptions.js
 * 
 * Generates and updates the full_description_text for programs
 * using the rich data from the original CSV files.
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FREE_CSV = resolve(__dirname, '..', 'abroaducate_programmes_fee_ready.csv');
const PAID_CSV = resolve(__dirname, '..', 'abroaducate_programmes_under_10000_known_total.csv');

function compositeKey(program_name, university_name) {
  return `${(program_name || '').trim().toLowerCase()}|||${(university_name || '').trim().toLowerCase()}`;
}

function generateDescription(programName, rawFieldOfStudy) {
    if (!rawFieldOfStudy) return `The ${programName} program offers a comprehensive curriculum designed for international students.`;

    let desc = `The ${programName} program provides in-depth academic training`;
    
    let focusMatch = rawFieldOfStudy.match(/Focus\s+(.*?)(?:\s+Target group|$)/i);
    let targetMatch = rawFieldOfStudy.match(/Target group\s+(.*)/i);
    
    // If it doesn't match the standard DAAD pattern, just use it safely
    if (!focusMatch && !targetMatch) {
        if (rawFieldOfStudy.length > 20) {
           return `The ${programName} program focuses on ${rawFieldOfStudy}.`;
        }
        return `The ${programName} program is centered around ${rawFieldOfStudy}, preparing students for advanced careers in this field.`;
    }

    if (focusMatch) {
        desc += ` with a special focus on ${focusMatch[1].trim()}`;
    }
    
    desc += `. `;

    if (targetMatch) {
        let target = targetMatch[1].trim();
        // Capitalize first letter
        target = target.charAt(0).toUpperCase() + target.slice(1);
        desc += `It is ideally designed for ${target}.`;
    }

    return desc;
}

async function main() {
    console.log('📄 Loading CSV data...');
    const freeRows = parse(readFileSync(FREE_CSV, 'utf-8'), { columns: true, skip_empty_lines: true, relax_column_count: true });
    const paidRows = parse(readFileSync(PAID_CSV, 'utf-8'), { columns: true, skip_empty_lines: true, relax_column_count: true });
    
    const csvData = new Map();
    [...freeRows, ...paidRows].forEach(row => {
        csvData.set(compositeKey(row.program_name, row.university_name), row.field_of_study || '');
    });

    console.log('🌍 Fetching programs from DB...');
    const { data: programs, error } = await supabase.from('programs').select('id, program_name, university_name');
    if (error) throw error;

    console.log(`📝 Updating descriptions for ${programs.length} programs...`);
    
    let updated = 0;
    for (const prog of programs) {
        const rawField = csvData.get(compositeKey(prog.program_name, prog.university_name));
        const description = generateDescription(prog.program_name, rawField);
        
        const { error: updateErr } = await supabase
            .from('programs')
            .update({ full_description_text: description })
            .eq('id', prog.id);
            
        if (!updateErr) updated++;
        if (updated % 50 === 0) process.stdout.write(`✅ Updated ${updated}\r`);
    }

    console.log(`\n🎉 Finished! Updated ${updated} descriptions.`);
}

main().catch(console.error);
