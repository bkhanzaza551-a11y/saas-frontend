const fs = require('fs');
const file = 'src/pages/owner/InventoryPage.css';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('background: #f1f5f9;', 'background: transparent;');

fs.writeFileSync(file, content, 'utf8');
console.log("Updated InventoryPage.css");
