import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import {
  Check, ArrowRight, Calendar, Users, CreditCard, BarChart3, Shield, Store,
  AlertCircle, Sparkles, CheckCircle2, Phone, Mail, MapPin, HeadphonesIcon,
  ShieldCheck, Zap, Building2, Send
} from "lucide-react";
import PublicMobileMenu from "../../components/PublicMobileMenu";

const initialForm = { name: "", email: "", phone: "", company: "", branchCount: "1", message: "" };

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "Contact", to: "/contact" }
];

const agendaItems = [
  { icon: CreditCard, title: "5-Second POS Billing", desc: "Split payments, dynamic GST calculation, and instant WhatsApp PDF invoices." },
  { icon: Calendar, title: "Collision-Free Appointments", desc: "Interactive calendar, stylist shift mapping, and 2-hour automated reminders." },
  { icon: Users, title: "Client CRM & Loyalty Engine", desc: "Hair color formula notes, tiered loyalty points ledger, and birthday greetings." },
  { icon: Store, title: "Branded Digital Storefront", desc: "Luxury online booking menu, retail product cart, and Razorpay payments." },
  { icon: Building2, title: "Multi-Branch Central Sync", desc: "1-Click branch switching, inter-branch stock transfers, and consolidated P&L." },
  { icon: ShieldCheck, title: "Facial Attendance & Commissions", desc: "Biometric clock-in, multi-tier stylist commissions, and zero-dispute payroll." }
];

const nextSteps = [
  { step: 1, title: "Request Received", desc: "Your demo inquiry lands directly in our solution architect queue." },
  { step: 2, title: "Intro & Goal Alignment", desc: "We review your salon size, branch count, and migration requirements." },
  { step: 3, title: "Sandbox Configured", desc: "We set up a live multi-branch test environment mapped to your salon type." },
  { step: 4, title: "1-on-1 Live Walkthrough", desc: "Guided 30-minute interactive video session covering every module." }
];

