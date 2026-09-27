const fs = require('fs');
const file = 'src/pages/owner/UsersPage.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/background: isActive \? \(isUnverified \? '#fffbeb' : '#f1f5f9'\) : \(isUnverified \? '#fffdf7' : 'white'\),/g, "background: isActive ? '#f1f5f9' : 'white',");
content = content.replace(/borderLeft: isActive \? '3px solid #2563eb' : \(isUnverified \? '3px solid #d97706' : '3px solid transparent'\)/g, "borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent'");

content = content.replace(/background: '#fef3c7', color: '#b45309', padding: '2px 6px'/g, "background: '#f1f5f9', color: '#64748b', padding: '2px 6px'");
content = content.replace(/background: '#fef3c7', color: '#b45309', padding: '2px 7px', borderRadius: 4, fontWeight: 800, border: '1px solid #fde68a'/g, "background: '#f1f5f9', color: '#475569', padding: '2px 7px', borderRadius: 4, fontWeight: 800, border: '1px solid #e2e8f0'");
content = content.replace(/color: '#b45309', display: 'flex'/g, "color: '#64748b', display: 'flex'");

content = content.replace(/color: isUnverified \? '#b45309' : '#0f172a'/g, "color: '#0f172a'");
content = content.replace(/color: isUnverified \? '#d97706' : '#64748b'/g, "color: '#64748b'");
content = content.replace(/color: isUnverified \? '#d97706' : '#94a3b8'/g, "color: isUnverified ? '#2563eb' : '#94a3b8'");
content = content.replace(/borderLeft: isUnverified \? \(isActive \? '4px solid #d97706' : '4px solid #fcd34d'\)/g, "borderLeft: isUnverified ? (isActive ? '4px solid #2563eb' : '4px solid #bfdbfe')");

content = content.replace(/<span style=\{\{ fontSize: 11, background: '#fef3c7', color: '#b45309', padding: '3px 10px', borderRadius: 20, fontWeight: 800, border: '1px solid #fde68a' \}\}>UNVERIFIED SLOT<\/span>/g, "<span style={{ fontSize: 11, background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: 20, fontWeight: 800, border: '1px solid #e2e8f0' }}>UNVERIFIED SLOT</span>");

content = content.replace(/background: selectedRow\.isUnverifiedPlaceholder \? '#fef3c7' : '#eff6ff'/g, "background: '#eff6ff'");
content = content.replace(/color: selectedRow\.isUnverifiedPlaceholder \? '#d97706' : '#2563eb'/g, "color: '#2563eb'");
content = content.replace(/border: selectedRow\.isUnverifiedPlaceholder \? '3px solid #fde68a' : '3px solid #e0e7ff'/g, "border: '3px solid #e0e7ff'");

content = content.replace(/background: 'linear-gradient\\(135deg, #d97706 0%, #b45309 100%\\)', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba\\(217, 119, 6, 0.25\\)'/g, "background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'");

content = content.replace(/border: '1\.5px solid #fde68a', overflow: 'hidden', boxShadow: '0 10px 30px rgba\\(217, 119, 6, 0\.08\\)'/g, "border: '1.5px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)'");

content = content.replace(/background: 'linear-gradient\\(135deg, #fffbeb 0%, #fef3c7 100%\\)', padding: '32px 36px', borderBottom: '1px solid #fde68a'/g, "background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '32px 36px', borderBottom: '1px solid #e2e8f0'");

content = content.replace(/<span style=\{\{ fontSize: 11, background: '#d97706', color: '#ffffff', padding: '3px 10px', borderRadius: 20, fontWeight: 800, letterSpacing: '0\.05em' \}\}>/g, "<span style={{ fontSize: 11, background: '#334155', color: '#ffffff', padding: '3px 10px', borderRadius: 20, fontWeight: 800, letterSpacing: '0.05em' }}>");
content = content.replace(/<span style=\{\{ fontSize: 11, background: '#ffffff', color: '#92400e', border: '1px solid #fcd34d'/g, "<span style={{ fontSize: 11, background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1'");

content = content.replace(/fontWeight: 800, color: '#78350f', letterSpacing: '-0\.02em'/g, "fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em'");
content = content.replace(/fontSize: 14\.5, color: '#92400e', lineHeight: 1\.6/g, "fontSize: 14.5, color: '#475569', lineHeight: 1.6");

content = content.replace(/background: "linear-gradient\\(135deg, #d97706 0%, #b45309 100%\\)"/g, "background: \\\"linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)\\\"");
content = content.replace(/boxShadow: "0 4px 14px rgba\\(217, 119, 6, 0\.3\\)"/g, "boxShadow: \\\"0 4px 14px rgba(37, 99, 235, 0.3)\\\"");

content = content.replace(/border: '1\.5px dashed #d97706'/g, "border: '1.5px dashed #2563eb'");
content = content.replace(/background: 'linear-gradient\\(135deg, #d97706 0%, #b45309 100%\\)',\s*color: 'white',\s*fontSize: 14,/g, "background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',\n                            color: 'white',\n                            fontSize: 14,");

content = content.replace(/background: '#fef3c7', color: '#92400e', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 12, border: '1px solid #fde68a'/g, "background: '#f1f5f9', color: '#475569', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 12, border: '1px solid #e2e8f0'");
content = content.replace(/background: 'linear-gradient\\(135deg, #fef9c3, #fef3c7\\)', padding: 20, borderRadius: 12, border: '1px solid #fde68a'/g, "background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0'");
content = content.replace(/background: '#fef3c7', padding: 6, borderRadius: 8, color: '#d97706'/g, "background: '#e0e7ff', padding: 6, borderRadius: 8, color: '#2563eb'");
content = content.replace(/color: '#92400e', fontWeight: 700, letterSpacing: '0\.05em' \}\}>Joining Date/g, "color: '#334155', fontWeight: 700, letterSpacing: '0.05em' }}>Joining Date");

content = content.replace(/background: '#fffbeb', border: '1px solid #fde68a'/g, "background: '#f8fafc', border: '1px solid #e2e8f0'");
content = content.replace(/background: '#fef3c7', color: '#d97706', display: 'flex'/g, "background: '#e0e7ff', color: '#2563eb', display: 'flex'");
content = content.replace(/background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px'/g, "background: '#e0e7ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px'");

content = content.replace(/brandColor="#d97706"/g, "brandColor=\"#2563eb\"");
content = content.replace(/color: '#d97706' \}\}>Resend in/g, "color: '#2563eb' }}>Resend in");
content = content.replace(/color: '#d97706', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline'/g, "color: '#2563eb', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline'");

content = content.replace(/background: \(\!unverifiedForm\.otpCode \|\| unverifiedForm\.otpCode\.length < 6\) \? '#94a3b8' : "linear-gradient\\(135deg, #d97706 0%, #b45309 100%\\)"/g, "background: (!unverifiedForm.otpCode || unverifiedForm.otpCode.length < 6) ? '#94a3b8' : \\\"linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)\\\"");

fs.writeFileSync(file, content, 'utf8');
