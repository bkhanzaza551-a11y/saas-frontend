const fs = require('fs');
let content = fs.readFileSync('src/pages/owner/CustomersPage.jsx', 'utf8');

// replace Affiliate effect manually
const affiliateEffectStart = content.indexOf('if (detailTab === "affiliate") {');
if (affiliateEffectStart !== -1) {
    let braceCount = 0;
    let started = false;
    let endIdx = -1;
    for (let i = affiliateEffectStart; i < content.length; i++) {
        if (content[i] === '{') {
            braceCount++;
            started = true;
        } else if (content[i] === '}') {
            braceCount--;
        }
        if (started && braceCount === 0) {
            endIdx = i;
            break;
        }
    }
    if (endIdx !== -1) {
        content = content.slice(0, affiliateEffectStart) + content.slice(endIdx + 1);
    }
}
fs.writeFileSync('src/pages/owner/CustomersPage.jsx', content, 'utf8');
console.log("Affiliate effect removed.");
