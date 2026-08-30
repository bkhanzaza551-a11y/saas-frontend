import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../../api/client";
import PublicMobileMenu from "../../components/PublicMobileMenu";
import {
  LayoutDashboard, Calendar, Users, CreditCard, BarChart3, Package, Settings, Shield,
  Store, ShoppingCart, FileText, UserCheck, Gift, MessageSquare, Megaphone, Star,
  Clock, MapPin, Bell, HeadphonesIcon, Globe, Repeat, Wallet, TrendingUp,
  ClipboardList, Tags, PieChart, Truck, Check, Mail, Phone, Briefcase,
  ChevronDown, ChevronRight, Sparkles, CheckCircle2, ArrowRight, Zap, Award,
  Sliders, ShieldCheck, Smartphone, Flame, HeartHandshake, Scissors, Gem, Crown,
  Activity, Palette, Heart, Receipt, Building2, Send, HelpCircle
} from "lucide-react";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "Contact", to: "/contact" }
];

const salonImages = {
  hero: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&h=900&fit=crop&crop=center",
  styling: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=900&auto=format&fit=crop&q=80",
  spa: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=900&auto=format&fit=crop&q=80",
  beauty: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&auto=format&fit=crop&q=80",
  interior: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=900&auto=format&fit=crop&q=80",
  cta: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=500&fit=crop&crop=center",
  team: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop"
};

const stats = [
  { value: "50,000+", label: "Bookings Handled", sub: "Across all active salons" },
  { value: "₹12.5 Cr+", label: "Invoices Processed", sub: "100% Tax & GST Compliant" },
  { value: "180+", label: "Active Stylists", sub: "Daily shift rosters managed" },
  { value: "99.98%", label: "Cloud Uptime", sub: "High-availability servers" }
];

const interactiveModules = [
  {
    id: "pos",
    name: "POS & Invoicing",
    icon: CreditCard,
    badge: "Lightning Fast",
    headline: "Point-of-Sale built for rush-hour checkout",
    desc: "Generate professional tax invoices in under 5 seconds. Support multi-mode split payments, automatic coupon validation, loyalty point redemption, and instant digital PDF receipts on WhatsApp.",
    bullets: [
      "Cash, Card, UPI & Split Payment modes",
      "Dynamic GST & automated discount calculations",
      "Instant WhatsApp & thermal print receipts",
      "Zero calculation discrepancies with backend verification"
    ],
    image: "https://images.unsplash.com/photo-1556742049-0a67e557b683?w=800&h=500&fit=crop"
  },
  {
    id: "appointments",
    name: "Appointments & Slots",
    icon: Calendar,
    badge: "Zero Conflicts",
    headline: "Smart calendar scheduling with real-time stylist availability",
    desc: "Prevent embarrassing double-bookings. Manage stylist shifts, chair capacities, walk-in queues, and online booking requests seamlessly in real-time.",
    bullets: [
      "Interactive Day, Week, and Month calendar views",
      "Automatic collision prevention & stylist shift mapping",
      "Instant SMS & WhatsApp booking confirmations",
      "Client reschedule & cancellation self-service portal"
    ],
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=500&fit=crop"
  },
  {
    id: "storefront",
    name: "Digital Storefront",
    icon: Store,
    badge: "E-Commerce Ready",
    headline: "Your salon's branded website and online product shop",
    desc: "Get a stunning luxury storefront ready out of the box. Showcase your services catalog, retail haircare products, take online bookings, and collect upfront payments.",
    bullets: [
      "Custom brand colors, logo, hero banners & typography",
      "Online appointment checkout with Razorpay integration",
      "Digital retail product cart & order fulfillment tracker",
      "100% Mobile responsive luxury guest experience"
    ],
    image: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&h=500&fit=crop"
  },
  {
    id: "crm",
    name: "Customer CRM & Loyalty",
    icon: Users,
    badge: "+38% Retention",
    headline: "Deep client profiles, history, and automated rewards",
    desc: "Keep complete client records at your fingertips: past service formulas, preferred stylists, birthdays, anniversaries, lifetime spend, and tiered loyalty point balances.",
    bullets: [
      "360-Degree customer history & formula notes",
      "Automated loyalty points ledger & membership passes",
      "Targeted birthday & anniversary greeting automations",
      "Top customer tagging and spend segmentation"
    ],
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=500&fit=crop"
  },
  {
    id: "multibranch",
    name: "Multi-Branch Control",
    icon: LayoutDashboard,
    badge: "Centralized Sync",
    headline: "Scale across 10+ locations without operational chaos",
    desc: "Switch between branches in one click. Compare branch-wise revenues, transfer stock between locations with approval workflows, and audit operations remotely.",
    bullets: [
      "Centralized salon dashboard with branch selector",
      "Inter-branch inventory transfers & low-stock alerts",
      "Branch vs Branch comparative revenue analytics",
      "Strict role-based access to protect sensitive financial data"
    ],
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=500&fit=crop"
  },
  {
    id: "staff",
    name: "Staff & Attendance",
    icon: UserCheck,
    badge: "Dispute-Free",
    headline: "Facial clock-in, commission rules & automated payroll",
    desc: "Say goodbye to commission disputes. Calculate service commissions, product sales incentives, track leaves, and run monthly salaries with zero spreadsheets.",
    bullets: [
      "Selfie / Geofenced attendance clock-in & clock-out",
      "Dynamic multi-tier service commission calculations",
      "Staff schedule rosters with leave approval flow",
      "Individual staff workspace login with private metrics"
    ],
    image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=500&fit=crop"
  }
];

const allFeaturesDeepList = [
  {
    category: "POS & Billing Operations",
    icon: CreditCard,
    color: "#0d9488",
    bg: "#f0fdfa",
    tag: "Checkout Speed",
    title: "High-Speed Billing & Tax Invoicing",
    desc: "Built to eliminate reception bottlenecks during peak weekend rushes with split payment versatility and instant digital receipts.",
    items: [
      "5-Second Rapid Checkout with keyboard hotkeys",
      "Multi-Mode Split Payments (Cash, UPI, Credit Card, Points)",
      "Automated WhatsApp Tax Invoices with PDF download",
      "Dynamic GST calculation with HSN/SAC codes",
      "Thermal Receipt Printing (58mm / 80mm ESC-POS)",
      "Daily Cash Drawer balancing & Shift closing ledger"
    ]
  },
  {
    category: "Appointment Scheduling",
    icon: Calendar,
    color: "#0284c7",
    bg: "#f0f9ff",
    tag: "Zero Double Bookings",
    title: "Intelligent Calendar & Stylist Shifts",
    desc: "A responsive, collision-free scheduling engine that maps stylist shift hours, chair capacities, and room availability.",
    items: [
      "Interactive Day, Week, and Chair Grid Views",
      "Real-time double booking prevention algorithms",
      "Automated 2-Hour WhatsApp & SMS appointment reminders",
      "Online customer booking portal with deposit payments",
      "Quick drag-and-drop appointment rescheduling",
      "Walk-in queue manager with estimated wait times"
    ]
  },
  {
    category: "Branded Digital Storefront",
    icon: Store,
    color: "#d97706",
    bg: "#fffbeb",
    tag: "24/7 Revenue",
    title: "Luxury E-Commerce & Service Menu",
    desc: "A custom-branded website for every salon location to showcase premium packages, take 24/7 bookings, and sell retail products.",
    items: [
      "Custom brand colors, banners, logo, and typography",
      "Direct Razorpay online checkout integration",
      "Retail product catalogue with stock deduction",
      "Verified customer reviews & photo gallery",
      "Mobile-optimized Progressive Web App (PWA) layout",
      "Instant order fulfillment & in-salon pickup tracker"
    ]
  },
  {
    category: "Client CRM & Retention",
    icon: Users,
    color: "#8b5cf6",
    bg: "#f5f3ff",
    tag: "High Retention",
    title: "360° Client Profile & Formula Notes",
    desc: "Track client chemical formulas, past service history, stylist preferences, and spend velocity to create personalized experiences.",
    items: [
      "Detailed color formula notes & allergy warnings",
      "Tiered Loyalty Points ledger & automatic redemption",
      "Automated Birthday & Anniversary greeting coupons",
      "Top client tagging & high-spender classification",
      "Inactive customer win-back campaign automations",
      "Membership passes & multi-session service packages"
    ]
  },
  {
    category: "Multi-Branch & Franchise Sync",
    icon: LayoutDashboard,
    color: "#10b981",
    bg: "#ecfdf5",
    tag: "Enterprise Scale",
    title: "Centralized Chain Management Console",
    desc: "Oversee 2 to 50+ locations from a single dashboard with unified customer search, stock transfers, and consolidated financials.",
    items: [
      "1-Click branch switching with zero re-login",
      "Inter-branch inventory transfer with request/approval flows",
      "Branch-wise revenue & chair occupancy comparison",
      "Centralized master service catalog & pricing control",
      "Granular role-based permissions per location",
      "Chain-wide customer loyalty & gift card redemption"
    ]
  },
  {
    category: "Staff Rosters & Payroll",
    icon: UserCheck,
    color: "#ec4899",
    bg: "#fdf2f8",
    tag: "Zero Disputes",
    title: "Biometric Attendance & Commission Engine",
    desc: "Automate complex tiered commissions on services and retail products with facial clock-in and private staff workspace portals.",
    items: [
      "Facial recognition & Geofenced selfie attendance clock-in",
      "Dynamic multi-tier service commission calculations",
      "Retail product sales incentive tracking",
      "Weekly staff shift roster & leave management",
      "Private staff workspace login to view daily commissions",
      "Automated monthly payroll generation with salary slips"
    ]
  },
  {
    category: "Inventory & Supply Chain",
    icon: Package,
    color: "#f59e0b",
    bg: "#fffbeb",
    tag: "Stock Control",
    title: "Consumables & Retail Stock Movements",
    desc: "Track every bottle, tube, and serum across internal backbar usage and retail shelves with automatic low-stock alerts.",
    items: [
      "Real-time Stock In, Stock Out, and Adjustment ledger",
      "Automated Low-Stock WhatsApp alerts & reorder thresholds",
      "Backbar salon consumable usage vs retail stock separation",
      "Vendor purchase orders & Goods Received Note (GRN) workflow",
      "Batch expiry date tracking for sensitive skincare products",
      "Physical stock audit & reconciliation discrepancies report"
    ]
  },
  {
    category: "Financials & Business Analytics",
    icon: BarChart3,
    color: "#0f766e",
    bg: "#f0fdfa",
    tag: "Audit Ready",
    title: "Live Profitability & Executive Reports",
    desc: "Get deep visibility into daily gross revenue, tax liabilities, stylist productivity, expense categories, and net profit margins.",
    items: [
      "Real-time P&L overview with expense categorization",
      "GST-ready reports (GSTR-1 & B2C breakdown)",
      "Stylist revenue contribution & average ticket size",
      "Service vs Retail product sales performance",
      "Payment mode distribution (UPI vs Cards vs Cash)",
      "One-click Excel & PDF export for chartered accountants"
    ]
  },
  {
    category: "WhatsApp & Growth Marketing",
    icon: Megaphone,
    color: "#16a34a",
    bg: "#f0fdf4",
    tag: "High Conversion",
    title: "Automated WhatsApp Marketing & Campaigns",
    desc: "Engage clients with automated birthday vouchers, festival broadcast campaigns, win-back discounts, and 2-way client communication.",
    items: [
      "Official WhatsApp Business API broadcast engine",
      "Automated Birthday & Anniversary greeting vouchers",
      "Lost client 60-day win-back campaign triggers",
      "Custom coupon codes with maximum usage limits",
      "Rich media broadcast templates with image & PDF support",
      "Live campaign delivery, open & redemption analytics"
    ]
  }
];

