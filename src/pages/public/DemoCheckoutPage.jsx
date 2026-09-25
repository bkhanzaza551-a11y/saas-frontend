import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Building2, 
  Users, 
  User, 
  Mail, 
  Receipt, 
  Sparkles, 
  ArrowRight, 
  Zap, 
  AlertCircle 
} from "lucide-react";
import { api } from "../../api/client";
import PageLoader from "../../components/PageLoader";
import PublicMobileMenu from "../../components/PublicMobileMenu";
import { formatApiError } from "../../utils/apiError";
import "./DemoCheckoutPage.css";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "Platform", to: "/platform" },
  { label: "Request Demo", to: "/book-demo" }
];

export default function DemoCheckoutPage() {
  const { leadId, planId } = useParams();
  const [searchParams] = useSearchParams();
  const finalPriceParam = searchParams.get("finalPrice");

  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [converted, setConverted] = useState(null);

  useEffect(() => {
    document.title = "Checkout & Subscribe | Salon Nest";
    const queryStr = finalPriceParam ? `?finalPrice=${encodeURIComponent(finalPriceParam)}` : "";
    api.get(`/public/demo-checkout-info/${leadId}/${planId}${queryStr}`)
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
  }, [leadId, planId, finalPriceParam]);

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
        res = await api.post(`/public/demo-checkout/${leadId}/razorpay-order`, { 
          planId,
          finalPrice: info?.price 
        });
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
              finalPrice: info?.price,
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
    <div className="checkout-page-root">
      <div className="checkout-ambient-glow" />
      
      <div className="checkout-container">
        {/* Top Navigation */}
        <header className="checkout-topbar">
          <div className="checkout-topbar-left">
            <Link to="/" className="checkout-brand-link" title="Salon Nest Homepage">
              <img src="/logo.jfif" alt="Salon Nest Logo" className="checkout-brand-logo" />
            </Link>
            <div className="checkout-topbar-divider" />
            <div className="checkout-secure-badge">
              <Lock size={12} />
              <span>Secure 256-Bit SSL Checkout</span>
            </div>
          </div>

          <div className="checkout-topbar-right">
            <span className="checkout-help-text">
              Need assistance?{" "}
              <a href="mailto:support@salonnest.in" className="checkout-help-link">
                support@salonnest.in
              </a>
            </span>
            <PublicMobileMenu
              brand={{ label: "Salon Nest", sublabel: "Salon ERP Platform", logo: "/logo.jfif", to: "/" }}
              items={navItems}
              cta={{ label: "Request Demo", to: "/book-demo" }}
            />
          </div>
        </header>

        {loading ? (
          <div style={{ padding: "100px 0" }}>
            <PageLoader
              title="Loading checkout details"
              message="Securing payment tunnel, loading plan limits, and configuring subscription checkout."
            />
          </div>
        ) : converted ? (
          <section className="checkout-state-card">
            <div className="checkout-state-icon-wrap success">
              <CheckCircle2 size={38} strokeWidth={2.5} />
            </div>
            <h2 className="checkout-state-title">Account Already Active</h2>
            <p className="checkout-state-desc">
              Your salon workspace has already been set up and is fully active.
              {converted.email ? (
                <>
                  <br />
                  Sign in with <strong style={{ color: "#0f172a" }}>{converted.email}</strong> to access your dashboard.
                </>
              ) : (
                " Please sign in to access your business dashboard."
              )}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
              <Link
                to={`/login${converted.email ? `?email=${encodeURIComponent(converted.email)}` : ""}`}
                className="checkout-btn-primary"
              >
                Sign In to Dashboard <ArrowRight size={16} />
              </Link>
              <Link to="/" className="checkout-btn-secondary">
                ← Back to Home
              </Link>
            </div>
          </section>
        ) : error && !info ? (
          <section className="checkout-state-card">
            <div className="checkout-state-icon-wrap error">
              <AlertCircle size={38} strokeWidth={2.5} />
            </div>
            <h2 className="checkout-state-title" style={{ color: "#b91c1c" }}>Checkout Error</h2>
            <p className="checkout-state-desc">{error}</p>
            <Link to="/" className="checkout-btn-primary">
              Return to Homepage
            </Link>
          </section>
        ) : success ? (
          <section className="checkout-state-card" style={{ maxWidth: 640 }}>
            <div className="checkout-state-icon-wrap success">
              <CheckCircle2 size={42} strokeWidth={2.5} />
            </div>
            <div className="checkout-eyebrow" style={{ background: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0", margin: "0 auto 14px" }}>
              Payment Captured & Verified
            </div>
            <h1 className="checkout-state-title">Subscription Activated Successfully!</h1>
            <p className="checkout-state-desc">
              Thank you for purchasing the <strong>{info?.planName}</strong> plan for{" "}
              <strong>{info?.company || "your salon"}</strong>. Your business workspace has been provisioned. 
              Please check your inbox at <strong>{info?.leadEmail}</strong> for setup instructions or proceed below.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
              <Link to="/" className="checkout-btn-secondary">
                Go to Homepage
              </Link>
              <Link to={`/login?email=${encodeURIComponent(info?.leadEmail || "")}`} className="checkout-btn-primary">
                Sign In to Dashboard <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        ) : (
          <>
            {/* Unified Page Header: Properly Centered/Aligned Above Both Columns */}
            <div className="checkout-header">
              <div className="checkout-eyebrow">
                <Sparkles size={13} />
                <span>Subscription Checkout</span>
              </div>
              <h1 className="checkout-title">
                <span className="checkout-title-gradient">Activate your subscription</span>
              </h1>
              <p className="checkout-subtitle">
                Complete your checkout to spin up your active, paid business workspace. All plan limits and permissions will be applied to your custom salon slug.
              </p>
            </div>

            {/* Balanced 2-Column Checkout Grid */}
            <div className="checkout-grid">
              {/* Left Column: Plan Inclusions & Financial Ledger */}
              <div className="checkout-card plan-summary-card">
                <div className="plan-card-header">
                  <div className="plan-card-header-info">
                    <span className="plan-card-pretitle">Selected Plan</span>
                    <h2 className="plan-card-title">{info?.planName || "Enterprise"} Plan</h2>
                  </div>
                  <div className="plan-badge-annual">
                    <Zap size={13} />
                    <span>Annual (1 Year)</span>
                  </div>
                </div>

                <div className="plan-inclusions-label">Workspace Limits & Inclusions</div>
                
                <div className="plan-inclusions-list">
                  <div className="plan-inclusion-row">
                    <span className="plan-inclusion-left">
                      <Building2 size={16} className="plan-inclusion-icon" />
                      <span>Branches Allowed</span>
                    </span>
                    <strong className="plan-inclusion-value highlight">
                      {info?.limits?.branches >= 9999 ? "Unlimited Locations" : `${info?.limits?.branches || 1} Location${(info?.limits?.branches || 1) > 1 ? "s" : ""}`}
                    </strong>
                  </div>

                  <div className="plan-inclusion-row">
                    <span className="plan-inclusion-left">
                      <Users size={16} className="plan-inclusion-icon" />
                      <span>Stylist & Admin Accounts</span>
                    </span>
                    <strong className="plan-inclusion-value">
                      {info?.limits?.users ? `${Number(info.limits.users).toLocaleString("en-IN")} Users` : "9,999 Users"}
                    </strong>
                  </div>

                  <div className="plan-inclusion-row">
                    <span className="plan-inclusion-left">
                      <User size={16} className="plan-inclusion-icon" />
                      <span>CRM Client Limit</span>
                    </span>
                    <strong className="plan-inclusion-value">
                      {Number(info?.limits?.customers || 500).toLocaleString("en-IN")} Contacts
                    </strong>
                  </div>

                  <div className="plan-inclusion-row">
                    <span className="plan-inclusion-left">
                      <Receipt size={16} className="plan-inclusion-icon" />
                      <span>POS Invoices / year</span>
                    </span>
                    <strong className="plan-inclusion-value">
                      {Number(info?.limits?.invoices || 1000).toLocaleString("en-IN")} Receipts
                    </strong>
                  </div>

                  <div className="plan-inclusion-row">
                    <span className="plan-inclusion-left">
                      <Sparkles size={16} className="plan-inclusion-icon" />
                      <span>Cloud POS & Automatic Backups</span>
                    </span>
                    <strong className="plan-inclusion-value highlight">
                      Included
                    </strong>
                  </div>
                </div>

                <div className="plan-pricing-section">
                  <div className="plan-pricing-row">
                    <span>Base Annual Fee</span>
                    <span style={info?.discountAmount > 0 ? { textDecoration: "line-through", color: "#94a3b8" } : { fontWeight: 600 }}>
                      INR {Number(info?.originalPrice || info?.price || 0).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {info?.discountAmount > 0 && (
                    <div className="plan-pricing-row discount-row">
                      <span>Special Promotional Discount</span>
                      <strong>- INR {Number(info.discountAmount).toLocaleString("en-IN")}</strong>
                    </div>
                  )}

                  <div className="plan-pricing-row">
                    <span>Setup & Onboarding Fee</span>
                    <span className="waived-badge">₹0 (Waived)</span>
                  </div>
                </div>

                <div className="plan-total-banner">
                  <div>
                    <div className="plan-total-title">Grand Total Payable:</div>
                    <p className="plan-total-subtext">Billed annually • Instant workspace license</p>
                  </div>
                  <div className="plan-total-amount-box">
                    <span className="plan-total-amount">
                      INR {Number(info?.price || 0).toLocaleString("en-IN")}
                    </span>
                    <span className="plan-total-period">/ year</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Account & Secure Razorpay Payment */}
              <div className="checkout-card payment-gateway-card">
                <form onSubmit={handleCheckoutSubmit}>
                  <div className="payment-card-chip">
                    <ShieldCheck size={13} />
                    <span>Secure Gateway Checkout</span>
                  </div>

                  <h2 className="payment-card-title">Billing Details & Payment</h2>

                  {error && (
                    <div className="checkout-error-box">
                      <AlertCircle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="billing-profile-box">
                    <div className="billing-profile-title">Billing & Workspace Profile</div>
                    
                    <div className="billing-profile-grid">
                      <div className="billing-profile-item">
                        <User size={15} className="billing-profile-icon" />
                        <div className="billing-profile-meta">
                          <span className="billing-profile-label">Billing Contact</span>
                          <span className="billing-profile-val">{info?.leadName || "Authorized Representative"}</span>
                        </div>
                      </div>

                      <div className="billing-profile-item">
                        <Mail size={15} className="billing-profile-icon" />
                        <div className="billing-profile-meta">
                          <span className="billing-profile-label">Billing Email</span>
                          <span className="billing-profile-val">{info?.leadEmail || "Registered Contact Email"}</span>
                        </div>
                      </div>

                      {info?.company && (
                        <div className="billing-profile-item">
                          <Building2 size={15} className="billing-profile-icon" />
                          <div className="billing-profile-meta">
                            <span className="billing-profile-label">Salon Organization</span>
                            <span className="billing-profile-val">{info?.company}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="billing-profile-hint">
                      <Lock size={12} />
                      <span>Workspace credentials & tax receipt will be delivered to this email.</span>
                    </div>
                  </div>

                  <div className="razorpay-trust-box">
                    <div className="razorpay-trust-header">
                      <ShieldCheck size={16} />
                      <span>Payments are secured via Razorpay</span>
                    </div>
                    <p className="razorpay-trust-desc">
                      Bank-grade 256-bit encrypted transactions. All Indian payment modes supported.
                    </p>
                    <div className="payment-methods-pills">
                      <span className="payment-method-pill">UPI (GPay / PhonePe / Paytm)</span>
                      <span className="payment-method-pill">Credit & Debit Cards</span>
                      <span className="payment-method-pill">Netbanking (50+ Banks)</span>
                      <span className="payment-method-pill">Wallets</span>
                    </div>
                  </div>

                  {error && error.includes("Payment gateway is not configured") && (
                    <div style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", padding: "14px", borderRadius: 10, fontSize: "0.85rem", lineHeight: "1.5", marginBottom: 16 }}>
                      <strong>Payment system is being set up.</strong><br/>
                      Please contact support at <a href="mailto:support@salonnest.in" style={{ color: "#92400e", fontWeight: 700 }}>support@salonnest.in</a> to complete your setup.
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={submitting} 
                    className="checkout-pay-btn"
                  >
                    {submitting ? (
                      <>
                        <span className="checkout-spinner" />
                        <span>Launching Secure Gateway...</span>
                      </>
                    ) : (
                      <>
                        <Lock size={16} />
                        <span>Pay INR {Number(info?.price || 0).toLocaleString("en-IN")} via Razorpay</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <div className="checkout-trust-pillars">
                    <div className="checkout-trust-pillar">
                      <Lock size={12} color="#0f766e" />
                      <span>256-Bit SSL</span>
                    </div>
                    <div className="checkout-trust-pillar">
                      <Zap size={12} color="#0f766e" />
                      <span>Instant Setup</span>
                    </div>
                    <div className="checkout-trust-pillar">
                      <Receipt size={12} color="#0f766e" />
                      <span>GST Tax Invoice</span>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

