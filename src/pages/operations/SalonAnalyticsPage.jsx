import { useState, useEffect } from "react";
import { Building, DollarSign, TrendingUp, TrendingDown, Users, Package, UserCheck, Calendar, Filter, Activity, PieChart, ShieldCheck, Award } from "lucide-react";
import { api } from "../../api/client";
import { useBranch } from "../../context/BranchContext";

export default function SalonAnalyticsPage() {
  const { selectedBranchId: globalBranchId } = useBranch();
  const [period, setPeriod] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [branchesList, setBranchesList] = useState([]);
  const [activeTab, setActiveTab] = useState("pnl");
  const [loading, setLoading] = useState(true);

  // Sync global branch if selected
  useEffect(() => {
    if (globalBranchId) {
      setSelectedBranch(globalBranchId);
    }
  }, [globalBranchId]);

  // Load real branches list for dropdown
  useEffect(() => {
    api.get("/owner/branches")
      .then(res => setBranchesList(res.data || []))
      .catch(() => setBranchesList([]));
  }, []);

  const [metrics, setMetrics] = useState({
    revenue: 0,
    servicesRevenue: 0,
    productsRevenue: 0,
    membershipsRevenue: 0,
    expenses: 0,
    payroll: 0,
    totalCustomers: 0,
    newCustomers: 0,
    repeatCustomers: 0,
    activeStaff: 0,
    totalProductsSold: 0,
    inventoryValue: 0,
    lowStockCount: 0,
    paymentModes: {
      online: 0,
      cash: 0,
      card: 0
    },
    topCustomers: [],
    staffPerformance: [],
    topProducts: [],
    salonDetails: {
      name: "Salon Workspace",
      plan: "ENTERPRISE",
      currency: "INR (₹)",
      taxRate: "18.00%",
      branchesCount: 1,
      status: "ACTIVE"
    }
  });

  // Fetch dynamic analytics data
  useEffect(() => {
    let active = true;
    setLoading(true);

    let startIso = null;
    let endIso = null;
    const now = new Date();

    if (period === "Today") {
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      startIso = todayStart.toISOString();
      endIso = new Date().toISOString();
    } else if (period === "Month") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      startIso = monthStart.toISOString();
      endIso = new Date().toISOString();
    } else if (period === "Custom" && startDate) {
      startIso = new Date(startDate).toISOString();
      if (endDate) {
        const customEnd = new Date(endDate);
        customEnd.setHours(23, 59, 59, 999);
        endIso = customEnd.toISOString();
      }
    }

    const params = new URLSearchParams();
    if (startIso) {
      params.append("startDate", startIso);
      params.append("start", startIso);
    }
    if (endIso) {
      params.append("endDate", endIso);
      params.append("end", endIso);
    }
    if (selectedBranch && selectedBranch !== "ALL") params.append("branchId", selectedBranch);
    params.append("take", "500"); // Maximize invoice fetch limit

    const queryString = params.toString() ? `?${params.toString()}` : "";

    Promise.allSettled([
      api.get(`/owner/invoices${queryString}`),
      api.get(`/owner/expenses${queryString}`),
      api.get(`/owner/customers${queryString}`),
      api.get(`/owner/users${queryString}`),
      api.get(`/owner/products${queryString}`),
      api.get(`/owner/settings`),
      api.get(`/owner/payroll/reports${queryString}`),
      api.get(`/owner/reports/profit-loss${queryString}`)
    ]).then(([invoicesRes, expensesRes, customersRes, usersRes, productsRes, settingsRes, payrollRes, pnlRes]) => {
      if (!active) return;

      const extractArray = (res) => {
        if (res.status !== "fulfilled" || !res.value) return [];
        if (Array.isArray(res.value.data)) return res.value.data;
        if (res.value.data && Array.isArray(res.value.data.data)) return res.value.data.data;
        return [];
      };

      const invoices = extractArray(invoicesRes);
      const expenses = extractArray(expensesRes);
      const customers = extractArray(customersRes);
      const users = extractArray(usersRes);
      const products = extractArray(productsRes);
      const settings = settingsRes.status === "fulfilled" ? settingsRes.value?.data || {} : {};
      const rawPayrollData = payrollRes.status === "fulfilled" ? payrollRes.value?.data : null;
      const payrollRuns = Array.isArray(rawPayrollData) ? rawPayrollData : (rawPayrollData?.rows || []);
      const totalPayroll = rawPayrollData?.totalNet != null
        ? Number(rawPayrollData.totalNet)
        : payrollRuns.reduce((sum, run) => sum + (Number(run.totalNet || run.totalAmount) || 0), 0);
      const pnlData = pnlRes.status === "fulfilled" ? pnlRes.value?.data || {} : {};

      // 1. REVENUE CALCULATIONS
      const validInvoices = invoices.filter(i => i.status !== "CANCELLED");
      const grossRevenue = validInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);

      let servicesRev = 0;
      let productsRev = 0;
      let membershipsRev = 0;
      let totalUnitsSold = 0;
      const productSalesMap = {};
      const staffSalesMap = {};

      validInvoices.forEach(inv => {
        const items = Array.isArray(inv.items) ? inv.items : [];
        items.forEach(item => {
          const itemTotal = Number(item.lineTotal || (item.unitPrice * item.qty)) || 0;
          const qty = Number(item.qty) || 1;

          if (item.itemType === "PRODUCT") {
            productsRev += itemTotal;
            totalUnitsSold += qty;
            const pName = item.productName || item.name || "Product Item";
            productSalesMap[pName] = productSalesMap[pName] || { name: pName, units: 0, revenue: 0 };
            productSalesMap[pName].units += qty;
            productSalesMap[pName].revenue += itemTotal;
          } else if (item.itemType === "MEMBERSHIP" || item.itemType === "PACKAGE") {
            membershipsRev += itemTotal;
          } else {
            servicesRev += itemTotal;
          }

          // Staff attribution
          const staffId = item.staffUserSalonId || item.staffId || "unassigned";
          const staffName = item.staffName || "Stylist Team";
          if (staffId !== "unassigned") {
            staffSalesMap[staffId] = staffSalesMap[staffId] || { id: staffId, name: staffName, revenue: 0, clients: 0 };
            staffSalesMap[staffId].revenue += itemTotal;
            staffSalesMap[staffId].clients += 1;
          }
        });
      });

      // 2. EXPENSES CALCULATIONS
      const validExpenses = expenses.filter(e => e.status === "APPROVED" || e.status === "PAID" || !e.status);
      const totalExpenses = validExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

      // 3. PAYMENT MODES
      let onlinePay = 0;
      let cashPay = 0;
      let cardPay = 0;
      validInvoices.forEach(inv => {
        const payments = Array.isArray(inv.payments) ? inv.payments : [];
        if (payments.length > 0) {
          payments.forEach(p => {
            const amt = Number(p.amount) || 0;
            const mode = String(p.paymentMode || "").toUpperCase();
            if (mode.includes("ONLINE") || mode.includes("UPI") || mode.includes("RAZORPAY")) onlinePay += amt;
            else if (mode.includes("CARD")) cardPay += amt;
            else cashPay += amt;
          });
        } else {
          cashPay += Number(inv.total) || 0;
        }
      });

      // 4. CUSTOMER INSIGHTS
      const totalCust = customers.length;
      const repeatCust = customers.filter(c => Number(c.totalSpend) > 0 || Number(c.appointmentsCount) > 1 || Number(c.invoicesCount) > 1).length;
      const newCust = Math.max(0, totalCust - repeatCust);

      const topCustList = [...customers]
        .sort((a, b) => (Number(b.totalSpend) || 0) - (Number(a.totalSpend) || 0))
        .slice(0, 5)
        .map(c => ({
          id: c.id,
          name: c.name || "Valued Client",
          visits: c.appointmentsCount || c.invoicesCount || 1,
          spend: Number(c.totalSpend) || 0
        }));

      // 5. STAFF PERFORMANCE
      const staffList = users.map(u => {
        const userObj = u.user || u;
        const name = userObj.name || `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim() || u.name || "Staff Member";
        const performance = staffSalesMap[u.id] || staffSalesMap[userObj.id] || { revenue: 0, clients: 0 };
        const commission = Math.round(performance.revenue * 0.10); // 10% estimated commission
        return {
          id: u.id || userObj.id,
          name,
          revenue: performance.revenue,
          clients: performance.clients,
          commission
        };
      }).sort((a, b) => b.revenue - a.revenue);

      // 7. PRODUCTS & INVENTORY
      const invValue = products.reduce((sum, p) => sum + (Number(p.costPrice || p.sellingPrice || 0) * (Number(p.currentStock) || 0)), 0);
      const lowStock = products.filter(p => Number(p.currentStock || 0) <= (Number(p.minStockAlert) || 5)).length;

      const topProdList = Object.values(productSalesMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setMetrics({
        revenue: grossRevenue || (Number(pnlData.revenue) || 0),
        servicesRevenue: servicesRev,
        productsRevenue: productsRev,
        membershipsRevenue: membershipsRev,
        expenses: totalExpenses || (Number(pnlData.expenses) || 0),
        payroll: totalPayroll,
        totalCustomers: totalCust,
        newCustomers: newCust,
        repeatCustomers: repeatCust,
        activeStaff: users.length,
        totalProductsSold: totalUnitsSold,
        inventoryValue: Math.round(invValue),
        lowStockCount: lowStock,
        paymentModes: {
          online: onlinePay,
          cash: cashPay,
          card: cardPay
        },
        topCustomers: topCustList,
        staffPerformance: staffList,
        topProducts: topProdList,
        salonDetails: {
          name: settings.salonName || settings.name || "Your Salon Workspace",
          plan: settings.subscriptionPlan || "ENTERPRISE",
          currency: "INR (₹)",
          taxRate: settings.taxPercent ? `${settings.taxPercent}%` : "18.00%",
          branchesCount: branchesList.length || 1,
          status: "ACTIVE"
        }
      });

      setLoading(false);
    });

    return () => { active = false; };
  }, [period, startDate, endDate, selectedBranch, branchesList.length]);

  // Calculate Net Profit / Loss dynamically
  const netProfit = metrics.revenue - metrics.expenses - metrics.payroll;
  const profitMargin = metrics.revenue > 0 ? ((netProfit / metrics.revenue) * 100).toFixed(1) : "0.0";
  const isProfitable = netProfit >= 0;

  return (
    <div className="page-shell super-admin-page">
      {/* Hero Header */}
      <div className="hero-card" style={{ padding: "16px 20px", marginBottom: 16 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0, fontSize: 20, marginBottom: 4 }}>Salon Analytics & Profit & Loss Intelligence</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Live financial performance breakdown, real-time revenue streams, customer retention, staff utilization, and P&L metrics.</p>
          </div>
          <div className="badge-row" style={{ marginTop: 8 }}>
            <span className="badge" style={{ padding: "4px 8px", borderRadius: 6, background: isProfitable ? "#dcfce7" : "#fee2e2", color: isProfitable ? "#166534" : "#991b1b", fontWeight: 700, fontSize: 11 }}>
              {isProfitable ? `Net Profit Margin: +${profitMargin}%` : `Net Loss Margin: ${profitMargin}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Date Period & Filter Bar */}
      <div className="panel-card" style={{ padding: "12px 16px", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginRight: 4 }}>Period Filter:</span>
          {[
            { id: "ALL", label: "All Time" },
            { id: "Today", label: "Today" },
            { id: "Month", label: "This Month" },
            { id: "Custom", label: "Custom Date" }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              style={{
                padding: "4px 12px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                border: "1px solid",
                borderColor: period === p.id ? "#6366f1" : "#e2e8f0",
                background: period === p.id ? "#eef2ff" : "white",
                color: period === p.id ? "#4338ca" : "#64748b",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {period === "Custom" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
            />
            <span style={{ fontSize: 13, color: "#64748b" }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
            />
          </div>
        )}


      </div>

      {loading && <div style={{ textAlign: "center", padding: "20px 0", color: "#6366f1", fontWeight: 600 }}>Updating analytics metrics...</div>}

      {/* P&L Key Performance Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
        <div className="panel-card" style={{ padding: 16, borderLeft: "4px solid #6366f1" }}>
          <div style={{ color: "#64748b", fontSize: 11, fontWeight: 600 }}>Gross Salon Revenue</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>₹{metrics.revenue.toLocaleString("en-IN")}</div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>Services + Products + Memberships</div>
        </div>

        <div className="panel-card" style={{ padding: 16, borderLeft: "4px solid #ef4444" }}>
          <div style={{ color: "#64748b", fontSize: 11, fontWeight: 600 }}>Total Operational Expenses</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#dc2626", marginTop: 4 }}>₹{metrics.expenses.toLocaleString("en-IN")}</div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>Approved & Paid Operational Expenses</div>
        </div>

        <div className="panel-card" style={{ padding: 16, borderLeft: "4px solid #f59e0b" }}>
          <div style={{ color: "#64748b", fontSize: 11, fontWeight: 600 }}>Staff Payroll & Commissions</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#d97706", marginTop: 4 }}>₹{metrics.payroll.toLocaleString("en-IN")}</div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>Payroll Runs & Performance Commissions</div>
        </div>

        <div className="panel-card" style={{ padding: 16, borderLeft: `4px solid ${isProfitable ? "#22c55e" : "#ef4444"}`, background: isProfitable ? "#f0fdf4" : "#fef2f2" }}>
          <div style={{ color: isProfitable ? "#166534" : "#991b1b", fontSize: 11, fontWeight: 700 }}>Net Profit / Loss</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: isProfitable ? "#15803d" : "#b91c1c", marginTop: 4 }}>
            {isProfitable ? `+₹${netProfit.toLocaleString("en-IN")}` : `-₹${Math.abs(netProfit).toLocaleString("en-IN")}`}
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: isProfitable ? "#166534" : "#991b1b", marginTop: 4 }}>
            {isProfitable ? "Profitable Business" : "Operating Loss"}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: "flex", borderBottom: "2px solid #e2e8f0", marginBottom: 16, gap: 12, overflowX: "auto" }}>
        {[
          { id: "pnl", label: "Profit & Loss Health" },
          { id: "revenue", label: "Revenue Streams" },
          { id: "customers", label: "Customer Insights" },
          { id: "staff", label: "Staff Performance" },
          { id: "products", label: "Products & Inventory" },
          { id: "details", label: "Salon Details" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 12px",
              fontSize: 13,
              fontWeight: 700,
              border: "none",
              background: "none",
              borderBottom: activeTab === tab.id ? "3px solid #6366f1" : "3px solid transparent",
              color: activeTab === tab.id ? "#4338ca" : "#64748b",
              cursor: "pointer",
              marginBottom: -2,
              whiteSpace: "nowrap"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: P&L Health */}
      {activeTab === "pnl" && (
        <div className="panel-card" style={{ padding: 16 }}>
          <h3 style={{ marginTop: 0, fontSize: 15, color: "#0f172a" }}>Profit & Loss Calculation Statement</h3>
          <p style={{ color: "#64748b", fontSize: 12, marginBottom: 12 }}>Summary of income streams minus operating costs and staff expenditures.</p>

          <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", marginTop: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <tbody>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: "#1e293b", fontSize: 13 }}>1. Gross Revenue (Total Income)</td>
                  <td style={{ padding: "10px 12px", fontWeight: 800, textAlign: "right", color: "#059669", fontSize: 13 }}>₹{metrics.revenue.toLocaleString("en-IN")}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 12px 8px 24px", color: "#475569" }}>• Service Revenue (Hair, Spa, Beauty)</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", color: "#334155" }}>₹{metrics.servicesRevenue.toLocaleString("en-IN")}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 12px 8px 24px", color: "#475569" }}>• Product Retail Sales</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", color: "#334155" }}>₹{metrics.productsRevenue.toLocaleString("en-IN")}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "8px 12px 8px 24px", color: "#475569" }}>• Memberships & Packages</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", color: "#334155" }}>₹{metrics.membershipsRevenue.toLocaleString("en-IN")}</td>
                </tr>

                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: "#1e293b", fontSize: 13 }}>2. Operational Expenses</td>
                  <td style={{ padding: "10px 12px", fontWeight: 800, textAlign: "right", color: "#dc2626", fontSize: 13 }}>-₹{metrics.expenses.toLocaleString("en-IN")}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "8px 12px 8px 24px", color: "#475569" }}>• Approved Salon Expenses</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", color: "#334155" }}>-₹{metrics.expenses.toLocaleString("en-IN")}</td>
                </tr>

                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: "#1e293b", fontSize: 13 }}>3. Staff Payroll & Commissions</td>
                  <td style={{ padding: "10px 12px", fontWeight: 800, textAlign: "right", color: "#dc2626", fontSize: 13 }}>-₹{metrics.payroll.toLocaleString("en-IN")}</td>
                </tr>

                <tr style={{ background: isProfitable ? "#ecfdf5" : "#fef2f2", borderTop: "2px solid #e2e8f0" }}>
                  <td style={{ padding: "12px 14px", fontWeight: 800, fontSize: 14, color: isProfitable ? "#166534" : "#991b1b" }}>Net Profit / Loss (1 - 2 - 3)</td>
                  <td style={{ padding: "12px 14px", fontWeight: 900, fontSize: 16, textAlign: "right", color: isProfitable ? "#15803d" : "#b91c1c" }}>
                    {isProfitable ? `+₹${netProfit.toLocaleString("en-IN")}` : `-₹${Math.abs(netProfit).toLocaleString("en-IN")}`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Revenue Streams */}
      {activeTab === "revenue" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
          <div className="panel-card" style={{ padding: 16 }}>
            <h3 style={{ marginTop: 0, fontSize: 15, color: "#0f172a" }}>Revenue Breakdown by Stream</h3>
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  <span>Services (Hair, Skin, Spa)</span>
                  <span>₹{metrics.servicesRevenue.toLocaleString("en-IN")} ({metrics.revenue > 0 ? ((metrics.servicesRevenue / metrics.revenue) * 100).toFixed(0) : 0}%)</span>
                </div>
                <div style={{ background: "#e2e8f0", height: 10, borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ background: "#6366f1", height: "100%", width: `${metrics.revenue > 0 ? (metrics.servicesRevenue / metrics.revenue) * 100 : 0}%` }} />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  <span>Product Retail Sales</span>
                  <span>₹{metrics.productsRevenue.toLocaleString("en-IN")} ({metrics.revenue > 0 ? ((metrics.productsRevenue / metrics.revenue) * 100).toFixed(0) : 0}%)</span>
                </div>
                <div style={{ background: "#e2e8f0", height: 10, borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ background: "#06b6d4", height: "100%", width: `${metrics.revenue > 0 ? (metrics.productsRevenue / metrics.revenue) * 100 : 0}%` }} />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  <span>Memberships & Packages</span>
                  <span>₹{metrics.membershipsRevenue.toLocaleString("en-IN")} ({metrics.revenue > 0 ? ((metrics.membershipsRevenue / metrics.revenue) * 100).toFixed(0) : 0}%)</span>
                </div>
                <div style={{ background: "#e2e8f0", height: 10, borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ background: "#10b981", height: "100%", width: `${metrics.revenue > 0 ? (metrics.membershipsRevenue / metrics.revenue) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Customer Insights */}
      {activeTab === "customers" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          <div className="panel-card" style={{ padding: 16 }}>
            <h3 style={{ marginTop: 0, fontSize: 15, color: "#0f172a" }}>Client Acquisition & Retention</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
              <div style={{ background: "#eef2ff", padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "#4338ca", fontWeight: 700 }}>Total Registered Guests</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#3730a3", marginTop: 4 }}>{metrics.totalCustomers}</div>
              </div>
              <div style={{ background: "#ecfdf5", padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "#065f46", fontWeight: 700 }}>Repeat Customer Rate</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#047857", marginTop: 4 }}>
                  {metrics.totalCustomers > 0 ? ((metrics.repeatCustomers / metrics.totalCustomers) * 100).toFixed(0) : 0}%
                </div>
              </div>
            </div>
          </div>

          <div className="panel-card" style={{ padding: 16 }}>
            <h3 style={{ marginTop: 0, fontSize: 15, color: "#0f172a" }}>Top Spending Clients Leaderboard</h3>
            <div style={{ marginTop: 12 }}>
              {metrics.topCustomers.length > 0 ? (
                metrics.topCustomers.map(c => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <div>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{c.visits} salon visit{c.visits !== 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: "#059669" }}>₹{c.spend.toLocaleString("en-IN")}</div>
                  </div>
                ))
              ) : (
                <p style={{ color: "#94a3b8", fontSize: 13, margin: "16px 0 0" }}>No customer spending data available yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Staff Performance */}
      {activeTab === "staff" && (
        <div className="panel-card" style={{ padding: 16 }}>
          <h3 style={{ marginTop: 0, fontSize: 15, color: "#0f172a" }}>Staff Revenue Contribution & Commissions</h3>
          {metrics.staffPerformance.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left", fontSize: 11, color: "#64748b" }}>
                  <th style={{ padding: 10 }}>Staff Member</th>
                  <th style={{ padding: 10 }}>Services Completed</th>
                  <th style={{ padding: 10 }}>Revenue Generated</th>
                  <th style={{ padding: 10 }}>Earned Commission (Est.)</th>
                </tr>
              </thead>
              <tbody>
                {metrics.staffPerformance.map(st => (
                  <tr key={st.id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
                    <td style={{ padding: 10, fontWeight: 600 }}>{st.name}</td>
                    <td style={{ padding: 10 }}>{st.clients} item{st.clients !== 1 ? 's' : ''}</td>
                    <td style={{ padding: 10, fontWeight: 700, color: "#4f46e5" }}>₹{st.revenue.toLocaleString("en-IN")}</td>
                    <td style={{ padding: 10, fontWeight: 700, color: "#059669" }}>₹{st.commission.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: "#94a3b8", fontSize: 13, margin: "16px 0 0" }}>No staff members found.</p>
          )}
        </div>
      )}

      {/* Tab 5: Products */}
      {activeTab === "products" && (
        <div className="panel-card" style={{ padding: 16 }}>
          <h3 style={{ marginTop: 0, fontSize: 15, color: "#0f172a" }}>Top Selling Products & Inventory Valuation</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginTop: 12 }}>
            <div>
              <h4 style={{ margin: "0 0 10px", fontSize: 13, color: "#475569" }}>Best Selling Retail Products</h4>
              {metrics.topProducts.length > 0 ? (
                metrics.topProducts.map((p, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{p.units} unit{p.units !== 1 ? 's' : ''} sold</div>
                    </div>
                    <div style={{ fontWeight: 700, color: "#059669" }}>₹{p.revenue.toLocaleString("en-IN")}</div>
                  </div>
                ))
              ) : (
                <p style={{ color: "#94a3b8", fontSize: 13 }}>No product sales recorded yet.</p>
              )}
            </div>

            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 8 }}>
              <h4 style={{ margin: "0 0 10px", fontSize: 13, color: "#475569" }}>Inventory Summary</h4>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>Total Inventory Valuation: <strong style={{ color: "#0f172a" }}>₹{metrics.inventoryValue.toLocaleString("en-IN")}</strong></div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>Total Product Units Sold: <strong style={{ color: "#0f172a" }}>{metrics.totalProductsSold} units</strong></div>
              <div style={{ fontSize: 13, color: metrics.lowStockCount > 0 ? "#dc2626" : "#059669", fontWeight: 700 }}>Low Stock Alert Items: {metrics.lowStockCount} product{metrics.lowStockCount !== 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Details */}
      {activeTab === "details" && (
        <div className="panel-card" style={{ padding: 16 }}>
          <h3 style={{ marginTop: 0, fontSize: 15, color: "#0f172a" }}>Salon Specifications & Operating Profile</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 12 }}>
            <div style={{ background: "#f8fafc", padding: 12, borderRadius: 6 }}>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>SALON NAME</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 2 }}>{metrics.salonDetails.name}</div>
            </div>
            <div style={{ background: "#f8fafc", padding: 12, borderRadius: 6 }}>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>ACTIVE SUBSCRIPTION PLAN</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#4f46e5", marginTop: 2 }}>{metrics.salonDetails.plan}</div>
            </div>
            <div style={{ background: "#f8fafc", padding: 12, borderRadius: 6 }}>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>BRANCHES OPERATING</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 2 }}>{metrics.salonDetails.branchesCount} Location{metrics.salonDetails.branchesCount !== 1 ? 's' : ''}</div>
            </div>
            <div style={{ background: "#f8fafc", padding: 12, borderRadius: 6 }}>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>APPLICABLE TAX RATE & CURRENCY</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#059669", marginTop: 2 }}>{metrics.salonDetails.currency} • GST {metrics.salonDetails.taxRate}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
