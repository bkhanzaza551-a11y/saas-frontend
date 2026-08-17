import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../api/client";

function isCustomDomain() {
  const host = window.location.hostname.toLowerCase();
  return !host.includes("vercel.app") && !host.includes("localhost") && !host.includes("salonnest.in") && !host.includes("127.0.0.1");
}

export default function DomainResolver({ children }) {
  const location = useLocation();
  const [resolved, setResolved] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isCustomDomain()) {
      setResolved(false);
      setChecking(false);
      return;
    }
    if (location.pathname.startsWith("/site/")) {
      setResolved(false);
      setChecking(false);
      return;
    }
    api.get("/public/domain/resolve")
      .then(({ data }) => {
        if (data.salonSlug) {
          setResolved(data.salonSlug);
        } else {
          setResolved(false);
        }
      })
      .catch(() => setResolved(false))
      .finally(() => setChecking(false));
  }, [location.pathname]);

  if (checking) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "system-ui" }}>
      <div style={{ width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#ec4899", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  if (resolved) return <Navigate to={`/site/${resolved}${location.pathname === "/" ? "" : location.pathname}${location.search}`} replace />;

  return children;
}
