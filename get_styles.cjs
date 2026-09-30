const fs = require('fs');
const lines = fs.readFileSync('src/pages/owner/EnquiriesPage.jsx', 'utf8').split('\n');
let styles = '';
for(let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<style>')) {
    for(let j = i; j < lines.length; j++) {
      styles += lines[j] + '\n';
      if (lines[j].includes('</style>')) break;
    }
    break;
  }
}
console.log(styles);
