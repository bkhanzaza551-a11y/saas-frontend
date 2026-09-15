const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'saas_Respark', 'frontend', 'src', 'pages', 'owner', 'CustomersPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find the {showOtpModal && ( ... )} block that I inserted
const regex = /\{showOtpModal && \([\s\S]*?<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;

const match = content.match(regex);
if (match) {
    const modalCode = match[0];
    content = content.replace(regex, ""); // remove it from the wrong place
    
    // Now insert it right before the LAST </div>\s*\);\s*\}
    const endRegex = /<\/div>\s*\);\s*\}\s*$/;
    content = content.replace(endRegex, `\n${modalCode}\n  </div>\n  );\n}`);
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Moved modal successfully.");
} else {
    console.log("Modal not found!");
}
