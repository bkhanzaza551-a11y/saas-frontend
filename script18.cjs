const fs = require('fs');
const file = 'src/pages/owner/AppointmentsPage.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/setServiceSearch\(""\);\s*setIsCreateModalOpen\(true\);/g, 'setServiceSearch("");\n      setGuestSearchInput("");\n      setIsCreateModalOpen(true);');

fs.writeFileSync(file, content, 'utf8');
