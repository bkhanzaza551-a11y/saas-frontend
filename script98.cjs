const fs = require('fs');

const files = [
  'src/pages/owner/CampaignsPage.jsx',
  'src/pages/owner/CreateCampaignPage.jsx',
  'src/pages/owner/CampaignTemplatesPage.jsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/className="page-shell"\s+style=\{\{\s*maxWidth:\s*\d+,\s*margin:\s*'0 auto'\s*\}\}/g, 'className="page-shell"');
    fs.writeFileSync(file, content, 'utf8');
    console.log("Updated", file);
  }
}
