import { Suspense, lazy, useEffect, useState } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import "./index.css";
import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";
import { useAuth } from "./context/AuthContext";
import PageLoader from "./components/PageLoader.jsx";
import { SETTINGS_WORKSPACE_SECTIONS } from "./pages/owner/settingsWorkspaceConfig.js";
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    const lastReload = Number(window.sessionStorage.getItem("chunk_reload_timestamp") || 0);
    const now = Date.now();
    try {
      const comp = await componentImport();
      window.sessionStorage.removeItem("chunk_reload_timestamp");
      return comp;
    } catch (error) {
      if (now - lastReload > 10000) {
        window.sessionStorage.setItem("chunk_reload_timestamp", String(now));
        window.location.href = window.location.pathname + "?_t=" + now;
        return new Promise(() => {});
      }
      throw error;
    }
  });

const LoginPage = lazyWithRetry(() => import("./pages/LoginPage.jsx"));
const ForgotPasswordPage = lazyWithRetry(() => import("./pages/ForgotPasswordPage.jsx"));
const ResetPasswordPage = lazyWithRetry(() => import("./pages/ResetPasswordPage.jsx"));
const OwnerDashboard = lazyWithRetry(() => import("./pages/owner/Dashboard.jsx"));
const AppointmentsPage = lazyWithRetry(() => import("./pages/owner/AppointmentsPage.jsx"));
const AppointmentDetailPage = lazyWithRetry(() => import("./pages/owner/AppointmentDetailPage.jsx"));
const AppointmentEditPage = lazyWithRetry(() => import("./pages/owner/AppointmentEditPage.jsx"));
const CustomersPage = lazyWithRetry(() => import("./pages/owner/CustomersPage.jsx"));
const CustomerHistoryPage = lazyWithRetry(() => import("./pages/owner/CustomerHistoryPage.jsx"));
const CustomerPortalSettingsPage = lazyWithRetry(() => import("./pages/owner/CustomerPortalSettingsPage.jsx"));
const CouponsPage = lazyWithRetry(() => import("./pages/owner/CouponsPage.jsx"));
const FeedbackPage = lazyWithRetry(() => import("./pages/owner/FeedbackPage.jsx"));
const EnquiriesPage = lazyWithRetry(() => import("./pages/owner/EnquiriesPage.jsx"));
const ExpensesPage = lazyWithRetry(() => import("./pages/owner/ExpensesPage.jsx"));
const NotificationsPage = lazyWithRetry(() => import("./pages/owner/NotificationsPage.jsx"));
const OwnerAuditLogsPage = lazyWithRetry(() => import("./pages/owner/OwnerAuditLogsPage.jsx"));

const BranchesPage = lazyWithRetry(() => import("./pages/owner/BranchesPage.jsx"));
const GlobalDashboardPage = lazyWithRetry(() => import("./pages/operations/GlobalDashboardPage.jsx"));
const SalonAnalyticsPage = lazyWithRetry(() => import("./pages/operations/SalonAnalyticsPage.jsx"));
const FinancialReportsPage = lazyWithRetry(() => import("./pages/owner/FinancialReportsPage.jsx"));
const WebsiteAnalyticsPage = lazyWithRetry(() => import("./pages/owner/WebsiteAnalyticsPage.jsx"));
const AttendanceManagementPage = lazyWithRetry(() => import("./pages/owner/AttendanceManagementPage.jsx"));

const PublicDemoLeadPage = lazyWithRetry(() => import("./pages/public/DemoLeadPage.jsx"));
const DemoCheckoutPage = lazyWithRetry(() => import("./pages/public/DemoCheckoutPage.jsx"));
const MarketingHomePage = lazyWithRetry(() => import("./pages/public/MarketingHomePage.jsx"));

const SuperAdminDashboard = lazyWithRetry(() => import("./pages/superAdmin/Dashboard.jsx"));
const SuperAdminSalonsPage = lazyWithRetry(() => import("./pages/superAdmin/SalonsPage.jsx"));
const SuperAdminSalon360ProfilePage = lazyWithRetry(() => import("./pages/superAdmin/Salon360ProfilePage.jsx"));
const SuperAdminPlansPage = lazyWithRetry(() => import("./pages/superAdmin/PlansPage.jsx"));
const SuperAdminDemoLeadsPage = lazyWithRetry(() => import("./pages/superAdmin/DemoLeadsPage.jsx"));
const SuperAdminSubscriptionsPage = lazyWithRetry(() => import("./pages/superAdmin/SubscriptionsPage.jsx"));
const SuperAdminStaffRequirementsPage = lazyWithRetry(() => import("./pages/superAdmin/StaffRequirementsPage.jsx"));
const SuperAdminProductsRequirementPage = lazyWithRetry(() => import("./pages/superAdmin/ProductsRequirementPage.jsx"));
const SuperAdminSupportTicketsPage = lazyWithRetry(() => import("./pages/superAdmin/SupportTicketsPage.jsx"));
const SuperAdminSettingsPage = lazyWithRetry(() => import("./pages/superAdmin/SettingsPage.jsx"));
const SuperAdminAuditLogsPage = lazyWithRetry(() => import("./pages/superAdmin/AuditLogsPage.jsx"));
const SuperAdminTrafficAnalyticsPage = lazyWithRetry(() => import("./pages/superAdmin/TrafficAnalyticsPage.jsx"));
const SuperAdminStaffPage = lazyWithRetry(() => import("./pages/superAdmin/StaffManagementPage.jsx"));
const SuperAdminFinancialReportsPage = lazyWithRetry(() => import("./pages/superAdmin/FinancialReportsPage.jsx"));

const InventoryPage = lazyWithRetry(() => import("./pages/owner/InventoryPage.jsx"));
const ProductCategoriesPage = lazyWithRetry(() => import("./pages/owner/ProductCategoriesPage.jsx"));
const MembershipsPage = lazyWithRetry(() => import("./pages/owner/MembershipsPage.jsx"));
const ReferralProgramPage = lazyWithRetry(() => import("./pages/owner/ReferralProgramPage.jsx"));
const MyAppointmentsPage = lazyWithRetry(() => import("./pages/owner/MyAppointmentsPage.jsx"));

const MyDashboardPage = lazyWithRetry(() => import("./pages/owner/MyDashboardPage.jsx"));
const MyAttendanceHistoryPage = lazyWithRetry(() => import("./pages/owner/MyAttendanceHistoryPage.jsx"));

