const fs = require('fs');
const file = 'src/pages/owner/ExpensesPage.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<CustomSelect/g, '<select className="filter-select"');
content = content.replace(/<\/CustomSelect>/g, '</select>');
content = content.replace(/import CustomSelect from "\.\.\/\.\.\/components\/CustomSelect";/, '');

fs.writeFileSync(file, content, 'utf8');
console.log("Updated ExpensesPage.jsx CustomSelect");
