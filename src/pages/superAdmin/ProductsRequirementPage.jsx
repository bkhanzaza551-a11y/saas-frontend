import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import CustomSelect from "../../components/CustomSelect";
import { Clock, CheckCircle, X, ExternalLink, Calendar, Users, Package, Briefcase, Plus, Edit2, Trash2, Mail, Phone, Search, Filter, Layers, ListFilter, FileText } from "lucide-react";

const statusConfig = {
  NEW: { label: "New", color: "#2563eb", bg: "#eff6ff", icon: Clock },
  PENDING: { label: "Pending", color: "#d97706", bg: "#fffbeb", icon: Clock },
  APPROVED: { label: "Approved", color: "#10b981", bg: "#d1fae5", icon: CheckCircle },
  REJECTED: { label: "Rejected", color: "#ef4444", bg: "#fef2f2", icon: X },
  COMPLETED: { label: "Completed", color: "#166534", bg: "#f0fdf4", icon: CheckCircle }
};

const priorityColors = {
  LOW: { bg: "#f0fdf4", color: "#166534" },
  MEDIUM: { bg: "#fffbeb", color: "#d97706" },
  HIGH: { bg: "#fff7ed", color: "#c2410c" },
  URGENT: { bg: "#fef2f2", color: "#dc2626" }
};

const fmt = (val) => Number(val || 0).toLocaleString("en-IN");

const emptyCatalog = {
  productName: "",
  description: "",
  category: "",
  brand: "",
  unitPackSize: "",
  defaultPrice: "",
  availableQty: "0",
  isActive: true,
  notes: ""
};

