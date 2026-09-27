const fs = require('fs');
const file = 'src/pages/owner/UsersPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// Sidebar Header
content = content.replace(/padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc'/g, "padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc'");
content = content.replace(/margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 600/g, "margin: 0, fontSize: 16, color: '#0f172a', fontWeight: 600");

// Search & Buttons block
content = content.replace(/padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc'/g, "padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc'");
content = content.replace(/padding: '10px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: '#2563eb', color: 'white'/g, "padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#2563eb', color: 'white'");
content = content.replace(/width: '100%', height: 40, padding: '0 14px 0 38px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14/g, "width: '100%', height: 36, padding: '0 14px 0 36px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13");
content = content.replace(/padding: '8px', flex: 1, border: 'none', background: 'none', fontSize: 13, fontWeight: 600, color: tabFilter/g, "padding: '6px', flex: 1, border: 'none', background: 'none', fontSize: 12, fontWeight: 600, color: tabFilter");

// Sidebar List Item
content = content.replace(/padding: '16px 20px', borderBottom: '1px solid #e2e8f0', cursor: 'pointer'/g, "padding: '14px 16px', borderBottom: '1px solid #e2e8f0', cursor: 'pointer'");
content = content.replace(/fontSize: 16, fontWeight: 800/g, "fontSize: 14.5, fontWeight: 700");

// Right Pane Avatar & Header
content = content.replace(/width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '3px solid #e0e7ff'/g, "width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e0e7ff'");
content = content.replace(/width: 64, height: 64, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, border: '3px solid #e0e7ff'/g, "width: 48, height: 48, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 750, border: '2px solid #e0e7ff'");
content = content.replace(/padding: '32px 36px'/g, "padding: '24px 32px'");
content = content.replace(/fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em'/g, "fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em'");
content = content.replace(/margin: '0 0 10px', fontSize: 24, fontWeight: 800/g, "margin: '0 0 6px', fontSize: 20, fontWeight: 800"); // For the Unverified Activate Title

// Header Buttons
content = content.replace(/padding: '9px 18px', borderRadius: 10, fontSize: 13/g, "padding: '7px 14px', borderRadius: 8, fontSize: 12.5");

// Stats Cards
content = content.replace(/padding: 20, borderRadius: 12, border: '1px solid #e2e8f0'/g, "padding: 16, borderRadius: 12, border: '1px solid #e2e8f0'");
content = content.replace(/padding: 6, borderRadius: 8/g, "padding: 5, borderRadius: 8");
content = content.replace(/width="18" height="18"/g, "width=\"16\" height=\"16\"");
content = content.replace(/fontSize: 18, fontWeight: 700/g, "fontSize: 15.5, fontWeight: 750");
content = content.replace(/fontSize: 14, color: '#64748b', marginTop: 4/g, "fontSize: 13, color: '#64748b', marginTop: 3");
content = content.replace(/fontSize: 12, textTransform: 'uppercase'/g, "fontSize: 11, textTransform: 'uppercase'");
content = content.replace(/margin: '0 0 20px', fontSize: 18, fontWeight: 800/g, "margin: '0 0 16px', fontSize: 16, fontWeight: 750"); // Edit Access & Settings
content = content.replace(/marginBottom: 24/g, "marginBottom: 16");

// Form labels inside right pane
content = content.replace(/margin: '0 0 6px', fontSize: 12, fontWeight: 700/g, "margin: '0 0 4px', fontSize: 12, fontWeight: 700");
content = content.replace(/height: 44, padding: '0 14px', fontSize: 14/g, "height: 38, padding: '0 12px', fontSize: 13.5");
content = content.replace(/height: '44px', padding: '0 14px', fontSize: '14px'/g, "height: '38px', padding: '0 12px', fontSize: '13.5px'");

fs.writeFileSync(file, content, 'utf8');
