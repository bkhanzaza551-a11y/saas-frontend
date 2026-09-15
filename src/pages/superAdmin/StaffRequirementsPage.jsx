import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import CustomSelect from "../../components/CustomSelect";
import { 
  Clock, CheckCircle, AlertCircle, X, ExternalLink, Calendar, 
  Users, Briefcase, Plus, Edit2, Search, Building2, FileText
} from "lucide-react";

// Point 4: Simple Statuses (Open, In Progress, Closed)
const statusConfig = {
  OPEN: { label: "Open", color: "#d97706", bg: "#fef3c7", icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "#2563eb", bg: "#dbeafe", icon: AlertCircle },
  CLOSED: { label: "Closed", color: "#10b981", bg: "#d1fae5", icon: CheckCircle }
};

const priorityColors = {
  LOW: { bg: "#f0fdf4", color: "#166534" },
  MEDIUM: { bg: "#fffbeb", color: "#b45309" },
  HIGH: { bg: "#fff7ed", color: "#c2410c" },
  URGENT: { bg: "#fef2f2", color: "#dc2626" }
};

export default function SuperAdminStaffRequirementsPage() {
  const [requirements, setRequirements] = useState([]);
  const [salons, setSalons] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get("status") || "ALL");
  const [salonFilter, setSalonFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedReq, setSelectedReq] = useState(null);
  const [internalNotesText, setInternalNotesText] = useState("");
  const [handlerInput, setHandlerInput] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setStatus({ error: "", success: "" });
    try {
      const [resReqs, resSalons, resStaff] = await Promise.all([
        api.get("/super-admin/staff-requirements"),
        api.get("/super-admin/salons").catch(() => ({ data: [] })),
        api.get("/super-admin/staff", { params: { onlyActive: 1 } }).catch(() => ({ data: [] }))
      ]);
      setRequirements(resReqs.data || []);
      setSalons(resSalons.data || []);
      setStaffList(resStaff.data || []);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Failed to load staff requests"), success: "" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredStaff = useMemo(() => {
    const query = (handlerInput || "").trim().toLowerCase();
    if (!query) return staffList.slice(0, 10);
    return staffList.filter(s =>
      s.name?.toLowerCase().includes(query) ||
      s.email?.toLowerCase().includes(query) ||
      s.adminRole?.name?.toLowerCase().includes(query)
    ).slice(0, 10);
  }, [staffList, handlerInput]);

  // Point 6: Basic Actions (Update Status & Add Note & Close Request)
  const updateRequirement = async (id, updates) => {
    setUpdatingId(id);
    try {
      await api.patch(`/super-admin/staff-requirements/${id}`, updates);
      setStatus({ error: "", success: "Staff request updated successfully." });
      await load();
      if (selectedReq && selectedReq.id === id) {
        setSelectedReq({ ...selectedReq, ...updates });
      }
    } catch (err) {
      setStatus({ error: formatApiError(err, "Failed to update staff request"), success: "" });
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = useMemo(() => {
    return requirements.filter(r => {
      if (filter !== "ALL" && r.status !== filter) return false;
      if (salonFilter && r.salonId !== salonFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pos = (r.position || r.title || "").toLowerCase();
        const salon = (r.salon?.name || "").toLowerCase();
        const skills = (r.skills || "").toLowerCase();
        if (!pos.includes(q) && !salon.includes(q) && !skills.includes(q)) return false;
      }
      return true;
    });
  }, [requirements, filter, salonFilter, searchQuery]);

  const counts = {
    ALL: requirements.length,
    OPEN: requirements.filter(r => r.status === "OPEN").length,
    IN_PROGRESS: requirements.filter(r => r.status === "IN_PROGRESS").length,
    CLOSED: requirements.filter(r => r.status === "CLOSED").length
  };

  if (loading) return <div className="page-shell super-admin-page"><PageLoader title="Loading Staff Requests..." /></div>;

  return (
    <div className="page-shell super-admin-page">
      <style>{`
        .sr-status-tabs {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          white-space: nowrap;
          align-items: center;
        }
        .sr-status-tabs button {
          flex-shrink: 0;
          white-space: nowrap;
        }
        .sr-filter-toolbar {
          background: #fff;
          padding: 16px 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }
        .sr-filter-controls {
          display: flex;
          gap: 10px;
          align-items: center;
          flex: 1 1 450px;
          max-width: 560px;
          justify-content: flex-end;
        }
        .sr-table-container {
          background: #fff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .sr-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 820px;
          white-space: nowrap;
        }
        .sr-modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          background: #f8fafc;
          padding: 16px;
          border-radius: 10px;
          margin-bottom: 16px;
          font-size: 0.85rem;
        }
        .sr-assignee-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        @media (max-width: 768px) {
          .sr-filter-toolbar {
            flex-direction: column !important;
            align-items: stretch !important;
            padding: 14px !important;
            gap: 12px !important;
          }
          .sr-filter-controls {
            flex-direction: column !important;
            max-width: 100% !important;
            width: 100% !important;
            justify-content: stretch !important;
            gap: 10px !important;
          }
          .sr-filter-controls > div {
            width: 100% !important;
            min-width: 100% !important;
          }
          .sr-modal-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .sr-assignee-row {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .sr-assignee-row button {
            width: 100% !important;
            justify-content: center !important;
          }
          .modal-content-card {
            width: 95% !important;
            max-height: 92vh !important;
          }
        }
      `}</style>

      {/* Header (Point 1: Staff Requests) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Staff Requests</h1>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
            Hiring and recruitment requisitions submitted by salon owners.
          </p>
        </div>
      </div>

      {status.error && (
        <div style={{ padding: "12px 16px", background: "#fef2f2", color: "#dc2626", borderRadius: 8, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{status.error}</span>
          <button onClick={() => setStatus({ ...status, error: "" })} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}>✕</button>
        </div>
      )}
      {status.success && (
        <div style={{ padding: "12px 16px", background: "#ecfdf5", color: "#065f46", borderRadius: 8, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{status.success}</span>
          <button onClick={() => setStatus({ ...status, success: "" })} style={{ background: "none", border: "none", color: "#065f46", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* Status Filter Tabs & Search / Salon Filter Toolbar */}
      <div className="sr-filter-toolbar">
        <div className="sr-status-tabs no-scrollbar">
          {["ALL", "OPEN", "IN_PROGRESS", "CLOSED"].map(key => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                background: filter === key ? "#0f172a" : "#f1f5f9",
                color: filter === key ? "#fff" : "#64748b",
                transition: "all 0.15s"
              }}
            >
              {key === "ALL" ? `All (${counts.ALL})` : `${statusConfig[key]?.label} (${counts[key]})`}
            </button>
          ))}
        </div>

        <div className="sr-filter-controls">
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none", zIndex: 2 }} />
            <input
              type="text"
              className="search-input-field"
              placeholder="Search role, skills, salon..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: "100%", height: 38, padding: "8px 12px 8px 42px", paddingLeft: "42px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box", outline: "none", background: "#f8fafc" }}
            />
          </div>

          <div style={{ width: 190, flexShrink: 0 }}>
            <CustomSelect value={salonFilter} onChange={e => setSalonFilter(e.target.value)} style={{ width: "100%" }}>
              <option value="">All Salons</option>
              {salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </CustomSelect>
          </div>

          {(searchQuery || salonFilter) && (
            <button
              onClick={() => { setSearchQuery(""); setSalonFilter(""); }}
              style={{ background: "none", border: "none", color: "#4f46e5", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Point 2 & 3: Request List Table */}
      {filtered.length === 0 ? (
        <EmptyState 
          title="No Staff Requests" 
          message={filter === "ALL" ? "No staff requests submitted yet." : `No ${statusConfig[filter]?.label.toLowerCase()} staff requests found.`} 
        />
      ) : (
        <div className="sr-table-container">
          <table className="sr-table">
            <thead>
              <tr style={{ borderBottom: "2px solid #f1f5f9", background: "#f8fafc", color: "#64748b", fontWeight: 700 }}>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Salon Name</th>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Branch</th>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Position / Job Role</th>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Assigned Handler</th>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Vacancies</th>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Salary Range</th>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Priority</th>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Status</th>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Requested Date</th>
                <th style={{ padding: "14px 16px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => {
                const sc = statusConfig[req.status] || statusConfig.OPEN;
                const pc = priorityColors[req.priority] || priorityColors.MEDIUM;
                const StatusIcon = sc.icon;

                return (
                  <tr key={req.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>
                      {req.salon?.name || "General Salon"}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#475569" }}>
                      {req.branch?.name || "Main / All"}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>
                        {req.position || req.title}
                      </div>
                      {req.skills && (
                        <div style={{ fontSize: "0.75rem", color: "#6366f1", marginTop: 2 }}>
                          Skills: {req.skills}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: req.department ? "#4338ca" : "#94a3b8" }}>
                        {req.department || "Unassigned"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>
                      {req.count || 1} required
                    </td>
                    <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: 600 }}>
                      {req.salary || "Negotiable"}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ background: pc.bg, color: pc.color, padding: "3px 8px", borderRadius: 100, fontSize: "0.72rem", fontWeight: 700 }}>
                        {req.priority}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: sc.bg, color: sc.color, padding: "4px 10px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700 }}>
                        <StatusIcon size={12} /> {sc.label}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "0.8rem" }}>
                      {new Date(req.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => {
                            setSelectedReq(req);
                            setInternalNotesText(req.internalNotes || "");
                            setHandlerInput(req.department || "");
                          }}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 6,
                            border: "1px solid #cbd5e1",
                            background: "#0f172a",
                            color: "white",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            cursor: "pointer"
                          }}
                        >
                          View Detail
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

      {/* Point 5: Request Detail Modal (Exact fields required + Transfer) */}
      {selectedReq && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
          <div style={{ background: "#fff", width: "100%", maxWidth: 640, borderRadius: 16, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, borderBottom: "1px solid #eee", paddingBottom: 14 }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#6366f1", textTransform: "uppercase" }}>
                  Staff Request Details
                </span>
                <h2 style={{ margin: "2px 0 0", fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                  {selectedReq.position || selectedReq.title}
                </h2>
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: 2 }}>
                  Salon: <strong>{selectedReq.salon?.name || "General Salon"}</strong> {selectedReq.branch?.name && `• Branch: ${selectedReq.branch.name}`}
                </div>
              </div>
              <button onClick={() => setSelectedReq(null)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20, color: "#94a3b8" }}>✕</button>
            </div>

            <div className="sr-modal-grid">
              <div><span style={{ color: "#64748b" }}>Position:</span> <strong>{selectedReq.position || selectedReq.title}</strong></div>
              <div><span style={{ color: "#64748b" }}>Number Required:</span> <strong>{selectedReq.count || 1} Person(s)</strong></div>
              <div><span style={{ color: "#64748b" }}>Salary Range:</span> <strong>{selectedReq.salary || "Negotiable"}</strong></div>
              <div><span style={{ color: "#64748b" }}>Experience:</span> <strong>{selectedReq.experience || "Any"}</strong></div>
              <div><span style={{ color: "#64748b" }}>Priority:</span> <strong>{selectedReq.priority}</strong></div>
              <div><span style={{ color: "#64748b" }}>Current Status:</span> <strong style={{ color: statusConfig[selectedReq.status]?.color }}>{statusConfig[selectedReq.status]?.label || selectedReq.status}</strong></div>
              <div><span style={{ color: "#64748b" }}>Requested Date:</span> <strong>{new Date(selectedReq.createdAt).toLocaleDateString()}</strong></div>
              <div>
                <span style={{ color: "#64748b" }}>Assigned Handler:</span>{" "}
                <strong style={{ color: "#4338ca" }}>{selectedReq.department || "Unassigned"}</strong>
              </div>
            </div>

            {/* Manage Handler / Staff Assignee */}
            <div style={{ background: "#eef2ff", padding: "14px 16px", borderRadius: 10, marginBottom: 14, border: "1px solid #e0e7ff", position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                <span style={{ fontSize: "0.8rem", color: "#3730a3", fontWeight: 700 }}>
                  Manage Handler / Recruiter Assignee:
                </span>
                <span style={{ fontSize: "0.75rem", color: "#4338ca", fontWeight: 600 }}>
                  {selectedReq.department ? `Assigned: ${selectedReq.department}` : "Unassigned"}
                </span>
              </div>
              
              <div style={{ position: "relative" }}>
                <div className="sr-assignee-row">
                  <div style={{ position: "relative", flex: 1 }}>
                    <input
                      type="text"
                      placeholder="Search recruiter / staff name (e.g. Priya HR, Ankit Verma)..."
                      value={handlerInput}
                      onFocus={() => setShowStaffDropdown(true)}
                      onChange={e => {
                        setHandlerInput(e.target.value);
                        setShowStaffDropdown(true);
                      }}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #c7d2fe", fontSize: 13, background: "white", boxSizing: "border-box", outline: "none" }}
                    />
                    {handlerInput && (
                      <button
                        type="button"
                        onClick={() => { setHandlerInput(""); setShowStaffDropdown(true); }}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", color: "#94a3b8", fontSize: 13 }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={updatingId === selectedReq.id}
                    onClick={() => {
                      setShowStaffDropdown(false);
                      updateRequirement(selectedReq.id, { department: handlerInput.trim() });
                    }}
                    style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: "#4f46e5", color: "white", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    ✓ Update Assignee
                  </button>
                </div>

                {/* Auto Suggestions Dropdown */}
                {showStaffDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: 0,
                      right: 140,
                      background: "white",
                      borderRadius: 10,
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                      border: "1px solid #cbd5e1",
                      maxHeight: 220,
                      overflowY: "auto",
                      zIndex: 100,
                      padding: "4px"
                    }}
                  >
                    <div style={{ padding: "6px 10px", fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9" }}>
                      Team Members & Recruiters ({filteredStaff.length})
                    </div>
                    {filteredStaff.length === 0 ? (
                      <div style={{ padding: "12px 10px", textAlign: "center", fontSize: "0.8rem", color: "#94a3b8" }}>
                        No matching staff found for "{handlerInput}"
                      </div>
                    ) : (
                      filteredStaff.map(staff => (
                        <div
                          key={staff.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setHandlerInput(staff.name);
                            setShowStaffDropdown(false);
                          }}
                          style={{
                            padding: "8px 12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderRadius: 6,
                            cursor: "pointer",
                            transition: "background 0.15s",
                            gap: 8
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e0e7ff", color: "#4338ca", fontWeight: 700, fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {staff.name?.charAt(0)?.toUpperCase() || "S"}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: "0.83rem", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {staff.name}
                              </div>
                              <div style={{ fontSize: "0.72rem", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {staff.email}
                              </div>
                            </div>
                          </div>
                          {staff.adminRole?.name && (
                            <span style={{ fontSize: "0.68rem", fontWeight: 700, background: "#eef2ff", color: "#4f46e5", padding: "2px 8px", borderRadius: 4, flexShrink: 0 }}>
                              {staff.adminRole.name}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {selectedReq.skills && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Skills & Expertise</div>
                <div style={{ background: "#f8fafc", padding: 10, borderRadius: 8, fontSize: "0.85rem", color: "#334155" }}>
                  {selectedReq.skills}
                </div>
              </div>
            )}

            {selectedReq.description && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Description / Requirements</div>
                <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, fontSize: "0.85rem", color: "#334155", lineHeight: 1.5 }}>
                  {selectedReq.description}
                </div>
              </div>
            )}

            {/* Point 5 & 6: Internal Notes (Add / Update note) */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155", textTransform: "uppercase", marginBottom: 6 }}>
                Internal Notes & Staffing Remarks
              </div>
              <textarea
                rows={3}
                placeholder="Add recruitment status notes, candidate shortlist remarks, interview timeline..."
                value={internalNotesText}
                onChange={e => setInternalNotesText(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => updateRequirement(selectedReq.id, { internalNotes: internalNotesText })}
                  style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#f8fafc", color: "#334155", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer" }}
                >
                  📝 Save Note
                </button>
              </div>
            </div>

            {/* Point 6: Basic Actions (Update Status & Close Request) */}
            <div style={{ background: "#f1f5f9", padding: 16, borderRadius: 10, marginBottom: 16 }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: 10 }}>Update Status</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  disabled={updatingId === selectedReq.id || selectedReq.status === "OPEN"}
                  onClick={() => updateRequirement(selectedReq.id, { status: "OPEN" })}
                  style={{ padding: "8px 14px", borderRadius: 6, border: "none", background: "#f59e0b", color: "white", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}
                >
                  Mark as Open
                </button>
                <button
                  disabled={updatingId === selectedReq.id || selectedReq.status === "IN_PROGRESS"}
                  onClick={() => updateRequirement(selectedReq.id, { status: "IN_PROGRESS" })}
                  style={{ padding: "8px 14px", borderRadius: 6, border: "none", background: "#3b82f6", color: "white", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}
                >
                  Mark as In Progress
                </button>
                <button
                  disabled={updatingId === selectedReq.id || selectedReq.status === "CLOSED"}
                  onClick={() => updateRequirement(selectedReq.id, { status: "CLOSED" })}
                  style={{ padding: "8px 14px", borderRadius: 6, border: "none", background: "#10b981", color: "white", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}
                >
                  ✓ Close Request
                </button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setSelectedReq(null)}
                style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #cbd5e1", background: "white", color: "#475569", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
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
