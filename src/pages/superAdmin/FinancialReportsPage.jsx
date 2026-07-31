import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import PageLoader from "../../components/PageLoader";
import { FileText, DollarSign, TrendingUp, TrendingDown, ArrowDown, ArrowUp } from "lucide-react";

const fmt = (val) => Number(val || 0).toLocaleString("en-IN");

export default function FinancialReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = { period };
      if (period === "custom" && dateFrom) params.dateFrom = dateFrom;
      if (period === "custom" && dateTo) params.dateTo = dateTo;
      const res = await api.get("/super-admin/financial-reports", { params });
      setData(res.data);
    } catch (err) {
      setError(formatApiError(err, "Could not load financial reports"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [period, dateFrom, dateTo]);

  if (loading) return <div className="page-shell super-admin-page"><PageLoader title="Loading financial reports" /></div>;

  const pnl = data || {};
  const revenue = pnl.revenue || {};
  const expenses = pnl.expenses || {};
  const categories = pnl.expenseCategories || [];

  return (
    <div className="page-shell super-admin-page">
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0 }}>Financial Reports</h1>
            <p style={{ marginBottom: 0 }}>Profit & Loss statement and financial overview across the platform.</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "inline-flex", background: "#f1f5f9", padding: 4, borderRadius: 10, border: "1px solid #e2e8f0" }}>
              {["all", "today", "month", "year", "custom"].map((p) => (
                <button key={p} type="button" onClick={() => setPeriod(p)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: period === p ? "white" : "transparent", color: period === p ? "#4f46e5" : "#64748b", fontWeight: period === p ? 700 : 600, fontSize: "0.78rem", cursor: "pointer" }}>
                  {p === "all" ? "All" : p === "today" ? "Today" : p === "month" ? "Month" : p === "year" ? "Year" : "Custom"}
                </button>
              ))}
            </div>
            {period === "custom" && (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.78rem" }} />
                <span style={{ color: "#64748b", fontSize: "0.78rem" }}>to</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.78rem" }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <div style={{ background: "#fef2f2", color: "#991b1b", padding: "12px 16px", borderRadius: 10, marginBottom: 16 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "white", border: "1px solid #f1f5f9", borderRadius: 16, padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Total Revenue</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}><ArrowUp size={16} /></div>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#10b981" }}>{"\u20B9"}{fmt(revenue.total)}</div>
          <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 4 }}>Subscription + Salon payments</div>
        </div>
        <div style={{ background: "white", border: "1px solid #f1f5f9", borderRadius: 16, padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Total Expenses</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fef2f2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}><ArrowDown size={16} /></div>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ef4444" }}>{"\u20B9"}{fmt(expenses.total)}</div>
          <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 4 }}>Platform operations</div>
        </div>
        <div style={{ background: "white", border: "1px solid #f1f5f9", borderRadius: 16, padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Net Profit/Loss</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: (pnl.netProfit || 0) >= 0 ? "#ecfdf5" : "#fef2f2", color: (pnl.netProfit || 0) >= 0 ? "#10b981" : "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {(pnl.netProfit || 0) >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </div>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: (pnl.netProfit || 0) >= 0 ? "#10b981" : "#ef4444" }}>{"\u20B9"}{fmt(pnl.netProfit)}</div>
          <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 4 }}>{(pnl.netProfit || 0) >= 0 ? "Profitable" : "Loss-making"}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="panel-card" style={{ padding: 24 }}>
          <h3 style={{ margin: "0 0 16px" }}>Revenue Breakdown</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Subscription Revenue", value: revenue.subscriptionRevenue || 0 },
              { label: "Service Revenue (Salons)", value: revenue.serviceRevenue || 0 },
              { label: "Product Revenue", value: revenue.productRevenue || 0 },
              { label: "Package Sales", value: revenue.packageRevenue || 0 },
              { label: "Membership Sales", value: revenue.membershipRevenue || 0 }
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", borderRadius: 10, border: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: "0.85rem", color: "#475569", fontWeight: 600 }}>{item.label}</span>
                <span style={{ fontWeight: 800, color: "#10b981" }}>{"\u20B9"}{fmt(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-card" style={{ padding: 24 }}>
          <h3 style={{ margin: "0 0 16px" }}>Expense Categories</h3>
          {categories.length === 0 ? <p style={{ color: "#94a3b8" }}>No expense data available.</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {categories.map((cat, i) => {
                const maxExp = Math.max(...categories.map((c) => c.amount || 0), 1);
                const pct = ((cat.amount || 0) / maxExp) * 100;
                return (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: "#334155" }}>{cat.category || "Other"}</span>
                      <span style={{ fontWeight: 700, color: "#ef4444" }}>{"\u20B9"}{fmt(cat.amount)}</span>
                    </div>
                    <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: pct + "%", background: "linear-gradient(90deg, #ef4444, #f97316)", borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
