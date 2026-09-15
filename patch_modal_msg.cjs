const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'saas_Respark', 'frontend', 'src', 'pages', 'owner', 'CustomersPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "we've sent a verification code to your email address.",
  "we've sent a verification code to your registered Salon email address."
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched frontend message');
