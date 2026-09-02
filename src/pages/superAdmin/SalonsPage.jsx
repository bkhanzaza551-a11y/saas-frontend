import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import { useAlert } from "../../context/AlertContext";
import IndianPhoneInput from "../../components/IndianPhoneInput";
import CustomSelect from "../../components/CustomSelect";
import { Country, State, City } from "country-state-city";
import { MapPin, Scissors, Users, UserCheck, Mail, Phone, Shield, Activity, Landmark, Globe, Clock, CreditCard, Search, AlertCircle } from "lucide-react";

const businessTypes = ["Salon", "Spa", "Beauty Clinic", "Nail Studio", "Tattoo Studio", "Pet Grooming", "Wellness Center"];
const featureFlagKeys = [
  "pos", "appointments", "inventory", "crm", 
  "ecommerce", "catalogAnalytics", "feedback", "reports", "memberships",
  "packages", "couponsGiftCards", "whatsapp", "enquiries", "expenses",
  "attendance", "publicCatalog",
  "onlineOrders", "notifications", "auditLogs"
];
const defaultFlags = {
  pos: true, appointments: false, inventory: false, crm: true, 
  ecommerce: false,
  catalogAnalytics: false, feedback: false, reports: true, memberships: false, packages: false,
  couponsGiftCards: false, whatsapp: false, enquiries: false, expenses: false,
  attendance: false,
  publicCatalog: true, onlineOrders: false, notifications: true,
  auditLogs: true
};
const emptyForm = {
  name: "", ownerName: "", ownerEmail: "", ownerPhone: "", planId: "", city: "", address: "", state: "", country: "", pinCode: ""
};

