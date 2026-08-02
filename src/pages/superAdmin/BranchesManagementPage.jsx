import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import IndianPhoneInput from "../../components/IndianPhoneInput";
import MapPicker from "../../components/MapPicker";
import CustomSelect from "../../components/CustomSelect";
import { Building2, MapPin, Edit3, Trash2, Plus, AlertTriangle, Search, ChevronDown, ChevronUp, X } from "lucide-react";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  businessHours: "",
  weeklyOff: "",
  latitude: "",
  longitude: "",
  geofenceRadiusMeters: "200"
};

export default function BranchesManagementPage() {
  const [salons, setSalons] = useState([]);
  const [selectedSalonId, setSelectedSalonId] = useState("");
  const [branches, setBranches] = useState([]);
  const [limitInfo, setLimitInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [showForm, setShowForm] = useState(false);
  const [salonSearch, setSalonSearch] = useState("");
  const [salonDropdownOpen, setSalonDropdownOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [query, setQuery] = useState("");

  const timeOptions = useMemo(() => {
    const options = [];
    for(let i=0; i<24; i++) {
      const h = i % 12 === 0 ? 12 : i % 12;
      const ampm = i < 12 ? "AM" : "PM";
      const hs = h < 10 ? `0${h}` : h;
      options.push(`${hs}:00 ${ampm}`);
      options.push(`${hs}:30 ${ampm}`);
    }
    return options;
  }, []);

  const loadSalons = async () => {
    try {
      const res = await api.get("/super-admin/salons");
      setSalons(res.data || []);
    } catch (err) {
      console.error("Failed to load salons", err);
    }
  };

  useEffect(() => { loadSalons(); }, []);

  const loadBranches = useCallback(async () => {
    if (!selectedSalonId) { setBranches([]); setLimitInfo(null); setLoading(false); return; }
    setLoading(true);
    try {
      const [branchRes, limitRes] = await Promise.all([
        api.get(`/super-admin/branches?salonId=${selectedSalonId}`),
        api.get(`/super-admin/branches/limit-info?salonId=${selectedSalonId}`)
      ]);
      setBranches(branchRes.data || []);
      setLimitInfo(limitRes.data);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Failed to load branches"), success: "" });
    } finally {
      setLoading(false);
    }
  }, [selectedSalonId]);

  useEffect(() => { loadBranches(); }, [loadBranches]);

  const resetForm = () => { 
    setForm(emptyForm); 
    setEditingId(""); 
    setFormKey(k => k + 1);
    setShowForm(false); 
    setStatus({ error: "", success: "" }); 
  };

  const startEdit = (branch) => {
    setEditingId(branch.id);
    setForm({
      name: branch.name || "",
      phone: branch.phone || "",
      email: branch.email || "",
      address: branch.address || "",
      businessHours: branch.businessHours || "",
      weeklyOff: branch.weeklyOff || "",
      latitude: branch.latitude ?? "",
      longitude: branch.longitude ?? "",
      geofenceRadiusMeters: branch.geofenceRadiusMeters ?? "200"
    });
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setStatus({ error: "Branch name is required.", success: "" }); return; }
    if (!selectedSalonId) { setStatus({ error: "Please select a salon first.", success: "" }); return; }
    setSaving(true);
    
    const payload = {
      ...form,
      latitude: form.latitude === "" ? null : Number(form.latitude),
      longitude: form.longitude === "" ? null : Number(form.longitude),
      geofenceRadiusMeters: form.geofenceRadiusMeters === "" ? null : Number(form.geofenceRadiusMeters),
      salonId: selectedSalonId
    };

    try {
      if (editingId) {
        await api.patch(`/super-admin/branches/${editingId}`, payload);
        setStatus({ error: "", success: "Branch updated successfully." });
      } else {
        await api.post("/super-admin/branches", payload);
        setStatus({ error: "", success: "Branch created successfully." });
      }
      resetForm();
      await loadBranches();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not save branch"), success: "" });
    } finally {
      setSaving(false);
    }
  };

  const deleteBranch = async (id) => {
    if (!window.confirm("Delete this branch? This cannot be undone.")) return;
    try {
      await api.delete(`/super-admin/branches/${id}`);
      setStatus({ error: "", success: "Branch deleted." });
      await loadBranches();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Failed to delete"), success: "" });
    }
  };

  const selectedSalon = salons.find((s) => s.id === selectedSalonId);

  const filteredSalons = salons.filter(s =>
    s.name.toLowerCase().includes(salonSearch.toLowerCase()) ||
    (s.status || "").toLowerCase().includes(salonSearch.toLowerCase())
  );
  
  const filteredBranches = branches.filter(r => 
    r.name.toLowerCase().includes(query.toLowerCase()) || 
    (r.phone && r.phone.includes(query)) || 
    (r.email && r.email.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="page-shell super-admin-page">
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0 }}>Branch Management</h1>
            <p style={{ marginBottom: 0 }}>Create and manage branches for salons. Select a salon to view and manage its branches.</p>
          </div>
        </div>
      </div>

      {status.error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={16} /> {status.error}
          <button onClick={() => setStatus(s => ({ ...s, error: "" }))} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#991b1b" }}><X size={14} /></button>
        </div>
      )}
      {status.success && (
        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 8 }}>
          {status.success}
          <button onClick={() => setStatus(s => ({ ...s, success: "" }))} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#065f46" }}><X size={14} /></button>
        </div>
      )}

      {/* Salon Selector - Searchable Dropdown */}
      <div className="panel-card" style={{ marginBottom: 20, padding: 20, position: "relative", zIndex: 100 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ position: "relative", minWidth: 320, flex: "1 1 320px" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#475569", marginBottom: 6 }}>Select Salon *</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Search salons by name or status..."
                value={salonDropdownOpen ? salonSearch : (selectedSalon ? `${selectedSalon.name} (${selectedSalon.status || "TRIAL"})` : "")}
                onFocus={() => { setSalonDropdownOpen(true); setSalonSearch(""); }}
                onChange={(e) => { setSalonSearch(e.target.value); if (!salonDropdownOpen) setSalonDropdownOpen(true); }}
                style={{ width: "100%", padding: "10px 40px 10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "0.9rem", background: "#fff", outline: "none", boxSizing: "border-box" }}
              />
              <button type="button" onClick={() => setSalonDropdownOpen(!salonDropdownOpen)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}>
                {salonDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            {salonDropdownOpen && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 10px 25px rgba(0,0,0,0.1)", zIndex: 50, maxHeight: 280, overflowY: "auto" }}>
                <div
                  onClick={() => { setSelectedSalonId(""); setSalonDropdownOpen(false); setSalonSearch(""); resetForm(); }}
                  style={{ padding: "10px 14px", cursor: "pointer", fontSize: "0.88rem", color: "#94a3b8", borderBottom: "1px solid #f1f5f9" }}
                >
                  -- Choose a salon --
                </div>
                {filteredSalons.map(s => (
                  <div
                    key={s.id}
                    onClick={() => { setSelectedSalonId(s.id); setSalonDropdownOpen(false); setSalonSearch(""); resetForm(); }}
                    style={{ padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", background: s.id === selectedSalonId ? "#eff6ff" : "#fff", borderBottom: "1px solid #f8fafc", transition: "background 0.1s" }}
                    onMouseEnter={(e) => { if (s.id !== selectedSalonId) e.currentTarget.style.background = "#f8fafc"; }}
                    onMouseLeave={(e) => { if (s.id !== selectedSalonId) e.currentTarget.style.background = "#fff"; }}
                  >
                    <span style={{ fontWeight: s.id === selectedSalonId ? 700 : 500, color: "#0f172a", fontSize: "0.88rem" }}>{s.name}</span>
                    <span style={{ fontSize: "0.72rem", fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: s.status === "ACTIVE" ? "#dcfce7" : s.status === "TRIAL" ? "#fef3c7" : s.status === "EXPIRED" ? "#fee2e2" : "#f1f5f9", color: s.status === "ACTIVE" ? "#166534" : s.status === "TRIAL" ? "#92400e" : s.status === "EXPIRED" ? "#991b1b" : "#64748b" }}>
                      {s.status || "TRIAL"}
                    </span>
                  </div>
                ))}
                {filteredSalons.length === 0 && (
                  <div style={{ padding: "14px", textAlign: "center", color: "#94a3b8", fontSize: "0.85rem" }}>No salons found</div>
                )}
              </div>
            )}
          </div>

          {selectedSalonId && (
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              disabled={limitInfo && limitInfo.remaining <= 0}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: limitInfo && limitInfo.remaining <= 0 ? "#e2e8f0" : "linear-gradient(135deg, #4f46e5, #3b82f6)",
                color: limitInfo && limitInfo.remaining <= 0 ? "#94a3b8" : "white",
                fontWeight: 700, borderRadius: 10, padding: "10px 20px", border: "none",
                cursor: limitInfo && limitInfo.remaining <= 0 ? "not-allowed" : "pointer",
                fontSize: "0.88rem", whiteSpace: "nowrap"
              }}
            >
              <Plus size={16} /> Add Branch
            </button>
          )}
        </div>
      </div>

      {/* Click-away handler for dropdown */}
      {salonDropdownOpen && <div onClick={() => setSalonDropdownOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />}

      {/* Limit Info Stats */}
      {selectedSalonId && limitInfo && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
          <div className="panel-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}><Building2 size={18} color="#2563eb" /></div>
            <div>
              <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Plan</div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>{limitInfo.planName}</div>
            </div>
          </div>
          <div className="panel-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}><Building2 size={18} color="#16a34a" /></div>
            <div>
              <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Branches Used</div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#2563eb" }}>{limitInfo.branchCount}</div>
            </div>
          </div>
          <div className="panel-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}><Building2 size={18} color="#6366f1" /></div>
            <div>
              <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Plan Limit</div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#6366f1" }}>{limitInfo.branchLimit}</div>
            </div>
          </div>
          <div className="panel-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, background: limitInfo.remaining > 0 ? "#f0fdf4" : "#fef2f2" }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: limitInfo.remaining > 0 ? "#dcfce7" : "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertTriangle size={18} color={limitInfo.remaining > 0 ? "#16a34a" : "#dc2626"} />
            </div>
            <div>
              <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Remaining</div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: limitInfo.remaining > 0 ? "#16a34a" : "#dc2626" }}>{limitInfo.remaining}</div>
            </div>
          </div>
        </div>
      )}

      {!selectedSalonId && (
        <div className="panel-card" style={{ padding: 60, textAlign: "center" }}>
          <Building2 size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <p style={{ color: "#94a3b8", fontSize: "1rem", margin: 0 }}>Select a salon above to manage its branches.</p>
        </div>
      )}

      {selectedSalonId && (
        <>
          <div className="panel-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: 16, borderBottom: "1px solid #e2e8f0", display: "flex", gap: 12, backgroundColor: "#fff" }}>
              <div style={{ flex: 1, maxWidth: 320, position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: 12, top: 10, color: "#64748b" }} />
                <input 
                  className="search-input-field"
                  placeholder="Search branches..." 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                  style={{ width: "100%", padding: "8px 12px 8px 36px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 14 }}
                />
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: 800 }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569", fontSize: 13 }}>Branch Name</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569", fontSize: 13 }}>Contact Details</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569", fontSize: 13 }}>Timings</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569", fontSize: 13 }}>Location</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569", fontSize: 13 }}>Stats</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569", fontSize: 13, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#64748b" }}><PageLoader title="Loading branches" /></td>
                    </tr>
                  ) : filteredBranches.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 32, textAlign: "center" }}>
                        <EmptyState 
                          title="No branches found" 
                          message={query ? "No branches matched your search query." : "Create the first branch to start assigning services, staff, and inventory."} 
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredBranches.map((branch) => (
                      <tr key={branch.id} style={{ borderBottom: "1px solid #f1f5f9" }} className="table-row-hover">
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 14 }}>{branch.name}</div>
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: branch.isActive ? "#dcfce7" : "#f1f5f9", color: branch.isActive ? "#166534" : "#94a3b8", display: "inline-block", marginTop: 4 }}>
                            {branch.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontSize: 13, color: "#334155" }}>{branch.phone || "No phone"}</div>
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{branch.email || "No email"}</div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontSize: 13, color: "#334155" }}>{branch.businessHours || "Not set"}</div>
                          <div style={{ fontSize: 12, color: "#ef4444", marginTop: 2 }}>{branch.weeklyOff ? `Off: ${branch.weeklyOff}` : "No weekly off"}</div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 13, color: "#475569" }}>
                            <MapPin size={14} style={{ marginTop: 2, flexShrink: 0, color: "#94a3b8" }} />
                            <span style={{ maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {branch.address || "No address"}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, marginLeft: 20 }}>
                            {branch.latitude && branch.longitude ? `Geo: ${branch.geofenceRadiusMeters}m radius` : "Location not set"}
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ padding: "2px 6px", backgroundColor: "#f1f5f9", borderRadius: 4, fontSize: 11, color: "#475569" }}>Users: {branch._count?.users || 0}</span>
                            <span style={{ padding: "2px 6px", backgroundColor: "#f1f5f9", borderRadius: 4, fontSize: 11, color: "#475569" }}>Services: {branch._count?.services || 0}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                            <button type="button" onClick={() => startEdit(branch)} className="icon-btn" style={{ padding: 6, color: "#64748b", background: "none", border: "none", cursor: "pointer" }} title="Edit Branch">
                              <Edit3 size={16} />
                            </button>
                            <button type="button" onClick={() => deleteBranch(branch.id)} className="icon-btn" style={{ padding: 6, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }} title="Delete Branch">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ backgroundColor: "#fff", width: "100%", maxWidth: 650, borderRadius: 12, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#0f172a" }}>{editingId ? "Edit Branch" : "Add New Branch"}</h3>
              <button type="button" onClick={resetForm} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 4 }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
              <form id="branch-form" onSubmit={submit} className="settings-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
                <label className="settings-input-group" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span className="muted" style={{ fontSize: 13, fontWeight: 500, color: "#475569" }}>Branch name <span style={{color: "#ef4444"}}>*</span></span>
                  <input required value={form.name} placeholder="e.g. Downtown Styluxe" onChange={(event) => setForm({ ...form, name: event.target.value })} style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6 }} />
                </label>
                
                <label className="settings-input-group" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span className="muted" style={{ fontSize: 13, fontWeight: 500, color: "#475569" }}>Phone</span>
                  <IndianPhoneInput value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
                </label>
                
                <label className="settings-input-group" style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6 }}>
                  <span className="muted" style={{ fontSize: 13, fontWeight: 500, color: "#475569" }}>Email</span>
                  <input value={form.email} type="email" placeholder="e.g. downtown@styluxe.com" onChange={(event) => setForm({ ...form, email: event.target.value })} style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6 }} />
                </label>

                <div className="settings-input-group" style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  <span className="muted" style={{ fontSize: 13, fontWeight: 500, color: "#475569" }}>Branch Location (Geofencing for Attendance)</span>
                  <div style={{ border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden" }}>
                    <MapPicker
                      key={formKey}
                      latitude={form.latitude}
                      longitude={form.longitude}
                      onChange={({ latitude, longitude }) => setForm((current) => ({ ...current, latitude, longitude }))}
                      address={form.address}
                      onAddressChange={(addr) => setForm((current) => ({ ...current, address: addr }))}
                    />
                  </div>
                </div>

                <label className="settings-input-group" style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6 }}>
                  <span className="muted" style={{ fontSize: 13, fontWeight: 500, color: "#475569" }}>Geofence radius (meters)</span>
                  <input type="number" min="10" max="1000" value={form.geofenceRadiusMeters} onChange={(event) => setForm({ ...form, geofenceRadiusMeters: event.target.value })} style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6 }} />
                </label>
                
                <label className="settings-input-group" style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6 }}>
                  <span className="muted" style={{ fontSize: 13, fontWeight: 500, color: "#475569" }}>Address</span>
                  <textarea rows={2} style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14, fontFamily: "inherit", resize: "vertical" }} value={form.address} placeholder="Full street address..." onChange={(event) => setForm({ ...form, address: event.target.value })} />
                </label>
                
                <div className="settings-input-group" style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6 }}>
                  <span className="muted" style={{ fontSize: 13, fontWeight: 500, color: "#475569" }}>Business hours</span>
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <CustomSelect 
                        value={form.businessHours.split(" - ")[0] || ""} 
                        onChange={(e) => {
                          const val = e.target.value;
                          const close = form.businessHours.split(" - ")[1] || "";
                          setForm({ ...form, businessHours: `${val}${close ? ` - ${close}` : " - "}` });
                        }}
                        options={timeOptions.map(t => ({ label: t, value: t }))}
                        placeholder="Open Time"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <CustomSelect 
                        value={form.businessHours.split(" - ")[1] || ""} 
                        onChange={(e) => {
                          const val = e.target.value;
                          const open = form.businessHours.split(" - ")[0] || "";
                          setForm({ ...form, businessHours: `${open ? `${open} - ` : " - "}${val}` });
                        }}
                        options={timeOptions.map(t => ({ label: t, value: t }))}
                        placeholder="Close Time"
                      />
                    </div>
                  </div>
                </div>
                
                <label className="settings-input-group" style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6 }}>
                  <span className="muted" style={{ fontSize: 13, fontWeight: 500, color: "#475569" }}>Weekly off</span>
                  <CustomSelect 
                    value={form.weeklyOff} 
                    onChange={(event) => setForm({ ...form, weeklyOff: event.target.value })} 
                    options={[
                      { label: "None / Open 7 days", value: "" },
                      { label: "Monday", value: "Monday" },
                      { label: "Tuesday", value: "Tuesday" },
                      { label: "Wednesday", value: "Wednesday" },
                      { label: "Thursday", value: "Thursday" },
                      { label: "Friday", value: "Friday" },
                      { label: "Saturday", value: "Saturday" },
                      { label: "Sunday", value: "Sunday" }
                    ]}
                  />
                </label>
                
              </form>
            </div>
            
            <div style={{ padding: "16px 20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 12, backgroundColor: "#f8fafc", borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
              <button type="button" className="secondary-button" onClick={resetForm} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: 500, cursor: "pointer" }}>Cancel</button>
              <button type="submit" form="branch-form" className="primary-button" disabled={saving} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "linear-gradient(135deg, #4f46e5, #3b82f6)", color: "#fff", fontWeight: 500, cursor: "pointer" }}>
                {saving ? "Saving..." : (editingId ? "Update Branch" : "Add Branch")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
