import { useEffect, useState } from "react";
import { api } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import { formatApiError } from "../../utils/apiError";
import { useAuth } from "../../context/AuthContext";
import { LifeBuoy, Search, Filter, MessageSquare, Plus, Clock, CheckCircle2, XCircle, Send, Paperclip, AlertTriangle, HelpCircle, Shield, Sparkles } from "lucide-react";

import CustomSelect from "../../components/CustomSelect";

const formatAttachmentValue = (value) => String(value || "").trim();
const isAttachmentLink = (value) => /^(https?:\/\/|data:)/i.test(formatAttachmentValue(value));

const isImageAttachment = (value) => {
  const url = String(value || "").trim();
  return /^data:image\//i.test(url) || /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url);
};

const getAttachmentMeta = (value) => {
  const url = String(value || "").trim();
  if (!url) return { label: "Attachment", isImage: false, isDoc: false };
  if (isImageAttachment(url)) return { label: "View Full Image", isImage: true, isDoc: false };
  if (/^data:application\/pdf/i.test(url) || /\.pdf$/i.test(url)) return { label: "Open PDF Document", isImage: false, isDoc: false };
  if (/wordprocessingml|document|\.docx?$/i.test(url)) return { label: "Download Word Document (.docx)", isImage: false, isDoc: true };
  if (/spreadsheetml|sheet|\.xlsx?$/i.test(url)) return { label: "Download Excel Spreadsheet (.xlsx)", isImage: false, isDoc: true };
  return { label: "Download Attachment", isImage: false, isDoc: true };
};

