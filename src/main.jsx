import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { SalonSettingsProvider } from "./context/SalonSettingsContext";
import { BranchProvider } from "./context/BranchContext";
import { AlertProvider } from "./context/AlertContext";
import "./index.css";

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
