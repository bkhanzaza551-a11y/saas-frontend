import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import PageLoader from "../components/PageLoader";
import { formatApiError } from "../utils/apiError";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setResetLink("");
    setIsSubmitting(true);
    try {
      const response = await api.post("/auth/forgot-password", { email });
      setMessage(response.data.message);
      setResetLink(response.data.resetLink || "");
    } catch (requestError) {
      setError(formatApiError(requestError, "Could not process your request right now."));
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
          background: #ffffff;
          position: relative;
          overflow: hidden;
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
      `}</style>

      <div className="login-page-container">
        
        <div className="login-content-wrapper">
          {/* Left Hero Panel for Desktop */}
          <div className="login-left-panel">
            <div style={{ zIndex: 2, maxWidth: '500px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.2)', marginBottom: '24px', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></span>
                Account Recovery
              </div>
              
              <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '24px', lineHeight: 1.1, color: 'white', letterSpacing: '-0.02em' }}>
                Regain Access<br />Seamlessly.
              </h1>
              
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', borderLeft: '4px solid #3b82f6' }}>
                <p style={{ fontSize: '1.1rem', color: '#f1f5f9', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '16px' }}>
                  "I was locked out and panicking before a busy Saturday. The recovery process was instant and flawless, keeping our business running without a hitch."
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src="https://i.pravatar.cc/100?img=43" alt="User" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)' }} />
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>Michael Chen</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Manager, Urban Retreat</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="login-right-panel">
            <div className="login-card">
              <div className="login-logo-container">
                <img src="/logo.jfif" alt="SalonNest Logo" className="login-logo" />
              </div>

              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h2 className="login-title">Forgot Password</h2>
                <p className="login-subtitle">Enter your email to receive a reset link.</p>
              </div>

              {isSubmitting ? (
                <PageLoader title="Preparing recovery" message="Checking account details..." />
              ) : (
                <>
                  {message ? (
                    <div style={{ padding: '16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', color: '#065f46', fontSize: '0.9rem', marginBottom: '24px', textAlign: 'center', fontWeight: 500 }}>
                      {message}
                    </div>
                  ) : null}

                  {error ? (
                    <div style={{ padding: '16px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '12px', color: '#b91c1c', fontSize: '0.9rem', marginBottom: '24px', textAlign: 'center', fontWeight: 500 }}>
                      {error}
                    </div>
                  ) : null}

                  <form onSubmit={submit}>
                    <div className="premium-input-group">
                      <label className="premium-label">Account Email</label>
                      <input
                        type="email"
                        required
                        placeholder="name@company.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="premium-input"
                      />
                    </div>
                    
                    <button type="submit" className="premium-button" disabled={isSubmitting}>
                      {isSubmitting ? "Sending..." : "Send Reset Link"}
                    </button>
                  </form>

                  {resetLink && (
                    <div style={{ marginTop: 24, padding: 16, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12 }}>
                      <span style={{ fontSize: '0.85rem', color: "#475569", fontWeight: 700, display: "block", marginBottom: 8 }}>🧪 Sandbox Testing Mode:</span>
                      <p style={{ fontSize: '0.8rem', color: "#64748b", margin: "0 0 12px" }}>SMTP is not configured in this sandbox workspace, so the recovery email cannot be dispatched. Use the link below to bypass email delivery and reset your password immediately:</p>
                      <a href={resetLink} style={{ fontSize: '0.9rem', color: '#3b82f6', fontWeight: 600, textDecoration: 'none', wordBreak: "break-all" }}>Reset Password Link &rarr;</a>
                    </div>
                  )}

                  <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <Link to="/login" style={{ fontSize: '0.9rem', color: '#64748b', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#3b82f6'} onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
                      &larr; Back to login
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