const MyProfilePage = lazyWithRetry(() => import("./pages/owner/MyProfilePage.jsx"));
const MySchedulePage = lazyWithRetry(() => import("./pages/owner/MySchedulePage.jsx"));
const ServiceCategoriesPage = lazyWithRetry(() => import("./pages/owner/ServiceCategoriesPage.jsx"));
const StaffSchedulePage = lazyWithRetry(() => import("./pages/owner/StaffSchedulePage.jsx"));
const UsersPage = lazyWithRetry(() => import("./pages/owner/UsersPage.jsx"));
const ExpertsPage = lazyWithRetry(() => import("./pages/owner/ExpertsPage.jsx"));
const StaffRolesPage = lazyWithRetry(() => import("./pages/owner/StaffRolesPage.jsx"));
const ReportsPage = lazyWithRetry(() => import("./pages/owner/ReportsPage.jsx"));
const PosPage = lazyWithRetry(() => import("./pages/owner/PosPage.jsx"));
const InvoicesPage = lazyWithRetry(() => import("./pages/owner/InvoicesPage.jsx"));
const PosDashboardPage = lazyWithRetry(() => import("./pages/owner/PosDashboardPage.jsx"));
const PaymentsPage = lazyWithRetry(() => import("./pages/owner/PaymentsPage.jsx"));
const TrendsPage = lazyWithRetry(() => import("./pages/owner/TrendsPage.jsx"));
const ReportsHubPage = lazyWithRetry(() => import("./pages/owner/ReportsHubPage.jsx"));
const SupportTicketsPage = lazyWithRetry(() => import("./pages/owner/SupportTicketsPage.jsx"));
const SettingsPage = lazyWithRetry(() => import("./pages/owner/SettingsPage.jsx"));
const SalonDetailsPage = lazyWithRetry(() => import("./pages/owner/SalonDetailsPage.jsx"));

const CustomerLoginPage = lazyWithRetry(() => import("./pages/customer/CustomerLoginPage.jsx"));
const CustomerRegisterPage = lazyWithRetry(() => import("./pages/customer/CustomerRegisterPage.jsx"));
const CustomerPortalPage = lazyWithRetry(() => import("./pages/customer/CustomerPortalPage.jsx"));

const OrdersPage = lazyWithRetry(() => import("./pages/owner/OrdersPage.jsx"));
const CampaignsPage = lazyWithRetry(() => import("./pages/owner/CampaignsPage.jsx"));
const CampaignTemplatesPage = lazyWithRetry(() => import("./pages/owner/CampaignTemplatesPage.jsx"));
const MessageTemplatesPage = lazyWithRetry(() => import("./pages/owner/MessageTemplatesPage.jsx"));

const StorefrontLayout = lazyWithRetry(() => import("./pages/storefront/StorefrontLayout.jsx"));
const HomePage = lazyWithRetry(() => import("./pages/storefront/HomePage.jsx"));
const CollectionsPage = lazyWithRetry(() => import("./pages/storefront/CollectionsPage.jsx"));
const CategoryDetailPage = lazyWithRetry(() => import("./pages/storefront/CategoryDetailPage.jsx"));
const ProductDetailPage = lazyWithRetry(() => import("./pages/storefront/ProductDetailPage.jsx"));
const ServiceDetailPage = lazyWithRetry(() => import("./pages/storefront/ServiceDetailPage.jsx"));
const CheckoutPage = lazyWithRetry(() => import("./pages/storefront/CheckoutPage.jsx"));
const BookingConfirmationPage = lazyWithRetry(() => import("./pages/storefront/BookingConfirmationPage.jsx"));
const MyBookingsPage = lazyWithRetry(() => import("./pages/storefront/MyBookingsPage.jsx"));
const StorefrontAboutPage = lazyWithRetry(() => import("./pages/storefront/storefront/AboutPage.jsx"));
const StorefrontContactPage = lazyWithRetry(() => import("./pages/storefront/storefront/ContactPage.jsx"));
const LegalContentPage = lazyWithRetry(() => import("./pages/shared/LegalContentPage.jsx"));
const PublicPrivacyPolicyPage = lazyWithRetry(() => import("./pages/public/PublicPrivacyPolicyPage.jsx"));
const WebsiteEditorPage = lazyWithRetry(() => import("./pages/owner/WebsiteEditorPage.jsx"));
const ManagePage = lazyWithRetry(() => import("./pages/owner/ManagePage.jsx"));
const EcommerceOrdersPage = lazyWithRetry(() => import("./pages/owner/EcommerceOrdersPage.jsx"));
const ProductsRequirementPage = lazyWithRetry(() => import("./pages/owner/ProductsRequirementPage.jsx"));
const StaffRequirementsPage = lazyWithRetry(() => import("./pages/owner/StaffRequirementsPage.jsx"));

const WhatsAppCreditsPage = lazyWithRetry(() => import("./pages/owner/WhatsAppCreditsPage.jsx"));
const ManageCreditsPage = lazyWithRetry(() => import("./pages/superAdmin/ManageCreditsPage.jsx"));
import OwnerLayout from "./components/OwnerLayout.jsx";

const RouteFallback = () => {
  const isStorefront = window.location.pathname.startsWith("/site/");
  if (isStorefront) {
    return <div style={{ height: "100vh", background: "#0f172a" }}></div>;
  }
  return (
    <div className="page-shell">
      <div className="panel-card">
        <PageLoader title="Loading workspace" message="We are preparing the right panel, modules, and live data for you." />
      </div>
    </div>
  );
};

