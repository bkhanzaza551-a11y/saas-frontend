const fs = require('fs');

const file = 'src/pages/owner/CustomersPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove State Declarations
content = content.replace(/const \[showMakePartnerModal[\s\S]*?setPartnerLoading\(false\);\n  }/g, '');
content = content.replace(/const \[customerAffiliateWallet[\s\S]*?setCustomerAffiliateWallet\(null\);\n/g, '');
content = content.replace(/const \[showFamilyModal[\s\S]*?setFamilySearchLoading\(false\);\n  }\n/g, '');
// Wait, regex might be too brittle. Let's use a simpler string replacement approach.

