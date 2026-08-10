import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import { useAlert } from "../../context/AlertContext";
import PageLoader from "../../components/PageLoader";
import EmptyState from "../../components/EmptyState";
import { ArrowLeft, Building2, User, CreditCard, Ticket, ShieldCheck } from "lucide-react";

export default function Salon360ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showConfirm } = useAlert();
  
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [activeTab, setActiveTab] = useState("overview");

  const loadData = async () => {
    setLoading(true);
    setStatus({ error: "", success: "" });
    try {
      const res = await api.get(`/super-admin/salons/${id}`);
      setSalon(res.data);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not load salon details."), success: "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleToggleSuspend = () => {
    if (salon.status === "SUSPENDED") {
      showConfirm("Are you sure you want to unsuspend this workspace? They will regain full access.", () => {
        api.patch(`/super-admin/salons/${id}/status`, { status: "ACTIVE" })
          .then(() => loadData())
          .catch(err => setStatus({ error: formatApiError(err), success: "" }));
      });
    } else {
      const reason = window.prompt("Enter the reason for suspension (required):");
      if (reason && reason.trim()) {
        api.patch(`/super-admin/salons/${id}/status`, { status: "SUSPENDED", suspendedReason: reason })
          .then(() => loadData())
          .catch(err => setStatus({ error: formatApiError(err), success: "" }));
      } else if (reason !== null) {
        window.alert("Suspension reason is required.");
      }
    }
  };

  if (loading) return <PageLoader />;
  if (!salon) return <EmptyState title="Salon Not Found" icon={Building2} message="The requested workspace does not exist." />;

  const owner = salon.users?.find(u => u.salonRole === "SALON_OWNER")?.user;

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <button 
        onClick={() => navigate("/super-admin/salons")}
        style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#64748b", cursor: "pointer", marginBottom: 20, fontWeight: 600 }}
      >
        <ArrowLeft size={16} /> Back to Salons
      </button>

      {status.error && <div style={{ padding: 12, background: "#fef2f2", color: "#ef4444", borderRadius: 8, marginBottom: 16 }}>{status.error}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#0f172a" }}>{salon.name}</h1>
            <span style={{ 
              background: salon.status === "ACTIVE" ? "#ecfdf5" : salon.status === "SUSPENDED" ? "#fef2f2" : "#fffbeb", 
              color: salon.status === "ACTIVE" ? "#10b981" : salon.status === "SUSPENDED" ? "#ef4444" : "#d97706", 
              padding: "4px 10px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700 
            }}>
              {salon.status}
            </span>
          </div>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.9rem" }}>{salon.slug} • {salon.businessType || "Salon"}</p>
        </div>
        <div>
          <button 
            onClick={handleToggleSuspend}
            style={{ 
              padding: "8px 16px", borderRadius: 6, fontWeight: 600, border: "none", cursor: "pointer",
              background: salon.status === "SUSPENDED" ? "#ecfdf5" : "#fef2f2",
              color: salon.status === "SUSPENDED" ? "#10b981" : "#ef4444"
            }}
          >
            {salon.status === "SUSPENDED" ? "Unsuspend Workspace" : "Suspend Workspace"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, borderBottom: "1px solid #e2e8f0", marginBottom: 24 }}>
        {[
          { id: "overview", label: "Overview", icon: Building2 },
          { id: "subscriptions", label: "Subscriptions", icon: ShieldCheck },
          { id: "payments", label: "Payments", icon: CreditCard },
          { id: "support", label: "Support", icon: Ticket }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 16px", background: "none", border: "none", borderBottom: activeTab === tab.id ? "2px solid #4f46e5" : "2px solid transparent",
              color: activeTab === tab.id ? "#4f46e5" : "#64748b", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 8
            }}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", color: "#0f172a" }}>Owner Details</h3>
            {owner ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <User size={18} color="#94a3b8" /> <span style={{ color: "#334155", fontWeight: 500 }}>{owner.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 18, color: "#94a3b8" }}>✉</span> <span style={{ color: "#334155" }}>{owner.email}</span>
                </div>
              </div>
            ) : (
              <p style={{ color: "#64748b" }}>No owner assigned.</p>
            )}
          </div>

          <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", color: "#0f172a" }}>Workspace Details</h3>
            <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "12px 0", fontSize: "0.9rem" }}>
              <div style={{ color: "#64748b" }}>Created At</div>
              <div style={{ color: "#334155", fontWeight: 500 }}>{new Date(salon.createdAt).toLocaleDateString()}</div>
              
              <div style={{ color: "#64748b" }}>Contact Email</div>
              <div style={{ color: "#334155", fontWeight: 500 }}>{salon.email || "-"}</div>
              
              <div style={{ color: "#64748b" }}>Contact Phone</div>
              <div style={{ color: "#334155", fontWeight: 500 }}>{salon.phone || "-"}</div>

              {salon.status === "SUSPENDED" && (
                <>
                  <div style={{ color: "#ef4444", fontWeight: 600 }}>Suspension Reason</div>
                  <div style={{ color: "#ef4444", fontWeight: 500 }}>{salon.suspendedReason || "Not provided"}</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "subscriptions" && (
        <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", color: "#0f172a" }}>Active Plan</h3>
          {salon.subscriptions?.length > 0 ? (
            <div>
              {salon.subscriptions.map(sub => (
                <div key={sub.id} style={{ border: "1px solid #e2e8f0", padding: 16, borderRadius: 8, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <h4 style={{ margin: 0, color: "#4f46e5" }}>{sub.plan?.name || "Custom Plan"}</h4>
                    <span style={{ fontWeight: 600, color: "#10b981" }}>{sub.status}</span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>Started: {new Date(sub.startsAt).toLocaleDateString()}</div>
                    <div>Ends: {new Date(sub.endsAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No subscriptions found for this workspace." />
          )}
        </div>
      )}

      {activeTab === "payments" && (
        <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <EmptyState message="No payments recorded for this workspace." />
        </div>
      )}

      {activeTab === "support" && (
        <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <EmptyState message="No support tickets generated by this workspace." />
        </div>
      )}

    </div>
  );
}
