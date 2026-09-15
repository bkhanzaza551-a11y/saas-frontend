const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'saas_Respark', 'frontend', 'src', 'pages', 'operations', 'GlobalDashboardPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace corrupted rupee symbol with actual rupee symbol
content = content.replace(/â,¹/g, '?');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed rupee symbols!');
