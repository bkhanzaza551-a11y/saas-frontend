const fs = require('fs');
const file = 'src/pages/owner/Dashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const oldIcon = `<div style={{ width: 38, height: 38, borderRadius: 10, background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>`;
const newIcon = `<div style={{ width: 38, height: 38, borderRadius: 10, background: "#f1f5f9", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center" }}>`;
content = content.replace(oldIcon, newIcon);

const targetGrid = `              {/* 3 Summary KPI Cards: Plus, Minus, Equal */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
                {/* Cash In (+) */}
                <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 12, padding: "14px" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#059669", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>➕ Cash Inflow (Sales)</span>
                    <span style={{ fontSize: "0.68rem", background: "#d1fae5", padding: "2px 6px", borderRadius: 10 }}>{inboxSummary.countIn} sales</span>
                  </div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#065f46", marginTop: 6 }}>
                    + {formatMoney(inboxSummary.totalIn)}
                  </div>
                </div>

                {/* Cash Out (-) */}
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "14px" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#dc2626", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>➖ Cash Outflow (Expenses)</span>
                    <span style={{ fontSize: "0.68rem", background: "#fee2e2", padding: "2px 6px", borderRadius: 10 }}>{inboxSummary.countOut} payouts</span>
                  </div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#991b1b", marginTop: 6 }}>
                    - {formatMoney(inboxSummary.totalOut)}
                  </div>
                </div>

                {/* Net In-Box Balance (=) */}
                <div style={{ background: inboxSummary.netBalance >= 0 ? "#eff6ff" : "#fff1f2", border: \`1px solid \${inboxSummary.netBalance >= 0 ? "#bfdbfe" : "#fecdd3"}\`, borderRadius: 12, padding: "14px" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 800, color: inboxSummary.netBalance >= 0 ? "#2563eb" : "#e11d48", textTransform: "uppercase" }}>
                    🟰 Net In-Box Cash Balance
                  </div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 900, color: inboxSummary.netBalance >= 0 ? "#1e40af" : "#9f1239", marginTop: 6 }}>
                    {formatMoney(inboxSummary.netBalance)}
                  </div>
                </div>
              </div>`;

const replaceGrid = `              {/* 3 Summary KPI Cards: Plus, Minus, Equal */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
                {/* Cash In (+) */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: "#10b981", fontSize: "16px", lineHeight: 1 }}>+</span> Cash Inflow</span>
                    <span style={{ fontSize: "0.7rem", background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: 12 }}>{inboxSummary.countIn} sales</span>
                  </div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", marginTop: 6 }}>
                    {formatMoney(inboxSummary.totalIn)}
                  </div>
                </div>

                {/* Cash Out (-) */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: "#ef4444", fontSize: "16px", lineHeight: 1 }}>-</span> Cash Outflow</span>
                    <span style={{ fontSize: "0.7rem", background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: 12 }}>{inboxSummary.countOut} payouts</span>
                  </div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", marginTop: 6 }}>
                    {formatMoney(inboxSummary.totalOut)}
                  </div>
                </div>

                {/* Net In-Box Balance (=) */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    Net Cash Balance
                  </div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#0f172a", marginTop: 6 }}>
                    {formatMoney(inboxSummary.netBalance)}
                  </div>
                </div>
              </div>`;

content = content.replace(targetGrid, replaceGrid);

fs.writeFileSync(file, content, 'utf8');
