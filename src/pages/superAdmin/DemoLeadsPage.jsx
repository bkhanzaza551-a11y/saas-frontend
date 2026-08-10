import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import CustomSelect from "../../components/CustomSelect";
import { CheckCircle, XCircle, Clock, Mail, Phone, Calendar, Building2, Send, ChevronDown, ArrowRight, RotateCcw, Plus, Video, ExternalLink, Tag } from "lucide-react";

const PIPELINE = [
  { value: "NEW", label: "New", color: "#3b82f6", bg: "#eff6ff" },
  { value: "CONNECTED", label: "Connected", color: "#8b5cf6", bg: "#f5f3ff" },
  { value: "DEMO_SCHEDULED", label: "Demo Scheduled", color: "#f59e0b", bg: "#fffbeb" },
  { value: "TRIAL_STARTED", label: "Trial Started", color: "#0ea5e9", bg: "#f0f9ff" },
  { value: "CONVERTED", label: "Converted", color: "#10b981", bg: "#ecfdf5" },
  { value: "CANCELED", label: "Canceled", color: "#ef4444", bg: "#fef2f2" }
];

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

const getStatusMeta = (status) => PIPELINE.find(s => s.value === status) || PIPELINE[0];

const emptyDraft = {
  planId: "",
  salonName: "",
  businessType: "Salon",
  trialDays: 30,
  reviewNote: "",
  meetingScheduledAt: "",
  meetingLink: ""
};

const emptyLeadForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  leadSource: "Website",
  message: "",
  leadNotes: ""
};

