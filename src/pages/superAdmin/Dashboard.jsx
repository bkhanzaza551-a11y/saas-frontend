import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import CustomDateInput from "../../components/CustomDateInput";
import { Building2, CheckCircle, Clock, AlertTriangle, Sparkles, LifeBuoy, TrendingUp, IndianRupee, Layers, AlertCircle, Activity, Plus, UserPlus, Ticket, FileText, X } from "lucide-react";

const fmt = (val) => Number(val || 0).toLocaleString("en-IN");

export default function SuperAdminDashboard() {
  const { auth } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [showAttention, setShowAttention] = useState(true);
  const [period, setPeriod] = useState("lifetime");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const navigate = useNavigate();

  const handlePeriodChange = (val) => {
    setPeriod(val);
    if (val === "custom" && (!dateFrom || !dateTo)) {
      const todayStr = new Date().toISOString().split("T")[0];
      const pastStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      setDateFrom(pastStr);
      setDateTo(todayStr);
    }
  };

  const fetchDashboard = useCallback(() => {
    setError("");
    setIsFetching(true);
    const params = { period };
    if (period === "custom") {
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
    }
    api.get("/super-admin/dashboard", { params })
      .then((res) => setData(res.data))
      .catch((err) => setError(err?.response?.data?.message || "Could not load dashboard."))
      .finally(() => setIsFetching(false));
  }, [period, dateFrom, dateTo]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // Dynamic RBAC Permission & Role Resolution
  const permissions = useMemo(() => {
    const rolePerms = auth?.user?.adminRole?.permissions;
    const userPerms = auth?.user?.pagePermissions;
    let list = [];
    if (Array.isArray(rolePerms)) {
      list.push(...rolePerms);
    } else if (rolePerms && typeof rolePerms === "object") {
      list.push(...Object.keys(rolePerms).filter((k) => rolePerms[k] === true));
    }
    if (Array.isArray(userPerms)) {
      list.push(...userPerms);
    }
    return list;
  }, [auth]);

  const roleName = (auth?.user?.adminRole?.name || "").toLowerCase();
  const department = (auth?.user?.department || "").toLowerCase();

  const isSuperAdmin = useMemo(() => {
    if (!auth?.user?.adminRoleId && !auth?.user?.adminRole) return true; // Default Root SuperAdmin
    if (roleName.includes("super admin") || roleName.includes("master admin") || roleName === "admin" || roleName === "platform admin") return true;
    if (permissions.includes("*") || permissions.includes("all")) return true;
    const core = ["salons", "finance", "support-tickets", "sales-pipeline"];
    return core.every((p) => permissions.includes(p));
  }, [auth, roleName, permissions]);

  // Modular Capability Flags
  const canSeeFinance = isSuperAdmin || permissions.includes("finance") || permissions.includes("subscriptions") || permissions.includes("plans") || roleName.includes("finance") || department.includes("finance");
  const canSeeSupport = isSuperAdmin || permissions.includes("support-tickets") || permissions.includes("support") || roleName.includes("support") || department.includes("support");
  const canSeeSales = isSuperAdmin || permissions.includes("sales-pipeline") || permissions.includes("demo-leads") || roleName.includes("sales") || department.includes("sales");
  const canSeeSalons = isSuperAdmin || permissions.includes("salons") || roleName.includes("operation") || department.includes("operation");
  const canSeeRequests = isSuperAdmin || permissions.includes("product-requests") || permissions.includes("staff-requests") || canSeeSupport || canSeeSalons;
  const canSeeActivity = isSuperAdmin || permissions.includes("audit-logs") || permissions.includes("staff");

  const totalPendingRequests = (data?.pendingProductRequests || 0) + (data?.pendingStaffRequests || 0);

  // Health Cards configured dynamically per capability
  const healthCards = useMemo(() => {
    if (isSuperAdmin) {
      return [
        { label: "Total Salons", value: data?.totalSalons || 0, caption: "All salons", icon: Building2, color: "#4f46e5", bg: "#f5f3ff", path: "/super-admin/salons" },
        { label: "Active Salons", value: data?.activeSalons || 0, caption: "Operational", icon: CheckCircle, color: "#10b981", bg: "#ecfdf5", path: "/super-admin/salons?status=ACTIVE" },
        { label: "Trial Salons", value: data?.trialSalons || 0, caption: "Recently onboarded", icon: Clock, color: "#f59e0b", bg: "#fffbeb", path: "/super-admin/salons?status=TRIAL" },
        { label: "Leads", value: data?.activeDemoLeads ?? data?.demoLeadsCount ?? 0, caption: "Active leads", icon: Sparkles, color: "#06b6d4", bg: "#ecfeff", path: "/super-admin/sales-pipeline" },
        { label: "Open Support Tickets", value: data?.supportTicketsCount || 0, caption: "Open + In progress", icon: LifeBuoy, color: "#ec4899", bg: "#fdf2f8", path: "/super-admin/support-tickets?status=OPEN" },
        { label: "Pending Requests", value: totalPendingRequests, caption: `${data?.pendingProductRequests || 0} products + ${data?.pendingStaffRequests || 0} staff`, icon: AlertCircle, color: "#8b5cf6", bg: "#f5f3ff", path: "/super-admin/product-requests?status=PENDING" }
      ];
    }

    // Role-focused cards
    if (canSeeFinance && !canSeeSupport && !canSeeSales && !canSeeSalons) {
      return [
        { label: "Collected Revenue", value: `₹${fmt(data?.totalSubscriptionRevenue)}`, caption: "Completed subscriptions", icon: IndianRupee, color: "#10b981", bg: "#ecfdf5", path: "/super-admin/finance?status=COMPLETED" },
        { label: "Monthly Revenue (MRR)", value: `₹${fmt(data?.monthlySubscriptionRevenue)}`, caption: "Monthly recurring turnover", icon: TrendingUp, color: "#4f46e5", bg: "#f5f3ff", path: "/super-admin/finance" },
        { label: "Pending Payments", value: `₹${fmt(data?.pendingSubscriptionRevenue)}`, caption: "Awaiting settlement", icon: Clock, color: "#f59e0b", bg: "#fffbeb", path: "/super-admin/finance?status=PENDING" },
        { label: "Active Subscriptions", value: data?.subscriptionStatusSummary?.active || 0, caption: "Current Active Plans", icon: CheckCircle, color: "#06b6d4", bg: "#ecfeff", path: "/super-admin/subscriptions?status=ACTIVE" }
      ];
    }

    if (canSeeSupport && !canSeeFinance && !canSeeSales && !canSeeSalons) {
      return [
        { label: "Open Tickets", value: data?.supportTicketsCount || 0, caption: "Open + In progress", icon: LifeBuoy, color: "#ec4899", bg: "#fdf2f8", path: "/super-admin/support-tickets?status=OPEN" },
        { label: "Urgent Tickets", value: data?.urgentTickets?.length || data?.attentionRequired?.urgentTickets?.length || 0, caption: "High Priority", icon: AlertTriangle, color: "#ef4444", bg: "#fef2f2", path: "/super-admin/support-tickets?priority=URGENT" },
        { label: "Product Requests", value: data?.pendingProductRequests || 0, caption: "Salon Feature Requests", icon: Layers, color: "#8b5cf6", bg: "#f5f3ff", path: "/super-admin/product-requests?status=PENDING" },
        { label: "Staff Requirements", value: data?.pendingStaffRequests || 0, caption: "Staff Hiring Requests", icon: UserPlus, color: "#06b6d4", bg: "#ecfeff", path: "/super-admin/staff-requests?status=OPEN" }
      ];
    }

    if (canSeeSales && !canSeeFinance && !canSeeSupport && !canSeeSalons) {
      return [
        { label: "Active Pipeline Leads", value: data?.activeDemoLeads ?? data?.demoLeadsCount ?? 0, caption: "In progress leads", icon: Sparkles, color: "#06b6d4", bg: "#ecfeff", path: "/super-admin/sales-pipeline" },
        { label: "Total Captured Leads", value: data?.demoLeadsCount || 0, caption: "Lifetime leads", icon: Building2, color: "#4f46e5", bg: "#f5f3ff", path: "/super-admin/sales-pipeline" },
        { label: "Converted Salons", value: data?.convertedLeadsCount || 0, caption: "Successfully closed", icon: CheckCircle, color: "#10b981", bg: "#ecfdf5", path: "/super-admin/sales-pipeline?status=CONVERTED" },
        { label: "Scheduled Demos", value: data?.upcomingDemosCount || 0, caption: "Upcoming product demos", icon: Clock, color: "#f59e0b", bg: "#fffbeb", path: "/super-admin/sales-pipeline?status=DEMO_SCHEDULED" }
      ];
    }

    if (canSeeSalons && !canSeeFinance && !canSeeSupport && !canSeeSales) {
      return [
        { label: "Total Salons", value: data?.totalSalons || 0, caption: "All registered salons", icon: Building2, color: "#4f46e5", bg: "#f5f3ff", path: "/super-admin/salons" },
        { label: "Active Salons", value: data?.activeSalons || 0, caption: "Operational salons", icon: CheckCircle, color: "#10b981", bg: "#ecfdf5", path: "/super-admin/salons?status=ACTIVE" },
        { label: "Trial Salons", value: data?.trialSalons || 0, caption: "Under trial onboarding", icon: Clock, color: "#f59e0b", bg: "#fffbeb", path: "/super-admin/salons?status=TRIAL" },
        { label: "Pending Requests", value: totalPendingRequests, caption: `${data?.pendingProductRequests || 0} prod + ${data?.pendingStaffRequests || 0} staff`, icon: AlertCircle, color: "#8b5cf6", bg: "#f5f3ff", path: "/super-admin/product-requests?status=PENDING" }
      ];
    }

    // Dynamic combination for custom cross-role permissions
    const list = [];
    if (canSeeSalons) {
      list.push({ label: "Total Salons", value: data?.totalSalons || 0, caption: "All salons", icon: Building2, color: "#4f46e5", bg: "#f5f3ff", path: "/super-admin/salons" });
      list.push({ label: "Active Salons", value: data?.activeSalons || 0, caption: "Operational", icon: CheckCircle, color: "#10b981", bg: "#ecfdf5", path: "/super-admin/salons?status=ACTIVE" });
    }
    if (canSeeFinance) {
      list.push({ label: "Collected Revenue", value: `₹${fmt(data?.totalSubscriptionRevenue)}`, caption: "Subscriptions", icon: IndianRupee, color: "#10b981", bg: "#ecfdf5", path: "/super-admin/finance?status=COMPLETED" });
      list.push({ label: "Monthly Revenue", value: `₹${fmt(data?.monthlySubscriptionRevenue)}`, caption: "MRR", icon: TrendingUp, color: "#4f46e5", bg: "#f5f3ff", path: "/super-admin/finance" });
    }
    if (canSeeSales && list.length < 6) {
      list.push({ label: "Pipeline Leads", value: data?.activeDemoLeads ?? data?.demoLeadsCount ?? 0, caption: "Active leads", icon: Sparkles, color: "#06b6d4", bg: "#ecfeff", path: "/super-admin/sales-pipeline" });
    }
    if (canSeeSupport && list.length < 6) {
      list.push({ label: "Open Tickets", value: data?.supportTicketsCount || 0, caption: "Open helpdesk tickets", icon: LifeBuoy, color: "#ec4899", bg: "#fdf2f8", path: "/super-admin/support-tickets?status=OPEN" });
    }
    if (canSeeRequests && list.length < 6) {
      list.push({ label: "Pending Requests", value: totalPendingRequests, caption: `${data?.pendingProductRequests || 0} prod + ${data?.pendingStaffRequests || 0} staff`, icon: AlertCircle, color: "#8b5cf6", bg: "#f5f3ff", path: "/super-admin/product-requests?status=PENDING" });
    }

    return list.slice(0, 6);
  }, [isSuperAdmin, canSeeFinance, canSeeSupport, canSeeSales, canSeeSalons, canSeeRequests, data, totalPendingRequests]);

  const periodOptions = [
    { value: "lifetime", label: "Lifetime" },
    { value: "today", label: "Today" },
    { value: "month", label: "This Month" },
    { value: "custom", label: "Custom" }
  ];

  if (error) {
    return (
      <div className="page-shell">
        <div className="panel-card" style={{ maxWidth: 600, margin: "40px auto", textAlign: "center" }}>
          <h2 style={{ color: "#dc2626" }}>Dashboard Error</h2>
          <p style={{ color: "#64748b" }}>{error}</p>
          <button type="button" onClick={fetchDashboard} style={{ marginTop: 16 }}>Retry</button>
        </div>
      </div>
    );
  }

  if (!data) return <div className="page-shell"><PageLoader title="Loading dashboard" message="Fetching stats..." /></div>;

  const plans = data.activePlansSummary || [];
  const salons = data.recentSalons || [];
  const payments = data.recentPayments || [];
  const subStatus = data.subscriptionStatusSummary || {};
  const recentLeads = data.recentLeads || [];
  const recentTickets = data.recentTickets || [];
  const urgentTicketsList = data.attentionRequired?.urgentTickets || [];
  const pendingProductList = data.recentProductRequestsList || [];
  const pendingStaffList = data.recentStaffRequestsList || [];

  // Page Subtitles according to active capabilities
  const dashboardTitle = isSuperAdmin
    ? "Dashboard"
    : canSeeSupport && !canSeeFinance && !canSeeSales && !canSeeSalons
    ? "Support & Helpdesk Dashboard"
    : canSeeFinance && !canSeeSupport && !canSeeSales && !canSeeSalons
    ? "Financial & Billing Dashboard"
    : canSeeSales && !canSeeFinance && !canSeeSupport && !canSeeSalons
    ? "Sales CRM & Pipeline Dashboard"
    : canSeeSalons && !canSeeFinance && !canSeeSupport && !canSeeSales
    ? "Salon Operations & Onboarding Dashboard"
    : "Dashboard";

  const dashboardSubtitle = isSuperAdmin
    ? "Live SaaS overview for salons, subscriptions, leads, and support."
    : canSeeSupport && !canSeeFinance && !canSeeSales && !canSeeSalons
    ? "Live support tickets queue, issue resolution metrics, and salon requests."
    : canSeeFinance && !canSeeSupport && !canSeeSales && !canSeeSalons
    ? "Subscription revenue, collected payments, and subscription statuses."
    : canSeeSales && !canSeeFinance && !canSeeSupport && !canSeeSalons
    ? "Lead conversion, scheduled product demos, and pipeline health."
    : canSeeSalons && !canSeeFinance && !canSeeSupport && !canSeeSales
    ? "Salon onboarding lifecycle, operational statuses, and resource requests."
    : "Live SaaS overview for salons, subscriptions, leads, and support.";

  const hasAttentionItems = (
    (canSeeSupport && urgentTicketsList.length > 0) ||
    (canSeeSalons && (data.attentionRequired?.suspendedCount > 0)) ||
    (canSeeRequests && totalPendingRequests > 0) ||
    (canSeeFinance && ((data.attentionRequired?.pendingPayments?.length > 0) || (data.attentionRequired?.expiringSalons?.length > 0)))
  );

  return (
    <div className="page-shell super-admin-page">
      <style>{`
        .sa-date-filter-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          justify-content: flex-end;
        }
        .sa-date-pills {
          display: inline-flex !important;
          align-items: center !important;
          background: #f1f5f9 !important;
          padding: 3px !important;
          border-radius: 10px !important;
          border: 1px solid #e2e8f0 !important;
          gap: 3px !important;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.04) !important;
        }
        .sa-date-pill {
          padding: 5px 13px !important;
          border-radius: 7px !important;
          border: none !important;
          outline: none !important;
          background: transparent !important;
          color: #64748b !important;
          font-weight: 600 !important;
          font-size: 0.78rem !important;
          line-height: 1.2 !important;
          cursor: pointer !important;
          transition: all 0.16s ease !important;
          white-space: nowrap !important;
          box-shadow: none !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .sa-date-pill:hover:not(.active) {
          color: #0f172a !important;
          background: rgba(255, 255, 255, 0.7) !important;
        }
        .sa-date-pill.active {
          background: #ffffff !important;
          color: #4f46e5 !important;
          font-weight: 700 !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.05) !important;
        }
        .sa-custom-dates {
          display: inline-flex !important;
          gap: 6px !important;
          align-items: center !important;
          background: #f8fafc !important;
          padding: 3px 8px !important;
          border-radius: 8px !important;
          border: 1px solid #e2e8f0 !important;
        }
        .sa-date-to {
          color: #94a3b8 !important;
          font-size: 0.76rem !important;
          font-weight: 600 !important;
        }
        .sa-subs-status-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 10px;
          margin-bottom: 20px;
        }
        .sa-kpis-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 14px;
          margin-bottom: 28px;
        }
        @media (min-width: 960px) {
          .sa-kpis-container.cols-4 {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            gap: 14px !important;
          }
          .sa-kpis-container.cols-6 {
            grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
            gap: 12px !important;
          }
        }
        @media (max-width: 959px) and (min-width: 600px) {
          .sa-kpis-container {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 12px !important;
          }
        }
        @media (max-width: 599px) {
          .sa-kpis-container {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 8px !important;
          }
        }
        .sa-kpi-card {
          background: #ffffff;
          border: 1px solid #f1f5f9;
          border-radius: 14px;
          padding: 16px 14px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 10px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.02);
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          min-width: 0;
        }
        .sa-kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
          border-color: #cbd5e1;
        }
        .sa-kpi-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 4px;
        }
        .sa-kpi-label {
          color: #64748b;
          font-weight: 700;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sa-kpi-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sa-kpi-value {
          font-size: 1.55rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.1;
        }
        .sa-kpi-caption {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>

      {/* Header Banner */}
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div style={{ cursor: "pointer" }} onClick={() => navigate("/super-admin/dashboard")}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h1 style={{ marginTop: 0, marginBottom: 0 }}>{dashboardTitle}</h1>
              {!isSuperAdmin && auth?.user?.adminRole?.name && (
                <span style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", background: "#e0e7ff", color: "#4338ca", padding: "3px 10px", borderRadius: 100, border: "1px solid #c7d2fe" }}>
                  Role: {auth.user.adminRole.name}
                </span>
              )}
            </div>
            <p style={{ marginBottom: 0, marginTop: 4 }}>
              {dashboardSubtitle}
              {period !== "lifetime" && (
                <span style={{ marginLeft: 8, fontSize: "0.78rem", fontWeight: 700, color: "#4f46e5", background: "#eef2ff", padding: "2px 8px", borderRadius: 6 }}>
                  {period === "today" ? "Showing: Today" : period === "month" ? "Showing: This Month" : `Showing: ${dateFrom || "..."} to ${dateTo || "..."}`}
                </span>
              )}
            </p>
          </div>
          <div className="sa-date-filter-wrap">
            <div className="sa-date-pills">
              {periodOptions.map((opt) => {
                const isActive = period === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handlePeriodChange(opt.value)}
                    className={`sa-date-pill ${isActive ? "active" : ""}`}
                    style={{
                      background: isActive ? "#ffffff" : "transparent",
                      color: isActive ? "#4f46e5" : "#64748b",
                      border: "none",
                      outline: "none",
                      boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {period === "custom" && (
              <div className="sa-custom-dates" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "none", padding: 0 }}>
                <CustomDateInput
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="From date"
                  title="Start date"
                  max={dateTo || undefined}
                  style={{ height: 34, fontSize: "0.78rem", minWidth: 125, padding: "0 10px", borderRadius: 8 }}
                />
                <span className="sa-date-to" style={{ color: "#94a3b8", fontWeight: 700, fontSize: "0.8rem" }}>to</span>
                <CustomDateInput
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="To date"
                  title="End date"
                  min={dateFrom || undefined}
                  style={{ height: 34, fontSize: "0.78rem", minWidth: 125, padding: "0 10px", borderRadius: 8 }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ opacity: isFetching ? 0.6 : 1, transition: "opacity 0.2s ease" }}>

        {/* Attention Required Section - Segmented per capability */}
        {showAttention && hasAttentionItems ? (
          <div style={{ marginBottom: 28, background: "#ffffff", borderRadius: 16, padding: "20px 24px", border: "1px solid #fca5a5", boxShadow: "0 4px 20px rgba(239, 68, 68, 0.08)", position: "relative" }}>
            <button onClick={() => setShowAttention(false)} style={{ position: "absolute", top: 16, right: 16, background: "#fef2f2", border: "none", color: "#991b1b", cursor: "pointer", padding: 6, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}>
              <X size={16} />
            </button>
            
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(239, 68, 68, 0.3)", flexShrink: 0 }}>
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#7f1d1d" }}>Attention Required</h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#991b1b" }}>High priority operational items requiring immediate action</p>
              </div>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
              {canSeeSupport && urgentTicketsList.length > 0 && (
                <div style={{ background: "#fff1f2", borderRadius: 12, padding: 14, borderLeft: "4px solid #e11d48", border: "1px solid #ffe4e6" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#be123c", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Urgent Tickets ({urgentTicketsList.length})</div>
                  {urgentTicketsList.slice(0, 2).map((t) => (
                    <div key={t.id} onClick={() => navigate("/super-admin/support-tickets?priority=URGENT")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px dashed #fecdd3", cursor: "pointer" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.salon?.name || t.title || "Global"}</span>
                      <span style={{ fontSize: "0.65rem", color: "#fff", background: "#e11d48", padding: "2px 6px", borderRadius: 4, fontWeight: 800 }}>URGENT</span>
                    </div>
                  ))}
                </div>
              )}

              {canSeeSalons && (data.attentionRequired?.suspendedCount > 0) && (
                <div onClick={() => navigate("/super-admin/salons?status=SUSPENDED")} style={{ background: "#fef2f2", borderRadius: 12, padding: 14, borderLeft: "4px solid #ef4444", border: "1px solid #fee2e2", cursor: "pointer" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Suspended Salons</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#b91c1c", lineHeight: 1 }}>{data.attentionRequired.suspendedCount}</div>
                    <div style={{ fontSize: "0.8rem", color: "#991b1b", fontWeight: 700 }}>Review Salons →</div>
                  </div>
                </div>
              )}
              
              {canSeeRequests && totalPendingRequests > 0 && (
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: 14, borderLeft: "4px solid #8b5cf6", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#6d28d9", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Pending Approvals</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div onClick={() => navigate("/super-admin/product-requests?status=PENDING")} style={{ flex: 1, padding: "8px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", textAlign: "center" }}>
                      <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#7c3aed" }}>{data.attentionRequired?.pendingProductRequests || 0}</div>
                      <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Products</div>
                    </div>
                    <div onClick={() => navigate("/super-admin/staff-requests?status=OPEN")} style={{ flex: 1, padding: "8px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", textAlign: "center" }}>
                      <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#10b981" }}>{data.attentionRequired?.pendingStaffRequests || 0}</div>
                      <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Staff</div>
                    </div>
                  </div>
                </div>
              )}

              {canSeeFinance && (data.attentionRequired?.pendingPayments?.length > 0) && (
                <div 
                  onClick={() => navigate("/super-admin/finance?status=PENDING")}
                  style={{ background: "#fefce8", borderRadius: 12, padding: 14, borderLeft: "4px solid #eab308", border: "1px solid #fef08a", cursor: "pointer" }}
                >
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#a16207", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                    <span>Pending Payments ({data.attentionRequired.pendingPayments.length})</span>
                    <span>View Finance →</span>
                  </div>
                  {data.attentionRequired.pendingPayments.slice(0, 2).map((p) => (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px dashed #fde047" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.salon?.name || "Salon"}</span>
                      <span style={{ fontSize: "0.8rem", color: "#b45309", fontWeight: 800 }}>₹{fmt(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {canSeeFinance && (data.attentionRequired?.expiringSalons?.length > 0) && (
                <div style={{ background: "#fffaf0", borderRadius: 12, padding: 14, borderLeft: "4px solid #f59e0b", border: "1px solid #fef3c7" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Expiring Soon ({data.attentionRequired.expiringSalons.length})</div>
                  {data.attentionRequired.expiringSalons.slice(0, 2).map((s) => (
                    <div key={s.salonId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px dashed #fde68a" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.salonName}</span>
                      <span style={{ fontSize: "0.75rem", color: "#b45309", fontWeight: 700, background: "#fef3c7", padding: "2px 6px", borderRadius: 12 }}>{new Date(s.endsAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
                    </div>
                  ))}
                  {data.attentionRequired.expiringSalons.length > 2 && (
                    <div style={{ paddingTop: 8, textAlign: "center" }}>
                      <Link to="/super-admin/subscriptions" style={{ fontSize: "0.75rem", color: "#d97706", fontWeight: 700, textDecoration: "none" }}>View All +{data.attentionRequired.expiringSalons.length - 2}</Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* KPI Health Cards Grid */}
        <div className={`sa-kpis-container ${healthCards.length <= 4 ? "cols-4" : "cols-6"}`}>
          {healthCards.map((card) => {
            const Icon = card.icon;
            return (
              <div 
                key={card.label} 
                className="sa-kpi-card" 
                onClick={() => navigate(card.path)}
                title={card.label}
              >
                <div className="sa-kpi-header">
                  <span className="sa-kpi-label">{card.label}</span>
                  <div className="sa-kpi-icon" style={{ background: card.bg, color: card.color }}>
                    <Icon size={16} />
                  </div>
                </div>
                <div>
                  <div className="sa-kpi-value">{card.value}</div>
                  <div className="sa-kpi-caption" title={card.caption}>{card.caption}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* SECTION: FINANCE & BILLING */}
        {canSeeFinance && (
          <div className="two-col" style={{ marginBottom: 20 }}>
            <div className="panel-card dashboard-section" style={{ padding: 28, background: "white", borderRadius: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Revenue</h3>
                <Link to="/super-admin/finance" style={{ fontSize: "0.75rem", fontWeight: 700, color: "#4f46e5", textDecoration: "none" }}>View Finance →</Link>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
                <div 
                  onClick={() => navigate("/super-admin/finance?paymentFor=Subscription")}
                  style={{ background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)", borderRadius: 16, padding: "20px 16px", color: "white", boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)", position: "relative", overflow: "hidden", cursor: "pointer" }}
                >
                  <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, background: "rgba(255,255,255,0.1)", borderRadius: "50%" }}></div>
                  <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.9)", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                    <TrendingUp size={16} /> MRR
                  </span>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: 12, letterSpacing: "-0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={`₹${fmt(data.monthlySubscriptionRevenue)}`}>
                    ₹{fmt(data.monthlySubscriptionRevenue)}
                  </div>
                </div>
                <div 
                  onClick={() => navigate("/super-admin/finance?status=COMPLETED")}
                  style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", borderRadius: 16, padding: "20px 16px", color: "white", boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.4)", position: "relative", overflow: "hidden", cursor: "pointer" }}
                >
                  <div style={{ position: "absolute", bottom: -20, right: -10, width: 80, height: 80, background: "rgba(255,255,255,0.15)", borderRadius: "50%" }}></div>
                  <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.9)", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                    <IndianRupee size={16} /> Collected
                  </span>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: 12, letterSpacing: "-0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={`₹${fmt(data.totalSubscriptionRevenue)}`}>
                    ₹{fmt(data.totalSubscriptionRevenue)}
                  </div>
                </div>
                <div 
                  onClick={() => navigate("/super-admin/finance?status=PENDING")}
                  style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", borderRadius: 16, padding: "20px 16px", color: "white", boxShadow: "0 10px 25px -5px rgba(245, 158, 11, 0.4)", position: "relative", overflow: "hidden", cursor: "pointer" }}
                >
                  <div style={{ position: "absolute", bottom: -20, right: -10, width: 80, height: 80, background: "rgba(255,255,255,0.15)", borderRadius: "50%" }}></div>
                  <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.9)", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                    <Clock size={16} /> Pending
                  </span>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: 12, letterSpacing: "-0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={`₹${fmt(data.pendingSubscriptionRevenue)}`}>
                    ₹{fmt(data.pendingSubscriptionRevenue)}
                  </div>
                </div>
              </div>
            </div>

            {/* Subscriptions Status & Active Plans */}
            <div className="panel-card dashboard-section" style={{ padding: 28, background: "white", borderRadius: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Subscriptions</h3>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#10b981", background: "#ecfdf5", padding: "4px 10px", borderRadius: 100 }}>{plans.length} Plans</span>
              </div>
              <div className="sa-subs-status-grid">
                <div onClick={() => navigate("/super-admin/subscriptions?status=ACTIVE")} style={{ background: "#ecfdf5", borderRadius: 12, padding: "14px", textAlign: "center", cursor: "pointer", border: "1px solid #a7f3d0" }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#065f46" }}>{subStatus.active ?? 0}</div>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#047857", textTransform: "uppercase" }}>Active</div>
                </div>
                <div onClick={() => navigate("/super-admin/subscriptions?status=TRIAL")} style={{ background: "#fffbeb", borderRadius: 12, padding: "14px", textAlign: "center", cursor: "pointer", border: "1px solid #fde68a" }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#92400e" }}>{subStatus.trial ?? 0}</div>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#b45309", textTransform: "uppercase" }}>Trial</div>
                </div>
                <div onClick={() => navigate("/super-admin/subscriptions?status=EXPIRING_SOON")} style={{ background: "#fff7ed", borderRadius: 12, padding: "14px", textAlign: "center", cursor: "pointer", border: "1px solid #fed7aa" }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#9a3412" }}>{subStatus.expiringSoon ?? 0}</div>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#c2410c", textTransform: "uppercase" }}>Expiring Soon</div>
                </div>
                <div onClick={() => navigate("/super-admin/subscriptions?status=EXPIRED")} style={{ background: "#fef2f2", borderRadius: 12, padding: "14px", textAlign: "center", cursor: "pointer", border: "1px solid #fecaca" }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#991b1b" }}>{subStatus.expired ?? 0}</div>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#b91c1c", textTransform: "uppercase" }}>Expired</div>
                </div>
              </div>

              <div className="custom-scrollbar" style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: "300px", overflowY: "auto", paddingRight: 8 }}>
                {plans.length ? plans.map((plan) => (
                  <div key={plan.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                    <div>
                      <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>{plan.name}</div>
                      <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 2 }}>{plan.isCustom ? "Custom Tier" : "Standard Tier"}</div>
                    </div>
                    <div style={{ display: "flex", gap: 12, textAlign: "right" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#10b981" }}>{plan.activeCount}</div>
                        <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Active</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#f59e0b" }}>{plan.trialCount}</div>
                        <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Trial</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#c2410c" }}>{plan.expiringCount}</div>
                        <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Expiring</div>
                      </div>
                    </div>
                  </div>
                )) : <EmptyState title="No active plans" message="Create plans to see them here." />}
              </div>
            </div>
          </div>
        )}

        {/* SECTION: SALONS & LEADS / CRM */}
        {(canSeeSalons || canSeeSales) && (
          <div className="two-col" style={{ marginBottom: 20 }}>
            {canSeeSalons && (
              <div className="panel-card dashboard-section" style={{ padding: 28, background: "white", borderRadius: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Recent Salons</h3>
                  <Link to="/super-admin/salons" style={{ fontSize: "0.8rem", fontWeight: 700, color: "#4f46e5", textDecoration: "none" }}>View All →</Link>
                </div>
                <div className="custom-scrollbar" style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: "500px", overflowY: "auto", paddingRight: 8 }}>
                  {salons.length ? salons.map((salon) => (
                    <div key={salon.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.9rem" }}>
                          {(salon.name || "S").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 750, color: "#0f172a", fontSize: "0.95rem" }}>{salon.name}</div>
                          <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 2 }}>{salon.slug}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: "0.7rem", fontWeight: 750, color: salon.status === "ACTIVE" ? "#065f46" : salon.status === "TRIAL" ? "#92400e" : "#991b1b", background: salon.status === "ACTIVE" ? "#d1fae5" : salon.status === "TRIAL" ? "#fef3c7" : "#fee2e2", padding: "4px 10px", borderRadius: 100, textTransform: "uppercase" }}>
                        {salon.status}
                      </span>
                    </div>
                  )) : <EmptyState title="No recent salons" message="New signups appear here." />}
                </div>
              </div>
            )}

            {canSeeSales && (
              <div className="panel-card dashboard-section" style={{ padding: 28, background: "white", borderRadius: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Recent Pipeline Leads</h3>
                  <Link to="/super-admin/sales-pipeline" style={{ fontSize: "0.8rem", fontWeight: 700, color: "#4f46e5", textDecoration: "none" }}>Open CRM →</Link>
                </div>
                <div className="custom-scrollbar" style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: "500px", overflowY: "auto", paddingRight: 8 }}>
                  {recentLeads.length ? recentLeads.map((lead) => (
                    <div 
                      key={lead.id} 
                      onClick={() => navigate(`/super-admin/sales-pipeline?leadId=${lead.id}`)}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9", cursor: "pointer", transition: "all 0.2s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#f1f5f9"; e.currentTarget.style.transform = "none"; }}
                    >
                      <div style={{ minWidth: 0, flex: 1, paddingRight: 10 }}>
                        <div style={{ fontWeight: 750, color: "#0f172a", fontSize: "0.95rem" }}>{lead.company || lead.name || "Sales Lead"}</div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 2 }}>{lead.name} • {lead.phone || lead.email || "No contact"}</div>
                      </div>
                      <div>
                        <span style={{ 
                          fontSize: "0.7rem", 
                          fontWeight: 800, 
                          color: lead.status === "CONVERTED" ? "#065f46" : lead.status === "DEMO_SCHEDULED" ? "#92400e" : "#4338ca", 
                          background: lead.status === "CONVERTED" ? "#d1fae5" : lead.status === "DEMO_SCHEDULED" ? "#fef3c7" : "#e0e7ff", 
                          padding: "4px 10px", 
                          borderRadius: 100,
                          textTransform: "uppercase" 
                        }}>
                          {lead.status?.replace(/_/g, " ") || "NEW"}
                        </span>
                      </div>
                    </div>
                  )) : <EmptyState title="No active leads" message="Captured sales demo leads appear here." />}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION: SUPPORT TICKETS & RESOURCE REQUESTS */}
        {(canSeeSupport || canSeeRequests) && (
          <div className="two-col" style={{ marginBottom: 20 }}>
            {canSeeSupport && (
              <div className="panel-card dashboard-section" style={{ padding: 28, background: "white", borderRadius: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Support Tickets Queue</h3>
                  <Link to="/super-admin/support-tickets" style={{ fontSize: "0.8rem", fontWeight: 700, color: "#4f46e5", textDecoration: "none" }}>Open Helpdesk →</Link>
                </div>
                <div className="custom-scrollbar" style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: "500px", overflowY: "auto", paddingRight: 8 }}>
                  {recentTickets.length ? recentTickets.map((t) => (
                    <div 
                      key={t.id} 
                      onClick={() => navigate(`/super-admin/support-tickets?ticketId=${t.id}`)}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9", transition: "all 0.2s", cursor: "pointer" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#f1f5f9"; e.currentTarget.style.transform = "none"; }}
                    >
                      <div style={{ minWidth: 0, flex: 1, paddingRight: 12 }}>
                        <div style={{ fontWeight: 750, color: "#0f172a", fontSize: "0.95rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title || "Support Request"}</div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 2 }}>{t.salon?.name || "Global / Account"} • {new Date(t.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <span style={{ 
                          fontSize: "0.68rem", 
                          fontWeight: 800, 
                          color: t.priority === "URGENT" ? "#be123c" : t.priority === "HIGH" ? "#b45309" : "#4338ca", 
                          background: t.priority === "URGENT" ? "#ffe4e6" : t.priority === "HIGH" ? "#fef3c7" : "#e0e7ff", 
                          padding: "3px 8px", 
                          borderRadius: 6,
                          textTransform: "uppercase" 
                        }}>
                          {t.priority || "NORMAL"}
                        </span>
                        <span style={{ 
                          fontSize: "0.68rem", 
                          fontWeight: 800, 
                          color: t.status === "OPEN" ? "#065f46" : "#475569", 
                          background: t.status === "OPEN" ? "#d1fae5" : "#f1f5f9", 
                          padding: "3px 8px", 
                          borderRadius: 6,
                          textTransform: "uppercase" 
                        }}>
                          {t.status || "OPEN"}
                        </span>
                      </div>
                    </div>
                  )) : <EmptyState title="No active tickets" message="Support tickets from salons appear here." />}
                </div>
              </div>
            )}

            {canSeeRequests && (
              <div className="panel-card dashboard-section" style={{ padding: 28, background: "white", borderRadius: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Resource Requests Queue</h3>
                  <Link to="/super-admin/product-requests" style={{ fontSize: "0.8rem", fontWeight: 700, color: "#4f46e5", textDecoration: "none" }}>View All →</Link>
                </div>
                <div className="custom-scrollbar" style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: "500px", overflowY: "auto", paddingRight: 8 }}>
                  {pendingProductList.concat(pendingStaffList).length ? (
                    <>
                      {pendingProductList.map((pr) => (
                        <div key={pr.id} onClick={() => navigate("/super-admin/product-requests")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9", cursor: "pointer" }}>
                          <div>
                            <div style={{ fontWeight: 750, color: "#0f172a", fontSize: "0.92rem" }}>📦 Product: {pr.productName || "New Requirement"}</div>
                            <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 2 }}>{pr.salon?.name || "Salon"} • {pr.brand || "Standard"}</div>
                          </div>
                          <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#6d28d9", background: "#f5f3ff", padding: "3px 8px", borderRadius: 6, textTransform: "uppercase" }}>{pr.status || "PENDING"}</span>
                        </div>
                      ))}
                      {pendingStaffList.map((sr) => (
                        <div key={sr.id} onClick={() => navigate("/super-admin/staff-requests")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9", cursor: "pointer" }}>
                          <div>
                            <div style={{ fontWeight: 750, color: "#0f172a", fontSize: "0.92rem" }}>👥 Staff: {sr.roleNeeded || sr.role || "Staff Requirement"}</div>
                            <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 2 }}>{sr.salon?.name || "Salon"} • Exp: {sr.experienceYears || "1"} yrs</div>
                          </div>
                          <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#047857", background: "#ecfdf5", padding: "3px 8px", borderRadius: 6, textTransform: "uppercase" }}>{sr.status || "OPEN"}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <EmptyState title="No pending requests" message="Product and staff requirements will appear here." />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION: PAYMENTS & ACTIVITY LEDGER */}
        {(canSeeFinance || canSeeActivity) && (
          <div className="two-col" style={{ marginBottom: 20 }}>
            {canSeeFinance && (
              <div className="panel-card dashboard-section" style={{ padding: 28, background: "white", borderRadius: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Recent Payments</h3>
                  <Link to="/super-admin/finance" style={{ fontSize: "0.8rem", fontWeight: 700, color: "#4f46e5", textDecoration: "none" }}>View All →</Link>
                </div>
                <div className="custom-scrollbar" style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: "500px", overflowY: "auto", paddingRight: 8 }}>
                  {payments.length ? payments.map((payment) => (
                    <div key={payment.id} onClick={() => navigate(payment.salonId ? `/super-admin/finance?salonId=${payment.salonId}` : "/super-admin/finance")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9", cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: (payment.mode || "Payment").toUpperCase() === "CASH" ? "#fef3c7" : "#dbeafe", color: (payment.mode || "Payment").toUpperCase() === "CASH" ? "#d97706" : "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.8rem", textTransform: "uppercase" }}>
                          {(payment.mode || "Pay").substring(0, 3)}
                        </div>
                        <div style={{ minWidth: 0, overflow: "hidden" }}>
                          <div style={{ fontWeight: 750, color: "#0f172a", fontSize: "0.95rem" }}>{payment.mode || "Payment Method"}</div>
                          <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 2 }}>{payment.salonName || "Successful Transaction"}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 850, color: "#059669", whiteSpace: "nowrap", flexShrink: 0 }}>+ ₹{fmt(payment.amount)}</div>
                    </div>
                  )) : <EmptyState title="No recent payments" message="Payment entries appear here." />}
                </div>
              </div>
            )}

            {canSeeActivity && (
              <div className="panel-card dashboard-section" style={{ padding: 28, background: "white", borderRadius: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Recent Activity</h3>
                  <Link to="/super-admin/audit-logs" style={{ fontSize: "0.8rem", fontWeight: 700, color: "#4f46e5", textDecoration: "none" }}>Audit Log →</Link>
                </div>
                <div className="custom-scrollbar" style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: "500px", overflowY: "auto", paddingRight: 8 }}>
                  {data.recentActivity?.length ? data.recentActivity.map((log) => (
                    <div key={log.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flex: 1, minWidth: 0 }}>
                        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#f5f3ff", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Activity size={18} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 750, color: "#0f172a", fontSize: "0.95rem", textTransform: "capitalize" }}>
                            {log.action ? log.action.toLowerCase().replace(/_/g, ' ') : "Activity"}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.4 }}>
                            {log.summary || log.module}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", flexShrink: 0, marginLeft: 12, marginTop: 4 }}>
                        {new Date(log.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  )) : <EmptyState title="No activity" message="System events appear here." />}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Floating "+" Quick Action FAB Button - Dynamic for user's role */}
      <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999 }}>
        {showFabMenu && (
          <div style={{ position: "absolute", bottom: 64, right: 0, background: "#ffffff", borderRadius: 16, boxShadow: "0 12px 32px rgba(0,0,0,0.15)", border: "1px solid #e2e8f0", padding: "10px 0", minWidth: 210, display: "flex", flexDirection: "column", gap: 2, animation: "fadeIn 0.2s ease-out" }}>
            <div style={{ padding: "6px 16px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Quick Actions</div>
            
            {canSeeSalons && (
              <button 
                onClick={() => { setShowFabMenu(false); navigate("/super-admin/salons?action=new"); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", border: "none", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#1e293b", textAlign: "left", width: "100%", transition: "background 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <Building2 size={16} color="#2563eb" /> Add Salon
              </button>
            )}

            {canSeeSales && (
              <button 
                onClick={() => { setShowFabMenu(false); navigate("/super-admin/sales-pipeline?action=new"); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", border: "none", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#1e293b", textAlign: "left", width: "100%", transition: "background 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <UserPlus size={16} color="#10b981" /> Add Lead
              </button>
            )}

            {canSeeSupport && (
              <button 
                onClick={() => { setShowFabMenu(false); navigate("/super-admin/support-tickets?action=new"); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", border: "none", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#1e293b", textAlign: "left", width: "100%", transition: "background 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <Ticket size={16} color="#ec4899" /> Create Ticket
              </button>
            )}

            {canSeeFinance && (
              <button 
                onClick={() => { setShowFabMenu(false); navigate("/super-admin/finance"); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", border: "none", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#1e293b", textAlign: "left", width: "100%", transition: "background 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <IndianRupee size={16} color="#059669" /> View Finance
              </button>
            )}

            {(isSuperAdmin || permissions.includes("plans")) && (
              <button 
                onClick={() => { setShowFabMenu(false); navigate("/super-admin/plans?action=new"); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", border: "none", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#1e293b", textAlign: "left", width: "100%", transition: "background 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <FileText size={16} color="#8b5cf6" /> Create Plan
              </button>
            )}
          </div>
        )}
        <button
          onClick={() => setShowFabMenu(!showFabMenu)}
          style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#ffffff", border: "none", boxShadow: "0 8px 24px rgba(37, 99, 235, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s ease" }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.06)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          title="Quick Actions"
        >
          {showFabMenu ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>
    </div>
  );
}
