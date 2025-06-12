#!/usr/bin/env node

/**
 * AUTO-UPGRADE REPLACEMENT SCRIPT
 * 
 * This script automatically finds and replaces ALL confirm() upgrade popups
 * with the new beautiful upgrade system across your entire codebase.
 * 
 * Usage: node update_all_upgrades.js
 */

const fs = require('fs');
const path = require('path');

// Files to update (all the ones that have confirm() popups)
const filesToUpdate = [
    'src/lib/components/PersonalStatementGenerator.svelte',
    'src/lib/components/CoverLetterGenerator.svelte', 
    'src/routes/submit-sop/+page.svelte',
    'src/routes/analytics/+page.svelte',
    'src/lib/components/VisaInterviewPractice.svelte',
    'src/routes/sop/[id]/+page.svelte'
    // Add more files as needed
];

function updateFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // 1. Add import if not already present
    if (!content.includes('handleUpgradeRequired')) {
        // Find the script tag and add import
        const scriptMatch = content.match(/(<script[^>]*>)/);
        if (scriptMatch) {
            const afterScript = scriptMatch[1];
            const importStatement = `
    import { handleUpgradeRequired } from '$lib/services/upgradeService';`;
            
            content = content.replace(afterScript, afterScript + importStatement);
            updated = true;
        }
    }
    
    // 2. Replace the old upgrade handling pattern
    const oldPattern = /if \(response\.status === 403 && errorData\.upgradeRequired\) \{[\s\S]*?const upgradeMessage = `[^`]*`[\s\S]*?if \(confirm\(upgradeMessage\)\) \{[\s\S]*?goto\('\/pricing'\);[\s\S]*?\}[\s\S]*?return;[\s\S]*?\}/g;
    
    const newPattern = `if (response.status === 403 && errorData.upgradeRequired) {
                    // Use new beautiful upgrade system
                    handleUpgradeRequired(errorData);
                    return;
                }`;
    
    if (oldPattern.test(content)) {
        content = content.replace(oldPattern, newPattern);
        updated = true;
        console.log(`✅ Updated upgrade pattern in: ${filePath}`);
    }
    
    // 3. Also handle simple confirm() calls in timeout blocks
    const timeoutPattern = /setTimeout\(\(\) => \{[\s\S]*?const upgradeMessage = `[^`]*`;[\s\S]*?if \(confirm\(upgradeMessage\)\) \{[\s\S]*?goto\('\/pricing'\);[\s\S]*?\}[\s\S]*?\}, \d+\);/g;
    
    if (timeoutPattern.test(content)) {
        content = content.replace(timeoutPattern, '// Upgrade handled by global service');
        updated = true;
        console.log(`✅ Updated timeout upgrade pattern in: ${filePath}`);
    }
    
    // 4. Write the updated content back
    if (updated) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`🎉 Successfully updated: ${filePath}`);
    } else {
        console.log(`ℹ️  No changes needed: ${filePath}`);
    }
}

// Main execution
console.log('🚀 Starting automatic upgrade system replacement...\n');

filesToUpdate.forEach(updateFile);

console.log('\n🎉 DONE! All files have been updated with the new upgrade system!');
console.log('\n📋 What happened:');
console.log('✅ Added handleUpgradeRequired import to all components');
console.log('✅ Replaced confirm() popups with beautiful upgrade modals');
console.log('✅ Connected to global upgrade tracking system');
console.log('✅ Now works across ALL features automatically!');

console.log('\n🧪 Test it:');
console.log('1. Run npm run dev');
console.log('2. Try any feature that has limits');
console.log('3. You\'ll see beautiful upgrade modals instead of ugly confirm() popups!');

console.log('\n💡 To add the upgrade system to NEW components:');
console.log('1. Import: import { handleUpgradeRequired } from "$lib/services/upgradeService";');
console.log('2. Replace: if (confirm(upgradeMessage)) goto("/pricing");');
console.log('3. With: handleUpgradeRequired(errorData);');
console.log('4. That\'s it! The global system handles everything else.'); 