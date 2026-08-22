import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Edit2, Bell, Plus, RefreshCw, Eye, Calendar, Clock, ArrowRightLeft, History, CheckCircle2, XCircle, Search, Filter, Layers, ShieldCheck, User, Store, CreditCard, AlertTriangle } from "lucide-react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import { useAlert } from "../../context/AlertContext";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import CustomSelect from "../../components/CustomSelect";

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Trial", value: "TRIAL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Expiring Soon", value: "EXPIRING_SOON", computed: true },
  { label: "Expired — Grace Access", value: "GRACE_ACCESS", computed: true },
  { label: "Restricted", value: "RESTRICTED", computed: true },
  { label: "Retention Period", value: "RETENTION", computed: true },
  { label: "Archived", value: "ARCHIVED", computed: true }
];

const COMPUTED_STATUS_META = {
  ACTIVE: { color: "#10b981", bg: "#ecfdf5", label: "Active" },
  TRIAL: { color: "#d97706", bg: "#fffbeb", label: "Trial" },
  EXPIRING_SOON: { color: "#f59e0b", bg: "#fffbeb", label: "Expiring Soon" },
  GRACE_ACCESS: { color: "#f97316", bg: "#fff7ed", label: "Expired — Grace Access" },
  RESTRICTED: { color: "#dc2626", bg: "#fef2f2", label: "Restricted" },
  RETENTION: { color: "#6366f1", bg: "#eef2ff", label: "Retention Period" },
  ARCHIVED: { color: "#64748b", bg: "#f1f5f9", label: "Archived" }
};

