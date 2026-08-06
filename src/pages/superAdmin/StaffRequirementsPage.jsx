import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import { Clock, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";

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
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {req.status === "OPEN" && (
                      <button disabled={updatingId === req.id} onClick={() => updateStatus(req.id, "IN_PROGRESS")} style={{
                        padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
                        background: "#3b82f6", color: "#fff", opacity: updatingId === req.id ? 0.6 : 1
                      }}>
                        <ArrowRight size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />Start Processing
                      </button>
                    )}
                    {req.status === "IN_PROGRESS" && (
                      <button disabled={updatingId === req.id} onClick={() => updateStatus(req.id, "CLOSED")} style={{
                        padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
                        background: "#10b981", color: "#fff", opacity: updatingId === req.id ? 0.6 : 1
                      }}>
                        <CheckCircle size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />Mark Closed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
