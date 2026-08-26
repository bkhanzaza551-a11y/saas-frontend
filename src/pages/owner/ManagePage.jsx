import { Link } from "react-router-dom";
import { Layers3, Scissors, Users, CalendarDays, Boxes, BadgeCheck, Sparkles, CreditCard, NotebookPen, Globe, Megaphone, Smartphone, Store, MessagesSquare, Settings, UserCheck, Banknote, PhoneCall } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const CATEGORIES = [
  {
    title: "Catalogue",
    items: [
      { title: "Services", description: "Add, edit, and update the services you offer.", to: "/admin/services", icon: Scissors, reqPerm: "services" },
      { title: "Memberships / Packages", description: "Create and manage service bundles.", to: "/admin/memberships", icon: BadgeCheck, reqPerm: "memberships" },
      { title: "Loyalty / Coupons", description: "Offers, gift cards, referral programs.", to: "/admin/coupons", icon: Sparkles, reqPerm: "couponsGiftCards" }
    ]
  },
  {
    title: "Inventory & Finance",
    items: [
      { title: "Manage Inventory", description: "Manage overall stock and warehouses.", to: "/admin/inventory", icon: Boxes, reqPerm: "inventory", reqFlag: "inventory" },
      { title: "Products", description: "Keep track of your products and stock.", to: "/admin/product-categories", icon: Boxes, reqPerm: "inventory", reqFlag: "inventory" },
      { title: "Online Bookings", description: "Manage online service appointments and storefront reservations.", to: "/admin/order-dashboard", icon: CalendarDays, reqPerm: "orders", reqFlag: "ecommerce" },
      { title: "Manage Expenses", description: "Track outflow, accounts, and expense types.", to: "/admin/expenses/dashboard", icon: Banknote, reqPerm: "expenses", reqFlag: "expenses" },
      { title: "Product Requirements", description: "Submit requests for stock, electronics, or software.", to: "/admin/product-requirements", icon: Boxes, reqPerm: "inventory" }
    ]
  },
  {
    title: "Staff & Operations",
    items: [
      { title: "Branches", description: "Manage locations, outlets, and salon operational identity.", to: "/admin/branches", icon: Layers3, reqPerm: "branches" },
      { title: "Staff Details", description: "Register team members and configure access.", to: "/admin/users", icon: Users, reqPerm: "staff" },
      { title: "Roles & Permissions", description: "Manage organizational roles and permissions.", to: "/admin/roles-permissions", icon: UserCheck, reqPerm: "staff" },
      { title: "Staff Requests", description: "Submit hiring requisitions and requests.", to: "/admin/staff-requirements", icon: Users, reqPerm: "staff" }
    ]
  },
  {
    title: "Digital & Marketing",
    items: [
      { title: "Website Editor", description: "Design homepage text, sections, themes, and banners.", to: "/admin/website-editor", icon: NotebookPen, reqPerm: "settings" },
      { title: "Manage Enquiries", description: "Track and convert leads into customers.", to: "/admin/enquiries", icon: PhoneCall, reqPerm: "enquiries", reqFlag: "enquiries" },
      { title: "Messaging & SMS Credits", description: "Purchase and manage credits for WhatsApp & SMS notifications.", to: "/admin/whatsapp-credits", icon: MessagesSquare, reqFlag: "whatsapp" }
    ]
  }
];

export default function ManagePage() {
  const { auth } = useAuth();
  
  const perms = auth?.membership?.permissions || {};
  const flags = auth?.membership?.featureFlags || {};
  
  const can = (key) => !key || (Array.isArray(perms[key]) && perms[key].includes("view")) || (Array.isArray(perms[key]) && perms[key].includes("edit")) || perms[key] !== undefined; // simplified for manage page items
  const enabled = (key) => !key || flags[key] !== false;

  return (
    <div className="page-shell" style={{ backgroundColor: "#f8fafc", minHeight: "100vh", padding: "20px 16px" }}>
      <style>{`
        .manage-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 6px;
        }
        .manage-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
          gap: 16px;
        }
        @media (max-width: 640px) {
          .manage-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 4px !important;
            margin-bottom: 20px !important;
          }
          .manage-header h1 {
            font-size: 1.4rem !important;
          }
          .manage-header p {
            font-size: 0.85rem !important;
          }
        }
      `}</style>
      <div className="manage-header">
        <div>
          <h1 style={{ fontSize: "1.7rem", fontWeight: "700", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <Settings size={26} color="#4f46e5" />
            Manage Workspace
          </h1>
          <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: "0.9rem" }}>Configure and monitor your entire salon</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        {CATEGORIES.map((category) => {
          const visibleItems = category.items.filter(item => can(item.reqPerm) && enabled(item.reqFlag));
          if (visibleItems.length === 0) return null;
          
          return (
            <section key={category.title}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#334155", marginBottom: "14px", paddingBottom: "6px", borderBottom: "1px solid #e2e8f0" }}>
                {category.title}
              </h2>
              <div className="manage-grid">
              {visibleItems.map((card) => {
                const Icon = card.icon;
                return (
                  <Link 
                    key={card.to} 
                    to={card.to} 
                    style={{
                      textDecoration: "none", 
                      color: "inherit",
                      background: "#ffffff",
                      borderRadius: "14px",
                      padding: "20px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.04)",
                      border: "1px solid #f1f5f9",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 8px 24px rgba(79, 70, 229, 0.1)";
                      e.currentTarget.style.borderColor = "#e0e7ff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.04)";
                      e.currentTarget.style.borderColor = "#f1f5f9";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ 
                        background: "#eef2ff", 
                        padding: "9px", 
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        <Icon size={20} color="#4f46e5" />
                      </div>
                      <strong style={{ fontSize: "1.05rem", color: "#1e293b", fontWeight: "700" }}>
                        {card.title}
                      </strong>
                    </div>
                    <div style={{ color: "#64748b", fontSize: "0.85rem", lineHeight: "1.5" }}>
                      {card.description}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
          );
        })}
      </div>
    </div>
  );
}
