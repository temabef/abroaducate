import fs from 'fs';
let text = fs.readFileSync('src/routes/dashboard/+page.svelte', 'utf8');
let lines = text.split('\n');
let filtered = [];
let inFootprint = false;
for(let i=0; i<lines.length; i++) {
  if (lines[i].includes('id="academic-footprint-box"')) {
     inFootprint = true;
     // drop the previous line '<!-- Academic Footprint Summary/Edit -->'
     if (filtered.length > 0 && filtered[filtered.length-1].includes('Academic Footprint Summary/Edit')) {
         filtered.pop();
     }
  }
  if (!inFootprint) {
     filtered.push(lines[i]);
  }
  // The footprint box closes right before <div class="flex items-center gap-2 mb-4 justify-center">
  if (inFootprint && lines[i].includes('Scholarship Radar')) {
     inFootprint = false;
     // We need to keep the Scholarship radar header, so we pop the previous 2 lines (the </div> and empty line) 
     // Wait, it's easier to just match </div> manually. I'll just check for 'Scholarship Radar'
     // Let's just push this line and the line before it.
     filtered.push(lines[i-1]); 
     filtered.push(lines[i]);
  }
}
fs.writeFileSync('src/routes/dashboard/+page.svelte', filtered.join('\n'), 'utf8');
