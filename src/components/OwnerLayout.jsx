import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, Clock, RefreshCw, ShieldAlert, PhoneCall } from "lucide-react";
import { api } from "../api/client";
import PageLoader from "./PageLoader";
import { useAuth } from "../context/AuthContext";

export default function OwnerLayout() {
  const [status, setStatus] = useState("loading");
  const [maintenance, setMaintenance] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const location = useLocation();
  const nav = useNavigate();
  const { auth } = useAuth();

  useEffect(() => {
    let active = true;

    const checkStatus = async () => {
      try {
        const [settingsRes, subRes] = await Promise.all([
          api.get("/public/settings").catch(() => ({ data: { maintenanceMode: false } })),
          api.get("/owner/subscription").catch(() => ({ data: null }))
        ]);

        if (!active) return;

        if (settingsRes.data?.maintenanceMode) {
          setMaintenance(true);
        }
        setSubscription(subRes.data);
        setStatus("ready");
      } catch (err) {
        if (!active) return;
        setStatus("error");
      }
    };
    
    // Only check if logged in as salon staff/owner
    if (auth && auth.user?.systemRole !== "SUPER_ADMIN") {
      checkStatus();
    } else {
      setStatus("ready");
    }

    return () => { active = false; };
  }, [auth]);

  if (status === "loading") {
    return <PageLoader title="Checking workspace access" message="Verifying subscription and system status..." />;
  }

  if (maintenance && auth?.user?.systemRole !== "SUPER_ADMIN") {
    return (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#f8fafc", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="panel-card" style={{ textAlign: "center", maxWidth: 500, margin: "auto", padding: 40, boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}>
          <h2>Maintenance Mode</h2>
          <p className="muted" style={{ marginBottom: 20 }}>
            The system is currently undergoing scheduled maintenance. Please check back later. We apologize for the inconvenience.
          </p>
          <button className="sf-btn sf-btn-outline" onClick={() => window.location.reload()}>Refresh Page</button>
        </div>
      </div>
    );
  }

  // Lifecycle calculations (Points 20, 21, 22)
  const isGraceAccess = subscription?.inGraceAccess || subscription?.computedStatus === "GRACE_ACCESS";
  const isRestricted = subscription?.isRestricted || (subscription && (subscription.daysSinceExpiry > 2 || subscription.status === "SUSPENDED"));
  const isSettingsPage = location.pathname.includes("/settings");

  // If beyond 2-day grace period (Restricted access during 90-day retention), block normal software access
  if (isRestricted && !isSettingsPage && auth?.membership?.salonRole === "SALON_OWNER") {
    const expiredDate = subscription.endsAt ? new Date(subscription.endsAt).toLocaleDateString() : "Recently";
    const accessEndedDate = subscription.accessUntil ? new Date(subscription.accessUntil).toLocaleDateString() : "—";
    const dataRetainedDate = subscription.retentionUntil ? new Date(subscription.retentionUntil).toLocaleDateString() : "—";
    const daysLeftInRetention = subscription.daysRemainingInRetention ?? 90;

    return (
      <div className="page-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0f172a", padding: 20 }}>
        <div style={{ background: "#1e293b", color: "#f8fafc", borderRadius: 16, maxWidth: 560, width: "100%", padding: "36px 32px", border: "1px solid #334155", boxShadow: "0 20px 50px rgba(0,0,0,0.5)", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fee2e2", color: "#dc2626", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
            <ShieldAlert size={28} />
          </div>
          
          <h2 style={{ margin: "0 0 10px", fontSize: "1.4rem", color: "#f8fafc", fontWeight: 700 }}>
            Subscription Expired — Access Restricted
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.5, margin: "0 0 24px" }}>
            The 2-day grace access period for your salon has ended. Normal salon operations (POS, Bookings, Staff Management) are currently locked.
          </p>

          <div style={{ background: "#0f172a", borderRadius: 12, padding: 18, border: "1px solid #334155", textAlign: "left", marginBottom: 24, fontSize: "0.85rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}>
              <div><span style={{ color: "#64748b" }}>Expired On:</span> <strong style={{ color: "#f8fafc" }}>{expiredDate}</strong></div>
              <div><span style={{ color: "#64748b" }}>Access Ended:</span> <strong style={{ color: "#f87171" }}>{accessEndedDate}</strong></div>
              <div><span style={{ color: "#64748b" }}>Data Retained Until:</span> <strong style={{ color: "#818cf8" }}>{dataRetainedDate}</strong></div>
              <div><span style={{ color: "#64748b" }}>Retention Left:</span> <strong style={{ color: "#fbbf24" }}>{daysLeftInRetention} days remaining</strong></div>
            </div>
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #1e293b", fontSize: "0.78rem", color: "#94a3b8" }}>
              💡 <em>All your salon appointments, customer history, invoices, and staff records are completely safe and preserved under our 90-day retention policy. Renewing will immediately unlock your system.</em>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => nav("/admin/settings")}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}
            >
              <RefreshCw size={16} /> Renew Subscription Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 2-Day Grace Access Banner (Point 21) */}
      {isGraceAccess && auth?.membership?.salonRole === "SALON_OWNER" && (
        <div style={{ background: "linear-gradient(90deg, #f97316, #ea580c)", color: "white", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 600, boxShadow: "0 2px 8px rgba(234, 88, 12, 0.25)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={18} />
            <span>
              Your subscription has expired! You are currently on temporary <strong>2-Day Grace Access</strong> until <strong>{subscription.accessUntil ? new Date(subscription.accessUntil).toLocaleString() : "end of grace period"}</strong>.
            </span>
          </div>
          <button
            onClick={() => nav("/admin/settings")}
            style={{ padding: "6px 14px", background: "white", color: "#ea580c", border: "none", borderRadius: 6, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}
          >
            Renew Now
          </button>
        </div>
      )}
      <Outlet />
    </>
  );
}
