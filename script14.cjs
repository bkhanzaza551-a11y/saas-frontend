const fs = require('fs');
const file = 'src/pages/owner/PosPage.jsx';
let content = fs.readFileSync(file, 'utf8');

const target = "const printWindow = window.open('', '_blank', 'width=400,height=600');";
const replacement = "const w = 400; const h = 600;\n      const left = (window.screen.width / 2) - (w / 2);\n      const top = (window.screen.height / 2) - (h / 2);\n      const printWindow = window.open('', '_blank', `width=${w},height=${h},left=${left},top=${top}`);";

content = content.replace(target, replacement);

fs.writeFileSync(file, content, 'utf8');
