import { useState, useEffect, useCallback } from "react";
import { Plus, Search, CheckCircle2, UserCheck, Edit2, Trash2, Users } from "lucide-react";
import PageLoader from "../../components/PageLoader";
import CustomSelect from "../../components/CustomSelect";
import { api } from "../../api/client";

const emptyForm = {
  title: "",
  quantity: 1,
  salary: "",
  shift: "Full-Time",
  urgency: "Immediate",
  skills: "",
  description: "",
  branchId: ""
};

export default function OwnerStaffRequirementsPage() {
  const [requirements, setRequirements] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadBranches = async () => {
    try {
      const res = await api.get("/owner/branches");
      setBranches(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

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
    loadBranches();
  }, []);

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
        branchId: form.branchId || null,
        skills: form.skills,
        salary: form.salary,
        shift: form.shift,
      };

      if (editingId) {
        await api.patch(`/owner/staff-requirements/${editingId}`, payload);
      } else {
        await api.post("/owner/staff-requirements", payload);
      }
      loadRequirements();
      resetForm();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save staff requirement");
    } finally {
      setSaving(false);
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
      branchId: req.branchId || ""
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
      case "Immediate": return <span className="badge" style={{ background: "#fee2e2", color: "#991b1b", fontWeight: 700 }}>Immediate</span>;
      case "High": return <span className="badge" style={{ background: "#ffedd5", color: "#9a3412", fontWeight: 700 }}>High</span>;
      case "Medium": return <span className="badge" style={{ background: "#fef9c3", color: "#854d0e", fontWeight: 700 }}>Medium</span>;
      default: return <span className="badge" style={{ background: "#e0f2fe", color: "#075985", fontWeight: 700 }}>Low</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING": return <span className="badge" style={{ background: "#fff7ed", color: "#c2410c" }}>Pending Approval</span>;
      case "APPROVED": return <span className="badge" style={{ background: "#e0e7ff", color: "#3730a3" }}>Approved & Hiring</span>;
      case "FULFILLED": return <span className="badge" style={{ background: "#dcfce7", color: "#166534" }}>Fulfilled</span>;
      default: return <span className="badge" style={{ background: "#fee2e2", color: "#991b1b" }}>Rejected</span>;
    }
  };

  return (
    <div className="page-shell">
      {/* Hero Header */}
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0 }}>Staff Requirements</h1>
            <p style={{ marginBottom: 0 }}>Request new staff and track hiring progress for your salon branches.</p>
          </div>
          <button className="btn btn-primary" onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <Plus size={16} style={{ marginRight: 6 }} />
            New Staff Requirement
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 20 }}>
        <div className="panel-card" style={{ padding: 20 }}>
          <div style={{ color: "#64748b", fontSize: 13, fontWeight: 600 }}>Total Requisitions</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>{stats.total}</div>
        </div>
        <div className="panel-card" style={{ padding: 20, borderLeft: "4px solid #f97316" }}>
          <div style={{ color: "#64748b", fontSize: 13, fontWeight: 600 }}>Pending Approval</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#ea580c", marginTop: 4 }}>{stats.pending}</div>
        </div>
        <div className="panel-card" style={{ padding: 20, borderLeft: "4px solid #6366f1" }}>
          <div style={{ color: "#64748b", fontSize: 13, fontWeight: 600 }}>Active Hiring</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#4f46e5", marginTop: 4 }}>{stats.approved}</div>
        </div>
        <div className="panel-card" style={{ padding: 20, borderLeft: "4px solid #22c55e" }}>
          <div style={{ color: "#64748b", fontSize: 13, fontWeight: 600 }}>Positions Fulfilled</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#16a34a", marginTop: 4 }}>{stats.fulfilled}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="panel-card" style={{ padding: 16, marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", flex: 1, minWidth: 280 }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search title, skills..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: "8px 12px 8px 36px", width: "100%", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
            />
          </div>

          <CustomSelect
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            options={[
              { label: "All Statuses", value: "ALL" },
              { label: "Pending Approval", value: "PENDING" },
              { label: "Approved & Hiring", value: "APPROVED" },
              { label: "Fulfilled", value: "FULFILLED" },
              { label: "Rejected", value: "REJECTED" }
            ]}
            style={{ minWidth: 150 }}
          />
        </div>
      </div>

      {loading && <div style={{ textAlign: "center", padding: "20px 0", color: "#6366f1", fontWeight: 600 }}>Loading staff requirements...</div>}

      {/* Requirements List Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
        {requirements.length > 0 ? (
          requirements.map(req => {
            const skillsList = Array.isArray(req.skills) ? req.skills : [];
            const reqDate = req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "";
            const branchName = branches.find(b => b.id === req.branchId)?.name || "All Branches";

            return (
              <div key={req.id} className="panel-card" style={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", background: "#eef2ff", padding: "2px 8px", borderRadius: 6 }}>{req.reqNumber || req.id}</span>
                      <h3 style={{ margin: "6px 0 2px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{req.title}</h3>
                    </div>
                    {getUrgencyBadge(req.urgency)}
                  </div>

                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}>
                    <Users size={14} /> {branchName}
                  </div>

                  <div style={{ margin: "14px 0", display: "flex", flexWrap: "wrap", gap: 12, fontSize: 13, color: "#334155", background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                    <div><strong>Qty:</strong> {req.quantity} Position{req.quantity > 1 ? "s" : ""}</div>
                    <div><strong>Salary:</strong> {req.salary || "As per industry"}</div>
                    <div><strong>Shift:</strong> {req.shift || "Full-Time"}</div>
                  </div>

                  {req.description && (
                    <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, margin: "0 0 14px" }}>{req.description}</p>
                  )}

                  {skillsList.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                      {skillsList.map((skill, i) => (
                        <span key={i} style={{ fontSize: 11, background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: 100, fontWeight: 600 }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 14, marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {getStatusBadge(req.status)}
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{reqDate}</span>
                  </div>

                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => startEdit(req)} className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: 12 }} title="Edit">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => deleteReq(req.id)} className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: 12, color: "#dc2626" }} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="panel-card" style={{ padding: 40, textAlign: "center", color: "#94a3b8", gridColumn: "1 / -1" }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>No staff requirements found.</p>
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
                  placeholder="e.g. Senior Hair Stylist"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
              
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Branch (Optional)</label>
                <CustomSelect
                  value={form.branchId}
                  onChange={e => setForm({ ...form, branchId: e.target.value })}
                  options={[
                    { label: "All Branches (or N/A)", value: "" },
                    ...branches.map(b => ({ label: b.name, value: b.id }))
                  ]}
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
                  placeholder="Balayage, Keratin, Precision Cutting"
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
    </div>
  );
}
