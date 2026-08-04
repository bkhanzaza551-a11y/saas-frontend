import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageLoader from "../components/PageLoader";
import { formatApiError } from "../utils/apiError";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const access = searchParams.get("access") || "";
  const [form, setForm] = useState({
    email: searchParams.get("email") || "",
    password: ""
  });
  const [err, setErr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, verifyOtp, resendOtp } = useAuth();
  const nav = useNavigate();

  // OTP and persistent login states
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [sandboxOtp, setSandboxOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [resendMsg, setResendMsg] = useState("");

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
      if (res?.requireOtp) {
        setTempToken(res.tempToken);
        if (res.otp) {
          setSandboxOtp(res.otp);
        }
        setResendTimer(60);
        setOtpMode(true);
      } else {
        if (res?.user?.systemRole === "SUPER_ADMIN") {
          nav("/super-admin/dashboard");
        } else {
          nav("/admin/dashboard");
        }
      }
    } catch (error) {
      setErr(formatApiError(error, "Login failed"));
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
      const res = await verifyOtp(payload);
      if (res?.user?.systemRole === "SUPER_ADMIN") {
        nav("/super-admin/dashboard");
      } else {
        nav("/admin/dashboard");
      }
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
          font-family: 'Inter', system-ui, sans-serif;
          background: #0f172a;
          position: relative;
          overflow: hidden;
        }
        
        .login-bg-animated {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15), transparent 60%),
                      radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.15), transparent 50%),
                      radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.1), transparent 50%);
          animation: rotateBg 30s linear infinite;
          z-index: 0;
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
          justify-content: center;
          padding: 60px;
          color: white;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%);
          backdrop-filter: blur(10px);
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
        }

        .login-card {
          width: 100%;
          maxWidth: 440px;
          background: rgba(255, 255, 255, 0.98);
          padding: 48px 40px;
          borderRadius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.05);
          backdrop-filter: blur(20px);
          transition: transform 0.3s ease;
        }

        .login-logo-container {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }

        .login-logo {
          width: 72px;
          height: 72px;
          border-radius: 16px;
          object-fit: cover;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          border: 2px solid white;
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
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          font-size: 1rem;
          color: #0f172a;
          transition: all 0.2s ease;
          outline: none;
        }

        .premium-input:focus {
          background: white;
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .premium-button {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          font-size: 1rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
          margin-top: 8px;
        }

        .premium-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
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
        <div className="login-bg-animated"></div>
        
        <div className="login-content-wrapper">
          {/* Left Hero Panel for Desktop */}
          <div className="login-left-panel">
            <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '16px', lineHeight: 1.1, background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Elevate Your<br />Salon Management.
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#cbd5e1', maxWidth: '400px', lineHeight: 1.6 }}>
              Experience the next generation ERP designed exclusively for premium salons and spas. Streamline operations, delight customers, and grow your business.
            </p>
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
                            style={{ fontSize: '1.5rem', letterSpacing: '8px', textAlign: 'center', padding: '16px' }}
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
                          <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={form.password}
                            onChange={(event) => setForm({ ...form, password: event.target.value })}
                            className="premium-input"
                          />
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: '20px 0', userSelect: 'none' }}>
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(event) => setRememberMe(event.target.checked)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6', borderRadius: '4px' }}
                          />
                          <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>Keep me logged in</span>
                        </label>

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
