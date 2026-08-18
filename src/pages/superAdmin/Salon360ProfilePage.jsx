import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import { useAlert } from "../../context/AlertContext";
import PageLoader from "../../components/PageLoader";
import EmptyState from "../../components/EmptyState";
import {
  ArrowLeft, Building2, User, CreditCard, Ticket, ShieldCheck,
  Landmark, Key, Package, Users, BarChart3, Activity as ActivityIcon,
  Download, RefreshCw, Eye, Calendar, Clock, CheckCircle2, XCircle,
  AlertTriangle, Scissors, Mail, Phone, MapPin, AlertCircle
} from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: Building2 },
  { id: "owner", label: "Owner", icon: User },
  { id: "branches", label: "Branches", icon: Landmark },
  { id: "subscriptions", label: "Subscription Summary", icon: ShieldCheck },
  { id: "features", label: "Feature Access", icon: Key },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "productRequests", label: "Product Requests", icon: Package },
  { id: "staffRequests", label: "Staff Requests", icon: Users },
  { id: "support", label: "Support", icon: Ticket },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "activity", label: "Activity", icon: ActivityIcon },
  { id: "dataExport", label: "Data Export", icon: Download }
];

const statusColor = (s) => {
  if (s === "ACTIVE") return { bg: "#ecfdf5", color: "#10b981" };
  if (s === "SUSPENDED") return { bg: "#fef2f2", color: "#ef4444" };
  if (s === "TRIAL") return { bg: "#fffbeb", color: "#d97706" };
  return { bg: "#f1f5f9", color: "#64748b" };
};

const FeatureFlagCard = ({ label, enabled, onToggle }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: enabled ? "#f0fdf4" : "#fef2f2", border: `1px solid ${enabled ? "#bbf7d0" : "#fecaca"}`, borderRadius: 8 }}>
    <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "#334155" }}>{label}</span>
    <button onClick={onToggle} style={{ fontSize: "0.75rem", fontWeight: 700, color: enabled ? "#16a34a" : "#dc2626", background: "none", border: "none", cursor: "pointer" }}>
      {enabled ? "ON" : "OFF"}
    </button>
  </div>
);

