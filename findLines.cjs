const fs = require('fs');
const content = fs.readFileSync('src/pages/owner/CustomersPage.jsx', 'utf8');
const lines = content.split('\n');

function findLine(startStr) {
    let startIdx = lines.findIndex(l => l.includes(startStr));
    if (startIdx === -1) return null;
    return startIdx + 1;
}

console.log("showMakePartnerModal:", findLine('const [showMakePartnerModal'));
console.log("partnerForm:", findLine('const [partnerForm'));
console.log("partnerLoading:", findLine('const [partnerLoading'));
console.log("customerAffiliateWallet:", findLine('const [customerAffiliateWallet'));
console.log("showFamilyModal:", findLine('const [showFamilyModal'));
console.log("familyForm:", findLine('const [familyForm'));
console.log("familyError:", findLine('const [familyError'));
console.log("familySearchQuery:", findLine('const [familySearchQuery'));
console.log("familySearchResults:", findLine('const [familySearchResults'));
console.log("familySearchLoading:", findLine('const [familySearchLoading'));
console.log("selectedFamilyGuest:", findLine('const [selectedFamilyGuest'));
console.log("showFollowUpModal:", findLine('const [showFollowUpModal'));
console.log("followUpForm:", findLine('const [followUpForm'));
console.log("detailTab == affiliate:", findLine('detailTab === "affiliate"'));
