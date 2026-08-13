import { useEffect, useState } from "react";
import { Archive, ArchiveRestore, Edit2, Plus, CheckCircle2, XCircle, Users, AlertTriangle, Star } from "lucide-react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import { useAlert } from "../../context/AlertContext";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";

const FEATURE_CATEGORIES = [
  {
    label: "Core",
    flags: ["pos", "appointments", "inventory", "crm", "reports", "advancedReports"]
  },
  {
    label: "Sales & Marketing",
    flags: ["campaigns", "campaignTemplates", "campaignAnalytics", "loyalty", "couponsGiftCards", "whatsapp", "messageTemplates", "enquiries"]
  },
  {
    label: "Online Business",
    flags: ["ecommerce", "digitalCatalog", "catalogAnalytics", "publicCatalog", "onlineOrders", "customerPortal"]
  },
  {
    label: "Staff",
    flags: ["attendance", "leaves", "payroll", "incentives", "memberships", "packages"]
  },
  {
    label: "System",
    flags: ["expenses", "feedback", "notifications", "auditLogs"]
  }
];

const ALL_FLAGS = FEATURE_CATEGORIES.flatMap(c => c.flags);
const FLAG_LABELS = {
  pos: "Point of Sale", appointments: "Appointments", inventory: "Inventory", crm: "CRM",
  reports: "Reports", advancedReports: "Advanced Reports", campaigns: "Campaigns",
  campaignTemplates: "Campaign Templates", campaignAnalytics: "Campaign Analytics",
  loyalty: "Loyalty Program", couponsGiftCards: "Coupons & Gift Cards", whatsapp: "WhatsApp",
  messageTemplates: "Message Templates", enquiries: "Enquiries", ecommerce: "E-Commerce",
  digitalCatalog: "Digital Catalog", catalogAnalytics: "Catalog Analytics",
  publicCatalog: "Public Catalog", onlineOrders: "Online Orders", customerPortal: "Customer Portal",
  attendance: "Attendance", leaves: "Leaves", payroll: "Payroll", incentives: "Incentives",
  memberships: "Memberships", packages: "Packages", expenses: "Expenses", feedback: "Feedback",
  notifications: "Notifications", auditLogs: "Audit Logs"
};

const defaultFeatureFlags = {};
ALL_FLAGS.forEach(f => { defaultFeatureFlags[f] = true; });

