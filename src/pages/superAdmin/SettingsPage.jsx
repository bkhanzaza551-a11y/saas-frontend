import { useEffect, useState, useCallback } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import PageLoader from "../../components/PageLoader";
import EmptyState from "../../components/EmptyState";
import CustomSelect from "../../components/CustomSelect";
import { Settings, MessageSquare, CreditCard, Shield, AlertTriangle, Eye, EyeOff, CheckCircle2, XCircle, AlertCircle, Save } from "lucide-react";

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

const DEFAULT_TEMPLATES = [
  { id: "tpl-1", name: "Owner Invitation Email", channel: "EMAIL", event: "OWNER_INVITATION", subject: "Welcome to SalonNest — Activate your salon account", body: "Hello {{name}},\n\nYou have been invited to set up your salon {{salonName}} on SalonNest.\n\nClick below to set your password:\n{{link}}\n\nBest regards,\nSalonNest Team" },
  { id: "tpl-2", name: "Email Verification Code", channel: "EMAIL", event: "EMAIL_VERIFICATION", subject: "SalonNest — Verify your email address", body: "Your verification code is: {{otp}}. This code is valid for 10 minutes." },
  { id: "tpl-3", name: "WhatsApp Login OTP", channel: "WHATSAPP", event: "OTP", subject: "", body: "Your SalonNest secure login OTP is {{otp}}. Valid for 10 minutes. Do not share with anyone." },
  { id: "tpl-4", name: "Welcome Message", channel: "WHATSAPP", event: "WELCOME_MESSAGE", subject: "", body: "Welcome to SalonNest, {{name}}! 🚀 Your salon {{salonName}} is ready to streamline operations and grow revenue." },
  { id: "tpl-5", name: "Subscription Expiry Alert", channel: "EMAIL", event: "SUBSCRIPTION_EXPIRY", subject: "Important: Your SalonNest subscription expires soon", body: "Dear {{name}},\n\nYour subscription for {{salonName}} is expiring in {{daysLeft}} days. Please renew to keep your POS and booking services active.\n\nRenew now: {{link}}" },
  { id: "tpl-6", name: "Payment Received Confirmation", channel: "WHATSAPP", event: "PAYMENT_CONFIRMATION", subject: "", body: "Payment received! ₹{{amount}} has been credited for your {{planName}} subscription. Invoice ID: {{invoiceId}}. Thank you!" },
  { id: "tpl-7", name: "Support Reply Notification", channel: "EMAIL", event: "SUPPORT_REPLY", subject: "Update on Ticket #{{ticketId}}", body: "Hello {{name}},\n\nOur team has responded to your ticket: \"{{ticketSubject}}\".\n\nResponse: {{replyText}}\n\nView ticket: {{link}}" },
  { id: "tpl-8", name: "Product Request Status", channel: "WHATSAPP", event: "PRODUCT_REQUEST_STATUS", subject: "", body: "Update on Product Request #{{requestId}}: Your request status has been updated to {{status}}." },
  { id: "tpl-9", name: "Staff Request Status", channel: "WHATSAPP", event: "STAFF_REQUEST_STATUS", subject: "", body: "Update on Staff Request #{{requestId}}: Status changed to {{status}}." }
];

