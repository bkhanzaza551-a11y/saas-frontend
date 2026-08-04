import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit2, Trash2, Eye, Activity, Briefcase } from "lucide-react";
import PageLoader from "../../components/PageLoader";
import CustomSelect from "../../components/CustomSelect";
import EmptyState from "../../components/EmptyState";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";

const emptyForm = {
  title: "",
  quantity: 1,
  salary: "",
  shift: "Full-Time",
  urgency: "Immediate",
  skills: "",
  description: "",
  status: "PENDING"
};

export default function StaffRequirementsPage() {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  
  const [viewDetailReq, setViewDetailReq] = useState(null);
  const [statusUpdateReq, setStatusUpdateReq] = useState(null);

  const loadRequirements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("q", search);
      if (statusFilter && statusFilter !== "ALL") params.append("status", statusFilter);

      const res = await api.get(`/owner/staff-requirements?${params.toString()}`);
      setRequirements(res.data || []);
    } catch (err) {
      console.error("Failed to load staff requirements:", err);
      setRequirements([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRequirements();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadRequirements]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        position: form.shift || "Full-Time",
        count: Number(form.quantity) || 1,
        priority: (form.urgency || "MEDIUM").toUpperCase(),
        description: form.description,
        status: form.status
      };

      if (editingId) {
        await api.patch(`/owner/staff-requirements/${editingId}`, payload);
        loadRequirements();
      } else {
        await api.post("/owner/staff-requirements", payload);
        loadRequirements();
      }
      resetForm();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save staff requirement");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/owner/staff-requirements/${id}`, { status: newStatus });
      setStatusUpdateReq(null);
      loadRequirements();
    } catch (err) {
      alert(err.response?.data?.message || "Could not update status");
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsModalOpen(false);
  };

  const startEdit = (req) => {
    setEditingId(req.id);
    const skillsStr = Array.isArray(req.skills)
      ? req.skills.join(", ")
      : (typeof req.skills === "string" ? req.skills : "");

    setForm({
      title: req.title || "",
      quantity: req.quantity || 1,
      salary: req.salary || "",
      shift: req.shift || "Full-Time",
      urgency: req.urgency || "Immediate",
      skills: skillsStr,
      description: req.description || "",
      status: req.status || "PENDING"
    });
    setIsModalOpen(true);
  };

  const deleteReq = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff requirement?")) return;
    try {
      await api.delete(`/owner/staff-requirements/${id}`);
      setRequirements(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete staff requirement");
    }
  };

  const stats = {
    total: requirements.length,
    pending: requirements.filter(r => r.status === "PENDING").length,
    approved: requirements.filter(r => r.status === "APPROVED").length,
    fulfilled: requirements.filter(r => r.status === "FULFILLED").length
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case "Immediate": return <span style={{ background: "#fef2f2", color: "#dc2626", padding: "4px 8px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700 }}>Immediate</span>;
      case "High": return <span style={{ background: "#fff7ed", color: "#ea580c", padding: "4px 8px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700 }}>High</span>;
      case "Medium": return <span style={{ background: "#fefce8", color: "#ca8a04", padding: "4px 8px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700 }}>Medium</span>;
      default: return <span style={{ background: "#f0f9ff", color: "#0284c7", padding: "4px 8px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700 }}>Low</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING": return <span style={{ background: "#fffbeb", color: "#d97706", padding: "4px 8px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700 }}>Pending</span>;
      case "APPROVED": return <span style={{ background: "#eef2ff", color: "#4f46e5", padding: "4px 8px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700 }}>Active Hiring</span>;
      case "FULFILLED": return <span style={{ background: "#ecfdf5", color: "#10b981", padding: "4px 8px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700 }}>Fulfilled</span>;
      default: return <span style={{ background: "#fef2f2", color: "#ef4444", padding: "4px 8px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700 }}>Rejected</span>;
    }
  };

  return (
    <div className="page-shell">
      {/* Hero Header */}
      <div className="hero-card" style={{ padding: "20px 24px", marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0, fontSize: "1.5rem" }}>Staff Hiring Requisitions</h1>
            <p style={{ marginBottom: 0, color: "#64748b", fontSize: "0.9rem" }}>Manage hiring requests and track recruitment status for the salon.</p>
          </div>
          <button className="btn btn-primary" onClick={() => { resetForm(); setIsModalOpen(true); }} style={{ padding: "8px 16px", height: "fit-content", alignSelf: "center", fontSize: "0.85rem" }}>
            <Plus size={16} style={{ marginRight: 6 }} />
            New Requirement
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
        <div className="panel-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}><Briefcase size={18} color="#475569" /></div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Total Requisitions</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>{stats.total}</div>
          </div>
        </div>
        <div className="panel-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center" }}><Briefcase size={18} color="#ea580c" /></div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Pending Approval</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ea580c" }}>{stats.pending}</div>
          </div>
        </div>
        <div className="panel-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}><Briefcase size={18} color="#4f46e5" /></div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Active Hiring</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#4f46e5" }}>{stats.approved}</div>
          </div>
        </div>
        <div className="panel-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}><Briefcase size={18} color="#10b981" /></div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Fulfilled</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#10b981" }}>{stats.fulfilled}</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="panel-card" style={{ padding: 20 }}>
        {/* Sleek Filter & Search Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a" }}>All Requirements</h3>
          
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", minWidth: 220 }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                type="text"
                placeholder="Search roles..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ padding: "6px 12px 6px 32px", width: "100%", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box", outline: "none" }}
              />
            </div>

            <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 6, padding: 2 }}>
              {["ALL", "PENDING", "APPROVED", "FULFILLED"].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    padding: "6px 12px",
                    border: "none",
                    background: statusFilter === s ? "white" : "transparent",
                    color: statusFilter === s ? "#0f172a" : "#64748b",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    borderRadius: 4,
                    cursor: "pointer",
                    boxShadow: statusFilter === s ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                    transition: "all 0.2s"
                  }}
                >
                  {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Professional Table Layout */}
        {loading ? (
          <div style={{ padding: "40px 0" }}><PageLoader title="Loading requirements..." /></div>
        ) : requirements.length === 0 ? (
          <EmptyState title="No staff requirements found" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 16px", color: "#475569", fontSize: "0.8rem", fontWeight: 700 }}>Role / Title</th>
                  <th style={{ padding: "12px 16px", color: "#475569", fontSize: "0.8rem", fontWeight: 700 }}>Qty</th>
                  <th style={{ padding: "12px 16px", color: "#475569", fontSize: "0.8rem", fontWeight: 700 }}>Salary Est.</th>
                  <th style={{ padding: "12px 16px", color: "#475569", fontSize: "0.8rem", fontWeight: 700 }}>Urgency</th>
                  <th style={{ padding: "12px 16px", color: "#475569", fontSize: "0.8rem", fontWeight: 700 }}>Status</th>
                  <th style={{ padding: "12px 16px", color: "#475569", fontSize: "0.8rem", fontWeight: 700, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((req) => (
                  <tr key={req.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "16px", verticalAlign: "middle" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{req.title}</div>
                      <div style={{ color: "#64748b", fontSize: "0.75rem", marginTop: 2 }}>{req.shift || "Full-Time"}</div>
                    </td>
                    <td style={{ padding: "16px", verticalAlign: "middle", fontSize: "0.9rem", color: "#334155", fontWeight: 600 }}>{req.quantity}</td>
                    <td style={{ padding: "16px", verticalAlign: "middle", fontSize: "0.85rem", color: "#475569" }}>{req.salary || "N/A"}</td>
                    <td style={{ padding: "16px", verticalAlign: "middle" }}>{getUrgencyBadge(req.urgency)}</td>
                    <td style={{ padding: "16px", verticalAlign: "middle" }}>{getStatusBadge(req.status)}</td>
                    <td style={{ padding: "16px", verticalAlign: "middle", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button onClick={() => setViewDetailReq(req)} className="btn btn-secondary" style={{ padding: "6px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }} title="View Detail">
                          <Eye size={14} /> Detail
                        </button>
                        <button onClick={() => setStatusUpdateReq(req)} className="btn btn-secondary" style={{ padding: "6px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }} title="Update Status">
                          <Activity size={14} /> Status
                        </button>
                        <button onClick={() => startEdit(req)} className="btn btn-secondary" style={{ padding: "6px" }} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => deleteReq(req.id)} className="btn btn-secondary" style={{ padding: "6px", color: "#dc2626" }} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Requirement Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "white", width: "100%", maxWidth: 540, borderRadius: 16, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid #eee", paddingBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{editingId ? "Edit Staff Requirement" : "New Staff Requirement"}</h2>
              <button onClick={resetForm} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8" }}>✕</button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Position Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Hair Stylist, Makeup Artist"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Urgency Level</label>
                  <CustomSelect
                    value={form.urgency}
                    onChange={e => setForm({ ...form, urgency: e.target.value })}
                    options={[
                      { label: "Immediate", value: "Immediate" },
                      { label: "High", value: "High" },
                      { label: "Medium", value: "Medium" },
                      { label: "Low", value: "Low" }
                    ]}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Offered Salary</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹35,000 - ₹45,000 / mo"
                    value={form.salary}
                    onChange={e => setForm({ ...form, salary: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Shift Timing</label>
                  <input
                    type="text"
                    placeholder="e.g. Full-Time (10 AM - 7 PM)"
                    value={form.shift}
                    onChange={e => setForm({ ...form, shift: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Required Skills (comma separated)</label>
                <input
                  type="text"
                  placeholder="Haircutting, Balayage, Client Management"
                  value={form.skills}
                  onChange={e => setForm({ ...form, skills: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Job Description & Criteria</label>
                <textarea
                  rows={3}
                  placeholder="Describe experience requirements, duties, or special notes..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 12, borderTop: "1px solid #eee", paddingTop: 16 }}>
                <button type="button" onClick={resetForm} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving..." : editingId ? "Update Requirement" : "Create Requirement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewDetailReq && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "white", width: "100%", maxWidth: 500, borderRadius: 16, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid #e2e8f0", paddingBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Staff Requirement Details</h2>
              <button onClick={() => setViewDetailReq(null)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div><strong>Title:</strong> {viewDetailReq.title}</div>
              <div><strong>Description:</strong> {viewDetailReq.description || "N/A"}</div>
              <div><strong>Skills Required:</strong> {Array.isArray(viewDetailReq.skills) ? viewDetailReq.skills.join(', ') : viewDetailReq.skills || "N/A"}</div>
              <div><strong>Quantity:</strong> {viewDetailReq.quantity}</div>
              <div><strong>Salary:</strong> {viewDetailReq.salary || "N/A"}</div>
              <div><strong>Shift:</strong> {viewDetailReq.shift || "N/A"}</div>
              <div><strong>Urgency:</strong> {viewDetailReq.urgency}</div>
              <div><strong>Status:</strong> {viewDetailReq.status}</div>
              <div><strong>Created At:</strong> {new Date(viewDetailReq.createdAt).toLocaleString()}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
              <button type="button" onClick={() => setViewDetailReq(null)} className="btn btn-primary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {statusUpdateReq && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "white", width: "100%", maxWidth: 400, borderRadius: 16, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid #e2e8f0", paddingBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Update Status</h2>
              <button onClick={() => setStatusUpdateReq(null)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {["PENDING", "APPROVED", "FULFILLED", "REJECTED"].map(s => (
                <button
                  key={s}
                  onClick={() => updateStatus(statusUpdateReq.id, s)}
                  className="btn"
                  style={{
                    background: statusUpdateReq.status === s ? "#f1f5f9" : "white",
                    border: "1px solid #cbd5e1",
                    color: "#0f172a",
                    fontWeight: 600,
                    padding: "10px",
                    textAlign: "center",
                    cursor: "pointer",
                    borderRadius: 8
                  }}
                >
                  Mark as {s}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
              <button type="button" onClick={() => setStatusUpdateReq(null)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
