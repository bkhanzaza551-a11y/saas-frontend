import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import PageLoader from "../../components/PageLoader";
import EmptyState from "../../components/EmptyState";
import { TrendingUp, TrendingDown, ArrowDown, ArrowUp, Plus, X } from "lucide-react";

const fmt = (val) => Number(val || 0).toLocaleString("en-IN");

const PAYMENT_MODES = [
  { value: "CASH", label: "Cash" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" }
];

const modeColors = {
  CASH: { color: "#d97706", bg: "#fef3c7" },
  CHEQUE: { color: "#7c3aed", bg: "#f5f3ff" },
  BANK_TRANSFER: { color: "#1d4ed8", bg: "#dbeafe" },
  UPI: { color: "#059669", bg: "#d1fae5" },
  CARD: { color: "#db2777", bg: "#fce7f3" }
};

export default function FinancialReportsPage() {
  const [activeTab, setActiveTab] = useState("pnl");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txSummary, setTxSummary] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [salons, setSalons] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ salonId: "", amount: "", mode: "CASH", paymentFor: "Subscription", notes: "", paidAt: "" });

  const load = async () => {
    setLoading(true); setError("");
    try {
      const params = { period };
      if (period === "custom" && dateFrom) params.dateFrom = dateFrom;
      if (period === "custom" && dateTo) params.dateTo = dateTo;
      const res = await api.get("/super-admin/financial-reports", { params });
      setData(res.data);
    } catch (err) { setError(formatApiError(err, "Could not load financial reports")); }
    finally { setLoading(false); }
  };

  const loadTransactions = async () => {
    setTxLoading(true);
    try {
      const [txRes, sumRes] = await Promise.all([
        api.get("/super-admin/finance/transactions"),
        api.get("/super-admin/finance/summary")
      ]);
      setTransactions(txRes.data || []);
      setTxSummary(sumRes.data);
    } catch (err) { console.error(err); }
    finally { setTxLoading(false); }
  };

  const loadSalons = async () => {
    try {
      const res = await api.get("/super-admin/salons");
      setSalons(res.data?.salons || res.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { load(); }, [period, dateFrom, dateTo]);
  useEffect(() => { if (activeTab === "transactions") loadTransactions(); }, [activeTab]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!form.amount || isNaN(parseFloat(form.amount))) return;
    setSaving(true);
    try {
      await api.post("/super-admin/finance/record-payment", { ...form, amount: parseFloat(form.amount) });
      setForm({ salonId: "", amount: "", mode: "CASH", paymentFor: "Subscription", notes: "", paidAt: "" });
      setShowModal(false);
      loadTransactions();
    } catch (err) { alert(formatApiError(err, "Failed to record payment")); }
    finally { setSaving(false); }
  };

  const openModal = () => { loadSalons(); setShowModal(true); };

  if (loading && activeTab === "pnl") return <div className="page-shell super-admin-page"><PageLoader title="Loading financial reports" /></div>;

  const pnl = data || {};
  const revenue = pnl.revenue || {};
  const expenses = pnl.expenses || {};
  const categories = pnl.expenseCategories || [];

  return (
    <div className="page-shell super-admin-page">
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0 }}>Finance</h1>
            <p style={{ marginBottom: 0 }}>P&L reports and SaaS payment tracking.</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {activeTab === "transactions" && (
              <button onClick={openModal} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                <Plus size={16} /> Record Payment
              </button>
            )}
            {activeTab === "pnl" && (
              <div style={{ display: "inline-flex", background: "#f1f5f9", padding: 4, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                {["all", "today", "month", "year", "custom"].map((p) => (
                  <button key={p} type="button" onClick={() => setPeriod(p)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: period === p ? "white" : "transparent", color: period === p ? "#4f46e5" : "#64748b", fontWeight: period === p ? 700 : 600, fontSize: "0.78rem", cursor: "pointer" }}>
                    {p === "all" ? "All" : p === "today" ? "Today" : p === "month" ? "Month" : p === "year" ? "Year" : "Custom"}
                  </button>
                ))}
              </div>
            )}
            {period === "custom" && activeTab === "pnl" && (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.78rem" }} />
                <span style={{ color: "#64748b", fontSize: "0.78rem" }}>to</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.78rem" }} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#f1f5f9", padding: 4, borderRadius: 10, width: "fit-content", border: "1px solid #e2e8f0" }}>
        {[{ key: "pnl", label: "P&L Report" }, { key: "transactions", label: "Transaction History" }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: activeTab === tab.key ? "#fff" : "transparent", color: activeTab === tab.key ? "#0f172a" : "#64748b", boxShadow: activeTab === tab.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div style={{ background: "#fef2f2", color: "#991b1b", padding: "12px 16px", borderRadius: 10, marginBottom: 16 }}>{error}</div>}

      {activeTab === "pnl" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Total Revenue", value: revenue.total, color: "#10b981", icon: <ArrowUp size={16} />, bg: "#ecfdf5", caption: "Subscription + Salon payments" },
              { label: "Total Expenses", value: expenses.total, color: "#ef4444", icon: <ArrowDown size={16} />, bg: "#fef2f2", caption: "Platform operations" },
              { label: "Net Profit/Loss", value: pnl.netProfit, color: (pnl.netProfit || 0) >= 0 ? "#10b981" : "#ef4444", icon: (pnl.netProfit || 0) >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />, bg: (pnl.netProfit || 0) >= 0 ? "#ecfdf5" : "#fef2f2", caption: (pnl.netProfit || 0) >= 0 ? "Profitable" : "Loss-making" }
            ].map(card => (
              <div key={card.label} style={{ background: "white", border: "1px solid #f1f5f9", borderRadius: 16, padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{card.label}</span>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: card.bg, color: card.color, display: "flex", alignItems: "center", justifyContent: "center" }}>{card.icon}</div>
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: card.color }}>?{fmt(card.value)}</div>
                <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 4 }}>{card.caption}</div>
              </div>
            ))}
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
                    <span style={{ fontWeight: 800, color: "#10b981" }}>?{fmt(item.value)}</span>
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
                          <span style={{ fontWeight: 700, color: "#ef4444" }}>?{fmt(cat.amount)}</span>
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
        </>
      )}

      {activeTab === "transactions" && (
        <>
          {txSummary && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 24 }}>
              <div style={{ background: "white", border: "1px solid #f1f5f9", borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Total Collected</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#10b981" }}>?{fmt(txSummary.totalCollected)}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{txSummary.count} transaction{txSummary.count !== 1 ? "s" : ""}</div>
              </div>
              {Object.entries(txSummary.byMode || {}).map(([mode, amount]) => {
                const mc = modeColors[mode] || { color: "#475569", bg: "#f1f5f9" };
                return (
                  <div key={mode} style={{ background: "white", border: "1px solid #f1f5f9", borderRadius: 16, padding: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8, color: mc.color }}>{mode}</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: mc.color }}>?{fmt(amount)}</div>
                  </div>
                );
              })}
            </div>
          )}
          {txLoading ? <PageLoader title="Loading transactions" /> : transactions.length === 0 ? (
            <EmptyState title="No Transactions" message="Record the first manual payment using the button above." />
          ) : (
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["TXN ID", "Salon", "Purpose", "Amount", "Mode", "Date", "Recorded By"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, i) => {
                    const mc = modeColors[tx.paymentMethod] || { color: "#475569", bg: "#f1f5f9" };
                    return (
                      <tr key={tx.id} style={{ borderBottom: i < transactions.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8", fontFamily: "monospace" }}>{tx.transactionId}</td>
                        <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{tx.salon?.name || "—"}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "#475569" }}>{tx.paymentFor}</td>
                        <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 700, color: "#10b981" }}>?{fmt(tx.amount)}</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: mc.color, background: mc.bg }}>{tx.paymentMethod}</span></td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b" }}>{new Date(tx.paymentDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8" }}>{tx.recordedBy || "Super Admin"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setShowModal(false)} />
          <div style={{ background: "#fff", width: "100%", maxWidth: 520, borderRadius: 16, boxShadow: "0 25px 50px rgba(0,0,0,0.15)", position: "relative", zIndex: 1 }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Record Manual Payment</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={22} /></button>
            </div>
            <form onSubmit={handleRecordPayment} style={{ padding: "20px 24px" }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Salon (Optional)</label>
                <select value={form.salonId} onChange={e => setForm({ ...form, salonId: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}>
                  <option value="">— Platform / General —</option>
                  {salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Amount (Rs.) *</label>
                  <input type="number" required min="1" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 5000" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Payment Mode</label>
                  <select value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}>
                    {PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Payment For</label>
                  <select value={form.paymentFor} onChange={e => setForm({ ...form, paymentFor: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}>
                    {["Subscription", "Onboarding Fee", "Support Charge", "Custom"].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Payment Date</label>
                  <input type="date" value={form.paidAt} onChange={e => setForm({ ...form, paidAt: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Notes (Optional)</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Cheque #1234 from XYZ Salon" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: "10px 20px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8, fontWeight: 600, cursor: "pointer", color: "#475569" }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: "10px 24px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Recording..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
