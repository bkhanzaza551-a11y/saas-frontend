const fs = require('fs');

const path = 'src/pages/owner/UsersPage.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex1 = /<div style={{ marginTop: 20, padding: 16, border: '1px solid #dbeafe', borderRadius: 10, background: '#f8fbff' }}>[\s\S]*?<div style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a', marginBottom: 10 }}>Owner-side Attendance Biometric<\/div>[\s\S]*?Staff can only use self check-in after owner enables attendance and captures an enrollment selfie.\s*<\/div>\s*<\/div>\s*<\/div>\s*/;

content = content.replace(regex1, '');

const regex2 = /<div style={{ marginBottom: 16, padding: 16, border: '1px solid #dbeafe', borderRadius: 10, background: '#f8fbff' }}>[\s\S]*?<div style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a', marginBottom: 10 }}>Owner-side Attendance Biometric<\/div>[\s\S]*?capture staff face for biometric enrollment<\/div>\s*<\/button>\s*\)}\s*<\/div>\s*<\/div>\s*/;

content = content.replace(regex2, '');

fs.writeFileSync(path, content, 'utf8');