export default function SupportTicketsPage() {
  const { auth } = useAuth();
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ q: "", status: "", priority: "" });
  const [form, setForm] = useState({ title: "", category: "General", priority: "MEDIUM", description: "", attachmentUrl: "" });
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyAttachments, setReplyAttachments] = useState({});
  const [status, setStatus] = useState({ error: "", success: "", loading: true });
  const [submitting, setSubmitting] = useState(false);
  const [replyingId, setReplyingId] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const permissions = auth?.membership?.permissions || {};
  const canCreateTicket = Array.isArray(permissions.support) && permissions.support.includes("create");
  const isOwner = auth?.membership?.salonRole === "SALON_OWNER";
  const isSuperAdmin = auth?.user?.systemRole === "SUPER_ADMIN";
  const hasCreateAccess = isOwner || isSuperAdmin || canCreateTicket;

  const [reloadKey, setReloadKey] = useState(0);
  const triggerReload = () => setReloadKey(k => k + 1);

  useEffect(() => {
    let active = true;
    api.get("/owner/support-tickets", {
      params: {
        ...(filters.q ? { q: filters.q } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.priority ? { priority: filters.priority } : {})
      }
    }).then((response) => {
      if (active) {
        setRows(response.data || []);
        setStatus((current) => ({ ...current, loading: false }));
      }
    }).catch(() => {
      if (active) setStatus((current) => ({ ...current, loading: false }));
    });
    return () => { active = false; };
  }, [filters, reloadKey]);

  useEffect(() => {
    if (!selectedTicket) return;
    const interval = setInterval(() => {
      api.get(`/owner/support-tickets/${selectedTicket.id}`).then(res => {
        if (res.data) setSelectedTicket(res.data);
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedTicket?.id]);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setStatus({ error: "", success: "", loading: false });
    setSubmitting(true);
    try {
      await api.post("/owner/support-tickets", form);
      setForm({ title: "", category: "General", priority: "MEDIUM", description: "", attachmentUrl: "" });
      triggerReload();
      setStatus({ error: "", success: "Support ticket raised successfully!" });
      setTimeout(() => setStatus(s => ({ ...s, success: "" })), 4000);
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not create support ticket"), success: "" });
    } finally {
      setSubmitting(false);
    }
  };

  const sendReply = async (ticketId) => {
    if (!replyDrafts[ticketId]?.trim()) return;
    setStatus({ error: "", success: "", loading: false });
    setReplyingId(ticketId);
    try {
      await api.post(`/owner/support-tickets/${ticketId}/messages`, {
        message: replyDrafts[ticketId] || "",
        attachmentUrl: replyAttachments[ticketId] || ""
      });
      setReplyDrafts((current) => ({ ...current, [ticketId]: "" }));
      setReplyAttachments((current) => ({ ...current, [ticketId]: "" }));
      triggerReload();
      setStatus({ error: "", success: "Reply sent to support desk." });
      setTimeout(() => setStatus(s => ({ ...s, success: "" })), 4000);
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not send reply"), success: "" });
    } finally {
      setReplyingId(null);
    }
  };

  const stats = {
    total: rows.length,
    open: rows.filter(r => r.status === "OPEN").length,
    pending: rows.filter(r => r.status === "WAITING_FOR_SALON").length,
    resolved: rows.filter(r => r.status === "RESOLVED" || r.status === "CLOSED").length,
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case "OPEN": return <span className="badge" style={{ background: "#e0e7ff", color: "#4338ca", fontWeight: 700 }}>Open</span>;
      case "IN_PROGRESS": return <span className="badge" style={{ background: "#fef3c7", color: "#b45309", fontWeight: 700 }}>In Progress</span>;
      case "WAITING_FOR_SALON": return <span className="badge" style={{ background: "#fff7ed", color: "#c2410c", fontWeight: 700 }}>Waiting for Salon</span>;
      case "RESOLVED": return <span className="badge" style={{ background: "#dcfce7", color: "#166534", fontWeight: 700 }}>Resolved</span>;
      case "CLOSED": return <span className="badge" style={{ background: "#f1f5f9", color: "#64748b", fontWeight: 700 }}>Closed</span>;
      default: return <span className="badge" style={{ background: "#f1f5f9", color: "#475569" }}>{s}</span>;
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case "LOW": return <span className="badge" style={{ background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }}>Low</span>;
      case "MEDIUM": return <span className="badge" style={{ background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd" }}>Medium</span>;
      case "HIGH": return <span className="badge" style={{ background: "#ffedd5", color: "#c2410c", border: "1px solid #fed7aa" }}>High</span>;
      case "URGENT": return <span className="badge" style={{ background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca", fontWeight: 700 }}>🔥 Urgent</span>;
      default: return <span className="badge">{p}</span>;
    }
  };

  return (
    <div className="page-shell">
      {/* Hero Banner */}
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <LifeBuoy size={26} style={{ color: "#6366f1" }} /> Support & Help Desk
            </h1>
            <p style={{ marginBottom: 0 }}>Raise support tickets for billing, feature assistance, technical queries, or system issues and track live resolutions.</p>
          </div>
          <div className="badge-row">
            <span className="badge" style={{ background: "#e0e7ff", color: "#3730a3", fontWeight: 700 }}>Total: {stats.total}</span>
            <span className="badge" style={{ background: "#fee2e2", color: "#991b1b", fontWeight: 700 }}>Active Open: {stats.open}</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div className="panel-card" style={{ padding: 18, borderLeft: "4px solid #6366f1" }}>
          <div style={{ color: "#64748b", fontSize: 12, fontWeight: 600 }}>Total Tickets Raised</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>{stats.total}</div>
        </div>
        <div className="panel-card" style={{ padding: 18, borderLeft: "4px solid #3b82f6" }}>
          <div style={{ color: "#64748b", fontSize: 12, fontWeight: 600 }}>Open / In Review</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#2563eb", marginTop: 4 }}>{stats.open}</div>
        </div>
        <div className="panel-card" style={{ padding: 18, borderLeft: "4px solid #f97316" }}>
          <div style={{ color: "#64748b", fontSize: 12, fontWeight: 600 }}>Pending Response</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#ea580c", marginTop: 4 }}>{stats.pending}</div>
        </div>
        <div className="panel-card" style={{ padding: 18, borderLeft: "4px solid #22c55e" }}>
          <div style={{ color: "#64748b", fontSize: 12, fontWeight: 600 }}>Resolved Tickets</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#16a34a", marginTop: 4 }}>{stats.resolved}</div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div style={{ display: "grid", gridTemplateColumns: hasCreateAccess ? "1fr 2fr" : "1fr", gap: 24, alignItems: "start" }} className="responsive-grid">

        {/* Left Column: Create Ticket Form */}
        {hasCreateAccess && (
          <div className="panel-card" style={{ padding: 24, position: "sticky", top: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 17, color: "#0f172a", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={18} style={{ color: "#6366f1" }} /> Raise Support Ticket
            </h3>
            <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 20px" }}>Need help? Submit a ticket and our technical support engineering team will respond shortly.</p>

            {status.error && (
              <div style={{ padding: 12, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 8, fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <XCircle size={16} /> {status.error}
              </div>
            )}
            {status.success && (
              <div style={{ padding: 12, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", borderRadius: 8, fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={16} /> {status.success}
              </div>
            )}

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>Subject / Title *</label>
                <input
                  required
                  value={form.title}
                  placeholder="e.g., Billing discrepancy in invoice #1042"
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>Category</label>
                  <CustomSelect
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14, background: "white", boxSizing: "border-box" }}
                  >
                    <option value="General">General</option>
                    <option value="Login / Account">Login / Account</option>
                    <option value="POS">POS</option>
                    <option value="Appointments">Appointments</option>
                    <option value="Inventory">Inventory</option>
                    <option value="Billing">Billing</option>
                    <option value="Subscription">Subscription</option>
                    <option value="Product Request">Product Request</option>
                    <option value="Staff Request">Staff Request</option>
                    <option value="Technical Issue">Technical Issue</option>
                    <option value="Feature Request">Feature Request</option>
                  </CustomSelect>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>Priority</label>
                  <CustomSelect
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14, background: "white", boxSizing: "border-box" }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </CustomSelect>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>Description *</label>
                <textarea
                  required
                  rows="4"
                  value={form.description}
                  placeholder="Describe the issue in detail, steps to reproduce, or relevant context..."
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>Attach File (Optional)</label>
                <div style={{ position: "relative" }}>
                  <Paperclip size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setForm({ ...form, attachmentUrl: reader.result });
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ width: "100%", padding: "10px 12px 10px 36px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>
                {form.attachmentUrl && <span style={{ fontSize: 11, color: "#16a34a", marginTop: 4, display: "block" }}>File attached</span>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: 14,
                  background: "var(--sf-accent, #6366f1)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 6
                }}
              >
                <Plus size={18} /> {submitting ? "Submitting Ticket..." : "Submit Support Ticket"}
              </button>
            </form>
          </div>
        )}

        {/* Right Column: Ticket Inbox & Thread */}
        <div className="panel-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>Support Queue & Inbox</h3>
            <span style={{ fontSize: 12, background: "#f1f5f9", color: "#475569", padding: "4px 10px", borderRadius: 100, fontWeight: 700 }}>
              {rows.length} Ticket{rows.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Filter Bar */}
          <div style={{ padding: 14, background: "#f8fafc", borderRadius: 10, marginBottom: 20, display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 10, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <Search size={15} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input
                value={filters.q}
                placeholder="Search subject, category..."
                onChange={e => setFilters({ ...filters, q: e.target.value })}
                style={{ width: "100%", padding: "8px 10px 8px 32px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }}
              />
            </div>

            <CustomSelect
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
              style={{ padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, background: "white" }}
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_SALON">Waiting for Salon</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </CustomSelect>

            <CustomSelect
              value={filters.priority}
              onChange={e => setFilters({ ...filters, priority: e.target.value })}
              style={{ padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, background: "white" }}
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </CustomSelect>

            <button
              type="button"
              onClick={() => setFilters({ q: "", status: "", priority: "" })}
              style={{ padding: "8px 14px", background: "white", border: "1px solid #cbd5e1", color: "#64748b", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              <Filter size={14} /> Clear
            </button>
          </div>

          {status.loading ? (
            <div style={{ padding: 40 }}><PageLoader compact title="Loading support queue" /></div>
          ) : selectedTicket ? (
            <div>
              <button onClick={() => setSelectedTicket(null)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer", marginBottom: 16, transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#e2e8f0"} onMouseLeave={e => e.currentTarget.style.background = "#f1f5f9"}>← Back to Tickets</button>

              <div style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", borderRadius: 12, padding: "20px 24px", marginBottom: 20, color: "white" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: 6 }}>#{selectedTicket.id?.substring(0, 8) || "—"}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: 6 }}>{selectedTicket.status}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: 6 }}>{selectedTicket.priority}</span>
                </div>
                <h2 style={{ margin: "0 0 4px", fontSize: "1.1rem", fontWeight: 800 }}>{selectedTicket.title}</h2>
                <div style={{ fontSize: 12, opacity: 0.85 }}>Created on {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" }) : ""}</div>
              </div>

              <div style={{ background: "#f9fafb", padding: 16, borderRadius: 10, border: "1px solid #f3f4f6", color: "#334155", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: 16 }}>
                {selectedTicket.description}
                {selectedTicket.attachmentUrl && (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed #e2e8f0" }}>
                    {isImageAttachment(selectedTicket.attachmentUrl) ? (
                      <div>
                        <img src={selectedTicket.attachmentUrl} alt="Attachment" style={{ maxWidth: 300, maxHeight: 220, borderRadius: 8, border: "1px solid #cbd5e1", display: "block", marginBottom: 6 }} />
                        <a href={selectedTicket.attachmentUrl} target="_blank" rel="noreferrer" style={{ color: "#2563eb", fontWeight: 600, fontSize: 12 }}>Open Full Image &rarr;</a>
                      </div>
                    ) : (
                      <a href={selectedTicket.attachmentUrl} target="_blank" rel="noreferrer" download style={{ color: "#2563eb", fontWeight: 600, fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, textDecoration: "none" }}>
                        <Paperclip size={13} /> {getAttachmentMeta(selectedTicket.attachmentUrl).label} &rarr;
                      </a>
                    )}
                  </div>
                )}
              </div>

              {selectedTicket.assignedAgentName && (
                <div style={{ fontSize: 12, color: "#475569", marginBottom: 14, background: "#eef2ff", padding: "8px 12px", borderRadius: 8, display: "inline-block" }}>🎧 <strong>Assigned Agent:</strong> {selectedTicket.assignedAgentName}</div>
              )}

              {selectedTicket.messages && selectedTicket.messages.length > 0 && (
                <div style={{ marginTop: 16, marginBottom: 16 }}>
                  <h5 style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8 }}>Conversation History ({selectedTicket.messages.length})</h5>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {selectedTicket.messages.map((msg) => {
                      const isOwnerAuthor = msg.authorType === "OWNER" || msg.authorType === "SALON_OWNER" || msg.authorType === "STAFF";
                      return (
                        <div key={msg.id} style={{ alignSelf: isOwnerAuthor ? "flex-end" : "flex-start", maxWidth: "85%", background: isOwnerAuthor ? "#eef2ff" : "#f8fafc", border: isOwnerAuthor ? "1px solid #c7d2fe" : "1px solid #e2e8f0", padding: 12, borderRadius: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 4 }}>
                            <strong style={{ fontSize: 12, color: isOwnerAuthor ? "#3730a3" : "#0f172a" }}>{msg.authorName || (isOwnerAuthor ? "You" : "Support Agent")} <span style={{ fontWeight: 400, fontSize: 10, color: "#64748b" }}>({msg.authorType})</span></strong>
                            <span style={{ fontSize: 10, color: "#94a3b8" }}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{msg.message}</p>
                          {msg.attachmentUrl && (
                            <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed #cbd5e1", fontSize: 11 }}>
                              {isImageAttachment(msg.attachmentUrl) ? (
                                <div>
                                  <img src={msg.attachmentUrl} alt="Attachment" style={{ maxWidth: 240, maxHeight: 180, borderRadius: 8, border: "1px solid #cbd5e1", display: "block", marginBottom: 4 }} />
                                  <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" style={{ color: "#2563eb", fontWeight: 600, fontSize: 11 }}>View Full Image &rarr;</a>
                                </div>
                              ) : isAttachmentLink(msg.attachmentUrl) ? (
                                <a href={formatAttachmentValue(msg.attachmentUrl)} target="_blank" rel="noreferrer" download style={{ color: "#2563eb", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 8px", background: "#fff", border: "1px solid #bfdbfe", borderRadius: 6, textDecoration: "none" }}>
                                  <Paperclip size={11} /> {getAttachmentMeta(msg.attachmentUrl).label} &rarr;
                                </a>
                              ) : (
                                <span style={{ color: "#64748b" }}>{formatAttachmentValue(msg.attachmentUrl)}</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedTicket.status !== "CLOSED" && (
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, marginTop: 16 }}>
                  <textarea rows="3" value={replyDrafts[selectedTicket.id] || ""} placeholder="Type your reply or additional information..." onChange={e => setReplyDrafts({ ...replyDrafts, [selectedTicket.id]: e.target.value })} style={{ width: "100%", padding: 10, border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, resize: "vertical", boxSizing: "border-box", marginBottom: 10, outline: "none" }} />
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <label style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, cursor: "pointer", color: "#64748b", background: "white" }}>
                      <Paperclip size={14} />
                      {replyAttachments[selectedTicket.id] ? "File attached" : "Attach File"}
                      <input type="file" accept="image/*,.pdf,.doc,.docx" hidden onChange={e => {
                        const file = e.target.files[0];
                        if (file) { const reader = new FileReader(); reader.onloadend = () => setReplyAttachments({ ...replyAttachments, [selectedTicket.id]: reader.result }); reader.readAsDataURL(file); }
                      }} />
                    </label>
                    <button type="button" onClick={() => sendReply(selectedTicket.id)} disabled={replyingId === selectedTicket.id || !replyDrafts[selectedTicket.id]?.trim()} style={{ padding: "8px 18px", background: !replyDrafts[selectedTicket.id]?.trim() ? "#cbd5e1" : "#4f46e5", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: !replyDrafts[selectedTicket.id]?.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                      <Send size={14} /> {replyingId === selectedTicket.id ? "Sending..." : "Send Reply"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : rows.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <EmptyState icon={<MessageSquare size={48} />} title="No support tickets found" message="You don't have any support tickets matching the current filter criteria." />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {rows.map((row) => {
                const createdDate = row.createdAt ? new Date(row.createdAt).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" }) : "";
                return (
                  <div key={row.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", background: "white", padding: 16, display: "flex", flexDirection: "column", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", background: "#eef2ff", padding: "4px 10px", borderRadius: 6 }}>#{row.id?.substring(0, 8) || "—"}</span>
                      {getStatusBadge(row.status)}
                    </div>
                    <h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{row.title}</h4>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b", marginBottom: 12 }}><Clock size={13} /> {createdDate}</div>
                    <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{getPriorityBadge(row.priority)} <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{row.category || "General"}</span></div>
                    </div>
                    <button onClick={() => setSelectedTicket(row)} style={{ marginTop: 16, width: "100%", padding: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#3b82f6", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.borderColor = "#cbd5e1"; }} onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>View Details</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
