import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import { useAlert } from "../../context/AlertContext";
import IndianPhoneInput from "../../components/IndianPhoneInput";
import CustomSelect from "../../components/CustomSelect";
import { MapPin, Scissors, Users, UserCheck, Mail, Phone, Shield, Activity, Landmark, Globe, Clock, CreditCard } from "lucide-react";

const businessTypes = ["Salon", "Spa", "Beauty Clinic", "Nail Studio", "Tattoo Studio", "Pet Grooming", "Wellness Center"];
const featureFlagKeys = [
  "pos", "appointments", "inventory", "crm", 
  "ecommerce", "digitalCatalog", "catalogAnalytics", "feedback", "reports", "memberships",
  "packages", "loyalty", "couponsGiftCards", "whatsapp", "enquiries", "expenses",
  "attendance", "customerPortal", "publicCatalog",
  "onlineOrders", "messageTemplates", "notifications", "auditLogs", "advancedReports",
  "staffRequirements", "productRequirements"
];
const defaultFlags = {
  pos: true, appointments: false, inventory: false, crm: true, 
  ecommerce: false, digitalCatalog: false,
  catalogAnalytics: false, feedback: false, reports: true, memberships: false, packages: false,
  loyalty: false, couponsGiftCards: false, whatsapp: false, enquiries: false, expenses: false,
  attendance: false, customerPortal: false,
  publicCatalog: true, onlineOrders: false, messageTemplates: false, notifications: true,
  auditLogs: true, advancedReports: true, staffRequirements: false, productRequirements: false
};
const emptyForm = {
  name: "", slug: "", businessType: "Salon", email: "", phone: "", address: "",
  taxRate: 0, trialStartsAt: "", trialEndsAt: "", internalNote: "",
  ownerName: "", ownerEmail: "", ownerPassword: ""
};

