import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Trash2, Edit2, Plus, CheckCircle2, XCircle, Users, AlertTriangle, Star, Search, Layers, ShieldCheck } from "lucide-react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import { useAlert } from "../../context/AlertContext";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";

const FEATURE_CATEGORIES = [
  {
    label: "Core",
    flags: ["pos", "appointments", "crm", "inventory"]
  },
  {
    label: "Sales & Marketing",
    flags: ["campaigns", "loyalty", "couponsGiftCards", "enquiries"]
  },
  {
    label: "Online Business",
    flags: ["ecommerce", "digitalCatalog", "onlineOrders", "customerPortal"]
  },
  {
    label: "Staff",
    flags: ["attendance", "leaves", "payroll", "incentives"]
  },
  {
    label: "Customer Engagement",
    flags: ["whatsapp", "notifications", "feedback", "messageTemplates"]
  },
  {
    label: "Business",
    flags: ["expenses", "memberships", "packages"]
  },
  {
    label: "Analytics",
    flags: ["reports", "advancedReports", "auditLogs", "catalogAnalytics"]
  }
];

const ALL_FLAGS = FEATURE_CATEGORIES.flatMap(c => c.flags);
const FLAG_LABELS = {
  pos: "POS",
  appointments: "Appointments",
  crm: "CRM",
  inventory: "Inventory",
  campaigns: "Campaigns",
  loyalty: "Loyalty",
  couponsGiftCards: "Coupons / Gift Cards",
  enquiries: "Enquiries",
  ecommerce: "Ecommerce",
  digitalCatalog: "Digital Catalog",
  onlineOrders: "Online Booking",
  customerPortal: "Customer Portal",
  attendance: "Attendance",
  leaves: "Leaves",
  payroll: "Payroll",
  incentives: "Incentives",
  whatsapp: "WhatsApp",
  notifications: "Notifications",
  feedback: "Feedback",
  messageTemplates: "Message Templates",
  expenses: "Expenses",
  memberships: "Memberships",
  packages: "Packages",
  reports: "Reports",
  advancedReports: "Advanced Reports",
  auditLogs: "Audit Logs",
  catalogAnalytics: "Catalog Analytics"
};

const defaultFeatureFlags = {};
ALL_FLAGS.forEach(f => { defaultFeatureFlags[f] = true; });

