import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import CustomSelect from "../../components/CustomSelect";
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
  const [selectedTicket, setSelectedTicket] = useState(null);

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
            <CustomSelect
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              options={[
                { label: "All Statuses", value: "" },
                { label: "Open", value: "OPEN" },
                { label: "In Progress", value: "IN_PROGRESS" },
                { label: "Resolved", value: "RESOLVED" },
                { label: "Closed", value: "CLOSED" }
              ]}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Priority</label>
            <CustomSelect
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              options={[
                { label: "All Priorities", value: "" },
                { label: "Low", value: "LOW" },
                { label: "Medium", value: "MEDIUM" },
                { label: "High", value: "HIGH" },
                { label: "Urgent", value: "URGENT" }
              ]}
            />
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
      <div className="panel-card" style={{ background: "white", padding: 0, overflow: "hidden" }}>
        {loading ? (
          <PageLoader title="Loading support queue" message="Pulling ticket status, internal notes, conversations, and recent events." />
        ) : rows.length ? (
          <div className="table-responsive">
            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#64748b" }}>TICKET ID</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#64748b" }}>SALON</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#64748b" }}>SUBJECT</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#64748b" }}>PRIORITY</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#64748b" }}>STATUS</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#64748b" }}>UPDATED</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, color: "#64748b" }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const statBg = row.status === "OPEN" ? "#fee2e2" : row.status === "PENDING" ? "#fff7ed" : row.status === "RESOLVED" ? "#dcfce7" : "#f1f5f9";
                  const statColor = row.status === "OPEN" ? "#991b1b" : row.status === "PENDING" ? "#c2410c" : row.status === "RESOLVED" ? "#166534" : "#475569";
                  const prioBg = row.priority === "URGENT" ? "#fee2e2" : row.priority === "HIGH" ? "#ffedd5" : row.priority === "MEDIUM" ? "#e0f2fe" : "#f8fafc";
                  const prioColor = row.priority === "URGENT" ? "#b91c1c" : row.priority === "HIGH" ? "#c2410c" : row.priority === "MEDIUM" ? "#0369a1" : "#64748b";
                  return (
                    <tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.2s" }} onClick={() => setSelectedTicket(row)} onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "16px", fontSize: 13, fontWeight: 700, color: "#6366f1" }}>#{row.id.substring(0, 8)}</td>
                      <td style={{ padding: "16px", fontSize: 13, fontWeight: 600, color: "#334155" }}>{row.salon?.name || "Global"}</td>
                      <td style={{ padding: "16px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{row.title}</td>
                      <td style={{ padding: "16px" }}><span className="badge" style={{ background: prioBg, color: prioColor, fontWeight: 700, fontSize: 11 }}>{row.priority}</span></td>
                      <td style={{ padding: "16px" }}><span className="badge" style={{ background: statBg, color: statColor, fontWeight: 700, fontSize: 11 }}>{row.status}</span></td>
                      <td style={{ padding: "16px", fontSize: 12, color: "#64748b" }}>{new Date(row.updatedAt).toLocaleDateString()}</td>
                      <td style={{ padding: "16px", textAlign: "right" }}>
                        <button type="button" style={{ background: "#eef2ff", color: "#4f46e5", border: "none", padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>View</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No support tickets yet"
            message="Platform-wide support requests will appear here as soon as salons start creating them."
            label="Support"
          />
        )}
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", zIndex: 9999, display: "flex", justifyContent: "flex-end", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "white", width: "100%", maxWidth: 700, height: "100%", display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(0,0,0,0.1)", animation: "slideInRight 0.3s ease" }}>
            
            {/* Modal Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", background: "#eef2ff", padding: "2px 8px", borderRadius: 6, marginBottom: 4, display: "inline-block" }}>
                  #{selectedTicket.id.substring(0, 8)}
                </span>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{selectedTicket.title}</h2>
                <div style={{ display: "flex", gap: 12, fontSize: 13, color: "#64748b", marginTop: 4 }}>
                  <span style={{ fontWeight: 600, color: "#334155" }}><Building2 size={12} style={{ display: "inline", verticalAlign: "middle" }}/> {selectedTicket.salon?.name || "Global"}</span>
                  <span><Tag size={12} style={{ display: "inline", verticalAlign: "middle" }}/> {selectedTicket.category || "General"}</span>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedTicket(null)} style={{ background: "transparent", border: "none", fontSize: 24, color: "#94a3b8", cursor: "pointer" }}>&times;</button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
              <div style={{ background: "#f8fafc", borderLeft: "4px solid #6366f1", padding: "16px 20px", borderRadius: "0 10px 10px 0", fontSize: 14, color: "#334155", lineHeight: 1.6, marginBottom: 24, whiteSpace: "pre-wrap" }}>
                {selectedTicket.description}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Internal Support Notes</label>
                  <textarea
                    rows="1"
                    value={notes[selectedTicket.id] || ""}
                    onChange={(e) => setNotes({ ...notes, [selectedTicket.id]: e.target.value })}
                    placeholder="Type internal staff notes here..."
                    disabled={selectedTicket.status === "CLOSED"}
                    style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: 10, fontSize: 13, background: "#f8fafc", width: "100%", resize: "vertical", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Assigned Support Agent</label>
                  <input
                    value={assignedAgents[selectedTicket.id] || ""}
                    onChange={(e) => setAssignedAgents({ ...assignedAgents, [selectedTicket.id]: e.target.value })}
                    placeholder="Enter support agent name..."
                    disabled={selectedTicket.status === "CLOSED"}
                    style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: 10, fontSize: 13, background: "#f8fafc", width: "100%", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {(selectedTicket.messages && selectedTicket.messages.length > 0) && (
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 20, marginBottom: 24 }}>
                  <h5 style={{ margin: "0 0 16px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8 }}>
                    Conversation Thread ({selectedTicket.messages.length})
                  </h5>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {selectedTicket.messages.map((message) => {
                      const isAgent = message.authorType === "SUPPORT" || message.authorType === "SYSTEM";
                      return (
                        <div key={message.id} style={{ display: "flex", flexDirection: "column", alignSelf: isAgent ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 11, color: "#94a3b8", marginBottom: 4, padding: "0 4px" }}>
                            <strong>{message.authorName} ({message.authorType})</strong>
                            <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div style={{
                            background: isAgent ? "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)" : "#f1f5f9",
                            color: isAgent ? "white" : "#0f172a",
                            borderRadius: isAgent ? "16px 16px 0 16px" : "16px 16px 16px 0",
                            padding: "14px 18px",
                            fontSize: 14,
                            lineHeight: 1.5,
                            whiteSpace: "pre-wrap",
                            boxShadow: isAgent ? "0 4px 12px rgba(59,130,246,0.15)" : "none"
                          }}>
                            {message.message}
                            {message.attachmentUrl && (
                              <div style={{ marginTop: 10, fontSize: 12, borderTop: "1px dashed rgba(255,255,255,0.3)", paddingTop: 8 }}>
                                🔗 <a href={message.attachmentUrl} target="_blank" rel="noreferrer" style={{ color: isAgent ? "white" : "#2563eb", textDecoration: "underline", fontWeight: 600 }}>View Attachment</a>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer / Actions */}
            <div style={{ padding: "12px 24px", borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
              {selectedTicket.status !== "CLOSED" ? (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Compose Official Reply to Salon</label>
                    <textarea
                      rows="2"
                      value={replyDrafts[selectedTicket.id] || ""}
                      placeholder="Type official support desk response to the salon owner..."
                      onChange={(e) => setReplyDrafts({ ...replyDrafts, [selectedTicket.id]: e.target.value })}
                      style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: 12, fontSize: 14, background: "white", width: "100%", resize: "vertical", boxSizing: "border-box" }}
                    />
                    <div style={{ marginTop: 8 }}>
                      <input
                        value={replyAttachments[selectedTicket.id] || ""}
                        placeholder="Optional Attachment URL (screenshot/document)..."
                        onChange={(e) => setReplyAttachments({ ...replyAttachments, [selectedTicket.id]: e.target.value })}
                        style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 12px", fontSize: 13, background: "white", width: "100%", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" onClick={() => { updateTicket(selectedTicket.id, { internalNote: notes[selectedTicket.id] || "", assignedAgentName: assignedAgents[selectedTicket.id] || null }); setSelectedTicket({...selectedTicket, internalNote: notes[selectedTicket.id], assignedAgentName: assignedAgents[selectedTicket.id]}); }} style={{ background: "white", color: "#475569", border: "1px solid #cbd5e1", padding: "8px 14px", fontWeight: 700, borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Save Note</button>
                      <button type="button" onClick={() => { updateTicket(selectedTicket.id, { status: "CLOSED", internalNote: notes[selectedTicket.id] || "", assignedAgentName: assignedAgents[selectedTicket.id] || null }); setSelectedTicket({...selectedTicket, status: "CLOSED"}); }} style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca", padding: "8px 14px", fontWeight: 700, borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Close Ticket</button>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" onClick={() => sendReply(selectedTicket.id, "PENDING")} style={{ background: "#4f46e5", color: "white", border: "none", padding: "8px 14px", fontWeight: 700, borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
                        Reply & Keep Pending
                      </button>
                      <button type="button" onClick={() => { sendReply(selectedTicket.id, "RESOLVED"); setSelectedTicket({...selectedTicket, status: "RESOLVED"}); }} style={{ background: "#16a34a", color: "white", border: "none", padding: "8px 14px", fontWeight: 700, borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
                        Reply & Resolve
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => { updateTicket(selectedTicket.id, { status: "OPEN" }); setSelectedTicket({...selectedTicket, status: "OPEN"}); }} style={{ background: "#eef2ff", color: "#3730a3", border: "1px solid #c7d2fe", padding: "10px 20px", fontWeight: 700, borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Reopen Ticket</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html:`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}} />
    </div>
  );
}
