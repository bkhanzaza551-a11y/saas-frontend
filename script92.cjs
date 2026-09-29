const fs = require('fs');
const path = require('path');
const dir = 'src/pages/owner';

function processDir(dirPath) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const oldStyle1 = `padding: 6, borderRadius: "50%", display: "flex"`;
      const newStyle1 = `width: 30, height: 30, borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", padding: 0`;
      
      const oldStyle2 = `padding: "6px", borderRadius: "50%", display: "flex"`;
      const newStyle2 = `width: 30, height: 30, borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", padding: 0`;

      if (content.includes(oldStyle1) || content.includes(oldStyle2)) {
        content = content.replace(/padding:\s*6,\s*borderRadius:\s*"50%",\s*display:\s*"flex"/g, newStyle1);
        content = content.replace(/padding:\s*"6px",\s*borderRadius:\s*"50%",\s*display:\s*"flex"/g, newStyle1);
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log("Updated", fullPath);
      }
    }
  }
}
processDir(dir);
