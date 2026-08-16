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
  "General", "Login", "POS", "Appointments", "Inventory", "Billing",
  "Subscription", "Product/Staff Request", "Technical Issue", "Feature Request"
];

const getStatMeta = (status) => STATUSES.find(s => s.value === status) || STATUSES[0];
const getPrioMeta = (p) => PRIORITIES.find(pr => pr.value === p) || PRIORITIES[1];

export default function SuperAdminSupportTicketsPage() {
  const [searchParams] = useSearchParams();
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
      api.get("/super-admin/salons")
    ]).then(([response, staffRes, salonsRes]) => {
      if (!active) return;
      const data = response.data || [];
      setRows(data);
      setStaff(staffRes?.data?.users || staffRes?.data || []);
      setSalons(salonsRes?.data || []);
      setNotes(Object.fromEntries(data.map((row) => [row.id, row.internalNote || ""])));
      setLoading(false);
      if (searchParams.get("new") === "true") { setIsCreateModalOpen(true); window.history.replaceState({}, document.title, window.location.pathname); }
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
              <Shield size={26} style={{ color: "#6366f1" }} /> Platform Support
            </h1>
            <p style={{ marginBottom: 0 }}>Global helpdesk for salon support requests, internal notes, agent assignments, and responses.</p>
          </div>
          <div className="badge-row">
            <button onClick={() => setIsCreateModalOpen(true)} style={{ padding: "8px 16px", borderRadius: 8, background: "#6366f1", color: "white", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <MessageSquare size={16} /> Create Ticket
            </button>
          </div>
        </div>
      </div>

      {/* Clickable Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Queue", value: stats.total, color: "#6366f1", border: "#6366f1", filterKey: "", filterVal: "" },
          { label: "Open", value: stats.open, color: "#ef4444", border: "#ef4444", filterKey: "status", filterVal: "OPEN" },
          { label: "In Progress", value: stats.inProgress, color: "#2563eb", border: "#2563eb", filterKey: "status", filterVal: "IN_PROGRESS" },
          { label: "Waiting for Salon", value: stats.waiting, color: "#d97706", border: "#d97706", filterKey: "status", filterVal: "WAITING_FOR_SALON" },
          { label: "Urgent", value: stats.urgent, color: "#b91c1c", border: "#b91c1c", filterKey: "priority", filterVal: "URGENT" },
          { label: "Resolved & Closed", value: stats.resolved, color: "#16a34a", border: "#16a34a", filterKey: "status", filterVal: "RESOLVED" }
        ].map(card => (
          <div key={card.label} onClick={() => { if (card.filterKey) setFilterAndReload(card.filterKey, card.filterVal); }}
            style={{ padding: 16, borderLeft: `4px solid ${card.border}`, background: "white", borderRadius: 10, cursor: card.filterKey ? "pointer" : "default", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", transition: "transform 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "none"}>
            <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{card.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: card.color, marginTop: 2 }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", marginBottom: 28, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px -4px rgba(0, 0, 0, 0.06)" }}>
        
        {/* Search Bar Row */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, position: "relative", minWidth: 280 }}>
            <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex", pointerEvents: "none" }}>
              <Search size={18} />
            </div>
            <input
              value={filters.q}
              placeholder="Search by title, salon, agent..."
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              style={{ width: "100%", height: 42, padding: "10px 14px 10px 40px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: "0.9rem", color: "#1e293b", outline: "none", boxSizing: "border-box", transition: "all 0.2s", background: "#f8fafc" }}
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
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
          
          <div>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Date Range</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} title="Created from" style={{ flex: 1, height: 42, padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.82rem", fontWeight: 500, background: "#f8fafc", color: "#334155", outline: "none", cursor: "pointer", boxSizing: "border-box", minWidth: 0, transition: "all 0.2s" }} onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.08)"; }} onBlur={e => { e.target.style.borderColor = "#cbd5e1"; e.target.style.background = "#f8fafc"; e.target.style.boxShadow = "none"; }} />
              <span style={{ fontSize: "0.75rem", color: "#cbd5e1", fontWeight: 700 }}>→</span>
              <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} title="Created to" style={{ flex: 1, height: 42, padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.82rem", fontWeight: 500, background: "#f8fafc", color: "#334155", outline: "none", cursor: "pointer", boxSizing: "border-box", minWidth: 0, transition: "all 0.2s" }} onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.08)"; }} onBlur={e => { e.target.style.borderColor = "#cbd5e1"; e.target.style.background = "#f8fafc"; e.target.style.boxShadow = "none"; }} />
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

      {/* Ticket Detail Slide-in */}
      {selectedTicket && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", zIndex: 9999, display: "flex", justifyContent: "flex-end", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "white", width: "100%", maxWidth: 720, height: "100%", display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(0,0,0,0.1)", animation: "slideInRight 0.3s ease" }}>

            {/* Header */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", background: "#eef2ff", padding: "2px 8px", borderRadius: 6 }}>#{selectedTicket.id.substring(0, 8)}</span>
                  <h2 style={{ margin: "6px 0 4px", fontSize: 18, fontWeight: 800 }}>{selectedTicket.title}</h2>
                  <div style={{ display: "flex", gap: 10, fontSize: 12, color: "#64748b" }}>
                    <span><Building2 size={11} style={{ display: "inline" }} /> {selectedTicket.salon?.name || "Global"}</span>
                    <span><Tag size={11} style={{ display: "inline" }} /> {selectedTicket.category || "General"}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedTicket(null)} style={{ background: "transparent", border: "none", fontSize: 22, color: "#94a3b8", cursor: "pointer" }}>&times;</button>
              </div>

              {/* Salon Context */}
              {selectedTicket.salon && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "#f0f9ff", borderRadius: 8, border: "1px solid #bae6fd", display: "flex", gap: 20, fontSize: 12 }}>
                  <div><span style={{ color: "#64748b" }}>Owner:</span> <strong>{selectedTicket.salon.ownerName || selectedTicket.salon.name}</strong></div>
                  <div><span style={{ color: "#64748b" }}>Plan:</span> <strong>{selectedTicket.salon.subscriptions?.[0]?.plan?.name || "None"}</strong></div>
                  <div><span style={{ color: "#64748b" }}>Status:</span> <strong style={{ color: selectedTicket.salon.subscriptions?.[0]?.status === "ACTIVE" ? "#16a34a" : "#d97706" }}>{selectedTicket.salon.subscriptions?.[0]?.status || "No Subscription"}</strong></div>
                </div>
              )}

              {/* Tab Bar */}
              <div style={{ display: "flex", gap: 0, marginTop: 14 }}>
                {["conversation", "activity"].map(tab => (
                  <button key={tab} onClick={() => setDetailTab(tab)}
                    style={{ padding: "7px 16px", fontSize: 12, fontWeight: 700, border: "none", borderBottom: detailTab === tab ? "2px solid #6366f1" : "2px solid transparent", background: "transparent", color: detailTab === tab ? "#6366f1" : "#94a3b8", cursor: "pointer", textTransform: "capitalize" }}>
                    {tab === "conversation" ? <><MessageSquare size={12} style={{ display: "inline", marginRight: 4 }} />Conversation</> : <><History size={12} style={{ display: "inline", marginRight: 4 }} />Activity</>}
                  </button>
                ))}
              </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
              {detailTab === "conversation" ? (
                <>
                  <div style={{ background: "#f8fafc", borderLeft: "4px solid #6366f1", padding: "14px 18px", borderRadius: "0 10px 10px 0", fontSize: 13, color: "#334155", lineHeight: 1.6, marginBottom: 20, whiteSpace: "pre-wrap" }}>
                    {selectedTicket.description}
                  </div>

                  {/* Internal Notes + Agent */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Internal Notes (hidden from salon)</label>
                      <textarea rows={2} value={notes[selectedTicket.id] || ""}
                        onChange={(e) => setNotes({ ...notes, [selectedTicket.id]: e.target.value })}
                        disabled={selectedTicket.status === "CLOSED"}
                        style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: 10, fontSize: 12, background: "#f8fafc", width: "100%", resize: "vertical", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Assigned Agent</label>
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
                        <option value="">Unassigned</option>
                        {staff.filter(s => s.isActive !== false).map(s => <option key={s.id} value={s.id}>{s.name} ({s.adminRole?.name || "No Role"})</option>)}
                      </CustomSelect>
                    </div>
                  </div>

                  {/* Conversation Thread */}
                  {selectedTicket.messages?.length > 0 && (
                    <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16, marginBottom: 20 }}>
                      <h5 style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8 }}>Conversation ({selectedTicket.messages.length})</h5>
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {selectedTicket.messages.map((msg) => {
                          const isAgent = msg.authorType === "SUPER_ADMIN" || msg.authorType === "SUPPORT" || msg.authorType === "SYSTEM";
                          const authorLabel = msg.authorType === "SUPER_ADMIN" ? "Support Agent" : msg.authorType === "SALON" ? "Salon Owner" : msg.authorType;
                          return (
                            <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignSelf: isAgent ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 10, color: "#94a3b8", marginBottom: 3, padding: "0 4px" }}>
                                <strong>{msg.authorName} ({authorLabel})</strong>
                                <span>{new Date(msg.createdAt).toLocaleString()}</span>
                              </div>
                              <div style={{
                                background: isAgent ? "linear-gradient(135deg, #4f46e5, #3b82f6)" : "#f1f5f9",
                                color: isAgent ? "white" : "#0f172a",
                                borderRadius: isAgent ? "14px 14px 0 14px" : "14px 14px 14px 0",
                                padding: "12px 16px", fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap"
                              }}>
                                {msg.message}
                                {msg.attachmentUrl && (
                                  <div style={{ marginTop: 8, fontSize: 11, borderTop: isAgent ? "1px dashed rgba(255,255,255,0.3)" : "1px dashed #e2e8f0", paddingTop: 6 }}>
                                    {isImageAttachment(msg.attachmentUrl) ? (
                                      <div>
                                        <img src={msg.attachmentUrl} alt="Attachment" style={{ maxWidth: 240, maxHeight: 180, borderRadius: 8, border: "1px solid #cbd5e1", display: "block", marginBottom: 4 }} />
                                        <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" style={{ color: isAgent ? "#a5b4fc" : "#2563eb", textDecoration: "underline", fontWeight: 600 }}>View Full Image &rarr;</a>
                                      </div>
                                    ) : (
                                      <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" download style={{ color: isAgent ? "#ffffff" : "#2563eb", textDecoration: "underline", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                        <Paperclip size={11} /> {getAttachmentLabel(msg.attachmentUrl)} &rarr;
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
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

            {/* Footer Actions */}
            {detailTab === "conversation" && (
              <div style={{ padding: "12px 24px", borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
                {selectedTicket.status !== "CLOSED" ? (
                  <>
                    <div style={{ marginBottom: 10 }}>
                      <textarea rows={2} value={replyDrafts[selectedTicket.id] || ""}
                        placeholder="Type reply to salon..."
                        onChange={(e) => setReplyDrafts({ ...replyDrafts, [selectedTicket.id]: e.target.value })}
                        style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: 10, fontSize: 13, background: "white", width: "100%", resize: "vertical", boxSizing: "border-box" }} />
                      <div style={{ marginTop: 6 }}>
                        <label style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b", cursor: "pointer" }}>
                          <Paperclip size={12} /> Attach File
                          <input type="file" accept="image/*,.pdf,.doc,.docx" hidden onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) { const reader = new FileReader(); reader.onloadend = () => setReplyAttachments({ ...replyAttachments, [selectedTicket.id]: reader.result }); reader.readAsDataURL(file); }
                          }} />
                        </label>
                        {replyAttachments[selectedTicket.id] && <span style={{ fontSize: 11, color: "#16a34a", marginLeft: 8 }}>File attached</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { updateTicket(selectedTicket.id, { internalNote: notes[selectedTicket.id] || "", assignedToId: selectedTicket.assignedToId || null }); }}
                          style={{ background: "white", color: "#475569", border: "1px solid #cbd5e1", padding: "7px 14px", fontWeight: 700, borderRadius: 6, cursor: "pointer", fontSize: 11 }}>Save Note</button>
                        <button onClick={() => { setClosingTicketId(selectedTicket.id); setClosureReason(""); }}
                          style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca", padding: "7px 14px", fontWeight: 700, borderRadius: 6, cursor: "pointer", fontSize: 11 }}>Close Ticket</button>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => sendReply(selectedTicket.id, "IN_PROGRESS")}
                          style={{ background: "#4f46e5", color: "white", border: "none", padding: "7px 14px", fontWeight: 700, borderRadius: 6, cursor: "pointer", fontSize: 11 }}>Reply</button>
                        <button onClick={() => sendReply(selectedTicket.id, "RESOLVED")}
                          style={{ background: "#16a34a", color: "white", border: "none", padding: "7px 14px", fontWeight: 700, borderRadius: 6, cursor: "pointer", fontSize: 11 }}>Reply & Resolve</button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>This ticket is closed.</span>
                    <button onClick={() => { updateTicket(selectedTicket.id, { status: "OPEN", closureReason: null }); setSelectedTicket({ ...selectedTicket, status: "OPEN" }); }}
                      style={{ background: "#eef2ff", color: "#3730a3", border: "1px solid #c7d2fe", padding: "8px 18px", fontWeight: 700, borderRadius: 8, cursor: "pointer", fontSize: 12 }}>Reopen Ticket</button>
                  </div>
                )}
              </div>
            )}
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