const PAYMENT_OPTIONS = [
  { label: "All Payment Statuses", value: "" },
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
  const [planFilter, setPlanFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [detailSub, setDetailSub] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [isPlanChangeOpen, setIsPlanChangeOpen] = useState(false);
  const [planChangeSub, setPlanChangeSub] = useState(null);
  const [planChangeStep, setPlanChangeStep] = useState(1);
  const [planChangeForm, setPlanChangeForm] = useState({ planId: "", timing: "IMMEDIATELY", effectiveDate: new Date().toISOString().slice(0, 10), reason: "" });

  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [renewSub, setRenewSub] = useState(null);
  const [renewForm, setRenewForm] = useState({ months: 1, paymentMethod: "OTHER", amount: 0, notes: "" });

  const [isExtendTrialOpen, setIsExtendTrialOpen] = useState(false);
  const [extendTrialSub, setExtendTrialSub] = useState(null);
  const [extendTrialForm, setExtendTrialForm] = useState({ days: 7, reason: "" });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySub, setHistorySub] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [subRes, planRes, salonRes] = await Promise.all([
        api.get("/super-admin/subscriptions"),
        api.get("/super-admin/plans"),
        api.get("/super-admin/salons")
      ]);
      setSubs(subRes.data);
      setPlans(planRes.data);
      setSalons(salonRes?.data || []);
      if (detailSub) {
        const refreshed = subRes.data.find(s => s.id === detailSub.id);
        if (refreshed) setDetailSub(refreshed);
      }
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not load subscriptions"), success: "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const displaySubs = useMemo(() => {
    return subs.filter(s => {
      if (statusFilter && s.computedStatus !== statusFilter && s.status !== statusFilter) return false;
      if (planFilter && s.planId !== planFilter) return false;
      if (paymentFilter && s.paymentStatus !== paymentFilter) return false;
      if (q.trim()) {
        const query = q.toLowerCase();
        const salonName = s.salon?.name?.toLowerCase() || "";
        const salonSlug = s.salon?.slug?.toLowerCase() || "";
        const salonCity = s.salon?.city?.toLowerCase() || "";
        const ownerName = s.owner?.name?.toLowerCase() || "";
        const ownerEmail = s.owner?.email?.toLowerCase() || s.salon?.email?.toLowerCase() || "";
        const planName = s.plan?.name?.toLowerCase() || "";
        const notes = s.notes?.toLowerCase() || "";
        if (!salonName.includes(query) && !salonSlug.includes(query) && !salonCity.includes(query) && !ownerName.includes(query) && !ownerEmail.includes(query) && !planName.includes(query) && !notes.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [subs, statusFilter, planFilter, paymentFilter, q]);

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

  const openPlanChange = (sub) => {
    setPlanChangeSub(sub);
    setPlanChangeStep(1);
    setPlanChangeForm({
      planId: "",
      timing: "IMMEDIATELY",
      effectiveDate: new Date().toISOString().slice(0, 10),
      reason: ""
    });
    setIsPlanChangeOpen(true);
  };

  const openRenew = (sub) => {
    setRenewSub(sub);
    setRenewForm({
      months: 1,
      paymentMethod: "OTHER",
      amount: Number(sub.plan?.monthlyPrice || 0),
      notes: ""
    });
    setIsRenewOpen(true);
  };

  const openExtendTrial = (sub) => {
    setExtendTrialSub(sub);
    setExtendTrialForm({ days: 7, reason: "" });
    setIsExtendTrialOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setBusyId("create");
    try {
      await api.post("/super-admin/subscriptions", form);
      setIsCreateOpen(false);
      setForm(emptyForm);
      setStatus({ error: "", success: "Subscription created successfully." });
      await load();
    } catch (err) {
      setStatus({ error: formatApiError(err), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const handlePlanChangeSubmit = async (e) => {
    e.preventDefault();
    if (!planChangeSub) return;
    if (planChangeStep === 1) {
      setPlanChangeStep(2);
      return;
    }
    setBusyId("planchange");
    try {
      await api.post(`/super-admin/subscriptions/${planChangeSub.id}/change-plan`, planChangeForm);
      setIsPlanChangeOpen(false);
      setPlanChangeSub(null);
      setStatus({ error: "", success: "Plan changed successfully and feature flags updated." });
      await load();
      if (detailSub && detailSub.id === planChangeSub.id) {
        await openDetail(planChangeSub.id);
      }
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
      setStatus({ error: "", success: "Subscription renewed successfully." });
      await load();
      if (detailSub && detailSub.id === renewSub.id) {
        await openDetail(renewSub.id);
      }
    } catch (err) {
      setStatus({ error: formatApiError(err), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const handleExtendTrial = async (e) => {
    e.preventDefault();
    if (!extendTrialSub) return;
    setBusyId("extendtrial");
    try {
      await api.post(`/super-admin/subscriptions/${extendTrialSub.id}/extend-trial`, extendTrialForm);
      setIsExtendTrialOpen(false);
      setExtendTrialSub(null);
      setStatus({ error: "", success: `Trial extended by ${extendTrialForm.days} day(s).` });
      await load();
      if (detailSub && detailSub.id === extendTrialSub.id) {
        await openDetail(extendTrialSub.id);
      }
    } catch (err) {
      setStatus({ error: formatApiError(err), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const handleReminder = async (id) => {
    setBusyId(id);
    try {
      await api.post(`/super-admin/subscriptions/${id}/remind`);
      setStatus({ error: "", success: "Renewal reminder sent to salon owner." });
    } catch (err) {
      setStatus({ error: formatApiError(err), success: "" });
    } finally {
      setBusyId("");
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div style={{ padding: "24px", maxWidth: "1250px", margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <Link
          to="/super-admin/plans"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 10, background: "white", color: "#64748b", fontWeight: 600, fontSize: "0.85rem", border: "1px solid #e2e8f0", textDecoration: "none" }}
        >
          <Layers size={16} /> Plans (Define Packages)
        </Link>
        <Link
          to="/super-admin/subscriptions"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 10, background: "#4f46e5", color: "white", fontWeight: 700, fontSize: "0.85rem", textDecoration: "none", boxShadow: "0 2px 6px rgba(79, 70, 229, 0.25)" }}
        >
          <ShieldCheck size={16} /> Salon Subscriptions (Manage Purchased)
        </Link>
      </div>

      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ marginTop: 0 }}>Salon Subscriptions</h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.9rem" }}>Manage what each salon has purchased, renewals, trial extensions, and plan upgrades. {displaySubs.length} subscription(s) found.</p>
          </div>
          <button onClick={() => { setForm(emptyForm); setIsCreateOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", background: "linear-gradient(135deg, #4f46e5, #3b82f6)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            <Plus size={16} /> + New Subscription
          </button>
        </div>
      </div>

      {status.error && <div style={{ padding: 12, background: "#fef2f2", color: "#ef4444", borderRadius: 8, marginBottom: 16 }}>{status.error}</div>}
      {status.success && <div style={{ padding: 12, background: "#f0fdf4", color: "#16a34a", borderRadius: 8, marginBottom: 16 }}>{status.success}</div>}

      {/* Subscription Status Filter Cards / Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {[
          { id: "", label: "All", count: subs.length },
          { id: "TRIAL", label: "Trial", count: subs.filter(s => s.computedStatus === "TRIAL").length },
          { id: "ACTIVE", label: "Active", count: subs.filter(s => s.computedStatus === "ACTIVE").length },
          { id: "EXPIRING_SOON", label: "Expiring Soon", count: subs.filter(s => s.computedStatus === "EXPIRING_SOON").length },
          { id: "GRACE_ACCESS", label: "Grace Access", count: subs.filter(s => s.computedStatus === "GRACE_ACCESS").length },
          { id: "RESTRICTED", label: "Restricted", count: subs.filter(s => s.computedStatus === "RESTRICTED").length },
          { id: "RETENTION", label: "Retention Period", count: subs.filter(s => s.computedStatus === "RETENTION").length },
          { id: "ARCHIVED", label: "Archived", count: subs.filter(s => s.computedStatus === "ARCHIVED").length }
        ].map(t => {
          const active = statusFilter === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setStatusFilter(t.id)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                background: active ? "#4f46e5" : "#f1f5f9",
                color: active ? "white" : "#475569",
                fontWeight: active ? 700 : 600,
                fontSize: "0.8rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s"
              }}
            >
              {t.label} ({t.count})
            </button>
          );
        })}
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", marginBottom: 24, border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: 260, position: "relative" }}>
            <div className="search-icon" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex", pointerEvents: "none", zIndex: 2 }}>
              <Search size={18} />
            </div>
            <input
              className="search-input-field"
              data-search="true"
              value={q}
              placeholder="Search salon name, owner, city, slug, plan..."
              onChange={(e) => setQ(e.target.value)}
              style={{ width: "100%", height: 42, paddingLeft: 48, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 10, border: "1px solid #cbd5e1", fontSize: "0.9rem", color: "#1e293b", outline: "none", boxSizing: "border-box", transition: "all 0.2s", background: "#f8fafc" }}
              onFocus={e => { e.target.style.background = "#fff"; e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.08)"; }}
              onBlur={e => { e.target.style.background = "#f8fafc"; e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "none"; }}
            />
          </div>
          <button 
            onClick={() => { setQ(""); setStatusFilter(""); setPlanFilter(""); setPaymentFilter(""); }} 
            style={{ height: 42, padding: "0 18px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#475569", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Filter size={15} /> Reset
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <CustomSelect
            value={planFilter}
            onChange={e => setPlanFilter(e.target.value)}
            style={{ width: "100%" }}
          >
            <option value="">All Subscription Plans</option>
            {plans.map(p => <option key={p.id} value={p.id}>{p.name} (₹{Number(p.monthlyPrice).toLocaleString()}/mo)</option>)}
          </CustomSelect>
          <CustomSelect
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
            style={{ width: "100%" }}
          >
            {PAYMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </CustomSelect>
        </div>
      </div>

      {subs.length === 0 ? (
        <EmptyState title="No Subscriptions" message="Onboard a client to create the first subscription." />
      ) : (
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e2e8f0", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f1f5f9", background: "#f8fafc", color: "#64748b", fontWeight: 700 }}>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Salon Name</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Owner</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Current Plan</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Subscription Status</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Payment Status</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Start Date</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Expiry Date</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Access Until</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displaySubs.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>No salon subscriptions match the selected filters.</td></tr>
              ) : displaySubs.map(row => {
                const meta = COMPUTED_STATUS_META[row.computedStatus] || COMPUTED_STATUS_META.ACTIVE;
                const daysLeft = row.daysLeft ?? 0;
                const ownerName = row.owner?.name || row.salon?.name || "—";
                const ownerEmail = row.owner?.email || row.salon?.email || "";
                const ownerPhone = row.owner?.phone || row.salon?.phone || "";

                return (
                  <tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a", cursor: "pointer" }} onClick={() => openDetail(row.id)}>{row.salon?.name || "—"}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{row.salon?.slug ? `${row.salon.slug}` : ""} {row.salon?.city ? `• ${row.salon.city}` : ""}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#334155" }}>{ownerName}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{ownerEmail} {ownerPhone ? `• ${ownerPhone}` : ""}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>{row.plan?.name || "—"}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>₹{Number(row.plan?.monthlyPrice || 0).toLocaleString()}/mo</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: meta.bg, color: meta.color, padding: "3px 10px", borderRadius: 100, fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap" }}>{meta.label}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: row.paymentStatus === "COMPLETED" ? "#d1fae5" : row.paymentStatus === "FAILED" ? "#fee2e2" : "#fef3c7", color: row.paymentStatus === "COMPLETED" ? "#059669" : row.paymentStatus === "FAILED" ? "#dc2626" : "#d97706", padding: "4px 10px", borderRadius: 100, fontSize: "0.72rem", fontWeight: 700 }}>
                        {row.paymentStatus === "COMPLETED" ? "Paid" : row.paymentStatus || "PENDING"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#475569", fontWeight: 500 }}>
                      {row.startsAt ? new Date(row.startsAt).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 12, color: "#334155", fontWeight: 600 }}>{row.endsAt ? new Date(row.endsAt).toLocaleDateString() : "—"}</div>
                      <span style={{ background: daysLeft <= 0 ? "#fee2e2" : daysLeft <= 7 ? "#fef3c7" : "#f1f5f9", color: daysLeft <= 0 ? "#dc2626" : daysLeft <= 7 ? "#d97706" : "#475569", padding: "2px 6px", borderRadius: 4, fontSize: "0.68rem", fontWeight: 700 }}>
                        {daysLeft <= 0 ? "Expired" : `${daysLeft}d left`}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#475569", fontWeight: 600 }}>
                      {row.accessUntil ? new Date(row.accessUntil).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button onClick={() => openDetail(row.id)} title="View Subscription Details" style={{ padding: "6px", border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}><Eye size={15} /></button>
                        <button onClick={() => openPlanChange(row)} title="Change / Upgrade Plan" style={{ padding: "6px", border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}><ArrowRightLeft size={15} /></button>
                        <button onClick={() => openRenew(row)} title="Renew Subscription" style={{ padding: "6px", border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}><RefreshCw size={15} /></button>
                        {(row.status === "TRIAL" || row.computedStatus === "TRIAL") && (
                          <button onClick={() => openExtendTrial(row)} title="Extend Trial" style={{ padding: "6px", border: "1px solid #cbd5e1", borderRadius: 8, background: "#fffbeb", cursor: "pointer", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}><Clock size={15} /></button>
                        )}
                        <button onClick={() => handleReminder(row.id)} disabled={busyId === row.id} title="Send Expiry Reminder" style={{ padding: "6px", border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", opacity: busyId === row.id ? 0.5 : 1 }}><Bell size={15} /></button>
                        <button onClick={() => { setHistorySub(row); setIsHistoryOpen(true); }} title="Subscription History" style={{ padding: "6px", border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}><History size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Onboard Client Subscription Modal */}
      {isCreateOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header"><h3>Onboard Client Subscription</h3><button className="modal-close-btn" onClick={() => setIsCreateOpen(false)}>&times;</button></div>
            <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
              <label style={{ gridColumn: "1 / -1" }}>
                <span style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>Salon *</span>
                <CustomSelect
                  value={form.salonId}
                  required
                  onChange={e => setForm({ ...form, salonId: e.target.value })}
                  style={{ width: "100%" }}
                >
                  <option value="">Select salon</option>
                  {salons.map(s => <option key={s.id} value={s.id}>{s.name} ({s.city || s.email})</option>)}
                </CustomSelect>
              </label>
              <label style={{ gridColumn: "1 / -1" }}>
                <span style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>Plan Package *</span>
                <CustomSelect
                  value={form.planId}
                  required
                  onChange={e => setForm({ ...form, planId: e.target.value })}
                  style={{ width: "100%" }}
                >
                  <option value="">Select plan</option>
                  {plans.filter(p => !p.isArchived).map(p => <option key={p.id} value={p.id}>{p.name} — ₹{Number(p.monthlyPrice).toLocaleString()}/mo</option>)}
                </CustomSelect>
              </label>
              <label>
                <span style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>Status</span>
                <CustomSelect
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  style={{ width: "100%" }}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="TRIAL">Trial</option>
                </CustomSelect>
              </label>
              <label>
                <span style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>Payment Status</span>
                <CustomSelect
                  value={form.paymentStatus}
                  onChange={e => setForm({ ...form, paymentStatus: e.target.value })}
                  style={{ width: "100%" }}
                >
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Paid / Completed</option>
                </CustomSelect>
              </label>
              <label><span style={{ fontSize: 12, fontWeight: 700 }}>Start Date *</span><input type="date" required value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1" }} /></label>
              <label style={{ gridColumn: "1 / -1" }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Manual Discount (INR)</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.manualDiscount ?? ""}
                  onFocus={e => { if (e.target.value === "0" || e.target.value === "") e.target.select(); }}
                  onChange={e => setForm({ ...form, manualDiscount: e.target.value === "" ? "" : Number(e.target.value) })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                />
              </label>
              <label style={{ gridColumn: "1 / -1" }}><span style={{ fontSize: 12, fontWeight: 700 }}>Internal Notes</span><textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }} /></label>
              <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setIsCreateOpen(false)} style={{ padding: "10px 18px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={busyId === "create"} style={{ padding: "10px 18px", background: "#4f46e5", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>{busyId === "create" ? "Saving..." : "Create Subscription"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Change Flow with Confirmation Step (Points 16 & 17) */}
      {isPlanChangeOpen && planChangeSub && (
        <div className="modal-overlay" onClick={() => setIsPlanChangeOpen(false)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>{planChangeStep === 1 ? "Change / Upgrade Plan" : "Confirm Plan Change"}</h3>
              <button className="modal-close-btn" onClick={() => setIsPlanChangeOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handlePlanChangeSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, padding: "10px 0" }}>
              {planChangeStep === 1 ? (
                <>
                  <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: 8, fontSize: 13, border: "1px solid #e2e8f0" }}>
                    <span style={{ color: "#64748b" }}>Current Plan:</span> <strong>{planChangeSub.plan?.name}</strong> (₹{Number(planChangeSub.plan?.monthlyPrice || 0).toLocaleString()}/mo)
                  </div>

                  <label>
                    <span style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>New Plan *</span>
                    <CustomSelect
                      value={planChangeForm.planId}
                      required
                      onChange={e => setPlanChangeForm({ ...planChangeForm, planId: e.target.value })}
                      style={{ width: "100%" }}
                    >
                      <option value="">Select new plan package</option>
                      {plans.filter(p => !p.isArchived && p.id !== planChangeSub.planId).map(p => (
                        <option key={p.id} value={p.id}>{p.name} — ₹{Number(p.monthlyPrice).toLocaleString()}/mo</option>
                      ))}
                    </CustomSelect>
                  </label>

                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>When should this change take effect?</span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => setPlanChangeForm({ ...planChangeForm, timing: "IMMEDIATELY" })}
                        style={{
                          padding: "10px",
                          borderRadius: 8,
                          border: planChangeForm.timing === "IMMEDIATELY" ? "2px solid #4f46e5" : "1px solid #cbd5e1",
                          background: planChangeForm.timing === "IMMEDIATELY" ? "#f5f3ff" : "#fff",
                          color: planChangeForm.timing === "IMMEDIATELY" ? "#4338ca" : "#475569",
                          fontWeight: 700,
                          fontSize: "0.82rem",
                          cursor: "pointer"
                        }}
                      >
                        ⚡ Immediately
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlanChangeForm({ ...planChangeForm, timing: "NEXT_RENEWAL" })}
                        style={{
                          padding: "10px",
                          borderRadius: 8,
                          border: planChangeForm.timing === "NEXT_RENEWAL" ? "2px solid #4f46e5" : "1px solid #cbd5e1",
                          background: planChangeForm.timing === "NEXT_RENEWAL" ? "#f5f3ff" : "#fff",
                          color: planChangeForm.timing === "NEXT_RENEWAL" ? "#4338ca" : "#475569",
                          fontWeight: 700,
                          fontSize: "0.82rem",
                          cursor: "pointer"
                        }}
                      >
                        📅 On Next Renewal
                      </button>
                    </div>
                  </div>

                  <label>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>Effective Date *</span>
                    <input type="date" required value={planChangeForm.effectiveDate} onChange={e => setPlanChangeForm({ ...planChangeForm, effectiveDate: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1" }} />
                  </label>

                  <label>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>Reason / Internal Note</span>
                    <textarea rows={2} value={planChangeForm.reason} onChange={e => setPlanChangeForm({ ...planChangeForm, reason: e.target.value })} placeholder="Reason for upgrade / downgrade / negotiation..." style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", boxSizing: "border-box" }} />
                  </label>

                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                    <button type="button" onClick={() => setIsPlanChangeOpen(false)} style={{ padding: "10px 18px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer" }}>Cancel</button>
                    <button type="submit" disabled={!planChangeForm.planId} style={{ padding: "10px 18px", background: "#4f46e5", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: !planChangeForm.planId ? "not-allowed" : "pointer", opacity: !planChangeForm.planId ? 0.6 : 1 }}>
                      Review Change &rarr;
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {(() => {
                    const nextPlan = plans.find(p => p.id === planChangeForm.planId);
                    const oldPrice = Number(planChangeSub.plan?.monthlyPrice || 0);
                    const newPrice = Number(nextPlan?.monthlyPrice || 0);
                    const isUpgrade = newPrice > oldPrice;

                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ padding: 14, background: isUpgrade ? "#f0fdf4" : "#fffbeb", border: `1px solid ${isUpgrade ? "#bbf7d0" : "#fde68a"}`, borderRadius: 8 }}>
                          <strong style={{ color: isUpgrade ? "#166534" : "#92400e", fontSize: "0.95rem" }}>
                            {isUpgrade ? "⬆️ Plan Upgrade Confirmation" : "⬇️ Plan Downgrade Confirmation"}
                          </strong>
                          <p style={{ margin: "6px 0 0", fontSize: "0.82rem", color: "#334155", lineHeight: 1.4 }}>
                            {planChangeSub.salon?.name} will be migrated from <strong>{planChangeSub.plan?.name}</strong> to <strong>{nextPlan?.name}</strong>.
                          </p>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: "0.85rem", background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                          <div><span style={{ color: "#64748b" }}>Timing:</span> <strong>{planChangeForm.timing === "IMMEDIATELY" ? "Immediate" : "On Next Renewal"}</strong></div>
                          <div><span style={{ color: "#64748b" }}>New Price:</span> <strong>₹{newPrice.toLocaleString()}/mo</strong></div>
                          <div><span style={{ color: "#64748b" }}>Effective:</span> <strong>{planChangeForm.effectiveDate}</strong></div>
                          <div><span style={{ color: "#64748b" }}>Features:</span> <strong>Auto-synced</strong></div>
                        </div>

                        {planChangeForm.reason && (
                          <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                            <strong>Reason:</strong> <em>{planChangeForm.reason}</em>
                          </div>
                        )}

                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                          <button type="button" onClick={() => setPlanChangeStep(1)} style={{ padding: "10px 18px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer" }}>Back</button>
                          <button type="submit" disabled={busyId === "planchange"} style={{ padding: "10px 22px", background: "#10b981", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                            {busyId === "planchange" ? "Applying..." : "Confirm & Apply Change"}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Renew Subscription Modal */}
      {isRenewOpen && renewSub && (
        <div className="modal-overlay" onClick={() => setIsRenewOpen(false)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header"><h3>Renew Subscription</h3><button className="modal-close-btn" onClick={() => setIsRenewOpen(false)}>&times;</button></div>
            <div style={{ padding: "0 0 16px", fontSize: 13, color: "#64748b" }}>
              Salon: <strong>{renewSub.salon?.name}</strong> • Current plan: <strong>{renewSub.plan?.name}</strong>
            </div>
            <form onSubmit={handleRenew} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Renewal Period (months) *</span>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={renewForm.months ?? ""}
                  required
                  onFocus={e => { if (e.target.value === "0" || e.target.value === "") e.target.select(); }}
                  onChange={e => setRenewForm({ ...renewForm, months: e.target.value === "" ? "" : Number(e.target.value) })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}
                />
              </label>
              <label>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Amount (INR)</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={renewForm.amount ?? ""}
                  onFocus={e => { if (e.target.value === "0" || e.target.value === "") e.target.select(); }}
                  onChange={e => setRenewForm({ ...renewForm, amount: e.target.value === "" ? "" : Number(e.target.value) })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}
                />
              </label>
              <label>
                <span style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>Payment Method</span>
                <CustomSelect
                  value={renewForm.paymentMethod}
                  onChange={e => setRenewForm({ ...renewForm, paymentMethod: e.target.value })}
                  style={{ width: "100%" }}
                >
                  <option value="ONLINE">Online</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="OTHER">Other</option>
                </CustomSelect>
              </label>
              <label><span style={{ fontSize: 12, fontWeight: 700 }}>Notes</span><textarea rows={2} value={renewForm.notes} onChange={e => setRenewForm({ ...renewForm, notes: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", boxSizing: "border-box" }} /></label>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setIsRenewOpen(false)} style={{ padding: "10px 18px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={busyId === "renew"} style={{ padding: "10px 18px", background: "#10b981", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>{busyId === "renew" ? "Renewing..." : "Renew & Record Payment"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extend Trial Modal (Point 19) */}
      {isExtendTrialOpen && extendTrialSub && (
        <div className="modal-overlay" onClick={() => setIsExtendTrialOpen(false)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header"><h3>Extend Salon Trial</h3><button className="modal-close-btn" onClick={() => setIsExtendTrialOpen(false)}>&times;</button></div>
            <div style={{ padding: "0 0 14px", fontSize: 13, color: "#64748b" }}>
              Salon: <strong>{extendTrialSub.salon?.name}</strong> • Current Trial End: <strong>{extendTrialSub.endsAt ? new Date(extendTrialSub.endsAt).toLocaleDateString() : "—"}</strong>
            </div>
            <form onSubmit={handleExtendTrial} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>Extension Period</span>
                <div style={{ display: "flex", gap: 8 }}>
                  {[7, 14, 30].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setExtendTrialForm({ ...extendTrialForm, days: d })}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: 6,
                        border: extendTrialForm.days === d ? "2px solid #d97706" : "1px solid #cbd5e1",
                        background: extendTrialForm.days === d ? "#fffbeb" : "#fff",
                        color: extendTrialForm.days === d ? "#92400e" : "#475569",
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        cursor: "pointer"
                      }}
                    >
                      +{d} Days
                    </button>
                  ))}
                </div>
              </div>
              <label>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Custom Days</span>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={extendTrialForm.days ?? ""}
                  onFocus={e => { if (e.target.value === "0" || e.target.value === "") e.target.select(); }}
                  onChange={e => setExtendTrialForm({ ...extendTrialForm, days: e.target.value === "" ? "" : Number(e.target.value) })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                />
              </label>
              <label>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Reason / Note</span>
                <textarea rows={2} value={extendTrialForm.reason} onChange={e => setExtendTrialForm({ ...extendTrialForm, reason: e.target.value })} placeholder="Why is the trial being extended?" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", boxSizing: "border-box" }} />
              </label>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setIsExtendTrialOpen(false)} style={{ padding: "10px 18px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={busyId === "extendtrial"} style={{ padding: "10px 18px", background: "#d97706", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                  {busyId === "extendtrial" ? "Extending..." : "Extend Trial"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subscription History Modal */}
      {isHistoryOpen && historySub && (
        <div className="modal-overlay" onClick={() => setIsHistoryOpen(false)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 620, maxHeight: "80vh", overflowY: "auto" }}>
            <div className="modal-header"><h3>Subscription History & Activity</h3><button className="modal-close-btn" onClick={() => setIsHistoryOpen(false)}>&times;</button></div>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>{historySub.salon?.name} — {historySub.plan?.name}</p>
            {historySub.history?.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {historySub.history.map((h, idx) => (
                  <div key={h.id || idx} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: idx < historySub.history.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: h.action?.includes("UPGRADE") ? "#10b981" : h.action?.includes("DOWN") ? "#ef4444" : h.action?.includes("TRIAL") ? "#d97706" : "#4f46e5", marginTop: 6, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>{h.action.replace(/_/g, " ")}</div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 2 }}>
                        {h.createdBy && `By: ${h.createdBy}`} {h.createdAt && `• ${new Date(h.createdAt).toLocaleString()}`}
                      </div>
                      {h.fromStatus !== h.toStatus && (
                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 2 }}>Status: {h.fromStatus} → {h.toStatus}</div>
                      )}
                      {h.notes && <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: 4, fontStyle: "italic", background: "#f8fafc", padding: "4px 8px", borderRadius: 4 }}>{h.notes}</div>}
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

      {/* Subscription Detail Slide-over / Modal (Point 14 & 15) */}
      {detailSub && !detailLoading && (
        <div className="modal-overlay" onClick={() => setDetailSub(null)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 760, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Subscription Detail</h3>
              <button className="modal-close-btn" onClick={() => setDetailSub(null)}>&times;</button>
            </div>
            <SubscriptionDetail
              sub={detailSub}
              onRenew={() => { const s = detailSub; setDetailSub(null); openRenew(s); }}
              onChangePlan={() => { const s = detailSub; setDetailSub(null); openPlanChange(s); }}
              onExtendTrial={() => { const s = detailSub; setDetailSub(null); openExtendTrial(s); }}
              onRemind={() => handleReminder(detailSub.id)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SubscriptionDetail({ sub, onRenew, onChangePlan, onExtendTrial, onRemind }) {
  const meta = COMPUTED_STATUS_META[sub.computedStatus] || COMPUTED_STATUS_META.ACTIVE;
  const planFlags = sub.plan?.featureFlags || sub.plan?.features || {};
  const salonFlags = sub.salon?.featureFlags || planFlags;
  
  const ownerName = sub.owner?.name || sub.salon?.users?.[0]?.name || sub.salon?.name || "—";
  const ownerEmail = sub.owner?.email || sub.salon?.users?.[0]?.email || sub.salon?.email || "—";
  const ownerPhone = sub.owner?.phone || sub.salon?.users?.[0]?.phone || sub.salon?.phone || "—";
  const isTrial = sub.status === "TRIAL" || sub.computedStatus === "TRIAL";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "14px 16px", borderRadius: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#0f172a" }}>{sub.salon?.name}</h2>
          <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "0.82rem" }}>
            {sub.salon?.slug} • {sub.salon?.city || "No city specified"}
          </p>
        </div>
        <span style={{ background: meta.bg, color: meta.color, padding: "5px 14px", borderRadius: 100, fontSize: "0.82rem", fontWeight: 700 }}>
          {meta.label}
        </span>
      </div>

      {/* Subscription Action Toolbar (Point 15) */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, background: "#f1f5f9", padding: "10px 14px", borderRadius: 10 }}>
        <button
          type="button"
          onClick={onRenew}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "none", background: "#10b981", color: "white", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}
        >
          <RefreshCw size={14} /> Renew Subscription
        </button>
        <button
          type="button"
          onClick={onChangePlan}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "none", background: "#4f46e5", color: "white", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}
        >
          <ArrowRightLeft size={14} /> Upgrade / Change Plan
        </button>
        {isTrial && (
          <button
            type="button"
            onClick={onExtendTrial}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "none", background: "#d97706", color: "white", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}
          >
            <Clock size={14} /> Extend Trial
          </button>
        )}
        <button
          type="button"
          onClick={onRemind}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #cbd5e1", background: "white", color: "#475569", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}
        >
          <Bell size={14} /> Send Reminder
        </button>
      </div>

      {/* 1. Subscription Information */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
        <h4 style={{ margin: "0 0 12px", fontSize: "0.88rem", color: "#334155", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 6 }}>
          <Store size={16} color="#4f46e5" /> 1. Subscription Overview
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px 16px", fontSize: "0.85rem" }}>
          <div><span style={{ color: "#64748b" }}>Salon:</span> <strong>{sub.salon?.name}</strong></div>
          <div><span style={{ color: "#64748b" }}>Owner:</span> <strong>{ownerName}</strong> ({ownerEmail})</div>
          <div><span style={{ color: "#64748b" }}>Owner Phone:</span> <strong>{ownerPhone}</strong></div>
          <div><span style={{ color: "#64748b" }}>Current Plan:</span> <strong>{sub.plan?.name}</strong> {sub.plan?.isCustom && <span style={{ color: "#8b5cf6", fontSize: "0.75rem", fontWeight: 700 }}>(Custom)</span>}</div>
          <div><span style={{ color: "#64748b" }}>Subscription Status:</span> <strong>{sub.status}</strong></div>
          <div><span style={{ color: "#64748b" }}>Start Date:</span> <strong>{sub.startsAt ? new Date(sub.startsAt).toLocaleDateString() : "—"}</strong></div>
          <div><span style={{ color: "#64748b" }}>Expiry Date:</span> <strong>{sub.endsAt ? new Date(sub.endsAt).toLocaleDateString() : "—"}</strong></div>
        </div>
      </div>

      {/* 2. Billing */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h4 style={{ margin: 0, fontSize: "0.88rem", color: "#334155", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 6 }}>
            <CreditCard size={16} color="#10b981" /> 2. Billing Details
          </h4>
          <a
            href={`/super-admin/finance?salonId=${sub.salonId}`}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: "0.78rem", color: "#4f46e5", fontWeight: 700, textDecoration: "none" }}
          >
            View Finance Transactions →
          </a>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px 16px", fontSize: "0.85rem" }}>
          <div><span style={{ color: "#64748b" }}>Plan Amount:</span> <strong>₹{Number(sub.plan?.monthlyPrice || 0).toLocaleString()}</strong> /month</div>
          <div><span style={{ color: "#64748b" }}>Yearly Equivalent:</span> <strong>₹{Number(sub.plan?.yearlyPrice || 0).toLocaleString()}</strong> /year</div>
          <div><span style={{ color: "#64748b" }}>Billing Cycle:</span> <strong>{sub.billingCycle || "Monthly"}</strong></div>
          <div><span style={{ color: "#64748b" }}>Payment Status:</span> <span style={{ color: sub.paymentStatus === "COMPLETED" ? "#10b981" : "#d97706", fontWeight: 700 }}>{sub.paymentStatus === "COMPLETED" ? "Paid" : sub.paymentStatus || "PENDING"}</span></div>
          {sub.manualDiscount > 0 && <div><span style={{ color: "#64748b" }}>Manual Discount:</span> <strong>₹{Number(sub.manualDiscount).toLocaleString()}</strong></div>}
          <div><span style={{ color: "#64748b" }}>Next Renewal:</span> <strong>{sub.endsAt ? new Date(sub.endsAt).toLocaleDateString() : "—"}</strong></div>
        </div>
      </div>

      {/* 3. Expiry & Lifecycle (Point 19 Trial Support Included) */}
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
        <h4 style={{ margin: "0 0 12px", fontSize: "0.88rem", color: "#334155", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 6 }}>
          <Clock size={16} color="#f59e0b" /> 3. Expiry & Lifecycle Access
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px 16px", fontSize: "0.85rem" }}>
          <div><span style={{ color: "#64748b" }}>{isTrial ? "Trial Start Date:" : "Subscription Start:"}</span> <strong>{sub.startsAt ? new Date(sub.startsAt).toLocaleDateString() : "—"}</strong></div>
          <div><span style={{ color: "#64748b" }}>{isTrial ? "Trial End Date:" : "Subscription Expiry:"}</span> <strong>{sub.endsAt ? new Date(sub.endsAt).toLocaleDateString() : "—"}</strong></div>
          <div><span style={{ color: "#64748b" }}>Access Until (+2 Days Grace):</span> <strong style={{ color: "#d97706" }}>{sub.accessUntil ? new Date(sub.accessUntil).toLocaleDateString() : "—"}</strong></div>
          <div><span style={{ color: "#64748b" }}>Retention Until (+90 Days):</span> <strong style={{ color: "#6366f1" }}>{sub.retentionUntil ? new Date(sub.retentionUntil).toLocaleDateString() : "—"}</strong></div>
          <div style={{ gridColumn: "1 / -1" }}>
            <span style={{ color: "#64748b" }}>Current Lifecycle Stage:</span> <strong style={{ color: meta.color }}>{meta.label}</strong> ({sub.daysLeft <= 0 ? "Expired" : `${sub.daysLeft} days remaining`})
          </div>
        </div>
      </div>

      {/* 4. Features */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
        <h4 style={{ margin: "0 0 12px", fontSize: "0.88rem", color: "#334155", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          4. Feature Access & Overrides
        </h4>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {Object.entries(planFlags).map(([k, v]) => {
            const isOverridden = salonFlags && salonFlags[k] !== undefined && salonFlags[k] !== v;
            const finalVal = isOverridden ? salonFlags[k] : v;
            return (
              <span key={k} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 6, fontSize: "0.72rem", fontWeight: 600, background: finalVal ? "#f0fdf4" : "#fef2f2", color: finalVal ? "#166534" : "#991b1b", border: `1px solid ${finalVal ? "#bbf7d0" : "#fecaca"}` }}>
                {finalVal ? <CheckCircle2 size={12} color="#16a34a" /> : <XCircle size={12} color="#dc2626" />}
                {k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}
                {isOverridden && <span style={{ fontSize: "0.62rem", background: "#fef3c7", color: "#92400e", padding: "1px 4px", borderRadius: 3 }}>Override</span>}
              </span>
            );
          })}
        </div>
      </div>

      {/* 5. History */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
        <h4 style={{ margin: "0 0 12px", fontSize: "0.88rem", color: "#334155", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          5. Subscription Activity & History
        </h4>
        {sub.history?.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sub.history.map((h, idx) => (
              <div key={h.id || idx} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: idx < sub.history.length - 1 ? "1px solid #f1f5f9" : "none", fontSize: "0.8rem" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: h.action?.includes("UPGRADE") ? "#10b981" : h.action?.includes("DOWN") ? "#ef4444" : h.action?.includes("TRIAL") ? "#d97706" : "#4f46e5", marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, color: "#1e293b" }}>{h.action.replace(/_/g, " ")}</div>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                    {h.createdBy && `By: ${h.createdBy}`} {h.createdAt && `• ${new Date(h.createdAt).toLocaleString()}`}
                  </div>
                  {h.fromStatus !== h.toStatus && (
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 2 }}>{h.fromStatus} → {h.toStatus}</div>
                  )}
                  {h.notes && <div style={{ color: "#475569", fontSize: "0.75rem", marginTop: 2, fontStyle: "italic", background: "#f8fafc", padding: "4px 8px", borderRadius: 4 }}>{h.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "0.82rem", color: "#94a3b8", margin: 0 }}>No historical activity recorded yet.</p>
        )}
      </div>
    </div>
  );
}
