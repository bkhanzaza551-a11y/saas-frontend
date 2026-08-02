import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import PageLoader from "../../components/PageLoader";
import {
  FileText,
  DollarSign,
  TrendingUp,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Activity,
  CreditCard,
  Building,
  PieChart
} from "lucide-react";

const PERIODS = [
  { key: "today", label: "Today" },
  { key: "thisMonth", label: "This Month" },
  { key: "thisQuarter", label: "This Quarter" },
  { key: "thisYear", label: "This Year" },
];

const TABS = [
  { key: "pnl", label: "Profit & Loss", icon: <Activity size={16} /> },
  { key: "cashflow", label: "Cash Flow", icon: <Wallet size={16} /> },
  { key: "gst", label: "Tax & GST", icon: <Building size={16} /> },
];

const fmt = (value) => {
  const num = Number(value || 0);
  return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const PAYMENT_LABELS = {
  CASH: "Cash",
  CARD: "Card",
  UPI: "UPI",
  BANK_TRANSFER: "Bank Transfer",
  WALLET: "Wallet",
  ONLINE: "Online Payments",
};

const defaultSummary = { totalGrossIncome: 0, grossProfit: 0, grossMargin: 0, totalExpensesPayroll: 0, netProfit: 0, netMargin: 0 };
const defaultPnl = { revenue: { services: 0, products: 0, memberships: 0, packages: 0, giftCards: 0, total: 0 }, costOfGoodsSold: 0, grossProfit: 0, expenses: { rent: 0, utilities: 0, supplies: 0, marketing: 0, other: 0, total: 0 }, payroll: 0, netProfit: 0 };
const defaultCashFlow = { inflows: { CASH: 0, CARD: 0, UPI: 0, BANK_TRANSFER: 0, WALLET: 0, ONLINE: 0, total: 0 }, outflows: { CASH: 0, CARD: 0, UPI: 0, BANK_TRANSFER: 0, WALLET: 0, ONLINE: 0, total: 0 }, netCashFlow: 0 };
const defaultGst = { taxableTurnover: 0, totalGSTCollected: 0, cgst: 0, sgst: 0, gstRate: 18 };

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
      gradient: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
      icon: <DollarSign size={24} color="#fff" />,
    },
    {
      label: "Gross Profit",
      value: fmt(summary.grossProfit),
      subtitle: `Margin: ${Number(summary.grossMargin || 0).toFixed(1)}%`,
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      icon: <TrendingUp size={24} color="#fff" />,
    },
    {
      label: "Operating Expenses",
      value: fmt(summary.totalExpensesPayroll),
      subtitle: "OpEx + Staff Payroll",
      gradient: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
      icon: <Receipt size={24} color="#fff" />,
    },
    {
      label: "Net Profit / (Loss)",
      value: fmt(summary.netProfit),
      subtitle: `Net Margin: ${Number(summary.netMargin || 0).toFixed(1)}%`,
      gradient: netProfitPositive 
        ? "linear-gradient(135deg, #34d399 0%, #10b981 100%)" 
        : "linear-gradient(135deg, #f87171 0%, #ef4444 100%)",
      icon: netProfitPositive ? <ArrowUpRight size={24} color="#fff" /> : <ArrowDownRight size={24} color="#fff" />,
    },
  ];

  return (
    <div className="premium-page-container">
      <style>{`
        .premium-page-container {
          min-height: 100vh;
          background: #f8fafc;
          padding: 32px 40px;
          font-family: 'Poppins', system-ui, sans-serif;
          color: #0f172a;
        }
        
        .header-section {
          margin-bottom: 32px;
        }
        .header-title {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.5px;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 0 8px 0;
        }
        .header-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
          font-weight: 400;
        }

        .controls-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .period-selector {
          display: flex;
          background: #e2e8f0;
          border-radius: 12px;
          padding: 4px;
        }
        .period-btn {
          padding: 8px 20px;
          border-radius: 8px;
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .period-btn.active {
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .period-btn:not(.active):hover {
          color: #334155;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          margin-bottom: 40px;
        }
        .summary-card {
          border-radius: 20px;
          padding: 24px;
          color: white;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .summary-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        .sc-icon-wrapper {
          position: absolute;
          top: 24px;
          right: 24px;
          background: rgba(255,255,255,0.2);
          padding: 10px;
          border-radius: 14px;
          backdrop-filter: blur(10px);
        }
        .sc-label {
          font-size: 13px;
          font-weight: 600;
          opacity: 0.9;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }
        .sc-value {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 4px;
          letter-spacing: -0.5px;
        }
        .sc-subtitle {
          font-size: 12px;
          opacity: 0.8;
          font-weight: 500;
        }

        .tab-segment {
          display: inline-flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 2px solid #e2e8f0;
          width: 100%;
        }
        .tab-btn {
          padding: 14px 24px;
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          border: none;
          background: transparent;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .tab-btn.active {
          color: #2563eb;
          border-bottom-color: #2563eb;
        }
        .tab-btn:not(.active):hover {
          color: #0f172a;
        }

        .data-panel {
          background: white;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
          border: 1px solid #f1f5f9;
        }

        .premium-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }
        .premium-table th {
          text-align: left;
          padding: 16px 20px;
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 2px solid #f1f5f9;
        }
        .premium-table td {
          padding: 18px 20px;
          font-size: 14px;
          color: #334155;
          border-bottom: 1px solid #f1f5f9;
          font-weight: 500;
        }
        .premium-table tr:last-child td {
          border-bottom: none;
        }
        .premium-table tr:hover td {
          background: #f8fafc;
        }
        .pt-val {
          text-align: right;
          font-variant-numeric: tabular-nums;
          font-weight: 600;
          color: #0f172a;
        }
        .row-group-header td {
          background: #f8fafc;
          font-size: 12px !important;
          font-weight: 700 !important;
          color: #475569 !important;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 12px 20px !important;
        }
        .row-subtotal td {
          background: #f1f5f9;
          font-weight: 700 !important;
          color: #0f172a !important;
          font-size: 15px !important;
        }
        .row-net-profit td {
          background: #1e293b;
          color: white !important;
          font-weight: 700 !important;
          font-size: 18px !important;
          border: none !important;
        }
        .row-net-profit td:first-child {
          border-radius: 12px 0 0 12px;
        }
        .row-net-profit td:last-child {
          border-radius: 0 12px 12px 0;
        }

        .gst-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }
        .gst-card {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .gst-card-info h4 {
          margin: 0 0 4px 0;
          font-size: 13px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .gst-card-info h2 {
          margin: 0;
          font-size: 28px;
          color: #0f172a;
          font-weight: 700;
        }
        .gst-card-icon {
          background: white;
          padding: 16px;
          border-radius: 50%;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }

        @media (max-width: 1100px) {
          .summary-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="header-section">
        <h1 className="header-title">
          <PieChart size={28} color="#2563eb" strokeWidth={2.5} />
          Financial Reports
        </h1>
        <p className="header-subtitle">
          Audited Profit & Loss statement, Cash Flow tracking, and GST reports.
        </p>
      </div>

      <div className="controls-row">
        <div className="period-selector">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              className={`period-btn ${period === p.key ? "active" : ""}`}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : error ? (
        <div style={{ color: "#dc2626", background: "#fef2f2", padding: "16px 24px", borderRadius: 12, fontWeight: 500 }}>
          {error}
        </div>
      ) : (
        <>
          <div className="summary-grid">
            {summaryCards.map((card, i) => (
              <div key={i} className="summary-card" style={{ background: card.gradient }}>
                <div className="sc-icon-wrapper">{card.icon}</div>
                <div className="sc-label">{card.label}</div>
                <div className="sc-value">{card.value}</div>
                <div className="sc-subtitle">{card.subtitle}</div>
              </div>
            ))}
          </div>

          <div className="tab-segment">
            {TABS.map(t => (
              <button
                key={t.key}
                className={`tab-btn ${activeTab === t.key ? "active" : ""}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          <div className="data-panel">
            {activeTab === "pnl" && <PnlTab pnl={pnl} />}
            {activeTab === "cashflow" && <CashFlowTab cashFlow={cashFlow} />}
            {activeTab === "gst" && <GstTab gst={gst} />}
          </div>
        </>
      )}
    </div>
  );
}

