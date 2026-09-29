const fs = require('fs');
const file = 'src/pages/owner/ManagePage.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  '{ title: "POS Dashboard", description: "Point of sale metrics and terminal management.", to: "/admin/pos-dashboard", icon: Monitor, reqPerm: "pos", reqFlag: "pos" },',
  '// { title: "POS Dashboard", description: "Point of sale metrics and terminal management.", to: "/admin/pos-dashboard", icon: Monitor, reqPerm: "pos", reqFlag: "pos" },'
);
fs.writeFileSync(file, content, 'utf8');
console.log("Updated ManagePage");
