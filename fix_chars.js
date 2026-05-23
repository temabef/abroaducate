import fs from 'fs';
let text = fs.readFileSync('src/routes/dashboard/+page.svelte', 'utf8');
text = text.replace(/â‚¬/g, '€').replace(/â”€/g, '─').replace(/â€”/g, '—');
fs.writeFileSync('src/routes/dashboard/+page.svelte', text, 'utf8');
