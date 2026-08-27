import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import PageLoader from "../../components/PageLoader";
import EmptyState from "../../components/EmptyState";
import { useBranch } from "../../context/BranchContext";
import { Calendar, Clock, Users, UserCheck, UserX, AlertTriangle, Briefcase, CheckCircle2, Filter, Download, Settings, ChevronDown, ChevronUp, Eye, Edit2, MapPin, Camera, FileText, RefreshCw } from "lucide-react";

const STATUS_COLORS = {
  PRESENT: { bg: "#dcfce7", color: "#166534" },
  LATE: { bg: "#fef3c7", color: "#92400e" },
  HALF_DAY: { bg: "#fef9c3", color: "#854d0e" },
  ABSENT: { bg: "#fee2e2", color: "#991b1b" },
  LEAVE: { bg: "#e0e7ff", color: "#3730a3" },
  WORKING: { bg: "#d1fae5", color: "#065f46" },
  COMPLETED_SHIFT: { bg: "#dbeafe", color: "#1e40af" }
};

const STATUS_OPTIONS = ["", "PRESENT", "LATE", "HALF_DAY", "ABSENT", "LEAVE", "WORKING", "COMPLETED_SHIFT"];

export default function AttendanceManagementPage() {
  const [tab, setTab] = useState("today");
  const [loading, setLoading] = useState(true);
  const { selectedBranchId: selectedBranch } = useBranch();
  const [summary, setSummary] = useState(null);
  const [daySheet, setDaySheet] = useState([]);
  const [records, setRecords] = useState([]);
  const [recordsMeta, setRecordsMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [settings, setSettings] = useState(null);
  const [settingsForm, setSettingsForm] = useState({});
  const [date, setDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState("");
  const [feedback, setFeedback] = useState({ error: "", success: "" });
  const [detailRecord, setDetailRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [reportPeriod, setReportPeriod] = useState("daily");



  const loadSummary = async () => {
    try {
      const params = { date };
      if (selectedBranch) params.branchId = selectedBranch;
      const res = await api.get("/owner/attendance/summary", { params });
      setSummary(res.data);
    } catch { }
  };

  const loadDaySheet = async () => {
    try {
      const params = { date };
      if (selectedBranch) params.branchId = selectedBranch;
      const res = await api.get("/owner/attendance/day-sheet", { params });
      setDaySheet(res.data?.rows || []);
    } catch { }
  };

  const loadRecords = async () => {
    try {
      const params = { page, limit: 25, date };
      if (selectedBranch) params.branchId = selectedBranch;
      if (statusFilter) params.status = statusFilter;
      if (searchQ.trim()) params.q = searchQ.trim();
      const res = await api.get("/owner/attendance", { params });
      setRecords(res.data?.rows || []);
      setRecordsMeta({ total: res.data?.total || 0, page: res.data?.page || 1, totalPages: res.data?.totalPages || 1 });
    } catch { }
  };

  const loadSettings = async () => {
    try {
      const res = await api.get("/owner/attendance/settings");
      setSettings(res.data);
      setSettingsForm(res.data || {});
    } catch { }
  };

  const load = async () => {
    setLoading(true);
    setFeedback({ error: "", success: "" });
    try {
      await Promise.all([loadSummary(), loadDaySheet(), loadRecords(), loadSettings()]);
    } catch (err) {
      setFeedback({ error: formatApiError(err, "Failed to load attendance data."), success: "" });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    loadSummary();
    loadDaySheet();
    loadRecords();
  }, [selectedBranch, date, statusFilter, page]);

  const saveSettings = async () => {
    setFeedback({ error: "", success: "" });
    try {
      await api.post("/owner/attendance/settings", settingsForm);
      setFeedback({ error: "", success: "Attendance settings saved." });
      setSettings({ ...settingsForm });
    } catch (err) {
      setFeedback({ error: formatApiError(err, "Could not save settings."), success: "" });
    }
  };

  const adminCheckIn = async (userSalonId, branchId) => {
    setBusyId(userSalonId);
    setFeedback({ error: "", success: "" });
    try {
      await api.post("/owner/attendance/check-in", { userSalonId, branchId });
      setFeedback({ error: "", success: "Staff checked in successfully." });
      await Promise.all([loadSummary(), loadDaySheet(), loadRecords()]);
    } catch (err) {
      setFeedback({ error: formatApiError(err, "Check-in failed."), success: "" });
    }
    setBusyId("");
  };

  const adminCheckOut = async (userSalonId) => {
    setBusyId(userSalonId);
    setFeedback({ error: "", success: "" });
    try {
      await api.post("/owner/attendance/check-out", { userSalonId });
      setFeedback({ error: "", success: "Staff checked out successfully." });
      await Promise.all([loadSummary(), loadDaySheet(), loadRecords()]);
    } catch (err) {
      setFeedback({ error: formatApiError(err, "Check-out failed."), success: "" });
    }
    setBusyId("");
  };

  const openEditModal = (record) => {
    setEditRecord(record);
    setEditForm({
      status: record.status || "PRESENT",
      checkInAt: record.checkInAt ? new Date(record.checkInAt).toISOString().slice(0, 16) : "",
      checkOutAt: record.checkOutAt ? new Date(record.checkOutAt).toISOString().slice(0, 16) : "",
      adminRemark: record.adminRemark || "",
      note: record.note || "",
      reason: ""
    });
  };

  const submitManualEdit = async () => {
    if (!editRecord || !editForm.reason || editForm.reason.length < 3) {
      setFeedback({ error: "Reason is required (min 3 characters).", success: "" });
      return;
    }
    setFeedback({ error: "", success: "" });
    try {
      await api.patch(`/owner/attendance/${editRecord.id}/manual-update`, {
        status: editForm.status,
        checkInAt: editForm.checkInAt || undefined,
        checkOutAt: editForm.checkOutAt || undefined,
        adminRemark: editForm.adminRemark || undefined,
        note: editForm.note || undefined,
        reason: editForm.reason
      });
      setFeedback({ error: "", success: "Attendance record updated." });
      setEditRecord(null);
      await Promise.all([loadSummary(), loadDaySheet(), loadRecords()]);
    } catch (err) {
      setFeedback({ error: formatApiError(err, "Update failed."), success: "" });
    }
  };

  const exportReport = async (format) => {
    try {
      const params = new URLSearchParams({ period: reportPeriod, date });
      if (selectedBranch) params.set("branchId", selectedBranch);
      const res = await api.get(`/owner/attendance/reports/export.${format}`, { params, responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-report-${date}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setFeedback({ error: formatApiError(err, "Export failed."), success: "" });
    }
  };

  const statCards = useMemo(() => {
    if (!summary) return [];
    return [
      { label: "Total Staff", value: summary.totalStaff || 0, icon: Users, color: "#6366f1", bg: "#eef2ff" },
      { label: "Present", value: summary.presentToday || 0, icon: UserCheck, color: "#10b981", bg: "#ecfdf5" },
      { label: "Absent", value: summary.absentToday || 0, icon: UserX, color: "#ef4444", bg: "#fef2f2" },
      { label: "Late", value: summary.lateStaff || 0, icon: AlertTriangle, color: "#f59e0b", bg: "#fffbeb" },
      { label: "Working", value: summary.currentlyWorking || 0, icon: Clock, color: "#06b6d4", bg: "#ecfeff" },
      { label: "Completed", value: summary.completedShift || 0, icon: CheckCircle2, color: "#8b5cf6", bg: "#f5f3ff" },
      { label: "On Leave", value: summary.onLeave || 0, icon: Calendar, color: "#ec4899", bg: "#fdf2f8" }
    ];
  }, [summary]);

  const formatTime = (dt) => dt ? new Date(dt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";
  const formatHours = (mins) => {
    if (!mins && mins !== 0) return "—";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  if (loading) return <div className="page-shell"><PageLoader title="Loading attendance" message="Fetching staff attendance data, branches, and settings." /></div>;

  return (
    <div className="page-shell">
      <style>{`
        .attendance-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }
        .attendance-stat-card {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .attendance-tabs {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 20px;
          overflow-x: auto;
          white-space: nowrap;
          padding-bottom: 8px;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .attendance-tabs::-webkit-scrollbar {
          display: none;
        }
        .attendance-tab-btn {
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #64748b;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .attendance-tab-btn:hover {
          border-color: #cbd5e1;
          color: #334155;
        }
        .attendance-tab-btn.active {
          background: #0f766e;
          color: #fff;
          border-color: #0f766e;
          box-shadow: 0 2px 6px rgba(15, 118, 110, 0.25);
        }

        .desktop-table-view {
          display: block;
        }
        .mobile-cards-view {
          display: none;
        }

        @media (max-width: 768px) {
          .attendance-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
            margin-bottom: 16px !important;
          }
          .attendance-stat-card {
            padding: 10px 12px !important;
            gap: 10px !important;
          }
          .desktop-table-view {
            display: none !important;
          }
          .mobile-cards-view {
            display: flex !important;
            flex-direction: column !important;
            gap: 12px !important;
          }
          .att-mobile-card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 14px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.03);
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .att-mobile-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8px;
          }
          .att-mobile-card-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            background: #f8fafc;
            border-radius: 8px;
            padding: 10px;
            border: 1px solid #f1f5f9;
          }
          .att-mobile-stat-box {
            text-align: center;
          }
          .att-mobile-stat-label {
            font-size: 0.68rem;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 2px;
          }
          .att-mobile-stat-value {
            font-size: 0.82rem;
            font-weight: 700;
            color: #0f172a;
            font-family: monospace;
          }
          .att-mobile-card-footer {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 8px;
            padding-top: 4px;
            border-top: 1px dashed #f1f5f9;
          }
        }
      `}</style>

      <div className="hero-card" style={{ padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.3rem" }}>Attendance Management</h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.82rem" }}>Track staff check-ins, shift hours, and manage attendance records.</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, background: "white" }} />
          </div>
        </div>
      </div>

      {feedback.error && <div style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fca5a5", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: "0.85rem" }}>{feedback.error}</div>}
      {feedback.success && <div style={{ background: "#ecfdf5", color: "#065f46", border: "1px solid #6ee7b7", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: "0.85rem" }}>{feedback.success}</div>}

      <div className="attendance-stats-grid">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="attendance-stat-card">
              <div style={{ width: 36, height: 36, borderRadius: 8, background: card.bg, color: card.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={18} />
              </div>
              <div>
                <div style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>{card.label}</div>
                <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>{card.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="attendance-tabs">
        {[
          { key: "today", label: "Today's Attendance", icon: Clock },
          { key: "records", label: "All Records", icon: FileText },
          { key: "reports", label: "Reports", icon: Download }
        ].map((t) => {
          const TabIcon = t.icon;
          const isActive = tab === t.key;
          return (
            <button key={t.key} type="button" onClick={() => setTab(t.key)} className={`attendance-tab-btn ${isActive ? "active" : ""}`}>
              <TabIcon size={14} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === "today" && (
        <div className="panel-card" style={{ padding: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#0f172a" }}>Day Sheet — {new Date(date).toLocaleDateString("en-IN", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}</h3>
            <button type="button" onClick={() => { loadSummary(); loadDaySheet(); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", fontSize: 12, fontWeight: 600, background: "#f1f5f9", color: "#334155", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer" }}><RefreshCw size={13} /> Refresh</button>
          </div>
          {daySheet.length === 0 ? (
            <EmptyState title="No attendance data" message="No staff attendance records found for this date and branch." />
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="desktop-table-view" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", width: "100%" }}>
                <table style={{ width: "100%", minWidth: 600, borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#64748b", fontWeight: 700 }}>
                      <th style={{ padding: "10px 14px", textAlign: "left" }}>Staff</th>
                      <th style={{ padding: "10px 14px", textAlign: "left" }}>Branch</th>
                      <th style={{ padding: "10px 14px", textAlign: "center" }}>Check In</th>
                      <th style={{ padding: "10px 14px", textAlign: "center" }}>Check Out</th>
                      <th style={{ padding: "10px 14px", textAlign: "center" }}>Hours</th>
                      <th style={{ padding: "10px 14px", textAlign: "center" }}>Status</th>
                      <th style={{ padding: "10px 14px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daySheet.map((row) => {
                      const sc = STATUS_COLORS[row.status] || { bg: "#f1f5f9", color: "#64748b" };
                      const isWorking = row.type === "ATTENDANCE" && !row.checkOutAt;
                      return (
                        <tr key={row.userSalonId + row.type} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0f172a" }}>{row.staffName}</td>
                          <td style={{ padding: "10px 14px", color: "#475569" }}>{row.branchName || "—"}</td>
                          <td style={{ padding: "10px 14px", textAlign: "center", fontFamily: "monospace" }}>{row.checkInAt ? formatTime(row.checkInAt) : "—"}</td>
                          <td style={{ padding: "10px 14px", textAlign: "center", fontFamily: "monospace" }}>{row.checkOutAt ? formatTime(row.checkOutAt) : "—"}</td>
                          <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 600 }}>{formatHours(row.workedMinutes)}</td>
                          <td style={{ padding: "10px 14px", textAlign: "center" }}>
                            <span style={{ background: sc.bg, color: sc.color, fontWeight: 700, fontSize: 11, padding: "3px 8px", borderRadius: 100 }}>
                              {row.type === "ABSENT" ? "ABSENT" : row.type === "LEAVE" ? "LEAVE" : row.status}
                            </span>
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "right" }}>
                            {row.type === "ABSENT" && (
                              <button type="button" onClick={() => adminCheckIn(row.userSalonId, row.branchId)} disabled={busyId === row.userSalonId} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "5px 12px", fontSize: 11, fontWeight: 700, background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", borderRadius: 6, cursor: "pointer", transition: "all 0.2s" }}>
                                {busyId === row.userSalonId ? "..." : "Check In"}
                              </button>
                            )}
                            {row.type === "ATTENDANCE" && isWorking && (
                              <button type="button" onClick={() => adminCheckOut(row.userSalonId)} disabled={busyId === row.userSalonId} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "5px 12px", fontSize: 11, fontWeight: 700, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer", transition: "all 0.2s" }}>
                                {busyId === row.userSalonId ? "..." : "Check Out"}
                              </button>
                            )}
                            {row.attendanceId && (
                              <button type="button" onClick={() => setDetailRecord(row)} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "5px", background: "#f0f9ff", color: "#0284c7", border: "1px solid #bae6fd", borderRadius: 6, cursor: "pointer", marginLeft: 6, transition: "all 0.2s" }} title="View Details">
                                <Eye size={15} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="mobile-cards-view">
                {daySheet.map((row) => {
                  const sc = STATUS_COLORS[row.status] || { bg: "#f1f5f9", color: "#64748b" };
                  const isWorking = row.type === "ATTENDANCE" && !row.checkOutAt;
                  return (
                    <div key={row.userSalonId + row.type} className="att-mobile-card">
                      <div className="att-mobile-card-header">
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>{row.staffName}</div>
                          <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 2 }}>{row.branchName || "Main Branch"}</div>
                        </div>
                        <span style={{ background: sc.bg, color: sc.color, fontWeight: 700, fontSize: "0.72rem", padding: "4px 10px", borderRadius: 100, border: `1px solid ${sc.color}20` }}>
                          {row.type === "ABSENT" ? "ABSENT" : row.type === "LEAVE" ? "LEAVE" : row.status}
                        </span>
                      </div>

                      <div className="att-mobile-card-grid">
                        <div className="att-mobile-stat-box">
                          <div className="att-mobile-stat-label">Check In</div>
                          <div className="att-mobile-stat-value">{row.checkInAt ? formatTime(row.checkInAt) : "—"}</div>
                        </div>
                        <div className="att-mobile-stat-box">
                          <div className="att-mobile-stat-label">Check Out</div>
                          <div className="att-mobile-stat-value">{row.checkOutAt ? formatTime(row.checkOutAt) : "—"}</div>
                        </div>
                        <div className="att-mobile-stat-box">
                          <div className="att-mobile-stat-label">Hours</div>
                          <div className="att-mobile-stat-value" style={{ color: "#0f766e" }}>{formatHours(row.workedMinutes)}</div>
                        </div>
                      </div>

                      <div className="att-mobile-card-footer">
                        {row.type === "ABSENT" && (
                          <button type="button" onClick={() => adminCheckIn(row.userSalonId, row.branchId)} disabled={busyId === row.userSalonId} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "6px 14px", fontSize: 12, fontWeight: 700, background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", borderRadius: 8, cursor: "pointer" }}>
                            {busyId === row.userSalonId ? "..." : "Check In"}
                          </button>
                        )}
                        {row.type === "ATTENDANCE" && isWorking && (
                          <button type="button" onClick={() => adminCheckOut(row.userSalonId)} disabled={busyId === row.userSalonId} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "6px 14px", fontSize: 12, fontWeight: 700, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, cursor: "pointer" }}>
                            {busyId === row.userSalonId ? "..." : "Check Out"}
                          </button>
                        )}
                        {row.attendanceId && (
                          <button type="button" onClick={() => setDetailRecord(row)} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "6px 10px", background: "#f0f9ff", color: "#0284c7", border: "1px solid #bae6fd", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, gap: 4 }}>
                            <Eye size={14} /> Details
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "records" && (
        <div className="panel-card" style={{ padding: "18px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <input type="text" placeholder="Search staff..." value={searchQ} onChange={(e) => { setSearchQ(e.target.value); setPage(1); }} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, flex: "1 1 180px" }} />
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, background: "#fff" }}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s || "All Statuses"}</option>)}
            </select>
            <span style={{ fontSize: 12, color: "#64748b", marginLeft: "auto" }}>{recordsMeta.total} records</span>
          </div>
          {records.length === 0 ? (
            <EmptyState title="No records found" message="Try adjusting your filters or date range." />
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="desktop-table-view" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", width: "100%" }}>
                <table style={{ width: "100%", minWidth: 650, borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#64748b", fontWeight: 700 }}>
                      <th style={{ padding: "10px 14px", textAlign: "left" }}>Staff</th>
                      <th style={{ padding: "10px 14px", textAlign: "left" }}>Branch</th>
                      <th style={{ padding: "10px 14px", textAlign: "center" }}>Date</th>
                      <th style={{ padding: "10px 14px", textAlign: "center" }}>Check In</th>
                      <th style={{ padding: "10px 14px", textAlign: "center" }}>Check Out</th>
                      <th style={{ padding: "10px 14px", textAlign: "center" }}>Hours</th>
                      <th style={{ padding: "10px 14px", textAlign: "center" }}>Status</th>
                      <th style={{ padding: "10px 14px", textAlign: "center" }}>Verification</th>
                      <th style={{ padding: "10px 14px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => {
                      const sc = STATUS_COLORS[r.status] || { bg: "#f1f5f9", color: "#64748b" };
                      const staffName = r.userSalon?.user?.name || "Unknown";
                      const branchName = r.branch?.name || "—";
                      return (
                        <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px 14px", fontWeight: 600 }}>{staffName}</td>
                          <td style={{ padding: "10px 14px", color: "#475569" }}>{branchName}</td>
                          <td style={{ padding: "10px 14px", textAlign: "center" }}>{new Date(r.attendanceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</td>
                          <td style={{ padding: "10px 14px", textAlign: "center", fontFamily: "monospace" }}>{formatTime(r.checkInAt)}</td>
                          <td style={{ padding: "10px 14px", textAlign: "center", fontFamily: "monospace" }}>{formatTime(r.checkOutAt)}</td>
                          <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 600 }}>{formatHours(r.workedMinutes)}</td>
                          <td style={{ padding: "10px 14px", textAlign: "center" }}>
                            <span style={{ background: sc.bg, color: sc.color, fontWeight: 700, fontSize: 11, padding: "3px 8px", borderRadius: 100 }}>{r.status}</span>
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "center", fontSize: 11, color: "#64748b" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                              {r.checkInSelfieUrl && <Camera size={12} title="Selfie captured" />}
                              {r.geoStatus === "INSIDE" && <MapPin size={12} style={{ color: "#10b981" }} title="GPS verified" />}
                              {r.geoStatus === "OUTSIDE" && <MapPin size={12} style={{ color: "#ef4444" }} title="Outside geofence" />}
                              <span>{r.verificationMethod}</span>
                            </div>
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "right" }}>
                            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                              <button type="button" onClick={() => setDetailRecord(r)} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "6px", background: "#f0f9ff", color: "#0284c7", border: "1px solid #bae6fd", borderRadius: 6, cursor: "pointer", transition: "all 0.2s" }} title="View">
                                <Eye size={15} />
                              </button>
                              <button type="button" onClick={() => openEditModal(r)} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "6px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 6, cursor: "pointer", transition: "all 0.2s" }} title="Edit">
                                <Edit2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="mobile-cards-view">
                {records.map((r) => {
                  const sc = STATUS_COLORS[r.status] || { bg: "#f1f5f9", color: "#64748b" };
                  const staffName = r.userSalon?.user?.name || "Unknown";
                  const branchName = r.branch?.name || "—";
                  return (
                    <div key={r.id} className="att-mobile-card">
                      <div className="att-mobile-card-header">
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>{staffName}</div>
                          <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 2 }}>
                            {branchName} • {new Date(r.attendanceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                          </div>
                        </div>
                        <span style={{ background: sc.bg, color: sc.color, fontWeight: 700, fontSize: "0.72rem", padding: "4px 10px", borderRadius: 100, border: `1px solid ${sc.color}20` }}>
                          {r.status}
                        </span>
                      </div>

                      <div className="att-mobile-card-grid">
                        <div className="att-mobile-stat-box">
                          <div className="att-mobile-stat-label">Check In</div>
                          <div className="att-mobile-stat-value">{formatTime(r.checkInAt)}</div>
                        </div>
                        <div className="att-mobile-stat-box">
                          <div className="att-mobile-stat-label">Check Out</div>
                          <div className="att-mobile-stat-value">{formatTime(r.checkOutAt)}</div>
                        </div>
                        <div className="att-mobile-stat-box">
                          <div className="att-mobile-stat-label">Hours</div>
                          <div className="att-mobile-stat-value" style={{ color: "#0f766e" }}>{formatHours(r.workedMinutes)}</div>
                        </div>
                      </div>

                      <div className="att-mobile-card-footer">
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginRight: "auto", fontSize: 11, color: "#64748b" }}>
                          {r.checkInSelfieUrl && <Camera size={13} title="Selfie captured" />}
                          {r.geoStatus === "INSIDE" && <MapPin size={13} style={{ color: "#10b981" }} title="GPS verified" />}
                          {r.geoStatus === "OUTSIDE" && <MapPin size={13} style={{ color: "#ef4444" }} title="Outside geofence" />}
                          <span>{r.verificationMethod}</span>
                        </div>
                        <button type="button" onClick={() => setDetailRecord(r)} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "6px 10px", background: "#f0f9ff", color: "#0284c7", border: "1px solid #bae6fd", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, gap: 4 }}>
                          <Eye size={14} /> View
                        </button>
                        <button type="button" onClick={() => openEditModal(r)} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "6px 10px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, gap: 4 }}>
                          <Edit2 size={14} /> Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {recordsMeta.totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
              <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ padding: "6px 12px", fontSize: 12, border: "1px solid #cbd5e1", borderRadius: 6, background: "white", cursor: "pointer" }}>Prev</button>
              <span style={{ padding: "6px 12px", fontSize: 12, color: "#64748b" }}>Page {recordsMeta.page} of {recordsMeta.totalPages}</span>
              <button type="button" disabled={page >= recordsMeta.totalPages} onClick={() => setPage(page + 1)} style={{ padding: "6px 12px", fontSize: 12, border: "1px solid #cbd5e1", borderRadius: 6, background: "white", cursor: "pointer" }}>Next</button>
            </div>
          )}
        </div>
      )}

      {tab === "reports" && (
        <div className="panel-card" style={{ maxWidth: 600 }}>
          <h3 style={{ margin: "0 0 16px" }}>Attendance Reports</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Report Period</span>
              <select value={reportPeriod} onChange={(e) => setReportPeriod(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => exportReport("xlsx")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", background: "#10b981", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}>
                <Download size={15} /> Export Excel
              </button>
              <button type="button" onClick={() => exportReport("pdf")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", background: "#ef4444", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}>
                <FileText size={15} /> Export PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {detailRecord && (
        <div className="modal-overlay" onClick={() => setDetailRecord(null)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Attendance Details</h3>
              <button type="button" className="modal-close-btn" onClick={() => setDetailRecord(null)}>&times;</button>
            </div>
            <div style={{ padding: "0 24px 24px", display: "grid", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Staff:</span><strong>{detailRecord.staffName}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Branch:</span><strong>{detailRecord.branchName || "—"}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Date:</span><strong>{detailRecord.date || date}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Check In:</span><strong>{detailRecord.checkInAt ? formatTime(detailRecord.checkInAt) : "—"}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Check Out:</span><strong>{detailRecord.checkOutAt ? formatTime(detailRecord.checkOutAt) : "—"}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Working Hours:</span><strong>{formatHours(detailRecord.workedMinutes)}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Status:</span><strong>{detailRecord.type === "ABSENT" ? "ABSENT" : detailRecord.type === "LEAVE" ? "LEAVE" : detailRecord.status}</strong></div>
            </div>
          </div>
        </div>
      )}

      {editRecord && (
        <div className="modal-overlay" onClick={() => setEditRecord(null)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Edit Attendance</h3>
              <button type="button" className="modal-close-btn" onClick={() => setEditRecord(null)}>&times;</button>
            </div>
            <div style={{ padding: "0 24px 24px", display: "grid", gap: 12 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>Status</span>
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}>
                  {["PRESENT", "LATE", "HALF_DAY", "ABSENT", "LEAVE", "WORKING", "COMPLETED_SHIFT"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>Check In Time</span>
                <input type="datetime-local" value={editForm.checkInAt} onChange={(e) => setEditForm({ ...editForm, checkInAt: e.target.value })} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>Check Out Time</span>
                <input type="datetime-local" value={editForm.checkOutAt} onChange={(e) => setEditForm({ ...editForm, checkOutAt: e.target.value })} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>Admin Remark</span>
                <input value={editForm.adminRemark} onChange={(e) => setEditForm({ ...editForm, adminRemark: e.target.value })} placeholder="Optional remark" style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#ef4444" }}>Reason for Change *</span>
                <input value={editForm.reason} onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })} placeholder="Min 3 characters" style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }} required />
              </label>
              <button type="button" onClick={submitManualEdit} style={{ padding: "10px 20px", background: "linear-gradient(135deg, #0f766e, #0d9488)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
