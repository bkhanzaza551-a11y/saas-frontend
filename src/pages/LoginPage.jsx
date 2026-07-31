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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f1f5f9', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '440px', background: 'white', padding: '40px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}>
        {otpMode ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h1 style={{ fontSize: '1.2rem', color: 'var(--accent)', marginBottom: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>SalonNest ERP</h1>
              <h2 style={{ fontSize: '2.2rem', margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>Enter OTP</h2>
              <p className="muted" style={{ marginTop: '8px' }}>We sent a 6-digit verification code to your email.</p>
            </div>

            {isSubmitting ? (
              <PageLoader title="Verifying OTP" message="Checking your code and preparing your dashboard..." />
            ) : (
              <>
                {sandboxOtp ? (
                  <div style={{ marginBottom: '20px', padding: '12px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', color: '#065f46', fontSize: '0.9rem', textAlign: 'center', fontWeight: 600 }}>
                    Verification Code: <span style={{ fontSize: '1.2rem', letterSpacing: '3px', color: '#047857', fontWeight: 800, marginLeft: '6px' }}>{sandboxOtp}</span>
                    <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '4px', fontWeight: 500 }}>
                      Code sent to email (Also check Spam / Updates tab)
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: '20px', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>
                    💡 Check your email inbox, <strong>Spam</strong> or <strong>Promotions</strong> folder.
                  </div>
                )}

                {resendMsg && (
                  <div style={{ marginBottom: '20px', padding: '10px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', color: '#1d4ed8', fontSize: '0.85rem', textAlign: 'center', fontWeight: 600 }}>
                    {resendMsg}
                  </div>
                )}

                <form onSubmit={onOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Verification Code</span>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                      style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1.2rem', letterSpacing: '4px', textAlign: 'center', width: '100%', fontWeight: 700 }}
                    />
                  </label>

                  {err && <div className="error-text" style={{ padding: '10px', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', fontSize: '0.9rem' }}>{err}</div>}

                  <button type="submit" disabled={isSubmitting || otp.length !== 6} style={{ background: 'var(--accent)', color: 'white', padding: '14px', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: '8px', width: '100%' }}>
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
                    style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Back to login
                  </button>

                  {resendTimer > 0 ? (
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                      Resend OTP in <strong>{resendTimer}s</strong>
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
              <h1 style={{ fontSize: '1.2rem', color: 'var(--accent)', marginBottom: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>SalonNest ERP</h1>
              <h2 style={{ fontSize: '2.2rem', margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>Welcome back</h2>
              <p className="muted" style={{ marginTop: '8px' }}>Sign in to your salon workspace</p>
            </div>

            {isSubmitting ? (
              <PageLoader title="Authenticating" message="Verifying your credentials and preparing your dashboard..." />
            ) : (
              <>
                {access ? (
                  <div className="auth-inline-note auth-inline-success" style={{ marginBottom: '20px' }}>Secure login verified for this email invite.</div>
                ) : null}

                {!access && searchParams.get("email") ? (
                  <div className="auth-inline-note" style={{ marginBottom: '20px' }}>
                    Your email was prefilled from a secure link. Enter your password to continue.
                  </div>
                ) : null}

                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Email Address</span>
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={form.email}
                      onChange={(event) => setForm({ ...form, email: event.target.value })}
                      style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', width: '100%' }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Password</span>
                    <input
                      type="password"
                      required
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={(event) => setForm({ ...form, password: event.target.value })}
                      style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', width: '100%' }}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '4px' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent)' }}
                    />
                    <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>Keep me logged in (Save Logined)</span>
                  </label>

                  {err && <div className="error-text" style={{ padding: '10px', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', fontSize: '0.9rem' }}>{err}</div>}

                  <button type="submit" disabled={isSubmitting} style={{ background: 'var(--accent)', color: 'white', padding: '14px', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: '8px', width: '100%' }}>
                    {isSubmitting ? "Signing in..." : "Login"}
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Link className="interactive-link" to="/forgot-password" style={{ fontSize: '0.95rem' }}>Forgot your password?</Link>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
