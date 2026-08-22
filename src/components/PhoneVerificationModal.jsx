import React, { useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, Phone, KeyRound, Loader, AlertCircle, ArrowLeft } from "lucide-react";

export default function PhoneVerificationModal() {
  const { auth, logout } = useAuth();
  const [step, setStep] = useState(1); // 1 = Enter/Confirm Phone -> Send OTP, 2 = Verify OTP
  const [phone, setPhone] = useState(auth?.membership?.phone || "");
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

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!phone || phone.trim().length < 8) {
      setError("Please enter a valid mobile number with country code (e.g. +91 9876543210)");
      return;
    }
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await api.post(
        "/owner/verify-phone/send",
        { phone: phone.trim() },
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );
      let successMsg = res.data.message || "OTP code sent successfully!";
      if (res.data.channel) {
        const channelLabel = res.data.channel === "whatsapp" ? "WhatsApp" : "SMS";
        successMsg = `OTP sent via ${channelLabel}!`;
      }
      if (res.data.otpCode) {
        successMsg += ` (Code: ${res.data.otpCode})`;
      }
      setMessage(successMsg);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!otp || otp.trim().length < 6) {
      setError("Please enter the complete 6-digit OTP code.");
      return;
    }
    setLoading(true);
    try {
      await api.post(
        "/owner/verify-phone/verify",
        { otpCode: otp.trim() },
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );
      // Update session in storage & state
      const stored = JSON.parse(localStorage.getItem("salonnest_auth") || "{}");
      if (stored?.user) {
        stored.user.isPhoneVerified = true;
        localStorage.setItem("salonnest_auth", JSON.stringify(stored));
      }
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP. Please check the code and retry.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    setError("");
    try {
      await api.post(
        "/owner/verify-phone/skip",
        {},
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );
      sessionStorage.setItem("salonnest_phone_verify_skipped", "true");
      const stored = JSON.parse(localStorage.getItem("salonnest_auth") || "{}");
      if (stored?.user) {
        stored.user.isPhoneVerified = false;
        stored.user.phoneVerificationSkipped = true;
        localStorage.setItem("salonnest_auth", JSON.stringify(stored));
      }
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || "Mobile verification is mandatory on this platform.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.85)",
      backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 999999, padding: "20px"
    }}>
      <div style={{
        background: "#ffffff",
        padding: "36px 32px",
        borderRadius: "20px",
        width: "100%",
        maxWidth: "460px",
        textAlign: "center",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        position: "relative"
      }}>
        {/* Icon */}
        <div style={{
          width: 60, height: 60, borderRadius: "50%",
          background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
          color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
          border: "2px solid #c7d2fe"
        }}>
          {step === 1 ? <Phone size={28} /> : <KeyRound size={28} />}
        </div>

        <h2 style={{ margin: "0 0 8px", fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>
          {step === 1 ? "Link & Verify Mobile Number" : "Enter Verification Code"}
        </h2>
        <p style={{ margin: "0 0 24px", fontSize: "14px", color: "#64748b", lineHeight: "1.5" }}>
          {step === 1
            ? "Enter your mobile number to receive a verification code and secure your owner account."
            : `We sent a 6-digit verification code to ${phone}. Enter it below to continue.`}
        </p>

        {error && (
          <div style={{
            background: "#fef2f2", color: "#b91c1c", padding: "12px 14px",
            borderRadius: "10px", marginBottom: "20px", fontSize: "13px",
            textAlign: "left", display: "flex", alignItems: "center", gap: 8,
            border: "1px solid #fecaca"
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div style={{
            background: "#f0fdf4", color: "#166534", padding: "12px 14px",
            borderRadius: "10px", marginBottom: "20px", fontSize: "13px",
            textAlign: "left", border: "1px solid #bbf7d0"
          }}>
            {message}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ textAlign: "left" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Mobile Number
              </label>
              <input
                type="tel"
                placeholder="e.g. +91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  width: "100%", padding: "12px 14px", fontSize: "15px",
                  border: "1.5px solid #e2e8f0", borderRadius: "10px",
                  boxSizing: "border-box", outline: "none",
                  background: "#f8fafc"
                }}
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "13px", fontSize: "15px", fontWeight: 700,
                color: "#fff", background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
                border: "none", borderRadius: "10px", cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 4px 14px rgba(79, 70, 229, 0.25)"
              }}
            >
              {loading ? <Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> : null}
              {loading ? "Sending Code..." : "Send Verification Code"}
            </button>

            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: 12 }}>
              <button
                type="button"
                onClick={handleSkip}
                disabled={loading}
                style={{ background: "none", border: "none", color: "#64748b", fontWeight: 600, fontSize: "13px", cursor: "pointer", textDecoration: "underline" }}
              >
                Skip for now
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <input
              type="text"
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              style={{
                width: "100%", padding: "14px", fontSize: "26px", letterSpacing: "8px",
                textAlign: "center", border: "2px solid #4f46e5", borderRadius: "12px",
                fontWeight: "bold", outline: "none", boxSizing: "border-box", background: "#f8fafc"
              }}
              autoFocus
            />

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              style={{
                width: "100%", padding: "13px", fontSize: "15px", fontWeight: 700,
                color: "#fff", background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
                border: "none", borderRadius: "10px",
                cursor: loading || otp.length < 6 ? "not-allowed" : "pointer",
                opacity: loading || otp.length < 6 ? 0.6 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8
              }}
            >
              {loading ? <Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> : <ShieldCheck size={16} />}
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <button
                type="button"
                onClick={() => { setStep(1); setError(""); setMessage(""); }}
                style={{ background: "none", border: "none", color: "#64748b", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
              >
                <ArrowLeft size={14} /> Change Number
              </button>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                style={{ background: "none", border: "none", color: "#4f46e5", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}
              >
                Resend Code
              </button>
            </div>
          </form>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
