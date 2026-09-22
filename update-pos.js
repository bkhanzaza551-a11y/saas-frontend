const fs = require('fs');
const path = 'src/pages/owner/PosPage.jsx';
let js = fs.readFileSync(path, 'utf8');

if (!js.includes('const [mobileTab, setMobileTab] = useState("catalog");')) {
  js = js.replace('const [tab, setTab] = useState("billing");', 'const [tab, setTab] = useState("billing");\n  const [mobileTab, setMobileTab] = useState("catalog");');
}

const posBodyStr = '<div className="pos-body">';
if (js.includes(posBodyStr) && !js.includes('className="pos-mobile-tabs"')) {
  const tabsHtml = 
        {/* Mobile Tabs Header */}
        <div className="pos-mobile-tabs">
          <button type="button" className={\pos-mobile-tab-btn \\} onClick={() => setMobileTab("catalog")}>
            <div>??? Catalog</div>
            <span>Services</span>
          </button>
          <button type="button" className={\pos-mobile-tab-btn \\} onClick={() => setMobileTab("cart")}>
            <div>?? Current Bill</div>
            <span>{form.items.length} items</span>
          </button>
        </div>
  ;
  js = js.replace(posBodyStr, posBodyStr + tabsHtml);
}

if (js.includes('<div className="pos-sidebar">')) {
  js = js.replace('<div className="pos-sidebar">', '<div className={\pos-sidebar \\}>');
}
if (js.includes('<div className="pos-main">')) {
  js = js.replace('<div className="pos-main">', '<div className={\pos-main \\}>');
}

const oldGridStart = '<div style={{ display: "flex", flexWrap: "wrap", gap: "16px", padding:"8px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px", fontSize: "12px", color: "#334155" }}>';
if (js.includes(oldGridStart)) {
  js = js.replaceAll(oldGridStart, '<div className="pos-catalog-group" style={{ display: "flex", flexWrap: "wrap", gap: "16px", padding:"8px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px", fontSize: "12px", color: "#334155" }}>');
}

// ensure we also replace other grids where products or packages might be mapped, let's just do pos-catalog-group where needed:
// Wait, the products grid:
const oldProductGrid = '<div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>';
if (js.includes(oldProductGrid)) {
  js = js.replaceAll(oldProductGrid, '<div className="pos-catalog-group" style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>');
}

fs.writeFileSync(path, js, 'utf8');
console.log('PosPage updated');
