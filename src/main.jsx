import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { SalonSettingsProvider } from "./context/SalonSettingsContext";
import { BranchProvider } from "./context/BranchContext";
import { AlertProvider } from "./context/AlertContext";
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  const lastReload = Number(sessionStorage.getItem("vite_preload_reload") || 0);
  if (Date.now() - lastReload > 10000) {
    sessionStorage.setItem("vite_preload_reload", String(Date.now()));
    window.location.href = window.location.pathname + "?_t=" + Date.now();
  }
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <SalonSettingsProvider>
            <BranchProvider>
              <AlertProvider>
                <App />
              </AlertProvider>
            </BranchProvider>
          </SalonSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
