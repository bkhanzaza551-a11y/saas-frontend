const fs = require('fs');
const file = 'src/pages/owner/InventoryPage.css';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('padding: 24px 32px 48px;', 'padding: 24px;');

fs.writeFileSync(file, content, 'utf8');
console.log("Updated InventoryPage padding");
