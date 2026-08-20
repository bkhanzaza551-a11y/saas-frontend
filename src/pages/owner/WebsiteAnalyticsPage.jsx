import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { Calendar, TrendingUp, CheckCircle2, Clock, XCircle, Tag, Globe, ArrowUpRight } from "lucide-react";
import { api } from "../../api/client";

export default function WebsiteAnalyticsPage() {
  const outletCtx = useOutletContext() || {};
  const salon = outletCtx.salon || {};
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get("/owner/orders").catch(() => ({ data: [] })),
      api.get("/owner/orders/reports/summary").catch(() => ({ data: {} })),
      api.get("/owner/services").catch(() => ({ data: [] })),
      api.get("/owner/service-categories").catch(() => ({ data: [] }))
    ]).then(([ordersRes, summaryRes, servRes, catRes]) => {
      if (!active) return;
      const allBookings = ordersRes.data?.orders || ordersRes.data || [];
      const servList = servRes.data?.services || servRes.data || [];
      const catList = catRes.data?.categories || catRes.data || [];

      setBookings(allBookings);
      setServices(servList);
      setCategories(catList);
      setStats({
        ...summaryRes.data,
        totalServices: servList.length,
        totalCategories: catList.length,
        avgBookingValue: summaryRes.data?.totalSales && summaryRes.data?.totalOrders
          ? summaryRes.data.totalSales / summaryRes.data.totalOrders : 0
      });
      setLoading(false);
    }).catch(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, []);

  const currency = salon?.currency || "INR";

  const getFilteredBookings = () => {
    const now = new Date();
    return bookings.filter(b => {
      if (period === "today") {
        const d = new Date(b.createdAt);
        return d.toDateString() === now.toDateString();
      }
      if (period === "week") {
        const d = new Date(b.createdAt);
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        return d >= weekAgo;
      }
      if (period === "month") {
        const d = new Date(b.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  const filtered = getFilteredBookings();
  const cancelledCount = filtered.filter(b => b.status === "CANCELLED").length;

  const statusBreakdown = {
    NEW: filtered.filter(b => b.status === "NEW").length,
    ACCEPTED: filtered.filter(b => b.status === "ACCEPTED").length,
    READY: filtered.filter(b => b.status === "READY").length,
    COMPLETED: filtered.filter(b => b.status === "COMPLETED").length,
    CANCELLED: cancelledCount,
  };

  const topServices = {};
  filtered.forEach(b => {
    (b.items || []).forEach(item => {
      const name = item.product?.name || item.name || item.service?.name || "Salon Service";
      if (!topServices[name]) topServices[name] = { name, qty: 0, revenue: 0 };
      topServices[name].qty += item.qty || 1;
      topServices[name].revenue += Number(item.price || 0) * (item.qty || 1);
    });
  });
  const topServicesList = Object.values(topServices).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const recentBookings = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);

  const liveSiteUrl = salon?.slug ? `/salon/${salon.slug}` : "/";

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading booking analytics...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Website & Booking Analytics</h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>{salon?.name || "Salon"} online service bookings, appointments & performance</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <a
            href={liveSiteUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #c7d2fe",
              background: "#eef2ff",
              color: "#4f46e5",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none"
            }}
          >
            <Globe size={14} /> View Live Website <ArrowUpRight size={14} />
          </a>
          <div style={{ display: "flex", gap: 6, background: "#f8fafc", padding: 4, borderRadius: 8, border: "1px solid #e2e8f0" }}>
            {[
              { key: "today", label: "Today" },
              { key: "week", label: "Week" },
              { key: "month", label: "Month" },
              { key: "all", label: "All Time" }
            ].map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: "none",
                  background: period === p.key ? "#4f46e5" : "transparent",
                  color: period === p.key ? "#fff" : "#64748b",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top Booking KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Total Bookings", value: stats?.totalOrders || filtered.length, color: "#4f46e5", bg: "#eef2ff" },
          { label: "Booking Revenue", value: `${currency} ${Number(stats?.totalSales || 0).toLocaleString("en-IN")}`, color: "#10b981", bg: "#ecfdf5" },
          { label: "Avg Booking Value", value: `${currency} ${Number(stats?.avgBookingValue || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, color: "#f59e0b", bg: "#fffbeb" },
          { label: "Pending Bookings", value: statusBreakdown.NEW, color: "#3b82f6", bg: "#eff6ff" },
          { label: "Completed Bookings", value: statusBreakdown.COMPLETED, color: "#10b981", bg: "#ecfdf5" },
          { label: "Cancelled", value: statusBreakdown.CANCELLED, color: "#ef4444", bg: "#fef2f2" },
        ].map((c, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0", borderLeft: `4px solid ${c.color}`, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>{c.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
        {/* Booking Status Breakdown */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 20px" }}>Online Booking Status Breakdown</h3>
          {[
            { key: "NEW", label: "Pending (New)", color: "#3b82f6" },
            { key: "ACCEPTED", label: "Confirmed", color: "#f59e0b" },
            { key: "READY", label: "In Service / Progress", color: "#8b5cf6" },
            { key: "COMPLETED", label: "Completed", color: "#10b981" },
            { key: "CANCELLED", label: "Cancelled", color: "#ef4444" }
          ].map(({ key, label, color }) => {
            const count = statusBreakdown[key] || 0;
            const pct = filtered.length > 0 ? (count / filtered.length * 100) : 0;
            return (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600, color: "#334155" }}>{label}</span>
                  <span style={{ color: "#64748b", fontWeight: 700 }}>{count} ({pct.toFixed(0)}%)</span>
                </div>
                <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Top Booked Services */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 20px" }}>Top Booked Services</h3>
          {topServicesList.length === 0 ? (
            <div style={{ padding: "30px 0", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>No online service bookings in this timeframe yet.</div>
          ) : topServicesList.map((p, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < topServicesList.length - 1 ? "1px solid #f1f5f9" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#4f46e5" }}>#{i + 1}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{p.name}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{currency} {Number(p.revenue || 0).toLocaleString("en-IN")}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{p.qty} booked</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Online Catalog & Services Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 32 }}>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: 30, marginBottom: 6 }}>✂️</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>{services.length || 0}</div>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Active Salon Services</div>
          <div style={{ fontSize: 12, color: "#10b981", marginTop: 4, fontWeight: 600 }}>Available for online booking</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: 30, marginBottom: 6 }}>📂</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>{categories.length || 0}</div>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Service Categories</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: 30, marginBottom: 6 }}>💳</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#10b981" }}>{currency} {Number(stats?.totalSales || 0).toLocaleString("en-IN")}</div>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Total Booking Revenue</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{stats?.totalOrders || filtered.length} bookings fulfilled</div>
        </div>
      </div>

      {/* Recent Online Bookings Table */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>Recent Online Service Bookings</h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>Latest customer appointments booked through salon website</p>
          </div>
          <Link to="/admin/order-dashboard" style={{ fontSize: 13, color: "#4f46e5", fontWeight: 700, textDecoration: "none" }}>
            View All Bookings →
          </Link>
        </div>
        {recentBookings.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>No online bookings recorded yet.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Booking ID</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Guest / Customer</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Services</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Amount</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Booking Status</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Payment</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map(b => {
                const statusMeta = {
                  NEW: { label: "Pending", bg: "#eff6ff", color: "#1d4ed8" },
                  ACCEPTED: { label: "Confirmed", bg: "#fffbeb", color: "#b45309" },
                  READY: { label: "In Progress", bg: "#f5f3ff", color: "#7c3aed" },
                  COMPLETED: { label: "Completed", bg: "#ecfdf5", color: "#047857" },
                  CANCELLED: { label: "Cancelled", bg: "#fef2f2", color: "#b91c1c" }
                };
                const st = statusMeta[b.status] || { label: b.status, bg: "#f1f5f9", color: "#475569" };
                const isPaid = b.paymentStatus === "PAID";
                return (
                  <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: "#4f46e5" }}>
                      {b.orderNumber || b.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
                      {b.customerName || "Guest User"}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "#475569" }}>
                      {(b.items && b.items.length > 0) ? b.items.map(i => i.name || i.product?.name || "Service").join(", ") : "Salon Service"}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 800, textAlign: "right", color: "#0f172a" }}>
                      {currency} {Number(b.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: isPaid ? "#ecfdf5" : "#f1f5f9", color: isPaid ? "#047857" : "#475569" }}>
                        {isPaid ? "Paid Online" : "Pay at Salon"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: "#64748b", textAlign: "right" }}>
                      {b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
