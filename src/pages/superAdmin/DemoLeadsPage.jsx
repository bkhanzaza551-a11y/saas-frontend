import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import CustomSelect from "../../components/CustomSelect";
import CustomDateInput from "../../components/CustomDateInput";
import CustomDateTimeInput from "../../components/CustomDateTimeInput";
import { CheckCircle, XCircle, X, Clock, Mail, Phone, Calendar, Building2, RotateCcw, Plus, Video, ArrowRight, Activity, Eye, Search, Filter, Loader2, Edit2, Check, AlertTriangle, Trash2 } from "lucide-react";

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
  { value: "OTHER", label: "Other" }
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

const renderActivityDetails = (log) => {
  if (!log.details || log.details === "null") return null;

  // Try parsing JSON details (e.g. Demo Scheduled meeting info)
  if (typeof log.details === "string" && (log.details.startsWith("{") || log.details.startsWith("["))) {
    try {
      const data = JSON.parse(log.details);
      if (data && typeof data === "object") {
        if (data.meetingScheduledAt || data.meetingLink) {
          return (
            <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4, background: "#ffffff", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
              {data.meetingScheduledAt && (
                <div style={{ fontSize: 12, color: "#334155", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>📅</span> <strong>Date & Time:</strong> {new Date(data.meetingScheduledAt).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
              {data.meetingLink && (
                <div style={{ fontSize: 12, color: "#334155", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>🔗</span> <strong>Meeting Link:</strong> <a href={data.meetingLink} target="_blank" rel="noreferrer" style={{ color: "#4f46e5", fontWeight: 700, textDecoration: "underline", wordBreak: "break-all" }}>{data.meetingLink}</a>
                </div>
              )}
              {data.note && (
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  <strong>Note:</strong> {data.note}
                </div>
              )}
            </div>
          );
        }

        return (
          <div style={{ marginTop: 4, fontSize: 12, color: "#475569" }}>
            {Object.entries(data).map(([k, v]) => v ? <div key={k}><strong>{k}:</strong> {String(v)}</div> : null)}
          </div>
        );
      }
    } catch {
      // Fallback to text
    }
  }

  return (
    <div style={{ fontSize: 12, color: "#475569", marginTop: 2, lineHeight: 1.4 }}>
      {log.details}
    </div>
  );
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
  const [leadModalTab, setLeadModalTab] = useState("overview");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [leadForm, setLeadForm] = useState(emptyLeadForm);
  const [addingLead, setAddingLead] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState(null);

  // Inline Email Editing State for Lead Details Modal
  const [editingEmail, setEditingEmail] = useState(false);
  const [inlineEmailInput, setInlineEmailInput] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  // Multiple Follow-up Form State
  const [followUpForm, setFollowUpForm] = useState({ dueAt: "", note: "" });
  const [addingFollowUp, setAddingFollowUp] = useState(false);

  const saveLeadEmail = async (leadId, newEmail) => {
    setSavingEmail(true);
    setFeedback({ error: "", success: "" });
    try {
      const res = await api.put(`/super-admin/demo-leads/${leadId}`, { email: newEmail?.trim() || null });
      setRows(prev => prev.map(r => r.id === leadId ? { ...r, email: res.data.email } : r));
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(prev => ({ ...prev, email: res.data.email }));
      }
      setEditingEmail(false);
      setFeedback({ error: "", success: "Lead email updated successfully!" });
    } catch (err) {
      setFeedback({ error: formatApiError(err, "Failed to update email"), success: "" });
    } finally {
      setSavingEmail(false);
    }
  };

  const closeDetailModal = () => {
    setSelectedLead(null);
    setLeadModalTab("overview");
    setEditingEmail(false);
    setInlineEmailInput("");
  };

  const openLeadById = async (id) => {
    let lead = rows.find((r) => r.id === id);
    if (!lead) {
      await load(filters);
      lead = rows.find((r) => r.id === id);
    }
    if (lead) {
      setSelectedLead(lead);
      setLeadModalTab("overview");
      setEditingEmail(false);
      setInlineEmailInput(lead.email || "");
    }
  };

  const load = async (nextFilters = filters) => {
    setLoading(true);
    try {
      const [leadResult, planResult, staffResult] = await Promise.allSettled([
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

      if (leadResult.status === "fulfilled") {
        const freshLeads = leadResult.value.data || [];
        setRows(freshLeads);
        setSelectedLead(prev => {
          if (!prev) return null;
          return freshLeads.find(r => r.id === prev.id) || prev;
        });
      } else {
        setFeedback({ error: formatApiError(leadResult.reason, "Could not load leads."), success: "" });
      }

      if (planResult.status === "fulfilled") {
        setPlans(planResult.value.data || []);
      }
      if (staffResult.status === "fulfilled") {
        setStaff(staffResult.value?.data?.users || staffResult.value?.data || []);
      }
    } catch (error) {
      setFeedback({ error: formatApiError(error, "Could not load leads."), success: "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filters);
  }, [filters]);

const toLocalIsoDateTime = (dt) => {
  if (!dt) return "";
  try {
    const d = new Date(dt);
    if (isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
};

  const draftsById = useMemo(() => {
    const map = {};
    for (const row of rows) {
      const defaultPlan = plans.find(p => p.id === (row.planId || drafts[row.id]?.planId)) || plans[0];
      const planTrial = defaultPlan ? (defaultPlan.trialDays !== undefined ? defaultPlan.trialDays : 14) : 14;
      map[row.id] = drafts[row.id] || {
        ...emptyDraft,
        salonName: row.salon?.name || `${row.name.split(" ")[0] || row.name} Salon`,
        planId: defaultPlan?.id || "",
        isTrial: true,
        trialDays: planTrial,
        hasDiscount: false,
        discountType: "flat",
        discountValue: 0,
        meetingScheduledAt: toLocalIsoDateTime(row.meetingScheduledAt),
        meetingLink: row.meetingLink || "",
        assignedUserId: row.assignedUserId || "",
        nextFollowUpAt: toLocalIsoDateTime(row.nextFollowUpAt),
        city: row.city || "Mumbai",
        billingCycle: "yearly"
      };
    }
    return map;
  }, [rows, drafts, plans]);

  const calculatePlanPrice = (planId, hasDiscount, discountType, discountValue) => {
    const selectedPlan = plans.find(p => p.id === planId) || plans[0];
    const basePrice = Number(selectedPlan?.yearlyPrice || (Number(selectedPlan?.monthlyPrice || 0) * 10) || 0);
    let discountAmount = 0;
    if (hasDiscount && Number(discountValue) > 0) {
      if (discountType === "percent") {
        const pct = Math.min(100, Math.max(0, Number(discountValue) || 0));
        discountAmount = Math.round((basePrice * pct) / 100);
      } else {
        discountAmount = Math.min(basePrice, Math.max(0, Number(discountValue) || 0));
      }
    }
    const grandTotal = Math.max(0, basePrice - discountAmount);
    return { basePrice, discountAmount, grandTotal, selectedPlan };
  };

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
    if (!leadForm.name.trim() || !leadForm.phone.trim() || !leadForm.company.trim()) return;

    const phoneDigits = leadForm.phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      setFeedback({ error: "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).", success: "" });
      return;
    }

    setAddingLead(true);
    setDuplicateInfo(null);
    setFeedback({ error: "", success: "" });
    try {
      await api.post("/super-admin/demo-leads", {
        ...leadForm,
        email: leadForm.email.trim() || undefined,
        phone: `+91${phoneDigits}`
      });
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

  const generateMeetLink = async (leadId) => {
    setBusyId(leadId);
    setActionType("generate-link");
    setFeedback({ error: "", success: "" });
    try {
      const draft = draftsById[leadId] || {};
      const res = await api.post(`/super-admin/demo-leads/${leadId}/create-zoho-meeting`, {
        meetingScheduledAt: draft.meetingScheduledAt || null
      });
      if (res.data?.meetingUrl) {
        updateDraft(leadId, "meetingLink", res.data.meetingUrl);
        setFeedback({ error: "", success: "Meeting link generated successfully!" });
      }
    } catch (err) {
      const randStr = (len = 3) => Math.random().toString(36).substring(2, 2 + len);
      const fallbackUrl = `https://meet.google.com/${randStr(3)}-${randStr(4)}-${randStr(3)}`;
      updateDraft(leadId, "meetingLink", fallbackUrl);
      setFeedback({ error: "", success: "Meeting link created!" });
    } finally {
      setBusyId("");
      setActionType("");
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

  const addFollowUp = async (leadId) => {
    if (!followUpForm.dueAt) {
      setFeedback({ error: "Please select follow-up date and time.", success: "" });
      return;
    }
    setAddingFollowUp(true);
    setFeedback({ error: "", success: "" });
    try {
      await api.post(`/super-admin/demo-leads/${leadId}/follow-ups`, {
        dueAt: followUpForm.dueAt,
        note: followUpForm.note || ""
      });
      setFeedback({ error: "", success: "New follow-up scheduled successfully!" });
      setFollowUpForm({ dueAt: "", note: "" });
      await load();
    } catch (err) {
      setFeedback({ error: formatApiError(err, "Failed to schedule follow-up"), success: "" });
    } finally {
      setAddingFollowUp(false);
    }
  };

  const completeSingleFollowUp = async (leadId, followUpId) => {
    setBusyId(`fu-${followUpId}`);
    try {
      await api.patch(`/super-admin/demo-leads/${leadId}/follow-ups/${followUpId}`, {
        status: "COMPLETED"
      });
      setFeedback({ error: "", success: "Follow-up marked as completed!" });
      await load();
    } catch (err) {
      setFeedback({ error: formatApiError(err, "Failed to complete follow-up"), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const deleteSingleFollowUp = async (leadId, followUpId) => {
    setBusyId(`fu-del-${followUpId}`);
    try {
      await api.delete(`/super-admin/demo-leads/${leadId}/follow-ups/${followUpId}`);
      setFeedback({ error: "", success: "Follow-up deleted." });
      await load();
    } catch (err) {
      setFeedback({ error: formatApiError(err, "Failed to delete follow-up"), success: "" });
    } finally {
      setBusyId("");
    }
  };

  const saveLeadNotesOnly = async (leadId) => {
    setBusyId(leadId);
    setActionType("save-notes");
    setFeedback({ error: "", success: "" });
    const draft = draftsById[leadId] || {};
    try {
      await api.put(`/super-admin/demo-leads/${leadId}`, {
        leadNotes: draft.leadNotes || ""
      });
      setFeedback({ error: "", success: "Internal notes saved successfully." });
      await load();
    } catch (err) {
      setFeedback({ error: formatApiError(err, "Failed to save notes"), success: "" });
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
    const lead = rows.find(r => r.id === leadId) || selectedLead;
    if (!lead?.email || !lead.email.trim()) {
      setFeedback({ error: "Email put karo pehle! Demo schedule karne ke liye email address zaroori hai.", success: "" });
      setBusyId("");
      setActionType("");
      return;
    }
    const draft = draftsById[leadId] || {};
    let meetingLink = (draft.meetingLink || "").trim();
    if (!meetingLink) {
      const randStr = (len = 3) => Math.random().toString(36).substring(2, 2 + len);
      meetingLink = `https://meet.google.com/${randStr(3)}-${randStr(4)}-${randStr(3)}`;
      updateDraft(leadId, "meetingLink", meetingLink);
    }
    const meetingScheduledAt = draft.meetingScheduledAt || new Date().toISOString();
    try {
      const res = await api.post(`/super-admin/demo-leads/${leadId}/schedule-meeting`, {
        meetingScheduledAt,
        meetingLink,
        note: draft.leadNotes || ""
      });
      setFeedback({ error: "", success: res.data?.message || "Demo meeting scheduled and invitation sent successfully!" });
      await load();
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(prev => ({
          ...prev,
          status: "DEMO_SCHEDULED",
          meetingScheduledAt,
          meetingLink,
          activityLogs: [
            ...(prev.activityLogs || []),
            {
              id: `temp-${Date.now()}`,
              action: "DEMO_SCHEDULED",
              actorName: "Super Admin",
              createdAt: new Date().toISOString(),
              details: JSON.stringify({ meetingScheduledAt, meetingLink, note: draft.leadNotes || "" })
            }
          ]
        }));
      }
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
    const lead = rows.find(r => r.id === leadId) || selectedLead;
    if (!lead?.email || !lead.email.trim()) {
      setFeedback({ error: "Email put karo pehle! Payment link send karne ke liye email address zaroori hai.", success: "" });
      setBusyId("");
      setActionType("");
      return;
    }
    const draft = draftsById[leadId];
    if (!draft.planId) {
      setFeedback({ error: "Please select a subscription plan before sending the purchase link.", success: "" });
      setBusyId("");
      setActionType("");
      return;
    }
    const { grandTotal } = calculatePlanPrice(draft.planId, draft.hasDiscount, draft.discountType, draft.discountValue);
    try {
      await api.post(`/super-admin/demo-leads/${leadId}/send-purchase-link`, {
        planId: draft.planId,
        discountType: draft.hasDiscount ? draft.discountType : undefined,
        discountValue: draft.hasDiscount ? Number(draft.discountValue) : undefined,
        finalPrice: grandTotal
      });
      setFeedback({ error: "", success: `Purchase link (₹${grandTotal.toLocaleString("en-IN")}) sent to customer email!` });
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
    const { grandTotal } = calculatePlanPrice(draft.planId, draft.hasDiscount, draft.discountType, draft.discountValue);
    try {
      const response = await api.post(`/super-admin/demo-leads/${leadId}/approve`, {
        ...draft,
        isTrial: draft.isTrial !== false,
        trialDays: draft.isTrial !== false ? (Number(draft.trialDays) || 14) : 0,
        discountType: draft.hasDiscount ? draft.discountType : null,
        discountValue: draft.hasDiscount ? Number(draft.discountValue) : 0,
        finalPrice: grandTotal
      });
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

  const reactivateLead = async (leadId) => {
    setBusyId(leadId);
    setActionType("reactivate");
    setFeedback({ error: "", success: "" });
    try {
      await api.post(`/super-admin/demo-leads/${leadId}/reactivate`);
      setFeedback({ error: "", success: "Lead reactivated successfully! Status reset to New." });
      await load();
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(prev => ({ ...prev, status: "NEW", lostReason: null, lostNotes: null }));
      }
    } catch (error) {
      setFeedback({ error: formatApiError(error, "Could not reactivate lead."), success: "" });
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
      <style>{`
        .crm-pipeline-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .crm-filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
        }
        .crm-date-range-row {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 6px;
          align-items: center;
        }
        .crm-date-range-row input[type="date"] {
          width: 100% !important;
          min-width: 0 !important;
        }
        .crm-overview-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .crm-overview-meta-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr;
          gap: 14px;
        }
        .crm-modal-grid-3col {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
        }
        .crm-modal-grid-2col {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 12px;
        }
        .crm-add-modal-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .crm-modal-tabs {
          display: flex;
          gap: 4px;
          padding: 0 24px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          white-space: nowrap;
        }
        .crm-modal-tabs button {
          flex-shrink: 0;
          white-space: nowrap;
        }
        .crm-table-container {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow-x: auto;
          overflow-y: hidden;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          -webkit-overflow-scrolling: touch;
        }
        .crm-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 820px;
          white-space: nowrap;
        }
        @media (max-width: 1024px) {
          .crm-pipeline-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 10px !important;
          }
          .crm-overview-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
          .crm-overview-meta-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
        }
        @media (max-width: 640px) {
          .crm-pipeline-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }
          .crm-filter-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .crm-overview-grid,
          .crm-modal-grid-3col,
          .crm-modal-grid-2col,
          .crm-add-modal-2col {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .crm-modal-tabs {
            padding: 0 12px !important;
          }
          .crm-modal-card {
            width: 96% !important;
            margin: 0 auto !important;
            max-height: 94vh !important;
          }
          .crm-modal-body {
            padding: 16px 14px !important;
          }
        }
      `}</style>

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
      <div className="crm-pipeline-grid">
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
            <div className="search-input-wrapper" style={{ flex: 1, minWidth: "260px", position: "relative" }}>
              <div className="search-icon" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex", pointerEvents: "none", zIndex: 2 }}>
                <Search size={18} />
              </div>
              <input
                className="search-input-field"
                data-search="true"
                value={filters.q}
                placeholder="Search leads by salon name, contact person, phone, email, lead ID..."
                onChange={(e) => setFilterParam("q", e.target.value)}
                style={{ width: "100%", height: 44, paddingLeft: 48, paddingRight: 14, borderRadius: 12, border: "1px solid #cbd5e1", fontSize: "0.92rem", color: "#1e293b", outline: "none", boxSizing: "border-box", transition: "all 0.2s", background: "#f8fafc" }}
                onFocus={e => { e.target.style.background = "#fff"; e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.08)"; }}
                onBlur={e => { e.target.style.background = "#f8fafc"; e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            <button 
              onClick={() => setFilterParams({ q: "", status: "", assigned: "", source: "", from: "", to: "", followUp: "" })} 
              style={{ height: 42, padding: "0 18px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s", whiteSpace: "nowrap" }}
              onMouseOver={e => { e.currentTarget.style.background="#fee2e2"; e.currentTarget.style.borderColor="#fca5a5"; e.currentTarget.style.color="#dc2626"; }}
              onMouseOut={e => { e.currentTarget.style.background="#f8fafc"; e.currentTarget.style.borderColor="#e2e8f0"; e.currentTarget.style.color="#64748b"; }}
            >
              <Filter size={15} />
              Clear Filters
            </button>
          </div>

          {/* Bottom Row: Detailed Dropdown Filters */}
          <div className="crm-filter-grid">
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Salesperson</label>
              <CustomSelect
                value={filters.assigned}
                onChange={(e) => setFilterParam("assigned", e.target.value)}
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
                onChange={(e) => setFilterParam("source", e.target.value)}
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
                onChange={(e) => setFilterParam("followUp", e.target.value)}
                style={{ width: "100%" }}
              >
                <option value="">All</option>
                <option value="today">Today</option>
                <option value="upcoming">Upcoming</option>
                <option value="overdue">Overdue</option>
                <option value="completed">Completed</option>
              </CustomSelect>
            </div>
            
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Date Range</label>
              <div className="crm-date-range-row" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <CustomDateInput
                  value={filters.from}
                  onChange={(e) => setFilterParam("from", e.target.value)}
                  placeholder="From date"
                  title="Filter by start date"
                  max={filters.to || undefined}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: "0.85rem", color: "#94a3b8", fontWeight: 700 }}>→</span>
                <CustomDateInput
                  value={filters.to}
                  onChange={(e) => setFilterParam("to", e.target.value)}
                  placeholder="To date"
                  title="Filter by end date"
                  min={filters.from || undefined}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback.error && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 10000, display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", color: "#991b1b", fontSize: 14, fontWeight: 600 }}>
          <XCircle size={20} /> {feedback.error}
          <span onClick={() => setFeedback({ error: "", success: "" })} style={{ marginLeft: "12px", cursor: "pointer", color: "#dc2626", fontWeight: 700, padding: 4 }}>x</span>
        </div>
      )}
      {feedback.success && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 10000, display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 12, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", color: "#065f46", fontSize: 14, fontWeight: 600 }}>
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
        <div className="crm-table-container">
          <table className="crm-table">
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
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                        {row.status === "CANCELED" && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); reactivateLead(row.id); }}
                            title="Reactivate this lost lead"
                            disabled={busyId === row.id && actionType === "reactivate"}
                            style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 11px", background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}
                          >
                            <RotateCcw size={11} /> Reactivate
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedLead(row)}
                          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "linear-gradient(135deg, #4f46e5, #6366f1)", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 6px rgba(79,70,229,0.25)" }}
                        >
                          View Details <ArrowRight size={12} />
                        </button>
                      </div>
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
        const row = rows.find(r => r.id === selectedLead.id) || selectedLead;
        const meta = getStatusMeta(row.status);
        const draft = draftsById[row.id] || {};
        const isBusy = busyId === row.id;
        const isConverted = row.status === "CONVERTED";
        const pendingFollowUps = (row.followUps || []).filter(f => f.status === "PENDING");
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16, backdropFilter: "blur(4px)" }} onClick={closeDetailModal}>
            <div className="crm-modal-card" style={{ background: "white", width: "100%", maxWidth: 780, borderRadius: 20, boxShadow: "0 24px 60px rgba(0,0,0,0.2)", maxHeight: "92vh", overflowY: "auto", animation: "slideInRight 0.25s ease" }} onClick={e => e.stopPropagation()}>
              {/* Modal Header */}
              <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>{row.name}</h2>
                    <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, background: meta.bg, padding: "3px 10px", borderRadius: 100 }}>{meta.label}</span>
                    {row.leadSource && <span style={{ fontSize: 11, color: "#64748b", background: "#f1f5f9", padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>🏷️ {row.leadSource}</span>}
                  </div>
                  {row.company && <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{row.company}</div>}
                </div>
                <button onClick={closeDetailModal} style={{ background: "#f1f5f9", border: "none", cursor: "pointer", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 18, flexShrink: 0 }}>✕</button>
              </div>

              {/* Module Tabs Navigation */}
              <div className="crm-modal-tabs no-scrollbar">
                {[
                  { id: "overview", label: "Overview", icon: Building2 },
                  { id: "demo", label: "Schedule Demo", icon: Video },
                  { id: "convert", label: "Convert to Salon", icon: CheckCircle },
                  { id: "followups", label: "Follow-Ups & Notes", icon: Calendar, count: pendingFollowUps.length },
                  { id: "activity", label: "Activity", icon: Activity, count: (row.activityLogs || []).length }
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = leadModalTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setLeadModalTab(tab.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "12px 14px",
                        background: "none",
                        border: "none",
                        borderBottom: isActive ? "3px solid #4f46e5" : "3px solid transparent",
                        color: isActive ? "#4f46e5" : "#64748b",
                        fontWeight: isActive ? 800 : 600,
                        fontSize: 12,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: "all 0.15s"
                      }}
                    >
                      <Icon size={14} />
                      <span>{tab.label}</span>
                      {tab.count !== undefined && tab.count > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10, background: isActive ? "#e0e7ff" : "#e2e8f0", color: isActive ? "#4338ca" : "#475569" }}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="crm-modal-body" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

                {/* TAB 1: OVERVIEW */}
                {leadModalTab === "overview" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {isConverted && (
                      <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10, padding: "10px 14px", color: "#065f46", fontSize: 13, fontWeight: 600 }}>
                        ✓ This lead has been converted to a salon. Conversion actions are read-only.
                      </div>
                    )}

                    {row.status === "CANCELED" && (
                      <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <AlertTriangle size={18} />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "#991b1b" }}>This lead is currently marked as LOST</div>
                            <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 2 }}>
                              Reason: <strong>{row.lostReason || "Lost / Canceled"}</strong>{row.lostNotes ? ` — ${row.lostNotes}` : ""}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => reactivateLead(row.id)}
                          disabled={isBusy}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 16px",
                            background: "linear-gradient(135deg, #10b981, #059669)",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: isBusy ? "not-allowed" : "pointer",
                            boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)"
                          }}
                        >
                          {isBusy && actionType === "reactivate" ? (
                            <>
                              <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Reactivating...
                            </>
                          ) : (
                            <>
                              <RotateCcw size={13} /> Reactivate Lead
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Section 1: Contact Information (2 Columns) */}
                    <div className="crm-overview-grid" style={{ marginBottom: 14 }}>
                      {/* 1. Email Box with Modern Inline Editor */}
                      <div style={{ background: "#ffffff", borderRadius: 12, padding: "16px 18px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email Address</span>
                          {!isConverted && !editingEmail && (
                            <button
                              type="button"
                              onClick={() => { setEditingEmail(true); setInlineEmailInput(row.email || ""); }}
                              style={{
                                background: "#f1f5f9",
                                border: "1px solid #cbd5e1",
                                color: "#4f46e5",
                                borderRadius: 7,
                                padding: "4px 9px",
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                transition: "all 0.15s ease"
                              }}
                              title="Edit Email"
                              onMouseOver={e => { e.currentTarget.style.background = "#e0e7ff"; e.currentTarget.style.color = "#4338ca"; e.currentTarget.style.borderColor = "#c7d2fe"; }}
                              onMouseOut={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#4f46e5"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
                            >
                              <Edit2 size={11} /> {row.email ? "Edit" : "+ Add"}
                            </button>
                          )}
                        </div>

                        {editingEmail ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                            <input
                              type="email"
                              autoFocus
                              placeholder="e.g. contact@salon.com"
                              value={inlineEmailInput}
                              onChange={e => setInlineEmailInput(e.target.value)}
                              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #4f46e5", fontSize: 13, outline: "none", background: "#fff", boxSizing: "border-box", color: "#0f172a", fontWeight: 600 }}
                              onKeyDown={e => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  saveLeadEmail(row.id, inlineEmailInput);
                                } else if (e.key === "Escape") {
                                  setEditingEmail(false);
                                }
                              }}
                            />
                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                              <button
                                type="button"
                                onClick={() => setEditingEmail(false)}
                                style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={savingEmail}
                                onClick={() => saveLeadEmail(row.id, inlineEmailInput)}
                                style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 7, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, boxShadow: "0 2px 4px rgba(16, 185, 129, 0.25)" }}
                              >
                                {savingEmail ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={12} />} Save Email
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: 14, color: row.email ? "#0f172a" : "#94a3b8", fontWeight: 700, display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: "#eef2ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Mail size={15} />
                            </div>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {row.email || <span style={{ fontStyle: "italic", fontSize: 12, fontWeight: 500 }}>No email provided</span>}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 2. Phone Box */}
                      <div style={{ background: "#ffffff", borderRadius: 12, padding: "16px 18px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Phone Number</div>
                        <div style={{ fontSize: 14, color: "#0f172a", fontWeight: 700, display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Phone size={15} />
                          </div>
                          <span>{row.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Meta Details (3 Columns) */}
                    <div className="crm-overview-meta-grid" style={{ marginBottom: 14 }}>
                      {/* 3. Lead Owner / Assigned To */}
                      <div style={{ background: "#ffffff", borderRadius: 12, padding: "14px 16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Assigned Sales Rep</div>
                        <CustomSelect
                          disabled={isConverted}
                          value={draft.assignedUserId}
                          onChange={e => {
                            updateDraft(row.id, "assignedUserId", e.target.value);
                            api.put(`/super-admin/demo-leads/${row.id}`, { assignedUserId: e.target.value }).catch(console.error);
                          }}
                          style={{ width: "100%", height: 36, fontSize: "0.82rem" }}
                        >
                          <option value="">Unassigned</option>
                          {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </CustomSelect>
                      </div>

                      {/* 4. Lead Source */}
                      <div style={{ background: "#ffffff", borderRadius: 12, padding: "14px 16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Lead Source</div>
                        <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, height: 36 }}>
                          <span style={{ background: "#f1f5f9", padding: "4px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                            🏷️ {row.leadSource || "Direct Website"}
                          </span>
                        </div>
                      </div>

                      {/* 5. Added On */}
                      <div style={{ background: "#ffffff", borderRadius: 12, padding: "14px 16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Date Added</div>
                        <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, height: 36 }}>
                          <Clock size={14} color="#6366f1" style={{ flexShrink: 0 }} />
                          <span>{new Date(row.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Inquiry Message */}
                    {row.message && (
                      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "16px 18px", marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Client Inquiry Message</div>
                        <p style={{ margin: 0, fontSize: 13, color: "#78350f", lineHeight: 1.6, fontWeight: 500 }}>"{row.message}"</p>
                      </div>
                    )}

                    {/* Section 4: Quick Action Bar */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, paddingTop: 6 }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setLeadModalTab("demo")}
                          style={{ padding: "8px 14px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                          onMouseOver={e => e.currentTarget.style.background = "#eef2ff"}
                          onMouseOut={e => e.currentTarget.style.background = "#f8fafc"}
                        >
                          <Video size={13} color="#4f46e5" /> Schedule Demo
                        </button>
                        <button
                          type="button"
                          onClick={() => setLeadModalTab("followups")}
                          style={{ padding: "8px 14px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                          onMouseOver={e => e.currentTarget.style.background = "#eef2ff"}
                          onMouseOut={e => e.currentTarget.style.background = "#f8fafc"}
                        >
                          <Calendar size={13} color="#6366f1" /> Follow-Ups & Notes
                        </button>
                      </div>

                      {!isConverted && row.status === "NEW" && (
                        <button
                          onClick={() => { markContacted(row.id); }}
                          disabled={isBusy}
                          style={{
                            padding: "9px 18px",
                            background: isBusy && actionType === "mark-contacted" ? "#7c3aed" : "linear-gradient(135deg, #8b5cf6, #6366f1)",
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: isBusy ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            boxShadow: "0 2px 6px rgba(139, 92, 246, 0.3)"
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
                    </div>
                  </div>
                )}

                {/* TAB 2: SCHEDULE DEMO */}
                {leadModalTab === "demo" && (
                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 16 }}>
                    {(!row.email || !row.email.trim()) && (
                      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#b91c1c", fontSize: 13, fontWeight: 700 }}>
                          <AlertTriangle size={16} /> Email Required for Demo Scheduling
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: "#7f1d1d", lineHeight: 1.4 }}>
                          Demo invite link send karne ke liye is lead ka email address zaroori hai. Please pehle yahan email put karein:
                        </p>
                        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                          <input
                            type="email"
                            placeholder="Enter client email (e.g. rahul@salon.com)..."
                            value={inlineEmailInput}
                            onChange={e => setInlineEmailInput(e.target.value)}
                            style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #fca5a5", fontSize: 13, background: "#fff" }}
                            onKeyDown={e => {
                              if (e.key === "Enter" && inlineEmailInput.trim()) {
                                e.preventDefault();
                                saveLeadEmail(row.id, inlineEmailInput);
                              }
                            }}
                          />
                          <button
                            type="button"
                            disabled={savingEmail || !inlineEmailInput.trim()}
                            onClick={() => saveLeadEmail(row.id, inlineEmailInput)}
                            style={{ padding: "8px 16px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: !inlineEmailInput.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 5 }}
                          >
                            {savingEmail ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : "Save Email"}
                          </button>
                        </div>
                      </div>
                    )}
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                      <Video size={16} color="#6366f1" /> Schedule Product Demo
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Meeting Date & Time</label>
                      <CustomDateTimeInput
                        disabled={isConverted}
                        value={draft.meetingScheduledAt}
                        onChange={e => updateDraft(row.id, "meetingScheduledAt", e.target.value)}
                        placeholder="Select meeting date & time..."
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Meeting Link</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input disabled={isConverted} type="text" placeholder="https://meet.google.com/..." value={draft.meetingLink} onChange={e => updateDraft(row.id, "meetingLink", e.target.value)} style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }} />
                        <button
                          type="button"
                          disabled={isConverted || (isBusy && actionType === "generate-link")}
                          onClick={() => generateMeetLink(row.id)}
                          style={{
                            padding: "8px 14px",
                            background: "#e0e7ff",
                            color: "#4338ca",
                            border: "1px solid #c7d2fe",
                            borderRadius: 8,
                            fontSize: 12,
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
                              <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Generating...
                            </>
                          ) : (
                            "+ Link"
                          )}
                        </button>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={() => scheduleMeeting(row.id)}
                        disabled={isBusy || isConverted}
                        style={{
                          flex: 1,
                          minWidth: 160,
                          padding: "11px 16px",
                          background: isBusy && actionType === "save-demo" ? "#d97706" : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 13,
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
                            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                            <span>Sending Invite...</span>
                          </>
                        ) : (
                          "Send & Email Invite"
                        )}
                      </button>
                    </div>

                    {/* Scheduled Demo Meetings History */}
                    {(() => {
                      const scheduledList = (row.activityLogs || [])
                        .filter(l => l.action === "DEMO_SCHEDULED")
                        .map(l => {
                          let parsed = {};
                          try { parsed = JSON.parse(l.details || "{}"); } catch { parsed = { note: l.details }; }
                          return { ...l, ...parsed };
                        })
                        .reverse();

                      if (scheduledList.length === 0) return null;

                      return (
                        <div style={{ marginTop: 8, borderTop: "1px solid #e2e8f0", paddingTop: 14 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                            <Clock size={14} color="#f59e0b" /> Scheduled Demo Meetings History ({scheduledList.length})
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {scheduledList.map((m, idx) => (
                              <div key={m.id || idx} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                                    <span>📅 {m.meetingScheduledAt ? new Date(m.meetingScheduledAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : "Time not set"}</span>
                                    {idx === 0 && <span style={{ fontSize: 10, fontWeight: 700, color: "#047857", background: "#d1fae5", padding: "1px 6px", borderRadius: 6 }}>Latest</span>}
                                  </div>
                                  {m.note && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Note: {m.note}</div>}
                                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Scheduled by {m.actorName || "Admin"} • {new Date(m.createdAt).toLocaleDateString()}</div>
                                </div>
                                {m.meetingLink && (
                                  <a
                                    href={m.meetingLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      padding: "6px 12px",
                                      background: "#4f46e5",
                                      color: "#ffffff",
                                      borderRadius: 6,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      textDecoration: "none"
                                    }}
                                  >
                                    Join Meet <ArrowRight size={11} />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* TAB 3: CONVERT TO SALON */}
                {leadModalTab === "convert" && (() => {
                  const { basePrice, discountAmount, grandTotal, selectedPlan } = calculatePlanPrice(
                    draft.planId,
                    draft.hasDiscount,
                    draft.discountType,
                    draft.discountValue
                  );
                  const isTrialActive = draft.isTrial !== false;

                  return (
                    <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 16 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                        <Building2 size={16} color="#16a34a" /> Convert to Salon & Onboard
                      </div>

                      {/* Row 1: Plan Selection & Duration */}
                      <div className="crm-modal-grid-2col">
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Select Plan (Annual / Yearly)</label>
                          <CustomSelect 
                            disabled={isConverted} 
                            value={draft.planId} 
                            onChange={e => {
                              const newPlanId = e.target.value;
                              const selectedPlan = plans.find(p => p.id === newPlanId);
                              const planTrial = selectedPlan ? (selectedPlan.trialDays !== undefined ? selectedPlan.trialDays : 14) : 14;
                              setDrafts(prev => ({
                                ...prev,
                                [row.id]: {
                                  ...(draftsById[row.id] || {}),
                                  planId: newPlanId,
                                  trialDays: planTrial,
                                  billingCycle: "yearly"
                                }
                              }));
                            }} 
                            options={plans.map(p => {
                              const priceVal = p.yearlyPrice || (Number(p.monthlyPrice || 0) * 10);
                              const priceText = `₹${Number(priceVal).toLocaleString("en-IN")}/year`;
                              const trialText = p.trialDays !== undefined ? `${p.trialDays}d trial` : "14d trial";
                              return {
                                label: `${p.name} — ${priceText} (${trialText})`,
                                value: p.id
                              };
                            })} 
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Plan Duration</label>
                          <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8, padding: "9px 12px", fontSize: 13, fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                            <span>📅 1 Year (Annual Subscription)</span>
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Trial Toggle Card */}
                      <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                            <span>Trial Period</span>
                            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 100, fontWeight: 750, background: isTrialActive ? "#dcfce7" : "#f1f5f9", color: isTrialActive ? "#15803d" : "#64748b" }}>
                              {isTrialActive ? `ON (${draft.trialDays || 14} Days Free Trial)` : "OFF (Full 1-Year Active Plan)"}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                            {isTrialActive ? "Lead will start in Trial mode with temporary free access." : "No trial — Assign direct full active 1-year annual subscription."}
                          </div>
                        </div>
                        <div
                          onClick={() => {
                            if (isConverted) return;
                            updateDraft(row.id, "isTrial", !isTrialActive);
                          }}
                          style={{
                            width: 44,
                            height: 24,
                            borderRadius: 100,
                            background: isTrialActive ? "#10b981" : "#cbd5e1",
                            position: "relative",
                            cursor: isConverted ? "not-allowed" : "pointer",
                            transition: "all 0.2s"
                          }}
                        >
                          <div style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: "white",
                            position: "absolute",
                            top: 3,
                            left: isTrialActive ? 23 : 3,
                            transition: "all 0.2s",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                          }} />
                        </div>
                      </div>

                      {/* If Trial is ON, show Trial Days input */}
                      {isTrialActive && (
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Trial Days</label>
                          <input 
                            disabled={isConverted} 
                            type="number" 
                            min={1} 
                            max={90} 
                            placeholder="e.g. 14"
                            value={draft.trialDays || ""} 
                            onChange={e => updateDraft(row.id, "trialDays", Number(e.target.value))} 
                            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }} 
                          />
                        </div>
                      )}

                      {/* Row 3: Discount Toggle Card */}
                      <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                            <span>Special Discount</span>
                            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 100, fontWeight: 750, background: draft.hasDiscount ? "#e0e7ff" : "#f1f5f9", color: draft.hasDiscount ? "#4338ca" : "#64748b" }}>
                              {draft.hasDiscount ? "ON" : "OFF"}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                            {draft.hasDiscount ? "Apply custom flat (₹) or percentage (%) discount on this subscription." : "No discount applied."}
                          </div>
                        </div>
                        <div
                          onClick={() => {
                            if (isConverted) return;
                            updateDraft(row.id, "hasDiscount", !draft.hasDiscount);
                          }}
                          style={{
                            width: 44,
                            height: 24,
                            borderRadius: 100,
                            background: draft.hasDiscount ? "#4f46e5" : "#cbd5e1",
                            position: "relative",
                            cursor: isConverted ? "not-allowed" : "pointer",
                            transition: "all 0.2s"
                          }}
                        >
                          <div style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: "white",
                            position: "absolute",
                            top: 3,
                            left: draft.hasDiscount ? 23 : 3,
                            transition: "all 0.2s",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                          }} />
                        </div>
                      </div>

                      {/* If Discount is ON, show Discount Type Selector and Value Input */}
                      {draft.hasDiscount && (
                        <div className="crm-modal-grid-2col">
                          <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Discount Type</label>
                            <CustomSelect
                              disabled={isConverted}
                              value={draft.discountType || "flat"}
                              onChange={e => updateDraft(row.id, "discountType", e.target.value)}
                              options={[
                                { label: "Flat Discount (₹)", value: "flat" },
                                { label: "Percentage Discount (%)", value: "percent" }
                              ]}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>
                              {draft.discountType === "percent" ? "Discount Percentage (%)" : "Discount Amount (₹)"}
                            </label>
                            <input
                              disabled={isConverted}
                              type="number"
                              min={0}
                              max={draft.discountType === "percent" ? 100 : 1000000}
                              placeholder={draft.discountType === "percent" ? "e.g. 10" : "e.g. 2000"}
                              value={draft.discountValue || ""}
                              onChange={e => updateDraft(row.id, "discountValue", Math.max(0, Number(e.target.value)))}
                              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Pricing Summary & Grand Total Display */}
                      <div style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #eef2ff 100%)", borderRadius: 10, padding: "14px 16px", border: "1.5px solid #86efac", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Pricing Summary
                          </div>
                          <div style={{ fontSize: 12, color: "#475569", marginTop: 3, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                            <span>Original Plan: <del>₹{basePrice.toLocaleString("en-IN")}</del></span>
                            {draft.hasDiscount && discountAmount > 0 && (
                              <span style={{ color: "#16a34a", fontWeight: 700, background: "#dcfce7", padding: "1px 6px", borderRadius: 4 }}>
                                Saved: -₹{discountAmount.toLocaleString("en-IN")} {draft.discountType === "percent" ? `(${draft.discountValue}%)` : ""}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#4f46e5", textTransform: "uppercase" }}>Grand Total</div>
                          <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>
                            ₹{grandTotal.toLocaleString("en-IN")} <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>/year</span>
                          </div>
                        </div>
                      </div>

                      {/* Convert Button */}
                      <button
                        type="button"
                        onClick={() => approveLead(row.id)}
                        disabled={isConverted || isBusy}
                        style={{
                          padding: "12px 16px",
                          background: isConverted ? "#d1fae5" : isBusy && actionType === "convert" ? "#059669" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          color: isConverted ? "#065f46" : "#fff",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 13,
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
                            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                            <span>Creating Salon & Sending Login...</span>
                          </>
                        ) : isConverted ? (
                          "✓ Already Converted"
                        ) : isTrialActive ? (
                          "Convert & Create Salon (Trial Mode)"
                        ) : (
                          "Convert & Create Salon (Full 1-Year Plan)"
                        )}
                      </button>

                      {isConverted && row.salon?.id && (
                        <a
                          href={`/super-admin/salons/${row.salon.id}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: "10px 14px",
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
                            padding: "10px 14px",
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
                            `Send Pay Link (₹${grandTotal.toLocaleString("en-IN")})`
                          )}
                        </button>
                      )}

                      {row.status === "CANCELED" && !isConverted && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6, padding: 16, background: "#ecfdf5", borderRadius: 10, border: "1px solid #a7f3d0" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#065f46" }}>
                            This lead is marked as Lost. Reactivate to resume the sales pipeline and enable salon conversion.
                          </div>
                          <button
                            type="button"
                            onClick={() => reactivateLead(row.id)}
                            disabled={isBusy}
                            style={{
                              padding: "10px 16px",
                              background: "linear-gradient(135deg, #10b981, #059669)",
                              color: "#fff",
                              border: "none",
                              borderRadius: 8,
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: isBusy ? "not-allowed" : "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)"
                            }}
                          >
                            {isBusy && actionType === "reactivate" ? (
                              <>
                                <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Reactivating...
                              </>
                            ) : (
                              <>
                                <RotateCcw size={13} /> Reactivate Lead
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {row.status !== "CANCELED" && !isConverted && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6, padding: 14, background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca" }}>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#991b1b", marginBottom: -4 }}>Mark as Lost - Reason</label>
                          <CustomSelect value={draft.lostReason || ""} onChange={e => updateDraft(row.id, "lostReason", e.target.value)} options={[{ label: "Select Reason...", value: "" }, ...LOST_REASONS.map(r => ({ label: r.label, value: r.value }))]} />
                          {(draft.lostReason === "OTHER" || draft.lostReason === "Other") && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              <label style={{ fontSize: 11, fontWeight: 700, color: "#991b1b" }}>Describe Issue / Reason *</label>
                              <textarea
                                rows={2}
                                placeholder="Please describe the issue or reason..."
                                value={draft.lostNotes || ""}
                                onChange={e => updateDraft(row.id, "lostNotes", e.target.value)}
                                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #fca5a5", fontSize: 12, boxSizing: "border-box", background: "#ffffff", resize: "vertical" }}
                              />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => rejectLead(row.id)}
                            disabled={isBusy}
                            style={{
                              padding: "9px 12px",
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
                  );
                })()}

                {/* TAB 4: MULTIPLE FOLLOW-UPS & NOTES */}
                {leadModalTab === "followups" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Header */}
                    <div style={{ background: "#f0f9ff", borderRadius: 12, padding: "14px 18px", border: "1px solid #bae6fd", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0369a1", display: "flex", alignItems: "center", gap: 6 }}>
                        <Calendar size={18} color="#0284c7" /> Follow-Ups Manager & Call Reminders
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#0369a1", background: "#e0f2fe", padding: "3px 10px", borderRadius: 100 }}>
                        {pendingFollowUps.length} Pending
                      </span>
                    </div>

                    {/* Section 1: Schedule New Follow-Up */}
                    <div style={{ background: "#ffffff", borderRadius: 12, padding: 18, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <Plus size={15} color="#4f46e5" /> Schedule a New Follow-Up
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr auto", gap: 12, alignItems: "flex-end" }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Date & Time *</label>
                          <CustomDateTimeInput
                            disabled={isConverted || addingFollowUp}
                            value={followUpForm.dueAt}
                            onChange={e => setFollowUpForm({ ...followUpForm, dueAt: e.target.value })}
                            placeholder="Select due date & time..."
                            style={{ height: 36, fontSize: 12 }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Purpose / Agenda (optional)</label>
                          <input
                            disabled={isConverted || addingFollowUp}
                            type="text"
                            placeholder="e.g. Call back regarding pricing discount..."
                            value={followUpForm.note}
                            onChange={e => setFollowUpForm({ ...followUpForm, note: e.target.value })}
                            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 12, boxSizing: "border-box" }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => addFollowUp(row.id)}
                          disabled={isConverted || addingFollowUp || !followUpForm.dueAt}
                          style={{
                            padding: "9px 16px",
                            background: isConverted || !followUpForm.dueAt ? "#94a3b8" : "linear-gradient(135deg, #0284c7, #0369a1)",
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: isConverted || !followUpForm.dueAt || addingFollowUp ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            whiteSpace: "nowrap"
                          }}
                        >
                          {addingFollowUp ? (
                            <>
                              <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Scheduling...
                            </>
                          ) : (
                            <>
                              <Plus size={13} /> Add Follow-Up
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Section 2: Multiple Follow-ups List */}
                    {(() => {
                      const followUps = row.followUps || [];
                      const pending = followUps.filter(f => f.status === "PENDING");
                      const completed = followUps.filter(f => f.status === "COMPLETED");

                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          {/* Active / Pending List */}
                          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#0369a1", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <Clock size={14} color="#0284c7" /> Active & Upcoming Follow-Ups ({pending.length})
                              </span>
                            </div>

                            {pending.length === 0 ? (
                              <div style={{ padding: "14px", textAlign: "center", background: "#f8fafc", borderRadius: 8, border: "1px dashed #cbd5e1", color: "#64748b", fontSize: 12 }}>
                                No active follow-ups scheduled for this lead. Use the form above to add one!
                              </div>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {pending.map(fu => {
                                  const isOverdue = new Date(fu.dueAt) < new Date();
                                  const isActionBusy = busyId === `fu-${fu.id}` || busyId === `fu-del-${fu.id}`;

                                  return (
                                    <div
                                      key={fu.id}
                                      style={{
                                        background: isOverdue ? "#fff1f2" : "#f0f9ff",
                                        border: `1px solid ${isOverdue ? "#fecdd3" : "#bae6fd"}`,
                                        borderRadius: 8,
                                        padding: "12px 14px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 12,
                                        flexWrap: "wrap"
                                      }}
                                    >
                                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: isOverdue ? "#be123c" : "#0369a1", display: "flex", alignItems: "center", gap: 6 }}>
                                          <span>📅 {new Date(fu.dueAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                                          {isOverdue && (
                                            <span style={{ fontSize: 10, background: "#ffe4e6", color: "#e11d48", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                                              Overdue
                                            </span>
                                          )}
                                        </div>
                                        {fu.note && <div style={{ fontSize: 12, color: "#334155", fontWeight: 500 }}>📝 {fu.note}</div>}
                                        <div style={{ fontSize: 11, color: "#94a3b8" }}>
                                          Scheduled by {fu.createdBy || "Admin"} • {new Date(fu.createdAt).toLocaleDateString()}
                                        </div>
                                      </div>

                                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        <button
                                          type="button"
                                          disabled={isActionBusy || isConverted}
                                          onClick={() => completeSingleFollowUp(row.id, fu.id)}
                                          style={{
                                            padding: "7px 14px",
                                            background: "linear-gradient(135deg, #10b981, #059669)",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: 6,
                                            fontSize: 12,
                                            fontWeight: 700,
                                            cursor: isActionBusy || isConverted ? "not-allowed" : "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 4,
                                            boxShadow: "0 1px 4px rgba(16, 185, 129, 0.2)"
                                          }}
                                        >
                                          {busyId === `fu-${fu.id}` ? (
                                            <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                                          ) : (
                                            <Check size={12} />
                                          )}
                                          Mark Done
                                        </button>
                                        <button
                                          type="button"
                                          disabled={isActionBusy || isConverted}
                                          onClick={() => deleteSingleFollowUp(row.id, fu.id)}
                                          style={{
                                            padding: "7px 10px",
                                            background: "#fee2e2",
                                            color: "#b91c1c",
                                            border: "1px solid #fca5a5",
                                            borderRadius: 6,
                                            fontSize: 12,
                                            cursor: isActionBusy || isConverted ? "not-allowed" : "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                          }}
                                          title="Delete follow-up"
                                        >
                                          {busyId === `fu-del-${fu.id}` ? (
                                            <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                                          ) : (
                                            <Trash2 size={12} />
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Completed Follow-ups History */}
                          {completed.length > 0 && (
                            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "#047857", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                                <CheckCircle size={15} color="#059669" /> Completed Follow-Ups History ({completed.length})
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {completed.map(fu => (
                                  <div
                                    key={fu.id}
                                    style={{
                                      background: "#f8fafc",
                                      border: "1px solid #f1f5f9",
                                      borderRadius: 6,
                                      padding: "8px 12px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      gap: 10
                                    }}
                                  >
                                    <div>
                                      <div style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                                        <span>📅 {new Date(fu.dueAt).toLocaleDateString()}</span> {fu.note && <span>• {fu.note}</span>}
                                      </div>
                                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                                        Completed: {fu.completedAt ? new Date(fu.completedAt).toLocaleString() : "Done"}
                                      </div>
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "#047857", background: "#d1fae5", padding: "3px 8px", borderRadius: 6 }}>
                                      ✓ Completed
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Section 3: General Private Internal Notes */}
                    <div style={{ background: "#ffffff", borderRadius: 12, padding: 18, border: "1px solid #e2e8f0" }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                        General Internal Notes & Comments
                      </label>
                      <textarea
                        disabled={isConverted}
                        value={draft.leadNotes !== undefined ? draft.leadNotes : (row.leadNotes || "")}
                        onChange={e => updateDraft(row.id, "leadNotes", e.target.value)}
                        placeholder="Add private internal notes about conversations with this lead..."
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontSize: 13,
                          color: "#0f172a",
                          background: "#f8fafc",
                          border: "1px solid #cbd5e1",
                          borderRadius: 8,
                          resize: "vertical",
                          minHeight: 80,
                          boxSizing: "border-box"
                        }}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                        <button
                          type="button"
                          onClick={() => saveLeadNotesOnly(row.id)}
                          disabled={isBusy || isConverted}
                          style={{
                            padding: "8px 16px",
                            background: isBusy && actionType === "save-notes" ? "#374151" : "#0f172a",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: isBusy || isConverted ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                        >
                          {isBusy && actionType === "save-notes" ? (
                            <>
                              <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Saving...
                            </>
                          ) : (
                            "Save Notes"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: ACTIVITY TIMELINE */}
                {leadModalTab === "activity" && (
                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Activity size={16} color="#6366f1" /> Activity Timeline
                      </div>
                      <span style={{ fontSize: 11, color: "#64748b", background: "#e2e8f0", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>
                        {(row.activityLogs || []).length} events
                      </span>
                    </div>

                    {(row.activityLogs || []).length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 6 }}>
                        {[...(row.activityLogs || [])].reverse().map((log, idx) => {
                          const am = ACTIVITY_META[log.action] || { label: log.action.replace(/_/g, " "), color: "#64748b", bg: "#f1f5f9" };
                          return (
                            <div key={log.id} style={{ display: "flex", gap: 12, position: "relative", paddingBottom: idx < row.activityLogs.length - 1 ? 16 : 0 }}>
                              <div style={{ width: 28, height: 28, borderRadius: "50%", background: am.bg, color: am.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0, border: `2px solid ${am.color}` }}>
                                {idx === 0 ? "★" : "•"}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{am.label}</div>
                                {renderActivityDetails(log)}
                                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                                  {log.actorName || "System"} • {new Date(log.createdAt).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", padding: "24px 16px", color: "#94a3b8", fontSize: 13 }}>
                        No activity recorded yet for this lead.
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        );
      })()}

      {/* Manual Add Lead Modal */}
      {isAddModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
          <div style={{ background: "white", width: "100%", maxWidth: 540, borderRadius: 20, padding: "28px 32px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>Add New Lead</h2>
              <button
                type="button"
                onClick={() => { setIsAddModalOpen(false); setDuplicateInfo(null); }}
                style={{
                  border: "none",
                  background: "#f1f5f9",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#475569",
                  transition: "all 0.2s"
                }}
                onMouseOver={e => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#0f172a"; }}
                onMouseOut={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#475569"; }}
              >
                <X size={18} />
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

              <div className="crm-add-modal-2col">
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: 6, color: "#475569" }}>Email Address <span style={{ color: "#94a3b8", fontWeight: 500 }}>(Optional)</span></label>
                  <input
                    type="email"
                    placeholder="e.g. rahul@salon.com (optional)"
                    value={leadForm.email}
                    onChange={e => setLeadForm({ ...leadForm, email: e.target.value })}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box", transition: "all 0.2s", outline: "none", background: "#f8fafc", color: "#1e293b" }}
                    onFocus={e => { e.target.style.background = "#fff"; e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)"; }}
                    onBlur={e => { e.target.style.background = "#f8fafc"; e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "none"; }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: 6, color: "#475569" }}>Phone Number (10-Digit) *</label>
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: 10, background: "#f8fafc", overflow: "hidden", transition: "all 0.2s" }}>
                    <div style={{ padding: "0 12px", background: "#f1f5f9", borderRight: "1px solid #cbd5e1", color: "#475569", fontWeight: 700, fontSize: "0.85rem", height: 42, display: "flex", alignItems: "center", userSelect: "none" }}>
                      🇮🇳 +91
                    </div>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9876543210"
                      value={leadForm.phone}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setLeadForm({ ...leadForm, phone: val });
                      }}
                      style={{ width: "100%", height: 42, padding: "0 14px", border: "none", fontSize: "0.9rem", boxSizing: "border-box", outline: "none", background: "transparent", color: "#1e293b" }}
                      onFocus={e => { e.currentTarget.parentElement.style.background = "#fff"; e.currentTarget.parentElement.style.borderColor = "#6366f1"; e.currentTarget.parentElement.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)"; }}
                      onBlur={e => { e.currentTarget.parentElement.style.background = "#f8fafc"; e.currentTarget.parentElement.style.borderColor = "#cbd5e1"; e.currentTarget.parentElement.style.boxShadow = "none"; }}
                    />
                  </div>
                  {leadForm.phone && leadForm.phone.length > 0 && leadForm.phone.length < 10 && (
                    <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#ef4444" }}>Enter {10 - leadForm.phone.length} more digit{10 - leadForm.phone.length > 1 ? "s" : ""}</p>
                  )}
                </div>
              </div>

              <div className="crm-add-modal-2col">
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

              <div className="crm-add-modal-2col">
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
                  <CustomDateTimeInput
                    value={leadForm.nextFollowUpAt}
                    onChange={e => setLeadForm({ ...leadForm, nextFollowUpAt: e.target.value })}
                    placeholder="Select next follow-up date & time..."
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
