const fs = require('fs');
const file = 'src/pages/owner/CampaignsPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// Update to ensure it has proper explicit padding
content = content.replace(/className="page-shell"/g, 'className="page-shell" style={{ padding: "24px" }}');

fs.writeFileSync(file, content, 'utf8');
console.log("Updated CampaignsPage padding");
