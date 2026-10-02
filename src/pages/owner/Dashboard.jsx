import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import { useBranch } from '../../context/BranchContext';
import {
  TrendingUp, Users, CreditCard, Scissors, Receipt, Calendar, MessageSquare,
  AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Activity,
  Wallet, UserPlus, AlertCircle, Package, UserCheck, Plus, X, ArrowUpRight, ArrowDownRight, RefreshCw, Layers, CheckCircle2
} from "lucide-react";
import "./Dashboard.css";

function PaginatedList({ items = [], renderItem, emptyState, title, badge, icon: Icon }) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(items.length / itemsPerPage);
  
  const currentItems = items.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "22px", background: "#fff", borderRadius: "16px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0,0,0,0.02)", border: "1px solid #f1f5f9", flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {Icon && <div style={{ background: "#f8fafc", padding: 9, borderRadius: 10, color: "var(--accent)" }}><Icon size={18} /></div>}
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>{title}</h3>
        </div>
        {badge && <span style={{ background: "#f8fafc", color: "#475569", padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, border: "1px solid #e2e8f0" }}>{badge}</span>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {currentItems.length > 0 ? currentItems.map(renderItem) : emptyState}
      </div>
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
          <button 
            type="button" 
            style={{ padding: '6px 14px', fontSize: "0.8rem", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", color: page === 1 ? "#94a3b8" : "#475569", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, transition: "all 0.2s" }}
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft size={15} /> Prev
          </button>
          <span style={{ fontSize: "0.8rem", color: '#64748b', fontWeight: 600 }}>Page {page} of {totalPages}</span>
          <button 
            type="button" 
            style={{ padding: '6px 14px', fontSize: "0.8rem", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: page === totalPages ? "not-allowed" : "pointer", color: page === totalPages ? "#94a3b8" : "#475569", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, transition: "all 0.2s" }}
            disabled={page === totalPages} 
            onClick={() => setPage(p => p + 1)}
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function OwnerDashboard() {
  const { selectedBranchId, selectedBranchName } = useBranch();
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  const [stockPage, setStockPage] = useState(1);
  const stockPerPage = 5;

  // Inbox (Petty Cash Register) states
  const [isInboxModalOpen, setIsInboxModalOpen] = useState(false);
  const [inboxDate, setInboxDate] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxTransactions, setInboxTransactions] = useState([]);
  const [inboxSummary, setInboxSummary] = useState({ totalIn: 0, totalOut: 0, netBalance: 0, countIn: 0, countOut: 0 });
  const [inboxCategories, setInboxCategories] = useState([]);
  const [showQuickExpense, setShowQuickExpense] = useState(false);
  const [quickForm, setQuickForm] = useState({ title: "", amount: "", categoryId: "", notes: "" });
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickError, setQuickError] = useState("");
  const [quickSuccess, setQuickSuccess] = useState("");

  const fetchInboxData = useCallback(async (targetDate = inboxDate) => {
    setInboxLoading(true);
    setQuickError("");
    try {
      const branchParams = selectedBranchId ? { branchId: selectedBranchId } : {};
      const [expRes, payRes, catRes] = await Promise.all([
        api.get("/owner/expenses", { params: branchParams }).catch(() => ({ data: [] })),
        api.get("/owner/payments", { params: branchParams }).catch(() => ({ data: [] })),
        api.get("/owner/expense-categories", { params: branchParams }).catch(() => ({ data: [] }))
      ]);

      const expenses = Array.isArray(expRes.data) ? expRes.data : (expRes.data?.data || []);
      const payments = Array.isArray(payRes.data) ? payRes.data : (payRes.data?.data || []);
      const categories = Array.isArray(catRes.data) ? catRes.data : (catRes.data?.data || []);
      setInboxCategories(categories);

      // Filter for target date
      // Cash Inflows: payments with mode === 'CASH' on targetDate
      const dateInflows = payments.filter((p) => {
        if (!p.createdAt) return false;
        const pDate = p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : "";
        const mode = String(p.mode || "").toUpperCase();
        return pDate === targetDate && (mode === "CASH" || mode === "");
      }).map((p) => ({
        id: `pay-${p.id}`,
        type: "INFLOW",
        title: `Cash Sale - ${p.invoice?.invoiceNumber || "Invoice"}`,
        subtitle: p.invoice?.customer?.name ? `Customer: ${p.invoice.customer.name}` : (p.notes || "Cash Collection"),
        amount: Number(p.amount || 0),
        time: p.createdAt ? new Date(p.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
        timestamp: new Date(p.createdAt).getTime(),
        raw: p
      }));

      // Cash Outflows: expenses with paymentMode === 'CASH' on targetDate
      const dateOutflows = expenses.filter((e) => {
        if (!e.expenseDate) return false;
        const eDate = e.expenseDate ? new Date(e.expenseDate).toISOString().slice(0, 10) : (e.createdAt ? new Date(e.createdAt).toISOString().slice(0, 10) : "");
        const mode = String(e.paymentMode || "").toUpperCase();
        return eDate === targetDate && (mode === "CASH" || !mode || mode === "NULL");
      }).map((e) => ({
        id: `exp-${e.id}`,
        type: "OUTFLOW",
        title: e.title || "Cash Expense",
        subtitle: e.category?.name ? `Category: ${e.category.name}` : (e.notes || "Petty Cash Expense"),
        amount: Number(e.amount || 0),
        time: e.expenseDate ? new Date(e.expenseDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
        timestamp: new Date(e.expenseDate).getTime(),
        raw: e
      }));

      const totalIn = dateInflows.reduce((sum, item) => sum + item.amount, 0);
      const totalOut = dateOutflows.reduce((sum, item) => sum + item.amount, 0);
      const netBalance = totalIn - totalOut;

      const combined = [...dateInflows, ...dateOutflows].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      setInboxTransactions(combined);
      setInboxSummary({
        totalIn,
        totalOut,
        netBalance,
        countIn: dateInflows.length,
        countOut: dateOutflows.length
      });
    } catch (err) {
      console.error("Failed to load inbox data", err);
    } finally {
      setInboxLoading(false);
    }
  }, [inboxDate, selectedBranchId]);

  useEffect(() => {
    if (isInboxModalOpen) {
      fetchInboxData(inboxDate);
    }
  }, [isInboxModalOpen, inboxDate, fetchInboxData]);

  const handleAddQuickExpense = async (e) => {
    e.preventDefault();
    if (!quickForm.title.trim() || !quickForm.amount || Number(quickForm.amount) <= 0) {
      setQuickError("Please provide a valid expense title and amount.");
      return;
    }
    setQuickSubmitting(true);
    setQuickError("");
    setQuickSuccess("");
    try {
      await api.post("/owner/expenses", {
        title: quickForm.title.trim(),
        amount: Number(quickForm.amount),
        categoryId: quickForm.categoryId || (inboxCategories[0]?.id || null),
        branchId: selectedBranchId || null,
        expenseDate: new Date(inboxDate + "T12:00:00").toISOString(),
        paymentMode: "CASH",
        status: "APPROVED",
        notes: quickForm.notes?.trim() || "Recorded from Inbox Petty Cash"
      });

      setQuickForm({ title: "", amount: "", categoryId: "", notes: "" });
      setShowQuickExpense(false);
      setQuickSuccess("Petty cash expense recorded successfully!");
      setTimeout(() => setQuickSuccess(""), 4000);
      await fetchInboxData(inboxDate);

      // Refresh main dashboard
      if (selectedBranchId) {
        api.get("/owner/dashboard", { params: { branchId: selectedBranchId } }).then((res) => {
          setData(res.data);
        }).catch(() => {});
      }
    } catch (err) {
      setQuickError(err.response?.data?.message || "Failed to record cash expense.");
    } finally {
      setQuickSubmitting(false);
    }
  };

  const shiftInboxDate = (days) => {
    const current = new Date(inboxDate + "T00:00:00");
    current.setDate(current.getDate() + days);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, "0");
    const dd = String(current.getDate()).padStart(2, "0");
    setInboxDate(`${yyyy}-${mm}-${dd}`);
  };

  const [followUpsCount, setFollowUpsCount] = useState(0);

  useEffect(() => {
    let active = true;
    if (!selectedBranchId) {
      setData(null);
      setFollowUpsCount(0);
      return;
    }
    const params = { branchId: selectedBranchId };
    Promise.all([
      api.get("/owner/dashboard", { params }),
      api.get("/owner/enquiries/follow-ups", { params }).catch(() => ({ data: [] }))
    ]).then(([dashRes, fRes]) => {
      if (!active) return;
      setData(dashRes.data);
      setFollowUpsCount(fRes.data?.length || 0);
    }).catch(() => {
      if (!active) return;
      setData({});
      setFollowUpsCount(0);
    });

    return () => { active = false; };
  }, [selectedBranchId]);

  const branchName = selectedBranchName;

  if (!data) {
    return (
      <div className="page-shell">
        <PageLoader title="Loading Owner Dashboard" message="Pulling sales, customers, payments, and branch activity into one view." />
      </div>
    );
  }

  const lowStockItems = data.lowStockProducts || [];
  const totalStockPages = Math.ceil(lowStockItems.length / stockPerPage);
  const currentStockItems = lowStockItems.slice((stockPage - 1) * stockPerPage, stockPage * stockPerPage);

  const formatMoney = (val) =>
    Number(val || 0).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

  // 10 KPI Cards requested by salon owners
  const kpiStats = [
    {
      label: "Today’s Sales",
      value: formatMoney(data.todaySales),
      subtitle: "Billed today",
      icon: TrendingUp,
      color: "#10b981",
      bg: "#ecfdf5",
      border: "#a7f3d0",
      onClick: () => navigate("/admin/reports")
    },
    {
      label: "This Month’s Sales",
      value: formatMoney(data.monthlySales),
      subtitle: "Month to date",
      icon: Wallet,
      color: "#2563eb",
      bg: "#eff6ff",
      border: "#bfdbfe",
      onClick: () => navigate("/admin/reports")
    },
    {
      label: "Today’s Customers",
      value: data.todayCustomers ?? 0,
      subtitle: `CRM: ${data.customers ?? 0} total`,
      icon: Users,
      color: "#8b5cf6",
      bg: "#f5f3ff",
      border: "#ddd6fe",
      onClick: () => navigate("/admin/customers")
    },
    {
      label: "Total Staff",
      value: data.totalStaff ?? data.users ?? 0,
      subtitle: "Active members",
      icon: UserCheck,
      color: "#f59e0b",
      bg: "#fffbeb",
      border: "#fde68a",
      onClick: () => navigate("/admin/users")
    },
    {
      label: "Services Completed",
      value: data.servicesCompleted ?? 0,
      subtitle: `${data.services ?? 0} catalog services`,
      icon: CheckCircle,
      color: "#059669",
      bg: "#ecfdf5",
      border: "#a7f3d0",
      onClick: () => navigate("/admin/appointments")
    },
    {
      label: "Invoices",
      value: data.invoices ?? 0,
      subtitle: "Total bills created",
      icon: Receipt,
      color: "#6366f1",
      bg: "#eef2ff",
      border: "#c7d2fe",
      onClick: () => navigate("/admin/invoices")
    },
    {
      label: "Paid Revenue",
      value: formatMoney(data.paymentSummary?.totalPaid),
      subtitle: "Total collected",
      icon: CreditCard,
      color: "#0d9488",
      bg: "#f0fdfa",
      border: "#99f6e4",
      onClick: () => navigate("/admin/payments")
    },
    {
      label: "Pending Dues",
      value: formatMoney(data.paymentSummary?.totalDue),
      subtitle: "Unpaid balance",
      icon: AlertCircle,
      color: "#ef4444",
      bg: "#fef2f2",
      border: "#fecaca",
      onClick: () => navigate("/admin/invoices")
    },
    {
      label: "Today’s Appointments",
      value: data.todayAppointments ?? 0,
      subtitle: `Upcoming: ${data.upcomingAppointments ?? 0}`,
      icon: Calendar,
      color: "#7c3aed",
      bg: "#f5f3ff",
      border: "#ddd6fe",
      onClick: () => navigate("/admin/appointments")
    },
    {
      label: "Inventory Health",
      value: (data.lowStockAlertCount ?? 0) > 0 ? `${data.lowStockAlertCount} Low` : "Healthy",
      subtitle: `${data.totalProducts ?? 0} items tracked`,
      icon: (data.lowStockAlertCount ?? 0) > 0 ? AlertTriangle : Package,
      color: (data.lowStockAlertCount ?? 0) > 0 ? "#ea580c" : "#10b981",
      bg: (data.lowStockAlertCount ?? 0) > 0 ? "#fff7ed" : "#ecfdf5",
      border: (data.lowStockAlertCount ?? 0) > 0 ? "#fed7aa" : "#a7f3d0",
      onClick: () => navigate("/admin/inventory")
    }
  ];

  const todayOverview = data.todayOverview || {
    totalSales: data.todaySales || 0,
    services: 0,
    products: 0,
    expenses: 0
  };
  const todayAppts = data.todayAppointmentsBreakdown || {
    all: data.todayAppointments || 0,
    upcoming: data.upcomingAppointments || 0,
    ongoing: 0,
    completed: data.servicesCompleted || 0,
    noShow: 0
  };
  const todayFinance = data.todayFinance || {
    card: 0,
    cash: 0,
    upi: 0,
    others: 0
  };
  const pettyCashBalance = data.pettyCash !== undefined
    ? Number(data.pettyCash || 0)
    : Math.max(0, Number(todayFinance.cash || 0) - Number(todayOverview.expenses || 0));

  return (
    <div className="page-shell dashboard-page-shell" style={{ maxWidth: 1440, margin: "0 auto", paddingBottom: 40 }}>
      {/* Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 800, color: "#0f172a" }}>Dashboard Overview</h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>Real-time salon operations, sales, and branch performance metrics</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
              type="button"
              onClick={() => navigate("/admin/enquiries/follow-ups")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "#1e293b",
                background: "#ffffff",
                padding: "6px 14px",
                borderRadius: 20,
                border: "1px solid #cbd5e1",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
              title="View Follow Ups"
            >
              <MessageSquare size={14} style={{ color: "#2563eb" }} />
              <span>Follow Ups:</span>
              <span style={{ color: followUpsCount > 0 ? "#dc2626" : "#64748b", fontWeight: 800 }}>{followUpsCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsInboxModalOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "#1e293b",
              background: "#ffffff",
              padding: "6px 14px",
              borderRadius: 20,
              border: "1px solid #cbd5e1",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
            title="Open Inbox (Petty Cash Register & Day Breakdown)"
          >
            <Wallet size={14} style={{ color: "#d97706" }} />
            <span>Inbox:</span>
            <span style={{ color: "#059669", fontWeight: 800 }}>{formatMoney(pettyCashBalance)}</span>
          </button>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", background: "#fff", padding: "6px 14px", borderRadius: 20, border: "1px solid #cbd5e1", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
            📍 {branchName || "All Branches"}
          </span>
        </div>
      </div>

      {/* 3 Modern Segmented KPI Summary Cards */}
      <div className="dashboard-top-kpi-grid">
        
        {/* Card 1: Total / For Today */}
        <div className="dashboard-kpi-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ padding: 6, borderRadius: 8, background: "#f1f5f9", color: "#475569" }}><TrendingUp size={16} /></div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Today's Overview</div>
          </div>
          <div className="dashboard-kpi-subgrid">
            <div className="dashboard-sub-pill" style={{ background: "#fffbeb", border: "1px solid #fef3c7" }}>
              <div className="dashboard-sub-pill-label" style={{ color: "#d97706" }}><div style={{width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", flexShrink: 0}}></div> Expenses</div>
              <div className="dashboard-sub-pill-val">{formatMoney(todayOverview.expenses)}</div>
            </div>
            <div className="dashboard-sub-pill" style={{ background: "#eff6ff", border: "1px solid #dbeafe" }}>
              <div className="dashboard-sub-pill-label" style={{ color: "#2563eb" }}><div style={{width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", flexShrink: 0}}></div> Sales</div>
              <div className="dashboard-sub-pill-val">{formatMoney(todayOverview.totalSales)}</div>
            </div>
            <div className="dashboard-sub-pill" style={{ background: "#ecfdf5", border: "1px solid #d1fae5" }}>
              <div className="dashboard-sub-pill-label" style={{ color: "#059669" }}><div style={{width: 6, height: 6, borderRadius: "50%", background: "#10b981", flexShrink: 0}}></div> Services</div>
              <div className="dashboard-sub-pill-val">{formatMoney(todayOverview.services)}</div>
            </div>
            <div className="dashboard-sub-pill" style={{ background: "#fef2f2", border: "1px solid #fee2e2" }}>
              <div className="dashboard-sub-pill-label" style={{ color: "#dc2626" }}><div style={{width: 6, height: 6, borderRadius: "50%", background: "#ef4444", flexShrink: 0}}></div> Products</div>
              <div className="dashboard-sub-pill-val">{formatMoney(todayOverview.products)}</div>
            </div>
          </div>
        </div>

        {/* Card 2: Appointments For Today */}
        <div className="dashboard-kpi-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ padding: 6, borderRadius: 8, background: "#f1f5f9", color: "#475569" }}><Calendar size={16} /></div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Appointments Today</div>
          </div>
          <div className="dashboard-kpi-subgrid">
            <div className="dashboard-sub-pill" style={{ background: "#f8fafc", border: "1px solid #f1f5f9", textAlign: "center", alignItems: "center" }}>
              <div className="dashboard-sub-pill-label" style={{ color: "#475569" }}>All</div>
              <div className="dashboard-sub-pill-val">{todayAppts.all}</div>
            </div>
            <div className="dashboard-sub-pill" style={{ background: "#eff6ff", border: "1px solid #dbeafe", textAlign: "center", alignItems: "center" }}>
              <div className="dashboard-sub-pill-label" style={{ color: "#2563eb" }}>Upcoming</div>
              <div className="dashboard-sub-pill-val">{todayAppts.upcoming}</div>
            </div>
            <div className="dashboard-sub-pill" style={{ background: "#fffbeb", border: "1px solid #fef3c7", textAlign: "center", alignItems: "center" }}>
              <div className="dashboard-sub-pill-label" style={{ color: "#d97706" }}>On Going</div>
              <div className="dashboard-sub-pill-val">{todayAppts.ongoing}</div>
            </div>
            <div className="dashboard-sub-pill" style={{ background: "#ecfdf5", border: "1px solid #d1fae5", textAlign: "center", alignItems: "center" }}>
              <div className="dashboard-sub-pill-label" style={{ color: "#059669" }}>Done</div>
              <div className="dashboard-sub-pill-val">{todayAppts.completed}</div>
            </div>
          </div>
        </div>

        {/* Card 3: Finance */}
        <div className="dashboard-kpi-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ padding: 6, borderRadius: 8, background: "#f1f5f9", color: "#475569" }}><CreditCard size={16} /></div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Finance Breakdown</div>
          </div>
          <div className="dashboard-kpi-subgrid">
            <div className="dashboard-sub-pill" style={{ background: "#fffbeb", border: "1px solid #fef3c7" }}>
              <div className="dashboard-sub-pill-label" style={{ color: "#d97706" }}><div style={{width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", flexShrink: 0}}></div> Cash</div>
              <div className="dashboard-sub-pill-val">{formatMoney(todayFinance.cash)}</div>
            </div>
            <div className="dashboard-sub-pill" style={{ background: "#eef2ff", border: "1px solid #e0e7ff" }}>
              <div className="dashboard-sub-pill-label" style={{ color: "#4f46e5" }}><div style={{width: 6, height: 6, borderRadius: "50%", background: "#6366f1", flexShrink: 0}}></div> Card</div>
              <div className="dashboard-sub-pill-val">{formatMoney(todayFinance.card)}</div>
            </div>
            <div className="dashboard-sub-pill" style={{ background: "#f0fdfa", border: "1px solid #ccfbf1" }}>
              <div className="dashboard-sub-pill-label" style={{ color: "#0d9488" }}><div style={{width: 6, height: 6, borderRadius: "50%", background: "#14b8a6", flexShrink: 0}}></div> UPI</div>
              <div className="dashboard-sub-pill-val">{formatMoney(todayFinance.upi)}</div>
            </div>
            <div className="dashboard-sub-pill" style={{ background: "#faf5ff", border: "1px solid #f3e8ff" }}>
              <div className="dashboard-sub-pill-label" style={{ color: "#9333ea" }}><div style={{width: 6, height: 6, borderRadius: "50%", background: "#a855f7", flexShrink: 0}}></div> Others</div>
              <div className="dashboard-sub-pill-val">{formatMoney(todayFinance.others)}</div>
            </div>
          </div>
        </div>
      </div>



      {/* Low Stock Urgent Banner (if any) */}
      {data.lowStockAlertCount > 0 && (
        <div style={{ marginBottom: 24, border: "1.5px solid #fed7aa", borderRadius: 14, overflow: "hidden", background: "#fff" }}>
          <div style={{ background: "#fff7ed", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #fed7aa" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <AlertTriangle size={20} color="#ea580c" />
              <div>
                <span style={{ color: "#9a3412", fontWeight: 800, fontSize: "0.95rem" }}>Low Stock Attention Required: </span>
                <span style={{ color: "#c2410c", fontSize: "0.88rem", fontWeight: 600 }}>{data.lowStockAlertCount} product{data.lowStockAlertCount !== 1 ? "s" : ""} at or below minimum threshold</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/admin/inventory")}
              style={{ background: "#ea580c", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
            >
              Manage Inventory →
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, padding: "14px 20px" }}>
            {currentStockItems.map((product) => (
              <div key={product.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#fafafa", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                <div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1e293b" }}>{product.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 2 }}>Min threshold: {product.minStock} {product.unit}</div>
                </div>
                <span style={{ background: "#fee2e2", color: "#dc2626", fontWeight: 800, fontSize: "0.8rem", padding: "4px 10px", borderRadius: 6, border: "1px solid #fecaca" }}>
                  {product.currentStock} {product.unit} left
                </span>
              </div>
            ))}
          </div>
          {totalStockPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: "10px 20px", borderTop: '1px solid #f1f5f9', background: "#f8fafc" }}>
              <button type="button" style={{ padding: '4px 10px', fontSize: "0.75rem", borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff", cursor: stockPage === 1 ? "not-allowed" : "pointer", color: stockPage === 1 ? "#94a3b8" : "#475569" }} disabled={stockPage === 1} onClick={() => setStockPage(p => p - 1)}>Prev</button>
              <span style={{ fontSize: "0.75rem", color: '#64748b', fontWeight: 600 }}>{stockPage} / {totalStockPages}</span>
              <button type="button" style={{ padding: '4px 10px', fontSize: "0.75rem", borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff", cursor: stockPage === totalStockPages ? "not-allowed" : "pointer", color: stockPage === totalStockPages ? "#94a3b8" : "#475569" }} disabled={stockPage === totalStockPages} onClick={() => setStockPage(p => p + 1)}>Next</button>
            </div>
          )}
        </div>
      )}

      {/* Activity Grids */}
      <div className="dashboard-grid-1" style={{ marginBottom: 24 }}>
        {/* Recent Invoices */}
        <PaginatedList
          title="Recent Invoices"
          icon={Receipt}
          badge={`${(data.recentInvoices || []).length} latest`}
          items={data.recentInvoices || []}
          emptyState={<EmptyState title="No invoices yet" message="This branch scope has no invoice activity yet. New sales will show up here automatically." />}
          renderItem={(invoice) => (
            <div
              key={invoice.id}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, cursor: "pointer", transition: "all 0.2s" }}
              onClick={() => navigate(`/admin/invoices/${invoice.id}`)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>{invoice.invoiceNumber}</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <Users size={13} /> {invoice.customer?.name || "Walk-in"}
                  <span style={{ color: "#cbd5e1" }}>|</span>
                  {invoice.branch?.name || "Main branch"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ background: "#f8fafc", color: "var(--accent)", fontSize: "0.95rem", fontWeight: 800, padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  {formatMoney(invoice.total)}
                </div>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: invoice.status === "PAID" ? "#16a34a" : invoice.status === "PARTIAL" ? "#d97706" : "#dc2626", marginTop: 4, display: "inline-block" }}>
                  {invoice.status}
                </span>
              </div>
            </div>
          )}
        />

        {/* Recent Customers */}
        <PaginatedList
          title="Recent Customers"
          icon={UserPlus}
          badge={`${(data.recentCustomers || []).length} latest`}
          items={data.recentCustomers || []}
          emptyState={<EmptyState title="No recent customers" message="Fresh customer activity will appear here as soon as visits or sales are recorded." />}
          renderItem={(customer) => (
            <div
              key={customer.id}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, cursor: "pointer", transition: "all 0.2s" }}
              onClick={() => navigate(`/admin/customers`)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontWeight: 800, fontSize: "1rem" }}>
                  {customer.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>{customer.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 2 }}>{customer.phone || "No phone"}</div>
                </div>
              </div>
              <span style={{ background: "#ecfdf5", color: "#059669", fontSize: "0.72rem", fontWeight: 700, padding: "4px 10px", borderRadius: 20, border: "1px solid #a7f3d0" }}>
                CLIENT
              </span>
            </div>
          )}
        />
      </div>

      {/* Recent Payments */}
      <div>
        <PaginatedList
          title="Recent Payment Collections"
          icon={CreditCard}
          badge={`${(data.recentPayments || []).length} recorded`}
          items={data.recentPayments || []}
          emptyState={<EmptyState title="No payments yet" message="Payment collections will appear here once invoices are paid or settled." />}
          renderItem={(payment) => (
            <div
              key={payment.id}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, cursor: "pointer", transition: "all 0.2s" }}
              onClick={() => navigate(`/admin/payments`)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>{payment.invoice?.invoiceNumber || "Direct Payment"}</div>
                <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Method: <span style={{ color: "#2563eb" }}>{payment.mode}</span>
                </div>
              </div>
              <div style={{ background: "#ecfdf5", color: "#059669", fontSize: "0.95rem", fontWeight: 800, padding: "6px 14px", borderRadius: 8, border: "1px solid #a7f3d0" }}>
                + {formatMoney(payment.amount)}
              </div>
            </div>
          )}
        />
      </div>

      {/* Inbox (Petty Cash Register) Modal */}
      {isInboxModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15, 23, 42, 0.45)", backdropFilter: "blur(4px)", padding: 16 }}>
          <div style={{ background: "#ffffff", borderRadius: 16, width: "100%", maxWidth: 720, maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0,0,0,0.05)", overflow: "hidden", border: "1px solid #e2e8f0" }}>
            
            {/* Header */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: "#e2e8f0", color: "#334155", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Wallet size={17} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.02rem", fontWeight: 700, color: "#0f172a" }}>Petty Cash Register (Inbox)</h3>
                  <p style={{ margin: "1px 0 0", fontSize: "0.75rem", color: "#64748b" }}>
                    Daily Cash Inflows & Expenses • <strong>{branchName || "All Branches"}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInboxModalOpen(false)}
                style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#334155", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                title="Close"
                aria-label="Close"
              >
                <X size={18} strokeWidth={2.5} color="#334155" />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
              
              {/* Date Filter Toolbar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 14, background: "#f8fafc", padding: "8px 12px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => shiftInboxDate(-1)}
                    style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#1e293b", transition: "all 0.15s" }}
                    title="Previous Day"
                    aria-label="Previous Day"
                  >
                    <ChevronLeft size={18} strokeWidth={2.5} color="#1e293b" />
                  </button>
                  <input
                    type="date"
                    value={inboxDate}
                    onChange={(e) => setInboxDate(e.target.value)}
                    style={{ border: "1px solid #cbd5e1", borderRadius: 8, height: 32, padding: "0 10px", fontSize: "0.82rem", fontWeight: 600, color: "#0f172a", background: "#fff", outline: "none" }}
                  />
                  <button
                    type="button"
                    onClick={() => shiftInboxDate(1)}
                    style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#1e293b", transition: "all 0.15s" }}
                    title="Next Day"
                    aria-label="Next Day"
                  >
                    <ChevronRight size={18} strokeWidth={2.5} color="#1e293b" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      const yyyy = d.getFullYear();
                      const mm = String(d.getMonth() + 1).padStart(2, "0");
                      const dd = String(d.getDate()).padStart(2, "0");
                      setInboxDate(`${yyyy}-${mm}-${dd}`);
                    }}
                    style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 6, height: 30, padding: "0 10px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, display: "flex", alignItems: "center" }}
                  >
                    Today
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setShowQuickExpense(prev => !prev)}
                    style={{ background: showQuickExpense ? "#e2e8f0" : "#0f172a", color: showQuickExpense ? "#0f172a" : "#fff", border: "none", borderRadius: 6, height: 30, padding: "0 11px", fontSize: "0.76rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <Plus size={13} />
                    {showQuickExpense ? "Close Form" : "Add Cash Expense"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsInboxModalOpen(false); navigate("/admin/expenses"); }}
                    style={{ background: "#fff", border: "1px solid #cbd5e1", color: "#475569", borderRadius: 6, height: 30, padding: "0 10px", fontSize: "0.76rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center" }}
                  >
                    Manage All
                  </button>
                </div>
              </div>

              {/* Quick Expense Form (Collapsible) */}
              {showQuickExpense && (
                <form onSubmit={handleAddQuickExpense} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#0f172a", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <Wallet size={14} /> Record Petty Cash Outflow
                  </div>
                  {quickError && <div style={{ background: "#fee2e2", color: "#dc2626", padding: "5px 8px", borderRadius: 6, fontSize: "0.75rem", marginBottom: 8 }}>{quickError}</div>}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, marginBottom: 8 }}>
                    <div>
                      <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: 2 }}>Expense Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Tea/Coffee, Supplies"
                        value={quickForm.title}
                        onChange={(e) => setQuickForm({ ...quickForm, title: e.target.value })}
                        required
                        style={{ width: "100%", height: 30, padding: "0 8px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: "0.8rem", background: "#fff", outline: "none" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: 2 }}>Cash Amount (₹) *</label>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="0.00"
                        value={quickForm.amount}
                        onChange={(e) => setQuickForm({ ...quickForm, amount: e.target.value })}
                        required
                        style={{ width: "100%", height: 30, padding: "0 8px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: "0.8rem", background: "#fff", fontWeight: 600, outline: "none" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: 2 }}>Category</label>
                      <select
                        value={quickForm.categoryId}
                        onChange={(e) => {
                          if (e.target.value === "__ADD_TYPE__") {
                            navigate("/admin/expenses/types");
                            return;
                          }
                          setQuickForm({ ...quickForm, categoryId: e.target.value });
                        }}
                        style={{ width: "100%", height: 30, padding: "0 6px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: "0.8rem", background: "#fff", outline: "none" }}
                      >
                        <option value="">Select Category</option>
                        {inboxCategories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                        <option value="__ADD_TYPE__">+ Add New Type</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => setShowQuickExpense(false)}
                      style={{ background: "transparent", border: "none", color: "#64748b", fontSize: "0.76rem", fontWeight: 600, cursor: "pointer", padding: "4px 8px" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={quickSubmitting}
                      style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 6, height: 28, padding: "0 12px", fontSize: "0.76rem", fontWeight: 600, cursor: "pointer" }}
                    >
                      {quickSubmitting ? "Saving..." : "Save Entry"}
                    </button>
                  </div>
                </form>
              )}

              {quickSuccess && (
                <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "6px 10px", borderRadius: 6, fontSize: "0.76rem", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle2 size={14} /> {quickSuccess}
                </div>
              )}

              {/* 3 Summary KPI Cards: Plus, Minus, Equal */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, marginBottom: 14 }}>
                {/* Cash In (+) */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ color: "#16a34a", fontWeight: 800 }}>+</span> Cash Inflow
                    </span>
                    <span style={{ fontSize: "0.68rem", background: "#f1f5f9", color: "#475569", padding: "1px 6px", borderRadius: 10, fontWeight: 500 }}>
                      {inboxSummary.countIn}
                    </span>
                  </div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", marginTop: 4 }}>
                    {formatMoney(inboxSummary.totalIn)}
                  </div>
                </div>

                {/* Cash Out (-) */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ color: "#dc2626", fontWeight: 800 }}>-</span> Cash Outflow
                    </span>
                    <span style={{ fontSize: "0.68rem", background: "#f1f5f9", color: "#475569", padding: "1px 6px", borderRadius: 10, fontWeight: 500 }}>
                      {inboxSummary.countOut}
                    </span>
                  </div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", marginTop: 4 }}>
                    {formatMoney(inboxSummary.totalOut)}
                  </div>
                </div>

                {/* Net In-Box Balance (=) */}
                <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "#475569", textTransform: "uppercase" }}>
                    Net Balance
                  </div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800, color: Number(inboxSummary.netBalance || 0) < 0 ? "#dc2626" : "#0f172a", marginTop: 4 }}>
                    {formatMoney(inboxSummary.netBalance)}
                  </div>
                </div>
              </div>

              {/* Transactions Ledger */}
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "8px 12px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontWeight: 600, fontSize: "0.78rem", color: "#475569", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Cash Ledger Breakdown ({inboxDate})</span>
                  <button
                    type="button"
                    onClick={() => fetchInboxData(inboxDate)}
                    style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem", padding: "2px 6px" }}
                  >
                    <RefreshCw size={11} className={inboxLoading ? "animate-spin" : ""} /> Refresh
                  </button>
                </div>

                <div style={{ maxHeight: 220, overflowY: "auto" }}>
                  {inboxLoading ? (
                    <div style={{ padding: "30px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#64748b" }}>
                      <RefreshCw size={22} className="animate-spin" color="#cbd5e1" />
                      <div style={{ fontSize: "0.78rem" }}>Loading cash ledger...</div>
                    </div>
                  ) : inboxTransactions.length === 0 ? (
                    <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "0.78rem" }}>
                      No cash sales or expenses recorded on {inboxDate}.
                    </div>
                  ) : (
                    inboxTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 12px",
                          borderBottom: "1px solid #f1f5f9",
                          background: tx.type === "INFLOW" ? "#fcfdfc" : "#fffdfd"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: tx.type === "INFLOW" ? "#dcfce7" : "#fee2e2",
                            color: tx.type === "INFLOW" ? "#16a34a" : "#dc2626",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}>
                            {tx.type === "INFLOW" ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "#0f172a" }}>{tx.title}</div>
                            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{tx.subtitle} • {tx.time || "Today"}</div>
                          </div>
                        </div>
                        <div style={{
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          color: tx.type === "INFLOW" ? "#16a34a" : "#dc2626"
                        }}>
                          {tx.type === "INFLOW" ? "+" : "-"} {formatMoney(tx.amount)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{ padding: "10px 20px", borderTop: "1px solid #f1f5f9", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                Auto-calculated in real time from POS bills and cash expenses
              </span>
              <button
                type="button"
                onClick={() => setIsInboxModalOpen(false)}
                style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 6, height: 28, padding: "0 14px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
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
