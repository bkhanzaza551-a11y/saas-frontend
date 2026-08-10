import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ShoppingBag, Clock, CheckCircle2, XCircle, Package,
  ChevronRight, Search, RefreshCw, FileText, X, AlertTriangle,
  CreditCard, User, Phone, Tag, ArrowRight, Banknote,
  Calendar, Star, TrendingUp, Eye, Check, Ban, Bell, CalendarDays, Users, Timer, Info
} from "lucide-react";
import { api } from "../../api/client";
import { useBranch } from "../../context/BranchContext";
import { formatApiError } from "../../utils/apiError";
import PageLoader from "../../components/PageLoader";

const fmt = (v) =>
  Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const STATUS_META = {
  NEW: {
    label: "Pending",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fcd34d",
    dot: "#f59e0b",
    icon: Clock,
  },
  ACCEPTED: {
    label: "Confirmed",
    color: "#0369a1",
    bg: "#e0f2fe",
    border: "#7dd3fc",
    dot: "#0284c7",
    icon: CheckCircle2,
  },
  READY: {
    label: "In Progress",
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#c4b5fd",
    dot: "#7c3aed",
    icon: Timer,
  },
  COMPLETED: {
    label: "Completed",
    color: "#166534",
    bg: "#dcfce7",
    border: "#86efac",
    dot: "#22c55e",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "#991b1b",
    bg: "#fee2e2",
    border: "#fca5a5",
    dot: "#ef4444",
    icon: XCircle,
  },
};

const PAYMENT_META = {
  PENDING: { label: "Pay at Salon", color: "#6366f1", bg: "#e0e7ff" }, // Most storefront bookings will be this
  PAID:    { label: "Paid",    color: "#166534", bg: "#dcfce7" },
  FAILED:  { label: "Failed",  color: "#991b1b", bg: "#fee2e2" },
  REFUNDED:{ label: "Refunded",color: "#4338ca", bg: "#e0e7ff" },
};

const NEXT_STATUS = {
  NEW:     "ACCEPTED",
  ACCEPTED:   "READY",
  READY: "COMPLETED",
};

const STATUS_TABS = ["ALL", "NEW", "ACCEPTED", "READY", "COMPLETED", "CANCELLED"];

