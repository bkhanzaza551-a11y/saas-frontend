import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../../api/client";
import { useBranch } from '../../context/BranchContext';
import EmptyState from "../../components/EmptyState";
import ModuleTabs from "../../components/ModuleTabs";
import { formatApiError } from "../../utils/apiError";
import PageLoader from "../../components/PageLoader";
import { Star, User, MessageCircle, Calendar, CheckCircle, Mail, AlertCircle, Clock, Trash2, MailPlus, Check } from "lucide-react";

import CustomSelect from "../../components/CustomSelect";

const statusColors = {
  NEW: "#3b82f6",
  REVIEWED: "#eab308",
  CONTACTED: "#f97316",
  RESOLVED: "#10b981"
};

const statusBadges = {
  NEW: { bg: "#eff6ff", color: "#1d4ed8" },
  REVIEWED: { bg: "#fefce8", color: "#a16207" },
  CONTACTED: { bg: "#fff7ed", color: "#c2410c" },
  RESOLVED: { bg: "#ecfdf5", color: "#047857" }
};

const renderStars = (rating) => (
  <div style={{ display: "flex", gap: 2 }}>
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} size={16} fill={i <= rating ? "#f59e0b" : "transparent"} color={i <= rating ? "#f59e0b" : "#cbd5e1"} />
    ))}
  </div>
);

