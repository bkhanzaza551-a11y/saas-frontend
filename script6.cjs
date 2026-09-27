const fs = require('fs');
const file = 'src/pages/owner/UsersPage.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/height: 44, border: "1.5px solid #cbd5e1"/g, 'height: 38, border: "1.5px solid #cbd5e1"');

fs.writeFileSync(file, content, 'utf8');
