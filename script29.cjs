const fs = require('fs');
const file = 'src/pages/owner/Dashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("Daily Cash Inflows (+) & Expenses Outflow (-)", "Daily Cash Inflows & Expenses Outflow");
content = content.replace("Record Petty Cash Outflow (-)", "Record Petty Cash Outflow");

fs.writeFileSync(file, content, 'utf8');
