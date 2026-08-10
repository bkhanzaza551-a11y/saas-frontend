import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import { Clock, CheckCircle, X, ExternalLink, Calendar, Users, Package, Briefcase } from "lucide-react";

const statusConfig = {
  PENDING: { label: "Pending", color: "#d97706", bg: "#fffbeb", icon: Clock },
  APPROVED: { label: "Approved", color: "#10b981", bg: "#d1fae5", icon: CheckCircle },
  REJECTED: { label: "Rejected", color: "#ef4444", bg: "#fef2f2", icon: X }
};

const priorityColors = {
  LOW: "#10b981",
  MEDIUM: "#f59e0b",
  HIGH: "#ef4444",
  URGENT: "#dc2626"
};

export default function SuperAdminProductsRequirementPage() {
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
      const res = await api.get("/super-admin/product-requirements");
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
      await api.patch(`/super-admin/product-requirements/${id}`, { status });
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
    PENDING: requirements.filter(r => r.status === "PENDING").length,
    APPROVED: requirements.filter(r => r.status === "APPROVED").length,
    REJECTED: requirements.filter(r => r.status === "REJECTED").length
  };

  if (loading) return <div className="page-shell super-admin-page"><PageLoader title="Loading product requirements" /></div>;

  return (
    <div className="page-shell super-admin-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Product Requirements</h1>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>Product requests from salon owners</p>
        </div>
      </div>

      {error && <div style={{ padding: "12px 16px", background: "#fef2f2", color: "#dc2626", borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map(key => (
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
        <EmptyState title="No Requirements" message={filter === "ALL" ? "No product requirements submitted yet." : `No ${statusConfig[filter]?.label.toLowerCase()} requirements.`} />
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {filtered.map((req) => {
            const status = statusConfig[req.status] || statusConfig.PENDING;
            const StatusIcon = status.icon;
            return (
              <div key={req.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 280 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", margin: 0 }}>{req.productName}</h3>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, color: status.color, background: status.bg }}>
                        <StatusIcon size={12} /> {status.label}
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
                      <span>Category: <b style={{ color: "#334155" }}>{req.category || "N/A"}</b></span>
                      <span>Brand: <b style={{ color: "#334155" }}>{req.brand || "N/A"}</b></span>
                      <span>Quantity: <b style={{ color: "#334155" }}>{req.quantity} {req.packSize && `(${req.packSize})`}</b></span>
                      <span>Priority: <b style={{ color: priorityColors[req.priority] || "#334155" }}>{req.priority}</b></span>
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

      {selectedReq && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)" }} onClick={() => setSelectedReq(null)} />
          <div style={{ background: "#fff", width: "100%", maxWidth: 650, borderRadius: 16, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", position: "relative", zIndex: 1, display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
            <div style={{ padding: "24px 32px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "#f8fafc", borderRadius: "16px 16px 0 0" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{selectedReq.productName}</h2>
                  {(() => {
                    const status = statusConfig[selectedReq.status] || statusConfig.PENDING;
                    const StatusIcon = status.icon;
                    return (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, color: status.color, background: status.bg }}>
                        <StatusIcon size={14} /> {status.label}
                      </span>
                    );
                  })()}
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

            <div style={{ padding: "24px 32px", overflowY: "auto", flex: 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #f1f5f9" }}>
                  <h4 style={{ margin: "0 0 12px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    <Package size={14} /> Product Details
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b", fontSize: 13 }}>Category:</span><span style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{selectedReq.category || "N/A"}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b", fontSize: 13 }}>Brand:</span><span style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{selectedReq.brand || "N/A"}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b", fontSize: 13 }}>Quantity:</span><span style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{selectedReq.quantity} {selectedReq.packSize && `(${selectedReq.packSize})`}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b", fontSize: 13 }}>Est. Price:</span><span style={{ fontWeight: 600, color: "#10b981", fontSize: 13 }}>{selectedReq.unitPrice ? `₹${selectedReq.unitPrice}` : "N/A"}</span></div>
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #f1f5f9" }}>
                  <h4 style={{ margin: "0 0 12px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    <Calendar size={14} /> Timeline & Info
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b", fontSize: 13 }}>Submitted:</span><span style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{new Date(selectedReq.createdAt).toLocaleDateString()}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b", fontSize: 13 }}>Priority:</span><span style={{ fontWeight: 700, color: priorityColors[selectedReq.priority] || "#0f172a", fontSize: 13 }}>{selectedReq.priority}</span></div>
                  </div>
                </div>
              </div>

              {selectedReq.description && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#334155" }}>Description</h4>
                  <p style={{ margin: 0, fontSize: 14, color: "#475569", lineHeight: 1.6, background: "#f8fafc", padding: 16, borderRadius: 8, border: "1px solid #f1f5f9" }}>
                    {selectedReq.description}
                  </p>
                </div>
              )}
            </div>

            {/* Status Update Actions */}
            <div style={{ padding: "20px 32px", borderTop: "1px solid #f1f5f9", background: "#f8fafc", borderRadius: "0 0 16px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Update Status:</span>
                <div style={{ display: "flex", background: "#e2e8f0", borderRadius: 8, padding: 4 }}>
                  {[
                    { val: "OPEN", label: "Open" },
                    { val: "IN_PROGRESS", label: "In Progress" },
                    { val: "CLOSED", label: "Closed" }
                  ].map(st => {
                    const isActive = selectedReq.status === st.val;
                    return (
                      <button
                        key={st.val}
                        disabled={updatingId === selectedReq.id}
                        onClick={() => updateStatus(selectedReq.id, st.val)}
                        style={{
                          padding: "6px 12px",
                          border: "none",
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          background: isActive ? "#fff" : "transparent",
                          color: isActive ? "#0f172a" : "#64748b",
                          boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                          transition: "all 0.2s"
                        }}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
                {updatingId === selectedReq.id && <span style={{ fontSize: 12, color: "#3b82f6", fontWeight: 600 }}>Saving...</span>}
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
