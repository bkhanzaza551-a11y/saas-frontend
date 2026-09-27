const fs = require('fs');
const file = 'src/pages/owner/Dashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<div style=\{\{ background: "#ecfdf5", border: "1px solid #a7f3d0"[\s\S]*?<\/div>\s*<\/div>/g, 
`                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: "#10b981", fontSize: "16px", lineHeight: 1 }}>+</span> Cash Inflow</span>
                      <span style={{ fontSize: "0.7rem", background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: 12 }}>{inboxSummary.countIn} sales</span>
                    </div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", marginTop: 6 }}>
                      {formatMoney(inboxSummary.totalIn)}
                    </div>
                  </div>`);

content = content.replace(/<div style=\{\{ background: "#fef2f2", border: "1px solid #fecaca"[\s\S]*?<\/div>\s*<\/div>/g, 
`                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: "#ef4444", fontSize: "16px", lineHeight: 1 }}>-</span> Cash Outflow</span>
                      <span style={{ fontSize: "0.7rem", background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: 12 }}>{inboxSummary.countOut} payouts</span>
                    </div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", marginTop: 6 }}>
                      {formatMoney(inboxSummary.totalOut)}
                    </div>
                  </div>`);

content = content.replace(/<div style=\{\{ background: inboxSummary\.netBalance >= 0 \? "#eff6ff" : "#fff1f2"[\s\S]*?<\/div>\s*<\/div>/g, 
`                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      Net Cash Balance
                    </div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#0f172a", marginTop: 6 }}>
                      {formatMoney(inboxSummary.netBalance)}
                    </div>
                  </div>`);

content = content.replace(/background: "#fef3c7", color: "#d97706"/g, 'background: "#f1f5f9", color: "#475569"');

fs.writeFileSync(file, content, 'utf8');
