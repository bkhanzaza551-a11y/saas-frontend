import { useEffect, useState, useCallback } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import { Building2, MapPin, Phone, Mail, Clock, Edit2, Trash2, Plus, AlertTriangle } from "lucide-react";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  businessHours: "",
  weeklyOff: "",
  geofenceRadiusMeters: 200
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

  const resetForm = () => { setForm(emptyForm); setEditingId(""); setShowForm(false); setStatus({ error: "", success: "" }); };

  const startEdit = (b) => {
    setEditingId(b.id);
    setForm({ name: b.name || "", phone: b.phone || "", email: b.email || "", address: b.address || "", businessHours: b.businessHours || "", weeklyOff: b.weeklyOff || "", geofenceRadiusMeters: b.geofenceRadiusMeters || 200 });
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setStatus({ error: "Branch name is required.", success: "" }); return; }
    if (!selectedSalonId) { setStatus({ error: "Please select a salon first.", success: "" }); return; }
    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/super-admin/branches/${editingId}`, form);
        setStatus({ error: "", success: "Branch updated." });
      } else {
        await api.post("/super-admin/branches", { ...form, salonId: selectedSalonId });
        setStatus({ error: "", success: "Branch created." });
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

      {status.error && <div style={{ background: "#fef2f2", color: "#991b1b", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: "0.85rem" }}>{status.error}</div>}
      {status.success && <div style={{ background: "#ecfdf5", color: "#065f46", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: "0.85rem" }}>{status.success}</div>}

      {/* Salon Selector */}
      <div className="panel-card" style={{ marginBottom: 20, padding: 24 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 400 }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Select Salon *</span>
          <select value={selectedSalonId} onChange={(e) => { setSelectedSalonId(e.target.value); resetForm(); }} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "0.9rem" }}>
            <option value="">-- Choose a salon --</option>
            {salons.map((s) => (<option key={s.id} value={s.id}>{s.name} ({s.status || "TRIAL"})</option>))}
          </select>
        </label>
      </div>

      {/* Limit Info Banner */}
      {selectedSalonId && limitInfo && (
        <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          <div className="panel-card" style={{ flex: 1, minWidth: 180, padding: "16px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Plan</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>{limitInfo.planName}</div>
          </div>
          <div className="panel-card" style={{ flex: 1, minWidth: 180, padding: "16px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Branches Used</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#2563eb" }}>{limitInfo.branchCount}</div>
          </div>
          <div className="panel-card" style={{ flex: 1, minWidth: 180, padding: "16px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Plan Limit</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#6366f1" }}>{limitInfo.branchLimit}</div>
          </div>
          <div className="panel-card" style={{ flex: 1, minWidth: 180, padding: "16px 20px", textAlign: "center", background: limitInfo.remaining > 0 ? "#f0fdf4" : "#fef2f2" }}>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Remaining</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: limitInfo.remaining > 0 ? "#16a34a" : "#dc2626" }}>{limitInfo.remaining}</div>
            {limitInfo.remaining === 0 && <div style={{ fontSize: "0.7rem", color: "#dc2626", marginTop: 2 }}><AlertTriangle size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />Limit reached</div>}
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
          {/* Add / Edit Form */}
          {showForm && (
            <div className="panel-card" style={{ marginBottom: 20, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0 }}>{editingId ? "Edit Branch" : "Add New Branch"}</h3>
                <button onClick={resetForm} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#94a3b8" }}>&times;</button>
              </div>
              <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Branch Name *</span>
                  <input value={form.name} placeholder="e.g. Main Branch, Downtown" required onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Phone</span>
                  <input value={form.phone} placeholder="Phone number" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Email</span>
                  <input type="email" value={form.email} placeholder="Branch email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Business Hours</span>
                  <input value={form.businessHours} placeholder="e.g. 10AM - 9PM" onChange={(e) => setForm({ ...form, businessHours: e.target.value })} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Weekly Off</span>
                  <input value={form.weeklyOff} placeholder="e.g. Sunday" onChange={(e) => setForm({ ...form, weeklyOff: e.target.value })} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Geofence Radius (m)</span>
                  <input type="number" min="50" value={form.geofenceRadiusMeters} onChange={(e) => setForm({ ...form, geofenceRadiusMeters: Number(e.target.value) })} />
                </label>
                <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Address</span>
                  <textarea rows={2} value={form.address} placeholder="Full address" onChange={(e) => setForm({ ...form, address: e.target.value })} style={{ resize: "vertical" }} />
                </label>
                <div style={{ gridColumn: "1 / -1" }}>
                  <button type="submit" disabled={saving} style={{ background: "linear-gradient(135deg, #4f46e5, #3b82f6)", color: "white", fontWeight: 700, borderRadius: 10, padding: "12px 24px", border: "none", cursor: "pointer" }}>
                    {saving ? "Saving..." : editingId ? "Update Branch" : "Create Branch"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Branch List */}
          <div className="panel-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Branches of {selectedSalon?.name}</h3>
              <button onClick={() => { resetForm(); setShowForm(true); }} disabled={limitInfo && limitInfo.remaining <= 0} style={{ display: "flex", alignItems: "center", gap: 6, background: limitInfo && limitInfo.remaining <= 0 ? "#e2e8f0" : "linear-gradient(135deg, #4f46e5, #3b82f6)", color: limitInfo && limitInfo.remaining <= 0 ? "#94a3b8" : "white", fontWeight: 700, borderRadius: 10, padding: "10px 18px", border: "none", cursor: limitInfo && limitInfo.remaining <= 0 ? "not-allowed" : "pointer" }}>
                <Plus size={16} /> Add Branch
              </button>
            </div>

            {loading ? <PageLoader title="Loading branches" /> : branches.length === 0 ? (
              <EmptyState title="No branches yet" subtitle="Create the first branch for this salon." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {branches.map((b) => (
                  <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", gap: 20, alignItems: "center", flex: 1 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: b.isActive ? "#eff6ff" : "#f1f5f9", color: b.isActive ? "#2563eb" : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center" }}><Building2 size={18} /></div>
                      <div style={{ minWidth: 160 }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{b.name}</div>
                        <div style={{ fontSize: "0.78rem", color: b.isActive ? "#16a34a" : "#94a3b8" }}>{b.isActive ? "Active" : "Inactive"}</div>
                      </div>
                      {b.phone && <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.85rem", color: "#64748b" }}><Phone size={13} /> {b.phone}</div>}
                      {b.email && <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.85rem", color: "#64748b" }}><Mail size={13} /> {b.email}</div>}
                      {b.businessHours && <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.85rem", color: "#64748b" }}><Clock size={13} /> {b.businessHours}</div>}
                      {b.address && <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.85rem", color: "#64748b", maxWidth: 200 }}><MapPin size={13} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.address}</span></div>}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => startEdit(b)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "white", color: "#475569", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><Edit2 size={13} /> Edit</button>
                      <button onClick={() => deleteBranch(b.id)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><Trash2 size={13} /> Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