const Protected = () => {
  const { auth, logout } = useAuth();
  const location = useLocation();
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    const saved = localStorage.getItem("sidebarExpanded");
    return saved !== null ? saved === "true" : true;
  });
  
  const toggleSidebar = () => {
    setSidebarExpanded(prev => {
      const next = !prev;
      localStorage.setItem("sidebarExpanded", next);
      return next;
    });
  };
  if (!auth) return <Navigate to="/login" replace />;
  const perms = auth.membership?.permissions || {};
  const flags = auth.membership?.featureFlags || {};
  const salonRole = auth.membership?.salonRole || "";
  const can = (key, action = "view") => Array.isArray(perms[key]) && perms[key].includes(action);
  const enabled = (key) => !key || flags[key] === true;
  const isOwner = salonRole === "SALON_OWNER";
  const shouldShowMyWorkspace = salonRole && !isOwner;
  const myWorkspaceItems = [
    { label: "My Dashboard", to: "/admin/my-dashboard" },
    { label: "My Attendance", to: "/admin/my-attendance" },
    { label: "My Appointments", to: "/admin/my-appointments" },
    { label: "My Schedule", to: "/admin/my-schedule" },
    { label: "My Profile", to: "/admin/my-profile" }
  ];
  const groups = [
        {
          label: "Operations",
          hint: "Daily flow",
          items: [
            { label: "Dashboard", to: "/admin/dashboard" },
            enabled("pos") && { label: "Global Dashboard", to: "/admin/global-dashboard" },
            enabled("pos") && { label: "New Sale", to: "/admin/pos" },
            enabled("pos") && { label: "POS Dashboard", to: "/admin/pos-dashboard" },
            { label: "Appointments", to: "/admin/appointments" },
            enabled("crm") && { label: "Customer", to: "/admin/customers" },
            enabled("reports") && { label: "Reports", to: "/admin/reports" },
            enabled("reports") && { label: "Trends", to: "/admin/trends" },
            enabled("attendance") && { label: "Attendance Management", to: "/admin/attendance" },
          ].filter(Boolean)
        },

        {
          label: "Website",
          hint: "Storefront & Portal",
          items: [
            can("settings", "edit") && { label: "Website Editor", to: "/admin/website-editor" },
            can("settings", "view") && enabled("catalogAnalytics") && { label: "Website Analytics", to: "/admin/website-analytics" },
            can("orders", "view") && enabled("onlineOrders") && { label: "Bookings", to: "/admin/order-dashboard" },
            { label: "View Live Site", to: `/site/${auth?.membership?.salon?.slug || "demo-salon"}` }
          ].filter(Boolean)
        },
        {
          label: "System",
          hint: "Help and config",
          items: [
            can("settings", "edit") && {
              label: "Settings",
              to: "/admin/settings/generic"
            },
            { label: "Salon Details", to: "/admin/salon-details" }
          ].filter(Boolean)
        },
        {
          label: "Manage",
          to: "/admin/manage",
          hint: "Salon lifecycle hub"
        },
        {
          label: "Support",
          to: "/admin/support-tickets",
          hint: "Tickets & assistance"
        }
      ].filter((group) => group.to || (Array.isArray(group?.items) && group.items.length > 0));

  const settingsGroups = [
    {
      label: "Workspace",
      hint: "Back to main pages",
      defaultOpen: true,
      items: [
        can("dashboard") && { label: "Home / Dashboard", to: "/admin/dashboard" },
        can("pos") && { label: "POS", to: "/admin/pos" },
        can("orders") && enabled("onlineOrders") && { label: "POS Dashboard", to: "/admin/pos-dashboard" },
        can("appointments") && { label: "Appointments", to: "/admin/appointments" },
        can("customers") && { label: "CRM", to: "/admin/customers" },
        can("reports") && enabled("reports") && { label: "Reports", to: "/admin/reports" },
        can("inventory") && enabled("inventory") && { label: "Inventory", to: "/admin/inventory" },
        { label: "Trends", to: "/admin/trends" }
      ].filter(Boolean)
    },
    {
      label: "Settings",
      hint: "Business configuration",
      defaultOpen: true,
      items: can("settings", "edit")
        ? SETTINGS_WORKSPACE_SECTIONS.map((item) => ({ label: item.label, to: item.to }))
        : []
    }
  ].filter((group) => Array.isArray(group?.items) && group.items.length > 0);

  const manageGroups = [
    {
      label: "Manage",
      hint: "Salon lifecycle",
      items: [
        { label: "Services", to: "/admin/services" },
        {
          label: "Team & Roles",
          to: "/admin/users"
        },
        {
          label: "Staff Schedule",
          to: "/admin/staff-schedule",
          children: [
            { label: "Availability", to: "/admin/staff-availability" }
          ]
        },
        { label: "Memberships / Packages", to: "/admin/memberships", children: [{ label: "Packages", to: "/admin/packages" }] },
        { label: "Coupons & Gift Cards", to: "/admin/coupons", children: [{ label: "Coupons", to: "/admin/coupons" }, { label: "Gift Cards", to: "/admin/gift-cards" }] },
        { label: "Referral Program", to: "/admin/referral-coupons", children: [{ label: "Coupons", to: "/admin/referral-coupons" }, { label: "Partners", to: "/admin/referral-coupons" }, { label: "Wallets", to: "/admin/referral-coupons" }] },

        { label: "Payments", to: "/admin/payments" },
        { label: "WhatsApp Credits", to: "/admin/whatsapp-credits" },
        { label: "Campaigns", to: "/admin/campaigns" },
        { label: "Reports Hub", to: "/admin/reports-hub" },
        { label: "Inventory", to: "/admin/inventory" },
        { label: "Support Tickets", to: "/admin/support-tickets" }
      ]
    }
  ];

  const superAdminGroups = [
    {
      label: "Navigation",
      hint: "Super Admin Workspace",
      items: [
        { label: "Dashboard", to: "/super-admin/dashboard" },
        { label: "Leads", to: "/super-admin/sales-pipeline" },
        { label: "Salon Management", to: "/super-admin/salons" },
        { label: "Subscription", to: "/super-admin/subscriptions" },
        { label: "Plans", to: "/super-admin/plans" },
        { label: "Product Requests", to: "/super-admin/product-requests" },
        { label: "Staff Requests", to: "/super-admin/staff-requests" },
        { label: "Support", to: "/super-admin/support-tickets" },
        { label: "Finance", to: "/super-admin/finance" },
        { label: "WhatsApp Credits", to: "/super-admin/credits" },
        { label: "Team & Roles", to: "/super-admin/staff" },
        { label: "Platform", to: "/super-admin/settings" }
      ]
    }
  ];

  const visibleGroups = auth?.user?.systemRole === "SUPER_ADMIN"
    ? (() => {
        const adminPerms = auth?.user?.adminRole?.permissions;
        const pagePerms = auth?.user?.pagePermissions;
        
        let perms = null;
        if (Array.isArray(adminPerms) && adminPerms.length > 0) perms = adminPerms;
        else if (Array.isArray(pagePerms) && pagePerms.length > 0) perms = pagePerms;

        if (!perms || perms.length === 0) return superAdminGroups;

        return superAdminGroups.map((group) => ({
          ...group,
          items: group.items.filter((item) => {
            const pageKey = item.to.split("/").pop();
            return perms.includes(pageKey);
          })
        })).filter(group => group.items.length > 0);
      })()
    : [
        ...(shouldShowMyWorkspace && myWorkspaceItems.length
          ? [{
              label: "My Workspace",
              hint: "Personal pages",
              defaultOpen: true,
              items: myWorkspaceItems
            }]
          : []),
        ...(shouldShowMyWorkspace
          ? [{
              label: "Operations",
              hint: "Quick access",
              items: [
                can("reports") && { label: "Financial Reports", to: "/admin/financial-reports" },
                can("support") && { label: "Support Tickets", to: "/admin/support-tickets" },
                can("attendance") && { label: "Attendance", to: "/admin/attendance" },
                can("feedback") && { label: "Feedback", to: "/admin/feedback" },
              ].filter(Boolean)
            }]
          : []),
        ...(isOwner ? groups : [])
      ];

  return (
    <div className={`app-shell ${!sidebarExpanded ? "sidebar-collapsed" : ""} ${!isOwner ? "staff-workspace" : ""}`}>
      <Sidebar
        groups={visibleGroups}
        auth={auth}
        onLogout={logout}
        sidebarExpanded={sidebarExpanded}
        onToggleSidebar={toggleSidebar}
      />
      <div className="app-content-wrapper">
        <Topbar auth={auth} sidebarExpanded={sidebarExpanded} onToggleSidebar={toggleSidebar} onLogout={logout} />
        <main className="app-main">
            <OwnerLayout />
        </main>
      </div>
    </div>
  );
};

