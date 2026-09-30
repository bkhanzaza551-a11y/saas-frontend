const fs = require('fs');
const content = fs.readFileSync('src/pages/owner/CustomersPage.jsx', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
    if (l.includes('showMakePartnerModal')) {
        console.log('showMakePartnerModal at:', i + 1, l.trim());
    }
    if (l.includes('showFamilyModal')) {
        console.log('showFamilyModal at:', i + 1, l.trim());
    }
    if (l.includes('showFollowUpModal')) {
        console.log('showFollowUpModal at:', i + 1, l.trim());
    }
    if (l.includes('"affiliate"')) {
        console.log('affiliate at:', i + 1, l.trim());
    }
    if (l.includes('"family"')) {
        console.log('family at:', i + 1, l.trim());
    }
    if (l.includes('"followup"')) {
        console.log('followup at:', i + 1, l.trim());
    }
});
