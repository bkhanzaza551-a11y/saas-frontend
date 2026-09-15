import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, RefreshCw, ShieldAlert } from "lucide-react";
import { api } from "../api/client";
import PageLoader from "./PageLoader";
import { useAuth } from "../context/AuthContext";

export default function OwnerLayout() {
  const [status, setStatus] = useState("loading");
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceInfo, setMaintenanceInfo] = useState({ message: "", endTime: "" });
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
          setMaintenanceInfo({
            message: settingsRes.data?.maintenanceMessage || "The system is currently undergoing scheduled maintenance.",
            endTime: settingsRes.data?.maintenanceEndTime || ""
          });
        } else {
          setMaintenance(false);
        }
        setSubscription(subRes.data);
        setStatus("ready");
      } catch {
        if (!active) return;
        setStatus("error");
      }
    };
    
    // Always check public settings for maintenance
    checkStatus();

    return () => { active = false; };
  }, [auth]);

  // Live countdown for maintenance screen
  const [countdownText, setCountdownText] = useState("");
  useEffect(() => {
    if (!maintenance || !maintenanceInfo.endTime) return;
    const updateCountdown = () => {
      const end = new Date(maintenanceInfo.endTime).getTime();
      if (isNaN(end)) return;
      const diff = end - Date.now();
      if (diff <= 0) {
        setCountdownText("Finishing maintenance... unlocking now");
        api.get("/public/settings").then(res => {
          if (!res.data?.maintenanceMode) setMaintenance(false);
        }).catch(() => {});
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setCountdownText(`${m}m ${s}s remaining`);
      }
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [maintenance, maintenanceInfo.endTime]);

  if (status === "loading") {
    return <PageLoader title="Checking workspace access" message="Verifying subscription and system status..." />;
  }

  if (maintenance && auth?.user?.systemRole !== "SUPER_ADMIN") {
    return (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ textAlign: "center", maxWidth: 520, margin: "auto", padding: "40px 32px", background: "white", borderRadius: 20, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fee2e2", color: "#dc2626", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16, fontSize: 28 }}>
            ⚠️
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>System Maintenance in Progress</h2>
          <p style={{ color: "#475569", fontSize: 14.5, lineHeight: 1.6, margin: "0 0 20px" }}>
            {maintenanceInfo.message || "We are currently performing scheduled maintenance to upgrade system infrastructure. SalonNest will be back online shortly."}
          </p>
          {maintenanceInfo.endTime && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px 18px", borderRadius: 12, marginBottom: 20, fontSize: 13, color: "#166534", display: "inline-flex", flexDirection: "column", gap: 4 }}>
              <div>⏱️ Scheduled End: <strong style={{ color: "#0f172a" }}>{(() => {
                const d = new Date(maintenanceInfo.endTime);
                return !isNaN(d.getTime()) 
                  ? d.toLocaleString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) 
                  : maintenanceInfo.endTime;
              })()}</strong></div>
              {countdownText && <div style={{ fontSize: 14, fontWeight: 800, color: "#059669" }}>⏳ {countdownText}</div>}
            </div>
          )}
          <div>
            <button 
              onClick={() => window.location.reload()} 
              style={{ padding: "10px 24px", background: "#4f46e5", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)" }}
            >
              Refresh Status
            </button>
          </div>
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