const AccessNotice = ({ title, message }) => (
  <div className="page-shell">
    <div className="panel-card">
      <h2>{title}</h2>
      <p className="muted">{message}</p>
    </div>
  </div>
);

import PhoneVerificationModal from "./components/PhoneVerificationModal";

const OwnerRoute = ({ moduleKey, action = "view", featureKey, element }) => {
  const { auth } = useAuth();

  if (!auth) return <Navigate to="/login" replace />;

  if (auth.membership?.salonRole === "SALON_OWNER" && auth.user?.isPhoneVerified === false) {
    return (
      <>
        <PhoneVerificationModal />
        <div style={{ pointerEvents: 'none', filter: 'blur(4px)' }}>
          {element}
        </div>
      </>
    );
  }

  const permissions = auth.membership?.permissions || {};
  const featureFlags = auth.membership?.featureFlags || {};
  const planFlags = auth.membership?.plan?.featureFlags || {};
  const allowed = Array.isArray(permissions[moduleKey]) && permissions[moduleKey].includes(action);
  const enabled = featureKey ? featureFlags[featureKey] !== false : true;
  const isPlanRestricted = featureKey && auth.membership?.plan && planFlags[featureKey] === false;

  if (isPlanRestricted) {
    return <AccessNotice title="Upgrade Required" message="This feature is not included in your current subscription plan. Please upgrade to access this module." />;
  }

  if (!enabled) {
    return <AccessNotice title="Module Disabled" message="This module is currently turned off in business settings." />;
  }

  if (!allowed) {
    return <AccessNotice title="Access Restricted" message="You are logged in, but this module is not assigned to your current role permissions." />;
  }

  return element;
};

const StaffWorkspaceRoute = ({ moduleKey, action = "view", featureKey, element }) => {
  const { auth } = useAuth();

  if (!auth) return <Navigate to="/login" replace />;

  if (auth.membership?.salonRole === "SALON_OWNER") {
    return <AccessNotice title="Staff Workspace Only" message="This area is reserved for staff self-service pages, not the owner workspace." />;
  }

  const permissions = auth.membership?.permissions || {};
  const featureFlags = auth.membership?.featureFlags || {};
  const allowed = Array.isArray(permissions[moduleKey]) && permissions[moduleKey].includes(action);
  const enabled = featureKey ? featureFlags[featureKey] !== false : true;

  if (!enabled) {
    return <AccessNotice title="Module Disabled" message="This module is currently turned off in business settings." />;
  }

  if (!allowed) {
    return <AccessNotice title="Access Restricted" message="You don't have permission to access this page. Contact your salon owner to update your access role." />;
  }

  return element;
};

const SuperAdminRoute = ({ pageKey, element }) => {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (auth.user?.systemRole !== "SUPER_ADMIN") {
    return <AccessNotice title="Super Admin Area" message="You do not have permission to access the SaaS control panel." />;
  }
  const adminPerms = auth.user?.adminRole?.permissions;
  const pagePerms = auth.user?.pagePermissions;
  let perms = null;
  if (Array.isArray(adminPerms) && adminPerms.length > 0) perms = adminPerms;
  else if (Array.isArray(pagePerms) && pagePerms.length > 0) perms = pagePerms;
  if (pageKey && Array.isArray(perms) && perms.length > 0) {
    if (!perms.includes(pageKey)) {
      return <AccessNotice title="Page Access Restricted" message="Your staff account does not have permission to access this page." />;
    }
  }
  return element;
};

const Home = () => {
  const { auth } = useAuth();
  if (auth?.user?.systemRole === "SUPER_ADMIN") {
    return <Navigate to="/super-admin/dashboard" replace />;
  }
  return <OwnerDashboard />;
};