function PnlTab({ pnl }) {
  const isProfit = Number(pnl.netProfit) >= 0;

  return (
    <table className="premium-table">
      <thead>
        <tr>
          <th>Category</th>
          <th style={{ textAlign: 'right' }}>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr className="row-group-header"><td colSpan={2}>Revenue Streams</td></tr>
        <tr><td>Service Revenue</td><td className="pt-val">{fmt(pnl.revenue.services)}</td></tr>
        <tr><td>Product Sales</td><td className="pt-val">{fmt(pnl.revenue.products)}</td></tr>
        <tr><td>Membership Sales</td><td className="pt-val">{fmt(pnl.revenue.memberships)}</td></tr>
        <tr><td>Package Sales</td><td className="pt-val">{fmt(pnl.revenue.packages)}</td></tr>
        <tr><td>Gift Card Sales</td><td className="pt-val">{fmt(pnl.revenue.giftCards)}</td></tr>
        <tr className="row-subtotal"><td>Total Revenue</td><td className="pt-val">{fmt(pnl.revenue.total)}</td></tr>

        <tr className="row-group-header"><td colSpan={2}>Cost of Goods</td></tr>
        <tr><td>Product COGS</td><td className="pt-val">{fmt(pnl.costOfGoodsSold)}</td></tr>
        <tr className="row-subtotal">
          <td>Gross Profit</td>
          <td className="pt-val" style={{ color: Number(pnl.grossProfit) >= 0 ? '#10b981' : '#f43f5e' }}>{fmt(pnl.grossProfit)}</td>
        </tr>

        <tr className="row-group-header"><td colSpan={2}>Operating Expenses</td></tr>
        <tr><td>Rent</td><td className="pt-val">{fmt(pnl.expenses.rent)}</td></tr>
        <tr><td>Utilities</td><td className="pt-val">{fmt(pnl.expenses.utilities)}</td></tr>
        <tr><td>Supplies</td><td className="pt-val">{fmt(pnl.expenses.supplies)}</td></tr>
        <tr><td>Marketing</td><td className="pt-val">{fmt(pnl.expenses.marketing)}</td></tr>
        <tr><td>Other</td><td className="pt-val">{fmt(pnl.expenses.other)}</td></tr>
        <tr className="row-subtotal"><td>Total Operating Expenses</td><td className="pt-val">{fmt(pnl.expenses.total)}</td></tr>

        <tr className="row-group-header"><td colSpan={2}>Payroll</td></tr>
        <tr><td>Staff Payroll & Commissions</td><td className="pt-val">{fmt(pnl.payroll)}</td></tr>

        <tr><td colSpan={2} style={{ padding: '8px', border: 'none', background: 'transparent' }}></td></tr>
        
        <tr className="row-net-profit">
          <td>NET PROFIT / (LOSS)</td>
          <td className="pt-val" style={{ color: isProfit ? '#34d399' : '#f87171' }}>{fmt(pnl.netProfit)}</td>
        </tr>
      </tbody>
    </table>
  );
}

