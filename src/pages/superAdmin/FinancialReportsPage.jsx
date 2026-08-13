import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import PageLoader from "../../components/PageLoader";
import EmptyState from "../../components/EmptyState";
import { Plus, Eye, Search, Calendar, Download } from "lucide-react";

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
  { value: "Onboarding Fee", label: "Onboarding Fee" },
  { value: "Support Charge", label: "Support Charge" },
  { value: "Custom", label: "Custom" }
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "COMPLETED", label: "Paid" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" }
];

const DATE_PRESETS = [
  { key: "all", label: "All Time", from: "", to: "" },
  { key: "today", label: "Today", from: () => new Date().toISOString().slice(0, 10), to: () => new Date().toISOString().slice(0, 10) },
  { key: "month", label: "This Month", from: () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`; }, to: () => new Date().toISOString().slice(0, 10) },
  { key: "year", label: "This Year", from: () => `${new Date().getFullYear()}-01-01`, to: () => new Date().toISOString().slice(0, 10) }
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
  const [datePreset, setDatePreset] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [recordForm, setRecordForm] = useState({ salonId: "", amount: "", mode: "CASH", paymentFor: "Subscription", reference: "", notes: "", paidAt: localDateStr() });

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

  useEffect(() => { loadData(); }, []);

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
      setRecordForm({ salonId: "", amount: "", mode: "CASH", paymentFor: "Subscription", reference: "", notes: "", paidAt: localDateStr() });
      setStatus({ error: "", success: "Payment recorded." });
      await loadData();
    } catch (err) {
      setStatus({ error: formatApiError(err), success: "" });
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ marginTop: 0 }}>Finance</h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.9rem" }}>Revenue, transactions, and payment tracking</p>
          </div>
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

      {status.error && <div style={{ padding: 12, background: "#fef2f2", color: "#ef4444", borderRadius: 8, marginBottom: 16 }}>{status.error}</div>}
      {status.success && <div style={{ padding: 12, background: "#f0fdf4", color: "#16a34a", borderRadius: 8, marginBottom: 16 }}>{status.success}</div>}

      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Total Revenue", value: fmt(summary.totalRevenue), color: "#0f172a", bg: "#f0fdf4" },
            { label: "Subscription Revenue", value: fmt(summary.subscriptionRevenue), color: "#4f46e5", bg: "#eef2ff" },
            { label: "Product Revenue", value: fmt(summary.productRevenue), color: "#8b5cf6", bg: "#f5f3ff" },
            { label: "Pending Payments", value: `${fmt(summary.pendingAmount)} (${summary.pendingCount || 0})`, color: "#d97706", bg: "#fffbeb" }
          ].map((card, idx) => (
            <div key={idx} style={{ background: card.bg, padding: 20, borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>{card.label}</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input value={q} placeholder="Search TXN ID, salon, reference..." onChange={e => setQ(e.target.value)} style={{ width: "100%", height: 40, padding: "0 14px 0 34px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }} />
        </div>
        <select value={salonFilter} onChange={e => setSalonFilter(e.target.value)} style={{ height: 40, padding: "0 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, background: "#fff", minWidth: 140 }}>
          <option value="">All Salons</option>
          {salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={paymentForFilter} onChange={e => setPaymentForFilter(e.target.value)} style={{ height: 40, padding: "0 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, background: "#fff" }}>
          <option value="">All Purpose</option>
          {PAYMENT_FOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={modeFilter} onChange={e => setModeFilter(e.target.value)} style={{ height: 40, padding: "0 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, background: "#fff" }}>
          <option value="">All Methods</option>
          {PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ height: 40, padding: "0 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, background: "#fff" }}>
          {PAYMENT_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
        <Calendar size={15} color="#94a3b8" />
        <div style={{ display: "flex", gap: 4 }}>
          {DATE_PRESETS.map(p => (
            <button key={p.key} onClick={() => { setDatePreset(p.key); if (p.key === "custom") { setDateFrom(""); setDateTo ""); } }} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${datePreset === p.key ? "#4f46e5" : "#e2e8f0"}`, background: datePreset === p.key ? "#4f46e5" : "#fff", color: datePreset === p.key ? "#fff" : "#475569", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {p.label}
            </button>
          ))}
        </div>
        {datePreset === "custom" && (
          <>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ height: 34, padding: "0 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12 }} />
            <span style={{ color: "#94a3b8" }}>to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ height: 34, padding: "0 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12 }} />
          </>
        )}
        <button onClick={applyFilters} disabled={loading} style={{ height: 34, padding: "0 14px", background: "#4f46e5", color: "white", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>{loading ? "Loading..." : "Apply"}</button>
        <button onClick={() => { setQ(""); setSalonFilter(""); setModeFilter(""); setStatusFilter(""); setPaymentForFilter(""); setDatePreset("all"); setDateFrom(""); setDateTo(""); }} style={{ height: 34, padding: "0 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#64748b" }}>Reset</button>
      </div>

      {transactions.length === 0 ? (
        <EmptyState title="No Transactions" message="Record a payment to see it here." />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#64748b", fontWeight: 700 }}>
                <th style={{ padding: "12px 14px", textAlign: "left" }}>TXN ID</th>
                <th style={{ padding: "12px 14px", textAlign: "left" }}>Salon</th>
                <th style={{ padding: "12px 14px", textAlign: "left" }}>For</th>
                <th style={{ padding: "12px 14px", textAlign: "right" }}>Amount</th>
                <th style={{ padding: "12px 14px", textAlign: "left" }}>Method</th>
                <th style={{ padding: "12px 14px", textAlign: "left" }}>Status</th>
                <th style={{ padding: "12px 14px", textAlign: "left" }}>Date</th>
                <th style={{ padding: "12px 14px", textAlign: "left" }}>Reference</th>
                <th style={{ padding: "12px 14px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(txn => (
                <tr key={txn.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 12, color: "#4f46e5", fontWeight: 600 }}>{txn.transactionId || "—"}</td>
                  <td style={{ padding: "12px 14px", fontWeight: 600 }}>{txn.salon?.name || "—"}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ background: txn.paymentFor === "Subscription" ? "#eef2ff" : txn.paymentFor === "Product" ? "#f5f3ff" : "#f8fafc", color: txn.paymentFor === "Subscription" ? "#4f46e5" : txn.paymentFor === "Product" ? "#8b5cf6" : "#475569", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{txn.paymentFor}</span>
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 700 }}>{fmt(txn.amount)}</td>
                  <td style={{ padding: "12px 14px" }}>{txn.paymentMethod}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ color: txn.paymentStatus === "COMPLETED" ? "#10b981" : txn.paymentStatus === "FAILED" ? "#ef4444" : "#d97706", fontWeight: 600, fontSize: 12 }}>{txn.paymentStatus === "COMPLETED" ? "Paid" : txn.paymentStatus}</span>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 12 }}>{txn.paymentDate ? new Date(txn.paymentDate).toLocaleDateString() : "—"}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: "#64748b" }}>{txn.reference || "—"}</td>
                  <td style={{ padding: "12px 14px", textAlign: "right" }}>
                    <button onClick={() => setDetailTxn(txn)} style={{ padding: "4px 8px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#f8fafc", cursor: "pointer" }}><Eye size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isRecordOpen && (
        <div className="modal-overlay" onClick={() => setIsRecordOpen(false)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header"><h3>Record Payment</h3><button className="modal-close-btn" onClick={() => setIsRecordOpen(false)}>&times;</button></div>
            <form onSubmit={handleRecordPayment} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label><span style={{ fontSize: 12, fontWeight: 700 }}>Salon (optional)</span><select value={recordForm.salonId} onChange={e => setRecordForm({ ...recordForm, salonId: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}><option value="">Select salon</option>{salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
              <label><span style={{ fontSize: 12, fontWeight: 700 }}>Amount (INR) *</span><input type="number" min="0" step="0.01" value={recordForm.amount} required onChange={e => setRecordForm({ ...recordForm, amount: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }} /></label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <label><span style={{ fontSize: 12, fontWeight: 700 }}>Payment For</span><select value={recordForm.paymentFor} onChange={e => setRecordForm({ ...recordForm, paymentFor: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>{PAYMENT_FOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
                <label><span style={{ fontSize: 12, fontWeight: 700 }}>Payment Method</span><select value={recordForm.mode} onChange={e => setRecordForm({ ...recordForm, mode: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>{PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select></label>
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

      {detailTxn && (
        <div className="modal-overlay" onClick={() => setDetailTxn(null)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header"><h3>Transaction Detail</h3><button className="modal-close-btn" onClick={() => setDetailTxn(null)}>&times;</button></div>
            <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "12px 0", fontSize: "0.9rem" }}>
              <div style={{ color: "#64748b" }}>TXN ID</div>
              <div style={{ fontWeight: 600, fontFamily: "monospace", color: "#4f46e5" }}>{detailTxn.transactionId}</div>
              <div style={{ color: "#64748b" }}>Salon</div>
              <div style={{ fontWeight: 600 }}>{detailTxn.salon?.name || "—"}</div>
              <div style={{ color: "#64748b" }}>Email</div>
              <div>{detailTxn.salon?.email || "—"}</div>
              <div style={{ color: "#64748b" }}>Amount</div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{fmt(detailTxn.amount)}</div>
              <div style={{ color: "#64748b" }}>Payment For</div>
              <div>{detailTxn.paymentFor}</div>
              <div style={{ color: "#64748b" }}>Method</div>
              <div>{detailTxn.paymentMethod}</div>
              <div style={{ color: "#64748b" }}>Status</div>
              <div style={{ color: detailTxn.paymentStatus === "COMPLETED" ? "#10b981" : detailTxn.paymentStatus === "FAILED" ? "#ef4444" : "#d97706", fontWeight: 600 }}>{detailTxn.paymentStatus === "COMPLETED" ? "Paid" : detailTxn.paymentStatus}</div>
              <div style={{ color: "#64748b" }}>Date</div>
              <div>{detailTxn.paymentDate ? new Date(detailTxn.paymentDate).toLocaleString() : "—"}</div>
              <div style={{ color: "#64748b" }}>Recorded By</div>
              <div>{detailTxn.recordedBy || "—"}</div>
              {detailTxn.reference && (<><div style={{ color: "#64748b" }}>Reference</div><div>{detailTxn.reference}</div></>)}
              {detailTxn.notes && (<><div style={{ color: "#64748b" }}>Notes</div><div style={{ color: "#475569" }}>{detailTxn.notes}</div></>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
