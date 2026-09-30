const fs = require('fs');
const file = 'src/pages/owner/ExpensesPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace Paymode span
content = content.replace(/<span[^>]*>\s*<Wallet[^>]*\/> Paymode:\s*<\/span>/, '');
content = content.replace(/<span[^>]*>\s*<FolderKanban[^>]*\/> Expense Type:\s*<\/span>/, '');

fs.writeFileSync(file, content, 'utf8');
console.log("Updated Labels via regex");