export default function SuperAdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [showSecrets, setShowSecrets] = useState({});
  const [testingInteg, setTestingInteg] = useState("");
  const [form, setForm] = useState({
    systemName: "SalonNest", globalLogo: "", maintenanceMode: false, maintenanceMessage: "",
    taxLabel: "GST", defaultCurrency: "INR", currencyOptions: ["INR", "USD", "AED", "GBP", "EUR", "PKR"],
    defaultCountry: "India", defaultCity: "Delhi", defaultTimezone: "Asia/Kolkata", invoicePrefix: "INV", defaultLanguage: "en", invoiceFormat: "INV-{YYYY}-{00000}",
    timeFormat: "12",
    notificationEmailEnabled: true, notificationSmsEnabled: false, notificationWhatsappEnabled: true,
    accountOwnerInvite: true, accountEmailVerify: true, accountMobileVerify: true, accountPasswordReset: true,
    subTrialEnding: true, subExpiring: true, subExpired: true, subGraceEnding: true, subPaymentReceived: true, subPaymentPending: true,
    supportTicketCreated: true, supportReply: true, supportTicketResolved: true,
    productReqSubmitted: true, productReqApproved: true, productReqRejected: true, productReqCompleted: true,
    staffReqSubmitted: true, staffReqUpdated: true, staffReqCompleted: true,
    whatsappNumber: "", smsProviderName: "Twilio", emailProviderName: "SMTP", whatsappProviderName: "Meta Cloud API",
    contactEmail: "info@salonnest.in", supportEmail: "support@salonnest.in", notificationEmail: "alerts@salonnest.in",
    termsUrl: "/terms", privacyUrl: "/privacy", termsContent: "", privacyContent: "", demoBookingUrl: "/book-demo",
    blogTitle: "", blogIntro: "", backupPolicyNote: "",
    businessName: "SalonNest Technologies", businessEmail: "info@salonnest.in", businessPhone: "", businessAddress: "",
    businessCity: "Delhi", businessState: "Delhi", businessCountry: "India", businessPin: "",
    taxNumber: "", taxRate: 18,
    trialDays: 14, gracePeriodDays: 2, retentionDays: 90,
    retentionWarningDays: 14, retentionAction: "ARCHIVE",
    autoSuspendOnExpiry: false, reminderDaysBefore: 7,
    sessionTimeoutMinutes: 480, maxLoginAttempts: 5, enforce2FA: false,
    emailSenderId: "", smsSenderId: "", whatsappSenderId: "",
    requireEmailVerification: false, requireMobileVerification: false,
    otpExpiryMinutes: 10, inviteExpiryDays: 7, passwordLength: 8, lockDurationMinutes: 15,
    maintenanceEndTime: "",
    dateFormat: "DD/MM/YYYY",
    messageTemplates: DEFAULT_TEMPLATES,
    integrations: {
      paymentGateway: { provider: "Razorpay", apiKey: "", secret: "", webhookSecret: "", mode: "TEST", enabled: true },
      meetings: { calendarProvider: "Google Calendar", meetingProvider: "Google Meet", clientId: "", clientSecret: "", enabled: true },
      communications: { emailProvider: "SMTP", smsProvider: "Twilio", whatsappProvider: "Meta Cloud API", enabled: true }
    }
  });

  const f = (key) => ({ value: form[key] ?? "", onChange: (e) => setForm(p => ({ ...p, [key]: e.target.value })) });
  const n = (key) => ({ value: form[key] ?? "", type: "number", onChange: (e) => setForm(p => ({ ...p, [key]: e.target.value === "" ? null : Number(e.target.value) })) });

  const TEMPLATE_EVENTS = [
    { key: "OWNER_INVITATION", label: "Owner Invitation" },
    { key: "EMAIL_VERIFICATION", label: "Email Verification" },
    { key: "OTP", label: "OTP" },
    { key: "WELCOME_MESSAGE", label: "Welcome Message" },
    { key: "TRIAL_ENDING", label: "Trial Ending" },
    { key: "SUBSCRIPTION_EXPIRY", label: "Subscription Expiry" },
    { key: "PAYMENT_CONFIRMATION", label: "Payment Confirmation" },
    { key: "SUPPORT_REPLY", label: "Support Reply" },
    { key: "PRODUCT_REQUEST_STATUS", label: "Product Request Status" },
    { key: "STAFF_REQUEST_STATUS", label: "Staff Request Status" }
  ];
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
  const [templateError, setTemplateError] = useState("");

  const editTemplate = (tpl) => {
    setTemplateError("");
    setTemplateDraft(tpl ? { ...tpl } : { id: "", name: "", channel: "WHATSAPP", event: "OTP", subject: "", body: "" });
  };

  const insertToken = (token) => {
    setTemplateDraft(p => {
      const current = p.body || "";
      return {
        ...p,
        body: current ? `${current} ${token}` : token
      };
    });
    setTemplateError("");
  };

  const handleSaveTemplate = () => {
    if (!templateDraft) return;
    setTemplateError("");

    const name = (templateDraft.name || "").trim();
    if (!name || name.length < 2) {
      setTemplateError("Template name is required (minimum 2 characters).");
      return;
    }

    if (templateDraft.channel === "EMAIL" && (!templateDraft.subject || !templateDraft.subject.trim())) {
      setTemplateError("Email Subject is required for email templates.");
      return;
    }

    const body = (templateDraft.body || "").trim();
    if (!body || body.length < 5) {
      setTemplateError("Message body is required (minimum 5 characters).");
      return;
    }

    // Dynamic variable validation (checks for {var}, {{var}}, {0}, {1}, etc.)
    const hasDynamicToken = /\{[a-zA-Z0-9_]+\}|\{\{[a-zA-Z0-9_]+\}\}/.test(body);
    if (!hasDynamicToken) {
      setTemplateError("Message body must include at least one dynamic variable placeholder (e.g. {{otp}}, {{salonName}}, {1}). Click any token pill below to insert.");
      return;
    }

    // Event-specific validation
    if (templateDraft.event === "OTP") {
      const hasOtpToken = /\{\{?otp\}?\}|\{\{?code\}?\}|\{0\}|\{1\}/i.test(body);
      if (!hasOtpToken) {
        setTemplateError("OTP template must include an OTP variable like {{otp}} or {1}.");
        return;
      }
    }

    upsertTemplate(templateDraft);
    setTemplateDraft(null);
    setTemplateError("");
  };

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
        accountOwnerInvite: notif.accountOwnerInvite !== false,
        accountEmailVerify: notif.accountEmailVerify !== false,
        accountMobileVerify: notif.accountMobileVerify !== false,
        accountPasswordReset: notif.accountPasswordReset !== false,
        subTrialEnding: notif.subTrialEnding !== false,
        subExpiring: notif.subExpiring !== false,
        subExpired: notif.subExpired !== false,
        subGraceEnding: notif.subGraceEnding !== false,
        subPaymentReceived: notif.subPaymentReceived !== false,
        subPaymentPending: notif.subPaymentPending !== false,
        supportTicketCreated: notif.supportTicketCreated !== false,
        supportReply: notif.supportReply !== false,
        supportTicketResolved: notif.supportTicketResolved !== false,
        productReqSubmitted: notif.productReqSubmitted !== false,
        productReqApproved: notif.productReqApproved !== false,
        productReqRejected: notif.productReqRejected !== false,
        productReqCompleted: notif.productReqCompleted !== false,
        staffReqSubmitted: notif.staffReqSubmitted !== false,
        staffReqUpdated: notif.staffReqUpdated !== false,
        staffReqCompleted: notif.staffReqCompleted !== false,
        whatsappNumber: d.whatsappNumber || "",
        smsProviderName: d.smsProviderName || "",
        emailProviderName: d.emailProviderName || "",
        whatsappProviderName: d.whatsappProviderName || "",
        contactEmail: d.contactEmail || "",
        supportEmail: d.supportEmail || "",
        notificationEmail: d.notificationEmail || "",
        termsUrl: d.termsUrl || "/terms",
        privacyUrl: d.privacyUrl || "/privacy",
        termsContent: d.termsContent || "",
        privacyContent: d.privacyContent || "",
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
        retentionWarningDays: d.retentionWarningDays ?? 14,
        retentionAction: d.retentionAction || "ARCHIVE",
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
        inviteExpiryDays: d.inviteExpiryDays ?? 7,
        passwordLength: d.passwordLength ?? 8,
        lockDurationMinutes: d.lockDuration ?? d.lockDurationMinutes ?? 15,
        maintenanceEndTime: d.maintenanceEndTime || "",
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
    if (channel === "email" && !testRecipient.email?.trim()) {
      setStatus({ error: "Enter a test email address first.", success: "" });
      return;
    }
    if (channel !== "email" && !testRecipient.phone?.trim()) {
      setStatus({ error: "Enter a test phone number first.", success: "" });
      return;
    }
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

  const testIntegration = async (type, provider) => {
    setTestingInteg(type);
    setStatus({ error: "", success: "" });
    try {
      const res = await api.post("/super-admin/settings/test-integration", { type, provider });
      setStatus({ error: "", success: res.data?.message || `${type} connection verified.` });
    } catch (err) {
      setStatus({ error: formatApiError(err, "Connection test failed."), success: "" });
    } finally {
      setTestingInteg("");
    }
  };

  const toggleShowSecret = (key) => setShowSecrets(p => ({ ...p, [key]: !p[key] }));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (activeTab === "maintenance") loadAuditLogs();
  }, [activeTab, loadAuditLogs]);

  const submit = async (e) => {
    e.preventDefault();
    if (form.maintenanceMode && !window.confirm("⚠️ Final check: Maintenance mode is ON. Salon owners will be locked out. Save anyway?")) return;
    if (!form.systemName?.trim()) { setStatus({ error: "System Name is required.", success: "" }); return; }
    const emailFields = ["businessEmail", "contactEmail", "supportEmail", "notificationEmail"];
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const f of emailFields) {
      if (form[f] && !emailRe.test(form[f])) { setStatus({ error: `${f} is not a valid email address.`, success: "" }); return; }
    }
    setStatus({ error: "", success: "" });
    setSaving(true);
    try {
      await api.post("/super-admin/settings", {
        systemName: form.systemName, globalLogo: form.globalLogo, maintenanceMode: form.maintenanceMode, maintenanceMessage: form.maintenanceMessage,
        taxLabel: form.taxLabel, defaultCurrency: form.defaultCurrency,
        currencyOptions: Array.isArray(form.currencyOptions) ? form.currencyOptions : form.currencyOptions.split(",").map(s => s.trim()).filter(Boolean),
        defaultCountry: form.defaultCountry, defaultCity: form.defaultCity, defaultTimezone: form.defaultTimezone, invoicePrefix: form.invoicePrefix, defaultLanguage: form.defaultLanguage, invoiceFormat: form.invoiceFormat, timeFormat: form.timeFormat,
        notificationDefaults: { 
          email: form.notificationEmailEnabled, 
          sms: form.notificationSmsEnabled, 
          whatsapp: form.notificationWhatsappEnabled,
          accountOwnerInvite: form.accountOwnerInvite,
          accountEmailVerify: form.accountEmailVerify,
          accountMobileVerify: form.accountMobileVerify,
          accountPasswordReset: form.accountPasswordReset,
          subTrialEnding: form.subTrialEnding,
          subExpiring: form.subExpiring,
          subExpired: form.subExpired,
          subGraceEnding: form.subGraceEnding,
          subPaymentReceived: form.subPaymentReceived,
          subPaymentPending: form.subPaymentPending,
          supportTicketCreated: form.supportTicketCreated,
          supportReply: form.supportReply,
          supportTicketResolved: form.supportTicketResolved,
          productReqSubmitted: form.productReqSubmitted,
          productReqApproved: form.productReqApproved,
          productReqRejected: form.productReqRejected,
          productReqCompleted: form.productReqCompleted,
          staffReqSubmitted: form.staffReqSubmitted,
          staffReqUpdated: form.staffReqUpdated,
          staffReqCompleted: form.staffReqCompleted
        },
        whatsappNumber: form.whatsappNumber, smsProviderName: form.smsProviderName, emailProviderName: form.emailProviderName, whatsappProviderName: form.whatsappProviderName,
        contactEmail: form.contactEmail, supportEmail: form.supportEmail, notificationEmail: form.notificationEmail,
        termsUrl: form.termsUrl, privacyUrl: form.privacyUrl, termsContent: form.termsContent, privacyContent: form.privacyContent, demoBookingUrl: form.demoBookingUrl,
        blogTitle: form.blogTitle, blogIntro: form.blogIntro, backupPolicyNote: form.backupPolicyNote,
        businessName: form.businessName, businessEmail: form.businessEmail, businessPhone: form.businessPhone,
        businessAddress: form.businessAddress, businessCity: form.businessCity, businessState: form.businessState,
        businessCountry: form.businessCountry, businessPin: form.businessPin,
        taxNumber: form.taxNumber, taxRate: form.taxRate,
        emailSenderId: form.emailSenderId, smsSenderId: form.smsSenderId, whatsappSenderId: form.whatsappSenderId,
        trialDays: form.trialDays, gracePeriodDays: form.gracePeriodDays, retentionDays: form.retentionDays,
        retentionWarningDays: form.retentionWarningDays, retentionAction: form.retentionAction,
        autoSuspendOnExpiry: form.autoSuspendOnExpiry, reminderDaysBefore: form.reminderDaysBefore,
        sessionTimeoutMinutes: form.sessionTimeoutMinutes, maxLoginAttempts: form.maxLoginAttempts, enforce2FA: form.enforce2FA,
        requireEmailVerification: form.requireEmailVerification, requireMobileVerification: form.requireMobileVerification,
        otpExpiryMinutes: form.otpExpiryMinutes, inviteExpiryDays: form.inviteExpiryDays, passwordLength: form.passwordLength, lockDurationMinutes: form.lockDurationMinutes,
        maintenanceEndTime: form.maintenanceEndTime,
        dateFormat: form.dateFormat, messageTemplates: form.messageTemplates, integrations: form.integrations
      });
      setStatus({ error: "", success: "Settings saved successfully." });
      setTimeout(() => setStatus(p => ({ ...p, success: "" })), 3000);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not save settings"), success: "" });
    } finally { setSaving(false); }
  };

  const TAB_FIELD_MAP = {
    general: ["systemName", "globalLogo", "defaultCurrency", "defaultCountry", "defaultTimezone", "dateFormat", "timeFormat", "defaultLanguage", "currencyOptions", "invoicePrefix", "invoiceFormat"],
    business: ["businessName", "businessEmail", "businessPhone", "businessAddress", "businessCity", "businessState", "businessCountry", "businessPin", "taxNumber", "taxLabel", "taxRate"],
    comms: ["notificationEmailEnabled", "notificationSmsEnabled", "notificationWhatsappEnabled", "emailProviderName", "smsProviderName", "whatsappProviderName", "emailSenderId", "smsSenderId", "whatsappSenderId", "notificationEmail", "contactEmail", "supportEmail", "whatsappNumber"],
    notifications: ["notificationDefaults", "messageTemplates"],
    integrations: ["integrations"],
    policy: ["trialDays", "reminderDaysBefore", "gracePeriodDays", "autoSuspendOnExpiry", "retentionDays", "retentionWarningDays", "retentionAction", "termsUrl", "privacyUrl", "termsContent", "privacyContent", "demoBookingUrl"],
    security: ["requireEmailVerification", "requireMobileVerification", "otpExpiryMinutes", "inviteExpiryDays", "sessionTimeoutMinutes", "maxLoginAttempts", "lockDurationMinutes", "passwordLength", "enforce2FA"],
    maintenance: ["maintenanceMode", "maintenanceMessage", "maintenanceEndTime", "backupPolicyNote"]
  };

  const buildPayload = (fields) => {
    const p = {};
    for (const k of fields) {
      if (k === "notificationDefaults") {
        p.notificationDefaults = {
          email: form.notificationEmailEnabled, sms: form.notificationSmsEnabled, whatsapp: form.notificationWhatsappEnabled,
          accountOwnerInvite: form.accountOwnerInvite, accountEmailVerify: form.accountEmailVerify, accountMobileVerify: form.accountMobileVerify, accountPasswordReset: form.accountPasswordReset,
          subTrialEnding: form.subTrialEnding, subExpiring: form.subExpiring, subExpired: form.subExpired, subGraceEnding: form.subGraceEnding, subPaymentReceived: form.subPaymentReceived, subPaymentPending: form.subPaymentPending,
          supportTicketCreated: form.supportTicketCreated, supportReply: form.supportReply, supportTicketResolved: form.supportTicketResolved,
          productReqSubmitted: form.productReqSubmitted, productReqApproved: form.productReqApproved, productReqRejected: form.productReqRejected, productReqCompleted: form.productReqCompleted,
          staffReqSubmitted: form.staffReqSubmitted, staffReqUpdated: form.staffReqUpdated, staffReqCompleted: form.staffReqCompleted
        };
      } else if (k === "currencyOptions") {
        p.currencyOptions = Array.isArray(form.currencyOptions) ? form.currencyOptions : form.currencyOptions.split(",").map(s => s.trim()).filter(Boolean);
      } else if (k === "lockDurationMinutes") {
        p.lockDuration = form.lockDurationMinutes;
      } else {
        p[k] = form[k];
      }
    }
    return p;
  };

  const [savingTab, setSavingTab] = useState("");

  const saveTab = async (tabName) => {
    const fields = TAB_FIELD_MAP[tabName];
    if (!fields) return;
    setStatus({ error: "", success: "" });
    setSavingTab(tabName);
    try {
      const payload = buildPayload(fields);
      await api.post("/super-admin/settings", payload);
      setStatus({ error: "", success: `${tabName.charAt(0).toUpperCase() + tabName.slice(1)} settings saved.` });
      setTimeout(() => setStatus(p => ({ ...p, success: "" })), 3000);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not save"), success: "" });
    } finally { setSavingTab(""); }
  };

  const TabSaveButton = ({ tabName }) => (
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
      <button type="button" onClick={() => saveTab(tabName)} disabled={savingTab === tabName || saving}
        style={{ padding: "7px 20px", background: savingTab === tabName ? "#94a3b8" : "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)", color: "white", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 12, cursor: savingTab === tabName ? "not-allowed" : "pointer" }}>
        {savingTab === tabName ? "Saving..." : "Save"}
      </button>
    </div>
  );

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
                      <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#f8fafc", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 8, background: "white", border: "1px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", padding: 3, flexShrink: 0, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                            <img
                              src={form.globalLogo || "/logo.jfif"}
                              alt="Platform Logo"
                              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                            />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {form.globalLogo ? "Custom Uploaded Logo" : "Default SalonNest Logo"}
                            </div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>
                              {form.globalLogo ? "Active custom logo in use" : "Active: /logo.jfif"}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          <label style={{ cursor: "pointer", background: "#4f46e5", color: "white", padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6, margin: 0, boxShadow: "0 1px 3px rgba(79, 70, 229, 0.3)" }}>
                            <span>📁 Change Logo</span>
                            <input
                              type="file"
                              style={{ display: "none" }}
                              accept="image/png,image/jpeg,image/svg+xml,image/webp"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                if (file.size > 1024 * 1024) {
                                  setStatus({ error: "Logo must be under 1MB. Please compress the image.", success: "" });
                                  e.target.value = "";
                                  return;
                                }
                                const r = new FileReader();
                                r.onload = (ev) => {
                                  setForm(p => ({ ...p, globalLogo: ev.target.result }));
                                  setStatus({ success: "New logo preview loaded. Click 'Save' to apply changes.", error: "" });
                                };
                                r.readAsDataURL(file);
                              }}
                            />
                          </label>
                          {form.globalLogo && (
                            <button
                              type="button"
                              onClick={() => {
                                setForm(p => ({ ...p, globalLogo: "" }));
                                setStatus({ success: "Reset to default SalonNest logo. Click 'Save' to apply.", error: "" });
                              }}
                              style={{ background: "#f1f5f9", color: "#64748b", border: "1px solid #cbd5e1", padding: "7px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                            >
                              ↺ Reset
                            </button>
                          )}
                        </div>
                      </div>
                    </Field>
                    <Field label="Default Currency">
                      <CustomSelect value={form.defaultCurrency} onChange={e => setForm(p => ({ ...p, defaultCurrency: e.target.value }))}>
                        {["PKR", "INR", "USD", "AED", "GBP", "EUR"].map(c => <option key={c} value={c}>{c}</option>)}
                      </CustomSelect>
                    </Field>
                    <Field label="Default Country"><input style={inputStyle} {...f("defaultCountry")} placeholder="India" /></Field>
                    <Field label="Timezone"><input style={inputStyle} {...f("defaultTimezone")} placeholder="Asia/Kolkata" /></Field>
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
                    <Field label="Default Language">
                      <CustomSelect value={form.defaultLanguage || "en"} onChange={e => setForm(p => ({ ...p, defaultLanguage: e.target.value }))}>
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="ur">Urdu</option>
                        <option value="ar">Arabic</option>
                        <option value="bn">Bengali</option>
                        <option value="ta">Tamil</option>
                        <option value="te">Telugu</option>
                        <option value="mr">Marathi</option>
                        <option value="kn">Kannada</option>
                        <option value="ml">Malayalam</option>
                      </CustomSelect>
                    </Field>
                  </div>
                  <TabSaveButton tabName="general" />
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
                  <TabSaveButton tabName="business" />
                </div>
              )}
 
              {activeTab === "comms" && (
                <div>
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Communications</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Control how SalonNest sends email, SMS, and WhatsApp communications.</p>
                  </div>

                  {/* Test Recipient Section */}
                  <div style={{ padding: 14, background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                    <Field label="Test Recipient Email">
                      <input style={inputStyle} type="email" value={testRecipient.email} onChange={e => setTestRecipient(p => ({ ...p, email: e.target.value }))} placeholder="test@yourcompany.com" />
                    </Field>
                    <Field label="Test Recipient Phone">
                      <input style={inputStyle} value={testRecipient.phone} onChange={e => setTestRecipient(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" />
                    </Field>
                  </div>

                  {/* Section 3.1: Email */}
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18, marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <div>
                        <h4 style={{ margin: "0 0 2px 0", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Email</h4>
                        <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>System transactional emails and notifications</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Toggle value={form.notificationEmailEnabled} onChange={v => setForm(p => ({ ...p, notificationEmailEnabled: v }))} label="Enable Email" />
                        <button type="button" disabled={!form.notificationEmailEnabled || !!testingChannel} onClick={() => testChannel("email")} style={{ padding: "8px 16px", background: "#4f46e5", color: "white", border: "none", borderRadius: 8, cursor: !form.notificationEmailEnabled || testingChannel ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700 }}>
                          {testingChannel === "email" ? "Sending..." : "Test Email"}
                        </button>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <Field label="Email Provider">
                        <CustomSelect value={form.emailProviderName || "SMTP"} onChange={e => setForm(p => ({ ...p, emailProviderName: e.target.value }))}>
                          <option value="SMTP">SMTP (Configured Server)</option>
                          <option value="Resend">Resend (API)</option>
                          <option value="SendGrid">SendGrid (API)</option>
                          <option value="Amazon SES">Amazon SES</option>
                          <option value="Postmark">Postmark</option>
                        </CustomSelect>
                      </Field>
                      <Field label="Sender Name">
                        <input style={inputStyle} {...f("emailSenderId")} placeholder="SalonNest" />
                      </Field>
                      <Field label="Sender Email">
                        <input style={inputStyle} type="email" {...f("notificationEmail")} placeholder="alerts@salonnest.in" />
                      </Field>
                      <Field label="Reply-to Email">
                        <input style={inputStyle} type="email" {...f("contactEmail")} placeholder="support@salonnest.in" />
                      </Field>
                      <Field label="Support Email" full>
                        <input style={inputStyle} type="email" {...f("supportEmail")} placeholder="help@salonnest.in" />
                      </Field>
                    </div>
                  </div>

                  {/* Section 3.2: SMS */}
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18, marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <div>
                        <h4 style={{ margin: "0 0 2px 0", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>SMS</h4>
                        <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Instant mobile text alerts and OTPs</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Toggle value={form.notificationSmsEnabled} onChange={v => setForm(p => ({ ...p, notificationSmsEnabled: v }))} label="Enable SMS" />
                        <button type="button" disabled={!form.notificationSmsEnabled || !!testingChannel} onClick={() => testChannel("sms")} style={{ padding: "8px 16px", background: "#4f46e5", color: "white", border: "none", borderRadius: 8, cursor: !form.notificationSmsEnabled || testingChannel ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700 }}>
                          {testingChannel === "sms" ? "Sending..." : "Test SMS"}
                        </button>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <Field label="SMS Provider">
                        <CustomSelect value={form.smsProviderName || "Twilio"} onChange={e => setForm(p => ({ ...p, smsProviderName: e.target.value }))}>
                          <option value="Twilio">Twilio</option>
                          <option value="Msg91">Msg91 (India DLT)</option>
                          <option value="Fast2SMS">Fast2SMS</option>
                          <option value="AWS SNS">AWS SNS</option>
                        </CustomSelect>
                      </Field>
                      <Field label="Sender ID / Number">
                        <input style={inputStyle} {...f("smsSenderId")} placeholder="SLNNST / +1234567890" />
                      </Field>
                    </div>
                  </div>

                  {/* Section 3.3: WhatsApp */}
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <div>
                        <h4 style={{ margin: "0 0 2px 0", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>WhatsApp</h4>
                        <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Business messaging and real-time confirmations</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Toggle value={form.notificationWhatsappEnabled} onChange={v => setForm(p => ({ ...p, notificationWhatsappEnabled: v }))} label="Enable WhatsApp" />
                        <button type="button" disabled={!form.notificationWhatsappEnabled || !!testingChannel} onClick={() => testChannel("whatsapp")} style={{ padding: "8px 16px", background: "#4f46e5", color: "white", border: "none", borderRadius: 8, cursor: !form.notificationWhatsappEnabled || testingChannel ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700 }}>
                          {testingChannel === "whatsapp" ? "Sending..." : "Test WhatsApp"}
                        </button>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <Field label="WhatsApp Provider">
                        <CustomSelect value={form.whatsappProviderName || "Meta Cloud API"} onChange={e => setForm(p => ({ ...p, whatsappProviderName: e.target.value }))}>
                          <option value="Meta Cloud API">Meta Cloud API (Official)</option>
                          <option value="Twilio WhatsApp">Twilio WhatsApp</option>
                          <option value="Wati">Wati</option>
                          <option value="Interakt">Interakt</option>
                        </CustomSelect>
                      </Field>
                      <Field label="WhatsApp Business Number">
                        <input style={inputStyle} {...f("whatsappNumber")} placeholder="+91 98765 43210" />
                      </Field>
                    </div>
                  </div>
                  <TabSaveButton tabName="comms" />
                </div>
              )}

              {/* Section 4: Notification Settings */}
              {activeTab === "notifications" && (
                <div>
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Notification Settings</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Control what SalonNest automatically notifies users about.</p>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {/* 4.1 Account Notifications */}
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
                      <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Account</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <Toggle value={form.accountOwnerInvite ?? true} onChange={v => setForm(p => ({ ...p, accountOwnerInvite: v }))} label="Owner invitation" />
                        <Toggle value={form.accountEmailVerify ?? true} onChange={v => setForm(p => ({ ...p, accountEmailVerify: v }))} label="Email verification" />
                        <Toggle value={form.accountMobileVerify ?? true} onChange={v => setForm(p => ({ ...p, accountMobileVerify: v }))} label="Mobile verification" />
                        <Toggle value={form.accountPasswordReset ?? true} onChange={v => setForm(p => ({ ...p, accountPasswordReset: v }))} label="Password reset" />
                      </div>
                    </div>

                    {/* 4.2 Subscription Notifications */}
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
                      <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Subscription</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <Toggle value={form.subTrialEnding ?? true} onChange={v => setForm(p => ({ ...p, subTrialEnding: v }))} label="Trial ending" />
                        <Toggle value={form.subExpiring ?? true} onChange={v => setForm(p => ({ ...p, subExpiring: v }))} label="Subscription expiring" />
                        <Toggle value={form.subExpired ?? true} onChange={v => setForm(p => ({ ...p, subExpired: v }))} label="Subscription expired" />
                        <Toggle value={form.subGraceEnding ?? true} onChange={v => setForm(p => ({ ...p, subGraceEnding: v }))} label="2-day access ending" />
                        <Toggle value={form.subPaymentReceived ?? true} onChange={v => setForm(p => ({ ...p, subPaymentReceived: v }))} label="Payment received" />
                        <Toggle value={form.subPaymentPending ?? true} onChange={v => setForm(p => ({ ...p, subPaymentPending: v }))} label="Payment pending" />
                      </div>
                    </div>

                    {/* 4.3 Support Notifications */}
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
                      <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Support</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <Toggle value={form.supportTicketCreated ?? true} onChange={v => setForm(p => ({ ...p, supportTicketCreated: v }))} label="Ticket created" />
                        <Toggle value={form.supportReply ?? true} onChange={v => setForm(p => ({ ...p, supportReply: v }))} label="Support reply" />
                        <Toggle value={form.supportTicketResolved ?? true} onChange={v => setForm(p => ({ ...p, supportTicketResolved: v }))} label="Ticket resolved" />
                      </div>
                    </div>

                    {/* 4.4 Product Requests Notifications */}
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
                      <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Product Requests</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <Toggle value={form.productReqSubmitted ?? true} onChange={v => setForm(p => ({ ...p, productReqSubmitted: v }))} label="Request submitted" />
                        <Toggle value={form.productReqApproved ?? true} onChange={v => setForm(p => ({ ...p, productReqApproved: v }))} label="Approved" />
                        <Toggle value={form.productReqRejected ?? true} onChange={v => setForm(p => ({ ...p, productReqRejected: v }))} label="Rejected" />
                        <Toggle value={form.productReqCompleted ?? true} onChange={v => setForm(p => ({ ...p, productReqCompleted: v }))} label="Completed" />
                      </div>
                    </div>

                    {/* 4.5 Staff Requests Notifications */}
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
                      <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Staff Requests</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <Toggle value={form.staffReqSubmitted ?? true} onChange={v => setForm(p => ({ ...p, staffReqSubmitted: v }))} label="Request submitted" />
                        <Toggle value={form.staffReqUpdated ?? true} onChange={v => setForm(p => ({ ...p, staffReqUpdated: v }))} label="Status updated" />
                        <Toggle value={form.staffReqCompleted ?? true} onChange={v => setForm(p => ({ ...p, staffReqCompleted: v }))} label="Completed" />
                      </div>
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
                      <div style={{ background: "white", borderRadius: 16, padding: 24, width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                          <h4 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>{templateDraft.id ? "Edit Template" : "New Template"}</h4>
                          <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 12, background: CHANNEL_COLORS[templateDraft.channel]?.bg || "#f1f5f9", color: CHANNEL_COLORS[templateDraft.channel]?.color || "#334155" }}>
                            {templateDraft.channel}
                          </span>
                        </div>

                        {templateError && (
                          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", color: "#b91c1c", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                            <AlertCircle size={18} style={{ flexShrink: 0 }} />
                            <span>{templateError}</span>
                          </div>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                          <Field label="Template Name">
                            <input 
                              style={{ ...inputStyle, borderColor: templateError && !templateDraft.name?.trim() ? "#ef4444" : "#cbd5e1" }} 
                              value={templateDraft.name} 
                              onChange={e => { setTemplateDraft(p => ({ ...p, name: e.target.value })); if (templateError) setTemplateError(""); }} 
                              placeholder="e.g. Login OTP Alert" 
                            />
                          </Field>
                          <Field label="Channel">
                            <CustomSelect value={templateDraft.channel} onChange={e => { setTemplateDraft(p => ({ ...p, channel: e.target.value })); if (templateError) setTemplateError(""); }}>
                              <option value="EMAIL">Email</option>
                              <option value="SMS">SMS</option>
                              <option value="WHATSAPP">WhatsApp</option>
                            </CustomSelect>
                          </Field>
                          <Field label="Trigger Event" full>
                            <CustomSelect value={templateDraft.event} onChange={e => { setTemplateDraft(p => ({ ...p, event: e.target.value })); if (templateError) setTemplateError(""); }}>
                              {TEMPLATE_EVENTS.map(ev => <option key={ev.key} value={ev.key}>{ev.label}</option>)}
                            </CustomSelect>
                          </Field>
                          {templateDraft.channel === "EMAIL" && (
                            <Field label="Subject" full>
                              <input 
                                style={{ ...inputStyle, borderColor: templateError && !templateDraft.subject?.trim() ? "#ef4444" : "#cbd5e1" }} 
                                value={templateDraft.subject || ""} 
                                onChange={e => { setTemplateDraft(p => ({ ...p, subject: e.target.value })); if (templateError) setTemplateError(""); }} 
                                placeholder="Your security verification code" 
                              />
                            </Field>
                          )}
                          <Field label="Message Body" full>
                            <textarea 
                              rows={5} 
                              style={{ ...inputStyle, resize: "vertical", borderColor: templateError && (!templateDraft.body?.trim() || !/\{[a-zA-Z0-9_]+\}|\{\{[a-zA-Z0-9_]+\}\}/.test(templateDraft.body)) ? "#ef4444" : "#cbd5e1" }} 
                              value={templateDraft.body || ""} 
                              onChange={e => { setTemplateDraft(p => ({ ...p, body: e.target.value })); if (templateError) setTemplateError(""); }} 
                              placeholder={templateDraft.event === "OTP" ? "Your OTP for {{salonName}} is {{otp}}. Valid for {{minutes}} minutes." : "Hello {{name}}, your subscription for {{salonName}} expires in {{daysLeft}} days."} 
                            />
                          </Field>

                          {/* Interactive dynamic token pills */}
                          <div style={{ gridColumn: "1 / -1", background: "#f8fafc", padding: 12, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                              Click to insert dynamic variable:
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {(templateDraft.event === "OTP" ? ["{{otp}}", "{{salonName}}", "{{minutes}}", "{1}"] :
                                templateDraft.event === "WELCOME_MESSAGE" ? ["{{name}}", "{{salonName}}", "{{link}}", "{1}"] :
                                templateDraft.event === "TRIAL_ENDING" ? ["{{salonName}}", "{{daysLeft}}", "{{planName}}", "{{link}}", "{1}"] :
                                templateDraft.event === "SUBSCRIPTION_EXPIRY" ? ["{{salonName}}", "{{planName}}", "{{link}}", "{1}"] :
                                templateDraft.event === "PAYMENT_CONFIRMATION" ? ["{{amount}}", "{{salonName}}", "{{link}}", "{1}"] :
                                templateDraft.event === "SUPPORT_REPLY" ? ["{{ticketId}}", "{{name}}", "{{status}}", "{{link}}", "{1}"] :
                                ["{{name}}", "{{salonName}}", "{{otp}}", "{{link}}", "{{amount}}", "{{planName}}", "{{daysLeft}}", "{{ticketId}}", "{{status}}", "{1}"]
                              ).map(token => (
                                <button
                                  key={token}
                                  type="button"
                                  onClick={() => insertToken(token)}
                                  style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, color: "#4f46e5", cursor: "pointer", transition: "all 0.15s" }}
                                  onMouseOver={e => { e.currentTarget.style.background = "#e0e7ff"; e.currentTarget.style.borderColor = "#818cf8"; }}
                                  onMouseOut={e => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
                                >
                                  + {token}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                          <button type="button" onClick={() => setTemplateDraft(null)} style={{ padding: "8px 18px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" }}>Cancel</button>
                          <button type="button" onClick={handleSaveTemplate} style={{ padding: "8px 20px", background: "#4f46e5", color: "white", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: "0 2px 4px rgba(79, 70, 229, 0.3)" }}>Save Template</button>
                        </div>
                      </div>
                    </div>
                  )}
                  <TabSaveButton tabName="notifications" />
                </div>
              )}

              {/* Section 6: Integrations */}
              {activeTab === "integrations" && (
                <div>
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Integrations</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Manage external payment gateways, meeting providers, and communication channels with secure credential handling.</p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {/* 6.1 Payment Gateway */}
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, background: "white" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Payment Gateway</h4>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: form.integrations?.paymentGateway?.enabled ? "#ecfdf5" : "#f1f5f9", color: form.integrations?.paymentGateway?.enabled ? "#059669" : "#64748b", border: `1px solid ${form.integrations?.paymentGateway?.enabled ? "#a7f3d0" : "#e2e8f0"}` }}>
                              {form.integrations?.paymentGateway?.enabled ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                              {form.integrations?.paymentGateway?.enabled ? "Connected" : "Not Connected"}
                            </span>
                          </div>
                          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Automate online subscription and product payments</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Toggle value={Boolean(form.integrations?.paymentGateway?.enabled)} onChange={v => setForm(p => ({ ...p, integrations: { ...p.integrations, paymentGateway: { ...p.integrations.paymentGateway, enabled: v } } }))} label="Status" />
                          <button type="button" disabled={testingInteg === "paymentGateway" || !form.integrations?.paymentGateway?.enabled} onClick={() => testIntegration("paymentGateway", form.integrations?.paymentGateway?.provider || "Razorpay")} style={{ padding: "8px 16px", background: "#4f46e5", color: "white", border: "none", borderRadius: 8, cursor: !form.integrations?.paymentGateway?.enabled || testingInteg ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700 }}>
                            {testingInteg === "paymentGateway" ? "Testing..." : "Test Connection"}
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <Field label="Provider">
                          <CustomSelect value={form.integrations?.paymentGateway?.provider || "Razorpay"} onChange={e => setForm(p => ({ ...p, integrations: { ...p.integrations, paymentGateway: { ...p.integrations.paymentGateway, provider: e.target.value } } }))}>
                            <option value="Razorpay">Razorpay (India standard)</option>
                            <option value="Stripe">Stripe (International)</option>
                            <option value="Cashfree">Cashfree</option>
                            <option value="PayU">PayU</option>
                          </CustomSelect>
                        </Field>
                        <Field label="Mode">
                          <CustomSelect value={form.integrations?.paymentGateway?.mode || "TEST"} onChange={e => setForm(p => ({ ...p, integrations: { ...p.integrations, paymentGateway: { ...p.integrations.paymentGateway, mode: e.target.value } } }))}>
                            <option value="TEST">Test / Sandbox Mode</option>
                            <option value="LIVE">Live / Production Mode</option>
                          </CustomSelect>
                        </Field>
                        <Field label="Key ID / Public Key">
                          <input style={inputStyle} value={form.integrations?.paymentGateway?.apiKey || ""} onChange={e => setForm(p => ({ ...p, integrations: { ...p.integrations, paymentGateway: { ...p.integrations.paymentGateway, apiKey: e.target.value } } }))} placeholder="rzp_test_..." />
                        </Field>
                        <Field label="Key Secret (Secure)">
                          <div style={{ position: "relative" }}>
                            <input style={{ ...inputStyle, paddingRight: 40 }} type={showSecrets.pgSecret ? "text" : "password"} value={form.integrations?.paymentGateway?.secret || ""} onChange={e => setForm(p => ({ ...p, integrations: { ...p.integrations, paymentGateway: { ...p.integrations.paymentGateway, secret: e.target.value } } }))} placeholder="••••••••••••••••" />
                            <button type="button" onClick={() => toggleShowSecret("pgSecret")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                              {showSecrets.pgSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </Field>
                      </div>
                    </div>

                    {/* 6.2 Meeting / Calendar Integration (for Sales CRM Demo Scheduling) */}
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, background: "white" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Meeting / Calendar</h4>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: form.integrations?.meetings?.enabled ? "#ecfdf5" : "#f1f5f9", color: form.integrations?.meetings?.enabled ? "#059669" : "#64748b", border: `1px solid ${form.integrations?.meetings?.enabled ? "#a7f3d0" : "#e2e8f0"}` }}>
                              {form.integrations?.meetings?.enabled ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                              {form.integrations?.meetings?.enabled ? "Connected" : "Not Connected"}
                            </span>
                          </div>
                          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Used by Sales CRM to schedule and launch product demos</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Toggle value={Boolean(form.integrations?.meetings?.enabled)} onChange={v => setForm(p => ({ ...p, integrations: { ...p.integrations, meetings: { ...p.integrations.meetings, enabled: v } } }))} label="Status" />
                          <button type="button" disabled={testingInteg === "meetings" || !form.integrations?.meetings?.enabled} onClick={() => testIntegration("meetings", form.integrations?.meetings?.meetingProvider || "Google Meet")} style={{ padding: "8px 16px", background: "#4f46e5", color: "white", border: "none", borderRadius: 8, cursor: !form.integrations?.meetings?.enabled || testingInteg ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700 }}>
                            {testingInteg === "meetings" ? "Testing..." : "Test Connection"}
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <Field label="Calendar Provider">
                          <CustomSelect value={form.integrations?.meetings?.calendarProvider || "Google Calendar"} onChange={e => setForm(p => ({ ...p, integrations: { ...p.integrations, meetings: { ...p.integrations.meetings, calendarProvider: e.target.value } } }))}>
                            <option value="Google Calendar">Google Calendar</option>
                            <option value="Microsoft Outlook">Microsoft Outlook Calendar</option>
                            <option value="Custom CalDAV">Custom CalDAV</option>
                          </CustomSelect>
                        </Field>
                        <Field label="Meeting Provider">
                          <CustomSelect value={form.integrations?.meetings?.meetingProvider || "Google Meet"} onChange={e => setForm(p => ({ ...p, integrations: { ...p.integrations, meetings: { ...p.integrations.meetings, meetingProvider: e.target.value } } }))}>
                            <option value="Google Meet">Google Meet</option>
                            <option value="Zoom">Zoom</option>
                            <option value="Microsoft Teams">Microsoft Teams</option>
                          </CustomSelect>
                        </Field>
                        <Field label="Client ID / API Key">
                          <input style={inputStyle} value={form.integrations?.meetings?.clientId || ""} onChange={e => setForm(p => ({ ...p, integrations: { ...p.integrations, meetings: { ...p.integrations.meetings, clientId: e.target.value } } }))} placeholder="client-id-..." />
                        </Field>
                        <Field label="Client Secret (Secure)">
                          <div style={{ position: "relative" }}>
                            <input style={{ ...inputStyle, paddingRight: 40 }} type={showSecrets.meetingSecret ? "text" : "password"} value={form.integrations?.meetings?.clientSecret || ""} onChange={e => setForm(p => ({ ...p, integrations: { ...p.integrations, meetings: { ...p.integrations.meetings, clientSecret: e.target.value } } }))} placeholder="••••••••••••••••" />
                            <button type="button" onClick={() => toggleShowSecret("meetingSecret")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                              {showSecrets.meetingSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </Field>
                      </div>
                    </div>

                    {/* 6.3 Communication Integrations Summary */}
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, background: "white" }}>
                      <h4 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Communication Integrations</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                        <div style={{ padding: 14, background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <strong style={{ fontSize: 14, color: "#1e293b" }}>Email</strong>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: form.notificationEmailEnabled ? "#ecfdf5" : "#f1f5f9", color: form.notificationEmailEnabled ? "#059669" : "#64748b" }}>
                              {form.notificationEmailEnabled ? "Connected" : "Disabled"}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>Provider: {form.emailProviderName || "SMTP"}</div>
                          <button type="button" onClick={() => testChannel("email")} style={{ width: "100%", padding: "6px 0", background: "white", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Test Email</button>
                        </div>

                        <div style={{ padding: 14, background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <strong style={{ fontSize: 14, color: "#1e293b" }}>SMS</strong>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: form.notificationSmsEnabled ? "#ecfdf5" : "#f1f5f9", color: form.notificationSmsEnabled ? "#059669" : "#64748b" }}>
                              {form.notificationSmsEnabled ? "Connected" : "Disabled"}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>Provider: {form.smsProviderName || "Twilio"}</div>
                          <button type="button" onClick={() => testChannel("sms")} style={{ width: "100%", padding: "6px 0", background: "white", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Test SMS</button>
                        </div>

                        <div style={{ padding: 14, background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <strong style={{ fontSize: 14, color: "#1e293b" }}>WhatsApp</strong>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: form.notificationWhatsappEnabled ? "#ecfdf5" : "#f1f5f9", color: form.notificationWhatsappEnabled ? "#059669" : "#64748b" }}>
                              {form.notificationWhatsappEnabled ? "Connected" : "Disabled"}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>Provider: {form.whatsappProviderName || "Meta Cloud API"}</div>
                          <button type="button" onClick={() => testChannel("whatsapp")} style={{ width: "100%", padding: "6px 0", background: "white", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Test WhatsApp</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <TabSaveButton tabName="integrations" />
                </div>
              )}

              {/* Section 7: Subscription Policies */}
              {activeTab === "policy" && (
                <div>
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Subscription Policies</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Configure default trial days, post-expiry grace periods, and data retention rules across SalonNest.</p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {/* 7.1 Trial Settings */}
                    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
                      <h4 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Trial Policy</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <Field label="Default Trial Days">
                          <input style={inputStyle} {...n("trialDays")} min={1} max={90} placeholder="14" />
                        </Field>
                      </div>
                    </div>

                    {/* 7.2 Expiry Policy */}
                    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
                      <h4 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Expiry Policy</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <Field label="Expiry Warning Days (Before Expiry)">
                          <input style={inputStyle} {...n("reminderDaysBefore")} min={1} max={30} placeholder="7" />
                        </Field>
                        <Field label="Post-Expiry Access Period (Days)">
                          <input style={inputStyle} {...n("gracePeriodDays")} min={0} max={30} placeholder="2" />
                        </Field>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <Toggle value={form.autoSuspendOnExpiry} onChange={v => setForm(p => ({ ...p, autoSuspendOnExpiry: v }))} label="Auto-Suspend Salon Access after Post-Expiry Period" />
                        </div>
                      </div>
                    </div>

                    {/* 7.3 Data Retention Policy */}
                    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
                      <h4 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Data Retention</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                        <Field label="Retention Period (Days from Expiry)">
                          <input style={inputStyle} {...n("retentionDays")} min={1} max={365} placeholder="90" />
                        </Field>
                        <Field label="Retention Warning (Days Before Purge)">
                          <input style={inputStyle} {...n("retentionWarningDays")} min={1} max={60} placeholder="14" />
                        </Field>
                        <Field label="Action After Retention">
                          <CustomSelect value={form.retentionAction || "ARCHIVE"} onChange={e => setForm(p => ({ ...p, retentionAction: e.target.value }))}>
                            <option value="ARCHIVE">Archive data (Recommended)</option>
                            <option value="SOFT_DELETE">Soft delete records</option>
                            <option value="PURGE">Permanent delete / Purge</option>
                            <option value="LOCK">Lock account permanently</option>
                          </CustomSelect>
                        </Field>
                      </div>
                    </div>

                    {/* 7.4 Subscription Lifecycle Visualizer */}
                    <div style={{ padding: 20, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>Configured Subscription Lifecycle</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", fontSize: 12 }}>
                        <div style={{ background: "#eef2ff", color: "#3730a3", padding: "8px 14px", borderRadius: 8, fontWeight: 700, border: "1px solid #c7d2fe" }}>
                          1. Trial Period ({form.trialDays} Days)
                        </div>
                        <span style={{ color: "#94a3b8", fontWeight: 800 }}>→</span>
                        <div style={{ background: "#ecfdf5", color: "#065f46", padding: "8px 14px", borderRadius: 8, fontWeight: 700, border: "1px solid #a7f3d0" }}>
                          2. Active Subscription
                        </div>
                        <span style={{ color: "#94a3b8", fontWeight: 800 }}>→</span>
                        <div style={{ background: "#fef2f2", color: "#991b1b", padding: "8px 14px", borderRadius: 8, fontWeight: 700, border: "1px solid #fecaca" }}>
                          3. Subscription Expires
                        </div>
                        <span style={{ color: "#94a3b8", fontWeight: 800 }}>→</span>
                        <div style={{ background: "#fffbeb", color: "#92400e", padding: "8px 14px", borderRadius: 8, fontWeight: 700, border: "1px solid #fde68a" }}>
                          4. Post-Expiry Access ({form.gracePeriodDays} Days)
                        </div>
                        <span style={{ color: "#94a3b8", fontWeight: 800 }}>→</span>
                        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "8px 14px", borderRadius: 8, fontWeight: 700, border: "1px solid #fca5a5" }}>
                          5. Restricted Access
                        </div>
                        <span style={{ color: "#94a3b8", fontWeight: 800 }}>→</span>
                        <div style={{ background: "#f1f5f9", color: "#334155", padding: "8px 14px", borderRadius: 8, fontWeight: 700, border: "1px solid #cbd5e1" }}>
                          6. Data Retained (Day {form.retentionDays})
                        </div>
                        <span style={{ color: "#94a3b8", fontWeight: 800 }}>→</span>
                        <div style={{ background: "#0f172a", color: "white", padding: "8px 14px", borderRadius: 8, fontWeight: 700 }}>
                          7. {form.retentionAction === "PURGE" ? "Purge / Delete" : (form.retentionAction === "SOFT_DELETE" ? "Soft Delete" : (form.retentionAction === "LOCK" ? "Lock Account" : "Archive Data"))}
                        </div>
                      </div>
                    </div>

                    {/* 7.5 Legal Policy Links & Content */}
                    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
                      <h4 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Legal Policy Links & Content</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <Field label="Terms of Service URL">
                          <input style={inputStyle} {...f("termsUrl")} placeholder="/terms" />
                        </Field>
                        <Field label="Privacy Policy URL">
                          <input style={inputStyle} {...f("privacyUrl")} placeholder="/privacy" />
                        </Field>
                        <Field label="Demo Booking URL">
                          <input style={inputStyle} {...f("demoBookingUrl")} placeholder="/book-demo" />
                        </Field>
                        <div />
                        <Field label="Terms of Service Content" full>
                          <textarea rows={4} style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 12 }} {...f("termsContent")} placeholder="Paste your Terms of Service content here..." />
                        </Field>
                        <Field label="Privacy Policy Content" full>
                          <textarea rows={4} style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 12 }} {...f("privacyContent")} placeholder="Paste your Privacy Policy content here..." />
                        </Field>
                      </div>
                    </div>
                  </div>
                  <TabSaveButton tabName="policy" />
                </div>
              )}

              {/* Section 8: Security Settings */}
              {activeTab === "security" && (
                <div>
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Security Settings</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Authentication policies, session timeouts, verification requirements, and account protection thresholds.</p>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {/* Verification Toggles */}
                    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
                      <h4 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Verification Rules</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <Toggle value={form.requireEmailVerification} onChange={v => setForm(p => ({ ...p, requireEmailVerification: v }))} label="Require Email Verification" />
                        <Toggle value={form.requireMobileVerification} onChange={v => setForm(p => ({ ...p, requireMobileVerification: v }))} label="Require Mobile Verification" />
                      </div>
                    </div>

                    {/* Expiries & Timeouts */}
                    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
                      <h4 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Timeouts & Expiries</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                        <Field label="OTP Expiry Time (Minutes)">
                          <input style={inputStyle} {...n("otpExpiryMinutes")} min={1} max={60} placeholder="10" />
                        </Field>
                        <Field label="Invitation Link Expiry (Days)">
                          <input style={inputStyle} {...n("inviteExpiryDays")} min={1} max={30} placeholder="7" />
                        </Field>
                        <Field label="Session Timeout (Minutes)">
                          <input style={inputStyle} {...n("sessionTimeoutMinutes")} min={15} max={10080} placeholder="480" />
                          <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>= {Math.round(Number(form.sessionTimeoutMinutes || 480) / 60)} hours</span>
                        </Field>
                      </div>
                    </div>

                    {/* Lockout & Passwords */}
                    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
                      <h4 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Account Protection & Passwords</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                        <Field label="Maximum Failed Login Attempts">
                          <input style={inputStyle} {...n("maxLoginAttempts")} min={3} max={20} placeholder="5" />
                        </Field>
                        <Field label="Account Lock Duration (Minutes)">
                          <input style={inputStyle} {...n("lockDurationMinutes")} min={5} max={1440} placeholder="15" />
                        </Field>
                        <Field label="Password Minimum Length">
                          <input style={inputStyle} {...n("passwordLength")} min={6} max={32} placeholder="8" />
                        </Field>
                      </div>
                      <div style={{ marginTop: 14 }}>
                        <Toggle value={form.enforce2FA} onChange={v => setForm(p => ({ ...p, enforce2FA: v }))} label="Enforce Two-Factor Authentication (2FA) for Admins" />
                      </div>
                    </div>
                  </div>
                  <TabSaveButton tabName="security" />
                </div>
              )}

              {/* Section 9: Maintenance & System Status */}
              {activeTab === "maintenance" && (
                <div>
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Maintenance & System Status</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Monitor live platform health, schedule maintenance windows, and manage system backups.</p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {/* Platform Status Card */}
                    <div style={{ padding: 20, background: form.maintenanceMode ? "#fef2f2" : "#ecfdf5", border: `1px solid ${form.maintenanceMode ? "#fecaca" : "#a7f3d0"}`, borderRadius: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 12, height: 12, borderRadius: "50%", background: form.maintenanceMode ? "#ef4444" : "#10b981", boxShadow: `0 0 0 4px ${form.maintenanceMode ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}` }} />
                        <span style={{ fontSize: 16, fontWeight: 800, color: form.maintenanceMode ? "#991b1b" : "#065f46" }}>
                          Platform Status: {form.maintenanceMode ? "Maintenance Mode Active" : "System Operational"}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: form.maintenanceMode ? "#7f1d1d" : "#047857" }}>
                        {form.maintenanceMode 
                          ? "Salon users are temporarily locked out from logging in. Only Super Admins have platform access." 
                          : "All platform services, APIs, salons, POS, and customer portals are running normally."}
                      </p>
                    </div>

                    {/* Maintenance Controls */}
                    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
                      <div style={{ marginBottom: 14 }}>
                        <Toggle 
                          value={form.maintenanceMode} 
                          onChange={v => {
                            if (v) {
                              const confirmEnable = window.confirm("Warning: Salon users will temporarily be unable to use the platform. Are you sure you want to enable Maintenance Mode?");
                              if (!confirmEnable) return;
                            }
                            setForm(p => ({ ...p, maintenanceMode: v }));
                          }} 
                          label="Enable Maintenance Mode" 
                        />
                      </div>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <Field label="Maintenance Message" full>
                          <textarea rows={3} style={{ ...inputStyle, resize: "vertical" }} {...f("maintenanceMessage")} placeholder="We are performing scheduled maintenance to upgrade system infrastructure. SalonNest will be back online shortly." />
                        </Field>
                        <Field label="Expected End Time (Optional)" full>
                          <input style={inputStyle} type="text" {...f("maintenanceEndTime")} placeholder="e.g. 2026-08-18 04:00 AM IST" />
                        </Field>
                      </div>
                    </div>

                    {/* System Backup */}
                    <div style={{ background: "#f8fafc", padding: 18, borderRadius: 12, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>System Data & Configuration Export</h4>
                        <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Export platform configuration settings, policies, templates, and system metadata as JSON dump.</p>
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
                        style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#ffffff", color: "#1e293b", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
                      >
                        Export System Backup
                      </button>
                    </div>

                    {/* Audit Logs */}
                    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
                      <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Recent Audit Logs</h4>
                      {auditLoading ? (
                        <p style={{ fontSize: 13, color: "#94a3b8" }}>Loading audit logs...</p>
                      ) : auditLogs.length === 0 ? (
                        <p style={{ fontSize: 13, color: "#94a3b8" }}>No audit logs yet.</p>
                      ) : (
                        <div style={{ maxHeight: 300, overflowY: "auto" }}>
                          {auditLogs.map((log, i) => (
                            <div key={log.id || i} style={{ padding: "8px 0", borderBottom: i < auditLogs.length - 1 ? "1px solid #f1f5f9" : "none", fontSize: 13 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontWeight: 600, color: "#1e293b" }}>{log.action}</span>
                                <span style={{ fontSize: 11, color: "#94a3b8" }}>{log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}</span>
                              </div>
                              {log.summary && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>{log.summary}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <TabSaveButton tabName="maintenance" />
                </div>
              )}
            </div>

            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 20, marginTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Individual tab saves only update that section. "Save Settings" saves everything.</span>
              <button type="submit" disabled={saving} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 28px", background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)", color: "white", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, boxShadow: "0 4px 14px rgba(79, 70, 229, 0.2)" }}>
                <Save size={14} />
                {saving ? "Saving..." : "Save All Settings"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