export default function SuperAdminProductsRequirementPage() {
  const [requirements, setRequirements] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [searchParams] = useSearchParams();

  // 4 Sections: "available" | "new_request" | "requests" | "detail"
  const [activeSection, setActiveSection] = useState("available");

  // Filters for Available Products (Point 6)
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");

  // Filters for Requests
  const [requestFilter, setRequestFilter] = useState(searchParams.get("status") || "ALL");
  const [salonFilter, setSalonFilter] = useState("");

  // Catalog Form & Modals
  const [catalogForm, setCatalogForm] = useState(emptyCatalog);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [editCatalogItem, setEditCatalogItem] = useState(null);

  // New Request Form & Detail
  const [selectedReq, setSelectedReq] = useState(null);
  const [adminRequestForm, setAdminRequestForm] = useState({
    salonId: "",
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
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setStatus({ error: "", success: "" });
    try {
      const [resReqs, resCat, resSalons] = await Promise.all([
        api.get("/super-admin/product-requirements"),
        api.get("/super-admin/product-catalog"),
        api.get("/super-admin/salons").catch(() => ({ data: [] }))
      ]);
      setRequirements(resReqs.data || []);
      setCatalog(resCat.data || []);
      setSalons(resSalons.data || []);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Failed to load product data"), success: "" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Unique brands & categories
  const availableBrands = useMemo(() => {
    const set = new Set(catalog.map(c => c.brand).filter(Boolean));
    return Array.from(set).sort();
  }, [catalog]);

  const availableCategories = useMemo(() => {
    const set = new Set(catalog.map(c => c.category).filter(Boolean));
    return Array.from(set).sort();
  }, [catalog]);

  // Filtered Catalog
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

  // Filtered Requests
  const filteredRequests = useMemo(() => {
    return requirements.filter(r => {
      if (requestFilter !== "ALL" && r.status !== requestFilter) return false;
      if (salonFilter && r.salonId !== salonFilter) return false;
      return true;
    });
  }, [requirements, requestFilter, salonFilter]);

  const saveCatalogItem = async (e) => {
    e.preventDefault();
    if (!catalogForm.productName.trim() || !catalogForm.brand.trim()) {
      setStatus({ error: "Brand and Product Name are mandatory.", success: "" });
      return;
    }
    setSaving(true);
    try {
      if (editCatalogItem) {
        await api.patch(`/super-admin/product-catalog/${editCatalogItem.id}`, {
          ...catalogForm,
          packSize: catalogForm.unitPackSize
        });
        setStatus({ error: "", success: "Product catalog item updated successfully." });
      } else {
        await api.post("/super-admin/product-catalog", {
          ...catalogForm,
          packSize: catalogForm.unitPackSize
        });
        setStatus({ error: "", success: "New product added to catalog." });
      }
      setCatalogForm(emptyCatalog);
      setShowCatalogModal(false);
      setEditCatalogItem(null);
      await load();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Failed to save product"), success: "" });
    } finally {
      setSaving(false);
    }
  };

  const deleteCatalogItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this catalog product?")) return;
    try {
      await api.delete(`/super-admin/product-catalog/${id}`);
      setStatus({ error: "", success: "Product removed from catalog." });
      await load();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Failed to delete"), success: "" });
    }
  };

  const openEditCatalog = (item) => {
    setEditCatalogItem(item);
    setCatalogForm({
      productName: item.productName || "",
      description: item.description || "",
      category: item.category || "",
      brand: item.brand || "",
      unitPackSize: item.unitPackSize || item.packSize || "",
      defaultPrice: item.defaultPrice ? String(item.defaultPrice) : "",
      availableQty: String(item.availableQty || 0),
      isActive: item.isActive !== false,
      notes: item.notes || ""
    });
    setShowCatalogModal(true);
  };

  const updateStatus = async (id, newStatus, remark) => {
    setUpdatingId(id);
    try {
      const data = { status: newStatus };
      if (remark !== undefined) data.remark = remark;
      await api.patch(`/super-admin/product-requirements/${id}`, data);
      setStatus({ error: "", success: `Request marked as ${newStatus}` });
      await load();
      if (selectedReq && selectedReq.id === id) {
        setSelectedReq({ ...selectedReq, status: newStatus, remark: remark !== undefined ? remark : selectedReq.remark });
      }
    } catch (err) {
      setStatus({ error: formatApiError(err, "Failed to update status"), success: "" });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateAdminRequest = async (e) => {
    e.preventDefault();
    if (!adminRequestForm.productName.trim() || !adminRequestForm.brand.trim()) {
      setStatus({ error: "Brand and Product Name are required.", success: "" });
      return;
    }
    setSaving(true);
    try {
      await api.post("/super-admin/product-requirements", {
        salonId: adminRequestForm.salonId || null,
        productName: adminRequestForm.productName,
        brand: adminRequestForm.brand,
        category: adminRequestForm.category,
        packSize: adminRequestForm.unitPackSize,
        unitPackSize: adminRequestForm.unitPackSize,
        unitPrice: adminRequestForm.unitPrice ? parseFloat(adminRequestForm.unitPrice) : null,
        quantity: parseInt(adminRequestForm.quantity, 10) || 1,
        priority: adminRequestForm.priority,
        note: adminRequestForm.note
      });
      setStatus({ error: "", success: `Created product request for "${adminRequestForm.productName}"!` });
      setAdminRequestForm({
        salonId: "",
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
      setActiveSection("requests");
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not create request"), success: "" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-shell super-admin-page"><PageLoader title="Loading Product Requests" /></div>;

  return (
    <div className="page-shell super-admin-page">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Product Requests</h1>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
            Maintain product catalog inventory, receive salon orders, and fulfill requests.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => {
              setEditCatalogItem(null);
              setCatalogForm(emptyCatalog);
              setShowCatalogModal(true);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
              borderRadius: 8,
              background: "#0f172a",
              color: "white",
              border: "none",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer"
            }}
          >
            <Plus size={16} /> + Add Catalog Product
          </button>
        </div>
      </div>

      {status.error && (
        <div style={{ padding: "12px 16px", background: "#fef2f2", color: "#dc2626", borderRadius: 8, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{status.error}</span>
          <button onClick={() => setStatus({ ...status, error: "" })} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}>✕</button>
        </div>
      )}
      {status.success && (
        <div style={{ padding: "12px 16px", background: "#ecfdf5", color: "#065f46", borderRadius: 8, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{status.success}</span>
          <button onClick={() => setStatus({ ...status, success: "" })} style={{ background: "none", border: "none", color: "#065f46", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* 4 Sections Tabs (Point 2) */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid #e2e8f0", paddingBottom: 10 }}>
        <button
          onClick={() => setActiveSection("available")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: activeSection === "available" ? "#0f172a" : "#f1f5f9",
            color: activeSection === "available" ? "white" : "#475569",
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <Package size={16} /> 1. Available Products ({catalog.length})
        </button>

        <button
          onClick={() => setActiveSection("new_request")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: activeSection === "new_request" ? "#0f172a" : "#f1f5f9",
            color: activeSection === "new_request" ? "white" : "#475569",
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <Plus size={16} /> 2. New Request
        </button>

        <button
          onClick={() => setActiveSection("requests")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: activeSection === "requests" ? "#0f172a" : "#f1f5f9",
            color: activeSection === "requests" ? "white" : "#475569",
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <ListFilter size={16} /> 3. Salon Requests ({requirements.length})
        </button>

        {selectedReq && (
          <button
            onClick={() => setActiveSection("detail")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: activeSection === "detail" ? "#0f172a" : "#f1f5f9",
              color: activeSection === "detail" ? "white" : "#475569",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <FileText size={16} /> 4. Request Detail
          </button>
        )}
      </div>

      {/* SECTION 1: AVAILABLE PRODUCTS (Catalog List) (Points 3, 4, 5, 6) */}
      {activeSection === "available" && (
        <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          {/* Search and Filters (Point 6) */}
          <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0", marginBottom: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                  type="text"
                  placeholder="Search Product Name, Brand, Category, Pack Size..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }}
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

          {/* Product Items Table/Cards (Order: Brand -> Product Name -> Category -> Unit / Pack Size -> Availability) (Points 3, 4, 5) */}
          {filteredCatalog.length === 0 ? (
            <EmptyState title="No Products" message="No catalog products match your search/filter criteria." />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f1f5f9", background: "#f8fafc", color: "#64748b", fontWeight: 700 }}>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>1. Brand</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>2. Product Name</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>3. Category</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>4. Unit / Pack Size</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>5. Available Qty & Status</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Unit Price</th>
                    <th style={{ padding: "12px 14px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCatalog.map((item) => {
                    const isAvail = item.isActive !== false && item.availableQty > 0;
                    const statusLabel = item.isActive === false ? "Inactive" : (item.availableQty > 0 ? "Available" : "Out of Stock");
                    const statusColor = item.isActive === false ? "#64748b" : (item.availableQty > 0 ? "#16a34a" : "#dc2626");
                    const statusBg = item.isActive === false ? "#f1f5f9" : (item.availableQty > 0 ? "#ecfdf5" : "#fef2f2");

                    return (
                      <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 14px", fontWeight: 800, color: "#6366f1", textTransform: "uppercase", fontSize: "0.78rem" }}>
                          {item.brand || "—"}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.productName}</div>
                          {item.description && <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{item.description}</div>}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#475569" }}>
                          {item.category || "—"}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#1e40af", fontWeight: 600 }}>
                          {item.unitPackSize || item.packSize || "Standard"}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ background: statusBg, color: statusColor, padding: "3px 8px", borderRadius: 100, fontSize: "0.72rem", fontWeight: 700 }}>
                              {statusLabel}
                            </span>
                            <span style={{ fontWeight: 700, color: "#334155" }}>({item.availableQty || 0} in stock)</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px", fontWeight: 700, color: "#0f172a" }}>
                          {item.defaultPrice ? `₹${fmt(item.defaultPrice)}` : "—"}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            <button
                              onClick={() => openEditCatalog(item)}
                              title="Edit Product"
                              style={{ padding: 6, border: "1px solid #cbd5e1", borderRadius: 6, background: "white", color: "#475569", cursor: "pointer" }}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => deleteCatalogItem(item.id)}
                              title="Delete Product"
                              style={{ padding: 6, border: "1px solid #cbd5e1", borderRadius: 6, background: "white", color: "#ef4444", cursor: "pointer" }}
                            >
                              <Trash2 size={14} />
                            </button>
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

      {/* SECTION 2: NEW REQUEST (Point 2) */}
      {activeSection === "new_request" && (
        <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0", maxWidth: 680, margin: "0 auto" }}>
          <h3 style={{ margin: "0 0 6px", fontSize: "1.15rem", color: "#0f172a" }}>Create Salon Product Request</h3>
          <p style={{ margin: "0 0 20px", fontSize: "0.85rem", color: "#64748b" }}>
            Record an incoming product demand or special shipment on behalf of a salon.
          </p>

          <form onSubmit={handleCreateAdminRequest} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <label>
              <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Target Salon (Optional)</span>
              <CustomSelect
                value={adminRequestForm.salonId}
                onChange={e => setAdminRequestForm({ ...adminRequestForm, salonId: e.target.value })}
                style={{ width: "100%" }}
              >
                <option value="">General Stock / Unassigned</option>
                {salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </CustomSelect>
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label>
                <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Brand *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. L'Oréal Professional, Wella, Matrix"
                  value={adminRequestForm.brand}
                  onChange={e => setAdminRequestForm({ ...adminRequestForm, brand: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                />
              </label>

              <label>
                <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Product Name *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Majirel Hair Color 50ml"
                  value={adminRequestForm.productName}
                  onChange={e => setAdminRequestForm({ ...adminRequestForm, productName: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label>
                <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Category</span>
                <input
                  type="text"
                  placeholder="e.g. Hair Color, Shampoo, Spa Kit"
                  value={adminRequestForm.category}
                  onChange={e => setAdminRequestForm({ ...adminRequestForm, category: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                />
              </label>

              <label>
                <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Unit / Pack Size</span>
                <input
                  type="text"
                  placeholder="e.g. 50 ml, 100 ml, 500 ml, 1 L, Pack of 12"
                  value={adminRequestForm.unitPackSize}
                  onChange={e => setAdminRequestForm({ ...adminRequestForm, unitPackSize: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <label>
                <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Quantity *</span>
                <input
                  type="number"
                  min="1"
                  required
                  value={adminRequestForm.quantity}
                  onChange={e => setAdminRequestForm({ ...adminRequestForm, quantity: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                />
              </label>

              <label>
                <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Priority</span>
                <CustomSelect
                  value={adminRequestForm.priority}
                  onChange={e => setAdminRequestForm({ ...adminRequestForm, priority: e.target.value })}
                  style={{ width: "100%" }}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </CustomSelect>
              </label>

              <label>
                <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Unit Price (INR)</span>
                <input
                  type="number"
                  placeholder="Optional"
                  value={adminRequestForm.unitPrice}
                  onChange={e => setAdminRequestForm({ ...adminRequestForm, unitPrice: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                />
              </label>
            </div>

            <label>
              <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Internal Notes</span>
              <textarea
                rows={3}
                placeholder="Distributor vendor, discount agreement, or delivery deadline notes..."
                value={adminRequestForm.note}
                onChange={e => setAdminRequestForm({ ...adminRequestForm, note: e.target.value })}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
              />
            </label>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
              <button
                type="button"
                onClick={() => setActiveSection("requests")}
                style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid #e2e8f0", background: "white", color: "#475569", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{ padding: "10px 22px", borderRadius: 8, border: "none", background: "#0f172a", color: "white", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
              >
                {saving ? "Submitting..." : "Create Request"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 3: SALON REQUESTS (Point 2) */}
      {activeSection === "requests" && (
        <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["ALL", "NEW", "PENDING", "APPROVED", "REJECTED", "COMPLETED"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setRequestFilter(st)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "none",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: requestFilter === st ? "#0f172a" : "#f1f5f9",
                    color: requestFilter === st ? "white" : "#64748b"
                  }}
                >
                  {st === "ALL" ? `All (${requirements.length})` : `${statusConfig[st]?.label || st} (${requirements.filter(r => r.status === st).length})`}
                </button>
              ))}
            </div>

            <div style={{ width: 220 }}>
              <CustomSelect value={salonFilter} onChange={e => setSalonFilter(e.target.value)} style={{ width: "100%" }}>
                <option value="">Filter by Salon (All)</option>
                {salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </CustomSelect>
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <EmptyState title="No Requests Found" message="No salon product requests match this filter." />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f1f5f9", background: "#f8fafc", color: "#64748b", fontWeight: 700 }}>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Request ID</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Salon</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Brand & Product</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Category</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Pack Size</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Qty</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Status</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Date</th>
                    <th style={{ padding: "12px 14px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((r) => {
                    const sc = statusConfig[r.status] || statusConfig.NEW;
                    const reqIdFormatted = `#REQ-${r.id.slice(-6).toUpperCase()}`;

                    return (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 14px", fontWeight: 800, color: "#6366f1", fontSize: "0.78rem" }}>
                          {reqIdFormatted}
                        </td>
                        <td style={{ padding: "12px 14px", fontWeight: 700, color: "#0f172a" }}>
                          {r.salon?.name || "General Salon"}
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
                              onClick={() => { setSelectedReq(r); setActiveSection("detail"); }}
                              title="View & Process"
                              style={{ padding: "5px 10px", border: "1px solid #cbd5e1", borderRadius: 6, background: "#0f172a", color: "white", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                            >
                              Process
                            </button>
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

      {/* SECTION 4: REQUEST DETAIL & FULFILLMENT (Points 9 & 10) */}
      {activeSection === "detail" && selectedReq && (
        <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0", maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#6366f1", textTransform: "uppercase" }}>
                Brand: {selectedReq.brand || "—"}
              </div>
              <h3 style={{ margin: "2px 0 0", fontSize: "1.2rem", color: "#0f172a" }}>
                {selectedReq.productName}
              </h3>
              <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: 2 }}>
                Salon: <strong>{selectedReq.salon?.name || "General Salon"}</strong>
              </div>
            </div>
            <span style={{ background: statusConfig[selectedReq.status]?.bg, color: statusConfig[selectedReq.status]?.color, padding: "4px 12px", borderRadius: 100, fontSize: "0.78rem", fontWeight: 700 }}>
              {statusConfig[selectedReq.status]?.label || selectedReq.status}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, background: "#f8fafc", padding: 16, borderRadius: 10, marginBottom: 16, fontSize: "0.85rem" }}>
            <div><span style={{ color: "#64748b" }}>Category:</span> <strong>{selectedReq.category || "—"}</strong></div>
            <div><span style={{ color: "#64748b" }}>Pack Size:</span> <strong>{selectedReq.unitPackSize || selectedReq.packSize || "Standard"}</strong></div>
            <div><span style={{ color: "#64748b" }}>Quantity:</span> <strong>{selectedReq.quantity || 1}</strong></div>
            <div><span style={{ color: "#64748b" }}>Priority:</span> <strong>{selectedReq.priority}</strong></div>
            <div><span style={{ color: "#64748b" }}>Unit Price:</span> <strong>{selectedReq.unitPrice ? `₹${fmt(selectedReq.unitPrice)}` : "—"}</strong></div>
            <div><span style={{ color: "#64748b" }}>Requested On:</span> <strong>{new Date(selectedReq.createdAt).toLocaleDateString()}</strong></div>
          </div>

          {selectedReq.note && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Note from Salon</div>
              <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, fontSize: "0.85rem", color: "#334155", borderLeft: "3px solid #6366f1" }}>
                {selectedReq.note}
              </div>
            </div>
          )}

          {/* Internal Admin Remarks with Live Update (Points 9 & 10) */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Internal Admin Remarks</span>
              <button
                type="button"
                onClick={() => {
                  const rem = window.prompt("Update admin internal remarks:", selectedReq.remark || "");
                  if (rem !== null) updateStatus(selectedReq.id, selectedReq.status, rem);
                }}
                style={{ background: "none", border: "none", color: "#4f46e5", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
              >
                + Edit Note / Remark
              </button>
            </div>
            <div style={{ background: "#f0fdf4", padding: 12, borderRadius: 8, fontSize: "0.85rem", color: "#166534", borderLeft: "3px solid #10b981" }}>
              {selectedReq.remark || "No internal admin remarks recorded yet."}
            </div>
          </div>

          {/* Fulfillment Status Actions (Approve, Reject, Add Note, Mark Completed) */}
          <div style={{ background: "#f1f5f9", padding: 16, borderRadius: 10, marginBottom: 20 }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: 10 }}>Actions on Request</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                disabled={updatingId === selectedReq.id}
                onClick={() => updateStatus(selectedReq.id, "APPROVED")}
                style={{ padding: "8px 14px", borderRadius: 6, border: "none", background: "#10b981", color: "white", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}
              >
                ✓ Approve
              </button>
              <button
                disabled={updatingId === selectedReq.id}
                onClick={() => updateStatus(selectedReq.id, "COMPLETED")}
                style={{ padding: "8px 14px", borderRadius: 6, border: "none", background: "#166534", color: "white", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}
              >
                ★ Mark Completed
              </button>
              <button
                disabled={updatingId === selectedReq.id}
                onClick={() => {
                  const reason = window.prompt("Reason for rejection:");
                  if (reason !== null) updateStatus(selectedReq.id, "REJECTED", reason);
                }}
                style={{ padding: "8px 14px", borderRadius: 6, border: "none", background: "#ef4444", color: "white", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}
              >
                ✕ Reject
              </button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => setActiveSection("requests")}
              style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #cbd5e1", background: "white", color: "#475569", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
            >
              Back to Requests List
            </button>
          </div>
        </div>
      )}

      {/* Catalog Product Add/Edit Modal */}
      {showCatalogModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "white", width: "100%", maxWidth: 520, borderRadius: 16, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid #eee", paddingBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                {editCatalogItem ? "Edit Catalog Product" : "Add New Catalog Product"}
              </h2>
              <button onClick={() => setShowCatalogModal(false)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8" }}>✕</button>
            </div>

            <form onSubmit={saveCatalogItem} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label>
                  <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Brand *</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. L'Oréal Professional, Wella"
                    value={catalogForm.brand}
                    onChange={e => setCatalogForm({ ...catalogForm, brand: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                  />
                </label>

                <label>
                  <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Product Name *</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Majirel Hair Color 50ml"
                    value={catalogForm.productName}
                    onChange={e => setCatalogForm({ ...catalogForm, productName: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                  />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label>
                  <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Category</span>
                  <input
                    type="text"
                    placeholder="e.g. Hair Color, Hair Care"
                    value={catalogForm.category}
                    onChange={e => setCatalogForm({ ...catalogForm, category: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                  />
                </label>

                <label>
                  <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Unit / Pack Size</span>
                  <input
                    type="text"
                    placeholder="e.g. 50 ml, 100 ml, 500 ml, 1 L, Pack of 12"
                    value={catalogForm.unitPackSize}
                    onChange={e => setCatalogForm({ ...catalogForm, unitPackSize: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                  />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label>
                  <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Available Quantity</span>
                  <input
                    type="number"
                    min="0"
                    value={catalogForm.availableQty}
                    onChange={e => setCatalogForm({ ...catalogForm, availableQty: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                  />
                </label>

                <label>
                  <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Unit Price (INR)</span>
                  <input
                    type="number"
                    placeholder="Price in INR"
                    value={catalogForm.defaultPrice}
                    onChange={e => setCatalogForm({ ...catalogForm, defaultPrice: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                  />
                </label>
              </div>

              <label>
                <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: 4, color: "#334155" }}>Notes & Specifications</span>
                <textarea
                  rows={2}
                  placeholder="Distributor source, shade varieties, batch info..."
                  value={catalogForm.notes}
                  onChange={e => setCatalogForm({ ...catalogForm, notes: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                />
              </label>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowCatalogModal(false)}
                  style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid #e2e8f0", background: "white", color: "#475569", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: "10px 22px", borderRadius: 8, border: "none", background: "#0f172a", color: "white", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  {saving ? "Saving..." : (editCatalogItem ? "Update Product" : "Add to Catalog")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
