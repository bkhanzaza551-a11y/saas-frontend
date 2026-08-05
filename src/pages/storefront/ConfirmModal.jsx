import { useEffect, useRef } from "react";

export default function ConfirmModal({ open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", onConfirm, onCancel, danger = false }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handleEscape);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
        padding: 20,
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        style={{
          background: "#fff", borderRadius: 16, padding: 32,
          maxWidth: 400, width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          outline: "none",
        }}
      >
        <h3 id="confirm-modal-title" style={{ margin: "0 0 12px", fontSize: "1.2rem", fontFamily: "var(--sf-font-serif)" }}>
          {title}
        </h3>
        <p style={{ margin: "0 0 24px", color: "#666", fontSize: "0.95rem", lineHeight: 1.6 }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "10px 20px", borderRadius: 8, border: "1px solid #e2e8f0",
              background: "#fff", color: "#333", fontWeight: 600, fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            autoFocus
            style={{
              padding: "10px 20px", borderRadius: 8, border: "none",
              background: danger ? "#dc2626" : "var(--sf-accent, #c8a97e)",
              color: "#fff", fontWeight: 600, fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
