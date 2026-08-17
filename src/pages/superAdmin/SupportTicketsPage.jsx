import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import CustomSelect from "../../components/CustomSelect";
import { MessageSquare, Calendar, User, Tag, AlertCircle, Filter, RefreshCw, FileText, CheckCircle2, Building2, Send, Paperclip, Shield, Clock, ChevronDown, Eye, History, X, Search } from "lucide-react";

const isImageAttachment = (value) => {
  const url = String(value || "").trim();
  return /^data:image\//i.test(url) || /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url);
};

const getAttachmentLabel = (value) => {
  const url = String(value || "").trim();
  if (!url) return "Attachment";
  if (isImageAttachment(url)) return "View Full Image";
  if (/^data:application\/pdf/i.test(url) || /\.pdf$/i.test(url)) return "Open PDF Document";
  if (/wordprocessingml|document|\.docx?$/i.test(url)) return "Download Word Document (.docx)";
  if (/spreadsheetml|sheet|\.xlsx?$/i.test(url)) return "Download Excel Spreadsheet (.xlsx)";
  return "Download Attachment";
};

const STATUSES = [
  { label: "Open", value: "OPEN", color: "#ef4444", bg: "#fef2f2" },
  { label: "In Progress", value: "IN_PROGRESS", color: "#2563eb", bg: "#eff6ff" },
  { label: "Waiting for Salon", value: "WAITING_FOR_SALON", color: "#d97706", bg: "#fffbeb" },
  { label: "Resolved", value: "RESOLVED", color: "#16a34a", bg: "#f0fdf4" },
  { label: "Closed", value: "CLOSED", color: "#64748b", bg: "#f1f5f9" }
];

const PRIORITIES = [
  { label: "Low", value: "LOW", color: "#64748b", bg: "#f8fafc" },
  { label: "Medium", value: "MEDIUM", color: "#0369a1", bg: "#e0f2fe" },
  { label: "High", value: "HIGH", color: "#c2410c", bg: "#ffedd5" },
  { label: "Urgent", value: "URGENT", color: "#b91c1c", bg: "#fee2e2" }
];

const CATEGORIES = [
  "General",
  "Login / Account",
  "POS",
  "Appointments",
  "Inventory",
  "Billing",
  "Subscription",
  "Product Request",
  "Staff Request",
  "Technical Issue",
  "Feature Request"
];

const getStatMeta = (status) => STATUSES.find(s => s.value === status) || STATUSES[0];
const getPrioMeta = (p) => PRIORITIES.find(pr => pr.value === p) || PRIORITIES[1];

export default function SuperAdminSupportTicketsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { auth } = useAuth();
  const currentUserId = auth?.user?.id;
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    q: "", status: searchParams.get("status") || "",
    priority: "", category: "", assignedToId: "",
    assignedToMe: false, from: "", to: ""
  });
  const [savingId, setSavingId] = useState("");
  const [notes, setNotes] = useState({});
  const [staff, setStaff] = useState([]);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyAttachments, setReplyAttachments] = useState({});
  const [status, setStatus] = useState({ error: "", success: "" });
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({ title: "", description: "", priority: "MEDIUM", category: "General", salonId: "" });
  const [salons, setSalons] = useState([]);
  const [closingTicketId, setClosingTicketId] = useState(null);
  const [closureReason, setClosureReason] = useState("");
  const [detailTab, setDetailTab] = useState("conversation");

  const buildParams = (f) => {
    const p = {};
    if (f.q) p.q = f.q;
    if (f.status) p.status = f.status;
    if (f.priority) p.priority = f.priority;
    if (f.category) p.category = f.category;
    if (f.assignedToMe && currentUserId) p.assignedToId = currentUserId;
    else if (f.assignedToId) p.assignedToId = f.assignedToId;
    if (f.from) p.from = f.from;
    if (f.to) p.to = f.to;
    return p;
  };

  const load = async (nextFilters = filters) => {
    setLoading(true);
    try {
      const [response, staffRes] = await Promise.all([
        api.get("/super-admin/support-tickets", { params: buildParams(nextFilters) }),
        api.get("/super-admin/staff")
      ]);
      const data = response.data || [];
      setRows(data);
      setStaff(staffRes?.data?.users || staffRes?.data || []);
      setNotes(Object.fromEntries(data.map((row) => [row.id, row.internalNote || ""])));
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not load support tickets."), success: "" });
    } finally {
      setLoading(false);
    }
  };

  const [reloadKey, setReloadKey] = useState(0);
  const triggerReload = () => setReloadKey(k => k + 1);

  useEffect(() => {
    let active = true;
    setStatus({ error: "", success: "" });
    Promise.all([
      api.get("/super-admin/support-tickets", { params: buildParams(filters) }),
      api.get("/super-admin/staff"),
      api.get("/super-admin/salons?lightweight=true")
    ]).then(([response, staffRes, salonsRes]) => {
      if (!active) return;
      const data = response.data || [];
      setRows(data);
      setStaff(staffRes?.data?.users || staffRes?.data || []);
      setSalons(salonsRes?.data || []);
      setNotes(Object.fromEntries(data.map((row) => [row.id, row.internalNote || ""])));
      setLoading(false);
      if (searchParams.get("new") === "true") { setIsCreateModalOpen(true); setSearchParams((prev) => { const next = new URLSearchParams(prev); next.delete("new"); return next; }); }
    }).catch((err) => {
      if (!active) return;
      setStatus({ error: formatApiError(err, "Could not load support tickets."), success: "" });
      setLoading(false);
    });
    return () => { active = false; };
  }, [filters, reloadKey]);

  const updateTicket = async (ticketId, data) => {
    setSavingId(ticketId);
    setStatus({ error: "", success: "" });
    try {
      await api.patch(`/super-admin/support-tickets/${ticketId}`, data);
      triggerReload();
      setStatus({ error: "", success: "Ticket updated successfully." });
      setTimeout(() => setStatus(s => ({ ...s, success: "" })), 3000);
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not update ticket"), success: "" });
    } finally { setSavingId(""); }
  };

  const sendReply = async (ticketId, nextStatus = "IN_PROGRESS") => {
    if (!replyDrafts[ticketId]?.trim()) return;
    setSavingId(ticketId);
    setStatus({ error: "", success: "" });
    try {
      await api.post(`/super-admin/support-tickets/${ticketId}/messages`, {
        message: replyDrafts[ticketId] || "",
        attachmentUrl: replyAttachments[ticketId] || "",
        status: nextStatus
      });
      setReplyDrafts((c) => ({ ...c, [ticketId]: "" }));
      setReplyAttachments((c) => ({ ...c, [ticketId]: "" }));
      triggerReload();
      if (selectedTicket && selectedTicket.id === ticketId) {
        const updatedTicket = (await api.get(`/super-admin/support-tickets/${ticketId}`)).data;
        if (updatedTicket) setSelectedTicket(updatedTicket);
      }
      setStatus({ error: "", success: "Support reply sent." });
      setTimeout(() => setStatus(s => ({ ...s, success: "" })), 3000);
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not send reply"), success: "" });
    } finally { setSavingId(""); }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicketForm.title.trim()) return;
    setStatus({ error: "", success: "" });
    try {
      await api.post("/super-admin/support-tickets", newTicketForm);
      setIsCreateModalOpen(false);
      setNewTicketForm({ title: "", description: "", priority: "MEDIUM", category: "General", salonId: "" });
      setStatus({ error: "", success: "Ticket created successfully." });
      triggerReload();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not create ticket"), success: "" });
    }
  };

  const setFilterAndReload = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
  };

  const stats = {
    total: rows.length,
    open: rows.filter(r => r.status === "OPEN").length,
    inProgress: rows.filter(r => r.status === "IN_PROGRESS").length,
    waiting: rows.filter(r => r.status === "WAITING_FOR_SALON").length,
    urgent: rows.filter(r => r.priority === "URGENT").length,
    resolved: rows.filter(r => r.status === "RESOLVED" || r.status === "CLOSED").length,
  };

  return (
    <div className="page-shell super-admin-page">
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <Shield size={26} style={{ color: "#6366f1" }} /> Support Tickets
            </h1>
            <p style={{ marginBottom: 0 }}>Manage salon support requests, agent assignments, and customer resolutions.</p>
          </div>
          <div className="badge-row">
            <button onClick={() => setIsCreateModalOpen(true)} style={{ padding: "8px 16px", borderRadius: 8, background: "#6366f1", color: "white", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <MessageSquare size={16} /> Create Ticket
            </button>
          </div>
        </div>
      </div>

      {/* Point 3: 4 Clickable Summary Cards (Total Tickets, Open, Urgent, Resolved / Closed) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Tickets", value: stats.total, color: "#6366f1", border: "#6366f1", action: () => setFilters({ ...filters, status: "", priority: "" }) },
          { label: "Open", value: stats.open, color: "#ef4444", border: "#ef4444", action: () => setFilters({ ...filters, status: "OPEN", priority: "" }) },
          { label: "Urgent", value: stats.urgent, color: "#b91c1c", border: "#b91c1c", action: () => setFilters({ ...filters, priority: "URGENT", status: "" }) },
          { label: "Resolved / Closed", value: stats.resolved, color: "#16a34a", border: "#16a34a", action: () => setFilters({ ...filters, status: "RESOLVED", priority: "" }) }
        ].map(card => (
          <div key={card.label} onClick={card.action}
            style={{ padding: 18, borderLeft: `4px solid ${card.border}`, background: "white", borderRadius: 10, cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", transition: "transform 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "none"}>
            <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>{card.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: card.color, marginTop: 4 }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", marginBottom: 28, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px -4px rgba(0, 0, 0, 0.06)" }}>
        
        {/* Search Bar Row */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, position: "relative", minWidth: 280 }}>
            <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex", pointerEvents: "none", zIndex: 2 }}>
              <Search size={18} />
            </div>
            <input
              value={filters.q}
              placeholder="Search by title, salon, agent..."
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              style={{ width: "100%", height: 42, paddingLeft: 42, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 10, border: "1px solid #cbd5e1", fontSize: "0.9rem", color: "#1e293b", outline: "none", boxSizing: "border-box", transition: "all 0.2s", background: "#f8fafc" }}
              onFocus={e => { e.target.style.background = "#fff"; e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.08)"; }}
              onBlur={e => { e.target.style.background = "#f8fafc"; e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "none"; }}
            />
          </div>
          
          <button
            type="button"
            onClick={() => setFilters({ ...filters, assignedToMe: !filters.assignedToMe })}
            style={{ 
              height: 42, 
              padding: "0 16px", 
              background: filters.assignedToMe ? "#eef2ff" : "#fff", 
              border: filters.assignedToMe ? "2px solid #6366f1" : "1px solid #cbd5e1", 
              color: filters.assignedToMe ? "#4f46e5" : "#475569", 
              borderRadius: 10, 
              fontSize: "0.85rem", 
              fontWeight: 700, 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              gap: 8, 
              transition: "all 0.2s", 
              whiteSpace: "nowrap",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
          >
            <span style={{ 
              width: 8, 
              height: 8, 
              borderRadius: "50%", 
              background: filters.assignedToMe ? "#4f46e5" : "#cbd5e1", 
              display: "inline-block",
              transition: "background 0.2s"
            }} />
            Assigned to Me
          </button>
          
          <button onClick={() => load(filters)} style={{ height: 42, padding: "0 20px", background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)", transition: "transform 0.2s, box-shadow 0.2s", whiteSpace: "nowrap" }} onMouseOver={e => { e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 6px 8px -2px rgba(79, 70, 229, 0.3)"; }} onMouseOut={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 4px 6px -1px rgba(79, 70, 229, 0.2)"; }}>
            Apply Filters
          </button>
          
          <button 
            onClick={() => { const empty = { q: "", status: "", priority: "", category: "", assignedToId: "", assignedToMe: false, from: "", to: "" }; setFilters(empty); load(empty); }}
            style={{ height: 42, padding: "0 18px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s", whiteSpace: "nowrap" }}
            onMouseOver={e => { e.currentTarget.style.background="#fee2e2"; e.currentTarget.style.borderColor="#fca5a5"; e.currentTarget.style.color="#dc2626"; }}
            onMouseOut={e => { e.currentTarget.style.background="#f8fafc"; e.currentTarget.style.borderColor="#cbd5e1"; e.currentTarget.style.color="#64748b"; }}
          >
            Reset
          </button>
        </div>

        {/* Dropdowns Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, alignItems: "end" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Status</label>
            <CustomSelect
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
              style={{ width: "100%" }}
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </CustomSelect>
          </div>
          
          <div>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Priority</label>
            <CustomSelect
              value={filters.priority}
              onChange={e => setFilters({ ...filters, priority: e.target.value })}
              style={{ width: "100%" }}
            >
              <option value="">All Priorities</option>
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </CustomSelect>
          </div>
          
          <div>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Category</label>
            <CustomSelect
              value={filters.category}
              onChange={e => setFilters({ ...filters, category: e.target.value })}
              style={{ width: "100%" }}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </CustomSelect>
          </div>
          
          <div>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Agent</label>
            <CustomSelect
              value={filters.assignedToId}
              onChange={e => setFilters({ ...filters, assignedToId: e.target.value })}
              style={{ width: "100%" }}
            >
              <option value="">All Agents</option>
              {staff.filter(s => s.isActive !== false).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </CustomSelect>
          </div>
          
          <div style={{ minWidth: 260 }}>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Date Range</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} title="Created from" style={{ flex: 1, minWidth: 120, height: 42, padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.82rem", fontWeight: 500, background: "#f8fafc", color: "#334155", outline: "none", cursor: "pointer", boxSizing: "border-box", transition: "all 0.2s" }} onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.08)"; }} onBlur={e => { e.target.style.borderColor = "#cbd5e1"; e.target.style.background = "#f8fafc"; e.target.style.boxShadow = "none"; }} />
              <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 700, flexShrink: 0 }}>to</span>
              <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} title="Created to" style={{ flex: 1, minWidth: 120, height: 42, padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.82rem", fontWeight: 500, background: "#f8fafc", color: "#334155", outline: "none", cursor: "pointer", boxSizing: "border-box", transition: "all 0.2s" }} onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.08)"; }} onBlur={e => { e.target.style.borderColor = "#cbd5e1"; e.target.style.background = "#f8fafc"; e.target.style.boxShadow = "none"; }} />
            </div>
          </div>
        </div>
      </div>

      {status.error && <div style={{ padding: 12, background: "#fef2f2", color: "#ef4444", borderRadius: 8, marginBottom: 16, fontSize: 13, border: "1px solid #fecaca" }}>{status.error}</div>}
      {status.success && <div style={{ padding: 12, background: "#f0fdf4", color: "#16a34a", borderRadius: 8, marginBottom: 16, fontSize: 13, border: "1px solid #bbf7d0" }}>{status.success}</div>}

      {/* Ticket Table */}
      <div className="panel-card" style={{ background: "white", padding: 0, overflow: "hidden" }}>
        {loading ? (
          <PageLoader title="Loading support queue" message="Pulling tickets, agents, and events." />
        ) : rows.length ? (
          <div className="table-responsive">
            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, color: "#64748b", fontWeight: 700 }}>TICKET</th>
                  <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, color: "#64748b", fontWeight: 700 }}>SALON</th>
                  <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, color: "#64748b", fontWeight: 700 }}>SUBJECT</th>
                  <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, color: "#64748b", fontWeight: 700 }}>CATEGORY</th>
                  <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, color: "#64748b", fontWeight: 700 }}>PRIORITY</th>
                  <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, color: "#64748b", fontWeight: 700 }}>STATUS</th>
                  <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, color: "#64748b", fontWeight: 700 }}>ASSIGNED</th>
                  <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, color: "#64748b", fontWeight: 700 }}>UPDATED</th>
                  <th style={{ padding: "12px 14px", textAlign: "right", fontSize: 11, color: "#64748b", fontWeight: 700 }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const sm = getStatMeta(row.status);
                  const pm = getPrioMeta(row.priority);
                  return (
                    <tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                      onClick={() => { setSelectedTicket(row); setDetailTab("conversation"); }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "14px", fontSize: 12, fontWeight: 700, color: "#6366f1" }}>#{row.id.substring(0, 8)}</td>
                      <td style={{ padding: "14px", fontSize: 13, fontWeight: 600, color: "#334155" }}>{row.salon?.name || "Global"}</td>
                      <td style={{ padding: "14px", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{row.title}</td>
                      <td style={{ padding: "14px", fontSize: 12, color: "#64748b" }}>{row.category || "—"}</td>
                      <td style={{ padding: "14px" }}><span style={{ background: pm.bg, color: pm.color, padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700 }}>{row.priority}</span></td>
                      <td style={{ padding: "14px" }}><span style={{ background: sm.bg, color: sm.color, padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700 }}>{sm.label}</span></td>
                      <td style={{ padding: "14px", fontSize: 12, color: "#475569" }}>{row.assignedTo?.name || row.assignedAgentName || "—"}</td>
                      <td style={{ padding: "14px", fontSize: 12, color: "#64748b" }}>{row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : ""}</td>
                      <td style={{ padding: "14px", textAlign: "right" }}>
                        <button type="button" style={{ background: "#eef2ff", color: "#4f46e5", border: "none", padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>View</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No support tickets" message="Support requests from salons will appear here." label="Support" />
        )}
      </div>

      {/* Ticket Detail Slide-in (Spacious 2-Column Support Desk) */}
      {selectedTicket && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", zIndex: 9999, display: "flex", justifyContent: "flex-end", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "white", width: "100%", maxWidth: 1040, height: "100%", display: "flex", flexDirection: "column", boxShadow: "-4px 0 32px rgba(0,0,0,0.15)", animation: "slideInRight 0.3s ease" }}>

            {/* Top Navigation Bar */}
            <div style={{ padding: "14px 24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#6366f1", background: "#eef2ff", padding: "4px 10px", borderRadius: 6, border: "1px solid #e0e7ff" }}>
                  #{selectedTicket.id.substring(0, 8)}
                </span>
                <span style={{ 
                  fontSize: "0.72rem", 
                  fontWeight: 800, 
                  background: STATUSES.find(s => s.value === selectedTicket.status)?.bg || "#f1f5f9", 
                  color: STATUSES.find(s => s.value === selectedTicket.status)?.color || "#475569", 
                  padding: "4px 10px", 
                  borderRadius: 6 
                }}>
                  {STATUSES.find(s => s.value === selectedTicket.status)?.label || selectedTicket.status}
                </span>
                <span style={{ 
                  fontSize: "0.72rem", 
                  fontWeight: 800, 
                  background: PRIORITIES.find(p => p.value === selectedTicket.priority)?.bg || "#f1f5f9", 
                  color: PRIORITIES.find(p => p.value === selectedTicket.priority)?.color || "#475569", 
                  padding: "4px 10px", 
                  borderRadius: 6 
                }}>
                  {selectedTicket.priority} Priority
                </span>
                <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Tag size={12} /> {selectedTicket.category || "General Support"}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {selectedTicket.status !== "CLOSED" ? (
                  <button
                    onClick={() => { setClosingTicketId(selectedTicket.id); setClosureReason(""); }}
                    style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca", padding: "6px 12px", fontWeight: 700, borderRadius: 6, cursor: "pointer", fontSize: "0.75rem" }}
                  >
                    Close Ticket
                  </button>
                ) : (
                  <button
                    onClick={() => { updateTicket(selectedTicket.id, { status: "OPEN", closureReason: null }); setSelectedTicket({ ...selectedTicket, status: "OPEN" }); }}
                    style={{ background: "#eef2ff", color: "#3730a3", border: "1px solid #c7d2fe", padding: "6px 12px", fontWeight: 700, borderRadius: 6, cursor: "pointer", fontSize: "0.75rem" }}
                  >
                    Reopen Ticket
                  </button>
                )}
                <button onClick={() => setSelectedTicket(null)} style={{ background: "transparent", border: "none", fontSize: 24, color: "#94a3b8", cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>&times;</button>
              </div>
            </div>

            {/* Main 2-Column Body */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

              {/* LEFT COLUMN: Conversation Stream & Reply Composer */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", background: "#ffffff", minWidth: 0 }}>
                
                {/* Title & Tabs */}
                <div style={{ padding: "16px 24px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <h2 style={{ margin: "0 0 10px", fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.3 }}>
                    {selectedTicket.title}
                  </h2>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["conversation", "activity"].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setDetailTab(tab)}
                        style={{
                          padding: "8px 16px",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          border: "none",
                          borderBottom: detailTab === tab ? "2px solid #4f46e5" : "2px solid transparent",
                          background: "transparent",
                          color: detailTab === tab ? "#4f46e5" : "#64748b",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        {tab === "conversation" ? <><MessageSquare size={14} /> Conversation Thread ({1 + (selectedTicket.messages?.length || 0)})</> : <><History size={14} /> Activity Timeline</>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stream Content */}
                <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                  {detailTab === "conversation" ? (
                    <>
                      {/* Customer Initial Query Card */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignSelf: "flex-start", width: "100%" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", color: "#64748b" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.7rem" }}>
                              {(selectedTicket.salon?.name || "S").substring(0, 1).toUpperCase()}
                            </div>
                            <strong style={{ color: "#0f172a" }}>{selectedTicket.salon?.name || "Salon Customer"}</strong>
                            <span style={{ background: "#f1f5f9", color: "#475569", padding: "2px 6px", borderRadius: 4, fontSize: "0.7rem", fontWeight: 700 }}>Ticket Creator</span>
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                            {new Date(selectedTicket.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} at {new Date(selectedTicket.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderLeft: "4px solid #4f46e5", borderRadius: "4px 12px 12px 12px", padding: "14px 18px", fontSize: "0.9rem", color: "#1e293b", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {selectedTicket.description}
                        </div>
                      </div>

                      {/* Messages Thread */}
                      {selectedTicket.messages?.map((msg) => {
                        const isSuperAdmin = msg.authorType === "SUPER_ADMIN";
                        const isSupport = msg.authorType === "SUPPORT" || msg.authorType === "SYSTEM";
                        const isSalon = msg.authorType === "SALON";
                        const authorLabel = isSuperAdmin ? "Super Admin" : isSupport ? "Support Agent" : "Salon Owner";
                        const badgeBg = isSuperAdmin ? "#ede9fe" : isSupport ? "#e0e7ff" : "#f1f5f9";
                        const badgeColor = isSuperAdmin ? "#6d28d9" : isSupport ? "#3730a3" : "#334155";
                        const msgDate = new Date(msg.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
                        const msgTime = new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

                        return (
                          <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignSelf: isSalon ? "flex-start" : "flex-end", maxWidth: "85%", gap: 4 }}>
                            <div style={{ display: "flex", justifyContent: isSalon ? "flex-start" : "flex-end", alignItems: "center", gap: 8, fontSize: "0.75rem", color: "#64748b", padding: "0 4px" }}>
                              <strong style={{ color: "#0f172a" }}>{msg.authorName}</strong>
                              <span style={{ background: badgeBg, color: badgeColor, padding: "2px 6px", borderRadius: 4, fontSize: "0.68rem", fontWeight: 700 }}>
                                {authorLabel}
                              </span>
                              <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{msgDate} {msgTime}</span>
                            </div>
                            <div style={{
                              background: isSalon ? "#ffffff" : isSuperAdmin ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "linear-gradient(135deg, #3b82f6, #2563eb)",
                              color: isSalon ? "#0f172a" : "#ffffff",
                              border: isSalon ? "1px solid #e2e8f0" : "none",
                              boxShadow: isSalon ? "0 2px 4px rgba(0,0,0,0.03)" : "0 3px 8px rgba(79, 70, 229, 0.25)",
                              borderRadius: isSalon ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
                              padding: "12px 16px",
                              fontSize: "0.88rem",
                              lineHeight: 1.55,
                              whiteSpace: "pre-wrap"
                            }}>
                              {msg.message}
                              {msg.attachmentUrl && (
                                <div style={{ marginTop: 8, fontSize: 11, borderTop: isSalon ? "1px dashed #cbd5e1" : "1px dashed rgba(255,255,255,0.3)", paddingTop: 6 }}>
                                  {isImageAttachment(msg.attachmentUrl) ? (
                                    <div>
                                      <img src={msg.attachmentUrl} alt="Attachment" style={{ maxWidth: 240, maxHeight: 180, borderRadius: 8, border: "1px solid #cbd5e1", display: "block", marginBottom: 4 }} />
                                      <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" style={{ color: isSalon ? "#2563eb" : "#a5b4fc", textDecoration: "underline", fontWeight: 600 }}>View Full Image &rarr;</a>
                                    </div>
                                  ) : (
                                    <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" download style={{ color: isSalon ? "#2563eb" : "#ffffff", textDecoration: "underline", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                      <Paperclip size={11} /> {getAttachmentLabel(msg.attachmentUrl)} &rarr;
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    /* Activity Tab */
                    <div>
                      <h5 style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Ticket Activity</h5>
                      {selectedTicket.events?.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                          {selectedTicket.events.map((ev, i) => (
                            <div key={ev.id} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < selectedTicket.events.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: ev.eventType === "REPLY_SENT" ? "#3b82f6" : ev.eventType === "STATUS_CHANGED" ? "#f59e0b" : ev.eventType === "AGENT_ASSIGNED" ? "#8b5cf6" : "#94a3b8", marginTop: 5, flexShrink: 0 }} />
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{ev.details || ev.eventType}</div>
                                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{ev.actorName} • {new Date(ev.createdAt).toLocaleString()}</div>
                                {ev.fromStatus && ev.toStatus && (
                                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{ev.fromStatus} → {ev.toStatus}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: "#94a3b8", fontSize: 13 }}>No activity recorded yet.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Reply Composer */}
                {detailTab === "conversation" && (
                  <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
                    {selectedTicket.status !== "CLOSED" ? (
                      <>
                        <div style={{ marginBottom: 10, position: "relative" }}>
                          <textarea
                            rows={3}
                            value={replyDrafts[selectedTicket.id] || ""}
                            placeholder="Type reply to salon owner..."
                            onChange={(e) => setReplyDrafts({ ...replyDrafts, [selectedTicket.id]: e.target.value })}
                            style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: 12, fontSize: "0.88rem", background: "white", width: "100%", resize: "none", boxSizing: "border-box", outline: "none", fontFamily: "inherit" }}
                            onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.08)"; }}
                            onBlur={e => { e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "none"; }}
                          />
                          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 10 }}>
                            <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "#4f46e5", fontWeight: 600, cursor: "pointer", background: "white", padding: "4px 10px", borderRadius: 6, border: "1px solid #e0e7ff" }}>
                              <Paperclip size={13} /> Attach File
                              <input type="file" accept="image/*,.pdf,.doc,.docx" hidden onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) { const reader = new FileReader(); reader.onloadend = () => setReplyAttachments({ ...replyAttachments, [selectedTicket.id]: reader.result }); reader.readAsDataURL(file); }
                              }} />
                            </label>
                            {replyAttachments[selectedTicket.id] && (
                              <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 700, background: "#dcfce7", padding: "2px 8px", borderRadius: 4 }}>
                                ✓ File attached
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                          <button
                            onClick={() => sendReply(selectedTicket.id, "IN_PROGRESS")}
                            style={{ background: "#4f46e5", color: "white", border: "none", padding: "8px 16px", fontWeight: 700, borderRadius: 8, cursor: "pointer", fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: 6 }}
                          >
                            <Send size={13} /> Reply
                          </button>
                          <button
                            onClick={() => sendReply(selectedTicket.id, "WAITING_FOR_SALON")}
                            style={{ background: "#d97706", color: "white", border: "none", padding: "8px 16px", fontWeight: 700, borderRadius: 8, cursor: "pointer", fontSize: "0.82rem" }}
                          >
                            Reply & Wait for Salon
                          </button>
                          <button
                            onClick={() => sendReply(selectedTicket.id, "RESOLVED")}
                            style={{ background: "#16a34a", color: "white", border: "none", padding: "8px 16px", fontWeight: 700, borderRadius: 8, cursor: "pointer", fontSize: "0.82rem" }}
                          >
                            Reply & Resolve
                          </button>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                        <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>This ticket is marked as CLOSED.</span>
                        <button
                          onClick={() => { updateTicket(selectedTicket.id, { status: "OPEN", closureReason: null }); setSelectedTicket({ ...selectedTicket, status: "OPEN" }); }}
                          style={{ background: "#eef2ff", color: "#3730a3", border: "1px solid #c7d2fe", padding: "8px 18px", fontWeight: 700, borderRadius: 8, cursor: "pointer", fontSize: "0.82rem" }}
                        >
                          Reopen Ticket
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Salon Context, Assignee & Internal Notes Sidebar */}
              <div style={{ width: 340, borderLeft: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", padding: "20px 18px", gap: 16 }}>

                {/* Salon Context Card */}
                {selectedTicket.salon && (
                  <div style={{ background: "white", borderRadius: 12, padding: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Salon Details
                      </span>
                      <a
                        href={`/super-admin/salons/${selectedTicket.salon.id}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#4f46e5", fontWeight: 700, fontSize: "0.75rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 2 }}
                      >
                        View Salon ↗
                      </a>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "0.82rem" }}>
                      <div>
                        <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Salon Name</div>
                        <strong style={{ color: "#0f172a", fontSize: "0.9rem" }}>{selectedTicket.salon.name}</strong>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Owner Name</div>
                        <strong style={{ color: "#334155" }}>{selectedTicket.salon.ownerName || selectedTicket.salon.name}</strong>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Plan & Status</div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                          <span style={{ background: "#eef2ff", color: "#4338ca", padding: "2px 6px", borderRadius: 4, fontWeight: 700, fontSize: "0.72rem" }}>
                            {selectedTicket.salon.subscriptions?.[0]?.plan?.name || "Starter"}
                          </span>
                          <span style={{ color: selectedTicket.salon.subscriptions?.[0]?.status === "ACTIVE" ? "#16a34a" : "#d97706", fontWeight: 700, fontSize: "0.72rem" }}>
                            ● {selectedTicket.salon.subscriptions?.[0]?.status || "Active"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Contact Number</div>
                        <strong style={{ color: "#0f172a" }}>{selectedTicket.salon.phone || "—"}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Assignment & Management Card */}
                <div style={{ background: "white", borderRadius: 12, padding: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                    Assigned Agent
                  </div>
                  <CustomSelect
                    value={selectedTicket.assignedToId || ""}
                    onChange={e => {
                      const agentId = e.target.value || null;
                      const agentName = staff.find(s => String(s.id) === String(agentId))?.name || null;
                      updateTicket(selectedTicket.id, { assignedToId: agentId, assignedAgentName: agentName });
                      setSelectedTicket({ ...selectedTicket, assignedToId: agentId, assignedTo: staff.find(s => String(s.id) === String(agentId)) || null });
                    }}
                    disabled={selectedTicket.status === "CLOSED"}
                    style={{ width: "100%" }}
                  >
                    <option value="">-- Unassigned --</option>
                    {staff.filter(s => s.isActive !== false).map(s => <option key={s.id} value={s.id}>{s.name} ({s.adminRole?.name || "Support"})</option>)}
                  </CustomSelect>
                </div>

                {/* Internal Notes Box */}
                <div style={{ background: "white", borderRadius: 12, padding: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Internal Notes
                    </span>
                    <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>Hidden from Salon</span>
                  </div>
                  <textarea
                    rows={4}
                    value={notes[selectedTicket.id] || ""}
                    placeholder="Add internal notes for team (auto-timestamped)..."
                    onChange={(e) => setNotes({ ...notes, [selectedTicket.id]: e.target.value })}
                    disabled={selectedTicket.status === "CLOSED"}
                    style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: 10, fontSize: "0.8rem", background: "#f8fafc", width: "100%", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      disabled={selectedTicket.status === "CLOSED" || !notes[selectedTicket.id]?.trim()}
                      onClick={() => {
                        const newText = (notes[selectedTicket.id] || "").trim();
                        if (!newText) return;
                        const authorName = auth?.user?.name || "Support Staff";
                        const timestamp = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) + ", " + new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                        const isAlreadyFormatted = newText.includes(" — ");
                        const finalNote = isAlreadyFormatted ? newText : `${authorName} — ${timestamp}\n${newText}`;
                        updateTicket(selectedTicket.id, { internalNote: finalNote });
                        setNotes({ ...notes, [selectedTicket.id]: finalNote });
                      }}
                      style={{ background: "#4f46e5", color: "white", border: "none", padding: "6px 12px", fontWeight: 700, borderRadius: 6, cursor: "pointer", fontSize: "0.75rem" }}
                    >
                      📝 Save Note
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html:`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}} />

      {/* Create Ticket Modal */}
      {isCreateModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16, backdropFilter: "blur(4px)" }} onClick={() => setIsCreateModalOpen(false)}>
          <div style={{ background: "white", width: "100%", maxWidth: 500, borderRadius: 20, boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Create Support Ticket</h3>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: "transparent", border: "none", fontSize: 22, color: "#94a3b8", cursor: "pointer" }}>&times;</button>
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Salon (Optional)</label>
                <CustomSelect
                  value={newTicketForm.salonId}
                  onChange={e => setNewTicketForm({ ...newTicketForm, salonId: e.target.value })}
                  style={{ width: "100%" }}
                >
                  <option value="">-- No Salon / Internal --</option>
                  {salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </CustomSelect>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Category *</label>
                <CustomSelect
                  value={newTicketForm.category}
                  onChange={e => setNewTicketForm({ ...newTicketForm, category: e.target.value })}
                  style={{ width: "100%" }}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </CustomSelect>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Priority</label>
                <CustomSelect
                  value={newTicketForm.priority}
                  onChange={e => setNewTicketForm({ ...newTicketForm, priority: e.target.value })}
                  style={{ width: "100%" }}
                >
                  {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </CustomSelect>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Subject *</label>
                <input value={newTicketForm.title} onChange={e => setNewTicketForm({ ...newTicketForm, title: e.target.value })} placeholder="Brief summary" style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Description *</label>
                <textarea value={newTicketForm.description} onChange={e => setNewTicketForm({ ...newTicketForm, description: e.target.value })} placeholder="Detailed explanation..." rows={4} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", borderRadius: "0 0 20px 20px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ padding: "9px 16px", background: "white", color: "#475569", border: "1px solid #cbd5e1", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleCreateTicket} style={{ padding: "9px 16px", background: "#6366f1", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Create Ticket</button>
            </div>
          </div>
        </div>
      )}

      {/* Closure Reason Modal */}
      {closingTicketId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1050, padding: 16, backdropFilter: "blur(4px)" }} onClick={() => setClosingTicketId(null)}>
          <div style={{ background: "white", width: "100%", maxWidth: 400, borderRadius: 20, boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Close Ticket</h3>
              <button onClick={() => setClosingTicketId(null)} style={{ background: "transparent", border: "none", fontSize: 22, color: "#94a3b8", cursor: "pointer" }}>&times;</button>
            </div>
            <div style={{ padding: 24 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Closure Reason *</label>
              <textarea value={closureReason} onChange={e => setClosureReason(e.target.value)} placeholder="Why is this ticket being closed?" rows={4}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", borderRadius: "0 0 20px 20px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setClosingTicketId(null)} style={{ padding: "8px 16px", background: "white", color: "#475569", border: "1px solid #cbd5e1", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => {
                if (!closureReason.trim()) return;
                updateTicket(closingTicketId, { status: "CLOSED", closureReason, internalNote: (notes[closingTicketId] || "") + "\n\nClosure Reason: " + closureReason });
                if (selectedTicket?.id === closingTicketId) setSelectedTicket({ ...selectedTicket, status: "CLOSED" });
                setClosingTicketId(null);
                setClosureReason("");
              }} style={{ padding: "8px 16px", background: "#ef4444", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Confirm Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
