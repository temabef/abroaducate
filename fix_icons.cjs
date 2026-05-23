const fs = require('fs');
let s = fs.readFileSync('src/routes/dashboard/+page.svelte', 'utf-8');

// Add Missing Lucide Icons
s = s.replace(/import\s*\{\s*ArrowRight,/, 'import { Target, Calendar, Rocket, Check, ArrowRight,');

// Run replacements
s = s.replace(/<div class="brand-icon">.*?<\/div>/, '<div class="brand-icon"><Rocket size={20} /></div>');
s = s.replace(/<div class="pathway-icon">.*?<\/div>/, '<div class="pathway-icon"><Target size={24} strokeWidth={2.5} /></div>');
s = s.replace(/class="doc-check">.*?<\/span>/g, 'class="doc-check"><Check size={12} strokeWidth={3} /></span>');
s = s.replace(/>Generate .*?<\/a>/g, ' class="flex items-center gap-1">Generate <ArrowRight size={14} /></a>');
s = s.replace(/📅/g, '<span class="mr-1 opacity-75 inline-flex items-center"><Calendar size={13} strokeWidth={2.5} /></span>');

// Add margin top to dashboard
s = s.replace(/\.dash-shell\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*300px\s+1fr;\s*height:\s*calc\(100vh\s*-\s*64px\);\s*overflow:\s*hidden;\s*\}/, 
'.dash-shell { display: grid; grid-template-columns: 300px 1fr; height: calc(100vh - 64px); overflow: hidden; margin-top: 64px; }');

fs.writeFileSync('src/routes/dashboard/+page.svelte', s, 'utf-8');
console.log('Fixed cosmetic issues.');
