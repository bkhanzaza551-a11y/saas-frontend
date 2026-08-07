import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import { Clock, CheckCircle, AlertCircle, ArrowRight, X, ExternalLink, Calendar, Users, Briefcase } from "lucide-react";

const statusConfig = {
  OPEN: { label: "Open", color: "#f59e0b", bg: "#fef3c7", icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "#3b82f6", bg: "#dbeafe", icon: AlertCircle },
  CLOSED: { label: "Closed", color: "#10b981", bg: "#d1fae5", icon: CheckCircle }
};

const urgencyColors = {
  LOW: "#10b981",
  MEDIUM: "#f59e0b",
  HIGH: "#ef4444",
  URGENT: "#dc2626"
};

export default function SuperAdminStaffRequirementsPage() {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedReq, setSelectedReq] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/super-admin/staff-requirements");
      setRequirements(res.data || []);
    } catch (err) {
      setError(formatApiError(err, "Failed to load requirements"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await api.patch(`/super-admin/staff-requirements/${id}`, { status });
      load();
      if (selectedReq && selectedReq.id === id) {
        setSelectedReq({ ...selectedReq, status });
      }
    } catch (err) {
      alert(formatApiError(err, "Failed to update status"));
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = filter === "ALL" ? requirements : requirements.filter(r => r.status === filter);

  const counts = {
    ALL: requirements.length,
    OPEN: requirements.filter(r => r.status === "OPEN").length,
    IN_PROGRESS: requirements.filter(r => r.status === "IN_PROGRESS").length,
    CLOSED: requirements.filter(r => r.status === "CLOSED").length
  };

  if (loading) return <div className="page-shell super-admin-page"><PageLoader title="Loading staff requirements" /></div>;

  return (
    <div className="page-shell super-admin-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Staff Requirements</h1>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>Hiring requests from salon owners</p>
        </div>
      </div>

      {error && <div style={{ padding: "12px 16px", background: "#fef2f2", color: "#dc2626", borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["ALL", "OPEN", "IN_PROGRESS", "CLOSED"].map(key => (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
            background: filter === key ? "#0f172a" : "#f1f5f9",
            color: filter === key ? "#fff" : "#64748b"
          }}>
            {key === "ALL" ? "All" : statusConfig[key].label} ({counts[key]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No Requirements" message={filter === "ALL" ? "No staff requirements submitted yet." : `No ${statusConfig[filter]?.label.toLowerCase()} requirements.`} />
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {filtered.map((req) => {
            const status = statusConfig[req.status] || statusConfig.OPEN;
            const StatusIcon = status.icon;
            return (
              <div key={req.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 280 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", margin: 0 }}>{req.title}</h3>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, color: status.color, background: status.bg }}>
                        <StatusIcon size={12} /> {status.label}
                      </span>
                      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: urgencyColors[req.urgency] || "#64748b", background: "#f1f5f9" }}>
                        {req.urgency}
                      </span>
                    </div>
                    {req.salon && (
                      <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 4px" }}>
                        Salon: <b style={{ color: "#334155" }}>{req.salon.name}</b>
                        {req.salon.slug && <span style={{ color: "#94a3b8" }}> ({req.salon.slug})</span>}
                      </p>
                    )}
                    {req.description && <p style={{ fontSize: 14, color: "#475569", margin: "8px 0" }}>{req.description}</p>}
                    <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#64748b", flexWrap: "wrap", marginTop: 8 }}>
                      {req.department && <span>Dept: <b style={{ color: "#334155" }}>{req.department}</b></span>}
                      {req.position && <span>Position: <b style={{ color: "#334155" }}>{req.position}</b></span>}
                      {req.salary && <span>Salary: <b style={{ color: "#334155" }}>{req.salary}</b></span>}
                      {req.shift && <span>Shift: <b style={{ color: "#334155" }}>{req.shift}</b></span>}
                      {req.count > 1 && <span>Count: <b style={{ color: "#334155" }}>{req.count}</b></span>}
                      {req.skills && <span>Skills: <b style={{ color: "#334155" }}>{req.skills}</b></span>}
                    </div>
                    <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
                      Submitted: {new Date(req.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
                    <button onClick={() => setSelectedReq(req)} style={{
                      padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "1px solid #cbd5e1", cursor: "pointer",
                      background: "#fff", color: "#475569", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s"
                    }}>
                      <ExternalLink size={14} /> View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Detail Modal */}
      {selectedReq && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)" }} onClick={() => setSelectedReq(null)} />
          <div style={{ background: "#fff", width: "100%", maxWidth: 650, borderRadius: 16, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", position: "relative", zIndex: 1, display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
            
            {/* Modal Header */}
            <div style={{ padding: "24px 32px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "#f8fafc", borderRadius: "16px 16px 0 0" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{selectedReq.title}</h2>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, color: statusConfig[selectedReq.status]?.color || "#475569", background: statusConfig[selectedReq.status]?.bg || "#f1f5f9" }}>
                    {statusConfig[selectedReq.status] && React.createElement(statusConfig[selectedReq.status].icon, { size: 14 })}
                    {statusConfig[selectedReq.status]?.label}
                  </span>
                  <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: urgencyColors[selectedReq.urgency] || "#64748b", background: "#f1f5f9", border: `1px solid ${urgencyColors[selectedReq.urgency] || "#cbd5e1"}` }}>
                    {selectedReq.urgency}
                  </span>
                </div>
                {selectedReq.salon && (
                  <p style={{ margin: 0, fontSize: 14, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
                    <Users size={14} /> Salon: <span style={{ fontWeight: 600, color: "#334155" }}>{selectedReq.salon.name}</span>
                  </p>
                )}
              </div>
              <button onClick={() => setSelectedReq(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px 32px", overflowY: "auto", flex: 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #f1f5f9" }}>
                  <h4 style={{ margin: "0 0 12px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    <Briefcase size={14} /> Job Details
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b", fontSize: 13 }}>Department:</span><span style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{selectedReq.department || "N/A"}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b", fontSize: 13 }}>Position:</span><span style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{selectedReq.position || "N/A"}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b", fontSize: 13 }}>Shift:</span><span style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{selectedReq.shift || "N/A"}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b", fontSize: 13 }}>Count:</span><span style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{selectedReq.count || 1}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b", fontSize: 13 }}>Salary Range:</span><span style={{ fontWeight: 600, color: "#10b981", fontSize: 13 }}>{selectedReq.salary || "N/A"}</span></div>
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #f1f5f9" }}>
                  <h4 style={{ margin: "0 0 12px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    <Calendar size={14} /> Timeline & Info
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b", fontSize: 13 }}>Submitted On:</span><span style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{new Date(selectedReq.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b", fontSize: 13 }}>Current Status:</span><span style={{ fontWeight: 600, color: statusConfig[selectedReq.status]?.color || "#0f172a", fontSize: 13 }}>{statusConfig[selectedReq.status]?.label}</span></div>
                  </div>
                </div>
              </div>

              {selectedReq.description && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", fontWeight: 700 }}>Description</h4>
                  <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, fontSize: 14, color: "#334155", lineHeight: 1.6, border: "1px solid #f1f5f9" }}>
                    {selectedReq.description}
                  </div>
                </div>
              )}

              {selectedReq.skills && (
                <div>
                  <h4 style={{ margin: "0 0 8px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", fontWeight: 700 }}>Required Skills</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {selectedReq.skills.split(",").map((skill, i) => (
                      <span key={i} style={{ padding: "6px 12px", background: "#f1f5f9", color: "#475569", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "1px solid #e2e8f0" }}>
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer (Action Area) */}
            <div style={{ padding: "20px 32px", borderTop: "1px solid #f1f5f9", background: "#f8fafc", borderRadius: "0 0 16px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500, marginRight: 12 }}>Change Status:</span>
                <select 
                  value={selectedReq.status} 
                  onChange={(e) => updateStatus(selectedReq.id, e.target.value)}
                  disabled={updatingId === selectedReq.id}
                  style={{ 
                    padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, fontWeight: 600, outline: "none", 
                    color: "#0f172a", background: "#fff", minWidth: 140, cursor: "pointer"
                  }}
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="CLOSED">Closed</option>
                </select>
                {updatingId === selectedReq.id && <span style={{ marginLeft: 12, fontSize: 12, color: "#3b82f6", fontWeight: 600 }}>Updating...</span>}
              </div>
              <button onClick={() => setSelectedReq(null)} style={{ padding: "10px 24px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
