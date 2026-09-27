const fs = require('fs');
const file = 'src/pages/owner/UsersPage.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /style=\{\{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4, display: "flex", borderRadius: "50%" \}\}/g,
  'style={{ background: "white", border: "1px solid #e2e8f0", cursor: "pointer", color: "#64748b", width: 32, height: 32, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}'
);

fs.writeFileSync(file, content, 'utf8');
