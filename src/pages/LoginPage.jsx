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
  const [showPassword, setShowPassword] = useState(false);

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
      const res = await verifyOtp(payload, rememberMe);
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
