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

      <div style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", marginBottom: 24, border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)" }}>
        
        {/* Search Bar Row */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, position: "relative", minWidth: 280 }}>
            <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex", pointerEvents: "none" }}>
              <Search size={18} />
            </div>
            <input
              value={q}
              placeholder="Search TXN ID, salon, reference..."
              onChange={(e) => setQ(e.target.value)}
              style={{ width: "100%", height: 44, padding: "0 16px 0 42px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
              onFocus={e => e.target.style.borderColor = "#6366f1"}
              onBlur={e => e.target.style.borderColor = "#cbd5e1"}
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", padding: "4px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
            {DATE_PRESETS.map(p => (
              <button key={p.key} onClick={() => { setDatePreset(p.key); if (p.key === "custom") { setDateFrom(""); setDateTo(""); } }} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: datePreset === p.key ? "#fff" : "transparent", color: datePreset === p.key ? "#4f46e5" : "#64748b", fontSize: 13, fontWeight: datePreset === p.key ? 700 : 500, cursor: "pointer", boxShadow: datePreset === p.key ? "0 1px 2px rgba(0,0,0,0.05)" : "none", transition: "all 0.2s" }}>
                {p.label}
              </button>
            ))}
          </div>
          
          <button onClick={applyFilters} disabled={loading} style={{ height: 44, padding: "0 24px", background: "linear-gradient(135deg, #4f46e5, #3b82f6)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)", transition: "transform 0.2s", opacity: loading ? 0.7 : 1 }} onMouseOver={e => !loading && (e.currentTarget.style.transform="translateY(-1px)")} onMouseOut={e => !loading && (e.currentTarget.style.transform="none")}>
            {loading ? "Loading..." : "Apply Filters"}
          </button>
          
          <button 
            onClick={() => { setQ(""); setSalonFilter(""); setModeFilter(""); setStatusFilter(""); setPaymentForFilter(""); setDatePreset("all"); setDateFrom(""); setDateTo(""); applyFilters(); }}
            style={{ height: 44, padding: "0 20px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#475569", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}
            onMouseOver={e => { e.currentTarget.style.background="#e2e8f0"; e.currentTarget.style.color="#0f172a"; }}
            onMouseOut={e => { e.currentTarget.style.background="#f1f5f9"; e.currentTarget.style.color="#475569"; }}
          >
            <Filter size={16} />
            Reset
          </button>
        </div>

        {/* Dropdowns Row */}
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
            <option value="">All Purpose</option>
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
            <div style={{ marginTop: 20, pt: 16, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => {
                  const printWin = window.open("", "_blank");
                  printWin.document.write(`
                    <html>
                      <head>
                        <title>SaaS Receipt - ${detailTxn.transactionId}</title>
                        <style>
                          body { font-family: sans-serif; padding: 40px; color: #0f172a; }
                          .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
                          .receipt-title { font-size: 24px; font-weight: bold; color: #2563eb; }
                          .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
                          .total { font-size: 18px; font-weight: bold; margin-top: 20px; text-align: right; color: #10b981; }
                        </style>
                      </head>
                      <body>
                        <div class="header">
                          <div class="receipt-title">SalonNest Platform SaaS Receipt</div>
                          <p style="color:#64748b;">Official Billing Receipt</p>
                        </div>
                        <div class="row"><span>Transaction ID:</span><strong>${detailTxn.transactionId}</strong></div>
                        <div class="row"><span>Salon Name:</span><strong>${detailTxn.salon?.name || "N/A"}</strong></div>
                        <div class="row"><span>Payment Purpose:</span><strong>${detailTxn.paymentFor}</strong></div>
                        <div class="row"><span>Payment Mode:</span><strong>${detailTxn.paymentMethod}</strong></div>
                        <div class="row"><span>Date:</span><strong>${detailTxn.paymentDate ? new Date(detailTxn.paymentDate).toLocaleString() : "N/A"}</strong></div>
                        <div class="row"><span>Status:</span><strong style="color:#10b981;">PAID & VERIFIED</strong></div>
                        <div class="total">Total Amount Paid: ₹${fmt(detailTxn.amount)}</div>
                        <script>window.print();</script>
                      </body>
                    </html>
                  `);
                  printWin.document.close();
                }}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#f1f5f9", color: "#1e293b", border: "1px solid #cbd5e1", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
              >
                <FileText size={16} /> Print SaaS Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
