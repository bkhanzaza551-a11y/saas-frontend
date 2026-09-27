const fs = require('fs');
const file = 'src/pages/owner/AppointmentsPage.jsx';
let content = fs.readFileSync(file, 'utf8');

const target = `    setEditMode(false);
    setEditingAppointmentId(null);
    setForm({`;

const replacement = `    setEditMode(false);
    setEditingAppointmentId(null);
    setGuestSearchInput("");
    setGuestSearchActive(false);
    setForm({`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content, 'utf8');
