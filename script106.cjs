const fs = require('fs');
const file = 'src/pages/owner/ExpensesPage.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\.expenses-main-workspace\s*\{\s*flex:\s*1;\s*padding:\s*24px;\s*display:\s*flex;\s*flex-direction:\s*column;\s*gap:\s*20px;\s*\}/g, '.expenses-main-workspace { flex: 1; display: flex; flex-direction: column; gap: 20px; }');

fs.writeFileSync(file, content, 'utf8');
console.log("Updated Workspace Class");
