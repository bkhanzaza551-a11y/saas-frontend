const fs = require('fs');
const content = fs.readFileSync('src/pages/owner/CustomersPage.jsx', 'utf8');
const lines = content.split('\n');

function findBlock(startStr, endStr) {
    let startIdx = lines.findIndex(l => l.includes(startStr));
    if (startIdx === -1) return null;
    let endIdx = lines.findIndex((l, i) => i > startIdx && l.includes(endStr));
    return { start: startIdx + 1, end: endIdx + 1 };
}

console.log("affiliate effect:", findBlock('if (detailTab === "affiliate")', '    }'));
console.log("partner Modal:", findBlock('isPartnerModalVisible', 'handleMakeAffiliatePartner={handleMakeAffiliatePartner}')); // Wait, are they separate components or built-in?
console.log("family modal:", findBlock('isFamilyModalVisible', 'handleAddFamilyMember={handleAddFamilyMember}'));
console.log("followup modal:", findBlock('isFollowUpModalVisible', 'handleFollowUpSubmit={handleAddFollowUp}'));

// Find lines containing the strings
lines.forEach((l, i) => {
    if (l.includes('isPartnerModalVisible') || l.includes('isFamilyModalVisible') || l.includes('isFollowUpModalVisible')) {
        console.log("Modal found at line:", i + 1, l.trim());
    }
});

// find lines rendering tabs
lines.forEach((l, i) => {
    if (l.includes('onClick={() => setDetailTab("affiliate")}') || 
        l.includes('onClick={() => setDetailTab("family")}') || 
        l.includes('onClick={() => setDetailTab("followup")}')) {
        console.log("Tab found at line:", i + 1, l.trim());
    }
});
