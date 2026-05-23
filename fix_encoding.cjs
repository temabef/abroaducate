const fs = require('fs');
let content = fs.readFileSync('src/routes/dashboard/+page.svelte', 'utf-8');

// Replace corrupted emojis exactly based on what the powershell matched
content = content.replace(/<div class="brand-icon">.*?<\/div>/g, '<div class="brand-icon">🚀</div>');
content = content.replace(/<div class="pathway-icon">.*?<\/div>/g, '<div class="pathway-icon">🎯</div>');
content = content.replace(/class="doc-check">.*?<\/span>/g, 'class="doc-check">✓</span>');
content = content.replace(/Generate .*?<\/a>/g, 'Generate →</a>');
content = content.replace(/Â·/g, '·');
content = content.replace(/ðŸ“…/g, '📅');

// Specifically handle the garbled euro symbol € replacing weird bytes before money formatting
// Wait, the previous garble was: <span class="cost-val emerald-text">ï¿½,ï¿½{selectedProgram.tuition_per_semester || 0}/sem</span>
// Let's replace any non-ascii strings before {selectedProgram with €
content = content.replace(/>[^<]*?\{selectedProgram\.tuition_per_semester/g, '>€{selectedProgram.tuition_per_semester');
content = content.replace(/>[^<]*?\{selectedProgram\.semester_fee/g, '>€{selectedProgram.semester_fee');
content = content.replace(/>[^<]*?\{selectedProgram\.application_fee/g, '>€{selectedProgram.application_fee');
content = content.replace(/>[^<]*?\{selectedProgram\.living_cost_per_month/g, '>€{selectedProgram.living_cost_per_month');
content = content.replace(/>[^<]*?\{prog\.tuition_per_semester/g, '>€{prog.tuition_per_semester');

fs.writeFileSync('src/routes/dashboard/+page.svelte', content, 'utf-8');
console.log('Fixed encoding in +page.svelte (safely)');
