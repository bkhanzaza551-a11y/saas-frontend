const fs = require('fs');
const file = 'src/pages/owner/UsersPage.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/background: '#f0fdf4', color: '#16a34a'/g, "background: '#eff6ff', color: '#2563eb'");
content = content.replace(/background: '#faf5ff', color: '#9333ea'/g, "background: '#eff6ff', color: '#2563eb'");

fs.writeFileSync(file, content, 'utf8');