const emptyForm = {
  name: "", description: "", monthlyPrice: "", yearlyPrice: "", trialDays: 14,
  branchLimit: 1, userLimit: 5, customerLimit: 500, invoiceLimit: 1000, storageLimit: 500,
  isCustom: false, isPopular: false, isActive: true, featureFlags: { ...defaultFeatureFlags }
};

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [featureSearch, setFeatureSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const { showConfirm } = useAlert();

  const [defaultTrialDays, setDefaultTrialDays] = useState(14);

  const load = async () => {
    setLoading(true);
    try {
      const [resPlans, resSettings] = await Promise.all([
        api.get("/super-admin/plans"),
        api.get("/super-admin/settings").catch(() => ({ data: {} }))
      ]);
      setPlans(resPlans.data);
      if (resSettings.data && resSettings.data.trialDays !== undefined) {
        setDefaultTrialDays(Number(resSettings.data.trialDays));
      }
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not load plans"), success: "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { 
    setEditingId(""); 
    setForm({ ...emptyForm, trialDays: defaultTrialDays }); 
    setFeatureSearch(""); 
    setIsModalOpen(true); 
  };
  const openEdit = (p) => {
    setEditingId(p.id);
    const existingFlags = p.featureFlags || p.features || {};
    const exactFlags = {};
    ALL_FLAGS.forEach(f => {
      exactFlags[f] = existingFlags[f] === true;
    });
    setForm({
      name: p.name,
      description: p.description || "",
      monthlyPrice: p.monthlyPrice !== undefined && p.monthlyPrice !== null ? p.monthlyPrice : "",
      yearlyPrice: p.yearlyPrice !== undefined && p.yearlyPrice !== null ? p.yearlyPrice : "",
      trialDays: p.trialDays !== undefined && p.trialDays !== null ? p.trialDays : "",
      branchLimit: p.branchLimit !== undefined && p.branchLimit !== null ? p.branchLimit : "",
      userLimit: p.userLimit !== undefined && p.userLimit !== null ? p.userLimit : "",
      customerLimit: p.customerLimit !== undefined && p.customerLimit !== null ? p.customerLimit : "",
      invoiceLimit: p.invoiceLimit !== undefined && p.invoiceLimit !== null ? p.invoiceLimit : "",
      storageLimit: p.storageLimit !== undefined && p.storageLimit !== null ? p.storageLimit : "",
      isCustom: Boolean(p.isCustom),
      isPopular: Boolean(p.isPopular),
      isActive: p.isActive !== false,
      featureFlags: exactFlags
    });
    setFeatureSearch("");
    setIsModalOpen(true);
  };

  const toggleFeature = (key) => {
    setForm(prev => ({ ...prev, featureFlags: { ...prev.featureFlags, [key]: !prev.featureFlags[key] } }));
  };

  const toggleCategory = (flags, enable) => {
    setForm(prev => {
      const next = { ...prev.featureFlags };
      flags.forEach(f => { next[f] = enable; });
      return { ...prev, featureFlags: next };
    });
  };

  const [filterTab, setFilterTab] = useState("all");
  const [archiveModalData, setArchiveModalData] = useState(null);
  const [editWarningData, setEditWarningData] = useState(null);

  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      if (filterTab === "standard") return !p.isCustom && !p.isArchived;
      if (filterTab === "custom") return p.isCustom && !p.isArchived;
      if (filterTab === "archived") return p.isArchived;
      return !p.isArchived;
    });
  }, [plans, filterTab]);

  const handleArchive = async (plan) => {
    try {
      if (plan.isArchived) {
        await api.post(`/super-admin/plans/${plan.id}/unarchive`);
        setStatus({ error: "", success: `Plan "${plan.name}" restored to Active.` });
      } else {
        await api.post(`/super-admin/plans/${plan.id}/archive`);
        setStatus({ error: "", success: `Plan "${plan.name}" archived successfully.` });
      }
      setArchiveModalData(null);
      await load();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Action failed"), success: "" });
      setArchiveModalData(null);
    }
  };

  const handleConfirmEditWithScope = async (syncActiveSalons) => {
    if (!editWarningData) return;
    setSaving(true);
    try {
      await api.patch(`/super-admin/plans/${editingId}`, {
        ...form,
        force: true,
        syncActiveSalons
      });
      setStatus({ error: "", success: `Plan updated successfully (${syncActiveSalons ? "Applied to all existing active salons" : "Applied to future subscriptions only"}).` });
      setEditWarningData(null);
      setIsModalOpen(false);
      await load();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not update plan"), success: "" });
    } finally {
      setSaving(false);
    }
  };

  const pricingWarning = useMemo(() => {
    const m = Number(form.monthlyPrice || 0);
    const y = Number(form.yearlyPrice || 0);
    if (m > 0 && y > 0 && y < m) {
      return `⚠️ Warning: Yearly Price (₹${y.toLocaleString()}) is lower than a single Monthly Price (₹${m.toLocaleString()}).`;
    }
    return null;
  }, [form.monthlyPrice, form.yearlyPrice]);

  const savePlan = async (e) => {
    e.preventDefault();
    const trimmedName = form.name.trim();
    if (!trimmedName) return setStatus({ error: "Plan name is required.", success: "" });

    const mPrice = form.monthlyPrice === "" ? 0 : Number(form.monthlyPrice);
    const yPrice = form.yearlyPrice === "" ? 0 : Number(form.yearlyPrice);
    const tDays = form.trialDays === "" ? 0 : Number(form.trialDays);
    const bLimit = form.branchLimit === "" ? 1 : Number(form.branchLimit);
    const uLimit = form.userLimit === "" ? 5 : Number(form.userLimit);
    const cLimit = form.customerLimit === "" ? 500 : Number(form.customerLimit);
    const iLimit = form.invoiceLimit === "" ? 1000 : Number(form.invoiceLimit);
    const sLimit = form.storageLimit === "" ? 500 : Number(form.storageLimit);

    if (mPrice < 0 || yPrice < 0) {
      return setStatus({ error: "Pricing cannot be negative.", success: "" });
    }
    if (tDays < 0 || bLimit < 0 || uLimit < 0 || cLimit < 0 || iLimit < 0 || sLimit < 0) {
      return setStatus({ error: "Limits and trial days cannot be negative.", success: "" });
    }

    const payload = {
      ...form,
      monthlyPrice: mPrice,
      yearlyPrice: yPrice,
      trialDays: tDays,
      branchLimit: bLimit,
      userLimit: uLimit,
      customerLimit: cLimit,
      invoiceLimit: iLimit,
      storageLimit: sLimit
    };

    // Client-side duplicate name check against active plans
    const isDuplicate = plans.some(p => p.id !== editingId && !p.isArchived && p.name.trim().toLowerCase() === trimmedName.toLowerCase());
    if (isDuplicate) {
      return setStatus({ error: `An active plan named "${trimmedName}" already exists. Please choose a unique name.`, success: "" });
    }

    setSaving(true);
    setStatus({ error: "", success: "" });
    try {
      if (editingId) {
        await api.patch(`/super-admin/plans/${editingId}`, payload);
        setStatus({ error: "", success: "Plan updated." });
        setIsModalOpen(false);
        await load();
      } else {
        await api.post("/super-admin/plans", payload);
        setStatus({ error: "", success: "Plan created." });
        setIsModalOpen(false);
        await load();
      }
    } catch (err) {
      const msg = formatApiError(err, "Could not save plan");
      if (err?.response?.status === 409 && err?.response?.data?.requiresConfirmation && editingId) {
        setEditWarningData({
          message: err.response.data.message,
          activeSubscriptions: err.response.data.activeSubscriptions
        });
      } else {
        setStatus({ error: msg, success: "" });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-shell"><PageLoader /></div>;

  return (
    <div className="page-shell super-admin-page" style={{ padding: "20px 16px", maxWidth: "1200px", margin: "0 auto" }}>
      <style>{`
        .plans-top-links {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .plans-filter-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 12px;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          white-space: nowrap;
        }
        .plans-filter-tabs button {
          flex-shrink: 0;
          white-space: nowrap;
        }
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }
        .plans-form-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px 20px;
        }
        .plans-usage-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }
        @media (max-width: 768px) {
          .plans-top-links {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
          .plans-top-links a {
            justify-content: center !important;
            text-align: center !important;
            padding: 10px 8px !important;
            font-size: 0.78rem !important;
          }
          .plans-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .plans-form-2col {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .plans-usage-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .modal-content-card {
            width: 95% !important;
            max-height: 92vh !important;
            margin: 0 auto !important;
            padding: 16px 14px !important;
          }
        }
      `}</style>

      {/* Subscriptions Module Sub-Header Navigation */}
      <div className="plans-top-links">
        <Link
          to="/super-admin/plans"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 18px",
            borderRadius: 10,
            background: "#4f46e5",
            color: "white",
            fontWeight: 700,
            fontSize: "0.85rem",
            textDecoration: "none",
            boxShadow: "0 2px 6px rgba(79, 70, 229, 0.25)"
          }}
        >
          <Layers size={16} /> Plans (Define Packages)
        </Link>
        <Link
          to="/super-admin/subscriptions"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 18px",
            borderRadius: 10,
            background: "white",
            color: "#64748b",
            fontWeight: 600,
            fontSize: "0.85rem",
            border: "1px solid #e2e8f0",
            textDecoration: "none"
          }}
        >
          <ShieldCheck size={16} /> Salon Subscriptions (Manage Purchased)
        </Link>
      </div>

      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ marginTop: 0 }}>Plans & Pricing Packages</h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.9rem" }}>Define what we sell with standard and custom packages, usage limits, and module access.</p>
          </div>
          <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", background: "linear-gradient(135deg, #4f46e5, #3b82f6)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            <Plus size={16} /> New Plan
          </button>
        </div>
      </div>

      {status.error && <div style={{ padding: 12, background: "#fef2f2", color: "#ef4444", borderRadius: 8, marginBottom: 16 }}>{status.error}</div>}
      {status.success && <div style={{ padding: 12, background: "#f0fdf4", color: "#16a34a", borderRadius: 8, marginBottom: 16 }}>{status.success}</div>}

      {/* Plan Filter Tabs: All, Standard, Custom, Archived */}
      <div className="plans-filter-tabs no-scrollbar">
        {[
          { id: "all", label: "All Active Plans", count: plans.filter(p => !p.isArchived).length },
          { id: "standard", label: "Standard Plans", count: plans.filter(p => !p.isCustom && !p.isArchived).length },
          { id: "custom", label: "Custom / Negotiated Plans", count: plans.filter(p => p.isCustom && !p.isArchived).length },
          { id: "archived", label: "Archived Plans", count: plans.filter(p => p.isArchived).length }
        ].map(t => {
          const active = filterTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setFilterTab(t.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: active ? "#4f46e5" : "#f1f5f9",
                color: active ? "white" : "#475569",
                fontWeight: active ? 700 : 600,
                fontSize: "0.82rem",
                cursor: "pointer",
                transition: "all 0.15s"
              }}
            >
              {t.label} ({t.count})
            </button>
          );
        })}
      </div>

      {filteredPlans.length === 0 ? (
        <EmptyState title="No Plans Found" message={`No ${filterTab} plans available.`} />
      ) : (
        <div className="plans-grid">
          {filteredPlans.map(plan => (
            <PlanCard key={plan.id} plan={plan} onEdit={openEdit} onArchive={(p) => setArchiveModalData(p)} />
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 760, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-header">
              <h3>{editingId ? "Edit Plan Package" : "Create New Plan Package"}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={savePlan} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="plans-form-2col">
                <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Plan Name *</span>
                  <input placeholder="e.g. Starter, Professional, Enterprise" value={form.name} required onChange={e => setForm({ ...form, name: e.target.value })} />
                </label>
                <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Description</span>
                  <textarea rows={2} placeholder="Brief summary of who this plan is tailored for..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, resize: "vertical" }} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Monthly Price (INR) *</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="0"
                    value={form.monthlyPrice ?? ""}
                    required
                    onFocus={e => { if (e.target.value === "0" || e.target.value === "") e.target.select(); }}
                    onChange={e => setForm({ ...form, monthlyPrice: e.target.value })}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Yearly Price (INR) *</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="0"
                    value={form.yearlyPrice ?? ""}
                    required
                    onFocus={e => { if (e.target.value === "0" || e.target.value === "") e.target.select(); }}
                    onChange={e => setForm({ ...form, yearlyPrice: e.target.value })}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Trial Days</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.trialDays ?? ""}
                    onFocus={e => { if (e.target.value === "0" || e.target.value === "") e.target.select(); }}
                    onChange={e => setForm({ ...form, trialDays: e.target.value })}
                  />
                </label>
              </div>

              {pricingWarning && (
                <div style={{ padding: "8px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, color: "#92400e", fontSize: "0.82rem", fontWeight: 600 }}>
                  {pricingWarning}
                </div>
              )}

              <div>
                <h4 style={{ margin: "0 0 12px", fontSize: "0.95rem", color: "#0f172a", fontWeight: 700 }}>Usage Limits</h4>
                <div className="plans-usage-grid">
                  {[
                    { key: "branchLimit", label: "Branch Limit" },
                    { key: "userLimit", label: "Staff Limit" },
                    { key: "customerLimit", label: "Customer Limit" },
                    { key: "invoiceLimit", label: "Invoice Limit" },
                    { key: "storageLimit", label: "Storage Limit (MB)" }
                  ].map(l => (
                    <label key={l.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>{l.label}</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={form[l.key] ?? ""}
                        onFocus={e => { if (e.target.value === "0" || e.target.value === "") e.target.select(); }}
                        onChange={e => setForm({ ...form, [l.key]: e.target.value })}
                        style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#0f172a", fontWeight: 700 }}>Feature Access Control</h4>
                  <div style={{ position: "relative", width: 220 }}>
                    <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                    <input
                      type="text"
                      placeholder="Search features..."
                      value={featureSearch}
                      onChange={e => setFeatureSearch(e.target.value)}
                      style={{ width: "100%", padding: "6px 10px 6px 30px", fontSize: 12, borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>

                {FEATURE_CATEGORIES.map(cat => {
                  const filteredFlags = cat.flags.filter(f => {
                    if (!featureSearch.trim()) return true;
                    const label = FLAG_LABELS[f] || f;
                    return label.toLowerCase().includes(featureSearch.toLowerCase()) || f.toLowerCase().includes(featureSearch.toLowerCase());
                  });

                  if (filteredFlags.length === 0) return null;

                  const allEnabled = cat.flags.every(f => form.featureFlags[f]);
                  const someEnabled = cat.flags.some(f => form.featureFlags[f]);

                  return (
                    <div key={cat.label} style={{ marginBottom: 16, background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #f1f5f9" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.04em" }}>{cat.label}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button type="button" onClick={() => toggleCategory(cat.flags, true)} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "1px solid #cbd5e1", background: allEnabled ? "#ecfdf5" : "#fff", cursor: "pointer", color: "#059669", fontWeight: 600 }}>Select All</button>
                          <button type="button" onClick={() => toggleCategory(cat.flags, false)} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "1px solid #cbd5e1", background: !someEnabled ? "#fef2f2" : "#fff", cursor: "pointer", color: "#dc2626", fontWeight: 600 }}>Clear</button>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {filteredFlags.map(f => (
                          <button key={f} type="button" onClick={() => toggleFeature(f)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 6, border: `1px solid ${form.featureFlags[f] ? "#86efac" : "#fca5a5"}`, background: form.featureFlags[f] ? "#f0fdf4" : "#fef2f2", cursor: "pointer", fontSize: 12, fontWeight: 600, color: form.featureFlags[f] ? "#166534" : "#991b1b", transition: "all 0.15s" }}>
                            {form.featureFlags[f] ? <CheckCircle2 size={14} color="#16a34a" /> : <XCircle size={14} color="#dc2626" />}
                            {FLAG_LABELS[f] || f}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: 20, alignItems: "center", background: "#f8fafc", padding: "10px 14px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  <input type="checkbox" checked={form.isPopular} onChange={e => setForm({ ...form, isPopular: e.target.checked })} /> Most Popular
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  <input type="checkbox" checked={form.isCustom} onChange={e => setForm({ ...form, isCustom: e.target.checked })} /> Custom Plan
                </label>
              </div>

              <button type="submit" disabled={saving} style={{ width: "100%", padding: "12px 24px", background: "linear-gradient(135deg, #4f46e5, #3b82f6)", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Saving..." : editingId ? "Update Plan Package" : "Create Plan Package"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Warning Modal for Plans In-Use */}
      {editWarningData && (
        <div className="modal-overlay" onClick={() => setEditWarningData(null)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={20} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: "1.05rem" }}>Plan In-Use Protection Warning</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setEditWarningData(null)}>&times;</button>
            </div>
            <div style={{ padding: "12px 0 20px" }}>
              <p style={{ color: "#334155", fontSize: "0.9rem", lineHeight: 1.5, margin: "0 0 16px" }}>
                This plan is currently assigned to <strong>{editWarningData.activeSubscriptions} active salon(s)</strong>. Please choose how you want to apply these changes:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => handleConfirmEditWithScope(false)}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 10,
                    border: "2px solid #e0e7ff",
                    background: "#f5f3ff",
                    textAlign: "left",
                    cursor: "pointer"
                  }}
                >
                  <strong style={{ display: "block", color: "#4338ca", fontSize: "0.9rem" }}>Option 1: Future Subscriptions Only (Recommended)</strong>
                  <span style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: 2, display: "block" }}>
                    Keeps existing salons' current features and prices intact. Only newly assigned salons will receive the updated plan package.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleConfirmEditWithScope(true)}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 10,
                    border: "2px solid #fee2e2",
                    background: "#fff5f5",
                    textAlign: "left",
                    cursor: "pointer"
                  }}
                >
                  <strong style={{ display: "block", color: "#b91c1c", fontSize: "0.9rem" }}>Option 2: Update All Active Salons Immediately</strong>
                  <span style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: 2, display: "block" }}>
                    Synchronizes new feature flags and limits to all {editWarningData.activeSubscriptions} currently active salons immediately.
                  </span>
                </button>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
              <button type="button" onClick={() => setEditWarningData(null)} style={{ padding: "8px 16px", border: "1px solid #cbd5e1", borderRadius: 6, background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive / Unarchive Modal */}
      {archiveModalData && (
        <div className="modal-overlay" onClick={() => setArchiveModalData(null)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3>{archiveModalData.isArchived ? "Restore Plan" : "Archive Plan"}</h3>
              <button className="modal-close-btn" onClick={() => setArchiveModalData(null)}>&times;</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "10px 0" }}>
              <p style={{ color: "#475569", fontSize: "0.9rem", margin: 0, lineHeight: 1.5 }}>
                {archiveModalData.isArchived ? (
                  <>Are you sure you want to restore the plan <strong>"{archiveModalData.name}"</strong> to Active status? It will become available for new salon assignments.</>
                ) : (
                  <>
                    Are you sure you want to archive <strong>"{archiveModalData.name}"</strong>?
                    <br /><br />
                    • It will <strong>NOT</strong> be available for new salon assignments.<br />
                    • Existing subscriptions and billing history will remain <strong>100% intact</strong>.
                  </>
                )}
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                <button onClick={() => setArchiveModalData(null)} style={{ padding: "8px 16px", border: "1px solid #cbd5e1", borderRadius: 6, background: "#fff", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                <button
                  onClick={() => handleArchive(archiveModalData)}
                  style={{
                    padding: "8px 18px",
                    border: "none",
                    borderRadius: 6,
                    background: archiveModalData.isArchived ? "#10b981" : "#f59e0b",
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {archiveModalData.isArchived ? "Restore to Active" : "Archive Plan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlanCard({ plan, onEdit, onArchive }) {
  const flags = plan.featureFlags || plan.features || {};
  const enabledCount = ALL_FLAGS.filter(f => flags[f]).length;
  const activeCount = plan.activeSubscriptions || 0;
  const trialCount = plan.trialSubscriptions || 0;
  const isArchived = plan.isArchived;

  return (
    <div style={{ background: "white", borderRadius: 14, border: isArchived ? "1px dashed #cbd5e1" : (plan.isPopular ? "2px solid #4f46e5" : "1px solid #e2e8f0"), padding: 24, position: "relative", opacity: isArchived ? 0.75 : 1 }}>
      {plan.isPopular && !isArchived && (
        <div style={{ position: "absolute", top: -10, right: 16, background: "linear-gradient(135deg, #4f46e5, #3b82f6)", color: "white", padding: "3px 10px", borderRadius: 100, fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
          <Star size={10} fill="white" /> Most Popular
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: "1.15rem", color: "#0f172a" }}>{plan.name}</h3>
            {isArchived ? (
              <span style={{ fontSize: "0.7rem", background: "#f1f5f9", color: "#64748b", fontWeight: 700, padding: "2px 8px", borderRadius: 100 }}>Archived</span>
            ) : (
              <span style={{ fontSize: "0.7rem", background: "#ecfdf5", color: "#059669", fontWeight: 700, padding: "2px 8px", borderRadius: 100 }}>Active</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            {plan.isCustom ? (
              <span style={{ fontSize: "0.7rem", color: "#7c3aed", background: "#f5f3ff", fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>Custom Plan</span>
            ) : (
              <span style={{ fontSize: "0.7rem", color: "#0284c7", background: "#f0f9ff", fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>Standard Plan</span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onEdit(plan)} title="Edit Plan" style={{ padding: "6px", border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <Edit2 size={15} />
          </button>
          <button onClick={() => onArchive(plan)} title={isArchived ? "Restore to Active" : "Archive Plan"} style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: 8, background: isArchived ? "#ecfdf5" : "#fffbeb", cursor: "pointer", color: isArchived ? "#059669" : "#d97706", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700 }}>
            {isArchived ? "Restore" : "Archive"}
          </button>
        </div>
      </div>

      {plan.description && (
        <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0 0 12px", lineHeight: 1.4 }}>
          {plan.description}
        </p>
      )}

      <div style={{ display: "flex", gap: 16, marginBottom: 16, background: "#f8fafc", padding: "10px 12px", borderRadius: 8 }}>
        <div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a" }}>₹{Number(plan.monthlyPrice).toLocaleString()}</div>
          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>/month</div>
        </div>
        <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: 16 }}>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a" }}>₹{Number(plan.yearlyPrice).toLocaleString()}</div>
          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>/year</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 16, fontSize: "0.8rem" }}>
        {[
          { label: "Branches", val: plan.branchLimit },
          { label: "Staff", val: plan.userLimit },
          { label: "Customers", val: plan.customerLimit },
          { label: "Invoices", val: plan.invoiceLimit },
          { label: "Storage", val: plan.storageLimit ? `${plan.storageLimit} MB` : "Unlimited" }
        ].map(l => (
          <div key={l.label} style={{ color: "#64748b" }}>
            <span style={{ fontWeight: 700, color: "#334155" }}>{l.val === 9999 ? "∞" : l.val}</span> {l.label}
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12, marginBottom: 12 }}>
        <div style={{ fontSize: "0.75rem", color: "#334155", fontWeight: 700, marginBottom: 6 }}>
          ⚡ {enabledCount} of {ALL_FLAGS.length} Features Included
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {ALL_FLAGS.filter(f => flags[f]).slice(0, 6).map(f => (
            <span key={f} style={{ background: "#f0fdf4", color: "#16a34a", padding: "2px 6px", borderRadius: 4, fontSize: "0.65rem", fontWeight: 600 }}>{FLAG_LABELS[f] || f}</span>
          ))}
          {enabledCount > 6 && <span style={{ fontSize: "0.65rem", color: "#64748b", background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>+{enabledCount - 6} more</span>}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 10, fontSize: "0.78rem" }}>
        <div style={{ fontWeight: 700, color: activeCount > 0 ? "#10b981" : "#64748b" }}>
          🏢 {activeCount} Active Salon{activeCount !== 1 ? "s" : ""}
        </div>
        {trialCount > 0 && (
          <div style={{ fontWeight: 700, color: "#d97706" }}>
            ⏳ {trialCount} Trial Salon{trialCount !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
