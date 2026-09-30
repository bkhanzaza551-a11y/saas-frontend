const fs = require('fs');
const file = 'src/pages/owner/ExpensesPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// replace local sidebar with subnav
const sidebarHTML = `<div className="expenses-subnav-bar">
        <div className="expenses-subnav-scroll">
          <button 
            className={`exp-subnav-tab ${mode === "dashboard" ? "active" : ""}`}
            onClick={() => navigate("/admin/expenses/dashboard")}
          >
            <LayoutDashboard size={16} /> Dashboard
          </button>

          <button 
            className={`exp-subnav-tab ${mode === "types" ? "active" : ""}`}
            onClick={() => navigate("/admin/expenses/types")}
          >
            <FolderKanban size={16} /> Types
          </button>

          <button 
            className={`exp-subnav-tab ${mode === "accounts" ? "active" : ""}`}
            onClick={() => navigate("/admin/expenses/accounts")}
          >
            <Wallet size={16} /> Accounts
          </button>
        </div>
      </div>`;

content = content.replace(/<div className="expenses-local-sidebar">[\s\S]*?<\/div>\s*\{\/\* ── MAIN WORKSPACE ── \*\/\}/, sidebarHTML + '\n\n      {/* ── MAIN WORKSPACE ── */}');

// replace the outer container classes
content = content.replace('<div className="expenses-page-container">', '<div className="page-shell expenses-page-shell">');
content = content.replace('.expenses-page-container {', '.expenses-page-shell {');

// remove min-height from expenses-page-shell, set background transparent, flex column
content = content.replace(/min-height: calc\(100vh - 120px\);\s*background-color: #f8fafc;/, 'background-color: transparent;\n          display: flex;\n          flex-direction: column;');

// remove width: 240px and border-right from workspace
content = content.replace('.expenses-main-workspace {\n          flex: 1;\n          padding: 24px;\n          display: flex;\n          flex-direction: column;\n          gap: 20px;\n        }', '.expenses-main-workspace {\n          flex: 1;\n          display: flex;\n          flex-direction: column;\n          gap: 20px;\n        }');

// add the css for expenses-subnav-bar
const cssToAdd = `
        .expenses-subnav-bar {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 6px;
          margin-bottom: 24px;
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);
          display: flex;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 30;
        }
        .expenses-subnav-scroll {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          width: 100%;
          scrollbar-width: none;
        }
        .expenses-subnav-scroll::-webkit-scrollbar { display: none; }
        .exp-subnav-tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 600;
          color: #64748b;
          background: transparent;
          border: 1px solid transparent;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          min-height: 34px;
        }
        .exp-subnav-tab:hover:not(.active) {
          background: #f8fafc;
          color: #0f172a;
        }
        .exp-subnav-tab.active {
          background: #f0fdfa;
          color: #0f766e;
          border-color: #99f6e4;
          font-weight: 750;
          box-shadow: 0 2px 8px rgba(15, 118, 110, 0.12);
        }
`;

content = content.replace('/* Local Sidebar Navigation */', cssToAdd + '\n        /* Local Sidebar Navigation */');

fs.writeFileSync(file, content, 'utf8');
console.log("Updated Layout");
