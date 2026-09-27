const fs = require('fs');
const file = 'src/pages/owner/Dashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\{inboxLoading \? \([\s\S]*?Loading cash ledger entries...[\s\S]*?<\/div>\s*\) : inboxTransactions\.length === 0 \? \(/g, 
`                    {inboxLoading ? (
                      <div style={{ padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "#64748b" }}>
                        <RefreshCw size={28} className="animate-spin" color="#cbd5e1" />
                        <div style={{ fontSize: "0.85rem" }}>Loading cash ledger...</div>
                      </div>
                    ) : inboxTransactions.length === 0 ? (`);

fs.writeFileSync(file, content, 'utf8');
