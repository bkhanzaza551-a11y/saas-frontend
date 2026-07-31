import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import PageLoader from "../../components/PageLoader";
import {
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Receipt,
} from "lucide-react";

const PERIODS = [
  { key: "today", label: "Today" },
  { key: "thisMonth", label: "This Month" },
  { key: "thisQuarter", label: "This Quarter" },
  { key: "thisYear", label: "This Year" },
  { key: "custom", label: "Custom" },
];

const TABS = [
  { key: "pnl", label: "Profit & Loss (P&L) Statement" },
  { key: "cashflow", label: "Cash Flow Inflow & Outflow" },
  { key: "gst", label: "GST & Tax Summary" },
];

const fmt = (value) => {
  const num = Number(value || 0);
  return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtShort = (value) => {
  const num = Number(value || 0);
  return num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const PAYMENT_LABELS = {
  CASH: "Cash",
  CARD: "Card",
  UPI: "UPI",
  BANK_TRANSFER: "Bank Transfer",
  WALLET: "Wallet",
  ONLINE: "Online Payments",
};

const defaultSummary = {
  totalGrossIncome: 0,
  grossProfit: 0,
  grossMargin: 0,
  totalExpensesPayroll: 0,
  netProfit: 0,
  netMargin: 0,
};

const defaultPnl = {
  revenue: { services: 0, products: 0, memberships: 0, packages: 0, giftCards: 0, total: 0 },
  costOfGoodsSold: 0,
  grossProfit: 0,
  expenses: { rent: 0, utilities: 0, supplies: 0, marketing: 0, other: 0, total: 0 },
  payroll: 0,
  netProfit: 0,
};

const defaultCashFlow = {
  inflows: { CASH: 0, CARD: 0, UPI: 0, BANK_TRANSFER: 0, WALLET: 0, ONLINE: 0, total: 0 },
  outflows: { CASH: 0, CARD: 0, UPI: 0, BANK_TRANSFER: 0, WALLET: 0, ONLINE: 0, total: 0 },
  netCashFlow: 0,
};

const defaultGst = {
  taxableTurnover: 0,
  totalGSTCollected: 0,
  cgst: 0,
  sgst: 0,
  gstRate: 18,
};

export default function FinancialReportsPage() {
  const [period, setPeriod] = useState("thisMonth");
  const [activeTab, setActiveTab] = useState("pnl");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    summary: defaultSummary,
    pnl: defaultPnl,
    cashFlow: defaultCashFlow,
    gst: defaultGst,
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/owner/financial-reports", { params: { period } });
        if (!active) return;
        setData({
          summary: res.data?.summary || defaultSummary,
          pnl: res.data?.pnl || defaultPnl,
          cashFlow: res.data?.cashFlow || defaultCashFlow,
          gst: res.data?.gst || defaultGst,
        });
      } catch (err) {
        if (!active) return;
        setError(formatApiError(err, "Could not load financial reports"));
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [period]);

  const { summary, pnl, cashFlow, gst } = data;
  const netProfitPositive = Number(summary.netProfit) >= 0;

  const summaryCards = [
    {
      label: "Total Gross Income",
      value: fmt(summary.totalGrossIncome),
      subtitle: "Services + Retail + Memberships",
      tone: "green",
      icon: <DollarSign size={20} />,
    },
    {
      label: `Gross Profit (Margin: ${Number(summary.grossMargin || 0).toFixed(1)}%)`,
      value: fmt(summary.grossProfit),
      subtitle: "Revenue minus Stock COGS",
      tone: "green",
      icon: <TrendingUp size={20} />,
    },
    {
      label: "Total Expenses & Payroll",
      value: fmt(summary.totalExpensesPayroll),
      subtitle: "OpEx + Staff Payroll",
      tone: "red",
      icon: <Receipt size={20} />,
    },
    {
      label: `Net Profit / Margin (±${fmtShort(summary.netProfit)})`,
      value: fmt(summary.netProfit),
      subtitle: `Net Margin: ${Number(summary.netMargin || 0).toFixed(1)}%`,
      tone: netProfitPositive ? "green" : "red",
      icon: netProfitPositive ? <ArrowUp size={20} /> : <ArrowDown size={20} />,
    },
  ];

  return (
    <div className="page-shell" style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Poppins', system-ui, sans-serif", color: "#1e293b" }}>
      <style>{`
        .fr-section { margin-bottom: 24px; }
        .fr-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          padding: 24px;
          border: 1px solid #e2e8f0;
        }
        .fr-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .fr-summary-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          padding: 20px;
          border: 1px solid #e2e8f0;
        }
        .fr-summary-card.green {
          border-left: 4px solid #16a34a;
        }
        .fr-summary-card.red {
          border-left: 4px solid #dc2626;
        }
        .fr-summary-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 4px;
        }
        .fr-summary-value {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 2px;
        }
        .fr-summary-subtitle {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
        }
        .fr-period-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .fr-period-label {
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          margin-right: 4px;
        }
        .fr-period-btn {
          padding: 6px 16px;
          border-radius: 8px;
          border: none;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .fr-period-btn.active {
          background: #1e293b;
          color: white;
        }
        .fr-period-btn:not(.active) {
          background: white;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }
        .fr-period-btn:not(.active):hover {
          background: #f1f5f9;
        }
        .fr-tabs {
          display: flex;
          gap: 0;
          border-bottom: 2px solid #e2e8f0;
          margin-bottom: 24px;
        }
        .fr-tab {
          padding: 12px 24px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          background: transparent;
          color: #94a3b8;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          transition: all 0.15s;
        }
        .fr-tab:hover {
          color: #475569;
        }
        .fr-tab.active {
          color: #2563eb;
          border-bottom-color: #2563eb;
        }
        .fr-table {
          width: 100%;
          border-collapse: collapse;
        }
        .fr-table th {
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 10px 16px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .fr-table td {
          padding: 12px 16px;
          font-size: 14px;
          color: #334155;
          border-bottom: 1px solid #f1f5f9;
        }
        .fr-table tr:last-child td {
          border-bottom: none;
        }
        .fr-row-label {
          color: #475569;
          font-weight: 500;
        }
        .fr-row-value {
          text-align: right;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }
        .fr-row-section-header {
          font-weight: 700;
          font-size: 13px;
          color: #1e293b;
          background: #f8fafc;
          padding: 10px 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .fr-row-total {
          font-weight: 700;
          font-size: 14px;
          color: #1e293b;
          background: #f0f9ff;
        }
        .fr-row-total td {
          border-top: 2px solid #e2e8f0;
        }
        .fr-row-net {
          font-weight: 800;
          font-size: 16px;
        }
        .fr-row-net.green { color: #16a34a; }
        .fr-row-net.red { color: #dc2626; }
        .fr-gst-boxes {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }
        .fr-gst-box {
          background: #ede9fe;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
        }
        .fr-gst-box-label {
          font-size: 12px;
          font-weight: 700;
          color: #6d28d9;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 6px;
        }
        .fr-gst-box-value {
          font-size: 26px;
          font-weight: 800;
          color: #5b21b6;
        }
        .fr-gst-table td:last-child {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }
        .fr-gst-total-row td {
          font-weight: 700;
          color: #16a34a;
          border-top: 2px solid #e2e8f0;
          background: #f0fdf4;
        }
        .fr-title {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .fr-subtitle {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 24px 0;
        }
        .fr-custom-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .fr-custom-input {
          padding: 6px 10px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          font-size: 12px;
          color: #1e293b;
          background: white;
          font-weight: 500;
        }
        @media (max-width: 900px) {
          .fr-summary-grid { grid-template-columns: repeat(2, 1fr); }
          .fr-gst-boxes { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="fr-section">
        <h1 className="fr-title">
          <FileText size={24} color="#2563eb" />
          Financial Reports & P&L Statement
        </h1>
        <p className="fr-subtitle">
          Audited Profit & Loss statement, Cash Flow tracking, and GST tax reports for salon accounting.
        </p>
      </div>

      {/* Period Filter */}
      <div className="fr-period-row">
        <span className="fr-period-label">Financial Period:</span>
        {PERIODS.map((p) => (
          <button
            key={p.key}
            className={`fr-period-btn ${period === p.key ? "active" : ""}`}
            onClick={() => setPeriod(p.key)}
          >
            {p.label}
          </button>
        ))}
        {period === "custom" && (
          <div className="fr-custom-row">
            <input type="date" className="fr-custom-input" defaultValue="" />
            <span style={{ color: "#94a3b8", fontSize: 12 }}>to</span>
            <input type="date" className="fr-custom-input" defaultValue="" />
          </div>
        )}
      </div>

      {loading ? (
        <PageLoader title="Loading Financial Reports" message="Preparing P&L, Cash Flow, and GST data..." />
      ) : error ? (
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: "16px 20px", borderRadius: 12, fontWeight: 500 }}>
          {error}
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="fr-summary-grid">
            {summaryCards.map((card, idx) => (
              <div key={idx} className={`fr-summary-card ${card.tone}`}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span style={{ color: card.tone === "green" ? "#16a34a" : "#dc2626" }}>
                    {card.icon}
                  </span>
                  <div className="fr-summary-label">{card.label}</div>
                </div>
                <div className="fr-summary-value">{card.value}</div>
                <div className="fr-summary-subtitle">{card.subtitle}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="fr-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`fr-tab ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "pnl" && <PnlTab pnl={pnl} />}
          {activeTab === "cashflow" && <CashFlowTab cashFlow={cashFlow} />}
          {activeTab === "gst" && <GstTab gst={gst} />}
        </>
      )}
    </div>
  );
}

