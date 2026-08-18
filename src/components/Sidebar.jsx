import { useEffect, useMemo, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Zap,
  Settings,
  DollarSign,
  MessageSquare,
  Wrench,
  LayoutDashboard,
  User,
  Home,
  FolderOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  Globe,
  CreditCard,
  Building2,
  Calendar,
  Users,
  Activity,
  FileText,
  UserCheck,
  Package,
  LifeBuoy,
  TrendingUp,
  Sparkles,
  Clock,
  CheckSquare,
  ShoppingBag,
  Award,
  Gift
} from "lucide-react";
import { api } from "../api/client";

const GROUP_ICONS = {
  "My Workspace":     <User size={17} />,
  "Operations":       <Zap size={17} />,
  "Setup":            <Settings size={17} />,
  "Expenses":         <DollarSign size={17} />,
  "Enquiries":        <MessageSquare size={17} />,
  "System":           <Wrench size={17} />,
  "Workspace":        <Home size={17} />,
  "Settings":         <Settings size={17} />,
  "Manage":           <FolderOpen size={17} />,
  "Website":          <Globe size={17} />,
  "Platform Command": <Home size={17} />,
};

const DEFAULT_ICON = <LayoutDashboard size={17} />;

const getItemIcon = (label, path) => {
  const l = (label || "").toLowerCase();
  const p = (path || "").toLowerCase();
  if (l.includes("dashboard") || l.includes("home")) return <LayoutDashboard size={18} />;
  if (l.includes("salon") || l.includes("branch")) return <Building2 size={18} />;
  if (l.includes("sale") || l.includes("pos")) return <CreditCard size={18} />;
  if (l.includes("appointment")) return <Calendar size={18} />;
  if (l.includes("schedule") || l.includes("availability")) return <Clock size={18} />;
  if (l.includes("attendance")) return <CheckSquare size={18} />;
  if (l.includes("commission") || l.includes("payroll") || l.includes("expense") || l.includes("account") || l.includes("payment")) return <DollarSign size={18} />;
  if (l.includes("customer") || l.includes("crm") || l.includes("profile")) return <Users size={18} />;
  if (l.includes("order") || l.includes("shopping")) return <ShoppingBag size={18} />;
  if (l.includes("staff requirement")) return <UserCheck size={18} />;
  if (l.includes("product requirement")) return <Package size={18} />;
  if (l.includes("staff") || l.includes("user") || l.includes("role")) return <UserCheck size={18} />;
  if (l.includes("analytics") || l.includes("global dashboard")) return <Activity size={18} />;
  if (l.includes("report") || l.includes("financial")) return <FileText size={18} />;
  if (l.includes("support") || l.includes("ticket")) return <LifeBuoy size={18} />;
  if (l.includes("message") || l.includes("enquir") || l.includes("whatsapp") || l.includes("notification")) return <MessageSquare size={18} />;
  if (l.includes("package") || l.includes("membership")) return <Award size={18} />;
  if (l.includes("loyalty") || l.includes("coupon") || l.includes("gift")) return <Gift size={18} />;
  if (l.includes("setting") || l.includes("setup")) return <Settings size={18} />;
  if (l.includes("trend") || l.includes("traffic")) return <TrendingUp size={18} />;
  if (l.includes("inventory") || l.includes("product") || l.includes("catalog")) return <Package size={18} />;
  if (l.includes("service")) return <Sparkles size={18} />;
  if (l.includes("website") || l.includes("portal") || l.includes("site") || l.includes("editor")) return <Globe size={18} />;
  return <FolderOpen size={18} />;
};

const isGroupActive = (group, pathname) =>
  (group.items || []).some(
    (item) =>
      pathname.startsWith(item.to) ||
      (item.children || []).some((child) => pathname.startsWith(child.to))
  );