const industriesData = [
  { id: "hair", name: "Hair Salons & Barbers", icon: Scissors, color: "#0d9488", bg: "#f0fdfa", desc: "Chair scheduling, color formula notes, stylist commission tiers, and quick walk-in queue management." },
  { id: "spa", name: "Luxury Spas & Wellness", icon: Sparkles, color: "#8b5cf6", bg: "#f5f3ff", desc: "Room & therapist allocation, couples massage packages, aromatherapy inventory, and tranquil booking flow." },
  { id: "nail", name: "Nail Bars & Lash Lounges", icon: Gem, color: "#ec4899", bg: "#fdf2f8", desc: "Express service add-ons, technician speed tracking, nail art catalog, and recurring refill memberships." },
  { id: "clinic", name: "Aesthetic & Skin Clinics", icon: Activity, color: "#0284c7", bg: "#f0f9ff", desc: "Doctor consultation slots, before/after records, treatment session packages, and strict patient consent trails." },
  { id: "tattoo", name: "Tattoo & Piercing Studios", icon: Palette, color: "#f59e0b", bg: "#fffbeb", desc: "Artist hourly rate billing, custom design deposits, aftercare supply sales, and digital waiver forms." },
  { id: "pet", name: "Pet Grooming Salons", icon: Heart, color: "#10b981", bg: "#ecfdf5", desc: "Breed-specific time estimates, pet medical notes, vaccine reminders, and grooming packages." },
  { id: "bridal", name: "Bridal Makeup Studios", icon: Crown, color: "#d97706", bg: "#fffbeb", desc: "Advance bridal package bookings, milestone payments, trial scheduling, and team destination roster." }
];

