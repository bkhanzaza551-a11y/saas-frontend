const fs = require('fs');
const file = 'src/pages/owner/ExpensesPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace Paymode
content = content.replace(/<span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>\s*<Wallet size={14} color="#2563eb" \/> Paymode:\s*<\/span>/, '');

// Replace Expense Type
content = content.replace(/<span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>\s*<FolderKanban size={14} color="#2563eb" \/> Expense Type:\s*<\/span>/, '');

// Make sure the Paymode select has a default text
content = content.replace('<option value="">All</option>', '<option value="">All Paymodes</option>');

fs.writeFileSync(file, content, 'utf8');
console.log("Updated Labels");
