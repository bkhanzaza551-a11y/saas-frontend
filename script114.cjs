const fs = require('fs');
const file = 'src/pages/owner/MembershipsPage.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('{ label: "Customer List", to: "/admin/customers", hint: "Back" }', '{ label: "Customer List", to: "/admin/customers" }');
content = content.replace(/\{ label: "History View", to: `\/admin\/customers\/\$\{customerId\}\/history`, hint: "Profile" \}/, '{ label: "History View", to: `/admin/customers/${customerId}/history` }');
content = content.replace(/\{ label: "Memberships", to: `\/admin\/customers\/\$\{customerId\}\/memberships`, hint: "Loyalty" \}/, '{ label: "Memberships", to: `/admin/customers/${customerId}/memberships` }');
content = content.replace(/\{ label: "Packages", to: `\/admin\/customers\/\$\{customerId\}\/packages`, hint: "Prepaid" \}/, '{ label: "Packages", to: `/admin/customers/${customerId}/packages` }');

fs.writeFileSync(file, content, 'utf8');
console.log("Updated Customer Tabs in MembershipsPage.jsx");