function PnlTab({ pnl }) {
  const isProfit = Number(pnl.netProfit) >= 0;

  return (
    <div className="fr-card">
      <div className="fr-row-section-header" style={{ borderRadius: "12px 12px 0 0", fontSize: 14, marginBottom: 0 }}>
        Profit & Loss (P&L) Statement
      </div>
      <table className="fr-table">
        <thead>
          <tr>
            <th style={{ width: "60%" }}>Line Item</th>
            <th style={{ width: "40%", textAlign: "right" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="fr-row-section-header" colSpan={2}>Revenue</td>
          </tr>
          <tr>
            <td className="fr-row-label">Service Revenue</td>
            <td className="fr-row-value">{fmt(pnl.revenue.services)}</td>
          </tr>
          <tr>
            <td className="fr-row-label">Product Sales</td>
            <td className="fr-row-value">{fmt(pnl.revenue.products)}</td>
          </tr>
          <tr>
            <td className="fr-row-label">Membership Sales</td>
            <td className="fr-row-value">{fmt(pnl.revenue.memberships)}</td>
          </tr>
          <tr>
            <td className="fr-row-label">Package Sales</td>
            <td className="fr-row-value">{fmt(pnl.revenue.packages)}</td>
          </tr>
          <tr>
            <td className="fr-row-label">Gift Card Sales</td>
            <td className="fr-row-value">{fmt(pnl.revenue.giftCards)}</td>
          </tr>
          <tr className="fr-row-total">
            <td className="fr-row-label" style={{ fontWeight: 700 }}>Total Revenue</td>
            <td className="fr-row-value" style={{ fontWeight: 700 }}>{fmt(pnl.revenue.total)}</td>
          </tr>

          <tr>
            <td className="fr-row-section-header" colSpan={2}>Cost of Services Sold</td>
          </tr>
          <tr>
            <td className="fr-row-label">Product COGS</td>
            <td className="fr-row-value">{fmt(pnl.costOfGoodsSold)}</td>
          </tr>
          <tr className="fr-row-total">
            <td className="fr-row-label" style={{ fontWeight: 700 }}>Gross Profit</td>
            <td className="fr-row-value" style={{ fontWeight: 700, color: Number(pnl.grossProfit) >= 0 ? "#16a34a" : "#dc2626" }}>
              {fmt(pnl.grossProfit)}
            </td>
          </tr>

          <tr>
            <td className="fr-row-section-header" colSpan={2}>Operating Expenses</td>
          </tr>
          <tr>
            <td className="fr-row-label">Rent</td>
            <td className="fr-row-value">{fmt(pnl.expenses.rent)}</td>
          </tr>
          <tr>
            <td className="fr-row-label">Utilities</td>
            <td className="fr-row-value">{fmt(pnl.expenses.utilities)}</td>
          </tr>
          <tr>
            <td className="fr-row-label">Supplies</td>
            <td className="fr-row-value">{fmt(pnl.expenses.supplies)}</td>
          </tr>
          <tr>
            <td className="fr-row-label">Marketing</td>
            <td className="fr-row-value">{fmt(pnl.expenses.marketing)}</td>
          </tr>
          <tr>
            <td className="fr-row-label">Other</td>
            <td className="fr-row-value">{fmt(pnl.expenses.other)}</td>
          </tr>
          <tr className="fr-row-total">
            <td className="fr-row-label" style={{ fontWeight: 700 }}>Total Operating Expenses</td>
            <td className="fr-row-value" style={{ fontWeight: 700 }}>{fmt(pnl.expenses.total)}</td>
          </tr>

          <tr>
            <td className="fr-row-section-header" colSpan={2}>Payroll</td>
          </tr>
          <tr>
            <td className="fr-row-label">Staff Payroll</td>
            <td className="fr-row-value">{fmt(pnl.payroll)}</td>
          </tr>

          <tr className="fr-row-total fr-row-net" style={{ background: "#f0f9ff" }}>
            <td className="fr-row-label" style={{ fontWeight: 800, fontSize: 16 }}>NET PROFIT / (LOSS)</td>
            <td className="fr-row-value fr-row-net" style={{ fontSize: 18, color: isProfit ? "#16a34a" : "#dc2626" }}>
              {fmt(pnl.netProfit)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function CashFlowTab({ cashFlow }) {
  const inflowModes = ["CASH", "CARD", "UPI", "BANK_TRANSFER", "WALLET", "ONLINE"];
  const outflowModes = ["CASH", "CARD", "UPI", "BANK_TRANSFER", "WALLET", "ONLINE"];
  const isNetPositive = Number(cashFlow.netCashFlow) >= 0;

  return (
    <div className="fr-card">
      <div className="fr-row-section-header" style={{ borderRadius: "12px 12px 0 0", fontSize: 14, marginBottom: 0 }}>
        Cash Flow Inflow & Outflow
      </div>
      <table className="fr-table">
        <thead>
          <tr>
            <th style={{ width: "60%" }}>Line Item</th>
            <th style={{ width: "40%", textAlign: "right" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="fr-row-section-header" colSpan={2}>Cash Inflows</td>
          </tr>
          {inflowModes.map((mode) => (
            <tr key={`inflow-${mode}`}>
              <td className="fr-row-label">{PAYMENT_LABELS[mode]}</td>
              <td className="fr-row-value">{fmt(cashFlow.inflows[mode])}</td>
            </tr>
          ))}
          <tr className="fr-row-total">
            <td className="fr-row-label" style={{ fontWeight: 700 }}>Total Inflows</td>
            <td className="fr-row-value" style={{ fontWeight: 700, color: "#16a34a" }}>{fmt(cashFlow.inflows.total)}</td>
          </tr>

          <tr>
            <td className="fr-row-section-header" colSpan={2}>Cash Outflows</td>
          </tr>
          {outflowModes.map((mode) => (
            <tr key={`outflow-${mode}`}>
              <td className="fr-row-label">{PAYMENT_LABELS[mode]}</td>
              <td className="fr-row-value">{fmt(cashFlow.outflows[mode])}</td>
            </tr>
          ))}
          <tr className="fr-row-total">
            <td className="fr-row-label" style={{ fontWeight: 700 }}>Total Outflows</td>
            <td className="fr-row-value" style={{ fontWeight: 700, color: "#dc2626" }}>{fmt(cashFlow.outflows.total)}</td>
          </tr>

          <tr className="fr-row-total fr-row-net" style={{ background: "#f0f9ff" }}>
            <td className="fr-row-label" style={{ fontWeight: 800, fontSize: 16 }}>Net Cash Flow</td>
            <td className="fr-row-value fr-row-net" style={{ fontSize: 18, color: isNetPositive ? "#16a34a" : "#dc2626" }}>
              {fmt(cashFlow.netCashFlow)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function GstTab({ gst }) {
  const halfRate = (Number(gst.gstRate) / 2).toFixed(2);

  return (
    <div className="fr-card">
      <div className="fr-row-section-header" style={{ borderRadius: "12px 12px 0 0", fontSize: 14, marginBottom: 20 }}>
        GST & Sales Tax Report Summary
      </div>

      <div className="fr-gst-boxes">
        <div className="fr-gst-box">
          <div className="fr-gst-box-label">Taxable Turnover Value</div>
          <div className="fr-gst-box-value">{fmt(gst.taxableTurnover)}</div>
        </div>
        <div className="fr-gst-box">
          <div className="fr-gst-box-label">Total GST Collected ({gst.gstRate}%)</div>
          <div className="fr-gst-box-value">{fmt(gst.totalGSTCollected)}</div>
        </div>
      </div>

      <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", marginBottom: 12 }}>Tax Component Breakdown</div>
      <table className="fr-table fr-gst-table">
        <thead>
          <tr>
            <th>Tax Component</th>
            <th>Rate</th>
            <th>Collected Tax Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="fr-row-label">CGST (Central GST)</td>
            <td>{halfRate}%</td>
            <td className="fr-row-value">{fmt(gst.cgst)}</td>
          </tr>
          <tr>
            <td className="fr-row-label">SGST (State GST)</td>
            <td>{halfRate}%</td>
            <td className="fr-row-value">{fmt(gst.sgst)}</td>
          </tr>
          <tr className="fr-gst-total-row">
            <td className="fr-row-label" style={{ fontWeight: 700 }}>Total GST Liability</td>
            <td style={{ fontWeight: 700 }}>{gst.gstRate}%</td>
            <td className="fr-row-value" style={{ fontWeight: 700, color: "#16a34a" }}>{fmt(gst.totalGSTCollected)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
