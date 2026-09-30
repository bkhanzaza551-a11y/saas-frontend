const fs = require('fs');
const content = fs.readFileSync('src/pages/owner/CustomersPage.jsx', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
    if (l.includes('Affiliate') || l.includes('Family') || l.includes('Follow Up') || l.includes('FollowUp') || l.includes('family')) {
        console.log(i + 1, l.trim());
    }
});
