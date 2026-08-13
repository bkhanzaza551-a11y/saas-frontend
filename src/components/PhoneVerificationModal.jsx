import React, { useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function PhoneVerificationModal() {
  const { auth, updateAuth } = useAuth();
  const [step, setStep] = useState(1); // 1 = Send OTP, 2 = Verify OTP
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleSendOtp = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await api.post(
        "/owner/verify-phone/send",
        {},
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );
      setMessage(res.data.message || "OTP sent successfully!");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!otp || otp.length < 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(
        "/owner/verify-phone/verify",
        { otpCode: otp },
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );
      updateAuth({
        ...auth,
        user: { ...auth.user, isPhoneVerified: true }
      });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const overlayStyle = {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    backdropFilter: "blur(10px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999999
  };

  const cardStyle = {
    background: "#fff",
    padding: "40px",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "480px",
    textAlign: "center",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
  };

  const inputStyle = {
    width: "100%",
    padding: "16px",
    fontSize: "24px",
    letterSpacing: "4px",
    textAlign: "center",
    border: "2px solid #e2e8f0",
    borderRadius: "12px",
    marginBottom: "20px",
    fontWeight: "bold",
    outline: "none",
    boxSizing: "border-box"
  };

  const btnStyle = {
    width: "100%",
    padding: "16px",
    fontSize: "16px",
    fontWeight: "600",
    color: "#fff",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    border: "none",
    borderRadius: "12px",
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.7 : 1,
    transition: "transform 0.2s"
  };

  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "28px" }}>
          🔒
        </div>
        <h2 style={{ margin: "0 0 12px", fontSize: "24px", color: "#0f172a" }}>Phone Verification Required</h2>
        <p style={{ margin: "0 0 32px", fontSize: "15px", color: "#64748b", lineHeight: "1.5" }}>
          For security purposes, we need to verify your phone number before you can access the Owner Dashboard. This is a one-time process.
        </p>

        {error && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", textAlign: "left" }}>{error}</div>}
        {message && <div style={{ background: "#dcfce3", color: "#166534", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", textAlign: "left" }}>{message}</div>}

        {step === 1 ? (
          <div>
            <button style={btnStyle} onClick={handleSendOtp} disabled={loading}>
              {loading ? "Sending..." : "Send OTP via SMS"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <input
              type="text"
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              style={inputStyle}
              autoFocus
            />
            <button type="submit" style={btnStyle} disabled={loading}>
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>
            <div style={{ marginTop: 24 }}>
              <button 
                type="button" 
                onClick={handleSendOtp} 
                disabled={loading}
                style={{ background: "transparent", border: "none", color: "#3b82f6", fontWeight: "600", cursor: "pointer", fontSize: "14px" }}
              >
                Resend Code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
