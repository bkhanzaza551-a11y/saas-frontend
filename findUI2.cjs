const fs = require('fs');
const content = fs.readFileSync('src/pages/owner/CustomersPage.jsx', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
    if (l.toLowerCase().includes('partner') && l.includes('Modal')) {
        console.log("Partner Modal line:", i + 1, l.trim());
    }
    if (l.toLowerCase().includes('family') && l.includes('Modal')) {
        console.log("Family Modal line:", i + 1, l.trim());
    }
    if (l.toLowerCase().includes('followup') && l.includes('Modal')) {
        console.log("FollowUp Modal line:", i + 1, l.trim());
    }
    if (l.includes('detailTab === "affiliate"')) {
        console.log("affiliate tab render:", i + 1, l.trim());
    }
    if (l.includes('detailTab === "family"')) {
        console.log("family tab render:", i + 1, l.trim());
    }
    if (l.includes('detailTab === "followup"')) {
        console.log("followup tab render:", i + 1, l.trim());
    }
    if (l.includes('Affiliate') || l.includes('Family') || l.includes('Follow Up')) {
        // Just print occurrences to find where they are rendered
    }
});
