const fs = require('fs');
const file = 'src/pages/owner/ExpensesPage.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/style={{ width: 110, height: 36, padding: "0 8px", fontSize: 12, fontWeight: 600, borderRadius: 8, background: "#f8fafc", border: "1px solid #cbd5e1" }}/g, 'style={{ height: 36, padding: "0 12px", fontSize: 13, fontWeight: 600, borderRadius: 8, background: "#fff", border: "1px solid #cbd5e1" }}');
content = content.replace(/style={{ width: 140, height: 36, padding: "0 8px", fontSize: 12, fontWeight: 600, borderRadius: 8, background: "#f8fafc", border: "1px solid #cbd5e1" }}/g, 'style={{ height: 36, padding: "0 12px", fontSize: 13, fontWeight: 600, borderRadius: 8, background: "#fff", border: "1px solid #cbd5e1" }}');

// Update input styles
content = content.replace(/style={{ height: 36, padding: "0 8px", fontSize: 12, fontWeight: 600, borderRadius: 8, background: "#f8fafc", border: "1px solid #cbd5e1", outline: "none", boxSizing: "border-box" }}/g, 'style={{ height: 36, padding: "0 12px", fontSize: 13, fontWeight: 600, borderRadius: 8, background: "#fff", border: "1px solid #cbd5e1", outline: "none", boxSizing: "border-box" }}');

fs.writeFileSync(file, content, 'utf8');
console.log("Updated widths");
