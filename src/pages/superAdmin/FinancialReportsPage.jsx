import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import PageLoader from "../../components/PageLoader";
import EmptyState from "../../components/EmptyState";
import CustomSelect from "../../components/CustomSelect";
import { Plus, Eye, Search, Calendar, Download, Filter } from "lucide-react";

const fmt = (val) => `₹${Number(val || 0).toLocaleString("en-IN")}`;
const localDateStr = (d = new Date()) => {
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const exportCsv = (rows) => {
  if (!rows.length) return;
  const headers = ["TXN ID", "Salon", "For", "Amount", "Method", "Status", "Date", "Reference", "Notes"];
  const csvRows = [headers.join(",")];
  rows.forEach(r => {
    csvRows.push([
      `"${r.transactionId || ""}"`,
      `"${(r.salon?.name || "").replace(/"/g, '""')}"`,
      `"${r.paymentFor || ""}"`,
      r.amount || 0,
      `"${r.paymentMethod || ""}"`,
      `"${r.paymentStatus || ""}"`,
      `"${r.paymentDate ? new Date(r.paymentDate).toLocaleDateString() : ""}"`,
      `"${(r.reference || "").replace(/"/g, '""')}"`,
      `"${(r.notes || "").replace(/"/g, '""')}"`
    ].join(","));
  });
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `finance-transactions-${localDateStr()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const PAYMENT_MODES = [
  { value: "ONLINE", label: "Online" },
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "UPI", label: "UPI" },
  { value: "OTHER", label: "Other" }
];

const PAYMENT_FOR_OPTIONS = [
  { value: "Subscription", label: "Subscription" },
  { value: "Product", label: "Product" },
  { value: "Other Service", label: "Other Service" }
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "COMPLETED", label: "Paid" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "PARTIALLY_PAID", label: "Partially Paid" }
];

const DATE_PRESETS = [
  { key: "today", label: "Today", from: () => new Date().toISOString().slice(0, 10), to: () => new Date().toISOString().slice(0, 10) },
  { key: "month", label: "This Month", from: () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`; }, to: () => new Date().toISOString().slice(0, 10) },
  { key: "year", label: "This Year", from: () => `${new Date().getFullYear()}-01-01`, to: () => new Date().toISOString().slice(0, 10) },
  { key: "custom", label: "Custom", from: "", to: "" }
];

