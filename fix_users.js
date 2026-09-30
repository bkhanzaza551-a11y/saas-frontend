const fs = require('fs');
let c = fs.readFileSync('src/pages/owner/UsersPage.jsx', 'utf8');

const target1 =                 <div>
                  <div style={{ fontSize: 15, fontWeight: 750, color: "#0f172a", letterSpacing: "-0.01em" }}>
                    Activate {unverifiedTargetSlot?.salonRole === "MANAGER" ? "Salon Manager" : "Staff Member"};

const replacement1 =                 <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid #bfdbfe" }}>
                    <Shield size={22} strokeWidth={2} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 750, color: "#0f172a", letterSpacing: "-0.01em" }}>
                      Activate {unverifiedTargetSlot?.salonRole === "MANAGER" ? "Salon Manager" : "Staff Member"};

c = c.replace(target1, replacement1);

const target2 =               <button
                type="button"
                onClick={() => { setUnverifiedModalOpen(false); setStatus((c) => ({ ...c, error: "" })); }}
                style={{ background: "white", border: "1px solid #e2e8f0", cursor: "pointer", color: "#64748b", width: 32, height: 32, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}
              >
                <X size={18} />
              </button>;

const replacement2Fixed =               <button
                type="button"
                onClick={() => { setUnverifiedModalOpen(false); setStatus((c) => ({ ...c, error: "" })); }}
                style={{ background: "white", border: "1px solid #e2e8f0", cursor: "pointer", color: "#64748b", width: 32, height: 32, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", flexShrink: 0, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
              >
                <X size={18} />
              </button>;

c = c.replace(target2, replacement2Fixed);

fs.writeFileSync('src/pages/owner/UsersPage.jsx', c);