function ModuleMockup({ tabId }) {
  if (tabId === "pos") {
    return (
      <div style={{ background: "#0f172a", borderRadius: 18, padding: 22, color: "#fff", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 12, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>Quick POS Terminal • #INV-4924</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, background: "#15803d", color: "#bbf7d0", padding: "2px 8px", borderRadius: 6 }}>PAID</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#cbd5e1" }}>
            <span>Keratin Hair Spa & Treatment</span>
            <span style={{ fontWeight: 700, color: "#fff" }}>₹2,499.00</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#cbd5e1" }}>
            <span>Beard Sculpting & Royal Shave</span>
            <span style={{ fontWeight: 700, color: "#fff" }}>₹499.00</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#cbd5e1" }}>
            <span>Moroccan Argan Serum 100ml</span>
            <span style={{ fontWeight: 700, color: "#fff" }}>₹850.00</span>
          </div>
        </div>

        <div style={{ borderTop: "1px dashed rgba(255,255,255,0.15)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#94a3b8" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Subtotal</span>
            <span>₹3,848.00</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#4ade80" }}>
            <span>Loyalty Discount (300 Pts)</span>
            <span>- ₹300.00</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>GST (18% inclusive)</span>
            <span>₹638.64</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, fontWeight: 900, color: "#2dd4bf", borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 8, marginTop: 4 }}>
            <span>Total Collected</span>
            <span>₹3,548.00</span>
          </div>
        </div>

        <div style={{ marginTop: 14, background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.3)", padding: "8px 12px", borderRadius: 10, display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "#86efac" }}>
          <span>💬</span>
          <span>Digital PDF Invoice sent instantly to customer's WhatsApp (+91 98*** 42100)</span>
        </div>
      </div>
    );
  }

  if (tabId === "appointments") {
    return (
      <div style={{ background: "#ffffff", borderRadius: 18, padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 20px 40px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Saturday Appointments Board</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Live Slot Optimization • Bandra Branch</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, background: "#ecfdf5", color: "#059669", padding: "4px 10px", borderRadius: 20 }}>
            ● 8 Active Slots
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          <div style={{ padding: "10px 14px", background: "#f0fdfa", border: "1px solid #ccfbf1", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f766e" }}>10:00 AM • Balayage Hair Color</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Client: Priya S. | Stylist: Rohit Sharma (Chair 1)</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, background: "#0d9488", color: "#fff", padding: "2px 8px", borderRadius: 6 }}>CONFIRMED</span>
          </div>

          <div style={{ padding: "10px 14px", background: "#f5f3ff", border: "1px solid #ede9fe", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#6d28d9" }}>11:30 AM • Deep Tissue Aromatherapy</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Client: Rahul M. | Therapist: Ananya (Spa Room 2)</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, background: "#8b5cf6", color: "#fff", padding: "2px 8px", borderRadius: 6 }}>IN-SERVICE</span>
          </div>

          <div style={{ padding: "10px 14px", background: "#fff7ed", border: "1px solid #ffedd5", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#c2410c" }}>02:00 PM • Bridal Glam Consultation</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Client: Sneha K. | Senior Stylist: Meera (Executive Suite)</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, background: "#ea580c", color: "#fff", padding: "2px 8px", borderRadius: 6 }}>SPECIAL</span>
          </div>
        </div>

        <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: 10, display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#475569" }}>
          <CheckCircle2 size={14} color="#0d9488" />
          <span>Automatic 2-Hour WhatsApp Reminder & Stylist Shift sync active</span>
        </div>
      </div>
    );
  }

  if (tabId === "storefront") {
    return (
      <div style={{ background: "#ffffff", borderRadius: 18, padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 20px 40px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px solid #f1f5f9", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #0d9488, #14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 12 }}>S</div>
            <span style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>Salon Nest Luxe Studio</span>
          </div>
          <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}>
            ★★★★★ 4.9 (340+ Reviews)
          </span>
        </div>

        <div style={{ background: "linear-gradient(135deg, #f0fdfa, #f8fafc)", padding: 14, borderRadius: 14, border: "1px solid #ccfbf1", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Hydra Gloss Facial Spa</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>60 Mins • Deep hydration & instant glow</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0d9488", marginTop: 4 }}>₹3,499</div>
          </div>
          <button type="button" style={{ background: "#0d9488", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
            Book Slot
          </button>
        </div>

        <div style={{ background: "#f8fafc", padding: 14, borderRadius: 14, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Moroccan Argan Hair Mask</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>250ml Retail Tub • In Stock (18 units)</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>₹1,650</div>
          </div>
          <button type="button" style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
            + Add to Bag
          </button>
        </div>

        <div style={{ marginTop: 12, textAlign: "center", fontSize: 11, color: "#0d9488", fontWeight: 700 }}>
          ⚡ 100% Branded Online Storefront • Razorpay Checkout Active
        </div>
      </div>
    );
  }

  if (tabId === "crm") {
    return (
      <div style={{ background: "#ffffff", borderRadius: 18, padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 20px 40px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 14, borderBottom: "1px solid #f1f5f9", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #ec4899, #8b5cf6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16 }}>
              AV
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                Ananya Verma <span style={{ fontSize: 10, background: "#fef3c7", color: "#b45309", padding: "1px 6px", borderRadius: 4, fontWeight: 800 }}>👑 GOLD MEMBER</span>
              </div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Client ID: #CL-1082 • Registered 14 mos ago</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: 10, textAlign: "center", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>Total Visits</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>18</div>
          </div>
          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: 10, textAlign: "center", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>Lifetime Spend</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0d9488" }}>₹48,200</div>
          </div>
          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: 10, textAlign: "center", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>Loyalty Points</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#d97706" }}>1,250 Pts</div>
          </div>
        </div>

        <div style={{ background: "#f0fdfa", padding: "10px 14px", borderRadius: 10, border: "1px solid #ccfbf1", marginBottom: 10, fontSize: 11.5, color: "#0f766e" }}>
          <strong>Hair Color Formula:</strong> L'Oreal Majirel 7.1 + 20 Vol (1:1.5) on roots, 35m timer.
        </div>

        <div style={{ background: "#fdf2f8", padding: "8px 12px", borderRadius: 10, border: "1px solid #fce7f3", fontSize: 11, color: "#be185d", display: "flex", alignItems: "center", gap: 6 }}>
          <span>🎂</span>
          <span>Birthday in 3 Days (25 Aug) • Auto 20% WhatsApp Promo Coupon Scheduled</span>
        </div>
      </div>
    );
  }

  if (tabId === "multibranch") {
    return (
      <div style={{ background: "#0f172a", borderRadius: 18, padding: 22, color: "#fff", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Multi-Branch Live Revenue & Occupancy</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Real-Time Consolidated Cloud Sync</div>
          </div>
          <span style={{ fontSize: 10.5, fontWeight: 800, background: "#0d9488", color: "#fff", padding: "3px 8px", borderRadius: 6 }}>
            3 BRANCHES ONLINE
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          <div style={{ background: "rgba(255,255,255,0.06)", padding: "10px 14px", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#2dd4bf" }}>📍 Bandra West Studio (Flagship)</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>12 Stylists Active • 98% Chair Occupancy</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#fff" }}>₹1,42,800</div>
              <div style={{ fontSize: 10, color: "#4ade80" }}>↑ +24% today</div>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.06)", padding: "10px 14px", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8" }}>📍 Juhu Beach Lounge</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>8 Stylists Active • 84% Chair Occupancy</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#fff" }}>₹1,18,500</div>
              <div style={{ fontSize: 10, color: "#4ade80" }}>↑ +18% today</div>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.06)", padding: "10px 14px", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>📍 Powai Heights Studio</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>6 Stylists Active • 76% Chair Occupancy</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#fff" }}>₹94,200</div>
              <div style={{ fontSize: 10, color: "#4ade80" }}>↑ +12% today</div>
            </div>
          </div>
        </div>

        <div style={{ background: "rgba(13,148,136,0.2)", padding: "8px 12px", borderRadius: 10, display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#5eead4" }}>
          <span>⚡</span>
          <span>Inter-branch inventory transfer and central financial consolidation synced.</span>
        </div>
      </div>
    );
  }

  if (tabId === "staff") {
    return (
      <div style={{ background: "#ffffff", borderRadius: 18, padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 20px 40px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px solid #f1f5f9", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Daily Stylist Commission & Shift Ledger</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Automated Calculation • Zero Dispute</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, background: "#ecfdf5", color: "#059669", padding: "4px 10px", borderRadius: 20 }}>
            ● 14 Staff Clocked-In
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Rohit Sharma (Master Stylist)</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>8 Services Completed • Facial Clock-in 09:52 AM</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0d9488" }}>₹3,280 Commission</div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>Volume: ₹16,400 (20%)</div>
            </div>
          </div>

          <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Meera Nair (Senior Esthetician)</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>6 Spa Sessions • Facial Clock-in 10:04 AM</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0d9488" }}>₹2,560 Commission</div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>Volume: ₹12,800 (20%)</div>
            </div>
          </div>
        </div>

        <div style={{ background: "#f0fdfa", padding: "8px 12px", borderRadius: 10, border: "1px solid #ccfbf1", display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#0f766e" }}>
          <CheckCircle2 size={14} color="#0d9488" />
          <span>Staff see their individual daily earnings in real-time in 'My Workspace'.</span>
        </div>
      </div>
    );
  }

  return null;
}

const testimonialsList = [
  {
    name: "Priya Sharma",
    role: "Founder & Creative Director",
    salon: "Luxe Studio & Academy",
    city: "Mumbai",
    rating: 5,
    metric: "+42% Repeat Clients",
    text: "Salon Nest completely transformed how we run our 3 branches. The POS is lightning fast during peak weekend rushes and the automated WhatsApp reminders reduced our no-shows to almost zero.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&fit=crop"
  },
  {
    name: "Rahul Mehta",
    role: "Managing Director",
    salon: "Glamour Lounge Chain",
    city: "Delhi NCR",
    rating: 5,
    metric: "Saved 20 hrs/week",
    text: "Finally a salon operating system built for Indian business realities. The multi-branch stock transfers and automated stylist commissions saved our management team 20+ hours every single week.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&fit=crop"
  },
  {
    name: "Ananya Patel",
    role: "Operations Head",
    salon: "Spa Bliss & Wellness",
    city: "Bengaluru",
    rating: 5,
    metric: "+38% Retention",
    text: "The Customer CRM and loyalty points ledger is phenomenal. We automatically track client preferences, past massage oils, and birthdays. Our customer retention jumped by 38% in 3 months.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&fit=crop"
  },
  {
    name: "Vikramaditya Rao",
    role: "Owner",
    salon: "The Heritage Barber Co.",
    city: "Hyderabad",
    rating: 5,
    metric: "99.4% Client Rating",
    text: "From walk-in queue management to instant digital WhatsApp receipts, our clients love the upscale modern experience. The interface is intuitive—our new receptionists learned it in 15 minutes!",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&fit=crop"
  },
  {
    name: "Sonia Kapoor",
    role: "Co-Founder",
    salon: "Aura Aesthetic Clinic",
    city: "Chandigarh",
    rating: 5,
    metric: "100% Data Security",
    text: "Role-based permissions allow my front-desk team to handle appointments and billing smoothly, while financial numbers, profit reports, and staff payroll remain strictly private to me.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&fit=crop"
  },
  {
    name: "Farhan Qureshi",
    role: "Lead Stylist & Owner",
    salon: "Urban Cuts Studios",
    city: "Pune",
    rating: 5,
    metric: "Zero Payroll Errors",
    text: "Staff attendance with facial verification and automated service commission calculations solved all our month-end payroll arguments. Every stylist sees their earnings live in their own portal.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&fit=crop"
  },
  {
    name: "Meera Nambiar",
    role: "Founder",
    salon: "Nail & Lash Haven",
    city: "Kochi",
    rating: 5,
    metric: "₹2.4L Online Sales",
    text: "The custom branded e-commerce storefront generated ₹2.4 Lakh in premium haircare and skincare product sales in our first month alone! It's like having a 24/7 revenue engine.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&fit=crop"
  },
  {
    name: "Zaid Al-Mansoor",
    role: "General Manager",
    salon: "Velvet Day Spa",
    city: "Dubai / Mumbai",
    rating: 5,
    metric: "5-Star Standard",
    text: "Truly the gold standard in modern salon ERP. Beautiful on iPads, ultra-responsive on mobile, and the dedicated support ticketing system solves questions in minutes.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&fit=crop"
  }
];

const faqs = [
  {
    q: "Can I manage multiple salon branches from a single login?",
    a: "Yes! Salon Nest is built from the ground up for multi-branch salon and spa chains. You can toggle between locations in 1 click, view consolidated financial analytics, transfer product inventory between branches, and enforce uniform pricing or branch-specific rates."
  },
  {
    q: "Does Salon Nest send automated WhatsApp messages & digital invoices?",
    a: "Absolutely. You can send automatic appointment confirmations, stylist reminders 2 hours prior, post-service digital PDF bills, feedback collection links, and birthday greeting offers directly to your client's WhatsApp."
  },
  {
    q: "How easy is it to migrate our existing customer data and service catalog?",
    a: "We provide easy 1-click CSV import tools for customers, services, categories, and inventory. Plus, during your onboarding, our dedicated setup team will help format and import your existing salon databases with zero downtime."
  },
  {
    q: "Can my stylists check their bookings without seeing overall business revenue?",
    a: "Yes! With our granular Role-Based Access Control (RBAC), each staff member gets a dedicated 'My Workspace' login where they only see their assigned appointments, working shifts, and personal commissions without access to overall salon revenue or customer phone numbers."
  },
  {
    q: "Do you offer customer support and staff training?",
    a: "Yes. Every subscription includes dedicated WhatsApp chat support, a built-in ticket management desk, and free live video onboarding sessions for your front desk managers and staff."
  }
];

const comparisonPoints = [
  { feature: "Multi-Branch Live Sync", old: "Separate offline software per shop", nest: "Unified Cloud Console with 1-click switch" },
  { feature: "Appointment Booking", old: "Manual phone calls & paper registers", nest: "24/7 Online Storefront + Smart Collision Calendar" },
  { feature: "Billing & Invoicing", old: "Slow desktop POS with manual tax entry", nest: "5-Second Checkout + Auto GST + WhatsApp PDF" },
  { feature: "Stylist Commissions", old: "Messy spreadsheets & monthly disputes", nest: "Real-time tier calculation with staff transparency" },
  { feature: "Customer Retention", old: "No automated follow-up system", nest: "Automated loyalty ledger & WhatsApp campaigns" }
];

const defaultPlans = [
  {
    id: "starter",
    name: "Starter Studio",
    tagline: "Essential operating power for independent salons & boutique barbers",
    monthlyPrice: 1499,
    yearlyPrice: 14390,
    userLimit: 5,
    customerLimit: "5,000",
    invoiceLimit: "1,000",
    storageLimit: 10,
    isPopular: false,
    features: [
      "Lightning 5-Second POS Billing",
      "Collision-Free Appointment Calendar",
      "Dynamic GST & Tax Invoices",
      "WhatsApp Invoice & Reminder Dispatch",
      "Basic Customer Loyalty Ledger",
      "Daily Cash Closing Summary",
      "Single Branch License"
    ]
  },
  {
    id: "growth",
    name: "Growth & Multi-Chair",
    tagline: "Full-suite automation for high-volume salons, day spas & aesthetics",
    monthlyPrice: 2999,
    yearlyPrice: 28790,
    userLimit: 25,
    customerLimit: "25,000",
    invoiceLimit: "Unlimited",
    storageLimit: 50,
    isPopular: true,
    features: [
      "Everything in Starter, plus:",
      "Custom Branded Online Storefront",
      "E-Commerce Retail Product Sales",
      "Facial Recognition Staff Clock-In",
      "Multi-Tier Stylist Commission Engine",
      "Hair Color & Chemical Formula Ledger",
      "Low-Stock Inventory Alerts & Transfers",
      "Multi-Branch Ready (Up to 3 Branches)"
    ]
  },
  {
    id: "enterprise",
    name: "Enterprise Chain & Franchise",
    tagline: "Uncompromised multi-branch control for luxury chains & franchises",
    monthlyPrice: 5999,
    yearlyPrice: 57590,
    userLimit: 100,
    customerLimit: "Unlimited",
    invoiceLimit: "Unlimited",
    storageLimit: 250,
    isPopular: false,
    features: [
      "Everything in Growth, plus:",
      "Unlimited Salon Branch Locations",
      "Inter-Branch Stock Movement Workflows",
      "Centralized Chain Revenue Leaderboard",
      "Dedicated Account Manager & Priority Support",
      "Custom Domain Integration & White-labeling",
      "Audit Trail & Compliance Logs",
      "Custom API & Accounting Integration"
    ]
  }
];

export default function MarketingHomePage() {
  const location = useLocation();
  const [settings, setSettings] = useState(null);
  const [plans, setPlans] = useState(defaultPlans);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(interactiveModules[0].id);
  const [activeIndustry, setActiveIndustry] = useState(industriesData[0].id);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [isAnnualBilling, setIsAnnualBilling] = useState(false);
  const [selectedFeatureCategory, setSelectedFeatureCategory] = useState("All");

  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    email: "",
    salonName: "",
    city: "",
    message: ""
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get("/public/settings").catch(() => ({ data: {} })),
      api.get("/public/plans").catch(() => ({ data: [] }))
    ])
      .then(([settingsRes, plansRes]) => {
        if (!active) return;
        setSettings(settingsRes.data || {});
        if (Array.isArray(plansRes.data) && plansRes.data.length > 0) {
          const cleanPlans = plansRes.data.map((p, idx) => ({
            id: p.id || String(idx),
            name: p.name && !p.name.includes("dsak") ? p.name : defaultPlans[idx % defaultPlans.length].name,
            tagline: p.description || defaultPlans[idx % defaultPlans.length].tagline,
            monthlyPrice: Number(p.monthlyPrice) || defaultPlans[idx % defaultPlans.length].monthlyPrice,
            yearlyPrice: Number(p.yearlyPrice) || (Number(p.monthlyPrice) * 10) || defaultPlans[idx % defaultPlans.length].yearlyPrice,
            userLimit: p.userLimit || (idx === 0 ? 5 : idx === 1 ? 25 : 100),
            customerLimit: p.customerLimit || (idx === 0 ? "5,000" : idx === 1 ? "25,000" : "Unlimited"),
            invoiceLimit: p.invoiceLimit || (idx === 0 ? "1,000" : "Unlimited"),
            storageLimit: p.storageLimit || (idx === 0 ? 10 : idx === 1 ? 50 : 250),
            isPopular: idx === 1 || Boolean(p.isPopular),
            features: defaultPlans[idx % defaultPlans.length].features
          }));
          setPlans(cleanPlans);
        } else {
          setPlans(defaultPlans);
        }
      })
      .catch(() => {
        if (active) setPlans(defaultPlans);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const whatsappHref = settings?.whatsappNumber
    ? `https://wa.me/${String(settings.whatsappNumber).replace(/[^\d]/g, "")}`
    : "https://wa.me/919493952587";
  const pricingCurrency = String(settings?.defaultCurrency || "INR").toUpperCase();
  const currencySymbol = pricingCurrency === "PKR" ? "Rs" : pricingCurrency === "AED" ? "AED" : "₹";

  const isHome = location.pathname === "/";
  const isFeatures = location.pathname === "/features";
  const isPricing = location.pathname === "/pricing";
  const isContact = location.pathname === "/contact";

  useEffect(() => {
    const titles = {
      "/": "Salon Nest - Premium Salon ERP & Multi-Branch Business Operating System",
      "/features": "All Features | Salon Nest ERP",
      "/pricing": "Pricing Plans | Salon Nest ERP",
      "/contact": "Contact Sales & Support | Salon Nest ERP"
    };
    document.title = titles[location.pathname] || "Salon Nest - Salon ERP Platform";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  const selectedModule = interactiveModules.find(m => m.id === activeTab) || interactiveModules[0];
  const selectedIndustryData = industriesData.find(i => i.id === activeIndustry) || industriesData[0];

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
    api.post("/public/demo-lead", {
      name: contactForm.name,
      phone: contactForm.phone,
      email: contactForm.email,
      salonName: contactForm.salonName,
      city: contactForm.city,
      notes: contactForm.message || "Contact Us Inquiry"
    }).catch(() => {});
  };

  const featureCategoriesList = ["All", ...new Set(allFeaturesDeepList.map(f => f.category))];
  const filteredFeatures = selectedFeatureCategory === "All"
    ? allFeaturesDeepList
    : allFeaturesDeepList.filter(f => f.category === selectedFeatureCategory);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, border: "4px solid #e2e8f0", borderTopColor: "#0d9488", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <p style={{ color: "#64748b", fontSize: 14, fontWeight: 600 }}>Loading Salon Nest Experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif", color: "#0f172a", overflowX: "hidden" }}>
      
      {/* MAINTENANCE ACTIVE BANNER */}
      {settings?.maintenanceMode && (
        <div style={{ background: "linear-gradient(90deg, #991b1b 0%, #b91c1c 50%, #991b1b 100%)", color: "#fee2e2", padding: "12px 24px", fontSize: 13, textAlign: "center", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap", zIndex: 1000, position: "relative", boxShadow: "0 2px 10px rgba(0,0,0,0.2)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.2)", padding: "3px 10px", borderRadius: 20, color: "#fff", fontSize: 11, fontWeight: 800 }}>
            ⚠️ SYSTEM MAINTENANCE IN PROGRESS
          </span>
          <span>{settings.maintenanceMessage || "We are currently performing scheduled platform maintenance. Services will resume shortly."}</span>
          {settings.maintenanceEndTime && (
            <span style={{ background: "rgba(0,0,0,0.3)", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
              ⏱️ Est. Completion: {(() => {
                const d = new Date(settings.maintenanceEndTime);
                return !isNaN(d.getTime()) 
                  ? d.toLocaleString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) 
                  : settings.maintenanceEndTime;
              })()}
            </span>
          )}
        </div>
      )}

      {/* TOP ANNOUNCEMENT BANNER */}
      <div className="public-top-announcement-bar">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(20,184,166,0.25)", padding: "2px 10px", borderRadius: 20, color: "#5eead4", fontSize: 11, fontWeight: 700 }}>
          <Sparkles size={12} /> NEW
        </span>
        <span>Salon Nest is live with Automated WhatsApp Notifications, Smart POS & Multi-Branch Sync!</span>
        <Link to="/book-demo" style={{ color: "#ffffff", textDecoration: "underline", fontWeight: 700, marginLeft: 4 }}>
          Book 1-on-1 Live Walkthrough &rarr;
        </Link>
      </div>

      {/* HEADER */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(226,232,240,0.8)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 74 }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none", gap: 8 }}>
            <img src="/logo.jfif" alt="Salon Nest Logo" style={{ maxHeight: "42px", maxWidth: "160px", objectFit: "contain" }} />
          </Link>

          <nav className="public-nav-links">
            {navLinks.map(item => (
              <Link 
                key={item.to} 
                to={item.to} 
                style={{ 
                  textDecoration: "none", 
                  fontSize: 14, 
                  fontWeight: location.pathname === item.to ? 700 : 500, 
                  color: location.pathname === item.to ? "#0d9488" : "#475569", 
                  transition: "all 0.2s ease",
                  position: "relative",
                  padding: "6px 0"
                }}
              >
                {item.label}
                {location.pathname === item.to && (
                  <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "#0d9488", borderRadius: 2 }} />
                )}
              </Link>
            ))}
          </nav>

          <div className="public-nav-cta">
            <Link to="/login" style={{ textDecoration: "none", fontSize: 14, fontWeight: 600, color: "#334155", padding: "9px 18px", borderRadius: 10, transition: "all 0.2s" }}>
              Sign In
            </Link>
            <Link to="/book-demo" className="btn-glow-primary" style={{ textDecoration: "none", fontSize: 14, padding: "10px 22px", borderRadius: 10, display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={15} /> Request Demo
            </Link>
          </div>

          <PublicMobileMenu
            brand={{ label: "Salon Nest", sublabel: "Salon ERP Platform", logo: "/logo.jfif", to: "/" }}
            items={navLinks}
            cta={{ label: "Request Demo", to: "/book-demo" }}
          />
        </div>
      </header>

      <main>
        {/* =========================================================================
            HOME PAGE
           ========================================================================= */}
        {isHome && (
          <>
            {/* HERO SECTION */}
            <section style={{ position: "relative", overflow: "hidden", background: "radial-gradient(circle at 80% 20%, rgba(204,251,241,0.6) 0%, rgba(240,253,250,0.4) 40%, #ffffff 80%)", paddingBottom: 40 }}>
              
              {/* Background Ambient Glow Elements */}
              <div style={{ position: "absolute", top: "10%", left: "5%", width: 350, height: 350, background: "rgba(13,148,136,0.08)", filter: "blur(80px)", borderRadius: "50%", pointerEvents: "none" }} />
              <div style={{ position: "absolute", top: "30%", right: "5%", width: 450, height: 450, background: "rgba(20,184,166,0.12)", filter: "blur(90px)", borderRadius: "50%", pointerEvents: "none" }} />

              <div className="public-hero">
                
                {/* Hero Left Content */}
                <div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", background: "#f0fdfa", border: "1px solid #ccfbf1", color: "#0f766e", borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 24, boxShadow: "0 2px 8px rgba(13,148,136,0.08)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0d9488", display: "inline-block", animation: "pulseDot 2s infinite" }} />
                    #1 SALON & SPA OPERATING SYSTEM
                  </div>

                  <h1 className="marketing-hero-heading" style={{ margin: "0 0 20px", color: "#0f172a" }}>
                    Run your entire salon chain from one calm, <span style={{ background: "linear-gradient(135deg, #0d9488 0%, #0284c7 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>controlled</span> system.
                  </h1>

                  <p style={{ fontSize: "1.15rem", color: "#475569", lineHeight: 1.7, margin: "0 0 32px", maxWidth: 540 }}>
                    Super Admin oversight, lightning POS billing, automated WhatsApp alerts, client CRM, stylist commissions, and real-time inventory—built specifically for high-growth salons and spas.
                  </p>

                  <div className="public-hero-actions" style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 36 }}>
                    <Link to="/book-demo" className="btn-glow-primary" style={{ textDecoration: "none", fontSize: 15, padding: "15px 32px", borderRadius: 12, display: "inline-flex", alignItems: "center", gap: 8 }}>
                      Request Live Demo <ArrowRight size={17} />
                    </Link>
                    <Link to="/pricing" style={{ textDecoration: "none", fontSize: 15, fontWeight: 700, color: "#0f172a", background: "#ffffff", padding: "15px 28px", borderRadius: 12, border: "1px solid #cbd5e1", boxShadow: "0 2px 6px rgba(0,0,0,0.04)", display: "inline-flex", alignItems: "center", gap: 8, transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#0d9488"; e.currentTarget.style.color = "#0d9488"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.color = "#0f172a"; }}>
                      Explore Plans
                    </Link>
                  </div>

                  {/* Feature Checkmarks */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
                    {[
                      "Zero Setup Fee",
                      "Multi-Branch Ready",
                      "Automated WhatsApp",
                      "Role-Based Security"
                    ].map(item => (
                      <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#334155", fontWeight: 600 }}>
                        <CheckCircle2 size={16} color="#0d9488" style={{ flexShrink: 0 }} />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hero Right Visual Deck */}
                <div style={{ position: "relative" }}>
                  <div style={{ borderRadius: 24, overflow: "hidden", boxShadow: "0 30px 60px -15px rgba(15, 23, 42, 0.25)", position: "relative", border: "1px solid rgba(255,255,255,0.8)", background: "#0f172a" }}>
                    <img 
                      src={salonImages.hero} 
                      alt="Premium salon interior" 
                      style={{ width: "100%", height: 440, objectFit: "cover", display: "block", opacity: 0.9 }} 
                    />
                    
                    {/* Live Glass Stats Overlay at Bottom */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(15, 23, 42, 0.95))", padding: "40px 20px 20px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 10 }}>
                        <div style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", borderRadius: 12, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}>
                          <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Live Revenue</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: "#2dd4bf", marginTop: 2 }}>₹3,84,240</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", borderRadius: 12, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}>
                          <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Today Bookings</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: "#38bdf8", marginTop: 2 }}>412 Slots</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", borderRadius: 12, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}>
                          <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Stylists Active</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: "#a78bfa", marginTop: 2 }}>184 On-Duty</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Floating Badge */}
                  <div className="hero-floating-badge" style={{ animation: "floatSlow 4s ease-in-out infinite", background: "#ffffff", borderRadius: 18, padding: "12px 18px", boxShadow: "0 15px 35px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: 12, zIndex: 3, border: "1px solid #e2e8f0" }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg, #0d9488, #14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                      <TrendingUp size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Multi-Branch Synced</div>
                      <div style={{ fontSize: 12, color: "#0d9488", fontWeight: 700 }}>↑ +38% Client Retention</div>
                    </div>
                  </div>

                  {/* Bottom Left Floating Toast Notification */}
                  <div className="hero-floating-toast">
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                      <Check size={18} strokeWidth={3} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "#f8fafc", fontWeight: 700 }}>New Spa Appointment</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>Bandra West Branch • 2 min ago</div>
                    </div>
                  </div>

                </div>
              </div>
            </section>

            {/* LIVE OPERATIONAL METRICS RIBBON */}
            <section style={{ background: "#0f172a", padding: "48px 24px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: "20%", width: 300, height: 100, background: "rgba(13,148,136,0.3)", filter: "blur(60px)", pointerEvents: "none" }} />
              
              <div className="marketing-stats-grid" style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 28 }}>
                {stats.map(s => (
                  <div key={s.label} style={{ textAlign: "center", padding: "12px 16px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: "2.4rem", fontWeight: 900, color: "#2dd4bf", letterSpacing: "-0.02em" }}>{s.value}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginTop: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* VISUAL SHOWCASE: BUILT FOR PREMIUM SALONS */}
            <section style={{ padding: "96px 24px 80px", background: "#ffffff" }}>
              <div style={{ maxWidth: 1240, margin: "0 auto" }}>
                
                <div style={{ textAlign: "center", marginBottom: 54 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", background: "#f0fdfa", border: "1px solid #ccfbf1", color: "#0f766e", borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16 }}>
                    <Crown size={13} /> TAILORED ARCHITECTURE
                  </div>
                  <h2 className="marketing-section-heading" style={{ color: "#0f172a", margin: "0 0 14px" }}>Built for the World's Best Salons & Spas</h2>
                  <p style={{ fontSize: "1.15rem", color: "#475569", maxWidth: 680, margin: "0 auto", lineHeight: 1.6 }}>
                    From boutique styling studios to 15+ branch luxury wellness chains, Salon Nest powers every operational touchpoint.
                  </p>
                </div>

                <div className="marketing-images-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 28 }}>
                  {[
                    { 
                      img: salonImages.styling, 
                      icon: Scissors,
                      color: "#0d9488",
                      title: "Luxury Hair Studios & Barbershops", 
                      tag: "Styling & Chemical Care", 
                      metric: "⚡ 5-Sec POS • 98% Chair Rate",
                      desc: "Engineered for high-throughput salons managing rapid styling rotations, chemical formulas, and tiered commission payouts.",
                      features: [
                        "Hair color formula vault with allergy notes",
                        "Collision-free stylist calendar & shift rosters",
                        "Automated service & retail commission calculations"
                      ]
                    },
                    { 
                      img: salonImages.spa, 
                      icon: Sparkles,
                      color: "#0284c7",
                      title: "Day Spas & Wellness Retreats", 
                      tag: "Therapy & Packages", 
                      metric: "🌿 4.9★ Rating • Zero No-Shows",
                      desc: "Peaceful guest journey orchestration across private treatment suites, couples therapy packages, and recurring memberships.",
                      features: [
                        "Therapist & treatment room allocation engine",
                        "Aromatherapy & consumable stock tracking",
                        "Recurring wellness passes & package renewals"
                      ]
                    },
                    { 
                      img: salonImages.beauty, 
                      icon: Crown,
                      color: "#8b5cf6",
                      title: "Aesthetic Clinics & Bridal Lounges", 
                      tag: "Skin & Glamour", 
                      metric: "👑 ₹18L+ Advance Bookings",
                      desc: "High-ticket client management with structured milestone deposits, pre-bridal consultations, and personalized records.",
                      features: [
                        "Bridal milestone payment schedules & receipts",
                        "Multi-session treatment progress tracking",
                        "Private VIP client portal & custom quotes"
                      ]
                    }
                  ].map((card, i) => {
                    const Icon = card.icon;
                    return (
                      <div 
                        key={i} 
                        style={{ 
                          borderRadius: 24, 
                          overflow: "hidden", 
                          background: "#ffffff",
                          boxShadow: "0 10px 30px rgba(0,0,0,0.06)", 
                          transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                          border: "1px solid #e2e8f0",
                          display: "flex",
                          flexDirection: "column"
                        }}
                        onMouseEnter={e => { 
                          e.currentTarget.style.transform = "translateY(-8px)"; 
                          e.currentTarget.style.boxShadow = "0 22px 50px rgba(13,148,136,0.14)"; 
                          e.currentTarget.style.borderColor = "#99f6e4";
                        }}
                        onMouseLeave={e => { 
                          e.currentTarget.style.transform = "translateY(0)"; 
                          e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.06)"; 
                          e.currentTarget.style.borderColor = "#e2e8f0";
                        }}
                      >
                        {/* Image banner with dark vignette and metric badge */}
                        <div style={{ height: 240, overflow: "hidden", position: "relative" }}>
                          <img 
                            src={card.img} 
                            alt={card.title} 
                            style={{ 
                              width: "100%", 
                              height: "100%", 
                              objectFit: "cover" 
                            }} 
                          />
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(15,23,42,0.3) 0%, rgba(15,23,42,0.7) 100%)" }} />
                          
                          {/* Top pill */}
                          <div style={{ position: "absolute", top: 16, left: 16, display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", color: "#0f172a", padding: "5px 12px", borderRadius: 100, fontSize: 11.5, fontWeight: 700 }}>
                            <Icon size={13} color={card.color} />
                            <span>{card.tag}</span>
                          </div>

                          {/* Bottom metric */}
                          <div style={{ position: "absolute", bottom: 14, left: 16, right: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ background: "rgba(15,23,42,0.85)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.15)", color: "#5eead4", padding: "4px 10px", borderRadius: 8, fontSize: 11.5, fontWeight: 700 }}>
                              {card.metric}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div style={{ padding: "26px", flex: 1, display: "flex", flexDirection: "column" }}>
                          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>
                            {card.title}
                          </h3>
                          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px", lineHeight: 1.6 }}>
                            {card.desc}
                          </p>

                          {/* Feature checklist */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24, flex: 1 }}>
                            {card.features.map((f, fIdx) => (
                              <div key={fIdx} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#334155", fontWeight: 500 }}>
                                <CheckCircle2 size={15} color="#0d9488" style={{ flexShrink: 0 }} />
                                <span>{f}</span>
                              </div>
                            ))}
                          </div>

                          <Link 
                            to="/book-demo" 
                            style={{ 
                              display: "inline-flex", 
                              alignItems: "center", 
                              gap: 6, 
                              fontSize: 13.5, 
                              fontWeight: 700, 
                              color: "#0d9488", 
                              textDecoration: "none", 
                              marginTop: "auto",
                              borderTop: "1px solid #f1f5f9",
                              paddingTop: 14
                            }}
                          >
                            <span>Explore live workflow</span>
                            <ArrowRight size={15} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* INTERACTIVE MODULE EXPLORER */}
            <section style={{ padding: "80px 24px", background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)" }}>
              <div style={{ maxWidth: 1240, margin: "0 auto" }}>
                
                <div style={{ textAlign: "center", marginBottom: 40 }}>
                  <div style={{ display: "inline-block", padding: "6px 16px", background: "#f0fdfa", border: "1px solid #ccfbf1", color: "#0f766e", borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16 }}>
                    INTERACTIVE PLATFORM TOUR
                  </div>
                  <h2 className="marketing-section-heading" style={{ color: "#0f172a" }}>Everything Needed to Run & Grow Your Salon</h2>
                  <p style={{ fontSize: "1.1rem", color: "#64748b", maxWidth: 640, margin: "0 auto" }}>
                    Click through the core operating modules to see how Salon Nest streamlines your daily workflow.
                  </p>
                </div>

                {/* Module Switcher Tabs */}
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 36 }}>
                  {interactiveModules.map(m => {
                    const Icon = m.icon;
                    const isActive = m.id === activeTab;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setActiveTab(m.id)}
                        className={`marketing-interactive-tab ${isActive ? "active" : ""}`}
                      >
                        <Icon size={16} />
                        {m.name}
                      </button>
                    );
                  })}
                </div>

                {/* Active Module Showcase Card */}
                <div className="marketing-interactive-card">
                  <div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "#f0fdfa", color: "#0d9488", borderRadius: 8, fontSize: 12, fontWeight: 800, textTransform: "uppercase", marginBottom: 14 }}>
                      <Sparkles size={13} /> {selectedModule.badge}
                    </div>
                    <h3 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: "0 0 16px", lineHeight: 1.25 }}>
                      {selectedModule.headline}
                    </h3>
                    <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7, margin: "0 0 24px" }}>
                      {selectedModule.desc}
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                      {selectedModule.bullets.map((b, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#ccfbf1", display: "flex", alignItems: "center", justifyContent: "center", color: "#0f766e", flexShrink: 0 }}>
                            <Check size={14} strokeWidth={3} />
                          </div>
                          <span style={{ fontSize: 14, color: "#334155", fontWeight: 600 }}>{b}</span>
                        </div>
                      ))}
                    </div>

                    <Link to="/book-demo" className="btn-glow-primary" style={{ textDecoration: "none", fontSize: 14, padding: "12px 24px", borderRadius: 10, display: "inline-flex", alignItems: "center", gap: 8 }}>
                      See {selectedModule.name} in Action &rarr;
                    </Link>
                  </div>

                  <div style={{ width: "100%", maxWidth: "100%", overflow: "hidden" }}>
                    <ModuleMockup tabId={activeTab} />
                  </div>
                </div>

              </div>
            </section>

            {/* INDUSTRY WORKFLOWS SELECTOR */}
            <section style={{ padding: "80px 24px", background: "#ffffff" }}>
              <div style={{ maxWidth: 1240, margin: "0 auto", textAlign: "center" }}>
                <div style={{ display: "inline-block", padding: "6px 16px", background: "#f0fdfa", border: "1px solid #ccfbf1", color: "#0f766e", borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 14 }}>
                  INDUSTRIES
                </div>
                <h3 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#0f172a", margin: "0 0 12px" }}>
                  Tailored specifically for your salon niche
                </h3>
                <p style={{ fontSize: 15, color: "#64748b", maxWidth: 600, margin: "0 auto 36px" }}>
                  Choose your business type below to discover the exact workflows engineered for your daily routine.
                </p>

                {/* Industry Pills */}
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
                  {industriesData.map(ind => {
                    const isSelected = ind.id === activeIndustry;
                    const IndIcon = ind.icon;
                    return (
                      <button
                        key={ind.id}
                        type="button"
                        onClick={() => setActiveIndustry(ind.id)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "10px 18px",
                          borderRadius: 100,
                          fontSize: 13.5,
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          border: isSelected ? `2px solid ${ind.color}` : "1px solid #e2e8f0",
                          background: isSelected ? ind.bg : "#ffffff",
                          color: isSelected ? ind.color : "#334155",
                          boxShadow: isSelected ? `0 4px 14px ${ind.bg}` : "0 2px 6px rgba(0,0,0,0.02)"
                        }}
                      >
                        <IndIcon size={16} color={isSelected ? ind.color : "#64748b"} />
                        {ind.name}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Industry Card */}
                {(() => {
                  const SelIcon = selectedIndustryData.icon;
                  return (
                    <div className="marketing-industry-card" style={{ background: selectedIndustryData.bg || "#f8fafc", border: `1px solid ${selectedIndustryData.color}40` }}>
                      <div style={{ background: "#fff", width: 68, height: 68, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(0,0,0,0.06)", border: `1px solid ${selectedIndustryData.color}30` }}>
                        <SelIcon size={32} color={selectedIndustryData.color} />
                      </div>
                      <div>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: selectedIndustryData.color, marginBottom: 4, letterSpacing: "0.05em" }}>
                          Tailored Workflow
                        </div>
                        <h4 style={{ fontSize: 19, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
                          Built for {selectedIndustryData.name}
                        </h4>
                        <p style={{ fontSize: 14.5, color: "#475569", lineHeight: 1.6, margin: 0 }}>
                          {selectedIndustryData.desc}
                        </p>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </section>

            {/* =========================================================================
                INFINITE TESTIMONIALS MARQUEE ROLLER (REVIEWS ROLLER)
               ========================================================================= */}
            <section style={{ padding: "90px 0 80px", background: "#0f172a", position: "relative", overflow: "hidden" }}>
              
              {/* Background ambient lighting */}
              <div style={{ position: "absolute", top: "10%", left: "30%", width: 500, height: 250, background: "rgba(13,148,136,0.18)", filter: "blur(100px)", pointerEvents: "none" }} />
              
              <div style={{ maxWidth: 1240, margin: "0 auto", textAlign: "center", padding: "0 24px", marginBottom: 44 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 16px", background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.3)", color: "#2dd4bf", borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16 }}>
                  <Star size={13} fill="#2dd4bf" /> VERIFIED REVIEWS & SOCIAL PROOF
                </div>
                <h2 className="marketing-section-heading" style={{ color: "#ffffff", margin: "0 0 12px" }}>
                  Loved by 500+ Salon Owners & Managers
                </h2>
                <p style={{ fontSize: "1.1rem", color: "#94a3b8", maxWidth: 640, margin: "0 auto" }}>
                  Real feedback from top salon directors scaling their branches, stylists, and revenue with Salon Nest.
                </p>
              </div>

              {/* TRACK 1: Infinite Marquee Roller (Leftwards) */}
              <div className="marketing-marquee-container">
                <div className="marketing-marquee-track">
                  {[...testimonialsList, ...testimonialsList].map((t, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        width: 380, 
                        flexShrink: 0, 
                        background: "rgba(30, 41, 59, 0.85)", 
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        borderRadius: 18, 
                        padding: 24, 
                        border: "1px solid rgba(255, 255, 255, 0.1)", 
                        boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between"
                      }}
                    >
                      <div>
                        {/* Rating & Metric badge */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                          <div style={{ display: "flex", gap: 2, color: "#f59e0b", fontSize: 14 }}>
                            {"★".repeat(t.rating)}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(13,148,136,0.25)", color: "#2dd4bf", padding: "2px 8px", borderRadius: 6, border: "1px solid rgba(45,212,191,0.3)" }}>
                            {t.metric}
                          </span>
                        </div>

                        {/* Quote */}
                        <p style={{ fontSize: 13.5, color: "#e2e8f0", lineHeight: 1.65, margin: "0 0 18px", fontStyle: "normal" }}>
                          "{t.text}"
                        </p>
                      </div>

                      {/* Author Info */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 14 }}>
                        <img src={t.avatar} alt={t.name} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid #0d9488" }} />
                        <div style={{ overflow: "hidden" }}>
                          <div style={{ fontWeight: 700, color: "#ffffff", fontSize: 14, display: "flex", alignItems: "center", gap: 4 }}>
                            {t.name} <CheckCircle2 size={13} color="#2dd4bf" />
                          </div>
                          <div style={{ fontSize: 11.5, color: "#94a3b8", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                            {t.role} • {t.salon} ({t.city})
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TRACK 2: Reverse Infinite Marquee Roller (Rightwards) */}
              <div className="marketing-marquee-container" style={{ marginTop: 16 }}>
                <div className="marketing-marquee-track-reverse">
                  {[...testimonialsList.slice().reverse(), ...testimonialsList.slice().reverse()].map((t, index) => (
                    <div 
                      key={`rev-${index}`} 
                      style={{ 
                        width: 380, 
                        flexShrink: 0, 
                        background: "rgba(30, 41, 59, 0.85)", 
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        borderRadius: 18, 
                        padding: 24, 
                        border: "1px solid rgba(255, 255, 255, 0.1)", 
                        boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between"
                      }}
                    >
                      <div>
                        {/* Rating & Metric badge */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                          <div style={{ display: "flex", gap: 2, color: "#f59e0b", fontSize: 14 }}>
                            {"★".repeat(t.rating)}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(56,189,248,0.2)", color: "#38bdf8", padding: "2px 8px", borderRadius: 6, border: "1px solid rgba(56,189,248,0.3)" }}>
                            {t.metric}
                          </span>
                        </div>

                        {/* Quote */}
                        <p style={{ fontSize: 13.5, color: "#e2e8f0", lineHeight: 1.65, margin: "0 0 18px", fontStyle: "normal" }}>
                          "{t.text}"
                        </p>
                      </div>

                      {/* Author Info */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 14 }}>
                        <img src={t.avatar} alt={t.name} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid #38bdf8" }} />
                        <div style={{ overflow: "hidden" }}>
                          <div style={{ fontWeight: 700, color: "#ffffff", fontSize: 14, display: "flex", alignItems: "center", gap: 4 }}>
                            {t.name} <CheckCircle2 size={13} color="#38bdf8" />
                          </div>
                          <div style={{ fontSize: 11.5, color: "#94a3b8", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                            {t.role} • {t.salon} ({t.city})
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </section>

            {/* COMPARISON: OLD WAYS VS SALON NEST */}
            <section style={{ padding: "80px 24px", background: "#ffffff" }}>
              <div style={{ maxWidth: 1040, margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: 48 }}>
                  <div style={{ display: "inline-block", padding: "6px 16px", background: "#f0fdfa", border: "1px solid #ccfbf1", color: "#0f766e", borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 14 }}>
                    THE SALON NEST ADVANTAGE
                  </div>
                  <h3 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#0f172a", margin: "0 0 12px" }}>
                    Why Salons Upgrade to Salon Nest
                  </h3>
                  <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>
                    See how modern cloud operations outperform outdated desktop software and manual paperwork.
                  </p>
                </div>

                <div style={{ border: "1px solid #e2e8f0", borderRadius: 20, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
                  <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", width: "100%" }}>
                    <div style={{ minWidth: 640 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.4fr 1.4fr", background: "#f8fafc", padding: "16px 24px", borderBottom: "1px solid #e2e8f0", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "#475569" }}>
                        <div>Operational Area</div>
                        <div>Traditional / Legacy Tools</div>
                        <div style={{ color: "#0d9488" }}>✨ Salon Nest Platform</div>
                      </div>

                      {comparisonPoints.map((row, idx) => (
                        <div key={idx} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.4fr 1.4fr", padding: "18px 24px", borderBottom: idx < comparisonPoints.length - 1 ? "1px solid #f1f5f9" : "none", alignItems: "center", background: idx % 2 === 0 ? "#ffffff" : "#fcfcfc" }}>
                          <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>{row.feature}</div>
                          <div style={{ color: "#dc2626", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontWeight: 800 }}>✕</span> {row.old}
                          </div>
                          <div style={{ color: "#0d9488", fontWeight: 600, fontSize: 13.5, display: "flex", alignItems: "center", gap: 6 }}>
                            <CheckCircle2 size={16} color="#0d9488" style={{ flexShrink: 0 }} /> {row.nest}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* FREQUENTLY ASKED QUESTIONS (ACCORDION) */}
            <section style={{ padding: "80px 24px", background: "#f8fafc" }}>
              <div style={{ maxWidth: 840, margin: "0 auto" }}>
                
                <div style={{ textAlign: "center", marginBottom: 44 }}>
                  <div style={{ display: "inline-block", padding: "6px 16px", background: "#f0fdfa", border: "1px solid #ccfbf1", color: "#0f766e", borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 14 }}>
                    FAQS
                  </div>
                  <h3 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#0f172a", margin: "0 0 12px" }}>
                    Frequently Asked Questions
                  </h3>
                  <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>
                    Have questions? We have answers to help you choose the right platform with full confidence.
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {faqs.map((faq, index) => {
                    const isOpen = openFaqIndex === index;
                    return (
                      <div key={index} className="faq-accordion-item">
                        <div 
                          className="faq-accordion-header" 
                          onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                        >
                          <span>{faq.q}</span>
                          <ChevronDown 
                            size={18} 
                            style={{ 
                              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", 
                              transition: "transform 0.25s ease",
                              color: isOpen ? "#0d9488" : "#94a3b8",
                              flexShrink: 0,
                              marginLeft: 12
                            }} 
                          />
                        </div>
                        {isOpen && (
                          <div className="faq-accordion-content">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            </section>
          </>
        )}

        {/* =========================================================================
            FEATURES DIRECTORY PAGE (OVERHAULED FULL CAPABILITIES)
           ========================================================================= */}
        {isFeatures && (
          <section style={{ padding: "70px 24px 90px", maxWidth: 1240, margin: "0 auto" }}>
            
            {/* Features Page Hero */}
            <div style={{ textAlign: "center", marginBottom: 44 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 16px", background: "#f0fdfa", border: "1px solid #ccfbf1", color: "#0f766e", borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16 }}>
                <Sparkles size={13} /> COMPLETE SALON OPERATING SYSTEM
              </div>
              <h1 className="marketing-hero-heading" style={{ margin: "0 0 16px" }}>
                Every Single Tool Engineered for Real Salon Operations
              </h1>
              <p style={{ fontSize: "1.15rem", color: "#64748b", maxWidth: 720, margin: "0 auto" }}>
                No useless bloat. 8 core operational modules connecting directly to your bookings, retail sales, stylist incentives, and multi-branch revenue.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 44 }}>
              {featureCategoriesList.map(cat => {
                const isSelected = selectedFeatureCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedFeatureCategory(cat)}
                    style={{
                      padding: "8px 18px",
                      borderRadius: 100,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      border: isSelected ? "1.5px solid #0d9488" : "1px solid #e2e8f0",
                      background: isSelected ? "#0d9488" : "#ffffff",
                      color: isSelected ? "#ffffff" : "#475569",
                      boxShadow: isSelected ? "0 4px 14px rgba(13,148,136,0.25)" : "0 2px 4px rgba(0,0,0,0.02)"
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* 8 Full Deep Features Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 28, marginBottom: 60 }}>
              {filteredFeatures.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div 
                    key={idx}
                    className="marketing-card-glass"
                    style={{ 
                      borderRadius: 22, 
                      padding: "32px 28px", 
                      border: "1px solid #e2e8f0",
                      background: "#ffffff",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "transform 0.25s ease, box-shadow 0.25s ease"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 18px 40px rgba(0,0,0,0.08)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.04)"; }}
                  >
                    <div>
                      {/* Top Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: feat.bg, display: "flex", alignItems: "center", justifyContent: "center", color: feat.color, border: `1px solid ${feat.color}30` }}>
                          <Icon size={24} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", padding: "4px 10px", borderRadius: 6, background: feat.bg, color: feat.color, letterSpacing: "0.04em" }}>
                          {feat.tag}
                        </span>
                      </div>

                      <div style={{ fontSize: 12, fontWeight: 700, color: feat.color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                        {feat.category}
                      </div>

                      <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>
                        {feat.title}
                      </h3>

                      <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.6, margin: "0 0 20px" }}>
                        {feat.desc}
                      </p>

                      {/* Items Checkmarks */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid #f1f5f9", paddingTop: 18 }}>
                        {feat.items.map((item, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "#334155", fontWeight: 500, lineHeight: 1.4 }}>
                            <CheckCircle2 size={15} color={feat.color} style={{ flexShrink: 0, marginTop: 2 }} />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
                      <Link 
                        to="/book-demo" 
                        style={{ 
                          display: "inline-flex", 
                          alignItems: "center", 
                          gap: 6, 
                          fontSize: 13, 
                          fontWeight: 700, 
                          color: feat.color, 
                          textDecoration: "none" 
                        }}
                      >
                        Explore in Live Demo &rarr;
                      </Link>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Bottom Highlight Deck */}
            <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderRadius: 24, padding: "40px", color: "#fff", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 28, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: "#2dd4bf", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                  ZERO LAG ARCHITECTURE
                </div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 8px" }}>
                  Runs smoothly on iPads, Tablets & POS Desktops
                </h3>
                <p style={{ fontSize: 13.5, color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>
                  No local server installations or synchronization failures. Real-time encryption with 99.98% cloud SLA.
                </p>
              </div>

              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <Link to="/book-demo" className="btn-glow-primary" style={{ textDecoration: "none", fontSize: 14, padding: "14px 28px", borderRadius: 12, display: "inline-flex", alignItems: "center", gap: 8 }}>
                  Book 1-on-1 Walkthrough <ArrowRight size={16} />
                </Link>
              </div>
            </div>

          </section>
        )}

        {/* =========================================================================
            PRICING PAGE (OVERHAULED TRANSPARENT TIERS & COMPARISON)
           ========================================================================= */}
        {isPricing && (
          <section style={{ padding: "70px 24px 90px", maxWidth: 1240, margin: "0 auto" }}>
            
            {/* Pricing Hero */}
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 16px", background: "#f0fdfa", border: "1px solid #ccfbf1", color: "#0f766e", borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16 }}>
                TRANSPARENT PRICING
              </div>
              <h1 className="marketing-hero-heading" style={{ margin: "0 0 16px" }}>
                Invest in Predictable Growth with Zero Hidden Fees
              </h1>
              <p style={{ fontSize: "1.15rem", color: "#64748b", maxWidth: 680, margin: "0 auto 28px" }}>
                Choose the plan engineered for your salon stage. Free onboarding, free staff training, and unlimited software updates included.
              </p>

              {/* Monthly vs Annual Toggle */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#f1f5f9", padding: "6px 10px", borderRadius: 100, border: "1px solid #e2e8f0" }}>
                <button
                  type="button"
                  onClick={() => setIsAnnualBilling(false)}
                  style={{
                    padding: "8px 20px",
                    borderRadius: 100,
                    fontSize: 13.5,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background: !isAnnualBilling ? "#ffffff" : "transparent",
                    color: !isAnnualBilling ? "#0f172a" : "#64748b",
                    boxShadow: !isAnnualBilling ? "0 2px 8px rgba(0,0,0,0.08)" : "none"
                  }}
                >
                  Monthly Billing
                </button>
                <button
                  type="button"
                  onClick={() => setIsAnnualBilling(true)}
                  style={{
                    padding: "8px 20px",
                    borderRadius: 100,
                    fontSize: 13.5,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background: isAnnualBilling ? "#0d9488" : "transparent",
                    color: isAnnualBilling ? "#ffffff" : "#64748b",
                    boxShadow: isAnnualBilling ? "0 2px 8px rgba(13,148,136,0.3)" : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  Annual Billing <span style={{ fontSize: 10.5, background: isAnnualBilling ? "rgba(255,255,255,0.25)" : "#dcfce7", color: isAnnualBilling ? "#fff" : "#15803d", padding: "2px 6px", borderRadius: 10, fontWeight: 800 }}>SAVE 20%</span>
                </button>
              </div>
            </div>

            {/* Plans Cards Grid */}
            <div className="marketing-plans-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 28, marginBottom: 70 }}>
              {plans.map((plan, idx) => {
                const displayPrice = isAnnualBilling
                  ? Math.round(Number(plan.yearlyPrice) / 12)
                  : Number(plan.monthlyPrice);

                return (
                  <div 
                    key={plan.id || idx} 
                    style={{ 
                      background: "#ffffff", 
                      borderRadius: 24, 
                      padding: "36px 32px", 
                      border: plan.isPopular ? "2px solid #0d9488" : "1px solid #e2e8f0", 
                      position: "relative", 
                      boxShadow: plan.isPopular ? "0 20px 50px rgba(13,148,136,0.18)" : "0 6px 20px rgba(0,0,0,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}
                  >
                    {plan.isPopular && (
                      <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #0d9488, #14b8a6)", color: "#fff", padding: "4px 18px", borderRadius: 100, fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", boxShadow: "0 4px 12px rgba(13,148,136,0.3)" }}>
                        ⭐ MOST POPULAR FOR SALONS
                      </div>
                    )}

                    <div>
                      <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
                        {plan.name}
                      </h3>
                      <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px", minHeight: 38 }}>
                        {plan.tagline}
                      </p>

                      {/* Pricing Tag */}
                      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                        <span style={{ fontSize: 22, color: "#64748b", fontWeight: 700 }}>{currencySymbol}</span>
                        <span style={{ fontSize: "2.8rem", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em" }}>
                          {displayPrice.toLocaleString("en-IN")}
                        </span>
                        <span style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>/month</span>
                      </div>
                      
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 24 }}>
                        {isAnnualBilling 
                          ? `Billed annually at ${currencySymbol}${Number(plan.yearlyPrice).toLocaleString("en-IN")}/yr`
                          : "Billed monthly. Cancel anytime."}
                      </div>

                      {/* Quotas Box */}
                      <div className="pricing-quotas-grid">
                        <div>
                          <span style={{ color: "#64748b" }}>Staff Logins:</span>
                          <div style={{ fontWeight: 800, color: "#0f172a" }}>{plan.userLimit} Users</div>
                        </div>
                        <div>
                          <span style={{ color: "#64748b" }}>Client Records:</span>
                          <div style={{ fontWeight: 800, color: "#0f172a" }}>{plan.customerLimit}</div>
                        </div>
                        <div>
                          <span style={{ color: "#64748b" }}>Monthly Invoices:</span>
                          <div style={{ fontWeight: 800, color: "#0f172a" }}>{plan.invoiceLimit}</div>
                        </div>
                        <div>
                          <span style={{ color: "#64748b" }}>Cloud Storage:</span>
                          <div style={{ fontWeight: 800, color: "#0f172a" }}>{plan.storageLimit} GB</div>
                        </div>
                      </div>

                      {/* Feature Checklist */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                        {plan.features.map((feat, fIdx) => (
                          <div key={fIdx} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "#334155", fontWeight: 500 }}>
                            <CheckCircle2 size={16} color="#0d9488" style={{ flexShrink: 0 }} />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Link 
                      to="/book-demo" 
                      className={plan.isPopular ? "btn-glow-primary" : "btn-glow-dark"} 
                      style={{ 
                        display: "block", 
                        textAlign: "center", 
                        padding: "14px", 
                        borderRadius: 12, 
                        fontSize: 14.5, 
                        fontWeight: 700,
                        textDecoration: "none" 
                      }}
                    >
                      Get Started with {plan.name} &rarr;
                    </Link>

                  </div>
                );
              })}
            </div>

            {/* Enterprise Consultation Box */}
            <div style={{ background: "#f8fafc", borderRadius: 20, padding: "36px", border: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, alignItems: "center", marginBottom: 70 }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: "#0d9488", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                  LARGE ENTERPRISE OR FRANCHISE?
                </div>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
                  Need custom multi-city onboarding or private cloud hosting?
                </h3>
                <p style={{ fontSize: 13.5, color: "#64748b", margin: 0 }}>
                  We provide dedicated database instances, custom SAP/Tally integrations, and on-site staff training workshops for 10+ branch networks.
                </p>
              </div>

              <div style={{ display: "flex", gap: 14, justifyContent: "flex-end", flexWrap: "wrap" }}>
                <Link to="/contact" style={{ textDecoration: "none", fontSize: 14, fontWeight: 700, color: "#0f172a", background: "#ffffff", padding: "12px 24px", borderRadius: 10, border: "1px solid #cbd5e1" }}>
                  Contact Enterprise Team
                </Link>
                <a href={whatsappHref} target="_blank" rel="noreferrer" style={{ textDecoration: "none", fontSize: 14, fontWeight: 700, color: "#ffffff", background: "#25d366", padding: "12px 24px", borderRadius: 10, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  💬 WhatsApp Sales Desk
                </a>
              </div>
            </div>

          </section>
        )}

        {/* =========================================================================
            CONTACT US PAGE (2-COLUMN BALANCED PROFESSIONAL LAYOUT)
           ========================================================================= */}
        {isContact && (
          <section style={{ padding: "70px 24px 90px", maxWidth: 1180, margin: "0 auto" }}>
            
            {/* Contact Page Header */}
            <div style={{ textAlign: "center", marginBottom: 44 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 16px", background: "#f0fdfa", border: "1px solid #ccfbf1", color: "#0f766e", borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 14 }}>
                <HeadphonesIcon size={13} /> DIRECT SALES & SUPPORT
              </div>
              <h1 className="marketing-hero-heading" style={{ margin: "0 0 14px" }}>
                Get in Touch with Our Team
              </h1>
              <p style={{ fontSize: "1.15rem", color: "#64748b", maxWidth: 640, margin: "0 auto" }}>
                Whether you need a live demo walkthrough, data migration assistance, or support for an active account, we are ready to assist.
              </p>
            </div>

            {/* 2-Column Grid */}
            <div className="marketing-contact-grid">
              
              {/* Left Column: Interactive Contact Form */}
              <div style={{ background: "#ffffff", borderRadius: 24, padding: "36px", border: "1px solid #e2e8f0", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
                <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                  Send a Direct Message
                </h3>
                <p style={{ fontSize: 13.5, color: "#64748b", margin: "0 0 24px" }}>
                  Fill out the details below and our solution architect will reach out within 2 business hours.
                </p>

                {contactSubmitted ? (
                  <div style={{ background: "#f0fdfa", border: "1px solid #ccfbf1", borderRadius: 16, padding: "28px", textAlign: "center" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#0d9488", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                      <Check size={24} strokeWidth={3} />
                    </div>
                    <h4 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                      Inquiry Received!
                    </h4>
                    <p style={{ fontSize: 13.5, color: "#475569", margin: "0 0 20px", lineHeight: 1.6 }}>
                      Thank you, {contactForm.name}. Our salon onboarding team will call or WhatsApp you at <strong>{contactForm.phone}</strong> shortly.
                    </p>
                    <a href={whatsappHref} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#25d366", color: "#fff", padding: "10px 20px", borderRadius: 10, fontSize: 13.5, fontWeight: 700, textDecoration: "none" }}>
                      💬 Chat on WhatsApp Now
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="form-grid-2">
                      <div>
                        <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Your Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Priya Sharma"
                          value={contactForm.name}
                          onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Mobile / WhatsApp *</label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. +91 98765 43210"
                          value={contactForm.phone}
                          onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div>
                        <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Email Address</label>
                        <input
                          type="email"
                          placeholder="priya@salonstudio.in"
                          value={contactForm.email}
                          onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Salon / Spa Name</label>
                        <input
                          type="text"
                          placeholder="Luxe Studio"
                          value={contactForm.salonName}
                          onChange={e => setContactForm({ ...contactForm, salonName: e.target.value })}
                          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>City & Branch Count</label>
                      <input
                        type="text"
                        placeholder="e.g. Mumbai (2 Branches)"
                        value={contactForm.city}
                        onChange={e => setContactForm({ ...contactForm, city: e.target.value })}
                        style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>How Can We Help You?</label>
                      <textarea
                        rows={3}
                        placeholder="Tell us about your requirements, migration questions, or custom features..."
                        value={contactForm.message}
                        onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                        style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14, outline: "none", boxSizing: "border-box", resize: "vertical" }}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-glow-primary"
                      style={{
                        padding: "14px 24px",
                        borderRadius: 10,
                        fontSize: 14.5,
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        marginTop: 6
                      }}
                    >
                      <Send size={16} /> Submit Message & Request Demo
                    </button>
                  </form>
                )}
              </div>

              {/* Right Column: Corporate Headquarters & Direct Contact Card */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                
                <div style={{ background: "#0f172a", borderRadius: 24, padding: "36px 32px", color: "#ffffff", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
                  
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(20,184,166,0.2)", color: "#2dd4bf", padding: "4px 12px", borderRadius: 8, fontSize: 11, fontWeight: 800, textTransform: "uppercase", marginBottom: 20 }}>
                    <Building2 size={14} /> CORPORATE HEADQUARTERS
                  </div>

                  <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 20px", color: "#fff" }}>
                    PROPCORP ADVERTISING (OPC) PRIVATE LIMITED
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: 20, fontSize: 13.5 }}>
                    
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2dd4bf", flexShrink: 0 }}>
                        <MapPin size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Registered Office Address</div>
                        <div style={{ color: "#e2e8f0", lineHeight: 1.5 }}>
                          PLOT NO G-49 MADHURA NAGAR,<br/>
                          HYDERABAD, Telangana, India - 500003
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#38bdf8", flexShrink: 0 }}>
                        <Phone size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Direct Support & Sales Line</div>
                        <a href="tel:9493952587" style={{ color: "#ffffff", fontWeight: 700, textDecoration: "none", fontSize: 15 }}>
                          +91 9493952587
                        </a>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#a78bfa", flexShrink: 0 }}>
                        <Mail size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Official Correspondence</div>
                        <a href="mailto:govardhan@salonnest.in" style={{ color: "#2dd4bf", fontWeight: 600, textDecoration: "none" }}>
                          govardhan@salonnest.in
                        </a>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#4ade80", flexShrink: 0 }}>
                        <Clock size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Operational Hours</div>
                        <div style={{ color: "#cbd5e1" }}>Mon - Sat: 9:30 AM to 8:00 PM IST</div>
                      </div>
                    </div>

                  </div>

                  <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                    <a 
                      href={whatsappHref} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        gap: 8, 
                        background: "#25d366", 
                        color: "#fff", 
                        padding: "12px", 
                        borderRadius: 12, 
                        fontWeight: 700, 
                        fontSize: 14, 
                        textDecoration: "none" 
                      }}
                    >
                      <span>💬</span> Direct WhatsApp Chat
                    </a>
                  </div>

                </div>

                {/* Trust SLA Card */}
                <div style={{ background: "#f8fafc", borderRadius: 18, padding: "20px 24px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669", flexShrink: 0 }}>
                    <ShieldCheck size={20} />
                  </div>
                  <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.5 }}>
                    <strong style={{ color: "#0f172a" }}>99.98% Cloud Uptime Guarantee:</strong> Your salon POS will never freeze during rush-hour billing.
                  </div>
                </div>

              </div>

            </div>

          </section>
        )}

        {/* ULTRA-LUXURY CALL TO ACTION BANNER (Shown across pages) */}
        <section style={{ padding: "90px 24px", background: "linear-gradient(135deg, #0f172a 0%, #134e4a 60%, #0f172a 100%)", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, right: "10%", width: 350, height: 350, background: "rgba(20,184,166,0.15)", filter: "blur(90px)", borderRadius: "50%", pointerEvents: "none" }} />
          
          <div style={{ maxWidth: 840, margin: "0 auto", position: "relative", zIndex: 2 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 16px", background: "rgba(20,184,166,0.2)", border: "1px solid rgba(20,184,166,0.4)", color: "#2dd4bf", borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 20 }}>
              <Flame size={14} /> ZERO RISK ONBOARDING
            </div>

            <h2 className="marketing-section-heading" style={{ color: "#ffffff", margin: "0 0 16px" }}>
              Ready to take complete control of your salon business?
            </h2>

            <p style={{ fontSize: "1.15rem", color: "#cbd5e1", lineHeight: 1.7, marginBottom: 36, maxWidth: 640, margin: "0 auto 36px" }}>
              Join 500+ salon directors who run peaceful, profitable, multi-branch operations on Salon Nest. Book your live personalized walkthrough today.
            </p>

            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/book-demo" className="btn-glow-primary" style={{ textDecoration: "none", fontSize: 16, padding: "16px 36px", borderRadius: 12, display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={18} /> Request Live Demo
              </Link>
              <a href={whatsappHref} target="_blank" rel="noreferrer" style={{ textDecoration: "none", fontSize: 16, fontWeight: 700, color: "#ffffff", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", padding: "16px 32px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)", display: "inline-flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}>
                💬 Chat on WhatsApp
              </a>
            </div>

            <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", marginTop: 32, color: "#94a3b8", fontSize: 13, fontWeight: 500 }}>
              <span>✓ 14-Day Free Evaluation</span>
              <span>✓ Free Data Import Assistance</span>
              <span>✓ Dedicated Staff Training</span>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer style={{ background: "#090d16", color: "#94a3b8", padding: "70px 24px 36px", borderTop: "1px solid rgba(255,255,255,0.08)", position: "relative", overflow: "hidden" }}>
        {/* Subtle Ambient Backlight */}
        <div style={{ position: "absolute", top: 0, left: "25%", width: 450, height: 220, background: "rgba(13,148,136,0.1)", filter: "blur(100px)", pointerEvents: "none" }} />
        
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          
          {/* Main 4-Column Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 40, marginBottom: 48 }}>
            
            {/* Col 1: Brand & Mission */}
            <div style={{ maxWidth: 320 }}>
              <Link to="/" style={{ display: "inline-block", marginBottom: 18, background: "#ffffff", padding: "6px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)" }}>
                <img src="/logo.jfif" alt="Salon Nest Logo" style={{ maxHeight: "36px", maxWidth: "130px", objectFit: "contain", display: "block" }} />
              </Link>
              <p style={{ fontSize: 13.5, color: "#94a3b8", lineHeight: 1.7, margin: "0 0 20px" }}>
                The intelligent all-in-one operating platform engineered for modern hair salons, luxury day spas, and aesthetic wellness chains.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5, color: "#cbd5e1" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ShieldCheck size={16} color="#2dd4bf" />
                  <span>256-Bit Bank-Grade Cloud Encryption</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Zap size={16} color="#38bdf8" />
                  <span>99.98% High Availability Uptime SLA</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>🇮🇳</span>
                  <span>Engineered with Pride in India</span>
                </div>
              </div>
            </div>

            {/* Col 2: Platform Modules */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 18 }}>
                Platform Modules
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12, fontSize: 13.5 }}>
                <li><Link to="/features" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#2dd4bf"} onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>Smart POS & Invoicing</Link></li>
                <li><Link to="/features" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#2dd4bf"} onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>Collision-Free Calendar</Link></li>
                <li><Link to="/features" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#2dd4bf"} onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>Digital Storefront & E-Commerce</Link></li>
                <li><Link to="/features" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#2dd4bf"} onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>Customer CRM & Loyalty Ledger</Link></li>
                <li><Link to="/features" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#2dd4bf"} onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>Multi-Branch Central Sync</Link></li>
                <li><Link to="/features" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#2dd4bf"} onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>Facial Attendance & Commissions</Link></li>
              </ul>
            </div>

            {/* Col 3: Industries */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 18 }}>
                Built For
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12, fontSize: 13.5 }}>
                <li style={{ color: "#94a3b8" }}>Hair Salons & Barbers</li>
                <li style={{ color: "#94a3b8" }}>Day Spas & Wellness Retreats</li>
                <li style={{ color: "#94a3b8" }}>Nail Bars & Lash Lounges</li>
                <li style={{ color: "#94a3b8" }}>Aesthetic & Skin Clinics</li>
                <li style={{ color: "#94a3b8" }}>Tattoo & Piercing Studios</li>
                <li style={{ color: "#94a3b8" }}>Bridal Makeup Lounges</li>
              </ul>
            </div>

            {/* Col 4: Company & Direct Support */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 18 }}>
                Company & Support
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12, fontSize: 13.5, marginBottom: 20 }}>
                <li><Link to="/pricing" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#2dd4bf"} onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>Plans & Transparent Pricing</Link></li>
                <li><Link to="/book-demo" style={{ color: "#2dd4bf", fontWeight: 700, textDecoration: "none" }}>Request Live Demo &rarr;</Link></li>
                <li><Link to="/terms" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#2dd4bf"} onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>Terms of Service</Link></li>
                <li><Link to="/privacy-policy" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#2dd4bf"} onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>Privacy Policy</Link></li>
                <li><Link to="/contact" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#2dd4bf"} onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>Contact Support</Link></li>
              </ul>

              {/* Status Badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", padding: "6px 14px", borderRadius: 100, fontSize: 11.5, color: "#86efac", fontWeight: 700 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                All Systems Operational
              </div>
            </div>

          </div>

          {/* Registered Corporate Office Details Box */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 28, marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>
                PROPCORP ADVERTISING (OPC) PRIVATE LIMITED
              </div>
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
                PLOT NO G-49 MADHURA NAGAR, HYDERABAD, Telangana, India - 500003<br/>
                Direct Helpline: <span style={{ color: "#94a3b8" }}>+91 9493952587</span> • Official Email: <a href="mailto:govardhan@salonnest.in" style={{ color: "#2dd4bf", textDecoration: "none" }}>govardhan@salonnest.in</a>
              </div>
            </div>

            <div style={{ textAlign: "right", fontSize: 12, color: "#64748b" }}>
              © {new Date().getFullYear()} PROPCORP ADVERTISING (OPC) PRIVATE LIMITED. All rights reserved.<br/>
              <span style={{ fontSize: 11, color: "#475569" }}>Empowering salons with enterprise cloud intelligence.</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