export default function EcommerceOrdersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedBranchId } = useBranch();

  const [rows, setRows]       = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [statusMsg, setStatusMsg] = useState({ error: "", success: "" });
  const [search, setSearch]   = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [assigningOrder, setAssigningOrder] = useState(null);

  const activeTab = useMemo(() => {
    const path = location.pathname;
    if (path.endsWith("/pending"))     return "NEW";
    if (path.endsWith("/confirmed"))   return "ACCEPTED";
    if (path.endsWith("/in-progress")) return "READY";
    if (path.endsWith("/completed"))   return "COMPLETED";
    if (path.endsWith("/cancelled"))   return "CANCELLED";
    return "ALL";
  }, [location.pathname]);

  const tabPath = (t) => {
    if (t === "ALL") return "/admin/order-dashboard";
    if (t === "NEW") return "/admin/order-dashboard/pending";
    if (t === "ACCEPTED") return "/admin/order-dashboard/confirmed";
    if (t === "READY") return "/admin/order-dashboard/in-progress";
    if (t === "COMPLETED") return "/admin/order-dashboard/completed";
    if (t === "CANCELLED") return "/admin/order-dashboard/cancelled";
    return "/admin/order-dashboard";
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const bp = selectedBranchId ? { branchId: selectedBranchId } : {};
      const statusParam = activeTab !== "ALL" ? { status: activeTab } : {};
      const [ordersRes, summaryRes] = await Promise.all([
        api.get("/owner/orders", { params: { ...bp, ...statusParam } }),
        api.get("/owner/orders/reports/summary", { params: bp }),
      ]);
      setRows(ordersRes.data?.orders || ordersRes.data || []);
      setSummary(summaryRes.data);
    } catch (err) {
      setStatusMsg({ error: formatApiError(err, "Could not load bookings"), success: "" });
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedBranchId]);

  useEffect(() => { void load(); }, [load]);

  const openDetail = async (booking) => {
    setSelectedBooking(booking);
    setDetailLoading(true);
    try {
      const res = await api.get(`/owner/orders/${booking.id}`);
      setSelectedBooking(res.data);
    } catch {
      // use the already-available partial data
    } finally {
      setDetailLoading(false);
    }
  };

  const doAction = async (id, action, payload = {}) => {
    setActionLoading(id + action);
    setStatusMsg({ error: "", success: "" });
    try {
      if (action === "cancel") {
        await api.patch(`/owner/orders/${id}/cancel`, { note: "Cancelled from owner panel" });
        setStatusMsg({ error: "", success: "Booking cancelled successfully." });
      } else if (action === "reminder") {
        setStatusMsg({ error: "", success: "Reminder sent to client." });
      } else {
        await api.patch(`/owner/orders/${id}/status`, { status: action, ...payload });
        setStatusMsg({ error: "", success: `Booking moved to ${action}.` });
      }
      if (selectedBooking?.id === id) setSelectedBooking(null);
      await load();
    } catch (err) {
      setStatusMsg({ error: formatApiError(err, "Action failed"), success: "" });
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.orderNumber?.toLowerCase().includes(q) ||
        r.customerName?.toLowerCase().includes(q) ||
        r.customerPhone?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <div
      className="page-shell"
      style={{ display: "flex", flexDirection: "column", gap: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}
    >
      {/* Premium Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          padding: "32px 40px",
          color: "white",
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 24,
            flexWrap: "wrap",
            maxWidth: 1600,
            margin: '0 auto'
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: 12,
                  padding: 10,
                  display: "flex",
                  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2)'
                }}
              >
                <CalendarDays size={24} color="#fff" />
              </div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "2rem",
                  fontWeight: 700,
                  letterSpacing: "-0.5px",
                }}
              >
                Storefront Bookings
              </h1>
            </div>
            <p style={{ margin: 0, opacity: 0.9, fontSize: 15, fontWeight: 300, maxWidth: 600, lineHeight: 1.5 }}>
              Manage online service reservations from your storefront. Approve, track, and complete appointments seamlessly.
            </p>
          </div>
          <button
            onClick={load}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "white",
              border: "none",
              borderRadius: 8,
              color: "#4f46e5",
              padding: "10px 20px",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
          >
            <RefreshCw size={16} /> Sync Bookings
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 16,
              marginTop: 32,
              maxWidth: 1600,
              margin: '32px auto 0'
            }}
          >
            {[
              { label: "Total Bookings", value: summary.totalOrders, icon: Calendar, color: "#fff" },
              { label: "Pending",        value: summary.newOrders || 0, icon: Clock,       color: "#fde68a" },
              { label: "Confirmed",      value: summary.acceptedOrders || 0, icon: CheckCircle2, color: "#bae6fd" },
              { label: "In Progress",    value: summary.readyOrders || 0, icon: Timer, color: "#ddd6fe" },
              { label: "Completed",      value: summary.completedOrders, icon: CheckCircle2, color: "#bbf7d0" },
              { label: "Revenue",        value: `₹${fmt(summary.totalSales)}`, icon: TrendingUp, color: "#fff", isMoney: true },
            ].map((c) => (
              <div
                key={c.label}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 12,
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 10, display: 'flex' }}>
                  <c.icon size={20} color={c.color} />
                </div>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: c.color, marginTop: 4 }}>
                    {c.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tab Bar */}
      <div
        style={{
          display: "flex",
          gap: 8,
          borderBottom: "1px solid #e2e8f0",
          background: "white",
          padding: "0 40px",
          overflowX: "auto",
        }}
      >
        <div style={{ display: 'flex', maxWidth: 1600, margin: '0 auto', width: '100%', gap: 32 }}>
          {STATUS_TABS.map((tab) => {
            const meta = STATUS_META[tab];
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => navigate(tabPath(tab))}
                style={{
                  padding: "16px 8px",
                  border: "none",
                  borderBottom: isActive
                    ? `3px solid ${tab === "ALL" ? "#4f46e5" : meta.color}`
                    : "3px solid transparent",
                  background: "transparent",
                  cursor: "pointer",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive
                    ? tab === "ALL" ? "#4f46e5" : meta.color
                    : "#64748b",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
                  marginBottom: -1,
                }}
              >
                {meta && <meta.icon size={16} />}
                {tab === "ALL" ? "All Bookings" : meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Messages */}
      {(statusMsg.error || statusMsg.success) && (
        <div style={{ maxWidth: 1600, margin: '24px auto 0', width: 'calc(100% - 80px)' }}>
          <div
            style={{
              padding: "16px 20px",
              borderRadius: 8,
              background: statusMsg.error ? "#fef2f2" : "#f0fdf4",
              color: statusMsg.error ? "#991b1b" : "#166534",
              fontSize: 14,
              fontWeight: 500,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              border: `1px solid ${statusMsg.error ? "#fca5a5" : "#86efac"}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {statusMsg.error ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              <span>{statusMsg.error || statusMsg.success}</span>
            </div>
            <button
              onClick={() => setStatusMsg({ error: "", success: "" })}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "inherit",
                fontSize: 18,
                padding: 4,
                display: 'flex'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          padding: "32px 40px",
          display: "flex",
          gap: 32,
          minHeight: 0,
          maxWidth: 1600,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* Bookings List */}
        <div style={{ flex: "1 1 55%", minWidth: 0 }}>
          <div style={{ position: "relative", marginBottom: 24 }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
              }}
            />
            <input
              type="text"
              placeholder="Search by booking number, client name, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px 14px 44px",
                border: "1px solid #cbd5e1",
                borderRadius: 12,
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                background: "white",
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
              onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
            />
          </div>

          {loading ? (
            <PageLoader
              title="Loading bookings"
              message="Preparing your booking queue..."
            />
          ) : filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "80px 24px",
                background: "white",
                borderRadius: 16,
                border: "1px dashed #cbd5e1",
              }}
            >
              <CalendarDays size={56} color="#e2e8f0" style={{ marginBottom: 16 }} />
              <p
                style={{
                  margin: "0 0 8px",
                  fontWeight: 600,
                  color: "#1e293b",
                  fontSize: 18,
                }}
              >
                No service bookings found
              </p>
              <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
                {activeTab === "ALL"
                  ? "When customers book services from your storefront, they'll appear here."
                  : `No ${STATUS_META[activeTab]?.label} bookings at the moment.`}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filtered.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  isSelected={selectedBooking?.id === booking.id}
                  actionLoading={actionLoading}
                  onSelect={() => openDetail(booking)}
                  onAction={doAction}
                  onAssign={setAssigningOrder}
                />
              ))}
            </div>
          )}
        </div>

        {/* Booking Detail Panel */}
        <div
          style={{
            flex: "1 1 45%",
            minWidth: 360,
            position: "sticky",
            top: 32,
            alignSelf: "flex-start",
            maxHeight: "calc(100vh - 100px)",
            overflowY: "auto",
            borderRadius: 16,
            scrollbarWidth: 'none'
          }}
        >
          {!selectedBooking ? (
            <div
              style={{
                background: "white",
                border: "1px dashed #cbd5e1",
                borderRadius: 16,
                padding: "80px 32px",
                textAlign: "center",
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Eye size={48} color="#e2e8f0" style={{ marginBottom: 16 }} />
              <p
                style={{
                  margin: "0 0 8px",
                  fontWeight: 600,
                  color: "#1e293b",
                  fontSize: 16,
                }}
              >
                Select a booking to view details
              </p>
              <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
                Service details, client info, payment status, and history will appear here.
              </p>
            </div>
          ) : (
            <BookingDetailPanel
              booking={selectedBooking}
              loading={detailLoading}
              actionLoading={actionLoading}
              onClose={() => setSelectedBooking(null)}
              onAction={doAction}
              onAssign={setAssigningOrder}
            />
          )}
        </div>
      </div>
      
      {assigningOrder && (
        <AssignStaffPopup
          booking={assigningOrder}
          onClose={() => setAssigningOrder(null)}
          onSuccess={() => { setAssigningOrder(null); load(); setSelectedBooking(null); }}
        />
      )}
    </div>
  );
}

// ─── BookingCard ──────────────────────────────────────────────────────────────
function BookingCard({ booking, isSelected, actionLoading, onSelect, onAction, onAssign }) {
  const sm = STATUS_META[booking.status] || STATUS_META.PENDING;
  const pm = PAYMENT_META[booking.paymentStatus] || PAYMENT_META.PENDING;
  const nextStatus = NEXT_STATUS[booking.status];
  const isLoading = (s) => actionLoading === booking.id + s;

  return (
    <div
      onClick={onSelect}
      style={{
        background: "white",
        border: `1px solid ${isSelected ? "#4f46e5" : "#e2e8f0"}`,
        borderRadius: 16,
        padding: 20,
        cursor: "pointer",
        transition: "all 0.2s",
        boxShadow: isSelected ? "0 4px 12px rgba(79, 70, 229, 0.1)" : "0 1px 3px rgba(0,0,0,0.05)",
      }}
      onMouseOver={(e) => { if(!isSelected) e.currentTarget.style.borderColor = '#cbd5e1'; }}
      onMouseOut={(e) => { if(!isSelected) e.currentTarget.style.borderColor = '#e2e8f0'; }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            #{booking.orderNumber}
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 100,
                background: pm.bg,
                color: pm.color,
              }}
            >
              {pm.label}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: "#475569",
            }}
          >
            <User size={13} color="#94a3b8" /> <span style={{ fontWeight: 500 }}>{booking.customerName}</span>
            <span style={{ color: "#cbd5e1" }}>•</span>
            <Phone size={13} color="#94a3b8" /> {booking.customerPhone}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: 100,
              background: sm.bg,
              color: sm.color,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <sm.icon size={12} />
            {sm.label}
          </span>
        </div>
      </div>

      {/* Services preview */}
      {booking.items && booking.items.length > 0 && (
        <div
          style={{
            background: "#f8fafc",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 16,
            fontSize: 13,
            color: "#475569",
            border: '1px solid #f1f5f9'
          }}
        >
          {booking.items.slice(0, 2).map((item, i) => (
            <span key={i}>
              {i > 0 && <span style={{ color: "#cbd5e1", margin: '0 6px' }}>•</span>}
              <strong style={{ fontWeight: 500, color: '#334155' }}>{item.productName}</strong>
            </span>
          ))}
          {booking.items.length > 2 && (
            <span style={{ color: "#64748b", marginLeft: 4 }}>
              +{booking.items.length - 2} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: '1px solid #f1f5f9',
          paddingTop: 16
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Total</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
              ₹{fmt(booking.total)}
            </span>
          </div>
          <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Date & Time</span>
            <span style={{ fontSize: 13, color: "#334155", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
              <CalendarDays size={13} color="#94a3b8" />
              {booking.bookingDate
                ? new Date(booking.bookingDate).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : new Date(booking.createdAt).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
            </span>
          </div>
        </div>
        <div
          style={{ display: "flex", gap: 8 }}
          onClick={(e) => e.stopPropagation()}
        >
          {nextStatus && booking.status !== "CANCELLED" && (booking.source !== "SERVICE_BOOKING" || booking.status === "NEW") && (
            <ActionBtn
              loading={isLoading(nextStatus)}
              onClick={() => {
                if (booking.source === "SERVICE_BOOKING" && booking.status === "NEW") {
                  onAssign(booking);
                } else {
                  onAction(booking.id, nextStatus);
                }
              }}
              color="#fff"
              bg="#4f46e5"
              hoverBg="#4338ca"
            >
              {booking.source === "SERVICE_BOOKING" && booking.status === "NEW" ? <><Users size={14} /> Assign</> :
               nextStatus === "ACCEPTED"    ? <><Check size={14} /> Confirm</> :
               nextStatus === "READY"       ? <><Timer size={14} /> Start Service</> :
                                              <><CheckCircle2 size={14} /> Complete</>}
            </ActionBtn>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── BookingDetailPanel ────────────────────────────────────────────────────
function BookingDetailPanel({ booking, loading, actionLoading, onClose, onAction, onAssign }) {
  const sm = STATUS_META[booking.status] || STATUS_META.PENDING;
  const pm = PAYMENT_META[booking.paymentStatus] || PAYMENT_META.PENDING;
  const nextStatus = NEXT_STATUS[booking.status];
  const isLoading = (s) => actionLoading === booking.id + s;

  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "white",
          padding: "24px",
          borderBottom: '1px solid #e2e8f0',
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 20, color: '#0f172a', marginBottom: 4 }}>#{booking.orderNumber}</div>
          <div style={{ color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={12} /> Booked on {new Date(booking.createdAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: "4px 12px",
              borderRadius: 100,
              background: sm.bg,
              color: sm.color,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <sm.icon size={12} />
            {sm.label}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: 100,
              color: "#475569",
              cursor: "pointer",
              padding: "8px",
              display: "flex",
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
            onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40 }}>
          <PageLoader title="Loading booking details..." />
        </div>
      ) : (
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Action Banner */}
          {nextStatus && booking.status !== "CANCELLED" && (booking.source !== "SERVICE_BOOKING" || booking.status === "NEW") && (
            <div style={{ display: 'flex', gap: 12, padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: 'white', padding: 8, borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <Info size={20} color="#4f46e5" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Action Required</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Please update the booking status.</div>
                </div>
              </div>
              <ActionBtn
                loading={isLoading(nextStatus)}
                onClick={() => {
                  if (booking.source === "SERVICE_BOOKING" && booking.status === "NEW") {
                    onAssign(booking);
                  } else {
                    onAction(booking.id, nextStatus);
                  }
                }}
                color="#fff"
                bg="#4f46e5"
                hoverBg="#4338ca"
              >
                {booking.source === "SERVICE_BOOKING" && booking.status === "NEW" ? <><Users size={16} /> Assign Staff</> :
                 nextStatus === "ACCEPTED"    ? <><Check size={16} /> Confirm</> :
                 nextStatus === "READY"       ? <><Timer size={16} /> Start Service</> :
                                                <><CheckCircle2 size={16} /> Complete Booking</>}
              </ActionBtn>
            </div>
          )}

          {/* Client Info */}
          <Section title="Client Information" icon={User}>
            <InfoRow icon={User}  label="Full Name"  value={booking.customerName} />
            <InfoRow icon={Phone} label="Phone Number" value={booking.customerPhone} />
            {booking.customerEmail && (
              <InfoRow icon={Tag} label="Email Address" value={booking.customerEmail} />
            )}
          </Section>

          {/* Booking Info */}
          <Section title="Booking Schedule" icon={CalendarDays}>
            {booking.bookingDate ? (
              <div style={{ display: 'flex', background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', gap: 24 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 4 }}>Date</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{new Date(booking.bookingDate).toLocaleDateString("en-IN", { weekday: 'short', day: "numeric", month: "short", year: 'numeric' })}</div>
                </div>
                <div style={{ width: 1, background: '#e2e8f0' }} />
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 4 }}>Time</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{new Date(booking.bookingDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: 14 }}>No scheduled date provided.</div>
            )}
            {booking.note && (
              <div style={{ marginTop: 12, padding: 12, background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
                <strong style={{ display: 'block', marginBottom: 4 }}>Special Request:</strong>
                {booking.note}
              </div>
            )}
          </Section>

          {/* Services */}
          <Section title={`Requested Services (${booking.items?.length || 0})`} icon={ShoppingBag}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
              {(booking.items || []).map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    background: "white",
                    borderBottom: idx !== booking.items.length - 1 ? '1px solid #e2e8f0' : 'none',
                    fontSize: 14,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 600, fontSize: 12 }}>
                      {item.qty}x
                    </div>
                    <span style={{ fontWeight: 500, color: '#1e293b' }}>{item.productName}</span>
                  </div>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>₹{fmt(item.lineTotal)}</span>
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '16px 20px', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Total Amount</span>
                <span style={{ fontSize: 12, color: pm.color, fontWeight: 600, marginTop: 4 }}>{pm.label}</span>
              </div>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>₹{fmt(booking.total)}</span>
            </div>
          </Section>

          {/* Danger Zone */}
          {!["CANCELLED", "COMPLETED"].includes(booking.status) && (
            <div style={{ marginTop: 16, paddingTop: 24, borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
              <button
                onClick={() => { if(window.confirm("Are you sure you want to cancel this booking?")) onAction(booking.id, "cancel"); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#dc2626',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Ban size={16} /> Cancel Booking
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, color: "#1e293b" }}>
        <Icon size={16} color="#64748b" />
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", marginBottom: 12, fontSize: 14, alignItems: 'center' }}>
      <div style={{ width: 140, color: "#64748b", display: "flex", alignItems: "center", gap: 8 }}>
        {label}
      </div>
      <div style={{ color: "#0f172a", fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function ActionBtn({ loading, onClick, color, bg, hoverBg, children }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover && hoverBg ? hoverBg : bg,
        color,
        border: "none",
        padding: "8px 16px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        transition: "all 0.2s",
        opacity: loading ? 0.7 : 1,
        pointerEvents: loading ? "none" : "auto",
        boxShadow: hover ? '0 2px 6px rgba(0,0,0,0.1)' : 'none'
      }}
    >
      {loading ? "..." : children}
    </button>
  );
}

// ─── AssignStaffPopup ────────────────────────────────────────────────────────
function AssignStaffPopup({ booking, onClose, onSuccess }) {
  const { selectedBranchId } = useBranch();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStaff() {
      try {
        const res = await api.get("/owner/users", { params: { role: 'STAFF', branchId: selectedBranchId } });
        setStaffList(res.data.users || res.data || []);
      } catch (err) {
        setError("Failed to load staff list.");
      } finally {
        setLoading(false);
      }
    }
    loadStaff();
  }, [selectedBranchId]);

  const handleAssign = async () => {
    if (!selectedStaff) return;
    setAssigning(true);
    setError("");
    try {
      await api.patch(`/owner/orders/${booking.id}/assign-staff`, { staffUserId: selectedStaff.id });
      onSuccess();
    } catch (err) {
      setError(formatApiError(err, "Failed to assign staff."));
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "white", borderRadius: 24, width: "100%", maxWidth: 500, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh", boxShadow: "0 24px 48px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "24px 32px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>Assign Staff</h2>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.9rem" }}>Booking #{booking.orderNumber}</p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}><X size={24} /></button>
        </div>
        
        <div style={{ padding: 32, overflowY: "auto", flex: 1 }}>
          {error && (
            <div style={{ padding: 16, background: "#fee2e2", color: "#991b1b", borderRadius: 12, marginBottom: 24, fontSize: 14, display: "flex", gap: 12, alignItems: "center" }}>
              <AlertTriangle size={18} /> <span>{error}</span>
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", margin: "0 0 12px" }}>Select Available Staff</h3>
            {loading ? (
              <p style={{ color: "#64748b", fontSize: 14 }}>Loading staff...</p>
            ) : staffList.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: 14 }}>No staff found for this branch.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {staffList.map((s) => (
                  <div 
                    key={s.id} 
                    onClick={() => setSelectedStaff(s)}
                    style={{ 
                      padding: 16, 
                      borderRadius: 12, 
                      border: `2px solid ${selectedStaff?.id === s.id ? "#4f46e5" : "#e2e8f0"}`, 
                      background: selectedStaff?.id === s.id ? "#eef2ff" : "white",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontWeight: 600 }}>
                      {s.user?.name?.charAt(0) || "S"}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 15 }}>{s.user?.name}</div>
                      <div style={{ color: "#64748b", fontSize: 13 }}>{s.roleTitle || "Staff"}</div>
                    </div>
                    {selectedStaff?.id === s.id && (
                      <CheckCircle2 size={20} color="#4f46e5" style={{ marginLeft: "auto" }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "20px 32px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button onClick={onClose} style={{ padding: "12px 24px", borderRadius: 12, border: "1px solid #cbd5e1", background: "white", color: "#475569", fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <button 
            disabled={!selectedStaff || assigning} 
            onClick={handleAssign} 
            style={{ padding: "12px 24px", borderRadius: 12, border: "none", background: !selectedStaff ? "#94a3b8" : "#4f46e5", color: "white", fontWeight: 600, cursor: !selectedStaff ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}
          >
            {assigning ? "Assigning..." : "Assign & Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
