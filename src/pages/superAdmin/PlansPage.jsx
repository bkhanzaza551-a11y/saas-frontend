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
  onlineOrders: "Online Orders",
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
  name: "", description: "", monthlyPrice: 0, yearlyPrice: 0, trialDays: 14,
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

  const openCreate = () => { setEditingId(""); setForm(emptyForm); setFeatureSearch(""); setIsModalOpen(true); };
  const openEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name, description: p.description || "", monthlyPrice: Number(p.monthlyPrice), yearlyPrice: Number(p.yearlyPrice),
      trialDays: p.trialDays, branchLimit: p.branchLimit, userLimit: p.userLimit,
      customerLimit: p.customerLimit, invoiceLimit: p.invoiceLimit, storageLimit: p.storageLimit || 500,
      isCustom: p.isCustom, isPopular: p.isPopular, isActive: p.isActive !== false,
      featureFlags: { ...defaultFeatureFlags, ...(p.featureFlags || p.features || {}) }
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

  const handleDelete = async (plan) => {
    try {
      await api.delete(`/super-admin/plans/${plan.id}`);
      setStatus({ error: "", success: `Plan "${plan.name}" deleted.` });
      setConfirmDelete(null);
      await load();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not delete plan"), success: "" });
      setConfirmDelete(null);
    }
  };

  const activePlans = plans;

  if (loading) return <div className="page-shell"><PageLoader /></div>;

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Subscriptions Module Sub-Header Navigation */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
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
        <div className="item-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ marginTop: 0 }}>Plans & Pricing Packages</h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.9rem" }}>Define what we sell with standard packages, usage limits, and module access. {activePlans.length} active plan(s).</p>
          </div>
          <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", background: "linear-gradient(135deg, #4f46e5, #3b82f6)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            <Plus size={16} /> + New Plan
          </button>
        </div>
      </div>

      {status.error && <div style={{ padding: 12, background: "#fef2f2", color: "#ef4444", borderRadius: 8, marginBottom: 16 }}>{status.error}</div>}
      {status.success && <div style={{ padding: 12, background: "#f0fdf4", color: "#16a34a", borderRadius: 8, marginBottom: 16 }}>{status.success}</div>}

      {activePlans.length === 0 ? (
        <EmptyState title="No Plans" message="Create your first plan to get started." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
          {activePlans.map(plan => (
            <PlanCard key={plan.id} plan={plan} onEdit={openEdit} onDelete={setConfirmDelete} />
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
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
                <h4 style={{ margin: "0 0 12px", fontSize: "0.95rem", color: "#0f172a", fontWeight: 700 }}>Usage Limits</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                  {[
                    { key: "branchLimit", label: "Branch Limit" },
                    { key: "userLimit", label: "Staff Limit" },
                    { key: "customerLimit", label: "Customer Limit" },
                    { key: "invoiceLimit", label: "Invoice Limit" },
                    { key: "storageLimit", label: "Storage Limit (MB)" }
                  ].map(l => (
                    <label key={l.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>{l.label}</span>
                      <input type="number" min="0" value={form[l.key]} onChange={e => setForm({ ...form, [l.key]: Number(e.target.value) })} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }} />
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

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>Delete Plan</h3>
              <button className="modal-close-btn" onClick={() => setConfirmDelete(null)}>&times;</button>
            </div>
            {confirmDelete.activeSubscriptions > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: 12, background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 13, color: "#991b1b" }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong>Cannot Delete Plan:</strong> This plan has <strong>{confirmDelete.activeSubscriptions}</strong> active subscription(s) in salons. You must migrate those salons to another plan first.
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                  <button onClick={() => setConfirmDelete(null)} style={{ padding: "8px 16px", border: "1px solid #cbd5e1", borderRadius: 6, background: "#fff", cursor: "pointer", fontWeight: 600 }}>Close</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ color: "#475569", fontSize: "0.9rem", margin: 0 }}>
                  Are you sure you want to delete the plan <strong>"{confirmDelete.name}"</strong>? This action cannot be undone.
                </p>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                  <button onClick={() => setConfirmDelete(null)} style={{ padding: "8px 16px", border: "1px solid #cbd5e1", borderRadius: 6, background: "#fff", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                  <button onClick={() => handleDelete(confirmDelete)} style={{ padding: "8px 16px", border: "none", borderRadius: 6, background: "#ef4444", color: "white", fontWeight: 600, cursor: "pointer" }}>
                    Delete Plan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PlanCard({ plan, onEdit, onDelete }) {
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
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onEdit(plan)} title="Edit Plan" style={{ padding: "6px", border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <Edit2 size={15} />
          </button>
          <button onClick={() => onDelete(plan)} title="Delete Plan" style={{ padding: "6px", border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <Trash2 size={15} />
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
