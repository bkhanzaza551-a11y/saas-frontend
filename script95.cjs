const fs = require('fs');
const file = 'src/pages/owner/PosPage.jsx';
let content = fs.readFileSync(file, 'utf8');

const oldOnChange = `onChange={(e) => {
                          setGuestSearchInput(e.target.value);
                          setShowCustomerDropdown(true);
                          const match = context.customers.find(c => c.name === e.target.value || c.phone === e.target.value);`;
                          
const newOnChange = `onChange={(e) => {
                          let val = e.target.value;
                          if (/^\\d+$/.test(val) && val.length > 10) val = val.slice(0, 10);
                          setGuestSearchInput(val);
                          setShowCustomerDropdown(true);
                          const match = context.customers.find(c => c.name === val || c.phone === val);`;

content = content.replace(oldOnChange, newOnChange);
fs.writeFileSync(file, content, 'utf8');
console.log("Updated PosPage input");
