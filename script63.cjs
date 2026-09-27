const fs = require('fs');
const file = 'src/components/DigitOtpInput.jsx';
let content = fs.readFileSync(file, 'utf8');
console.log(content.substring(content.indexOf('return (')));
