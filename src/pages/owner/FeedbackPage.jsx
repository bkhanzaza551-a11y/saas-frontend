import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../../api/client";
import { useBranch } from '../../context/BranchContext';
import EmptyState from "../../components/EmptyState";
import ModuleTabs from "../../components/ModuleTabs";
import { formatApiError } from "../../utils/apiError";
import PageLoader from "../../components/PageLoader";

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
          { label: "Feedback", to: "/admin/feedback" },
          { label: "Reports", to: "/admin/feedback/reports" },
          { label: "Settings", to: "/admin/feedback/settings" }
        ]}
        actions={(
          <>
            <label>
              <span className="muted">Statuses</span>
              <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              <option value="">All statuses</option>
              <option value="NEW">New</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="CONTACTED">Contacted</option>
              <option value="RESOLVED">Resolved</option>
            </select>
            </label>
            <button type="button" className="secondary-button" onClick={() => setFilters({ status: "" })}>Reset</button>
          </>
        )}
      />
      {status.error && <div className="panel-card"><p className="error-text">{status.error}</p></div>}
      {status.success && <div className="panel-card"><p className="success-text">{status.success}</p></div>}

      {mode === "feedback" && (
        <div className="panel-card">
          <h3>Feedback Inbox</h3>
          {loading ? <PageLoader compact title="Loading feedback inbox" message="Preparing ratings, branch filters, and customer comments for review." /> : null}
          <div className="list-stack" style={{ maxHeight: "55vh", overflowY: "auto" }}>
            {rows.map((row) => {
              const buttons = getVisibleButtons(row.status);
              const isBusy = processingId === row.id;
              return (
                <div key={row.id} className="list-item">
                  <strong>{row.customer?.name || "Customer"} | Rating {row.rating}/5</strong>
                  <div className="item-meta">{row.status} | {row.message || "No comment"}</div>
                  <div className="inline-actions" style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {buttons.reviewed && (
                      <button type="button" className="secondary-button" disabled={isBusy} onClick={() => updateStatus(row.id, "REVIEWED")}>
                        {isBusy ? "..." : "Mark Reviewed"}
                      </button>
                    )}
                    {buttons.contacted && (
                      <button type="button" className="secondary-button" disabled={isBusy} onClick={() => updateStatus(row.id, "CONTACTED")}>
                        {isBusy ? "..." : "Mark Contacted"}
                      </button>
                    )}
                    {buttons.resolved && (
                      <button type="button" className="secondary-button" style={{ background: "#16a34a", color: "#fff", border: "none" }} disabled={isBusy} onClick={() => updateStatus(row.id, "RESOLVED")}>
                        {isBusy ? "..." : "Mark Resolved"}
                      </button>
                    )}
                    <button type="button" className="secondary-button" style={{ background: "#dc2626", color: "#fff", border: "none" }} disabled={isBusy} onClick={() => deleteFeedback(row.id)}>
                      {isBusy ? "..." : "Delete"}
                    </button>
                    <button type="button" className="secondary-button" style={{ background: "#f59e0b", color: "#fff", border: "none" }} disabled={isBusy} onClick={() => {
                      setFollowUpFeedback(row);
                      setFollowUpNote("");
                      setShowFollowUpModal(true);
                    }}>
                      {isBusy ? "..." : "Follow Up"}
                    </button>
                  </div>
                </div>
              );
            })}
            {!loading && !rows.length && <EmptyState title="No feedback yet" message="Customer ratings and review responses will appear here once feedback starts coming in." />}
          </div>
        </div>
      )}

      {mode === "reports" && report && (
        <div className="panel-card">
          <h3>Feedback Reports</h3>
          <div className="badge-row">
            <span className="badge">Total {report.summary?.total || 0}</span>
            <span className="badge">Average {Number(report.summary?.averageRating || 0).toFixed(2)}</span>
            <span className="badge">Negative {report.summary?.negativeCount || 0}</span>
          </div>
        </div>
      )}

      {mode === "settings" && report && (
        <div className="panel-card">
          <h3>Feedback Request Settings</h3>
          <p className="muted">WhatsApp: {report.settings?.whatsappNumber || "-"}</p>
          <p className="muted">Booking Notes: {report.settings?.bookingNotes || "-"}</p>
          <p className="muted">Cancellation Policy: {report.settings?.cancellationPolicy || "-"}</p>
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
