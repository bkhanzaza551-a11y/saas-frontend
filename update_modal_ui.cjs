const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'saas_Respark', 'frontend', 'src', 'pages', 'owner', 'CustomersPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const oldModalRegex = /\{showOtpModal && \([\s\S]*?<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;

const newModalJSX = `{showOtpModal && (
        <div className="modal-overlay" style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(6px)", zIndex: 99999 }}>
          <div className="modal-content" style={{ width: "min(95vw, 420px)", borderRadius: 20, padding: 0, overflow: "hidden", background: "#fff", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", animation: "modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" }} onClick={(e) => e.stopPropagation()}>
            <style>{\`@keyframes modalPop { from { transform:scale(.92); opacity:0; } to { transform:scale(1); opacity:1; } }\`}</style>
            
            <div style={{ background: "linear-gradient(135deg, #6366f1, #4338ca)", padding: "32px 24px 24px", textAlign: "center", position: "relative" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
                <Shield size={32} style={{ color: "#fff" }} />
              </div>
              <div style={{ color: "#fff", fontSize: "1.35rem", fontWeight: 800, letterSpacing: "-0.01em" }}>Security Verification</div>
              <div style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.85rem", marginTop: 10, fontWeight: 500, lineHeight: 1.5 }}>
                To protect customer data, we've sent a verification code to your registered Salon email address.
              </div>
              
              <button 
                onClick={() => setShowOtpModal(false)} 
                style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", transition: "background 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              >
                <X size={18} />
              </button>
            </div>
            
            <div style={{ padding: "30px 24px" }}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>Enter 6-Digit Code</label>
                <input
                  type="text"
                  placeholder="• • • • • •"
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "16px", fontSize: 28, fontWeight: 700, textAlign: "center", letterSpacing: 12, borderRadius: 12, border: "2px solid #e2e8f0", background: "#f8fafc", color: "#0f172a", outline: "none", transition: "all 0.2s" }}
                  onFocus={(e) => { e.target.style.borderColor = "#6366f1"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 4px rgba(99,102,241,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; e.target.style.boxShadow = "none"; }}
                  disabled={isSendingOtp || isVerifyingOtp}
                />
              </div>
              <button
                style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 12px rgba(99,102,241,0.25)", transition: "transform 0.15s, box-shadow 0.15s", opacity: (!otpValue || isSendingOtp || isVerifyingOtp) ? 0.6 : 1 }}
                onMouseEnter={(e) => { if(!e.currentTarget.disabled) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(99,102,241,0.3)"; } }}
                onMouseLeave={(e) => { if(!e.currentTarget.disabled) { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(99,102,241,0.25)"; } }}
                onClick={verifyAndDownload}
                disabled={isSendingOtp || isVerifyingOtp || !otpValue}
              >
                {isSendingOtp ? "Sending OTP..." : isVerifyingOtp ? "Verifying..." : "Verify & Download"}
              </button>
            </div>
          </div>
        </div>
      )}`;

if (content.match(oldModalRegex)) {
    content = content.replace(oldModalRegex, newModalJSX);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated UI successfully!');
} else {
    console.log('Could not find old modal regex.');
}
