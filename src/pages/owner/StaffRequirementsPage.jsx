import { useEffect, useState, useCallback } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import CustomSelect from "../../components/CustomSelect";
import { Briefcase, Plus, Trash2, Eye, Edit2, Clock, CheckCircle, AlertCircle } from "lucide-react";

const statusConfig = {
  OPEN: { label: "Open", color: "#f59e0b", bg: "#fef3c7", icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "#3b82f6", bg: "#dbeafe", icon: AlertCircle },
  CLOSED: { label: "Closed", color: "#10b981", bg: "#d1fae5", icon: CheckCircle }
};

const priorityColors = {
  LOW: { bg: "#f0fdf4", color: "#166534" },
  MEDIUM: { bg: "#fffbeb", color: "#d97706" },
  HIGH: { bg: "#fff7ed", color: "#c2410c" },
  URGENT: { bg: "#fef2f2", color: "#dc2626" }
};

const emptyForm = {
  title: "",
  description: "",
  department: "",
  position: "",
  salary: "",
  experience: "",
  skills: "",
  count: "1",
  shift: "",
  urgency: "MEDIUM",
  priority: "MEDIUM",
  branchId: ""
};

export default function StaffRequirementsPage() {
  const [requirements, setRequirements] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [viewDetailReq, setViewDetailReq] = useState(null);
  const [editReq, setEditReq] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState({ error: "", success: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resReqs, resBranches] = await Promise.all([
        api.get("/owner/staff-requirements"),
        api.get("/owner/branches").catch(() => ({ data: [] }))
      ]);
      setRequirements(resReqs.data || []);
      setBranches(resBranches.data || []);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Failed to load data"), success: "" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setStatus({ error: "Title is required.", success: "" });
      return;
    }
    setSaving(true);
    try {
      if (editReq) {
        await api.patch(`/owner/staff-requirements/${editReq.id}`, form);
        setStatus({ error: "", success: "Requirement updated." });
      } else {
        await api.post("/owner/staff-requirements", form);
        setStatus({ error: "", success: "Requirement created." });
      }
      setForm(emptyForm);
      setShowModal(false);
      setEditReq(null);
      await fetchData();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not save"), success: "" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this requirement?")) return;
    try {
      await api.delete(`/owner/staff-requirements/${id}`);
      await fetchData();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Failed to delete"), success: "" });
    }
  };

  const openEdit = (req) => {
    setEditReq(req);
    setForm({
      title: req.title || "",
      description: req.description || "",
      department: req.department || "",
      position: req.position || "",
      salary: req.salary || "",
      experience: req.experience || "",
      skills: req.skills || "",
      count: String(req.count || 1),
      shift: req.shift || "",
      urgency: req.urgency || "MEDIUM",
      priority: req.priority || "MEDIUM",
      branchId: req.branchId || ""
    });
    setShowModal(true);
  };

  const filtered = filter ? requirements.filter(r => r.status === filter) : requirements;
  const counts = {
    ALL: requirements.length,
    OPEN: requirements.filter(r => r.status === "OPEN").length,
    IN_PROGRESS: requirements.filter(r => r.status === "IN_PROGRESS").length,
    CLOSED: requirements.filter(r => r.status === "CLOSED").length
  };

  if (loading) return <div className="page-shell"><PageLoader title="Loading staff requirements" /></div>;

  return (
    <div className="page-shell">
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0 }}>Staff Requirements</h1>
            <p style={{ marginBottom: 0 }}>Submit staffing needs for your salon branches.</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditReq(null); setForm(emptyForm); setShowModal(true); }} style={{ padding: "8px 16px", height: "fit-content", alignSelf: "center", fontSize: "0.85rem" }}>
            <Plus size={16} style={{ marginRight: 6 }} />
            New Requirement
          </button>
        </div>
      </div>

      {status.error && <div style={{ background: "#fef2f2", color: "#991b1b", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: "0.85rem", display: "flex", justifyContent: "space-between" }}>{status.error} <button onClick={() => setStatus({ ...status, error: "" })} style={{ background: "none", border: "none", color: "#991b1b", cursor: "pointer" }}>✕</button></div>}
      {status.success && <div style={{ background: "#ecfdf5", color: "#065f46", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: "0.85rem", display: "flex", justifyContent: "space-between" }}>{status.success} <button onClick={() => setStatus({ ...status, success: "" })} style={{ background: "none", border: "none", color: "#065f46", cursor: "pointer" }}>✕</button></div>}

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["", "OPEN", "IN_PROGRESS", "CLOSED"].map(key => (
          <button key={key} onClick={() => setFilter(key)} style={{ padding: "6px 12px", borderRadius: 8, border: "none", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", background: filter === key ? "#4f46e5" : "#f1f5f9", color: filter === key ? "white" : "#64748b" }}>
            {key ? `${statusConfig[key].label} (${counts[key]})` : `All (${counts.ALL})`}
          </button>
        ))}
      </div>

      <div className="panel-card" style={{ padding: 24 }}>
        {filtered.length === 0 ? <EmptyState title="No requirements found" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((req) => {
              const status = statusConfig[req.status] || statusConfig.OPEN;
              const StatusIcon = status.icon;
              const pc = priorityColors[req.priority] || priorityColors.MEDIUM;
              return (
                <div key={req.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", gap: 20, alignItems: "center", flex: 1 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}><Briefcase size={18} /></div>
                    <div style={{ minWidth: 160 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>{req.title}</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 600, color: status.color, background: status.bg }}>
                          <StatusIcon size={10} /> {status.label}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 2 }}>{req.department || "No department"} {req.position && `• ${req.position}`}</div>
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "#475569" }}>
                      {req.count > 1 && <span>{req.count} Staff</span>}
                      {req.count <= 1 && <span>1 Staff</span>}
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "#64748b" }}>{req.salary || "-"}</div>
                    <div style={{ fontSize: "0.82rem", color: "#64748b" }}>{req.experience || "-"}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{req.branch?.name || "-"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ background: pc.bg, color: pc.color, padding: "4px 10px", borderRadius: 100, fontSize: "0.72rem", fontWeight: 700 }}>{req.priority}</span>
                    <button type="button" onClick={() => setViewDetailReq(req)} className="btn btn-secondary" style={{ padding: "6px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }} title="View Detail">
                      <Eye size={14} />
                    </button>
                    {req.status === "OPEN" && (
                      <>
                        <button type="button" onClick={() => openEdit(req)} className="btn btn-secondary" style={{ padding: "6px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button type="button" onClick={() => handleDelete(req.id)} className="btn btn-secondary" style={{ padding: "6px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4, color: "#ef4444" }} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "white", width: "100%", maxWidth: 600, borderRadius: 16, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid #eee", paddingBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{editReq ? "Edit Requirement" : "New Staff Requirement"}</h2>
              <button onClick={() => { setShowModal(false); setForm(emptyForm); setEditReq(null); }} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8" }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Title *</label>
                <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Senior Hair Stylist" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe the role requirements..." style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Branch</label>
                  <CustomSelect value={form.branchId} onChange={e => setForm({...form, branchId: e.target.value})} options={[{ label: "All Branches", value: "" }, ...branches.map(b => ({ label: b.name, value: b.id }))]} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Department</label>
                  <CustomSelect value={form.department} onChange={e => setForm({...form, department: e.target.value})} options={[{ label: "Select", value: "" }, { label: "Styling", value: "Styling" }, { label: "Therapy", value: "Therapy" }, { label: "Management", value: "Management" }, { label: "Reception", value: "Reception" }, { label: "Cleaning", value: "Cleaning" }]} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Position</label>
                  <input type="text" value={form.position} onChange={e => setForm({...form, position: e.target.value})} placeholder="e.g. Junior, Senior" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Number of Staff</label>
                  <input type="number" min="1" value={form.count} onChange={e => setForm({...form, count: e.target.value})} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Salary Range</label>
                  <input type="text" value={form.salary} onChange={e => setForm({...form, salary: e.target.value})} placeholder="e.g. ₹15,000 - ₹25,000" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Experience</label>
                  <input type="text" value={form.experience} onChange={e => setForm({...form, experience: e.target.value})} placeholder="e.g. 2+ Years" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Skills (comma-separated)</label>
                <input type="text" value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} placeholder="e.g. Hair Coloring, Blow Dry, Spa" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Shift</label>
                  <CustomSelect value={form.shift} onChange={e => setForm({...form, shift: e.target.value})} options={[{ label: "Select", value: "" }, { label: "Morning", value: "Morning" }, { label: "Afternoon", value: "Afternoon" }, { label: "Evening", value: "Evening" }, { label: "Full Day", value: "Full Day" }, { label: "Night", value: "Night" }]} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Urgency</label>
                  <CustomSelect value={form.urgency} onChange={e => setForm({...form, urgency: e.target.value})} options={[{ label: "Low", value: "LOW" }, { label: "Medium", value: "MEDIUM" }, { label: "High", value: "HIGH" }, { label: "Critical", value: "CRITICAL" }]} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Priority</label>
                <CustomSelect value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} options={[{ label: "Low", value: "LOW" }, { label: "Medium", value: "MEDIUM" }, { label: "High", value: "HIGH" }, { label: "Urgent", value: "URGENT" }]} />
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 12, borderTop: "1px solid #eee", paddingTop: 16 }}>
                <button type="button" onClick={() => { setShowModal(false); setForm(emptyForm); setEditReq(null); }} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving..." : (editReq ? "Update" : "Submit Requirement")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewDetailReq && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "white", width: "100%", maxWidth: 560, borderRadius: 20, boxShadow: "0 25px 60px rgba(0,0,0,0.18)", overflow: "hidden" }}>
            <div style={{ height: 5, background: "linear-gradient(90deg, #475569, #334155, #0f172a)" }} />
            <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Briefcase size={18} color="white" />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.3 }}>{viewDetailReq.title}</h2>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{viewDetailReq.department || "No department"} {viewDetailReq.position && `• ${viewDetailReq.position}`}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setViewDetailReq(null)} style={{ border: "none", background: "#f1f5f9", cursor: "pointer", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#64748b" }}>✕</button>
            </div>
            <div style={{ padding: "12px 24px 0", display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(() => { const sc = statusConfig[viewDetailReq.status] || statusConfig.OPEN; return <span style={{ background: sc.bg, color: sc.color, padding: "4px 10px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700 }}>{sc.label}</span>; })()}
              {(() => { const pc = priorityColors[viewDetailReq.priority] || priorityColors.MEDIUM; return <span style={{ background: pc.bg, color: pc.color, padding: "4px 10px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700 }}>{viewDetailReq.priority} Priority</span>; })()}
            </div>
            <div style={{ padding: "20px 24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Staff Needed</div>
                  <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>{viewDetailReq.count || 1}</div>
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Salary</div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>{viewDetailReq.salary || "N/A"}</div>
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Experience</div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>{viewDetailReq.experience || "N/A"}</div>
                </div>
              </div>
              {viewDetailReq.description && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Description</div>
                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px", fontSize: "0.88rem", color: "#334155", lineHeight: 1.6, borderLeft: "3px solid #334155" }}>{viewDetailReq.description}</div>
                </div>
              )}
              {viewDetailReq.skills && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Skills</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {viewDetailReq.skills.split(",").map((s, i) => <span key={i} style={{ background: "#f1f5f9", color: "#475569", padding: "4px 10px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 600 }}>{s.trim()}</span>)}
                  </div>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div><span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Shift:</span> <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0f172a" }}>{viewDetailReq.shift || "N/A"}</span></div>
                <div><span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Branch:</span> <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0f172a" }}>{viewDetailReq.branch?.name || "All Branches"}</span></div>
              </div>
              <div style={{ height: 1, background: "#e2e8f0", margin: "4px 0 16px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Created {new Date(viewDetailReq.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
              </div>
            </div>
            <div style={{ padding: "0 24px 20px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              {viewDetailReq.status === "OPEN" && <button type="button" onClick={() => { setViewDetailReq(null); openEdit(viewDetailReq); }} className="btn btn-secondary" style={{ padding: "8px 16px", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 6 }}><Edit2 size={14} /> Edit</button>}
              <button type="button" onClick={() => setViewDetailReq(null)} className="btn btn-primary" style={{ padding: "8px 20px", fontSize: "0.82rem", background: "#0f172a", border: "none" }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
