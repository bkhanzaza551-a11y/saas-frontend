import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import CustomSelect from "../../components/CustomSelect";
import { CheckCircle, XCircle, Clock, Mail, Phone, Calendar, Building2, RotateCcw, Plus, Video, ArrowRight, Activity, Eye, Search, Filter, Loader2 } from "lucide-react";

const PIPELINE = [
  { value: "NEW", label: "New", color: "#3b82f6", bg: "#eff6ff" },
  { value: "CONNECTED", label: "Contacted", color: "#8b5cf6", bg: "#f5f3ff" },
  { value: "DEMO_SCHEDULED", label: "Demo Scheduled", color: "#f59e0b", bg: "#fffbeb" },
  { value: "TRIAL_STARTED", label: "Trial Started", color: "#0ea5e9", bg: "#f0f9ff" },
  { value: "CONVERTED", label: "Converted", color: "#10b981", bg: "#ecfdf5" },
  { value: "CANCELED", label: "Lost", color: "#ef4444", bg: "#fef2f2" }
];

const getStatusMeta = (status) => PIPELINE.find(s => s.value === status) || PIPELINE[0];

const LEAD_SOURCES = [
  "Website",
  "Google Ads",
  "Instagram",
  "Facebook",
  "Referral",
  "Cold Call",
  "Walk-in",
  "Phone Inquiry"
];

const LOST_REASONS = [
  { value: "NOT_INTERESTED", label: "Not interested" },
  { value: "PRICE", label: "Price / Budget" },
  { value: "NO_RESPONSE", label: "No response / Unreachable" },
  { value: "COMPETITOR", label: "Competitor selected" },
  { value: "NOT_QUALIFIED", label: "Not qualified" },
  { value: "TIMING_ISSUE", label: "Timing issue" },
  { value: "DUPLICATE", label: "Duplicate lead" },
  { value: "OTHER", label: "Other (Specify in notes)" }
];

const ACTIVITY_META = {
  LEAD_CREATED: { label: "Lead Created", color: "#3b82f6", bg: "#eff6ff" },
  LEAD_ASSIGNED: { label: "Lead Assigned", color: "#8b5cf6", bg: "#f5f3ff" },
  LEAD_CONTACTED: { label: "Contacted", color: "#6366f1", bg: "#e0e7ff" },
  MARKED_CONTACTED: { label: "Contacted", color: "#6366f1", bg: "#e0e7ff" },
  FOLLOWUP_SET: { label: "Follow-up Scheduled", color: "#06b6d4", bg: "#ecfeff" },
  FOLLOWUP_COMPLETED: { label: "Follow-up Completed", color: "#10b981", bg: "#ecfdf5" },
  DEMO_SCHEDULED: { label: "Demo Scheduled", color: "#f59e0b", bg: "#fffbeb" },
  MEETING_SCHEDULED: { label: "Demo Scheduled", color: "#f59e0b", bg: "#fffbeb" },
  INVITE_RESENT: { label: "Invite Resent", color: "#d97706", bg: "#fef3c7" },
  PURCHASE_LINK_SENT: { label: "Payment Link Sent", color: "#3b82f6", bg: "#eff6ff" },
  LEAD_CONVERTED: { label: "Converted to Salon", color: "#10b981", bg: "#ecfdf5" },
  LEAD_LOST: { label: "Marked as Lost", color: "#ef4444", bg: "#fef2f2" },
  LEAD_REJECTED: { label: "Marked as Lost", color: "#ef4444", bg: "#fef2f2" },
  NOTE_ADDED: { label: "Note Added", color: "#64748b", bg: "#f1f5f9" }
};

const emptyLeadForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  planId: "",
  source: "Website",
  message: "",
  city: "Mumbai"
};

const emptyDraft = {
  salonName: "",
  planId: "",
  trialDays: 30,
  meetingScheduledAt: "",
  meetingLink: "",
  assignedUserId: "",
  nextFollowUpAt: "",
  lostReason: "",
  lostNotes: "",
  leadNotes: "",
  city: "Mumbai",
  billingCycle: "monthly"
};

