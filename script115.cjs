const fs = require('fs');
const file = 'src/pages/owner/MembershipsPage.jsx';
let content = fs.readFileSync(file, 'utf8');
const idx = content.indexOf('const handleSaveMembership');
console.log(content.substring(idx, idx + 2000));
