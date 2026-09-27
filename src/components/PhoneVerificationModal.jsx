import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, Phone, KeyRound, Loader, AlertCircle, ArrowLeft, RefreshCw, CheckCircle2 } from "lucide-react";
import DigitOtpInput from "./DigitOtpInput";

export default function PhoneVerificationModal() {
  const { auth } = useAuth();
  const [step, setStep] = useState(1); // 1 = Confirm/Change Phone -> Send OTP, 2 = Verify OTP

  const rawPhone = auth?.membership?.phone || auth?.salon?.phone || auth?.user?.phone || "";
  const initialDigits = rawPhone.replace(/\D/g, "").replace(/^91/, "").slice(-10);
  const [registeredDigits, setRegisteredDigits] = useState(initialDigits);
  const [isChangingNumber, setIsChangingNumber] = useState(false);
  const [customPhoneDigits, setCustomPhoneDigits] = useState("");
  const [loadingPhone, setLoadingPhone] = useState(!initialDigits);

  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const activeDigits = isChangingNumber ? customPhoneDigits : (registeredDigits || customPhoneDigits);
  const isPhoneValid = /^[6-9]\d{9}$/.test(activeDigits);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    let isMounted = true;

    // Fetch freshest phone info from server
    const fetchInfo = async () => {
      try {
        const res = await api.get("/owner/verify-phone/info", {
          headers: { Authorization: `Bearer ${auth?.accessToken}` }
        });
        if (isMounted && res.data?.phone) {
          const digits = res.data.phone.replace(/\D/g, "").replace(/^91/, "").slice(-10);
          if (digits) {
            setRegisteredDigits(digits);
          }
        }
      } catch (e) {
        console.error("Failed to load phone info:", e);
      } finally {
        if (isMounted) setLoadingPhone(false);
      }
    };

    fetchInfo();

    return () => {
      document.body.style.overflow = "auto";
      isMounted = false;
    };
  }, [auth?.accessToken]);

  const handleCustomPhoneChange = (e) => {
    let digits = e.target.value.replace(/\D/g, "");
    if (digits.startsWith("91") && digits.length > 10) {
      digits = digits.slice(2);
    } else if (digits.startsWith("0") && digits.length > 10) {
      digits = digits.slice(1);
    }
    setCustomPhoneDigits(digits.slice(0, 10));
    if (error) setError("");
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!isPhoneValid) {
      setError("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
      return;
    }
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const fullPhone = `+91${activeDigits}`;
      const res = await api.post(
        "/owner/verify-phone/send",
        { phone: fullPhone },
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
      const fullPhone = `+91${activeDigits}`;
      await api.post(
        "/owner/verify-phone/verify",
        { otpCode: otp.trim(), phone: fullPhone },
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );
      // Update session in storage & state
      const updateStorage = (key) => {
          let raw = localStorage.getItem(key);
          if (!raw) {
             raw = sessionStorage.getItem(key);
             if (!raw) return;
             const st = JSON.parse(raw);
             if (st?.user) { st.user.isPhoneVerified = true; st.user.phone = fullPhone; }
             if (st?.membership) { st.membership.phone = fullPhone; if (st.membership.salon) st.membership.salon.phone = fullPhone; }
             sessionStorage.setItem(key, JSON.stringify(st));
             return;
          }
          const st = JSON.parse(raw);
          if (st?.user) { st.user.isPhoneVerified = true; st.user.phone = fullPhone; }
          if (st?.membership) { st.membership.phone = fullPhone; if (st.membership.salon) st.membership.salon.phone = fullPhone; }
          localStorage.setItem(key, JSON.stringify(st));
        };
        updateStorage("salonnest_auth");
        updateStorage("salonnest_auth_session");
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
      const updateStorageSkip = (key) => {
          let raw = localStorage.getItem(key);
          if (!raw) {
             raw = sessionStorage.getItem(key);
             if (!raw) return;
             const st = JSON.parse(raw);
             if (st?.user) { st.user.isPhoneVerified = false; st.user.phoneVerificationSkipped = true; }
             sessionStorage.setItem(key, JSON.stringify(st));
             return;
          }
          const st = JSON.parse(raw);
          if (st?.user) { st.user.isPhoneVerified = false; st.user.phoneVerificationSkipped = true; }
          localStorage.setItem(key, JSON.stringify(st));
        };
        updateStorageSkip("salonnest_auth");
        updateStorageSkip("salonnest_auth_session");
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
        padding: "40px 32px",
        borderRadius: "24px",
        width: "100%",
        maxWidth: "460px",
        textAlign: "center",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        position: "relative"
      }}>
        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "linear-gradient(135deg, #ccfbf1 0%, #d1fae5 100%)",
          color: "#0f766e", display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
          border: "2px solid #99f6e4"
        }}>
          {step === 1 ? <Phone size={28} /> : <KeyRound size={28} />}
        </div>

        <h2 style={{ margin: "0 0 12px", fontSize: "24px", fontWeight: 800, color: "#0f172a" }}>
          {step === 1 ? "Verify Mobile Number" : "Enter Verification Code"}
        </h2>
        <p style={{ margin: "0 0 28px", fontSize: "14.5px", color: "#475569", lineHeight: "1.6" }}>
          {step === 1
            ? isChangingNumber
              ? "Enter your new mobile number. Once verified, it will update your salon and profile."
              : "A 6-digit verification code will be sent to your registered mobile number."
            : `We sent a 6-digit verification code to +91 ${activeDigits.slice(0, 5)} ${activeDigits.slice(5)}. Enter it below to continue.`}
        </p>

        {error && (
          <div style={{
            background: "#fef2f2", color: "#b91c1c", padding: "12px 14px",
            borderRadius: "12px", marginBottom: "24px", fontSize: "13.5px",
            textAlign: "left", display: "flex", alignItems: "center", gap: 10,
            border: "1px solid #fecaca", fontWeight: 500
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
        
        {message && (
          <div style={{
            background: "#f0fdfa", color: "#0f766e", padding: "12px 14px",
            borderRadius: "12px", marginBottom: "24px", fontSize: "13.5px",
            textAlign: "left", display: "flex", alignItems: "center", gap: 10,
            border: "1px solid #ccfbf1", fontWeight: 600
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{message}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {!isChangingNumber ? (
              <div style={{ textAlign: "center", marginBottom: 8 }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 12,
                  background: "#f8fafc", border: "1.5px solid #e2e8f0",
                  padding: "12px 24px", borderRadius: "16px", color: "#0f172a",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                }}>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "#64748b" }}>IN</span>
                  <span style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "1px" }}>
                    +91 {activeDigits.slice(0, 5)} {activeDigits.slice(5)}
                  </span>
                </div>
                <div style={{ marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={() => { setIsChangingNumber(true); setError(""); }}
                    style={{
                      background: "transparent", border: "none", color: "#0f766e",
                      padding: "8px", fontSize: "14px",
                      fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
                      textDecoration: "underline", textUnderlineOffset: "4px"
                    }}
                  >
                    Use another number instead
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "left", marginBottom: 8 }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: "13.5px", fontWeight: 600, color: "#475569" }}>
                  Mobile Number
                </label>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  border: isPhoneValid ? "1.5px solid #10b981" : (customPhoneDigits.length > 0 && !/^[6-9]/.test(customPhoneDigits)) ? "1.5px solid #ef4444" : "1.5px solid #cbd5e1",
                  borderRadius: "14px",
                  background: "#ffffff",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                  overflow: "hidden",
                  transition: "all 0.2s"
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "14px 16px",
                    background: "#f8fafc",
                    borderRight: "1px solid #e2e8f0",
                    color: "#0f172a",
                    fontWeight: 700,
                    fontSize: "15px"
                  }}>
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="98765 43210"
                    value={customPhoneDigits}
                    onChange={handleCustomPhoneChange}
                    style={{
                      flex: 1,
                      padding: "14px 16px",
                      fontSize: "16px",
                      fontWeight: 600,
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      color: "#0f172a",
                      width: "100%",
                      boxSizing: "border-box"
                    }}
                    required
                    autoFocus
                  />
                </div>

                <div style={{ marginTop: 8, fontSize: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {customPhoneDigits.length === 0 ? (
                    <span style={{ color: "#94a3b8" }}>Enter 10-digit Indian mobile number</span>
                  ) : !/^[6-9]/.test(customPhoneDigits) ? (
                    <span style={{ color: "#ef4444", fontWeight: 600 }}>Must start with 6, 7, 8, or 9</span>
                  ) : customPhoneDigits.length < 10 ? (
                    <span style={{ color: "#64748b" }}>{10 - customPhoneDigits.length} more digits needed</span>
                  ) : (
                    <span style={{ color: "#059669", fontWeight: 700 }}>✓ Valid 10-digit number</span>
                  )}
                  <span style={{ color: "#94a3b8", fontWeight: 600 }}>{customPhoneDigits.length}/10</span>
                </div>

                {registeredDigits && (
                  <div style={{ marginTop: "16px", padding: "12px 14px", background: "#f8fafc", borderRadius: "10px", fontSize: "12.5px", color: "#64748b", lineHeight: "1.5", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                     <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                     <span>This new number will replace your current registered number (+91 {registeredDigits.slice(0, 5)} {registeredDigits.slice(5)}) across your salon details and demo leads once verified.</span>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || loadingPhone || !isPhoneValid}
              style={{
                width: "100%", padding: "16px", fontSize: "15.5px", fontWeight: 700,
                color: "#fff",
                background: (isPhoneValid && !loadingPhone)
                  ? "#0f766e"
                  : "#cbd5e1",
                border: "none", borderRadius: "14px",
                cursor: (loading || loadingPhone || !isPhoneValid) ? "not-allowed" : "pointer",
                opacity: loading ? 0.8 : ((isPhoneValid && !loadingPhone) ? 1 : 0.6),
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                boxShadow: (isPhoneValid && !loadingPhone) ? "0 4px 14px rgba(15, 118, 110, 0.25)" : "none",
                transition: "all 0.2s ease"
              }}
            >
              {loading ? <Loader size={18} style={{ animation: "spin 1s linear infinite" }} /> : null}
              {loading ? "Sending Code..." : "Send Verification Code"}
            </button>

            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: 0 }}>
              <button
                type="button"
                onClick={handleSkip}
                disabled={loading}
                style={{ background: "none", border: "none", color: "#64748b", fontWeight: 600, fontSize: "14px", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "4px" }}
              >
                Skip for now
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ width: "100%", margin: "0 0 8px" }}>
              <DigitOtpInput
                value={otp}
                onChange={(val) => {
                  setOtp(val);
                  if (error) setError("");
                }}
                length={6}
                autoFocus={true}
                error={Boolean(error)}
                brandColor="#0f766e"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              style={{
                width: "100%",
                padding: "16px 20px",
                fontSize: "15.5px",
                fontWeight: 700,
                color: "#ffffff",
                background: (loading || otp.length < 6)
                  ? "#94a3b8"
                  : "#0f766e",
                border: "none",
                borderRadius: "14px",
                cursor: (loading || otp.length < 6) ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                boxShadow: (otp.length === 6 && !loading) ? "0 4px 14px rgba(15, 118, 110, 0.28)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              {loading ? <Loader size={18} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle2 size={18} />}
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => { setStep(1); setError(""); setMessage(""); }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#475569",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  padding: "8px"
                }}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                style={{
                  background: "none",
                  border: "none",
                  color: "#0f766e",
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  textDecoration: "underline",
                  textUnderlineOffset: "4px",
                  padding: "8px"
                }}
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
