const fs = require('fs');
const path = 'src/pages/owner/CustomersPage.jsx';
let js = fs.readFileSync(path, 'utf8');

// 1. Add selectedIds state
if (!js.includes('const [selectedIds, setSelectedIds] = useState([]);')) {
  js = js.replace('const [actionBusy, setActionBusy] = useState("");', 'const [actionBusy, setActionBusy] = useState("");\n  const [selectedIds, setSelectedIds] = useState([]);');
}

// 2. Replace header checkbox
const headerOld = '<th style={{ width: 40 }}><input type="checkbox" className="crm-table-checkbox" /></th>';
const headerNew = '<th style={{ width: 40 }}><input type="checkbox" className="crm-table-checkbox" checked={paginatedRows.length > 0 && selectedIds.length === paginatedRows.length} onChange={(e) => { if (e.target.checked) { setSelectedIds(paginatedRows.map(r => r.id)); } else { setSelectedIds([]); } }} /></th>';
js = js.replace(headerOld, headerNew);

// 3. Replace row checkbox
const rowOld = '<td><input type="checkbox" className="crm-table-checkbox" /></td>';
const rowNew = '<td><input type="checkbox" className="crm-table-checkbox" checked={selectedIds.includes(row.id)} onChange={(e) => { if (e.target.checked) setSelectedIds(prev => [...prev, row.id]); else setSelectedIds(prev => prev.filter(id => id !== row.id)); }} onClick={(e) => e.stopPropagation()} /></td>';
js = js.replace(rowOld, rowNew);

fs.writeFileSync(path, js, 'utf8');
console.log('CustomersPage updated');