const emptyForm = {
  name: "", monthlyPrice: 0, yearlyPrice: 0, trialDays: 14,
  branchLimit: 1, userLimit: 5, customerLimit: 500, invoiceLimit: 1000, storageLimit: 0,
  isCustom: false, isPopular: false, featureFlags: { ...defaultFeatureFlags }
};

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [confirmArchive, setConfirmArchive] = useState(null);
  const { showConfirm } = useAlert();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/super-admin/plans");
      setPlans(res.data);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not load plans"), success: "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditingId(""); setForm(emptyForm); setIsModalOpen(true); };
  const openEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name, monthlyPrice: Number(p.monthlyPrice), yearlyPrice: Number(p.yearlyPrice),
      trialDays: p.trialDays, branchLimit: p.branchLimit, userLimit: p.userLimit,
      customerLimit: p.customerLimit, invoiceLimit: p.invoiceLimit, storageLimit: p.storageLimit || 0,
      isCustom: p.isCustom, isPopular: p.isPopular,
      featureFlags: { ...defaultFeatureFlags, ...(p.featureFlags || p.features || {}) }
    });
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

  const savePlan = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setStatus({ error: "Plan name is required", success: "" });
    setSaving(true);
    setStatus({ error: "", success: "" });
    try {
      if (editingId) {
        await api.patch(`/super-admin/plans/${editingId}`, form);
        setStatus({ error: "", success: "Plan updated." });
      } else {
        await api.post("/super-admin/plans", form);
        setStatus({ error: "", success: "Plan created." });
      }
      setIsModalOpen(false);
      await load();
    } catch (err) {
      const msg = formatApiError(err, "Could not save plan");
      if (err?.response?.status === 409 && err?.response?.data?.requiresConfirmation && editingId) {
        const confirmed = await showConfirm(`${err.response.data.message}\n\nProceed anyway?`);
        if (confirmed) {
          try {
            await api.patch(`/super-admin/plans/${editingId}`, { ...form, force: true });
            setStatus({ error: "", success: "Plan updated (active subscriptions affected)." });
            setIsModalOpen(false);
            await load();
          } catch (e2) { setStatus({ error: formatApiError(e2), success: "" }); }
        }
      } else {
        setStatus({ error: msg, success: "" });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (plan) => {
    try {
      await api.patch(`/super-admin/plans/${plan.id}/archive`);
      setStatus({ error: "", success: plan.isArchived ? `Plan "${plan.name}" restored.` : `Plan "${plan.name}" archived.` });
      setConfirmArchive(null);
      await load();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not archive plan"), success: "" });
    }
  };

  const activePlans = plans.filter(p => !p.isArchived);
  const archivedPlans = plans.filter(p => p.isArchived);

  if (loading) return <div className="page-shell"><PageLoader /></div>;

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ marginTop: 0 }}>Plans & Pricing</h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.9rem" }}>Define plans with usage limits and feature access. {activePlans.length} active, {archivedPlans.length} archived.</p>
          </div>
          <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", background: "linear-gradient(135deg, #4f46e5, #3b82f6)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            <Plus size={16} /> New Plan
          </button>
        </div>
      </div>

      {status.error && <div style={{ padding: 12, background: "#fef2f2", color: "#ef4444", borderRadius: 8, marginBottom: 16 }}>{status.error}</div>}
      {status.success && <div style={{ padding: 12, background: "#f0fdf4", color: "#16a34a", borderRadius: 8, marginBottom: 16 }}>{status.success}</div>}

      {activePlans.length === 0 && archivedPlans.length === 0 ? (
        <EmptyState title="No Plans" message="Create your first plan to get started." />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
            {activePlans.map(plan => (
              <PlanCard key={plan.id} plan={plan} onEdit={openEdit} onArchive={setConfirmArchive} />
            ))}
          </div>

          {archivedPlans.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <h3 style={{ color: "#94a3b8", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Archived Plans</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16, opacity: 0.6 }}>
                {archivedPlans.map(plan => (
                  <PlanCard key={plan.id} plan={plan} onEdit={openEdit} onArchive={setConfirmArchive} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 720, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-header">
              <h3>{editingId ? "Edit Plan" : "Create New Plan"}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={savePlan} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
                <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Plan Name *</span>
                  <input placeholder="e.g. Starter, Professional" value={form.name} required onChange={e => setForm({ ...form, name: e.target.value })} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Monthly Price (INR) *</span>
                  <input type="number" min="0" step="100" value={form.monthlyPrice} required onChange={e => setForm({ ...form, monthlyPrice: Number(e.target.value) })} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Yearly Price (INR) *</span>
                  <input type="number" min="0" step="100" value={form.yearlyPrice} required onChange={e => setForm({ ...form, yearlyPrice: Number(e.target.value) })} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Trial Days</span>
                  <input type="number" min="0" value={form.trialDays} onChange={e => setForm({ ...form, trialDays: Number(e.target.value) })} />
                </label>
              </div>

              <div>
                <h4 style={{ margin: "0 0 12px", fontSize: "0.9rem", color: "#0f172a" }}>Usage Limits</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                  {[
                    { key: "branchLimit", label: "Branches" },
                    { key: "userLimit", label: "Staff Users" },
                    { key: "customerLimit", label: "Customers" },
                    { key: "invoiceLimit", label: "Invoices/mo" },
                    { key: "storageLimit", label: "Storage (MB)" }
                  ].map(l => (
                    <label key={l.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>{l.label}</span>
                      <input type="number" min="0" value={form[l.key]} onChange={e => setForm({ ...form, [l.key]: Number(e.target.value) })} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }} />
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ margin: "0 0 12px", fontSize: "0.9rem", color: "#0f172a" }}>Feature Access</h4>
                {FEATURE_CATEGORIES.map(cat => {
                  const allEnabled = cat.flags.every(f => form.featureFlags[f]);
                  const someEnabled = cat.flags.some(f => form.featureFlags[f]);
                  return (
                    <div key={cat.label} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>{cat.label}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button type="button" onClick={() => toggleCategory(cat.flags, true)} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "1px solid #e2e8f0", background: allEnabled ? "#f0fdf4" : "#fff", cursor: "pointer", color: "#16a34a" }}>All</button>
                          <button type="button" onClick={() => toggleCategory(cat.flags, false)} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "1px solid #e2e8f0", background: !someEnabled ? "#fef2f2" : "#fff", cursor: "pointer", color: "#ef4444" }}>None</button>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {cat.flags.map(f => (
                          <button key={f} type="button" onClick={() => toggleFeature(f)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, border: `1px solid ${form.featureFlags[f] ? "#bbf7d0" : "#fecaca"}`, background: form.featureFlags[f] ? "#f0fdf4" : "#fef2f2", cursor: "pointer", fontSize: 12, fontWeight: 500, color: form.featureFlags[f] ? "#166534" : "#991b1b" }}>
                            {form.featureFlags[f] ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                            {FLAG_LABELS[f] || f}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
                  <input type="checkbox" checked={form.isPopular} onChange={e => setForm({ ...form, isPopular: e.target.checked })} /> Popular
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
                  <input type="checkbox" checked={form.isCustom} onChange={e => setForm({ ...form, isCustom: e.target.checked })} /> Custom Plan
                </label>
              </div>

              <button type="submit" disabled={saving} style={{ width: "100%", padding: "12px 24px", background: "linear-gradient(135deg, #4f46e5, #3b82f6)", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Saving..." : editingId ? "Update Plan" : "Create Plan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {confirmArchive && (
        <div className="modal-overlay" onClick={() => setConfirmArchive(null)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>{confirmArchive.isArchived ? "Restore Plan" : "Archive Plan"}</h3>
              <button className="modal-close-btn" onClick={() => setConfirmArchive(null)}>&times;</button>
            </div>
            <p style={{ color: "#475569", fontSize: "0.9rem", marginBottom: 16 }}>
              {confirmArchive.isArchived
                ? `Restore "${confirmArchive.name}"? It will become available for new subscriptions.`
                : `Archive "${confirmArchive.name}"? It won't be available for new subscriptions.`}
            </p>
            {confirmArchive.activeSubscriptions > 0 && !confirmArchive.isArchived && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 10, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, marginBottom: 16, fontSize: 13, color: "#92400e" }}>
                <AlertTriangle size={16} /> This plan has {confirmArchive.activeSubscriptions} active subscription(s).
              </div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmArchive(null)} style={{ padding: "8px 16px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
              <button onClick={() => handleArchive(confirmArchive)} style={{ padding: "8px 16px", border: "none", borderRadius: 6, background: confirmArchive.isArchived ? "#10b981" : "#ef4444", color: "white", fontWeight: 600, cursor: "pointer" }}>
                {confirmArchive.isArchived ? "Restore" : "Archive"}
              </button>
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

  return (
    <div style={{ background: "white", borderRadius: 14, border: plan.isPopular ? "2px solid #4f46e5" : "1px solid #e2e8f0", padding: 24, position: "relative" }}>
      {plan.isPopular && (
        <div style={{ position: "absolute", top: -10, right: 16, background: "linear-gradient(135deg, #4f46e5, #3b82f6)", color: "white", padding: "3px 10px", borderRadius: 100, fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
          <Star size={10} fill="white" /> Popular
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a" }}>{plan.name}</h3>
          {plan.isCustom && <span style={{ fontSize: "0.7rem", color: "#8b5cf6", fontWeight: 600 }}>Custom</span>}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {!plan.isArchived && <button onClick={() => onEdit(plan)} style={{ padding: 6, border: "1px solid #e2e8f0", borderRadius: 6, background: "#f8fafc", cursor: "pointer" }}><Edit2 size={14} /></button>}
          <button onClick={() => onArchive(plan)} style={{ padding: 6, border: "1px solid #e2e8f0", borderRadius: 6, background: "#f8fafc", cursor: "pointer" }}>
            {plan.isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>₹{Number(plan.monthlyPrice).toLocaleString()}</div>
          <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>per month</div>
        </div>
        <div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>₹{Number(plan.yearlyPrice).toLocaleString()}</div>
          <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>per year</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Branches", val: plan.branchLimit },
          { label: "Staff", val: plan.userLimit },
          { label: "Customers", val: plan.customerLimit },
          { label: "Invoices", val: plan.invoiceLimit }
        ].map(l => (
          <div key={l.label} style={{ fontSize: "0.8rem", color: "#64748b" }}>
            <span style={{ fontWeight: 600, color: "#334155" }}>{l.val === 9999 ? "∞" : (l.val ?? 0).toLocaleString()}</span> {l.label}
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12, marginBottom: 12 }}>
        <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: 6 }}>{enabledCount}/{ALL_FLAGS.length} features enabled</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {ALL_FLAGS.filter(f => flags[f]).slice(0, 8).map(f => (
            <span key={f} style={{ background: "#f0fdf4", color: "#16a34a", padding: "2px 6px", borderRadius: 4, fontSize: "0.65rem", fontWeight: 600 }}>{FLAG_LABELS[f] || f}</span>
          ))}
          {enabledCount > 8 && <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>+{enabledCount - 8} more</span>}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: activeCount > 0 ? "#10b981" : "#94a3b8" }}>
        <Users size={13} /> {activeCount} active subscription{activeCount !== 1 ? "s" : ""}
      </div>

      {plan.trialDays > 0 && (
        <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 6 }}>Includes {plan.trialDays}-day trial</div>
      )}
    </div>
  );
}
