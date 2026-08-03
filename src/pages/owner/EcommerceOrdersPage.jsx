import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ShoppingBag, Clock, CheckCircle2, XCircle, Truck, Package,
  ChevronRight, Search, RefreshCw, FileText, X, AlertTriangle,
  CreditCard, User, Phone, MapPin, Tag, ArrowRight, Banknote,
  ShoppingCart, Star, TrendingUp, Eye, Check, Ban
} from "lucide-react";
import { api } from "../../api/client";
import { useBranch } from "../../context/BranchContext";
import { formatApiError } from "../../utils/apiError";
import PageLoader from "../../components/PageLoader";

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (v) =>
  Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const STATUS_META = {
  NEW: {
    label: "New",
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#c4b5fd",
    dot: "#7c3aed",
    icon: ShoppingBag,
  },
  ACCEPTED: {
    label: "Accepted",
    color: "#0369a1",
    bg: "#e0f2fe",
    border: "#7dd3fc",
    dot: "#0284c7",
    icon: CheckCircle2,
  },
  READY: {
    label: "Ready",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fcd34d",
    dot: "#f59e0b",
    icon: Package,
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
  PENDING: { label: "Pending", color: "#d97706", bg: "#fffbeb" },
  PAID:    { label: "Paid",    color: "#166534", bg: "#dcfce7" },
  FAILED:  { label: "Failed",  color: "#991b1b", bg: "#fee2e2" },
  REFUNDED:{ label: "Refunded",color: "#4338ca", bg: "#e0e7ff" },
};

const NEXT_STATUS = {
  NEW:      "ACCEPTED",
  ACCEPTED: "READY",
  READY:    "COMPLETED",
};

const STATUS_TABS = ["ALL", "NEW", "ACCEPTED", "READY", "COMPLETED", "CANCELLED"];

// ─── Main Component ──────────────────────────────────────────────────────────
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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const activeTab = useMemo(() => {
    const path = location.pathname;
    if (path.endsWith("/new"))       return "NEW";
    if (path.endsWith("/accepted"))  return "ACCEPTED";
    if (path.endsWith("/ready"))     return "READY";
    if (path.endsWith("/completed")) return "COMPLETED";
    if (path.endsWith("/cancelled")) return "CANCELLED";
    return "ALL";
  }, [location.pathname]);

  const tabPath = (t) =>
    t === "ALL" ? "/admin/order-dashboard" : `/admin/order-dashboard/${t.toLowerCase()}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const bp = selectedBranchId ? { branchId: selectedBranchId } : {};
      const statusParam = activeTab !== "ALL" ? { status: activeTab } : {};
      const [ordersRes, summaryRes] = await Promise.all([
        api.get("/owner/orders", { params: { ...bp, ...statusParam } }),
        api.get("/owner/orders/reports/summary", { params: bp }),
      ]);
      setRows(ordersRes.data || []);
      setSummary(summaryRes.data);
    } catch (err) {
      setStatusMsg({ error: formatApiError(err, "Could not load orders"), success: "" });
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedBranchId]);

  useEffect(() => { void load(); }, [load]);

  const openDetail = async (order) => {
    setSelectedOrder(order);
    setDetailLoading(true);
    try {
      const res = await api.get(`/owner/orders/${order.id}`);
      setSelectedOrder(res.data);
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
        setStatusMsg({ error: "", success: "Order cancelled successfully." });
      } else if (action === "invoice") {
        await api.post(`/owner/orders/${id}/convert-to-invoice`);
        setStatusMsg({ error: "", success: "Order converted to invoice!" });
      } else {
        await api.patch(`/owner/orders/${id}/status`, { status: action, ...payload });
        setStatusMsg({ error: "", success: `Order moved to ${action}.` });
      }
      if (selectedOrder?.id === id) setSelectedOrder(null);
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
      style={{ display: "flex", flexDirection: "column", gap: 0, padding: 0 }}
    >
      {/* ── Top Header ─────────────────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
          padding: "28px 32px 24px",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.18)",
                  borderRadius: 10,
                  padding: 8,
                  display: "flex",
                }}
              >
                <ShoppingCart size={22} />
              </div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "1.7rem",
                  fontWeight: 800,
                  letterSpacing: "-0.5px",
                }}
              >
                E-Commerce Orders
              </h1>
            </div>
            <p style={{ margin: 0, opacity: 0.75, fontSize: 14 }}>
              Manage every incoming storefront order — from queue to invoice conversion.
            </p>
          </div>
          <button
            onClick={load}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 8,
              color: "white",
              padding: "8px 14px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              transition: "background 0.2s",
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* ── Summary Cards ──────────────────────────────────────── */}
        {summary && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 12,
              marginTop: 20,
            }}
          >
            {[
              { label: "Total Orders", value: summary.totalOrders, icon: ShoppingBag, color: "#a78bfa" },
              { label: "New",          value: summary.newOrders,   icon: Clock,       color: "#7dd3fc" },
              { label: "Completed",    value: summary.completedOrders, icon: CheckCircle2, color: "#86efac" },
              { label: "Cancelled",    value: summary.cancelledOrders, icon: XCircle,  color: "#fca5a5" },
              { label: "Total Sales",  value: `₹${fmt(summary.totalSales)}`, icon: TrendingUp, color: "#fde68a", isMoney: true },
            ].map((c) => (
              <div
                key={c.label}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <c.icon size={18} color={c.color} />
                <div>
                  <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 600 }}>{c.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: c.color }}>
                    {c.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Tab Bar ────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "2px solid #e2e8f0",
          background: "white",
          padding: "0 24px",
          overflowX: "auto",
        }}
      >
        {STATUS_TABS.map((tab) => {
          const meta = STATUS_META[tab];
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => navigate(tabPath(tab))}
              style={{
                padding: "14px 18px",
                border: "none",
                borderBottom: isActive
                  ? `3px solid ${tab === "ALL" ? "#4338ca" : meta.dot}`
                  : "3px solid transparent",
                background: "transparent",
                cursor: "pointer",
                fontWeight: isActive ? 700 : 500,
                color: isActive
                  ? tab === "ALL" ? "#4338ca" : meta.color
                  : "#64748b",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
                transition: "all 0.15s",
                marginBottom: -2,
              }}
            >
              {meta && <meta.icon size={14} />}
              {tab === "ALL" ? "All Orders" : meta.label}
            </button>
          );
        })}
      </div>

      {/* ── Status Messages ──────────────────────────────────────── */}
      {(statusMsg.error || statusMsg.success) && (
        <div
          style={{
            margin: "16px 24px 0",
            padding: "12px 16px",
            borderRadius: 8,
            background: statusMsg.error ? "#fef2f2" : "#f0fdf4",
            color: statusMsg.error ? "#991b1b" : "#166534",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            border: `1px solid ${statusMsg.error ? "#fca5a5" : "#86efac"}`,
          }}
        >
          <span>{statusMsg.error || statusMsg.success}</span>
          <button
            onClick={() => setStatusMsg({ error: "", success: "" })}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "inherit",
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          padding: "20px 24px",
          display: "flex",
          gap: 20,
          minHeight: 0,
        }}
      >
        {/* ── Orders List ─────────────────────────────────────────── */}
        <div style={{ flex: "1 1 55%", minWidth: 0 }}>
          {/* Search */}
          <div style={{ position: "relative", marginBottom: 16 }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
              }}
            />
            <input
              type="text"
              placeholder="Search by order number, customer name, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px 10px 36px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
                background: "white",
              }}
            />
          </div>

          {loading ? (
            <PageLoader
              title="Loading orders"
              message="Preparing your order queue..."
            />
          ) : filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "white",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
              }}
            >
              <ShoppingBag size={48} color="#c7d2fe" style={{ marginBottom: 12 }} />
              <p
                style={{
                  margin: "0 0 4px",
                  fontWeight: 700,
                  color: "#0f172a",
                  fontSize: 15,
                }}
              >
                No orders found
              </p>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>
                {activeTab === "ALL"
                  ? "When customers place orders from your storefront, they'll appear here."
                  : `No ${STATUS_META[activeTab]?.label} orders at the moment.`}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  isSelected={selectedOrder?.id === order.id}
                  actionLoading={actionLoading}
                  onSelect={() => openDetail(order)}
                  onAction={doAction}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Order Detail Panel ───────────────────────────────────── */}
        <div
          style={{
            flex: "1 1 42%",
            minWidth: 320,
            position: "sticky",
            top: 20,
            alignSelf: "flex-start",
            maxHeight: "calc(100vh - 200px)",
            overflowY: "auto",
          }}
        >
          {!selectedOrder ? (
            <div
              style={{
                background: "white",
                border: "2px dashed #e2e8f0",
                borderRadius: 16,
                padding: "60px 24px",
                textAlign: "center",
              }}
            >
              <Eye size={40} color="#c7d2fe" style={{ marginBottom: 12 }} />
              <p
                style={{
                  margin: "0 0 4px",
                  fontWeight: 700,
                  color: "#475569",
                  fontSize: 14,
                }}
              >
                Select an order to view details
              </p>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: 12 }}>
                Line items, customer info, payment status, and history will appear here.
              </p>
            </div>
          ) : (
            <OrderDetailPanel
              order={selectedOrder}
              loading={detailLoading}
              actionLoading={actionLoading}
              onClose={() => setSelectedOrder(null)}
              onAction={doAction}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── OrderCard ───────────────────────────────────────────────────────────────
function OrderCard({ order, isSelected, actionLoading, onSelect, onAction }) {
  const sm = STATUS_META[order.status] || STATUS_META.NEW;
  const pm = PAYMENT_META[order.paymentStatus] || PAYMENT_META.PENDING;
  const nextStatus = NEXT_STATUS[order.status];
  const isLoading = (s) => actionLoading === order.id + s;

  return (
    <div
      onClick={onSelect}
      style={{
        background: "white",
        border: `1.5px solid ${isSelected ? "#4338ca" : "#e2e8f0"}`,
        borderRadius: 12,
        padding: 16,
        cursor: "pointer",
        transition: "all 0.15s",
        boxShadow: isSelected ? "0 0 0 3px #e0e7ff" : "none",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: 2,
            }}
          >
            #{order.orderNumber}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "#64748b",
            }}
          >
            <User size={11} /> {order.customerName}
            <span style={{ color: "#cbd5e1" }}>•</span>
            <Phone size={11} /> {order.customerPhone}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 100,
              background: sm.bg,
              color: sm.color,
              border: `1px solid ${sm.border}`,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: sm.dot,
                display: "inline-block",
              }}
            />
            {sm.label}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 100,
              background: pm.bg,
              color: pm.color,
            }}
          >
            {pm.label}
          </span>
        </div>
      </div>

      {/* Items preview */}
      {order.items && order.items.length > 0 && (
        <div
          style={{
            background: "#f8fafc",
            borderRadius: 8,
            padding: "8px 10px",
            marginBottom: 10,
            fontSize: 12,
            color: "#475569",
          }}
        >
          {order.items.slice(0, 2).map((item, i) => (
            <span key={i}>
              {i > 0 && <span style={{ color: "#cbd5e1" }}> · </span>}
              <strong>{item.productName}</strong> ×{item.qty}
            </span>
          ))}
          {order.items.length > 2 && (
            <span style={{ color: "#94a3b8" }}>
              {" "}+{order.items.length - 2} more
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
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
            ₹{fmt(order.total)}
          </span>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>
            {order.fulfillmentMethod === "DELIVERY" ? (
              <><Truck size={11} /> Delivery</>
            ) : (
              <><Package size={11} /> Pickup</>
            )}
          </span>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>
            {new Date(order.createdAt).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div
          style={{ display: "flex", gap: 6 }}
          onClick={(e) => e.stopPropagation()}
        >
          {nextStatus && order.status !== "CANCELLED" && (
            <ActionBtn
              loading={isLoading(nextStatus)}
              onClick={() => onAction(order.id, nextStatus)}
              color="#4338ca"
              bg="#eef2ff"
            >
              {nextStatus === "ACCEPTED" ? <><Check size={12} /> Accept</> :
               nextStatus === "READY"    ? <><Package size={12} /> Ready</> :
                                           <><CheckCircle2 size={12} /> Complete</>}
            </ActionBtn>
          )}
          {!["CANCELLED", "COMPLETED"].includes(order.status) && (
            <ActionBtn
              loading={isLoading("cancel")}
              onClick={() => onAction(order.id, "cancel")}
              color="#dc2626"
              bg="#fef2f2"
            >
              <Ban size={12} />
            </ActionBtn>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── OrderDetailPanel ─────────────────────────────────────────────────────
function OrderDetailPanel({ order, loading, actionLoading, onClose, onAction }) {
  const sm = STATUS_META[order.status] || STATUS_META.NEW;
  const pm = PAYMENT_META[order.paymentStatus] || PAYMENT_META.PENDING;
  const nextStatus = NEXT_STATUS[order.status];
  const isLoading = (s) => actionLoading === order.id + s;

  return (
    <div
      style={{
        background: "white",
        border: "1.5px solid #e2e8f0",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b, #312e81)",
          padding: "16px 20px",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>#{order.orderNumber}</div>
          <div style={{ opacity: 0.7, fontSize: 12, marginTop: 2 }}>
            {new Date(order.createdAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 100,
              background: sm.bg,
              color: sm.color,
            }}
          >
            {sm.label}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: 6,
              color: "white",
              cursor: "pointer",
              padding: "4px 6px",
              display: "flex",
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 24 }}>
          <PageLoader title="Loading order details..." />
        </div>
      ) : (
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Customer Info */}
          <Section title="Customer" icon={User}>
            <InfoRow icon={User}  label="Name"  value={order.customerName} />
            <InfoRow icon={Phone} label="Phone" value={order.customerPhone} />
            {order.customerEmail && (
              <InfoRow icon={Tag} label="Email" value={order.customerEmail} />
            )}
            <InfoRow
              icon={order.fulfillmentMethod === "DELIVERY" ? Truck : Package}
              label="Fulfillment"
              value={order.fulfillmentMethod === "DELIVERY" ? "Delivery" : "Pickup"}
            />
            {order.note && (
              <InfoRow icon={FileText} label="Note" value={order.note} />
            )}
          </Section>

          {/* Order Items */}
          <Section title={`Items (${order.items?.length || 0})`} icon={ShoppingBag}>
            {(order.items || []).map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 10px",
                  background: "#f8fafc",
                  borderRadius: 8,
                  marginBottom: 6,
                  fontSize: 13,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>
                    {item.productName}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    ₹{fmt(item.unitPrice)} × {item.qty}
                  </div>
                </div>
                <div style={{ fontWeight: 800, color: "#0f172a" }}>
                  ₹{fmt(item.lineTotal)}
                </div>
              </div>
            ))}
          </Section>

          {/* Payment Summary */}
          <Section title="Payment" icon={CreditCard}>
            <div
              style={{
                background: "#f8fafc",
                borderRadius: 10,
                padding: 12,
                fontSize: 13,
              }}
            >
              {[
                { label: "Subtotal",  value: `₹${fmt(order.subtotal)}` },
                { label: "Discount",  value: `-₹${fmt(order.discount)}`, color: "#dc2626" },
                { label: "Tax",       value: `₹${fmt(order.tax)}` },
              ].map((r) => (
                <div
                  key={r.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                    color: r.color || "#475569",
                  }}
                >
                  <span>{r.label}</span>
                  <span>{r.value}</span>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 800,
                  fontSize: 15,
                  color: "#0f172a",
                  paddingTop: 8,
                  borderTop: "1px solid #e2e8f0",
                  marginTop: 4,
                }}
              >
                <span>Total</span>
                <span>₹{fmt(order.total)}</span>
              </div>
              {order.couponCode && (
                <div
                  style={{
                    marginTop: 8,
                    padding: "4px 8px",
                    background: "#fef3c7",
                    color: "#92400e",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Tag size={11} /> Coupon: {order.couponCode}
                </div>
              )}
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 12, color: "#64748b" }}>Payment Status</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 100,
                    background: pm.bg,
                    color: pm.color,
                  }}
                >
                  {pm.label}
                </span>
              </div>
            </div>
          </Section>

          {/* Status History */}
          {order.logs && order.logs.length > 0 && (
            <Section title="Status History" icon={Clock}>
              <div style={{ position: "relative" }}>
                {order.logs.map((log, i) => (
                  <div
                    key={log.id}
                    style={{
                      display: "flex",
                      gap: 10,
                      paddingBottom: i < order.logs.length - 1 ? 14 : 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: STATUS_META[log.toStatus]?.dot || "#94a3b8",
                          marginTop: 4,
                          flexShrink: 0,
                        }}
                      />
                      {i < order.logs.length - 1 && (
                        <div
                          style={{
                            width: 1,
                            flex: 1,
                            background: "#e2e8f0",
                            marginTop: 3,
                          }}
                        />
                      )}
                    </div>
                    <div style={{ paddingBottom: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: STATUS_META[log.toStatus]?.color || "#475569",
                        }}
                      >
                        → {STATUS_META[log.toStatus]?.label || log.toStatus}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {log.actorName || "System"} •{" "}
                        {new Date(log.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      {log.note && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "#64748b",
                            fontStyle: "italic",
                          }}
                        >
                          {log.note}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Actions */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {nextStatus && order.status !== "CANCELLED" && (
              <button
                disabled={!!actionLoading}
                onClick={() => onAction(order.id, nextStatus)}
                style={{
                  width: "100%",
                  padding: "11px 16px",
                  borderRadius: 9,
                  border: "none",
                  background:
                    nextStatus === "ACCEPTED"
                      ? "#4338ca"
                      : nextStatus === "READY"
                      ? "#d97706"
                      : "#166534",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: actionLoading ? 0.7 : 1,
                }}
              >
                {isLoading(nextStatus) ? (
                  "Processing..."
                ) : nextStatus === "ACCEPTED" ? (
                  <><Check size={15} /> Accept Order</>
                ) : nextStatus === "READY" ? (
                  <><Package size={15} /> Mark as Ready</>
                ) : (
                  <><CheckCircle2 size={15} /> Mark as Completed</>
                )}
              </button>
            )}

            {order.status === "COMPLETED" && !order.invoiceId && (
              <button
                disabled={!!actionLoading}
                onClick={() => onAction(order.id, "invoice")}
                style={{
                  width: "100%",
                  padding: "11px 16px",
                  borderRadius: 9,
                  border: "none",
                  background: "#0369a1",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: actionLoading ? 0.7 : 1,
                }}
              >
                {isLoading("invoice") ? (
                  "Creating..."
                ) : (
                  <><FileText size={15} /> Convert to Invoice</>
                )}
              </button>
            )}

            {order.invoiceId && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "#f0fdf4",
                  border: "1px solid #86efac",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#166534",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <CheckCircle2 size={14} /> Invoice already created
              </div>
            )}

            {!["CANCELLED", "COMPLETED"].includes(order.status) && (
              <button
                disabled={!!actionLoading}
                onClick={() => onAction(order.id, "cancel")}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  borderRadius: 9,
                  border: "1.5px solid #fca5a5",
                  background: "#fef2f2",
                  color: "#dc2626",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: actionLoading ? 0.7 : 1,
                }}
              >
                {isLoading("cancel") ? "Cancelling..." : <><Ban size={14} /> Cancel Order</>}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
          fontSize: 12,
          fontWeight: 700,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        <Icon size={12} />
        {title}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        marginBottom: 6,
        fontSize: 13,
      }}
    >
      <Icon size={13} color="#94a3b8" style={{ marginTop: 1, flexShrink: 0 }} />
      <span style={{ color: "#64748b", minWidth: 56 }}>{label}</span>
      <span style={{ color: "#0f172a", fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function ActionBtn({ onClick, loading, color, bg, children }) {
  return (
    <button
      disabled={loading}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "5px 10px",
        borderRadius: 6,
        border: "none",
        background: bg,
        color,
        fontWeight: 700,
        fontSize: 11,
        cursor: "pointer",
        opacity: loading ? 0.6 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {loading ? "..." : children}
    </button>
  );
}
