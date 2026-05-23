import fs from 'fs';
let lines = fs.readFileSync('src/routes/dashboard/+page.svelte', 'utf8').split('\n');
let block = fs.readFileSync('.recovery_content.txt', 'utf8');
lines.splice(626, 0, block);
fs.writeFileSync('src/routes/dashboard/+page.svelte', lines.join('\n'), 'utf8');
