import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import { useAlert } from "../../context/AlertContext";
import PageLoader from "../../components/PageLoader";
import EmptyState from "../../components/EmptyState";
import {
  ArrowLeft, Building2, User, CreditCard, Ticket, ShieldCheck,
  Landmark, Key, Package, Users, BarChart3, Activity as ActivityIcon,
  Download, RefreshCw, Eye, Calendar, Clock, CheckCircle2, XCircle,
  AlertTriangle, Scissors, Mail, Phone, MapPin
} from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: Building2 },
  { id: "owner", label: "Owner", icon: User },
  { id: "branches", label: "Branches", icon: Landmark },
  { id: "subscriptions", label: "Subscription", icon: ShieldCheck },
  { id: "features", label: "Feature Access", icon: Key },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "productRequests", label: "Product Requests", icon: Package },
  { id: "staffRequests", label: "Staff Requests", icon: Users },
  { id: "support", label: "Support", icon: Ticket },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "activity", label: "Activity", icon: ActivityIcon },
  { id: "dataExport", label: "Data Export", icon: Download },
];

const statusColor = (s) => {
  if (s === "ACTIVE") return { bg: "#ecfdf5", color: "#10b981" };
  if (s === "SUSPENDED") return { bg: "#fef2f2", color: "#ef4444" };
  if (s === "TRIAL") return { bg: "#fffbeb", color: "#d97706" };
  return { bg: "#f1f5f9", color: "#64748b" };
};

const FeatureFlagCard = ({ label, enabled }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: enabled ? "#f0fdf4" : "#fef2f2", border: `1px solid ${enabled ? "#bbf7d0" : "#fecaca"}`, borderRadius: 8 }}>
    <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "#334155" }}>{label}</span>
    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: enabled ? "#16a34a" : "#dc2626" }}>{enabled ? "ON" : "OFF"}</span>
  </div>
);

