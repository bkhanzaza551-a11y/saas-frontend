const fs = require('fs');
const file = 'src/pages/owner/Dashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const targetLoader = `                    {inboxLoading ? (
                      <div style={{ padding: "30px", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                        Loading cash ledger entries...
                      </div>
                    ) : inboxTransactions.length === 0 ? (`;

const replaceLoader = `                    {inboxLoading ? (
                      <div style={{ padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "#64748b" }}>
                        <RefreshCw size={28} className="animate-spin" color="#cbd5e1" />
                        <div style={{ fontSize: "0.85rem" }}>Loading cash ledger...</div>
                      </div>
                    ) : inboxTransactions.length === 0 ? (`;

content = content.replace(targetLoader, replaceLoader);

fs.writeFileSync(file, content, 'utf8');
