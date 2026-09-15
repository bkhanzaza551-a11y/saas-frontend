import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import CustomSelect from "../../components/CustomSelect";
import { Package, Plus, Eye, Edit2, Trash2, ShoppingCart, Search, Filter, Layers, ListFilter, FileText } from "lucide-react";

const priorityColors = {
  LOW: { bg: "#f0fdf4", color: "#166534" },
  MEDIUM: { bg: "#fffbeb", color: "#d97706" },
  HIGH: { bg: "#fff7ed", color: "#c2410c" },
  URGENT: { bg: "#fef2f2", color: "#dc2626" }
};

const statusColors = {
  NEW: { bg: "#eff6ff", color: "#2563eb", label: "New" },
  PENDING: { bg: "#fffbeb", color: "#d97706", label: "Pending" },
  APPROVED: { bg: "#ecfdf5", color: "#10b981", label: "Approved" },
  REJECTED: { bg: "#fef2f2", color: "#ef4444", label: "Rejected" },
  COMPLETED: { bg: "#f0fdf4", color: "#166534", label: "Completed" }
};

const fmt = (val) => Number(val || 0).toLocaleString("en-IN");

export const SALON_PRODUCT_CATEGORIES = [
  "Hair Care & Cleansing — Shampoos & Conditioners",
  "Hair Color & Developers — Global, Root Touchup, Highlights",
  "Hair Treatments — Keratin, Botox, Nanoplastia, Smoothening",
  "Hair Spa, Deep Conditioning & Masks",
  "Hair Styling & Finishing — Serums, Sprays, Mousse, Wax, Gels",
  "Scalp Care & Anti-Dandruff Treatments",
  "Skin Care & Professional Facial Kits",
  "Face Serums, Toners, Cleaners & Moisturisers",
  "Face Bleach, De-Tan Packs & Peel-Off Masks",
  "Waxing & Hair Removal — Hard Wax, Strip Wax, Roll-ons",
  "Pre & Post Wax Care Lotions & Oils",
  "Manicure & Pedicure Kits, Scrubs & Soaks",
  "Nail Art, Gel Polish & Extensions — UV Gels, Tips, Acrylics",
  "Nail Care Tools, Cuticle Oils & Removers",
  "Bridal & Professional Makeup Cosmetics",
  "Eye Makeup, Lashes, Glues & Accessories",
  "Beard Grooming, Shaving Creams & Men's Care",
  "Body Massage Oils, Lotions & Aromatherapy",
  "Body Polishing, Scrubs & Wraps",
  "Threading Threads, Eyebrow Tinting & Henna",
  "Electrical Tools — Hair Dryers, Straighteners, Tongs, Steamers",
  "Salon Cutting Tools — Shears, Scissors, Razors, Blades",
  "Combs, Brushes, Section Clips & Mixing Bowls",
  "Disposables & Hygiene — Towels, Capes, Gloves, Bed Sheets, Headbands",
  "Sanitization, Sterilization & Salon Cleaning Supplies",
  "Salon Retail Products for Resale",
  "Other Salon Supplies"
];

