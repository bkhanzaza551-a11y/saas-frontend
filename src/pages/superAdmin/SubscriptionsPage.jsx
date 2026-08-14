import { useEffect, useState } from "react";
import { Edit2, Bell, Plus, RefreshCw, Eye, Calendar, Clock, ArrowRightLeft, History, CheckCircle2, XCircle, Search, Filter } from "lucide-react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import { useAlert } from "../../context/AlertContext";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";

const DB_STATUSES = ["TRIAL", "ACTIVE", "EXPIRED", "SUSPENDED"];
const STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Trial", value: "TRIAL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Expiring Soon", value: "EXPIRING_SOON", computed: true },
  { label: "Expired", value: "EXPIRED" },
  { label: "Grace Access", value: "GRACE_ACCESS", computed: true },
  { label: "Restricted", value: "RESTRICTED", computed: true },
  { label: "Retention", value: "RETENTION", computed: true },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Archived", value: "ARCHIVED", computed: true }
];

const COMPUTED_STATUS_META = {
  ACTIVE: { color: "#10b981", bg: "#ecfdf5", label: "Active" },
  TRIAL: { color: "#d97706", bg: "#fffbeb", label: "Trial" },
  EXPIRING_SOON: { color: "#f59e0b", bg: "#fffbeb", label: "Expiring Soon" },
  EXPIRED: { color: "#ef4444", bg: "#fef2f2", label: "Expired" },
  GRACE_ACCESS: { color: "#f97316", bg: "#fff7ed", label: "Grace Access" },
  RESTRICTED: { color: "#dc2626", bg: "#fef2f2", label: "Restricted" },
  RETENTION: { color: "#6366f1", bg: "#eef2ff", label: "Retention" },
  ARCHIVED: { color: "#64748b", bg: "#f1f5f9", label: "Archived" },
  SUSPENDED: { color: "#ef4444", bg: "#fef2f2", label: "Suspended" }
};

const PAYMENT_OPTIONS = [
  { label: "All Payment", value: "" },
  { label: "Paid", value: "COMPLETED" },
  { label: "Pending", value: "PENDING" },
  { label: "Failed", value: "FAILED" }
];

