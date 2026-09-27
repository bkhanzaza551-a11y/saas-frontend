const fs = require('fs');
const file = 'src/pages/owner/Dashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const targetCards = `              {/* 3 Summary KPI Cards: Plus, Minus, Equal */}
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

const replaceCards = `              {/* 3 Summary KPI Cards: Plus, Minus, Equal */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
                {/* Cash In */}
                <div style={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: 12, padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.03em" }}>Cash Inflow</span>
                    <span style={{ fontSize: "0.68rem", background: "#f8fafc", color: "#64748b", padding: "2px 8px", borderRadius: 12, border: "1px solid #e2e8f0" }}>{inboxSummary.countIn} sales</span>
                  </div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
                    <ArrowUpRight size={20} strokeWidth={3} />
                    {formatMoney(inboxSummary.totalIn)}
                  </div>
                </div>

                {/* Cash Out */}
                <div style={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: 12, padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.03em" }}>Cash Outflow</span>
                    <span style={{ fontSize: "0.68rem", background: "#f8fafc", color: "#64748b", padding: "2px 8px", borderRadius: 12, border: "1px solid #e2e8f0" }}>{inboxSummary.countOut} payouts</span>
                  </div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ef4444", display: "flex", alignItems: "center", gap: 4 }}>
                    <ArrowDownRight size={20} strokeWidth={3} />
                    {formatMoney(inboxSummary.totalOut)}
                  </div>
                </div>

                {/* Net Balance */}
                <div style={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: 12, padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.03em" }}>Net Balance</span>
                  </div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 4 }}>
                    <Layers size={18} strokeWidth={2.5} color="#64748b" />
                    {formatMoney(inboxSummary.netBalance)}
                  </div>
                </div>
              </div>`;

content = content.replace(targetCards, replaceCards);

fs.writeFileSync(file, content, 'utf8');
