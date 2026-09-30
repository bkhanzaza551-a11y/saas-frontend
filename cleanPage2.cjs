const fs = require('fs');
let content = fs.readFileSync('src/pages/owner/CustomersPage.jsx', 'utf8');

const regexesToRemove = [
  /^[ \t]*const \[showMakePartnerModal[\s\S]*?useState\(false\);[ \t]*\r?\n/m,
  /^[ \t]*const \[partnerForm[\s\S]*?useState\(\{.*?\}\);[ \t]*\r?\n/m,
  /^[ \t]*const \[partnerLoading[\s\S]*?useState\(false\);[ \t]*\r?\n/m,
  /^[ \t]*const \[customerAffiliateWallet[\s\S]*?useState\(null\);[ \t]*\r?\n/m,
  /^[ \t]*const \[showFamilyModal[\s\S]*?useState\(false\);[ \t]*\r?\n/m,
  /^[ \t]*const \[familyForm[\s\S]*?useState\(\{.*?\}\);[ \t]*\r?\n/m,
  /^[ \t]*const \[familyError[\s\S]*?useState\(""\);[ \t]*\r?\n/m,
  /^[ \t]*const \[familySearchQuery[\s\S]*?useState\(""\);[ \t]*\r?\n/m,
  /^[ \t]*const \[familySearchResults[\s\S]*?useState\(\[\]\);[ \t]*\r?\n/m,
  /^[ \t]*const \[familySearchLoading[\s\S]*?useState\(false\);[ \t]*\r?\n/m,
  /^[ \t]*const \[selectedFamilyGuest[\s\S]*?useState\(null\);[ \t]*\r?\n/m,
  /^[ \t]*const \[showFollowUpModal[\s\S]*?useState\(false\);[ \t]*\r?\n/m,
  /^[ \t]*const \[followUpForm[\s\S]*?useState\(\{.*?\}\);[ \t]*\r?\n/m,
];

for (let r of regexesToRemove) {
    content = content.replace(r, '');
}

fs.writeFileSync('src/pages/owner/CustomersPage.jsx', content, 'utf8');
console.log("Cleanup 2 attempted.");