export default function Salon360ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showConfirm } = useAlert();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [activeTab, setActiveTab] = useState("overview");
  const [busyAction, setBusyAction] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setStatus({ error: "", success: "" });
    try {
      const res = await api.get(`/super-admin/salons/${id}/full`);
      setData(res.data);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not load salon details."), success: "" });
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
      const reason = window.prompt("Enter the reason for suspension (required):");
      if (reason && reason.trim()) {
        showConfirm(`Suspend this salon? Reason: ${reason}`, async () => {
          setBusyAction("suspend");
          try {
            await api.patch(`/super-admin/salons/${id}/status`, { status: "SUSPENDED", reason: reason.trim(), internalNote: `Suspended by admin: ${reason.trim()}` });
            setStatus({ error: "", success: "Salon suspended." });
            await loadData();
          } catch (err) {
            setStatus({ error: formatApiError(err), success: "" });
          } finally {
            setBusyAction("");
          }
        });
      } else if (reason !== null) {
        window.alert("Suspension reason is required.");
      }
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
  const branches = data.branches || salon.branches || [];
  const featureFlags = data.featureFlags || salon.featureFlags || {};
  const subscription = data.subscription || (salon.subscriptions && salon.subscriptions[0]) || null;
  const owner = Array.isArray(ownerData) ? ownerData[0] : ownerData;
  const sc = statusColor(salon.status);

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <button onClick={() => navigate("/super-admin/salons")} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#64748b", cursor: "pointer", marginBottom: 20, fontWeight: 600 }}>
        <ArrowLeft size={16} /> Back to Salons
      </button>

      {status.error && <div style={{ padding: 12, background: "#fef2f2", color: "#ef4444", borderRadius: 8, marginBottom: 16 }}>{status.error}</div>}
      {status.success && <div style={{ padding: 12, background: "#f0fdf4", color: "#16a34a", borderRadius: 8, marginBottom: 16 }}>{status.success}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#0f172a" }}>{salon.name}</h1>
            <span style={{ background: sc.bg, color: sc.color, padding: "4px 10px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700 }}>{salon.status}</span>
          </div>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.9rem" }}>{salon.slug} • {salon.businessType || "Salon"} • {salon.city || "N/A"}</p>
        </div>
        <button onClick={handleToggleSuspend} disabled={busyAction === "suspend"} style={{ padding: "8px 16px", borderRadius: 6, fontWeight: 600, border: "none", cursor: busyAction === "suspend" ? "not-allowed" : "pointer", background: salon.status === "SUSPENDED" ? "#ecfdf5" : "#fef2f2", color: salon.status === "SUSPENDED" ? "#10b981" : "#ef4444", opacity: busyAction === "suspend" ? 0.6 : 1 }}>
          {busyAction === "suspend" ? "Processing..." : salon.status === "SUSPENDED" ? "Unsuspend Salon" : "Suspend Salon"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #e2e8f0", marginBottom: 24, overflowX: "auto" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: "12px 16px", background: "none", border: "none", borderBottom: activeTab === tab.id ? "2px solid #4f46e5" : "2px solid transparent", color: activeTab === tab.id ? "#4f46e5" : "#64748b", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
            <tab.icon size={15} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", color: "#0f172a" }}>Salon Details</h3>
            <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "12px 0", fontSize: "0.9rem" }}>
              <div style={{ color: "#64748b" }}>Created</div><div style={{ color: "#334155", fontWeight: 500 }}>{new Date(salon.createdAt).toLocaleDateString()}</div>
              <div style={{ color: "#64748b" }}>Slug</div><div style={{ color: "#334155", fontWeight: 500 }}>{salon.slug}</div>
              <div style={{ color: "#64748b" }}>Business Type</div><div style={{ color: "#334155", fontWeight: 500 }}>{salon.businessType || "-"}</div>
              <div style={{ color: "#64748b" }}>City</div><div style={{ color: "#334155", fontWeight: 500 }}>{salon.city || "-"}</div>
              <div style={{ color: "#64748b" }}>Address</div><div style={{ color: "#334155", fontWeight: 500 }}>{salon.address || "-"}</div>
              <div style={{ color: "#64748b" }}>State</div><div style={{ color: "#334155", fontWeight: 500 }}>{salon.state || "-"}</div>
              <div style={{ color: "#64748b" }}>PIN Code</div><div style={{ color: "#334155", fontWeight: 500 }}>{salon.pinCode || "-"}</div>
              <div style={{ color: "#64748b" }}>Email</div><div style={{ color: "#334155", fontWeight: 500 }}>{salon.email || "-"}</div>
              <div style={{ color: "#64748b" }}>Phone</div><div style={{ color: "#334155", fontWeight: 500 }}>{salon.phone || "-"}</div>
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
          <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", color: "#0f172a" }}>Owner Details</h3>
          {owner ? (
            <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "12px 0", fontSize: "0.9rem" }}>
              <div style={{ color: "#64748b" }}>Name</div><div style={{ color: "#334155", fontWeight: 500 }}>{owner.name}</div>
              <div style={{ color: "#64748b" }}>Email</div><div style={{ color: "#334155", fontWeight: 500 }}>{owner.email}</div>
              <div style={{ color: "#64748b" }}>Phone</div><div style={{ color: "#334155", fontWeight: 500 }}>{owner.phone || salon.phone || "-"}</div>
              <div style={{ color: "#64748b" }}>Role</div><div style={{ color: "#334155", fontWeight: 500 }}>{salon.ownerRole || "SALON_OWNER"}</div>
              <div style={{ color: "#64748b" }}>Joined</div><div style={{ color: "#334155", fontWeight: 500 }}>{owner.createdAt ? new Date(owner.createdAt).toLocaleDateString() : "-"}</div>
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
          <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", color: "#0f172a" }}>Current Subscription</h3>
          {subscription ? (
            <div style={{ border: "1px solid #e2e8f0", padding: 20, borderRadius: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h4 style={{ margin: 0, color: "#4f46e5", fontSize: "1.1rem" }}>{subscription.plan?.name || "Custom Plan"}</h4>
                <span style={{ fontWeight: 700, color: subscription.status === "ACTIVE" ? "#10b981" : "#d97706", background: subscription.status === "ACTIVE" ? "#ecfdf5" : "#fffbeb", padding: "4px 10px", borderRadius: 100, fontSize: "0.75rem" }}>{subscription.status}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, fontSize: "0.9rem" }}>
                <div><span style={{ color: "#64748b" }}>Started:</span> <span style={{ fontWeight: 500 }}>{new Date(subscription.startsAt).toLocaleDateString()}</span></div>
                <div><span style={{ color: "#64748b" }}>Ends:</span> <span style={{ fontWeight: 500 }}>{new Date(subscription.endsAt).toLocaleDateString()}</span></div>
                <div><span style={{ color: "#64748b" }}>Price:</span> <span style={{ fontWeight: 500 }}>₹{subscription.price || "-"}/mo</span></div>
              </div>
              {subscription.plan?.featureFlags && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748b", marginBottom: 8 }}>Plan Features</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {Object.entries(subscription.plan.featureFlags).filter(([_, v]) => v).map(([k]) => (
                      <span key={k} style={{ background: "#f0fdf4", color: "#16a34a", padding: "3px 8px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600 }}>{k}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState message="No active subscription." />
          )}
        </div>
      )}

      {activeTab === "features" && (
        <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", color: "#0f172a" }}>Feature Access</h3>
          {featureFlags && Object.keys(featureFlags).length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {Object.entries(featureFlags).sort(([a], [b]) => a.localeCompare(b)).map(([key, enabled]) => (
                <FeatureFlagCard key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())} enabled={!!enabled} />
              ))}
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

    </div>
  );
}
