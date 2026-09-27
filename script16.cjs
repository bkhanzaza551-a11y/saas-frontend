const fs = require('fs');
const file = 'src/pages/owner/Dashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// Quick Expense form container
content = content.replace(/background: "#fffbeb", border: "1px solid #fde68a"/g, 'background: "#f8fafc", border: "1px solid #e2e8f0"');
// Title
content = content.replace(/color: "#92400e"/g, 'color: "#0f172a"');
// Labels
content = content.replace(/color: "#78350f"/g, 'color: "#475569"');
// Save Button
content = content.replace(/background: "#d97706", color: "#fff", border: "none", borderRadius: 6, padding: "6px 16px", fontSize: "0.82rem", fontWeight: 800/g, 'background: "#0f172a", color: "#fff", border: "none", borderRadius: 6, padding: "6px 16px", fontSize: "0.82rem", fontWeight: 700');

fs.writeFileSync(file, content, 'utf8');
