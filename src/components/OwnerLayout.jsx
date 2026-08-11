import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
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
      <div className="page-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <div className="panel-card" style={{ textAlign: "center", maxWidth: 500, margin: "auto" }}>
          <h2>Maintenance Mode</h2>
          <p className="muted" style={{ marginBottom: 20 }}>
            The system is currently undergoing scheduled maintenance. Please check back later. We apologize for the inconvenience.
          </p>
          <button className="sf-btn sf-btn-outline" onClick={() => window.location.reload()}>Refresh Page</button>
        </div>
      </div>
    );
  }

  // Check subscription status
  const isExpired = subscription?.status === "EXPIRED" || subscription?.status === "RESTRICTED";
  // Allow access to settings/subscription even if expired
  const isSubscriptionPage = location.pathname.includes("/settings");

  if (isExpired && !isSubscriptionPage && auth?.membership?.salonRole === "SALON_OWNER") {
    return (
      <div className="page-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <div className="panel-card" style={{ textAlign: "center", maxWidth: 500, margin: "auto" }}>
          <h2 style={{ color: "var(--danger-color, #ef4444)" }}>Subscription {subscription.status.toLowerCase()}</h2>
          <p className="muted" style={{ marginBottom: 20 }}>
            Your salon subscription has ended. Please renew your plan to regain full access to your workspace.
          </p>
          <button className="sf-btn sf-btn-primary" onClick={() => nav("/admin/settings/subscription")}>View Subscription Options</button>
        </div>
      </div>
    );
  }

  return (
    <>
      {isExpired && auth?.membership?.salonRole === "SALON_OWNER" && (
        <div style={{ background: "var(--danger-color, #ef4444)", color: "white", padding: "10px 20px", textAlign: "center", fontSize: "14px", fontWeight: "600" }}>
          Your subscription is {subscription.status.toLowerCase()}. Your access is restricted.
        </div>
      )}
      <Outlet />
    </>
  );
}
