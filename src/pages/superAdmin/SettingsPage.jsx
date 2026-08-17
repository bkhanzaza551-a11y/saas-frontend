import { useEffect, useState, useCallback } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import PageLoader from "../../components/PageLoader";
import EmptyState from "../../components/EmptyState";
import CustomSelect from "../../components/CustomSelect";
import { Settings, MessageSquare, CreditCard, Shield, AlertTriangle, Save } from "lucide-react";

const TABS = [
  { id: "general",       label: "General",               icon: Settings },
  { id: "business",      label: "Business & Tax",        icon: CreditCard },
  { id: "comms",         label: "Communications",         icon: MessageSquare },
  { id: "notifications", label: "Notifications",         icon: MessageSquare },
  { id: "integrations",  label: "Integrations",          icon: MessageSquare },
  { id: "policy",        label: "Subscription Policies",  icon: CreditCard },
  { id: "security",      label: "Security",               icon: Shield },
  { id: "maintenance",   label: "Maintenance",            icon: AlertTriangle }
];

const Toggle = ({ value, onChange, label }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "white", border: "1px solid #e2e8f0", borderRadius: 12, cursor: "pointer" }} onClick={() => onChange(!value)}>
    <span style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>{label}</span>
    <div style={{ width: 40, height: 22, borderRadius: 100, background: value ? "#4f46e5" : "#cbd5e1", position: "relative", transition: "all 0.25s", flexShrink: 0 }}>
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: value ? 21 : 3, transition: "all 0.25s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
    </div>
  </div>
);

const Field = ({ label, children, full }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 6, ...(full ? { gridColumn: "1 / -1" } : {}) }}>
    <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>{label}</span>
    {children}
  </label>
);

