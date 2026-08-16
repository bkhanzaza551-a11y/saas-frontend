import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { formatApiError } from "../utils/apiError";
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, Loader } from "lucide-react";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const initialToken = searchParams.get("token") || "";
  const fallbackEmail = searchParams.get("email") || "";
  const loginAccessToken = searchParams.get("access") || "";

  const [form, setForm] = useState({ token: initialToken, password: "", confirmPassword: "" });
  const [state, setState] = useState({ loading: Boolean(initialToken), valid: !initialToken, error: "", success: "", email: fallbackEmail, name: "" });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isPasswordMismatch = useMemo(
    () => form.confirmPassword && form.password !== form.confirmPassword,
    [form.confirmPassword, form.password]
  );

  const passwordStrength = useMemo(() => {
    const p = form.password;
    if (!p) return null;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { label: "Weak", color: "#ef4444", width: "25%" };
    if (score === 2) return { label: "Fair", color: "#f59e0b", width: "50%" };
    if (score === 3) return { label: "Good", color: "#3b82f6", width: "75%" };
    return { label: "Strong", color: "#10b981", width: "100%" };
  }, [form.password]);

  useEffect(() => {
    document.title = "Set Password | SalonNest";
  }, []);

  useEffect(() => {
    if (!initialToken) return;
    let active = true;
    api.post("/auth/validate-reset-token", { token: initialToken })
      .then((response) => {
        if (!active) return;
        setState({ loading: false, valid: true, error: "", success: "", email: response.data.email || fallbackEmail, name: response.data.name || "" });
      })
      .catch((error) => {
        if (!active) return;
        setState((c) => ({ ...c, loading: false, valid: false, error: formatApiError(error, "This link is invalid or has expired.") }));
      });
    return () => { active = false; };
  }, [fallbackEmail, initialToken]);

  const submit = async (e) => {
    e.preventDefault();
    if (isPasswordMismatch || form.password.length < 8) return;
    setSubmitting(true);
    try {
      const response = await api.post("/auth/reset-password", { token: form.token, password: form.password });
      setState((c) => ({ ...c, error: "", success: response.data.message || "Password set successfully!", email: response.data.email || c.email }));
      setTimeout(() => {
        const params = new URLSearchParams();
        if (response.data.email || state.email) params.set("email", response.data.email || state.email);
        if (loginAccessToken) params.set("access", loginAccessToken);
        nav(`/login?${params.toString()}`);
      }, 1500);
    } catch (error) {
      setState((c) => ({ ...c, error: formatApiError(error, "Could not set your password. Please try again."), success: "" }));
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 44px 12px 14px",
    fontSize: 15,
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    outline: "none",
    background: "#f8fafc",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
  };

  const inputFocusStyle = {
    borderColor: "#4f46e5",
    boxShadow: "0 0 0 3px rgba(79, 70, 229, 0.1)",
    background: "#fff",
  };

  const [focusedField, setFocusedField] = useState(null);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #fef3f2 100%)",
      padding: "24px 16px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 440,
        background: "#ffffff",
        borderRadius: 20,
        boxShadow: "0 20px 60px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)",
        padding: "40px 32px 36px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Top accent bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 4,
          background: "linear-gradient(90deg, #4f46e5 0%, #7c3aed 50%, #3b82f6 100%)",
        }} />

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, margin: "0 auto 16px",
            borderRadius: 16, background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(79, 70, 229, 0.25)",
          }}>
            <Lock size={26} color="#fff" strokeWidth={2.5} />
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
            Set Your Password
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>
            Activate your SalonNest account
          </p>
        </div>

        {/* Loading State */}
        {state.loading && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Loader size={32} style={{ animation: "spin 1s linear infinite", color: "#4f46e5" }} />
            <p style={{ marginTop: 16, fontSize: 14, color: "#64748b" }}>Verifying your invite link...</p>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Invalid/Expired Token */}
        {!state.loading && !state.valid && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{
              width: 56, height: 56, margin: "0 auto 16px",
              borderRadius: "50%", background: "#fef2f2",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <AlertCircle size={28} color="#ef4444" />
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Link Expired or Invalid</h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
              {state.error || "This password setup link is no longer valid. Please request a new one."}
            </p>
            <Link to="/forgot-password" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 20px", fontSize: 13, fontWeight: 700,
              color: "#4f46e5", background: "#eef2ff", borderRadius: 8,
              textDecoration: "none", border: "1px solid #c7d2fe",
              transition: "all 0.2s",
            }}>
              Request a new link
            </Link>
          </div>
        )}

        {/* Valid Token — Password Form */}
        {!state.loading && state.valid && !state.success && (
          <>
            {/* User info card */}
            {state.email && (
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", marginBottom: 24,
                background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <CheckCircle size={18} color="#fff" />
                </div>
                <div>
                  {state.name && <div style={{ fontSize: 14, fontWeight: 700, color: "#065f46" }}>{state.name}</div>}
                  <div style={{ fontSize: 12, color: "#047857" }}>{state.email}</div>
                </div>
              </div>
            )}

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Password field */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  New Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    placeholder="At least 8 characters"
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    onFocus={() => setFocusedField("pw")}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle, ...(focusedField === "pw" ? inputFocusStyle : {}) }}
                    required
                    minLength={8}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", padding: 0, color: "#94a3b8",
                  }}>
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Strength bar */}
                {passwordStrength && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ height: 4, borderRadius: 4, background: "#e2e8f0", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 4, width: passwordStrength.width,
                        background: passwordStrength.color, transition: "all 0.3s ease",
                      }} />
                    </div>
                    <div style={{ fontSize: 11, color: passwordStrength.color, fontWeight: 600, marginTop: 4 }}>
                      {passwordStrength.label}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password field */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Confirm Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={form.confirmPassword}
                    placeholder="Re-enter your password"
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    onFocus={() => setFocusedField("cpw")}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      ...inputStyle,
                      ...(focusedField === "cpw" ? inputFocusStyle : {}),
                      ...(isPasswordMismatch ? { borderColor: "#ef4444", background: "#fef2f2" } : {}),
                    }}
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", padding: 0, color: "#94a3b8",
                  }}>
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {isPasswordMismatch && (
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "#ef4444", fontWeight: 500 }}>
                    Passwords do not match
                  </p>
                )}
              </div>

              {/* Error message */}
              {state.error && (
                <div style={{
                  padding: "10px 14px", borderRadius: 8,
                  background: "#fef2f2", border: "1px solid #fecaca",
                  fontSize: 13, color: "#b91c1c",
                }}>
                  {state.error}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting || isPasswordMismatch || form.password.length < 8}
                style={{
                  width: "100%", padding: "13px 0", fontSize: 15, fontWeight: 700,
                  color: "#fff", border: "none", borderRadius: 10, cursor: "pointer",
                  background: submitting || isPasswordMismatch || form.password.length < 8
                    ? "#cbd5e1"
                    : "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
                  boxShadow: submitting || isPasswordMismatch || form.password.length < 8
                    ? "none"
                    : "0 4px 14px rgba(79, 70, 229, 0.3)",
                  transition: "all 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {submitting ? (
                  <>
                    <Loader size={16} style={{ animation: "spin 1s linear infinite" }} />
                    Setting up...
                  </>
                ) : (
                  "Activate Account"
                )}
              </button>
            </form>

            <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#94a3b8" }}>
              Already have access? <Link to="/login" style={{ color: "#4f46e5", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
            </p>
          </>
        )}

        {/* Success State */}
        {state.success && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{
              width: 64, height: 64, margin: "0 auto 16px",
              borderRadius: "50%", background: "#f0fdf4",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <CheckCircle size={32} color="#10b981" />
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#065f46" }}>Account Activated!</h3>
            <p style={{ margin: "0 0 4px", fontSize: 14, color: "#047857" }}>{state.success}</p>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Redirecting to login...</p>
          </div>
        )}
      </div>
    </div>
  );
}
