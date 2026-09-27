const fs = require('fs');
const file = 'src/pages/owner/CreateCampaignPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// Step 2 Container padding
content = content.replace(/padding: '32px 32px 48px', display: 'flex', gap: 40/g, "padding: '24px 24px 32px', display: 'flex', gap: 24");

// Status Bar Padding
content = content.replace(/padding: '12px 18px',/g, "padding: '8px 14px',");

// Icon container
content = content.replace(/width: 38,/g, "width: 32,");
content = content.replace(/height: 38,/g, "height: 32,");
content = content.replace(/<Smartphone size=\{20\} \/>/g, "<Smartphone size={16} />");
content = content.replace(/<MessageSquare size=\{20\} \/>/g, "<MessageSquare size={16} />");
content = content.replace(/<Mail size=\{20\} \/>/g, "<Mail size={16} />");

// Texts
content = content.replace(/fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform/g, "fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform");
content = content.replace(/fontSize: '0.95rem', fontWeight: 700, color: '#0f172a'/g, "fontSize: '0.85rem', fontWeight: 700, color: '#0f172a'");
content = content.replace(/fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'block'/g, "fontSize: '0.65rem', color: '#64748b', fontWeight: 600, display: 'block'");
content = content.replace(/fontSize: '1.18rem', fontWeight: 800/g, "fontSize: '0.95rem', fontWeight: 800");

// Recharge button (Let's find its exact code first, or just run and check diff)
fs.writeFileSync(file, content, 'utf8');
