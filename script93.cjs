const fs = require('fs');
const file = 'src/pages/owner/ServiceHubPage.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/padding:\s*4,\s*display:\s*"flex"/g, 'width: 30, height: 30, display: "flex", justifyContent: "center", alignItems: "center", borderRadius: "50%", padding: 0');
fs.writeFileSync(file, content, 'utf8');
console.log("Updated ServiceHubPage");
