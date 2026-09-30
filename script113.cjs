const fs = require('fs');
const file = 'src/pages/owner/MembershipsPage.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('{ label: "Membership Plans", to: "/admin/memberships", hint: "Recurring" }', '{ label: "Membership Plans", to: "/admin/memberships" }');
content = content.replace('{ label: "Packages", to: "/admin/packages", hint: "Prepaid" }', '{ label: "Packages", to: "/admin/packages" }');

fs.writeFileSync(file, content, 'utf8');
console.log("Updated MembershipsPage.jsx");