export default function Salon360ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showConfirm } = useAlert();

  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [busyAction, setBusyAction] = useState("");
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("Non-Payment / Overdue");
  const [suspendNote, setSuspendNote] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/super-admin/salons/${id}/360`);
      setData(res.data);
    } catch (err) {
      setStatus({ error: formatApiError(err), success: "" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggleSuspend = () => {
    if (data?.salon?.status === "SUSPENDED") {
      showConfirm("Unsuspend this salon? They will regain full access.", async () => {
        setBusyAction("suspend");
        try {
          await api.patch(`/super-admin/salons/${id}/status`, { status: "ACTIVE", reason: "Unsuspended by admin" });
          setStatus({ error: "", success: "Salon unsuspended." });
          await loadData();
        } catch (err) {
          setStatus({ error: formatApiError(err), success: "" });
        } finally {
          setBusyAction("");
        }
      });
    } else {
      setIsSuspendModalOpen(true);
    }
  };

  const handleConfirmSuspend = async () => {
    if (!suspendReason.trim()) {
      setStatus({ error: "Suspension reason is required.", success: "" });
      return;
    }
    setBusyAction("suspend");
    try {
      await api.patch(`/super-admin/salons/${id}/status`, {
        status: "SUSPENDED",
        reason: suspendReason.trim(),
        internalNote: suspendNote || `Suspended by admin: ${suspendReason.trim()}`
      });
      setStatus({ error: "", success: "Salon suspended successfully." });
      setIsSuspendModalOpen(false);
      await loadData();
    } catch (err) {
      setStatus({ error: formatApiError(err), success: "" });
    } finally {
      setBusyAction("");
    }
  };

  const toggleFeatureOverride = async (key, currentVal) => {
    const reason = window.prompt(`Enter reason for manual override of ${key}:`, "Special operational override");
    if (reason === null) return;
    const currentFlags = data?.salon?.featureFlags || {};
    const nextFlags = { ...currentFlags, [key]: !currentVal };
    setBusyAction(`feature-${key}`);
    try {
      await api.patch(`/super-admin/salons/${id}/features`, {
        featureFlags: nextFlags,
        overrideReason: reason
      });
      setStatus({ error: "", success: `Feature '${key}' updated with override reason.` });
      await loadData();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not update feature flag"), success: "" });
    } finally {
      setBusyAction("");
    }
  };

  const handleExport = async (type) => {
    setBusyAction(`export-${type}`);
    try {
      const res = await api.get(`/super-admin/salons/${id}/export/${type}`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-${data?.salon?.slug || id}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus({ success: `Exported ${type} successfully!`, error: "" });
    } catch (err) {
      setStatus({ error: formatApiError(err, `Failed to export ${type}`), success: "" });
    } finally {
      setBusyAction("");
    }
  };

  if (loading) return <PageLoader />;
  if (!data || !data.salon) return <EmptyState title="Salon Not Found" icon={Building2} message="The requested salon does not exist." />;

  const { salon, owner: ownerData, tickets, payments, productRequests, staffRequests, auditLogs, analytics } = data;
  const branches = salon.branches || [];
  const subscription = salon.subscriptions?.[0];
  const featureFlags = salon.featureFlags;
  const owner = ownerData || salon.users?.find(u => u.salonRole === "SALON_OWNER")?.user || salon.users?.[0]?.user;

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <button onClick={() => navigate("/super-admin/salons")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "0.9rem", fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to Salons
        </button>
        <button onClick={loadData} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontSize: "0.85rem" }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {status.error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 16px", borderRadius: 8, marginBottom: 16 }}>{status.error}</div>}
      {status.success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "10px 16px", borderRadius: 8, marginBottom: 16 }}>{status.success}</div>}

      <div style={{ background: "white", borderRadius: 12, padding: 24, border: "1px solid #e2e8f0", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "1.4rem" }}>
            {salon.name?.[0]?.toUpperCase() || "S"}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: "1.4rem", color: "#0f172a" }}>{salon.name}</h2>
              <span style={{ background: statusColor(salon.status).bg, color: statusColor(salon.status).color, padding: "3px 10px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700 }}>
                {salon.status}
              </span>
            </div>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.85rem" }}>
              Slug: <strong>{salon.slug}</strong> • City: <strong>{salon.city || "-"}</strong> • Created: {new Date(salon.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleToggleSuspend} disabled={busyAction === "suspend"} style={{ padding: "8px 16px", borderRadius: 6, fontWeight: 600, border: "none", cursor: busyAction === "suspend" ? "not-allowed" : "pointer", background: salon.status === "SUSPENDED" ? "#ecfdf5" : "#fef2f2", color: salon.status === "SUSPENDED" ? "#10b981" : "#ef4444", opacity: busyAction === "suspend" ? 0.6 : 1 }}>
            {busyAction === "suspend" ? "Processing..." : salon.status === "SUSPENDED" ? "Unsuspend Salon" : "Suspend Salon"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e2e8f0", marginBottom: 24, overflowX: "auto" }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "none", border: "none", borderBottom: isActive ? "2px solid #4f46e5" : "2px solid transparent", color: isActive ? "#4f46e5" : "#64748b", fontWeight: isActive ? 700 : 500, cursor: "pointer", fontSize: "0.9rem", whiteSpace: "nowrap" }}>
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", color: "#0f172a" }}>Salon Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "12px 0", fontSize: "0.9rem" }}>
              <div style={{ color: "#64748b" }}>Salon Name</div><div style={{ color: "#334155", fontWeight: 500 }}>{salon.name}</div>
              <div style={{ color: "#64748b" }}>Slug</div><div style={{ color: "#334155", fontWeight: 500 }}>{salon.slug}</div>
              <div style={{ color: "#64748b" }}>Email</div><div style={{ color: "#334155", fontWeight: 500 }}>{salon.email || "-"}</div>
              <div style={{ color: "#64748b" }}>Phone</div><div style={{ color: "#334155", fontWeight: 500 }}>{salon.phone || "-"}</div>
              <div style={{ color: "#64748b" }}>City</div><div style={{ color: "#334155", fontWeight: 500 }}>{salon.city || "-"}</div>
              <div style={{ color: "#64748b" }}>Address</div><div style={{ color: "#334155", fontWeight: 500 }}>{salon.address || "-"}</div>
              <div style={{ color: "#64748b" }}>State / Country</div><div style={{ color: "#334155", fontWeight: 500 }}>{salon.state ? `${salon.state}, ` : ""}{salon.country || "-"}</div>
              <div style={{ color: "#64748b" }}>PIN Code</div><div style={{ color: "#334155", fontWeight: 500 }}>{salon.pinCode || "-"}</div>
              <div style={{ color: "#64748b" }}>Timezone</div><div style={{ color: "#334155", fontWeight: 500 }}>{salon.timezone || "-"}</div>
              <div style={{ color: "#64748b" }}>Currency / Tax</div><div style={{ color: "#334155", fontWeight: 500 }}>{salon.currency || "INR"} / {salon.taxRate != null ? `${salon.taxRate}%` : "0%"}</div>
              <div style={{ color: "#64748b" }}>Status</div>
              <div>
                <span style={{ background: statusColor(salon.status).bg, color: statusColor(salon.status).color, padding: "2px 8px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700 }}>
                  {salon.status}
                </span>
              </div>
              {salon.status === "SUSPENDED" && (
                <>
                  <div style={{ color: "#ef4444", fontWeight: 600 }}>Suspend Reason</div>
                  <div style={{ color: "#ef4444", fontWeight: 500 }}>{salon.suspendedReason || "Not provided"}</div>
                </>
              )}
            </div>
          </div>
          <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", color: "#0f172a" }}>Quick Stats</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "Services", val: analytics?.services || 0, icon: Scissors, color: "#8b5cf6", bg: "#f5f3ff" },
                { label: "Staff", val: analytics?.staff || 0, icon: Users, color: "#3b82f6", bg: "#eff6ff" },
                { label: "Branches", val: analytics?.branches || 0, icon: Landmark, color: "#10b981", bg: "#ecfdf5" },
                { label: "Customers", val: analytics?.customers || 0, icon: User, color: "#f59e0b", bg: "#fffbeb" },
                { label: "Appointments", val: analytics?.appointments || 0, icon: Calendar, color: "#ec4899", bg: "#fdf2f8" },
                { label: "Products", val: analytics?.products || 0, icon: Package, color: "#6366f1", bg: "#eef2ff" },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} style={{ background: item.bg, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <Icon size={20} color={item.color} />
                    <div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>{item.val}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "owner" && (
        <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a" }}>Owner & Verification Profile</h3>
            {owner && (
              <button
                type="button"
                onClick={handleResendOwnerInvite}
                disabled={busyAction === "resend-invite"}
                style={{
                  padding: "8px 16px",
                  background: "#4f46e5",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: busyAction === "resend-invite" ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <Mail size={14} /> {busyAction === "resend-invite" ? "Sending..." : "Resend Invitation"}
              </button>
            )}
          </div>
          {owner ? (
            <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "14px 0", fontSize: "0.9rem" }}>
              <div style={{ color: "#64748b" }}>Owner Name</div><div style={{ color: "#0f172a", fontWeight: 600 }}>{owner.name}</div>
              <div style={{ color: "#64748b" }}>Email Address</div><div style={{ color: "#0f172a", fontWeight: 500 }}>{owner.email}</div>
              <div style={{ color: "#64748b" }}>Phone Number</div><div style={{ color: "#0f172a", fontWeight: 500 }}>{owner.phone || salon.phone || "-"}</div>
              <div style={{ color: "#64748b" }}>System Role</div><div style={{ color: "#4f46e5", fontWeight: 700 }}>SALON_OWNER</div>
              
              <div style={{ color: "#64748b" }}>Email / Password Setup</div>
              <div>
                {owner.passwordSetupRequired ? (
                  <span style={{ background: "#fef3c7", color: "#92400e", padding: "3px 8px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700 }}>
                    ⏳ Pending Setup (Invitation Sent)
                  </span>
                ) : (
                  <span style={{ background: "#ecfdf5", color: "#065f46", padding: "3px 8px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700 }}>
                    ✓ Email Verified & Password Active
                  </span>
                )}
              </div>

              <div style={{ color: "#64748b" }}>Mobile Verification</div>
              <div>
                {owner.isPhoneVerified ? (
                  <span style={{ background: "#ecfdf5", color: "#065f46", padding: "3px 8px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700 }}>
                    ✓ Mobile OTP Verified
                  </span>
                ) : (
                  <span style={{ background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600 }}>
                    Pending Verification
                  </span>
                )}
              </div>

              <div style={{ color: "#64748b" }}>Account Status</div>
              <div>
                {owner.isActive !== false ? (
                  <span style={{ background: "#ecfdf5", color: "#065f46", padding: "3px 8px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700 }}>
                    Active
                  </span>
                ) : (
                  <span style={{ background: "#fee2e2", color: "#991b1b", padding: "3px 8px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700 }}>
                    Inactive
                  </span>
                )}
              </div>

              <div style={{ color: "#64748b" }}>Last Login</div>
              <div style={{ color: "#334155", fontWeight: 500 }}>
                {owner.lastLoginAt ? new Date(owner.lastLoginAt).toLocaleString() : "Never Logged In"}
              </div>

              <div style={{ color: "#64748b" }}>Account Created</div>
              <div style={{ color: "#334155", fontWeight: 500 }}>
                {owner.createdAt ? new Date(owner.createdAt).toLocaleString() : "-"}
              </div>
            </div>
          ) : (
            <p style={{ color: "#64748b" }}>No owner assigned.</p>
          )}
        </div>
      )}

      {activeTab === "branches" && (
        <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", color: "#0f172a" }}>Branches ({branches?.length || 0})</h3>
          {branches?.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#64748b", fontWeight: 700 }}>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Name</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>City</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Address</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {branches.map(b => (
                  <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{b.name}</td>
                    <td style={{ padding: "10px 12px" }}>{b.city || "-"}</td>
                    <td style={{ padding: "10px 12px" }}>{b.address || "-"}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ background: b.isActive ? "#ecfdf5" : "#fef2f2", color: b.isActive ? "#10b981" : "#ef4444", padding: "2px 8px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700 }}>{b.isActive ? "Active" : "Inactive"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState message="No branches found." />
          )}
        </div>
      )}

      {activeTab === "subscriptions" && (
        <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a" }}>Current Subscription</h3>
            <Link
              to={`/super-admin/subscriptions?q=${encodeURIComponent(salon.name)}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                color: "#fff",
                borderRadius: 8,
                fontSize: "0.85rem",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 2px 6px rgba(79, 70, 229, 0.25)"
              }}
            >
              Manage Subscription in Subscriptions Module →
            </Link>
          </div>
          {subscription ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ border: "1px solid #e2e8f0", padding: 20, borderRadius: 12, background: "#fafafa" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <h4 style={{ margin: 0, color: "#4f46e5", fontSize: "1.15rem", fontWeight: 800 }}>{subscription.plan?.name || "Custom Plan"}</h4>
                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 2 }}>
                      Type: {subscription.status === "TRIAL" ? "Free Trial" : "Active Paid Plan"} • Price: <strong style={{ color: "#0f172a" }}>₹{Number(subscription.amount != null ? subscription.amount : (subscription.plan?.monthlyPrice || 0)).toLocaleString()}/{subscription.billingCycle || "mo"}</strong>
                    </div>
                  </div>
                  <span style={{ fontWeight: 700, color: subscription.status === "ACTIVE" ? "#10b981" : (subscription.status === "TRIAL" ? "#d97706" : "#ef4444"), background: subscription.status === "ACTIVE" ? "#ecfdf5" : (subscription.status === "TRIAL" ? "#fffbeb" : "#fef2f2"), padding: "5px 12px", borderRadius: 100, fontSize: "0.8rem" }}>
                    {subscription.status}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, fontSize: "0.85rem", background: "white", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <div><span style={{ color: "#64748b", display: "block", fontSize: 11, fontWeight: 700 }}>PLAN PRICE</span> <span style={{ fontWeight: 700, color: "#0f172a" }}>₹{Number(subscription.amount != null ? subscription.amount : (subscription.plan?.monthlyPrice || 0)).toLocaleString()} / {subscription.billingCycle || "mo"}</span></div>
                  <div><span style={{ color: "#64748b", display: "block", fontSize: 11, fontWeight: 700 }}>START DATE</span> <span style={{ fontWeight: 600, color: "#0f172a" }}>{new Date(subscription.startsAt).toLocaleDateString()}</span></div>
                  <div><span style={{ color: "#64748b", display: "block", fontSize: 11, fontWeight: 700 }}>EXPIRY DATE</span> <span style={{ fontWeight: 600, color: "#0f172a" }}>{new Date(subscription.endsAt).toLocaleDateString()}</span></div>
                  <div><span style={{ color: "#64748b", display: "block", fontSize: 11, fontWeight: 700 }}>PAYMENT STATUS</span> <span style={{ fontWeight: 600, color: subscription.status === "ACTIVE" ? "#16a34a" : "#d97706" }}>{subscription.status === "ACTIVE" ? "Paid / Active" : "Trial Active"}</span></div>
                  <div><span style={{ color: "#64748b", display: "block", fontSize: 11, fontWeight: 700 }}>RENEWAL DATE</span> <span style={{ fontWeight: 600, color: "#4f46e5" }}>{new Date(subscription.endsAt).toLocaleDateString()}</span></div>
                  <div>
                    <span style={{ color: "#0284c7", display: "block", fontSize: 11, fontWeight: 700 }}>2-DAY ACCESS ENDS</span> 
                    <span style={{ fontWeight: 600, color: "#0369a1" }}>
                      {(() => { const d = new Date(subscription.endsAt); d.setDate(d.getDate() + 2); return d.toLocaleDateString(); })()}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "#9333ea", display: "block", fontSize: 11, fontWeight: 700 }}>90-DAY RETENTION ENDS</span> 
                    <span style={{ fontWeight: 600, color: "#7e22ce" }}>
                      {(() => { const d = new Date(subscription.endsAt); d.setDate(d.getDate() + 90); return d.toLocaleDateString(); })()}
                    </span>
                  </div>
                </div>

                {subscription.plan?.featureFlags && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569", marginBottom: 8 }}>Included Plan Features (Automatic Access)</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {Object.entries(subscription.plan.featureFlags).filter(([_, v]) => v).map(([k]) => (
                        <span key={k} style={{ background: "#f0fdf4", color: "#16a34a", padding: "3px 8px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600, border: "1px solid #bbf7d0" }}>✓ {k}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Plan History Table */}
              <div style={{ marginTop: 8 }}>
                <h4 style={{ margin: "0 0 12px", fontSize: "1rem", color: "#0f172a", fontWeight: 700 }}>Plan & Subscription History</h4>
                {salon.subscriptions?.length > 0 ? (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b", fontWeight: 700, textAlign: "left" }}>
                        <th style={{ padding: "8px 10px" }}>Plan</th>
                        <th style={{ padding: "8px 10px" }}>Status</th>
                        <th style={{ padding: "8px 10px" }}>Start Date</th>
                        <th style={{ padding: "8px 10px" }}>End Date</th>
                        <th style={{ padding: "8px 10px" }}>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salon.subscriptions.map((s) => (
                        <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px 10px", fontWeight: 600, color: "#0f172a" }}>{s.plan?.name || "Custom"}</td>
                          <td style={{ padding: "8px 10px" }}>
                            <span style={{ background: s.status === "ACTIVE" ? "#ecfdf5" : "#fef2f2", color: s.status === "ACTIVE" ? "#10b981" : "#ef4444", padding: "2px 6px", borderRadius: 4, fontWeight: 700, fontSize: 10 }}>
                              {s.status}
                            </span>
                          </td>
                          <td style={{ padding: "8px 10px" }}>{new Date(s.startsAt).toLocaleDateString()}</td>
                          <td style={{ padding: "8px 10px" }}>{new Date(s.endsAt).toLocaleDateString()}</td>
                          <td style={{ padding: "8px 10px", fontWeight: 600 }}>₹{Number(s.amount != null ? s.amount : (s.plan?.monthlyPrice || s.price || 0)).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: "#64748b", fontSize: 13 }}>No past subscription history.</p>
                )}
              </div>
            </div>
          ) : (
            <EmptyState message="No active subscription." />
          )}
        </div>
      )}

      {activeTab === "features" && (
        <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a" }}>Feature Access & Manual Overrides</h3>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#64748b" }}>Plan features are automatically granted. Manual overrides require a special exception reason.</p>
            </div>
          </div>
          {featureFlags && Object.keys(featureFlags).length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
              {Object.entries(featureFlags).sort(([a], [b]) => a.localeCompare(b)).map(([key, enabled]) => {
                const planIncluded = subscription?.plan?.featureFlags?.[key] === true;
                const isOverridden = enabled !== planIncluded;
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: enabled ? "#f0fdf4" : "#f8fafc", border: `1px solid ${enabled ? "#bbf7d0" : "#e2e8f0"}`, borderRadius: 10 }}>
                    <div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1e293b" }}>{key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                        {planIncluded ? (
                          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#15803d", background: "#dcfce7", padding: "2px 6px", borderRadius: 4 }}>Included in Plan</span>
                        ) : (
                          <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#64748b", background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>Not in Plan</span>
                        )}
                        {isOverridden && (
                          <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#b45309", background: "#fef3c7", padding: "2px 6px", borderRadius: 4 }}>⚡ Manual Override</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFeatureOverride(key, enabled)}
                      disabled={busyAction === `feature-${key}`}
                      style={{
                        padding: "6px 12px",
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        color: enabled ? "#16a34a" : "#dc2626",
                        background: enabled ? "#dcfce7" : "#fee2e2",
                        border: `1px solid ${enabled ? "#86efac" : "#fca5a5"}`,
                        borderRadius: 6,
                        cursor: "pointer"
                      }}
                    >
                      {busyAction === `feature-${key}` ? "Saving..." : (enabled ? "ENABLED" : "DISABLED")}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="No feature flags configured for this salon." />
          )}
        </div>
      )}

      {activeTab === "payments" && (
        <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", color: "#0f172a" }}>Payment History ({payments?.length || 0})</h3>
          {payments?.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#64748b", fontWeight: 700 }}>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Date</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Amount</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Method</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Status</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 12px" }}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "-"}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>₹{p.amount || 0}</td>
                    <td style={{ padding: "10px 12px" }}>{p.mode || "-"}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ background: p.status === "PAID" ? "#ecfdf5" : "#fffbeb", color: p.status === "PAID" ? "#10b981" : "#d97706", padding: "2px 8px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700 }}>{p.status || "PENDING"}</span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#64748b" }}>{p.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState message="No payments recorded." />
          )}
        </div>
      )}

      {activeTab === "productRequests" && (
        <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", color: "#0f172a" }}>Product Requests ({productRequests?.length || 0})</h3>
          {productRequests?.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#64748b", fontWeight: 700 }}>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Product</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Category</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Qty</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Priority</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Date</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {productRequests.map(r => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{r.productName || "-"}</td>
                    <td style={{ padding: "10px 12px" }}>{r.category || "-"}</td>
                    <td style={{ padding: "10px 12px" }}>{r.quantity || 1}</td>
                    <td style={{ padding: "10px 12px" }}>{r.priority || "MEDIUM"}</td>
                    <td style={{ padding: "10px 12px" }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "-"}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ background: r.status === "APPROVED" || r.status === "COMPLETED" ? "#ecfdf5" : r.status === "REJECTED" ? "#fef2f2" : r.status === "NEW" ? "#eff6ff" : "#fffbeb", color: r.status === "APPROVED" || r.status === "COMPLETED" ? "#10b981" : r.status === "REJECTED" ? "#ef4444" : r.status === "NEW" ? "#2563eb" : "#d97706", padding: "2px 8px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700 }}>{r.status || "NEW"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState message="No product requests found." />
          )}
        </div>
      )}

      {activeTab === "staffRequests" && (
        <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", color: "#0f172a" }}>Staff Requests ({staffRequests?.length || 0})</h3>
          {staffRequests?.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#64748b", fontWeight: 700 }}>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Title</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Department</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Position</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Staff</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Salary</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Date</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {staffRequests.map(r => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{r.title || "-"}</td>
                    <td style={{ padding: "10px 12px" }}>{r.department || "-"}</td>
                    <td style={{ padding: "10px 12px" }}>{r.position || "-"}</td>
                    <td style={{ padding: "10px 12px" }}>{r.count || 1}</td>
                    <td style={{ padding: "10px 12px" }}>{r.salary || "-"}</td>
                    <td style={{ padding: "10px 12px" }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "-"}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ background: r.status === "CLOSED" ? "#ecfdf5" : r.status === "IN_PROGRESS" ? "#dbeafe" : "#fef3c7", color: r.status === "CLOSED" ? "#10b981" : r.status === "IN_PROGRESS" ? "#3b82f6" : "#f59e0b", padding: "2px 8px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700 }}>{r.status || "OPEN"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState message="No staff requests found." />
          )}
        </div>
      )}

      {activeTab === "support" && (
        <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", color: "#0f172a" }}>Support Tickets ({tickets?.length || 0})</h3>
          {tickets?.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#64748b", fontWeight: 700 }}>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Title</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Category</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Priority</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Status</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{t.title || "-"}</td>
                    <td style={{ padding: "10px 12px" }}>{t.category || "-"}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ color: t.priority === "HIGH" || t.priority === "URGENT" ? "#ef4444" : "#64748b", fontWeight: 600 }}>{t.priority || "-"}</span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ background: t.status === "RESOLVED" || t.status === "CLOSED" ? "#ecfdf5" : "#fffbeb", color: t.status === "RESOLVED" || t.status === "CLOSED" ? "#10b981" : "#d97706", padding: "2px 8px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700 }}>{t.status || "OPEN"}</span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState message="No support tickets." />
          )}
        </div>
      )}

      {activeTab === "analytics" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", color: "#0f172a" }}>Business Metrics</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Total Services", val: analytics?.services || 0, icon: Scissors, color: "#8b5cf6" },
                { label: "Total Staff", val: analytics?.staff || 0, icon: Users, color: "#3b82f6" },
                { label: "Total Branches", val: analytics?.branches || 0, icon: Landmark, color: "#10b981" },
                { label: "Total Customers", val: analytics?.customers || 0, icon: User, color: "#f59e0b" },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#f8fafc", borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Icon size={18} color={item.color} />
                      <span style={{ fontSize: "0.9rem", color: "#334155" }}>{item.label}</span>
                    </div>
                    <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>{item.val}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", color: "#0f172a" }}>System Activity</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Total Appointments", val: analytics?.appointments || 0, icon: Calendar, color: "#ec4899" },
                { label: "Total Products", val: analytics?.products || 0, icon: Package, color: "#6366f1" },
                { label: "Support Tickets", val: tickets?.length || 0, icon: Ticket, color: "#f97316" },
                { label: "Audit Log Entries", val: auditLogs?.length || 0, icon: ActivityIcon, color: "#14b8a6" },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#f8fafc", borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Icon size={18} color={item.color} />
                      <span style={{ fontSize: "0.9rem", color: "#334155" }}>{item.label}</span>
                    </div>
                    <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>{item.val}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "activity" && (
        <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", color: "#0f172a" }}>Activity Log ({auditLogs?.length || 0})</h3>
          {auditLogs?.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {auditLogs.map((log, idx) => (
                <div key={log.id || idx} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: idx < auditLogs.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4f46e5", marginTop: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.85rem", color: "#334155" }}>{log.summary || `${log.action} on ${log.entityType}`}</div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 4 }}>
                      {log.actorUserId ? `By: ${log.actorUserId}` : ""} {log.createdAt ? `• ${new Date(log.createdAt).toLocaleString()}` : ""}
                    </div>
                    {log.metadata && typeof log.metadata === "object" && Object.keys(log.metadata).length > 0 && (
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 4, background: "#f8fafc", padding: "6px 10px", borderRadius: 6 }}>
                        {Object.entries(log.metadata).map(([k, v]) => (
                          <div key={k}><span style={{ fontWeight: 600 }}>{k}:</span> {typeof v === "object" ? JSON.stringify(v) : String(v)}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No activity recorded yet." />
          )}
        </div>
      )}

      {activeTab === "dataExport" && (
        <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", color: "#0f172a" }}>Data Export</h3>
          <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: 20 }}>Export salon-specific data as CSV files.</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { type: "customers", label: "Export Customers", color: "#4f46e5" },
              { type: "inventory", label: "Export Inventory", color: "#10b981" },
            ].map(exp => (
              <button key={exp.type} onClick={() => handleExport(exp.type)} disabled={busyAction === `export-${exp.type}`} style={{ padding: "10px 20px", background: exp.color, color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: busyAction === `export-${exp.type}` ? "not-allowed" : "pointer", opacity: busyAction === `export-${exp.type}` ? 0.6 : 1, display: "flex", alignItems: "center", gap: 8 }}>
                <Download size={15} /> {busyAction === `export-${exp.type}` ? "Exporting..." : exp.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suspend Salon Modal */}
      {isSuspendModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "white", width: "100%", maxWidth: 480, borderRadius: 16, padding: "24px 28px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#dc2626" }}>
                <AlertCircle size={20} />
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#991b1b" }}>Suspend Salon</h3>
              </div>
              <button onClick={() => setIsSuspendModalOpen(false)} style={{ border: "none", background: "#f1f5f9", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            <p style={{ margin: "0 0 16px", fontSize: "0.85rem", color: "#475569" }}>
              Suspending <strong>{salon.name}</strong> will immediately revoke login access for all staff and pause public client booking.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 6 }}>Reason for Suspension *</label>
                <select
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  style={{ width: "100%", height: 40, borderRadius: 8, border: "1px solid #cbd5e1", padding: "0 10px", fontSize: "0.85rem" }}
                >
                  <option value="Non-Payment / Overdue">Non-Payment / Overdue</option>
                  <option value="Terms of Service Violation">Terms of Service Violation</option>
                  <option value="Salon Owner Request">Salon Owner Request</option>
                  <option value="Fraud / Suspicious Activity">Fraud / Suspicious Activity</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 6 }}>Internal Notes</label>
                <textarea
                  rows={3}
                  value={suspendNote}
                  onChange={(e) => setSuspendNote(e.target.value)}
                  placeholder="Add specific details or audit notes for this suspension..."
                  style={{ width: "100%", borderRadius: 8, border: "1px solid #cbd5e1", padding: 10, fontSize: "0.85rem", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsSuspendModalOpen(false)}
                  style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #cbd5e1", background: "white", color: "#64748b", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSuspend}
                  disabled={busyAction === "suspend"}
                  style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#dc2626", color: "white", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  {busyAction === "suspend" ? "Suspending..." : "Confirm Suspension"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
