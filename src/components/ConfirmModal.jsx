import { useEffect } from "react";
import { AlertTriangle, AlertCircle, CheckCircle2, Trash2, HelpCircle, X } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed with this action?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger", // "danger" | "warning" | "info" | "success" | "dark"
  loading = false,
  icon: CustomIcon = null
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      iconBg: "#fee2e2",
      iconColor: "#dc2626",
      btnBg: "#dc2626",
      btnHover: "#b91c1c",
      icon: Trash2
    },
    warning: {
      iconBg: "#fef3c7",
      iconColor: "#d97706",
      btnBg: "#d97706",
      btnHover: "#b45309",
      icon: AlertTriangle
    },
    info: {
      iconBg: "#eff6ff",
      iconColor: "#2563eb",
      btnBg: "#2563eb",
      btnHover: "#1d4ed8",
      icon: AlertCircle
    },
    success: {
      iconBg: "#ecfdf5",
      iconColor: "#059669",
      btnBg: "#059669",
      btnHover: "#047857",
      icon: CheckCircle2
    },
    dark: {
      iconBg: "#f1f5f9",
      iconColor: "#0f172a",
      btnBg: "#0f172a",
      btnHover: "#1e293b",
      icon: HelpCircle
    }
  };

  const style = variantStyles[variant] || variantStyles.dark;
  const IconComponent = CustomIcon || style.icon;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
        animation: "fadeIn 0.15s ease-out"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "420px",
          padding: "24px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          position: "relative",
          animation: "scaleIn 0.15s ease-out",
          border: "1px solid #e2e8f0"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={loading}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            color: "#94a3b8",
            cursor: loading ? "not-allowed" : "pointer",
            padding: "4px",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#475569")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
        >
          <X size={18} />
        </button>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              background: style.iconBg,
              color: style.iconColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
              boxShadow: `0 0 0 6px ${style.iconBg}40`
            }}
          >
            <IconComponent size={26} strokeWidth={2.2} />
          </div>

          <h3
            style={{
              margin: "0 0 8px 0",
              fontSize: "1.18rem",
              fontWeight: 700,
              color: "#0f172a",
              lineHeight: 1.3
            }}
          >
            {title}
          </h3>

          <p
            style={{
              margin: 0,
              fontSize: "0.88rem",
              color: "#64748b",
              lineHeight: 1.5,
              maxWidth: "340px"
            }}
          >
            {message}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginTop: "24px"
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              height: "40px",
              minHeight: "unset",
              padding: "0 16px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#475569",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
              boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              height: "40px",
              minHeight: "unset",
              padding: "0 16px",
              borderRadius: "10px",
              border: "none",
              background: style.btnBg,
              color: "#ffffff",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
              boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = style.btnHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = style.btnBg)}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
