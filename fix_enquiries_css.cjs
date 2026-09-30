const fs = require('fs');
let c = fs.readFileSync('src/pages/owner/EnquiriesPage.jsx', 'utf8');

const oldCss1 = \.eq-card { background: white; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04); }\;
const newCss1 = \.eq-card { background: white; border-radius: 16px; padding: 28px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03); }\;
c = c.replace(oldCss1, newCss1);

const oldCss2 = \.eq-input { width: 100%; height: 40px; padding: 0 14px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; color: #0f172a; outline: none; transition: all 0.15s ease; background: #fff; box-sizing: border-box; }
        .eq-input:focus { border-color: #4f46e5; box-shadow: 0 0 0 1px #4f46e5; }
        .eq-label { display: flex; flex-direction: row; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }\;
const newCss2 = \.eq-input { width: 100%; height: 44px; padding: 0 16px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 14px; color: #0f172a; outline: none; transition: all 0.2s ease; background: #f8fafc; box-sizing: border-box; }
        .eq-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15); background: #ffffff; }
        .eq-label { display: flex; flex-direction: row; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 700; color: #475569; margin-bottom: 8px; letter-spacing: 0.2px; }\;
c = c.replace(oldCss2, newCss2);

const oldCss3 = \.quick-chip-btn {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-size: 11.5px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .quick-chip-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #0f172a;
        }\;
const newCss3 = \.quick-chip-btn {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-size: 13px;
          font-weight: 500;
          padding: 6px 14px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
        }
        .quick-chip-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          transform: translateY(-1px);
        }\;
c = c.replace(oldCss3, newCss3);

// Replace button style
c = c.replace(
  \style={{ background: "#0f172a", color: "#ffffff", height: 38, padding: "0 20px", fontWeight: 700, borderRadius: 8, boxShadow: "0 1px 3px rgba(15, 23, 42, 0.2)" }}\,
  \style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", color: "#ffffff", height: 44, padding: "0 24px", fontWeight: 600, borderRadius: 10, boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -2px rgba(37, 99, 235, 0.1)", fontSize: "14px", border: "none" }}\
);

// Replace textarea style
c = c.replace(
  \style={{ height: 80, padding: "10px 12px", lineHeight: 1.45, borderRadius: 8 }}\,
  \style={{ height: 100, padding: "14px 16px", lineHeight: 1.5, borderRadius: 10, resize: "vertical" }}\
);

fs.writeFileSync('src/pages/owner/EnquiriesPage.jsx', c);
