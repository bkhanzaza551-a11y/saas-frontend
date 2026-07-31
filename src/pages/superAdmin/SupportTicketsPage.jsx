import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import { MessageSquare, Calendar, User, Tag, AlertCircle, Filter, RefreshCw, FileText, CheckCircle2, Bookmark, Building2, Send, Paperclip, Shield, Clock, Sparkles } from "lucide-react";

export default function SuperAdminSupportTicketsPage() {
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ q: "", status: "", priority: "" });
  const [savingId, setSavingId] = useState("");
  const [notes, setNotes] = useState({});
  const [assignedAgents, setAssignedAgents] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyAttachments, setReplyAttachments] = useState({});
  const [status, setStatus] = useState({ error: "", success: "" });
  const [loading, setLoading] = useState(true);

  const load = async (nextFilters = filters) => {
    setLoading(true);
    try {
      const response = await api.get("/super-admin/support-tickets", {
        params: {
          ...(nextFilters.q ? { q: nextFilters.q } : {}),
          ...(nextFilters.status ? { status: nextFilters.status } : {}),
          ...(nextFilters.priority ? { priority: nextFilters.priority } : {})
        }
      });
      const data = response.data || [];
      setRows(data);
      setNotes(Object.fromEntries(data.map((row) => [row.id, row.internalNote || ""])));
      setAssignedAgents(Object.fromEntries(data.map((row) => [row.id, row.assignedAgentName || ""])));
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not load support tickets."), success: "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    setStatus({ error: "", success: "" });
    api.get("/super-admin/support-tickets", {
      params: {
        ...(filters.q ? { q: filters.q } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.priority ? { priority: filters.priority } : {})
      }
    }).then((response) => {
      if (!active) return;
      const data = response.data || [];
      setRows(data);
      setNotes(Object.fromEntries(data.map((row) => [row.id, row.internalNote || ""])));
      setAssignedAgents(Object.fromEntries(data.map((row) => [row.id, row.assignedAgentName || ""])));
      setLoading(false);
    }).catch((err) => {
      if (!active) return;
      setStatus({ error: formatApiError(err, "Could not load support tickets."), success: "" });
      setLoading(false);
    });
    return () => { active = false; };
  }, [filters]);

  const updateTicket = async (ticketId, data) => {
    setSavingId(ticketId);
    setStatus({ error: "", success: "" });
    try {
      await api.patch(`/super-admin/support-tickets/${ticketId}`, data);
      await load();
      setStatus({ error: "", success: "Ticket updated successfully." });
      setTimeout(() => setStatus(s => ({ ...s, success: "" })), 3000);
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not update ticket"), success: "" });
    } finally {
      setSavingId("");
    }
  };

  const sendReply = async (ticketId, nextStatus = "PENDING") => {
    if (!replyDrafts[ticketId]?.trim()) return;
    setSavingId(ticketId);
    setStatus({ error: "", success: "" });
    try {
      await api.post(`/super-admin/support-tickets/${ticketId}/messages`, {
        message: replyDrafts[ticketId] || "",
        attachmentUrl: replyAttachments[ticketId] || "",
        status: nextStatus
      });
      setReplyDrafts((current) => ({ ...current, [ticketId]: "" }));
      setReplyAttachments((current) => ({ ...current, [ticketId]: "" }));
      await load();
      setStatus({ error: "", success: "Support reply sent." });
      setTimeout(() => setStatus(s => ({ ...s, success: "" })), 3000);
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not send reply"), success: "" });
    } finally {
      setSavingId("");
    }
  };

  const stats = {
    total: rows.length,
    open: rows.filter(r => r.status === "OPEN").length,
    urgent: rows.filter(r => r.priority === "URGENT").length,
    resolved: rows.filter(r => r.status === "RESOLVED" || r.status === "CLOSED").length,
  };

  return (
    <div className="page-shell super-admin-page">
      {/* Hero Banner */}
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <Shield size={26} style={{ color: "#6366f1" }} /> Platform Support Ticket Queue
            </h1>
            <p style={{ marginBottom: 0 }}>Global helpdesk inbox for managing incoming salon support requests, internal notes, agent assignments, and responses.</p>
          </div>
          <div className="badge-row">
            <span className="badge" style={{ background: "#eff6ff", color: "#1e40af", fontWeight: 700 }}>Total Queue: {stats.total}</span>
            <span className="badge" style={{ background: "#fee2e2", color: "#991b1b", fontWeight: 700 }}>Open Issues: {stats.open}</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
        <div className="panel-card" style={{ padding: 18, borderLeft: "4px solid #6366f1" }}>
          <div style={{ color: "#64748b", fontSize: 12, fontWeight: 600 }}>Total Ticket Queue</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>{stats.total}</div>
        </div>
        <div className="panel-card" style={{ padding: 18, borderLeft: "4px solid #ef4444" }}>
          <div style={{ color: "#64748b", fontSize: 12, fontWeight: 600 }}>Action Required (Open)</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#dc2626", marginTop: 4 }}>{stats.open}</div>
        </div>
        <div className="panel-card" style={{ padding: 18, borderLeft: "4px solid #f97316" }}>
          <div style={{ color: "#64748b", fontSize: 12, fontWeight: 600 }}>Urgent Priority</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#ea580c", marginTop: 4 }}>{stats.urgent}</div>
        </div>
        <div className="panel-card" style={{ padding: 18, borderLeft: "4px solid #22c55e" }}>
          <div style={{ color: "#64748b", fontSize: 12, fontWeight: 600 }}>Resolved & Closed</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#16a34a", marginTop: 4 }}>{stats.resolved}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="panel-card" style={{ marginBottom: 24, padding: 18, background: "white" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto auto", gap: 12, alignItems: "end" }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Search Keyword</label>
            <input
              value={filters.q}
              placeholder="Search title, description, category, or salon..."
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, fontSize: 13, border: "1px solid #cbd5e1", background: "#f8fafc", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, fontSize: 13, border: "1px solid #cbd5e1", background: "white", boxSizing: "border-box" }}
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="PENDING">Pending</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, fontSize: 13, border: "1px solid #cbd5e1", background: "white", boxSizing: "border-box" }}
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => load(filters)}
            style={{ padding: "9px 18px", borderRadius: 8, background: "#6366f1", color: "white", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}
          >
            Apply Filters
          </button>

          <button
            type="button"
            onClick={() => setFilters({ q: "", status: "", priority: "" })}
            style={{ padding: "9px 16px", borderRadius: 8, background: "#f1f5f9", color: "#475569", fontWeight: 700, fontSize: 13, border: "1px solid #e2e8f0", cursor: "pointer" }}
          >
            Reset
          </button>
        </div>
      </div>

      {status.error && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 16 }}>{status.error}</p>}
      {status.success && <p style={{ color: "#10b981", fontSize: 13, marginBottom: 16 }}>{status.success}</p>}

      {/* Ticket List */}
      <div>
        {loading ? (
          <PageLoader title="Loading support queue" message="Pulling ticket status, internal notes, conversations, and recent events." />
        ) : rows.length ? rows.map((row) => {
          const isClosed = row.status === "CLOSED";
          const statBg = row.status === "OPEN" ? "#fee2e2" : row.status === "PENDING" ? "#fff7ed" : row.status === "RESOLVED" ? "#dcfce7" : "#f1f5f9";
          const statColor = row.status === "OPEN" ? "#991b1b" : row.status === "PENDING" ? "#c2410c" : row.status === "RESOLVED" ? "#166534" : "#475569";
          const prioBg = row.priority === "URGENT" ? "#fee2e2" : row.priority === "HIGH" ? "#ffedd5" : row.priority === "MEDIUM" ? "#e0f2fe" : "#f8fafc";
          const prioColor = row.priority === "URGENT" ? "#b91c1c" : row.priority === "HIGH" ? "#c2410c" : row.priority === "MEDIUM" ? "#0369a1" : "#64748b";

          return (
            <div key={row.id} className="panel-card" style={{ padding: 24, marginBottom: 20, background: "white", border: "1px solid #e2e8f0" }}>
              {/* Ticket Header Bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, borderBottom: "1px solid #f1f5f9", paddingBottom: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", background: "#eef2ff", padding: "2px 8px", borderRadius: 6 }}>
                      #{row.id.substring(0, 8)}
                    </span>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{row.title}</h3>
                    <span className="badge" style={{ background: prioBg, color: prioColor, fontWeight: 700, fontSize: 11 }}>{row.priority} PRIORITY</span>
                    <span className="badge" style={{ background: statBg, color: statColor, fontWeight: 700, fontSize: 11 }}>{row.status}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 13, color: "#64748b" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 600, color: "#334155" }}><Building2 size={14} /> Salon: {row.salon?.name || "Global / System"}</span>
                    <span>•</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Tag size={14} /> Category: {row.category || "General"}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
                  <Calendar size={14} /> Updated: {new Date(row.updatedAt).toLocaleDateString()}
                </div>
              </div>

              {/* Description Body */}
              <div style={{ background: "#f8fafc", borderLeft: "4px solid #6366f1", padding: "16px 20px", borderRadius: "0 10px 10px 0", fontSize: 14, color: "#334155", lineHeight: 1.6, marginBottom: 20, whiteSpace: "pre-wrap" }}>
                {row.description}
              </div>

              {/* Internal Notes & Agent Assignment */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Internal Support Notes (Hidden from Salon)</label>
                  <textarea
                    rows="2"
                    value={notes[row.id] || ""}
                    onChange={(e) => setNotes({ ...notes, [row.id]: e.target.value })}
                    placeholder="Type internal staff notes here..."
                    disabled={isClosed}
                    style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: 10, fontSize: 13, background: "#f8fafc", width: "100%", resize: "vertical", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Assigned Support Agent</label>
                  <input
                    value={assignedAgents[row.id] || ""}
                    onChange={(e) => setAssignedAgents({ ...assignedAgents, [row.id]: e.target.value })}
                    placeholder="Enter support agent name..."
                    disabled={isClosed}
                    style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: 10, fontSize: 13, background: "#f8fafc", width: "100%", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Chat Thread Messages */}
              {(row.messages && row.messages.length > 0) && (
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16, marginBottom: 20 }}>
                  <h5 style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8 }}>
                    Conversation Thread ({row.messages.length})
                  </h5>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 300, overflowY: "auto" }}>
                    {row.messages.map((message) => {
                      const isAgent = message.authorType === "SUPPORT" || message.authorType === "SYSTEM";
                      return (
                        <div key={message.id} style={{ display: "flex", flexDirection: "column", alignSelf: isAgent ? "flex-end" : "flex-start", maxWidth: "82%" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11, color: "#94a3b8", marginBottom: 3 }}>
                            <strong>{message.authorName} ({message.authorType})</strong>
                            <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div style={{
                            background: isAgent ? "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)" : "#f1f5f9",
                            color: isAgent ? "white" : "#0f172a",
                            borderRadius: isAgent ? "12px 12px 0 12px" : "12px 12px 12px 0",
                            padding: "12px 16px",
                            fontSize: 13,
                            lineHeight: 1.5,
                            whiteSpace: "pre-wrap"
                          }}>
                            {message.message}
                            {message.attachmentUrl && (
                              <div style={{ marginTop: 8, fontSize: 11, borderTop: "1px dashed rgba(255,255,255,0.3)", paddingTop: 6 }}>
                                🔗 <a href={message.attachmentUrl} target="_blank" rel="noreferrer" style={{ color: isAgent ? "white" : "#2563eb", textDecoration: "underline" }}>View Attachment</a>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Toolbar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {!isClosed ? (
                    <>
                      <button type="button" onClick={() => updateTicket(row.id, { status: "PENDING", internalNote: notes[row.id] || "", assignedAgentName: assignedAgents[row.id] || null })} style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa", padding: "8px 14px", fontWeight: 700, borderRadius: 8, cursor: "pointer", fontSize: 12 }}>Mark Pending</button>
                      <button type="button" onClick={() => updateTicket(row.id, { status: "RESOLVED", internalNote: notes[row.id] || "", assignedAgentName: assignedAgents[row.id] || null })} style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0", padding: "8px 14px", fontWeight: 700, borderRadius: 8, cursor: "pointer", fontSize: 12 }}>Resolve Ticket</button>
                      <button type="button" onClick={() => updateTicket(row.id, { status: "CLOSED", internalNote: notes[row.id] || "", assignedAgentName: assignedAgents[row.id] || null })} style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca", padding: "8px 14px", fontWeight: 700, borderRadius: 8, cursor: "pointer", fontSize: 12 }}>Close Ticket</button>
                      <button type="button" onClick={() => updateTicket(row.id, { internalNote: notes[row.id] || "", assignedAgentName: assignedAgents[row.id] || null })} style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "8px 14px", fontWeight: 700, borderRadius: 8, cursor: "pointer", fontSize: 12 }}>Save Staff Note</button>
                    </>
                  ) : (
                    <button type="button" onClick={() => updateTicket(row.id, { status: "OPEN" })} style={{ background: "#eef2ff", color: "#3730a3", border: "1px solid #c7d2fe", padding: "8px 14px", fontWeight: 700, borderRadius: 8, cursor: "pointer", fontSize: 12 }}>Reopen Ticket</button>
                  )}
                  {savingId === row.id && <span style={{ fontSize: 12, color: "#6366f1", alignSelf: "center", fontWeight: 600 }}>Saving...</span>}
                </div>
              </div>

              {/* Reply Compose Box */}
              {!isClosed && (
                <div style={{ marginTop: 16, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Compose Official Reply to Salon</label>
                  <textarea
                    rows="3"
                    value={replyDrafts[row.id] || ""}
                    placeholder="Type official support desk response to the salon owner..."
                    onChange={(e) => setReplyDrafts({ ...replyDrafts, [row.id]: e.target.value })}
                    style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: 10, fontSize: 13, background: "#f8fafc", width: "100%", resize: "vertical", boxSizing: "border-box" }}
                  />
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
                    <input
                      value={replyAttachments[row.id] || ""}
                      placeholder="Optional Attachment URL (screenshot/document)..."
                      onChange={(e) => setReplyAttachments({ ...replyAttachments, [row.id]: e.target.value })}
                      style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 12px", fontSize: 12, background: "#f8fafc", flex: 1, boxSizing: "border-box" }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" onClick={() => sendReply(row.id, "PENDING")} style={{ background: "#4f46e5", color: "white", border: "none", padding: "9px 16px", fontWeight: 700, borderRadius: 8, cursor: "pointer", fontSize: 12 }}>
                        Reply & Keep Pending
                      </button>
                      <button type="button" onClick={() => sendReply(row.id, "RESOLVED")} style={{ background: "#16a34a", color: "white", border: "none", padding: "9px 16px", fontWeight: 700, borderRadius: 8, cursor: "pointer", fontSize: 12 }}>
                        Reply & Resolve
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        }) : (
          <EmptyState
            title="No support tickets yet"
            message="Platform-wide support requests will appear here as soon as salons start creating them."
            label="Support"
          />
        )}
      </div>
    </div>
  );
}
