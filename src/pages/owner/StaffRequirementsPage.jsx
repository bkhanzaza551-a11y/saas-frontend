import { useEffect, useState, useCallback } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import CustomSelect from "../../components/CustomSelect";
import { 
  Briefcase, Plus, Trash2, Eye, Edit2, Clock, CheckCircle, 
  AlertCircle, UserPlus, Building2, DollarSign, Award, 
  Sparkles, MapPin, X, ChevronRight, Layers
} from "lucide-react";

const statusConfig = {
  OPEN: { label: "Open", color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", icon: AlertCircle },
  CLOSED: { label: "Closed", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", icon: CheckCircle }
};

const priorityColors = {
  LOW: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
  MEDIUM: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  HIGH: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  URGENT: { bg: "#fef2f2", color: "#dc2626", border: "#fca5a5" }
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
        setStatus({ error: "", success: "Requirement updated successfully." });
      } else {
        await api.post("/owner/staff-requirements", form);
        setStatus({ error: "", success: "Requirement created successfully." });
      }
      setForm(emptyForm);
      setShowModal(false);
      setEditReq(null);
      await fetchData();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not save requirement"), success: "" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff requirement?")) return;
    try {
      await api.delete(`/owner/staff-requirements/${id}`);
      setStatus({ error: "", success: "Requirement deleted." });
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

  if (loading) return <div className="page-shell"><PageLoader title="Loading staff requirements..." /></div>;

  return (
    <div className="page-shell" style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 24px" }}>
      {/* Top Hero Banner */}
      <div style={{
        background: "#ffffff",
        borderRadius: 16,
        padding: "24px 28px",
        marginBottom: 24,
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.03)",
        display: "flex",
        justify: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
            color: "#2563eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(37, 99, 235, 0.15)"
          }}>
            <UserPlus size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
              Staff Requirements
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b", fontWeight: 500 }}>
              Submit, track, and manage hiring requisitions for your salon branches.
            </p>
          </div>
        </div>

        <button 
          onClick={() => { setEditReq(null); setForm(emptyForm); setShowModal(true); }}
          style={{
            padding: "10px 22px",
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            color: "#ffffff",
            border: "none",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
            transition: "transform 0.15s, boxShadow 0.15s"
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>New Requirement</span>
        </button>
      </div>

      {/* Notifications */}
      {status.error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "12px 18px", borderRadius: 12, marginBottom: 20, fontSize: 13, fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{status.error}</span>
          <button onClick={() => setStatus({ ...status, error: "" })} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", display: "flex" }}><X size={16} /></button>
        </div>
      )}
      {status.success && (
        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#059669", padding: "12px 18px", borderRadius: 12, marginBottom: 20, fontSize: 13, fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{status.success}</span>
          <button onClick={() => setStatus({ ...status, success: "" })} style={{ background: "none", border: "none", color: "#059669", cursor: "pointer", display: "flex" }}><X size={16} /></button>
        </div>
      )}

      {/* Filter Tabs Bar */}
      <div style={{
        background: "#ffffff",
        borderRadius: 14,
        padding: "6px 8px",
        marginBottom: 20,
        border: "1px solid #e2e8f0",
        display: "inline-flex",
        gap: 6,
        boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
      }}>
        {[
          { key: "", label: "All Requisitions", count: counts.ALL },
          { key: "OPEN", label: "Open", count: counts.OPEN },
          { key: "IN_PROGRESS", label: "In Progress", count: counts.IN_PROGRESS },
          { key: "CLOSED", label: "Closed", count: counts.CLOSED }
        ].map(tab => {
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                border: "none",
                fontSize: 13,
                fontWeight: isActive ? 700 : 600,
                cursor: "pointer",
                transition: "all 0.15s",
                background: isActive ? "#2563eb" : "transparent",
                color: isActive ? "#ffffff" : "#64748b",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: isActive ? "0 2px 8px rgba(37, 99, 235, 0.2)" : "none"
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: 100,
                background: isActive ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                color: isActive ? "#ffffff" : "#475569"
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Requirements Content Card */}
      <div style={{
        background: "#ffffff",
        borderRadius: 16,
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.03)",
        padding: filtered.length === 0 ? "48px 24px" : "20px"
      }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#f1f5f9",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px"
            }}>
              <UserPlus size={32} />
            </div>
            <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
              No requirements found
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b" }}>
              New staffing requisitions will appear here once submitted.
            </p>
            <button
              onClick={() => { setEditReq(null); setForm(emptyForm); setShowModal(true); }}
              style={{
                padding: "9px 20px",
                background: "#0f172a",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              + Submit New Requirement
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {filtered.map((req) => {
              const statusInfo = statusConfig[req.status] || statusConfig.OPEN;
              const StatusIcon = statusInfo.icon;
              const priorityInfo = priorityColors[req.priority] || priorityColors.MEDIUM;

              return (
                <div
                  key={req.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "18px 22px",
                    background: "#f8fafc",
                    borderRadius: 14,
                    border: "1px solid #e2e8f0",
                    transition: "all 0.15s",
                    position: "relative",
                    overflow: "hidden"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "#ffffff";
                    e.currentTarget.style.boxShadow = "0 8px 20px -4px rgba(0,0,0,0.06)";
                    e.currentTarget.style.borderColor = "#cbd5e1";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "#f8fafc";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                  }}
                >
                  {/* Left accent priority bar */}
                  <div style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    background: priorityInfo.color
                  }} />

                  {/* Left Content */}
                  <div style={{ display: "flex", alignItems: "center", gap: 18, flex: 1, paddingLeft: 6 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "#eff6ff",
                      color: "#2563eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <Briefcase size={20} />
                    </div>

                    <div style={{ minWidth: 200, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                          {req.title}
                        </span>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "3px 10px",
                          borderRadius: 100,
                          fontSize: 11,
                          fontWeight: 700,
                          color: statusInfo.color,
                          background: statusInfo.bg,
                          border: `1px solid ${statusInfo.border}`
                        }}>
                          <StatusIcon size={12} />
                          {statusInfo.label}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "#64748b", flexWrap: "wrap" }}>
                        {req.department && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 600, color: "#475569" }}>
                            <Building2 size={13} color="#94a3b8" />
                            {req.department}
                          </span>
                        )}
                        {req.position && <span>• {req.position}</span>}
                        {req.branch?.name && (
                          <span style={{ background: "#e2e8f0", color: "#334155", padding: "1px 7px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                            {req.branch.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Specs */}
                    <div style={{ display: "flex", alignItems: "center", gap: 24, paddingRight: 20, flexShrink: 0 }}>
                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", display: "block" }}>Staff Needed</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{req.count || 1} Person{(req.count || 1) > 1 ? "s" : ""}</span>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", display: "block" }}>Salary</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{req.salary || "N/A"}</span>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", display: "block" }}>Experience</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{req.experience || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions & Priority */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                    <span style={{
                      background: priorityInfo.bg,
                      color: priorityInfo.color,
                      border: `1px solid ${priorityInfo.border}`,
                      padding: "4px 12px",
                      borderRadius: 100,
                      fontSize: 11,
                      fontWeight: 700
                    }}>
                      {req.priority}
                    </span>

                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => setViewDetailReq(req)}
                        title="View Details"
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          color: "#475569",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "background 0.15s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                        onMouseLeave={e => e.currentTarget.style.background = "#ffffff"}
                      >
                        <Eye size={15} />
                      </button>

                      {req.status === "OPEN" && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(req)}
                            title="Edit Requirement"
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 8,
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#2563eb",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "background 0.15s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                            onMouseLeave={e => e.currentTarget.style.background = "#ffffff"}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(req.id)}
                            title="Delete Requirement"
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 8,
                              border: "1px solid #fca5a5",
                              background: "#ffffff",
                              color: "#dc2626",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "background 0.15s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                            onMouseLeave={e => e.currentTarget.style.background = "#ffffff"}
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 16
        }}>
          <div style={{
            background: "#ffffff",
            width: "100%",
            maxWidth: 620,
            borderRadius: 18,
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "20px 28px",
              borderBottom: "1px solid #e2e8f0",
              background: "#f8fafc",
              display: "flex",
              justify: "space-between",
              alignItems: "center"
            }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 10 }}>
                <UserPlus size={20} color="#2563eb" />
                {editReq ? "Edit Staff Requirement" : "New Staff Requirement"}
              </span>
              <button
                onClick={() => { setShowModal(false); setForm(emptyForm); setEditReq(null); }}
                style={{ background: "#e2e8f0", border: "none", cursor: "pointer", color: "#475569", width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ overflowY: "auto", flex: 1, padding: "24px 28px" }}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                  Requirement Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  placeholder="e.g. Senior Hair Stylist / Nail Artist"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14, background: "#f8fafc", fontWeight: 600, color: "#0f172a", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                  Job Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Outline key responsibilities and expectations..."
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14, background: "#f8fafc", fontWeight: 500, color: "#0f172a", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Branch</label>
                  <CustomSelect
                    value={form.branchId}
                    onChange={e => setForm({...form, branchId: e.target.value})}
                    options={[{ label: "All Branches", value: "" }, ...branches.map(b => ({ label: b.name, value: b.id }))]}
                    style={{ width: "100%", height: 42 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Department</label>
                  <CustomSelect
                    value={form.department}
                    onChange={e => setForm({...form, department: e.target.value})}
                    options={[
                      { label: "Select Department", value: "" },
                      { label: "Hair & Styling", value: "Styling" },
                      { label: "Therapy & Massage", value: "Therapy" },
                      { label: "Management & Ops", value: "Management" },
                      { label: "Front Desk & Reception", value: "Reception" },
                      { label: "Housekeeping", value: "Cleaning" }
                    ]}
                    style={{ width: "100%", height: 42 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Position Level</label>
                  <input
                    type="text"
                    value={form.position}
                    onChange={e => setForm({...form, position: e.target.value})}
                    placeholder="e.g. Senior, Junior, Lead"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14, background: "#f8fafc", fontWeight: 600, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Staff Needed</label>
                  <input
                    type="number"
                    min="1"
                    value={form.count}
                    onChange={e => setForm({...form, count: e.target.value})}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14, background: "#f8fafc", fontWeight: 600, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Salary Range</label>
                  <input
                    type="text"
                    value={form.salary}
                    onChange={e => setForm({...form, salary: e.target.value})}
                    placeholder="e.g. ₹18,000 - ₹30,000"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14, background: "#f8fafc", fontWeight: 600, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Experience Required</label>
                  <input
                    type="text"
                    value={form.experience}
                    onChange={e => setForm({...form, experience: e.target.value})}
                    placeholder="e.g. 2+ Years"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14, background: "#f8fafc", fontWeight: 600, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Required Skills</label>
                <input
                  type="text"
                  value={form.skills}
                  onChange={e => setForm({...form, skills: e.target.value})}
                  placeholder="e.g. Hair Coloring, Keratin, Balayage"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14, background: "#f8fafc", fontWeight: 600, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Shift Timing</label>
                  <CustomSelect
                    value={form.shift}
                    onChange={e => setForm({...form, shift: e.target.value})}
                    options={[
                      { label: "Select Shift", value: "" },
                      { label: "Morning Shift", value: "Morning" },
                      { label: "Afternoon Shift", value: "Afternoon" },
                      { label: "Evening Shift", value: "Evening" },
                      { label: "Full Day", value: "Full Day" }
                    ]}
                    style={{ width: "100%", height: 42 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Priority Level</label>
                  <CustomSelect
                    value={form.priority}
                    onChange={e => setForm({...form, priority: e.target.value})}
                    options={[
                      { label: "Low Priority", value: "LOW" },
                      { label: "Medium Priority", value: "MEDIUM" },
                      { label: "High Priority", value: "HIGH" },
                      { label: "Urgent Requisition", value: "URGENT" }
                    ]}
                    style={{ width: "100%", height: 42 }}
                  />
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, borderTop: "1px solid #f1f5f9", paddingTop: 18 }}>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setForm(emptyForm); setEditReq(null); }}
                  style={{ padding: "10px 22px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 10, fontWeight: 600, color: "#475569", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "10px 28px",
                    background: saving ? "#93c5fd" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    border: "none",
                    borderRadius: 10,
                    fontWeight: 700,
                    color: "#ffffff",
                    cursor: saving ? "not-allowed" : "pointer"
                  }}
                >
                  {saving ? "Saving..." : (editReq ? "Update Requirement" : "Submit Requirement")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewDetailReq && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 16
        }}>
          <div style={{
            background: "#ffffff",
            width: "100%",
            maxWidth: 580,
            borderRadius: 20,
            boxShadow: "0 25px 60px rgba(0,0,0,0.18)",
            overflow: "hidden"
          }}>
            <div style={{ height: 5, background: "linear-gradient(90deg, #2563eb, #3b82f6, #1d4ed8)" }} />
            
            <div style={{ padding: "24px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Briefcase size={22} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{viewDetailReq.title}</h2>
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{viewDetailReq.department || "General"} {viewDetailReq.position && `• ${viewDetailReq.position}`}</span>
                </div>
              </div>
              <button
                onClick={() => setViewDetailReq(null)}
                style={{ background: "#f1f5f9", border: "none", cursor: "pointer", color: "#64748b", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: "16px 28px 0", display: "flex", gap: 10 }}>
              {(() => {
                const sc = statusConfig[viewDetailReq.status] || statusConfig.OPEN;
                return <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, padding: "4px 12px", borderRadius: 100, fontSize: 12, fontWeight: 700 }}>{sc.label}</span>;
              })()}
              {(() => {
                const pc = priorityColors[viewDetailReq.priority] || priorityColors.MEDIUM;
                return <span style={{ background: pc.bg, color: pc.color, border: `1px solid ${pc.border}`, padding: "4px 12px", borderRadius: 100, fontSize: 12, fontWeight: 700 }}>{viewDetailReq.priority} Priority</span>;
              })()}
            </div>

            <div style={{ padding: "20px 28px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Staff Needed</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{viewDetailReq.count || 1} Person</div>
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Salary</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{viewDetailReq.salary || "N/A"}</div>
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Experience</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{viewDetailReq.experience || "N/A"}</div>
                </div>
              </div>

              {viewDetailReq.description && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Description</div>
                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px", fontSize: 13, color: "#334155", lineHeight: 1.6, borderLeft: "3px solid #2563eb" }}>{viewDetailReq.description}</div>
                </div>
              )}

              {viewDetailReq.skills && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Required Skills</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {viewDetailReq.skills.split(",").map((s, i) => (
                      <span key={i} style={{ background: "#f1f5f9", color: "#475569", padding: "4px 10px", borderRadius: 100, fontSize: 12, fontWeight: 600, border: "1px solid #cbd5e1" }}>
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div><span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>Shift Timing:</span> <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{viewDetailReq.shift || "N/A"}</span></div>
                <div><span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>Branch:</span> <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{viewDetailReq.branch?.name || "All Branches"}</span></div>
              </div>
            </div>

            <div style={{ padding: "0 28px 24px", display: "flex", gap: 12, justifyContent: "flex-end" }}>
              {viewDetailReq.status === "OPEN" && (
                <button
                  type="button"
                  onClick={() => { setViewDetailReq(null); openEdit(viewDetailReq); }}
                  style={{ padding: "9px 18px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#2563eb", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Edit2 size={14} /> Edit
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewDetailReq(null)}
                style={{ padding: "9px 22px", background: "#0f172a", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#ffffff", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

