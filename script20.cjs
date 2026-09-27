const fs = require('fs');
const file = 'src/pages/owner/AppointmentsPage.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("setEditMode(false);\n    setEditingAppointmentId(null);", "setEditMode(false);\n    setEditingAppointmentId(null);\n    setGuestSearchInput(\"\");");

fs.writeFileSync(file, content, 'utf8');