export default function Sidebar({ groups, auth, onLogout, sidebarExpanded = true, onToggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const defaultOpen = useMemo(() => {
    const next = {};
    for (const group of groups) {
      next[group.label] = Boolean(group.defaultOpen) || isGroupActive(group, location.pathname);
    }
    return next;
  }, [groups, location.pathname]);

  const [openGroups, setOpenGroups] = useState(defaultOpen);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [subscription, setSubscription] = useState(null);

  const isSuperAdmin = auth?.user?.systemRole === "SUPER_ADMIN";

  const closeMobile = () => setMobileOpen(false);
  const closeWorkspace = () => {
    if (mobileOpen) setMobileOpen(false);
    if (sidebarExpanded && onToggleSidebar) onToggleSidebar();
  };

  useEffect(() => {
    setOpenGroups((current) => ({ ...current, ...defaultOpen }));
  }, [defaultOpen]);

  useEffect(() => {
    if (isSuperAdmin) return;
    api.get("/owner/subscription").then((res) => setSubscription(res.data)).catch(() => {});
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!mobileOpen && !sidebarExpanded) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        if (mobileOpen) setMobileOpen(false);
        if (sidebarExpanded && onToggleSidebar) onToggleSidebar();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, sidebarExpanded, onToggleSidebar]);

  // Flatten all navigation items for Mini Rail Mode
  const allNavItems = useMemo(() => {
    const items = [];
    for (const group of groups) {
      if (group.items) {
        for (const item of group.items) {
          items.push(item);
        }
      }
    }
    return items;
  }, [groups]);

  // Desktop mini rail condition
  const isMiniRail = !sidebarExpanded && !mobileOpen;

  return (
    <>
      {/* Mobile Toggle Bar */}
      <div className="sidebar-mobile-toggle-shell">
        <button
          type="button"
          className={`sidebar-mobile-toggle ${mobileOpen ? "active" : ""}`}
          onClick={() => setMobileOpen((c) => !c)}
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation"
        >
          <span /><span /><span />
        </button>
        <div className="sidebar-mobile-brand">
              <img src="/logo.jfif" alt="Logo" className="mini-rail-logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }} />
        </div>
      </div>

      {/* Overlay */}
      <div
        className={`surface-overlay ${mobileOpen ? "active" : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden={!mobileOpen}
      />

      {/* Sidebar Panel */}
      <aside className={`app-sidebar ${sidebarExpanded || mobileOpen ? "open" : "mini-rail"}`}>
        {isMiniRail ? (
          /* Dedicated Mini Rail Mode */
          <div className="mini-rail-container">
            {/* Vertical Stacked Icon Rail */}
            <div className="mini-rail-items">
              {allNavItems.map((item) => {
                const itemIcon = getItemIcon(item.label, item.to);
                const isActive = location.pathname === item.to || (item.to !== "/super-admin/dashboard" && item.to !== "/admin/dashboard" && location.pathname.startsWith(item.to));
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    target={item.target}
                    className={`mini-rail-link ${isActive ? "active" : ""}`}
                  >
                    <span className="mini-rail-icon">{itemIcon}</span>
                    <span className="mini-rail-tooltip">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            {/* Logout Icon */}
            <div className="mini-rail-footer">
              <button
                type="button"
                onClick={onLogout}
                className="mini-rail-link logout"
              >
                <LogOut size={18} />
                <span className="mini-rail-tooltip">Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* Full Expanded Sidebar Mode */
          <div className="sidebar-expanded-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {/* Mobile Close Button */}
            {mobileOpen && (
              <button
                onClick={() => setMobileOpen(false)}
                style={{
                  position: 'absolute',
                  top: 24,
                  right: 24,
                  background: 'transparent',
                  border: 'none',
                  color: '#475569',
                  cursor: 'pointer',
                  zIndex: 50
                }}
              >
                <X size={24} />
              </button>
            )}

            {/* Brand Row */}
            <div className="sidebar-brand-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Link to={isSuperAdmin ? "/super-admin/dashboard" : "/admin/dashboard"} className="sidebar-brand-inner" style={{ textDecoration: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "flex-start", paddingLeft: "4px" }}>
                <img src="/logo.jfif" alt="Salon Logo" style={{ maxHeight: "42px", maxWidth: "160px", objectFit: "contain" }} />
              </Link>
              {mobileOpen && (
                <button type="button" onClick={closeMobile} style={{ background: "transparent", border: "none", color: "#64748b", padding: "8px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                  <X size={24} />
                </button>
              )}
            </div>

            {/* Nav Groups */}
            <nav className="sidebar-nav">
              {groups.map((group) => {
                const active = isGroupActive(group, location.pathname);
                const expanded = openGroups[group.label] ?? active;
                const groupIcon = GROUP_ICONS[group.label] || DEFAULT_ICON;

                const showHeader = !group.hideHeader && group.label !== "Navigation" && groups.length > 1;

                return (
                  <div key={group.label} className="sidebar-group">
                    {showHeader && (
                      group.to ? (
                        <NavLink
                          to={group.to}
                          className={({ isActive }) => `sidebar-group-toggle sidebar-direct-link ${isActive ? "active" : ""}`}
                          style={{ textDecoration: "none", display: "flex", alignItems: "center" }}
                        >
                          <span className="sidebar-group-label">
                            <span className="sidebar-group-icon">{groupIcon}</span>
                            <span className="sidebar-group-text">
                              <strong>{group.label}</strong>
                            </span>
                          </span>
                        </NavLink>
                      ) : (
                        <button
                          type="button"
                          className={`sidebar-group-toggle ${active ? "active" : ""}`}
                          onClick={() =>
                            setOpenGroups((c) => {
                              const isCurrentlyOpen = c[group.label];
                              const next = {};
                              for (const g of groups) next[g.label] = false;
                              if (!isCurrentlyOpen) next[group.label] = true;
                              return next;
                            })
                          }
                        >
                          <span className="sidebar-group-label">
                            <span className="sidebar-group-icon">{groupIcon}</span>
                            <span className="sidebar-group-text">
                              <strong>{group.label}</strong>
                            </span>
                          </span>
                          <span
                            className="sidebar-chevron"
                            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
                          >
                            <ChevronDown size={14} />
                          </span>
                        </button>
                      )
                    )}

                    {(expanded || !showHeader) && (
                      <div className="sidebar-group-items">
                        {(group.items || []).map((item) => {
                          const itemIcon = getItemIcon(item.label, item.to);
                          return (
                            <div key={item.to} className="sidebar-item-block">
                              <NavLink
                                to={item.to}
                                target={item.target}
                                end={!item.children?.length}
                                onClick={closeMobile}
                                className={({ isActive }) =>
                                  `sidebar-link ${isActive || location.pathname === item.to ? "active" : ""}`
                                }
                              >
                                <span className="sidebar-link-content">
                                  <span className="sidebar-item-icon">{itemIcon}</span>
                                  <span>{item.label}</span>
                                </span>
                                {item.badge && (
                                  <span className="sidebar-link-badge">{item.badge}</span>
                                )}
                              </NavLink>

                              {item.children?.length ? (
                                <div className="sidebar-submenu">
                                  {item.children.map((child) => (
                                    <NavLink
                                      key={child.to}
                                      to={child.to}
                                      onClick={closeMobile}
                                      className={({ isActive }) =>
                                        `sidebar-sublink ${isActive || location.pathname.startsWith(child.to) ? "active" : ""}`
                                      }
                                    >
                                      <span className="sidebar-sublink-dot" />
                                      {child.label}
                                    </NavLink>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
              <button type="button" onClick={onLogout} className="sidebar-logout-btn">
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
