import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import { Check, ArrowRight, Calendar, Users, CreditCard, BarChart3, Shield, Store, AlertCircle } from "lucide-react";
import PublicMobileMenu from "../../components/PublicMobileMenu";

const initialForm = { name: "", email: "", phone: "", company: "", message: "" };
const navLinks = [
  { label: "Home", to: "/" },
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "Platform", to: "/platform" },
  { label: "Request Demo", to: "/book-demo" }
];

const agendaItems = [
  { icon: Users, title: "Unified Workspace Access", desc: "Check out owner, manager, receptionist, and stylist portals in action." },
  { icon: Store, title: "Multi-Branch & Service Control", desc: "Configure staff assignments, categories, and branch-wide catalogs." },
  { icon: CreditCard, title: "POS Billing & Invoicing", desc: "Issue receipts, track payments, download reports, and export CSVs." },
  { icon: BarChart3, title: "Reports & Analytics", desc: "Sales, revenue, branch comparison, and staff performance dashboards." },
  { icon: Shield, title: "Role-Based Permissions", desc: "How roles and permissions work across the same admin panel." },
  { icon: Calendar, title: "Appointments & Scheduling", desc: "Calendar views, booking flow, and staff availability tracking." }
];

const nextSteps = [
  { step: 1, title: "Request Submitted", desc: "Your demo request lands in our review pipeline instantly." },
  { step: 2, title: "Team Contact", desc: "Our deployment specialist will reach out within 24 hours." },
  { step: 3, title: "Demo Provisioned", desc: "We set up a sandboxed multi-branch environment for your salon." },
  { step: 4, title: "Live Walkthrough", desc: "Guided session covering every module relevant to your business." }
];

