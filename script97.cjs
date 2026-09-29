const fs = require('fs');
const file = 'src/pages/owner/PosPage.jsx';
let content = fs.readFileSync(file, 'utf8');

const oldPromise = `const [contextResponse, closingResponse, catRes] = await Promise.all([
          api.get("/owner/pos/context", { params }),
          api.get("/owner/pos/day-closing", { params: branchId ? { branchId } : {} }),
          api.get("/owner/service-categories", { params: branchId ? { branchId } : {} })
        ]);`;

const newPromise = `const [contextResponse, closingResponse, catRes] = await Promise.all([
          api.get("/owner/pos/context", { params }),
          api.get("/owner/pos/day-closing", { params: branchId ? { branchId } : {} }).catch(() => ({ data: {} })),
          api.get("/owner/service-categories", { params: branchId ? { branchId } : {} }).catch(() => ({ data: [] }))
        ]);`;

content = content.replace(oldPromise, newPromise);
fs.writeFileSync(file, content, 'utf8');
console.log("Updated PosPage promises");