export default function SalonsPage() {
  const navigate = useNavigate();
  const { showConfirm } = useAlert();
  const { auth } = useAuth();
  const user = auth?.user;
  const roleName = (user?.adminRole?.name || user?.systemRole || "Super Admin").toLowerCase();
  const isSuperAdmin = user?.systemRole === "SUPER_ADMIN" && (roleName.includes("admin") || !user?.adminRoleId);
  const isCustomerSuccess = roleName.includes("success") || roleName.includes("operation") || isSuperAdmin;
  const isSales = roleName.includes("sales");
  const isFinance = roleName.includes("finance");
  const isSupport = roleName.includes("support");

  const canAddSalon = isSuperAdmin || isSales || isCustomerSuccess;
  const canEditSalon = isSuperAdmin || isCustomerSuccess;
  const canSuspendSalon = isSuperAdmin;

  const [salons, setSalons] = useState([]);
  const [plans, setPlans] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const setQuery = (val) => {
    setSearchParams((prev) => {
      if (val) prev.set("q", val); else prev.delete("q");
      return prev;
    });
  };
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
const [planFilter, setPlanFilter] = useState(searchParams.get("plan") || "");
const [cityFilter, setCityFilter] = useState(searchParams.get("city") || "");
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [duplicateWarnings, setDuplicateWarnings] = useState([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const detailRef = useRef(null);
  const dupCheckTimerRef = useRef(null);

  const load = async (nextQuery = query, nextStatus = statusFilter, nextPlan = planFilter, nextCity = cityFilter) => {
    setLoading(true);
    setStatus({ error: "", success: "" });
    try {
      const res = await api.get("/super-admin/salons", {
        params: { ...(nextQuery ? { q: nextQuery } : {}), ...(nextStatus ? { status: nextStatus } : {}), ...(nextPlan ? { planId: nextPlan } : {}), ...(nextCity ? { city: nextCity } : {}) }
      });
      setSalons(res.data);
      const plansRes = await api.get("/super-admin/plans");
      setPlans(plansRes.data);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not load salons."), success: "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(query, statusFilter, planFilter, cityFilter);
  }, [query, statusFilter, planFilter, cityFilter]);

  useEffect(() => {
    if (editingId || !isModalOpen) {
      setDuplicateWarnings([]);
      return;
    }
    clearTimeout(dupCheckTimerRef.current);
    if (!form.ownerEmail && !form.ownerPhone && !form.name) {
      setDuplicateWarnings([]);
      return;
    }
    dupCheckTimerRef.current = setTimeout(async () => {
      setCheckingDuplicates(true);
      try {
        const res = await api.get("/super-admin/salons/check-duplicate", {
          params: {
            ownerEmail: form.ownerEmail,
            ownerPhone: form.ownerPhone,
            name: form.name,
            city: form.city
          }
        });
        if (res.data?.duplicates) {
          setDuplicateWarnings(res.data.duplicates);
        } else {
          setDuplicateWarnings([]);
        }
      } catch (e) {
        // ignore
      } finally {
        setCheckingDuplicates(false);
      }
    }, 450);
    return () => clearTimeout(dupCheckTimerRef.current);
  }, [form.ownerEmail, form.ownerPhone, form.name, form.city, isModalOpen, editingId]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
    setDuplicateWarnings([]);
    setIsModalOpen(false);
  };

  const createOrUpdateSalon = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setStatus({ error: "Salon name is required.", success: "" });
      return;
    }
    if (!form.city.trim()) {
      setStatus({ error: "City is required.", success: "" });
      return;
    }
    if (!editingId) {
      if (!form.ownerName || !form.ownerEmail || !form.ownerPhone || !form.planId) {
        setStatus({ error: "All fields are required.", success: "" });
        return;
      }
    }
    if (form.pinCode && !/^\d{6}$/.test(form.pinCode)) {
      setStatus({ error: "Postal Code must be exactly 6 digits.", success: "" });
      return;
    }
    setStatus({ error: "", success: "" });
    setSaving(true);
    try {
      const payload = { ...form };
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
  const [suspendModalData, setSuspendModalData] = useState(null);

  const openDetail = async (salonId) => {
    navigate(`/super-admin/salons/${salonId}`);
  };

  const startEdit = async (salon) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/super-admin/salons/${salon.id}`);
      const full = res.data;
      setEditingId(full.id);
      const ownerMembership = full.users?.find(u => u.role === "OWNER");
      const owner = ownerMembership?.user;
      const planId = full.subscriptions?.[0]?.planId || "";
      setForm({
        name: full.name || "",
        ownerName: owner?.name || "", ownerEmail: owner?.email || "", ownerPhone: owner?.phone || "", planId,
        city: full.city || "", address: full.address || "", state: full.state || "", country: full.country || "", pinCode: full.pinCode || ""
      });
      setIsModalOpen(true);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Failed to load salon details for editing"), success: "" });
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleFeature = async (salonId, key) => {
    let previousFlags = {};
    let nextFlags = {};
    const reason = window.prompt(`Enter reason for manual override of ${key}:`, "Special requirement");
    if (reason === null) return;
    
    setSelectedSalon((prev) => {
      if (!prev) return prev;
      previousFlags = { ...prev.featureFlags };
      nextFlags = { ...defaultFlags, ...(prev.featureFlags || {}), [key]: !(prev.featureFlags?.[key]) };
      return { ...prev, featureFlags: nextFlags };
    });
    setSalons((prev) =>
      prev.map((s) => {
        if (s.id !== salonId) return s;
        previousFlags = { ...s.featureFlags };
        nextFlags = { ...defaultFlags, ...(s.featureFlags || {}), [key]: !(s.featureFlags?.[key]) };
        return { ...s, featureFlags: nextFlags };
      })
    );
    try {
      await api.patch(`/super-admin/salons/${salonId}/features`, { featureFlags: nextFlags, overrideReason: reason });
      setStatus({ error: "", success: `Feature '${key}' updated with override reason.` });
    } catch (err) {
      setSelectedSalon((prev) => prev?.id === salonId ? { ...prev, featureFlags: previousFlags } : prev);
      setSalons((prev) => prev.map((s) => s.id === salonId ? { ...s, featureFlags: previousFlags } : s));
      setStatus({ error: formatApiError(err, "Could not toggle feature"), success: "" });
    }
  };

  const impersonate = async (salonId) => {
    setBusyId(salonId);
    try {
      const response = await api.post(`/super-admin/salons/${salonId}/impersonate`);
      const { token, user } = response.data;
      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        window.location.href = "/admin/dashboard";
      }
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not impersonate salon"), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const updateStatus = async (salonId, newStatus) => {
    if (newStatus === "SUSPENDED") {
      const target = salons.find(s => s.id === salonId) || selectedSalon;
      setSuspendModalData({
        salonId,
        salonName: target?.name || "Salon",
        reason: "Non-Payment / Overdue",
        internalNote: ""
      });
      return;
    }
    
    setBusyId(salonId);
    try {
      await api.patch(`/super-admin/salons/${salonId}/status`, { status: newStatus, reason: "Reactivated by admin" });
      setStatus({ error: "", success: `Salon status updated to ${newStatus}.` });
      await load();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not update status"), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const handleConfirmSuspend = async () => {
    if (!suspendModalData) return;
    const { salonId, reason, internalNote } = suspendModalData;
    if (!reason.trim()) {
      setStatus({ error: "Please specify a suspension reason.", success: "" });
      return;
    }
    setBusyId(salonId);
    try {
      await api.patch(`/super-admin/salons/${salonId}/status`, {
        status: "SUSPENDED",
        reason: reason.trim(),
        internalNote: internalNote || `Suspended by admin: ${reason.trim()}`
      });
      setStatus({ error: "", success: `Salon suspended successfully.` });
      setSuspendModalData(null);
      await load();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not suspend salon"), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const handleResendSalonOwnerInvite = async (salonId) => {
    setBusyId(salonId);
    try {
      const res = await api.post(`/super-admin/salons/${salonId}/resend-owner-invite`);
      setStatus({ error: "", success: res.data.message || "Invitation email resent to salon owner." });
    } catch (err) {
      setStatus({ error: formatApiError(err, "Failed to resend owner invitation"), success: "" });
    } finally {
      setBusyId("");
    }
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
            <p style={{ marginBottom: 0 }}>Create, activate, suspend, and inspect every salon from one control surface.</p>
          </div>
          <div className="badge-row" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="button" onClick={handleExportCustomers} style={{ background: "#eff6ff", color: "#3b82f6", padding: "8px 16px", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.background="#dbeafe"} onMouseOut={e => e.currentTarget.style.background="#eff6ff"}>
              Export Customers
            </button>
            <button type="button" onClick={handleExportInventory} style={{ background: "#ecfdf5", color: "#10b981", padding: "8px 16px", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.background="#d1fae5"} onMouseOut={e => e.currentTarget.style.background="#ecfdf5"}>
              Export Inventory
            </button>
            <span className="badge" style={{ padding: "8px 12px", background: "#f8fafc", color: "#64748b", borderRadius: 8, fontWeight: 700, fontSize: "0.85rem", border: "1px solid #e2e8f0" }}>Total {salons.length}</span>
          </div>
        </div>
      </div>
      <div style={{ background: "#fff", borderRadius: 16, padding: "24px", marginBottom: 24, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px -4px rgba(0, 0, 0, 0.05)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
          {/* Top Row: Search and Action Buttons */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div className="search-input-wrapper" style={{ flex: 1, minWidth: 280, position: "relative" }}>
              <div className="search-icon" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex", pointerEvents: "none", zIndex: 2 }}>
                <Search size={18} />
              </div>
              <input
                className="search-input-field"
                data-search="true"
                value={query}
                placeholder="Search salon by name, slug, email, phone..."
                onChange={(e) => setQuery(e.target.value)}
                style={{ width: "100%", height: 44, paddingLeft: 48, paddingRight: 14, borderRadius: 12, border: "1px solid #cbd5e1", fontSize: "0.92rem", color: "#1e293b", outline: "none", boxSizing: "border-box", transition: "all 0.2s", background: "#f8fafc" }}
                onFocus={e => { e.target.style.background = "#fff"; e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.08)"; }}
                onBlur={e => { e.target.style.background = "#f8fafc"; e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          {/* Bottom Row: Detailed Selectors */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Status</label>
              <CustomSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: "100%" }}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="TRIAL">Trial</option>
                <option value="PENDING_VERIFICATION">Pending Verification</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="EXPIRED">Expired</option>
              </CustomSelect>
            </div>
            
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Plan</label>
              <CustomSelect
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                style={{ width: "100%" }}
              >
                <option value="">All Plans</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </CustomSelect>
            </div>
            
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>City</label>
              <input 
                className="filter-input-compact"
                value={cityFilter} 
                placeholder="Filter by city..." 
                onChange={(e) => setCityFilter(e.target.value)} 
                style={{ height: 44, borderRadius: 12, border: "1px solid #cbd5e1", fontSize: "0.9rem", fontWeight: 500, background: "#f8fafc", color: "#334155", outline: "none", width: "100%", boxSizing: "border-box", transition: "all 0.2s" }}
                onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.08)"; }}
                onBlur={e => { e.target.style.borderColor = "#cbd5e1"; e.target.style.background = "#f8fafc"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* FULL EDIT SALON MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 840, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-header">
              <h3>{editingId ? "Edit Salon Details" : "Add New Salon"}</h3>
              <button type="button" className="modal-close-btn" onClick={resetForm}>&times;</button>
            </div>

            {duplicateWarnings.length > 0 && !editingId && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 16px", marginBottom: 4 }}>
                <div style={{ fontWeight: 700, color: "#b45309", fontSize: 13, display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span>⚠️ Duplicate Identifier Detected:</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: "#92400e" }}>
                  {duplicateWarnings.map((dup, idx) => (
                    <li key={idx} style={{ marginTop: 2 }}>{dup.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={createOrUpdateSalon} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Salon Name *</span>
                  <input placeholder="Salon name" value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Plan *</span>
                  <CustomSelect 
                    value={form.planId} 
                    onChange={(e) => setForm({ ...form, planId: e.target.value })}
                    options={plans.map(p => ({ label: p.name, value: p.id }))}
                    placeholder="Select Plan"
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Country</span>
                  <CustomSelect 
                    value={form.country} 
                    onChange={(e) => setForm({ ...form, country: e.target.value, state: "", city: "" })}
                    options={Country.getAllCountries().map(c => ({ label: c.name, value: c.name }))}
                    placeholder="Select Country"
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>State</span>
                  <CustomSelect 
                    value={form.state} 
                    onChange={(e) => setForm({ ...form, state: e.target.value, city: "" })}
                    options={
                      (() => {
                        const cCode = Country.getAllCountries().find(c => c.name === form.country)?.isoCode;
                        return cCode ? State.getStatesOfCountry(cCode).map(s => ({ label: s.name, value: s.name })) : [];
                      })()
                    }
                    placeholder="Select State"
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>City *</span>
                  <CustomSelect 
                    value={form.city} 
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    options={
                      (() => {
                        const cCode = Country.getAllCountries().find(c => c.name === form.country)?.isoCode;
                        const sCode = cCode ? State.getStatesOfCountry(cCode).find(s => s.name === form.state)?.isoCode : null;
                        return (cCode && sCode) ? City.getCitiesOfState(cCode, sCode).map(c => ({ label: c.name, value: c.name })) : [];
                      })()
                    }
                    placeholder="Select City"
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Address</span>
                  <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Postal Code</span>
                  <input placeholder="6-digit code" value={form.pinCode} maxLength={6} onChange={(e) => setForm({ ...form, pinCode: e.target.value.replace(/\D/g, "") })} />
                </label>

                {!editingId && (
                  <>
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Owner Full Name *</span>
                      <input placeholder="Owner name" value={form.ownerName} required onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Owner Email *</span>
                      <input type="email" placeholder="Owner email" value={form.ownerEmail} required onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} />
                    </label>
                    <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Owner Phone *</span>
                      <IndianPhoneInput 
                        value={form.ownerPhone} 
                        onChange={(phone) => setForm((prev) => ({ ...prev, ownerPhone: phone }))} 
                        className="indian-phone-field"
                        style={{ minHeight: 48, borderRadius: 14 }}
                      />
                    </label>
                  </>
                )}
              </div>

              <div style={{ marginTop: 8 }}>
                <button type="submit" style={{ width: "100%", background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)", color: "white", fontWeight: 700, fontSize: "0.95rem", borderRadius: 12, padding: "14px 24px", minHeight: 48, cursor: "pointer", border: "none", boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)" }} disabled={saving}>
                  {saving ? (editingId ? "Saving Details..." : "Creating Salon...") : (editingId ? "Save All Changes" : "Create Salon")}
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
            <h3 style={{ margin: 0 }}>All Salons</h3>
            <span className="badge" style={{ background: "#e0e7ff", color: "#4f46e5" }}>{salons.length} salons</span>
          </div>
          {canAddSalon && (
            <button type="button" onClick={() => { resetForm(); setIsModalOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 38, padding: "8px 16px" }}>
              <span>+ Add New Salon</span>
            </button>
          )}
        </div>

        {loading ? (
          <PageLoader compact title="Loading salons" message="Loading salons..." />
        ) : salons.length ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#64748b", fontWeight: 700 }}>
                  <th style={{ padding: "12px 16px" }}>Salon Name & Slug</th>
                  <th style={{ padding: "12px 16px" }}>City / Location</th>
                  <th style={{ padding: "12px 16px" }}>Owner & Verification</th>
                  <th style={{ padding: "12px 16px" }}>Active Plan</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", whiteSpace: "nowrap" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {salons.map((salon) => {
                  const planName = salon.subscriptions?.[0]?.plan?.name || "No active plan";
                  const isBusy = busyId === salon.id;
                  const ownerMembership = salon.users?.find(u => u.salonRole === "SALON_OWNER") || salon.users?.[0];
                  const ownerUser = ownerMembership?.user;
                  const isOwnerPending = ownerUser?.passwordSetupRequired;

                  let statusBg = "#f1f5f9", statusColor = "#64748b", statusLabel = salon.status;
                  if (salon.status === "ACTIVE") { statusBg = "#ecfdf5"; statusColor = "#10b981"; }
                  else if (salon.status === "SUSPENDED") { statusBg = "#fef2f2"; statusColor = "#ef4444"; }
                  else if (salon.status === "TRIAL") { statusBg = "#fffbeb"; statusColor = "#d97706"; statusLabel = "Trial"; }
                  
                  return (
                    <tr key={salon.id} onClick={() => openDetail(salon.id)} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.2s", cursor: "pointer" }} className="table-row-hover">
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>
                        <div>{salon.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginTop: 2 }}>{salon.slug}</div>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#475569" }}>
                        <div style={{ fontWeight: 600, color: "#1e293b" }}>{salon.city || "-"}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{salon.country || "India"}</div>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#475569" }}>
                        {ownerUser ? (
                          <div>
                            <div style={{ fontWeight: 600, color: "#0f172a" }}>{ownerUser.name}</div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>{ownerUser.email}</div>
                            <div style={{ marginTop: 4 }}>
                              {isOwnerPending ? (
                                <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>
                                  ⏳ Invitation Pending
                                </span>
                              ) : (
                                <span style={{ background: "#ecfdf5", color: "#065f46", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>
                                  ✓ Verified
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: 11 }}>No owner linked</span>
                        )}
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
                      <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "inline-flex", gap: 6, justifyContent: "flex-end", alignItems: "center", flexWrap: "nowrap" }}>
                          <button type="button" onClick={() => openDetail(salon.id)} disabled={isBusy} style={{ padding: "6px 12px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                            View
                          </button>
                          {isOwnerPending && canEditSalon && (
                            <button type="button" onClick={() => handleResendSalonOwnerInvite(salon.id)} disabled={isBusy} title="Resend Account Setup Invitation" style={{ padding: "6px 12px", background: "#e0e7ff", color: "#4338ca", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                              Resend Invite
                            </button>
                          )}
                          {canEditSalon && (
                            <button type="button" onClick={() => startEdit(salon)} disabled={isBusy} style={{ padding: "6px 12px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                              Edit
                            </button>
                          )}
                          {canSuspendSalon && salon.status !== "ACTIVE" && (
                            <button type="button" onClick={() => updateStatus(salon.id, "ACTIVE")} disabled={isBusy} style={{ padding: "6px 12px", background: "#ecfdf5", color: "#10b981", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                              Activate
                            </button>
                          )}
                          {canSuspendSalon && salon.status === "ACTIVE" && (
                            <button type="button" onClick={() => updateStatus(salon.id, "SUSPENDED")} disabled={isBusy} style={{ padding: "6px 12px", background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
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
                    {selectedSalon.status === "ACTIVE" ? (
                      <button type="button" onClick={() => updateStatus(selectedSalon.id, "SUSPENDED")} disabled={busyId === selectedSalon.id} style={{ padding: "8px 16px", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 8, cursor: busyId === selectedSalon.id ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13 }}>
                        Suspend
                      </button>
                    ) : selectedSalon.status === "SUSPENDED" ? (
                      <button type="button" onClick={() => updateStatus(selectedSalon.id, "ACTIVE")} disabled={busyId === selectedSalon.id} style={{ padding: "8px 16px", background: "#dcfce7", color: "#166534", border: "none", borderRadius: 8, cursor: busyId === selectedSalon.id ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13 }}>
                        Unsuspend
                      </button>
                    ) : null}
                    <button type="button" onClick={() => impersonate(selectedSalon.id)} disabled={busyId === selectedSalon.id} style={{ background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)", color: "white", border: "none", minHeight: 40, padding: "0 18px", fontWeight: 700, borderRadius: 10, cursor: busyId === selectedSalon.id ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                      {busyId === selectedSalon.id ? "Entering..." : "Impersonate Salon"}
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
                              <span>Price: <strong style={{ color: "#0f172a" }}>₹{Number(sub.amount != null ? sub.amount : (sub.plan?.monthlyPrice || 0)).toLocaleString("en-IN")}</strong>/mo</span>
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
                          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", textTransform: "capitalize" }}>
                            {key === "onlineOrders" ? "Online Booking" : key.replace(new RegExp("([A-Z])", "g"), " $1")}
                          </span>
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

                {/* Data Export Section */}
                <div style={{ padding: 18, background: "white", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#0f172a", fontWeight: 700 }}>Data Export</h4>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Export salon data to Excel (.xlsx)</span>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button type="button" onClick={() => exportData(selectedSalon.id, 'customers')} style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, color: "#334155", display: "flex", alignItems: "center", gap: 6 }}>
                      <Activity size={16} /> Export Customers
                    </button>
                    <button type="button" onClick={() => exportData(selectedSalon.id, 'inventory')} style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, color: "#334155", display: "flex", alignItems: "center", gap: 6 }}>
                      <Activity size={16} /> Export Inventory
                    </button>
                  </div>
                </div>


              </div>
            )}
          </div>
        </div>
      )}

      {/* Suspend Salon Modal */}
      {suspendModalData && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
          <div style={{ background: "white", width: "100%", maxWidth: 480, borderRadius: 16, padding: "24px 28px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#dc2626" }}>
                <AlertCircle size={20} />
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#991b1b" }}>Suspend Salon</h3>
              </div>
              <button onClick={() => setSuspendModalData(null)} style={{ border: "none", background: "#f1f5f9", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            <p style={{ margin: "0 0 16px", fontSize: "0.85rem", color: "#475569" }}>
              Suspending <strong>{suspendModalData.salonName}</strong> will immediately disable customer booking, staff access, and pause active subscriptions.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 6 }}>Reason for Suspension *</label>
                <CustomSelect
                  value={suspendModalData.reason}
                  onChange={(e) => setSuspendModalData({ ...suspendModalData, reason: e.target.value })}
                  style={{ width: "100%" }}
                >
                  <option value="Non-Payment / Overdue">Non-Payment / Overdue</option>
                  <option value="Terms of Service Violation">Terms of Service Violation</option>
                  <option value="Salon Owner Request">Salon Owner Request</option>
                  <option value="Fraud / Suspicious Activity">Fraud / Suspicious Activity</option>
                  <option value="Other">Other</option>
                </CustomSelect>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 6 }}>Internal Notes</label>
                <textarea
                  rows={3}
                  value={suspendModalData.internalNote}
                  onChange={(e) => setSuspendModalData({ ...suspendModalData, internalNote: e.target.value })}
                  placeholder="Add specific details or audit notes for this suspension..."
                  style={{ width: "100%", borderRadius: 8, border: "1px solid #cbd5e1", padding: 10, fontSize: "0.85rem", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setSuspendModalData(null)}
                  style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #cbd5e1", background: "white", color: "#64748b", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSuspend}
                  disabled={busyId === suspendModalData.salonId}
                  style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#dc2626", color: "white", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  {busyId === suspendModalData.salonId ? "Suspending..." : "Confirm Suspension"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