export default function FeedbackPage() {
  const location = useLocation();
  const { selectedBranchId } = useBranch();
  const [rows, setRows] = useState([]);
  const [report, setReport] = useState(null);
  const [filters, setFilters] = useState({ status: "" });
  const [status, setStatus] = useState({ error: "", success: "" });
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpFeedback, setFollowUpFeedback] = useState(null);
  const [followUpNote, setFollowUpNote] = useState("");
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false);

  const mode = location.pathname.endsWith("/feedback/reports")
    ? "reports"
    : location.pathname.endsWith("/feedback/settings")
      ? "settings"
      : "feedback";

  const load = useCallback(async () => {
    try {
      const params = {
        ...(filters.status ? { status: filters.status } : {}),
        ...(selectedBranchId ? { branchId: selectedBranchId } : {})
      };
      const [listResult, reportResult, settingsResult] = await Promise.allSettled([
        api.get("/owner/feedback", { params }),
        api.get("/owner/feedback/reports", { params }),
        api.get("/owner/feedback/settings")
      ]);
      if (listResult.status === "fulfilled") setRows(listResult.value.data || []);
      if (reportResult.status === "fulfilled") {
        const settings = settingsResult.status === "fulfilled" ? settingsResult.value.data || {} : {};
        setReport({ ...(reportResult.value.data || {}), settings });
      }
      setLoading(false);
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not load feedback module"), success: "" });
      setLoading(false);
    }
  }, [selectedBranchId, filters.status]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [load]);

  const updateStatus = async (id, newStatus) => {
    try {
      setProcessingId(id);
      setStatus({ error: "", success: "" });
      await api.patch(`/owner/feedback/${id}/status`, { status: newStatus });
      setStatus({ error: "", success: `Feedback marked as ${newStatus.toLowerCase()}.` });
      setTimeout(() => setStatus({ error: "", success: "" }), 3000);
      await load();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not update feedback"), success: "" });
    } finally {
      setProcessingId(null);
    }
  };

  const deleteFeedback = async (id) => {
    if (!window.confirm("Delete this feedback entry?")) return;
    try {
      setProcessingId(id);
      setStatus({ error: "", success: "" });
      await api.delete(`/owner/feedback/${id}`);
      setStatus({ error: "", success: "Feedback deleted." });
      setTimeout(() => setStatus({ error: "", success: "" }), 3000);
      await load();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not delete feedback"), success: "" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleFollowUpSubmit = async () => {
    if (!followUpFeedback || !followUpNote.trim()) return;
    try {
      setFollowUpSubmitting(true);
      await api.post(`/owner/feedback/${followUpFeedback.id}/follow-up`, {
        note: followUpNote.trim()
      });
      setShowFollowUpModal(false);
      setFollowUpFeedback(null);
      setFollowUpNote("");
      setStatus({ error: "", success: "Follow-up recorded and email sent." });
      setTimeout(() => setStatus({ error: "", success: "" }), 3000);
      await load();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Failed to send follow-up"), success: "" });
    } finally {
      setFollowUpSubmitting(false);
    }
  };

  const getVisibleButtons = (currentStatus) => {
    switch (currentStatus) {
      case "NEW":
        return { reviewed: true, contacted: true, resolved: true };
      case "REVIEWED":
        return { reviewed: false, contacted: true, resolved: true };
      case "CONTACTED":
        return { reviewed: false, contacted: false, resolved: true };
      case "RESOLVED":
        return { reviewed: false, contacted: false, resolved: false };
      default:
        return { reviewed: true, contacted: true, resolved: true };
    }
  };

  return (
    <div className="page-shell">
      <ModuleTabs
        title="Feedback"
        description="Customer ratings, complaint follow-up and staff/service analytics."
        items={[
          { label: "Feedback Inbox", to: "/admin/feedback" },
          { label: "Analytics & Reports", to: "/admin/feedback/reports" }
        ]}
      />
      {status.error && <div className="panel-card"><p className="error-text">{status.error}</p></div>}
      {status.success && <div className="panel-card"><p className="success-text">{status.success}</p></div>}

      {mode === "feedback" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18, color: "#1e293b" }}>Recent Feedback</h3>
            
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", padding: "6px 12px", borderRadius: 8, border: "1px solid #cbd5e1" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Filter Status:</span>
                <CustomSelect 
                  value={filters.status} 
                  onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                  style={{ border: "none", outline: "none", fontSize: 13, fontWeight: 700, color: "#0f172a", background: "transparent", cursor: "pointer" }}
                >
                  <option value="">All statuses</option>
                  <option value="NEW">New</option>
                  <option value="REVIEWED">Reviewed</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="RESOLVED">Resolved</option>
                </CustomSelect>
              </div>
              {filters.status && (
                <button type="button" onClick={() => setFilters({ status: "" })} style={{ background: "none", border: "none", color: "#6366f1", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>Clear</button>
              )}
            </div>
          </div>

          {loading ? <PageLoader compact title="Loading feedback inbox" message="Preparing ratings, branch filters, and customer comments for review." /> : null}
          <div style={{ display: "grid", gap: 16 }}>
            {rows.map((row) => {
              const buttons = getVisibleButtons(row.status);
              const isBusy = processingId === row.id;
              const badge = statusBadges[row.status] || { bg: "#f1f5f9", color: "#475569" };
              
              return (
                <div key={row.id} style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0", borderLeft: `4px solid ${statusColors[row.status] || "#cbd5e1"}`, display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
                          <User size={16} color="#64748b" /> {row.customer?.name || "Anonymous Customer"}
                        </span>
                        <span style={{ background: badge.bg, color: badge.color, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
                          {row.status}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#64748b", fontSize: 13 }}>
                        {renderStars(row.rating)}
                        {row.customer?.email && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Mail size={14} /> {row.customer.email}</span>
                        )}
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={14} /> {new Date(row.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: "#f8fafc", padding: 16, borderRadius: 8, color: "#334155", fontSize: 14, lineHeight: 1.5, border: "1px solid #f1f5f9", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <MessageCircle size={18} color="#94a3b8" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontStyle: row.message ? "normal" : "italic", color: row.message ? "#334155" : "#94a3b8" }}>
                      {row.message || "No comment provided by the customer."}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end", marginTop: 8 }}>
                    {buttons.reviewed && (
                      <button type="button" disabled={isBusy} onClick={() => updateStatus(row.id, "REVIEWED")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        <CheckCircle size={14} /> {isBusy ? "..." : "Mark Reviewed"}
                      </button>
                    )}
                    {buttons.contacted && (
                      <button type="button" disabled={isBusy} onClick={() => updateStatus(row.id, "CONTACTED")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        <MailPlus size={14} /> {isBusy ? "..." : "Mark Contacted"}
                      </button>
                    )}
                    {buttons.resolved && (
                      <button type="button" disabled={isBusy} onClick={() => updateStatus(row.id, "RESOLVED")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        <Check size={14} /> {isBusy ? "..." : "Mark Resolved"}
                      </button>
                    )}
                    <button type="button" disabled={isBusy} onClick={() => { setFollowUpFeedback(row); setFollowUpNote(""); setShowFollowUpModal(true); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: "#f59e0b", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      <AlertCircle size={14} /> {isBusy ? "..." : "Follow Up"}
                    </button>
                    <button type="button" disabled={isBusy} onClick={() => deleteFeedback(row.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 8, border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
            {!loading && !rows.length && (
              <EmptyState 
                title="No feedback yet" 
                message="Data comes directly from your customers! After a checkout or order is completed, customers receive an automated SMS/Email with a feedback link. Their ratings and reviews will automatically populate here." 
              />
            )}
          </div>
        </div>
      )}

      {mode === "reports" && report && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(226,232,240,0.8)" }}>
          <h3 style={{ margin: "0 0 24px", fontSize: 20, color: "#1e293b" }}>Feedback Analytics</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
            <div style={{ background: "#f8fafc", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Total Feedback</span>
              <span style={{ fontSize: 36, color: "#0f172a", fontWeight: 800 }}>{report.summary?.total || 0}</span>
            </div>
            <div style={{ background: "#f0fdf4", padding: 24, borderRadius: 12, border: "1px solid #bbf7d0", display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 13, color: "#166534", fontWeight: 600, textTransform: "uppercase" }}>Average Rating</span>
              <span style={{ fontSize: 36, color: "#15803d", fontWeight: 800 }}>{Number(report.summary?.averageRating || 0).toFixed(1)} <span style={{fontSize: 20}}>⭐</span></span>
            </div>
            <div style={{ background: "#fef2f2", padding: 24, borderRadius: 12, border: "1px solid #fecaca", display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 13, color: "#991b1b", fontWeight: 600, textTransform: "uppercase" }}>Negative Reviews</span>
              <span style={{ fontSize: 36, color: "#b91c1c", fontWeight: 800 }}>{report.summary?.negativeCount || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── FOLLOW-UP MODAL ── */}
      {showFollowUpModal && followUpFeedback && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowFollowUpModal(false)}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 450, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>Send Follow-Up Email</h2>
              <button onClick={() => setShowFollowUpModal(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#64748b" }}>✕</button>
            </div>
            <div style={{ padding: "0 24px 20px", flex: 1 }}>
              <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: 12 }}>
                Customer: <strong>{followUpFeedback.customer?.name || "N/A"}</strong> | Email: <strong>{followUpFeedback.customer?.email || "No email"}</strong>
              </p>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase" }}>Follow-Up Note *</label>
              <textarea
                rows={4}
                placeholder="Enter follow-up message to send as email..."
                value={followUpNote}
                onChange={(e) => setFollowUpNote(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: 6, boxSizing: "border-box", fontSize: "0.9rem", resize: "vertical" }}
              />
            </div>
            <div style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: 12, background: "#f8fafc" }}>
              <button type="button" onClick={() => setShowFollowUpModal(false)} style={{ padding: "10px 24px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button type="button" disabled={!followUpNote.trim() || followUpSubmitting} onClick={handleFollowUpSubmit} style={{ padding: "10px 24px", borderRadius: 6, border: "none", background: "#f59e0b", color: "#fff", fontWeight: 600, cursor: followUpNote.trim() ? "pointer" : "not-allowed", opacity: followUpNote.trim() ? 1 : 0.5 }}>
                {followUpSubmitting ? "Sending..." : "Send Follow-Up"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