export default function PublicDemoLeadPage() {
  const location = useLocation();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [state, setState] = useState({ error: "", success: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Request Demo | Salon Nest";
    api.get("/public/settings").catch(() => {});
  }, []);

  const validateField = (field, value) => {
    const val = String(value || "").trim();
    if (field === "name") {
      if (!val) return "Your full name is required";
      if (val.length < 2) return "Name must be at least 2 characters";
      return "";
    }
    if (field === "email") {
      if (!val) return "Work email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(val)) return "Please enter a valid work email address (e.g. name@company.com)";
      return "";
    }
    if (field === "phone") {
      if (!val) return "Phone number is required";
      const digits = val.replace(/\D/g, "");
      if (digits.length !== 10) return "Please enter a valid 10-digit mobile number";
      return "";
    }
    if (field === "company") {
      if (!val) return "Salon / Studio name is required";
      if (val.length < 2) return "Salon name must be at least 2 characters";
      return "";
    }
    return "";
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const err = validateField(field, form[field]);
    setErrors(prev => ({ ...prev, [field]: err }));
  };

  const handleChange = (field, value) => {
    let finalVal = value;
    if (field === "phone") {
      // Allow only digits and limit to strictly 10 digits
      finalVal = value.replace(/\D/g, "").slice(0, 10);
    }
    setForm(prev => ({ ...prev, [field]: finalVal }));
    if (touched[field]) {
      const err = validateField(field, finalVal);
      setErrors(prev => ({ ...prev, [field]: err }));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setState({ error: "", success: "" });

    // Validate all required fields
    const newErrors = {
      name: validateField("name", form.name),
      email: validateField("email", form.email),
      phone: validateField("phone", form.phone),
      company: validateField("company", form.company)
    };

    setTouched({ name: true, email: true, phone: true, company: true });
    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some(Boolean);
    if (hasErrors) {
      setState({ error: "Please correct the highlighted fields before submitting.", success: "" });
      return;
    }

    setSubmitting(true);
    try {
      const cleanDigits = form.phone.replace(/\D/g, "").slice(0, 10);
      const payload = {
        ...form,
        phone: `+91${cleanDigits}`
      };
      await api.post("/public/demo-leads", payload);
      setForm(initialForm);
      setErrors({});
      setTouched({});
      setState({ error: "", success: "Your demo request has been received. Our team will contact you shortly." });
    } catch (err) {
      setState({ error: formatApiError(err, "Could not submit your demo request right now."), success: "" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* HEADER */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <img src="/logo.jfif" alt="Salon Nest Logo" style={{ maxHeight: "42px", maxWidth: "160px", objectFit: "contain" }} />
          </Link>
          <nav className="public-nav-links" style={{ gap: 32 }}>
            {navLinks.map(item => (
              <Link key={item.to} to={item.to} style={{ textDecoration: "none", fontSize: 14, fontWeight: 500, color: location.pathname === item.to ? "#0d9488" : "#64748b" }}>{item.label}</Link>
            ))}
          </nav>
          <div className="public-nav-cta" style={{ gap: 12 }}>
            <Link to="/login" style={{ textDecoration: "none", fontSize: 14, fontWeight: 600, color: "#64748b", padding: "8px 16px" }}>Login</Link>
            <Link to="/book-demo" style={{ textDecoration: "none", fontSize: 14, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg, #0d9488, #14b8a6)", padding: "10px 24px", borderRadius: 10 }}>Request Demo</Link>
          </div>
          <PublicMobileMenu
            brand={{ label: "Salon Nest", sublabel: "Salon ERP Platform", logo: "/logo.jfif", to: "/" }}
            items={navLinks}
            cta={{ label: "Book Demo", to: "/book-demo" }}
          />
        </div>
      </header>

      <main>
        {/* HERO + FORM */}
        <section className="demo-lead-hero-section" style={{ background: "linear-gradient(135deg, #f0fdfa 0%, #f8fafc 50%, #ecfdf5 100%)" }}>
          <div className="demo-lead-hero-grid" style={{ maxWidth: 1200, margin: "0 auto", alignItems: "center" }}>
            {/* Left - Content */}
            <div>
              <div style={{ display: "inline-block", padding: "6px 16px", background: "#ccfbf1", color: "#0f766e", borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 20 }}>DEMO SESSION</div>
              <h1 className="demo-lead-heading" style={{ margin: "0 0 20px" }}>
                Let's map your <span style={{ color: "#0d9488" }}>salon workflow.</span>
              </h1>
              <p style={{ fontSize: "1.1rem", color: "#64748b", lineHeight: 1.7, margin: "0 0 32px", maxWidth: 480 }}>
                Share your details, and our deployment specialists will configure a sandboxed multi-branch demo environment for your salon.
              </p>

              {/* Agenda */}
              <div style={{ background: "#fff", borderRadius: 20, padding: 28, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
                <h3 style={{ margin: "0 0 20px", fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>Demo Agenda Highlights</h3>
                <div className="demo-agenda-grid" style={{ gap: 16 }}>
                  {agendaItems.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0fdfa", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon size={18} color="#0d9488" />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{item.title}</div>
                          <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>{item.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Trust badges */}
              <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
                {["Owner/Admin panel", "POS + invoices", "Reports + CRM", "Multi-branch"].map(badge => (
                  <span key={badge} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 100, fontSize: 12, fontWeight: 500, color: "#475569" }}>
                    <Check size={14} color="#0d9488" /> {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Right - Form */}
            <div className="demo-form-card-container">
              <div style={{ display: "inline-block", padding: "6px 14px", background: "#f0fdfa", color: "#0f766e", borderRadius: 100, fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 20 }}>REQUEST GUIDED WALKTHROUGH</div>

              {state.success ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <Check size={32} color="#10b981" />
                  </div>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>Request Received!</h3>
                  <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px" }}>{state.success}</p>
                  <button onClick={() => setState({ error: "", success: "" })} style={{ padding: "12px 28px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer", color: "#334155" }}>Submit Another Request</button>
                </div>
              ) : (
                <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
                    {/* Name Field */}
                    <div>
                      <label className="demo-label">Your Name *</label>
                      <input
                        className="demo-input"
                        value={form.name}
                        placeholder="Full name"
                        required
                        onChange={e => handleChange("name", e.target.value)}
                        onBlur={() => handleBlur("name")}
                        style={touched.name && errors.name ? { borderColor: "#ef4444", background: "#fff5f5" } : {}}
                      />
                      {touched.name && errors.name && (
                        <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                          <AlertCircle size={13} /> {errors.name}
                        </div>
                      )}
                    </div>

                    {/* Email Field */}
                    <div>
                      <label className="demo-label">Work Email *</label>
                      <input
                        className="demo-input"
                        value={form.email}
                        type="email"
                        placeholder="name@company.com"
                        required
                        onChange={e => handleChange("email", e.target.value)}
                        onBlur={() => handleBlur("email")}
                        style={touched.email && errors.email ? { borderColor: "#ef4444", background: "#fff5f5" } : {}}
                      />
                      {touched.email && errors.email && (
                        <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                          <AlertCircle size={13} /> {errors.email}
                        </div>
                      )}
                    </div>

                    {/* Phone Field */}
                    <div>
                      <label className="demo-label">Phone Number *</label>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          borderRadius: 8,
                          border: `1px solid ${touched.phone && errors.phone ? "#ef4444" : "#e2e8f0"}`,
                          background: touched.phone && errors.phone ? "#fff5f5" : "#fff",
                          overflow: "hidden",
                          transition: "border-color 0.2s"
                        }}
                      >
                        <div
                          style={{
                            padding: "0 12px",
                            background: "#f8fafc",
                            borderRight: "1px solid #e2e8f0",
                            color: "#334155",
                            fontWeight: 700,
                            fontSize: 14,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            height: 44,
                            userSelect: "none"
                          }}
                        >
                          🇮🇳 +91
                        </div>
                        <input
                          className="demo-input"
                          value={form.phone}
                          type="tel"
                          maxLength={10}
                          placeholder="9876543210"
                          required
                          onChange={e => handleChange("phone", e.target.value)}
                          onBlur={() => handleBlur("phone")}
                          style={{
                            border: "none",
                            borderRadius: 0,
                            height: 44,
                            flex: 1,
                            padding: "0 12px",
                            background: "transparent",
                            outline: "none"
                          }}
                        />
                      </div>
                      {touched.phone && errors.phone ? (
                        <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                          <AlertCircle size={13} /> {errors.phone}
                        </div>
                      ) : (
                        <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>
                          Enter your 10-digit mobile number
                        </div>
                      )}
                    </div>

                    {/* Salon Name Field */}
                    <div>
                      <label className="demo-label">Salon Name *</label>
                      <input
                        className="demo-input"
                        value={form.company}
                        placeholder="Salon / Studio name"
                        required
                        onChange={e => handleChange("company", e.target.value)}
                        onBlur={() => handleBlur("company")}
                        style={touched.company && errors.company ? { borderColor: "#ef4444", background: "#fff5f5" } : {}}
                      />
                      {touched.company && errors.company && (
                        <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                          <AlertCircle size={13} /> {errors.company}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message Field */}
                  <div>
                    <label className="demo-label">How can we help? (Optional)</label>
                    <textarea
                      className="demo-input"
                      rows={4}
                      value={form.message}
                      placeholder="Tell us about your branch count, team size, or what you want to see."
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      style={{ resize: "vertical" }}
                    />
                  </div>

                  {state.error && (
                    <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 10, color: "#dc2626", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                      <AlertCircle size={16} />
                      <span>{state.error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      width: "100%",
                      padding: "14px",
                      background: submitting ? "#94a3b8" : "linear-gradient(135deg, #0d9488, #14b8a6)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 12,
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: submitting ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8
                    }}
                  >
                    {submitting ? "Submitting..." : <>Submit Demo Request <ArrowRight size={18} /></>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* WHAT HAPPENS NEXT */}
        <section style={{ padding: "80px 24px", background: "#fff" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-block", padding: "6px 16px", background: "#f0fdfa", color: "#0f766e", borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16 }}>NEXT STEPS</div>
            <h2 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>What happens after you submit?</h2>
          </div>
          <div className="demo-steps-grid" style={{ maxWidth: 1000, margin: "0 auto" }}>
            {nextSteps.map((s, i) => (
              <div key={i} style={{ textAlign: "center", position: "relative" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #0d9488, #14b8a6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, margin: "0 auto 16px" }}>{s.step}</div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>{s.title}</h4>
                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
                {i < nextSteps.length - 1 && <ArrowRight className="step-arrow" size={20} color="#d1d5db" style={{ position: "absolute", right: -20, top: 18 }} />}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: "60px 24px", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", textAlign: "center" }}>
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", margin: "0 0 16px" }}>Want to explore first?</h2>
            <p style={{ fontSize: "1rem", color: "#94a3b8", marginBottom: 32 }}>Check out our features and pricing before booking the walkthrough.</p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <Link to="/features" style={{ textDecoration: "none", padding: "14px 32px", background: "#fff", color: "#0f172a", borderRadius: 12, fontWeight: 700, fontSize: 15 }}>View Features</Link>
              <Link to="/pricing" style={{ textDecoration: "none", padding: "14px 32px", background: "transparent", color: "#fff", borderRadius: 12, fontWeight: 700, fontSize: 15, border: "2px solid rgba(255,255,255,0.2)" }}>View Pricing</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
