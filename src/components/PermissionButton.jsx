import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";

const normalize = (key) => ({
  camel: key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()),
  snake: key.replace(/([A-Z])/g, "_$1").toLowerCase()
});

export default function PermissionButton({ module, action = "create", featureKey, onClick, children, disabled, style, ...rest }) {
  const { auth } = useAuth();
  const alert = useAlert();

  const isOwner = auth?.membership?.salonRole === "SALON_OWNER";
  const permissions = auth?.membership?.permissions || {};
  const featureFlags = auth?.membership?.featureFlags || {};

  let allowed = !!isOwner;
  if (!allowed && module) {
    const { camel, snake } = normalize(module);
    const has = (k) => Array.isArray(permissions[k]) && permissions[k].includes(action);
    allowed = has(module) || has(camel) || has(snake);
  }
  const featureEnabled = !featureKey || featureFlags[featureKey] !== false;

  const handleClick = (event) => {
    if (!allowed || !featureEnabled) {
      alert.showAlert(
        "You don't have permission for this action. Please contact your salon owner to update your role access.",
        "Access Restricted"
      );
      return;
    }
    onClick?.(event);
  };

  return (
    <button {...rest} style={style} disabled={disabled} onClick={handleClick}>
      {children}
    </button>
  );
}
