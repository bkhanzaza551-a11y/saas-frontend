import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import PageLoader from "../../components/PageLoader";
import { Building2, MapPin, Phone, Mail, Calendar, CreditCard, Users, Package, Receipt, ShoppingBag, Clock, AlertTriangle, CheckCircle2, Zap } from "lucide-react";

const fmtDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  return isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
const fmtMoney = (v) => {
  const num = Number(v || 0);
  return `₹${(isNaN(num) ? 0 : num).toLocaleString("en-IN")}`;
};
const daysLeft = (d) => {
  if (!d) return null;
  const date = new Date(d);
  if (isNaN(date.getTime())) return null;
  const diff = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
};

const statusConfig = {
  TRIAL: { bg: "#eff6ff", color: "#2563eb", label: "Trial" },
  ACTIVE: { bg: "#ecfdf5", color: "#16a34a", label: "Active" },
  EXPIRED: { bg: "#fef2f2", color: "#dc2626", label: "Expired" },
  SUSPENDED: { bg: "#fef2f2", color: "#991b1b", label: "Suspended" }
};

export default function SalonDetailsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/owner/salon-details")
      .then(res => setData(res.data))
      .catch(err => setError(formatApiError(err, "Failed to load salon details")))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-shell"><PageLoader title="Loading salon details" /></div>;
  if (error) return <div className="page-shell"><div style={{ background: "#fef2f2", color: "#991b1b", padding: "16px 20px", borderRadius: 12 }}>{error}</div></div>;
  if (!data) return null;

  const { salon, subscription, branches } = data;
  if (!salon) return <div className="page-shell"><div style={{ background: "#fef2f2", color: "#991b1b", padding: "16px 20px", borderRadius: 12 }}>Salon data not found.</div></div>;
  const plan = subscription?.plan;
  const sc = statusConfig[salon.status] || statusConfig.TRIAL;
  const expiry = subscription?.endsAt || salon.trialEndsAt;
  const remaining = daysLeft(expiry);
  const counts = salon._count || {};
  const activeBranches = Array.isArray(branches) ? branches.filter(b => b.isActive).length : 0;

  return (
    <div className="page-shell" style={{ padding: "24px 16px", maxWidth: 900, margin: "0 auto" }}>
      <style>{`
        .sd-card { background: white; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .sd-card h2 { margin: 0 0 16px; font-size: 1.1rem; font-weight: 800; color: #0f172a; }
        .sd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .sd-field { display: flex; flex-direction: column; gap: 4px; }
        .sd-label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
        .sd-value { font-size: 0.95rem; font-weight: 600; color: #1e293b; }
        .sd-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 100px; font-size: 0.78rem; font-weight: 700; }
        .sd-stat { text-align: center; padding: 14px 10px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
        .sd-stat-num { font-size: 1.3rem; font-weight: 800; color: #0f172a; }
        .sd-stat-label { font-size: 0.72rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; margin-top: 2px; }
        .sd-progress { height: 7px; background: #e2e8f0; border-radius: 100px; overflow: hidden; margin-top: 6px; }
        .sd-progress-fill { height: 100%; border-radius: 100px; transition: width 0.5s ease; }
        @media (max-width: 640px) {
          .sd-card { padding: 18px 16px !important; margin-bottom: 14px !important; }
          .sd-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .sd-plan-header { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
          .sd-plan-dates { text-align: left !important; }
          .sd-stat-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
        }
      `}</style>

      {/* Header Card */}
      <div className="sd-card" style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, #6366f1, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
          <Building2 size={24} />
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>{salon.name}</h1>
          <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: 2 }}>{salon.businessType || "Salon"} · {salon.slug}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className="sd-badge" style={{ background: sc.bg, color: sc.color }}>
            {sc.label === "Active" ? <CheckCircle2 size={13} /> : <Clock size={13} />}
            {sc.label}
          </span>
          {remaining !== null && (
            <span className="sd-badge" style={{ background: remaining > 14 ? "#ecfdf5" : remaining > 0 ? "#fffbeb" : "#fef2f2", color: remaining > 14 ? "#16a34a" : remaining > 0 ? "#d97706" : "#dc2626" }}>
              {remaining > 1 ? `${remaining} days left` : remaining === 1 ? "1 day left" : remaining === 0 ? "Expires today" : "Expired"}
            </span>
          )}
        </div>
      </div>

      {/* Plan & Subscription */}
      <div className="sd-card">
        <h2 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}><CreditCard size={18} color="#6366f1" /> Subscription & Plan</h2>
        {plan ? (
          <>
            <div className="sd-plan-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12, paddingBottom: 14, borderBottom: "1px solid #f1f5f9" }}>
              <div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#6366f1" }}>{plan.name}</div>
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: 2 }}>
                  {fmtMoney(plan.monthlyPrice)}/month · {fmtMoney(plan.yearlyPrice)}/year
                </div>
              </div>
              <div className="sd-plan-dates" style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Started: <strong>{fmtDate(subscription.startsAt)}</strong></div>
                <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 2 }}>Expires: <strong>{fmtDate(expiry)}</strong></div>
                {subscription.paymentStatus && (
                  <span className="sd-badge" style={{ background: subscription.paymentStatus === "PAID" || subscription.paymentStatus === "COMPLETED" ? "#ecfdf5" : "#fffbeb", color: subscription.paymentStatus === "PAID" || subscription.paymentStatus === "COMPLETED" ? "#16a34a" : "#d97706", marginTop: 6, display: "inline-flex" }}>
                    Payment: {subscription.paymentStatus}
                  </span>
                )}
              </div>
            </div>

            {/* Limits */}
            <div className="sd-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
              {[
                { label: "Branches", used: counts.branches || 0, limit: plan.branchLimit, icon: <Building2 size={14} /> },
                { label: "Staff", used: counts.users || 0, limit: plan.userLimit, icon: <Users size={14} /> },
                { label: "Customers", used: counts.customers || 0, limit: plan.customerLimit, icon: <Package size={14} /> },
                { label: "Invoices", used: counts.invoices || 0, limit: plan.invoiceLimit, icon: <Receipt size={14} /> }
              ].map((item) => {
                const pct = item.limit > 0 ? Math.min(100, (item.used / item.limit) * 100) : 0;
                const isNearLimit = pct > 80;
                return (
                  <div key={item.label} className="sd-stat">
                    <div className="sd-stat-label" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>{item.icon} {item.label}</div>
                    <div className="sd-stat-num" style={{ color: isNearLimit ? "#dc2626" : "#0f172a" }}>{item.used} <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#94a3b8" }}>/ {item.limit}</span></div>
                    <div className="sd-progress">
                      <div className="sd-progress-fill" style={{ width: `${pct}%`, background: pct > 80 ? "#ef4444" : pct > 50 ? "#f59b0b" : "#22c55e" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ padding: "24px 0", textAlign: "center", color: "#94a3b8" }}>
            <AlertTriangle size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
            <div style={{ fontWeight: 600 }}>No active subscription</div>
            <div style={{ fontSize: "0.85rem", marginTop: 4 }}>Contact support to get a plan.</div>
          </div>
        )}
      </div>

      {/* Salon Details */}
      <div className="sd-card">
        <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}><Zap size={18} color="#f59e0b" /> Salon Information</h2>
        <div className="sd-grid">
          <div className="sd-field">
            <span className="sd-label">Email</span>
            <span className="sd-value" style={{ display: "flex", alignItems: "center", gap: 6 }}><Mail size={14} color="#94a3b8" /> {salon.email || "—"}</span>
          </div>
          <div className="sd-field">
            <span className="sd-label">Phone</span>
            <span className="sd-value" style={{ display: "flex", alignItems: "center", gap: 6 }}><Phone size={14} color="#94a3b8" /> {salon.phone || "—"}</span>
          </div>
          <div className="sd-field" style={{ gridColumn: "1 / -1" }}>
            <span className="sd-label">Address</span>
            <span className="sd-value" style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={14} color="#94a3b8" /> {salon.address || "—"}</span>
          </div>

          <div className="sd-field">
            <span className="sd-label">City</span>
            <span className="sd-value">{salon.city || "—"}</span>
          </div>
          <div className="sd-field">
            <span className="sd-label">State / Country</span>
            <span className="sd-value">{salon.state ? `${salon.state}, ` : ""}{salon.country || "—"}</span>
          </div>
          <div className="sd-field">
            <span className="sd-label">Tax Rate</span>
            <span className="sd-value">{salon.taxRate != null ? `${salon.taxRate}%` : "0%"}</span>
          </div>
          <div className="sd-field">
            <span className="sd-label">Registered On</span>
            <span className="sd-value" style={{ display: "flex", alignItems: "center", gap: 6 }}><Calendar size={14} color="#94a3b8" /> {fmtDate(salon.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Branches */}
      {Array.isArray(branches) && branches.length > 0 && (
        <div className="sd-card">
          <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}><Building2 size={18} color="#10b981" /> Branches ({activeBranches} active of {branches.length})</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {branches.map(b => (
              <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: b.isActive ? "#22c55e" : "#cbd5e1" }} />
                <span style={{ fontWeight: 600, color: "#1e293b" }}>{b.name}</span>
                <span style={{ fontSize: "0.75rem", color: b.isActive ? "#16a34a" : "#94a3b8", marginLeft: "auto" }}>{b.isActive ? "Active" : "Inactive"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
