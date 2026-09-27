const fs = require('fs');
const file = 'src/pages/owner/Dashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/background: "#fef3c7", color: "#d97706"/g, 'background: "#f1f5f9", color: "#475569"');

content = content.replace(/<div style=\{\{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 12, padding: "14px" \}\}>/g, '<div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px" }}>');

content = content.replace(/<div style=\{\{ fontSize: "0.72rem", fontWeight: 800, color: "#059669", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "space-between" \}\}>[\s\S]*?<span>➕ Cash Inflow \(Sales\)<\/span>[\s\S]*?<span style=\{\{ fontSize: "0.68rem", background: "#d1fae5", padding: "2px 6px", borderRadius: 10 \}\}>\{inboxSummary.countIn\} sales<\/span>[\s\S]*?<\/div>/g, 
`<div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: "#10b981", fontSize: "16px", lineHeight: 1 }}>+</span> Cash Inflow</span>
                    <span style={{ fontSize: "0.7rem", background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: 12 }}>{inboxSummary.countIn} sales</span>
                  </div>`);

content = content.replace(/<div style=\{\{ fontSize: "1.25rem", fontWeight: 800, color: "#065f46", marginTop: 6 \}\}>[\s\S]*?\+ \{formatMoney\(inboxSummary.totalIn\)\}[\s\S]*?<\/div>/g, 
`<div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", marginTop: 6 }}>
                    {formatMoney(inboxSummary.totalIn)}
                  </div>`);

content = content.replace(/<div style=\{\{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "14px" \}\}>/g, '<div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px" }}>');

content = content.replace(/<div style=\{\{ fontSize: "0.72rem", fontWeight: 800, color: "#dc2626", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "space-between" \}\}>[\s\S]*?<span>➖ Cash Outflow \(Expenses\)<\/span>[\s\S]*?<span style=\{\{ fontSize: "0.68rem", background: "#fee2e2", padding: "2px 6px", borderRadius: 10 \}\}>\{inboxSummary.countOut\} payouts<\/span>[\s\S]*?<\/div>/g, 
`<div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: "#ef4444", fontSize: "16px", lineHeight: 1 }}>-</span> Cash Outflow</span>
                    <span style={{ fontSize: "0.7rem", background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: 12 }}>{inboxSummary.countOut} payouts</span>
                  </div>`);

content = content.replace(/<div style=\{\{ fontSize: "1.25rem", fontWeight: 800, color: "#991b1b", marginTop: 6 \}\}>[\s\S]*?\- \{formatMoney\(inboxSummary.totalOut\)\}[\s\S]*?<\/div>/g, 
`<div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", marginTop: 6 }}>
                    {formatMoney(inboxSummary.totalOut)}
                  </div>`);


content = content.replace(/<div style=\{\{ background: inboxSummary\.netBalance >= 0 \? "#eff6ff" : "#fff1f2", border: `1px solid \$\{inboxSummary\.netBalance >= 0 \? "#bfdbfe" : "#fecdd3"\}`/g, 
`<div style={{ background: "#ffffff", border: "1px solid #e2e8f0"`);

content = content.replace(/<div style=\{\{ fontSize: "0.72rem", fontWeight: 800, color: inboxSummary\.netBalance >= 0 \? "#2563eb" : "#e11d48", textTransform: "uppercase" \}\}>[\s\S]*?🟰 Net In-Box Cash Balance[\s\S]*?<\/div>/g, 
`<div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    Net Cash Balance
                  </div>`);

content = content.replace(/<div style=\{\{ fontSize: "1.25rem", fontWeight: 900, color: inboxSummary\.netBalance >= 0 \? "#1e40af" : "#9f1239", marginTop: 6 \}\}>[\s\S]*?\{formatMoney\(inboxSummary\.netBalance\)\}[\s\S]*?<\/div>/g, 
`<div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#0f172a", marginTop: 6 }}>
                    {formatMoney(inboxSummary.netBalance)}
                  </div>`);

fs.writeFileSync(file, content, 'utf8');
