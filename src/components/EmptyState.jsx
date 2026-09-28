export default function EmptyState({
  title = "Nothing here yet",
  message,
  description,
  label = "Status",
  icon: Icon,
  action,
  actionText,
  onAction
}) {
  const displayMessage = description || message || "New items will appear here once activity starts.";

  return (
    <div className="empty-state">
      <div className="empty-state-accent" aria-hidden="true">
        {Icon ? <Icon size={20} className="empty-state-icon" /> : <span className="empty-state-kicker">{label}</span>}
      </div>
      <strong>{title}</strong>
      <p className="muted">{displayMessage}</p>
      {action ? (
        <div style={{ marginTop: 12 }}>{action}</div>
      ) : actionText && onAction ? (
        <div style={{ marginTop: 12 }}>
          <button type="button" className="primary-button" onClick={onAction}>
            {actionText}
          </button>
        </div>
      ) : null}
    </div>
  );
}
