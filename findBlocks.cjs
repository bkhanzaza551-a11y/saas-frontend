const fs = require('fs');
const content = fs.readFileSync('src/pages/owner/CustomersPage.jsx', 'utf8');
const lines = content.split('\n');

function findBlock(startStr) {
    let startIdx = lines.findIndex(l => l.includes(startStr));
    if (startIdx === -1) return null;
    let braceCount = 0;
    let endIdx = -1;
    let started = false;
    
    for (let i = startIdx; i < lines.length; i++) {
        let line = lines[i];
        for (let char of line) {
            if (char === '{') {
                braceCount++;
                started = true;
            } else if (char === '}') {
                braceCount--;
            }
        }
        if (started && braceCount === 0) {
            endIdx = i;
            break;
        }
    }
    return { start: startIdx + 1, end: endIdx + 1 };
}

console.log("handleMakeAffiliatePartner:", findBlock('const handleMakeAffiliatePartner = async () => {'));
console.log("handleFamilySearch:", findBlock('const handleFamilySearch = async (queryVal) => {'));
console.log("handleSelectFamilyGuest:", findBlock('const handleSelectFamilyGuest = (guest) => {'));
console.log("handleAddFamilyMember:", findBlock('const handleAddFamilyMember = async () => {'));
console.log("handleRemoveFamilyMember:", findBlock('const handleRemoveFamilyMember = async (fm) => {'));
console.log("handleAddFollowUp:", findBlock('const handleAddFollowUp = async () => {'));