export default function SalonsPage() {
  const { showConfirm } = useAlert();
  const [salons, setSalons] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const setQuery = (val) => {
    setSearchParams((prev) => {
      if (val) prev.set("q", val); else prev.delete("q");
      return prev;
    });
  };
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [featureFlags, setFeatureFlags] = useState(defaultFlags);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const detailRef = useRef(null);

  const load = async (nextQuery = query, nextStatus = statusFilter) => {
    setLoading(true);
    setStatus({ error: "", success: "" });
    try {
      const res = await api.get("/super-admin/salons", {
        params: { ...(nextQuery ? { q: nextQuery } : {}), ...(nextStatus ? { status: nextStatus } : {}) }
      });
      setSalons(res.data);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not load salons."), success: "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(query, statusFilter);
  }, [query, statusFilter]);

  const resetForm = () => {
    setForm(emptyForm);
    setFeatureFlags(defaultFlags);
    setEditingId("");
    setIsModalOpen(false);
  };

  const createOrUpdateSalon = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setStatus({ error: "Salon name is required.", success: "" });
      return;
    }
    if (!editingId) {
      const hasAnyOwner = form.ownerName || form.ownerEmail || form.ownerPassword;
      const hasAllOwner = form.ownerName && form.ownerEmail && form.ownerPassword;
      if (hasAnyOwner && !hasAllOwner) {
        setStatus({ error: "Owner name, email, and password are all required. Fill in all three or leave all empty.", success: "" });
        return;
      }
    }
    setStatus({ error: "", success: "" });
    setSaving(true);
    try {
      const finalSlug = form.slug?.trim() || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      if (finalSlug.length < 2) {
        setStatus({ error: "Salon name must be at least 2 characters to generate a valid URL slug.", success: "" });
        setSaving(false);
        return;
      }
      const payload = { ...form, slug: finalSlug, taxRate: Number(form.taxRate || 0), featureFlags };
      if (editingId) {
        await api.patch(`/super-admin/salons/${editingId}`, payload);
        setStatus({ error: "", success: "Salon updated successfully." });
      } else {
        await api.post("/super-admin/salons", payload);
        setStatus({ error: "", success: "Salon created successfully." });
      }
      resetForm();
      await load();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not save salon"), success: "" });
    } finally {
      setSaving(false);
    }
  };

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const openDetail = async (salonId) => {
    setDetailLoading(true);
    setIsViewModalOpen(true);
    try {
      const res = await api.get(`/super-admin/salons/${salonId}`);
      setSelectedSalon(res.data);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not load salon detail."), success: "" });
    } finally {
      setDetailLoading(false);
    }
  };

  const startEdit = async (salon) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/super-admin/salons/${salon.id}`);
      const full = res.data;
      setEditingId(full.id);
      setForm({
        name: full.name || "", slug: full.slug || "", businessType: full.businessType || "Salon",
        email: full.email || "", phone: full.phone || "", address: full.address || "",
        taxRate: Number(full.taxRate || 0),
        trialStartsAt: full.trialStartsAt ? new Date(full.trialStartsAt).toISOString().slice(0, 10) : "",
        trialEndsAt: full.trialEndsAt ? new Date(full.trialEndsAt).toISOString().slice(0, 10) : "",
        internalNote: full.internalNote || "", ownerName: "", ownerEmail: "", ownerPassword: ""
      });
      setFeatureFlags({ ...defaultFlags, ...(full.featureFlags || {}) });
      setIsModalOpen(true);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not load salon details for editing."), success: "" });
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleFeature = async (salonId, key) => {
    let nextFlags;
    let previousFlags;

    setSelectedSalon((prev) => {
      if (prev?.id !== salonId) return prev;
      previousFlags = { ...prev.featureFlags };
      nextFlags = { ...defaultFlags, ...(prev.featureFlags || {}), [key]: !(prev.featureFlags?.[key]) };
      return { ...prev, featureFlags: nextFlags };
    });

    setSalons((prev) => prev.map((s) => {
      if (s.id !== salonId) return s;
      if (!previousFlags) {
        previousFlags = { ...s.featureFlags };
        nextFlags = { ...defaultFlags, ...(s.featureFlags || {}), [key]: !(s.featureFlags?.[key]) };
      }
      return { ...s, featureFlags: nextFlags };
    }));

    try {
      await api.patch(`/super-admin/salons/${salonId}/features`, { featureFlags: nextFlags });
    } catch (err) {
      if (previousFlags) {
        setSelectedSalon((prev) => prev?.id === salonId ? { ...prev, featureFlags: previousFlags } : prev);
        setSalons((prev) => prev.map((s) => s.id === salonId ? { ...s, featureFlags: previousFlags } : s));
      }
      setStatus({ error: formatApiError(err, "Could not toggle feature"), success: "" });
    }
  };

  const impersonate = async (salonId) => {
    setBusyId(salonId);
    try {
      const res = await api.post(`/super-admin/salons/${salonId}/impersonate`);
      setStatus({ error: "", success: res.data.message });
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not impersonate salon"), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "42px",
      borderRadius: "8px",
      borderColor: state.isFocused ? "#4f46e5" : "#e2e8f0",
      boxShadow: state.isFocused ? "0 0 0 1px #4f46e5" : "none",
      fontSize: "0.95rem",
      "&:hover": { borderColor: state.isFocused ? "#4f46e5" : "#cbd5e1" },
      background: state.isDisabled ? "#f8fafc" : "#fff"
    }),
    option: (base, state) => ({
      ...base,
      fontSize: "0.95rem",
      backgroundColor: state.isSelected ? "#4f46e5" : state.isFocused ? "#e0e7ff" : "white",
      color: state.isSelected ? "white" : "#334155",
      cursor: "pointer",
      "&:active": { backgroundColor: "#4f46e5", color: "white" }
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "8px",
      overflow: "hidden",
      zIndex: 9999
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
      border: "none",
      borderRadius: 0,
      minHeight: "auto",
      boxShadow: "none",
      outline: "none",
      "input:focus": {
        boxShadow: "none",
      }
    })
  };

  const handleExportCustomers = async () => {
    try {
      const res = await api.get("/super-admin/export-customers", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `customers_export_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setStatus({ error: "Failed to export customers", success: "" });
    }
  };

  const handleExportInventory = async () => {
    try {
      const res = await api.get("/super-admin/export-inventory", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `inventory_export_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setStatus({ error: "Failed to export inventory", success: "" });
    }
  };

  return (
    <div className="page-shell super-admin-page">
      <style>{`
        .super-admin-page .react-select__input-container,
        .super-admin-page .react-select__input-container input,
        .super-admin-page .react-select__value-container input {
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
          min-height: auto !important;
          border-radius: 0 !important;
        }
      `}</style>
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0 }}>Salons</h1>
            <p style={{ marginBottom: 0 }}>Create, activate, suspend, and inspect every tenant from one control surface.</p>
          </div>
          <div className="badge-row" style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={handleExportCustomers} style={{ background: "#4f46e5", color: "white", padding: "6px 12px", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Export Customers</button>
            <button type="button" onClick={handleExportInventory} style={{ background: "#10b981", color: "white", padding: "6px 12px", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Export Inventory</button>
            <span className="badge">Total {salons.length}</span>
          </div>
        </div>
      </div>
      <div className="panel-card" style={{ marginBottom: 18, padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <input 
              value={query} 
              placeholder="Search salon, slug, email, phone, city..." 
              onChange={(e) => setQuery(e.target.value)} 
              style={{ width: "100%", minHeight: 40, padding: "8px 14px", borderRadius: 8, fontSize: 13, border: "1px solid #cbd5e1", background: "#f8fafc" }}
            />
          </div>
          <div style={{ width: 180 }}>
            <CustomSelect 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { label: "All statuses", value: "" },
                { label: "Active", value: "ACTIVE" },
                { label: "Trial", value: "TRIAL" },
                { label: "Suspended", value: "SUSPENDED" },
                { label: "Expired", value: "EXPIRED" },
                { label: "Cancelled", value: "CANCELLED" }
              ]}
              placeholder="All statuses"
              style={{ width: "100%", height: 40 }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button 
              type="button" 
              onClick={() => load(query, statusFilter)} 
              style={{ minHeight: 40, padding: "0 18px", borderRadius: 8, background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)", color: "white", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", boxShadow: "0 2px 6px rgba(79, 70, 229, 0.15)" }}
            >
              Apply
            </button>
            <button 
              type="button" 
              onClick={() => { setQuery(""); setStatusFilter(""); }} 
              style={{ minHeight: 40, padding: "0 18px", borderRadius: 8, background: "#f1f5f9", color: "#475569", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* FULL EDIT SALON MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 840, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-header">
              <h3>{editingId ? "Edit Tenant Salon Details" : "Add New Tenant Salon"}</h3>
              <button type="button" className="modal-close-btn" onClick={resetForm}>&times;</button>
            </div>
            <form onSubmit={createOrUpdateSalon} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Salon Name *</span>
                  <input placeholder="Salon name" value={form.name} required onChange={(e) => {
                    const val = e.target.value;
                    setForm({ ...form, name: val, slug: val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") });
                  }} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>URL Slug *</span>
                  <input placeholder="salon-slug" value={form.slug} required onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Business Type</span>
                  <CustomSelect 
                    value={form.businessType} 
                    onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                    options={businessTypes.map(t => ({ label: t, value: t }))}
                    placeholder="Select Business Type"
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Business Email</span>
                  <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Business Phone</span>
                  <IndianPhoneInput 
                    value={form.phone} 
                    onChange={(phone) => setForm((prev) => ({ ...prev, phone }))} 
                    className="indian-phone-field"
                    style={{ minHeight: 48, borderRadius: 14 }}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Tax Rate (%)</span>
                  <input type="number" min="0" step="0.1" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Trial Start Date</span>
                  <input type="date" value={form.trialStartsAt} onChange={(e) => setForm({ ...form, trialStartsAt: e.target.value })} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Trial End Date</span>
                  <input type="date" value={form.trialEndsAt} onChange={(e) => setForm({ ...form, trialEndsAt: e.target.value })} />
                </label>
                <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Internal Notes</span>
                  <textarea rows="2" placeholder="Internal notes about client..." value={form.internalNote} onChange={(e) => setForm({ ...form, internalNote: e.target.value })} />
                </label>

                {!editingId && (
                  <>
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Owner Full Name</span>
                      <input placeholder="Owner name" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Owner Email</span>
                      <input type="email" placeholder="Owner email" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} />
                    </label>
                    <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Owner Password</span>
                      <input type="password" placeholder="Owner password" value={form.ownerPassword} onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })} />
                    </label>
                  </>
                )}
              </div>

              {/* Feature Flags Selector in Edit Modal */}
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0f172a", display: "block" }}>Feature Access Control (Multi-Select)</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" onClick={() => { const all = {}; featureFlagKeys.forEach(k => all[k] = true); setFeatureFlags(all); }} style={{ background: "#10b981", color: "white", border: "none", padding: "4px 12px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>Select All</button>
                    <button type="button" onClick={() => { const none = {}; featureFlagKeys.forEach(k => none[k] = false); setFeatureFlags(none); }} style={{ background: "#ef4444", color: "white", border: "none", padding: "4px 12px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>Clear All</button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px 14px", background: "#f8fafc", padding: 14, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                  {featureFlagKeys.map((key) => {
                    const checked = featureFlags[key] !== false;
                    return (
                      <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#334155", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => setFeatureFlags(prev => ({ ...prev, [key]: e.target.checked }))}
                          style={{ width: 16, height: 16, accentColor: "#4f46e5" }}
                        />
                        <span style={{ textTransform: "capitalize" }}>{key.replace(/([A-Z])/g, " $1")}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <button type="submit" style={{ width: "100%", background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)", color: "white", fontWeight: 700, fontSize: "0.95rem", borderRadius: 12, padding: "14px 24px", minHeight: 48, cursor: "pointer", border: "none", boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)" }} disabled={saving}>
                  {saving ? (editingId ? "Saving Details..." : "Creating Workspace...") : (editingId ? "Save All Changes" : "Create Workspace")}
                </button>
              </div>
            </form>
            {status.error && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 12 }}>{status.error}</p>}
            {status.success && <p style={{ color: "#10b981", fontSize: 13, marginTop: 12 }}>{status.success}</p>}
          </div>
        </div>
      )}

      {status.error && <div style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fca5a5", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: "0.85rem" }}>{status.error}</div>}
      {status.success && <div style={{ background: "#ecfdf5", color: "#065f46", border: "1px solid #6ee7b7", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: "0.85rem" }}>{status.success}</div>}

      <div className="panel-card" style={{ maxWidth: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h3 style={{ margin: 0 }}>Tenant Directory</h3>
            <span className="badge" style={{ background: "#e0e7ff", color: "#4f46e5" }}>{salons.length} salons</span>
          </div>
          <button type="button" onClick={() => { resetForm(); setIsModalOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 38, padding: "8px 16px" }}>
            <span>+ Add New Salon</span>
          </button>
        </div>

        {loading ? (
          <PageLoader compact title="Loading salons" message="Fetching tenant directory..." />
        ) : salons.length ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#64748b", fontWeight: 700 }}>
                  <th style={{ padding: "12px 16px" }}>Salon Name</th>
                  <th style={{ padding: "12px 16px" }}>Slug / Business Type</th>
                  <th style={{ padding: "12px 16px" }}>Contact Info</th>
                  <th style={{ padding: "12px 16px" }}>Active Subscription</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {salons.map((salon) => {
                  const planName = salon.subscriptions?.[0]?.plan?.name || "No active plan";
                  const isBusy = busyId === salon.id;
                  let statusBg = "#f1f5f9", statusColor = "#64748b", statusLabel = salon.status;
                  if (salon.status === "ACTIVE") { statusBg = "#ecfdf5"; statusColor = "#10b981"; }
                  else if (salon.status === "SUSPENDED") { statusBg = "#fef2f2"; statusColor = "#ef4444"; }
                  else if (salon.status === "TRIAL") { statusBg = "#fffbeb"; statusColor = "#d97706"; statusLabel = "Pending"; }
                  
                  return (
                    <tr key={salon.id} onClick={() => openDetail(salon.id)} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.2s", cursor: "pointer" }} className="table-row-hover">
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>{salon.name}</td>
                      <td style={{ padding: "14px 16px", color: "#475569" }}>
                        <div>{salon.slug}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{salon.businessType || "Salon"}</div>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#475569" }}>
                        <div>{salon.email || "No email"}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{salon.phone || "No phone"}</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ background: "#f5f3ff", color: "#8b5cf6", fontWeight: 700, fontSize: 11, padding: "3px 8px", borderRadius: 100 }}>
                          {planName}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ background: statusBg, color: statusColor, fontWeight: 700, fontSize: 11, padding: "3px 8px", borderRadius: 100 }}>
                          {statusLabel}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button type="button" onClick={() => openDetail(salon.id)} disabled={isBusy} style={{ padding: "6px 12px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                            View Profile
                          </button>
                          <button type="button" onClick={() => startEdit(salon)} disabled={isBusy} style={{ padding: "6px 12px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                            Edit
                          </button>
                          {salon.status !== "ACTIVE" && (
                            <button type="button" onClick={() => updateStatus(salon.id, "ACTIVE")} disabled={isBusy} style={{ padding: "6px 12px", background: "#ecfdf5", color: "#10b981", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                              Activate
                            </button>
                          )}
                          {salon.status === "ACTIVE" && (
                            <button type="button" onClick={() => updateStatus(salon.id, "SUSPENDED")} disabled={isBusy} style={{ padding: "6px 12px", background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                              Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No salons found" message="Try broadening your search or click '+ Add New Salon'." />
        )}
      </div>

      {/* POPUP VIEW SALON PROFILE MODAL */}
      {isViewModalOpen && (
        <div className="modal-overlay" onClick={() => setIsViewModalOpen(false)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 900, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-header">
              <h3>Salon Profile Overview</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsViewModalOpen(false)}>&times;</button>
            </div>

            {detailLoading && <PageLoader compact title="Loading detail" message="Fetching salon profile..." />}

            {selectedSalon && !detailLoading && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: 16 }}>
                  <div>
                    <h2 style={{ margin: "0 0 4px", fontSize: "1.4rem", color: "#0f172a", fontWeight: 800 }}>{selectedSalon.name}</h2>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span className="badge" style={{ background: "#f5f3ff", color: "#6366f1", fontWeight: 700 }}>{selectedSalon.businessType || "Salon"}</span>
                      <span className="badge" style={{ background: selectedSalon.status === "ACTIVE" ? "#ecfdf5" : "#fef2f2", color: selectedSalon.status === "ACTIVE" ? "#10b981" : "#ef4444", fontWeight: 700 }}>{selectedSalon.status}</span>
                      <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Slug: <strong>{selectedSalon.slug}</strong></span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" onClick={() => { setIsViewModalOpen(false); startEdit(selectedSalon); }} style={{ padding: "8px 16px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                      Edit Details
                    </button>
                    <button type="button" onClick={() => impersonate(selectedSalon.id)} disabled={busyId === selectedSalon.id} style={{ background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)", color: "white", border: "none", minHeight: 40, padding: "0 18px", fontWeight: 700, borderRadius: 10, cursor: busyId === selectedSalon.id ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                      {busyId === selectedSalon.id ? "Entering..." : "Impersonate Workspace"}
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  {[
                    { label: "Branches", val: selectedSalon.branches?.length || 0, icon: Landmark, color: "#3b82f6", bg: "#eff6ff" },
                    { label: "Services", val: selectedSalon.services?.length || 0, icon: Scissors, color: "#8b5cf6", bg: "#f5f3ff" },
                    { label: "Guests", val: selectedSalon.customers?.length || 0, icon: Users, color: "#10b981", bg: "#ecfdf5" },
                    { label: "Accounts", val: selectedSalon.users?.length || 0, icon: UserCheck, color: "#f59e0b", bg: "#fffbeb" }
                  ].map((item, idx) => {
                    const IconComp = item.icon;
                    return (
                      <div key={idx} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px", display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: item.bg, color: item.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <IconComp size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>{item.val}</div>
                          <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>{item.label}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ padding: 18, background: "white", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                    <h4 style={{ margin: "0 0 12px", paddingBottom: 8, borderBottom: "1px solid #f1f5f9", fontSize: "0.95rem", color: "#0f172a", fontWeight: 700 }}>Contact & Information</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {[
                        { label: "Email", value: selectedSalon.email || "-", icon: Mail, color: "#3b82f6" },
                        { label: "Phone", value: selectedSalon.phone || "-", icon: Phone, color: "#10b981" },
                        { label: "Address", value: selectedSalon.address || "-", icon: MapPin, color: "#ef4444" },
                        { label: "Location", value: `${selectedSalon.city || "-"}, ${selectedSalon.country || "-"}`, icon: Globe, color: "#0d9488" },
                        { label: "Timezone", value: selectedSalon.timezone || "-", icon: Clock, color: "#f59e0b" },
                        { label: "Currency / Tax", value: `${selectedSalon.currency || "INR"} / ${String(selectedSalon.taxRate || 0)}%`, icon: CreditCard, color: "#8b5cf6" }
                      ].map((item, idx) => {
                        const IconComp = item.icon;
                        return (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <IconComp size={14} style={{ color: item.color }} />
                              <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>{item.label}</span>
                            </div>
                            <span style={{ fontSize: "0.8rem", color: "#0f172a", fontWeight: 700 }}>{item.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ padding: 18, background: "white", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                    <h4 style={{ margin: "0 0 12px", paddingBottom: 8, borderBottom: "1px solid #f1f5f9", fontSize: "0.95rem", color: "#0f172a", fontWeight: 700 }}>Active Subscriptions</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {selectedSalon.subscriptions?.length ? selectedSalon.subscriptions.map((sub) => {
                        const isActive = sub.status === "ACTIVE";
                        return (
                          <div key={sub.id} style={{ padding: "10px 12px", background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <strong style={{ fontSize: "0.9rem", color: "#0f172a" }}>{sub.plan?.name}</strong>
                              <span style={{ background: isActive ? "#ecfdf5" : "#fee2e2", color: isActive ? "#10b981" : "#ef4444", fontSize: "0.7rem", fontWeight: 750, padding: "2px 6px", borderRadius: 100 }}>{sub.status}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b", marginTop: 4 }}>
                              <span>Discount: ₹{Number(sub.manualDiscount || 0).toLocaleString("en-IN")}</span>
                              <span>Ends: {new Date(sub.endsAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        );
                      }) : <EmptyState title="No subscriptions" message="Records appear here." />}
                    </div>
                  </div>
                </div>

                {/* Feature Access Section - Multi-select without page reload */}
                <div style={{ padding: 18, background: "white", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#0f172a", fontWeight: 700 }}>Feature Access Control (Multi-Select Switches)</h4>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Toggle multiple features with instant updates</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, maxHeight: "260px", overflowY: "auto" }}>
                    {featureFlagKeys.map((key) => {
                      const isEnabled = selectedSalon.featureFlags?.[key] === true;
                      return (
                        <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 8 }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", textTransform: "capitalize" }}>{key.replace(new RegExp("([A-Z])", "g"), " $1")}</span>
                          <div 
                            onClick={() => toggleFeature(selectedSalon.id, key)}
                            style={{
                              width: 38,
                              height: 20,
                              borderRadius: 100,
                              background: isEnabled ? "#10b981" : "#cbd5e1",
                              position: "relative",
                              cursor: "pointer",
                              transition: "all 0.2s"
                            }}
                          >
                            <div style={{
                              width: 14,
                              height: 14,
                              borderRadius: "50%",
                              background: "white",
                              position: "absolute",
                              top: 3,
                              left: isEnabled ? 21 : 3,
                              transition: "all 0.2s",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>


              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