export default function DemoLeadsPage() {
  const [rows, setRows] = useState([]);
  const [plans, setPlans] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const qFilter = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") || "";

  const filters = useMemo(() => ({
    q: qFilter,
    status: statusFilter
  }), [qFilter, statusFilter]);

  const setFilters = (newFilters) => {
    setSearchParams((prev) => {
      if (typeof newFilters === "function") {
        const next = newFilters({ q: qFilter, status: statusFilter });
        if (next.q) prev.set("q", next.q); else prev.delete("q");
        if (next.status) prev.set("status", next.status); else prev.delete("status");
      } else {
        if (newFilters.q) prev.set("q", newFilters.q); else prev.delete("q");
        if (newFilters.status) prev.set("status", newFilters.status); else prev.delete("status");
      }
      return prev;
    });
  };

  const [drafts, setDrafts] = useState({});
  const [busyId, setBusyId] = useState("");
  const [feedback, setFeedback] = useState({ error: "", success: "" });
  const [loading, setLoading] = useState(true);
  const [lastApprovedLead, setLastApprovedLead] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);

  // Manual Lead Creation Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [leadForm, setLeadForm] = useState(emptyLeadForm);
  const [addingLead, setAddingLead] = useState(false);

  const closeDetailModal = () => setSelectedLead(null);

  const load = async (nextFilters = filters) => {
    setLoading(true);
    try {
      const [leadResponse, planResponse] = await Promise.all([
        api.get("/super-admin/demo-leads", {
          params: {
            ...(nextFilters.q ? { q: nextFilters.q } : {}),
            ...(nextFilters.status ? { status: nextFilters.status } : {})
          }
        }),
        api.get("/super-admin/plans")
      ]);
      setRows(leadResponse.data || []);
      setPlans(planResponse.data || []);
    } catch (error) {
      setFeedback({ error: formatApiError(error, "Could not load demo leads."), success: "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const [leadResponse, planResponse] = await Promise.all([
          api.get("/super-admin/demo-leads", {
            params: {
              ...(filters.q ? { q: filters.q } : {}),
              ...(filters.status ? { status: filters.status } : {})
            }
          }),
          api.get("/super-admin/plans")
        ]);
        if (!active) return;
        setRows(leadResponse.data || []);
        setPlans(planResponse.data || []);
      } catch (error) {
        if (!active) return;
        setFeedback({ error: formatApiError(error, "Could not load demo leads."), success: "" });
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [filters]);

  const draftsById = useMemo(() => {
    const map = {};
    for (const row of rows) {
      map[row.id] = drafts[row.id] || {
        ...emptyDraft,
        salonName: row.salon?.name || `${row.name.split(" ")[0] || row.name} Salon`,
        planId: row.selectedPlanId || plans[0]?.id || "",
        meetingScheduledAt: row.meetingScheduledAt ? new Date(row.meetingScheduledAt).toISOString().slice(0, 16) : "",
        meetingLink: row.meetingLink || ""
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
    if (!leadForm.name.trim() || !leadForm.email.trim() || !leadForm.phone.trim()) return;

    setAddingLead(true);
    setFeedback({ error: "", success: "" });
    try {
      await api.post("/super-admin/demo-leads", leadForm);
      setFeedback({ error: "", success: `Demo lead '${leadForm.name}' added successfully to pipeline!` });
      setLeadForm(emptyLeadForm);
      setIsAddModalOpen(false);
      await load();
    } catch (err) {
      setFeedback({ error: formatApiError(err, "Failed to add demo lead"), success: "" });
    } finally {
      setAddingLead(false);
    }
  };

  // Helper to generate Zoho Meeting room link via Backend API
  const generateZohoMeetingLink = async (leadId) => {
    try {
      const draft = draftsById[leadId];
      const res = await api.post(`/super-admin/demo-leads/${leadId}/create-zoho-meeting`, {
        startTime: draft.meetingScheduledAt || new Date()
      });
      if (res.data?.meetingUrl) {
        updateDraft(leadId, "meetingLink", res.data.meetingUrl);
      }
    } catch (err) {
      console.warn("Backend Zoho API call failed, generating room URL:", err);
      const meetCode = `rsp-${Math.random().toString(36).substring(2, 8)}`;
      updateDraft(leadId, "meetingLink", `https://meeting.zoho.com/meeting/join?key=${meetCode}`);
    }
  };

  // Helper to open Zoho Calendar Event creator
  const openZohoCalendarInvite = (row) => {
    const draft = draftsById[row.id];
    const meetingTime = draft.meetingScheduledAt ? new Date(draft.meetingScheduledAt) : new Date();
    const meetLink = draft.meetingLink || "https://meeting.zoho.com";

    const title = `Salon Nest Product Demo - ${row.company || row.name}`;
    const description = `Product Demo walkthrough for ${row.name} (${row.phone}).\n\nZoho Meeting: ${meetLink}\nEmail: ${row.email}`;

    // Zoho Calendar uses yyyyMMddTHHmmss format
    const pad = (n) => String(n).padStart(2, "0");
    const y = meetingTime.getFullYear();
    const mo = pad(meetingTime.getMonth() + 1);
    const d = pad(meetingTime.getDate());
    const h = pad(meetingTime.getHours());
    const mi = pad(meetingTime.getMinutes());
    const startStr = `${y}${mo}${d}T${h}${mi}00`;
    // End time = start + 1 hour
    const endTime = new Date(meetingTime.getTime() + 60 * 60 * 1000);
    const ey = endTime.getFullYear();
    const emo = pad(endTime.getMonth() + 1);
    const ed = pad(endTime.getDate());
    const eh = pad(endTime.getHours());
    const emi = pad(endTime.getMinutes());
    const endStr = `${ey}${emo}${ed}T${eh}${emi}00`;

    const calUrl = `https://calendar.zoho.com/calendar#action=addEvent&title=${encodeURIComponent(title)}&sdate=${startStr}&edate=${endStr}&desc=${encodeURIComponent(description)}&location=${encodeURIComponent(meetLink)}`;

    window.open(calUrl, "_blank");
  };

  const markContacted = async (leadId) => {
    setBusyId(leadId);
    setFeedback({ error: "", success: "" });
    try {
      await api.post(`/super-admin/demo-leads/${leadId}/contacted`);
      setFeedback({ error: "", success: "Lead marked as Connected." });
      await load();
    } catch (error) {
      setFeedback({ error: formatApiError(error, "Could not update lead status."), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const scheduleMeeting = async (leadId) => {
    setBusyId(leadId);
    setFeedback({ error: "", success: "" });
    const draft = draftsById[leadId];
    if (!draft.meetingScheduledAt || !draft.meetingLink) {
      setFeedback({ error: "Please fill meeting date/time and meeting link before scheduling.", success: "" });
      setBusyId("");
      return;
    }
    try {
      await api.post(`/super-admin/demo-leads/${leadId}/schedule-meeting`, {
        meetingScheduledAt: draft.meetingScheduledAt,
        meetingLink: draft.meetingLink
      });
      setFeedback({ error: "", success: "Meeting scheduled and Google Calendar / Meet invitation sent!" });
      await load();
    } catch (error) {
      setFeedback({ error: formatApiError(error, "Could not schedule meeting."), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const sendPurchaseLink = async (leadId) => {
    setBusyId(leadId);
    setFeedback({ error: "", success: "" });
    const draft = draftsById[leadId];
    if (!draft.planId) {
      setFeedback({ error: "Please select a subscription plan before sending the purchase link.", success: "" });
      setBusyId("");
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
    }
  };

  const approveLead = async (leadId) => {
    setBusyId(leadId);
    setFeedback({ error: "", success: "" });
    setLastApprovedLead(null);
    const draft = draftsById[leadId];
    if (!draft.planId) {
      setFeedback({ error: "Please select a subscription plan before creating the workspace.", success: "" });
      setBusyId("");
      return;
    }
    try {
      const response = await api.post(`/super-admin/demo-leads/${leadId}/approve`, draft);
      setLastApprovedLead(response.data);
      setFeedback({
        error: response.data.emailError ? `Workspace created but email failed: ${response.data.emailError}` : "",
        success: response.data.owner.isDemoAccount
          ? `Demo workspace created for ${response.data.owner.email}. Salon: ${response.data.salon.name}`
          : `Paid workspace created. Login details sent to ${response.data.owner.email}.`
      });
      await load();
    } catch (error) {
      setFeedback({ error: formatApiError(error, "Could not create workspace."), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const rejectLead = async (leadId) => {
    setBusyId(leadId);
    setFeedback({ error: "", success: "" });
    const draft = draftsById[leadId];
    if (!draft.lostReason) {
      setFeedback({ error: "Please select a reason for marking as lost.", success: "" });
      setBusyId("");
      return;
    }
    try {
      await api.post(`/super-admin/demo-leads/${leadId}/reject`, { 
        reviewNote: draft.reviewNote,
        lostReason: draft.lostReason,
        lostNotes: draft.lostNotes
      });
      setFeedback({ error: "", success: "Lead marked as Canceled." });
      await load();
    } catch (error) {
      setFeedback({ error: formatApiError(error, "Could not cancel lead."), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const pipelineCounts = useMemo(() => {
    const counts = {};
    PIPELINE.forEach(s => { counts[s.value] = 0; });
    rows.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
    return counts;
  }, [rows]);

  return (
    <div className="page-shell super-admin-page">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: "#0f172a" }}>Sales Pipeline</h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.9rem" }}>Track lead sources, schedule Google Meet demos, and manage workspace conversions.</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setIsAddModalOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: "#4f46e5", color: "white", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 6px rgba(79,70,229,0.2)" }}
            >
              <Plus size={16} /> Add Demo Lead
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
            onClick={() => setFilters({ q: filters.q, status: filters.status === stage.value ? "" : stage.value })}
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
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <input
          value={filters.q}
          placeholder="Search by name, email, phone, lead source, salon..."
          onChange={(e) => setFilters({ q: e.target.value, status: filters.status })}
          style={{ flex: 1, minWidth: 250, height: 40, padding: "0 14px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, outline: "none" }}
        />
        <button
          onClick={() => setFilters({ q: "", status: "" })}
          style={{ height: 40, padding: "0 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#64748b" }}
        >
          Clear Filters
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback.error && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, marginBottom: 16, color: "#991b1b", fontSize: 14, fontWeight: 500 }}>
          <XCircle size={18} /> {feedback.error}
          <span onClick={() => setFeedback({ error: "", success: "" })} style={{ marginLeft: "auto", cursor: "pointer", color: "#dc2626", fontWeight: 700 }}>x</span>
        </div>
      )}
      {feedback.success && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10, marginBottom: 16, color: "#065f46", fontSize: 14, fontWeight: 500 }}>
          <CheckCircle size={18} /> {feedback.success}
          <span onClick={() => setFeedback({ error: "", success: "" })} style={{ marginLeft: "auto", cursor: "pointer", color: "#059669", fontWeight: 700 }}>x</span>
        </div>
      )}

      {/* Approved Lead Banner */}
      {lastApprovedLead && (
        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <h4 style={{ color: "#065f46", margin: "0 0 8px", fontSize: "1rem", fontWeight: 700 }}>Workspace Created!</h4>
              <p style={{ margin: "0 0 12px", fontSize: 14, color: "#064e3b" }}>
                Salon workspace created for <strong>{lastApprovedLead.owner?.email}</strong>.
              </p>
              <div style={{ display: "grid", gap: 8, background: "#fff", padding: 14, borderRadius: 10, border: "1px solid #d1fae5" }}>
                <div><strong>Salon Name:</strong> {lastApprovedLead.salon?.name}</div>
                <div><strong>Owner Email:</strong> {lastApprovedLead.owner?.email}</div>
                <div><strong>Setup Password URL:</strong> <a href={lastApprovedLead.passwordSetupUrl} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>{lastApprovedLead.passwordSetupUrl}</a></div>
              </div>
            </div>
            <button onClick={() => setLastApprovedLead(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#059669", fontWeight: 700 }}>Close</button>
          </div>
        </div>
      )}

      {/* Lead Table */}
      {loading ? (
        <PageLoader title="Loading Demo Pipeline" />
      ) : rows.length === 0 ? (
        <EmptyState title="No demo leads found" message="Add a lead or wait for new website demo inquiries." />
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#64748b", fontWeight: 700, textAlign: "left" }}>
                <th style={{ padding: "13px 18px" }}>Lead</th>
                <th style={{ padding: "13px 18px" }}>Contact</th>
                <th style={{ padding: "13px 18px" }}>Source</th>
                <th style={{ padding: "13px 18px" }}>Status</th>
                <th style={{ padding: "13px 18px" }}>Added</th>
                <th style={{ padding: "13px 18px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const meta = getStatusMeta(row.status);
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
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16, backdropFilter: "blur(4px)" }} onClick={closeDetailModal}>
            <div style={{ background: "white", width: "100%", maxWidth: 680, borderRadius: 20, boxShadow: "0 24px 60px rgba(0,0,0,0.2)", maxHeight: "92vh", overflowY: "auto", animation: "slideInRight 0.25s ease" }} onClick={e => e.stopPropagation()}>
              
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

                {/* Message & Notes */}
                {(row.message || row.leadNotes) && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {row.message && (
                      <div style={{ background: "#fefce8", border: "1px solid #fef08a", borderRadius: 10, padding: "12px 14px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", textTransform: "uppercase", marginBottom: 5 }}>Inquiry Message</div>
                        <p style={{ margin: 0, fontSize: 13, color: "#451a03", lineHeight: 1.6 }}>"{row.message}"</p>
                      </div>
                    )}
                    {row.leadNotes && (
                      <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "12px 14px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#075985", textTransform: "uppercase", marginBottom: 5 }}>Internal Notes</div>
                        <p style={{ margin: 0, fontSize: 13, color: "#0c4a6e" }}>{row.leadNotes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Action */}
                {row.status === "NEW" && (
                  <button onClick={() => { markContacted(row.id); closeDetailModal(); }} disabled={isBusy} style={{ padding: "10px 16px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", alignSelf: "flex-start" }}>
                    ✓ Mark as Connected
                  </button>
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
                        <input type="datetime-local" value={draft.meetingScheduledAt} onChange={e => updateDraft(row.id, "meetingScheduledAt", e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Meeting Link</label>
                        <div style={{ display: "flex", gap: 6 }}>
                          <input type="text" placeholder="https://meeting.zoho.com/..." value={draft.meetingLink} onChange={e => updateDraft(row.id, "meetingLink", e.target.value)} style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }} />
                          <button type="button" onClick={() => generateZohoMeetingLink(row.id)} style={{ padding: "6px 10px", background: "#e0e7ff", color: "#4338ca", border: "1px solid #c7d2fe", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>+ Link</button>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" onClick={() => scheduleMeeting(row.id)} disabled={isBusy} style={{ flex: 1, padding: "9px 10px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Save & Email Invite</button>
                        <button type="button" onClick={() => openZohoCalendarInvite(row)} style={{ padding: "9px 10px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Calendar size={12} /> Calendar</button>
                      </div>
                    </div>
                  </div>

                  {/* Conversion Section */}
                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      <Building2 size={15} color="#16a34a" /> Convert to Client
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 8 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Select Plan</label>
                          <CustomSelect value={draft.planId} onChange={e => updateDraft(row.id, "planId", e.target.value)} options={plans.map(p => ({ label: `${p.name} (₹${p.monthlyPrice}/mo)`, value: p.id }))} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Trial Days</label>
                          <input type="number" value={draft.trialDays} onChange={e => updateDraft(row.id, "trialDays", e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }} />
                        </div>
                      </div>
                      <button type="button" onClick={() => approveLead(row.id)} disabled={isBusy || row.status === "CONVERTED"} style={{ padding: "9px 12px", background: row.status === "CONVERTED" ? "#d1fae5" : "#10b981", color: row.status === "CONVERTED" ? "#065f46" : "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: row.status === "CONVERTED" ? "not-allowed" : "pointer" }}>
                        {row.status === "CONVERTED" ? "✓ Already Converted" : "Convert & Create Salon"}
                      </button>
                        <button type="button" onClick={() => sendPurchaseLink(row.id)} disabled={isBusy} style={{ flex: 1, padding: "9px 10px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Send Pay Link</button>
                      </div>
                      
                      {row.status !== "CANCELED" && row.status !== "CONVERTED" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10, padding: 12, background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca" }}>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#991b1b", marginBottom: -4 }}>Mark as Lost - Reason</label>
                          <CustomSelect value={draft.lostReason || ""} onChange={e => updateDraft(row.id, "lostReason", e.target.value)} options={[{label: "Select Reason...", value: ""}, {label: "Too Expensive", value: "PRICE"}, {label: "Missing Features", value: "FEATURES"}, {label: "Went with Competitor", value: "COMPETITOR"}, {label: "Not Interested", value: "NOT_INTERESTED"}]} />
                          <textarea rows={2} placeholder="Optional notes on why we lost this lead..." value={draft.lostNotes || ""} onChange={e => updateDraft(row.id, "lostNotes", e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #fca5a5", fontSize: 12, boxSizing: "border-box" }} />
                          <button type="button" onClick={() => rejectLead(row.id)} disabled={isBusy} style={{ padding: "9px 10px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Mark as Lost</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Manual Add Lead Modal */}
      {isAddModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "white", width: "100%", maxWidth: 500, borderRadius: 16, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid #eee", paddingBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Add New Demo Lead</h2>
              <button onClick={() => setIsAddModalOpen(false)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8" }}>✕</button>
            </div>

            <form onSubmit={handleAddLeadSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Contact Person Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={leadForm.name}
                  onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="rahul@salon.com"
                    value={leadForm.email}
                    onChange={e => setLeadForm({ ...leadForm, email: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9876543210"
                    value={leadForm.phone}
                    onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Salon / Business Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Glamour Studio"
                    value={leadForm.company}
                    onChange={e => setLeadForm({ ...leadForm, company: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Lead Source</label>
                  <CustomSelect
                    value={leadForm.leadSource}
                    onChange={e => setLeadForm({ ...leadForm, leadSource: e.target.value })}
                    options={LEAD_SOURCES.map(src => ({ label: src, value: src }))}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Initial Inquiry Message / Request</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Interested in multi-branch billing & POS demo..."
                  value={leadForm.message}
                  onChange={e => setLeadForm({ ...leadForm, message: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Internal Staff Notes</label>
                <textarea
                  rows={2}
                  placeholder="Internal notes about lead requirements or callback instructions..."
                  value={leadForm.leadNotes}
                  onChange={e => setLeadForm({ ...leadForm, leadNotes: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 12, borderTop: "1px solid #eee", paddingTop: 16 }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={addingLead} className="btn btn-primary" style={{ opacity: addingLead ? 0.7 : 1 }}>
                  {addingLead ? "Adding..." : "Add to Pipeline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
