const fs = require('fs');
const file = 'src/pages/owner/AppointmentsPage.jsx';
let content = fs.readFileSync(file, 'utf8');

const target = `      setServiceSearch("");
      setIsCreateModalOpen(true);`;

const replacement = `      setServiceSearch("");
      setGuestSearchInput("");
      setIsCreateModalOpen(true);`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content, 'utf8');
