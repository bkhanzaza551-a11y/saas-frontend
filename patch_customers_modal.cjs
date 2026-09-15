const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'saas_Respark', 'frontend', 'src', 'pages', 'owner', 'CustomersPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add state variables
const oldStates = `const [showExportMenu, setShowExportMenu] = useState(false);`;
const newStates = `const [showExportMenu, setShowExportMenu] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [pendingExportFormat, setPendingExportFormat] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);`;

content = content.replace(oldStates, newStates);

// Update export trigger
const exportTrigger = `const handleExportClick = async (format) => {
    setShowExportMenu(false);
    setPendingExportFormat(format);
    setShowOtpModal(true);
    setOtpValue("");
    setIsSendingOtp(true);
    try {
      await api.post("/owner/customers/export/send-otp");
      setToastMessage({ type: "success", title: "OTP Sent", message: "Check your email for the verification code." });
    } catch (err) {
      setToastMessage({ type: "error", title: "Failed", message: "Could not send OTP." });
      setShowOtpModal(false);
    } finally {
      setIsSendingOtp(false);
    }
  };
  
  const verifyAndDownload = async () => {
    if (!otpValue) return setToastMessage({ type: "error", title: "Error", message: "Please enter OTP" });
    setIsVerifyingOtp(true);
    try {
      await api.post("/owner/customers/export/verify-otp", { otp: otpValue });
      setShowOtpModal(false);
      handleExport(pendingExportFormat); // The actual download function
    } catch (err) {
      setToastMessage({ type: "error", title: "Verification Failed", message: err.response?.data?.message || "Invalid OTP" });
    } finally {
      setIsVerifyingOtp(false);
    }
  };`;

content = content.replace(/const handleExport = async/, exportTrigger + '\n\n  const handleExport = async');

// Change export buttons to use handleExportClick
content = content.replace(/onClick=\{\(\) => handleExport\("xlsx"\)\}/, `onClick={() => handleExportClick("xlsx")}`);
content = content.replace(/onClick=\{\(\) => handleExport\("xls"\)\}/, `onClick={() => handleExportClick("xls")}`);
content = content.replace(/onClick=\{\(\) => handleExport\("csv"\)\}/, `onClick={() => handleExportClick("csv")}`);

// Add Modal JSX
const modalJSX = `
      {showOtpModal && (
        <div className="crm-modal-overlay">
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

content = content.replace(/(<\/[^>]+>)\s*(<\/div>\s*)$/, `$1\n${modalJSX}$2`);

// ensure Shield icon is imported
if (!content.includes('Shield')) {
    content = content.replace(/import \{([^}]+)\} from "lucide-react";/, 'import { $1, Shield } from "lucide-react";');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched CustomersPage successfully.');
