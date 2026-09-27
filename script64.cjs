const fs = require('fs');
const file = 'src/components/DigitOtpInput.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /style=\{\{\s*width: "48px",\s*height: "54px",\s*minHeight: "54px",\s*textAlign: "center",\s*fontSize: "22px",\s*fontWeight: "800",/g;

const replacement = `style={{
              flex: 1,
              maxWidth: "54px",
              height: "56px",
              minWidth: 0,
              padding: 0,
              textAlign: "center",
              fontSize: "24px",
              fontWeight: "700",`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content, 'utf8');
