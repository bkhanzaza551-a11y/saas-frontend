import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import PageLoader from "../../components/PageLoader";
import PublicMobileMenu from "../../components/PublicMobileMenu";
import { formatApiError } from "../../utils/apiError";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "Platform", to: "/platform" },
  { label: "Request Demo", to: "/book-demo" }
];

export default function DemoCheckoutPage() {
  const { leadId, planId } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [converted, setConverted] = useState(null);

  useEffect(() => {
    document.title = "Checkout & Subscribe | Salon Nest";
    api.get(`/public/demo-checkout-info/${leadId}/${planId}`)
      .then((res) => {
        setInfo(res.data);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.response?.status === 409) {
          const userEmail = err.response.data?.email || "";
          setConverted({ email: userEmail });
          setLoading(false);
          return;
        }
        setError(formatApiError(err, "Could not fetch checkout information. Please verify link details."));
        setLoading(false);
      });
  }, [leadId, planId]);

  const loadScript = (src) => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const loaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
      if (!loaded) {
        throw new Error("Failed to load Razorpay payment SDK. Please check your internet connection.");
      }

      let res;
      try {
        res = await api.post(`/public/demo-checkout/${leadId}/razorpay-order`, { planId });
      } catch (orderErr) {
        const status = orderErr?.response?.status;
        const msg = (orderErr?.response?.data?.message || "").toLowerCase();
        if (status === 409 || msg.includes("already_converted") || msg.includes("already converted")) {
          setConverted({ email: info?.leadEmail || "" });
          setSubmitting(false);
          return;
        }
        if (status === 404 || msg.includes("not found")) {
          setError("This subscription link has expired or the lead was already processed. Please contact support for a new link.");
          setSubmitting(false);
          return;
        }
        if (status === 503 || msg.includes("not configured")) {
          setError("Payment system is being set up. Please contact support at support@codexaurasolutions.com to complete your subscription.");
          setSubmitting(false);
          return;
        }
        setError(formatApiError(orderErr, "Could not initialize payment. Please try again."));
        setSubmitting(false);
        return;
      }
      if (res.data?.message === "ALREADY_CONVERTED") {
        setConverted({ email: info?.leadEmail || "" });
        setSubmitting(false);
        return;
      }
      const order = res.data;

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Salon Nest Salon ERP",
        description: `1-Year Annual Subscription to ${info?.planName || "Selected"} Plan`,
        order_id: order.orderId,
        handler: async function (response) {
          setSubmitting(true);
          try {
            const verifyRes = await api.post(`/public/demo-checkout/verify-razorpay`, {
              leadId,
              planId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            const { setupToken, loginAccessToken, email, alreadyConverted } = verifyRes.data || {};

            if (alreadyConverted) {
              setConverted({ email: email || info?.leadEmail || "" });
              setSubmitting(false);
              return;
            }

            if (setupToken && loginAccessToken && email) {
              window.location.href = `/setup-password?token=${encodeURIComponent(setupToken)}&email=${encodeURIComponent(email)}&access=${encodeURIComponent(loginAccessToken)}`;
              return;
            }

            setSuccess(true);
          } catch (err) {
            const errMsg = (err.response?.data?.message || "").toLowerCase();
            if (errMsg.includes("already belongs to an existing user") || errMsg.includes("already belongs to an existing")) {
              setError("This email is already registered. Please login with your existing account.");
            } else if (errMsg.includes("already converted") || errMsg.includes("alreadyConverted")) {
              setConverted({ email: info?.leadEmail || "" });
              setSubmitting(false);
              return;
            } else if (errMsg.includes("not found")) {
              setError("This subscription link has expired. Please contact support for a new link.");
            } else {
              setError(formatApiError(err, "Payment verification failed. Please contact support."));
            }
          } finally {
            setSubmitting(false);
          }
        },
        prefill: {
          name: order.leadName,
          email: order.leadEmail,
          contact: order.leadPhone
        },
        config: {
          display: {
            blocks: {
              utib: {
                name: "Pay using UPI",
                instruments: [{ method: "upi" }]
              }
            },
            sequence: ["block.utib", "other"],
            preferences: { show_default_blocks: true }
          }
        },
        theme: { color: "#0f766e" },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
            setError("Payment was not completed. You can retry using UPI, Netbanking, or a different card.");
          },
          confirm_close: true,
          escape: false
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        setSubmitting(false);
        const desc = response?.error?.description || "";
        if (desc.includes("International")) {
          setError("This card is not supported. Please use a UPI ID, Netbanking, or an Indian debit/credit card.");
        } else if (desc) {
          setError(`Payment failed: ${desc}. Please try another payment method.`);
        } else {
          setError("Payment could not be completed. Please try again with UPI, Netbanking, or a different card.");
        }
      });
      rzp.open();
    } catch (err) {
      const errMsg = (err.response?.data?.message || "").toLowerCase();
      if (errMsg.includes("already_converted") || errMsg.includes("already converted")) {
        window.location.href = `/login?email=${encodeURIComponent(info?.leadEmail || "")}`;
        return;
      }
      setError(formatApiError(err, "Could not initialize payment. Please try again."));
      setSubmitting(false);
    }
  };

  return (
    <div className="public-site demo-page-shell">
      <div className="public-orb orb-one" />
      <div className="public-orb orb-two" />
      
      <main className="public-main">
        <div className="demo-topbar">
          <Link to="/" className="brand-mark demo-brand-link">
            <img src="/logo.jfif" alt="Salon Nest Logo" style={{ maxHeight: "42px", maxWidth: "160px", objectFit: "contain" }} />
          </Link>
          <div className="demo-topbar-menu">
            <PublicMobileMenu
              brand={{ label: "Salon Nest", sublabel: "Salon ERP Platform", logo: "/logo.jfif", to: "/" }}
              items={navItems}
              cta={{ label: "Request Demo", to: "/book-demo" }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "100px 0" }}>
            <PageLoader
              title="Loading checkout details"
              message="Securing payment tunnel, loading plan limits, and configuring subscription checkout."
            />
          </div>
        ) : converted ? (
          <section className="demo-hero" style={{ justifyContent: "center", gridTemplateColumns: "1fr", maxWidth: 560, margin: "60px auto" }}>
            <div style={{ padding: "48px 36px", borderRadius: 24, textAlign: "center", background: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", border: "2px solid #bbf7d0" }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <h2 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Account Already Active</h2>
              <p style={{ margin: "0 0 24px", fontSize: 15, color: "#64748b", lineHeight: 1.6 }}>
                Your salon workspace has already been set up and is ready to use.
                {converted.email ? <><br/>Sign in with <strong style={{ color: "#0f172a" }}>{converted.email}</strong> to access your dashboard.</> : " Please sign in to access your dashboard."}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
                <Link
                  to={`/login${converted.email ? `?email=${encodeURIComponent(converted.email)}` : ""}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "13px 36px", fontSize: 15, fontWeight: 700, color: "#fff",
                    background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
                    borderRadius: 10, textDecoration: "none",
                    boxShadow: "0 4px 14px rgba(79, 70, 229, 0.3)",
                    transition: "transform 0.15s",
                  }}
                >
                  Sign In to Dashboard
                </Link>
                <Link to="/" style={{ fontSize: 13, color: "#64748b", textDecoration: "none", fontWeight: 600 }}>
                  ← Back to Home
                </Link>
              </div>
            </div>
          </section>
        ) : error && !info ? (
          <div style={{ maxWidth: 600, margin: "100px auto", textAlign: "center" }} className="panel-card">
            <h2 className="error-text" style={{ color: "#c2410c" }}>Checkout Error</h2>
            <p className="muted">{error}</p>
            <Link to="/" className="cta-primary" style={{ display: "inline-block", marginTop: 20 }}>Back to Home</Link>
          </div>
        ) : success ? (
          <section className="demo-hero" style={{ justifyContent: "center", gridTemplateColumns: "1fr", maxWidth: 700, margin: "60px auto" }}>
            <div className="demo-success-card" style={{ padding: 40, borderRadius: 24, textAlign: "center" }}>
              <div className="demo-success-badge" style={{ fontSize: 16, padding: "8px 16px" }}>Payment Captured</div>
              <h1 style={{ fontSize: 32, margin: "20px 0 10px" }}>Subscription Activated Successfully!</h1>
              <p style={{ fontSize: 16, lineHeight: "1.7", marginBottom: 30 }} className="muted">
                Thank you for purchasing the <strong>{info?.planName}</strong> subscription plan for <strong>{info?.company || "your salon"}</strong>.
                Your workspace has been created. Please check your email for the password setup link, or click below to set your password.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
                <Link to="/" className="cta-primary">Go to Homepage</Link>
                <Link to={`/login?email=${encodeURIComponent(info?.leadEmail || "")}`} className="cta-secondary">Go to Login</Link>
              </div>
            </div>
          </section>
        ) : (
          <section className="demo-hero">
            <div className="demo-copy">
              <div className="eyebrow-pill" style={{ background: "#e0f2fe", color: "#0369a1" }}>Subscription Checkout</div>
              <h1 style={{ background: "linear-gradient(135deg, #0f172a 0%, #0d9488 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Activate your subscription</h1>
              <p className="muted" style={{ fontSize: "1.05rem", lineHeight: "1.6", marginBottom: "24px" }}>
                Complete your checkout to spin up your active, paid business workspace. All plan limits and permissions will be applied to your custom salon slug.
              </p>

              <div className="ledger-card">
                <h3 style={{ margin: "0 0 16px", color: "#0f172a", fontSize: "1.1rem", fontWeight: 800 }}>Plan Ledger: {info?.planName}</h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div className="ledger-item">
                    <span className="muted">Billing Cycle</span>
                    <strong>Annual (1 Year)</strong>
                  </div>
                  <div className="ledger-item">
                    <span className="muted">Branches Allowed</span>
                    <strong>Unlimited</strong>
                  </div>
                  <div className="ledger-item">
                    <span className="muted">Stylist & Admin Accounts</span>
                    <strong>{info?.limits?.users} Users</strong>
                  </div>
                  <div className="ledger-item">
                    <span className="muted">CRM Client Limit</span>
                    <strong>{info?.limits?.customers} Contacts</strong>
                  </div>
                  <div className="ledger-item">
                    <span className="muted">POS Invoices / month</span>
                    <strong>{info?.limits?.invoices} Receipts</strong>
                  </div>
                  <div className="ledger-item">
                    <span className="muted">Base Annual Fee</span>
                    <span>INR {Number(info?.price || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="ledger-item" style={{ color: "#16a34a" }}>
                    <span className="muted">Setup Cost</span>
                    <span>₹0 (Waived)</span>
                  </div>
                </div>

                <div className="ledger-total">
                  <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1e293b" }}>Total Recurring:</span>
                  <span style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0f766e" }}>INR {Number(info?.price || 0).toLocaleString("en-IN")} <small style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "normal" }}>/ year</small></span>
                </div>
              </div>
            </div>

            <div className="demo-form-card" style={{ padding: "32px", borderRadius: "24px" }}>
              <form onSubmit={handleCheckoutSubmit} className="demo-form" style={{ display: "grid", gap: "18px" }}>
                <div className="section-chip" style={{ justifySelf: "start" }}>Secure Gateway Checkout</div>
                
                {error && <p className="error-text" style={{ color: "#ef4444", fontSize: "0.85rem", margin: 0 }}>{error}</p>}
                
                <div style={{ background: "rgba(244, 244, 245, 0.6)", padding: "20px", borderRadius: "16px", border: "1px solid #e4e4e7", display: "grid", gap: "14px" }}>
                  <div>
                    <span className="muted" style={{ fontSize: "0.72rem", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", color: "#71717a" }}>Billing Contact</span>
                    <strong style={{ color: "#18181b", fontSize: "1rem", fontWeight: 750 }}>{info?.leadName}</strong>
                  </div>
                  <div>
                    <span className="muted" style={{ fontSize: "0.72rem", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", color: "#71717a" }}>Billing Email</span>
                    <strong style={{ color: "#18181b", fontSize: "0.95rem", fontWeight: 600 }}>{info?.leadEmail}</strong>
                  </div>
                  {info?.company && (
                    <div>
                      <span className="muted" style={{ fontSize: "0.72rem", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", color: "#71717a" }}>Salon Organization</span>
                      <strong style={{ color: "#18181b", fontSize: "0.95rem", fontWeight: 600 }}>{info?.company}</strong>
                    </div>
                  )}
                </div>

                <div style={{ fontSize: "0.8rem", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "12px 16px", borderRadius: 12, display: "flex", gap: "8px", alignItems: "center" }}>
                  <span>&#128737;&#65039;</span>
                  <span>Payments are secured via Razorpay. All cards, UPI, Wallets, and Netbanking are supported.</span>
                </div>

                {error && error.includes("Payment gateway is not configured") && (
                  <div style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", padding: "16px", borderRadius: 12, fontSize: "0.85rem", lineHeight: "1.6" }}>
                    <strong>Payment system is being set up.</strong><br/>
                    Please contact our support team at <a href="mailto:support@salonnest.in" style={{ color: "#92400e", fontWeight: 700 }}>support@salonnest.in</a> to complete your subscription manually.
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={submitting} 
                  className={`demo-submit-button ${submitting ? "is-loading" : ""}`}
                  style={{ background: "linear-gradient(135deg, #0f766e, #0d9488)", color: "white", padding: "14px", borderRadius: "10px", fontWeight: 700, border: "none", cursor: "pointer", fontSize: "0.95rem", transition: "all 0.25s" }}
                >
                  {submitting ? (
                    <span className="button-progress">
                      <span className="button-spinner" aria-hidden="true" />
                      Launching Secure Gateway...
                    </span>
                  ) : (
                    `Pay INR ${Number(info?.price || 0).toLocaleString("en-IN")} via Razorpay`
                  )}
                </button>
              </form>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
