const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'saas_Respark', 'frontend', 'src', 'pages', 'owner', 'CustomersPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace corrupted close symbol with proper X icon or character
content = content.replace(/o /g, '<X size={16} />');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed garbled toast close icon');
