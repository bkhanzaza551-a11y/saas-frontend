const fs = require('fs');

const files = [
  'src/pages/owner/CreateCampaignPage.jsx',
  'src/pages/owner/CampaignTemplatesPage.jsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/className="page-shell"/g, 'className="page-shell" style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}');
    fs.writeFileSync(file, content, 'utf8');
    console.log("Updated", file);
  }
}