export default function PublicDemoLeadPage() {
  const location = useLocation();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [state, setState] = useState({ error: "", success: "" });
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    document.title = "Request 1-on-1 Live Demo | Salon Nest ERP";
    window.scrollTo({ top: 0, behavior: "smooth" });
    api.get("/public/settings")
      .then(res => setSettings(res.data || {}))
      .catch(() => {});
  }, []);

  const whatsappHref = settings?.whatsappNumber
    ? `https://wa.me/${String(settings.whatsappNumber).replace(/[^\d]/g, "")}`
    : "https://wa.me/919493952587";

  const validateField = (field, value) => {
    const val = String(value || "").trim();
    if (field === "name") {
      if (!val) return "Your full name is required";
      if (val.length < 2) return "Name must be at least 2 characters";
      return "";
    }
    if (field === "email") {
      if (!val) return "Work email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(val)) return "Please enter a valid email address (e.g. priya@salon.in)";
      return "";
    }
    if (field === "phone") {
      if (!val) return "Mobile number is required";
      const digits = val.replace(/\D/g, "");
      if (digits.length !== 10) return "Please enter a valid 10-digit mobile number";
      return "";
    }
    if (field === "company") {
      if (!val) return "Salon / Spa name is required";
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
      setState({ error: "Please fill in the highlighted required fields correctly.", success: "" });
      return;
    }

    setSubmitting(true);
    try {
      const cleanDigits = form.phone.replace(/\D/g, "").slice(0, 10);
      const payload = {
        name: form.name,
        email: form.email,
        phone: `+91${cleanDigits}`,
        company: form.company,
        notes: form.message || "General Walkthrough"
      };
      await api.post("/public/demo-leads", payload);
      setForm(initialForm);
      setErrors({});
      setTouched({});
      setState({ 
        error: "", 
        success: "Your demo walkthrough request has been received! Our deployment specialist will reach out on WhatsApp/Phone shortly." 
      });
    } catch (err) {
      setState({ error: formatApiError(err, "Could not submit your demo request right now. Please try again or WhatsApp us directly."), success: "" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif", color: "#0f172a", overflowX: "hidden" }}>
      
      {/* HEADER */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(226,232,240,0.8)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 74 }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <img src="/logo.jfif" alt="Salon Nest Logo" style={{ maxHeight: "42px", maxWidth: "160px", objectFit: "contain" }} />
          </Link>
          
          <nav className="public-nav-links">
            {navLinks.map(item => (
              <Link 
                key={item.to} 
                to={item.to} 
                style={{ 
                  textDecoration: "none", 
                  fontSize: 14.5, 
                  fontWeight: 600, 
                  color: "#334155",
                  transition: "color 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.color = "#0d9488"}
                onMouseLeave={e => e.currentTarget.style.color = "#334155"}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="public-nav-cta">
            <Link to="/login" style={{ textDecoration: "none", fontSize: 14.5, fontWeight: 700, color: "#0f172a", padding: "8px 16px" }}>Sign In</Link>
            <Link to="/book-demo" className="btn-glow-primary" style={{ textDecoration: "none", fontSize: 14, padding: "10px 22px", borderRadius: 10, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={15} /> Request Demo
            </Link>
          </div>

          <PublicMobileMenu
            brand={{ label: "Salon Nest", sublabel: "Salon ERP Platform", logo: "/logo.jfif", to: "/" }}
            items={navLinks}
            cta={{ label: "Request Demo", to: "/book-demo" }}
          />
        </div>
      </header>

      <main>
        {/* HERO + INTERACTIVE DEMO FORM */}
        <section style={{ padding: "60px 24px 80px", background: "radial-gradient(circle at 80% 20%, rgba(204,251,241,0.5) 0%, rgba(240,253,250,0.3) 40%, #ffffff 80%)", position: "relative" }}>
          
          <div className="public-demo-hero-grid">
            
            {/* Left Column: Agenda & Value Prop */}
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", background: "#f0fdfa", border: "1px solid #ccfbf1", color: "#0f766e", borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 20 }}>
                <Sparkles size={13} /> 1-ON-1 PERSONALIZED DEMO
              </div>

              <h1 className="marketing-hero-heading" style={{ margin: "0 0 16px", color: "#0f172a" }}>
                Experience the calm control of <span style={{ background: "linear-gradient(135deg, #0d9488 0%, #0284c7 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Salon Nest</span>.
              </h1>

              <p style={{ fontSize: "1.15rem", color: "#475569", lineHeight: 1.7, margin: "0 0 32px", maxWidth: 520 }}>
                Our salon deployment experts will walk you through live 5-second POS billing, automated WhatsApp notifications, stylist commission engines, and centralized multi-branch control.
              </p>

              {/* Agenda 6 Highlights Box */}
              <div style={{ background: "#ffffff", borderRadius: 22, padding: "28px", border: "1px solid #e2e8f0", boxShadow: "0 10px 30px rgba(0,0,0,0.04)", marginBottom: 28 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0d9488" }} />
                  What We Will Cover in Your Live Session:
                </div>

                <div className="agenda-grid-2">
                  {agendaItems.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0fdfa", display: "flex", alignItems: "center", justifyContent: "center", color: "#0d9488", border: "1px solid #ccfbf1", flexShrink: 0 }}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{item.title}</div>
                          <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.4 }}>{item.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Social Proof & WhatsApp Desk */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#334155", fontWeight: 600 }}>
                  <CheckCircle2 size={16} color="#0d9488" />
                  <span>Trusted by 500+ Salons across India & UAE</span>
                </div>

                <a 
                  href={whatsappHref} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#16a34a", textDecoration: "none" }}
                >
                  <span>💬</span> Need urgent setup? WhatsApp Us &rarr;
                </a>
              </div>

            </div>

            {/* Right Column: High-Converting Form Card */}
            <div style={{ background: "#ffffff", borderRadius: 24, padding: "36px 32px", border: "1px solid #e2e8f0", boxShadow: "0 20px 50px rgba(0,0,0,0.06)", position: "relative" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, borderBottom: "1px solid #f1f5f9", paddingBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
                    Book Your Live Walkthrough
                  </h3>
                  <div style={{ fontSize: 12.5, color: "#64748b" }}>
                    Takes less than 30 seconds • No credit card required
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, background: "#ecfdf5", color: "#059669", padding: "4px 10px", borderRadius: 20 }}>
                  ● SPOTS OPEN
                </span>
              </div>

              {state.success ? (
                <div style={{ textAlign: "center", padding: "30px 10px" }}>
                  <div style={{ width: 68, height: 68, borderRadius: "50%", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", color: "#059669" }}>
                    <Check size={36} strokeWidth={3} />
                  </div>
                  <h4 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>
                    Walkthrough Scheduled!
                  </h4>
                  <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, margin: "0 0 24px" }}>
                    {state.success}
                  </p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <a 
                      href={whatsappHref} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#25d366", color: "#fff", padding: "14px 24px", borderRadius: 12, fontWeight: 700, fontSize: 14.5, textDecoration: "none", boxShadow: "0 4px 14px rgba(37,211,102,0.3)" }}
                    >
                      <span>💬</span> Connect with Onboarding Specialist on WhatsApp
                    </a>
                    <button 
                      type="button" 
                      onClick={() => setState({ error: "", success: "" })} 
                      style={{ padding: "10px 20px", background: "none", border: "none", color: "#64748b", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}
                    >
                      Submit another inquiry
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {/* Name */}
                    <div>
                      <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Your Full Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Priya Sharma"
                        required
                        value={form.name}
                        onChange={e => handleChange("name", e.target.value)}
                        onBlur={() => handleBlur("name")}
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          borderRadius: 10,
                          border: `1px solid ${touched.name && errors.name ? "#ef4444" : "#cbd5e1"}`,
                          background: touched.name && errors.name ? "#fff5f5" : "#ffffff",
                          fontSize: 14,
                          outline: "none",
                          boxSizing: "border-box"
                        }}
                      />
                      {touched.name && errors.name && (
                        <div style={{ color: "#ef4444", fontSize: 11.5, marginTop: 4, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                          <AlertCircle size={13} /> {errors.name}
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Work Email *</label>
                      <input
                        type="email"
                        placeholder="priya@salonstudio.in"
                        required
                        value={form.email}
                        onChange={e => handleChange("email", e.target.value)}
                        onBlur={() => handleBlur("email")}
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          borderRadius: 10,
                          border: `1px solid ${touched.email && errors.email ? "#ef4444" : "#cbd5e1"}`,
                          background: touched.email && errors.email ? "#fff5f5" : "#ffffff",
                          fontSize: 14,
                          outline: "none",
                          boxSizing: "border-box"
                        }}
                      />
                      {touched.email && errors.email && (
                        <div style={{ color: "#ef4444", fontSize: 11.5, marginTop: 4, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                          <AlertCircle size={13} /> {errors.email}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {/* Phone with India prefix */}
                    <div>
                      <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Mobile / WhatsApp *</label>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          borderRadius: 10,
                          border: `1px solid ${touched.phone && errors.phone ? "#ef4444" : "#cbd5e1"}`,
                          background: touched.phone && errors.phone ? "#fff5f5" : "#ffffff",
                          overflow: "hidden"
                        }}
                      >
                        <div
                          style={{
                            padding: "0 12px",
                            background: "#f8fafc",
                            borderRight: "1px solid #e2e8f0",
                            color: "#1e293b",
                            fontWeight: 700,
                            fontSize: 13.5,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            height: 44,
                            userSelect: "none"
                          }}
                        >
                          <span style={{ fontSize: 15 }}>🇮🇳</span>
                          <span>+91</span>
                        </div>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="9876543210"
                          required
                          value={form.phone}
                          onChange={e => handleChange("phone", e.target.value)}
                          onBlur={() => handleBlur("phone")}
                          style={{
                            border: "none",
                            borderRadius: 0,
                            height: 44,
                            flex: 1,
                            padding: "0 12px",
                            background: "transparent",
                            outline: "none",
                            fontSize: 14
                          }}
                        />
                      </div>
                      {touched.phone && errors.phone ? (
                        <div style={{ color: "#ef4444", fontSize: 11.5, marginTop: 4, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                          <AlertCircle size={13} /> {errors.phone}
                        </div>
                      ) : (
                        <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>
                          10-digit number for WhatsApp updates
                        </div>
                      )}
                    </div>

                    {/* Salon Name */}
                    <div>
                      <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Salon / Spa Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Luxe Studio"
                        required
                        value={form.company}
                        onChange={e => handleChange("company", e.target.value)}
                        onBlur={() => handleBlur("company")}
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          borderRadius: 10,
                          border: `1px solid ${touched.company && errors.company ? "#ef4444" : "#cbd5e1"}`,
                          background: touched.company && errors.company ? "#fff5f5" : "#ffffff",
                          fontSize: 14,
                          outline: "none",
                          boxSizing: "border-box"
                        }}
                      />
                      {touched.company && errors.company && (
                        <div style={{ color: "#ef4444", fontSize: 11.5, marginTop: 4, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                          <AlertCircle size={13} /> {errors.company}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message / Notes */}
                  <div>
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>What are your primary goals? (Optional)</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Want to replace old desktop software, migrate 10,000 clients, and automate stylist commissions."
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        fontSize: 14,
                        outline: "none",
                        boxSizing: "border-box",
                        resize: "vertical"
                      }}
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
                    className="btn-glow-primary"
                    style={{
                      width: "100%",
                      padding: "15px",
                      borderRadius: 12,
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: submitting ? "not-allowed" : "pointer",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      marginTop: 4
                    }}
                  >
                    {submitting ? "Submitting Inquiry..." : <>Request Guided Walkthrough <ArrowRight size={17} /></>}
                  </button>

                  <div style={{ textAlign: "center", fontSize: 11.5, color: "#94a3b8", display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", marginTop: 4 }}>
                    <span>🔒 Zero Spam Guarantee</span>
                    <span>⚡ 2-Hour Response Time</span>
                    <span>✓ 100% Free Consultation</span>
                  </div>

                </form>
              )}

            </div>

          </div>

        </section>

        {/* WHAT HAPPENS NEXT (4-STEP PROGRESSION) */}
        <section style={{ padding: "80px 24px", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            
            <div style={{ textAlign: "center", marginBottom: 50 }}>
              <div style={{ display: "inline-block", padding: "6px 16px", background: "#f0fdfa", border: "1px solid #ccfbf1", color: "#0f766e", borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 14 }}>
                SIMPLE PROCESS
              </div>
              <h2 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                What happens after you submit?
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
              {nextSteps.map((s, i) => (
                <div key={i} style={{ background: "#ffffff", borderRadius: 20, padding: "28px 24px", border: "1px solid #e2e8f0", boxShadow: "0 6px 16px rgba(0,0,0,0.02)", textAlign: "center", position: "relative" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #0d9488, #14b8a6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, margin: "0 auto 16px", boxShadow: "0 4px 12px rgba(13,148,136,0.3)" }}>
                    {s.step}
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>{s.title}</h4>
                  <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* EXPLORE PLANS CTA */}
        <section style={{ padding: "70px 24px", background: "linear-gradient(135deg, #0f172a 0%, #134e4a 60%, #0f172a 100%)", textAlign: "center", color: "#ffffff" }}>
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <h2 style={{ fontSize: "2.2rem", fontWeight: 800, margin: "0 0 14px", color: "#ffffff" }}>
              Prefer to explore pricing first?
            </h2>
            <p style={{ fontSize: "1.1rem", color: "#cbd5e1", margin: "0 0 32px", lineHeight: 1.6 }}>
              Check out our transparent monthly and annual plans built for boutique studios up to 50+ branch chains.
            </p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/features" style={{ textDecoration: "none", padding: "14px 30px", background: "#ffffff", color: "#0f172a", borderRadius: 12, fontWeight: 700, fontSize: 15 }}>
                View All Features &rarr;
              </Link>
              <Link to="/pricing" style={{ textDecoration: "none", padding: "14px 30px", background: "rgba(255,255,255,0.1)", color: "#ffffff", borderRadius: 12, fontWeight: 700, fontSize: 15, border: "1px solid rgba(255,255,255,0.25)" }}>
                Compare Pricing Plans
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer style={{ background: "#090d16", color: "#94a3b8", padding: "60px 24px 32px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 36, marginBottom: 40 }}>
            <div>
              <Link to="/" style={{ display: "inline-block", marginBottom: 14, background: "#ffffff", padding: "6px 14px", borderRadius: 10 }}>
                <img src="/logo.jfif" alt="Salon Nest Logo" style={{ maxHeight: "36px", maxWidth: "130px", objectFit: "contain", display: "block" }} />
              </Link>
              <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
                The modern cloud operating platform engineered for salons, spas, and aesthetic clinics.
              </p>
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
                Quick Navigation
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13.5 }}>
                <Link to="/" style={{ color: "#94a3b8", textDecoration: "none" }}>Home</Link>
                <Link to="/features" style={{ color: "#94a3b8", textDecoration: "none" }}>All Features</Link>
                <Link to="/pricing" style={{ color: "#94a3b8", textDecoration: "none" }}>Pricing Plans</Link>
                <Link to="/contact" style={{ color: "#94a3b8", textDecoration: "none" }}>Contact Support</Link>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
                Corporate Office
              </div>
              <div style={{ fontSize: 12.5, color: "#94a3b8", lineHeight: 1.6 }}>
                <strong>PROPCORP ADVERTISING (OPC) PRIVATE LIMITED</strong><br/>
                PLOT NO G-49 MADHURA NAGAR, HYDERABAD, Telangana, India - 500003<br/>
                Helpline: +91 9493952587 • Email: govardhan@salonnest.in
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20, textAlign: "center", fontSize: 12, color: "#64748b" }}>
            © {new Date().getFullYear()} PROPCORP ADVERTISING (OPC) PRIVATE LIMITED. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
