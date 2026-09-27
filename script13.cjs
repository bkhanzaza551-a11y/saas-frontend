const fs = require("fs");
const file = "src/pages/owner/CreateCampaignPage.jsx";
let content = fs.readFileSync(file, "utf8");

content = content.replace(/padding: '6px 14px'/g, "padding: '4px 10px'");
content = content.replace(/fontSize: '0.84rem'/g, "fontSize: '0.75rem'");
content = content.replace(/fontSize: '0.98rem'/g, "fontSize: '0.85rem'");
content = content.replace(/padding: '5px 12px', fontSize: '0.75rem'/g, "padding: '4px 10px', fontSize: '0.7rem'"); 
content = content.replace(/padding: '7px 14px',(\s+)fontSize: '0.78rem'/g, "padding: '5px 12px',$1fontSize: '0.72rem'");
content = content.replace(/fontSize: '1.4rem'/g, "fontSize: '1.25rem'");
content = content.replace(/width: 320/g, "width: 280");
content = content.replace(/padding: '16px 20px'/g, "padding: '12px 16px'");

// Make the icon box in step 2 smaller
content = content.replace(/padding: '12px 18px',/g, "padding: '8px 14px',");
content = content.replace(/width: 38,/g, "width: 32,");
content = content.replace(/height: 38,/g, "height: 32,");
content = content.replace(/<Smartphone size=\{20\} \/>/g, "<Smartphone size={16} />");
content = content.replace(/<MessageSquare size=\{20\} \/>/g, "<MessageSquare size={16} />");
content = content.replace(/<Mail size=\{20\} \/>/g, "<Mail size={16} />");

fs.writeFileSync(file, content, "utf8");
