import { useCallback, useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../../api/client";
import { useBranch } from "../../context/BranchContext";
import EmptyState from "../../components/EmptyState";
import IndianPhoneInput from "../../components/IndianPhoneInput";
import ModuleTabs from "../../components/ModuleTabs";
import { formatApiError } from "../../utils/apiError";
import PageLoader from "../../components/PageLoader";
import CustomSelect from "../../components/CustomSelect";
import {
  Users, UserPlus, Phone, Mail, FileText, AlertCircle, CheckCircle2, 
  BarChart3, RefreshCw, Filter, CalendarClock, MessageSquare, Plus,
  Calendar, Edit3, Trash2, X, Download, Upload, ChevronDown, Search,
  Clock, ArrowRight
} from "lucide-react";

// Mapping between UI Status and DB Status
// 4 Statuses: New, Follow up, Converted, Dropped
const mapStatusToDb = (uiStatus) => {
  switch (uiStatus) {
    case "New": return "NEW";
    case "Follow up": return "INTERESTED";
    case "Converted": return "CONVERTED";
    case "Dropped": return "LOST";
    default: return "NEW";
  }
};

const mapStatusToUi = (dbStatus) => {
  switch (dbStatus) {
    case "NEW": return "New";
    case "INTERESTED":
    case "CONTACTED": return "Follow up";
    case "CONVERTED": return "Converted";
    case "LOST": return "Dropped";
    default: return dbStatus || "New";
  }
};

// Lead Sources: Walk in, Online, Referal, Others
const LEAD_SOURCES = [
  { value: "WALK_IN", label: "Walk in" },
  { value: "ONLINE", label: "Online" },
  { value: "REFERRAL", label: "Referal" },
  { value: "OTHERS", label: "Others" }
];

const mapSourceToUi = (source) => {
  switch (source) {
    case "WALK_IN": return "Walk in";
    case "ONLINE":
    case "WEBSITE": return "Online";
    case "REFERRAL": return "Referal";
    case "OTHERS":
    default: return "Others";
  }
};

const mapSourceToDb = (uiSource) => {
  switch (uiSource) {
    case "Walk in": return "WALK_IN";
    case "Online": return "ONLINE";
    case "Referal": return "REFERRAL";
    case "Others":
    default: return "OTHERS";
  }
};

// UI Status list: strictly New, Follow up, Converted, Dropped
const STATUS_OPTIONS = ["New", "Follow up", "Converted", "Dropped"];

const PRIORITY_OPTIONS = ["Low", "Medium", "High"];

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  source: "Walk in",
  interestedServiceId: "",
  followUpAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // default tomorrow
  notes: "",
  priority: "Medium",
  status: "New"
};

