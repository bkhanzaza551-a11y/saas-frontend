import fs from 'fs';

let code = fs.readFileSync('src/pages/owner/PosDashboardPage.jsx', 'utf8');

const replacement = `<button type="button" onClick={onClick} style={{ width: 32, height: 32, borderRadius: "50%", background: "#e2e8f0", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#0f172a", transition: "0.2s" }}><X size={18} strokeWidth={2.5} color="#0f172a" /></button>`;

// Helper to replace various close buttons
function replaceCloseBtn(code, searchPattern, onClickAction) {
  // It's easier to just find the line that contains the exact onClickAction and <X size=
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(onClickAction) && lines[i].includes('<X size=')) {
       // Extract the exact button string
       const btnStart = lines[i].indexOf('<button');
       const btnEnd = lines[i].indexOf('</button>') + 9;
       if (btnStart !== -1 && btnEnd !== -1) {
          const oldBtn = lines[i].substring(btnStart, btnEnd);
          lines[i] = lines[i].replace(oldBtn, replacement.replace('onClick={onClick}', `onClick={${onClickAction}}`));
       }
    }
  }
  return lines.join('\n');
}

code = replaceCloseBtn(code, "onClick={() => setShowGcModal(false)}", "() => setShowGcModal(false)");
code = replaceCloseBtn(code, "onClick={() => setShowPkgModal(false)}", "() => setShowPkgModal(false)");
code = replaceCloseBtn(code, "onClick={() => setShowMemModal(false)}", "() => setShowMemModal(false)");
code = replaceCloseBtn(code, "onClick={() => setShowDiscountModal(false)}", "() => setShowDiscountModal(false)");
code = replaceCloseBtn(code, "onClick={() => setShowApplyPkgModal(false)}", "() => setShowApplyPkgModal(false)");
code = replaceCloseBtn(code, "onClick={() => setShowApplyGcModal(false)}", "() => setShowApplyGcModal(false)");
code = replaceCloseBtn(code, "onClick={() => setShowTipModal(false)}", "() => setShowTipModal(false)");

fs.writeFileSync('src/pages/owner/PosDashboardPage.jsx', code);
console.log("Fixed all close buttons!");