const inputStyle = { border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 14px", fontSize: 14, width: "100%", boxSizing: "border-box" };

const LOG_TYPE_COLORS = {
  SALON_CREATED:         { bg: "#dbeafe", color: "#1e40af" },
  SUBSCRIPTION_CREATED:  { bg: "#d1fae5", color: "#065f46" },
  PAYMENT_RECEIVED:      { bg: "#fef3c7", color: "#92400e" },
  SUPPORT_TICKET:        { bg: "#fce7f3", color: "#9d174d" },
  LEAD_CREATED:          { bg: "#ede9fe", color: "#5b21b6" },
  LEAD_CONVERTED:        { bg: "#d1fae5", color: "#065f46" },
  default:               { bg: "#f1f5f9", color: "#475569" }
};

export default function SuperAdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [form, setForm] = useState({
    systemName: "SalonNest", globalLogo: "", maintenanceMode: false, maintenanceMessage: "",
    taxLabel: "GST", defaultCurrency: "INR", currencyOptions: ["INR", "USD", "AED", "GBP", "EUR", "PKR"],
    defaultCountry: "India", defaultCity: "Delhi", defaultTimezone: "Asia/Kolkata", invoicePrefix: "INV", defaultLanguage: "en", invoiceFormat: "INV-{YYYY}-{00000}",
    timeFormat: "12",
    notificationEmailEnabled: true, notificationSmsEnabled: false, notificationWhatsappEnabled: true,
    notifyAccount: true, notifySubscription: true, notifySupport: true, notifyRequests: true,
    whatsappNumber: "", smsProviderName: "", emailProviderName: "", whatsappProviderName: "",
    contactEmail: "info@salonnest.in", supportEmail: "support@salonnest.in", notificationEmail: "alerts@salonnest.in",
    termsUrl: "/terms", privacyUrl: "/privacy", demoBookingUrl: "/book-demo",
    blogTitle: "", blogIntro: "", backupPolicyNote: "",
    businessName: "SalonNest Technologies", businessEmail: "info@salonnest.in", businessPhone: "", businessAddress: "",
    businessCity: "Delhi", businessState: "Delhi", businessCountry: "India", businessPin: "",
    taxNumber: "", taxRate: 18,
    trialDays: 14, gracePeriodDays: 2, retentionDays: 90,
    autoSuspendOnExpiry: false, reminderDaysBefore: 7,
    sessionTimeoutMinutes: 480, maxLoginAttempts: 5, enforce2FA: false,
    emailSenderId: "", smsSenderId: "", whatsappSenderId: "",
    requireEmailVerification: false, requireMobileVerification: false,
    otpExpiryMinutes: 10, passwordLength: 8, lockDurationMinutes: 15,
    dateFormat: "DD/MM/YYYY",
    messageTemplates: [],
    integrations: {
      paymentGateway: { provider: "", apiKey: "", enabled: false },
      meetings: { provider: "", apiKey: "", enabled: false },
      communications: { provider: "", apiKey: "", enabled: false }
    }
  });

  const f = (key) => ({ value: form[key] ?? "", onChange: (e) => setForm(p => ({ ...p, [key]: e.target.value })) });
  const n = (key) => ({ value: form[key] ?? 0, type: "number", onChange: (e) => setForm(p => ({ ...p, [key]: Number(e.target.value) })) });

  const TEMPLATE_EVENTS = ["OTP", "LEAD_CONVERTED", "DEMO_SCHEDULED", "SUBSCRIPTION_REMINDER", "SUBSCRIPTION_EXPIRY", "PAYMENT_RECEIVED"];
  const CHANNEL_COLORS = { EMAIL: { bg: "#dbeafe", color: "#1e40af" }, SMS: { bg: "#fef3c7", color: "#92400e" }, WHATSAPP: { bg: "#d1fae5", color: "#065f46" } };

  const upsertTemplate = (tpl) => {
    setForm(p => {
      const exists = p.messageTemplates.some(t => t.id === tpl.id);
      return {
        ...p,
        messageTemplates: exists ? p.messageTemplates.map(t => t.id === tpl.id ? tpl : t) : [...p.messageTemplates, { ...tpl, id: tpl.id || `tpl-${Date.now()}` }]
      };
    });
  };

  const removeTemplate = (id) => setForm(p => ({ ...p, messageTemplates: p.messageTemplates.filter(t => t.id !== id) }));

  const [templateDraft, setTemplateDraft] = useState(null);
  const editTemplate = (tpl) => setTemplateDraft(tpl ? { ...tpl } : { id: "", name: "", channel: "WHATSAPP", event: "OTP", subject: "", body: "" });

  useEffect(() => {
    api.get("/super-admin/settings").then((res) => {
      const d = res.data || {};
      const notif = d.notificationDefaults || {};
      setForm(prev => ({
        ...prev,
        systemName: d.systemName || "SalonNest",
        globalLogo: d.globalLogo || "",
        maintenanceMode: Boolean(d.maintenanceMode),
        maintenanceMessage: d.maintenanceMessage || "",
        taxLabel: d.taxLabel || "GST",
        defaultCurrency: d.defaultCurrency || "INR",
        currencyOptions: Array.isArray(d.currencyOptions) && d.currencyOptions.length > 0 ? d.currencyOptions : (d.currencyOptions ? d.currencyOptions.split(",").map(s => s.trim()).filter(Boolean) : ["INR", "USD", "AED", "GBP", "EUR", "PKR"]),
        defaultCountry: d.defaultCountry || "India",
        defaultCity: d.defaultCity || "Delhi",
        defaultTimezone: d.defaultTimezone || "Asia/Kolkata",
        invoicePrefix: d.invoicePrefix || "INV",
        defaultLanguage: d.defaultLanguage || "en",
        invoiceFormat: d.invoiceFormat || "INV-{YYYY}-{00000}",
        timeFormat: d.timeFormat || "12",
        notificationEmailEnabled: notif.email !== false,
        notificationSmsEnabled: Boolean(notif.sms),
        notificationWhatsappEnabled: notif.whatsapp !== false,
        notifyAccount: notif.account !== false,
        notifySubscription: notif.subscription !== false,
        notifySupport: notif.support !== false,
        notifyRequests: notif.requests !== false,
        whatsappNumber: d.whatsappNumber || "",
        smsProviderName: d.smsProviderName || "",
        emailProviderName: d.emailProviderName || "",
        whatsappProviderName: d.whatsappProviderName || "",
        contactEmail: d.contactEmail || "",
        supportEmail: d.supportEmail || "",
        notificationEmail: d.notificationEmail || "",
        termsUrl: d.termsUrl || "/terms",
        privacyUrl: d.privacyUrl || "/privacy",
        demoBookingUrl: d.demoBookingUrl || "/book-demo",
        blogTitle: d.blogTitle || "",
        blogIntro: d.blogIntro || "",
        backupPolicyNote: d.backupPolicyNote || "",
        businessName: d.businessName || "",
        businessEmail: d.businessEmail || "",
        businessPhone: d.businessPhone || "",
        businessAddress: d.businessAddress || "",
        businessCity: d.businessCity || "",
        businessState: d.businessState || "",
        businessCountry: d.businessCountry || "",
        businessPin: d.businessPin || "",
        taxNumber: d.taxNumber || "",
        taxRate: d.taxRate ?? 0,
        trialDays: d.trialDays ?? 14,
        gracePeriodDays: d.gracePeriodDays ?? 2,
        retentionDays: d.retentionDays ?? 90,
        autoSuspendOnExpiry: Boolean(d.autoSuspendOnExpiry),
        reminderDaysBefore: d.reminderDaysBefore ?? 7,
        sessionTimeoutMinutes: d.sessionTimeoutMinutes ?? 480,
        maxLoginAttempts: d.maxLoginAttempts ?? 5,
        enforce2FA: Boolean(d.enforce2FA),
        dateFormat: d.dateFormat || "DD/MM/YYYY",
        emailSenderId: d.emailSenderId || "",
        smsSenderId: d.smsSenderId || "",
        whatsappSenderId: d.whatsappSenderId || "",
        requireEmailVerification: Boolean(d.requireEmailVerification),
        requireMobileVerification: Boolean(d.requireMobileVerification),
        otpExpiryMinutes: d.otpExpiryMinutes ?? 10,
        passwordLength: d.passwordLength ?? 8,
        lockDurationMinutes: d.lockDuration ?? d.lockDurationMinutes ?? 15,
        messageTemplates: Array.isArray(d.messageTemplates) ? d.messageTemplates : [],
        integrations: {
          paymentGateway: { provider: "", apiKey: "", enabled: false, ...(d.integrations?.paymentGateway || {}) },
          meetings: { provider: "", apiKey: "", enabled: false, ...(d.integrations?.meetings || {}) },
          communications: { provider: "", apiKey: "", enabled: false, ...(d.integrations?.communications || {}) }
        }
      }));
    }).catch((err) => {
      setStatus({ error: formatApiError(err, "Could not load settings."), success: "" });
    }).finally(() => setLoading(false));
  }, []);

  const loadAuditLogs = useCallback(() => {
    setAuditLoading(true);
    api.get("/super-admin/audit-logs").then(res => setAuditLogs(res.data || [])).catch(console.error).finally(() => setAuditLoading(false));
  }, []);

  const [testingChannel, setTestingChannel] = useState("");
  const [testRecipient, setTestRecipient] = useState({ email: "", phone: "" });
  const testChannel = async (channel) => {
    setTestingChannel(channel);
    setStatus({ error: "", success: "" });
    try {
      const res = await api.post("/super-admin/settings/test-channel", {
        channel,
        ...(channel === "email" ? { toEmail: testRecipient.email } : { to: testRecipient.phone })
      });
      setStatus({ error: "", success: res.data?.message || `${channel} test sent.` });
    } catch (err) {
      setStatus({ error: formatApiError(err, "Test failed."), success: "" });
    } finally {
      setTestingChannel("");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (activeTab === "maintenance") loadAuditLogs();
  }, [activeTab, loadAuditLogs]);

  const submit = async (e) => {
    e.preventDefault();
    if (form.maintenanceMode && !window.confirm("Enable maintenance mode? Salon owners will be locked out until disabled.")) return;
    setStatus({ error: "", success: "" });
    setSaving(true);
    try {
      await api.post("/super-admin/settings", {
        systemName: form.systemName, globalLogo: form.globalLogo, maintenanceMode: form.maintenanceMode, maintenanceMessage: form.maintenanceMessage,
        taxLabel: form.taxLabel, defaultCurrency: form.defaultCurrency,
        currencyOptions: Array.isArray(form.currencyOptions) ? form.currencyOptions : form.currencyOptions.split(",").map(s => s.trim()).filter(Boolean),
        defaultCountry: form.defaultCountry, defaultCity: form.defaultCity, defaultTimezone: form.defaultTimezone, invoicePrefix: form.invoicePrefix, defaultLanguage: form.defaultLanguage, invoiceFormat: form.invoiceFormat,
        notificationDefaults: { 
          email: form.notificationEmailEnabled, 
          sms: form.notificationSmsEnabled, 
          whatsapp: form.notificationWhatsappEnabled,
          account: form.notifyAccount,
          subscription: form.notifySubscription,
          support: form.notifySupport,
          requests: form.notifyRequests
        },
        whatsappNumber: form.whatsappNumber, smsProviderName: form.smsProviderName, emailProviderName: form.emailProviderName, whatsappProviderName: form.whatsappProviderName,
        contactEmail: form.contactEmail, supportEmail: form.supportEmail, notificationEmail: form.notificationEmail,
        termsUrl: form.termsUrl, privacyUrl: form.privacyUrl, demoBookingUrl: form.demoBookingUrl,
        blogTitle: form.blogTitle, blogIntro: form.blogIntro, backupPolicyNote: form.backupPolicyNote,
        businessName: form.businessName, businessEmail: form.businessEmail, businessPhone: form.businessPhone,
        businessAddress: form.businessAddress, businessCity: form.businessCity, businessState: form.businessState,
        businessCountry: form.businessCountry, businessPin: form.businessPin,
        taxNumber: form.taxNumber, taxRate: form.taxRate,
        emailSenderId: form.emailSenderId, smsSenderId: form.smsSenderId, whatsappSenderId: form.whatsappSenderId,
        trialDays: form.trialDays, gracePeriodDays: form.gracePeriodDays, retentionDays: form.retentionDays,
        autoSuspendOnExpiry: form.autoSuspendOnExpiry, reminderDaysBefore: form.reminderDaysBefore,
        sessionTimeoutMinutes: form.sessionTimeoutMinutes, maxLoginAttempts: form.maxLoginAttempts, enforce2FA: form.enforce2FA,
        requireEmailVerification: form.requireEmailVerification, requireMobileVerification: form.requireMobileVerification,
        otpExpiryMinutes: form.otpExpiryMinutes, passwordLength: form.passwordLength, lockDurationMinutes: form.lockDurationMinutes,
        dateFormat: form.dateFormat, messageTemplates: form.messageTemplates, integrations: form.integrations
      });
      setStatus({ error: "", success: "Settings saved successfully." });
      setTimeout(() => setStatus(p => ({ ...p, success: "" })), 3000);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not save settings"), success: "" });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="page-shell super-admin-page"><PageLoader title="Loading settings" /></div>;

  return (
    <div className="page-shell super-admin-page">
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0 }}>Platform Settings</h1>
            <p style={{ marginBottom: 0 }}>Global configuration, subscription policies, security and audit logs.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: form.maintenanceMode ? "#fef2f2" : "#ecfdf5", color: form.maintenanceMode ? "#ef4444" : "#10b981", border: `1px solid ${form.maintenanceMode ? "#fecaca" : "#a7f3d0"}` }}>
              {form.maintenanceMode ? "Maintenance Active" : "System Live"}
            </span>
            <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>{form.defaultCurrency}</span>
          </div>
        </div>
      </div>

      {status.error && <div style={{ background: "#fef2f2", color: "#991b1b", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: 13 }}>{status.error}</div>}
      {status.success && <div style={{ background: "#ecfdf5", color: "#065f46", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: 13 }}>{status.success}</div>}

      <div style={{ display: "flex", gap: 24, background: "white", borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 4px 24px rgba(15,23,42,0.02)", overflow: "hidden", minHeight: 560 }}>
        <div style={{ width: 220, background: "#f8fafc", borderRight: "1px solid #e2e8f0", padding: "20px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 14px", borderRadius: 10, border: isActive ? "1px solid #e2e8f0" : "1px solid transparent", background: isActive ? "white" : "transparent", color: isActive ? "#4f46e5" : "#64748b", fontWeight: isActive ? 700 : 500, fontSize: 13, cursor: "pointer", textAlign: "left", boxShadow: isActive ? "0 2px 8px rgba(15,23,42,0.06)" : "none", transition: "all 0.15s" }}>
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1, padding: "28px 32px", display: "flex", flexDirection: "column" }}>
          <form onSubmit={submit} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1 }}>

              {activeTab === "general" && (
                <div>
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>General Configuration</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Basic platform metadata, currency, invoice prefix and regional defaults.</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Field label="System Name"><input style={inputStyle} {...f("systemName")} placeholder="SalonNest" /></Field>
                    <Field label="Platform Logo">
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {form.globalLogo && <img src={form.globalLogo} alt="Logo" style={{ width: 36, height: 36, objectFit: "contain", borderRadius: 4, border: "1px solid #e2e8f0" }} />}
                        <input type="file" style={{ ...inputStyle, padding: "7px 10px" }} accept="image/*" onChange={(e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const r = new FileReader();
                          r.onload = (ev) => setForm(p => ({ ...p, globalLogo: ev.target.result }));
                          r.readAsDataURL(file);
                        }} />
                      </div>
                    </Field>
                    <Field label="Default Currency">
                      <CustomSelect value={form.defaultCurrency} onChange={e => setForm(p => ({ ...p, defaultCurrency: e.target.value }))}>
                        {["PKR", "INR", "USD", "AED", "GBP", "EUR"].map(c => <option key={c} value={c}>{c}</option>)}
                      </CustomSelect>
                    </Field>
                    <Field label="Default Country"><input style={inputStyle} {...f("defaultCountry")} placeholder="India" /></Field>
                    <Field label="Timezone"><input style={inputStyle} {...f("defaultTimezone")} placeholder="Asia/Kolkata" /></Field>
                    <Field label="Language">
                      <CustomSelect value={form.defaultLanguage} onChange={e => setForm(p => ({ ...p, defaultLanguage: e.target.value }))}>
                        <option value="en">English (US)</option>
                        <option value="en-gb">English (UK)</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                      </CustomSelect>
                    </Field>
                    <Field label="Date Format">
                      <CustomSelect value={form.dateFormat} onChange={e => setForm(p => ({ ...p, dateFormat: e.target.value }))}>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </CustomSelect>
                    </Field>
                    <Field label="Time Format">
                      <CustomSelect value={form.timeFormat || "12"} onChange={e => setForm(p => ({ ...p, timeFormat: e.target.value }))}>
                        <option value="12">12-Hour (1:00 PM)</option>
                        <option value="24">24-Hour (13:00)</option>
                      </CustomSelect>
                    </Field>
                  </div>
                </div>
              )}
 
              {activeTab === "business" && (
                <div>
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Business & Tax</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Information belonging to SalonNest as the platform/business.</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Field label="Legal Business Name"><input style={inputStyle} {...f("businessName")} placeholder="SalonNest Technologies Pvt Ltd" /></Field>
                    <Field label="Business Email"><input style={inputStyle} {...f("businessEmail")} placeholder="info@salonnest.in" /></Field>
                    <Field label="Business Phone"><input style={inputStyle} {...f("businessPhone")} placeholder="+91 98765 43210" /></Field>
                    <Field label="Registered Address"><input style={inputStyle} {...f("businessAddress")} placeholder="123 Tech Park, MG Road" /></Field>
                    <Field label="City"><input style={inputStyle} {...f("businessCity")} placeholder="Delhi" /></Field>
                    <Field label="State"><input style={inputStyle} {...f("businessState")} placeholder="Delhi" /></Field>
                    <Field label="Country"><input style={inputStyle} {...f("businessCountry")} placeholder="India" /></Field>
                    <Field label="PIN Code"><input style={inputStyle} {...f("businessPin")} placeholder="110001" /></Field>
                    <Field label="GST / Tax Registration Number"><input style={inputStyle} {...f("taxNumber")} placeholder="07AAAAA0000A1Z5" /></Field>
                    <Field label="Tax Name"><input style={inputStyle} {...f("taxLabel")} placeholder="GST / Tax" /></Field>
                    <Field label="Default Tax Rate (%)"><input style={inputStyle} {...n("taxRate")} placeholder="18" /></Field>
                  </div>

                  <div style={{ height: 1, background: "#e2e8f0", margin: "28px 0 20px 0" }} />

                  {/* Point 2: Invoice settings */}
                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Invoice Settings</h4>
                    <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Auto-generated invoice numbering configuration for Finance and Subscriptions.</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Field label="Invoice Prefix"><input style={inputStyle} {...f("invoicePrefix")} placeholder="INV" /></Field>
                    <Field label="Invoice Number Format">
                      <CustomSelect value={form.invoiceFormat} onChange={e => setForm(p => ({ ...p, invoiceFormat: e.target.value }))}>
                        <option value="INV-{YYYY}-{00000}">INV-{new Date().getFullYear()}-00001 (Recommended)</option>
                        <option value="INV-{YYYY}{MM}-{0000}">INV-{new Date().getFullYear()}08-0001</option>
                        <option value="INV-{000000}">INV-000001</option>
                      </CustomSelect>
                    </Field>
                    <div style={{ gridColumn: "1 / -1", padding: "10px 14px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, color: "#475569" }}>
                      Preview format: <strong>{form.invoicePrefix || "INV"}-{new Date().getFullYear()}-00001</strong> (Used automatically when Finance invoices are generated)
                    </div>
                  </div>
                </div>
              )}
 
              {activeTab === "comms" && (
                <div>
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Communications & Providers</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Contact mailboxes and external provider configurations.</p>
                  </div>
 
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Field label="Contact Email"><input style={inputStyle} type="email" {...f("contactEmail")} placeholder="info@salonnest.in" /></Field>
                    <Field label="Support Email"><input style={inputStyle} type="email" {...f("supportEmail")} placeholder="support@salonnest.in" /></Field>
                    <Field label="Notification Email" full><input style={inputStyle} type="email" {...f("notificationEmail")} placeholder="alerts@salonnest.in" /></Field>
                    
                    <div style={{ gridColumn: "1 / -1", height: 1, background: "#e2e8f0", margin: "8px 0" }} />
 
                    <div style={{ gridColumn: "1 / -1", padding: 14, background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <Field label="Test Recipient Email (for Test buttons)">
                        <input style={inputStyle} type="email" value={testRecipient.email} onChange={e => setTestRecipient(p => ({ ...p, email: e.target.value }))} placeholder="test@yourcompany.com" />
                      </Field>
                      <Field label="Test Recipient Phone (for Test buttons)">
                        <input style={inputStyle} value={testRecipient.phone} onChange={e => setTestRecipient(p => ({ ...p, phone: e.target.value }))} placeholder="+919876543210" />
                      </Field>
                    </div>
 
                    <Field label="Email Provider"><input style={inputStyle} {...f("emailProviderName")} placeholder="SMTP / Resend" /></Field>
                    <Field label="Email Sender ID (Name/Email)">
                      <div style={{ display: "flex", gap: 8 }}>
                        <input style={{ ...inputStyle, flex: 1 }} {...f("emailSenderId")} placeholder="SalonNest <alerts@salonnest.in>" />
                        <button type="button" disabled={!!testingChannel} onClick={() => testChannel("email")} style={{ padding: "0 12px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 8, cursor: testingChannel ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}>{testingChannel === "email" ? "Sending..." : "Test"}</button>
                      </div>
                    </Field>
 
                    <Field label="SMS Provider"><input style={inputStyle} {...f("smsProviderName")} placeholder="Twilio" /></Field>
                    <Field label="SMS Sender ID">
                      <div style={{ display: "flex", gap: 8 }}>
                        <input style={{ ...inputStyle, flex: 1 }} {...f("smsSenderId")} placeholder="SLNNST" />
                        <button type="button" disabled={!!testingChannel} onClick={() => testChannel("sms")} style={{ padding: "0 12px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 8, cursor: testingChannel ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}>{testingChannel === "sms" ? "Sending..." : "Test"}</button>
                      </div>
                    </Field>
                    
                    <Field label="WhatsApp Provider"><input style={inputStyle} {...f("whatsappProviderName")} placeholder="Meta Cloud API" /></Field>
                    <Field label="WhatsApp Sender ID (Number/Name)">
                      <div style={{ display: "flex", gap: 8 }}>
                        <input style={{ ...inputStyle, flex: 1 }} {...f("whatsappSenderId")} placeholder="+1234567890" />
                        <button type="button" disabled={!!testingChannel} onClick={() => testChannel("whatsapp")} style={{ padding: "0 12px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 8, cursor: testingChannel ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}>{testingChannel === "whatsapp" ? "Sending..." : "Test"}</button>
                      </div>
                    </Field>
                    <Field label="WhatsApp Connected Number"><input style={inputStyle} {...f("whatsappNumber")} placeholder="+1234567890" /></Field>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div>
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Notifications</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Granular notification toggles and channels.</p>
                  </div>
                  
                  <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Channels</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                    <Toggle value={form.notificationEmailEnabled} onChange={v => setForm(p => ({ ...p, notificationEmailEnabled: v }))} label="Email Notifications" />
                    <Toggle value={form.notificationSmsEnabled} onChange={v => setForm(p => ({ ...p, notificationSmsEnabled: v }))} label="SMS Notifications" />
                    <Toggle value={form.notificationWhatsappEnabled} onChange={v => setForm(p => ({ ...p, notificationWhatsappEnabled: v }))} label="WhatsApp Notifications" />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Notification Events</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <Toggle value={form.notifyAccount} onChange={v => setForm(p => ({ ...p, notifyAccount: v }))} label="Account Activities" />
                      <Toggle value={form.notifySubscription} onChange={v => setForm(p => ({ ...p, notifySubscription: v }))} label="Subscription Alerts" />
                      <Toggle value={form.notifySupport} onChange={v => setForm(p => ({ ...p, notifySupport: v }))} label="Support Tickets" />
                      <Toggle value={form.notifyRequests} onChange={v => setForm(p => ({ ...p, notifyRequests: v }))} label="System Requests" />
                    </div>
                  </div>

                  <div style={{ height: 1, background: "#e2e8f0", margin: "32px 0 24px 0" }} />

                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Message Templates</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Manage templates for system notifications (Email, SMS, WhatsApp).</p>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                    <button type="button" onClick={() => editTemplate(null)} style={{ padding: "8px 16px", background: "#4f46e5", color: "white", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>+ New Template</button>
                  </div>

                  {form.messageTemplates.length === 0 ? (
                    <EmptyState title="No message templates" message="Create templates for OTP, lead conversion, demo scheduling and subscription alerts." />
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {form.messageTemplates.map((tpl) => {
                        const cc = CHANNEL_COLORS[tpl.channel] || CHANNEL_COLORS.WHATSAPP;
                        return (
                          <div key={tpl.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                            <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", background: cc.bg, color: cc.color }}>{tpl.channel}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>{tpl.name || tpl.event}</div>
                              <div style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {tpl.event}{tpl.subject ? ` • ${tpl.subject}` : ""} • {(tpl.body || "").slice(0, 60)}
                              </div>
                            </div>
                            <button type="button" onClick={() => editTemplate(tpl)} style={{ padding: "6px 12px", background: "white", border: "1px solid #cbd5e1", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#334155" }}>Edit</button>
                            <button type="button" onClick={() => removeTemplate(tpl.id)} style={{ padding: "6px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#b91c1c" }}>Delete</button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {templateDraft && (
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setTemplateDraft(null)}>
                      <div style={{ background: "white", borderRadius: 16, padding: 24, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
                        <h4 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{templateDraft.id ? "Edit Template" : "New Template"}</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                          <Field label="Template Name">
                            <input style={inputStyle} value={templateDraft.name} onChange={e => setTemplateDraft(p => ({ ...p, name: e.target.value }))} placeholder="Login OTP" />
                          </Field>
                          <Field label="Channel">
                            <CustomSelect value={templateDraft.channel} onChange={e => setTemplateDraft(p => ({ ...p, channel: e.target.value }))}>
                              <option value="EMAIL">Email</option>
                              <option value="SMS">SMS</option>
                              <option value="WHATSAPP">WhatsApp</option>
                            </CustomSelect>
                          </Field>
                          <Field label="Event" full>
                            <CustomSelect value={templateDraft.event} onChange={e => setTemplateDraft(p => ({ ...p, event: e.target.value }))}>
                              {TEMPLATE_EVENTS.map(ev => <option key={ev} value={ev}>{ev.replace(/_/g, " ")}</option>)}
                            </CustomSelect>
                          </Field>
                          {templateDraft.channel === "EMAIL" && (
                            <Field label="Subject" full>
                              <input style={inputStyle} value={templateDraft.subject || ""} onChange={e => setTemplateDraft(p => ({ ...p, subject: e.target.value }))} placeholder="Your login code" />
                            </Field>
                          )}
                          <Field label="Message Body" full>
                            <textarea rows={5} style={{ ...inputStyle, resize: "vertical" }} value={templateDraft.body || ""} onChange={e => setTemplateDraft(p => ({ ...p, body: e.target.value }))} placeholder={"Your OTP is {otp}. Valid for {minutes} minutes."} />
                          </Field>
                          <div style={{ gridColumn: "1 / -1", fontSize: 11, color: "#94a3b8" }}>
                            Placeholders: {"{otp}"} {"{minutes}"} {"{salonName}"} {"{ownerName}"} {"{daysLeft}"} {"{amount}"}
                          </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                          <button type="button" onClick={() => setTemplateDraft(null)} style={{ padding: "8px 18px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                          <button type="button" onClick={() => { upsertTemplate(templateDraft); setTemplateDraft(null); }} style={{ padding: "8px 18px", background: "#4f46e5", color: "white", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Save Template</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "integrations" && (
                <div>
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Integrations</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Manage external connections (Payment gateways, Meetings, Communications).</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                    {[
                      { key: "paymentGateway", title: "Payment Gateways", desc: "Stripe and Razorpay configuration", placeholder: "Stripe / Razorpay" },
                      { key: "meetings", title: "Meetings (Zoho / Google Meet)", desc: "Video conferencing for demo leads", placeholder: "Zoho / Google Meet" },
                      { key: "communications", title: "Communications (Twilio / Meta)", desc: "API credentials for SMS and WhatsApp", placeholder: "Twilio / Meta Cloud API" }
                    ].map((cfg) => {
                      const integ = form.integrations[cfg.key] || { provider: "", apiKey: "", enabled: false };
                      return (
                        <div key={cfg.key} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <div>
                              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{cfg.title}</h4>
                              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{cfg.desc}</p>
                            </div>
                            <Toggle value={Boolean(integ.enabled)} onChange={v => setForm(p => ({ ...p, integrations: { ...p.integrations, [cfg.key]: { ...p.integrations[cfg.key], enabled: v } } }))} label={integ.enabled ? "Connected" : "Disabled"} />
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <Field label="Provider">
                              <input style={inputStyle} value={integ.provider || ""} onChange={e => setForm(p => ({ ...p, integrations: { ...p.integrations, [cfg.key]: { ...p.integrations[cfg.key], provider: e.target.value } } }))} placeholder={cfg.placeholder} />
                            </Field>
                            <Field label="API Key / Credentials">
                              <input style={inputStyle} type="password" value={integ.apiKey || ""} onChange={e => setForm(p => ({ ...p, integrations: { ...p.integrations, [cfg.key]: { ...p.integrations[cfg.key], apiKey: e.target.value } } }))} placeholder="sk_..." />
                            </Field>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === "policy" && (
                <div>
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Subscription Policies</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Control trial periods, grace periods, data retention and auto-suspend behavior.</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
                    <Field label="Trial Period (days)"><input style={inputStyle} {...n("trialDays")} min={1} max={90} /></Field>
                    <Field label="Grace Period (days)"><input style={inputStyle} {...n("gracePeriodDays")} min={0} max={30} /></Field>
                    <Field label="Retention Period (days)"><input style={inputStyle} {...n("retentionDays")} min={0} max={365} /></Field>
                    <Field label="Expiry Reminder (days before)"><input style={inputStyle} {...n("reminderDaysBefore")} min={1} max={30} /></Field>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <Toggle value={form.autoSuspendOnExpiry} onChange={v => setForm(p => ({ ...p, autoSuspendOnExpiry: v }))} label="Auto-Suspend Salons on Subscription Expiry" />
                  </div>
                  <div style={{ padding: 16, background: "#fef3c7", borderRadius: 12, border: "1px solid #fde68a" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e", marginBottom: 8 }}>Subscription Lifecycle Preview</div>
                    <div style={{ fontSize: 12, color: "#78350f", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ background: "#fff7ed", padding: "2px 10px", borderRadius: 6, fontWeight: 600 }}>TRIAL ({form.trialDays}d)</span>
                      <span>→</span>
                      <span style={{ background: "#ecfdf5", padding: "2px 10px", borderRadius: 6, fontWeight: 600 }}>ACTIVE</span>
                      <span>→</span>
                      <span style={{ background: "#fef2f2", padding: "2px 10px", borderRadius: 6, fontWeight: 600 }}>EXPIRED</span>
                      <span>→</span>
                      <span style={{ background: "#fef3c7", padding: "2px 10px", borderRadius: 6, fontWeight: 600 }}>GRACE ({form.gracePeriodDays}d)</span>
                      <span>→</span>
                      <span style={{ background: "#fee2e2", padding: "2px 10px", borderRadius: 6, fontWeight: 600 }}>RESTRICTED</span>
                      <span>→</span>
                      <span style={{ background: "#f1f5f9", padding: "2px 10px", borderRadius: 6, fontWeight: 600 }}>ARCHIVED ({form.retentionDays}d)</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div>
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Security Configuration</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Session limits, login lockout thresholds and two-factor enforcement.</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                    <Field label="Session Timeout (minutes)">
                      <input style={inputStyle} {...n("sessionTimeoutMinutes")} min={30} max={10080} />
                      <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>= {Math.round(Number(form.sessionTimeoutMinutes) / 60)} hours</span>
                    </Field>
                    <Field label="Max Login Attempts (before lockout)"><input style={inputStyle} {...n("maxLoginAttempts")} min={3} max={20} /></Field>
                    
                    <Field label="Lockout Duration (minutes)"><input style={inputStyle} {...n("lockDurationMinutes")} min={5} max={1440} /></Field>
                    <Field label="OTP Expiry (minutes)"><input style={inputStyle} {...n("otpExpiryMinutes")} min={1} max={60} /></Field>
                    <Field label="Min Password Length"><input style={inputStyle} {...n("passwordLength")} min={6} max={32} /></Field>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 16 }}>
                    <Toggle value={form.requireEmailVerification} onChange={v => setForm(p => ({ ...p, requireEmailVerification: v }))} label="Require Email Verification on Signup" />
                    <Toggle value={form.requireMobileVerification} onChange={v => setForm(p => ({ ...p, requireMobileVerification: v }))} label="Require Mobile OTP Verification on Signup" />
                    <Toggle value={form.enforce2FA} onChange={v => setForm(p => ({ ...p, enforce2FA: v }))} label="Enforce Two-Factor Authentication (2FA) for all Super Admins" />
                  </div>
                  <div style={{ padding: 16, background: "#f0fdf4", borderRadius: 12, border: "1px solid #bbf7d0" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 4 }}>Current Security Summary</div>
                    <div style={{ fontSize: 12, color: "#15803d" }}>
                      Session timeout: <strong>{form.sessionTimeoutMinutes} min</strong> &bull; Max failed logins: <strong>{form.maxLoginAttempts}</strong> &bull; 2FA: <strong>{form.enforce2FA ? "Enforced" : "Optional"}</strong>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "maintenance" && (
                <div>
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Maintenance Mode</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Control maintenance mode and manage backup exports.</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                    <Toggle value={form.maintenanceMode} onChange={v => setForm(p => ({ ...p, maintenanceMode: v }))} label="Enable Maintenance Mode - locks out all salon owners" />
                    <Field label="Custom Maintenance Message">
                      <textarea rows={2} style={{ ...inputStyle, resize: "vertical" }} {...f("maintenanceMessage")} placeholder="We are performing scheduled maintenance. We will be back in 30 minutes." />
                    </Field>
                  </div>
                  
                  <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>System Data & Backup Export</h4>
                      <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Export platform configuration settings, policies, and system metadata as JSON dump.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(form, null, 2));
                        const downloadAnchor = document.createElement("a");
                        downloadAnchor.setAttribute("href", dataStr);
                        downloadAnchor.setAttribute("download", `salonnest_platform_backup_${new Date().toISOString().split("T")[0]}.json`);
                        document.body.appendChild(downloadAnchor);
                        downloadAnchor.click();
                        downloadAnchor.remove();
                      }}
                      style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#ffffff", color: "#1e293b", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
                    >
                      Export System Backup
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 20, marginTop: 28, display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" disabled={saving} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 28px", background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)", color: "white", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, boxShadow: "0 4px 14px rgba(79, 70, 229, 0.2)" }}>
                <Save size={14} />
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
