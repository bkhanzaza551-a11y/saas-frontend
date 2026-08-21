/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastCtx = createContext(null);

const STYLES = {
  success: { icon: CheckCircle2, bar: "#22c55e", iconBg: "#f0fdf4", iconColor: "#16a34a", glow: "rgba(34,197,94,0.25)" },
  error: { icon: XCircle, bar: "#ef4444", iconBg: "#fef2f2", iconColor: "#dc2626", glow: "rgba(239,68,68,0.25)" },
  warning: { icon: AlertTriangle, bar: "#f59e0b", iconBg: "#fffbeb", iconColor: "#d97706", glow: "rgba(245,158,11,0.25)" },
  info: { icon: Info, bar: "#3b82f6", iconBg: "#eff6ff", iconColor: "#2563eb", glow: "rgba(59,130,246,0.25)" }
};

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const push = useCallback((type, title, message, duration = 4200) => {
    const id = ++toastId;
    setToasts((current) => [...current.slice(-3), { id, type, title, message, duration }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  useEffect(() => () => { Object.values(timers.current).forEach(clearTimeout); }, []);

  const api = useMemo(() => ({
    success: (title, message, duration) => push("success", title, message, duration),
    error: (title, message, duration) => push("error", title, message, duration),
    warning: (title, message, duration) => push("warning", title, message, duration),
    info: (title, message, duration) => push("info", title, message, duration)
  }), [push]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(40px) scale(0.96); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toastSlideOut {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to { opacity: 0; transform: translateX(40px) scale(0.96); }
        }
        @keyframes toastBarShrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      <div style={{ position: "fixed", top: 18, right: 18, zIndex: 10000, display: "flex", flexDirection: "column", gap: 12, pointerEvents: "none", maxWidth: "calc(100vw - 36px)" }}>
        {toasts.map((t) => {
          const s = STYLES[t.type] || STYLES.info;
          const Icon = s.icon;
          return (
            <div key={t.id} className="salonnest-toast-card" style={{
              pointerEvents: "auto",
              display: "flex",
              alignItems: "stretch",
              minWidth: 320,
              maxWidth: 400,
              background: "#ffffff",
              borderRadius: 14,
              boxShadow: `0 12px 32px -8px ${s.glow}, 0 4px 16px rgba(15,23,42,0.08)`,
              overflow: "hidden",
              animation: "toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)"
            }}>
              <div style={{ width: 5, background: s.bar, flexShrink: 0 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 14px 16px 14px", flex: 1 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={20} color={s.iconColor} strokeWidth={2.2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>{t.title}</div>
                  {t.message ? (
                    <div style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 500, marginTop: 2, lineHeight: 1.45 }}>{t.message}</div>
                  ) : null}
                </div>
                <button onClick={() => dismiss(t.id)} aria-label="Dismiss" style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, borderRadius: 8, display: "flex", alignItems: "center", color: "#94a3b8", height: "fit-content" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#475569"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
                >
                  <X size={15} />
                </button>
              </div>
              <div style={{ height: 3, position: "relative", background: "#f1f5f9", flexShrink: 0 }}>
                <div style={{ position: "absolute", inset: 0, background: s.bar, animation: `toastBarShrink ${t.duration}ms linear forwards` }} />
              </div>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
};

export const useToast = () => useContext(ToastCtx);
