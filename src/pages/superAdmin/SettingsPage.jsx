import { useEffect, useState, useCallback } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import PageLoader from "../../components/PageLoader";
import EmptyState from "../../components/EmptyState";
import { Settings, MessageSquare, CreditCard, Shield, AlertTriangle, Save } from "lucide-react";

const TABS = [
  { id: "general",     label: "General",               icon: Settings },
  { id: "comms",       label: "Communications",         icon: MessageSquare },
  { id: "policy",      label: "Subscription Policies",  icon: CreditCard },
  { id: "security",    label: "Security",               icon: Shield },
  { id: "maintenance", label: "Maintenance & Audit",    icon: AlertTriangle }
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
    systemName: "", maintenanceMode: false, maintenanceMessage: "",
    taxLabel: "Tax", defaultCurrency: "PKR", currencyOptions: ["PKR", "INR", "USD"],
    defaultCountry: "", defaultCity: "", defaultTimezone: "", invoicePrefix: "INV",
    notificationEmailEnabled: true, notificationSmsEnabled: false, notificationWhatsappEnabled: true,
    whatsappNumber: "", smsProviderName: "", emailProviderName: "", whatsappProviderName: "",
    contactEmail: "", supportEmail: "", notificationEmail: "",
    termsUrl: "/terms", privacyUrl: "/privacy", demoBookingUrl: "/book-demo",
    blogTitle: "", blogIntro: "", backupPolicyNote: "",
    trialDays: 14, gracePeriodDays: 2, retentionDays: 90,
    autoSuspendOnExpiry: false, reminderDaysBefore: 7,
    sessionTimeoutMinutes: 480, maxLoginAttempts: 5, enforce2FA: false
  });

  const f = (key) => ({ value: form[key] ?? "", onChange: (e) => setForm(p => ({ ...p, [key]: e.target.value })) });
  const n = (key) => ({ value: form[key] ?? 0, type: "number", onChange: (e) => setForm(p => ({ ...p, [key]: Number(e.target.value) })) });

  useEffect(() => {
    api.get("/super-admin/settings").then((res) => {
      const d = res.data || {};
      const notif = d.notificationDefaults || {};
      setForm(prev => ({
        ...prev,
        systemName: d.systemName || "",
        maintenanceMode: Boolean(d.maintenanceMode),
        maintenanceMessage: d.maintenanceMessage || "",
        taxLabel: d.taxLabel || "Tax",
        defaultCurrency: d.defaultCurrency || "PKR",
        currencyOptions: Array.isArray(d.currencyOptions) ? d.currencyOptions : (d.currencyOptions || "PKR,INR,USD").split(",").map(s => s.trim()).filter(Boolean),
        defaultCountry: d.defaultCountry || "",
        defaultCity: d.defaultCity || "",
        defaultTimezone: d.defaultTimezone || "",
        invoicePrefix: d.invoicePrefix || "INV",
        notificationEmailEnabled: notif.email !== false,
        notificationSmsEnabled: Boolean(notif.sms),
        notificationWhatsappEnabled: notif.whatsapp !== false,
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
        trialDays: d.trialDays ?? 14,
        gracePeriodDays: d.gracePeriodDays ?? 2,
        retentionDays: d.retentionDays ?? 90,
        autoSuspendOnExpiry: Boolean(d.autoSuspendOnExpiry),
        reminderDaysBefore: d.reminderDaysBefore ?? 7,
        sessionTimeoutMinutes: d.sessionTimeoutMinutes ?? 480,
        maxLoginAttempts: d.maxLoginAttempts ?? 5,
        enforce2FA: Boolean(d.enforce2FA)
      }));
    }).catch((err) => {
      setStatus({ error: formatApiError(err, "Could not load settings."), success: "" });
    }).finally(() => setLoading(false));
  }, []);

  const loadAuditLogs = useCallback(() => {
    setAuditLoading(true);
    api.get("/super-admin/audit-logs").then(res => setAuditLogs(res.data || [])).catch(console.error).finally(() => setAuditLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === "maintenance") loadAuditLogs();
  }, [activeTab]);

  const submit = async (e) => {
    e.preventDefault();
    if (form.maintenanceMode && !window.confirm("Enable maintenance mode? Salon owners will be locked out until disabled.")) return;
    setStatus({ error: "", success: "" });
    setSaving(true);
    try {
      await api.post("/super-admin/settings", {
        systemName: form.systemName, maintenanceMode: form.maintenanceMode, maintenanceMessage: form.maintenanceMessage,
        taxLabel: form.taxLabel, defaultCurrency: form.defaultCurrency,
        currencyOptions: Array.isArray(form.currencyOptions) ? form.currencyOptions : form.currencyOptions.split(",").map(s => s.trim()).filter(Boolean),
        defaultCountry: form.defaultCountry, defaultCity: form.defaultCity, defaultTimezone: form.defaultTimezone, invoicePrefix: form.invoicePrefix,
        notificationDefaults: { email: form.notificationEmailEnabled, sms: form.notificationSmsEnabled, whatsapp: form.notificationWhatsappEnabled },
        whatsappNumber: form.whatsappNumber, smsProviderName: form.smsProviderName, emailProviderName: form.emailProviderName, whatsappProviderName: form.whatsappProviderName,
        contactEmail: form.contactEmail, supportEmail: form.supportEmail, notificationEmail: form.notificationEmail,
        termsUrl: form.termsUrl, privacyUrl: form.privacyUrl, demoBookingUrl: form.demoBookingUrl,
        blogTitle: form.blogTitle, blogIntro: form.blogIntro, backupPolicyNote: form.backupPolicyNote,
        trialDays: form.trialDays, gracePeriodDays: form.gracePeriodDays, retentionDays: form.retentionDays,
        autoSuspendOnExpiry: form.autoSuspendOnExpiry, reminderDaysBefore: form.reminderDaysBefore,
        sessionTimeoutMinutes: form.sessionTimeoutMinutes, maxLoginAttempts: form.maxLoginAttempts, enforce2FA: form.enforce2FA
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
                    <Field label="System Name"><input style={inputStyle} {...f("systemName")} placeholder="Respark SaaS" /></Field>
                    <Field label="Invoice Prefix"><input style={inputStyle} {...f("invoicePrefix")} placeholder="INV" /></Field>
                    <Field label="Tax Label"><input style={inputStyle} {...f("taxLabel")} placeholder="GST" /></Field>
                    <Field label="Default Currency">
                      <select style={inputStyle} value={form.defaultCurrency} onChange={e => setForm(p => ({ ...p, defaultCurrency: e.target.value }))}>
                        {["PKR", "INR", "USD", "AED", "GBP", "EUR"].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </Field>
                    <Field label="Default Country"><input style={inputStyle} {...f("defaultCountry")} placeholder="Pakistan" /></Field>
                    <Field label="Default City"><input style={inputStyle} {...f("defaultCity")} placeholder="Lahore" /></Field>
                    <Field label="Timezone"><input style={inputStyle} {...f("defaultTimezone")} placeholder="Asia/Karachi" /></Field>
                    <Field label="Demo Booking URL"><input style={inputStyle} {...f("demoBookingUrl")} placeholder="/book-demo" /></Field>
                    <Field label="Terms URL"><input style={inputStyle} {...f("termsUrl")} placeholder="/terms" /></Field>
                    <Field label="Privacy URL"><input style={inputStyle} {...f("privacyUrl")} placeholder="/privacy" /></Field>
                    <Field label="Blog Title" full><input style={inputStyle} {...f("blogTitle")} placeholder="Respark Blog" /></Field>
                  </div>
                </div>
              )}

              {activeTab === "comms" && (
                <div>
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Communications & Providers</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Notification gateways, provider configuration, and contact mailboxes.</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                    <Toggle value={form.notificationEmailEnabled} onChange={v => setForm(p => ({ ...p, notificationEmailEnabled: v }))} label="Email Notifications" />
                    <Toggle value={form.notificationSmsEnabled} onChange={v => setForm(p => ({ ...p, notificationSmsEnabled: v }))} label="SMS Notifications" />
                    <Toggle value={form.notificationWhatsappEnabled} onChange={v => setForm(p => ({ ...p, notificationWhatsappEnabled: v }))} label="WhatsApp Notifications" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Field label="WhatsApp Number"><input style={inputStyle} {...f("whatsappNumber")} placeholder="+92300..." /></Field>
                    <Field label="WhatsApp Provider"><input style={inputStyle} {...f("whatsappProviderName")} placeholder="Meta / Twilio" /></Field>
                    <Field label="SMS Provider"><input style={inputStyle} {...f("smsProviderName")} placeholder="Twilio" /></Field>
                    <Field label="Email Provider"><input style={inputStyle} {...f("emailProviderName")} placeholder="SMTP / Resend" /></Field>
                    <Field label="Contact Email"><input style={inputStyle} type="email" {...f("contactEmail")} placeholder="hello@respark.io" /></Field>
                    <Field label="Support Email"><input style={inputStyle} type="email" {...f("supportEmail")} placeholder="support@respark.io" /></Field>
                    <Field label="Notification Email" full><input style={inputStyle} type="email" {...f("notificationEmail")} placeholder="noreply@respark.io" /></Field>
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
                  </div>
                  <div style={{ marginBottom: 16 }}>
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
                    <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Maintenance & Audit Log</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Control maintenance mode and review platform-wide activity history.</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                    <Toggle value={form.maintenanceMode} onChange={v => setForm(p => ({ ...p, maintenanceMode: v }))} label="Enable Maintenance Mode - locks out all salon owners" />
                    <Field label="Custom Maintenance Message">
                      <textarea rows={2} style={{ ...inputStyle, resize: "vertical" }} {...f("maintenanceMessage")} placeholder="We are performing scheduled maintenance. We will be back in 30 minutes." />
                    </Field>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Platform Audit Log</h4>
                      <button type="button" onClick={loadAuditLogs} style={{ padding: "6px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#64748b" }}>Refresh</button>
                    </div>
                    {auditLoading ? (
                      <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 13 }}>Loading audit logs...</div>
                    ) : auditLogs.length === 0 ? (
                      <EmptyState title="No audit events" message="Platform activity will appear here." />
                    ) : (
                      <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                        {auditLogs.map((log) => {
                          const mc = LOG_TYPE_COLORS[log.type] || LOG_TYPE_COLORS.default;
                          return (
                            <div key={log.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #f1f5f9" }}>
                              <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", background: mc.bg, color: mc.color }}>
                                {(log.type || "EVENT").replace(/_/g, " ")}
                              </span>
                              <span style={{ fontSize: 13, color: "#334155", flex: 1 }}>{log.action}</span>
                              <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>
                                {new Date(log.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
