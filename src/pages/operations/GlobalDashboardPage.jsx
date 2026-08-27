import { useState, useEffect } from "react";
import { TrendingUp, Calendar, Users, Building2, Activity, ArrowUpRight, ArrowDownRight, Award, DollarSign, PieChart, Shield, RefreshCw } from "lucide-react";
import { api } from "../../api/client";

export default function GlobalDashboardPage() {
  const [period, setPeriod] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState({
    totalRevenue: 0,
    totalAppointments: 0,
    revenueGrowth: "+0%",
    appointmentGrowth: "+0%",
    activeBranchesCount: 0,
    totalCustomers: 0,
    branchPerformance: [],
    growthTrends: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      let queryStart = "";
      let queryEnd = "";

      if (period === "Today") {
        const today = new Date().toISOString().split("T")[0];
        queryStart = today;
        queryEnd = today;
      } else if (period === "Month") {
        const date = new Date();
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split("T")[0];
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split("T")[0];
        queryStart = firstDay;
        queryEnd = lastDay;
      } else if (period === "Custom") {
        queryStart = startDate;
        queryEnd = endDate;
      }

      const params = {};
      if (queryStart && queryEnd) {
        params.startDate = queryStart;
        params.endDate = queryEnd;
      }

      const res = await api.get("/owner/operations/global-dashboard", { params });
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch global dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period, startDate, endDate]);

  const renderGrowthBadge = (growthStr) => {
    if (!growthStr || growthStr === "-") return (
      <span style={{ background: "#f1f5f9", color: "#64748b", padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}>
        -
      </span>
    );
    const isNegative = growthStr.startsWith("-");
    const Icon = isNegative ? ArrowDownRight : ArrowUpRight;
    const bg = isNegative ? "#fee2e2" : "#dcfce7";
    const color = isNegative ? "#991b1b" : "#166534";
    
    return (
      <span style={{ background: bg, color: color, padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}>
        <Icon size={14} /> {growthStr}
      </span>
    );
  };

  return (
    <div className="page-shell super-admin-page">
      {/* Hero Card */}
      <div className="hero-card" style={{ padding: "20px 24px", marginBottom: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div style={{ minWidth: 260, flex: 1 }}>
            <h1 style={{ margin: "0 0 6px 0", fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.25 }}>Global Dashboard — Multi-Branch Intelligence</h1>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748b", lineHeight: 1.4 }}>Cross-branch revenue performance, appointment volume, and growth analytics across all locations.</p>
          </div>
          <button 
            type="button"
            className="btn btn-outline" 
            onClick={fetchData} 
            disabled={loading} 
            style={{ 
              background: "#ffffff", 
              border: "1.5px solid #e2e8f0", 
              borderRadius: 10, 
              padding: "8px 16px", 
              fontWeight: 600, 
              fontSize: "0.85rem",
              color: "#334155",
              display: "inline-flex", 
              alignItems: "center", 
              gap: 6,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Date Period Filter Bar */}
      <div className="panel-card" style={{ padding: "10px 16px", marginBottom: 16, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
            <Calendar size={15} color="#6366f1" /> Period:
          </span>
          <div style={{ display: "inline-flex", background: "#f1f5f9", padding: "3px", borderRadius: 10, gap: 3, flexWrap: "wrap" }}>
            {[
              { id: "ALL", label: "All Time" },
              { id: "Today", label: "Today" },
              { id: "Month", label: "This Month" },
              { id: "Custom", label: "Custom Date" }
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                style={{
                  padding: "5px 14px",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: period === p.id ? 700 : 500,
                  border: "none",
                  background: period === p.id ? "#ffffff" : "transparent",
                  color: period === p.id ? "#4f46e5" : "#64748b",
                  boxShadow: period === p.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap"
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {period === "Custom" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 12, outline: "none", background: "#fff" }}
            />
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 12, outline: "none", background: "#fff" }}
            />
          </div>
        )}
      </div>

      {/* Multi-Branch Key Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 20 }}>
        <div className="panel-card" style={{ padding: 20, borderLeft: "4px solid #6366f1" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#64748b", fontSize: 13, fontWeight: 600 }}>Combined Revenue</span>
            {renderGrowthBadge(data.revenueGrowth)}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginTop: 6 }}>₹{data.totalRevenue.toLocaleString("en-IN")}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Across all {data.activeBranchesCount} active branches</div>
        </div>

        <div className="panel-card" style={{ padding: 20, borderLeft: "4px solid #06b6d4" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#64748b", fontSize: 13, fontWeight: 600 }}>Total Appointments</span>
            {renderGrowthBadge(data.appointmentGrowth)}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginTop: 6 }}>{data.totalAppointments} Bookings</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Service completion rate: 96.2%</div>
        </div>

        <div className="panel-card" style={{ padding: 20, borderLeft: "4px solid #10b981" }}>
          <div style={{ color: "#64748b", fontSize: 13, fontWeight: 600 }}>Total Guests Served</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#047857", marginTop: 6 }}>{data.totalCustomers}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Multi-branch customer registry</div>
        </div>

        <div className="panel-card" style={{ padding: 20, borderLeft: "4px solid #f59e0b" }}>
          <div style={{ color: "#64748b", fontSize: 13, fontWeight: 600 }}>Active Salon Branches</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#d97706", marginTop: 6 }}>{data.activeBranchesCount} Locations</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>100% operational uptime</div>
        </div>
      </div>

      {/* Branch Performance Comparison Table */}
      <div className="panel-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>Branch Growth & Revenue Comparison</h3>
          <span className="badge" style={{ background: "#eef2ff", color: "#4338ca", fontWeight: 700 }}>4 Locations Reporting</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left", fontSize: 12, color: "#64748b" }}>
                <th style={{ padding: 12 }}>Branch Name & City</th>
                <th style={{ padding: 12 }}>Revenue Generated</th>
                <th style={{ padding: 12 }}>Revenue Share %</th>
                <th style={{ padding: 12 }}>Appointments</th>
                <th style={{ padding: 12 }}>Staff Count</th>
                <th style={{ padding: 12 }}>MoM Growth</th>
                <th style={{ padding: 12 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.branchPerformance.map(b => {
                const sharePercent = ((b.revenue / data.totalRevenue) * 100).toFixed(1);
                return (
                  <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: 14 }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{b.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{b.city} Branch</div>
                    </td>
                    <td style={{ padding: 14, fontWeight: 800, color: "#4f46e5" }}>
                      ₹{b.revenue.toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, background: "#e2e8f0", height: 6, borderRadius: 3, overflow: "hidden", minWidth: 60 }}>
                          <div style={{ background: "#6366f1", height: "100%", width: `${sharePercent}%` }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>{sharePercent}%</span>
                      </div>
                    </td>
                    <td style={{ padding: 14, fontWeight: 600 }}>{b.appointments} Bookings</td>
                    <td style={{ padding: 14 }}>{b.staffCount} Staff</td>
                    <td style={{ padding: 14 }}>
                      {renderGrowthBadge(b.growth)}
                    </td>
                    <td style={{ padding: 14 }}>
                      <span className="badge" style={{
                        background: b.status === "TOP PERFORMER" ? "#dcfce7" : "#e0e7ff",
                        color: b.status === "TOP PERFORMER" ? "#166534" : "#3730a3",
                        fontWeight: 700
                      }}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Growth Trend Visual Deck */}
      <div className="panel-card" style={{ padding: 24 }}>
        <h3 style={{ marginTop: 0, fontSize: 18, color: "#0f172a" }}>Monthly Multi-Branch Trajectory</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 16 }}>
          {data.growthTrends.map((t, idx) => (
            <div key={idx} style={{ padding: 16, background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700 }}>{t.month} Growth Trend</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>₹{t.revenue.toLocaleString("en-IN")}</div>
              <div style={{ fontSize: 12, color: "#059669", fontWeight: 600, marginTop: 2 }}>{t.appointments} Appointments</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
