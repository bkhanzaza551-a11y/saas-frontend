const fs = require('fs');
let content = fs.readFileSync('src/pages/owner/PosPage.jsx', 'utf8');

content = content.replace('import { CheckCircle2, AlertCircle, AlarmClock, Gift, Droplet, X, FlaskConical, Plus } from "lucide-react";', 'import { CheckCircle2, AlertCircle, AlarmClock, Gift, Droplet, X, FlaskConical, Plus, Search } from "lucide-react";');

content = content.replace(/zIndex:9000/g, 'zIndex: 11000');

content = content.replace(/🔍/g, '<Search size={16} />');

content = content.replace(/&#x2715;/g, '<X size={20} />');

content = content.replace('width:240', 'width:200');
content = content.replace('padding:"10px 14px", paddingRight:36', 'padding:"8px 12px", paddingRight:32');

content = content.replace('width:36, height:36', 'width:32, height:32');
content = content.replace('fontSize:"1.2rem"', 'fontSize:"1rem"');

content = content.replace('padding:"12px 28px", background:"#fff", border:"1px solid #cbd5e1", borderRadius:8, fontWeight:700, cursor:"pointer", color:"#475569", fontSize: "0.95rem"', 'padding:"8px 20px", background:"#fff", border:"1px solid #cbd5e1", borderRadius:6, fontWeight:600, cursor:"pointer", color:"#475569", fontSize: "0.85rem"');

content = content.replace('padding:"12px 28px", background:"#10b981", color:"#fff", border:"none", borderRadius:8, fontWeight:800, cursor:(pkgDraftCanSubmit && !submittingPkg)?"pointer":"not-allowed", opacity:(pkgDraftCanSubmit && !submittingPkg)?1:0.6, fontSize: "0.95rem"', 'padding:"8px 20px", background:"#10b981", color:"#fff", border:"none", borderRadius:6, fontWeight:700, cursor:(pkgDraftCanSubmit && !submittingPkg)?"pointer":"not-allowed", opacity:(pkgDraftCanSubmit && !submittingPkg)?1:0.6, fontSize: "0.85rem"');

fs.writeFileSync('src/pages/owner/PosPage.jsx', content);
console.log('Fixed PosPage.jsx');