const emptyForm = { salonId: "", planId: "", status: "ACTIVE", paymentStatus: "PENDING", manualDiscount: 0, notes: "", startsAt: "", endsAt: "" };

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState([]);
  const [plans, setPlans] = useState([]);
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [busyId, setBusyId] = useState("");

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [detailSub, setDetailSub] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [isPlanChangeOpen, setIsPlanChangeOpen] = useState(false);
  const [planChangeSub, setPlanChangeSub] = useState(null);
  const [planChangeForm, setPlanChangeForm] = useState({ planId: "", effectiveDate: "", reason: "" });

  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [renewSub, setRenewSub] = useState(null);
  const [renewForm, setRenewForm] = useState({ months: 1, paymentMethod: "OTHER", amount: 0, notes: "" });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySub, setHistorySub] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const isComputedFilter = statusFilter && !DB_STATUSES.includes(statusFilter);
      const serverParams = { q };
      if (statusFilter && !isComputedFilter) serverParams.status = statusFilter;
      if (paymentFilter) serverParams.paymentStatus = paymentFilter;
      const [subRes, planRes, salonRes] = await Promise.all([
        api.get("/super-admin/subscriptions", { params: serverParams }),
        api.get("/super-admin/plans"),
        api.get("/super-admin/salons")
      ]);
      setSubs(subRes.data);
      setPlans(planRes.data);
      setSalons(salonRes?.data || []);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not load subscriptions"), success: "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (id) => {
    setDetailLoading(true);
    setDetailSub(null);
    try {
      const res = await api.get(`/super-admin/subscriptions/${id}`);
      setDetailSub(res.data);
    } catch (err) {
      setStatus({ error: formatApiError(err), success: "" });
    } finally {
      setDetailLoading(false);
    }
  };

  const openEditModal = (row) => {
    setEditingRow(row);
    setForm({
      salonId: row.salonId, planId: row.planId, status: row.status,
      paymentStatus: row.paymentStatus || "PENDING", manualDiscount: Number(row.manualDiscount || 0),
      notes: row.notes || "", startsAt: row.startsAt?.slice(0, 10) || "",
      endsAt: row.endsAt?.slice(0, 10) || ""
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingRow) return;
    setBusyId("edit");
    try {
      await api.patch(`/super-admin/subscriptions/${editingRow.id}`, {
        planId: form.planId, status: form.status, paymentStatus: form.paymentStatus,
        endsAt: form.endsAt, manualDiscount: Number(form.manualDiscount || 0), notes: form.notes
      });
      setIsEditOpen(false);
      setEditingRow(null);
      setStatus({ error: "", success: "Subscription updated." });
      await load();
    } catch (err) {
      setStatus({ error: formatApiError(err), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setBusyId("create");
    try {
      await api.post("/super-admin/subscriptions", form);
      setIsCreateOpen(false);
      setForm(emptyForm);
      setStatus({ error: "", success: "Subscription created." });
      await load();
    } catch (err) {
      setStatus({ error: formatApiError(err), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const handlePlanChange = async (e) => {
    e.preventDefault();
    if (!planChangeSub || !planChangeForm.planId) return;
    setBusyId("planchange");
    try {
      await api.post(`/super-admin/subscriptions/${planChangeSub.id}/change-plan`, planChangeForm);
      setIsPlanChangeOpen(false);
      setPlanChangeSub(null);
      setStatus({ error: "", success: "Plan changed successfully." });
      await load();
    } catch (err) {
      setStatus({ error: formatApiError(err), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const handleRenew = async (e) => {
    e.preventDefault();
    if (!renewSub) return;
    setBusyId("renew");
    try {
      await api.post(`/super-admin/subscriptions/${renewSub.id}/renew`, renewForm);
      setIsRenewOpen(false);
      setRenewSub(null);
      setStatus({ error: "", success: "Subscription renewed." });
      await load();
    } catch (err) {
      setStatus({ error: formatApiError(err), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const handleReminder = async (id) => {
    setBusyId(id);
    try {
      await api.post(`/super-admin/subscriptions/${id}/send-trial-reminder`);
      setStatus({ error: "", success: "Reminder sent." });
    } catch (err) {
      setStatus({ error: formatApiError(err), success: "" });
    } finally {
      setBusyId("");
    }
  };

  if (loading) return <PageLoader />;

  const isComputedFilter = statusFilter && !DB_STATUSES.includes(statusFilter);
  const displaySubs = isComputedFilter
    ? subs.filter(s => s.computedStatus === statusFilter)
    : subs;

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ marginTop: 0 }}>Salon Subscriptions</h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.9rem" }}>{displaySubs.length} subscription(s) {isComputedFilter ? 'matched' : 'total'}</p>
          </div>
          <button onClick={() => { setForm(emptyForm); setIsCreateOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", background: "linear-gradient(135deg, #4f46e5, #3b82f6)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            <Plus size={16} /> Onboard Client
          </button>
        </div>
      </div>

      {status.error && <div style={{ padding: 12, background: "#fef2f2", color: "#ef4444", borderRadius: 8, marginBottom: 16 }}>{status.error}</div>}
      {status.success && <div style={{ padding: 12, background: "#f0fdf4", color: "#16a34a", borderRadius: 8, marginBottom: 16 }}>{status.success}</div>}

      <div style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", marginBottom: 24, border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, position: "relative", minWidth: 280 }}>
            <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex", pointerEvents: "none" }}>
              <Search size={18} />
            </div>
            <input
              value={q}
              placeholder="Search salon, plan, notes..."
              onChange={(e) => setQ(e.target.value)}
              style={{ width: "100%", height: 44, padding: "0 16px 0 42px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
              onFocus={e => e.target.style.borderColor = "#6366f1"}
              onBlur={e => e.target.style.borderColor = "#cbd5e1"}
            />
          </div>
          <button onClick={load} style={{ height: 44, padding: "0 24px", background: "linear-gradient(135deg, #4f46e5, #3b82f6)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)" }}>
            Apply Filters
          </button>
          <button 
            onClick={() => { setQ(""); setStatusFilter(""); setPaymentFilter(""); }} 
            style={{ height: 44, padding: "0 20px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#475569", display: "flex", alignItems: "center", gap: 8 }}
          >
            <Filter size={16} />
            Reset
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ height: 42, padding: "0 14px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, background: "#f8fafc", color: "#334155", outline: "none", cursor: "pointer", width: "100%", boxSizing: "border-box" }}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} style={{ height: 42, padding: "0 14px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, background: "#f8fafc", color: "#334155", outline: "none", cursor: "pointer", width: "100%", boxSizing: "border-box" }}>
            <option value="">All Payments</option>
            {PAYMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {subs.length === 0 ? (
        <EmptyState title="No Subscriptions" message="Onboard a client to create the first subscription." />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#64748b", fontWeight: 700 }}>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Salon</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Plan</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Payment</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Start</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Expiry</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Validity</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displaySubs.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>No subscriptions match the selected filters.</td></tr>
              ) : displaySubs.map(row => {
                const meta = COMPUTED_STATUS_META[row.computedStatus] || COMPUTED_STATUS_META.ACTIVE;
                const daysLeft = row.daysLeft ?? 0;
                return (
                  <tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a", cursor: "pointer" }} onClick={() => openDetail(row.id)}>{row.salon?.name || "—"}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{row.salon?.email || ""}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600 }}>{row.plan?.name || "—"}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>₹{Number(row.plan?.monthlyPrice || 0).toLocaleString()}/mo</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: meta.bg, color: meta.color, padding: "3px 10px", borderRadius: 100, fontSize: "0.72rem", fontWeight: 700 }}>{meta.label}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: row.paymentStatus === "COMPLETED" ? "#d1fae5" : row.paymentStatus === "FAILED" ? "#fee2e2" : "#fef3c7", color: row.paymentStatus === "COMPLETED" ? "#059669" : row.paymentStatus === "FAILED" ? "#dc2626" : "#d97706", padding: "4px 10px", borderRadius: 100, fontSize: "0.72rem", fontWeight: 700 }}>{row.paymentStatus || "PENDING"}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#475569", fontWeight: 500 }}>{row.startsAt ? new Date(row.startsAt).toLocaleDateString() : "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#475569", fontWeight: 500 }}>{row.endsAt ? new Date(row.endsAt).toLocaleDateString() : "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: daysLeft <= 0 ? "#fee2e2" : daysLeft <= 7 ? "#fef3c7" : "#f1f5f9", color: daysLeft <= 0 ? "#dc2626" : daysLeft <= 7 ? "#d97706" : "#475569", padding: "4px 10px", borderRadius: 100, fontSize: "0.72rem", fontWeight: 700 }}>
                        {daysLeft <= 0 ? "Expired" : `${daysLeft}d left`}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button onClick={() => openDetail(row.id)} title="View Details" style={{ padding: "6px", border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}><Eye size={15} /></button>
                        <button onClick={() => { setPlanChangeSub(row); setPlanChangeForm({ planId: "", effectiveDate: "", reason: "" }); setIsPlanChangeOpen(true); }} title="Change Plan" style={{ padding: "6px", border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}><ArrowRightLeft size={15} /></button>
                        <button onClick={() => { setRenewSub(row); setRenewForm({ months: 1, paymentMethod: "OTHER", amount: Number(row.plan?.monthlyPrice || 0), notes: "" }); setIsRenewOpen(true); }} title="Renew" style={{ padding: "6px", border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}><RefreshCw size={15} /></button>
                        <button onClick={() => handleReminder(row.id)} disabled={busyId === row.id} title="Send Reminder" style={{ padding: "6px", border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", opacity: busyId === row.id ? 0.5 : 1 }}><Bell size={15} /></button>
                        <button onClick={() => { setHistorySub(row); setIsHistoryOpen(true); }} title="History" style={{ padding: "6px", border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}><History size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isCreateOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header"><h3>Onboard Client</h3><button className="modal-close-btn" onClick={() => setIsCreateOpen(false)}>&times;</button></div>
            <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
              <label style={{ gridColumn: "1 / -1" }}><span style={{ fontSize: 12, fontWeight: 700 }}>Salon *</span><select value={form.salonId} required onChange={e => setForm({ ...form, salonId: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}><option value="">Select salon</option>{salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
              <label style={{ gridColumn: "1 / -1" }}><span style={{ fontSize: 12, fontWeight: 700 }}>Plan *</span><select value={form.planId} required onChange={e => setForm({ ...form, planId: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}><option value="">Select plan</option>{plans.filter(p => !p.isArchived).map(p => <option key={p.id} value={p.id}>{p.name} — ₹{Number(p.monthlyPrice).toLocaleString()}/mo</option>)}</select></label>
              <label><span style={{ fontSize: 12, fontWeight: 700 }}>Start Date *</span><input type="date" value={form.startsAt} required onChange={e => setForm({ ...form, startsAt: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }} /></label>
              <label><span style={{ fontSize: 12, fontWeight: 700 }}>End Date *</span><input type="date" value={form.endsAt} required onChange={e => setForm({ ...form, endsAt: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }} /></label>
              <label><span style={{ fontSize: 12, fontWeight: 700 }}>Status</span><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}><option value="TRIAL">Trial</option><option value="ACTIVE">Active</option></select></label>
              <label><span style={{ fontSize: 12, fontWeight: 700 }}>Payment Status</span><select value={form.paymentStatus} onChange={e => setForm({ ...form, paymentStatus: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}><option value="PENDING">Pending</option><option value="COMPLETED">Paid</option><option value="FAILED">Failed</option></select></label>
              <label style={{ gridColumn: "1 / -1" }}><span style={{ fontSize: 12, fontWeight: 700 }}>Notes</span><textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", boxSizing: "border-box" }} /></label>
              <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setIsCreateOpen(false)} style={{ padding: "10px 18px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={busyId === "create"} style={{ padding: "10px 18px", background: "#4f46e5", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>{busyId === "create" ? "Creating..." : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditOpen && editingRow && (
        <div className="modal-overlay" onClick={() => setIsEditOpen(false)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header"><h3>Edit Subscription</h3><button className="modal-close-btn" onClick={() => setIsEditOpen(false)}>&times;</button></div>
            <form onSubmit={handleEditSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
              <label><span style={{ fontSize: 12, fontWeight: 700 }}>Status</span><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}><option value="TRIAL">Trial</option><option value="ACTIVE">Active</option><option value="EXPIRED">Expired</option><option value="SUSPENDED">Suspended</option></select></label>
              <label><span style={{ fontSize: 12, fontWeight: 700 }}>Payment Status</span><select value={form.paymentStatus} onChange={e => setForm({ ...form, paymentStatus: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}><option value="PENDING">Pending</option><option value="COMPLETED">Paid</option><option value="FAILED">Failed</option><option value="REFUNDED">Refunded</option></select></label>
              <label><span style={{ fontSize: 12, fontWeight: 700 }}>Plan</span><select value={form.planId} onChange={e => setForm({ ...form, planId: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>{plans.filter(p => !p.isArchived).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
              <label><span style={{ fontSize: 12, fontWeight: 700 }}>End Date</span><input type="date" value={form.endsAt} onChange={e => setForm({ ...form, endsAt: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }} /></label>
              <label><span style={{ fontSize: 12, fontWeight: 700 }}>Discount (INR)</span><input type="number" min="0" value={form.manualDiscount} onChange={e => setForm({ ...form, manualDiscount: Number(e.target.value) })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }} /></label>
              <label style={{ gridColumn: "1 / -1" }}><span style={{ fontSize: 12, fontWeight: 700 }}>Notes</span><textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", boxSizing: "border-box" }} /></label>
              <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setIsEditOpen(false)} style={{ padding: "10px 18px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={busyId === "edit"} style={{ padding: "10px 18px", background: "#4f46e5", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>{busyId === "edit" ? "Saving..." : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPlanChangeOpen && planChangeSub && (
        <div className="modal-overlay" onClick={() => setIsPlanChangeOpen(false)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header"><h3>Change Plan</h3><button className="modal-close-btn" onClick={() => setIsPlanChangeOpen(false)}>&times;</button></div>
            <div style={{ padding: "0 0 16px", fontSize: 13, color: "#64748b" }}>
              Current: <strong>{planChangeSub.plan?.name}</strong> (₹{Number(planChangeSub.plan?.monthlyPrice || 0).toLocaleString()}/mo)
            </div>
            <form onSubmit={handlePlanChange} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label><span style={{ fontSize: 12, fontWeight: 700 }}>New Plan *</span><select value={planChangeForm.planId} required onChange={e => setPlanChangeForm({ ...planChangeForm, planId: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}><option value="">Select new plan</option>{plans.filter(p => !p.isArchived && p.id !== planChangeSub.planId).map(p => <option key={p.id} value={p.id}>{p.name} — ₹{Number(p.monthlyPrice).toLocaleString()}/mo</option>)}</select></label>
              <label><span style={{ fontSize: 12, fontWeight: 700 }}>Effective Date</span><input type="date" value={planChangeForm.effectiveDate} onChange={e => setPlanChangeForm({ ...planChangeForm, effectiveDate: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }} /></label>
              <label><span style={{ fontSize: 12, fontWeight: 700 }}>Reason</span><textarea rows={2} value={planChangeForm.reason} onChange={e => setPlanChangeForm({ ...planChangeForm, reason: e.target.value })} placeholder="Why is the plan being changed?" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", boxSizing: "border-box" }} /></label>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setIsPlanChangeOpen(false)} style={{ padding: "10px 18px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={busyId === "planchange"} style={{ padding: "10px 18px", background: "#4f46e5", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>{busyId === "planchange" ? "Changing..." : "Change Plan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRenewOpen && renewSub && (
        <div className="modal-overlay" onClick={() => setIsRenewOpen(false)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header"><h3>Renew Subscription</h3><button className="modal-close-btn" onClick={() => setIsRenewOpen(false)}>&times;</button></div>
            <div style={{ padding: "0 0 16px", fontSize: 13, color: "#64748b" }}>
              Salon: <strong>{renewSub.salon?.name}</strong> • Current plan: <strong>{renewSub.plan?.name}</strong>
            </div>
            <form onSubmit={handleRenew} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label><span style={{ fontSize: 12, fontWeight: 700 }}>Renewal Period (months) *</span><input type="number" min="1" max="24" value={renewForm.months} required onChange={e => setRenewForm({ ...renewForm, months: Number(e.target.value) })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }} /></label>
              <label><span style={{ fontSize: 12, fontWeight: 700 }}>Amount (INR)</span><input type="number" min="0" value={renewForm.amount} onChange={e => setRenewForm({ ...renewForm, amount: Number(e.target.value) })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }} /></label>
              <label><span style={{ fontSize: 12, fontWeight: 700 }}>Payment Method</span><select value={renewForm.paymentMethod} onChange={e => setRenewForm({ ...renewForm, paymentMethod: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}><option value="ONLINE">Online</option><option value="CASH">Cash</option><option value="BANK_TRANSFER">Bank Transfer</option><option value="UPI">UPI</option><option value="OTHER">Other</option></select></label>
              <label><span style={{ fontSize: 12, fontWeight: 700 }}>Notes</span><textarea rows={2} value={renewForm.notes} onChange={e => setRenewForm({ ...renewForm, notes: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", boxSizing: "border-box" }} /></label>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setIsRenewOpen(false)} style={{ padding: "10px 18px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={busyId === "renew"} style={{ padding: "10px 18px", background: "#10b981", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>{busyId === "renew" ? "Renewing..." : "Renew & Record Payment"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isHistoryOpen && historySub && (
        <div className="modal-overlay" onClick={() => setIsHistoryOpen(false)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, maxHeight: "80vh", overflowY: "auto" }}>
            <div className="modal-header"><h3>Subscription History</h3><button className="modal-close-btn" onClick={() => setIsHistoryOpen(false)}>&times;</button></div>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>{historySub.salon?.name} — {historySub.plan?.name}</p>
            {historySub.history?.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {historySub.history.map((h, idx) => (
                  <div key={h.id || idx} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: idx < historySub.history.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: h.action?.includes("UPGRADE") ? "#10b981" : h.action?.includes("DOWN") ? "#ef4444" : "#4f46e5", marginTop: 6, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>{h.action.replace(/_/g, " ")}</div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 2 }}>
                        {h.createdBy && `By: ${h.createdBy}`} {h.createdAt && `• ${new Date(h.createdAt).toLocaleString()}`}
                      </div>
                      {h.fromStatus !== h.toStatus && (
                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 2 }}>{h.fromStatus} → {h.toStatus}</div>
                      )}
                      {h.notes && <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 4, fontStyle: "italic" }}>{h.notes}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No history records." />
            )}
          </div>
        </div>
      )}

      {detailSub && !detailLoading && (
        <div className="modal-overlay" onClick={() => setDetailSub(null)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 680, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-header">
              <h3>Subscription Detail</h3>
              <button className="modal-close-btn" onClick={() => setDetailSub(null)}>&times;</button>
            </div>
            <SubscriptionDetail sub={detailSub} />
          </div>
        </div>
      )}
    </div>
  );
}

function SubscriptionDetail({ sub }) {
  const meta = COMPUTED_STATUS_META[sub.computedStatus] || COMPUTED_STATUS_META.ACTIVE;
  const flags = sub.plan?.featureFlags || sub.plan?.features || {};
  const totalFeatures = Object.keys(flags).length;
  const enabledFeatures = Object.values(flags).filter(Boolean).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>{sub.salon?.name}</h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.85rem" }}>{sub.salon?.email}</p>
        </div>
        <span style={{ background: meta.bg, color: meta.color, padding: "4px 12px", borderRadius: 100, fontSize: "0.8rem", fontWeight: 700 }}>{meta.label}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#f8fafc", padding: 16, borderRadius: 10 }}>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>Billing</div>
          <div style={{ fontSize: "0.9rem", color: "#334155" }}>Plan: <strong>{sub.plan?.name}</strong></div>
          <div style={{ fontSize: "0.9rem", color: "#334155" }}>Price: ₹{Number(sub.plan?.monthlyPrice || 0).toLocaleString()}/mo</div>
          <div style={{ fontSize: "0.9rem", color: "#334155" }}>Payment: <span style={{ color: sub.paymentStatus === "COMPLETED" ? "#10b981" : "#d97706", fontWeight: 600 }}>{sub.paymentStatus || "PENDING"}</span></div>
          {sub.manualDiscount > 0 && <div style={{ fontSize: "0.9rem", color: "#334155" }}>Discount: ₹{Number(sub.manualDiscount).toLocaleString()}</div>}
        </div>
        <div style={{ background: "#f8fafc", padding: 16, borderRadius: 10 }}>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>Expiry</div>
          <div style={{ fontSize: "0.9rem", color: "#334155" }}>Start: <strong>{sub.startsAt ? new Date(sub.startsAt).toLocaleDateString() : "—"}</strong></div>
          <div style={{ fontSize: "0.9rem", color: "#334155" }}>End: <strong>{sub.endsAt ? new Date(sub.endsAt).toLocaleDateString() : "—"}</strong></div>
          <div style={{ fontSize: "0.9rem", color: sub.daysLeft <= 7 ? "#ef4444" : "#334155" }}>
            {sub.daysLeft <= 0 ? "Expired" : `${sub.daysLeft} day(s) remaining`}
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Feature Access ({enabledFeatures}/{totalFeatures})</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {Object.entries(flags).map(([k, v]) => (
            <span key={k} style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 6, fontSize: "0.7rem", fontWeight: 600, background: v ? "#f0fdf4" : "#fef2f2", color: v ? "#16a34a" : "#dc2626" }}>
              {v ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
              {k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Limits</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[
            { label: "Branches", val: sub.plan?.branchLimit },
            { label: "Staff", val: sub.plan?.userLimit },
            { label: "Customers", val: sub.plan?.customerLimit },
            { label: "Invoices", val: sub.plan?.invoiceLimit }
          ].map(l => (
            <div key={l.label} style={{ textAlign: "center", padding: 8, background: "#f8fafc", borderRadius: 8 }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>{l.val === 9999 ? "∞" : l.val?.toLocaleString()}</div>
              <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{l.label}</div>
            </div>
          ))}
        </div>
      </div>

      {sub.history?.length > 0 && (
        <div>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Recent History</div>
          {sub.history.slice(0, 5).map((h, idx) => (
            <div key={h.id || idx} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: "0.8rem" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4f46e5", marginTop: 5, flexShrink: 0 }} />
              <div>
                <span style={{ fontWeight: 600, color: "#334155" }}>{h.action.replace(/_/g, " ")}</span>
                <span style={{ color: "#94a3b8", marginLeft: 8 }}>{h.createdAt ? new Date(h.createdAt).toLocaleDateString() : ""}</span>
                {h.notes && <div style={{ color: "#64748b", fontSize: "0.75rem", marginTop: 2 }}>{h.notes}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
