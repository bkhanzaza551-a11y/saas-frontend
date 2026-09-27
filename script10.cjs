const fs = require('fs');
const file = 'src/pages/owner/CreateCampaignPage.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "rgba\\(255,255,255,0.8\\)", zIndex: 10, display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: 60/g,
  'position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)", zIndex: 99999, display: "flex", justifyContent: "center", alignItems: "center"'
);

fs.writeFileSync(file, content, 'utf8');