function StorefrontNotFound() {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "2rem" }}>?</div>
      <h1 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "2.5rem", marginBottom: 16 }}>Page Not Found</h1>
      <p style={{ color: "#666", fontSize: "1.1rem", marginBottom: 32 }}>The page you're looking for doesn't exist or has been moved.</p>
      <a href={window.location.pathname.replace(/\/[^/]*$/, "")} className="sf-btn sf-btn-primary" style={{ padding: "14px 32px", textDecoration: "none" }}>Back to Home</a>
    </div>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <>
      <div key={location.pathname} className="route-progress active" aria-hidden="true" />
      <Suspense fallback={<RouteFallback />}>
        <div className="route-stage">
          <Routes location={location}>


        <Route path="/customer/login" element={<CustomerLoginPage />} />
        <Route path="/customer/register" element={<CustomerRegisterPage />} />
        <Route path="/customer" element={<CustomerPortalPage />} />
        <Route path="/customer/home" element={<CustomerPortalPage />} />
        <Route path="/customer/profile" element={<CustomerPortalPage />} />
        <Route path="/customer/bookings" element={<CustomerPortalPage />} />
        <Route path="/customer/appointments" element={<CustomerPortalPage />} />
        <Route path="/customer/appointments/:id" element={<CustomerPortalPage />} />
        <Route path="/customer/invoices" element={<CustomerPortalPage />} />
        <Route path="/customer/invoices/:id" element={<CustomerPortalPage />} />
        <Route path="/customer/packages" element={<CustomerPortalPage />} />
        <Route path="/customer/memberships" element={<CustomerPortalPage />} />
        <Route path="/customer/orders" element={<CustomerPortalPage />} />
        <Route path="/customer/orders/:id" element={<CustomerPortalPage />} />
        <Route path="/customer/coupons" element={<CustomerPortalPage />} />
        <Route path="/customer/notifications" element={<CustomerPortalPage />} />
        
        <Route path="/site/:slug" element={<StorefrontLayout />}>
          <Route index element={<HomePage />} />
          <Route path="home" element={<HomePage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="services" element={<CollectionsPage />} />
          <Route path="category/:categoryId" element={<CategoryDetailPage />} />
          <Route path="product/:id" element={<ProductDetailPage />} />
          <Route path="service/:id" element={<ServiceDetailPage />} />
          <Route path="cart" element={<CheckoutPage />} />
          <Route path="booking-summary" element={<CheckoutPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="booking-confirmation" element={<BookingConfirmationPage />} />
          <Route path="my-bookings" element={<MyBookingsPage />} />
          <Route path="terms" element={<LegalContentPage scope="salon" title="Terms & Conditions" contentKey="termsAndConditions" />} />
          <Route path="privacy" element={<LegalContentPage scope="salon" title="Privacy Policy" contentKey="privacyPolicy" />} />
          <Route path="about" element={<StorefrontAboutPage />} />
          <Route path="contact" element={<StorefrontContactPage />} />
          <Route path="book" element={<Navigate to="collections" replace />} />
          <Route path="*" element={<StorefrontNotFound />} />
        </Route>

        <Route path="/terms" element={<LegalContentPage scope="global" title="Terms & Conditions" contentKey="termsAndConditions" />} />
        <Route path="/terms-and-conditions" element={<LegalContentPage scope="global" title="Terms & Conditions" contentKey="termsAndConditions" />} />
        <Route path="/privacy" element={<PublicPrivacyPolicyPage />} />
        <Route path="/privacy-policy" element={<PublicPrivacyPolicyPage />} />
        <Route path="/contact" element={<MarketingHomePage />} />

        <Route path="/" element={<MarketingHomePage />} />
        <Route path="/features" element={<MarketingHomePage />} />
        <Route path="/pricing" element={<MarketingHomePage />} />
        <Route path="/platform" element={<MarketingHomePage />} />
        <Route path="/book-demo" element={<PublicDemoLeadPage />} />
        <Route path="/demo-checkout/:leadId/:planId" element={<DemoCheckoutPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/setup-password" element={<ResetPasswordPage />} />
        <Route element={<Protected />}>
          <Route path="/app" element={<OwnerRoute moduleKey="dashboard" element={<Home />} />} />
          <Route path="/admin/dashboard" element={<OwnerRoute moduleKey="dashboard" element={<OwnerDashboard />} />} />
          <Route path="/admin/global-dashboard" element={<OwnerRoute moduleKey="dashboard" element={<GlobalDashboardPage />} />} />
          <Route path="/admin/appointments" element={<OwnerRoute moduleKey="appointments" featureKey="appointments" element={<AppointmentsPage />} />} />
          <Route path="/admin/appointments/calendar" element={<OwnerRoute moduleKey="appointments" featureKey="appointments" element={<AppointmentsPage />} />} />
          <Route path="/admin/appointments/create" element={<OwnerRoute moduleKey="appointments" featureKey="appointments" element={<AppointmentsPage />} />} />
          <Route path="/admin/appointments/:id" element={<OwnerRoute moduleKey="appointments" featureKey="appointments" element={<AppointmentDetailPage />} />} />
          <Route path="/admin/appointments/:id/edit" element={<OwnerRoute moduleKey="appointments" featureKey="appointments" element={<AppointmentEditPage />} />} />
          <Route path="/admin/branches" element={<OwnerRoute moduleKey="branches" element={<BranchesPage />} />} />
          <Route path="/admin/services" element={<OwnerRoute moduleKey="services" element={<ServiceCategoriesPage />} />} />
          <Route path="/admin/service-categories" element={<OwnerRoute moduleKey="services" element={<ServiceCategoriesPage />} />} />
          <Route path="/admin/staff-schedule" element={<OwnerRoute moduleKey="staffSchedule" featureKey="appointments" element={<StaffSchedulePage />} />} />
          <Route path="/admin/staff-availability" element={<OwnerRoute moduleKey="staffSchedule" featureKey="appointments" element={<StaffSchedulePage />} />} />
          <Route path="/admin/customers" element={<OwnerRoute moduleKey="customers" element={<CustomersPage />} />} />
          <Route path="/admin/customers/:id" element={<OwnerRoute moduleKey="customers" element={<CustomerHistoryPage />} />} />
          <Route path="/admin/customers/:id/timeline" element={<OwnerRoute moduleKey="customers" element={<CustomerHistoryPage />} />} />
          <Route path="/admin/customers/:id/history" element={<OwnerRoute moduleKey="customers" element={<CustomerHistoryPage />} />} />
          <Route path="/admin/users" element={<OwnerRoute moduleKey="staff" element={<UsersPage />} />} />
          <Route path="/admin/experts" element={<OwnerRoute moduleKey="staff" element={<ExpertsPage />} />} />
          <Route path="/admin/roles-permissions" element={<OwnerRoute moduleKey="staff" element={<StaffRolesPage />} />} />
          <Route path="/admin/pos" element={<OwnerRoute moduleKey="pos" featureKey="pos" element={<PosPage />} />} />
          <Route path="/admin/pos/new" element={<OwnerRoute moduleKey="pos" featureKey="pos" element={<PosPage />} />} />
          <Route path="/admin/pos/day-closing" element={<OwnerRoute moduleKey="payments" featureKey="pos" element={<PosPage />} />} />
          <Route path="/admin/order-dashboard" element={<OwnerRoute moduleKey="orders" featureKey="onlineOrders" element={<EcommerceOrdersPage />} />} />
          <Route path="/admin/order-dashboard/new" element={<OwnerRoute moduleKey="orders" featureKey="onlineOrders" element={<EcommerceOrdersPage />} />} />
          <Route path="/admin/order-dashboard/accepted" element={<OwnerRoute moduleKey="orders" featureKey="onlineOrders" element={<EcommerceOrdersPage />} />} />
          <Route path="/admin/order-dashboard/ready" element={<OwnerRoute moduleKey="orders" featureKey="onlineOrders" element={<EcommerceOrdersPage />} />} />
          <Route path="/admin/order-dashboard/completed" element={<OwnerRoute moduleKey="orders" featureKey="onlineOrders" element={<EcommerceOrdersPage />} />} />
          <Route path="/admin/order-dashboard/cancelled" element={<OwnerRoute moduleKey="orders" featureKey="onlineOrders" element={<EcommerceOrdersPage />} />} />
          <Route path="/admin/order-dashboard/:id" element={<OwnerRoute moduleKey="orders" featureKey="onlineOrders" element={<EcommerceOrdersPage />} />} />
          <Route path="/admin/pos-dashboard" element={<OwnerRoute moduleKey="orders" featureKey="onlineOrders" element={<PosDashboardPage />} />} />
          <Route path="/admin/pos-dashboard/:id" element={<OwnerRoute moduleKey="orders" featureKey="onlineOrders" element={<PosDashboardPage />} />} />
          <Route path="/admin/trends" element={<OwnerRoute moduleKey="reports" featureKey="reports" element={<TrendsPage />} />} />
          <Route path="/admin/salon-analytics" element={<OwnerRoute moduleKey="reports" featureKey="reports" element={<SalonAnalyticsPage />} />} />
          <Route path="/admin/financial-reports" element={<OwnerRoute moduleKey="reports" featureKey="reports" element={<FinancialReportsPage />} />} />
          <Route path="/admin/reports-hub" element={<OwnerRoute moduleKey="reports" featureKey="reports" element={<ReportsHubPage />} />} />
          <Route path="/admin/invoices" element={<OwnerRoute moduleKey="invoices" element={<InvoicesPage />} />} />
          <Route path="/admin/invoices/:id" element={<OwnerRoute moduleKey="invoices" element={<InvoicesPage />} />} />
          <Route path="/admin/payments" element={<OwnerRoute moduleKey="payments" element={<PaymentsPage />} />} />
          <Route path="/admin/product-categories" element={<OwnerRoute moduleKey="inventory" featureKey="inventory" element={<ProductCategoriesPage />} />} />
          <Route path="/admin/inventory" element={<OwnerRoute moduleKey="inventory" featureKey="inventory" element={<InventoryPage />} />} />
          <Route path="/admin/inventory/approval" element={<OwnerRoute moduleKey="inventory" featureKey="inventory" element={<InventoryPage />} />} />
          <Route path="/admin/inventory/reconciliation" element={<OwnerRoute moduleKey="inventory" featureKey="inventory" element={<InventoryPage />} />} />
          <Route path="/admin/inventory/products/create" element={<OwnerRoute moduleKey="inventory" featureKey="inventory" element={<InventoryPage />} />} />
          <Route path="/admin/inventory/products" element={<OwnerRoute moduleKey="inventory" featureKey="inventory" element={<InventoryPage />} />} />
          <Route path="/admin/inventory/products/:id/edit" element={<OwnerRoute moduleKey="inventory" featureKey="inventory" element={<InventoryPage />} />} />
          <Route path="/admin/inventory/categories" element={<OwnerRoute moduleKey="inventory" featureKey="inventory" element={<InventoryPage />} />} />
          <Route path="/admin/inventory/stock-movements" element={<OwnerRoute moduleKey="inventory" featureKey="inventory" element={<InventoryPage />} />} />
          <Route path="/admin/inventory/low-stock" element={<OwnerRoute moduleKey="inventory" featureKey="inventory" element={<InventoryPage />} />} />
          <Route path="/admin/purchases/vendors" element={<OwnerRoute moduleKey="purchases" featureKey="inventory" element={<InventoryPage />} />} />
          <Route path="/admin/purchases/orders/create" element={<OwnerRoute moduleKey="purchases" featureKey="inventory" element={<InventoryPage />} />} />
          <Route path="/admin/purchases/orders" element={<OwnerRoute moduleKey="purchases" featureKey="inventory" element={<InventoryPage />} />} />
          <Route path="/admin/purchases/transfers" element={<OwnerRoute moduleKey="purchases" featureKey="inventory" element={<InventoryPage />} />} />
          <Route path="/admin/purchases/reconciliation" element={<OwnerRoute moduleKey="purchases" featureKey="inventory" element={<InventoryPage />} />} />
          <Route path="/admin/memberships" element={<OwnerRoute moduleKey="memberships" element={<MembershipsPage />} />} />
          <Route path="/admin/packages" element={<OwnerRoute moduleKey="packages" element={<MembershipsPage />} />} />
          <Route path="/admin/customers/:id/memberships" element={<OwnerRoute moduleKey="memberships" element={<MembershipsPage />} />} />
          <Route path="/admin/customers/:id/packages" element={<OwnerRoute moduleKey="packages" element={<MembershipsPage />} />} />
          <Route path="/admin/coupons" element={<OwnerRoute moduleKey="couponsGiftCards" featureKey="couponsGiftCards" element={<CouponsPage />} />} />
          <Route path="/admin/coupons/reports" element={<OwnerRoute moduleKey="couponsGiftCards" featureKey="couponsGiftCards" element={<CouponsPage />} />} />
          <Route path="/admin/gift-cards" element={<OwnerRoute moduleKey="couponsGiftCards" featureKey="couponsGiftCards" element={<CouponsPage />} />} />
          <Route path="/admin/referral-coupons" element={<OwnerRoute moduleKey="couponsGiftCards" featureKey="couponsGiftCards" element={<ReferralProgramPage />} />} />
          <Route path="/admin/feedback" element={<OwnerRoute moduleKey="feedback" featureKey="feedback" element={<FeedbackPage />} />} />
          <Route path="/admin/feedback/reports" element={<OwnerRoute moduleKey="feedback" featureKey="feedback" element={<FeedbackPage />} />} />
          <Route path="/admin/feedback/settings" element={<OwnerRoute moduleKey="feedback" featureKey="feedback" element={<FeedbackPage />} />} />
          <Route path="/admin/enquiries" element={<OwnerRoute moduleKey="enquiries" featureKey="enquiries" element={<EnquiriesPage />} />} />
          <Route path="/admin/enquiries/follow-ups" element={<OwnerRoute moduleKey="enquiries" featureKey="enquiries" element={<EnquiriesPage />} />} />
          <Route path="/admin/enquiries/reports" element={<OwnerRoute moduleKey="enquiries" featureKey="enquiries" element={<EnquiriesPage />} />} />
          <Route path="/admin/whatsapp-credits" element={<WhatsAppCreditsPage />} />
          <Route path="/admin/expenses" element={<OwnerRoute moduleKey="expenses" featureKey="expenses" element={<ExpensesPage />} />} />
          <Route path="/admin/expenses/dashboard" element={<OwnerRoute moduleKey="expenses" featureKey="expenses" element={<ExpensesPage />} />} />
          <Route path="/admin/expenses/types" element={<OwnerRoute moduleKey="expenses" featureKey="expenses" element={<ExpensesPage />} />} />
          <Route path="/admin/expenses/accounts" element={<OwnerRoute moduleKey="expenses" featureKey="expenses" element={<ExpensesPage />} />} />
          <Route path="/admin/expenses/categories" element={<OwnerRoute moduleKey="expenses" featureKey="expenses" element={<ExpensesPage />} />} />
          <Route path="/admin/expenses/reports" element={<OwnerRoute moduleKey="expenses" featureKey="expenses" element={<ExpensesPage />} />} />
          <Route path="/admin/attendance" element={<OwnerRoute moduleKey="attendance" featureKey="attendance" element={<AttendanceManagementPage />} />} />
          <Route path="/admin/notifications" element={<OwnerRoute moduleKey="notifications" featureKey="notifications" element={<NotificationsPage />} />} />
          <Route path="/admin/audit-logs" element={<OwnerRoute moduleKey="auditLogs" featureKey="auditLogs" element={<OwnerAuditLogsPage />} />} />

          <Route path="/admin/reports" element={<OwnerRoute moduleKey="reports" featureKey="reports" element={<ReportsHubPage />} />} />
          <Route path="/admin/reports/appointments" element={<OwnerRoute moduleKey="reports" featureKey="reports" element={<ReportsPage />} />} />
          <Route path="/admin/reports/staff-performance" element={<OwnerRoute moduleKey="reports" featureKey="reports" element={<ReportsPage />} />} />
          <Route path="/admin/reports/product-sales" element={<OwnerRoute moduleKey="reports" featureKey="reports" element={<ReportsPage />} />} />
          <Route path="/admin/reports/service-sales" element={<OwnerRoute moduleKey="reports" featureKey="reports" element={<ReportsPage />} />} />
          <Route path="/admin/reports/memberships" element={<OwnerRoute moduleKey="reports" featureKey="reports" element={<ReportsPage />} />} />
          <Route path="/admin/reports/packages" element={<OwnerRoute moduleKey="reports" featureKey="reports" element={<ReportsPage />} />} />
          <Route path="/admin/reports/stock" element={<OwnerRoute moduleKey="reports" featureKey="reports" element={<ReportsPage />} />} />
          <Route path="/admin/reports/low-stock" element={<OwnerRoute moduleKey="reports" featureKey="reports" element={<ReportsPage />} />} />
          <Route path="/admin/reports/customers" element={<OwnerRoute moduleKey="reports" featureKey="reports" element={<ReportsPage />} />} />
          <Route path="/admin/reports/branch-sales" element={<OwnerRoute moduleKey="reports" featureKey="reports" element={<ReportsPage />} />} />
          <Route path="/admin/reports/payments" element={<OwnerRoute moduleKey="reports" featureKey="reports" element={<ReportsPage />} />} />
          <Route path="/admin/reports/cancelled-invoices" element={<OwnerRoute moduleKey="reports" featureKey="reports" element={<ReportsPage />} />} />
          <Route path="/admin/reports/gift-cards" element={<OwnerRoute moduleKey="reports" featureKey="reports" element={<ReportsPage />} />} />
          <Route path="/admin/reports/coupons" element={<OwnerRoute moduleKey="reports" featureKey="reports" element={<ReportsPage />} />} />
          <Route path="/admin/reports/campaigns" element={<OwnerRoute moduleKey="reports" featureKey="reports" element={<ReportsPage />} />} />
          <Route path="/admin/reports/feedback" element={<OwnerRoute moduleKey="reports" featureKey="reports" element={<ReportsPage />} />} />
          <Route path="/admin/reports/enquiries" element={<OwnerRoute moduleKey="reports" featureKey="reports" element={<ReportsPage />} />} />
          <Route path="/admin/reports/expenses" element={<OwnerRoute moduleKey="reports" featureKey="reports" element={<ReportsPage />} />} />
          <Route path="/admin/reports/profit-loss" element={<OwnerRoute moduleKey="reports" featureKey="reports" element={<ReportsPage />} />} />
          <Route path="/admin/reports/tax" element={<OwnerRoute moduleKey="reports" featureKey="reports" element={<ReportsPage />} />} />
          <Route path="/admin/reports/salon-analytics" element={<OwnerRoute moduleKey="reports" featureKey="reports" element={<ReportsPage />} />} />
          <Route path="/admin/reports/financial-reports" element={<OwnerRoute moduleKey="reports" featureKey="reports" element={<ReportsPage />} />} />

          <Route path="/admin/orders" element={<OwnerRoute moduleKey="orders" featureKey="onlineOrders" element={<OrdersPage />} />} />
          <Route path="/admin/orders/new" element={<OwnerRoute moduleKey="orders" featureKey="onlineOrders" element={<OrdersPage />} />} />
          <Route path="/admin/orders/accepted" element={<OwnerRoute moduleKey="orders" featureKey="onlineOrders" element={<OrdersPage />} />} />
          <Route path="/admin/orders/ready" element={<OwnerRoute moduleKey="orders" featureKey="onlineOrders" element={<OrdersPage />} />} />
          <Route path="/admin/orders/completed" element={<OwnerRoute moduleKey="orders" featureKey="onlineOrders" element={<OrdersPage />} />} />
          <Route path="/admin/orders/cancelled" element={<OwnerRoute moduleKey="orders" featureKey="onlineOrders" element={<OrdersPage />} />} />
          <Route path="/admin/orders/:id" element={<OwnerRoute moduleKey="orders" featureKey="onlineOrders" element={<OrdersPage />} />} />
          <Route path="/admin/campaigns" element={<OwnerRoute moduleKey="campaigns" featureKey="campaigns" element={<CampaignsPage />} />} />
          <Route path="/admin/campaigns/create" element={<OwnerRoute moduleKey="campaigns" featureKey="campaigns" element={<CampaignsPage />} />} />
          <Route path="/admin/campaigns/:id" element={<OwnerRoute moduleKey="campaigns" featureKey="campaigns" element={<CampaignsPage />} />} />
          <Route path="/admin/campaigns/:id/edit" element={<OwnerRoute moduleKey="campaigns" featureKey="campaigns" element={<CampaignsPage />} />} />
          <Route path="/admin/campaigns/:id/logs" element={<OwnerRoute moduleKey="campaigns" featureKey="campaigns" element={<CampaignsPage />} />} />
          <Route path="/admin/campaign-templates" element={<OwnerRoute moduleKey="campaignTemplates" featureKey="campaignTemplates" element={<CampaignTemplatesPage />} />} />
          <Route path="/admin/campaign-templates/create" element={<OwnerRoute moduleKey="campaignTemplates" featureKey="campaignTemplates" element={<CampaignTemplatesPage />} />} />
          <Route path="/admin/campaign-templates/:id/edit" element={<OwnerRoute moduleKey="campaignTemplates" featureKey="campaignTemplates" element={<CampaignTemplatesPage />} />} />
          <Route path="/admin/message-templates" element={<OwnerRoute moduleKey="messageTemplates" featureKey="messageTemplates" element={<MessageTemplatesPage />} />} />
          <Route path="/admin/message-templates/:type" element={<OwnerRoute moduleKey="messageTemplates" featureKey="messageTemplates" element={<MessageTemplatesPage />} />} />
          <Route path="/admin/message-templates/:type/edit" element={<OwnerRoute moduleKey="messageTemplates" featureKey="messageTemplates" element={<MessageTemplatesPage />} />} />
          <Route path="/admin/customer-portal-settings" element={<OwnerRoute moduleKey="customerPortalSettings" featureKey="customerPortal" element={<CustomerPortalSettingsPage />} />} />
          <Route path="/admin/support-tickets" element={<OwnerRoute moduleKey="support" element={<SupportTicketsPage />} />} />
          <Route path="/admin/settings" element={<OwnerRoute moduleKey="settings" action="edit" element={<Navigate to="/admin/settings/generic" replace />} />} />
          <Route path="/admin/settings/:section" element={<OwnerRoute moduleKey="settings" action="edit" element={<SettingsPage />} />} />
          <Route path="/admin/website-editor" element={<OwnerRoute moduleKey="settings" action="edit" element={<WebsiteEditorPage />} />} />
          <Route path="/admin/website-analytics" element={<OwnerRoute moduleKey="reports" action="view" element={<WebsiteAnalyticsPage />} />} />
          <Route path="/admin/manage" element={<OwnerRoute moduleKey="settings" action="edit" element={<ManagePage />} />} />
          <Route path="/admin/product-requirements" element={<OwnerRoute moduleKey="inventory" element={<ProductsRequirementPage />} />} />
          <Route path="/admin/staff-requirements" element={<OwnerRoute moduleKey="staff" element={<StaffRequirementsPage />} />} />
          <Route path="/admin/salon-details" element={<OwnerRoute moduleKey="settings" action="view" element={<SalonDetailsPage />} />} />
          <Route path="/admin/my-dashboard" element={<StaffWorkspaceRoute moduleKey="myDashboard" element={<MyDashboardPage />} />} />
          <Route path="/admin/my-attendance" element={<StaffWorkspaceRoute moduleKey="myAttendance" featureKey="attendance" element={<MyAttendanceHistoryPage />} />} />
          <Route path="/admin/my-appointments" element={<StaffWorkspaceRoute moduleKey="myAppointments" featureKey="appointments" element={<MyAppointmentsPage />} />} />
          <Route path="/admin/my-schedule" element={<StaffWorkspaceRoute moduleKey="mySchedule" featureKey="appointments" element={<MySchedulePage />} />} />
          <Route path="/admin/my-profile" element={<StaffWorkspaceRoute moduleKey="myProfile" element={<MyProfilePage />} />} />

          <Route path="/super-admin/dashboard" element={<SuperAdminRoute pageKey="dashboard" element={<SuperAdminDashboard />} />} />
          <Route path="/super-admin/salons" element={<SuperAdminRoute pageKey="salons" element={<SuperAdminSalonsPage />} />} />
          <Route path="/super-admin/salons/:id" element={<SuperAdminRoute pageKey="salons" element={<SuperAdminSalon360ProfilePage />} />} />
          <Route path="/super-admin/sales-pipeline" element={<SuperAdminRoute pageKey="sales-pipeline" element={<SuperAdminDemoLeadsPage />} />} />
          <Route path="/super-admin/subscriptions" element={<SuperAdminRoute pageKey="subscriptions" element={<SuperAdminSubscriptionsPage />} />} />
          <Route path="/super-admin/plans" element={<SuperAdminRoute pageKey="plans" element={<SuperAdminPlansPage />} />} />
          
          <Route path="/super-admin/product-requests" element={<SuperAdminRoute pageKey="product-requests" element={<SuperAdminProductsRequirementPage />} />} />
          <Route path="/super-admin/staff-requests" element={<SuperAdminRoute pageKey="staff-requests" element={<SuperAdminStaffRequirementsPage />} />} />
          <Route path="/super-admin/support-tickets" element={<SuperAdminRoute pageKey="support-tickets" element={<SuperAdminSupportTicketsPage />} />} />
          <Route path="/super-admin/finance" element={<SuperAdminRoute pageKey="finance" element={<SuperAdminFinancialReportsPage />} />} />
          <Route path="/super-admin/staff" element={<SuperAdminRoute pageKey="staff" element={<SuperAdminStaffPage />} />} />
          <Route path="/super-admin/credits" element={<SuperAdminRoute pageKey="credits" element={<ManageCreditsPage />} />} />
          <Route path="/super-admin/settings" element={<SuperAdminRoute pageKey="settings" element={<SuperAdminSettingsPage />} />} />
          <Route path="/super-admin/audit-logs" element={<SuperAdminRoute pageKey="audit-logs" element={<SuperAdminAuditLogsPage />} />} />
          <Route path="/branches" element={<Navigate to="/admin/branches" replace />} />
          <Route path="/services" element={<Navigate to="/admin/services" replace />} />
          <Route path="/customers" element={<Navigate to="/admin/customers" replace />} />
          <Route path="/roles" element={<Navigate to="/admin/roles-permissions" replace />} />
          <Route path="/invoices" element={<Navigate to="/admin/pos-dashboard" replace />} />
          <Route path="/admin/sales" element={<Navigate to="/admin/pos" replace />} />
          <Route path="/reports" element={<Navigate to="/admin/reports" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
        </div>
      </Suspense>
    </>
  );
}
