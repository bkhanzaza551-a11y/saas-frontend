import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageLoader from "../components/PageLoader";
import { formatApiError } from "../utils/apiError";
import { ShieldCheck, Key, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const access = searchParams.get("access") || "";
  const [form, setForm] = useState({
    email: searchParams.get("email") || "",
    password: ""
  });
  const [err, setErr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, verifyOtp, verifySecurityPin, forgotSecurityPin, resendOtp, auth } = useAuth();
  const nav = useNavigate();

  // OTP and persistent login states
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [sandboxOtp, setSandboxOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [resendMsg, setResendMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Admin 2FA Security PIN states
  const [pinMode, setPinMode] = useState(false);
  const [securityPin, setSecurityPin] = useState("");
  const [forgotPinMode, setForgotPinMode] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  const getLoginRedirectPath = (authData) => {
    if (authData?.user?.systemRole === "SUPER_ADMIN") {
      return "/super-admin/dashboard";
    }
    const salonRole = authData?.membership?.salonRole;
    const perms = authData?.membership?.permissions || {};
    const isOwner = salonRole === "SALON_OWNER";

    if (isOwner) return "/admin/dashboard";

    const has = (k) => {
      const camel = k.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      const snake = k.replace(/([A-Z])/g, "_$1").toLowerCase();
      return (
        (Array.isArray(perms[k]) && perms[k].length > 0) ||
        (Array.isArray(perms[camel]) && perms[camel].length > 0) ||
        (Array.isArray(perms[snake]) && perms[snake].length > 0)
      );
    };

    if (has("my_dashboard") || has("myDashboard")) return "/admin/my-dashboard";
    if (has("my_appointments") || has("myAppointments")) return "/admin/my-appointments";
    if (has("my_schedule") || has("mySchedule")) return "/admin/my-schedule";
    if (has("my_attendance") || has("myAttendance")) return "/admin/my-attendance";
    if (has("my_profile") || has("myProfile")) return "/admin/my-profile";

    return "/admin/my-dashboard";
  };

  useEffect(() => {
    if (auth) {
      nav(getLoginRedirectPath(auth));
    }
  }, [auth, nav]);

  useEffect(() => {
    let interval = null;
    if (otpMode && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpMode, resendTimer]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setErr("");
    setResendMsg("");
    setIsSubmitting(true);
    try {
      const payload = {
        email: form.email,
        password: form.password,
        loginAccessToken: access || undefined,
        rememberMe: rememberMe
      };
      const res = await login(payload);
      if (res?.requireSecurityPin) {
        setTempToken(res.tempToken);
        setSecurityQuestion(res.securityQuestion || "What is your secret security answer?");
        setPinMode(true);
        setForgotPinMode(false);
        setSecurityPin("");
      } else if (res?.requireOtp) {
        setTempToken(res.tempToken);
        if (res.otp) {
          setSandboxOtp(res.otp);
        }
        setResendTimer(60);
        setOtpMode(true);
      } else {
        nav(getLoginRedirectPath(res));
      }
    } catch (error) {
      setErr(formatApiError(error, "Login failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPinSubmit = async (event) => {
    event.preventDefault();
    setErr("");
    if (!securityPin || securityPin.length < 4) {
      setErr("Please enter your complete Security PIN.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = { tempToken, securityPin: securityPin.trim() };
      const res = await verifySecurityPin(payload, rememberMe);
      nav(getLoginRedirectPath(res));
    } catch (error) {
      setErr(formatApiError(error, "Invalid Security PIN"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onForgotPinSubmit = async (event) => {
    event.preventDefault();
    setErr("");
    if (!securityAnswer.trim()) {
      setErr("Please enter your answer to the security question.");
      return;
    }
    if (!newPin || newPin.length < 4 || newPin.length > 8) {
      setErr("New PIN must be between 4 and 8 digits (recommended 6 digits).");
      return;
    }
    if (newPin !== confirmNewPin) {
      setErr("New PIN and Confirm PIN do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        tempToken,
        answer: securityAnswer.trim(),
        newPin: newPin.trim()
      };
      const res = await forgotSecurityPin(payload, rememberMe);
      nav(getLoginRedirectPath(res));
    } catch (error) {
      setErr(formatApiError(error, "Failed to reset Security PIN. Please check your answer."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResendOtp = async () => {
    if (resendTimer > 0 || isSubmitting) return;
    setErr("");
    setResendMsg("");
    setIsSubmitting(true);
    try {
      const res = await resendOtp({ tempToken });
      if (res?.tempToken) {
        setTempToken(res.tempToken);
      }
      if (res?.otp) {
        setSandboxOtp(res.otp);
      }
      setResendTimer(60);
      setResendMsg("A new verification code has been sent to your email.");
    } catch (error) {
      setErr(formatApiError(error, "Failed to resend OTP"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onOtpSubmit = async (event) => {
    event.preventDefault();
    setErr("");
    setResendMsg("");
    setIsSubmitting(true);
    try {
      const payload = {
        tempToken,
        otp
      };
      const res = await verifyOtp(payload, rememberMe);
      nav(getLoginRedirectPath(res));
    } catch (error) {
      setErr(formatApiError(error, "Verification failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        .login-page-container {
          display: flex;
          min-height: 100vh;
          font-family: 'Poppins', system-ui, sans-serif;
          background: #ffffff;
          position: relative;
          overflow: hidden;
        }
        
        .login-bg-animated {
          display: none;
        }

        @keyframes rotateBg {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .login-content-wrapper {
          position: relative;
          z-index: 1;
          display: flex;
          width: 100%;
        }

        .login-left-panel {
          flex: 1;
          display: none;
          flex-direction: column;
          justify-content: flex-end;
          padding: 60px;
          color: white;
          background: linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.4) 50%, rgba(15, 23, 42, 0.1) 100%), url('https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&q=80');
          background-size: cover;
          background-position: center;
          position: relative;
          border-right: 1px solid rgba(255, 255, 255, 0.05);
        }

        @media (min-width: 900px) {
          .login-left-panel {
            display: flex;
          }
        }

        .login-right-panel {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          background: #ffffff;
        }

        .login-card {
          width: 100%;
          maxWidth: 440px;
          padding: 40px;
        }

        .login-logo-container {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }

        .login-logo {
          max-width: 220px;
          height: auto;
          max-height: 80px;
          object-fit: contain;
        }

        .login-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0f172a;
          text-align: center;
          margin-bottom: 8px;
          letter-spacing: -0.025em;
        }

        .login-subtitle {
          font-size: 0.95rem;
          color: #64748b;
          text-align: center;
          margin-bottom: 32px;
        }

        .premium-input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .premium-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #334155;
        }

        .premium-input {
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          font-size: 0.85rem;
          color: #0f172a;
          transition: all 0.2s ease;
          outline: none;
          box-sizing: border-box;
        }

        .premium-input:focus {
          background: white;
          border-color: #000000;
          box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
        }

        .premium-button {
          width: 100%;
          padding: 10px;
          border-radius: 6px;
          background: #000000;
          color: white;
          font-size: 0.85rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
          margin-top: 8px;
        }

        .premium-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
          background: #1a1a1a;
        }

        .premium-button:disabled {
          background: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }
        
        .otp-display {
          background: #ecfdf5;
          border: 1px solid #34d399;
          padding: 16px;
          border-radius: 12px;
          text-align: center;
          margin-bottom: 24px;
        }
      `}</style>

      <div className="login-page-container">
        
        <div className="login-content-wrapper">
          {/* Left Hero Panel for Desktop */}
          <div className="login-left-panel">
            <div style={{ zIndex: 2, maxWidth: '500px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.2)', marginBottom: '24px', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></span>
                SalonNest ERP 2.0
              </div>
              
              <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '24px', lineHeight: 1.1, color: 'white', letterSpacing: '-0.02em' }}>
                Elevate Your<br />Salon Experience.
              </h1>
              
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', borderLeft: '4px solid #3b82f6' }}>
                <p style={{ fontSize: '1.1rem', color: '#f1f5f9', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '16px' }}>
                  "Since switching to SalonNest, our daily operations have become effortless. The analytics and booking flow are simply unmatched."
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src="https://i.pravatar.cc/100?img=47" alt="User" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)' }} />
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>Sarah Jenkins</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Owner, Luxe Spa & Salon</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Login Panel */}
          <div className="login-right-panel">
            <div className="login-card">
              <div className="login-logo-container">
                <img src="/logo.jfif" alt="SalonNest Logo" className="login-logo" />
              </div>

              {otpMode ? (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h2 className="login-title">Verify Identity</h2>
                    <p className="login-subtitle">We sent a 6-digit code to your email.</p>
                  </div>

                  {isSubmitting ? (
                    <PageLoader title="Verifying OTP" message="Checking your code and preparing your dashboard..." />
                  ) : (
                    <>
                      {sandboxOtp ? (
                        <div className="otp-display">
                          <div style={{ color: '#065f46', fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px' }}>Verification Code</div>
                          <div style={{ fontSize: '1.75rem', letterSpacing: '8px', color: '#047857', fontWeight: 800 }}>{sandboxOtp}</div>
                          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '8px', fontWeight: 500 }}>
                            Sent to email (Check Spam / Updates)
                          </div>
                        </div>
                      ) : (
                        <div style={{ marginBottom: '24px', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>
                          💡 Check your email inbox, <strong>Spam</strong> or <strong>Promotions</strong>.
                        </div>
                      )}

                      {resendMsg && (
                        <div style={{ marginBottom: '24px', padding: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', color: '#1d4ed8', fontSize: '0.85rem', textAlign: 'center', fontWeight: 600 }}>
                          {resendMsg}
                        </div>
                      )}

                      <form onSubmit={onOtpSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="premium-input-group">
                          <label className="premium-label">6-Digit Code</label>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            placeholder="••••••"
                            value={otp}
                            onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                            className="premium-input"
                            style={{ fontSize: '1.25rem', letterSpacing: '8px', textAlign: 'center', padding: '10px' }}
                          />
                        </div>

                        {err && <div className="error-text" style={{ padding: '12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '16px', fontWeight: 500 }}>{err}</div>}

                        <button type="submit" className="premium-button" disabled={isSubmitting || otp.length !== 6}>
                          {isSubmitting ? "Verifying..." : "Verify & Login"}
                        </button>
                      </form>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', fontSize: '0.9rem' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setOtpMode(false);
                            setOtp("");
                            setSandboxOtp("");
                            setErr("");
                            setResendMsg("");
                          }}
                          style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: 600, transition: 'color 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#4338ca'}
                          onMouseLeave={e => e.currentTarget.style.color = '#4f46e5'}
                        >
                          Back to login
                        </button>

                        {resendTimer > 0 ? (
                          <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>
                            Resend in <strong>{resendTimer}s</strong>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={onResendOtp}
                            disabled={isSubmitting}
                            style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}
                          >
                            Resend OTP
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </>
              ) : pinMode ? (
                <>
                  {!forgotPinMode ? (
                    <>
                      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                        <div style={{ width: '52px', height: '52px', margin: '0 auto 12px', borderRadius: '14px', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.15)' }}>
                          <ShieldCheck size={28} />
                        </div>
                        <h2 className="login-title">Admin Security PIN</h2>
                        <p className="login-subtitle">Two-Factor Authentication is active for Super Admins.</p>
                      </div>

                      {isSubmitting ? (
                        <PageLoader title="Verifying Security PIN" message="Checking Admin credentials and preparing workspace..." />
                      ) : (
                        <>
                          <form onSubmit={onPinSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
                            <div className="premium-input-group">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <label className="premium-label">6-Digit Security PIN</label>
                                <button
                                  type="button"
                                  onClick={() => setShowPin(!showPin)}
                                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  {showPin ? <><EyeOff size={14} /> Hide</> : <><Eye size={14} /> Show</>}
                                </button>
                              </div>
                              <input
                                type={showPin ? "text" : "password"}
                                required
                                autoFocus
                                maxLength={8}
                                placeholder="••••••"
                                value={securityPin}
                                onChange={(e) => setSecurityPin(e.target.value.replace(/\D/g, ""))}
                                className="premium-input"
                                style={{ fontSize: '1.4rem', letterSpacing: '8px', textAlign: 'center', padding: '12px', fontWeight: 800 }}
                              />
                            </div>

                            {err && (
                              <div className="error-text" style={{ padding: '12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '16px', fontWeight: 500 }}>
                                {err}
                              </div>
                            )}

                            <button type="submit" className="premium-button" disabled={isSubmitting || securityPin.length < 4}>
                              {isSubmitting ? "Verifying..." : "Verify & Enter Portal"}
                            </button>

                            <div style={{ textAlign: 'center', marginTop: '14px' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setForgotPinMode(true);
                                  setErr("");
                                  setSecurityAnswer("");
                                  setNewPin("");
                                  setConfirmNewPin("");
                                }}
                                style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}
                              >
                                Forgot Security PIN?
                              </button>
                            </div>
                          </form>

                          <div style={{ textAlign: 'center', marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setPinMode(false);
                                setSecurityPin("");
                                setErr("");
                              }}
                              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                            >
                              ← Back to Login
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <div style={{ width: '52px', height: '52px', margin: '0 auto 12px', borderRadius: '14px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(217, 119, 6, 0.15)' }}>
                          <Key size={26} />
                        </div>
                        <h2 className="login-title">Reset Security PIN</h2>
                        <p className="login-subtitle">Answer your security question to restore admin access.</p>
                      </div>

                      {isSubmitting ? (
                        <PageLoader title="Resetting Security PIN" message="Validating recovery answer..." />
                      ) : (
                        <>
                          <form onSubmit={onForgotPinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                              <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                                Security Question
                              </span>
                              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                                {securityQuestion}
                              </span>
                            </div>

                            <div className="premium-input-group">
                              <label className="premium-label">Your Secret Answer</label>
                              <input
                                type="text"
                                required
                                autoFocus
                                placeholder="Enter your secret answer"
                                value={securityAnswer}
                                onChange={(e) => setSecurityAnswer(e.target.value)}
                                className="premium-input"
                              />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                              <div className="premium-input-group">
                                <label className="premium-label">New PIN</label>
                                <input
                                  type="password"
                                  required
                                  maxLength={8}
                                  placeholder="New PIN"
                                  value={newPin}
                                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                                  className="premium-input"
                                  style={{ textAlign: 'center', letterSpacing: '2px', fontWeight: 700 }}
                                />
                              </div>
                              <div className="premium-input-group">
                                <label className="premium-label">Confirm PIN</label>
                                <input
                                  type="password"
                                  required
                                  maxLength={8}
                                  placeholder="Confirm PIN"
                                  value={confirmNewPin}
                                  onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ""))}
                                  className="premium-input"
                                  style={{ textAlign: 'center', letterSpacing: '2px', fontWeight: 700 }}
                                />
                              </div>
                            </div>

                            {err && (
                              <div className="error-text" style={{ padding: '10px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 500 }}>
                                {err}
                              </div>
                            )}

                            <button type="submit" className="premium-button" disabled={isSubmitting || !securityAnswer.trim() || newPin.length < 4}>
                              {isSubmitting ? "Resetting..." : "Reset PIN & Log In"}
                            </button>

                            <div style={{ textAlign: 'center', marginTop: '6px' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setForgotPinMode(false);
                                  setErr("");
                                }}
                                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                              >
                                ← Back to PIN Verification
                              </button>
                            </div>
                          </form>
                        </>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h2 className="login-title">Welcome Back</h2>
                    <p className="login-subtitle">Sign in to your salon workspace</p>
                  </div>

                  {isSubmitting ? (
                    <PageLoader title="Authenticating" message="Verifying your credentials..." />
                  ) : (
                    <>
                      {access && (
                        <div style={{ padding: '12px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', color: '#065f46', fontSize: '0.85rem', marginBottom: '24px', textAlign: 'center', fontWeight: 500 }}>
                          Secure login verified for this email invite.
                        </div>
                      )}

                      {!access && searchParams.get("email") && (
                        <div style={{ padding: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', color: '#1e40af', fontSize: '0.85rem', marginBottom: '24px', textAlign: 'center', fontWeight: 500 }}>
                          Email prefilled from secure link. Enter password to continue.
                        </div>
                      )}

                      <form onSubmit={onSubmit}>
                        <div className="premium-input-group">
                          <label className="premium-label">Email Address</label>
                          <input
                            type="email"
                            required
                            placeholder="name@company.com"
                            value={form.email}
                            onChange={(event) => setForm({ ...form, email: event.target.value })}
                            className="premium-input"
                          />
                        </div>
                        
                        <div className="premium-input-group">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="premium-label">Password</label>
                            <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>Forgot?</Link>
                          </div>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                              type={showPassword ? "text" : "password"}
                              required
                              placeholder="••••••••"
                              value={form.password}
                              onChange={(event) => setForm({ ...form, password: event.target.value })}
                              className="premium-input"
                              style={{ width: '100%', paddingRight: '40px' }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', height: '20px', width: '20px' }}
                            >
                              {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              )}
                            </button>
                          </div>
                        </div>

                        <div 
                          onClick={() => setRememberMe(!rememberMe)}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none', margin: '20px 0' }}
                        >
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              border: rememberMe ? 'none' : '2px solid #cbd5e1',
                              background: rememberMe ? 'var(--sf-accent, #4f46e5)' : 'white',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {rememberMe && (
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            )}
                          </div>
                          <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>Keep me logged in</span>
                        </div>

                        {err && <div className="error-text" style={{ padding: '12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '16px', fontWeight: 500 }}>{err}</div>}

                        <button type="submit" className="premium-button" disabled={isSubmitting}>
                          {isSubmitting ? "Signing in..." : "Login"}
                        </button>
                      </form>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
