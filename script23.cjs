const fs = require('fs');
const file = 'src/pages/owner/InventoryPage.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/onClick=\{\(\) => \{\s*setProductForm\(emptyProduct\);\s*setIsProductModalOpen\(true\);\s*\}\}/g, 'onClick={() => {\n                      navigate("/admin/product-categories?action=add");\n                    }}');

fs.writeFileSync(file, content, 'utf8');