export default function FinancialReportsPage() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ error: "", success: "" });

  const [q, setQ] = useState("");
  const [salonFilter, setSalonFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentForFilter, setPaymentForFilter] = useState("");
  const [datePreset, setDatePreset] = useState("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [recordForm, setRecordForm] = useState({ salonId: "", amount: "", mode: "ONLINE", paymentFor: "Subscription", reference: "", notes: "", paidAt: localDateStr() });

  const [detailTxn, setDetailTxn] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      let from = dateFrom, to = dateTo;
      if (datePreset !== "custom") {
        const preset = DATE_PRESETS.find(p => p.key === datePreset);
        if (preset) {
          from = typeof preset.from === "function" ? preset.from() : preset.from;
          to = typeof preset.to === "function" ? preset.to() : preset.to;
        }
      }

      const params = {};
      if (salonFilter) params.salonId = salonFilter;
      if (modeFilter) params.mode = modeFilter;
      if (statusFilter) params.status = statusFilter;
      if (paymentForFilter) params.paymentFor = paymentForFilter;
      if (q) params.q = q;
      if (from) params.from = from;
      if (to) params.to = to;

      const [sumRes, txnRes, salonRes] = await Promise.all([
        api.get("/super-admin/finance/summary", { params: { from, to } }),
        api.get("/super-admin/finance/transactions", { params }),
        api.get("/super-admin/salons")
      ]);
      setSummary(sumRes.data);
      setTransactions(txnRes.data);
      setSalons(salonRes.data);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not load finance data"), success: "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [datePreset, salonFilter, modeFilter, statusFilter, paymentForFilter]);

  const applyFilters = () => loadData();

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!recordForm.amount || isNaN(Number(recordForm.amount)) || Number(recordForm.amount) <= 0) return;
    try {
      await api.post("/super-admin/finance/record-payment", {
        ...recordForm,
        salonId: recordForm.salonId || undefined,
        amount: parseFloat(recordForm.amount),
        paidAt: recordForm.paidAt || undefined
      });
      setIsRecordOpen(false);
      setRecordForm({ salonId: "", amount: "", mode: "ONLINE", paymentFor: "Subscription", reference: "", notes: "", paidAt: localDateStr() });
      setStatus({ error: "", success: "Payment recorded." });
      await loadData();
    } catch (err) {
      setStatus({ error: formatApiError(err), success: "" });
    }
  };

  if (loading && !summary) return <PageLoader />;

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ marginTop: 0 }}>Finance</h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.9rem" }}>Revenue, transactions, and payment tracking</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={() => setIsRecordOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", background: "linear-gradient(135deg, #4f46e5, #3b82f6)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              <Plus size={16} /> Record Payment
            </button>
            {transactions.length > 0 && (
              <button onClick={() => exportCsv(transactions)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", background: "white", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                <Download size={16} /> Export CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {status.error && <div style={{ padding: 12, background: "#fef2f2", color: "#ef4444", borderRadius: 8, marginBottom: 16 }}>{status.error}</div>}
      {status.success && <div style={{ padding: 12, background: "#f0fdf4", color: "#16a34a", borderRadius: 8, marginBottom: 16 }}>{status.success}</div>}

      {/* Point 1: Finance Summary Top Cards (Respecting Date Range) */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Total Revenue", value: fmt(summary.totalRevenue), color: "#0f172a", bg: "#f0fdf4", border: "#10b981" },
            { label: "Subscription Revenue", value: fmt(summary.subscriptionRevenue), color: "#4f46e5", bg: "#eef2ff", border: "#6366f1" },
            { label: "Product Revenue", value: fmt(summary.productRevenue), color: "#8b5cf6", bg: "#f5f3ff", border: "#8b5cf6" },
            { label: "Pending Payments", value: `${fmt(summary.pendingAmount)} (${summary.pendingCount || 0})`, color: "#d97706", bg: "#fffbeb", border: "#f59e0b" },
            { label: "Refunds", value: fmt(summary.refundsAmount || 0), color: "#dc2626", bg: "#fef2f2", border: "#ef4444" }
          ].map((card, idx) => (
            <div key={idx} style={{ background: card.bg, padding: 18, borderRadius: 12, border: "1px solid #e2e8f0", borderLeft: `4px solid ${card.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>{card.label}</div>
              <div style={{ fontSize: "1.35rem", fontWeight: 800, color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Point 1: Date Filter Bar + Search & Filters */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", marginBottom: 24, border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)" }}>
        
        {/* Search Bar Row with Date Filter presets */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, position: "relative", minWidth: 260 }}>
            <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex", pointerEvents: "none" }}>
              <Search size={18} />
            </div>
            <input
              value={q}
              placeholder="Search Transaction ID, salon, reference..."
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") applyFilters(); }}
              style={{ width: "100%", height: 44, padding: "0 16px 0 42px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
              onFocus={e => e.target.style.borderColor = "#6366f1"}
              onBlur={e => e.target.style.borderColor = "#cbd5e1"}
            />
          </div>
          
          {/* Point 1: Date Filter Presets (Today, This Month, This Year, Custom) */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f8fafc", padding: "4px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
            {DATE_PRESETS.map(p => (
              <button
                key={p.key}
                onClick={() => {
                  setDatePreset(p.key);
                  if (p.key === "custom") { setDateFrom(""); setDateTo(""); }
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: "none",
                  background: datePreset === p.key ? "#4f46e5" : "transparent",
                  color: datePreset === p.key ? "#fff" : "#64748b",
                  fontSize: 13,
                  fontWeight: datePreset === p.key ? 700 : 500,
                  cursor: "pointer",
                  boxShadow: datePreset === p.key ? "0 1px 3px rgba(79, 70, 229, 0.25)" : "none",
                  transition: "all 0.2s"
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          
          <button onClick={applyFilters} disabled={loading} style={{ height: 44, padding: "0 20px", background: "linear-gradient(135deg, #4f46e5, #3b82f6)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)", transition: "transform 0.2s", opacity: loading ? 0.7 : 1 }} onMouseOver={e => !loading && (e.currentTarget.style.transform="translateY(-1px)")} onMouseOut={e => !loading && (e.currentTarget.style.transform="none")}>
            {loading ? "Loading..." : "Search"}
          </button>
          
          <button 
            onClick={() => { setQ(""); setSalonFilter(""); setModeFilter(""); setStatusFilter(""); setPaymentForFilter(""); setDatePreset("month"); setDateFrom(""); setDateTo(""); }}
            style={{ height: 44, padding: "0 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#475569", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
            onMouseOver={e => { e.currentTarget.style.background="#e2e8f0"; e.currentTarget.style.color="#0f172a"; }}
            onMouseOut={e => { e.currentTarget.style.background="#f1f5f9"; e.currentTarget.style.color="#475569"; }}
          >
            <Filter size={15} />
            Reset
          </button>
        </div>

        {/* Dropdowns Row (Point 2: Payment For, Point 3: Payment Status, Point 4: Payment Method) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
          <CustomSelect
            value={salonFilter}
            onChange={e => setSalonFilter(e.target.value)}
            style={{ width: "100%" }}
          >
            <option value="">All Salons</option>
            {salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </CustomSelect>
          
          <CustomSelect
            value={paymentForFilter}
            onChange={e => setPaymentForFilter(e.target.value)}
            style={{ width: "100%" }}
          >
            <option value="">All Payment For</option>
            {PAYMENT_FOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </CustomSelect>
          
          <CustomSelect
            value={modeFilter}
            onChange={e => setModeFilter(e.target.value)}
            style={{ width: "100%" }}
          >
            <option value="">All Methods</option>
            {PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </CustomSelect>
          
          <CustomSelect
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ width: "100%" }}
          >
            {PAYMENT_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </CustomSelect>
          
          {datePreset === "custom" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="Date from" style={{ flex: 1, height: 42, padding: "0 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, background: "#f8fafc", color: "#334155", outline: "none", cursor: "pointer", boxSizing: "border-box", minWidth: 0 }} />
              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>to</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="Date to" style={{ flex: 1, height: 42, padding: "0 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, background: "#f8fafc", color: "#334155", outline: "none", cursor: "pointer", boxSizing: "border-box", minWidth: 0 }} />
            </div>
          )}
        </div>
      </div>

      {/* Point 2: Transactions Main Section with exact 9 columns */}
      {transactions.length === 0 ? (
        <EmptyState title="No Transactions" message="No financial transactions matching the selected filters." />
      ) : (
        <div style={{ overflowX: "auto", background: "white", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f1f5f9", background: "#f8fafc", color: "#64748b", fontWeight: 700 }}>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Transaction ID</th>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Salon Name</th>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Payment For</th>
                <th style={{ padding: "14px 16px", textAlign: "right" }}>Amount</th>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Payment Method</th>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Payment Status</th>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Payment Date</th>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Invoice/Reference</th>
                <th style={{ padding: "14px 16px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(txn => {
                const isPaid = txn.paymentStatus === "COMPLETED" || txn.paymentStatus === "PAID";
                const isFailed = txn.paymentStatus === "FAILED";
                const isRefunded = txn.paymentStatus === "REFUNDED";
                const isPartiallyPaid = txn.paymentStatus === "PARTIALLY_PAID";
                const statusColor = isPaid ? "#10b981" : isFailed ? "#ef4444" : isRefunded ? "#8b5cf6" : isPartiallyPaid ? "#6366f1" : "#d97706";
                const statusBg = isPaid ? "#ecfdf5" : isFailed ? "#fef2f2" : isRefunded ? "#f5f3ff" : isPartiallyPaid ? "#eef2ff" : "#fffbeb";
                const statusLabel = isPaid ? "Paid" : isPartiallyPaid ? "Partially Paid" : txn.paymentStatus === "REFUNDED" ? "Refunded" : txn.paymentStatus === "FAILED" ? "Failed" : "Pending";

                return (
                  <tr key={txn.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 16px", fontFamily: "monospace", fontSize: 12, color: "#4f46e5", fontWeight: 700 }}>
                      {txn.transactionId || "—"}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>
                      {txn.salon?.name || "—"}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        background: txn.paymentFor === "Subscription" ? "#eef2ff" : txn.paymentFor === "Product" ? "#f5f3ff" : "#f8fafc",
                        color: txn.paymentFor === "Subscription" ? "#4f46e5" : txn.paymentFor === "Product" ? "#8b5cf6" : "#475569",
                        padding: "3px 10px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700
                      }}>
                        {txn.paymentFor || "Other Service"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 800, color: "#0f172a" }}>
                      {fmt(txn.amount)}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#334155", fontWeight: 600 }}>
                      {txn.paymentMethod || "Online"}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ background: statusBg, color: statusColor, padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700 }}>
                        {statusLabel}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: "#475569" }}>
                      {txn.paymentDate ? new Date(txn.paymentDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: "#64748b" }}>
                      {txn.reference || "—"}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => setDetailTxn(txn)}
                        style={{ padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: 6, background: "#f8fafc", color: "#334155", fontWeight: 700, fontSize: 11, cursor: "pointer" }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isRecordOpen && (
        <div className="modal-overlay" onClick={() => setIsRecordOpen(false)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header"><h3>Record Payment</h3><button className="modal-close-btn" onClick={() => setIsRecordOpen(false)}>&times;</button></div>
            <form onSubmit={handleRecordPayment} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label>
                <span style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>Salon (optional)</span>
                <CustomSelect
                  value={recordForm.salonId}
                  onChange={e => setRecordForm({ ...recordForm, salonId: e.target.value })}
                  style={{ width: "100%" }}
                >
                  <option value="">Select salon</option>
                  {salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </CustomSelect>
              </label>
              <label><span style={{ fontSize: 12, fontWeight: 700 }}>Amount (INR) *</span><input type="number" min="0" step="0.01" value={recordForm.amount} required onChange={e => setRecordForm({ ...recordForm, amount: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }} /></label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <label>
                  <span style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>Payment For</span>
                  <CustomSelect
                    value={recordForm.paymentFor}
                    onChange={e => setRecordForm({ ...recordForm, paymentFor: e.target.value })}
                    style={{ width: "100%" }}
                  >
                    {PAYMENT_FOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </CustomSelect>
                </label>
                <label>
                  <span style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>Payment Method</span>
                  <CustomSelect
                    value={recordForm.mode}
                    onChange={e => setRecordForm({ ...recordForm, mode: e.target.value })}
                    style={{ width: "100%" }}
                  >
                    {PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </CustomSelect>
                </label>
              </div>
              <label><span style={{ fontSize: 12, fontWeight: 700 }}>Payment Date</span><input type="date" value={recordForm.paidAt} onChange={e => setRecordForm({ ...recordForm, paidAt: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }} /></label>
              <label><span style={{ fontSize: 12, fontWeight: 700 }}>Reference</span><input value={recordForm.reference} placeholder="Invoice #, transaction ref..." onChange={e => setRecordForm({ ...recordForm, reference: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }} /></label>
              <label><span style={{ fontSize: 12, fontWeight: 700 }}>Notes</span><textarea rows={2} value={recordForm.notes} onChange={e => setRecordForm({ ...recordForm, notes: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", boxSizing: "border-box" }} /></label>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setIsRecordOpen(false)} style={{ padding: "10px 18px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 18px", background: "#4f46e5", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Point 6: Transaction Detail Modal (Exact fields + View Salon shortcut) */}
      {detailTxn && (
        <div className="modal-overlay" onClick={() => setDetailTxn(null)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Transaction Detail</h3>
              <button className="modal-close-btn" onClick={() => setDetailTxn(null)}>&times;</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "12px 0", fontSize: "0.9rem", padding: "16px 0" }}>
              <div style={{ color: "#64748b" }}>Transaction ID</div>
              <div style={{ fontWeight: 700, fontFamily: "monospace", color: "#4f46e5" }}>{detailTxn.transactionId}</div>

              <div style={{ color: "#64748b" }}>Salon</div>
              <div style={{ fontWeight: 700, color: "#0f172a" }}>{detailTxn.salon?.name || "General / Global"}</div>

              <div style={{ color: "#64748b" }}>Owner</div>
              <div style={{ fontWeight: 600, color: "#334155" }}>{detailTxn.salon?.ownerName || "—"}</div>

              <div style={{ color: "#64748b" }}>Amount</div>
              <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "#10b981" }}>{fmt(detailTxn.amount)}</div>

              <div style={{ color: "#64748b" }}>Payment For</div>
              <div style={{ fontWeight: 600 }}>{detailTxn.paymentFor || "Other Service"}</div>

              <div style={{ color: "#64748b" }}>Plan / Product Ref</div>
              <div>{detailTxn.reference || "Standard"}</div>

              <div style={{ color: "#64748b" }}>Payment Method</div>
              <div>{detailTxn.paymentMethod || "Online"}</div>

              <div style={{ color: "#64748b" }}>Payment Status</div>
              <div>
                <span style={{
                  color: detailTxn.paymentStatus === "COMPLETED" || detailTxn.paymentStatus === "PAID" ? "#10b981" : detailTxn.paymentStatus === "FAILED" ? "#ef4444" : "#d97706",
                  fontWeight: 700
                }}>
                  {detailTxn.paymentStatus === "COMPLETED" || detailTxn.paymentStatus === "PAID" ? "Paid" : detailTxn.paymentStatus}
                </span>
              </div>

              <div style={{ color: "#64748b" }}>Payment Date</div>
              <div>{detailTxn.paymentDate ? new Date(detailTxn.paymentDate).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—"}</div>

              <div style={{ color: "#64748b" }}>Recorded By</div>
              <div style={{ color: "#475569" }}>{detailTxn.recordedBy || "System Auto-Sync"}</div>

              {detailTxn.notes && (
                <>
                  <div style={{ color: "#64748b" }}>Notes</div>
                  <div style={{ color: "#475569", background: "#f8fafc", padding: "6px 10px", borderRadius: 6, fontSize: 13 }}>{detailTxn.notes}</div>
                </>
              )}
            </div>

            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {detailTxn.salon?.id ? (
                <a
                  href={`/super-admin/salons/${detailTxn.salon.id}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#4f46e5", fontWeight: 700, fontSize: 13, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  View Salon →
                </a>
              ) : <div />}

              <button
                onClick={() => setDetailTxn(null)}
                style={{ padding: "8px 18px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
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