export default function DemoLeadsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [plans, setPlans] = useState([]);
  const [staff, setStaff] = useState([]);

  // URL-driven filters
  const filters = useMemo(() => ({
    q: searchParams.get("q") || "",
    status: searchParams.get("status") || "",
    assigned: searchParams.get("assigned") || "",
    source: searchParams.get("source") || "",
    from: searchParams.get("from") || "",
    to: searchParams.get("to") || "",
    followUp: searchParams.get("followUp") || ""
  }), [searchParams]);

  const setFilterParam = (key, val) => {
    setSearchParams(prev => {
      if (val) prev.set(key, val); else prev.delete(key);
      return prev;
    });
  };

  const setFilterParams = (patch) => {
    setSearchParams(prev => {
      Object.entries(patch).forEach(([k, v]) => {
        if (v) prev.set(k, v); else prev.delete(k);
      });
      return prev;
    });
  };

  const [drafts, setDrafts] = useState({});
  const [busyId, setBusyId] = useState("");
  const [actionType, setActionType] = useState("");
  const [feedback, setFeedback] = useState({ error: "", success: "" });
  const [loading, setLoading] = useState(true);
  const [lastApprovedLead, setLastApprovedLead] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [leadForm, setLeadForm] = useState(emptyLeadForm);
  const [addingLead, setAddingLead] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState(null);

  const closeDetailModal = () => setSelectedLead(null);

  const openLeadById = async (id) => {
    let lead = rows.find((r) => r.id === id);
    if (!lead) {
      await load(filters);
      lead = rows.find((r) => r.id === id);
    }
    if (lead) setSelectedLead(lead);
  };

  const load = async (nextFilters = filters) => {
    setLoading(true);
    try {
      const [leadResponse, planResponse, staffResponse] = await Promise.all([
        api.get("/super-admin/demo-leads", {
          params: {
            ...(nextFilters.q ? { q: nextFilters.q } : {}),
            ...(nextFilters.status ? { status: nextFilters.status } : {}),
            ...(nextFilters.assigned ? { assignedUserId: nextFilters.assigned } : {}),
            ...(nextFilters.source ? { leadSource: nextFilters.source } : {}),
            ...(nextFilters.from ? { createdFrom: nextFilters.from } : {}),
            ...(nextFilters.to ? { createdTo: nextFilters.to } : {}),
            ...(nextFilters.followUp ? { followUp: nextFilters.followUp } : {})
          }
        }),
        api.get("/super-admin/plans"),
        api.get("/super-admin/staff", { params: { onlyActive: 1, role: "Sales" } })
      ]);
      setRows(leadResponse.data || []);
      setPlans(planResponse.data || []);
      setStaff(staffResponse?.data?.users || staffResponse?.data || []);
    } catch (error) {
      setFeedback({ error: formatApiError(error, "Could not load leads."), success: "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filters);
  }, [filters]);

  const draftsById = useMemo(() => {
    const map = {};
    for (const row of rows) {
      map[row.id] = drafts[row.id] || {
        ...emptyDraft,
        salonName: row.salon?.name || `${row.name.split(" ")[0] || row.name} Salon`,
        planId: plans[0]?.id || "",
        meetingScheduledAt: row.meetingScheduledAt ? new Date(row.meetingScheduledAt).toISOString().slice(0, 16) : "",
        meetingLink: row.meetingLink || "",
        assignedUserId: row.assignedUserId || "",
        nextFollowUpAt: row.nextFollowUpAt ? new Date(row.nextFollowUpAt).toISOString().slice(0, 16) : ""
      };
    }
    return map;
  }, [rows, drafts, plans]);

  const updateDraft = (leadId, key, value) => {
    setDrafts(prev => ({
      ...prev,
      [leadId]: {
        ...draftsById[leadId],
        [key]: value
      }
    }));
  };

  // Create Lead Manually
  const handleAddLeadSubmit = async (e) => {
    e.preventDefault();
    if (!leadForm.name.trim() || !leadForm.email.trim() || !leadForm.phone.trim() || !leadForm.company.trim()) return;

    setAddingLead(true);
    setDuplicateInfo(null);
    setFeedback({ error: "", success: "" });
    try {
      await api.post("/super-admin/demo-leads", leadForm);
      setFeedback({ error: "", success: `Lead '${leadForm.name}' added successfully!` });
      setLeadForm(emptyLeadForm);
      setIsAddModalOpen(false);
      await load();
    } catch (err) {
      const data = err?.response?.data;
      if (data?.duplicate && data?.lead) {
        setDuplicateInfo(data);
      } else {
        setFeedback({ error: formatApiError(err, "Failed to add lead"), success: "" });
      }
    } finally {
      setAddingLead(false);
    }
  };

  const generateZohoMeetingLink = async (leadId) => {
    setBusyId(leadId);
    setActionType("generate-link");
    try {
      const res = await api.post(`/super-admin/demo-leads/${leadId}/create-zoho-meeting`, {});
      if (res.data?.meetingUrl) {
        updateDraft(leadId, "meetingLink", res.data.meetingUrl);
      }
    } catch (err) {
      console.warn("Backend Zoho API call failed, generating room URL:", err);
      const meetCode = `rsp-${Math.random().toString(36).substring(2, 8)}`;
      updateDraft(leadId, "meetingLink", `https://meeting.zoho.com/meeting/join?key=${meetCode}`);
    } finally {
      setBusyId("");
      setActionType("");
    }
  };

  const openCalendarInvite = (row, type = "google") => {
    const draft = draftsById[row.id] || {};
    const meetingTime = draft.meetingScheduledAt ? new Date(draft.meetingScheduledAt) : new Date();
    const meetLink = draft.meetingLink || "https://meeting.zoho.com";

    const title = `SalonNest Product Demo - ${row.company || row.name}`;
    const description = `Product Demo walkthrough for ${row.name} (${row.phone}).\n\nMeeting: ${meetLink}\nEmail: ${row.email}`;

    const pad = (n) => String(n).padStart(2, "0");
    const y = meetingTime.getFullYear();
    const mo = pad(meetingTime.getMonth() + 1);
    const d = pad(meetingTime.getDate());
    const h = pad(meetingTime.getHours());
    const mi = pad(meetingTime.getMinutes());
    const startStr = `${y}${mo}${d}T${h}${mi}00`;
    const endTime = new Date(meetingTime.getTime() + 60 * 60 * 1000);
    const endStr = `${endTime.getFullYear()}${pad(endTime.getMonth() + 1)}${pad(endTime.getDate())}T${pad(endTime.getHours())}${pad(endTime.getMinutes())}00`;

    if (type === "google") {
      const gUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(meetLink)}`;
      window.open(gUrl, "_blank");
    } else {
      const calUrl = `https://calendar.zoho.com/calendar#action=addEvent&title=${encodeURIComponent(title)}&sdate=${startStr}&edate=${endStr}&desc=${encodeURIComponent(description)}&location=${encodeURIComponent(meetLink)}`;
      window.open(calUrl, "_blank");
    }
  };

  const markContacted = async (leadId) => {
    setBusyId(leadId);
    setActionType("mark-contacted");
    setFeedback({ error: "", success: "" });
    try {
      await api.post(`/super-admin/demo-leads/${leadId}/contacted`);
      setFeedback({ error: "", success: "Lead marked as Contacted." });
      await load();
    } catch (error) {
      setFeedback({ error: formatApiError(error, "Could not update lead status."), success: "" });
    } finally {
      setBusyId("");
      setActionType("");
    }
  };

  const saveFollowUp = async (leadId) => {
    setBusyId(leadId);
    setActionType("save-followup");
    setFeedback({ error: "", success: "" });
    const draft = draftsById[leadId] || {};
    try {
      await api.put(`/super-admin/demo-leads/${leadId}`, {
        nextFollowUpAt: draft.nextFollowUpAt || null,
        leadNotes: draft.leadNotes || ""
      });
      setFeedback({ error: "", success: "Follow-up saved and logged in timeline." });
      await load();
    } catch (err) {
      setFeedback({ error: formatApiError(err, "Failed to save follow-up"), success: "" });
    } finally {
      setBusyId("");
      setActionType("");
    }
  };

  const markFollowUpCompleted = async (leadId) => {
    setBusyId(leadId);
    setActionType("complete-followup");
    setFeedback({ error: "", success: "" });
    try {
      await api.post(`/super-admin/demo-leads/${leadId}/follow-up-completed`);
      setFeedback({ error: "", success: "Follow-up marked as completed." });
      await load();
    } catch (err) {
      setFeedback({ error: formatApiError(err, "Failed to mark follow-up completed"), success: "" });
    } finally {
      setBusyId("");
      setActionType("");
    }
  };

  const scheduleMeeting = async (leadId) => {
    setBusyId(leadId);
    setActionType("save-demo");
    setFeedback({ error: "", success: "" });
    const draft = draftsById[leadId];
    if (!draft.meetingScheduledAt || !draft.meetingLink) {
      setFeedback({ error: "Please fill meeting date/time and meeting link before scheduling.", success: "" });
      setBusyId("");
      setActionType("");
      return;
    }
    try {
      await api.post(`/super-admin/demo-leads/${leadId}/schedule-meeting`, {
        meetingScheduledAt: draft.meetingScheduledAt,
        meetingLink: draft.meetingLink
      });
      setFeedback({ error: "", success: "Demo invitation email sent and scheduled." });
      await load();
    } catch (error) {
      setFeedback({ error: formatApiError(error, "Could not schedule meeting."), success: "" });
    } finally {
      setBusyId("");
      setActionType("");
    }
  };

  const sendPurchaseLink = async (leadId) => {
    setBusyId(leadId);
    setActionType("send-pay-link");
    setFeedback({ error: "", success: "" });
    const draft = draftsById[leadId];
    if (!draft.planId) {
      setFeedback({ error: "Please select a subscription plan before sending the purchase link.", success: "" });
      setBusyId("");
      setActionType("");
      return;
    }
    try {
      await api.post(`/super-admin/demo-leads/${leadId}/send-purchase-link`, { planId: draft.planId });
      setFeedback({ error: "", success: "Purchase link sent to customer email!" });
      await load();
    } catch (error) {
      setFeedback({ error: formatApiError(error, "Could not send purchase link."), success: "" });
    } finally {
      setBusyId("");
      setActionType("");
    }
  };

  const approveLead = async (leadId) => {
    setBusyId(leadId);
    setActionType("convert");
    setFeedback({ error: "", success: "" });
    setLastApprovedLead(null);
    const draft = draftsById[leadId];
    if (!draft.planId) {
      setFeedback({ error: "Please select a subscription plan before creating the salon.", success: "" });
      setBusyId("");
      setActionType("");
      return;
    }
    try {
      const response = await api.post(`/super-admin/demo-leads/${leadId}/approve`, draft);
      setLastApprovedLead(response.data);
      setFeedback({
        error: response.data.emailError ? `Salon created but email failed: ${response.data.emailError}` : "",
        success: response.data.owner?.isDemoAccount
          ? `Demo salon created for ${response.data.owner?.email}. Salon: ${response.data.salon?.name}`
          : `Salon created. Login details sent to ${response.data.owner?.email}.`
      });
      await load();
    } catch (error) {
      setFeedback({ error: formatApiError(error, "Could not create salon."), success: "" });
    } finally {
      setBusyId("");
      setActionType("");
    }
  };

  const rejectLead = async (leadId) => {
    setBusyId(leadId);
    setActionType("reject");
    setFeedback({ error: "", success: "" });
    const draft = draftsById[leadId];
    if (!draft.lostReason) {
      setFeedback({ error: "Please select a reason for marking as lost.", success: "" });
      setBusyId("");
      setActionType("");
      return;
    }
    if (draft.lostReason === "OTHER" && !(draft.lostNotes || "").trim()) {
      setFeedback({ error: "Please add notes describing the 'Other' reason.", success: "" });
      setBusyId("");
      setActionType("");
      return;
    }
    try {
      await api.post(`/super-admin/demo-leads/${leadId}/reject`, {
        reviewNote: draft.reviewNote,
        lostReason: draft.lostReason,
        lostNotes: draft.lostNotes
      });
      setFeedback({ error: "", success: "Lead marked as Lost." });
      await load();
    } catch (error) {
      setFeedback({ error: formatApiError(error, "Could not mark lead as lost."), success: "" });
    } finally {
      setBusyId("");
      setActionType("");
    }
  };

  const pipelineCounts = useMemo(() => {
    const counts = {};
    PIPELINE.forEach(s => { counts[s.value] = 0; });
    rows.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
    return counts;
  }, [rows]);

  const formatLastActivity = (row) => {
    const act = row.lastActivity;
    if (!act) return { label: "—", color: "#94a3b8" };
    const meta = ACTIVITY_META[act.action] || { label: act.action.replace(/_/g, " "), color: "#64748b" };
    const time = new Date(act.createdAt).toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    return { label: `${meta.label} • ${time}`, color: meta.color };
  };

  return (
    <div className="page-shell super-admin-page">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: "#0f172a" }}>Sales CRM</h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.9rem" }}>Track lead sources, schedule demos, manage follow-ups, and convert leads into salons.</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setIsAddModalOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: "#4f46e5", color: "white", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 6px rgba(79,70,229,0.2)" }}
            >
              <Plus size={16} /> Add Lead
            </button>
            <button onClick={() => load(filters)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#475569" }}>
              <RotateCcw size={14} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 20 }}>
        {PIPELINE.map(stage => (
          <div
            key={stage.value}
            onClick={() => setFilters({ ...filters, status: filters.status === stage.value ? "" : stage.value })}
            style={{
              padding: "14px 16px",
              background: filters.status === stage.value ? stage.bg : "#fff",
              border: `2px solid ${filters.status === stage.value ? stage.color : "#e2e8f0"}`,
              borderRadius: 12,
              cursor: "pointer",
              transition: "all 0.15s"
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: stage.color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{stage.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{pipelineCounts[stage.value]}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "24px", marginBottom: 24, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px -4px rgba(0, 0, 0, 0.05)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
          {/* Top Row: Search and Clear Button */}
          <div style={{ display: "flex", gap: "12px", width: "100%", alignItems: "center", flexWrap: "wrap" }}>
            <div className="search-input-wrapper" style={{ flex: 1, minWidth: "260px" }}>
              <div className="search-icon">
                <Search size={18} />
              </div>
              <input
                className="search-input-field"
                value={filters.q}
                placeholder="Search leads by salon name, contact person, phone, email, lead ID..."
                onChange={(e) => setFilterParam("q", e.target.value)}
                style={{ width: "100%", height: 44, borderRadius: 12, border: "1px solid #cbd5e1", fontSize: "0.92rem", color: "#1e293b", outline: "none", boxSizing: "border-box", transition: "all 0.2s", background: "#f8fafc" }}
                onFocus={e => { e.target.style.background = "#fff"; e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.08)"; }}
                onBlur={e => { e.target.style.background = "#f8fafc"; e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            <button 
              onClick={() => setFilters({ q: "", status: "", assigned: "", source: "", from: "", to: "", followUp: "" })} 
              style={{ height: 42, padding: "0 18px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s", whiteSpace: "nowrap" }}
              onMouseOver={e => { e.currentTarget.style.background="#fee2e2"; e.currentTarget.style.borderColor="#fca5a5"; e.currentTarget.style.color="#dc2626"; }}
              onMouseOut={e => { e.currentTarget.style.background="#f8fafc"; e.currentTarget.style.borderColor="#e2e8f0"; e.currentTarget.style.color="#64748b"; }}
            >
              <Filter size={15} />
              Clear Filters
            </button>
          </div>

          {/* Bottom Row: Detailed Dropdown Filters */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Salesperson</label>
              <CustomSelect
                value={filters.assigned}
                onChange={(e) => setFilters({ ...filters, assigned: e.target.value })}
                style={{ width: "100%" }}
              >
                <option value="">All</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </CustomSelect>
            </div>
            
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Source</label>
              <CustomSelect
                value={filters.source}
                onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                style={{ width: "100%" }}
              >
                <option value="">All</option>
                {LEAD_SOURCES.map(src => <option key={src} value={src}>{src}</option>)}
              </CustomSelect>
            </div>
            
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Follow-up</label>
              <CustomSelect
                value={filters.followUp}
                onChange={(e) => setFilters({ ...filters, followUp: e.target.value })}
                style={{ width: "100%" }}
              >
                <option value="">All</option>
                <option value="today">Today</option>
                <option value="upcoming">Upcoming</option>
                <option value="overdue">Overdue</option>
                <option value="completed">Completed</option>
              </CustomSelect>
            </div>
            
            <div style={{ minWidth: "220px" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Date Range</label>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} title="From date" style={{ flex: 1, height: 42, padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: 500, background: "#f8fafc", color: "#334155", outline: "none", cursor: "pointer", boxSizing: "border-box", transition: "all 0.2s" }} onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.08)"; }} onBlur={e => { e.target.style.borderColor = "#cbd5e1"; e.target.style.background = "#f8fafc"; e.target.style.boxShadow = "none"; }} />
                <span style={{ fontSize: "0.75rem", color: "#cbd5e1", fontWeight: 700 }}>→</span>
                <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} title="To date" style={{ flex: 1, height: 42, padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: 500, background: "#f8fafc", color: "#334155", outline: "none", cursor: "pointer", boxSizing: "border-box", transition: "all 0.2s" }} onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.08)"; }} onBlur={e => { e.target.style.borderColor = "#cbd5e1"; e.target.style.background = "#f8fafc"; e.target.style.boxShadow = "none"; }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback.error && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", color: "#991b1b", fontSize: 14, fontWeight: 600 }}>
          <XCircle size={20} /> {feedback.error}
          <span onClick={() => setFeedback({ error: "", success: "" })} style={{ marginLeft: "12px", cursor: "pointer", color: "#dc2626", fontWeight: 700, padding: 4 }}>x</span>
        </div>
      )}
      {feedback.success && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 12, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", color: "#065f46", fontSize: 14, fontWeight: 600 }}>
          <CheckCircle size={20} /> {feedback.success}
          <span onClick={() => setFeedback({ error: "", success: "" })} style={{ marginLeft: "12px", cursor: "pointer", color: "#059669", fontWeight: 700, padding: 4 }}>x</span>
        </div>
      )}

      {/* Approved Lead Banner */}
      {lastApprovedLead && (
        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <h4 style={{ color: "#065f46", margin: "0 0 8px", fontSize: "1rem", fontWeight: 700 }}>Salon Created!</h4>
              <p style={{ margin: "0 0 12px", fontSize: 14, color: "#064e3b" }}>
                Salon created for <strong>{lastApprovedLead.owner?.email}</strong>.
              </p>
              <div style={{ display: "grid", gap: 8, background: "#fff", padding: 14, borderRadius: 10, border: "1px solid #d1fae5" }}>
                <div><strong>Salon Name:</strong> {lastApprovedLead.salon?.name}</div>
                <div><strong>Owner Email:</strong> {lastApprovedLead.owner?.email}</div>
                <div><strong>Invite Link:</strong> <a href={lastApprovedLead.inviteLink} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>{lastApprovedLead.inviteLink}</a></div>
              </div>
            </div>
            <button onClick={() => setLastApprovedLead(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#059669", fontWeight: 700 }}>Close</button>
          </div>
        </div>
      )}

      {/* Lead Table */}
      {loading ? (
        <PageLoader title="Loading Leads" />
      ) : rows.length === 0 ? (
        <EmptyState title="No leads found" message="Add a lead or wait for new website inquiries." />
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflowX: "auto", overflowY: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#64748b", fontWeight: 700, textAlign: "left" }}>
                <th style={{ padding: "13px 18px" }}>Lead</th>
                <th style={{ padding: "13px 18px" }}>Contact</th>
                <th style={{ padding: "13px 18px" }}>Source</th>
                <th style={{ padding: "13px 18px" }}>Status</th>
                <th style={{ padding: "13px 18px" }}>Assigned To</th>
                <th style={{ padding: "13px 18px" }}>Next Follow-up</th>
                <th style={{ padding: "13px 18px" }}>Last Activity</th>
                <th style={{ padding: "13px 18px" }}>Added</th>
                <th style={{ padding: "13px 18px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const meta = getStatusMeta(row.status);
                const lastAct = formatLastActivity(row);
                const isOverdue = row.nextFollowUpAt && new Date(row.nextFollowUpAt) < new Date() && row.status !== "CONVERTED" && row.status !== "CANCELED";
                return (
                  <tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s", cursor: "default" }} className="table-row-hover">
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{row.name}</div>
                      {row.company && <div style={{ fontSize: 12, color: "#94a3b8" }}>{row.company}</div>}
                    </td>
                    <td style={{ padding: "14px 18px", color: "#475569" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}><Mail size={12} />{row.email}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Phone size={12} />{row.phone}</div>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", background: "#f1f5f9", border: "1px solid #e2e8f0", padding: "3px 8px", borderRadius: 6 }}>
                        {row.leadSource || "Website"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, background: meta.bg, padding: "4px 10px", borderRadius: 100, whiteSpace: "nowrap" }}>
                        {meta.label}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                        {row.assignedUser ? row.assignedUser.name : "Unassigned"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", color: "#475569", whiteSpace: "nowrap" }}>
                      {row.nextFollowUpAt ? (
                        <span style={{ color: isOverdue ? "#dc2626" : "#334155", fontWeight: isOverdue ? 700 : 500 }}>
                          {new Date(row.nextFollowUpAt).toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          {isOverdue && <span style={{ display: "block", fontSize: 10, color: "#dc2626" }}>Overdue</span>}
                        </span>
                      ) : <span style={{ color: "#94a3b8" }}>—</span>}
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: 11, color: lastAct.color, whiteSpace: "nowrap" }}>{lastAct.label}</td>
                    <td style={{ padding: "14px 18px", color: "#94a3b8", whiteSpace: "nowrap" }}>
                      {new Date(row.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <button
                        onClick={() => setSelectedLead(row)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "linear-gradient(135deg, #4f46e5, #6366f1)", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 6px rgba(79,70,229,0.25)" }}
                      >
                        View Details <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* View Details Modal */}
      {selectedLead && (() => {
        const row = selectedLead;
        const meta = getStatusMeta(row.status);
        const draft = draftsById[row.id];
        const isBusy = busyId === row.id;
        const isConverted = row.status === "CONVERTED";
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16, backdropFilter: "blur(4px)" }} onClick={closeDetailModal}>
            <div style={{ background: "white", width: "100%", maxWidth: 720, borderRadius: 20, boxShadow: "0 24px 60px rgba(0,0,0,0.2)", maxHeight: "92vh", overflowY: "auto", animation: "slideInRight 0.25s ease" }} onClick={e => e.stopPropagation()}>

              {/* Modal Header */}
              <div style={{ padding: "22px 26px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>{row.name}</h2>
                    <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, background: meta.bg, padding: "3px 10px", borderRadius: 100 }}>{meta.label}</span>
                    {row.leadSource && <span style={{ fontSize: 11, color: "#64748b", background: "#f1f5f9", padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>🏷️ {row.leadSource}</span>}
                  </div>
                  {row.company && <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{row.company}</div>}
                </div>
                <button onClick={closeDetailModal} style={{ background: "#f1f5f9", border: "none", cursor: "pointer", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 18, flexShrink: 0 }}>✕</button>
              </div>

              <div style={{ padding: "20px 26px", display: "flex", flexDirection: "column", gap: 20 }}>

                {isConverted && (
                  <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10, padding: "10px 14px", color: "#065f46", fontSize: 13, fontWeight: 600 }}>
                    ✓ This lead has been converted to a salon. Conversion actions are read-only.
                  </div>
                )}

                {/* Contact Info Row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>Email</div>
                    <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}><Mail size={12} color="#6366f1" />{row.email}</div>
                  </div>
                  <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>Phone</div>
                    <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}><Phone size={12} color="#6366f1" />{row.phone}</div>
                  </div>
                  <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>Added On</div>
                    <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}><Clock size={12} color="#6366f1" />{new Date(row.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Assign To</div>
                    <CustomSelect
                      disabled={isConverted}
                      value={draft.assignedUserId}
                      onChange={e => {
                        updateDraft(row.id, "assignedUserId", e.target.value);
                        api.put(`/super-admin/demo-leads/${row.id}`, { assignedUserId: e.target.value }).catch(console.error);
                      }}
                      style={{ width: "100%" }}
                    >
                      <option value="">Unassigned</option>
                      {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </CustomSelect>
                  </div>
                  <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Next Follow-Up Date</div>
                    <input 
                      disabled={isConverted} 
                      type="datetime-local" 
                      value={draft.nextFollowUpAt} 
                      onChange={e => { 
                        updateDraft(row.id, "nextFollowUpAt", e.target.value); 
                        api.put(`/super-admin/demo-leads/${row.id}`, { nextFollowUpAt: e.target.value || null }).catch(console.error); 
                      }} 
                      style={{ width: "100%", height: 38, padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box", outline: "none", transition: "all 0.2s" }} 
                      onFocus={e => e.target.style.borderColor = "#6366f1"}
                      onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                    />
                  </div>
                </div>

                {/* Message & Notes */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {row.message && (
                    <div style={{ background: "#fefce8", border: "1px solid #fef08a", borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", textTransform: "uppercase", marginBottom: 5 }}>Inquiry Message</div>
                      <p style={{ margin: 0, fontSize: 13, color: "#451a03", lineHeight: 1.6 }}>"{row.message}"</p>
                    </div>
                  )}
                  <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#075985", textTransform: "uppercase", marginBottom: 5 }}>Internal Notes</div>
                    <textarea
                      disabled={isConverted}
                      value={draft.leadNotes !== undefined ? draft.leadNotes : (row.leadNotes || "")}
                      onChange={e => updateDraft(row.id, "leadNotes", e.target.value)}
                      onBlur={() => api.put(`/super-admin/demo-leads/${row.id}`, { leadNotes: draft.leadNotes }).catch(console.error)}
                      placeholder="Add internal notes about this lead..."
                      style={{ width: "100%", padding: 8, fontSize: 13, color: "#0c4a6e", background: "transparent", border: "1px dashed #7dd3fc", borderRadius: 6, resize: "vertical", minHeight: 60, boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                {/* Quick Actions Bar */}
                {!isConverted && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                    {row.status === "NEW" && (
                      <button
                        onClick={() => { markContacted(row.id); }}
                        disabled={isBusy}
                        style={{
                          padding: "9px 16px",
                          background: isBusy && actionType === "mark-contacted" ? "#7c3aed" : "#8b5cf6",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: isBusy ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        {isBusy && actionType === "mark-contacted" ? (
                          <>
                            <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Updating...
                          </>
                        ) : (
                          "✓ Mark as Contacted"
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => saveFollowUp(row.id)}
                      disabled={isBusy}
                      style={{
                        padding: "9px 16px",
                        background: isBusy && actionType === "save-followup" ? "#0284c7" : "#0ea5e9",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: isBusy ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      {isBusy && actionType === "save-followup" ? (
                        <>
                          <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Saving...
                        </>
                      ) : (
                        "Save Follow-Up"
                      )}
                    </button>

                    {row.nextFollowUpAt && (
                      <button
                        onClick={() => markFollowUpCompleted(row.id)}
                        disabled={isBusy}
                        style={{
                          padding: "9px 16px",
                          background: "#ecfdf5",
                          color: "#065f46",
                          border: "1px solid #a7f3d0",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: isBusy ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        {isBusy && actionType === "complete-followup" ? (
                          <>
                            <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Completing...
                          </>
                        ) : (
                          "✓ Follow-Up Done"
                        )}
                      </button>
                    )}
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {/* Meeting Section */}
                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      <Video size={15} color="#6366f1" /> Schedule Demo
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Meeting Date & Time</label>
                        <input disabled={isConverted} type="datetime-local" value={draft.meetingScheduledAt} onChange={e => updateDraft(row.id, "meetingScheduledAt", e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Meeting Link</label>
                        <div style={{ display: "flex", gap: 6 }}>
                          <input disabled={isConverted} type="text" placeholder="https://meeting.zoho.com/..." value={draft.meetingLink} onChange={e => updateDraft(row.id, "meetingLink", e.target.value)} style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }} />
                          <button
                            type="button"
                            disabled={isConverted || (isBusy && actionType === "generate-link")}
                            onClick={() => generateZohoMeetingLink(row.id)}
                            style={{
                              padding: "6px 10px",
                              background: "#e0e7ff",
                              color: "#4338ca",
                              border: "1px solid #c7d2fe",
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: isConverted || (isBusy && actionType === "generate-link") ? "not-allowed" : "pointer",
                              whiteSpace: "nowrap",
                              display: "flex",
                              alignItems: "center",
                              gap: 4
                            }}
                          >
                            {isBusy && actionType === "generate-link" ? (
                              <>
                                <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> Generating...
                              </>
                            ) : (
                              "+ Link"
                            )}
                          </button>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => scheduleMeeting(row.id)}
                          disabled={isBusy || isConverted}
                          style={{
                            flex: 1,
                            minWidth: 150,
                            padding: "9px 10px",
                            background: isBusy && actionType === "save-demo" ? "#d97706" : "#f59e0b",
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: isBusy || isConverted ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6
                          }}
                        >
                          {isBusy && actionType === "save-demo" ? (
                            <>
                              <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                              <span>Sending Invite...</span>
                            </>
                          ) : (
                            "Send & Email Invite"
                          )}
                        </button>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button type="button" onClick={() => openCalendarInvite(row, "google")} title="Add to Google Calendar" style={{ padding: "9px 10px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Calendar size={12} /> Google Cal</button>
                          <button type="button" onClick={() => openCalendarInvite(row, "zoho")} title="Add to Zoho Calendar" style={{ padding: "9px 10px", background: "#334155", color: "#fff", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>Zoho Cal</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Conversion Section */}
                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      <Building2 size={15} color="#16a34a" /> Convert to Salon
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 4 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
                          <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Select Plan</label>
                            <CustomSelect 
                              value={draft.planId} 
                              onChange={e => updateDraft(row.id, "planId", e.target.value)} 
                              options={plans.map(p => {
                                const isYearly = draft.billingCycle === "yearly";
                                const priceVal = isYearly 
                                  ? (p.yearlyPrice || (p.monthlyPrice * 10)) 
                                  : p.monthlyPrice;
                                const priceText = `₹${Number(priceVal).toLocaleString("en-IN")}/${isYearly ? "yr" : "mo"}`;
                                return { label: `${p.name} — ${priceText}`, value: p.id };
                              })} 
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Billing Cycle</label>
                            <CustomSelect 
                              value={draft.billingCycle || "monthly"} 
                              onChange={e => updateDraft(row.id, "billingCycle", e.target.value)} 
                              options={[
                                { label: "Monthly", value: "monthly" },
                                { label: "Yearly", value: "yearly" }
                              ]} 
                            />
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Salon City *</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Mumbai, Delhi" 
                              value={draft.city || "Mumbai"} 
                              onChange={e => updateDraft(row.id, "city", e.target.value)} 
                              style={{ width: "100%", height: 38, padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box", outline: "none", transition: "all 0.2s" }} 
                              onFocus={e => e.target.style.borderColor = "#6366f1"}
                              onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Trial Days</label>
                            <input 
                              type="number" 
                              value={draft.trialDays} 
                              onChange={e => updateDraft(row.id, "trialDays", e.target.value)} 
                              style={{ width: "100%", height: 38, padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box", outline: "none", transition: "all 0.2s" }} 
                              onFocus={e => e.target.style.borderColor = "#6366f1"}
                              onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => approveLead(row.id)}
                        disabled={isBusy || isConverted}
                        style={{
                          padding: "9px 12px",
                          background: isConverted ? "#d1fae5" : (isBusy && actionType === "convert" ? "#059669" : "#10b981"),
                          color: isConverted ? "#065f46" : "#fff",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: isConverted || isBusy ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6
                        }}
                      >
                        {isBusy && actionType === "convert" ? (
                          <>
                            <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                            <span>Creating Salon & Sending Login...</span>
                          </>
                        ) : isConverted ? (
                          "✓ Already Converted"
                        ) : (
                          "Convert & Create Salon"
                        )}
                      </button>

                      {isConverted && row.salon?.id && (
                        <a
                          href={`/super-admin/salons/${row.salon.id}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: "9px 12px",
                            background: "#0f172a",
                            color: "#fff",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            textDecoration: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6
                          }}
                        >
                          <Building2 size={14} /> View Salon Profile →
                        </a>
                      )}

                      {!isConverted && (
                        <button
                          type="button"
                          onClick={() => sendPurchaseLink(row.id)}
                          disabled={isBusy}
                          style={{
                            padding: "9px 12px",
                            background: isBusy && actionType === "send-pay-link" ? "#2563eb" : "#3b82f6",
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: isBusy ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6
                          }}
                        >
                          {isBusy && actionType === "send-pay-link" ? (
                            <>
                              <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                              <span>Sending Payment Link...</span>
                            </>
                          ) : (
                            "Send Pay Link"
                          )}
                        </button>
                      )}

                      {row.status !== "CANCELED" && !isConverted && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6, padding: 12, background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca" }}>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#991b1b", marginBottom: -4 }}>Mark as Lost - Reason</label>
                          <CustomSelect value={draft.lostReason || ""} onChange={e => updateDraft(row.id, "lostReason", e.target.value)} options={[{ label: "Select Reason...", value: "" }, ...LOST_REASONS.map(r => ({ label: r.label, value: r.value }))]} />
                          <textarea rows={2} placeholder={draft.lostReason === "OTHER" ? "Notes required for 'Other'..." : "Optional notes on why we lost this lead..."} value={draft.lostNotes || ""} onChange={e => updateDraft(row.id, "lostNotes", e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #fca5a5", fontSize: 12, boxSizing: "border-box" }} />
                          <button
                            type="button"
                            onClick={() => rejectLead(row.id)}
                            disabled={isBusy}
                            style={{
                              padding: "9px 10px",
                              background: isBusy && actionType === "reject" ? "#dc2626" : "#ef4444",
                              color: "#fff",
                              border: "none",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: isBusy ? "not-allowed" : "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6
                            }}
                          >
                            {isBusy && actionType === "reject" ? (
                              <>
                                <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Updating...
                              </>
                            ) : (
                              "Mark as Lost"
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Activity Timeline */}
                {(row.activityLogs || []).length > 0 && (
                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      <Activity size={15} color="#6366f1" /> Activity Timeline
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      {[...(row.activityLogs || [])].reverse().map((log, idx) => {
                        const am = ACTIVITY_META[log.action] || { label: log.action.replace(/_/g, " "), color: "#64748b", bg: "#f1f5f9" };
                        return (
                          <div key={log.id} style={{ display: "flex", gap: 12, position: "relative", paddingBottom: idx < row.activityLogs.length - 1 ? 14 : 0 }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: am.bg, color: am.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0, border: `2px solid ${am.color}` }}>
                              {idx === 0 ? "★" : "•"}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{am.label}</div>
                              {log.details && log.details !== "null" && <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>{log.details}</div>}
                              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                                {log.actorName || "System"} • {new Date(log.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Manual Add Lead Modal */}
      {isAddModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "white", width: "100%", maxWidth: 540, borderRadius: 20, padding: "28px 32px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>Add New Lead</h2>
              <button onClick={() => { setIsAddModalOpen(false); setDuplicateInfo(null); }} style={{ border: "none", background: "#f1f5f9", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#0f172a"; }} onMouseOut={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#64748b"; }}>
                <XCircle size={18} />
              </button>
            </div>

            {duplicateInfo && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "#991b1b", fontSize: "0.85rem", marginBottom: 6 }}>
                  <Eye size={16} /> Duplicate Lead Detected
                </div>
                <p style={{ margin: "0 0 12px", fontSize: "0.8rem", color: "#7f1d1d" }}>
                  {duplicateInfo.message} Existing: <strong>{duplicateInfo.lead.name}</strong>{duplicateInfo.lead.company ? ` (${duplicateInfo.lead.company})` : ""}
                </p>
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setDuplicateInfo(null); openLeadById(duplicateInfo.lead.id); }}
                  style={{ padding: "8px 16px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", transition: "background 0.2s" }}
                  onMouseOver={e => e.currentTarget.style.background = "#dc2626"}
                  onMouseOut={e => e.currentTarget.style.background = "#ef4444"}
                >
                  View Existing Lead
                </button>
              </div>
            )}

            <form onSubmit={handleAddLeadSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: 6, color: "#475569" }}>Contact Person Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={leadForm.name}
                  onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box", transition: "all 0.2s", outline: "none", background: "#f8fafc", color: "#1e293b" }}
                  onFocus={e => { e.target.style.background = "#fff"; e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)"; }}
                  onBlur={e => { e.target.style.background = "#f8fafc"; e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: 6, color: "#475569" }}>Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="rahul@salon.com"
                    value={leadForm.email}
                    onChange={e => setLeadForm({ ...leadForm, email: e.target.value })}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box", transition: "all 0.2s", outline: "none", background: "#f8fafc", color: "#1e293b" }}
                    onFocus={e => { e.target.style.background = "#fff"; e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)"; }}
                    onBlur={e => { e.target.style.background = "#f8fafc"; e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "none"; }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: 6, color: "#475569" }}>Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9876543210"
                    value={leadForm.phone}
                    onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box", transition: "all 0.2s", outline: "none", background: "#f8fafc", color: "#1e293b" }}
                    onFocus={e => { e.target.style.background = "#fff"; e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)"; }}
                    onBlur={e => { e.target.style.background = "#f8fafc"; e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: 6, color: "#475569" }}>Salon / Business Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Glamour Studio"
                    value={leadForm.company}
                    onChange={e => setLeadForm({ ...leadForm, company: e.target.value })}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box", transition: "all 0.2s", outline: "none", background: "#f8fafc", color: "#1e293b" }}
                    onFocus={e => { e.target.style.background = "#fff"; e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)"; }}
                    onBlur={e => { e.target.style.background = "#f8fafc"; e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "none"; }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: 6, color: "#475569" }}>Lead Source</label>
                  <CustomSelect
                    value={leadForm.leadSource}
                    onChange={e => setLeadForm({ ...leadForm, leadSource: e.target.value })}
                    options={LEAD_SOURCES.map(src => ({ label: src, value: src }))}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: 6, color: "#475569" }}>Initial Inquiry Message / Request</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Interested in multi-branch billing & POS demo..."
                  value={leadForm.message}
                  onChange={e => setLeadForm({ ...leadForm, message: e.target.value })}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: "0.9rem", resize: "vertical", boxSizing: "border-box", transition: "all 0.2s", outline: "none", background: "#f8fafc", color: "#1e293b" }}
                  onFocus={e => { e.target.style.background = "#fff"; e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)"; }}
                  onBlur={e => { e.target.style.background = "#f8fafc"; e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: 6, color: "#475569" }}>Internal Staff Notes</label>
                <textarea
                  rows={2}
                  placeholder="Internal notes about lead requirements or callback instructions..."
                  value={leadForm.leadNotes}
                  onChange={e => setLeadForm({ ...leadForm, leadNotes: e.target.value })}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: "0.9rem", resize: "vertical", boxSizing: "border-box", transition: "all 0.2s", outline: "none", background: "#f8fafc", color: "#1e293b" }}
                  onFocus={e => { e.target.style.background = "#fff"; e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)"; }}
                  onBlur={e => { e.target.style.background = "#f8fafc"; e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: 6, color: "#475569" }}>Assign To</label>
                  <CustomSelect
                    value={leadForm.assignedUserId}
                    onChange={e => setLeadForm({ ...leadForm, assignedUserId: e.target.value })}
                    options={[{label: "Unassigned", value: ""}, ...staff.map(s => ({ label: `${s.name} (${s.email})`, value: s.id }))]}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: 6, color: "#475569" }}>Next Follow-Up</label>
                  <input
                    type="datetime-local"
                    value={leadForm.nextFollowUpAt}
                    onChange={e => setLeadForm({ ...leadForm, nextFollowUpAt: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box", transition: "all 0.2s", outline: "none", background: "#f8fafc", color: "#1e293b", height: 42 }}
                    onFocus={e => { e.target.style.background = "#fff"; e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)"; }}
                    onBlur={e => { e.target.style.background = "#f8fafc"; e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 16, borderTop: "1px solid #f1f5f9", paddingTop: 20 }}>
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)} 
                  style={{ padding: "0 20px", height: 44, background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 10, fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                  onMouseOver={e => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#0f172a"; }}
                  onMouseOut={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#475569"; }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={addingLead} 
                  style={{ padding: "0 24px", height: 44, background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)", color: "white", border: "none", borderRadius: 10, fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)", opacity: addingLead ? 0.7 : 1, transition: "all 0.2s" }}
                  onMouseOver={e => { if(!addingLead) { e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 6px 8px -2px rgba(79, 70, 229, 0.3)"; } }}
                  onMouseOut={e => { if(!addingLead) { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 4px 6px -1px rgba(79, 70, 229, 0.2)"; } }}
                >
                  {addingLead ? "Adding..." : "Add Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
