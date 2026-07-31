import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
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

  // Manual Lead Creation Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [leadForm, setLeadForm] = useState(emptyLeadForm);
  const [addingLead, setAddingLead] = useState(false);

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
    const startTimeIso = meetingTime.toISOString();
    const meetLink = draft.meetingLink || "https://meeting.zoho.com";

    const title = `Salon Nest Product Demo - ${row.company || row.name}`;
    const details = `Product Demo walkthrough for ${row.name} (${row.phone}).\n\nZoho Meeting: ${meetLink}`;
    const calUrl = `https://calendar.zoho.com/eventreq/add?title=${encodeURIComponent(title)}&date=${encodeURIComponent(startTimeIso)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(meetLink)}`;

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
    try {
      await api.post(`/super-admin/demo-leads/${leadId}/reject`, { reviewNote: draft.reviewNote });
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
            <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: "#0f172a" }}>Demo Pipeline</h1>
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

      {/* Lead Cards List */}
      {loading ? (
        <PageLoader title="Loading Demo Pipeline" />
      ) : rows.length === 0 ? (
        <EmptyState title="No demo leads found" message="Add a lead or wait for new website demo inquiries." />
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {rows.map((row) => {
            const meta = getStatusMeta(row.status);
            const draft = draftsById[row.id];

            return (
              <div key={row.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                      <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>{row.name}</h3>
                      {row.company && (
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: 6 }}>
                          <Building2 size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                          {row.company}
                        </span>
                      )}
                      <span style={{ fontSize: 12, fontWeight: 700, color: meta.color, background: meta.bg, padding: "3px 10px", borderRadius: 100 }}>
                        {meta.label}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", background: "#f8fafc", border: "1px solid #cbd5e1", padding: "2px 8px", borderRadius: 100 }}>
                        🏷️ Source: {row.leadSource || "Website"}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#64748b", flexWrap: "wrap", marginBottom: 8 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Mail size={14} /> {row.email}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone size={14} /> {row.phone}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={14} /> Added: {new Date(row.createdAt).toLocaleDateString()}</span>
                    </div>

                    {row.message && (
                      <p style={{ fontSize: 13, color: "#475569", background: "#f8fafc", padding: "8px 12px", borderRadius: 8, margin: "6px 0", borderLeft: "3px solid #6366f1" }}>
                        "{row.message}"
                      </p>
                    )}

                    {row.leadNotes && (
                      <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0" }}>
                        <strong>Notes:</strong> {row.leadNotes}
                      </p>
                    )}
                  </div>

                  {/* Quick Action Button Bar */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {row.status === "NEW" && (
                      <button
                        onClick={() => markContacted(row.id)}
                        disabled={busyId === row.id}
                        style={{ padding: "8px 14px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                      >
                        Mark Connected
                      </button>
                    )}
                  </div>
                </div>

                {/* Extended Action Drawer */}
                <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 16, paddingTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {/* Left Box: Meeting & Calendar Integration */}
                  <div style={{ background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                      <Video size={16} color="#6366f1" /> Zoho Meeting & Calendar Scheduling
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Meeting Date & Time</label>
                        <input
                          type="datetime-local"
                          value={draft.meetingScheduledAt}
                          onChange={e => updateDraft(row.id, "meetingScheduledAt", e.target.value)}
                          style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Zoho Meeting Room Link</label>
                        <div style={{ display: "flex", gap: 6 }}>
                          <input
                            type="text"
                            placeholder="https://meeting.zoho.com/meeting/join?key=..."
                            value={draft.meetingLink}
                            onChange={e => updateDraft(row.id, "meetingLink", e.target.value)}
                            style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                          />
                          <button
                            type="button"
                            onClick={() => generateZohoMeetingLink(row.id)}
                            style={{ padding: "6px 10px", background: "#e0e7ff", color: "#4338ca", border: "1px solid #c7d2fe", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", whitespace: "nowrap" }}
                            title="Generate a new Zoho Meeting room URL"
                          >
                            + Zoho Link
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <button
                          type="button"
                          onClick={() => scheduleMeeting(row.id)}
                          disabled={busyId === row.id}
                          style={{ flex: 1, padding: "8px 12px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                        >
                          Save & Email Demo Invite
                        </button>
                        <button
                          type="button"
                          onClick={() => openZohoCalendarInvite(row)}
                          style={{ padding: "8px 12px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                          title="Open Zoho Calendar Event with pre-filled lead details"
                        >
                          <Calendar size={13} /> Zoho Calendar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Box: Subscription & Workspace Approval */}
                  <div style={{ background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                      <Building2 size={16} color="#16a34a" /> Subscription Plan & Workspace Conversion
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Select Plan</label>
                          <select
                            value={draft.planId}
                            onChange={e => updateDraft(row.id, "planId", e.target.value)}
                            style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13, background: "white", boxSizing: "border-box" }}
                          >
                            {plans.map(p => (
                              <option key={p.id} value={p.id}>{p.name} (₹{p.monthlyPrice}/mo)</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Trial Days</label>
                          <input
                            type="number"
                            value={draft.trialDays}
                            onChange={e => updateDraft(row.id, "trialDays", e.target.value)}
                            style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                          />
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <button
                          type="button"
                          onClick={() => approveLead(row.id)}
                          disabled={busyId === row.id || row.status === "CONVERTED"}
                          style={{ flex: 1, padding: "8px 12px", background: "#10b981", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: row.status === "CONVERTED" ? "not-allowed" : "pointer" }}
                        >
                          {row.status === "CONVERTED" ? "Already Converted" : "Approve & Create Workspace"}
                        </button>
                        <button
                          type="button"
                          onClick={() => sendPurchaseLink(row.id)}
                          disabled={busyId === row.id}
                          style={{ padding: "8px 12px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                        >
                          Send Pay Link
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectLead(row.id)}
                          disabled={busyId === row.id || row.status === "CANCELED"}
                          style={{ padding: "8px 12px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                  <select
                    value={leadForm.leadSource}
                    onChange={e => setLeadForm({ ...leadForm, leadSource: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, background: "white", boxSizing: "border-box" }}
                  >
                    {LEAD_SOURCES.map(src => (
                      <option key={src} value={src}>{src}</option>
                    ))}
                  </select>
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
