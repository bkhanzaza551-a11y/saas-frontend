const fs = require('fs');
const file = 'src/pages/owner/UsersPage.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/height: 42/g, 'height: 38');
content = content.replace(/height: 40/g, 'height: 36');
content = content.replace(/minHeight: 40/g, 'minHeight: 36');

fs.writeFileSync(file, content, 'utf8');
