import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import { useBranch } from '../../context/BranchContext';
import {
  TrendingUp, Users, CreditCard, Scissors, Receipt, Calendar,
  AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Activity,
  Wallet, UserPlus, AlertCircle, Package, UserCheck
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

  useEffect(() => {
    let active = true;
    if (!selectedBranchId) {
      setData(null);
      return;
    }
    const params = { branchId: selectedBranchId };
    api.get("/owner/dashboard", { params }).then((response) => {
      if (!active) return;
      setData(response.data);
    }).catch(() => {
      if (!active) return;
      setData({});
    });
    return () => {
      active = false;
    };
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

  return (
    <div className="page-shell dashboard-page-shell" style={{ maxWidth: 1440, margin: "0 auto", paddingBottom: 40 }}>
      {/* Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 800, color: "#0f172a" }}>Dashboard Overview</h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>Real-time salon operations, sales, and branch performance metrics</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", background: "#fff", padding: "6px 14px", borderRadius: 20, border: "1px solid #cbd5e1", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
            📍 {branchName || "All Branches"}
          </span>
        </div>
      </div>

      {/* 3 Modern Segmented KPI Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginBottom: 24 }}>
        {/* Card 1: Total / For Today */}
        <div style={{ background: "#ffffff", borderRadius: 16, padding: "18px 20px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 14 }}>Total</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>{formatMoney(todayOverview.expenses)}</div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#d97706", marginTop: 4 }}>Expenses</div>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>{formatMoney(todayOverview.totalSales)}</div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#4f46e5", marginTop: 4 }}>Sales</div>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>{formatMoney(todayOverview.services)}</div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#16a34a", marginTop: 4 }}>Services</div>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>{formatMoney(todayOverview.products)}</div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#e11d48", marginTop: 4 }}>Products</div>
            </div>
          </div>
        </div>

        {/* Card 2: Appointments For Today */}
        <div style={{ background: "#ffffff", borderRadius: 16, padding: "18px 20px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 14 }}>Appointments For Today</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>{todayAppts.all}</div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0f172a", marginTop: 4 }}>All</div>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>{todayAppts.upcoming}</div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2563eb", marginTop: 4 }}>Upcoming</div>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>{todayAppts.ongoing}</div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f59e0b", marginTop: 4 }}>On Going</div>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>{todayAppts.completed}</div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#10b981", marginTop: 4 }}>Completed</div>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>{todayAppts.noShow}</div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#ef4444", marginTop: 4 }}>No show</div>
            </div>
          </div>
        </div>

        {/* Card 3: Finance */}
        <div style={{ background: "#ffffff", borderRadius: 16, padding: "18px 20px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 14 }}>Finance</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>{formatMoney(todayFinance.cash)}</div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f59e0b", marginTop: 4 }}>Cash</div>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>{formatMoney(todayFinance.card)}</div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6366f1", marginTop: 4 }}>Card</div>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>{formatMoney(todayFinance.upi)}</div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0d9488", marginTop: 4 }}>UPI</div>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>{formatMoney(todayFinance.others)}</div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8b5cf6", marginTop: 4 }}>Others</div>
            </div>
          </div>
        </div>
      </div>

      {/* 10 KPI Cards Grid (5 columns on desktop, 3 on tablet, 2 on mobile) */}
      <div className="kpi-grid">
        {kpiStats.map((stat, i) => (
          <div
            key={i}
            onClick={stat.onClick}
            style={{
              background: "#fff",
              padding: "16px 18px",
              borderRadius: "14px",
              boxShadow: "0 2px 8px -2px rgba(0, 0, 0, 0.05)",
              border: `1px solid ${stat.border || "#f1f5f9"}`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "all 0.2s ease",
              cursor: stat.onClick ? "pointer" : "default",
              minHeight: "116px",
              position: "relative",
              overflow: "hidden"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(0, 0, 0, 0.08)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px -2px rgba(0, 0, 0, 0.05)";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: "1.45rem", fontWeight: 800, color: stat.color === "#ef4444" ? "#dc2626" : "#0f172a", marginTop: 4, letterSpacing: "-0.02em" }}>
                  {stat.value}
                </div>
              </div>
              <div style={{ background: stat.bg, color: stat.color, padding: "8px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <stat.icon size={18} />
              </div>
            </div>
            {stat.subtitle && (
              <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600, marginTop: 10, display: "flex", alignItems: "center", gap: 4 }}>
                {stat.subtitle}
              </div>
            )}
          </div>
        ))}
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
    </div>
  );
}
