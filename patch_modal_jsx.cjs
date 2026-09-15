const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'saas_Respark', 'frontend', 'src', 'pages', 'owner', 'CustomersPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const modalJSX = `
      {showOtpModal && (
        <div className="crm-modal-overlay" style={{ zIndex: 9999 }}>
          <div className="crm-modal" style={{ maxWidth: 400 }}>
            <div className="crm-modal-header">
              <h3>Security Verification</h3>
              <button className="close-btn" onClick={() => setShowOtpModal(false)}><X size={20} /></button>
            </div>
            <div className="crm-modal-content" style={{ textAlign: "center", padding: "20px" }}>
              <Shield size={48} color="#6366f1" style={{ marginBottom: 15 }} />
              <p style={{ marginBottom: 20, color: "#475569" }}>
                To protect customer data, we've sent a verification code to your email address. Please enter it below to download the export.
              </p>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value)}
                style={{ width: "100%", padding: "10px", fontSize: 16, textAlign: "center", letterSpacing: 4, borderRadius: 8, border: "1px solid #cbd5e1", marginBottom: 20 }}
                disabled={isSendingOtp || isVerifyingOtp}
              />
              <button
                className="crm-btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={verifyAndDownload}
                disabled={isSendingOtp || isVerifyingOtp || !otpValue}
              >
                {isSendingOtp ? "Sending OTP..." : isVerifyingOtp ? "Verifying..." : "Verify & Download"}
              </button>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(/    <\/div>\s*\);\s*\}/, `${modalJSX}    </div>\n  );\n}`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched modal JSX');
