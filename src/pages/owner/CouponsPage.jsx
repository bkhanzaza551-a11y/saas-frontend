import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Tag, Gift, Plus, Search, Edit2, Trash2, X, TrendingUp, DollarSign } from "lucide-react";
import { api } from "../../api/client";
import ModuleTabs from "../../components/ModuleTabs";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import { formatApiError } from "../../utils/apiError";
import { useBranch } from "../../context/BranchContext";

const defaultCouponForm = {
  code: "",
  title: "",
  description: "",
  discountType: "FIXED",
  discountValue: 50,
  minBillAmount: 59,
  usageLimit: "",
  startsAt: new Date().toISOString().split('T')[0],
  validityDays: 90,
  isActive: true,
  isPrivate: false
};

const emptyGiftCard = {
  code: "",
  title: "",
  originalAmount: 1000,
  note: ""
};

export default function CouponsPage() {
  const location = useLocation();
  const { selectedBranchId } = useBranch();
  const [coupons, setCoupons] = useState([]);
  const [giftCards, setGiftCards] = useState([]);
  const [reports, setReports] = useState(null);
  const [couponForm, setCouponForm] = useState(defaultCouponForm);
  const [giftCardForm, setGiftCardForm] = useState(emptyGiftCard);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [loading, setLoading] = useState(true);
  const [gcSearch, setGcSearch] = useState("");
  const [editingGc, setEditingGc] = useState(null);
  const [couponSearch, setCouponSearch] = useState("");
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showGcModal, setShowGcModal] = useState(false);

  const handleEditCoupon = (c) => {
    setEditingCoupon(c);
    let valDays = 90;
    if (c.startsAt && c.endsAt) {
      const diffTime = Math.abs(new Date(c.endsAt) - new Date(c.startsAt));
      valDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    setCouponForm({
      code: c.code || "",
      title: c.title || "",
      description: c.description || "",
      discountType: c.discountType || "PERCENT",
      discountValue: c.discountValue ? Number(c.discountValue) : 0,
      minBillAmount: c.minBillAmount ? Number(c.minBillAmount) : 0,
      usageLimit: c.usageLimit || "",
      startsAt: c.startsAt ? new Date(c.startsAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      validityDays: valDays,
      isActive: !c.isArchived,
      isPrivate: c.notes === "PRIVATE"
    });
    setShowModal(true);
  };

  const mode = location.pathname.includes("/gift-cards")
    ? "giftCards"
    : location.pathname.includes("/reports")
      ? "reports"
      : "coupons";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [couponResponse, giftCardResponse, reportResponse] = await Promise.all([
        api.get("/owner/coupons", { params: { branchId: selectedBranchId } }),
        api.get("/owner/gift-cards", { params: { branchId: selectedBranchId } }),
        api.get("/owner/coupons/reports", { params: { branchId: selectedBranchId } })
      ]);
      setCoupons(couponResponse.data || []);
      setGiftCards(giftCardResponse.data || []);
      setReports(reportResponse.data || null);
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not load coupons module"), success: "" });
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [load]);

  const saveCoupon = async (event) => {
    event.preventDefault();
    try {
      const start = couponForm.startsAt ? new Date(couponForm.startsAt) : new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + Number(couponForm.validityDays || 0));

      const payload = {
        code: couponForm.code,
        title: couponForm.title,
        ...(couponForm.description ? { description: couponForm.description } : {}),
        discountType: couponForm.discountType,
        discountValue: Number(couponForm.discountValue),
        minBillAmount: Number(couponForm.minBillAmount || 0),
        ...(couponForm.usageLimit ? { usageLimit: Number(couponForm.usageLimit) } : {}),
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        isArchived: !couponForm.isActive,
        notes: couponForm.isPrivate ? "PRIVATE" : "",
        ...(selectedBranchId ? { branchId: selectedBranchId } : {})
      };

      if (editingCoupon) {
        await api.patch(`/owner/coupons/${editingCoupon.id}`, payload);
        setStatus({ error: "", success: "Coupon updated." });
      } else {
        await api.post("/owner/coupons", payload);
        setStatus({ error: "", success: "Coupon created." });
      }
      setCouponForm(defaultCouponForm);
      setEditingCoupon(null);
      setShowModal(false);
      await load();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not save coupon"), success: "" });
    }
  };

  const deleteCoupon = async (id) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await api.delete(`/owner/coupons/${id}`);
      setStatus({ error: "", success: "Coupon deleted." });
      setShowModal(false);
      await load();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not delete coupon"), success: "" });
    }
  };

  const saveGiftCard = async (event) => {
    event.preventDefault();
    try {
      if (editingGc) {
        await api.patch(`/owner/gift-cards/${editingGc.id}`, {
          code: giftCardForm.code,
          title: giftCardForm.title,
          originalAmount: Number(giftCardForm.originalAmount),
          note: giftCardForm.note,
          branchId: selectedBranchId || null
        });
        setStatus({ error: "", success: "Gift card updated." });
      } else {
        await api.post("/owner/gift-cards", {
          code: giftCardForm.code,
          title: giftCardForm.title,
          originalAmount: Number(giftCardForm.originalAmount),
          note: giftCardForm.note,
          branchId: selectedBranchId || null
        });
        setStatus({ error: "", success: "Gift card created." });
      }
      setGiftCardForm(emptyGiftCard);
      setEditingGc(null);
      setShowGcModal(false);
      await load();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not save gift card"), success: "" });
    }
  };

  const deleteGiftCard = async (id) => {
    if (!confirm("Delete this gift card?")) return;
    try {
      await api.delete(`/owner/gift-cards/${id}`);
      setStatus({ error: "", success: "Gift card deleted." });
      await load();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not delete gift card"), success: "" });
    }
  };

  const toggleGiftCardActive = async (gc) => {
    try {
      await api.patch(`/owner/gift-cards/${gc.id}`, { isActive: !gc.isActive });
      setStatus({ error: "", success: `Gift card ${gc.isActive ? "deactivated" : "activated"}.` });
      await load();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not update gift card"), success: "" });
    }
  };

  const filteredGiftCards = giftCards.filter(gc =>
    gc.code?.toLowerCase().includes(gcSearch.toLowerCase()) ||
    gc.title?.toLowerCase().includes(gcSearch.toLowerCase())
  );

  const filteredCoupons = coupons.filter(c =>
    c.code?.toLowerCase().includes(couponSearch.toLowerCase()) ||
    c.title?.toLowerCase().includes(couponSearch.toLowerCase())
  );

  return (
    <div className="page-shell">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .anim-fade { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
        
        .cpn-card { background: white; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); transition: all 0.3s; }
        .cpn-input { width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 14px; outline: none; transition: all 0.2s; background: #fff; box-sizing: border-box; }
        .cpn-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
        .cpn-label { display: block; font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 8px; }
        
        .cpn-btn { padding: 12px 20px; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s; border: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
        .cpn-btn-primary { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }
        .cpn-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3); }
        .cpn-btn-secondary { background: #f8fafc; border: 1px solid #cbd5e1; color: #475569; }
        .cpn-btn-secondary:hover { background: #f1f5f9; border-color: #94a3b8; }
        
        .coupons-form-grid-1 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .coupons-form-grid-2 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
        
        /* Custom Radio & Checkbox */
        .cpn-radio-group { display: flex; gap: 4px; background: #f1f5f9; padding: 4px; border-radius: 10px; border: 1px solid #e2e8f0; align-items: center; }
        .cpn-radio-option { flex: 1; text-align: center; padding: 10px 12px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.2s; color: #64748b; }
        .cpn-radio-option.active { background: white; color: #4f46e5; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }

        .cpn-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }

        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.2s ease-out;
          box-sizing: border-box;
        }

        .modal-content {
          background: white;
          width: 100%;
          max-width: 650px;
          max-height: 90vh;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          box-sizing: border-box;
        }

        .cpn-table-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .cpn-table-wrap table {
          min-width: 600px;
          width: 100%;
        }

        @media (max-width: 768px) {
          .coupons-form-grid-1, .coupons-form-grid-2 { grid-template-columns: 1fr !important; }
        }

        @media (max-width: 640px) {
          .cpn-stats-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
          .cpn-stat-card {
            padding: 10px 12px !important;
            gap: 10px !important;
          }
          .cpn-stat-icon {
            width: 34px !important;
            height: 34px !important;
          }
          .cpn-stat-title {
            font-size: 10px !important;
          }
          .cpn-stat-val {
            font-size: 16px !important;
          }
          .cpn-search-box {
            width: 100% !important;
          }
          .cpn-search-box input {
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .modal-overlay {
            padding: 10px !important;
          }
          .modal-content {
            max-height: 94vh !important;
            border-radius: 14px !important;
          }
        }
      `}</style>
      <ModuleTabs
        title="Coupons & Gift Cards"
        description="Promotions, vouchers, gift card balances and redemption reporting."
        items={[
          { label: "Coupons", to: "/admin/coupons" },
          { label: "Gift Cards", to: "/admin/gift-cards" },
          { label: "Referral Program", to: "/admin/referral-coupons" },
          { label: "Reports", to: "/admin/coupons/reports" }
        ]}
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            {mode === "coupons" && (
              <button 
                type="button"
                onClick={() => { setEditingCoupon(null); setCouponForm(defaultCouponForm); setStatus({ error: "", success: "" }); setShowModal(true); }}
                className="primary-button"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <Plus size={16} /> Create Coupon
              </button>
            )}
            {mode === "giftCards" && (
              <button 
                type="button"
                onClick={() => { setEditingGc(null); setGiftCardForm(emptyGiftCard); setStatus({ error: "", success: "" }); setShowGcModal(true); }}
                className="primary-button"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <Plus size={16} /> Create Gift Card
              </button>
            )}
          </div>
        }
      />

      {/* Top 4 Summary Metrics */}
      <div className="cpn-stats-grid">
        <div className="cpn-stat-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: 14 }}>
          <div className="cpn-stat-icon" style={{ width: 40, height: 40, borderRadius: 10, background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Tag size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="cpn-stat-title" style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Active Coupons</div>
            <div className="cpn-stat-val" style={{ fontSize: 19, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
              {coupons.filter(c => !c.isArchived && (!c.endsAt || new Date(c.endsAt) >= new Date())).length} <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>/ {coupons.length}</span>
            </div>
          </div>
        </div>

        <div className="cpn-stat-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: 14 }}>
          <div className="cpn-stat-icon" style={{ width: 40, height: 40, borderRadius: 10, background: "#f0fdf4", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Gift size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="cpn-stat-title" style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Gift Cards</div>
            <div className="cpn-stat-val" style={{ fontSize: 19, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
              {giftCards.filter(g => g.isActive !== false && (!g.expiresAt || new Date(g.expiresAt) >= new Date())).length} <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>/ {giftCards.length}</span>
            </div>
          </div>
        </div>

        <div className="cpn-stat-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: 14 }}>
          <div className="cpn-stat-icon" style={{ width: 40, height: 40, borderRadius: 10, background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <TrendingUp size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="cpn-stat-title" style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Redemptions</div>
            <div className="cpn-stat-val" style={{ fontSize: 19, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>{reports?.redemptions?.length || 0}</div>
          </div>
        </div>

        <div className="cpn-stat-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: 14 }}>
          <div className="cpn-stat-icon" style={{ width: 40, height: 40, borderRadius: 10, background: "#f3e8ff", color: "#9333ea", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <DollarSign size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="cpn-stat-title" style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Total Savings</div>
            <div className="cpn-stat-val" style={{ fontSize: 19, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>₹{reports?.totalSavings || 0}</div>
          </div>
        </div>
      </div>

      {status.error && <div className="panel-card"><p className="error-text">{status.error}</p></div>}
      {status.success && <div className="panel-card"><p className="success-text">{status.success}</p></div>}
      {loading && <PageLoader title="Loading promotions workspace" message="Bringing together coupon rules, gift card balances, and redemption insights." />}

      {!loading && mode === "coupons" && (
        <div className="anim-fade">
          <div className="panel-card" style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Active Coupons</h3>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Promotions and vouchers available for checkout redemption.</div>
              </div>
              <div className="cpn-search-box" style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input 
                  placeholder="Search coupons..." 
                  value={couponSearch} 
                  onChange={(e) => setCouponSearch(e.target.value)} 
                  style={{ paddingLeft: 34, paddingRight: 14, paddingTop: 8, paddingBottom: 8, fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 8, outline: "none", width: 260, background: "#f8fafc" }}
                />
              </div>
            </div>
            
            <div className="cpn-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Coupon</th>
                    <th>Code</th>
                    <th>Benefit</th>
                    <th>Min. Bill</th>
                    <th>Validity</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoupons.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.95rem" }}>{row.title}</div>
                        {row.notes === "PRIVATE" && <span style={{ fontSize: 11, background: "#f1f5f9", color: "#64748b", padding: "2px 6px", borderRadius: 4, display: "inline-block", marginTop: 4 }}>Private</span>}
                      </td>
                      <td style={{ fontWeight: 700, color: "#4f46e5", letterSpacing: 0.5 }}>{row.code}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {row.discountType === "PERCENT" ? `${Number(row.discountValue)}% OFF` : row.discountType === "CAMPAIGN" ? `CAMPAIGN ${Number(row.discountValue)}%` : `₹${Number(row.discountValue)} OFF`}
                        </div>
                      </td>
                      <td style={{ color: "#64748b" }}>{row.minBillAmount ? `₹${Number(row.minBillAmount)}` : "None"}</td>
                      <td style={{ fontSize: "0.85rem", color: "#64748b" }}>
                        {row.startsAt && row.endsAt ? (
                          `${new Date(row.startsAt).toLocaleDateString()} - ${new Date(row.endsAt).toLocaleDateString()}`
                        ) : "Unlimited"}
                      </td>
                      <td>
                        <span style={{ padding: "4px 8px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: row.isArchived ? "#f1f5f9" : "#dcfce7", color: row.isArchived ? "#64748b" : "#166534" }}>
                          {row.isArchived ? "Inactive" : "Active"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button onClick={() => handleEditCoupon(row)} className="cpn-btn cpn-btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}>Edit</button>
                      </td>
                    </tr>
                  ))}
                  {!filteredCoupons.length && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>No coupons found. Click "+ Create Coupon" to add one.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                  {editingCoupon ? "Update Coupon" : "Create Coupon"}
                </h2>
                <label style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "pointer", gap: 8 }}>
                  <div style={{ width: 40, height: 22, background: couponForm.isActive ? "#10b981" : "#cbd5e1", borderRadius: 100, position: "relative", transition: "background 0.3s ease" }}>
                    <div style={{ position: "absolute", top: 2, left: couponForm.isActive ? 20 : 2, width: 18, height: 18, background: "white", borderRadius: "50%", transition: "all 0.3s ease", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                  </div>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: couponForm.isActive ? "#10b981" : "#64748b", textTransform: "uppercase" }}>{couponForm.isActive ? "Active" : "Inactive"}</span>
                  <input type="checkbox" checked={couponForm.isActive} onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.checked })} style={{ opacity: 0, position: "absolute", width: 0, height: 0 }} />
                </label>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "none", fontSize: 24, cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#e2e8f0"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>&times;</button>
            </div>
            
            <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
              <form id="coupon-form" onSubmit={saveCoupon} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div className="coupons-form-grid-1">
                  <label>
                    <span className="cpn-label">Name</span>
                    <input placeholder="e.g. Summer Special" required value={couponForm.title} onChange={(e) => setCouponForm({ ...couponForm, title: e.target.value })} className="cpn-input" />
                  </label>
                  <label>
                    <span className="cpn-label">Code</span>
                    <input placeholder="e.g. SUMMER20" required value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} className="cpn-input" style={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: 1 }} />
                  </label>
                </div>

                <label>
                  <span className="cpn-label">Description (Optional)</span>
                  <input placeholder="e.g. Valid only for first-time customers..." value={couponForm.description} onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })} className="cpn-input" />
                </label>

                <div className="coupons-form-grid-2">
                  <div>
                    <span className="cpn-label">Benefit Type</span>
                    <div className="cpn-radio-group">
                      <div className={`cpn-radio-option ${couponForm.discountType === "FIXED" ? "active" : ""}`} onClick={() => setCouponForm({ ...couponForm, discountType: "FIXED" })}>₹ Fixed</div>
                      <div className={`cpn-radio-option ${couponForm.discountType === "PERCENT" ? "active" : ""}`} onClick={() => setCouponForm({ ...couponForm, discountType: "PERCENT" })}>% Percent</div>
                      <div className={`cpn-radio-option ${couponForm.discountType === "CAMPAIGN" ? "active" : ""}`} onClick={() => setCouponForm({ ...couponForm, discountType: "CAMPAIGN" })}>📣 Campaign</div>
                    </div>
                  </div>
                  <label>
                    <span className="cpn-label">Benefit Value {couponForm.discountType === "FIXED" ? "(₹)" : "(%)"}</span>
                    <input type="number" min="0" placeholder="50" required value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })} className="cpn-input" />
                  </label>
                  <label>
                    <span className="cpn-label">Coupon Activated Date</span>
                    <input type="date" required value={couponForm.startsAt} onChange={(e) => setCouponForm({ ...couponForm, startsAt: e.target.value })} className="cpn-input" />
                  </label>
                </div>

                <div className="coupons-form-grid-2">
                  <label>
                    <span className="cpn-label">Min. Bill Amount (₹)</span>
                    <input type="number" min="0" placeholder="0 for none" value={couponForm.minBillAmount} onChange={(e) => setCouponForm({ ...couponForm, minBillAmount: e.target.value })} className="cpn-input" />
                  </label>
                  <label>
                    <span className="cpn-label">Usage Limit (Total)</span>
                    <input type="number" min="0" placeholder="Unlimited" value={couponForm.usageLimit} onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })} className="cpn-input" />
                  </label>
                  <label>
                    <span className="cpn-label">Validity (Days)</span>
                    <input type="number" min="1" placeholder="90" required value={couponForm.validityDays} onChange={(e) => setCouponForm({ ...couponForm, validityDays: e.target.value })} className="cpn-input" />
                  </label>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", border: "1px solid #e2e8f0", borderRadius: 12, background: "#f8fafc" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.95rem" }}>Private Coupon</div>
                    <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: 4 }}>This coupon will not be visible on the public online catalog.</div>
                  </div>
                  <div onClick={() => setCouponForm({ ...couponForm, isPrivate: !couponForm.isPrivate })} style={{ width: 44, height: 24, background: couponForm.isPrivate ? "#3b82f6" : "#cbd5e1", borderRadius: 12, padding: 2, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: couponForm.isPrivate ? "flex-end" : "flex-start", transition: "all 0.2s", boxSizing: "border-box" }}>
                    <div style={{ width: 20, height: 20, background: "white", borderRadius: "50%", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
                  </div>
                </div>
              </form>
            </div>
            
            <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {editingCoupon ? (
                <button type="button" onClick={() => deleteCoupon(editingCoupon.id)} className="cpn-btn" style={{ background: "transparent", color: "#ef4444", border: "1px solid #fca5a5" }}>Delete Coupon</button>
              ) : <div />}
              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => setShowModal(false)} className="cpn-btn cpn-btn-secondary">Cancel</button>
                <button type="submit" form="coupon-form" className="cpn-btn cpn-btn-primary">{editingCoupon ? "Save Changes" : "Create Coupon"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && mode === "giftCards" && (
        <div className="anim-fade">
          <div className="panel-card" style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Gift Card Inventory</h3>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Issued vouchers and available customer credits.</div>
              </div>
              <div className="cpn-search-box" style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input 
                  placeholder="Search by code or title..." 
                  value={gcSearch} 
                  onChange={(e) => setGcSearch(e.target.value)} 
                  style={{ paddingLeft: 34, paddingRight: 14, paddingTop: 8, paddingBottom: 8, fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 8, outline: "none", width: 260, background: "#f8fafc" }}
                />
              </div>
            </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: 12, marginTop: 12 }}>
            {filteredGiftCards.map((gc) => {
              const balance = Number(gc.balanceAmount || 0);
              const original = Number(gc.originalAmount || 0);
              const usedPct = original > 0 ? Math.round(((original - balance) / original) * 100) : 0;
              const isExpired = gc.expiresAt && new Date(gc.expiresAt) < new Date();
              const daysLeft = gc.expiresAt ? Math.max(0, Math.ceil((new Date(gc.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))) : null;
              return (
                <div key={gc.id} style={{ background: gc.isActive ? "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" : "#f8fafc", border: gc.isActive ? "none" : "1px solid #e2e8f0", borderRadius: 16, padding: 24, color: gc.isActive ? "#fff" : "#64748b", position: "relative", overflow: "hidden", boxShadow: gc.isActive ? "0 10px 25px -5px rgba(79, 70, 229, 0.4)" : "none", transition: "transform 0.2s" }}>
                  {gc.isActive && <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0) 70%)" }} />}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, position: "relative", zIndex: 1 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, opacity: 0.8, marginBottom: 4 }}>Gift Card</div>
                      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.5 }}>{gc.code}</div>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: gc.isActive ? "rgba(255,255,255,0.2)" : "#e2e8f0" }}>
                        {isExpired ? "Expired" : gc.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 4 }}>{gc.title}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, padding: "8px 0", borderTop: `1px solid ${gc.isActive ? "rgba(255,255,255,0.2)" : "#e2e8f0"}` }}>
                    <div>
                      <div style={{ fontSize: 11, opacity: 0.7 }}>Balance</div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>₹{balance.toFixed(0)} <span style={{ fontSize: 12, opacity: 0.6 }}>/ ₹{original.toFixed(0)}</span></div>
                    </div>
                    {daysLeft !== null && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, opacity: 0.7 }}>Expires</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{isExpired ? "Expired" : `${daysLeft} days`}</div>
                      </div>
                    )}
                  </div>
                  {usedPct > 0 && (
                    <div style={{ marginTop: 12, height: 6, borderRadius: 3, background: gc.isActive ? "rgba(255,255,255,0.1)" : "#e2e8f0", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${usedPct}%`, borderRadius: 3, background: gc.isActive ? "#38bdf8" : "#94a3b8" }} />
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 16, position: "relative", zIndex: 1 }}>
                    <button onClick={() => { setEditingGc(gc); setGiftCardForm({ code: gc.code, title: gc.title, originalAmount: gc.originalAmount, note: gc.note || "" }); setStatus({ error: "", success: "" }); setShowGcModal(true); }} style={{ flex: 1, padding: "8px 0", fontSize: 13, background: gc.isActive ? "rgba(255,255,255,0.1)" : "#fff", border: `1px solid ${gc.isActive ? "rgba(255,255,255,0.2)" : "#cbd5e1"}`, borderRadius: 8, cursor: "pointer", color: gc.isActive ? "#fff" : "#3b82f6", fontWeight: 700, transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = gc.isActive ? "rgba(255,255,255,0.2)" : "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = gc.isActive ? "rgba(255,255,255,0.1)" : "#fff"}>Edit</button>
                    <button onClick={() => toggleGiftCardActive(gc)} style={{ flex: 1, padding: "8px 0", fontSize: 13, background: gc.isActive ? "rgba(255,255,255,0.1)" : "#f0fdf4", border: `1px solid ${gc.isActive ? "rgba(255,255,255,0.2)" : "#bbf7d0"}`, borderRadius: 8, cursor: "pointer", color: gc.isActive ? "#e2e8f0" : "#166534", fontWeight: 700, transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = gc.isActive ? "rgba(255,255,255,0.2)" : "#dcfce7"} onMouseLeave={e => e.currentTarget.style.background = gc.isActive ? "rgba(255,255,255,0.1)" : "#f0fdf4"}>{gc.isActive ? "Deactivate" : "Activate"}</button>
                    <button onClick={() => deleteGiftCard(gc.id)} style={{ padding: "8px 12px", fontSize: 13, background: "transparent", border: `1px solid ${gc.isActive ? "rgba(248,113,113,0.3)" : "#fecaca"}`, borderRadius: 8, cursor: "pointer", color: gc.isActive ? "#fca5a5" : "#ef4444", fontWeight: 700, transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = gc.isActive ? "rgba(248,113,113,0.15)" : "#fee2e2"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>&#x2715;</button>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
          {!filteredGiftCards.length && <EmptyState title="No gift cards found" message={gcSearch ? "No gift cards match your search." : "Click '+ Create Gift Card' to issue vouchers for salon credit."} />}
        </div>
      )}

      {(showGcModal || editingGc) && (
        <div className="modal-overlay" onClick={() => { setShowGcModal(false); setEditingGc(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 540, width: "90vw" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
                  {editingGc ? "Edit Gift Card" : "Issue New Gift Card"}
                </h2>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Create or update promotional gift card credit.</div>
              </div>
              <button onClick={() => { setShowGcModal(false); setEditingGc(null); }} type="button" className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveGiftCard} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label className="cpn-label">Gift Card Code *</label>
                <input className="cpn-input" placeholder="e.g. GC-2024-001" required value={giftCardForm.code} onChange={(e) => setGiftCardForm({ ...giftCardForm, code: e.target.value.toUpperCase() })} style={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: 1 }} />
              </div>

              <div>
                <label className="cpn-label">Gift Card Title *</label>
                <input className="cpn-input" placeholder="e.g. Birthday Voucher" required value={giftCardForm.title} onChange={(e) => setGiftCardForm({ ...giftCardForm, title: e.target.value })} />
              </div>

              <div>
                <label className="cpn-label">Credit Amount (₹) *</label>
                <input className="cpn-input" type="number" min="1" placeholder="e.g. 1000" required value={giftCardForm.originalAmount} onChange={(e) => setGiftCardForm({ ...giftCardForm, originalAmount: e.target.value })} />
              </div>

              <div>
                <label className="cpn-label">Internal Note (Optional)</label>
                <input className="cpn-input" placeholder="Internal note..." value={giftCardForm.note} onChange={(e) => setGiftCardForm({ ...giftCardForm, note: e.target.value })} />
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
                <button type="button" onClick={() => { setShowGcModal(false); setEditingGc(null); }} style={{ padding: "10px 20px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8, fontWeight: 600, cursor: "pointer", color: "#475569", fontSize: 14 }}>
                  Cancel
                </button>
                <button type="submit" className="cpn-btn cpn-btn-primary" style={{ padding: "10px 24px" }}>
                  {editingGc ? "Update Gift Card" : "Issue Gift Card"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!loading && mode === "reports" && reports && (
        <div className="anim-fade">
          <div className="panel-card" style={{ padding: 24 }}>
            <h3 style={{ marginTop: 0, marginBottom: 18, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Redemption Audit History</h3>
            <div className="cpn-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Coupon Code</th>
                    <th>Saved Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(reports.redemptions || []).map((row) => (
                    <tr key={row.id}>
                      <td style={{ fontWeight: 700, color: "#2563eb", letterSpacing: 0.5 }}>{row.coupon?.code || "-"}</td>
                      <td style={{ fontWeight: 700, color: "#16a34a" }}>₹{row.amountSaved}</td>
                    </tr>
                  ))}
                  {!reports.redemptions?.length && (
                    <tr>
                      <td colSpan="2" style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>No redemptions found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
