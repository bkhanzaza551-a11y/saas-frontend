const fs = require('fs');
const file = 'src/pages/owner/ReportsHubPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace sidebar content
const newSidebar = `
          <div style={{ flex: 1, paddingTop: 4 }}>
            {(() => {
              const uniqueGroups = [...new Set(ALL_REPORTS.map(r => r.group))];
              return uniqueGroups.map((groupName) => (
                <button
                  key={groupName}
                  type="button"
                  className={\`rpt-nav-item \${activeGroup === groupName ? "active" : ""}\`}
                  onClick={() => { setActiveGroup(groupName); setSearch(""); }}
                  style={{ fontWeight: 600, padding: "14px 16px", fontSize: "0.85rem" }}
                >
                  {groupName}
                </button>
              ));
            })()}
          </div>
`;

content = content.replace(/<div style={{ flex: 1, paddingTop: 4 }}>[\s\S]*?\}\(\)\)}[\s\S]*?<\/div>/, newSidebar);

// Add inner tabs before topbar
const newTabs = `
        <div id="printable-report" className="rpt-main">
          <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 14px", display: "flex", gap: "4px", overflowX: "auto", scrollbarWidth: "none" }} className="no-print">
            {ALL_REPORTS.filter(r => r.group === activeGroup && (!search || r.label.toLowerCase().includes(search.toLowerCase()))).map(report => (
              <button
                key={report.key}
                onClick={() => setActiveReport(report.key)}
                style={{
                  background: "transparent",
                  border: "none",
                  borderBottom: activeReport === report.key ? "3px solid #0f766e" : "3px solid transparent",
                  padding: "12px 16px",
                  fontSize: "0.85rem",
                  fontWeight: activeReport === report.key ? 700 : 500,
                  color: activeReport === report.key ? "#0f766e" : "#64748b",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s"
                }}
              >
                {report.label}
              </button>
            ))}
          </div>
`;

content = content.replace('<div id="printable-report" className="rpt-main">', newTabs);

fs.writeFileSync(file, content, 'utf8');
console.log("Updated Sidebar and Tabs");
