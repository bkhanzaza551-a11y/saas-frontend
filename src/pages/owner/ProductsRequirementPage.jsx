import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import CustomSelect from "../../components/CustomSelect";
import { 
  Package, Plus, Eye, Trash2, ShoppingCart, Search, 
  Layers, ListFilter, FileText, CheckCircle2, ArrowRight,
  Sparkles, AlertCircle, RefreshCw
} from "lucide-react";

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

  // Filters for Available Products
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");

  // Filter for My Requests
  const [requestStatusFilter, setRequestStatusFilter] = useState("");

  // Detail View State
  const [selectedDetail, setSelectedDetail] = useState(null);

  // Request Form States
  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const [selectedCatalogProduct, setSelectedCatalogProduct] = useState(null);
  const [requestForm, setRequestForm] = useState({
    catalogId: "",
    brand: "",
    productName: "",
    category: "",
    unitPackSize: "",
    quantity: 1,
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

  // Filtered Catalog Items
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
    setIsCustomProduct(false);
    setSelectedCatalogProduct(product);
    setRequestForm({
      catalogId: product.id,
      brand: product.brand || "",
      productName: product.productName || "",
      category: product.category || "",
      unitPackSize: product.unitPackSize || product.packSize || "Standard",
      quantity: 1,
      priority: "MEDIUM",
      unitPrice: product.defaultPrice ? String(product.defaultPrice) : "",
      note: ""
    });
    setActiveSection("new_request");
  };

  const openCustomNewRequest = () => {
    setIsCustomProduct(true);
    setSelectedCatalogProduct(null);
    setRequestForm({
      catalogId: "",
      brand: "",
      productName: "",
      category: "",
      unitPackSize: "",
      quantity: 1,
      priority: "MEDIUM",
      unitPrice: "",
      note: ""
    });
    setActiveSection("new_request");
  };

  const handleSelectCatalogItem = (selId) => {
    if (selId === "CUSTOM") {
      openCustomNewRequest();
      return;
    }
    const item = catalog.find(c => c.id === selId);
    if (item) {
      setIsCustomProduct(false);
      setSelectedCatalogProduct(item);
      setRequestForm({
        ...requestForm,
        catalogId: item.id,
        brand: item.brand || "",
        productName: item.productName || "",
        category: item.category || "",
        unitPackSize: item.unitPackSize || item.packSize || "Standard",
        unitPrice: item.defaultPrice ? String(item.defaultPrice) : ""
      });
    } else {
      setSelectedCatalogProduct(null);
      setRequestForm({ ...requestForm, catalogId: "" });
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!requestForm.productName.trim()) {
      setStatus({ error: "Product name is required", success: "" });
      return;
    }
    const qty = parseInt(requestForm.quantity, 10);
    if (isNaN(qty) || qty < 1) {
      setStatus({ error: "Please enter a valid quantity (at least 1)", success: "" });
      return;
    }

    setSaving(true);
    try {
      await api.post("/owner/product-requirements", {
        catalogId: isCustomProduct ? null : (requestForm.catalogId || null),
        productName: requestForm.productName.trim(),
        brand: requestForm.brand?.trim() || null,
        category: requestForm.category || null,
        packSize: requestForm.unitPackSize || null,
        unitPackSize: requestForm.unitPackSize || null,
        unitPrice: requestForm.unitPrice ? parseFloat(requestForm.unitPrice) : null,
        quantity: qty,
        priority: requestForm.priority || "MEDIUM",
        note: requestForm.note?.trim() || null
      });
      setStatus({ error: "", success: `Request placed successfully for ${qty}x "${requestForm.productName}"!` });
      await load();
      setActiveSection("my_requests");
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not submit request"), success: "" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this product request?")) return;
    try {
      await api.delete(`/owner/product-requirements/${id}`);
      setStatus({ error: "", success: "Product request cancelled successfully." });
      if (selectedDetail && selectedDetail.id === id) {
        setSelectedDetail(null);
        setActiveSection("my_requests");
      }
      await load();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Failed to cancel request"), success: "" });
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
          transition: all 0.15s;
        }
        .pr-filters-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 12px;
          align-items: center;
        }
        .pr-locked-badge {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .pr-qty-box {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pr-qty-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: white;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #334155;
        }
        .pr-qty-btn:hover {
          background: #f1f5f9;
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
        }
      `}</style>

      {/* Header */}
      <div className="hero-card" style={{ padding: "20px 24px", marginBottom: 20 }}>
        <div className="pr-hero-head">
          <div>
            <h1 style={{ margin: 0, fontSize: "1.35rem" }}>Product Requests & Ordering</h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.85rem" }}>
              Order salon products from the SuperAdmin catalog or submit custom requirements.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => {
                if (catalog.length > 0) {
                  openNewRequestWithProduct(catalog[0]);
                } else {
                  openCustomNewRequest();
                }
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
              <Plus size={16} /> Place Product Request
            </button>
          </div>
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

      {/* 4 Section Navigation Tabs */}
      <div className="pr-tabs-nav">
        <button
          onClick={() => setActiveSection("available")}
          className="pr-tab-btn"
          style={{
            background: activeSection === "available" ? "#4f46e5" : "#f1f5f9",
            color: activeSection === "available" ? "white" : "#475569",
          }}
        >
          <Package size={16} /> Available Catalog Products <span style={{ background: activeSection === "available" ? "rgba(255,255,255,0.25)" : "#e2e8f0", padding: "1px 7px", borderRadius: 10, fontSize: "0.75rem", fontWeight: 700 }}>{catalog.length}</span>
        </button>

        <button
          onClick={() => {
            if (!requestForm.productName && catalog.length > 0) {
              openNewRequestWithProduct(catalog[0]);
            } else {
              setActiveSection("new_request");
            }
          }}
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
          <ListFilter size={16} /> My Salon Requests <span style={{ background: activeSection === "my_requests" ? "rgba(255,255,255,0.25)" : "#e2e8f0", padding: "1px 7px", borderRadius: 10, fontSize: "0.75rem", fontWeight: 700 }}>{requirements.length}</span>
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

      {/* SECTION 1: AVAILABLE PRODUCTS */}
      {activeSection === "available" && (
        <div className="panel-card" style={{ padding: "20px 16px" }}>
          {/* Search & Filter Controls */}
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

          {/* Product Cards List */}
          {filteredCatalog.length === 0 ? (
            <EmptyState 
              title="No Products Found in Catalog" 
              message="No available products match your filter. You can also place a custom requirement." 
              action={
                <button
                  onClick={openCustomNewRequest}
                  style={{ marginTop: 12, padding: "8px 16px", background: "#4f46e5", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Submit Custom Product Requirement
                </button>
              }
            />
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
                      padding: 18,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                      transition: "all 0.15s"
                    }}
                  >
                    <div>
                      {/* Brand & Category badges */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {product.brand || "Standard Brand"}
                        </span>
                        <span style={{ background: isAvail ? "#ecfdf5" : "#fef2f2", color: isAvail ? "#16a34a" : "#dc2626", padding: "2px 8px", borderRadius: 100, fontSize: "0.7rem", fontWeight: 700 }}>
                          {product.isActive === false ? "Inactive" : (product.availableQty > 0 ? `In Stock (${product.availableQty})` : "Out of Stock")}
                        </span>
                      </div>

                      {/* Product Name */}
                      <h4 style={{ margin: "0 0 8px", fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                        {product.productName}
                      </h4>

                      {/* Category & Unit / Pack Size */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                        <span style={{ background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: 6, fontSize: "0.72rem", fontWeight: 600 }}>
                          {product.category || "General Supplies"}
                        </span>
                        <span style={{ background: "#eff6ff", color: "#1e40af", padding: "3px 8px", borderRadius: 6, fontSize: "0.72rem", fontWeight: 700 }}>
                          Pack: {packText}
                        </span>
                      </div>

                      {product.description && (
                        <p style={{ margin: "0 0 12px", fontSize: "0.78rem", color: "#64748b", lineHeight: 1.4 }}>
                          {product.description}
                        </p>
                      )}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 14 }}>
                      <div>
                        <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>Unit Price</div>
                        <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>
                          {product.defaultPrice ? `₹${fmt(product.defaultPrice)}` : "Price on Request"}
                        </div>
                      </div>
                      <button
                        onClick={() => openNewRequestWithProduct(product)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "9px 16px",
                          background: "#0f172a",
                          color: "white",
                          border: "none",
                          borderRadius: 8,
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "background 0.15s"
                        }}
                      >
                        <ShoppingCart size={15} /> Request
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: NEW REQUEST */}
      {activeSection === "new_request" && (
        <div className="panel-card" style={{ padding: 24, maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: "1.2rem", color: "#0f172a" }}>Submit Product Request</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                {isCustomProduct ? "Enter details for custom salon item not found in catalog." : "Select item and specify how many units your salon needs."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (isCustomProduct) {
                  if (catalog.length > 0) openNewRequestWithProduct(catalog[0]);
                  else setIsCustomProduct(false);
                } else {
                  openCustomNewRequest();
                }
              }}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: "white",
                color: "#4f46e5",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {isCustomProduct ? "← Select from Catalog" : "+ Custom Item (Not in Catalog)"}
            </button>
          </div>

          <form onSubmit={handleCreateRequest} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            
            {/* Catalog item picker */}
            {!isCustomProduct && (
              <label>
                <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 6, color: "#334155" }}>
                  Select Catalog Product
                </span>
                <CustomSelect
                  value={requestForm.catalogId || ""}
                  onChange={e => handleSelectCatalogItem(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <option value="">-- Choose a Product from Catalog --</option>
                  {catalog.filter(c => c.isActive !== false).map(c => {
                    const priceLabel = c.defaultPrice ? `₹${c.defaultPrice}` : "Price on req";
                    const packLabel = c.unitPackSize || c.packSize || "Std";
                    const stockLabel = c.availableQty > 0 ? `Stock: ${c.availableQty}` : "Out of stock";
                    return (
                      <option key={c.id} value={c.id}>
                        {c.brand ? `[${c.brand}] ` : ""}{c.productName} — {packLabel} — {priceLabel} ({stockLabel})
                      </option>
                    );
                  })}
                  <option value="CUSTOM">+ Other / Custom Product (Not listed above)</option>
                </CustomSelect>
              </label>
            )}

            {/* Readonly Product Summary Card for Catalog Items */}
            {!isCustomProduct && selectedCatalogProduct && (
              <div className="pr-locked-badge">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#6366f1", textTransform: "uppercase" }}>
                      {selectedCatalogProduct.brand || "Standard Brand"}
                    </div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                      {selectedCatalogProduct.productName}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>SuperAdmin Unit Price</div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#059669" }}>
                      {selectedCatalogProduct.defaultPrice ? `₹${fmt(selectedCatalogProduct.defaultPrice)}` : "Price on Request"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, background: "white", padding: "10px 14px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.8rem" }}>
                  <div><span style={{ color: "#64748b" }}>Category:</span> <strong style={{ color: "#334155" }}>{selectedCatalogProduct.category || "General"}</strong></div>
                  <div><span style={{ color: "#64748b" }}>Pack Size:</span> <strong style={{ color: "#334155" }}>{selectedCatalogProduct.unitPackSize || selectedCatalogProduct.packSize || "Standard"}</strong></div>
                  <div><span style={{ color: "#64748b" }}>Catalog Stock:</span> <strong style={{ color: selectedCatalogProduct.availableQty > 0 ? "#16a34a" : "#dc2626" }}>{selectedCatalogProduct.availableQty || 0} units</strong></div>
                </div>
              </div>
            )}

            {/* If Custom Product: Show editable inputs */}
            {isCustomProduct && (
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#4f46e5", fontSize: "0.85rem", fontWeight: 700 }}>
                  <Sparkles size={16} /> Custom Product Requirement
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <label>
                    <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Brand *</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. L'Oréal, Schwarzkopf, Matrix"
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
                      placeholder="e.g. Hair Botox Treatment 500ml"
                      value={requestForm.productName}
                      onChange={e => setRequestForm({ ...requestForm, productName: e.target.value })}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                    />
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
                      placeholder="e.g. 500 ml, 1 L, Pack of 10"
                      value={requestForm.unitPackSize}
                      onChange={e => setRequestForm({ ...requestForm, unitPackSize: e.target.value })}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                    />
                  </label>
                </div>

                <label>
                  <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Est. Expected Price per Unit (Optional)</span>
                  <input
                    type="number"
                    placeholder="Enter estimated unit price in INR"
                    value={requestForm.unitPrice}
                    onChange={e => setRequestForm({ ...requestForm, unitPrice: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                  />
                </label>
              </div>
            )}

            {/* Salon Owner Order Inputs: Quantity + Priority */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, background: "#f1f5f9", padding: 16, borderRadius: 12 }}>
              <label>
                <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 6, color: "#0f172a" }}>
                  Quantity Needed for Your Salon *
                </span>
                <div className="pr-qty-box">
                  <button
                    type="button"
                    className="pr-qty-btn"
                    onClick={() => setRequestForm(prev => ({ ...prev, quantity: Math.max(1, (Number(prev.quantity) || 1) - 1) }))}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    required
                    value={requestForm.quantity}
                    onChange={e => setRequestForm({ ...requestForm, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                    style={{ width: "80px", textAlign: "center", padding: 8, borderRadius: 8, border: "1px solid #cbd5e1", fontWeight: 700, fontSize: "1rem" }}
                  />
                  <button
                    type="button"
                    className="pr-qty-btn"
                    onClick={() => setRequestForm(prev => ({ ...prev, quantity: (Number(prev.quantity) || 1) + 1 }))}
                  >
                    +
                  </button>
                </div>
              </label>

              <label>
                <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 6, color: "#0f172a" }}>
                  Priority / Urgency
                </span>
                <CustomSelect
                  value={requestForm.priority}
                  onChange={e => setRequestForm({ ...requestForm, priority: e.target.value })}
                  style={{ width: "100%", height: 38 }}
                >
                  <option value="LOW">Low (Routine restock)</option>
                  <option value="MEDIUM">Medium (Normal)</option>
                  <option value="HIGH">High (Urgent restocking)</option>
                  <option value="URGENT">Urgent (Immediate requirement)</option>
                </CustomSelect>
              </label>
            </div>

            {/* Total Estimated Cost Summary */}
            {requestForm.unitPrice && Number(requestForm.unitPrice) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px 16px", borderRadius: 10 }}>
                <span style={{ fontSize: "0.85rem", color: "#166534", fontWeight: 600 }}>
                  Estimated Total for {requestForm.quantity} unit(s):
                </span>
                <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#166534" }}>
                  ₹{fmt(Number(requestForm.unitPrice) * Number(requestForm.quantity))}
                </span>
              </div>
            )}

            <label>
              <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>
                Specific Notes / Instructions for SuperAdmin (Optional)
              </span>
              <textarea
                rows={3}
                placeholder="Specify preferred shade, brand variant, required delivery date, or remarks..."
                value={requestForm.note}
                onChange={e => setRequestForm({ ...requestForm, note: e.target.value })}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
              />
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
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
                style={{ padding: "10px 22px", borderRadius: 8, border: "none", background: "#4f46e5", color: "white", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", boxShadow: "0 2px 6px rgba(79, 70, 229, 0.3)" }}
              >
                {saving ? "Submitting Request..." : "Submit Product Request"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 3: MY SALON REQUESTS */}
      {activeSection === "my_requests" && (
        <div className="panel-card" style={{ padding: "20px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem" }}>My Product Requests ({filteredRequests.length})</h3>
              <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#64748b" }}>
                Showing only requirements placed by your salon.
              </p>
            </div>
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
            <EmptyState 
              title="No Requests Found" 
              message="Your salon has not submitted any product requests under this filter." 
              action={
                <button
                  onClick={() => setActiveSection("available")}
                  style={{ marginTop: 12, padding: "8px 16px", background: "#4f46e5", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Browse Available Catalog
                </button>
              }
            />
          ) : (
            <div style={{ overflowX: "auto", width: "100%", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", minWidth: "780px", borderCollapse: "collapse", fontSize: 13, whiteSpace: "nowrap" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f1f5f9", background: "#f8fafc", color: "#64748b", fontWeight: 700 }}>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Request ID</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Product</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Category</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Pack Size</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Qty</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Price / Total</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Priority</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Status</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Date</th>
                    <th style={{ padding: "12px 14px", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((r) => {
                    const sc = statusColors[r.status] || statusColors.NEW;
                    const pc = priorityColors[r.priority] || priorityColors.MEDIUM;
                    const reqIdFormatted = `#REQ-${r.id.slice(-6).toUpperCase()}`;
                    const unitP = r.unitPrice || r.defaultPrice;
                    const totalP = unitP ? unitP * (r.quantity || 1) : null;

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
                        <td style={{ padding: "12px 14px", fontWeight: 800, color: "#0f172a" }}>{r.quantity || 1}</td>
                        <td style={{ padding: "12px 14px" }}>
                          {unitP ? (
                            <div>
                              <strong style={{ color: "#0f172a" }}>₹{fmt(totalP)}</strong>
                              <div style={{ fontSize: "0.7rem", color: "#64748b" }}>₹{fmt(unitP)} / unit</div>
                            </div>
                          ) : (
                            <span style={{ color: "#94a3b8" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ background: pc.bg, color: pc.color, padding: "3px 8px", borderRadius: 6, fontSize: "0.7rem", fontWeight: 700 }}>
                            {r.priority}
                          </span>
                        </td>
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
                              style={{ padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: 6, background: "white", color: "#3b82f6", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.75rem", fontWeight: 600 }}
                            >
                              <Eye size={13} /> View
                            </button>
                            {r.status === "NEW" && (
                              <button
                                onClick={() => handleDelete(r.id)}
                                title="Cancel Request"
                                style={{ padding: "6px 8px", border: "1px solid #fee2e2", borderRadius: 6, background: "#fef2f2", color: "#ef4444", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.75rem", fontWeight: 600 }}
                              >
                                <Trash2 size={13} /> Cancel
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

      {/* SECTION 4: REQUEST DETAIL */}
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
            <div><span style={{ color: "#64748b" }}>Quantity:</span> <strong>{selectedDetail.quantity || 1} units</strong></div>
            <div><span style={{ color: "#64748b" }}>Priority:</span> <strong>{selectedDetail.priority}</strong></div>
            <div><span style={{ color: "#64748b" }}>Unit Price:</span> <strong>{selectedDetail.unitPrice ? `₹${fmt(selectedDetail.unitPrice)}` : "—"}</strong></div>
            <div><span style={{ color: "#64748b" }}>Total Cost:</span> <strong style={{ color: "#059669" }}>{selectedDetail.unitPrice ? `₹${fmt(selectedDetail.unitPrice * (selectedDetail.quantity || 1))}` : "—"}</strong></div>
            <div><span style={{ color: "#64748b" }}>Requested On:</span> <strong>{new Date(selectedDetail.createdAt).toLocaleDateString()}</strong></div>
          </div>

          {selectedDetail.notes && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Salon Note</div>
              <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, fontSize: "0.85rem", color: "#334155", borderLeft: "3px solid #6366f1" }}>
                {selectedDetail.notes}
              </div>
            </div>
          )}

          {selectedDetail.description && !selectedDetail.notes && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Description / Note</div>
              <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, fontSize: "0.85rem", color: "#334155", borderLeft: "3px solid #6366f1" }}>
                {selectedDetail.description}
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
