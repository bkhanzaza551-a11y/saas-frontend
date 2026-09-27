const fs = require('fs');
const file = 'src/pages/owner/InventoryPage.jsx';
let content = fs.readFileSync(file, 'utf8');

const target = `                    onClick={() => {
                      setProductForm(emptyProduct);
                      setIsProductModalOpen(true);
                    }}`;

const replacement = `                    onClick={() => {
                      navigate("/admin/product-categories");
                    }}`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content, 'utf8');
