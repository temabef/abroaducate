import fs from 'fs';
let text = fs.readFileSync('src/routes/dashboard/+page.svelte', 'utf8');
// Fix the specific broken sequence
text = text.replace(/<div\s+<Zap size=\{20\}/g, '<div class=\"flex items-center gap-2 mb-4 justify-center\"><Zap size={20}');
// Remove the comment that's now orphaned
text = text.replace(/<!-- Academic Footprint Summary\/Edit -->\s+<div class=\"flex items-center gap-2 mb-4 justify-center\">/g, '<div class=\"flex items-center gap-2 mb-4 justify-center\">');
fs.writeFileSync('src/routes/dashboard/+page.svelte', text, 'utf8');
