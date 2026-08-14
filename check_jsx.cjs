const fs = require('fs');
const content = fs.readFileSync('src/pages/superAdmin/DemoLeadsPage.jsx', 'utf-8');
const lines = content.split('\n');

let openTags = [];
for (let i = 598; i <= 768; i++) {
  const line = lines[i];
  if (!line) continue;
  
  // A very crude regex for opening tags (ignoring self-closing)
  const opens = line.match(/<([a-zA-Z0-9]+)[^>]*(?<!\/)>/g);
  if (opens) {
    for (let tag of opens) {
      if (!tag.startsWith('</')) {
        const name = tag.match(/<([a-zA-Z0-9]+)/)[1];
        if (!['input', 'img', 'br', 'hr', 'Activity', 'Eye', 'Clock', 'FileText'].includes(name) && !tag.endsWith('/>')) {
          openTags.push({name, line: i + 1});
        }
      }
    }
  }
  
  const closes = line.match(/<\/[a-zA-Z0-9]+>/g);
  if (closes) {
    for (let tag of closes) {
      const name = tag.match(/<\/([a-zA-Z0-9]+)/)[1];
      const last = openTags[openTags.length - 1];
      if (last && last.name === name) {
        openTags.pop();
      } else {
        console.log(`Mismatch at line ${i + 1}: expected closing for ${last ? last.name : 'NONE'}, got ${name}`);
      }
    }
  }
}

console.log("Unclosed tags:", openTags);
