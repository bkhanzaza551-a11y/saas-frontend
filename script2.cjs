const fs = require('fs');
const file = 'src/pages/owner/UsersPage.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/color: isUnverified \? '#92400e'/g, "color: isUnverified ? '#0f172a'");
content = content.replace(/color: isUnverified \? '#b45309'/g, "color: isUnverified ? '#475569'");
content = content.replace(/#d97706 0%, #b45309 100%/g, "#2563eb 0%, #1d4ed8 100%");
content = content.replace(/#fef9c3, #fef3c7/g, "#f8fafc, #f1f5f9");
content = content.replace(/#fde68a/g, "#e2e8f0");
content = content.replace(/color: '#78350f'/g, "color: '#0f172a'");
content = content.replace(/color: '#92400e'/g, "color: '#475569'");
content = content.replace(/⚡ /g, "");

fs.writeFileSync(file, content, 'utf8');