export default function EnquiriesPage() {
  const location = useLocation();
  const { selectedBranchId } = useBranch();
  const [rows, setRows] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [report, setReport] = useState(null);
  const [services, setServices] = useState([]);
  const [branches, setBranches] = useState([]);
  
  // Search & Date Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSource, setFilterSource] = useState("");
  
  // Form and Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [loading, setLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [importing, setImporting] = useState(false);

  // Status/Detail modal for quick status update
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionNotes, setActionNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const mode = location.pathname.includes("/follow-ups")
    ? "followUps"
    : location.pathname.includes("/reports")
      ? "reports"
      : "enquiries";

  // Load dropdown options (Services & Branches)
  const loadOptions = useCallback(async () => {
    try {
      const params = selectedBranchId ? { branchId: selectedBranchId } : {};
      const [servicesRes, branchesRes] = await Promise.all([
        api.get("/owner/services", { params }).catch(() => ({ data: [] })),
        api.get("/owner/branches").catch(() => ({ data: [] }))
      ]);
      setServices(servicesRes.data || []);
      setBranches(branchesRes.data || []);
    } catch (e) {
      console.error("Failed to load options", e);
    }
  }, [selectedBranchId]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedBranchId) params.branchId = selectedBranchId;
      const [listResponse, reportResponse, followUpResponse] = await Promise.all([
        api.get("/owner/enquiries", { params }),
        api.get("/owner/enquiries/reports", { params }),
        api.get("/owner/enquiries/follow-ups", { params }).catch(() => ({ data: [] }))
      ]);
      
      setRows(listResponse.data || []);
      setReport(reportResponse.data || null);
      setFollowUps(followUpResponse.data || []);
      setLoading(false);
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not load enquiries module"), success: "" });
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    void loadOptions();
    void load();
  }, [load, loadOptions, selectedBranchId]);

  // Open modal for Create
  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      followUpAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    });
    setShowModal(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (enquiry) => {
    setEditingId(enquiry.id);
    setForm({
      name: enquiry.name || "",
      phone: enquiry.phone || "",
      email: enquiry.email || "",
      source: mapSourceToUi(enquiry.source),
      interestedServiceId: enquiry.interestedServiceId || "",
      followUpAt: enquiry.followUpAt ? new Date(enquiry.followUpAt).toISOString().slice(0, 10) : "",
      notes: enquiry.notes || "",
      priority: enquiry.priority ? (enquiry.priority.charAt(0).toUpperCase() + enquiry.priority.slice(1).toLowerCase()) : "Medium",
      status: mapStatusToUi(enquiry.status)
    });
    setShowModal(true);
  };

  // Handle Save (Create or Edit)
  const save = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setStatus({ error: "Customer Name is mandatory (*)", success: "" });
      return;
    }
    if (!form.phone.trim()) {
      setStatus({ error: "Mobile Number is mandatory (*)", success: "" });
      return;
    }
    if (!form.followUpAt) {
      setStatus({ error: "Follow Up Date is mandatory (*)", success: "" });
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email?.trim() || null,
        source: mapSourceToDb(form.source),
        interestedServiceId: form.interestedServiceId || null,
        interestedBranchId: selectedBranchId || (branches.length > 0 ? branches[0].id : null),
        priority: form.priority.toUpperCase(),
        followUpAt: new Date(form.followUpAt).toISOString(),
        notes: form.notes?.trim() || null
      };

      if (editingId) {
        await api.patch(`/owner/enquiries/${editingId}`, payload);
        if (form.status) {
          await api.patch(`/owner/enquiries/${editingId}/status`, {
            status: mapStatusToDb(form.status),
            note: `Updated via edit modal to ${form.status}`
          }).catch(() => {});
        }
        setStatus({ error: "", success: `Enquiry for "${form.name}" updated successfully.` });
      } else {
        const res = await api.post("/owner/enquiries", payload);
        const newId = res.data?.id;
        if (newId && form.status && form.status !== "New") {
          await api.patch(`/owner/enquiries/${newId}/status`, {
            status: mapStatusToDb(form.status),
            note: `Initial status set to ${form.status}`
          }).catch(() => {});
        }
        setStatus({ error: "", success: `Enquiry created and customer synced automatically for "${form.name}".` });
      }

      setForm(emptyForm);
      setShowModal(false);
      setEditingId(null);
      setTimeout(() => setStatus({ error: "", success: "" }), 3500);
      await load();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not save enquiry"), success: "" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Update Status
  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEnquiry || !newStatus) return;
    try {
      await api.patch(`/owner/enquiries/${selectedEnquiry.id}/status`, {
        status: mapStatusToDb(newStatus),
        note: actionNotes || `Status updated to ${newStatus}`
      });
      setShowActionModal(false);
      setActionNotes("");
      setSelectedEnquiry(null);
      setStatus({ error: "", success: "Enquiry status updated successfully." });
      setTimeout(() => setStatus({ error: "", success: "" }), 3000);
      await load();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Failed to update status"), success: "" });
    }
  };

  // Filter local rows based on Search (Name or Mobile No) and Dates
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      // Search by Name or Mobile No
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (row.name || "").toLowerCase().includes(q);
        const phoneMatch = (row.phone || "").includes(q);
        if (!nameMatch && !phoneMatch) return false;
      }

      if (filterStatus && mapStatusToUi(row.status) !== filterStatus) {
        return false;
      }

      if (filterSource && mapSourceToUi(row.source) !== filterSource) {
        return false;
      }

      // Date from/to search
      const createdAt = new Date(row.createdAt);
      if (filterFromDate) {
        const from = new Date(filterFromDate);
        from.setHours(0, 0, 0, 0);
        if (createdAt < from) return false;
      }
      if (filterToDate) {
        const to = new Date(filterToDate);
        to.setHours(23, 59, 59, 999);
        if (createdAt > to) return false;
      }
      return true;
    });
  }, [rows, searchQuery, filterStatus, filterSource, filterFromDate, filterToDate]);

  const getPriorityColor = (p) => {
    switch (String(p).toUpperCase()) {
      case "HIGH": return { bg: "#fee2e2", text: "#991b1b" };
      case "MEDIUM": return { bg: "#fef3c7", text: "#92400e" };
      case "LOW": return { bg: "#dbeafe", text: "#1e40af" };
      default: return { bg: "#f1f5f9", text: "#475569" };
    }
  };

  const getStatusColor = (s) => {
    const ui = mapStatusToUi(s);
    switch (ui) {
      case 'New': return { bg: '#dbeafe', text: '#1e40af' };
      case 'Follow up': return { bg: '#fef3c7', text: '#b45309' };
      case 'Converted': return { bg: '#dcfce7', text: '#15803d' };
      case 'Dropped': return { bg: '#fee2e2', text: '#b91c1c' };
      default: return { bg: '#f1f5f9', text: '#475569' };
    }
  };

  const formatFollowUpBadge = (dateStr) => {
    if (!dateStr) return <span style={{ color: "#94a3b8" }}>—</span>;
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(d);
    target.setHours(0, 0, 0, 0);

    const isPast = target < today;
    const isToday = target.getTime() === today.getTime();

    const formatted = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    if (isToday) {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: 6, fontWeight: 700, fontSize: "0.75rem" }}>
          <Clock size={12} /> Today: {formatted}
        </span>
      );
    }
    if (isPast) {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#fee2e2", color: "#dc2626", padding: "2px 8px", borderRadius: 6, fontWeight: 700, fontSize: "0.75rem" }}>
          <AlertCircle size={12} /> Overdue: {formatted}
        </span>
      );
    }
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#334155", fontWeight: 600, fontSize: "0.8rem" }}>
        <Calendar size={13} style={{ color: "#6366f1" }} /> {formatted}
      </span>
    );
  };

  useEffect(() => {
    if (!showExportMenu) return;
    const close = () => setShowExportMenu(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showExportMenu]);

  const downloadTestData = () => {
    setShowExportMenu(false);
    const headers = "NAME (Mandatory),PHONE (Mandatory),EMAIL (Optional),LEAD_SOURCE (Walk in/Online/Referal/Others),SERVICE_INTERESTED (Optional),PRIORITY (Low/Medium/High),STATUS (New/Follow up/Converted/Dropped),FOLLOW_UP_DATE (Mandatory: YYYY-MM-DD),NOTES (Optional)\n";
    const sampleRows = [
      "Pooja Sharma,9876543210,pooja@example.com,Walk in,Hair Spa,High,New,2026-10-01,Interested in bridal package",
      "Rahul Verma,9812345678,rahul@example.com,Online,Beard Styling,Medium,Follow up,2026-10-05,Requested price quote",
      "Ananya Roy,9898765432,,Referal,Facial Glow,High,Follow up,2026-10-03,Friend referred by existing member",
      "Vikas Kapoor,9765432109,,Others,Haircut,Low,New,2026-10-02,General walk-in query"
    ].join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + sampleRows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "Enquiry_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    setShowExportMenu(false);
    const headers = "Date,Customer Name,Mobile,Email,Lead Source,Service Interested,Follow Up Date,Priority,Status,Notes\n";
    const exportRows = filteredRows && filteredRows.length > 0 ? filteredRows : rows;
    const csvRows = exportRows.map((e) => [
      `"${e.createdAt ? new Date(e.createdAt).toLocaleDateString() : ""}"`,
      `"${(e.name || "").replace(/"/g, '""')}"`,
      `"${(e.phone || "").replace(/"/g, '""')}"`,
      `"${(e.email || "").replace(/"/g, '""')}"`,
      `"${mapSourceToUi(e.source)}"`,
      `"${(e.interestedService?.name || "").replace(/"/g, '""')}"`,
      `"${e.followUpAt ? new Date(e.followUpAt).toLocaleDateString() : ""}"`,
      `"${(e.priority || "").replace(/"/g, '""')}"`,
      `"${mapStatusToUi(e.status)}"`,
      `"${(e.notes || "").replace(/"/g, '""')}"`
    ].join(",")).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + csvRows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `Enquiries_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImporting(true);
      setStatus({ error: "", success: "Importing enquiries..." });
      try {
        const text = await file.text();
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          setStatus({ error: "CSV file has no data rows.", success: "" });
          return;
        }
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ""));
        const nameIdx = headers.findIndex(h => h.includes("name"));
        const phoneIdx = headers.findIndex(h => h.includes("phone") || h.includes("mobile"));
        const emailIdx = headers.findIndex(h => h.includes("email"));
        const sourceIdx = headers.findIndex(h => h.includes("source"));
        const svcIdx = headers.findIndex(h => h.includes("service"));
        const prioIdx = headers.findIndex(h => h.includes("priority"));
        const statIdx = headers.findIndex(h => h.includes("status"));
        const followIdx = headers.findIndex(h => h.includes("follow"));
        const notesIdx = headers.findIndex(h => h.includes("note"));

        let successCount = 0;
        let errorCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const rawCols = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(",");
          const cols = rawCols.map(c => c.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
          const name = nameIdx !== -1 ? cols[nameIdx] : "";
          const phone = phoneIdx !== -1 ? cols[phoneIdx] : "";
          if (!name || !phone) {
            errorCount++;
            continue;
          }
          const email = emailIdx !== -1 ? cols[emailIdx] || null : null;
          const rawSource = sourceIdx !== -1 ? cols[sourceIdx] : "Walk in";
          const svcName = svcIdx !== -1 ? cols[svcIdx] : "";
          const matchedService = svcName ? services.find(s => s.name?.toLowerCase() === svcName.toLowerCase()) : null;
          const priority = (prioIdx !== -1 ? cols[prioIdx] : "MEDIUM")?.toUpperCase() || "MEDIUM";
          const uiStat = statIdx !== -1 ? cols[statIdx] : "New";
          const followUpAt = followIdx !== -1 && cols[followIdx] ? new Date(cols[followIdx]).toISOString() : new Date().toISOString();
          const notes = notesIdx !== -1 ? cols[notesIdx] : null;

          try {
            const res = await api.post("/owner/enquiries", {
              name,
              phone,
              email: email || undefined,
              source: mapSourceToDb(rawSource),
              interestedServiceId: matchedService?.id || (services[0]?.id || null),
              interestedBranchId: selectedBranchId || (branches[0]?.id || null),
              priority: ["LOW", "MEDIUM", "HIGH"].includes(priority) ? priority : "MEDIUM",
              followUpAt,
              notes
            });
            if (res.data?.id && uiStat && uiStat !== "New") {
              await api.patch(`/owner/enquiries/${res.data.id}/status`, {
                status: mapStatusToDb(uiStat),
                note: `Imported status: ${uiStat}`
              }).catch(() => {});
            }
            successCount++;
          } catch {
            errorCount++;
          }
        }
        setStatus({
          success: `Import completed: ${successCount} enquiries imported and customers synced (${errorCount} errors).`,
          error: ""
        });
        await load();
      } catch (err) {
        setStatus({ error: formatApiError(err, "Failed to import enquiries"), success: "" });
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  return (
    <div className="page-shell" style={{ paddingBottom: 60 }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .anim-fade { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .delay-1 { animation-delay: 0.1s; }
        
        .eq-card { background: white; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04); }
        
        .eq-input { width: 100%; height: 40px; padding: 0 14px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; color: #0f172a; outline: none; transition: all 0.15s ease; background: #fff; box-sizing: border-box; }
        .eq-input:focus { border-color: #4f46e5; box-shadow: 0 0 0 1px #4f46e5; }
        .eq-label { display: flex; flex-direction: row; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
        
        .eq-btn { height: 38px; padding: 0 16px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.15s ease; border: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px; box-sizing: border-box; }
        .eq-btn-primary { background: #4f46e5; color: #ffffff; border: 1px solid #4f46e5; }
        .eq-btn-primary:hover { background: #4338ca; }
        
        .eq-btn-secondary { background: #ffffff; border: 1px solid #e2e8f0; color: #475569; }
        .eq-btn-secondary:hover { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }

        .status-pill { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }

        .enquiries-table { width: 100%; border-collapse: separate; border-spacing: 0; }
        .enquiries-table th { background: #f8fafc; padding: 14px 18px; font-weight: 700; font-size: 12px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; text-align: left; letter-spacing: 0.5px; }
        .enquiries-table td { padding: 14px 18px; border-bottom: 1px solid #f1f5f9; font-size: 13.5px; color: #334155; vertical-align: middle; }
        
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1200; backdrop-filter: blur(4px); }
        .modal-content { background: white; border-radius: 16px; width: 95%; max-width: 680px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); animation: modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both; }
        
        .filter-bar { background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 14px 18px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 20px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04); }
        .filter-group { display: flex; align-items: center; gap: 8px; }
        .filter-group label { font-size: 12px; font-weight: 600; color: #64748b; white-space: nowrap; }
        
        .eq-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .eq-reports-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

        .empty-records-container { border: 2px dashed #e2e8f0; border-radius: 12px; padding: 50px 20px; text-align: center; color: #64748b; font-weight: 600; font-size: 16px; background: #fafafa; }

        @media (max-width: 768px) {
          .filter-bar {
            flex-direction: column !important;
            align-items: stretch !important;
            padding: 12px !important;
            gap: 10px !important;
          }
          .eq-form-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .modal-content {
            padding: 18px 14px !important;
            max-height: 90vh !important;
            overflow-y: auto !important;
          }
        }
      `}</style>

      <ModuleTabs
        title="Enquiries"
        items={[
          { label: "Enquiries", to: "/admin/enquiries" },
          { label: "Follow-Ups", to: "/admin/enquiries/follow-ups" },
          { label: "Reports", to: "/admin/enquiries/reports" }
        ]}
      />

      {status.error && <div className="anim-fade" style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 18px", borderRadius: 10, marginBottom: 16, fontWeight: 500, display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem" }}><AlertCircle size={18} /> {status.error}</div>}
      {status.success && <div className="anim-fade" style={{ background: "#dcfce7", color: "#166534", padding: "12px 18px", borderRadius: 10, marginBottom: 16, fontWeight: 500, display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem" }}><CheckCircle2 size={18} /> {status.success}</div>}

      {mode === "enquiries" && (
        <div className="anim-fade">
          {/* ── SEARCH & FILTER BAR ── */}
          <div className="filter-bar">
            {/* Search by Name or Mobile No */}
            <div style={{ position: "relative", flex: "1 1 240px", minWidth: 200 }}>
              <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input 
                type="text" 
                className="eq-input" 
                placeholder="Search by Name or Mobile No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>

            {/* Status Filter */}
            <div style={{ minWidth: 140 }}>
              <CustomSelect 
                className="eq-input" 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </CustomSelect>
            </div>

            {/* Source Filter */}
            <div style={{ minWidth: 130 }}>
              <CustomSelect 
                className="eq-input" 
                value={filterSource} 
                onChange={(e) => setFilterSource(e.target.value)}
              >
                <option value="">All Sources</option>
                {LEAD_SOURCES.map(s => <option key={s.value} value={s.label}>{s.label}</option>)}
              </CustomSelect>
            </div>
            
            {/* Date Filters */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>From:</label>
              <input 
                type="date" 
                className="eq-input" 
                style={{ width: 135 }}
                value={filterFromDate}
                onChange={(e) => setFilterFromDate(e.target.value)}
                max={filterToDate || undefined}
              />
              <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>To:</label>
              <input 
                type="date" 
                className="eq-input" 
                style={{ width: 135 }}
                value={filterToDate}
                onChange={(e) => setFilterToDate(e.target.value)}
                min={filterFromDate || undefined}
              />
              {(searchQuery || filterStatus || filterSource || filterFromDate || filterToDate) && (
                <button 
                  className="eq-btn eq-btn-secondary" 
                  style={{ width: "38px", height: "38px", padding: 0, flexShrink: 0 }} 
                  title="Reset Filters"
                  onClick={() => { setSearchQuery(""); setFilterStatus(""); setFilterSource(""); setFilterFromDate(""); setFilterToDate(""); }}
                >
                  <RefreshCw size={14} />
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              <button
                type="button"
                className="eq-btn eq-btn-secondary"
                onClick={handleImportClick}
                disabled={importing}
                style={{ height: 38, fontSize: "0.8rem", padding: "0 12px" }}
              >
                <Upload size={14} /> {importing ? "Importing..." : "Import"}
              </button>
              
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  className="eq-btn eq-btn-secondary"
                  onClick={(e) => { e.stopPropagation(); setShowExportMenu((v) => !v); }}
                  style={{ height: 38, fontSize: "0.8rem", padding: "0 12px" }}
                >
                  <Download size={14} /> Export <ChevronDown size={13} />
                </button>
                {showExportMenu && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: 165, zIndex: 9999, overflow: "hidden" }}
                  >
                    <button
                      type="button"
                      onClick={handleExport}
                      style={{ width: "100%", textAlign: "left", padding: "8px 14px", border: "none", background: "transparent", cursor: "pointer", fontSize: "0.8rem", color: "#334155", fontWeight: 500, display: "block" }}
                    >
                      Export Enquiries (CSV)
                    </button>
                    <div style={{ height: 1, background: "#e2e8f0" }} />
                    <button
                      type="button"
                      onClick={downloadTestData}
                      style={{ width: "100%", textAlign: "left", padding: "8px 14px", border: "none", background: "transparent", cursor: "pointer", fontSize: "0.8rem", color: "#4f46e5", fontWeight: 700, display: "block" }}
                    >
                      Download Template CSV
                    </button>
                  </div>
                )}
              </div>

              <button 
                type="button"
                className="eq-btn eq-btn-primary" 
                onClick={handleOpenAdd}
                style={{ height: 38, fontSize: "0.82rem", padding: "0 16px", boxShadow: "0 2px 6px rgba(79, 70, 229, 0.25)" }}
              >
                <Plus size={15} /> Add Enquiry
              </button>
            </div>
          </div>

          {/* ── ENQUIRIES TABLE ── */}
          {loading ? (
            <PageLoader compact title="Loading enquiries pipeline..." />
          ) : filteredRows.length === 0 ? (
            <div className="empty-records-container">
              No Enquiries Found
              <div style={{ fontSize: "0.8rem", fontWeight: 400, color: "#94a3b8", marginTop: 4 }}>
                {searchQuery || filterStatus || filterSource || filterFromDate || filterToDate ? "Try changing your search filters." : "Click '+ Add Enquiry' to capture your first customer enquiry."}
              </div>
            </div>
          ) : (
            <div className="eq-card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table className="enquiries-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Customer Name</th>
                      <th>Mobile No.</th>
                      <th>Lead Source</th>
                      <th>Service Interested</th>
                      <th>Follow Up Date</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr key={row.id}>
                        <td style={{ color: "#64748b", fontSize: "0.8rem" }}>
                          {new Date(row.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td>
                          <strong style={{ color: "#0f172a" }}>{row.name}</strong>
                          {row.notes && <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: 2 }}>{row.notes}</div>}
                        </td>
                        <td style={{ fontWeight: 600, color: "#0f172a" }}>{row.phone}</td>
                        <td>
                          <span style={{ background: "#f1f5f9", color: "#334155", padding: "2px 8px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700 }}>
                            {mapSourceToUi(row.source)}
                          </span>
                        </td>
                        <td style={{ color: "#475569" }}>{row.interestedService?.name || "General Inquiry"}</td>
                        <td>
                          {formatFollowUpBadge(row.followUpAt)}
                        </td>
                        <td>
                          <span style={{ 
                            padding: "2px 8px", 
                            borderRadius: "6px", 
                            fontSize: "0.75rem", 
                            fontWeight: "700",
                            background: getPriorityColor(row.priority).bg,
                            color: getPriorityColor(row.priority).text
                          }}>
                            {row.priority}
                          </span>
                        </td>
                        <td>
                          <span className="status-pill" style={{ 
                            background: getStatusColor(row.status).bg, 
                            color: getStatusColor(row.status).text 
                          }}>
                            {mapStatusToUi(row.status)}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            {/* Edit Button */}
                            <button 
                              className="eq-btn eq-btn-secondary" 
                              style={{ padding: "4px 8px", height: "30px", fontSize: "0.75rem", fontWeight: 700 }}
                              onClick={() => handleOpenEdit(row)}
                              title="Edit Enquiry Details"
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                            {/* Status Change Button */}
                            <button 
                              className="eq-btn eq-btn-secondary" 
                              style={{ padding: "4px 8px", height: "30px", fontSize: "0.75rem" }}
                              onClick={() => {
                                setSelectedEnquiry(row);
                                setNewStatus(mapStatusToUi(row.status));
                                setActionNotes("");
                                setShowActionModal(true);
                              }}
                              title="Update Status"
                            >
                              Status
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── REPORTS MODE ── */}
      {mode === "reports" && report && (
        <div className="anim-fade delay-1 eq-reports-grid">
          <div className="eq-card" style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)", color: "white", border: "none" }}>
            <BarChart3 size={30} color="#818cf8" style={{ marginBottom: 14 }} />
            <div style={{ fontSize: 13, textTransform: "uppercase", fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>Total Leads Captured</div>
            <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "monospace" }}>{report.total || 0}</div>
          </div>
          <div className="eq-card" style={{ background: "linear-gradient(135deg, #16a34a, #14532d)", color: "white", border: "none" }}>
            <CheckCircle2 size={30} color="#86efac" style={{ marginBottom: 14 }} />
            <div style={{ fontSize: 13, textTransform: "uppercase", fontWeight: 700, color: "#bbf7d0", marginBottom: 6 }}>Successfully Converted</div>
            <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "monospace" }}>{report.converted || 0}</div>
          </div>
        </div>
      )}

      {/* ── FOLLOW-UPS MODE ── */}
      {mode === "followUps" && (
        <div className="eq-card anim-fade delay-1" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: 20, borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
            <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}><CalendarClock size={18} color="#f59e0b" /> Scheduled Follow-Ups</h3>
          </div>
          <div>
            {loading ? <PageLoader compact title="Loading Follow-ups..." /> : followUps.map((row) => (
              <div key={row.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                <div>
                  <strong style={{ fontSize: 14, color: "#0f172a", display: "block", marginBottom: 2 }}>{row.enquiry?.name || "Enquiry Follow-Up"}</strong>
                  <div style={{ fontSize: 12.5, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}><Phone size={12} /> {row.enquiry?.phone || "No phone"}</div>
                  <div style={{ fontSize: 12.5, color: "#94a3b8", marginTop: 2 }}>{row.note || "Follow-up recorded"}</div>
                </div>
                <div>
                  {formatFollowUpBadge(row.dueAt || row.createdAt)}
                </div>
              </div>
            ))}
            {!loading && !followUps.length && <div style={{ padding: 36 }}><EmptyState title="No follow-ups scheduled" message="Scheduled follow-up reminders will appear here." /></div>}
          </div>
        </div>
      )}

      {/* ── ADD / EDIT ENQUIRY MODAL ── */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#1e293b" }}>
                {editingId ? "Edit Enquiry" : "Add Enquiry"}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={20} /></button>
            </div>
            
            <form onSubmit={save}>
              <div className="eq-form-grid">
                
                {/* 1. Name * (Mandatory) */}
                <div>
                  <label className="eq-label">
                    <span>Name</span> <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    className="eq-input" 
                    required
                    placeholder="Enter Customer Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                {/* 2. Mobile No * (Mandatory) */}
                <div>
                  <label className="eq-label">
                    <span>Mobile No.</span> <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <IndianPhoneInput
                    value={form.phone}
                    onChange={(val) => setForm({ ...form, phone: val })}
                    className="eq-input"
                    required
                    inputStyle={{ padding: "0 12px", height: "100%", width: "100%" }}
                  />
                </div>

                {/* 3. Follow Up Date * (Mandatory) */}
                <div>
                  <label className="eq-label">
                    <span>Follow Up Date</span> <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input 
                    type="date" 
                    className="eq-input"
                    required
                    value={form.followUpAt}
                    onChange={(e) => setForm({ ...form, followUpAt: e.target.value })}
                  />
                </div>

                {/* 4. Lead Source * (Walk in, Online, Referal, Others) */}
                <div>
                  <label className="eq-label">
                    <span>Lead Source</span> <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <CustomSelect 
                    className="eq-input"
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                  >
                    {LEAD_SOURCES.map(s => (
                      <option key={s.value} value={s.label}>{s.label}</option>
                    ))}
                  </CustomSelect>
                </div>

                {/* 5. Enquiry Status (New, Follow up, Converted, Dropped) */}
                <div>
                  <label className="eq-label">Enquiry Status</label>
                  <CustomSelect 
                    className="eq-input"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </CustomSelect>
                </div>

                {/* Service Interested (Optional) */}
                <div>
                  <label className="eq-label">Service Interested</label>
                  <CustomSelect 
                    className="eq-input"
                    value={form.interestedServiceId}
                    onChange={(e) => setForm({ ...form, interestedServiceId: e.target.value })}
                  >
                    <option value="">Select Service (Optional)</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </CustomSelect>
                </div>

                {/* Priority */}
                <div>
                  <label className="eq-label">Priority</label>
                  <CustomSelect 
                    className="eq-input"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    {PRIORITY_OPTIONS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </CustomSelect>
                </div>

                {/* Email (Optional) */}
                <div>
                  <label className="eq-label">Email Address</label>
                  <input 
                    type="email" 
                    className="eq-input" 
                    placeholder="Optional email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                {/* Description / Notes */}
                <div style={{ gridColumn: "span 2" }}>
                  <label className="eq-label">Description / Requirement Notes</label>
                  <textarea 
                    className="eq-input"
                    rows={2}
                    placeholder="Specific requests, customer inquiries, budget, or preferred timings..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    style={{ height: 60, padding: 8 }}
                  />
                </div>

              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                <button type="button" className="eq-btn eq-btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                <button type="submit" className="eq-btn eq-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : (editingId ? "Save Changes" : "Create Enquiry")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── UPDATE STATUS MODAL ── */}
      {showActionModal && selectedEnquiry && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "460px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>Update Enquiry Status</h2>
              <button onClick={() => setShowActionModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleUpdateStatusSubmit}>
              <div style={{ display: "grid", gap: "14px", marginBottom: "18px" }}>
                <div>
                  <label className="eq-label">Customer Name</label>
                  <input type="text" className="eq-input" disabled value={selectedEnquiry.name} style={{ background: "#f8fafc" }} />
                </div>
                <div>
                  <label className="eq-label">Status</label>
                  <CustomSelect 
                    className="eq-input" 
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </CustomSelect>
                </div>
                <div>
                  <label className="eq-label">Notes / Follow-up Summary</label>
                  <textarea 
                    className="eq-input"
                    rows={3}
                    placeholder="Enter details about follow-up call, client response..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    style={{ height: 60, padding: 8 }}
                  />
                </div>
              </div>
              
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                <button type="button" className="eq-btn eq-btn-secondary" onClick={() => setShowActionModal(false)}>Cancel</button>
                <button type="submit" className="eq-btn eq-btn-primary">Update Status</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
