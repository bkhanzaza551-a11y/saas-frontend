const fs = require('fs');
let content = fs.readFileSync('src/pages/owner/CustomersPage.jsx', 'utf8');

// The lines to remove exactly (using string matching)

const removeBlocks = [
  // states
  'const [showMakePartnerModal, setShowMakePartnerModal] = useState(false);',
  'const [partnerForm, setPartnerForm] = useState({ discountValue: 10, partnerCreditValue: 5, title: "" });',
  'const [partnerLoading, setPartnerLoading] = useState(false);',
  'const [customerAffiliateWallet, setCustomerAffiliateWallet] = useState(null);',
  'const [showFamilyModal, setShowFamilyModal] = useState(false);',
  'const [familyForm, setFamilyForm] = useState({ name: "", phone: "", relation: "" });',
  'const [familyError, setFamilyError] = useState("");',
  'const [familySearchQuery, setFamilySearchQuery] = useState("");',
  'const [familySearchResults, setFamilySearchResults] = useState([]);',
  'const [familySearchLoading, setFamilySearchLoading] = useState(false);',
  'const [selectedFamilyGuest, setSelectedFamilyGuest] = useState(null);',
  'const [showFollowUpModal, setShowFollowUpModal] = useState(false);',
  'const [followUpForm, setFollowUpForm] = useState({ date: "", time: "", message: "", type: "email", staffUserId: "" });',
];

for (let s of removeBlocks) {
    content = content.replace(s + '\n', '');
}

// Remove exact function strings by regex matching up to their last closing brace.
// Instead of complex regex, we'll use a function that finds the block

function removeFunction(startStr) {
    const idx = content.indexOf(startStr);
    if (idx === -1) return;
    let braceCount = 0;
    let started = false;
    let endIdx = -1;
    for (let i = idx; i < content.length; i++) {
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
        content = content.slice(0, idx) + content.slice(endIdx + 1);
    }
}

removeFunction('const handleMakeAffiliatePartner = async () => {');
removeFunction('const handleFamilySearch = async (queryVal) => {');
removeFunction('const handleSelectFamilyGuest = (guest) => {');
removeFunction('const handleAddFamilyMember = async () => {');
removeFunction('const handleRemoveFamilyMember = async (fm) => {');
removeFunction('const handleAddFollowUp = async () => {');
removeFunction('const openFollowUpModal = async () => {');

// Remove Affiliate effect
content = content.replace(/if\s*\(detailTab === "affiliate"\)\s*\{[\s\S]*?catch\(\(\) => setCustomerAffiliateWallet\(null\)\);\n\s*\}/g, '');

// Now we need to remove the JSX code for the tabs and the modals.
// We can find lines that contain certain strings and remove the HTML blocks.
// Let's find the Modals.
function removeJSXBlock(startTagStr, endTagStr) {
    while (true) {
        let idx = content.indexOf(startTagStr);
        if (idx === -1) break;
        let endIdx = content.indexOf(endTagStr, idx);
        if (endIdx !== -1) {
            // Find start of line for idx
            let lineStart = content.lastIndexOf('\n', idx);
            if (lineStart === -1) lineStart = 0;
            // Find end of line for endIdx
            let lineEnd = content.indexOf('\n', endIdx + endTagStr.length);
            if (lineEnd === -1) lineEnd = content.length;
            content = content.slice(0, lineStart) + content.slice(lineEnd);
        } else {
            break;
        }
    }
}

// Modal headers might be unique
// Like `<h3>Make Affiliate Partner</h3>` or something. Let's look for `showMakePartnerModal` in conditional rendering.
// Typically it's `{showMakePartnerModal && (` or similar.
function removeConditionalBlock(condStr) {
    let idx = content.indexOf(condStr);
    if (idx === -1) return;
    let braceCount = 0;
    let started = false;
    let endIdx = -1;
    // We want to find the `{` right before or after condStr, but condStr usually starts with `{condStr && (`
    // Let's just track the `{` from the start of `{condStr`
    // Actually, `condStr` might be `{showMakePartnerModal &&`
    let startIdx = content.lastIndexOf('{', idx);
    if (startIdx === -1) startIdx = idx;
    
    for (let i = startIdx; i < content.length; i++) {
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
        content = content.slice(0, startIdx) + content.slice(endIdx + 1);
    }
}

removeConditionalBlock('{showMakePartnerModal &&');
removeConditionalBlock('{showFamilyModal &&');
removeConditionalBlock('{showFollowUpModal &&');

// Remove the Tab Buttons
function removeTabButton(tabName) {
    // looking for <button ... onClick={() => setDetailTab("affiliate")} ...> ... </button>
    // Since React can format this across lines, we can search for `setDetailTab("${tabName}")`
    let searchStr = `setDetailTab("${tabName}")`;
    let idx = content.indexOf(searchStr);
    if (idx !== -1) {
        // find `<button` before it
        let btnStart = content.lastIndexOf('<button', idx);
        // find `</button>` after it
        let btnEnd = content.indexOf('</button>', idx);
        if (btnStart !== -1 && btnEnd !== -1) {
            content = content.slice(0, btnStart) + content.slice(btnEnd + 9);
        }
    }
}

removeTabButton('affiliate');
removeTabButton('family');
removeTabButton('followup');

// Tab Contents
// Typically `{detailTab === "affiliate" && (`
removeConditionalBlock('{detailTab === "affiliate" &&');
removeConditionalBlock('{detailTab === "family" &&');
removeConditionalBlock('{detailTab === "followup" &&');

fs.writeFileSync('src/pages/owner/CustomersPage.jsx', content, 'utf8');
console.log("Cleanup attempted.");