function CashFlowTab({ cashFlow }) {
  const inflowModes = ["CASH", "CARD", "UPI", "BANK_TRANSFER", "WALLET", "ONLINE"];
  const outflowModes = ["CASH", "CARD", "UPI", "BANK_TRANSFER", "WALLET", "ONLINE"];
  const isNetPositive = Number(cashFlow.netCashFlow) >= 0;

  return (
    <table className="premium-table">
      <thead>
        <tr>
          <th>Payment Mode</th>
          <th style={{ textAlign: 'right' }}>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr className="row-group-header"><td colSpan={2}>Cash Inflows</td></tr>
        {inflowModes.map(mode => (
          <tr key={`in-${mode}`}><td>{PAYMENT_LABELS[mode]}</td><td className="pt-val">{fmt(cashFlow.inflows[mode])}</td></tr>
        ))}
        <tr className="row-subtotal"><td>Total Inflows</td><td className="pt-val" style={{ color: '#10b981' }}>{fmt(cashFlow.inflows.total)}</td></tr>

        <tr className="row-group-header"><td colSpan={2}>Cash Outflows</td></tr>
        {outflowModes.map(mode => (
          <tr key={`out-${mode}`}><td>{PAYMENT_LABELS[mode]}</td><td className="pt-val">{fmt(cashFlow.outflows[mode])}</td></tr>
        ))}
        <tr className="row-subtotal"><td>Total Outflows</td><td className="pt-val" style={{ color: '#f43f5e' }}>{fmt(cashFlow.outflows.total)}</td></tr>

        <tr><td colSpan={2} style={{ padding: '8px', border: 'none', background: 'transparent' }}></td></tr>

        <tr className="row-net-profit">
          <td>NET CASH FLOW</td>
          <td className="pt-val" style={{ color: isNetPositive ? '#34d399' : '#f87171' }}>{fmt(cashFlow.netCashFlow)}</td>
        </tr>
      </tbody>
    </table>
  );
}

function GstTab({ gst }) {
  const halfRate = (Number(gst.gstRate) / 2).toFixed(2);

  return (
    <div>
      <div className="gst-grid">
        <div className="gst-card">
          <div className="gst-card-info">
            <h4>Taxable Turnover</h4>
            <h2>{fmt(gst.taxableTurnover)}</h2>
          </div>
          <div className="gst-card-icon">
            <Activity size={24} color="#64748b" />
          </div>
        </div>
        <div className="gst-card">
          <div className="gst-card-info">
            <h4>Total GST Collected ({gst.gstRate}%)</h4>
            <h2>{fmt(gst.totalGSTCollected)}</h2>
          </div>
          <div className="gst-card-icon">
            <Building size={24} color="#64748b" />
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a' }}>Tax Component Breakdown</h3>
      <table className="premium-table">
        <thead>
          <tr>
            <th>Tax Component</th>
            <th>Rate</th>
            <th style={{ textAlign: 'right' }}>Collected Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>CGST (Central GST)</td>
            <td style={{ fontWeight: 600 }}>{halfRate}%</td>
            <td className="pt-val">{fmt(gst.cgst)}</td>
          </tr>
          <tr>
            <td>SGST (State GST)</td>
            <td style={{ fontWeight: 600 }}>{halfRate}%</td>
            <td className="pt-val">{fmt(gst.sgst)}</td>
          </tr>
          <tr><td colSpan={3} style={{ padding: '8px', border: 'none', background: 'transparent' }}></td></tr>
          <tr className="row-net-profit">
            <td>Total GST Liability</td>
            <td style={{ fontWeight: 700, color: '#94a3b8' }}>{gst.gstRate}%</td>
            <td className="pt-val" style={{ color: '#34d399' }}>{fmt(gst.totalGSTCollected)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
