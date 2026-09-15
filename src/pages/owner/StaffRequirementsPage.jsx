import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import CustomSelect from "../../components/CustomSelect";
import { 
  Briefcase, Plus, Trash2, Eye, Edit2, Clock, CheckCircle, 
  AlertCircle, Building2, DollarSign, Award, 
  MapPin, X, ChevronRight, Filter, Search, FileText
} from "lucide-react";

// Point 4: Simple Statuses (Open, In Progress, Closed)
const statusConfig = {
  OPEN: { label: "Open", color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", icon: AlertCircle },
  CLOSED: { label: "Closed", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", icon: CheckCircle }
};

const priorityColors = {
  LOW: { bg: "#f0fdf4", color: "#166534" },
  MEDIUM: { bg: "#fffbeb", color: "#b45309" },
  HIGH: { bg: "#fff7ed", color: "#c2410c" },
  URGENT: { bg: "#fef2f2", color: "#dc2626" }
};

const emptyForm = {
  position: "",
  count: "1",
  salary: "",
  experience: "",
  skills: "",
  description: "",
  priority: "MEDIUM",
  branchId: ""
};

export default function StaffRequirementsPage() {
  const [requests, setRequests] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
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
      setRequests(resReqs.data || []);
      setBranches(resBranches.data || []);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Failed to load staff requests"), success: "" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Point 3: Basic Request Fields Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.position.trim()) {
      setStatus({ error: "Position / Job Role is required.", success: "" });
      return;
    }
    setSaving(true);
    try {
      if (editReq) {
        await api.patch(`/owner/staff-requirements/${editReq.id}`, {
          ...form,
          title: form.position
        });
        setStatus({ error: "", success: "Staff request updated successfully." });
      } else {
        await api.post("/owner/staff-requirements", {
          ...form,
          title: form.position
        });
        setStatus({ error: "", success: "Staff request submitted successfully." });
      }
      setForm(emptyForm);
      setShowModal(false);
      setEditReq(null);
      await fetchData();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not save staff request"), success: "" });
    } finally {
      setSaving(false);
    }
  };

  // Point 6: Basic Actions (Close Request & Delete)
  const handleCloseRequest = async (id) => {
    if (!window.confirm("Are you sure you want to mark this staff request as Closed?")) return;
    try {
      await api.patch(`/owner/staff-requirements/${id}`, { status: "CLOSED" });
      setStatus({ error: "", success: "Staff request marked as Closed." });
      await fetchData();
      if (selectedReq && selectedReq.id === id) {
        setSelectedReq({ ...selectedReq, status: "CLOSED" });
      }
    } catch (err) {
      setStatus({ error: formatApiError(err, "Failed to close request"), success: "" });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff request?")) return;
    try {
      await api.delete(`/owner/staff-requirements/${id}`);
      setStatus({ error: "", success: "Staff request deleted." });
      if (selectedReq && selectedReq.id === id) setSelectedReq(null);
      await fetchData();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Failed to delete request"), success: "" });
    }
  };

  const openEdit = (req) => {
    setEditReq(req);
    setForm({
      position: req.position || req.title || "",
      count: String(req.count || 1),
      salary: req.salary || "",
      experience: req.experience || "",
      skills: req.skills || "",
      description: req.description || "",
      priority: req.priority || "MEDIUM",
      branchId: req.branchId || ""
    });
    setShowModal(true);
  };

  const filtered = useMemo(() => {
    return requests.filter(r => {
      if (filter !== "ALL" && r.status !== filter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pos = (r.position || r.title || "").toLowerCase();
        const skills = (r.skills || "").toLowerCase();
        const branch = (r.branch?.name || "").toLowerCase();
        if (!pos.includes(q) && !skills.includes(q) && !branch.includes(q)) return false;
      }
      return true;
    });
  }, [requests, filter, searchQuery]);

  const counts = {
    ALL: requests.length,
    OPEN: requests.filter(r => r.status === "OPEN").length,
    IN_PROGRESS: requests.filter(r => r.status === "IN_PROGRESS").length,
    CLOSED: requests.filter(r => r.status === "CLOSED").length
  };

  if (loading) return <div className="page-shell"><PageLoader title="Loading Staff Requests..." /></div>;

  return (
    <div className="page-shell" style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 24px" }}>
      {/* Top Banner (Point 1: Staff Requests) */}
      <div style={{
        background: "#ffffff",
        borderRadius: 16,
        padding: "24px 28px",
        marginBottom: 24,
        border: "1px solid #e2e8f0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16
      }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Staff Requests
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.85rem" }}>
            Submit hiring requisitions, manage vacancies, and track recruitment progress for your salon.
          </p>
        </div>

        <button
          onClick={() => {
            setEditReq(null);
            setForm(emptyForm);
            setShowModal(true);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: 10,
            background: "#4f46e5",
            color: "white",
            border: "none",
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)"
          }}
        >
          <Plus size={16} /> + New Staff Request
        </button>
      </div>

      {status.error && (
        <div style={{ padding: "12px 16px", background: "#fef2f2", color: "#dc2626", borderRadius: 8, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{status.error}</span>
          <button onClick={() => setStatus({ ...status, error: "" })} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}>✕</button>
        </div>
      )}
      {status.success && (
        <div style={{ padding: "12px 16px", background: "#ecfdf5", color: "#065f46", borderRadius: 8, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{status.success}</span>
          <button onClick={() => setStatus({ ...status, success: "" })} style={{ background: "none", border: "none", color: "#065f46", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* Point 4: Simple Status Tabs & Search Filter */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["ALL", "OPEN", "IN_PROGRESS", "CLOSED"].map(key => {
            const label = key === "ALL" ? `All (${counts.ALL})` : `${statusConfig[key]?.label} (${counts[key]})`;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  background: filter === key ? "#4f46e5" : "#f1f5f9",
                  color: filter === key ? "white" : "#64748b"
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div style={{ position: "relative", minWidth: 260 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Search position, skills, branch..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "8px 12px 8px 36px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }}
          />
        </div>
      </div>

      {/* Point 2 & 3: Request List Table */}
      {filtered.length === 0 ? (
        <EmptyState 
          title="No Staff Requests" 
          message={filter === "ALL" ? "You have not submitted any staff hiring requests yet." : `No ${statusConfig[filter]?.label.toLowerCase()} staff requests found.`} 
        />
      ) : (
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e2e8f0", overflowX: "auto", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f1f5f9", background: "#f8fafc", color: "#64748b", fontWeight: 700 }}>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Position / Job Role</th>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Branch</th>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Vacancies</th>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Salary Range</th>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Experience</th>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Priority</th>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Status</th>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Requested Date</th>
                <th style={{ padding: "14px 16px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => {
                const sc = statusConfig[req.status] || statusConfig.OPEN;
                const pc = priorityColors[req.priority] || priorityColors.MEDIUM;
                const StatusIcon = sc.icon;

                return (
                  <tr key={req.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>
                        {req.position || req.title}
                      </div>
                      {req.skills && (
                        <div style={{ fontSize: "0.75rem", color: "#6366f1", marginTop: 2 }}>
                          Skills: {req.skills}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#475569" }}>
                      {req.branch?.name || "Main Branch / All"}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>
                      {req.count || 1} required
                    </td>
                    <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: 600 }}>
                      {req.salary || "Negotiable"}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#475569" }}>
                      {req.experience || "Any"}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ background: pc.bg, color: pc.color, padding: "3px 8px", borderRadius: 100, fontSize: "0.72rem", fontWeight: 700 }}>
                        {req.priority}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: sc.bg, color: sc.color, padding: "4px 10px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700 }}>
                        <StatusIcon size={12} /> {sc.label}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "0.8rem" }}>
                      {new Date(req.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => setSelectedReq(req)}
                          title="View Details"
                          style={{ padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: 6, background: "white", color: "#3b82f6", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer" }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => openEdit(req)}
                          title="Edit Request"
                          style={{ padding: 6, border: "1px solid #cbd5e1", borderRadius: 6, background: "white", color: "#475569", cursor: "pointer" }}
                        >
                          <Edit2 size={14} />
                        </button>
                        {req.status !== "CLOSED" && (
                          <button
                            onClick={() => handleCloseRequest(req.id)}
                            title="Close Request"
                            style={{ padding: "6px 10px", border: "1px solid #10b981", borderRadius: 6, background: "#ecfdf5", color: "#059669", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer" }}
                          >
                            Close
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(req.id)}
                          title="Delete"
                          style={{ padding: 6, border: "1px solid #cbd5e1", borderRadius: 6, background: "white", color: "#ef4444", cursor: "pointer" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Point 5: Request Detail Modal (Exact fields required) */}
      {selectedReq && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "white", width: "100%", maxWidth: 600, borderRadius: 16, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, borderBottom: "1px solid #eee", paddingBottom: 14 }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#6366f1", textTransform: "uppercase" }}>
                  Staff Request Details
                </span>
                <h2 style={{ margin: "2px 0 0", fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                  {selectedReq.position || selectedReq.title}
                </h2>
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: 2 }}>
                  Branch: <strong>{selectedReq.branch?.name || "Main Branch / All Outlets"}</strong>
                </div>
              </div>
              <button onClick={() => setSelectedReq(null)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20, color: "#94a3b8" }}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, background: "#f8fafc", padding: 16, borderRadius: 10, marginBottom: 16, fontSize: "0.85rem" }}>
              <div><span style={{ color: "#64748b" }}>Number Required:</span> <strong>{selectedReq.count || 1} Person(s)</strong></div>
              <div><span style={{ color: "#64748b" }}>Salary Range:</span> <strong>{selectedReq.salary || "Negotiable"}</strong></div>
              <div><span style={{ color: "#64748b" }}>Experience Required:</span> <strong>{selectedReq.experience || "Any Experience"}</strong></div>
              <div><span style={{ color: "#64748b" }}>Priority:</span> <strong>{selectedReq.priority}</strong></div>
              <div><span style={{ color: "#64748b" }}>Current Status:</span> <strong style={{ color: statusConfig[selectedReq.status]?.color }}>{statusConfig[selectedReq.status]?.label || selectedReq.status}</strong></div>
              <div><span style={{ color: "#64748b" }}>Requested Date:</span> <strong>{new Date(selectedReq.createdAt).toLocaleDateString()}</strong></div>
            </div>

            {selectedReq.skills && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Skills & Expertise</div>
                <div style={{ background: "#f8fafc", padding: 10, borderRadius: 8, fontSize: "0.85rem", color: "#334155" }}>
                  {selectedReq.skills}
                </div>
              </div>
            )}

            {selectedReq.description && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Description / Requirements</div>
                <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, fontSize: "0.85rem", color: "#334155", lineHeight: 1.5 }}>
                  {selectedReq.description}
                </div>
              </div>
            )}

            {selectedReq.internalNotes && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#065f46", textTransform: "uppercase", marginBottom: 4 }}>Admin / Agency Internal Notes</div>
                <div style={{ background: "#ecfdf5", padding: 12, borderRadius: 8, fontSize: "0.85rem", color: "#065f46", borderLeft: "3px solid #10b981" }}>
                  {selectedReq.internalNotes}
                </div>
              </div>
            )}

            {/* Point 6: Basic Actions on Detail */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #eee", paddingTop: 16 }}>
              <div>
                {selectedReq.status !== "CLOSED" && (
                  <button
                    onClick={() => handleCloseRequest(selectedReq.id)}
                    style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#10b981", color: "white", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                  >
                    ✓ Close Request
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #cbd5e1", background: "white", color: "#475569", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Point 3: Submit / Edit Staff Request Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "white", width: "100%", maxWidth: 540, borderRadius: 16, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid #eee", paddingBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                {editReq ? "Edit Staff Request" : "New Staff Request"}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8" }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label>
                <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Position / Job Role *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Hair Stylist, Beautician, Nail Artist"
                  value={form.position}
                  onChange={e => setForm({ ...form, position: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label>
                  <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Branch (Optional)</span>
                  <CustomSelect
                    value={form.branchId}
                    onChange={e => setForm({ ...form, branchId: e.target.value })}
                    style={{ width: "100%" }}
                  >
                    <option value="">All Branches / Main</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </CustomSelect>
                </label>

                <label>
                  <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Number Required *</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.count}
                    onChange={e => setForm({ ...form, count: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                  />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label>
                  <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Salary Range</span>
                  <input
                    type="text"
                    placeholder="e.g. ₹25,000 - ₹35,000 / month"
                    value={form.salary}
                    onChange={e => setForm({ ...form, salary: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                  />
                </label>

                <label>
                  <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Experience</span>
                  <input
                    type="text"
                    placeholder="e.g. 2-3 years, Fresher, 5+ yrs"
                    value={form.experience}
                    onChange={e => setForm({ ...form, experience: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                  />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label>
                  <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Required Skills</span>
                  <input
                    type="text"
                    placeholder="e.g. Hair Coloring, Keratin, Bridal Makeup"
                    value={form.skills}
                    onChange={e => setForm({ ...form, skills: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                  />
                </label>

                <label>
                  <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Priority</span>
                  <CustomSelect
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                    style={{ width: "100%" }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </CustomSelect>
                </label>
              </div>

              <label>
                <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Job Description & Instructions</span>
                <textarea
                  rows={3}
                  placeholder="Additional specifications, working hours, incentives..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                />
              </label>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid #e2e8f0", background: "white", color: "#475569", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: "10px 22px", borderRadius: 8, border: "none", background: "#4f46e5", color: "white", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  {saving ? "Saving..." : (editReq ? "Update Request" : "Submit Request")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