export default function ProductsRequirementPage() {
  const [requirements, setRequirements] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ error: "", success: "" });

  // 4 Sections: "available" | "new_request" | "my_requests" | "detail"
  const [activeSection, setActiveSection] = useState("available");

  // Filters for Available Products (Point 6)
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");

  // Filter for My Requests
  const [requestStatusFilter, setRequestStatusFilter] = useState("");

  // Detail View & Request Form States
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [requestForm, setRequestForm] = useState({
    catalogId: "",
    brand: "",
    productName: "",
    category: "",
    unitPackSize: "",
    quantity: "1",
    priority: "MEDIUM",
    unitPrice: "",
    note: ""
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [resReq, resCat] = await Promise.all([
        api.get("/owner/product-requirements"),
        api.get("/owner/product-catalog").catch(() => ({ data: [] }))
      ]);
      setRequirements(resReq.data || []);
      setCatalog(resCat.data || []);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not load products data"), success: "" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Unique brands & categories for filter dropdowns
  const availableBrands = useMemo(() => {
    const set = new Set(catalog.map(c => c.brand).filter(Boolean));
    return Array.from(set).sort();
  }, [catalog]);

  const availableCategories = useMemo(() => {
    const set = new Set([...SALON_PRODUCT_CATEGORIES, ...catalog.map(c => c.category).filter(Boolean)]);
    return Array.from(set);
  }, [catalog]);

  // Filtered Catalog Items (Point 6)
  const filteredCatalog = useMemo(() => {
    return catalog.filter(item => {
      const itemStatus = item.isActive === false ? "INACTIVE" : (item.availableQty > 0 ? "AVAILABLE" : "OUT_OF_STOCK");
      
      if (availabilityFilter && availabilityFilter !== itemStatus) return false;
      if (brandFilter && item.brand !== brandFilter) return false;
      if (categoryFilter && item.category !== categoryFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pName = (item.productName || "").toLowerCase();
        const bName = (item.brand || "").toLowerCase();
        const cName = (item.category || "").toLowerCase();
        const pack = (item.unitPackSize || item.packSize || "").toLowerCase();
        if (!pName.includes(q) && !bName.includes(q) && !cName.includes(q) && !pack.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [catalog, searchQuery, brandFilter, categoryFilter, availabilityFilter]);

  const filteredRequests = useMemo(() => {
    if (!requestStatusFilter) return requirements;
    return requirements.filter(r => r.status === requestStatusFilter);
  }, [requirements, requestStatusFilter]);

  const openNewRequestWithProduct = (product) => {
    setRequestForm({
      catalogId: product.id,
      brand: product.brand || "",
      productName: product.productName || "",
      category: product.category || "",
      unitPackSize: product.unitPackSize || product.packSize || "",
      quantity: "1",
      priority: "MEDIUM",
      unitPrice: product.defaultPrice ? String(product.defaultPrice) : "",
      note: ""
    });
    setActiveSection("new_request");
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!requestForm.productName.trim()) {
      setStatus({ error: "Product name is required", success: "" });
      return;
    }
    setSaving(true);
    try {
      await api.post("/owner/product-requirements", {
        catalogId: requestForm.catalogId || null,
        productName: requestForm.productName,
        brand: requestForm.brand,
        category: requestForm.category,
        packSize: requestForm.unitPackSize,
        unitPackSize: requestForm.unitPackSize,
        unitPrice: requestForm.unitPrice ? parseFloat(requestForm.unitPrice) : null,
        quantity: parseInt(requestForm.quantity, 10) || 1,
        priority: requestForm.priority,
        note: requestForm.note
      });
      setStatus({ error: "", success: `Requirement submitted for "${requestForm.productName}"!` });
      setRequestForm({
        catalogId: "",
        brand: "",
        productName: "",
        category: "",
        unitPackSize: "",
        quantity: "1",
        priority: "MEDIUM",
        unitPrice: "",
        note: ""
      });
      await load();
      setActiveSection("my_requests");
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not submit request"), success: "" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this request?")) return;
    try {
      await api.delete(`/owner/product-requirements/${id}`);
      setStatus({ error: "", success: "Request deleted successfully." });
      if (selectedDetail && selectedDetail.id === id) {
        setSelectedDetail(null);
        setActiveSection("my_requests");
      }
      await load();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Failed to delete request"), success: "" });
    }
  };

  if (loading) return <div className="page-shell"><PageLoader title="Loading Product Requests" /></div>;

  return (
    <div className="page-shell">
      <style>{`
        .pr-hero-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .pr-tabs-nav {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 10px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .pr-tab-btn {
          white-space: nowrap;
          flex-shrink: 0;
          padding: 8px 14px;
          border-radius: 8px;
          border: none;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .pr-filters-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 12px;
          align-items: center;
        }
        .pr-form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .pr-form-grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
        }
        .pr-form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          flex-wrap: wrap;
          margin-top: 10px;
        }
        @media (max-width: 768px) {
          .pr-hero-head {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .pr-hero-head button {
            width: 100% !important;
            justify-content: center !important;
          }
          .pr-filters-grid {
            grid-template-columns: 1fr !important;
          }
          .pr-search-box {
            grid-column: 1 / -1 !important;
          }
          .pr-form-grid-2, 
          .pr-form-grid-3 {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .pr-form-actions {
            flex-direction: column-reverse !important;
            width: 100% !important;
          }
          .pr-form-actions button {
            width: 100% !important;
            justify-content: center !important;
            padding: 12px !important;
          }
        }
      `}</style>
      {/* Header */}
      <div className="hero-card" style={{ padding: "20px 24px", marginBottom: 20 }}>
        <div className="pr-hero-head">
          <div>
            <h1 style={{ margin: 0, fontSize: "1.35rem" }}>Product Requests</h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.85rem" }}>
              Explore available catalog items, place new orders/requirements, and track request status.
            </p>
          </div>
          <button
            onClick={() => {
              setRequestForm({
                catalogId: "",
                brand: "",
                productName: "",
                category: "",
                unitPackSize: "",
                quantity: "1",
                priority: "MEDIUM",
                unitPrice: "",
                note: ""
              });
              setActiveSection("new_request");
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 18px",
              background: "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(79, 70, 229, 0.25)"
            }}
          >
            <Plus size={16} /> New Request
          </button>
        </div>
      </div>

      {status.error && (
        <div style={{ background: "#fef2f2", color: "#991b1b", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: "0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{status.error}</span>
          <button onClick={() => setStatus({ ...status, error: "" })} style={{ background: "none", border: "none", color: "#991b1b", cursor: "pointer" }}>✕</button>
        </div>
      )}
      {status.success && (
        <div style={{ background: "#ecfdf5", color: "#065f46", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: "0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{status.success}</span>
          <button onClick={() => setStatus({ ...status, success: "" })} style={{ background: "none", border: "none", color: "#065f46", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* 4 Section Navigation Tabs (Point 2) */}
      <div className="pr-tabs-nav">
        <button
          onClick={() => setActiveSection("available")}
          className="pr-tab-btn"
          style={{
            background: activeSection === "available" ? "#4f46e5" : "#f1f5f9",
            color: activeSection === "available" ? "white" : "#475569",
          }}
        >
          <Package size={16} /> Available Products <span style={{ background: activeSection === "available" ? "rgba(255,255,255,0.25)" : "#e2e8f0", padding: "1px 7px", borderRadius: 10, fontSize: "0.75rem", fontWeight: 700 }}>{catalog.length}</span>
        </button>

        <button
          onClick={() => setActiveSection("new_request")}
          className="pr-tab-btn"
          style={{
            background: activeSection === "new_request" ? "#4f46e5" : "#f1f5f9",
            color: activeSection === "new_request" ? "white" : "#475569",
          }}
        >
          <Plus size={16} /> New Request
        </button>

        <button
          onClick={() => setActiveSection("my_requests")}
          className="pr-tab-btn"
          style={{
            background: activeSection === "my_requests" ? "#4f46e5" : "#f1f5f9",
            color: activeSection === "my_requests" ? "white" : "#475569",
          }}
        >
          <ListFilter size={16} /> My Requests <span style={{ background: activeSection === "my_requests" ? "rgba(255,255,255,0.25)" : "#e2e8f0", padding: "1px 7px", borderRadius: 10, fontSize: "0.75rem", fontWeight: 700 }}>{requirements.length}</span>
        </button>

        {selectedDetail && (
          <button
            onClick={() => setActiveSection("detail")}
            className="pr-tab-btn"
            style={{
              background: activeSection === "detail" ? "#4f46e5" : "#f1f5f9",
              color: activeSection === "detail" ? "white" : "#475569",
            }}
          >
            <FileText size={16} /> Request Detail
          </button>
        )}
      </div>

      {/* SECTION 1: AVAILABLE PRODUCTS (Points 3, 4, 5, 6) */}
      {activeSection === "available" && (
        <div className="panel-card" style={{ padding: "20px 16px" }}>
          {/* Search & Filter Controls (Point 6) */}
          <div style={{ background: "#f8fafc", padding: "14px 12px", borderRadius: 12, border: "1px solid #e2e8f0", marginBottom: 20 }}>
            <div className="pr-filters-grid">
              <div className="pr-search-box" style={{ position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                  type="text"
                  className="search-input-field"
                  placeholder="Search Product Name, Brand, Category..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", paddingLeft: "40px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }}
                />
              </div>

              <CustomSelect value={brandFilter} onChange={e => setBrandFilter(e.target.value)} style={{ width: "100%" }}>
                <option value="">All Brands</option>
                {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
              </CustomSelect>

              <CustomSelect value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ width: "100%" }}>
                <option value="">All Categories</option>
                {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </CustomSelect>

              <CustomSelect value={availabilityFilter} onChange={e => setAvailabilityFilter(e.target.value)} style={{ width: "100%" }}>
                <option value="">All Availability</option>
                <option value="AVAILABLE">Available</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
                <option value="INACTIVE">Inactive</option>
              </CustomSelect>
            </div>
            
            {(searchQuery || brandFilter || categoryFilter || availabilityFilter) && (
              <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Showing {filteredCatalog.length} of {catalog.length} available product(s)</span>
                <button
                  onClick={() => { setSearchQuery(""); setBrandFilter(""); setCategoryFilter(""); setAvailabilityFilter(""); }}
                  style={{ background: "none", border: "none", color: "#4f46e5", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>

          {/* Product Cards List (Order: Brand -> Product Name -> Category -> Unit / Pack Size -> Availability) (Point 4 & 5) */}
          {filteredCatalog.length === 0 ? (
            <EmptyState title="No Products Match" message="No available products match your filter criteria." />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {filteredCatalog.map((product) => {
                const isAvail = product.isActive !== false && product.availableQty > 0;
                const packText = product.unitPackSize || product.packSize || "Standard";

                return (
                  <div
                    key={product.id}
                    style={{
                      background: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                      transition: "all 0.15s"
                    }}
                  >
                    <div>
                      {/* 1. Brand */}
                      <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>
                        {product.brand || "Standard Brand"}
                      </div>

                      {/* 2. Product Name */}
                      <h4 style={{ margin: "0 0 6px", fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
                        {product.productName}
                      </h4>

                      {/* 3. Category & 4. Unit / Pack Size */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                        <span style={{ background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: 6, fontSize: "0.72rem", fontWeight: 600 }}>
                          Category: {product.category || "General"}
                        </span>
                        <span style={{ background: "#eff6ff", color: "#1e40af", padding: "2px 8px", borderRadius: 6, fontSize: "0.72rem", fontWeight: 700 }}>
                          Pack: {packText}
                        </span>
                      </div>

                      {/* 5. Availability Status & Qty */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "8px 12px", borderRadius: 8, fontSize: "0.8rem", marginBottom: 12 }}>
                        <div>
                          <span style={{ color: "#64748b" }}>Status: </span>
                          <strong style={{ color: isAvail ? "#16a34a" : "#dc2626" }}>
                            {product.isActive === false ? "Inactive" : (product.availableQty > 0 ? "Available" : "Out of Stock")}
                          </strong>
                        </div>
                        <div style={{ fontWeight: 700, color: "#334155" }}>
                          Qty: {product.availableQty || 0}
                        </div>
                      </div>

                      {product.description && (
                        <p style={{ margin: "0 0 12px", fontSize: "0.78rem", color: "#64748b", lineHeight: 1.4 }}>
                          {product.description}
                        </p>
                      )}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
                      <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                        {product.defaultPrice ? `₹${fmt(product.defaultPrice)}` : "Price on Request"}
                      </div>
                      <button
                        onClick={() => openNewRequestWithProduct(product)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 14px",
                          background: "#0f172a",
                          color: "white",
                          border: "none",
                          borderRadius: 8,
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        <ShoppingCart size={14} /> Request
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: NEW REQUEST (Points 2 & 7) */}
      {activeSection === "new_request" && (
        <div className="panel-card" style={{ padding: 24, maxWidth: 680, margin: "0 auto" }}>
          <h3 style={{ margin: "0 0 6px", fontSize: "1.15rem", color: "#0f172a" }}>Submit Product Request</h3>
          <p style={{ margin: "0 0 20px", fontSize: "0.85rem", color: "#64748b" }}>
            Select an item from our available catalog or enter details for a custom product requirement.
          </p>

          <form onSubmit={handleCreateRequest} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Quick Catalog Product Selector (Point 7) */}
            <label>
              <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>
                Select from Available Products <span style={{ fontWeight: 500, color: "#64748b" }}>— Auto-fills details</span>
              </span>
              <CustomSelect
                value={requestForm.catalogId || ""}
                onChange={e => {
                  const selId = e.target.value;
                  const item = catalog.find(c => c.id === selId);
                  if (item) {
                    setRequestForm({
                      ...requestForm,
                      catalogId: item.id,
                      brand: item.brand || "",
                      productName: item.productName || "",
                      category: item.category || "",
                      unitPackSize: item.unitPackSize || item.packSize || "",
                      unitPrice: item.defaultPrice ? String(item.defaultPrice) : ""
                    });
                  } else {
                    setRequestForm({ ...requestForm, catalogId: "" });
                  }
                }}
                style={{ width: "100%" }}
              >
                <option value="">Choose an Available Product or enter details manually below</option>
                {catalog.filter(c => c.isActive !== false).map(c => {
                  const labelParts = [];
                  if (c.brand) labelParts.push(c.brand);
                  labelParts.push(c.productName);
                  if (c.unitPackSize || c.packSize) labelParts.push(c.unitPackSize || c.packSize);
                  labelParts.push(c.availableQty > 0 ? `Stock: ${c.availableQty}` : "Out of Stock");
                  return (
                    <option key={c.id} value={c.id}>
                      {labelParts.join(" — ")}
                    </option>
                  );
                })}
              </CustomSelect>
            </label>

            <div className="pr-form-grid-2">
              <label>
                <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Brand *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. L'Oréal Professional, Wella, Schwarzkopf"
                  value={requestForm.brand}
                  onChange={e => setRequestForm({ ...requestForm, brand: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                />
              </label>

              <label>
                <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Product Name *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Majirel Hair Color 5.1"
                  value={requestForm.productName}
                  onChange={e => setRequestForm({ ...requestForm, productName: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                />
              </label>
            </div>

            <div className="pr-form-grid-2">
              <label>
                <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Category</span>
                <CustomSelect
                  value={requestForm.category}
                  onChange={e => setRequestForm({ ...requestForm, category: e.target.value })}
                  style={{ width: "100%" }}
                >
                  <option value="">Select Salon Category...</option>
                  {SALON_PRODUCT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </CustomSelect>
              </label>

              <label>
                <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Unit / Pack Size</span>
                <input
                  type="text"
                  placeholder="e.g. 50 ml, 100 ml, 500 ml, 1 L, Pack of 12"
                  value={requestForm.unitPackSize}
                  onChange={e => setRequestForm({ ...requestForm, unitPackSize: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                />
              </label>
            </div>

            <div className="pr-form-grid-3">
              <label>
                <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Quantity *</span>
                <input
                  type="number"
                  min="1"
                  required
                  value={requestForm.quantity}
                  onChange={e => setRequestForm({ ...requestForm, quantity: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                />
              </label>

              <label>
                <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Priority / Urgency</span>
                <CustomSelect
                  value={requestForm.priority}
                  onChange={e => setRequestForm({ ...requestForm, priority: e.target.value })}
                  style={{ width: "100%" }}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </CustomSelect>
              </label>

              <label>
                <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Est. Price (INR)</span>
                <input
                  type="number"
                  placeholder="Optional"
                  value={requestForm.unitPrice}
                  onChange={e => setRequestForm({ ...requestForm, unitPrice: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                />
              </label>
            </div>

            <label>
              <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Note / Requirement</span>
              <textarea
                rows={3}
                placeholder="Specific shade, brand variant, urgency details, or distributor notes..."
                value={requestForm.note}
                onChange={e => setRequestForm({ ...requestForm, note: e.target.value })}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
              />
            </label>

            <div className="pr-form-actions">
              <button
                type="button"
                onClick={() => setActiveSection("available")}
                style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid #e2e8f0", background: "white", color: "#475569", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{ padding: "10px 22px", borderRadius: 8, border: "none", background: "#4f46e5", color: "white", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
              >
                {saving ? "Submitting..." : "Submit Product Request"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 3: MY REQUESTS (Points 2 & 8) */}
      {activeSection === "my_requests" && (
        <div className="panel-card" style={{ padding: "20px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>My Requests ({filteredRequests.length})</h3>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["", "NEW", "PENDING", "APPROVED", "REJECTED", "COMPLETED"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setRequestStatusFilter(st)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "none",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: requestStatusFilter === st ? "#4f46e5" : "#f1f5f9",
                    color: requestStatusFilter === st ? "white" : "#64748b"
                  }}
                >
                  {st ? statusColors[st]?.label || st : "All"}
                </button>
              ))}
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <EmptyState title="No Requests Found" message="You have not submitted any product requirements in this filter." />
          ) : (
            <div style={{ overflowX: "auto", width: "100%", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", minWidth: "750px", borderCollapse: "collapse", fontSize: 13, whiteSpace: "nowrap" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f1f5f9", background: "#f8fafc", color: "#64748b", fontWeight: 700 }}>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Request ID</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Product</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Category</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Pack Size</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Quantity</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Status</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Date</th>
                    <th style={{ padding: "12px 14px", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((r) => {
                    const sc = statusColors[r.status] || statusColors.NEW;
                    const reqIdFormatted = `#REQ-${r.id.slice(-6).toUpperCase()}`;

                    return (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 14px", fontWeight: 800, color: "#6366f1", fontSize: "0.78rem" }}>
                          {reqIdFormatted}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontSize: "0.72rem", color: "#6366f1", fontWeight: 800, textTransform: "uppercase" }}>{r.brand || "—"}</div>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>{r.productName}</div>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#475569" }}>{r.category || "—"}</td>
                        <td style={{ padding: "12px 14px", color: "#475569" }}>{r.unitPackSize || r.packSize || "Standard"}</td>
                        <td style={{ padding: "12px 14px", fontWeight: 700, color: "#0f172a" }}>{r.quantity || 1}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ background: sc.bg, color: sc.color, padding: "3px 8px", borderRadius: 100, fontSize: "0.7rem", fontWeight: 700 }}>
                            {sc.label}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#64748b", fontSize: 12 }}>
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            <button
                              onClick={() => { setSelectedDetail(r); setActiveSection("detail"); }}
                              title="View Details"
                              style={{ padding: 6, border: "1px solid #cbd5e1", borderRadius: 6, background: "white", color: "#3b82f6", cursor: "pointer" }}
                            >
                              <Eye size={14} />
                            </button>
                            {r.status === "NEW" && (
                              <button
                                onClick={() => handleDelete(r.id)}
                                title="Delete"
                                style={{ padding: 6, border: "1px solid #cbd5e1", borderRadius: 6, background: "white", color: "#ef4444", cursor: "pointer" }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: REQUEST DETAIL (Point 2) */}
      {activeSection === "detail" && selectedDetail && (
        <div className="panel-card" style={{ padding: 24, maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#6366f1", textTransform: "uppercase" }}>
                Brand: {selectedDetail.brand || "—"}
              </div>
              <h3 style={{ margin: "2px 0 0", fontSize: "1.2rem", color: "#0f172a" }}>
                {selectedDetail.productName}
              </h3>
            </div>
            <span style={{ background: statusColors[selectedDetail.status]?.bg, color: statusColors[selectedDetail.status]?.color, padding: "4px 12px", borderRadius: 100, fontSize: "0.78rem", fontWeight: 700 }}>
              {statusColors[selectedDetail.status]?.label || selectedDetail.status}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, background: "#f8fafc", padding: 16, borderRadius: 10, marginBottom: 16, fontSize: "0.85rem" }}>
            <div><span style={{ color: "#64748b" }}>Category:</span> <strong>{selectedDetail.category || "—"}</strong></div>
            <div><span style={{ color: "#64748b" }}>Pack Size:</span> <strong>{selectedDetail.unitPackSize || selectedDetail.packSize || "Standard"}</strong></div>
            <div><span style={{ color: "#64748b" }}>Quantity:</span> <strong>{selectedDetail.quantity || 1}</strong></div>
            <div><span style={{ color: "#64748b" }}>Priority:</span> <strong>{selectedDetail.priority}</strong></div>
            <div><span style={{ color: "#64748b" }}>Est. Price:</span> <strong>{selectedDetail.unitPrice ? `₹${fmt(selectedDetail.unitPrice)}` : "—"}</strong></div>
            <div><span style={{ color: "#64748b" }}>Requested On:</span> <strong>{new Date(selectedDetail.createdAt).toLocaleDateString()}</strong></div>
          </div>

          {selectedDetail.note && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Salon Note</div>
              <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, fontSize: "0.85rem", color: "#334155", borderLeft: "3px solid #6366f1" }}>
                {selectedDetail.note}
              </div>
            </div>
          )}

          {selectedDetail.remark && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Admin Remark</div>
              <div style={{ background: "#ecfdf5", padding: 12, borderRadius: 8, fontSize: "0.85rem", color: "#065f46", borderLeft: "3px solid #10b981" }}>
                {selectedDetail.remark}
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <button
              onClick={() => setActiveSection("my_requests")}
              style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", background: "white", color: "#475569", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
            >
              Back to Requests
            </button>
            <button
              onClick={() => openNewRequestWithProduct(selectedDetail)}
              style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#4f46e5", color: "white", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
            >
              Re-order This Item
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
