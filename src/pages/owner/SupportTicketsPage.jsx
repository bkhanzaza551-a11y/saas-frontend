import { useEffect, useState, useRef } from "react";
import { api } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import { formatApiError } from "../../utils/apiError";
import { useAuth } from "../../context/AuthContext";
import { 
  LifeBuoy, Search, Filter, MessageSquare, Plus, Clock, CheckCircle2, 
  XCircle, Send, Paperclip, AlertTriangle, HelpCircle, Shield, Sparkles, 
  Download, ArrowLeft, ChevronDown, ChevronUp, Image as ImageIcon,
  FileText, ExternalLink, RefreshCw, X, User, Headphones
} from "lucide-react";
import CustomSelect from "../../components/CustomSelect";

const handleOpenOrDownloadImage = (url) => {
  const str = String(url || "").trim();
  if (!str) return;
  if (str.startsWith("data:")) {
    try {
      const parts = str.split(",");
      const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.target = "_blank";
      link.download = `attachment_${Date.now()}.${mime.split("/")[1] || "jpg"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (e) {
      const win = window.open();
      if (win) {
        win.document.write(`<img src="${str}" style="max-width:100%;height:auto;" />`);
      }
    }
  } else {
    window.open(str, "_blank");
  }
};

const isImageAttachment = (value) => {
  const url = String(value || "").trim();
  return /^data:image\//i.test(url) || /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url);
};

const getAttachmentMeta = (value) => {
  const url = String(value || "").trim();
  if (!url) return { label: "Attachment", isImage: false };
  if (isImageAttachment(url)) return { label: "View Full Image", isImage: true };
  if (/^data:application\/pdf/i.test(url) || /\.pdf$/i.test(url)) return { label: "Open PDF Document", isImage: false };
  if (/wordprocessingml|document|\.docx?$/i.test(url)) return { label: "Download Word Doc", isImage: false };
  if (/spreadsheetml|sheet|\.xlsx?$/i.test(url)) return { label: "Download Excel Spreadsheet", isImage: false };
  return { label: "Download Attachment", isImage: false };
};

const STATUS_CONFIG = {
  OPEN: { label: "Open", bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  IN_PROGRESS: { label: "In Progress", bg: "#fef3c7", color: "#d97706", border: "#fde68a" },
  WAITING_FOR_SALON: { label: "Waiting for Reply", bg: "#fff7ed", color: "#ea580c", border: "#ffedd5" },
  RESOLVED: { label: "Resolved", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  CLOSED: { label: "Closed", bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0" }
};

const PRIORITY_CONFIG = {
  LOW: { label: "Low", bg: "#f8fafc", color: "#64748b" },
  MEDIUM: { label: "Medium", bg: "#e0f2fe", color: "#0369a1" },
  HIGH: { label: "High", bg: "#ffedd5", color: "#c2410c" },
  URGENT: { label: "Urgent", bg: "#fee2e2", color: "#dc2626" }
};

export default function SupportTicketsPage() {
  const { auth } = useAuth();
  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ title: "", category: "General", priority: "MEDIUM", description: "", attachmentUrl: "" });
  
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyAttachment, setReplyAttachment] = useState("");
  
  const [status, setStatus] = useState({ error: "", success: "", loading: true });
  const [submitting, setSubmitting] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [showTicketInfo, setShowTicketInfo] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" });
    }
  };

  // Load ticket list
  const loadTickets = async (selectTicketId = null) => {
    try {
      const response = await api.get("/owner/support-tickets");
      const list = response.data || [];
      setRows(list);
      setStatus(s => ({ ...s, loading: false }));

      if (selectTicketId) {
        const found = list.find(t => t.id === selectTicketId);
        if (found) setSelectedTicket(found);
      } else if (!selectedTicket && list.length > 0) {
        // Select first by default on desktop
        if (window.innerWidth > 900) {
          setSelectedTicket(list[0]);
        }
      } else if (selectedTicket) {
        const refreshed = list.find(t => t.id === selectedTicket.id);
        if (refreshed) {
          setSelectedTicket(refreshed);
        }
      }
    } catch {
      setStatus(s => ({ ...s, loading: false }));
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  // Poll active ticket messages every 3s
  useEffect(() => {
    if (!selectedTicket?.id) return;
    const interval = setInterval(() => {
      api.get(`/owner/support-tickets/${selectedTicket.id}`).then(res => {
        if (res.data) {
          const fresh = res.data;
          const prevMsgCount = selectedTicket.messages?.length || 0;
          const freshMsgCount = fresh.messages?.length || 0;
          if (freshMsgCount > prevMsgCount || fresh.status !== selectedTicket.status) {
            setSelectedTicket(fresh);
            if (freshMsgCount > prevMsgCount) {
              setTimeout(() => scrollToBottom(true), 80);
            }
          }
        }
      }).catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedTicket?.id, selectedTicket?.messages?.length, selectedTicket?.status]);

  useEffect(() => {
    if (selectedTicket) {
      const timer = setTimeout(() => {
        scrollToBottom(false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selectedTicket?.id]);

  // Submit new ticket
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setSubmitting(true);
    setStatus({ error: "", success: "", loading: false });
    try {
      const res = await api.post("/owner/support-tickets", form);
      setForm({ title: "", category: "General", priority: "MEDIUM", description: "", attachmentUrl: "" });
      setShowCreateModal(false);
      setStatus({ error: "", success: "Support ticket raised successfully!" });
      setTimeout(() => setStatus(s => ({ ...s, success: "" })), 3500);
      await loadTickets(res.data?.id);
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not create support ticket"), success: "" });
    } finally {
      setSubmitting(false);
    }
  };

  // Send reply message
  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    if (!selectedTicket?.id) return;
    if (!replyText.trim() && !replyAttachment) return;

    setSendingReply(true);
    try {
      const res = await api.post(`/owner/support-tickets/${selectedTicket.id}/messages`, {
        message: replyText.trim() || (replyAttachment ? "Sent an attachment." : ""),
        attachmentUrl: replyAttachment || ""
      });
      setReplyText("");
      setReplyAttachment("");
      if (res.data) {
        setSelectedTicket(res.data);
        setTimeout(() => scrollToBottom(true), 60);
      }
      await loadTickets();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not send reply"), success: "" });
    } finally {
      setSendingReply(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  // Filtered tickets
  const filteredTickets = rows.filter(t => {
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = (t.title || "").toLowerCase().includes(q);
      const catMatch = (t.category || "").toLowerCase().includes(q);
      const idMatch = (t.id || "").toLowerCase().includes(q);
      if (!titleMatch && !catMatch && !idMatch) return false;
    }
    return true;
  });

  const stats = {
    total: rows.length,
    open: rows.filter(r => r.status === "OPEN" || r.status === "IN_PROGRESS" || r.status === "WAITING_FOR_SALON").length,
    resolved: rows.filter(r => r.status === "RESOLVED" || r.status === "CLOSED").length,
  };

  if (status.loading) {
    return <div className="page-shell"><PageLoader title="Loading Support Desk" /></div>;
  }

  return (
    <div className="page-shell" style={{ padding: "16px 20px", height: "calc(100vh - 75px)", minHeight: "620px", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
      <style>{`
        .support-hub-container {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 16px;
          flex: 1;
          min-height: 0;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
          overflow: hidden;
        }

        .support-sidebar {
          display: flex;
          flex-direction: column;
          background: #f8fafc;
          border-right: 1px solid #e2e8f0;
          min-height: 0;
          height: 100%;
        }

        .support-ticket-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .support-ticket-item {
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid transparent;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .support-ticket-item:hover {
          border-color: #cbd5e1;
          background: #f1f5f9;
        }
        .support-ticket-item.active {
          background: #eef2ff;
          border-color: #818cf8;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.08);
        }

        .support-chat-pane {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 0;
          background: #ffffff;
          position: relative;
        }

        .support-chat-header {
          padding: 14px 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #ffffff;
          flex-shrink: 0;
          z-index: 10;
        }

        .support-messages-stream {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: #f8fafc;
        }

        .support-reply-bar {
          padding: 12px 20px 16px;
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex-shrink: 0;
        }

        .msg-bubble-superadmin {
          align-self: flex-start;
          max-width: 75%;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .msg-bubble-superadmin .bubble-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #0f172a;
          border-radius: 4px 16px 16px 16px;
          padding: 12px 16px;
          font-size: 13.5px;
          line-height: 1.55;
          box-shadow: 0 1px 4px rgba(0,0,0,0.03);
          word-break: break-word;
          white-space: pre-wrap;
        }

        .msg-bubble-owner {
          align-self: flex-end;
          max-width: 75%;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .msg-bubble-owner .bubble-card {
          background: linear-gradient(135deg, #4f46e5, #4338ca);
          color: #ffffff;
          border-radius: 16px 4px 16px 16px;
          padding: 12px 16px;
          font-size: 13.5px;
          line-height: 1.55;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
          word-break: break-word;
          white-space: pre-wrap;
        }

        @media (max-width: 900px) {
          .support-hub-container {
            grid-template-columns: 1fr !important;
          }
          .support-sidebar.hide-mobile {
            display: none !important;
          }
          .support-chat-pane.hide-mobile {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Notification Alerts */}
      {status.error && (
        <div style={{ padding: "10px 16px", background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 8, fontSize: "0.85rem", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{status.error}</span>
          <button onClick={() => setStatus({ ...status, error: "" })} style={{ background: "none", border: "none", color: "#991b1b", cursor: "pointer" }}>✕</button>
        </div>
      )}
      {status.success && (
        <div style={{ padding: "10px 16px", background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0", borderRadius: 8, fontSize: "0.85rem", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{status.success}</span>
          <button onClick={() => setStatus({ ...status, success: "" })} style={{ background: "none", border: "none", color: "#065f46", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* Main Support Workspace */}
      <div className="support-hub-container">
        
        {/* ── LEFT PANEL: TICKET INBOX ── */}
        <div className={`support-sidebar ${selectedTicket ? "hide-mobile" : ""}`}>
          
          {/* Header */}
          <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ background: "#eef2ff", color: "#4f46e5", padding: 6, borderRadius: 8 }}>
                  <LifeBuoy size={18} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>Support Desk</h2>
                  <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{stats.open} Active · {stats.resolved} Resolved</div>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "7px 12px",
                  background: "#4f46e5",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(79, 70, 229, 0.25)"
                }}
              >
                <Plus size={14} /> New Ticket
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                type="text"
                placeholder="Search ticket subject..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px 8px 30px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  fontSize: "0.8rem",
                  boxSizing: "border-box",
                  background: "#ffffff",
                  outline: "none"
                }}
              />
            </div>

            {/* Quick Status Filter Pills */}
            <div style={{ display: "flex", gap: 4, marginTop: 10, overflowX: "auto", paddingBottom: 2 }}>
              {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 6,
                    border: "none",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    background: statusFilter === st ? "#0f172a" : "#e2e8f0",
                    color: statusFilter === st ? "#ffffff" : "#475569"
                  }}
                >
                  {st === "ALL" ? "All" : STATUS_CONFIG[st]?.label || st}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket List Stream */}
          <div className="support-ticket-list">
            {filteredTickets.length === 0 ? (
              <div style={{ padding: "40px 16px", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                <MessageSquare size={32} style={{ color: "#cbd5e1", margin: "0 auto 8px" }} />
                No tickets matching criteria.
              </div>
            ) : (
              filteredTickets.map(ticket => {
                const isActive = selectedTicket?.id === ticket.id;
                const sc = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
                const pc = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.MEDIUM;
                const dateStr = ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "";
                const msgCount = ticket.messages?.length || 0;

                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`support-ticket-item ${isActive ? "active" : ""}`}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#6366f1" }}>
                        #{ticket.id.slice(0, 8)}
                      </span>
                      <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, padding: "1px 6px", borderRadius: 100, fontSize: "0.68rem", fontWeight: 700 }}>
                        {sc.label}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {ticket.title}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem", color: "#64748b" }}>
                      <span style={{ background: pc.bg, color: pc.color, padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>
                        {pc.label}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {msgCount > 0 && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 2, color: "#4f46e5", fontWeight: 700 }}>
                            <MessageSquare size={11} /> {msgCount}
                          </span>
                        )}
                        <span>{dateStr}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: CHAT STREAM & THREAD ── */}
        <div className={`support-chat-pane ${!selectedTicket ? "hide-mobile" : ""}`}>
          {!selectedTicket ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b", padding: 20 }}>
              <Headphones size={48} style={{ color: "#c7d2fe", marginBottom: 12 }} />
              <h3 style={{ margin: "0 0 4px", fontSize: "1.1rem", color: "#0f172a" }}>Select a Support Ticket</h3>
              <p style={{ margin: 0, fontSize: "0.85rem" }}>Click any ticket on the left to start live chat with our support team.</p>
            </div>
          ) : (
            <>
              {/* Pinned Topbar */}
              <div className="support-chat-header">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    style={{ display: "inline-flex", alignItems: "center", padding: "4px 8px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer", color: "#475569" }}
                    title="Back to Tickets"
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#6366f1" }}>#{selectedTicket.id.slice(0, 8)}</span>
                      <span style={{ background: STATUS_CONFIG[selectedTicket.status]?.bg, color: STATUS_CONFIG[selectedTicket.status]?.color, border: `1px solid ${STATUS_CONFIG[selectedTicket.status]?.border}`, padding: "1px 6px", borderRadius: 100, fontSize: "0.68rem", fontWeight: 700 }}>
                        {STATUS_CONFIG[selectedTicket.status]?.label || selectedTicket.status}
                      </span>
                    </div>
                    <h3 style={{ margin: "2px 0 0", fontSize: "0.98rem", fontWeight: 800, color: "#0f172a" }}>
                      {selectedTicket.title}
                    </h3>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={() => setShowTicketInfo(v => !v)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "6px 10px",
                      background: showTicketInfo ? "#e0e7ff" : "#f8fafc",
                      color: showTicketInfo ? "#3730a3" : "#475569",
                      border: "1px solid #cbd5e1",
                      borderRadius: 6,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Ticket Details {showTicketInfo ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>
              </div>

              {/* Collapsible Ticket Info Bar */}
              {showTicketInfo && (
                <div style={{ background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", padding: "12px 20px", fontSize: "0.8rem", color: "#334155" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 8 }}>
                    <div><span style={{ color: "#64748b" }}>Category:</span> <strong>{selectedTicket.category || "General"}</strong></div>
                    <div><span style={{ color: "#64748b" }}>Priority:</span> <strong>{selectedTicket.priority}</strong></div>
                    <div><span style={{ color: "#64748b" }}>Created:</span> <strong>{new Date(selectedTicket.createdAt).toLocaleString()}</strong></div>
                    {selectedTicket.assignedAgentName && <div><span style={{ color: "#64748b" }}>Assigned Agent:</span> <strong>🎧 {selectedTicket.assignedAgentName}</strong></div>}
                  </div>
                  <div style={{ background: "#ffffff", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.78rem", lineHeight: 1.4 }}>
                    <strong>Initial Description:</strong> {selectedTicket.description}
                  </div>
                </div>
              )}

              {/* Scrollable Chat Stream (Never scrolls the page!) */}
              <div ref={chatContainerRef} className="support-messages-stream">
                
                {/* Initial Description Card as first message bubble if no messages */}
                {(!selectedTicket.messages || selectedTicket.messages.length === 0) && (
                  <div className="msg-bubble-owner">
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6, fontSize: "0.72rem", color: "#64748b" }}>
                      <strong style={{ color: "#4338ca" }}>You (Ticket Created)</strong>
                      <span>{new Date(selectedTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="bubble-card">
                      {selectedTicket.description}
                      {selectedTicket.attachmentUrl && (
                        <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px dashed rgba(255,255,255,0.3)" }}>
                          {isImageAttachment(selectedTicket.attachmentUrl) ? (
                            <img
                              src={selectedTicket.attachmentUrl}
                              alt="Attachment"
                              onClick={() => setPreviewImageUrl(selectedTicket.attachmentUrl)}
                              style={{ maxWidth: 200, maxHeight: 150, borderRadius: 6, cursor: "pointer", display: "block" }}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenOrDownloadImage(selectedTicket.attachmentUrl)}
                              style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: 4 }}
                            >
                              <Paperclip size={12} /> View Attachment
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* All Conversation Messages */}
                {selectedTicket.messages && selectedTicket.messages.map(msg => {
                  const isOwner = msg.authorType === "SALON" || msg.authorType === "OWNER" || msg.authorType === "SALON_OWNER" || msg.authorType === "STAFF";
                  const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateStr = new Date(msg.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

                  return (
                    <div
                      key={msg.id}
                      className={isOwner ? "msg-bubble-owner" : "msg-bubble-superadmin"}
                    >
                      {/* Author Tag */}
                      <div style={{ display: "flex", justifyContent: isOwner ? "flex-end" : "flex-start", alignItems: "center", gap: 6, fontSize: "0.72rem", color: "#64748b" }}>
                        {!isOwner && (
                          <span style={{ background: "#ede9fe", color: "#6d28d9", padding: "1px 6px", borderRadius: 4, fontWeight: 700, fontSize: "0.68rem" }}>
                            SuperAdmin Support
                          </span>
                        )}
                        <strong style={{ color: isOwner ? "#4338ca" : "#0f172a" }}>
                          {isOwner ? "You" : (msg.authorName || "Super Admin")}
                        </strong>
                        <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>{dateStr}, {timeStr}</span>
                      </div>

                      {/* Bubble Card */}
                      <div className="bubble-card">
                        {msg.message}

                        {/* Inline Attachment Preview */}
                        {msg.attachmentUrl && (
                          <div style={{ marginTop: 8, paddingTop: 6, borderTop: isOwner ? "1px dashed rgba(255,255,255,0.3)" : "1px dashed #cbd5e1" }}>
                            {isImageAttachment(msg.attachmentUrl) ? (
                              <div>
                                <img
                                  src={msg.attachmentUrl}
                                  alt="Attachment"
                                  onClick={() => setPreviewImageUrl(msg.attachmentUrl)}
                                  style={{
                                    maxWidth: 220,
                                    maxHeight: 160,
                                    borderRadius: 6,
                                    border: isOwner ? "1px solid rgba(255,255,255,0.4)" : "1px solid #cbd5e1",
                                    display: "block",
                                    marginBottom: 4,
                                    cursor: "pointer",
                                    objectFit: "contain",
                                    background: "#000"
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => setPreviewImageUrl(msg.attachmentUrl)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    padding: 0,
                                    color: isOwner ? "#e0e7ff" : "#2563eb",
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    textDecoration: "underline"
                                  }}
                                >
                                  Click to Expand Image →
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenOrDownloadImage(msg.attachmentUrl)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  padding: 0,
                                  color: isOwner ? "#ffffff" : "#2563eb",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  cursor: "pointer"
                                }}
                              >
                                <Paperclip size={12} /> {getAttachmentMeta(msg.attachmentUrl).label} →
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                <div ref={messagesEndRef} style={{ height: 1 }} />
              </div>

              {/* Pinned Bottom Reply Bar */}
              {selectedTicket.status !== "CLOSED" ? (
                <div className="support-reply-bar">
                  {/* Attachment Preview Chip */}
                  {replyAttachment && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "4px 10px", borderRadius: 6, width: "fit-content", fontSize: "0.75rem", color: "#166534" }}>
                      <Paperclip size={12} />
                      <span>Attachment ready</span>
                      <button
                        type="button"
                        onClick={() => setReplyAttachment("")}
                        style={{ background: "none", border: "none", color: "#dc2626", fontWeight: 800, cursor: "pointer", padding: 0 }}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                    {/* Attachment Upload Button */}
                    <label
                      title="Attach Screenshot / Document"
                      style={{
                        padding: "10px",
                        border: "1px solid #cbd5e1",
                        borderRadius: 8,
                        background: replyAttachment ? "#f0fdf4" : "#f8fafc",
                        color: replyAttachment ? "#166534" : "#64748b",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      <Paperclip size={16} />
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        hidden
                        onChange={e => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setReplyAttachment(reader.result);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>

                    {/* Text Input Area */}
                    <textarea
                      rows={2}
                      value={replyText}
                      placeholder="Type your reply... (Press Enter to send)"
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        border: "1px solid #cbd5e1",
                        borderRadius: 8,
                        fontSize: "0.85rem",
                        resize: "none",
                        outline: "none",
                        boxSizing: "border-box",
                        fontFamily: "inherit"
                      }}
                    />

                    {/* Send Button */}
                    <button
                      type="button"
                      onClick={handleSendReply}
                      disabled={sendingReply || (!replyText.trim() && !replyAttachment)}
                      style={{
                        padding: "10px 18px",
                        background: (!replyText.trim() && !replyAttachment) ? "#cbd5e1" : "#4f46e5",
                        color: "white",
                        border: "none",
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        cursor: (!replyText.trim() && !replyAttachment) ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        flexShrink: 0,
                        height: 42
                      }}
                    >
                      <Send size={14} /> {sendingReply ? "Sending..." : "Send"}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: "14px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", textAlign: "center", fontSize: "0.8rem", color: "#64748b" }}>
                  🔒 This support ticket has been closed. You can raise a new ticket anytime if you need further help.
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* ── MODAL: CREATE SUPPORT TICKET ── */}
      {showCreateModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#ffffff", borderRadius: 16, width: "100%", maxWidth: 540, padding: 24, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={20} style={{ color: "#6366f1" }} />
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Raise Support Ticket</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateTicket} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Subject / Issue Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., POS Printer disconnects on invoice print"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Category
                  </label>
                  <CustomSelect
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    style={{ width: "100%" }}
                  >
                    <option value="General">General</option>
                    <option value="POS">POS</option>
                    <option value="Appointments">Appointments</option>
                    <option value="Inventory">Inventory</option>
                    <option value="Billing">Billing</option>
                    <option value="Product Request">Product Request</option>
                    <option value="Staff Management">Staff Management</option>
                    <option value="Technical Issue">Technical Issue</option>
                  </CustomSelect>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Priority
                  </label>
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
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Detailed Description *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe what happened, error message, or what assistance you need..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Attach Screenshot / File (Optional)
                </label>
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
                  style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.8rem", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", background: "white", color: "#475569", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#4f46e5", color: "white", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── IMAGE LIGHTBOX PREVIEW MODAL ── */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(6px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <img
              src={previewImageUrl}
              alt="Full Preview"
              style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 8, boxShadow: "0 20px 50px rgba(0,0,0,0.5)", objectFit: "contain" }}
            />
            <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
              <button
                onClick={() => handleOpenOrDownloadImage(previewImageUrl)}
                style={{ padding: "8px 16px", background: "#4f46e5", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Download size={14} /> Download Image
              </button>
              <button
                onClick={() => setPreviewImageUrl(null)}
                style={{ padding: "8px 16px", background: "#334155", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
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
