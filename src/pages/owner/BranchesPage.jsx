import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "../../api/client";
import IndianPhoneInput from "../../components/IndianPhoneInput";
import MapPicker from "../../components/MapPicker";
import CustomSelect from "../../components/CustomSelect";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import { formatApiError } from "../../utils/apiError";
import { useBranch } from "../../context/BranchContext";
import { Search, Edit3, MapPin, X, Building2, Trash2, Plus, AlertTriangle } from "lucide-react";

const emptyForm = { name: "", phone: "", email: "", address: "", businessHours: "", weeklyOff: "", latitude: "", longitude: "", geofenceRadiusMeters: "200" };

export default function BranchesPage() {
  const { refetch: refetchBranches } = useBranch();
  const [rows, setRows] = useState([]);
  const [limitInfo, setLimitInfo] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [status, setStatus] = useState({ error: "", success: "", loading: true });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [query, setQuery] = useState("");

  const heading = useMemo(() => (editingId ? "Update Branch" : "Add New Branch"), [editingId]);

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

  const load = useCallback(async () => {
    try {
      const [branchRes, limitRes] = await Promise.all([
        api.get("/owner/branches"),
        api.get("/owner/branches/limit-info")
      ]);
      setRows(branchRes.data || []);
      setLimitInfo(limitRes.data);
    } catch (err) {
      console.error("Failed to load branches", err);
    } finally {
      setStatus((current) => ({ ...current, loading: false }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
    setFormKey((k) => k + 1);
    setShowModal(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setStatus(s => ({ ...s, error: "", success: "" }));
    const payload = {
      ...form,
      latitude: form.latitude === "" ? null : Number(form.latitude),
      longitude: form.longitude === "" ? null : Number(form.longitude),
      geofenceRadiusMeters: form.geofenceRadiusMeters === "" ? null : Number(form.geofenceRadiusMeters)
    };
    try {
      if (editingId) {
        await api.patch(`/owner/branches/${editingId}`, payload);
        setStatus(s => ({ ...s, error: "", success: "Branch updated successfully." }));
      } else {
        await api.post("/owner/branches", payload);
        setStatus(s => ({ ...s, error: "", success: "Branch created successfully." }));
      }
      resetForm();
      await load();
      await refetchBranches();
    } catch (error) {
      console.error("[BranchForm] submit failed:", error);
      setStatus(s => ({ ...s, error: formatApiError(error, "Could not save branch"), success: "" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteBranch = async (branchId) => {
    if (!window.confirm("Delete this branch? This cannot be undone.")) return;
    try {
      await api.delete(`/owner/branches/${branchId}`);
      setStatus(s => ({ ...s, error: "", success: "Branch deleted." }));
      if (editingId === branchId) resetForm();
      await load();
      await refetchBranches();
    } catch (error) {
      setStatus(s => ({ ...s, error: formatApiError(error, "Failed to delete branch"), success: "" }));
    }
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
    setShowModal(true);
  };

  const filteredRows = rows.filter(r => 
    r.name.toLowerCase().includes(query.toLowerCase()) || 
    (r.phone && r.phone.includes(query)) || 
    (r.email && r.email.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="page-shell">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Branches</h1>
        <p className="muted" style={{ margin: "4px 0 8px 0" }}>Manage your salon locations, add new branches, and update their details.</p>
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

      {/* Plan Limit Info Stats */}
      {limitInfo && (
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

      <div className="panel-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: 16, borderBottom: "1px solid #e2e8f0", display: "flex", gap: 12, backgroundColor: "#fff", alignItems: "center" }}>
          <div style={{ flex: 1, maxWidth: 320, position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: 10, color: "#64748b" }} />
            <input 
              placeholder="Search branches..." 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              style={{ width: "100%", padding: "8px 12px 8px 36px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 14 }}
            />
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            disabled={limitInfo && limitInfo.remaining <= 0}
            style={{
              display: "flex", alignItems: "center", gap: 6, marginLeft: "auto",
              background: limitInfo && limitInfo.remaining <= 0 ? "#e2e8f0" : "linear-gradient(135deg, #4f46e5, #3b82f6)",
              color: limitInfo && limitInfo.remaining <= 0 ? "#94a3b8" : "white",
              fontWeight: 700, borderRadius: 10, padding: "10px 20px", border: "none",
              cursor: limitInfo && limitInfo.remaining <= 0 ? "not-allowed" : "pointer",
              fontSize: "0.88rem", whiteSpace: "nowrap"
            }}
          >
            <Plus size={16} /> Add Branch
          </button>
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
              {status.loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#64748b" }}><PageLoader title="Loading branches" /></td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 32, textAlign: "center" }}>
                    <EmptyState 
                      title="No branches found" 
                      message={query ? "No branches matched your search query." : "Create the first branch to start assigning services, staff, and inventory."} 
                    />
                  </td>
                </tr>
              ) : (
                filteredRows.map((branch) => (
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
                      <div style={{ fontSize: 11, marginTop: 4, marginLeft: 20 }}>
                        {branch.latitude && branch.longitude ? (
                          <span style={{ color: "#059669", fontWeight: 600 }}>📍 Geo: {branch.geofenceRadiusMeters ?? 200}m radius (GPS Active)</span>
                        ) : (
                          <span style={{ color: "#d97706", fontWeight: 500 }}>⚠️ Radius: {branch.geofenceRadiusMeters ?? 200}m (GPS pin not set on map)</span>
                        )}
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

      {showModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ backgroundColor: "#fff", width: "100%", maxWidth: 650, borderRadius: 12, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#0f172a" }}>{heading}</h3>
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="muted" style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Branch Location (Geofencing for Attendance)</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: form.latitude && form.longitude ? "#059669" : "#d97706" }}>
                      {form.latitude && form.longitude ? `📍 Selected: ${Number(form.latitude).toFixed(4)}, ${Number(form.longitude).toFixed(4)}` : "⚠️ Click map or use current location"}
                    </span>
                  </div>
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
              
              {status.error && <div style={{ marginTop: 16, padding: "10px 14px", backgroundColor: "#fef2f2", color: "#b91c1c", borderRadius: 6, fontSize: 13 }}>{status.error}</div>}
              {status.success && <div style={{ marginTop: 16, padding: "10px 14px", backgroundColor: "#f0fdf4", color: "#15803d", borderRadius: 6, fontSize: 13 }}>{status.success}</div>}
            </div>
            
            <div style={{ padding: "16px 20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 12, backgroundColor: "#f8fafc", borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
              <button type="button" className="secondary-button" onClick={resetForm} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: 500, cursor: "pointer" }}>Cancel</button>
              <button type="submit" form="branch-form" className="primary-button" disabled={isSubmitting} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "linear-gradient(135deg, #4f46e5, #3b82f6)", color: "#fff", fontWeight: 500, cursor: "pointer" }}>
                {isSubmitting ? "Saving..." : (editingId ? "Update Branch" : "Add Branch")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
